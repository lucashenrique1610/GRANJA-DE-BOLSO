/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase';
import type { UnifiedWeatherData } from '@/types';

// --- Types Internos ---

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  surface_pressure: number;
  weather_code: number;
  uv_index: number;
  precipitation: number;
  cloud_cover: number;
}

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  weather_code: number[];
}

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
  hourly: OpenMeteoHourly;
  timezone: string;
}

interface OpenWeatherMain {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
}

interface OpenWeatherWind {
  speed: number;
  deg?: number;
}

interface OpenWeatherClouds {
  all?: number;
}

interface OpenWeatherSys {
  sunrise: number;
  sunset: number;
}

interface OpenWeatherWeather {
  main: string;
  description: string;
  id: number;
}

interface OpenWeatherResponse {
  main: OpenWeatherMain;
  wind: OpenWeatherWind;
  sys: OpenWeatherSys;
  weather: OpenWeatherWeather[];
  visibility: number;
  name: string;
  clouds?: OpenWeatherClouds;
}

interface OpenWeatherForecastItem {
  dt_txt: string;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    id: number;
  }>;
}

interface OpenWeatherForecastResponse {
  list: OpenWeatherForecastItem[];
}

interface OpenWeatherProxyResponse {
  currentData: OpenWeatherResponse;
  forecastData: OpenWeatherForecastResponse;
  locationName?: string;
  error?: string;
}

// --- Helpers: Weather Code Mappings ---

function getOpenMeteoDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Céu limpo',
    1: 'Principalmente limpo',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Névoa',
    48: 'Névoa de geada',
    51: 'Chuvisco leve',
    53: 'Chuvisco moderado',
    55: 'Chuvisco intenso',
    56: 'Chuvisco congelante leve',
    57: 'Chuvisco congelante intenso',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva intensa',
    66: 'Chuva congelante leve',
    67: 'Chuva congelante intensa',
    71: 'Neve leve',
    73: 'Neve moderada',
    75: 'Neve intensa',
    77: 'Grãos de neve',
    80: 'Chuva fraca',
    81: 'Chuva moderada',
    82: 'Chuva violenta',
    85: 'Neve fraca',
    86: 'Neve intensa',
    95: 'Tempestade',
    96: 'Tempestade com granizo leve',
    99: 'Tempestade com granizo intenso'
  };
  return descriptions[code] || 'Desconhecido';
}

// Helper to map weather codes to unified codes (0-99 compatible with Open-Meteo)
function mapOpenWeatherCodeToMeteo(id: number): number {
  if (id >= 200 && id < 300) return 95; // Thunderstorms
  if (id >= 300 && id < 400) return 51; // Drizzle
  if (id >= 500 && id < 600) return 61; // Rain
  if (id >= 600 && id < 700) return 71; // Snow
  if (id >= 700 && id < 800) return 45; // Fog
  if (id === 800) return 0; // Clear
  if (id === 801) return 1;
  if (id === 802) return 2;
  if (id === 803 || id === 804) return 3;
  return 0;
}

// Helper to get day names in Portuguese
function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return dayNames[date.getDay()];
}

// --- Fetch Functions ---

async function fetchFromOpenMeteo(
  lat: number,
  lon: number,
  locationName: string
): Promise<UnifiedWeatherData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,uv_index,precipitation,cloud_cover&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`,
    { signal: controller.signal }
  );

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Open-Meteo: HTTP Error ${response.status}`);
  }

  const data: OpenMeteoResponse = await response.json();

  // Process 12h forecast
  const now = new Date();
  const forecast12h = data.hourly.time
    .map((time, index) => ({
      time: new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      temperature: data.hourly.temperature_2m[index],
      weatherCode: data.hourly.weather_code[index],
    }))
    .filter((_, index) => {
      const forecastTime = new Date(data.hourly.time[index]);
      return forecastTime > now;
    })
    .slice(0, 12);

  // Process 5-day forecast
  const forecast5d = data.daily.time.map((dateStr, index) => ({
    date: dateStr,
    dayName: getDayName(dateStr),
    tempMin: data.daily.temperature_2m_min[index],
    tempMax: data.daily.temperature_2m_max[index],
    weatherCode: data.daily.weather_code[index],
  }));

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    temperatureMax: data.daily.temperature_2m_max[0],
    temperatureMin: data.daily.temperature_2m_min[0],
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    pressure: data.current.surface_pressure,
    visibility: 10,
    sunrise: new Date(data.daily.sunrise[0]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    sunset: new Date(data.daily.sunset[0]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    description: getOpenMeteoDescription(data.current.weather_code),
    weatherCode: data.current.weather_code,
    uvIndex: data.current.uv_index,
    precipitation: data.current.precipitation,
    cloudCover: data.current.cloud_cover,
    forecast12h,
    forecast5d,
    location: locationName,
    lastUpdated: new Date().toISOString(),
    source: 'open-meteo'
  };
}

async function fetchFromOpenWeatherProxy(
  lat: number,
  lon: number,
  locationName: string
): Promise<UnifiedWeatherData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const endpoint = new URL('/api/weather/openweather', window.location.origin);
  endpoint.searchParams.set('lat', String(lat));
  endpoint.searchParams.set('lon', String(lon));
  endpoint.searchParams.set('locationName', locationName);

  const session = supabase ? await supabase.auth.getSession() : null;
  const accessToken = session?.data.session?.access_token;

  const response = await fetch(endpoint.toString(), {
    signal: controller.signal,
    credentials: 'same-origin',
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  clearTimeout(timeoutId);

  const payload = (await response.json()) as OpenWeatherProxyResponse;
  if (!response.ok) {
    throw new Error(payload.error || `OpenWeather proxy: HTTP Error ${response.status}`);
  }

  const { currentData, forecastData, locationName: serverLocationName } = payload;

  // 12h forecast
  const forecast12h = forecastData.list
    .filter((item) => new Date(item.dt_txt) > new Date())
    .slice(0, 4) // 4 intervals of 3h = 12h
    .map((item) => ({
      time: new Date(item.dt_txt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      temperature: item.main.temp,
      weatherCode: mapOpenWeatherCodeToMeteo(item.weather[0].id),
    }));

  // 5-day forecast
  const dailyMap: Record<string, { min: number; max: number; code: number }> = {};
  forecastData.list.forEach((item: any) => {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { min: Infinity, max: -Infinity, code: item.weather[0].id };
    }
    dailyMap[date].min = Math.min(dailyMap[date].min, item.main.temp_min);
    dailyMap[date].max = Math.max(dailyMap[date].max, item.main.temp_max);
  });

  const forecast5d = Object.keys(dailyMap)
    .slice(0, 5)
    .map((date) => ({
      date,
      dayName: getDayName(date),
      tempMin: Math.round(dailyMap[date].min),
      tempMax: Math.round(dailyMap[date].max),
      weatherCode: mapOpenWeatherCodeToMeteo(dailyMap[date].code),
    }));

  return {
    temperature: currentData.main.temp,
    feelsLike: currentData.main.feels_like,
    temperatureMax: currentData.main.temp_max,
    temperatureMin: currentData.main.temp_min,
    humidity: currentData.main.humidity,
    windSpeed: currentData.wind.speed * 3.6,
    windDirection: currentData.wind.deg || 0,
    pressure: currentData.main.pressure,
    visibility: currentData.visibility / 1000,
    sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    description: currentData.weather[0].description,
    weatherCode: mapOpenWeatherCodeToMeteo(currentData.weather[0].id),
    uvIndex: 0,
    precipitation: 0,
    cloudCover: currentData.clouds?.all || 0,
    forecast12h,
    forecast5d,
    location: serverLocationName || locationName || currentData.name,
    lastUpdated: new Date().toISOString(),
    source: 'openweather'
  };
}

// --- Main Service ---

export async function getWeatherData(
  lat: number,
  lon: number,
  locationName: string
): Promise<UnifiedWeatherData> {
  try {
    return await fetchFromOpenMeteo(lat, lon, locationName);
  } catch (primaryErr) {
    console.warn('[WeatherService] Open-Meteo failed, trying secure OpenWeather fallback');
    try {
      return await fetchFromOpenWeatherProxy(lat, lon, locationName);
    } catch {
      throw new Error('Ambas fontes de dados meteorológicas falharam');
    }
  }
}

export async function searchCity(cityName: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: `${data.results[0].name}, ${data.results[0].country}`
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Reverse geocoding: get city name from coordinates
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data) {
      const city = data.city || data.locality;
      const state = data.principalSubdivision;
      const country = data.countryName;
      if (city && state) return `${city}, ${state}, ${country}`;
      if (city) return `${city}, ${country}`;
      return country || null;
    }
    return null;
  } catch {
    return null;
  }
}
