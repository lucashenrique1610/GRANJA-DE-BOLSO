"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/dashboard-layout"
import { Bird, Calendar, Scale, Users, Edit, X, Search, Filter, Plus, Trash2, FileText, Syringe, Stethoscope, MapPin, Info, Save, ArrowLeft, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { validateDate, formatDateInput } from "@/lib/date-utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, ComposedChart } from "recharts"
import { createClient } from "@/lib/supabase-client"

// --- Types ---
type Lote = {
  id: string
  quantidade: number
  fornecedor: string
  data_compra: string
  valor_lote: number
  valor_ave: number
  tipo: string
  raca: string
  femeas: number
  machos: number
  nome?: string
  localizacao?: string
  finalidade?: string
  observacoes?: string
  documentos?: string[]
  created_at: string
  updated_at: string
}

type Fornecedor = any

type VisitaVeterinaria = {
  id: string
  lote_id: string
  data: string
  tipo_procedimento: string
  veterinario: string
  observacoes: string
  created_at: string
  updated_at: string
}

type AplicacaoSaude = {
  id: string
  lote_id: string
  data: string
  fase: string
  tipo: string
  nome: string
  veterinario: string
  quantidade: number
  observacoes: string
  proxima_dose: string
  data_proxima: string
  formulacao_id: string | null
  created_at: string
  updated_at: string
}

type Mortalidade = {
  id: string
  lote_id: string
  data: string
  quantidade: number
  causa: string
  observacoes: string
  created_at: string
  updated_at: string
}

type ManejoDia = {
  [date: string]: {
    manha?: Manejo,
    tarde?: Manejo
  }
}

type Manejo = {
  lote_id: string
  ovos: number
  ovos_danificados: number
  racao: number
  porta: string
  outros: string
  status: string
  agua: number
  peso_ovos: number
  classificacao: string
}

type HistoricoManejoItem = {
  id: string
  data: string
  periodo: "Manhã" | "Tarde"
  hora: string
  ovos: number
  ovosDanificados: number
  racao: number
  porta: string
  observacoes?: string
}

type HistoricoConsumoDia = {
  data: string
  fullDate: string
  racaoTotal: number
  meta: number
}

type HistoricoMortalidadeDia = {
  data: string
  fullDate: string
  quantidade: number
  accumulated: number
  causa?: string
}

type HistoricoSaudeItem = {
  id: string
  data: string
  tipoEvento: string
  detalhe: string
  categoria: any
  responsavel: string
  observacoes: string
}

type PeriodoHistorico = "ciclo" | "30dias" | "7dias" | "hoje" | "todos"

// --- Helper Functions ---
const formatDateForApi = (dateStr: string) => {
  const [day, month, year] = dateStr.split('/')
  return `${year}-${month}-${day}`
}

const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return ""
  if (dateStr.includes('/')) return dateStr
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export default function AnimaisPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("cadastro")
  const [lotes, setLotes] = useState<Lote[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [pesosLotes, setPesosLotes] = useState<any[]>([]) // Keep local for now as not on schema
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formCadastro, setFormCadastro] = useState({
    quantidade: "",
    fornecedor: "",
    data: new Date().toLocaleDateString("pt-BR"),
    valorLote: "",
    valorAve: "",
    tipo: "pintainhas",
    raca: "",
  })
  const [formPeso, setFormPeso] = useState({
    loteId: "",
    data: new Date().toLocaleDateString("pt-BR"),
    pesoMedio: "",
  })
  const [formSexo, setFormSexo] = useState({
    loteId: "",
    femeas: "",
    machos: "",
  })
  const [viewMode, setViewMode] = useState<"list" | "edit">("list")
  const [searchTerm, setSearchTerm] = useState("")
  const [visitasVeterinarias, setVisitasVeterinarias] = useState<VisitaVeterinaria[]>([])
  const [allAplicacoes, setAllAplicacoes] = useState<AplicacaoSaude[]>([])
  const [allMortalidade, setAllMortalidade] = useState<Mortalidade[]>([])
  const [allManejoDia, setAllManejoDia] = useState<ManejoDia>({})
  const [editingLoteData, setEditingLoteData] = useState<{
    lote: (Lote & { dataCompra: string }) | null
    aplicacoes: (AplicacaoSaude & { data: string, dataProxima: string })[]
    visitas: (VisitaVeterinaria & { data: string })[]
    mortalidade: (Mortalidade & { data: string })[]
    manejo: HistoricoManejoItem[]
  }>({ lote: null, aplicacoes: [], visitas: [], mortalidade: [], manejo: [] })
  const [historyPeriod, setHistoryPeriod] = useState<PeriodoHistorico>("30dias")
  const [activeHistoryTab, setActiveHistoryTab] = useState("manejo")
  
  const supabase = createClient()

  const loadData = async () => {
    try {
      // Load Lotes
      const { data: lotesData, error: lotesError } = await supabase
        .from("lotes")
        .select("*")
        .order("created_at", { ascending: false })

      if (lotesError) {
        console.error("Erro ao carregar lotes:", lotesError)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os lotes.",
          variant: "destructive"
        })
        return
      }
      setLotes(lotesData || [])

      // Load Fornecedores
      const { data: fornecedoresData, error: fornecedoresError } = await supabase
        .from("fornecedores")
        .select("*")
      if (fornecedoresError) {
        console.error("Erro ao carregar fornecedores:", fornecedoresError)
      }
      setFornecedores(fornecedoresData || [])

      // Load Visitas
      const { data: visitasData, error: visitasError } = await supabase
        .from("visitas_veterinarias")
        .select("*")
      if (visitasError) {
        console.error("Erro ao carregar visitas:", visitasError)
      }
      setVisitasVeterinarias(visitasData || [])

      // Load Aplicacoes
      const { data: aplicacoesData, error: aplicacoesError } = await supabase
        .from("aplicacoes_saude")
        .select("*")
      if (aplicacoesError) {
        console.error("Erro ao carregar aplicações:", aplicacoesError)
      }
      setAllAplicacoes(aplicacoesData || [])

      // Load Mortalidade
      const { data: mortalidadeData, error: mortalidadeError } = await supabase
        .from("mortalidade")
        .select("*")
      if (mortalidadeError) {
        console.error("Erro ao carregar mortalidade:", mortalidadeError)
      }
      setAllMortalidade(mortalidadeData || [])

      // Load Manejo
      const { data: manejoData, error: manejoError } = await supabase
        .from("manejo_diario")
        .select("*")
      if (manejoError) {
        console.error("Erro ao carregar manejo:", manejoError)
      }
      
      // Convert manejoData to ManejoDia structure
      const manejoDia: ManejoDia = {}
      manejoData?.forEach(item => {
        if (!manejoDia[item.data]) {
          manejoDia[item.data] = {}
        }
        const periodo = item.periodo as "manha" | "tarde"
        manejoDia[item.data][periodo] = {
          lote_id: item.lote_id,
          ovos: item.ovos,
          ovos_danificados: item.ovos_danificados,
          racao: item.racao,
          porta: item.porta,
          outros: item.outros,
          status: item.status,
          agua: item.agua,
          peso_ovos: item.peso_ovos,
          classificacao: item.classificacao
        }
      })
      setAllManejoDia(manejoDia)

    } catch (error) {
      console.error("Erro geral ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os dados.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCadastroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormCadastro((prev) => ({ ...prev, [name]: value }))

    if (name === "valorLote") {
      const quantidade = Number.parseInt(formCadastro.quantidade) || 0
      if (quantidade > 0) {
        const valorAve = (Number.parseFloat(value) / quantidade).toFixed(2)
        setFormCadastro((prev) => ({ ...prev, valorAve }))
      }
    }
    if (name === "quantidade") {
      const valorAve = Number.parseFloat(formCadastro.valorAve) || 0
      if (valorAve > 0) {
        const valorLote = (Number.parseInt(value) * valorAve).toFixed(2)
        setFormCadastro((prev) => ({ ...prev, valorLote }))
      }
    }
    if (name === "valorAve") {
      const quantidade = Number.parseInt(formCadastro.quantidade) || 0
      if (quantidade > 0) {
        const valorLote = (quantidade * Number.parseFloat(value)).toFixed(2)
        setFormCadastro((prev) => ({ ...prev, valorLote }))
      }
    }
  }

  const handlePesoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormPeso((prev) => ({ ...prev, [name]: value }))
  }

  const handleSexoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormSexo((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string, form: "cadastro" | "peso" | "sexo") => {
    if (form === "cadastro") {
      setFormCadastro((prev) => ({ ...prev, [name]: value }))
    } else if (form === "peso") {
      setFormPeso((prev) => ({ ...prev, [name]: value }))
    } else {
      setFormSexo((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, form: "cadastro" | "peso") => {
    const formattedDate = formatDateInput(e.target.value)
    if (form === "cadastro") {
      setFormCadastro((prev) => ({ ...prev, data: formattedDate }))
    } else {
      setFormPeso((prev) => ({ ...prev, data: formattedDate }))
    }
  }

  const cancelarEdicao = () => {
    if (editingId) {
      setActiveTab("sexo")
    }
    setEditingId(null)
    setFormCadastro({
      quantidade: "",
      fornecedor: "",
      data: new Date().toLocaleDateString("pt-BR"),
      valorLote: "",
      valorAve: "",
      tipo: "pintainhas",
      raca: "",
    })
  }

  const handleEdit = (lote: Lote) => {
    setFormCadastro({
      quantidade: lote.quantidade.toString(),
      fornecedor: lote.fornecedor,
      data: formatDateForDisplay(lote.data_compra),
      valorLote: lote.valor_lote.toString(),
      valorAve: lote.valor_ave.toString(),
      tipo: lote.tipo,
      raca: lote.raca,
    })
    setEditingId(lote.id)
    setActiveTab("cadastro")
  }

  const handleSaveLote = async () => {
    const { quantidade, fornecedor, data, valorLote, valorAve, tipo, raca } = formCadastro

    if (!quantidade || !fornecedor || !data || !valorLote || !valorAve || !raca) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios!", variant: "destructive" })
      return
    }

    if (!validateDate(data)) {
      toast({ title: "Erro", description: "Data inválida ou futura!", variant: "destructive" })
      return
    }

    try {
      if (editingId) {
        // UPDATE
        const { error } = await supabase
          .from("lotes")
          .update({
            quantidade: Number.parseInt(quantidade),
            fornecedor,
            data_compra: formatDateForApi(data),
            valor_lote: Number.parseFloat(valorLote),
            valor_ave: Number.parseFloat(valorAve),
            tipo,
            raca,
          })
          .eq("id", editingId)

        if (error) {
          console.error("Erro ao atualizar lote:", error)
          toast({ title: "Erro", description: "Falha ao atualizar lote!", variant: "destructive" })
          return
        }

        toast({ title: "Sucesso", description: "Lote atualizado com sucesso!" })
      } else {
        // INSERT
        const { error } = await supabase
          .from("lotes")
          .insert({
            quantidade: Number.parseInt(quantidade),
            fornecedor,
            data_compra: formatDateForApi(data),
            valor_lote: Number.parseFloat(valorLote),
            valor_ave: Number.parseFloat(valorAve),
            tipo,
            raca,
            femeas: 0,
            machos: 0,
          })

        if (error) {
          console.error("Erro ao criar lote:", error)
          toast({ title: "Erro", description: "Falha ao criar lote!", variant: "destructive" })
          return
        }

        toast({ title: "Sucesso", description: "Lote cadastrado com sucesso!" })
      }

      cancelarEdicao()
      await loadData() // Reload from DB
    } catch (error) {
      console.error("Erro geral:", error)
      toast({ title: "Erro", description: "Falha ao salvar!", variant: "destructive" })
    }
  }

  const registrarPeso = () => {
    const { loteId, data, pesoMedio } = formPeso
    if (!loteId || !data || !pesoMedio) {
      toast({ title: "Erro", description: "Preencha todos os campos!", variant: "destructive" })
      return
    }
    if (!validateDate(data)) {
      toast({ title: "Erro", description: "Data inválida!", variant: "destructive" })
      return
    }

    const newPeso = { loteId, data, pesoMedio: Number.parseFloat(pesoMedio) }
    const updatedPesos = [...pesosLotes, newPeso]
    setPesosLotes(updatedPesos)
    toast({ title: "Sucesso", description: "Peso registrado!" })
    setFormPeso({ loteId: "", data: new Date().toLocaleDateString("pt-BR"), pesoMedio: "" })
  }

  const atualizarSexoLote = async () => {
    const { loteId, femeas, machos } = formSexo
    if (!loteId || !femeas || !machos) {
      toast({ title: "Erro", description: "Preencha todos os campos!", variant: "destructive" })
      return
    }

    const femeaNum = Number.parseInt(femeas)
    const machoNum = Number.parseInt(machos)
    const lote = lotes.find(l => l.id === loteId)

    if (!lote) {
      toast({ title: "Erro", description: "Lote não encontrado!", variant: "destructive" })
      return
    }

    if (femeaNum + machoNum > lote.quantidade) {
      toast({ title: "Erro", description: "Soma de fêmeas e machos excede a quantidade!", variant: "destructive" })
      return
    }

    try {
      const { error } = await supabase
        .from("lotes")
        .update({ femeas: femeaNum, machos: machoNum })
        .eq("id", loteId)

      if (error) {
        console.error("Erro:", error)
        toast({ title: "Erro", description: "Falha!", variant: "destructive" })
        return
      }

      toast({ title: "Sucesso", description: "Sexo atualizado!" })
      setFormSexo({ loteId: "", femeas: "", machos: "" })
      await loadData()
    } catch (error) {
      console.error(error)
      toast({ title: "Erro", description: "Falha!", variant: "destructive" })
    }
  }

  const handleSelectLoteForEdit = (lote: Lote) => {
    const loteAplicacoes = allAplicacoes.filter(app => app.lote_id === lote.id)
    const loteVisitas = visitasVeterinarias.filter(v => v.lote_id === lote.id)
    const loteMortalidade = allMortalidade.filter(m => m.lote_id === lote.id)
    
    const loteManejo: HistoricoManejoItem[] = []
    Object.entries(allManejoDia).forEach(([date, periods]) => {
      const displayDate = formatDateForDisplay(date)
      if (periods.manha && periods.manha.lote_id === lote.id) {
        loteManejo.push({
          id: `man-${date}-manha`,
          data: displayDate,
          periodo: "Manhã",
          hora: "08:00",
          ovos: periods.manha.ovos || 0,
          ovosDanificados: periods.manha.ovos_danificados || 0,
          racao: periods.manha.racao || 0,
          porta: periods.manha.porta || "-",
          observacoes: periods.manha.outros || ""
        })
      }
      if (periods.tarde && periods.tarde.lote_id === lote.id) {
        loteManejo.push({
          id: `man-${date}-tarde`,
          data: displayDate,
          periodo: "Tarde",
          hora: "16:00",
          ovos: periods.tarde.ovos || 0,
          ovosDanificados: periods.tarde.ovos_danificados || 0,
          racao: periods.tarde.racao || 0,
          porta: periods.tarde.porta || "-",
          observacoes: periods.tarde.outros || ""
        })
      }
    })

    setEditingLoteData({
      lote: { ...lote, dataCompra: formatDateForDisplay(lote.data_compra) },
      aplicacoes: loteAplicacoes.map(a => ({ ...a, data: formatDateForDisplay(a.data), dataProxima: formatDateForDisplay(a.data_proxima) })),
      visitas: loteVisitas.map(v => ({ ...v, data: formatDateForDisplay(v.data) })),
      mortalidade: loteMortalidade.map(m => ({ ...m, data: formatDateForDisplay(m.data) })),
      manejo: loteManejo
    })
    setViewMode("edit")
  }

  const handleSaveFullEdit = async () => {
    if (!editingLoteData.lote) return

    if (!validateDate(editingLoteData.lote.dataCompra)) {
      toast({ title: "Erro", description: "Data inválida!", variant: "destructive" })
      return
    }

    try {
      // --- Save Lote ---
      const { error: loteError } = await supabase
        .from("lotes")
        .update({
          ...editingLoteData.lote,
          data_compra: formatDateForApi(editingLoteData.lote.dataCompra),
          dataCompra: undefined
        })
        .eq("id", editingLoteData.lote.id)

      if (loteError) {
        console.error("Lote error:", loteError)
        throw loteError
      }

      // --- Save Aplicacoes ---
      for (const app of editingLoteData.aplicacoes) {
        // Check if existing ID is a real one (not temp)
        if (app.id.startsWith("temp-")) {
          // Insert new
          const { error: appError } = await supabase
            .from("aplicacoes_saude")
            .insert({
              lote_id: app.lote_id,
              data: formatDateForApi(app.data),
              fase: app.fase,
              tipo: app.tipo,
              nome: app.nome,
              veterinario: app.veterinario,
              quantidade: app.quantidade,
              observacoes: app.observacoes,
              proxima_dose: app.proxima_dose,
              data_proxima: app.dataProxima ? formatDateForApi(app.dataProxima) : null,
              formulacao_id: app.formulacao_id,
            })
          if (appError) {
            console.error("App error:", appError)
            throw appError
          }
        }
      }

      // --- Save Visitas ---
      for (const visita of editingLoteData.visitas) {
        if (visita.id.startsWith("temp-")) {
          const { error: visitaError } = await supabase
            .from("visitas_veterinarias")
            .insert({
              lote_id: visita.lote_id,
              data: formatDateForApi(visita.data),
              tipo_procedimento: visita.tipo_procedimento,
              veterinario: visita.veterinario,
              observacoes: visita.observacoes
            })
          if (visitaError) {
            console.error("Visita error:", visitaError)
            throw visitaError
          }
        }
      }

      // --- Save Mortalidade ---
      for (const mort of editingLoteData.mortalidade) {
        if (!mort.id.startsWith("temp-")) continue
        const { error: mortError } = await supabase
          .from("mortalidade")
          .insert({
            lote_id: mort.lote_id,
            data: formatDateForApi(mort.data),
            quantidade: mort.quantidade,
            causa: mort.causa,
            observacoes: mort.observacoes
          })
        if (mortError) {
          console.error("Mort error:", mortError)
          throw mortError
        }
      }

      // --- Reload Data ---
      toast({ title: "Sucesso", description: "Dados salvos!" })
      setViewMode("list")
      setEditingLoteData({ lote: null, aplicacoes: [], visitas: [], mortalidade: [], manejo: [] })
      await loadData()

    } catch (error) {
      console.error("Erro ao salvar edição:", error)
      toast({ title: "Erro", description: "Falha ao salvar!", variant: "destructive" })
    }
  }

  const handleAddAplicacaoLocal = () => {
    if (!editingLoteData.lote) return
    const newApp: any = {
      id: `temp-${Date.now()}`,
      lote_id: editingLoteData.lote.id,
      data: new Date().toLocaleDateString("pt-BR"),
      fase: "",
      tipo: "medicamento",
      nome: "",
      veterinario: "",
      quantidade: 0,
      observacoes: "",
      proxima_dose: "",
      data_proxima: ""
    }
    setEditingLoteData(prev => ({ ...prev, aplicacoes: [...prev.aplicacoes, newApp] }))
  }

  const handleUpdateAplicacaoLocal = (index: number, field: string, value: any) => {
    setEditingLoteData(prev => {
      const newApps = [...prev.aplicacoes]
      newApps[index] = { ...newApps[index], [field]: value }
      return { ...prev, aplicacoes: newApps }
    })
  }

  const handleRemoveAplicacaoLocal = (index: number) => {
    setEditingLoteData(prev => {
      const newApps = [...prev.aplicacoes]
      newApps.splice(index, 1)
      return { ...prev, aplicacoes: newApps }
    })
  }

  const handleAddVisitaLocal = () => {
    if (!editingLoteData.lote) return
    const newVisita: any = {
      id: `temp-${Date.now()}`,
      lote_id: editingLoteData.lote.id,
      data: new Date().toLocaleDateString("pt-BR"),
      tipo_procedimento: "",
      veterinario: "",
      observacoes: ""
    }
    setEditingLoteData(prev => ({ ...prev, visitas: [...prev.visitas, newVisita] }))
  }

  const handleUpdateVisitaLocal = (index: number, field: string, value: any) => {
    setEditingLoteData(prev => {
      const newVisitas = [...prev.visitas]
      newVisitas[index] = { ...newVisitas[index], [field]: value }
      return { ...prev, visitas: newVisitas }
    })
  }

  const handleRemoveVisitaLocal = (index: number) => {
    setEditingLoteData(prev => {
      const newVisitas = [...prev.visitas]
      newVisitas.splice(index, 1)
      return { ...prev, visitas: newVisitas }
    })
  }

  const handleAddMortalidadeLocal = () => {
    if (!editingLoteData.lote) return
    const newItem: any = {
      id: `temp-${Date.now()}`,
      lote_id: editingLoteData.lote.id,
      data: new Date().toLocaleDateString("pt-BR"),
      quantidade: 1,
      causa: "",
      observacoes: ""
    }
    setEditingLoteData(prev => ({ ...prev, mortalidade: [newItem, ...prev.mortalidade] }))
  }

  const handleUpdateMortalidadeLocal = (index: number, field: string, value: any) => {
    setEditingLoteData(prev => {
      const newMortalidade = [...prev.mortalidade]
      newMortalidade[index] = { ...newMortalidade[index], [field]: value }
      return { ...prev, mortalidade: newMortalidade }
    })
  }

  const handleRemoveMortalidadeLocal = (index: number) => {
    setEditingLoteData(prev => {
      const newMortalidade = [...prev.mortalidade]
      newMortalidade.splice(index, 1)
      return { ...prev, mortalidade: newMortalidade }
    })
  }

  const handleAddManejoLocal = () => {
    if (!editingLoteData.lote) return
    const newItem: HistoricoManejoItem = {
      id: `new-${Date.now()}`,
      data: new Date().toLocaleDateString("pt-BR"),
      periodo: "Manhã",
      hora: "08:00",
      ovos: 0,
      ovosDanificados: 0,
      racao: 0,
      porta: "",
      observacoes: ""
    }
    setEditingLoteData(prev => ({ ...prev, manejo: [newItem, ...prev.manejo] }))
  }

  const handleUpdateManejoLocal = (index: number, field: keyof HistoricoManejoItem, value: any) => {
    setEditingLoteData(prev => {
      const newManejo = [...prev.manejo]
      newManejo[index] = { ...newManejo[index], [field]: value }
      return { ...prev, manejo: newManejo }
    })
  }

  const handleRemoveManejoLocal = (index: number) => {
    setEditingLoteData(prev => {
      const newManejo = [...prev.manejo]
      newManejo.splice(index, 1)
      return { ...prev, manejo: newManejo }
    })
  }

  const handleFullEditChange = (field: string, value: any) => {
    if (!editingLoteData.lote) return
    setEditingLoteData(prev => ({
      ...prev,
      lote: { ...prev.lote!, [field]: value }
    }))
  }

  const historicalData = useMemo(() => {
    if (!editingLoteData.lote) return null
    const parseDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('/')
      return new Date(`${year}-${month}-${day}`)
    }
    const today = new Date()
    let startDate = parseDate(editingLoteData.lote.dataCompra)
    if (isNaN(startDate.getTime())) startDate = new Date()
    const daysDiff = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)))
    const dates: string[] = []
    for (let i = 0; i <= daysDiff; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      dates.push(d.toLocaleDateString('pt-BR'))
    }
    const mortalidadeMap = new Map<string, { qtd: number, causa: string }>()
    editingLoteData.mortalidade.forEach(m => {
      const current = mortalidadeMap.get(m.data) || { qtd: 0, causa: "" }
      mortalidadeMap.set(m.data, { qtd: current.qtd + m.quantidade, causa: current.causa ? `${current.causa}, ${m.causa}` : m.causa })
    })
    let accMortality = 0
    const mortalidadeData: HistoricoMortalidadeDia[] = dates.map(date => {
      const entry = mortalidadeMap.get(date)
      const qtd = entry ? entry.qtd : 0
      accMortality += qtd
      return { data: date.slice(0, 5), fullDate: date, quantidade: qtd, accumulated: accMortality, causa: entry ? entry.causa : "-" }
    })
    const manejoData = [...editingLoteData.manejo].sort((a, b) => parseDate(b.data).getTime() - parseDate(a.data).getTime())
    const consumoMap = new Map<string, number>()
    manejoData.forEach(item => {
      const current = consumoMap.get(item.data) || 0
      consumoMap.set(item.data, current + item.racao)
    })
    const consumoData: HistoricoConsumoDia[] = dates.map((date, i) => ({
      data: date.slice(0, 5), fullDate: date, racaoTotal: consumoMap.get(date) || 0, meta: Math.floor(50 + (i * 0.2))
    }))
    const saudeData: HistoricoSaudeItem[] = [
      ...editingLoteData.aplicacoes.map(app => ({ id: app.id, data: app.data, tipoEvento: "Aplicação", detalhe: app.nome, categoria: "preventivo", responsavel: app.veterinario, observacoes: app.observacoes })),
      ...editingLoteData.visitas.map(v => ({ id: v.id, data: v.data, tipoEvento: "Visita", detalhe: v.tipo_procedimento, categoria: "preventivo", responsavel: v.veterinario, observacoes: v.observacoes }))
    ].sort((a, b) => parseDate(b.data).getTime() - parseDate(a.data).getTime())
    return { mortalidadeData, consumoData, manejoData, saudeData }
  }, [editingLoteData])

  const filterDataByPeriod = (data: any[]) => {
    if (!data) return []
    if (historyPeriod === "todos" || historyPeriod === "ciclo") return data
    const count = historyPeriod === "30dias" ? 30 : historyPeriod === "7dias" ? 7 : 1
    return data.slice(-count)
  }

  const exportToCSV = (type: string) => {
    if (!historicalData) return
    let headers = ""
    let rows: any[] = []
    let filename = ""
    if (type === "mortalidade") {
      headers = "Data,Quantidade,Acumulado,Causa\n"
      rows = historicalData.mortalidadeData.map(d => `${d.fullDate},${d.quantidade},${d.accumulated},"${d.causa || ''}"`)
      filename = "historico_mortalidade.csv"
    }
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isLocked = editingId ? (lotes.find(l => l.id === editingId)?.femeas || 0) > 0 || (lotes.find(l => l.id === editingId)?.machos || 0) > 0 : false

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Animais</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="editar-lotes">Editar Lotes</TabsTrigger>
            <TabsTrigger value="cadastro">Cadastrar Lote</TabsTrigger>
            <TabsTrigger value="peso">Registrar Peso</TabsTrigger>
            <TabsTrigger value="sexo">Atualizar Sexo</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bird className="h-5 w-5 text-primary" />Cadastrar Lote</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input id="quantidade" name="quantidade" type="number" min="1" value={formCadastro.quantidade} onChange={handleCadastroChange} disabled={isLocked} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Select name="fornecedor" value={formCadastro.fornecedor} onValueChange={(v) => handleSelectChange("fornecedor", v, "cadastro")} disabled={isLocked}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {fornecedores.map((f: any) => <SelectItem key={f.id} value={f.cpf_cnpj}>{f.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data">Data da Compra</Label>
                    <div className="relative">
                      <Input id="data" name="data" value={formCadastro.data} onChange={(e) => handleDateChange(e, "cadastro")} placeholder="DD/MM/AAAA" disabled={isLocked} />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorLote">Valor Total</Label>
                    <Input id="valorLote" name="valorLote" type="number" min="0" step="0.01" value={formCadastro.valorLote} onChange={handleCadastroChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorAve">Valor por Ave</Label>
                    <Input id="valorAve" name="valorAve" type="number" min="0" step="0.01" value={formCadastro.valorAve} onChange={handleCadastroChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select name="tipo" value={formCadastro.tipo} onValueChange={(v) => handleSelectChange("tipo", v, "cadastro")}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pintainhas">Pintainhas</SelectItem>
                        <SelectItem value="frangas">Frangas</SelectItem>
                        <SelectItem value="adultas">Adultas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raca">Raça</Label>
                    <Input id="raca" name="raca" value={formCadastro.raca} onChange={handleCadastroChange} />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <Button className="flex-1" onClick={handleSaveLote}>{editingId ? "Salvar" : "Cadastrar"}</Button>
                  {editingId && <Button variant="outline" className="flex-1" onClick={cancelarEdicao}><X className="w-4 h-4 mr-2" />Cancelar</Button>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sexo" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Atualizar Sexo</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Lote</Label>
                    <Select value={formSexo.loteId} onValueChange={(v) => handleSelectChange("loteId", v, "sexo")}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {lotes.map(lote => <SelectItem key={lote.id} value={lote.id}>{lote.raca} - {lote.quantidade}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fêmeas</Label>
                    <Input type="number" value={formSexo.femeas} onChange={handleSexoChange} name="femeas" />
                  </div>
                  <div className="space-y-2">
                    <Label>Machos</Label>
                    <Input type="number" value={formSexo.machos} onChange={handleSexoChange} name="machos" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={atualizarSexoLote}>Atualizar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editar-lotes" className="space-y-4">
            {viewMode === "list" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /><Input placeholder="Buscar" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Fêmeas</TableHead>
                        <TableHead>Machos</TableHead>
                        <TableHead>Raça</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotes.filter(l => l.raca.toLowerCase().includes(searchTerm.toLowerCase())).map(lote => (
                        <TableRow key={lote.id}>
                          <TableCell className="font-medium">{lote.id.slice(0,8)}...</TableCell>
                          <TableCell>{lote.quantidade}</TableCell>
                          <TableCell>{lote.femeas}</TableCell>
                          <TableCell>{lote.machos}</TableCell>
                          <TableCell>{lote.raca}</TableCell>
                          <TableCell>{formatDateForDisplay(lote.data_compra)}</TableCell>
                          <TableCell>
                            <Button variant="secondary" size="sm" onClick={() => handleSelectLoteForEdit(lote)}><Edit className="h-4 w-4 mr-1" />Editar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setViewMode("list")}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Editar Lote</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input type="number" value={editingLoteData.lote?.quantidade || ""} onChange={(e) => handleFullEditChange("quantidade", Number.parseInt(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Raça</Label>
                        <Input value={editingLoteData.lote?.raca || ""} onChange={(e) => handleFullEditChange("raca", e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Syringe className="h-5 w-5" />Aplicações de Saúde<Button size="sm" onClick={handleAddAplicacaoLocal}><Plus className="h-4 w-4 mr-1" />Adicionar</Button></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {editingLoteData.aplicacoes.map((app, idx) => (
                      <div key={app.id} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input placeholder="Nome" value={app.nome} onChange={(e) => handleUpdateAplicacaoLocal(idx, "nome", e.target.value)} />
                          <Input placeholder="Data" value={app.data} onChange={(e) => handleUpdateAplicacaoLocal(idx, "data", e.target.value)} />
                          <Select value={app.tipo} onValueChange={(v) => handleUpdateAplicacaoLocal(idx, "tipo", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="vacina">Vacina</SelectItem><SelectItem value="medicamento">Medicamento</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <Button variant="destructive" className="mt-2" onClick={() => handleRemoveAplicacaoLocal(idx)}><Trash2 className="h-4 w-4 mr-1" />Remover</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" />Visitas Veterinárias<Button size="sm" onClick={handleAddVisitaLocal}><Plus className="h-4 w-4 mr-1" />Adicionar</Button></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {editingLoteData.visitas.map((visita, idx) => (
                      <div key={visita.id} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input placeholder="Procedimento" value={visita.tipo_procedimento} onChange={(e) => handleUpdateVisitaLocal(idx, "tipo_procedimento", e.target.value)} />
                          <Input placeholder="Veterinário" value={visita.veterinario} onChange={(e) => handleUpdateVisitaLocal(idx, "veterinario", e.target.value)} />
                        </div>
                        <Button variant="destructive" className="mt-2" onClick={() => handleRemoveVisitaLocal(idx)}><Trash2 className="h-4 w-4 mr-1" />Remover</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Mortalidade<Button size="sm" onClick={handleAddMortalidadeLocal}><Plus className="h-4 w-4 mr-1" />Adicionar</Button></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {editingLoteData.mortalidade.map((mort, idx) => (
                      <div key={mort.id} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input placeholder="Data" value={mort.data} onChange={(e) => handleUpdateMortalidadeLocal(idx, "data", e.target.value)} />
                          <Input placeholder="Quantidade" type="number" value={mort.quantidade} onChange={(e) => handleUpdateMortalidadeLocal(idx, "quantidade", Number.parseInt(e.target.value))} />
                          <Input placeholder="Causa" value={mort.causa} onChange={(e) => handleUpdateMortalidadeLocal(idx, "causa", e.target.value)} />
                        </div>
                        <Button variant="destructive" className="mt-2" onClick={() => handleRemoveMortalidadeLocal(idx)}><Trash2 className="h-4 w-4 mr-1" />Remover</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button className="w-full" onClick={handleSaveFullEdit}><Save className="h-4 w-4 mr-2" />Salvar Tudo</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
