import { NextRequest, NextResponse } from "next/server"
// Proxy seguro para OpenWeather One Call 3.0
// - Autenticação via variável de ambiente: OPENWEATHER_API_KEY
// - Parâmetros obrigatórios: lat, lon, exclude, units
// - Cache em memória com TTL para reduzir chamadas
// - Timeout e tratamento de erros com mensagens amigáveis

const CACHE_TTL_MS = 5 * 60 * 1000
type CacheEntry = { ts: number; data: any }
const cache = new Map<string, CacheEntry>()

function buildKey(lat: string, lon: string, exclude: string, units: string) {
  return `onecall:${lat}:${lon}:${exclude}:${units}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get("lat") || ""
  const lon = searchParams.get("lon") || ""
  const exclude = searchParams.get("exclude") || "minutely,alerts"
  const units = searchParams.get("units") || "metric"
  const kind = searchParams.get("kind") || ""

  if (!lat || !lon) {
    return NextResponse.json({ error: "Parâmetros 'lat' e 'lon' são obrigatórios" }, { status: 400 })
  }

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Chave de API ausente. Defina OPENWEATHER_API_KEY nas variáveis de ambiente." }, { status: 500 })
  }

  const cacheKey = buildKey(lat, lon, exclude, units)
  const now = Date.now()
  const hit = cache.get(cacheKey)
  if (hit && now - hit.ts < CACHE_TTL_MS) {
    return NextResponse.json({ ...hit.data, cached: true })
  }

  if (kind === "current") {
    const urlC = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=${encodeURIComponent(units)}&appid=${encodeURIComponent(apiKey)}`
    const ac = new AbortController()
    const to = setTimeout(() => ac.abort(), 12000)
    try {
      const r = await fetch(urlC, { signal: ac.signal })
      clearTimeout(to)
      if (!r.ok) {
        let err: any = null
        try { err = await r.json() } catch {}
        const msg = err?.message || `Falha na API (${r.status})`
        return NextResponse.json({ error: msg, status: r.status }, { status: r.status })
      }
      const data = await r.json()
      const current = {
        dt: Number(data?.dt || Date.now()/1000),
        temp: Number(data?.main?.temp || 0),
        feels_like: Number(data?.main?.feels_like || 0),
        humidity: Number(data?.main?.humidity || 0),
        wind_speed: Number(data?.wind?.speed || 0),
        wind_deg: Number(data?.wind?.deg || 0),
        clouds: Number(data?.clouds?.all || 0),
        weather: String((data?.weather?.[0]?.main || "")),
      }
      const wrapped = { source: "openweather-current", data: { current } }
      cache.set(cacheKey, { ts: now, data: wrapped })
      return NextResponse.json(wrapped)
    } catch (e: any) {
      clearTimeout(to)
      const aborted = e?.name === "AbortError"
      const msg = aborted ? "Tempo esgotado ao consultar a API" : "Erro de conexão com a API"
      return NextResponse.json({ error: msg }, { status: 504 })
    }
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&exclude=${encodeURIComponent(exclude)}&units=${encodeURIComponent(units)}&appid=${encodeURIComponent(apiKey)}`

  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), 12000)
  try {
    const r = await fetch(url, { signal: ac.signal })
    clearTimeout(to)
    if (!r.ok) {
      let err: any = null
      try { err = await r.json() } catch {}
      const msg = err?.message || `Falha na API (${r.status})`
      if (r.status === 401) {
        const url2 = `https://api.openweathermap.org/data/2.5/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=${encodeURIComponent(units)}&appid=${encodeURIComponent(apiKey)}`
        const r2 = await fetch(url2)
        if (!r2.ok) {
          let err2: any = null
          try { err2 = await r2.json() } catch {}
          const msg2 = err2?.message || `Falha na API (forecast ${r2.status})`
          return NextResponse.json({ error: msg2, status: r2.status }, { status: r2.status })
        }
        const data2 = await r2.json()
        const hourly = (data2?.list || []).map((e: any) => ({
          dt: Number(e?.dt || 0),
          temp: Number(e?.main?.temp || 0),
          feels_like: Number(e?.main?.feels_like || 0),
          humidity: Number(e?.main?.humidity || 0),
          wind_speed: Number(e?.wind?.speed || 0),
          wind_deg: Number(e?.wind?.deg || 0),
          clouds: Number(e?.clouds?.all || 0),
          pop: Number(e?.pop || 0),
          pressure: Number(e?.main?.pressure || 0),
          rain: Number((e?.rain && e.rain["3h"]) || 0),
        }))
        const byDate: Record<string, { temps: number[]; rain: number[]; dt: number }> = {};
        (data2?.list || []).forEach((entry: any) => {
          const date = String(entry?.dt_txt || "").split(" ")[0]
          const t = Number(entry?.main?.temp || 0)
          const rsum = Number((entry?.rain && entry.rain["3h"]) || 0)
          const dt = Number(entry?.dt || 0)
          if (!byDate[date]) byDate[date] = { temps: [], rain: [], dt }
          byDate[date].temps.push(t)
          byDate[date].rain.push(rsum)
        })
        const daily = Object.keys(byDate).map((d) => {
          const temps = byDate[d].temps
          const rainArr = byDate[d].rain
          const dt = byDate[d].dt
          return {
            dt,
            temp: { max: Math.max(...temps), min: Math.min(...temps) },
            rain: rainArr.reduce((a, b) => a + b, 0),
          }
        })
        const wrapped2 = { source: "openweather-forecast", data: { hourly, daily } }
        cache.set(cacheKey, { ts: now, data: wrapped2 })
        return NextResponse.json(wrapped2)
      }
      return NextResponse.json({ error: msg, status: r.status }, { status: r.status })
    }
    const data = await r.json()
    const wrapped = { source: "openweather-onecall", data }
    cache.set(cacheKey, { ts: now, data: wrapped })
    return NextResponse.json(wrapped)
  } catch (e: any) {
    clearTimeout(to)
    const aborted = e?.name === "AbortError"
    const msg = aborted ? "Tempo esgotado ao consultar a API" : "Erro de conexão com a API"
    return NextResponse.json({ error: msg }, { status: 504 })
  }
}
