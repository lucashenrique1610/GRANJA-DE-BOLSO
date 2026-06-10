import type { SystemConfig } from "@/contexts/config-context"

type FetchLike = (input: string, init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

const joinParts = (parts: Array<string | undefined | null>) => {
  return parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter((p) => p && p.length > 0)
    .join(", ")
}

export const GeoService = {
  normalizeCityQuery: (q: string): string => {
    if (!q) return ""
    const s = q
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
    return s
  },
  searchCity: async (
    query: string,
    config: SystemConfig,
    fetchFn?: FetchLike,
  ): Promise<{ best: { name: string; state?: string; country?: string; lat: string; lon: string } | null; alternatives: Array<{ name: string; state?: string; country?: string; lat: string; lon: string }> }> => {
    const f: FetchLike = fetchFn || (globalThis.fetch as unknown as FetchLike)
    const q = GeoService.normalizeCityQuery(query)
    if (!q) return { best: null, alternatives: [] }
    if (config?.clima?.provedor === "openweather" && config?.clima?.apiKey) {
      try {
        const r = await f(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${config.clima.apiKey}`)
        if (r.ok) {
          const arr = await r.json()
          const mapped = (Array.isArray(arr) ? arr : []).map((e: unknown) => {
            const o = e as { name?: string; state?: string; country?: string; lat?: number | string; lon?: number | string }
            return { name: String(o.name || ""), state: o.state, country: o.country, lat: String(o.lat ?? ""), lon: String(o.lon ?? "") }
          })
          return { best: mapped[0] || null, alternatives: mapped.slice(1) }
        }
      } catch {}
    }
    try {
      const r2 = await f(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=pt&format=json`)
      if (r2.ok) {
        const data2 = (await r2.json()) as { results?: Array<{ name?: string; admin1?: string; country_code?: string; latitude?: number | string; longitude?: number | string }> }
        const arr = (data2?.results || []).map((e) => ({ name: String(e.name || ""), state: e.admin1, country: e.country_code, lat: String(e.latitude ?? ""), lon: String(e.longitude ?? "") }))
        return { best: arr[0] || null, alternatives: arr.slice(1) }
      }
    } catch {}
    return { best: null, alternatives: [] }
  },
  resolveCityName: async (
    latitude: string,
    longitude: string,
    config: SystemConfig,
    fetchFn?: FetchLike,
  ): Promise<string> => {
    const f: FetchLike = fetchFn || (globalThis.fetch as unknown as FetchLike)

    if (config?.clima?.provedor === "openweather" && config?.clima?.apiKey) {
      try {
        const r = await f(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${config.clima.apiKey}`,
        )
        if (r.ok) {
          const arr = (await r.json()) as Array<{ name?: string; state?: string; country?: string }>
          if (Array.isArray(arr) && arr[0]) {
            const name = joinParts([arr[0].name, arr[0].state, arr[0].country])
            if (name) return name
          }
        }
      } catch {}
    }

    try {
      const r2 = await f(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=pt&format=json`,
      )
      if (r2.ok) {
        const data2 = (await r2.json()) as { results?: Array<{ name?: string; admin1?: string; country_code?: string }> }
        const p = data2?.results?.[0]
        if (p) {
          const name = joinParts([p.name, p.admin1, p.country_code])
          if (name) return name
        }
      }
    } catch {}

    return ""
  },
  formatCityDisplay: (raw: string): string => {
    if (!raw) return "Localização não definida"
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean)
    if (parts.length === 0) return "Localização não definida"
    const city = parts[0]
    const state = parts[1] || ""
    return state ? `${city}, ${state}` : city
  },
}
