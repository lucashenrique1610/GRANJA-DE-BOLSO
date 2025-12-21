"use client"

import type React from "react"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DashboardLayout from "@/components/dashboard-layout"
import { Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useTips } from "@/contexts/tips-context"
import { useConfig } from "@/contexts/config-context"
import { DateInput } from "@/components/date-input"
import { validateDate } from "@/lib/date-utils"
import { formatDateInput } from "@/lib/date-utils"
import type { Lote, Manejo, ManejoDia, Estoque } from "@/services/data-service"

export default function ManejoPage() {
  const { toast } = useToast()
  const { recordAction } = useTips()
  const { config } = useConfig()
  const [activeTab, setActiveTab] = useState("registro")
  const [lotes, setLotes] = useState<Lote[]>([])
  const [manejoDia, setManejoDia] = useState<ManejoDia>({})
  
  useEffect(() => {
    try {
      const savedLotes = localStorage.getItem("lotes")
      if (savedLotes) {
        setLotes(JSON.parse(savedLotes))
      }
      const savedManejo = localStorage.getItem("manejoDia")
      if (savedManejo) {
        setManejoDia(JSON.parse(savedManejo))
      }
      const savedRecs = localStorage.getItem("recomendacoesManejo")
      if (savedRecs) {
        setHistoricoRecs(JSON.parse(savedRecs))
      }
    } catch (error) {
      console.error("Erro ao carregar dados de manejo:", error)
    }
  }, [])

  const [formData, setFormData] = useState<{
    data: string
    loteId: string
    periodo: "manha" | "tarde"
    ovos: string
    ovosDanificados: string
    racao: string
    porta: "aberta" | "fechada"
    pesoOvos: string
    classificacao: string
    outros: string
  }>({
    data: new Date().toLocaleDateString("pt-BR"),
    loteId: "",
    periodo: "manha",
    ovos: "",
    ovosDanificados: "",
    racao: "",
    porta: "fechada",
    pesoOvos: "",
    classificacao: "",
    outros: "",
  })
  type ManejoHistorico = Manejo & { periodo: "Manhã" | "Tarde"; data: string }
  const historicoManejo = useMemo<ManejoHistorico[]>(() => {
    const md = manejoDia
    const entries = Object.entries(md as ManejoDia).flatMap(([data, periodos]) => {
      const manha = periodos.manha
        ? ({ ...periodos.manha, periodo: "Manhã", data } as ManejoHistorico)
        : null
      const tarde = periodos.tarde
        ? ({ ...periodos.tarde, periodo: "Tarde", data } as ManejoHistorico)
        : null
      return [manha, tarde].filter(Boolean) as ManejoHistorico[]
    })
    return entries
  }, [manejoDia])
  const [disponibilidade, setDisponibilidade] = useState({
    galinhasVivas: "",
    galinhasLimpas: "",
    camaAves: "",
  })

  type ClimaLocal = { lat?: string; lon?: string; city?: string }
  type ClimaAtual = { temp: number; humidity: number; windKmh: number; uv?: number; radiation?: number }
  type ClimaDiario = { max: number; min: number; chuva: number; data: string }
  const [climaLocal, setClimaLocal] = useState<ClimaLocal>({})
  const [climaAtual, setClimaAtual] = useState<ClimaAtual>({ temp: 0, humidity: 0, windKmh: 0 })
  const [climaHoje, setClimaHoje] = useState<ClimaDiario>({ max: 0, min: 0, chuva: 0, data: "" })
  const [recomendacoes, setRecomendacoes] = useState<string[]>([])
  const [alertasClima, setAlertasClima] = useState<string[]>([])
  const [historicoRecs, setHistoricoRecs] = useState<
    { data: string; loteId: string; resumo: string; clima: ClimaAtual & ClimaDiario }[]
  >([])

  const carregarClima = useCallback(async (loc: ClimaLocal) => {
    const la = String(loc.lat || "")
    const lo = String(loc.lon || "")
    if (!la || !lo) return
    try {
      if (config.clima.provedor === "openweather" && config.clima.apiKey) {
        const curR = await fetch(
          `/api/weather?lat=${encodeURIComponent(la)}&lon=${encodeURIComponent(lo)}&units=metric&kind=current`
        )
        const curB = await curR.json()
        if (curR.ok) {
          const c = curB?.data?.current || {}
          setClimaAtual({
            temp: Number(c?.temp ?? 0),
            humidity: Number(c?.humidity ?? 0),
            windKmh: Math.round(Number(c?.wind_speed ?? 0) * 3.6),
          })
        }
        const fcR = await fetch(
          `/api/weather?lat=${encodeURIComponent(la)}&lon=${encodeURIComponent(lo)}&units=metric`
        )
        const fcB = await fcR.json()
        const today = new Date().toISOString().slice(0, 10)
        const dailyArr = Array.isArray(fcB?.data?.daily) ? fcB.data.daily : []
        const item = dailyArr.find((d: { date?: string }) => String(d?.date || "").startsWith(today))
        const max = Number(item?.max || 0)
        const min = Number(item?.min || 0)
        const chuva = Number(item?.rain || 0)
        setClimaHoje({ max, min, chuva, data: today })
      } else {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=shortwave_radiation,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=1`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        const cur = data.current || {}
        const hourly = data.hourly || {}
        setClimaAtual({
          temp: Number(cur.temperature_2m ?? 0),
          humidity: Number(cur.relative_humidity_2m ?? 0),
          windKmh: Math.round(Number(cur.wind_speed_10m ?? 0)),
          uv: Array.isArray(hourly.uv_index) ? Number(hourly.uv_index?.[0] ?? 0) : undefined,
          radiation: Array.isArray(hourly.shortwave_radiation)
            ? Number(hourly.shortwave_radiation?.[0] ?? 0)
            : undefined,
        })
        setClimaHoje({
          max: Number(data.daily?.temperature_2m_max?.[0] || 0),
          min: Number(data.daily?.temperature_2m_min?.[0] || 0),
          chuva: Number(data.daily?.precipitation_sum?.[0] || 0),
          data: String(data.daily?.time?.[0] || ""),
        })
      }
    } catch {}
  }, [config])

  const detectarLocal = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude.toFixed(4)
        const lo = pos.coords.longitude.toFixed(4)
        const saved = { lat: la, lon: lo }
        localStorage.setItem("climaLocal", JSON.stringify(saved))
        setTimeout(() => {
          setClimaLocal(saved)
          carregarClima(saved)
        }, 0)
      },
      () => {}
    )
  }, [carregarClima])

  

  const calcularMediaConsumo = useCallback(() => {
    const dias = historicoManejo.slice(-6)
    const porDia: Record<string, number> = {}
    dias.forEach((m) => {
      porDia[m.data] = (porDia[m.data] || 0) + Number(m.racao || 0)
    })
    const vals = Object.values(porDia)
    if (!vals.length) return 0
    const soma = vals.reduce((a, b) => a + b, 0)
    return Number((soma / vals.length).toFixed(2))
  }, [historicoManejo])

  const obterDietaAtual = (loteId: string) => {
    try {
      const historico = JSON.parse(localStorage.getItem("historicoFormulacoes") || "[]") as Array<{
        loteId?: string
        formulacaoNome?: string
        data?: string
      }>
      const match = historico
        .filter((h) => h.loteId === loteId)
        .sort((a, b) => (String(b.data || "").localeCompare(String(a.data || ""))))[0]
      return match?.formulacaoNome || "Padrão"
    } catch {
      return "Padrão"
    }
  }

  const gerarRecomendacoes = useCallback(() => {
    const recs: string[] = []
    const alerts: string[] = []
    const mediaConsumo = calcularMediaConsumo()
    const racaoHoje = Number(formData.racao || 0)
    const temp = Number(climaAtual.temp || 0)
    const hum = Number(climaAtual.humidity || 0)
    const vento = Number(climaAtual.windKmh || 0)
    const chuva = Number(climaHoje.chuva || 0)

    if (temp >= 30) {
      recs.push("Aumentar oferta de água fria e sombra")
      recs.push("Fracionar alimentação em horários mais frescos")
      recs.push("Reduzir densidade energética da dieta")
      alerts.push("Calor intenso: risco de estresse térmico")
    } else if (temp <= 15) {
      recs.push("Aumentar densidade energética da dieta")
      recs.push("Garantir proteção térmica do galpão")
    }

    if (hum >= 80 || chuva >= 10) {
      recs.push("Reforçar troca e secagem da cama")
      alerts.push("Umidade elevada: atenção a doenças respiratórias")
    }

    if (vento >= 25) {
      recs.push("Ajustar cortinas e reduzir correntes de ar diretas")
      alerts.push("Ventos fortes: proteger aberturas")
    }

    if ((climaAtual.uv || 0) >= 6 || (climaAtual.radiation || 0) >= 500) {
      recs.push("Prover áreas de sombra durante pico solar")
    }

    if (mediaConsumo && racaoHoje && racaoHoje < mediaConsumo * 0.9) {
      recs.push("Ajustar quantidade de ração ao consumo médio recente")
    }
    if (mediaConsumo && racaoHoje && racaoHoje > mediaConsumo * 1.1) {
      recs.push("Reduzir oferta para evitar desperdício")
    }

    setRecomendacoes(recs)
    setAlertasClima(alerts)
  }, [climaAtual, climaHoje, formData.racao, calcularMediaConsumo])

  const salvarRecomendacoesHoje = () => {
    const resumo = [
      `Temp ${climaAtual.temp.toFixed(0)}°C`,
      `Umid ${climaAtual.humidity}%`,
      `Vento ${climaAtual.windKmh} km/h`,
      `Chuva ${climaHoje.chuva} mm`,
    ].join(" • ")
    const item = {
      data: formData.data,
      loteId: formData.loteId || "",
      resumo,
      clima: { ...climaAtual, ...climaHoje },
    }
    const next = [...historicoRecs, item].slice(-100)
    localStorage.setItem("recomendacoesManejo", JSON.stringify(next))
    setHistoricoRecs(next)
    recordAction("salvar_recomendacoes_manejo", { lote: formData.loteId })
    toast({ title: "Recomendações salvas", description: "Histórico atualizado" })
  }

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("climaLocal") || "{}") as ClimaLocal
    if (saved.lat && saved.lon) {
      setTimeout(() => {
        setClimaLocal(saved)
        carregarClima(saved)
      }, 0)
    } else {
      setTimeout(detectarLocal, 0)
    }
  }, [carregarClima, detectarLocal])

  useEffect(() => {
    setTimeout(gerarRecomendacoes, 0)
  }, [gerarRecomendacoes])

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDisponibilidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDisponibilidade((prev) => ({ ...prev, [name]: value }))
  }

  // Remover a função formatDate que não é mais utilizada após a refatoração com DateInput

  // Removido: DateInput agora usa onChange com valor direto

  const salvarManejo = () => {
    const { data, loteId, periodo, ovos, ovosDanificados, racao, porta, pesoOvos, classificacao, outros } = formData

    if (!data || !loteId || !periodo || !ovos || !racao) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive",
      })
      return
    }

    if (!validateDate(data)) {
      toast({
        title: "Erro",
        description: "Data inválida ou futura!",
        variant: "destructive",
      })
      return
    }

    // Update manejoDia
    const updatedManejoDia = { ...manejoDia }
    updatedManejoDia[data] = updatedManejoDia[data] || {}
    updatedManejoDia[data][periodo] = {
      status: "Concluído",
      loteId,
      ovos: Number.parseInt(ovos),
      ovosDanificados: Number.parseInt(ovosDanificados) || 0,
      racao: Number.parseFloat(racao),
      agua: 0,
      porta,
      outros: outros || "Nenhum",
      pesoOvos: Number.parseFloat(pesoOvos) || 0,
      classificacao,
    }

    // Update estoque
    const estoque: Estoque = JSON.parse(localStorage.getItem("estoque") || "{}")
    estoque.ovos = (estoque.ovos || 0) + Number.parseInt(ovos) - (Number.parseInt(ovosDanificados) || 0)

    // Save to localStorage
    localStorage.setItem("manejoDia", JSON.stringify(updatedManejoDia))
    localStorage.setItem("estoque", JSON.stringify(estoque))

    setManejoDia(updatedManejoDia)

    toast({
      title: "Sucesso",
      description: `Manejo de ${periodo === "manha" ? "manhã" : "tarde"} (${data}) salvo com sucesso!`,
    })

    recordAction("registrar_manejo", { periodo })

    // Reset form
    setFormData({
      data: new Date().toLocaleDateString("pt-BR"),
      loteId: "",
      periodo: "manha",
      ovos: "",
      ovosDanificados: "",
      racao: "",
      porta: "fechada",
      pesoOvos: "",
      classificacao: "",
      outros: "",
    })
  }

  const salvarDisponibilidadeVenda = () => {
    const { galinhasVivas, galinhasLimpas, camaAves } = disponibilidade

    if (!galinhasVivas || !galinhasLimpas || !camaAves) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos!",
        variant: "destructive",
      })
      return
    }

    // Update estoque
    const estoque: Estoque = JSON.parse(localStorage.getItem("estoque") || "{}")
    estoque.galinhas_vivas = Number.parseInt(galinhasVivas)
    estoque.galinhas_limpas = Number.parseInt(galinhasLimpas)
    estoque.cama_aves = Number.parseInt(camaAves)

    // Save to localStorage
    localStorage.setItem("estoque", JSON.stringify(estoque))

    toast({
      title: "Sucesso",
      description: "Disponibilidade para venda atualizada com sucesso!",
    })

    recordAction("atualizar_disponibilidade_venda")

    // Reset form
    setDisponibilidade({
      galinhasVivas: "",
      galinhasLimpas: "",
      camaAves: "",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Manejo Diário</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="registro">Registro de Manejo</TabsTrigger>
            <TabsTrigger value="disponibilidade">Disponibilidade para Venda</TabsTrigger>
            <TabsTrigger value="historico">Histórico de Manejo</TabsTrigger>
            <TabsTrigger value="recomendacoes">Recomendações</TabsTrigger>
          </TabsList>

          <TabsContent value="registro" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Manejo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="relative">
                    <DateInput
                      id="data"
                      label="Data"
                      name="data"
                      value={formData.data}
                      onChange={(value) => setFormData((prev) => ({ ...prev, data: formatDateInput(value) }))}
                      placeholder="DD/MM/AAAA"
                    />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loteId">Lote</Label>
                    <Select
                      name="loteId"
                      value={formData.loteId}
                      onValueChange={(value) => handleSelectChange("loteId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um lote" />
                      </SelectTrigger>
                      <SelectContent>
                        {lotes.map((lote) => (
                          <SelectItem key={lote.id} value={lote.id}>
                            {lote.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodo">Período</Label>
                    <Select
                      name="periodo"
                      value={formData.periodo}
                      onValueChange={(value) => handleSelectChange("periodo", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manha">Manhã</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ovos">Ovos Coletados (unidades)</Label>
                    <Input
                      id="ovos"
                      name="ovos"
                      type="number"
                      min="0"
                      value={formData.ovos}
                      onChange={handleInputChange}
                      placeholder="Quantidade de ovos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ovosDanificados">Ovos Danificados</Label>
                    <Input
                      id="ovosDanificados"
                      name="ovosDanificados"
                      type="number"
                      min="0"
                      value={formData.ovosDanificados}
                      onChange={handleInputChange}
                      placeholder="Quantidade danificada"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="racao">Ração (kg)</Label>
                    <Input
                      id="racao"
                      name="racao"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.racao}
                      onChange={handleInputChange}
                      placeholder="Quantidade de ração"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="porta">Porta</Label>
                    <Select
                      name="porta"
                      value={formData.porta}
                      onValueChange={(value) => handleSelectChange("porta", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Estado da porta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberta">Aberta</SelectItem>
                        <SelectItem value="fechada">Fechada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pesoOvos">Peso Médio dos Ovos (g)</Label>
                    <Input
                      id="pesoOvos"
                      name="pesoOvos"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pesoOvos}
                      onChange={handleInputChange}
                      placeholder="Peso médio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classificacao">Classificação</Label>
                    <Select
                      name="classificacao"
                      value={formData.classificacao}
                      onValueChange={(value) => handleSelectChange("classificacao", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a classificação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pequeno">Pequeno</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="grande">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="outros">Observações</Label>
                    <Textarea
                      id="outros"
                      name="outros"
                      value={formData.outros}
                      onChange={handleInputChange}
                      placeholder="Digite aqui observações sobre o manejo..."
                      rows={3}
                    />
                  </div>
                </div>

                <Button className="mt-6 w-full" onClick={salvarManejo}>
                  Salvar Manejo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disponibilidade" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Disponibilidade para Venda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="galinhasVivas">Galinhas Vivas (quantidade)</Label>
                    <Input
                      id="galinhasVivas"
                      name="galinhasVivas"
                      type="number"
                      min="0"
                      value={disponibilidade.galinhasVivas}
                      onChange={handleDisponibilidadeChange}
                      placeholder="Quantidade de galinhas vivas"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="galinhasLimpas">Galinhas Limpas (quantidade)</Label>
                    <Input
                      id="galinhasLimpas"
                      name="galinhasLimpas"
                      type="number"
                      min="0"
                      value={disponibilidade.galinhasLimpas}
                      onChange={handleDisponibilidadeChange}
                      placeholder="Quantidade de galinhas limpas"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="camaAves">Cama das Aves (unidades)</Label>
                    <Input
                      id="camaAves"
                      name="camaAves"
                      type="number"
                      min="0"
                      value={disponibilidade.camaAves}
                      onChange={handleDisponibilidadeChange}
                      placeholder="Quantidade de cama disponível"
                    />
                  </div>

                  <Button className="w-full" onClick={salvarDisponibilidadeVenda}>
                    Salvar Disponibilidade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Manejo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Ovos</TableHead>
                        <TableHead>Danificados</TableHead>
                        <TableHead>Ração (kg)</TableHead>
                        <TableHead>Porta</TableHead>
                        <TableHead>Peso (g)</TableHead>
                        <TableHead>Classificação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoManejo.length > 0 ? (
                        historicoManejo.map((manejo, index) => (
                          <TableRow key={index}>
                            <TableCell>{manejo.data}</TableCell>
                            <TableCell>{manejo.loteId}</TableCell>
                            <TableCell>{manejo.periodo}</TableCell>
                            <TableCell>{manejo.ovos}</TableCell>
                            <TableCell>{manejo.ovosDanificados || 0}</TableCell>
                            <TableCell>{manejo.racao}</TableCell>
                            <TableCell>{manejo.porta}</TableCell>
                            <TableCell>{manejo.pesoOvos || "N/A"}</TableCell>
                            <TableCell>{manejo.classificacao || "N/A"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-4">
                            Nenhum registro de manejo encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recomendacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recomendações Diárias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {climaLocal.city ? climaLocal.city : "Localização"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
                        Temp {climaAtual.temp.toFixed(0)}°C
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
                        Umid {climaAtual.humidity}%
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
                        Vento {climaAtual.windKmh} km/h
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
                        Chuva {climaHoje.chuva} mm
                      </span>
                    </div>
                    <div className="text-sm">Máx {climaHoje.max}°C • Mín {climaHoje.min}°C</div>
                    <div className="text-sm">Dieta: {formData.loteId ? obterDietaAtual(formData.loteId) : "Selecione o lote"}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium">Dicas de Manejo</div>
                    {recomendacoes.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {recomendacoes.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">Sem recomendações específicas</div>
                    )}
                  </div>
                </div>

                {alertasClima.length > 0 && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm">
                    <div className="font-medium mb-1">Alertas Climáticos</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {alertasClima.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4">
                  <div className="font-medium mb-2">Ajustes de Alimentação</div>
                  <div className="text-sm text-muted-foreground">
                    Quantidade hoje: {formData.racao || "0"} kg • Média recente: {calcularMediaConsumo()} kg
                  </div>
                </div>

                <Button className="mt-4 w-full" onClick={salvarRecomendacoesHoje}>Salvar Recomendações</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Resumo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoRecs.length > 0 ? (
                        historicoRecs.map((h, i) => (
                          <TableRow key={i}>
                            <TableCell>{h.data}</TableCell>
                            <TableCell>{h.loteId || "N/A"}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{h.resumo}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                            Nenhum histórico registrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
