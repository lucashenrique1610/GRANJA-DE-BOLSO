import { readFileSync } from 'node:fs';
import { Logger, snapshotResources, withObservability } from '../server/observability.js';
import { defaultCache } from '../server/cache.js';
import { evaluateAnomalies, ALERT_THRESHOLDS } from '../server/alert-config.js';
import { getSupabaseUrl } from '../server/billing-store.js';

function readCliVersion() {
  try {
    const raw = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
    return JSON.parse(raw).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function checkSupabaseAuthHealth(logger) {
  const url = getSupabaseUrl();
  if (!url) {
    return { status: 'degraded', detail: 'SUPABASE_URL nao configurado' };
  }
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const startedAt = Date.now();
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      signal: AbortSignal.timeout(5000),
      headers: anonKey
        ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
        : {},
    });
    return {
      status: response.ok ? 'ok' : 'degraded',
      httpStatus: response.status,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    logger.error('health.auth.failed', error);
    return { status: 'down', detail: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - startedAt };
  }
}

async function checkDatabaseHealth(logger) {
  const { getSupabaseAdminClient } = await import('../server/billing-store.js');
  const client = getSupabaseAdminClient();
  if (!client) {
    return { status: 'degraded', detail: 'service role nao configurado' };
  }
  const startedAt = Date.now();
  try {
    const { error } = await client.from('users').select('id').limit(1);
    return {
      status: error ? 'degraded' : 'ok',
      error: error?.message || null,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    logger.error('health.db.failed', error);
    return { status: 'down', detail: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - startedAt };
  }
}

export default withObservability(async function healthHandler(req, res, ctx) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  const [authCheck, dbCheck] = await Promise.all([
    checkSupabaseAuthHealth(ctx.logger),
    checkDatabaseHealth(ctx.logger),
  ]);

  const resources = snapshotResources();
  const cacheSnapshot = defaultCache.snapshot();
  const heapPercent = resources.memory.heapTotalBytes > 0
    ? Number(((resources.memory.heapUsedBytes / resources.memory.heapTotalBytes) * 100).toFixed(1))
    : null;

  const anomalies = evaluateAnomalies({
    durationMs: Date.now() - ctx.startedAt,
    cacheHitRate: cacheSnapshot.hitRate,
    heapUsedBytes: resources.memory.heapUsedBytes,
    heapTotalBytes: resources.memory.heapTotalBytes,
  });
  for (const anomaly of anomalies) {
    ctx.logger.alert('anomaly.detected', anomaly);
  }

  const checks = { auth: authCheck, db: dbCheck, cache: cacheSnapshot };
  const status = authCheck.status === 'ok' && dbCheck.status === 'ok' ? 'ok' : 'degraded';

  const payload = {
    status,
    service: 'granja-de-bolso-api',
    version: readCliVersion(),
    requestId: ctx.requestId,
    timestamp: new Date().toISOString(),
    thresholds: ALERT_THRESHOLDS,
    anomalies,
    checks,
    resources,
    memoryHeapPercent: heapPercent,
  };

  ctx.logger.info('health.check', { status, checks });
  res.status(status === 'ok' ? 200 : 503).json(payload);
});