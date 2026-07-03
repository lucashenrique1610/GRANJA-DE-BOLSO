import { authenticateRequest } from '../../server/auth.js';
import { handleOpenWeatherProxy } from '../../server/openweather-proxy.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  const authResult = await authenticateRequest(req.headers);
  if ('status' in authResult) {
    res.status(authResult.status).json(authResult.payload);
    return;
  }

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  const requestUrl = `${protocol}://${host}${req.url || '/api/weather/openweather'}`;
  const { status, payload } = await handleOpenWeatherProxy(requestUrl);

  res.setHeader('Cache-Control', 'private, max-age=0, s-maxage=300, stale-while-revalidate=600');
  res.status(status).json(payload);
}
