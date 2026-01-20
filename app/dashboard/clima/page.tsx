"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { GeoService } from "@/services/geo-service"
import { useConfig } from "@/contexts/config-context"
import Image from "next/image"
import { WeatherImpact } from "@/components/weather-impact"
import { WeatherCharts } from "@/components/weather-charts"
import { WeatherSkeleton } from "@/components/weather-skeleton"
import { Bell, BellOff } from "lucide-react"

type HourItem = { time: string; icon?: string; temp: number }
type OWCurrent = {
  name?: string
  sys?: { country?: string; sunrise?: number; sunset?: number }
  main?: { temp?: number; temp_max?: number; temp_min?: number; humidity?: number; feels_like?: number; pressure?: number }
  wind?: { speed?: number }
  visibility?: number
  weather?: Array<{ description?: string; icon?: string; main?: string }>
  timezone?: number
}
type OWForecastListItem = { dt?: number; dt_txt?: string; main?: { temp?: number }; weather?: Array<{ icon?: string }> }
type OWForecast = { list?: OWForecastListItem[] }

export default function ClimaPage() {
  const { config } = useConfig()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const bcRef = useRef<BroadcastChannel | null>(null)

  const [cityInput, setCityInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cityName, setCityName] = useState("")
  const [country, setCountry] = useState("")
  const [temp, setTemp] = useState<number | null>(null)
  const [description, setDescription] = useState("")
  const [tempMax, setTempMax] = useState<number | null>(null)
  const [tempMin, setTempMin] = useState<number | null>(null)
  const [humidity, setHumidity] = useState<number | null>(null)
  const [feelsLike, setFeelsLike] = useState<number | null>(null)
  const [windKmh, setWindKmh] = useState<number | null>(null)
  const [visibilityKm, setVisibilityKm] = useState<string>("")
  const [pressure, setPressure] = useState<number | null>(null)
  const [sunText, setSunText] = useState("")
  const [icon, setIcon] = useState<string | undefined>(undefined)
  const [hourly, setHourly] = useState<HourItem[]>([])
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const lastNotificationTime = useRef<number>(0)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações.")
      return
    }
    
    if (notificationsEnabled) {
       // Opcional: Desativar (apenas visualmente, pois não dá para revogar permissão via JS)
       setNotificationsEnabled(false)
       return
    }

    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      setNotificationsEnabled(true)
      new Notification("Alertas de Clima Ativados", {
        body: "O Sistema Granja Bolso irá alertá-lo sobre condições críticas.",
        icon: "/icons/icon-192x192.png"
      })
    }
  }

  const checkAndNotify = (currentTemp: number, currentWind: number) => {
    if (!notificationsEnabled) return
    
    // Evitar notificações frequentes (máximo 1 a cada 30 min)
    const now = Date.now()
    if (now - lastNotificationTime.current < 30 * 60 * 1000) return

    let title = ""
    let body = ""

    if (currentTemp >= 30) {
      title = "⚠️ Alerta de Calor Extremo"
      body = `Temperatura atingiu ${currentTemp}°C. Risco de mortalidade. Ative a ventilação!`
    } else if (currentTemp <= 15) {
      title = "⚠️ Alerta de Frio"
      body = `Temperatura caiu para ${currentTemp}°C. Verifique o aquecimento.`
    } else if (currentWind >= 20) {
      title = "⚠️ Vento Forte"
      body = `Ventos de ${currentWind} km/h detectados. Proteja as cortinas.`
    }

    if (title) {
      new Notification(title, { body, icon: "/icons/icon-192x192.png" })
      lastNotificationTime.current = now
    }
  }

  const currentUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=pt_br"
  const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&lang=pt_br"

  const fmtTime = (unix: number, timezone: number) => {
    try {
      return new Date((unix + timezone) * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  const setBackground = (main: string, isDay: boolean) => {
    const bg = main === "Clear" ? (isDay ? "linear-gradient(135deg, #6dd5fa, #2980b9)" : "linear-gradient(135deg, #2c3e50, #000428)")
      : main === "Clouds" ? "linear-gradient(135deg, #757f9a, #d7dde8)"
      : main === "Rain" || main === "Drizzle" || main === "Thunderstorm" ? "linear-gradient(135deg, #3a6186, #89253e)"
      : main === "Snow" ? "linear-gradient(135deg, #e6dada, #274046)"
      : (isDay ? "linear-gradient(135deg, #6dd5fa, #2980b9)" : "linear-gradient(135deg, #2c3e50, #000428)")
    if (containerRef.current) containerRef.current.style.background = bg
  }

  const updateWeatherFromOW = (data: OWCurrent) => {
    setCityName(String(data?.name || ""))
    setCountry(String(data?.sys?.country || ""))
    setTemp(Number(data?.main?.temp ?? 0))
    setDescription(String(data?.weather?.[0]?.description || ""))
    setTempMax(Number(data?.main?.temp_max ?? 0))
    setTempMin(Number(data?.main?.temp_min ?? 0))
    setHumidity(Number(data?.main?.humidity ?? 0))
    setFeelsLike(Number(data?.main?.feels_like ?? 0))
    setWindKmh(Math.round(Number(data?.wind?.speed ?? 0) * 3.6))
    setPressure(Number(data?.main?.pressure ?? 0))
    setVisibilityKm(data?.visibility ? (Number(data.visibility) / 1000).toFixed(1) + " km" : "N/D")
    const sunrise = fmtTime(Number(data?.sys?.sunrise ?? 0), Number(data?.timezone ?? 0))
    const sunset = fmtTime(Number(data?.sys?.sunset ?? 0), Number(data?.timezone ?? 0))
    setSunText(`${sunrise} / ${sunset}`)
    const ic = String(data?.weather?.[0]?.icon || "")
    setIcon(ic || undefined)
    const isDay = ic.includes("d")
    setBackground(String(data?.weather?.[0]?.main || ""), isDay)
    
    // Verificar alertas
    checkAndNotify(Number(data?.main?.temp ?? 0), Math.round(Number(data?.wind?.speed ?? 0) * 3.6))
  }

  const updateHourlyFromOW = (data: OWForecast) => {
    const list = Array.isArray(data?.list) ? data.list.slice(0, 6) : []
    const items: HourItem[] = list.map((h: OWForecastListItem) => ({
      time: new Date(Number(h?.dt || 0) * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      icon: String(h?.weather?.[0]?.icon || ""),
      temp: Math.round(Number(h?.main?.temp ?? 0)),
    }))
    setHourly(items)
  }

  const fetchOW = async (url: string) => {
    const r = await fetch(url)
    if (!r.ok) throw new Error("Falha na API")
    return r.json()
  }

  const persistAndBroadcast = (lat?: string, lon?: string) => {
    try {
      const cityDisplay = [cityName, country].filter(Boolean).join(", ")
      if (lat && lon) {
        localStorage.setItem("climaLocal", JSON.stringify({ lat, lon, city: cityDisplay }))
      } else {
        const saved = JSON.parse(localStorage.getItem("climaLocal") || "{}")
        localStorage.setItem("climaLocal", JSON.stringify({ lat: saved.lat, lon: saved.lon, city: cityDisplay }))
      }
      if (!bcRef.current) return
      bcRef.current.postMessage({
        city: cityDisplay,
        temp,
        description,
        icon,
        lat,
        lon,
      })
    } catch {}
  }

  const getWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true)
    setError("")
    try {
      if (config.clima?.apiKey) {
        const cur = await fetchOW(`${currentUrl}&lat=${lat}&lon=${lon}&appid=${config.clima.apiKey}`)
        updateWeatherFromOW(cur)
        const fc = await fetchOW(`${forecastUrl}&lat=${lat}&lon=${lon}&appid=${config.clima.apiKey}`)
        updateHourlyFromOW(fc)
      } else {
        const curR = await fetch(`/api/weather?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&units=metric&kind=current`)
        const curB = await curR.json()
        if (curR.ok) {
          const c = curB?.data?.current || {}
          setCityName("")
          setCountry("")
          setTemp(Number(c?.temp ?? 0))
          setDescription(String(c?.weather || ""))
          setTempMax(null)
          setTempMin(null)
          setHumidity(Number(c?.humidity ?? 0))
          setFeelsLike(Number(c?.feels_like ?? 0))
          setWindKmh(Math.round(Number(c?.wind_speed ?? 0) * 3.6))
          setPressure(null)
          setVisibilityKm("")
          setSunText("")
          setIcon(undefined)
          setBackground(String(c?.weather || ""), true)
          
          // Verificar alertas
          checkAndNotify(Number(c?.temp ?? 0), Math.round(Number(c?.wind_speed ?? 0) * 3.6))

          try {
            const resolved = await GeoService.resolveCityName(String(lat), String(lon), config)
            if (resolved) {
              const parts = resolved.split(",").map((p) => p.trim()).filter(Boolean)
              setCityName(parts[0] || "")
              setCountry(parts[parts.length - 1] || "")
            }
          } catch {}
        }
        const fcR = await fetch(`/api/weather?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&units=metric`)
        const fcB = await fcR.json()
        const hourlyArr = Array.isArray(fcB?.data?.hourly) ? fcB.data.hourly.slice(0, 6) : []
        const items: HourItem[] = hourlyArr.map((e: { dt?: number; temp?: number }) => ({ time: new Date(Number(e?.dt || 0) * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), temp: Math.round(Number(e?.temp ?? 0)) }))
        setHourly(items)
      }
      try {
        const resolved = await GeoService.resolveCityName(String(lat), String(lon), config)
        if (resolved) {
          const parts = resolved.split(",").map((p) => p.trim()).filter(Boolean)
          setCityName(parts[0] || "")
          setCountry(parts[parts.length - 1] || "")
        }
      } catch {}
      persistAndBroadcast(String(lat), String(lon))
    } catch {
      setError("Erro ao carregar clima da sua localização")
    }
    setLoading(false)
  }

  const getWeatherByCity = async (city: string) => {
    setLoading(true)
    setError("")
    try {
      if (config.clima?.apiKey) {
        const cur = await fetchOW(`${currentUrl}&q=${encodeURIComponent(city)}&appid=${config.clima.apiKey}`)
        updateWeatherFromOW(cur)
        const fc = await fetchOW(`${forecastUrl}&q=${encodeURIComponent(city)}&appid=${config.clima.apiKey}`)
        updateHourlyFromOW(fc)
        try {
          const res = await GeoService.searchCity(city, config)
          if (res.best) {
            const display = [res.best.name, res.best.state, res.best.country].filter(Boolean).join(", ")
            const parts = display.split(",").map((p) => p.trim()).filter(Boolean)
            setCityName(parts[0] || "")
            setCountry(parts[parts.length - 1] || "")
            persistAndBroadcast(String(res.best.lat), String(res.best.lon))
          } else {
            persistAndBroadcast()
          }
        } catch {}
      } else {
        setError("Chave de API ausente. Configure OpenWeather nas Configurações.")
      }
    } catch {
      setError("Cidade não encontrada")
    }
    setLoading(false)
  }

  const detectLocation = () => {
    setError("")
    if (!navigator.geolocation) {
      setError("Seu navegador não suporta geolocalização.")
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setLoading(false)
        setError("Permissão de localização negada. Use a busca manual.")
      }
    )
  }

  useEffect(() => {
    detectLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel("clima-sync")
    } catch {}
    return () => {
      try {
        bcRef.current?.close()
      } catch {}
    }
  }, [])

  const canShowCurrent = useMemo(() => temp !== null, [temp])

  return (
    <DashboardLayout>
      <div className="clima-pro min-h-[80vh] py-4 flex justify-center items-start">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        <div ref={containerRef} className="container mx-auto max-w-[800px] w-full mt-5 rounded-[28px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-white/15 backdrop-blur-lg px-7 py-7">
          <h1 className="text-center text-3xl font-bold mb-2">Clima Pro</h1>
          <p className="text-center opacity-90 text-base mb-5">Seu clima em tempo real • Localização automática</p>

          <div className="flex gap-3 mb-5 flex-wrap justify-center">
            <div className="flex flex-1 min-w-[250px] max-w-[500px] overflow-hidden rounded-full shadow-lg">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = cityInput.trim()
                    if (q) {
                      void getWeatherByCity(q)
                    }
                  }
                }}
                placeholder="Digite outra cidade..."
                className="flex-1 px-5 py-4 border-0 bg-white/25 text-white text-lg placeholder:text-white/70 focus:outline-none"
              />
              <button
                id="searchBtn"
                className="px-6 bg-[#feca57] text-[#2c2c54] text-xl"
                onClick={() => cityInput.trim() && getWeatherByCity(cityInput.trim())}
              >
                Buscar
              </button>
            </div>
            <button
              id="locationBtn"
              className="bg-white/20 border-0 px-5 rounded-full cursor-pointer text-xl whitespace-nowrap"
              onClick={detectLocation}
              title="Usar minha localização atual"
            >
              Localização
            </button>
            <button
              onClick={requestNotificationPermission}
              className={`px-5 rounded-full cursor-pointer text-xl flex items-center gap-2 transition-colors ${notificationsEnabled ? "bg-green-500/20 text-white border border-green-500/50" : "bg-white/20 text-white/70"}`}
              title={notificationsEnabled ? "Notificações Ativadas" : "Ativar Alertas"}
            >
              {notificationsEnabled ? <Bell className="h-5 w-5 fill-current" /> : <BellOff className="h-5 w-5" />}
            </button>
          </div>

          {loading ? (
             <WeatherSkeleton />
          ) : (
             <>
                {!error && (
                  <div className="text-center py-4 text-sm hidden"></div> 
                )}

                {error && (
                  <div className="text-center py-4 text-sm">{error}</div>
                )}
      
                {!error && canShowCurrent && (
                  <div id="currentWeather" className="text-center my-5">
                    <h2 id="cityName" className="text-xl font-semibold">{cityName}{country ? ", " + country : ""}</h2>
                    {icon ? (
                      <Image id="weatherIcon" className="mx-auto my-4" src={`https://openweathermap.org/img/wn/${icon}@4x.png`} alt="ícone do clima" width={160} height={160} />
                    ) : null}
                    <div id="temp" className="text-6xl font-bold">
                      {temp !== null ? Math.round(temp) : "—"}
                      <span className="align-super text-3xl">°C</span>
                    </div>
                    <div id="description" className="text-xl my-3 capitalize">{description}</div>
                    <div className="text-base mt-2 opacity-90">
                      Máx: <span id="tempMax">{tempMax !== null ? Math.round(tempMax) + "°" : "—"}</span> | Mín: <span id="tempMin">{tempMin !== null ? Math.round(tempMin) + "°" : "—"}</span>
                    </div>
                  </div>
                )}
      
                <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 my-7">
                  <div className="bg-white/12 p-4 rounded-2xl text-center border border-white/10">
                    <i className="fas fa-tint text-2xl mb-2" aria-hidden="true" />
                    <div className="text-sm opacity-80">Umidade</div>
                    <div id="humidity" className="text-xl font-semibold mt-1">{humidity !== null ? `${humidity}%` : "—"}</div>
                  </div>
                  <div className="bg-white/12 p-4 rounded-2xl text-center border border-white/10">
                    <i className="fas fa-wind text-2xl mb-2" aria-hidden="true" />
                    <div className="text-sm opacity-80">Vento</div>
                    <div id="wind" className="text-xl font-semibold mt-1">{windKmh !== null ? `${windKmh} km/h` : "—"}</div>
                  </div>
                  <div className="bg-white/12 p-4 rounded-2xl text-center border border-white/10">
                    <i className="fas fa-thermometer-half text-2xl mb-2" aria-hidden="true" />
                    <div className="text-sm opacity-80">Sensação</div>
                    <div id="feelsLike" className="text-xl font-semibold mt-1">{feelsLike !== null ? `${Math.round(feelsLike)}°C` : "—"}</div>
                  </div>
                  <div className="bg-white/12 p-4 rounded-2xl text-center border border-white/10">
                    <i className="fas fa-eye text-2xl mb-2" aria-hidden="true" />
                    <div className="text-sm opacity-80">Visibilidade</div>
                    <div id="visibility" className="text-xl font-semibold mt-1">{visibilityKm || "—"}</div>
                  </div>
                  <div className="bg-white/12 p-4 rounded-2xl text-center border border-white/10">
                    <i className="fas fa-tachometer-alt text-2xl mb-2" aria-hidden="true" />
                    <div className="text-sm opacity-80">Pressão</div>
                    <div id="pressure" className="text-xl font-semibold mt-1">{pressure !== null ? `${pressure} hPa` : "—"}</div>
                  </div>
                  <div className="bg-white/12 p-4 rounded-2xl text-center border border-white/10">
                    <i className="fas fa-sun text-2xl mb-2" aria-hidden="true" />
                    <div className="text-sm opacity-80">Nascer / Pôr</div>
                    <div id="sun" className="text-xl font-semibold mt-1">{sunText || "—"}</div>
                  </div>
                </div>
      
                <div className="mt-6">
                  <h3 className="text-center my-4 text-lg">Próximas 6 horas</h3>
                  <div id="hourlyForecast" className="flex gap-3 overflow-x-auto py-3 no-scrollbar">
                    {hourly.map((h, i) => (
                      <div key={i} className="min-w-[76px] bg-white/18 p-4 rounded-2xl text-center">
                        <div className="text-sm opacity-90">{h.time}</div>
                        {h.icon ? (
                          <Image src={`https://openweathermap.org/img/wn/${h.icon}.png`} alt="" width={42} height={42} className="mx-auto my-1" />
                        ) : null}
                        <div className="font-semibold">{h.temp}°</div>
                      </div>
                    ))}
                    {hourly.length === 0 && (
                      <div className="text-sm text-center w-full">Sem dados</div>
                    )}
                  </div>
                </div>
      
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                       {temp !== null && humidity !== null && windKmh !== null && (
                         <WeatherImpact temp={temp} humidity={humidity} windKmh={windKmh} />
                       )}
                    </div>
                    <div className="space-y-6">
                       {hourly.length > 0 && (
                         <WeatherCharts data={hourly} />
                       )}
                    </div>
                 </div>
             </>
          )}
        </div>
        <style jsx>{`
          .clima-pro .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .clima-pro .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </DashboardLayout>
  )
}
