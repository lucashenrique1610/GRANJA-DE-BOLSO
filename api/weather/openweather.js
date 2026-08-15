import { authenticateRequest } from '../../server/auth.js';
import { withObservability } from '../../server/observability.js';
import { defaultCache } from '../../server/cache.js';
import { handleOpenWeatherProxy } from '../../server/openweather-proxy.js';

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
  const requestUrl = `${protocol}://${host}${req.url || '/api/weather/openweather'}`;

  let cacheKey = null;
  try {
    const url = new URL(requestUrl);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    if (lat && lon) {
      cacheKey = `openweather:${Number(lat).toFixed(3)}:${Number(lon).toFixed(3)}`;
    }
  } catch {
    cacheKey = null;
  }

  const cached = cacheKey ? defaultCache.get(cacheKey) : null;
  if (cached) {
    res.setHeader('X-Cache-Status', 'HIT');
    res.setHeader('Cache-Control', 'private, max-age=0, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json(cached);
    return;
  }

  const { status, payload } = await handleOpenWeatherProxy(requestUrl);
  if (cacheKey && status === 200) {
    defaultCache.set(cacheKey, payload);
    res.setHeader('X-Cache-Status', 'MISS');
    ctx.info('weather.cache.miss', { cacheKey });
  }

  res.setHeader('Cache-Control', 'private, max-age=0, s-maxage=300, stale-while-revalidate=600');
  res.status(status).json(payload);
});