const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

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

export async function handleOpenMeteoProxy(
  requestUrl,
  { fetchImpl = fetch } = {},
) {
  const url = new URL(requestUrl, 'http://localhost');

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
  const upstreamUrl = new URL(OPEN_METEO_BASE_URL);
  upstreamUrl.searchParams.set('latitude', String(lat));
  upstreamUrl.searchParams.set('longitude', String(lon));
  upstreamUrl.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,uv_index,precipitation,cloud_cover'
  );
  upstreamUrl.searchParams.set('hourly', 'temperature_2m,weather_code');
  upstreamUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset');
  upstreamUrl.searchParams.set('timezone', 'auto');
  upstreamUrl.searchParams.set('forecast_days', '5');

  try {
    const response = await fetchImpl(upstreamUrl.toString());
    if (!response.ok) {
      return jsonResult(502, {
        error: `Open-Meteo retornou HTTP ${response.status}.`,
      });
    }

    const data = await response.json();
    return jsonResult(200, {
      data,
      locationName,
    });
  } catch {
    return jsonResult(502, {
      error: 'Falha ao consultar Open-Meteo pelo servidor.',
    });
  }
}
