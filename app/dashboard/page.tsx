"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/dashboard-layout"
import { AlertCircle, Calendar, Egg, BarChart3, CreditCard, CloudSun, BookOpen } from "lucide-react"
import useLocalStorage from "@/hooks/use-local-storage"
import { formatNumber } from "@/lib/format-utils"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { useConfig } from "@/contexts/config-context"
import { ConfigService } from "@/services/config-service"
import { useSubscription } from "@/contexts/subscription-context"
import { useRouter } from "next/navigation"
import { GeoService } from "@/services/geo-service"
import { DataService } from "@/services/data-service"
import type { Lote, ManejoDia, Estoque, AplicacaoSaude } from "@/services/data-service"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const router = useRouter()
  const { config } = useConfig()
  const { isInTrial, daysLeftInTrial, subscriptionStatus } = useSubscription()
  const { toast } = useToast()
  const [lotes] = useLocalStorage<Lote[]>("lotes", [])
  const [manejoDia] = useLocalStorage<ManejoDia>("manejoDia", {})
  const [selectedLote, setSelectedLote] = useState("todos")
  const [selectedPeriodo, setSelectedPeriodo] = useState("semana")
  const [alertas, setAlertas] = useState<string[]>([])
  const [estoque] = useLocalStorage<Estoque>("estoque", {
    ovos: 0,
    galinhas_vivas: 0,
    galinhas_limpas: 0,
    cama_aves: 0,
  })
  const [aplicacoesSaude] = useLocalStorage<AplicacaoSaude[]>("aplicacoesSaude", [])
  const [climaHoje, setClimaHoje] = useState<{ max: number; min: number; chuva: number; data: string } | null>(null)
  const [loadingClima, setLoadingClima] = useState(false)
  const [erroClima, setErroClima] = useState("")
  const [cidadeClima, setCidadeClima] = useState("")
  const [tempAtual, setTempAtual] = useState<number | null>(null)
  const [descricaoAtual, setDescricaoAtual] = useState("")
  const [iconeAtual, setIconeAtual] = useState<string | undefined>(undefined)
  type OWCurrent = {
    sys?: { sunrise?: number; sunset?: number }
    main?: { temp?: number; humidity?: number; feels_like?: number; pressure?: number }
    wind?: { speed?: number }
    visibility?: number
    weather?: Array<{ description?: string; icon?: string }>
  }

  const checkAlerts = useCallback(() => {
    const alerts: string[] = []
    if (isInTrial() && daysLeftInTrial() <= 3) {
      alerts.push(`Seu período de teste termina em ${daysLeftInTrial()} dias! Assine para continuar usando o sistema.`)
    }
    if (subscriptionStatus.active && subscriptionStatus.endDate) {
      const endDate = new Date(subscriptionStatus.endDate)
      const today = new Date()
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 3) {
        alerts.push(`Sua assinatura expira em ${diffDays} dias! Renove para continuar usando o sistema.`)
      }
    }
    if (ConfigService.shouldShowAlert("aplicacoesSaude", config)) {
      try {
        const aplicacoesSaudeData: AplicacaoSaude[] = JSON.parse(localStorage.getItem("aplicacoesSaude") || "[]")
        aplicacoesSaudeData.forEach((a) => {
          if (a.dataProxima) {
            const dateParts = a.dataProxima.split("/")
            const dataProxima = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]))
            const today = new Date()
            const diasRestantes = Math.ceil((dataProxima.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            if (diasRestantes <= Number(config.sistema.diasAlertaEstoqueBaixo) && diasRestantes >= 0) {
              alerts.push(`Próxima dose de ${a.nome} (${a.loteId}) em ${diasRestantes} dias`)
            }
          }
        })
      } catch (e) {
        console.error("Erro ao verificar alertas de saúde:", e)
      }
    }
    if (ConfigService.shouldShowAlert("alertasEstoque", config)) {
      try {
        const estoqueData: Estoque = JSON.parse(localStorage.getItem("estoque") || "{}")
        if (estoqueData.ovos < Number(config.sistema.quantidadeEstoqueBaixoOvos)) {
          alerts.push(`Estoque de ovos baixo (< ${config.sistema.quantidadeEstoqueBaixoOvos} unidades)!`)
        }
        if (estoqueData.galinhas_vivas < Number(config.sistema.quantidadeEstoqueBaixoAves)) {
          alerts.push(`Estoque de galinhas vivas baixo (< ${config.sistema.quantidadeEstoqueBaixoAves})!`)
        }
      } catch (e) {
        console.error("Erro ao verificar alertas de estoque:", e)
      }
    }
    if (ConfigService.shouldShowAlert("lembretesManejos", config)) {
      try {
        const today = new Date().toLocaleDateString("pt-BR")
        const manejoDiaData: ManejoDia = JSON.parse(localStorage.getItem("manejoDia") || "{}")
        if (!manejoDiaData[today]?.manha) {
          alerts.push("Manejo da manhã pendente!")
        }
        if (!manejoDiaData[today]?.tarde) {
          alerts.push("Manejo da tarde pendente!")
        }
      } catch (e) {
        console.error("Erro ao verificar alertas de manejo:", e)
      }
    }
    setAlertas(alerts)
  }, [config, subscriptionStatus, isInTrial, daysLeftInTrial])

  useEffect(() => {
    checkAlerts()
  }, [checkAlerts])

  

  

  

  const handleManejoClick = () => {
    router.push("/dashboard/manejo")
  }

  const handleAlertClick = (alert: string) => {
    // Extract information from alert and navigate to appropriate page
    if (alert.includes("período de teste") || alert.includes("assinatura expira")) {
      router.push("/assinatura")
    } else if (alert.includes("Manejo")) {
      router.push("/dashboard/manejo")
    } else if (alert.includes("dose")) {
      router.push("/dashboard/controle-saude")
    } else if (alert.includes("ovos")) {
      router.push("/dashboard/vendas")
    } else if (alert.includes("galinhas")) {
      router.push("/dashboard/animais")
    }
  }

  const getTodayManejo = () => {
    const today = new Date().toLocaleDateString("pt-BR")
    return manejoDia[today] || { manha: null, tarde: null }
  }

  const todayManejo = getTodayManejo()

  

  const fetchOW = async (url: string) => {
    const r = await fetch(url)
    if (!r.ok) throw new Error("Falha na API")
    return r.json()
  }

  const updateFromCurrentOW = useCallback((data: OWCurrent) => {
    setTempAtual(Number(data?.main?.temp ?? 0))
    setDescricaoAtual(String(data?.weather?.[0]?.description || ""))
    const ic = String(data?.weather?.[0]?.icon || "")
    setIconeAtual(ic || undefined)
  }, [])

  const handleBackup = useCallback(async () => {
    const ok = await DataService.createBackup()
    toast({
      title: ok ? "Backup concluído" : "Backup indisponível",
      description: ok ? "Dados enviados ao Supabase" : "Configure Supabase para usar backup",
      variant: ok ? undefined : "destructive",
    })
  }, [toast])

  

  const fetchClimaResumo = useCallback(async (la: string, lo: string) => {
    try {
      if (config.clima?.apiKey) {
        const cur = await fetchOW(`https://api.openweathermap.org/data/2.5/weather?units=metric&lang=pt_br&lat=${la}&lon=${lo}&appid=${config.clima.apiKey}`)
        updateFromCurrentOW(cur)
      } else {
        const curR = await fetch(`/api/weather?lat=${encodeURIComponent(la)}&lon=${encodeURIComponent(lo)}&units=metric&kind=current`)
        const curB = await curR.json()
        if (curR.ok) {
          const c = curB?.data?.current || {}
          setTempAtual(Number(c?.temp ?? 0))
          setDescricaoAtual(String(c?.weather || ""))
          setIconeAtual(undefined)
        }
      }
    } catch {}
  }, [config, updateFromCurrentOW])

  type OWEntry = { dt_txt?: string; main?: { temp?: number }; rain?: Record<string, number> }
  const fetchClimaHoje = useCallback(async (latitude: string, longitude: string) => {
    try {
      setLoadingClima(true)
      setErroClima("")
      let item: { max: number; min: number; chuva: number; data: string }
      if (config.clima?.provedor === "openweather") {
        if (!config.clima.apiKey) throw new Error("Chave de API necessária para OpenWeather")
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${config.clima.apiKey}`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Falha ao obter previsão")
        const data = await res.json()
        const today = new Date().toISOString().slice(0, 10)
        const todays = ((data.list || []) as OWEntry[]).filter((e) => String(e.dt_txt || "").startsWith(today))
        const temps = todays.map((e) => Number(e.main?.temp || 0))
        const rain = todays.map((e) => Number(e.rain?.["3h"] || 0))
        item = {
          max: temps.length ? Math.max(...temps) : 0,
          min: temps.length ? Math.min(...temps) : 0,
          chuva: rain.reduce((a: number, b: number) => a + b, 0),
          data: today,
        }
      } else {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=1`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Falha ao obter previsão")
        const data = await res.json()
        item = {
          max: Number(data.daily.temperature_2m_max?.[0] || 0),
          min: Number(data.daily.temperature_2m_min?.[0] || 0),
          chuva: Number(data.daily.precipitation_sum?.[0] || 0),
          data: String(data.daily.time?.[0] || ""),
        }
      }
      setClimaHoje(item)
      setLoadingClima(false)
    } catch {
      setLoadingClima(false)
      setErroClima("Não foi possível obter a previsão de hoje")
    }
  }, [config])

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude.toFixed(4)
        const lo = pos.coords.longitude.toFixed(4)
        localStorage.setItem("climaLocal", JSON.stringify({ lat: la, lon: lo, city: cidadeClima }))
        if (!cidadeClima) {
          GeoService.resolveCityName(la, lo, config).then((name) => {
            if (name) {
              setCidadeClima(name)
              localStorage.setItem("climaLocal", JSON.stringify({ lat: la, lon: lo, city: name }))
            }
          })
        }
        fetchClimaHoje(la, lo)
        fetchClimaResumo(la, lo)
      },
      () => {}
    )
  }, [config, cidadeClima, fetchClimaHoje, fetchClimaResumo])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("climaLocal") || "{}")
    if (saved.lat && saved.lon) {
      setCidadeClima(saved.city || "")
      fetchClimaHoje(String(saved.lat), String(saved.lon))
      fetchClimaResumo(String(saved.lat), String(saved.lon))
    } else {
      detectLocation()
    }
  }, [detectLocation, fetchClimaHoje, fetchClimaResumo])

  useEffect(() => {
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel("clima-sync")
      type ClimaSyncMessage = { city?: string; temp?: number; description?: string; icon?: string; lat?: string; lon?: string }
      bc.onmessage = (ev: MessageEvent) => {
        const d: ClimaSyncMessage = (ev.data as ClimaSyncMessage) || {}
        if (typeof d.city === "string") setCidadeClima(d.city)
        if (typeof d.temp === "number") setTempAtual(d.temp)
        if (typeof d.description === "string") setDescricaoAtual(d.description)
        if (typeof d.icon === "string") setIconeAtual(d.icon || undefined)
      }
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === "climaLocal") {
        try {
          const saved = JSON.parse(String(e.newValue || "{}"))
          if (saved.lat && saved.lon) {
            setCidadeClima(saved.city || "")
            fetchClimaHoje(String(saved.lat), String(saved.lon))
            fetchClimaResumo(String(saved.lat), String(saved.lon))
          }
        } catch {}
      }
    }
    try {
      window.addEventListener("storage", onStorage)
    } catch {}
    return () => {
      try {
        bc?.close()
        window.removeEventListener("storage", onStorage)
      } catch {}
    }
  }, [fetchClimaHoje, fetchClimaResumo])

  const dicasContextuais = useMemo(() => {
    const tips: Array<{ title: string; desc: string; route: string }> = []
    const tMax = tempAtual !== null ? tempAtual : (climaHoje?.max ?? null)
    const tMin = tempAtual !== null ? tempAtual : (climaHoje?.min ?? null)
    const chuva = climaHoje?.chuva ?? 0

    if (tMax !== null && tMax >= 30) {
      tips.push({
        title: "Calor intenso: reforçar ventilação e sombra",
        desc: "Reduza estresse térmico com sombreamento, ventilação cruzada e água fresca.",
        route: "/dashboard/conhecimento?tab=clima-ideal",
      })
    }
    if (tMin !== null && tMin <= 15) {
      tips.push({
        title: "Temperatura baixa: proteja lotes jovens",
        desc: "Use cama profunda, vedação de correntes de ar e aquecimento quando necessário.",
        route: "/dashboard/conhecimento?tab=clima-ideal",
      })
    }
    if (chuva > 0.5) {
      tips.push({
        title: "Chuva prevista: cuide da cama e da ração",
        desc: "Evite umidade excessiva, proteja a ração e melhore a drenagem dos piquetes.",
        route: "/dashboard/conhecimento?tab=manejo",
      })
    }

    tips.push({
      title: "Explore o banco de conhecimento",
      desc: "Acesse dicas práticas de manejo, saúde, alimentação e vendas.",
      route: "/dashboard/conhecimento?tab=manejo",
    })

    return tips
  }, [tempAtual, climaHoje])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Alerta de assinatura */}
        {isInTrial() && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <p className="text-blue-700">
                  Você está no período de teste. Restam <strong>{daysLeftInTrial()}</strong> dias.
                </p>
              </div>
              <Button size="sm" onClick={() => router.push("/assinatura")}>
                Assinar agora
              </Button>
            </CardContent>
          </Card>
        )}

        {!isInTrial() && !subscriptionStatus.active && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700">Sua assinatura está inativa. Renove para continuar usando o sistema.</p>
              </div>
              <Button size="sm" onClick={() => router.push("/assinatura")}>
                Renovar agora
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <Card className="w-full md:w-1/2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-primary" /> Clima
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!climaHoje && tempAtual === null && !loadingClima && (
                <div className="text-sm text-muted-foreground">
                  Defina sua localização em <button className="underline" onClick={() => router.push("/dashboard/clima")}>Clima</button>.
                </div>
              )}
              {loadingClima && <div className="text-sm">Carregando...</div>}
              {erroClima && (
                <Alert>
                  <AlertDescription>{erroClima}</AlertDescription>
                </Alert>
              )}
              {(tempAtual !== null || climaHoje) && (
                <div className="space-y-3">
                  <div className="font-semibold text-foreground text-base md:text-lg flex items-center justify-between">
                    <span>{GeoService.formatCityDisplay(cidadeClima)}</span>
                    <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/clima")}>Abrir Clima</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    {iconeAtual ? (
                      <Image src={`https://openweathermap.org/img/wn/${iconeAtual}@2x.png`} alt="" width={56} height={56} />
                    ) : null}
                    <div>
                      <div className="text-3xl font-bold">{tempAtual !== null ? Math.round(tempAtual) : Math.round(climaHoje?.max || 0)}°C</div>
                      <div className="text-sm capitalize text-muted-foreground">{descricaoAtual || ""}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="w-full md:w-1/2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Manejo da Manhã</CardTitle>
            </CardHeader>
            <CardContent>
              {todayManejo.manha ? (
                <div className="space-y-2">
                  <StatusBadge
                    status={todayManejo.manha.status === "Concluído" ? "success" : "pending"}
                    text={todayManejo.manha.status}
                  />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Egg className="h-4 w-4 text-primary" />
                      <span>{formatNumber(todayManejo.manha.ovos || 0)} ovos</span>
                    </div>
                    <div>
                      <span>
                        {config.unidades.peso === "kg"
                          ? formatNumber(todayManejo.manha.racao || 0) + " kg"
                          : formatNumber((todayManejo.manha.racao || 0) * 1000) + " g"}{" "}
                        ração
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground">Pendente</span>
                  <Button size="sm" onClick={handleManejoClick}>
                    Registrar Manejo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="w-full md:w-1/2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Manejo da Tarde</CardTitle>
            </CardHeader>
            <CardContent>
              {todayManejo.tarde ? (
                <div className="space-y-2">
                  <StatusBadge
                    status={todayManejo.tarde.status === "Concluído" ? "success" : "pending"}
                    text={todayManejo.tarde.status}
                  />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Egg className="h-4 w-4 text-primary" />
                      <span>{formatNumber(todayManejo.tarde.ovos || 0)} ovos</span>
                    </div>
                    <div>
                      <span>
                        {config.unidades.peso === "kg"
                          ? formatNumber(todayManejo.tarde.racao || 0) + " kg"
                          : formatNumber((todayManejo.tarde.racao || 0) * 1000) + " g"}{" "}
                        ração
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground">Pendente</span>
                  <Button size="sm" onClick={handleManejoClick}>
                    Registrar Manejo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Dicas Contextuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dicasContextuais.length > 0 ? (
              <div className="space-y-3">
                {dicasContextuais.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium">{d.title}</div>
                      <div className="text-sm text-muted-foreground">{d.desc}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(d.route)}>Ver detalhes</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Sem dicas no momento</div>
            )}
          </CardContent>
        </Card>

        {alertas.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {alertas.map((alerta, index) => (
                    <Alert
                      key={index}
                      variant="warning"
                      className="cursor-pointer"
                      onClick={() => handleAlertClick(alerta)}
                    >
                      <AlertDescription>{alerta}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg font-medium">Resumo de Produção</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedLote} onValueChange={setSelectedLote}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Selecione o lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os lotes</SelectItem>
                  {lotes.map((lote) => (
                    <SelectItem key={lote.id} value={lote.id}>
                      {lote.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Dia</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                  <SelectItem value="ano">Ano</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleBackup}>Backup</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Produção de Ovos"
              value={estoque.ovos}
              trend="up"
              change={12}
              icon={<Egg className="h-5 w-5" />}
            />

            <StatCard title="Aves Vivas" value={estoque.galinhas_vivas} trend="down" change={3} />

            <StatCard
              title="Próximas Aplicações"
              value={aplicacoesSaude.filter((a) => a.dataProxima).length}
              icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
              formatter="none"
            />
          </div>

          <Card className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center text-muted-foreground">
              <BarChart3 className="h-16 w-16 mb-2" />
              <p>Gráfico de produção e consumo</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
