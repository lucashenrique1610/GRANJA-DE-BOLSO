import { authenticateRequest } from '../../server/auth.js';
import { withObservability } from '../../server/observability.js';
import { defaultCache } from '../../server/cache.js';
import { handleOpenMeteoProxy } from '../../server/open-meteo-proxy.js';

export default withObservability(async function handler(req, res, ctx) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  const authResult = await authenticateRequest(req.headers);
  if ('status' in authResult) {
    ctx.logger.info('auth.rejected', { status: authResult.status, path: req.url });
    res.status(authResult.status).json(authResult.payload);
    return;
  }

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  const requestUrl = `${protocol}://${host}${req.url || '/api/weather/open-meteo'}`;
  const { status, payload } = await handleOpenMeteoProxy(requestUrl);

  res.setHeader('Cache-Control', 'private, max-age=0, s-maxage=180, stale-while-revalidate=300');
  res.status(status).json(payload);
});