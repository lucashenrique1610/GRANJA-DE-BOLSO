/**
 * Verificador pos-deploy (regra 10: monitoramento e rollback automatico).
 * Uso: node --env-file=.env scripts/post-deploy-check.mjs [url-opcional]
 * Sem argumento, usa APP_BASE_URL do ambiente.
 * Saida nao-zero indica deploy ruim -> CI bloqueia/aciona rollback.
 */
const baseUrl = (process.argv[2] || process.env.APP_BASE_URL || '').replace(/\/+$/, '');
if (!baseUrl) {
  console.error('Informe a URL (argumento ou APP_BASE_URL).');
  process.exit(1);
}

const results = [];
const checks = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
}

async function run() {
  const timeoutMs = 15000;
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`, { signal });
    const health = await healthResponse.json();
    record('health.http.status', healthResponse.status === 200, `HTTP ${healthResponse.status}`);
    record('health.status_ok', health.status === 'ok', `status=${health.status}`);
    record('health.request_id', Boolean(health.requestId), `requestId=${health.requestId ?? 'AUSENTE'}`);
    record('health.db_ok', health.checks?.db?.status === 'ok', `db=${health.checks?.db?.status}`);
    record('health.auth_ok', health.checks?.auth?.status === 'ok', `auth=${health.checks?.auth?.status}`);
    record('health.metrics_present', Boolean(health.resources?.memory && health.resources?.cpu), 'memory/cpu presentes');
  } catch (error) {
    record('health.reachability', false, error instanceof Error ? error.message : String(error));
  }

  try {
    const home = await fetch(baseUrl, { signal });
    const hsts = home.headers.get('strict-transport-security');
    const csp = home.headers.get('content-security-policy');
    const xfo = home.headers.get('x-frame-options');
    const nosniff = home.headers.get('x-content-type-options');
    record('home.hsts', Boolean(hsts), hsts || 'AUSENTE');
    record('home.csp_has_upgrade', Boolean(csp?.includes('upgrade-insecure-requests')), csp ? 'CSP presente' : 'AUSENTE');
    record('home.x_frame_options', xfo === 'SAMEORIGIN', xfo || 'AUSENTE');
    record('home.nosniff', Boolean(nosniff), nosniff || 'AUSENTE');
  } catch (error) {
    record('home.reachability', false, error instanceof Error ? error.message : String(error));
  }

  try {
    const httpUrl = baseUrl.replace(/^https:\/\//, 'http://');
    const redirect = await fetch(httpUrl, { signal, redirect: 'manual' });
    const location = redirect.headers.get('location') || '';
    record(
      'http_to_https_redirect',
      redirect.status === 301 || redirect.status === 308 || location.startsWith('https://'),
      `HTTP ${redirect.status} -> ${location || '(sem Location)'}`,
    );
  } catch (error) {
    record('http_to_https_redirect', false, error instanceof Error ? error.message : String(error));
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\nDEPLOY CHECK FALHOU: ${failed.length}/${results.length} verificacoes ruins.`);
    process.exit(1);
  }
  console.log(`\nDEPLOY CHECK OK: ${results.length}/${results.length} verificacoes aprovadas.`);
}

run().catch((error) => {
  console.error('Falha ao executar verificacao:', error);
  process.exit(1);
});