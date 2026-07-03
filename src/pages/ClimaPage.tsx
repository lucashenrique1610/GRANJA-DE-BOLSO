import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin,
  Wind,
  Droplets,
  Sun,
  Moon,
  Thermometer,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  ChevronRight,
  RefreshCw,
  Gauge,
  Eye,
  Umbrella,
  Compass
} from 'lucide-react';
import type { SystemSettingsData, UnifiedWeatherData } from '@/types';
import { getWeatherData, reverseGeocode } from '@/lib/weather';

const WeatherIcon = ({ code, size = 24, className = '' }: { code: number; size?: number; className?: string }) => {
  if (code >= 95) return <CloudLightning size={size} className={className} />;
  if (code >= 71 && code <= 77) return <CloudSnow size={size} className={className} />;
  if (code >= 51 && code <= 67) return <CloudRain size={size} className={className} />;
  if (code >= 45) return <CloudFog size={size} className={className} />;
  if (code >= 1) return <Cloud size={size} className={className} />;
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 18;
  return isNight ? <Moon size={size} className={className} /> : <Sun size={size} className={className} />;
};

const getWindDirection = (deg: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
};

export default function ClimaPage({ settings }: { settings: SystemSettingsData }) {
  const weatherConfig = useMemo(() => {
    return {
      ...settings.weather,
      display: {
        currentTemp: true,
        feelsLike: true,
        humidity: true,
        windSpeed: true,
        condition: true,
        dailyForecast: true,
        uvIndex: true,
        precipitation: true,
        pressure: true,
        visibility: true,
        ...settings.weather?.display,
      },
      recentLocations: settings.weather?.recentLocations || [],
    };
  }, [settings]);

  const [weatherData, setWeatherData] = useState<UnifiedWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [alerts, setAlerts] = useState<{ type: 'calor' | 'frio' | 'vento'; message: string; level: 'alta' }[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem('climaLocal');
    if (cached) {
      try {
        setWeatherData(JSON.parse(cached));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if ('BroadcastChannel' in window && weatherData) {
      const channel = new BroadcastChannel('clima-sync');
      channel.postMessage({ type: 'WEATHER_UPDATE', data: weatherData });
      return () => channel.close();
    }
  }, [weatherData]);

  useEffect(() => {
    setNotificationsEnabled('Notification' in window && Notification.permission === 'granted');
  }, []);

  const checkAlerts = useCallback((data: UnifiedWeatherData) => {
    const newAlerts: typeof alerts = [];
    if (data.temperature >= 30) {
      newAlerts.push({ type: 'calor', message: 'Risco de mortalidade! Ative a ventilação imediatamente.', level: 'alta' });
    }
    if (data.temperature <= 15) {
      newAlerts.push({ type: 'frio', message: 'Risco de amontoamento! Verifique o aquecimento.', level: 'alta' });
    }
    if (data.windSpeed >= 20) {
      newAlerts.push({ type: 'vento', message: 'Vento forte! Proteja as cortinas.', level: 'alta' });
    }
    setAlerts(newAlerts);
    if (notificationsEnabled && newAlerts.length > 0) {
      newAlerts.forEach((a) => new Notification(`Alerta de ${a.type}!`, { body: a.message }));
    }
  }, [notificationsEnabled]);

  const fetchAndSet = useCallback(
    async (lat: number, lon: number, locName: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getWeatherData(lat, lon, locName);
        setWeatherData(data);
        localStorage.setItem('climaLocal', JSON.stringify(data));
        checkAlerts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    },
    [checkAlerts]
  );

  const loadWeather = useCallback(async () => {
    if (weatherConfig.defaultCity) {
      fetchAndSet(weatherConfig.defaultCity.lat, weatherConfig.defaultCity.lon, weatherConfig.defaultCity.name);
    } else if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const cityName = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          fetchAndSet(pos.coords.latitude, pos.coords.longitude, cityName || 'Sua Localização');
        },
        (geoErr) => {
          let msg = 'Não foi possível obter sua localização';
          if (geoErr.code === 1) msg = 'Você negou permissão para acessar sua localização';
          if (geoErr.code === 2) msg = 'Informações de localização indisponíveis';
          if (geoErr.code === 3) msg = 'Tempo esgotado ao tentar obter a localização';
          setError(msg);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError('Geolocalização não é suportada por este navegador');
    }
  }, [weatherConfig, fetchAndSet]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const getBg = () => {
    if (!weatherData) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;
    if (weatherData.temperature >= 30) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    if (weatherData.temperature <= 15) return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    return isNight ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)';
  };

  const metrics = useMemo(() => {
    const result = [];
    if (weatherConfig.display.humidity) {
      result.push({ icon: Droplets, val: `${weatherData?.humidity ?? 0}%`, label: 'Umidade', color: 'text-blue-500' });
    }
    if (weatherConfig.display.windSpeed) {
      result.push({ icon: Wind, val: `${Math.round(weatherData?.windSpeed ?? 0)} km/h`, label: 'Vento', color: 'text-green-500' });
    }
    if (weatherConfig.display.uvIndex) {
      result.push({ icon: Sun, val: `${weatherData?.uvIndex ?? 0}`, label: 'UV', color: 'text-orange-500' });
    }
    if (weatherConfig.display.precipitation) {
      result.push({ icon: Umbrella, val: `${weatherData?.precipitation ?? 0} mm`, label: 'Precipitação', color: 'text-cyan-500' });
    }
    if (weatherConfig.display.pressure) {
      result.push({ icon: Gauge, val: `${Math.round(weatherData?.pressure ?? 0)} hPa`, label: 'Pressão', color: 'text-purple-500' });
    }
    if (weatherConfig.display.visibility) {
      result.push({ icon: Eye, val: `${weatherData?.visibility ?? 0} km`, label: 'Visibilidade', color: 'text-indigo-500' });
    }
    return result;
  }, [weatherConfig, weatherData]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: getBg() }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Monitoramento Climático</h1>
          <p className="text-white/80 text-sm sm:text-base mt-1">Sistema inteligente para sua granja</p>
        </div>

        <div className="app-section-card bg-white/95 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-4 sm:p-6 transition-transform hover:-translate-y-1">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <button
              onClick={loadWeather}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl border border-blue-200 transition-all active:bg-blue-200 disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>

            <button
              onClick={async () => {
                if ('Notification' in window) {
                  const perm = await Notification.requestPermission();
                  setNotificationsEnabled(perm === 'granted');
                }
              }}
              className={`flex items-center gap-2 px-4 py-3 font-semibold rounded-xl border transition-all ${
                notificationsEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
              }`}
            >
              {notificationsEnabled ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              {notificationsEnabled ? 'Notificações Ativas' : 'Ativar Alertas'}
            </button>
          </div>
        </div>

        {error && weatherData === null && (
          <div className="app-section-card bg-red-50 border border-red-100 shadow-xl rounded-3xl p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle size={40} className="text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-800">Ocorreu um problema</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((a, idx) => (
              <div key={idx} className="app-section-card bg-red-50 border-l-4 border-red-600 rounded-3xl shadow-xl p-4 sm:p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <AlertTriangle size={40} className="text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-extrabold text-red-900 uppercase tracking-wide">
                      {a.type === 'calor' ? 'Alerta Calor Extremo' : a.type === 'frio' ? 'Alerta Frio' : 'Alerta Vento Forte'}
                    </h3>
                    <p className="text-red-700 mt-1">{a.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && !weatherData && (
          <div className="app-section-card bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 flex items-center justify-center">
            <Loader2 size={48} className="text-blue-600 animate-spin" />
          </div>
        )}

        {weatherData && (
          <>
            <div className="app-section-card bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl p-6 sm:p-8 transition-transform hover:-translate-y-1">
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin size={20} />
                    <span className="font-semibold text-lg">{weatherData.location}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <WeatherIcon code={weatherData.weatherCode} size={64} className="text-blue-500" />
                    <div>
                      {weatherConfig.display.currentTemp && (
                        <h2 className="text-5xl sm:text-6xl font-extrabold text-gray-800 tracking-tight">
                          {Math.round(weatherData.temperature)}°
                        </h2>
                      )}
                      {weatherConfig.display.condition && (
                        <p className="text-xl text-gray-600 mt-1 font-medium">{weatherData.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-4">
                        {weatherConfig.display.feelsLike && (
                          <div className="text-center">
                            <p className="text-xs uppercase tracking-wider text-gray-500">Sensação</p>
                            <p className="text-2xl font-bold text-gray-700">{Math.round(weatherData.feelsLike)}°</p>
                          </div>
                        )}
                        {weatherConfig.display.currentTemp && (
                          <>
                            <div className="text-center">
                              <p className="text-xs uppercase tracking-wider text-gray-500">Máxima</p>
                              <p className="text-2xl font-bold text-orange-600">{Math.round(weatherData.temperatureMax)}°</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs uppercase tracking-wider text-gray-500">Mínima</p>
                              <p className="text-2xl font-bold text-blue-600">{Math.round(weatherData.temperatureMin)}°</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1 w-full lg:w-auto">
                  {metrics.map((m, i) => (
                    <div key={i} className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                      <m.icon size={32} className={`mb-2 ${m.color}`} />
                      <p className="text-2xl font-bold text-gray-800">{m.val}</p>
                      <p className="text-xs uppercase tracking-wider text-gray-500 mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="app-section-card bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl p-6 sm:p-8 transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Thermometer size={24} className="text-blue-600" />
                  Próximas 12 Horas
                </h3>
              </div>
              <div className="flex overflow-x-auto pb-2 gap-4 snap-x snap-mandatory">
                {weatherData.forecast12h.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 min-w-[90px] sm:min-w-[100px] p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 hover:shadow-md transition-all snap-start">
                    <p className="text-sm font-semibold text-gray-600">{item.time}</p>
                    <WeatherIcon code={item.weatherCode} size={32} className="text-blue-600" />
                    <p className="text-xl font-bold text-gray-800">{Math.round(item.temperature)}°</p>
                  </div>
                ))}
              </div>
            </div>

            {weatherConfig.display.dailyForecast && (
              <div className="app-section-card bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl p-6 sm:p-8 transition-transform hover:-translate-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Próximos 5 Dias</h3>
                <div className="space-y-3">
                  {weatherData.forecast5d.map((day, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-gray-700 min-w-[60px]">{i === 0 ? 'Hoje' : day.dayName}</p>
                        <WeatherIcon code={day.weatherCode} size={28} className="text-blue-600" />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-blue-700 min-w-[40px] text-right">{Math.round(day.tempMin)}°</span>
                        <div className="w-24 sm:w-32 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full opacity-20" />
                        <span className="text-sm font-bold text-orange-700 min-w-[40px]">{Math.round(day.tempMax)}°</span>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
