const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

function jsonResult(status, payload) {
  return { status, payload };
}

function parseCoordinate(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Parametro invalido: ${label}`);
  }
  return parsed;
}

export async function handleOpenWeatherProxy(
  requestUrl,
  { apiKey = process.env.OPENWEATHER_API_KEY, fetchImpl = fetch } = {},
) {
  const url = new URL(requestUrl, 'http://localhost');

  if (!apiKey) {
    return jsonResult(503, {
      error: 'Fallback OpenWeather indisponivel. Configure OPENWEATHER_API_KEY no servidor.',
    });
  }

  let lat;
  let lon;

  try {
    lat = parseCoordinate(url.searchParams.get('lat'), 'lat');
    lon = parseCoordinate(url.searchParams.get('lon'), 'lon');
  } catch (error) {
    return jsonResult(400, {
      error: error instanceof Error ? error.message : 'Parametros invalidos.',
    });
  }

  const locationName = (url.searchParams.get('locationName') || '').trim();

  const currentUrl = new URL(`${OPENWEATHER_BASE_URL}/weather`);
  currentUrl.searchParams.set('lat', String(lat));
  currentUrl.searchParams.set('lon', String(lon));
  currentUrl.searchParams.set('appid', apiKey);
  currentUrl.searchParams.set('units', 'metric');
  currentUrl.searchParams.set('lang', 'pt_br');

  const forecastUrl = new URL(`${OPENWEATHER_BASE_URL}/forecast`);
  forecastUrl.searchParams.set('lat', String(lat));
  forecastUrl.searchParams.set('lon', String(lon));
  forecastUrl.searchParams.set('appid', apiKey);
  forecastUrl.searchParams.set('units', 'metric');
  forecastUrl.searchParams.set('cnt', '40');

  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetchImpl(currentUrl.toString()),
      fetchImpl(forecastUrl.toString()),
    ]);

    if (!currentResponse.ok) {
      return jsonResult(502, {
        error: `OpenWeather atual retornou HTTP ${currentResponse.status}.`,
      });
    }

    if (!forecastResponse.ok) {
      return jsonResult(502, {
        error: `OpenWeather previsao retornou HTTP ${forecastResponse.status}.`,
      });
    }

    const [currentData, forecastData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json(),
    ]);

    return jsonResult(200, {
      currentData,
      forecastData,
      locationName,
    });
  } catch {
    return jsonResult(502, {
      error: 'Falha ao consultar OpenWeather de forma segura.',
    });
  }
}
