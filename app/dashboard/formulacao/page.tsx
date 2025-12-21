"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DashboardLayout from "@/components/dashboard-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Wheat,
  Calculator,
  Save,
  Plus,
  Trash2,
  Edit,
  Copy,
  AlertCircle,
  Check,
  BarChart3,
  PieChart,
  Egg,
  Bird,
  DollarSign,
  Syringe,
  Calendar,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useTips } from "@/contexts/tips-context"
import { useRouter as useNextRouter } from "next/navigation"

// Definição dos tipos de dados
interface Ingrediente {
  id: string
  nome: string
  proteina: number
  energia: number
  calcio: number
  fosforo: number
  metionina: number
  lisina: number
  fibra: number
  preco: number
  estoque: number
}

interface ItemFormulacao {
  ingredienteId: string
  percentual: number
}

interface Formulacao {
  id: string
  nome: string
  descricao: string
  fase: "inicial" | "crescimento" | "postura"
  itens: ItemFormulacao[]
  dataCriacao: string
  ultimaModificacao: string
  ativa: boolean
  duracaoDias?: number
  quantidadeTotal?: number
  consumoDiario?: number
  loteId?: string
  ajusteAmbiental?: { temperatura: string; forrageamento: number }
  dataTerminoPrevista?: string
}

interface ValoresNutricionais {
  proteina: number
  energia: number
  calcio: number
  fosforo: number
  metionina: number
  lisina: number
  fibra: number
  custo: number
}

interface RequisitosNutricionais {
  fase: "inicial" | "crescimento" | "postura"
  proteina: { min: number; max: number }
  energia: { min: number; max: number }
  calcio: { min: number; max: number }
  fosforo: { min: number; max: number }
  metionina: { min: number; max: number }
  lisina: { min: number; max: number }
  fibra: { min: number; max: number }
}

type DuracaoRacao = {
  duracaoDias: number
  consumoDiario: number
  quantidadeTotal: number
  dataTermino: string
}

export default function FormulacaoPage() {
  const { toast } = useToast()
  const { recordAction } = useTips()
  const router = useNextRouter()
  const [activeTab, setActiveTab] = useState("criar")
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [formulacoes, setFormulacoes] = useState<Formulacao[]>([])
  const [estoqueIngredientes, setEstoqueIngredientes] = useState<{ [key: string]: number }>({})
  const [lotes, setLotes] = useState<{ id: string; quantidade: number; dataCompra?: string }[]>([
    { id: "Lote A", quantidade: 1000, dataCompra: "10/01/2024" },
    { id: "Lote B", quantidade: 1500, dataCompra: "15/02/2024" },
    { id: "Lote C", quantidade: 2000, dataCompra: "20/03/2024" },
  ])

  // Estado para histórico de compras de ingredientes
  const [historicoCompras, setHistoricoCompras] = useState<{ [key: string]: { data: string; preco: number }[] }>({})
  // Estado para estoque de rações formuladas
  const [estoqueRacoes, setEstoqueRacoes] = useState<{ id: string; nome: string; quantidade: number; fase: string }[]>(
    [],
  )
  // Estado para ranking de ingredientes mais utilizados
  const [rankingIngredientes, setRankingIngredientes] = useState<{ id: string; nome: string; usos: number }[]>([])

  // Estado para nova formulação
  const [novaFormulacao, setNovaFormulacao] = useState<{
    nome: string
    descricao: string
    fase: "inicial" | "crescimento" | "postura"
    itens: ItemFormulacao[]
  }>({
    nome: "",
    descricao: "",
    fase: "inicial",
    itens: [],
  })

  // Estado para formulação selecionada para edição
  const [formulacaoSelecionada, setFormulacaoSelecionada] = useState<string | null>(null)
  const [loteSelecionado, setLoteSelecionado] = useState<string>("none")

  // Estado para valores nutricionais calculados
  const [valoresNutricionais, setValoresNutricionais] = useState<ValoresNutricionais>({
    proteina: 0,
    energia: 0,
    calcio: 0,
    fosforo: 0,
    metionina: 0,
    lisina: 0,
    fibra: 0,
    custo: 0,
  })

  // Estado para novo ingrediente
  const [novoIngrediente, setNovoIngrediente] = useState<Omit<Ingrediente, "id">>({
    nome: "",
    proteina: 0,
    energia: 0,
    calcio: 0,
    fosforo: 0,
    metionina: 0,
    lisina: 0,
    fibra: 0,
    preco: 0,
    estoque: 0,
  })

  // Adicionar novos estados para ajustes e visualização prévia
  // Adicionar após a declaração dos estados existentes, antes do useEffect
  const [previsaoDuracao, setPrevisaoDuracao] = useState<DuracaoRacao | null>(null)

  const [ajusteAmbiental, setAjusteAmbiental] = useState({
    temperatura: "normal", // "frio", "normal", "quente"
    forrageamento: 0, // Percentual de alimentação obtido por forrageamento (0-50%)
  })

  const [isQuantidadeDialogOpen, setIsQuantidadeDialogOpen] = useState(false)
  const [quantidadeInput, setQuantidadeInput] = useState("")
  const [quantidadeUnit, setQuantidadeUnit] = useState<"kg" | "g">("kg")

  // Requisitos nutricionais por fase
  const requisitosNutricionais: RequisitosNutricionais[] = [
    {
      fase: "inicial",
      proteina: { min: 20, max: 22 },
      energia: { min: 2900, max: 3100 },
      calcio: { min: 0.9, max: 1.1 },
      fosforo: { min: 0.45, max: 0.55 },
      metionina: { min: 0.45, max: 0.55 },
      lisina: { min: 1.1, max: 1.3 },
      fibra: { min: 3, max: 5 },
    },
    {
      fase: "crescimento",
      proteina: { min: 16, max: 18 },
      energia: { min: 2800, max: 3000 },
      calcio: { min: 0.8, max: 1.0 },
      fosforo: { min: 0.4, max: 0.5 },
      metionina: { min: 0.35, max: 0.45 },
      lisina: { min: 0.8, max: 1.0 },
      fibra: { min: 4, max: 6 },
    },
    {
      fase: "postura",
      proteina: { min: 16, max: 18 },
      energia: { min: 2700, max: 2900 },
      calcio: { min: 3.5, max: 4.5 },
      fosforo: { min: 0.35, max: 0.45 },
      metionina: { min: 0.3, max: 0.4 },
      lisina: { min: 0.7, max: 0.9 },
      fibra: { min: 3, max: 5 },
    },
  ]

  function calcularDuracaoRacao(
    quantidadeTotal: number,
    loteId: string,
    fase: "inicial" | "crescimento" | "postura",
    ajustes = { temperatura: "normal", forrageamento: 0 },
  ): DuracaoRacao {
    const consumoPorFase = {
      inicial: 0.04,
      crescimento: 0.08,
      postura: 0.11,
    }
    const lote = lotes.find((l) => l.id === loteId)
    if (!lote || !lote.quantidade) return { duracaoDias: 0, consumoDiario: 0, quantidadeTotal: 0, dataTermino: "" }
    const numeroAves = lote.quantidade
    const consumoDiarioPorAve = consumoPorFase[fase]
    let fatorTemperatura = 1.0
    if (ajustes.temperatura === "frio") fatorTemperatura = 1.15
    if (ajustes.temperatura === "quente") fatorTemperatura = 0.9
    const fatorForrageamento = Math.max(0, 1 - ajustes.forrageamento / 100)
    const consumoDiarioTotal = numeroAves * consumoDiarioPorAve * fatorTemperatura * fatorForrageamento
    if (consumoDiarioTotal <= 0) return { duracaoDias: 0, consumoDiario: 0, quantidadeTotal: 0, dataTermino: "" }
    const duracaoDias = Math.floor(quantidadeTotal / consumoDiarioTotal)
    const hoje = new Date()
    const dataTermino = new Date(hoje)
    dataTermino.setDate(hoje.getDate() + duracaoDias)
    return {
      duracaoDias,
      consumoDiario: Number.parseFloat(consumoDiarioTotal.toFixed(2)),
      quantidadeTotal,
      dataTermino: dataTermino.toLocaleDateString("pt-BR"),
    }
  }

  function atualizarPrevisaoDuracao() {
    if (loteSelecionado === "none" || !novaFormulacao.fase) return
    const loteAtual = lotes.find((l) => l.id === loteSelecionado)
    if (!loteAtual) return
    const consumoPorFase = { inicial: 0.04, crescimento: 0.08, postura: 0.11 }
    const quantidadeTotal = 30 * loteAtual.quantidade * consumoPorFase[novaFormulacao.fase]
    const resultado = calcularDuracaoRacao(quantidadeTotal, loteAtual.id, novaFormulacao.fase, ajusteAmbiental)
    setPrevisaoDuracao(resultado)
  }

  useEffect(() => {
    // Carregar dados do localStorage
    loadData()
  }, [])

  useEffect(() => {
    // Calcular valores nutricionais quando a formulação muda
    calcularValoresNutricionais()
  }, [novaFormulacao.itens, ingredientes])

  useEffect(() => {
    // Carregar lotes do localStorage
    const savedLotes = localStorage.getItem("lotes")
    if (savedLotes) {
      try {
        setLotes(JSON.parse(savedLotes))
      } catch (e) {
        console.error("Erro ao carregar lotes:", e)
      }
    }
  }, [])

  useEffect(() => {
    // Recarregar dados quando a aba ativa muda para "criar" ou "ingredientes"
    if (activeTab === "criar" || activeTab === "ingredientes") {
      loadData()
    }
  }, [activeTab])

  // Adicionar useEffect para atualizar a previsão quando o lote ou fase mudar
  // Adicionar após os useEffects existentes
  useEffect(() => {
    if (loteSelecionado !== "none") {
      atualizarPrevisaoDuracao()
    } else {
      setPrevisaoDuracao(null)
    }
  }, [loteSelecionado, novaFormulacao.fase, ajusteAmbiental])

  const loadData = () => {
    const ingredientesData = JSON.parse(localStorage.getItem("ingredientes") || "[]")
    const formulacoesData = JSON.parse(localStorage.getItem("formulacoes") || "[]")
    const estoqueIngredientesData = JSON.parse(localStorage.getItem("estoqueIngredientes") || "{}")

    setIngredientes(ingredientesData)
    setFormulacoes(formulacoesData)
    setEstoqueIngredientes(estoqueIngredientesData)

    // Carregar histórico de compras
    const comprasData = JSON.parse(localStorage.getItem("compras") || "[]")
    const historico: { [key: string]: { data: string; preco: number }[] } = {}

    // Processar compras para extrair histórico de preços
    comprasData.forEach((compra: any) => {
      if (compra.categoria === "Ração" && compra.quantidade > 0) {
        const tipo = compra.tipo
        const preco = compra.valor / compra.quantidade // Preço por kg

        if (!historico[tipo]) {
          historico[tipo] = []
        }

        historico[tipo].push({
          data: compra.data,
          preco,
        })

        // Ordenar por data (mais recente primeiro)
        historico[tipo].sort((a, b) => {
          const dataA = new Date(a.data.split("/").reverse().join("-"))
          const dataB = new Date(b.data.split("/").reverse().join("-"))
          return dataB.getTime() - dataA.getTime()
        })
      }
    })

    setHistoricoCompras(historico)

    // Carregar estoque de rações formuladas
    const racoesEstoque = JSON.parse(localStorage.getItem("estoqueRacoes") || "[]")
    setEstoqueRacoes(racoesEstoque)

    // Calcular ranking de ingredientes mais utilizados
    const ranking: { [key: string]: { id: string; nome: string; usos: number } } = {}

    // Contar usos em formulações
    formulacoesData.forEach((formulacao: any) => {
      formulacao.itens.forEach((item: any) => {
        if (item.percentual > 0) {
          const ingrediente = ingredientesData.find((ing: any) => ing.id === item.ingredienteId)
          if (ingrediente) {
            if (!ranking[ingrediente.id]) {
              ranking[ingrediente.id] = {
                id: ingrediente.id,
                nome: ingrediente.nome,
                usos: 0,
              }
            }
            ranking[ingrediente.id].usos += 1
          }
        }
      })
    })

    // Converter para array e ordenar
    const rankingArray = Object.values(ranking).sort((a, b) => b.usos - a.usos)
    setRankingIngredientes(rankingArray)

    // Atualizar a nova formulação para incluir todos os ingredientes disponíveis
    if (ingredientesData.length > 0) {
      setNovaFormulacao((prev) => {
        // Obter IDs dos ingredientes já na formulação
        const idsAtuais = prev.itens.map((item) => item.ingredienteId)

        // Criar itens para novos ingredientes
        const novosItens = (ingredientesData as Ingrediente[])
          .filter((ing: Ingrediente) => !idsAtuais.includes(ing.id))
          .map((ing: Ingrediente) => ({
            ingredienteId: ing.id,
            percentual: 0,
          }))

        // Combinar itens existentes com novos itens
        return {
          ...prev,
          itens: [...prev.itens, ...novosItens],
        }
      })
    }
  }

  const handleFormulacaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNovaFormulacao((prev) => ({ ...prev, [name]: value }))
  }

  // Modificar a função handleFaseChange para atualizar a previsão
  // Substituir a função handleFaseChange existente
  const handleFaseChange = (fase: "inicial" | "crescimento" | "postura") => {
    setNovaFormulacao((prev) => ({ ...prev, fase }))

    // Atualizar previsão de duração se um lote estiver selecionado
    if (loteSelecionado !== "none") {
      setTimeout(atualizarPrevisaoDuracao, 100)
    }
  }

  // Modificar a função handleLoteChange para chamar atualizarPrevisaoDuracao
  // Substituir a função handleLoteChange existente
  const handleLoteChange = (loteId: string) => {
    setLoteSelecionado(loteId)

    // If "none" is selected, just return without updating the phase
    if (loteId === "none") {
      setPrevisaoDuracao(null)
      return
    }

    // Encontrar o lote selecionado
    const lote = lotes.find((l) => l.id === loteId)
    if (!lote) return

    // Determinar a fase com base na data de compra do lote
    const lotesData = JSON.parse(localStorage.getItem("lotes") || "[]")
    const loteCompleto = lotesData.find((l: any) => l.id === loteId)

    if (loteCompleto && loteCompleto.dataCompra) {
      const hoje = new Date()
      const dataCompra = new Date(loteCompleto.dataCompra.split("/").reverse().join("-"))
      const dias = Math.floor((hoje.getTime() - dataCompra.getTime()) / (1000 * 60 * 60 * 24))

      let fase: "inicial" | "crescimento" | "postura" = "inicial"
      let faseDescricao = ""

      if (dias < 42) {
        fase = "inicial"
        faseDescricao = "Inicial (0-6 semanas)"
      } else if (dias < 112) {
        fase = "crescimento"
        faseDescricao = "Crescimento (7-17 semanas)"
      } else {
        fase = "postura"
        faseDescricao = "Postura (18+ semanas)"
      }

      // Atualizar a fase na formulação
      setNovaFormulacao((prev) => ({ ...prev, fase }))

      // Mostrar feedback
      toast({
        title: "Fase determinada automaticamente",
        description: `Lote com ${dias} dias - Fase: ${faseDescricao}`,
      })

      // Atualizar previsão de duração
      setTimeout(atualizarPrevisaoDuracao, 100)
    }
  }

  const handleIngredienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Converter para número se for um campo numérico
    const numericFields = [
      "proteina",
      "energia",
      "calcio",
      "fosforo",
      "metionina",
      "lisina",
      "fibra",
      "preco",
      "estoque",
    ]
    const newValue = numericFields.includes(name) ? Number.parseFloat(value) || 0 : value

    setNovoIngrediente((prev) => ({ ...prev, [name]: newValue }))
  }

  const handlePercentualChange = (ingredienteId: string, percentual: number) => {
    setNovaFormulacao((prev) => ({
      ...prev,
      itens: prev.itens.map((item) => (item.ingredienteId === ingredienteId ? { ...item, percentual } : item)),
    }))
  }

  const calcularValoresNutricionais = () => {
    if (novaFormulacao.itens.length === 0 || ingredientes.length === 0) {
      setValoresNutricionais({
        proteina: 0,
        energia: 0,
        calcio: 0,
        fosforo: 0,
        metionina: 0,
        lisina: 0,
        fibra: 0,
        custo: 0,
      })
      return
    }

    // Inicializar valores
    let proteina = 0
    let energia = 0
    let calcio = 0
    let fosforo = 0
    let metionina = 0
    let lisina = 0
    let fibra = 0
    let custo = 0

    // Calcular valores nutricionais baseados na percentagem de cada ingrediente
    novaFormulacao.itens.forEach((item) => {
      const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
      if (ingrediente && item.percentual > 0) {
        const fator = item.percentual / 100
        proteina += ingrediente.proteina * fator
        energia += ingrediente.energia * fator
        calcio += ingrediente.calcio * fator
        fosforo += ingrediente.fosforo * fator
        metionina += ingrediente.metionina * fator
        lisina += ingrediente.lisina * fator
        fibra += ingrediente.fibra * fator
        custo += ingrediente.preco * fator
      }
    })

    setValoresNutricionais({
      proteina,
      energia,
      calcio,
      fosforo,
      metionina,
      lisina,
      fibra,
      custo,
    })
  }

  const verificarRequisitosNutricionais = () => {
    const requisitos = requisitosNutricionais.find((req) => req.fase === novaFormulacao.fase)
    if (!requisitos) return {}

    // Verificar se os valores nutricionais atendem aos requisitos
    const resultado: { [key: string]: "baixo" | "adequado" | "alto" } = {}

    if (valoresNutricionais.proteina < requisitos.proteina.min) {
      resultado.proteina = "baixo"
    } else if (valoresNutricionais.proteina > requisitos.proteina.max) {
      resultado.proteina = "alto"
    } else {
      resultado.proteina = "adequado"
    }

    if (valoresNutricionais.energia < requisitos.energia.min) {
      resultado.energia = "baixo"
    } else if (valoresNutricionais.energia > requisitos.energia.max) {
      resultado.energia = "alto"
    } else {
      resultado.energia = "adequado"
    }

    if (valoresNutricionais.calcio < requisitos.calcio.min) {
      resultado.calcio = "baixo"
    } else if (valoresNutricionais.calcio > requisitos.calcio.max) {
      resultado.calcio = "alto"
    } else {
      resultado.calcio = "adequado"
    }

    if (valoresNutricionais.fosforo < requisitos.fosforo.min) {
      resultado.fosforo = "baixo"
    } else if (valoresNutricionais.fosforo > requisitos.fosforo.max) {
      resultado.fosforo = "alto"
    } else {
      resultado.fosforo = "adequado"
    }

    if (valoresNutricionais.metionina < requisitos.metionina.min) {
      resultado.metionina = "baixo"
    } else if (valoresNutricionais.metionina > requisitos.metionina.max) {
      resultado.metionina = "alto"
    } else {
      resultado.metionina = "adequado"
    }

    if (valoresNutricionais.lisina < requisitos.lisina.min) {
      resultado.lisina = "baixo"
    } else if (valoresNutricionais.lisina > requisitos.lisina.max) {
      resultado.lisina = "alto"
    } else {
      resultado.lisina = "adequado"
    }

    if (valoresNutricionais.fibra < requisitos.fibra.min) {
      resultado.fibra = "baixo"
    } else if (valoresNutricionais.fibra > requisitos.fibra.max) {
      resultado.fibra = "alto"
    } else {
      resultado.fibra = "adequado"
    }

    return resultado
  }

  const verificarTotalPercentual = () => {
    const total = novaFormulacao.itens.reduce((sum, item) => sum + item.percentual, 0)
    return Math.round(total * 100) / 100 // Arredondar para 2 casas decimais
  }

  // Adicionar uma função para verificar estoque disponível e mostrar alertas
  // Adicionar após a função verificarTotalPercentual

  const verificarEstoqueIngredientes = () => {
    // Verificar se há estoque suficiente para os ingredientes selecionados
    const ingredientesComEstoqueBaixo = novaFormulacao.itens
      .filter((item) => item.percentual > 0)
      .map((item) => {
        const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
        if (!ingrediente) return null

        // Verificar se o estoque está baixo (menos de 10kg ou menos de 20% do necessário)
        const estoqueBaixo =
          ingrediente.estoque < 10 || (ingrediente.estoque < 50 && ingrediente.estoque < item.percentual * 0.2)

        return estoqueBaixo ? ingrediente : null
      })
      .filter(Boolean)

    return ingredientesComEstoqueBaixo
  }

  


  const calcularConsumoMedioManejo = (loteId: string, days: number = 7): number => {
    const manejoDiaData = JSON.parse(localStorage.getItem("manejoDia") || "{}")
    const entries = Object.keys(manejoDiaData)
      .map((dateStr) => {
        const dia = manejoDiaData[dateStr] || {}
        let total = 0
        if (dia.manha && dia.manha.loteId === loteId) total += Number(dia.manha.racao || 0)
        if (dia.tarde && dia.tarde.loteId === loteId) total += Number(dia.tarde.racao || 0)
        const ts = new Date(dateStr.split("/").reverse().join("-")).getTime()
        return { ts, total }
      })
      .filter((e: any) => e.total > 0)
    entries.sort((a: any, b: any) => b.ts - a.ts)
    const slice = entries.slice(0, Math.min(days, entries.length))
    if (slice.length === 0) return 0
    const sum = slice.reduce((s: number, e: any) => s + e.total, 0)
    return sum / slice.length
  }

  const salvarFormulacao = () => {
    const { nome, descricao, fase, itens } = novaFormulacao

    if (!nome) {
      toast({
        title: "Erro",
        description: "Informe um nome para a formulação!",
        variant: "destructive",
      })
      return
    }

    // Verificar se o total é 100%
    const total = verificarTotalPercentual()
    if (total !== 100) {
      toast({
        title: "Erro",
        description: `O total dos ingredientes deve ser 100%. Atual: ${total}%`,
        variant: "destructive",
      })
      return
    }

    // Modificar a função salvarFormulacao para verificar o estoque antes de salvar
    // Localizar a função salvarFormulacao e adicionar a verificação de estoque após a validação do total

    // Adicionar após a verificação do total (total !== 100)
    const ingredientesComEstoqueBaixo = verificarEstoqueIngredientes()
    if (ingredientesComEstoqueBaixo.length > 0) {
      // Mostrar alerta, mas permitir continuar
      toast({
        title: "Alerta de Estoque",
        description: `Estoque baixo para: ${ingredientesComEstoqueBaixo.map((ing: any) => ing.nome).join(", ")}`,
        variant: "warning",
      })
    }

    // Filtrar ingredientes com percentual > 0
    const itensAtivos = itens.filter((item) => item.percentual > 0)

    if (itensAtivos.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um ingrediente à formulação!",
        variant: "destructive",
      })
      return
    }

    const hoje = new Date().toLocaleDateString("pt-BR")

    // Verificar se é uma edição ou nova formulação
    if (formulacaoSelecionada) {
      // Edição
      const formulacoesAtualizadas = formulacoes.map((form) => {
        if (form.id === formulacaoSelecionada) {
          return {
            ...form,
            nome,
            descricao,
            fase,
            itens: itensAtivos,
            ultimaModificacao: hoje,
          }
        }
        return form
      })

      setFormulacoes(formulacoesAtualizadas)
      localStorage.setItem("formulacoes", JSON.stringify(formulacoesAtualizadas))

      toast({
        title: "Sucesso",
        description: "Formulação atualizada com sucesso!",
      })

      recordAction("atualizar_formulacao")

      // Limpar seleção
      setFormulacaoSelecionada(null)
    } else {
      // Nova formulação
      const novaFormulacaoCompleta: Formulacao = {
        id: `form_${formulacoes.length + 1}`,
        nome,
        descricao,
        fase,
        itens: itensAtivos,
        dataCriacao: hoje,
        ultimaModificacao: hoje,
        ativa: false,
      }

      // Modificar a função salvarFormulacao para usar a versão melhorada do cálculo
      // Localizar o bloco dentro da função salvarFormulacao onde é feito o cálculo da duração
      // e substituir pelo seguinte (manter o resto da função intacto)
      // Localizar este trecho dentro da função salvarFormulacao:
      /*
if (loteSelecionado && loteSelecionado !== "none") {
  // Usar o lote selecionado para o cálculo
  const loteAtual = lotesDisponiveis.find((l: any) => l.id === loteSelecionado)

  if (loteAtual) {
    // Consumo médio diário por ave em kg, por fase
    const consumoPorFase = {
      inicial: 0.04, // 40g/ave/dia
      crescimento: 0.08, // 80g/ave/dia
      postura: 0.11, // 110g/ave/dia
    }

    // Calcular para 30 dias de alimentação
    const diasPadrao = 30
    const consumoDiario = loteAtual.quantidade * consumoPorFase[fase]
    const quantidadeTotal = consumoDiario * diasPadrao

    // Calcular a duração real com base na quantidade calculada
    const duracaoDias = calcularDuracaoRacao(quantidadeTotal, loteAtual.id, fase)

    // Adicionar à formulação
    novaFormulacaoCompleta.duracaoDias = duracaoDias
    novaFormulacaoCompleta.quantidadeTotal = Math.round(quantidadeTotal)
    novaFormulacaoCompleta.consumoDiario = Math.round(consumoDiario * 10) / 10
    novaFormulacaoCompleta.loteId = loteSelecionado

    // Mostrar toast com informação
    toast({
      title: "Cálculo de Duração",
      description: `A ração durará aproximadamente ${duracaoDias} dias para o lote ${loteAtual.id}.`,
    })
  }
}
*/
      // Substituir pelo seguinte:
      const lotesDisponiveis = JSON.parse(localStorage.getItem("lotes") || "[]")
      if (loteSelecionado && loteSelecionado !== "none") {
        // Usar o lote selecionado para o cálculo
        const loteAtual = lotesDisponiveis.find((l: any) => l.id === loteSelecionado)

        if (loteAtual) {
          // Usar a previsão já calculada ou calcular novamente
          const quantidadeRef = previsaoDuracao ? previsaoDuracao.quantidadeTotal : 100
          const resultado =
            previsaoDuracao ?? calcularDuracaoRacao(quantidadeRef, loteAtual.id, fase, ajusteAmbiental)

          // Adicionar à formulação
          novaFormulacaoCompleta.duracaoDias = resultado.duracaoDias
          novaFormulacaoCompleta.quantidadeTotal = resultado.quantidadeTotal
          novaFormulacaoCompleta.consumoDiario = resultado.consumoDiario
          novaFormulacaoCompleta.loteId = loteSelecionado
          novaFormulacaoCompleta.ajusteAmbiental = ajusteAmbiental
          novaFormulacaoCompleta.dataTerminoPrevista = resultado.dataTermino

          // Mostrar toast com informação mais detalhada
          toast({
            title: "Cálculo de Duração",
            description: `A ração durará aproximadamente ${resultado.duracaoDias} dias para o lote ${loteAtual.id}. Previsão de término: ${resultado.dataTermino}.`,
          })

          // Verificar se a duração é muito curta ou muito longa
          if (resultado.duracaoDias < 7) {
            toast({
              title: "Atenção",
              description: "A duração calculada é menor que 7 dias. Considere aumentar a quantidade de ração.",
              variant: "warning",
            })
          } else if (resultado.duracaoDias > 45) {
            toast({
              title: "Atenção",
              description:
                "A duração calculada é maior que 45 dias. A ração pode perder qualidade se armazenada por muito tempo.",
              variant: "warning",
            })
          }
        }
      }

      const formulacoesAtualizadas = [...formulacoes, novaFormulacaoCompleta]
      setFormulacoes(formulacoesAtualizadas)
      localStorage.setItem("formulacoes", JSON.stringify(formulacoesAtualizadas))

      toast({
        title: "Sucesso",
        description: "Formulação criada com sucesso!",
      })

      recordAction("criar_formulacao")
    }

    // Diminuir o estoque dos ingredientes utilizados
    const ingredientesAtualizados = [...ingredientes]
    let estoqueInsuficiente = false

    // Verificar se há estoque suficiente para todos os ingredientes
    itensAtivos.forEach((item) => {
      const ingrediente = ingredientesAtualizados.find((ing) => ing.id === item.ingredienteId)
      if (ingrediente) {
        // Calcular quantidade necessária em kg
        // Assumindo que a formulação é para 100kg de ração
        const quantidadeNecessaria = (item.percentual / 100) * 100 // kg

        if (ingrediente.estoque < quantidadeNecessaria) {
          estoqueInsuficiente = true
          toast({
            title: "Estoque insuficiente",
            description: `Não há estoque suficiente de ${ingrediente.nome}. Necessário: ${quantidadeNecessaria.toFixed(2)}kg, Disponível: ${ingrediente.estoque.toFixed(2)}kg`,
            variant: "destructive",
          })
        }
      }
    })

    // Se não houver estoque suficiente, perguntar se deseja continuar
    if (estoqueInsuficiente) {
      if (!confirm("Estoque insuficiente para alguns ingredientes. Deseja continuar mesmo assim?")) {
        return
      }
    }

    // Diminuir o estoque
    itensAtivos.forEach((item) => {
      const ingredienteIndex = ingredientesAtualizados.findIndex((ing) => ing.id === item.ingredienteId)
      if (ingredienteIndex >= 0) {
        // Calcular quantidade necessária em kg
        const quantidadeNecessaria = (item.percentual / 100) * 100 // kg

        // Diminuir estoque (não permitir estoque negativo)
        ingredientesAtualizados[ingredienteIndex].estoque = Math.max(
          0,
          ingredientesAtualizados[ingredienteIndex].estoque - quantidadeNecessaria,
        )
      }
    })

    // Salvar ingredientes atualizados
    setIngredientes(ingredientesAtualizados)
    localStorage.setItem("ingredientes", JSON.stringify(ingredientesAtualizados))

    // Adicionar à lista de rações em estoque
    const novaRacao = {
      id: formulacaoSelecionada || `form_${estoqueRacoes.length + 1}`,
      nome: nome,
      quantidade: 100, // Assumindo que cada formulação produz 100kg de ração
      fase: fase,
    }

    const racoesAtualizadas = [...estoqueRacoes, novaRacao]
    setEstoqueRacoes(racoesAtualizadas)
    localStorage.setItem("estoqueRacoes", JSON.stringify(racoesAtualizadas))

    // Atualizar ranking de ingredientes
    const rankingAtualizado = [...rankingIngredientes]
    itensAtivos.forEach((item) => {
      const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
      if (ingrediente) {
        const rankingIndex = rankingAtualizado.findIndex((r) => r.id === ingrediente.id)
        if (rankingIndex >= 0) {
          rankingAtualizado[rankingIndex].usos += 1
        } else {
          rankingAtualizado.push({
            id: ingrediente.id,
            nome: ingrediente.nome,
            usos: 1,
          })
        }
      }
    })

    // Ordenar ranking
    rankingAtualizado.sort((a, b) => b.usos - a.usos)
    setRankingIngredientes(rankingAtualizado)
    localStorage.setItem("rankingIngredientes", JSON.stringify(rankingAtualizado))

    // Resetar formulário
    resetarFormulacao()
  }

  const resetarFormulacao = () => {
    setNovaFormulacao({
      nome: "",
      descricao: "",
      fase: "inicial",
      itens: ingredientes.map((ing) => ({
        ingredienteId: ing.id,
        percentual: 0,
      })),
    })
    setFormulacaoSelecionada(null)
    setLoteSelecionado("none")
  }

  const editarFormulacao = (id: string) => {
    const formulacao = formulacoes.find((form) => form.id === id)
    if (!formulacao) return

    // Preparar itens para edição (incluir todos os ingredientes)
    const itensCompletos = ingredientes.map((ing) => {
      const itemExistente = formulacao.itens.find((item) => item.ingredienteId === ing.id)
      return {
        ingredienteId: ing.id,
        percentual: itemExistente ? itemExistente.percentual : 0,
      }
    })

    setNovaFormulacao({
      nome: formulacao.nome,
      descricao: formulacao.descricao,
      fase: formulacao.fase,
      itens: itensCompletos,
    })

    setFormulacaoSelecionada(id)
    setActiveTab("criar")
  }

  const duplicarFormulacao = (id: string) => {
    const formulacao = formulacoes.find((form) => form.id === id)
    if (!formulacao) return

    // Preparar itens para duplicação (incluir todos os ingredientes)
    const itensCompletos = ingredientes.map((ing) => {
      const itemExistente = formulacao.itens.find((item) => item.ingredienteId === ing.id)
      return {
        ingredienteId: ing.id,
        percentual: itemExistente ? itemExistente.percentual : 0,
      }
    })

    setNovaFormulacao({
      nome: `${formulacao.nome} (Cópia)`,
      descricao: formulacao.descricao,
      fase: formulacao.fase,
      itens: itensCompletos,
    })

    setActiveTab("criar")
  }

  const excluirFormulacao = (id: string) => {
    const formulacoesAtualizadas = formulacoes.filter((form) => form.id !== id)
    setFormulacoes(formulacoesAtualizadas)
    localStorage.setItem("formulacoes", JSON.stringify(formulacoesAtualizadas))

    toast({
      title: "Sucesso",
      description: "Formulação excluída com sucesso!",
    })
  }

  const ativarFormulacao = (id: string, ativa: boolean) => {
    const formulacoesAtualizadas = formulacoes.map((form) => {
      if (form.id === id) {
        return { ...form, ativa }
      }
      return form
    })

    setFormulacoes(formulacoesAtualizadas)
    localStorage.setItem("formulacoes", JSON.stringify(formulacoesAtualizadas))

    toast({
      title: "Sucesso",
      description: ativa ? "Formulação ativada com sucesso!" : "Formulação desativada com sucesso!",
    })
  }

  const analisarImpactoSaude = (id: string) => {
    const formulacao = formulacoes.find((form) => form.id === id)
    if (!formulacao) return

    // Buscar aplicações de saúde associadas a esta formulação
    const aplicacoesSaude = JSON.parse(localStorage.getItem("aplicacoesSaude") || "[]")
    const aplicacoesRelacionadas = aplicacoesSaude.filter((a: any) => a.formulacaoId === id)

    // Buscar histórico de formulações
    const _historicoFormulacoes = JSON.parse(localStorage.getItem("historicoFormulacoes") || "[]")

    // Verificar se há dados suficientes para análise
    if (aplicacoesRelacionadas.length === 0) {
      toast({
        title: "Análise",
        description: "Não há aplicações de saúde associadas a esta formulação para análise.",
      })
      return
    }

    // Agrupar aplicações por tipo
    const tiposAplicacao = aplicacoesRelacionadas.reduce((acc: any, curr: any) => {
      const key = `${curr.tipo}-${curr.nome}`
      if (!acc[key]) acc[key] = 0
      acc[key]++
      return acc
    }, {})

    // Exibir resultados da análise
    const mensagem = Object.entries(tiposAplicacao)
      .map(([tipo, count]) => `${tipo}: ${count} aplicações`)
      .join(", ")

    toast({
      title: "Análise de Impacto na Saúde",
      description: `Esta formulação está associada a: ${mensagem}`,
    })
  }

  const salvarIngrediente = () => {
    const { nome, proteina, energia, calcio, fosforo, metionina, lisina, fibra, preco, estoque } = novoIngrediente

    if (!nome) {
      toast({
        title: "Erro",
        description: "Informe um nome para o ingrediente!",
        variant: "destructive",
      })
      return
    }

    // Criar novo ingrediente
    const novoIngredienteCompleto: Ingrediente = {
      id: `ing_${Date.now()}`,
      nome,
      proteina,
      energia,
      calcio,
      fosforo,
      metionina,
      lisina,
      fibra,
      preco,
      estoque,
    }

    const ingredientesAtualizados = [...ingredientes, novoIngredienteCompleto]
    setIngredientes(ingredientesAtualizados)
    localStorage.setItem("ingredientes", JSON.stringify(ingredientesAtualizados))

    // Atualizar estoque
    const estoqueAtualizado = { ...estoqueIngredientes, [novoIngredienteCompleto.id]: estoque }
    setEstoqueIngredientes(estoqueAtualizado)
    localStorage.setItem("estoqueIngredientes", JSON.stringify(estoqueAtualizado))

    // Atualizar formulação atual para incluir o novo ingrediente
    setNovaFormulacao((prev) => ({
      ...prev,
      itens: [...prev.itens, { ingredienteId: novoIngredienteCompleto.id, percentual: 0 }],
    }))

    toast({
      title: "Sucesso",
      description: "Ingrediente adicionado com sucesso!",
    })

    // Resetar formulário
    setNovoIngrediente({
      nome: "",
      proteina: 0,
      energia: 0,
      calcio: 0,
      fosforo: 0,
      metionina: 0,
      lisina: 0,
      fibra: 0,
      preco: 0,
      estoque: 0,
    })
  }

  const excluirIngrediente = (id: string) => {
    // Verificar se o ingrediente está sendo usado em alguma formulação
    const emUso = formulacoes.some((form) =>
      form.itens.some((item) => item.ingredienteId === id && item.percentual > 0),
    )

    if (emUso) {
      toast({
        title: "Erro",
        description: "Este ingrediente está sendo usado em uma ou mais formulações!",
        variant: "destructive",
      })
      return
    }

    const ingredientesAtualizados = ingredientes.filter((ing) => ing.id !== id)
    setIngredientes(ingredientesAtualizados)
    localStorage.setItem("ingredientes", JSON.stringify(ingredientesAtualizados))

    // Remover do estoque
    const estoqueAtualizado = { ...estoqueIngredientes }
    delete estoqueAtualizado[id]
    setEstoqueIngredientes(estoqueAtualizado)
    localStorage.setItem("estoqueIngredientes", JSON.stringify(estoqueAtualizado))

    // Remover da formulação atual
    setNovaFormulacao((prev) => ({
      ...prev,
      itens: prev.itens.filter((item) => item.ingredienteId !== id),
    }))

    toast({
      title: "Sucesso",
      description: "Ingrediente excluído com sucesso!",
    })
  }

  const otimizarFormulacao = () => {
    // Implementação simplificada de otimização
    // Em um sistema real, isso usaria algoritmos mais complexos como programação linear

    const requisitos = requisitosNutricionais.find((req) => req.fase === novaFormulacao.fase)
    if (!requisitos) return

    // Ordenar ingredientes por custo/proteína (mais eficientes primeiro)
    const ingredientesOrdenados = [...ingredientes]
      .filter((ing) => ing.proteina > 0) // Evitar divisão por zero
      .sort((a, b) => a.preco / a.proteina - b.preco / b.proteina)

    // Inicializar com zero
    const novosPercentuais: { [key: string]: number } = {}
    ingredientes.forEach((ing) => {
      novosPercentuais[ing.id] = 0
    })

    // Distribuir percentuais começando pelos ingredientes mais eficientes
    let percentualRestante = 100
    const proteinaAlvo = (requisitos.proteina.min + requisitos.proteina.max) / 2
    let proteinaAtual = 0

    // Primeiro, adicionar ingredientes ricos em proteína até atingir o alvo
    for (const ing of ingredientesOrdenados) {
      if (percentualRestante <= 0 || proteinaAtual >= proteinaAlvo) break

      // Calcular quanto deste ingrediente precisamos para atingir o alvo de proteína
      const proteinaFaltante = proteinaAlvo - proteinaAtual
      const percentualNecessario = (proteinaFaltante / ing.proteina) * 100

      // Limitar ao percentual restante
      const percentualAdicionar = Math.min(percentualRestante, percentualNecessario, 30) // Máximo 30% de um ingrediente

      novosPercentuais[ing.id] = Math.round(percentualAdicionar * 10) / 10 // Arredondar para 1 casa decimal
      percentualRestante -= novosPercentuais[ing.id]
      proteinaAtual += (ing.proteina * novosPercentuais[ing.id]) / 100
    }

    // Distribuir o restante entre outros ingredientes importantes
    // Priorizar ingredientes com cálcio para fase de postura
    if (novaFormulacao.fase === "postura" && percentualRestante > 0) {
      const ingredientesCalcio = [...ingredientes]
        .filter((ing) => ing.calcio > 2) // Ingredientes ricos em cálcio
        .sort((a, b) => b.calcio - a.calcio)

      for (const ing of ingredientesCalcio) {
        if (percentualRestante <= 0) break

        const percentualAdicionar = Math.min(percentualRestante, 15) // Máximo 15% de calcário
        novosPercentuais[ing.id] = (novosPercentuais[ing.id] || 0) + Math.round(percentualAdicionar * 10) / 10
        percentualRestante -= percentualAdicionar
      }
    }

    // Distribuir o restante entre ingredientes energéticos
    if (percentualRestante > 0) {
      const ingredientesEnergia = [...ingredientes]
        .filter((ing) => ing.energia > 3000) // Ingredientes ricos em energia
        .sort((a, b) => a.preco / a.energia - b.preco / b.energia)

      for (const ing of ingredientesEnergia) {
        if (percentualRestante <= 0) break

        const percentualAdicionar = Math.min(percentualRestante, 40) // Máximo 40% de milho/energia
        novosPercentuais[ing.id] = (novosPercentuais[ing.id] || 0) + Math.round(percentualAdicionar * 10) / 10
        percentualRestante -= percentualAdicionar
      }
    }

    // Se ainda sobrar, distribuir entre os demais ingredientes
    if (percentualRestante > 0) {
      const outrosIngredientes = ingredientes
        .filter((ing) => novosPercentuais[ing.id] === 0)
        .sort((a, b) => a.preco - b.preco)

      for (const ing of outrosIngredientes) {
        if (percentualRestante <= 0) break

        const percentualAdicionar = Math.min(percentualRestante, 5) // Máximo 5% de outros
        novosPercentuais[ing.id] = Math.round(percentualAdicionar * 10) / 10
        percentualRestante -= percentualAdicionar
      }
    }

    // Se ainda sobrar, adicionar ao ingrediente mais barato
    if (percentualRestante > 0) {
      const maisBarato = [...ingredientes].sort((a, b) => a.preco - b.preco)[0]
      if (maisBarato) {
        novosPercentuais[maisBarato.id] =
          (novosPercentuais[maisBarato.id] || 0) + Math.round(percentualRestante * 10) / 10
      }
    }

    // Atualizar a formulação
    setNovaFormulacao((prev) => ({
      ...prev,
      itens: prev.itens.map((item) => ({
        ...item,
        percentual: novosPercentuais[item.ingredienteId] || 0,
      })),
    }))

    toast({
      title: "Otimização",
      description: "Formulação otimizada com base nos requisitos nutricionais e custo!",
    })
  }

  const getStatusBadge = (status: "baixo" | "adequado" | "alto") => {
    switch (status) {
      case "baixo":
        return <Badge variant="destructive">Baixo</Badge>
      case "adequado":
        return <Badge variant="outline">Adequado</Badge>
      case "alto":
        return <Badge variant="destructive">Alto</Badge>
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Formulação de Ração</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto md:overflow-visible" aria-label="Submenus de formulação">
            <TabsList className="flex w-full flex-wrap gap-2 md:grid md:grid-cols-4 md:gap-0 min-w-max">
              <TabsTrigger value="criar" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Criar Formulação
              </TabsTrigger>
              <TabsTrigger value="ingredientes" className="flex items-center gap-2">
                <Wheat className="h-4 w-4" />
                Ingredientes
              </TabsTrigger>
              <TabsTrigger value="formulacoes" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Formulações Salvas
              </TabsTrigger>
              <TabsTrigger value="estoque" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Estoque
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="criar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  {formulacaoSelecionada ? "Editar Formulação" : "Nova Formulação"}
                </CardTitle>
                <CardDescription>Crie uma formulação de ração personalizada para suas aves</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Formulação</Label>
                      <Input
                        id="nome"
                        name="nome"
                        value={novaFormulacao.nome}
                        onChange={handleFormulacaoChange}
                        placeholder="Ex: Ração para Poedeiras"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fase">Fase</Label>
                      <Select
                        value={novaFormulacao.fase}
                        onValueChange={(value: "inicial" | "crescimento" | "postura") => handleFaseChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inicial">Inicial (0-6 semanas)</SelectItem>
                          <SelectItem value="crescimento">Crescimento (7-17 semanas)</SelectItem>
                          <SelectItem value="postura">Postura (18+ semanas)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Componente de visualização prévia da duração */}

                    <div className="space-y-2">
                      <Label htmlFor="lote">Lote</Label>
                      <Select value={loteSelecionado} onValueChange={(value) => handleLoteChange(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um lote (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {lotes.map((lote) => (
                            <SelectItem key={lote.id} value={lote.id}>
                              {lote.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        Ao selecionar um lote, a fase será determinada automaticamente com base na idade das aves
                      </div>
                    </div>
                    {loteSelecionado !== "none" && (
                      <div className="space-y-4 mt-4 p-4 border rounded-md bg-blue-50">
                        <h4 className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>Previsão de Duração da Ração</span>
                        </h4>

                        {previsaoDuracao ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Quantidade total:</div>
                              <div className="font-medium">
                                {quantidadeUnit === "g"
                                  ? `${Math.round(previsaoDuracao.quantidadeTotal * 1000)} g`
                                  : `${previsaoDuracao.quantidadeTotal.toFixed(1)} kg`}
                              </div>

                              <div>Consumo diário:</div>
                              <div className="font-medium">
                                {quantidadeUnit === "g"
                                  ? `${Math.round(previsaoDuracao.consumoDiario * 1000)} g/dia`
                                  : `${previsaoDuracao.consumoDiario.toFixed(1)} kg/dia`}
                              </div>

                              <div>Duração estimada:</div>
                              <div className="font-medium">{previsaoDuracao.duracaoDias} dias</div>

                              <div>Data prevista de término:</div>
                              <div className="font-medium">{previsaoDuracao.dataTermino}</div>
                            </div>

                            <div className="space-y-2 mt-4">
                              <Label>Ajuste para Temperatura</Label>
                              <Select
                                value={ajusteAmbiental.temperatura}
                                onValueChange={(value) =>
                                  setAjusteAmbiental((prev) => ({ ...prev, temperatura: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o ajuste de temperatura" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="frio">Clima Frio (+15% consumo)</SelectItem>
                                  <SelectItem value="normal">Clima Normal</SelectItem>
                                  <SelectItem value="quente">Clima Quente (-10% consumo)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label htmlFor="ajusteForrageamento">Forrageamento (acesso à pastagem)</Label>
                                <span className="text-sm">{ajusteAmbiental.forrageamento}%</span>
                              </div>
                              <Slider
                                id="ajusteForrageamento"
                                min={0}
                                max={50}
                                step={5}
                                value={[ajusteAmbiental.forrageamento]}
                                onValueChange={(value) =>
                                  setAjusteAmbiental((prev) => ({ ...prev, forrageamento: value[0] }))
                                }
                              />
                              <div className="text-xs text-muted-foreground">
                                Ajuste a porcentagem de alimentação que as aves obtêm por forrageamento (0-50%)
                              </div>
                            </div>

                            <div className="mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const loteAtual = lotes.find((l) => l.id === loteSelecionado)
                                  if (!loteAtual) return
                                  setQuantidadeInput(
                                    previsaoDuracao
                                      ? quantidadeUnit === "g"
                                        ? Math.round(previsaoDuracao.quantidadeTotal * 1000).toString()
                                        : previsaoDuracao.quantidadeTotal.toString()
                                      : quantidadeUnit === "g"
                                        ? "1000"
                                        : "100",
                                  )
                                  setIsQuantidadeDialogOpen(true)
                                }}
                              >
                                Personalizar Quantidade
                              </Button>
                              <Dialog open={isQuantidadeDialogOpen} onOpenChange={setIsQuantidadeDialogOpen}>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Personalizar Quantidade</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-2">
                                    <Label htmlFor="quantidadePersonalizada">Quantidade</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input
                                        id="quantidadePersonalizada"
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={quantidadeInput}
                                        onChange={(e) => setQuantidadeInput(e.target.value)}
                                      />
                                      <Select value={quantidadeUnit} onValueChange={(v: "kg" | "g") => setQuantidadeUnit(v)}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Unidade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="kg">kg</SelectItem>
                                          <SelectItem value="g">g</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsQuantidadeDialogOpen(false)}>
                                      Cancelar
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        const loteAtual = lotes.find((l) => l.id === loteSelecionado)
                                        if (!loteAtual) return
                                        const quantidadeNum = Number.parseFloat(quantidadeInput)
                                        if (!isNaN(quantidadeNum) && quantidadeNum > 0) {
                                          const quantidadeKg = quantidadeUnit === "g" ? quantidadeNum / 1000 : quantidadeNum
                                          const resultado = calcularDuracaoRacao(
                                            quantidadeKg,
                                            loteAtual.id,
                                            novaFormulacao.fase,
                                            ajusteAmbiental,
                                          )
                                          setPrevisaoDuracao(resultado)
                                          setIsQuantidadeDialogOpen(false)
                                        }
                                      }}
                                    >
                                      Confirmar
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-2">Carregando previsão...</div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        name="descricao"
                        value={novaFormulacao.descricao}
                        onChange={handleFormulacaoChange}
                        placeholder="Descreva a formulação e suas características"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Button variant="outline" onClick={resetarFormulacao} className="w-full md:w-auto">
                        Limpar
                      </Button>

                      <Button variant="outline" onClick={otimizarFormulacao} className="w-full md:w-auto">
                        <Calculator className="mr-2 h-4 w-4" />
                        Otimizar
                      </Button>

                      <Button onClick={salvarFormulacao} className="w-full md:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Valores Nutricionais</h3>
                      <div className="text-sm text-muted-foreground">
                        Total:{" "}
                        <span
                          className={`font-medium ${verificarTotalPercentual() === 100 ? "text-green-600" : "text-red-600"}`}
                        >
                          {verificarTotalPercentual()}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="font-medium">Nutriente</div>
                        <div className="font-medium">Valor</div>
                        <div className="font-medium">Status</div>
                      </div>

                      <Separator />

                      {Object.entries(valoresNutricionais).map(([key, value]) => {
                        if (key === "custo") return null

                        const status = verificarRequisitosNutricionais()[key as keyof typeof valoresNutricionais]

                        let unidade = ""
                        if (key === "energia") unidade = "kcal/kg"
                        else if (key === "proteina" || key === "fibra") unidade = "%"
                        else unidade = "g/kg"

                        return (
                          <div key={key} className="grid grid-cols-3 gap-2 text-sm items-center">
                            <div className="capitalize">{key}</div>
                            <div>
                              {value.toFixed(2)} {unidade}
                            </div>
                            <div>{status && getStatusBadge(status)}</div>
                          </div>
                        )
                      })}

                      <Separator />

                      <div className="grid grid-cols-3 gap-2 text-sm items-center">
                        <div className="font-medium">Custo</div>
                        <div className="font-medium col-span-2">
                          R$ {valoresNutricionais.custo.toFixed(2)}/kg
                        </div>
                      </div>
                    </div>

                    {verificarTotalPercentual() !== 100 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          O total dos ingredientes deve ser 100%. Atual: {verificarTotalPercentual()}%
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Removido o cálculo manual de duração, agora é calculado automaticamente ao salvar */}

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Ingredientes</h3>
                    <Select
                      onValueChange={(value) => {
                        const ingrediente = ingredientes.find((ing) => ing.id === value)
                        if (ingrediente) {
                          // Verificar se o ingrediente já está na formulação
                          const jaExiste = novaFormulacao.itens.some(
                            (item) => item.ingredienteId === value && item.percentual > 0,
                          )
                          if (!jaExiste) {
                            // Adicionar ou atualizar o ingrediente na formulação
                            handlePercentualChange(value, 5) // Adiciona com 5% por padrão
                            toast({
                              title: "Ingrediente adicionado",
                              description: `${ingrediente.nome} adicionado à formulação com 5%`,
                            })
                          } else {
                            toast({
                              title: "Ingrediente já adicionado",
                              description: "Este ingrediente já está na formulação",
                            })
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Adicionar ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredientes.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead>Percentual (%)</TableHead>
                          <TableHead>Proteína (%)</TableHead>
                          <TableHead>Energia (kcal/kg)</TableHead>
                          <TableHead>Cálcio (g/kg)</TableHead>
                          <TableHead>Preço (R$/kg)</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {novaFormulacao.itens
                          .filter((item) => item.percentual > 0) // Mostrar apenas ingredientes com percentual > 0
                          .map((item) => {
                            const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
                            if (!ingrediente) return null

                            return (
                              <TableRow key={item.ingredienteId}>
                                <TableCell className="font-medium">{ingrediente.nome}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Slider
                                      value={[item.percentual]}
                                      min={0}
                                      max={100}
                                      step={0.1}
                                      onValueChange={(value) => handlePercentualChange(item.ingredienteId, value[0])}
                                      className="w-32"
                                    />
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      step={0.1}
                                      value={item.percentual}
                                      onChange={(e) =>
                                        handlePercentualChange(
                                          item.ingredienteId,
                                          Number.parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 h-8"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>{ingrediente.proteina.toFixed(1)}</TableCell>
                                <TableCell>{ingrediente.energia}</TableCell>
                                <TableCell>{ingrediente.calcio.toFixed(2)}</TableCell>
                                <TableCell>R$ {ingrediente.preco.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePercentualChange(item.ingredienteId, 0)}
                                    title="Remover ingrediente"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}

                        {novaFormulacao.itens.filter((item) => item.percentual > 0).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                              Nenhum ingrediente adicionado. Selecione ingredientes acima.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Total:{" "}
                      <span
                        className={`font-medium ${verificarTotalPercentual() === 100 ? "text-green-600" : "text-red-600"}`}
                      >
                        {verificarTotalPercentual()}%
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Ajustar percentuais para somar 100%
                        if (verificarTotalPercentual() === 0) return

                        const fator = 100 / verificarTotalPercentual()
                        novaFormulacao.itens.forEach((item) => {
                          if (item.percentual > 0) {
                            handlePercentualChange(item.ingredienteId, Math.round(item.percentual * fator * 10) / 10)
                          }
                        })

                        toast({
                          title: "Percentuais ajustados",
                          description: "Os percentuais foram ajustados para somar 100%",
                        })
                      }}
                    >
                      Ajustar para 100%
                    </Button>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium">Detalhes dos Ingredientes</h3>
                  <div className="rounded-md border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {novaFormulacao.itens
                        .filter((item) => item.percentual > 0)
                        .map((item) => {
                          const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
                          if (!ingrediente) return null

                          return (
                            <div key={item.ingredienteId} className="border rounded-md p-3">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">{ingrediente.nome}</h4>
                                <Badge>{item.percentual}%</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <div>Proteína: {ingrediente.proteina.toFixed(1)}%</div>
                                <div>Energia: {ingrediente.energia} kcal/kg</div>
                                <div>Cálcio: {ingrediente.calcio.toFixed(2)} g/kg</div>
                                <div>Fósforo: {ingrediente.fosforo.toFixed(2)} g/kg</div>
                                <div>Metionina: {ingrediente.metionina.toFixed(2)} g/kg</div>
                                <div>Lisina: {ingrediente.lisina.toFixed(2)} g/kg</div>
                                <div>Fibra: {ingrediente.fibra.toFixed(1)}%</div>
                                <div>Preço: R$ {ingrediente.preco.toFixed(2)}/kg</div>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                Contribuição na formulação:{" "}
                                {((ingrediente.proteina * item.percentual) / 100).toFixed(2)}% proteína,
                                {((ingrediente.energia * item.percentual) / 100).toFixed(0)} kcal/kg energia
                              </div>
                            </div>
                          )
                        })}

                      {novaFormulacao.itens.filter((item) => item.percentual > 0).length === 0 && (
                        <div className="col-span-2 text-center text-muted-foreground py-4">
                          Adicione ingredientes à formulação para ver seus detalhes nutricionais
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ingredientes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wheat className="h-5 w-5 text-primary" />
                  Cadastrar Ingrediente
                </CardTitle>
                <CardDescription>Adicione ingredientes para usar nas formulações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeIngrediente">Nome do Ingrediente</Label>
                      <Input
                        id="nomeIngrediente"
                        name="nome"
                        value={novoIngrediente.nome}
                        onChange={handleIngredienteChange}
                        placeholder="Ex: Milho Moído"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proteina">Proteína (%)</Label>
                        <Input
                          id="proteina"
                          name="proteina"
                          type="number"
                          min="0"
                          step="0.1"
                          value={novoIngrediente.proteina}
                          onChange={handleIngredienteChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="energia">Energia (kcal/kg)</Label>
                        <Input
                          id="energia"
                          name="energia"
                          type="number"
                          min="0"
                          value={novoIngrediente.energia}
                          onChange={handleIngredienteChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="calcio">Cálcio (g/kg)</Label>
                        <Input
                          id="calcio"
                          name="calcio"
                          type="number"
                          min="0"
                          step="0.01"
                          value={novoIngrediente.calcio}
                          onChange={handleIngredienteChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fosforo">Fósforo (g/kg)</Label>
                        <Input
                          id="fosforo"
                          name="fosforo"
                          type="number"
                          min="0"
                          step="0.01"
                          value={novoIngrediente.fosforo}
                          onChange={handleIngredienteChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="metionina">Metionina (g/kg)</Label>
                        <Input
                          id="metionina"
                          name="metionina"
                          type="number"
                          min="0"
                          step="0.01"
                          value={novoIngrediente.metionina}
                          onChange={handleIngredienteChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lisina">Lisina (g/kg)</Label>
                        <Input
                          id="lisina"
                          name="lisina"
                          type="number"
                          min="0"
                          step="0.01"
                          value={novoIngrediente.lisina}
                          onChange={handleIngredienteChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fibra">Fibra (%)</Label>
                      <Input
                        id="fibra"
                        name="fibra"
                        type="number"
                        min="0"
                        step="0.1"
                        value={novoIngrediente.fibra}
                        onChange={handleIngredienteChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="preco">Preço (R$/kg)</Label>
                        <Input
                          id="preco"
                          name="preco"
                          type="number"
                          min="0"
                          step="0.01"
                          value={novoIngrediente.preco}
                          onChange={handleIngredienteChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estoque">Estoque (kg)</Label>
                        <Input
                          id="estoque"
                          name="estoque"
                          type="number"
                          min="0"
                          value={novoIngrediente.estoque}
                          onChange={handleIngredienteChange}
                        />
                      </div>
                    </div>

                    <Button onClick={salvarIngrediente} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Ingrediente
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Ingredientes Cadastrados</h3>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Proteína (%)</TableHead>
                          <TableHead>Energia (kcal/kg)</TableHead>
                          <TableHead>Cálcio (g/kg)</TableHead>
                          <TableHead>Preço (R$/kg)</TableHead>
                          <TableHead>Estoque (kg)</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingredientes.length > 0 ? (
                          ingredientes.map((ingrediente) => (
                            <TableRow key={ingrediente.id}>
                              <TableCell>{ingrediente.nome}</TableCell>
                              <TableCell>{ingrediente.proteina.toFixed(1)}</TableCell>
                              <TableCell>{ingrediente.energia}</TableCell>
                              <TableCell>{ingrediente.calcio.toFixed(2)}</TableCell>
                              <TableCell>R$ {ingrediente.preco.toFixed(2)}</TableCell>
                              <TableCell>{ingrediente.estoque} kg</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => excluirIngrediente(ingrediente.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                              Nenhum ingrediente cadastrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formulacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Formulações Salvas
                </CardTitle>
                <CardDescription>Gerencie suas formulações de ração</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {formulacoes.length > 0 ? (
                      formulacoes.map((formulacao) => (
                        <Card key={formulacao.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{formulacao.nome}</CardTitle>
                                {formulacao.ativa && (
                                  <Badge variant="outline" className="ml-2">
                                    <Check className="mr-1 h-3 w-3" />
                                    Ativa
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => editarFormulacao(formulacao.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => duplicarFormulacao(formulacao.id)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => analisarImpactoSaude(formulacao.id)}>
                                  <Syringe className="h-4 w-4 text-amber-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => excluirFormulacao(formulacao.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <CardDescription>
                              {formulacao.fase === "inicial" && (
                                <div className="flex items-center gap-1">
                                  <Egg className="h-4 w-4" />
                                  Fase Inicial (0-6 semanas)
                                </div>
                              )}
                              {formulacao.fase === "crescimento" && (
                                <div className="flex items-center gap-1">
                                  <Bird className="h-4 w-4" />
                                  Fase de Crescimento (7-17 semanas)
                                </div>
                              )}
                              {formulacao.fase === "postura" && (
                                <div className="flex items-center gap-1">
                                  <Egg className="h-4 w-4 text-primary" />
                                  Fase de Postura (18+ semanas)
                                </div>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {formulacao.descricao || "Sem descrição"}
                                </p>
                                <div className="text-sm">
                                  <div className="flex justify-between">
                                    <span>Criado em:</span>
                                    <span>{formulacao.dataCriacao}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Última modificação:</span>
                                    <span>{formulacao.ultimaModificacao}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium">Ingredientes</span>
                                  <span className="text-sm text-muted-foreground">{formulacao.itens.length} itens</span>
                                </div>
                                <div className="space-y-1">
                                  {formulacao.itens.slice(0, 3).map((item) => {
                                    const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
                                    if (!ingrediente) return null

                                    return (
                                      <div key={item.ingredienteId} className="flex justify-between text-sm">
                                        <span>{ingrediente.nome}</span>
                                        <span>{item.percentual}%</span>
                                      </div>
                                    )
                                  })}

                                  {formulacao.itens.length > 3 && (
                                    <div className="text-sm text-muted-foreground text-center">
                                      + {formulacao.itens.length - 3} outros ingredientes
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <div className="px-6 py-2 bg-muted/50 rounded-b-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <PieChart className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    Proteína:{" "}
                                    {formulacao.itens
                                      .reduce((sum, item) => {
                                        const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
                                        if (!ingrediente) return sum
                                        return sum + (ingrediente.proteina * item.percentual) / 100
                                      }, 0)
                                      .toFixed(1)}
                                    %
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    Custo: R${" "}
                                    {formulacao.itens
                                      .reduce((sum, item) => {
                                        const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
                                        if (!ingrediente) return sum
                                        return sum + (ingrediente.preco * item.percentual) / 100
                                      }, 0)
                                      .toFixed(2)}
                                    /kg
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground mr-2">Ativar</span>
                                <Switch
                                  checked={formulacao.ativa}
                                  onCheckedChange={(checked) => ativarFormulacao(formulacao.id, checked)}
                                />
                              </div>
                            </div>

                            {(formulacao.duracaoDias || formulacao.quantidadeTotal) && (
                              <>
                                <div className="grid grid-cols-3 gap-2 border-t pt-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      Duração: <strong>{formulacao.duracaoDias}</strong> dias
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    Quantidade: <strong>{formulacao.quantidadeTotal}</strong> kg
                                  </div>
                                  <div className="text-sm">
                                    Consumo: {""}
                                    <strong>
                                      {formulacao.consumoDiario ? formulacao.consumoDiario.toFixed(1) : "0"}
                                    </strong>{" "}
                                    kg/dia
                                  </div>
                                </div>
                                <div className="mt-2 text-sm">
                                  Consumo real (manejo):
                                  <strong>
                                    {formulacao.loteId && calcularConsumoMedioManejo(formulacao.loteId) > 0
                                      ? ` ${calcularConsumoMedioManejo(formulacao.loteId).toFixed(1)} kg/dia`
                                      : " N/A"}
                                  </strong>
                                </div>

                                {formulacao.dataTerminoPrevista && (
                                  <div className="mt-2 pt-1 border-t">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1 text-sm">
                                        <Calendar className="h-4 w-4 text-amber-500" />
                                        <span>
                                          Término previsto: <strong>{formulacao.dataTerminoPrevista}</strong>
                                        </span>
                                      </div>

                                      {(() => {
                                        // Calcular dias restantes
                                        const hoje = new Date()
                                        const dataTermino = new Date(
                                          formulacao.dataTerminoPrevista.split("/").reverse().join("-"),
                                        )
                                        const diasRestantes = Math.ceil(
                                          (dataTermino.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
                                        )

                                        if (diasRestantes <= 0) {
                                          return (
                                            <Badge variant="destructive" className="text-xs">
                                              Ração esgotada
                                            </Badge>
                                          )
                                        } else if (diasRestantes <= 3) {
                                          return (
                                            <Badge variant="destructive" className="text-xs">
                                              Reposição urgente ({diasRestantes} dias)
                                            </Badge>
                                          )
                                        } else if (diasRestantes <= 7) {
                                          return (
                                            <Badge variant="secondary" className="text-xs">
                                              Reposição em breve ({diasRestantes} dias)
                                            </Badge>
                                          )
                                        }
                                        return null
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>Nenhuma formulação salva</p>
                        <p className="text-sm">Crie uma nova formulação na aba "Criar Formulação"</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-primary" />
                  Análise de Saúde e Nutrição
                </CardTitle>
                <CardDescription>Correlação entre formulações de ração e saúde das aves</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formulacoes.some((f) => f.ativa) ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Formulações Ativas</h4>
                          <div className="space-y-2">
                            {formulacoes
                              .filter((f) => f.ativa)
                              .map((formulacao) => {
                                // Calcular valores nutricionais
                                const valoresNutricionais = {
                                  proteina: 0,
                                  energia: 0,
                                  calcio: 0,
                                  fosforo: 0,
                                }

                                formulacao.itens.forEach((item: ItemFormulacao) => {
                                  const ingrediente = ingredientes.find((ing) => ing.id === item.ingredienteId)
                                  if (ingrediente && item.percentual > 0) {
                                    const fator = item.percentual / 100
                                    valoresNutricionais.proteina += ingrediente.proteina * fator
                                    valoresNutricionais.energia += ingrediente.energia * fator
                                    valoresNutricionais.calcio += ingrediente.calcio * fator
                                    valoresNutricionais.fosforo += ingrediente.fosforo * fator
                                  }
                                })

                                return (
                                  <div key={formulacao.id} className="p-2 border rounded-md">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="font-medium">{formulacao.nome}</span>
                                        <div className="text-sm text-muted-foreground">Fase: {formulacao.fase}</div>
                                      </div>
                                      <Badge variant="outline" className="flex items-center gap-1">
                                        <Check className="h-3 w-3" />
                                        Ativa
                                      </Badge>
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                      <div>Proteína: {valoresNutricionais.proteina.toFixed(1)}%</div>
                                      <div>Energia: {valoresNutricionais.energia.toFixed(0)} kcal/kg</div>
                                      <div>Cálcio: {valoresNutricionais.calcio.toFixed(1)} g/kg</div>
                                      <div>Fósforo: {valoresNutricionais.fosforo.toFixed(1)} g/kg</div>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Recomendações de Saúde</h4>
                          <div className="space-y-2">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                  <p className="font-medium text-blue-700">Fase Inicial</p>
                                  <ul className="text-sm space-y-1 mt-1 text-blue-700">
                                    <li>Mantenha proteína entre 20-22% para desenvolvimento adequado</li>
                                    <li>Níveis adequados de cálcio (9-11 g/kg) previnem problemas ósseos</li>
                                    <li>Monitore o consumo de ração diariamente</li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                                <div>
                                  <p className="font-medium text-amber-700">Fase de Crescimento</p>
                                  <ul className="text-sm space-y-1 mt-1 text-amber-700">
                                    <li>Proteína entre 16-18% é ideal para esta fase</li>
                                    <li>Aumente gradualmente o cálcio ao se aproximar da fase de postura</li>
                                    <li>Mantenha a relação cálcio:fósforo em 2:1</li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                <div>
                                  <p className="font-medium text-green-700">Fase de Postura</p>
                                  <ul className="text-sm space-y-1 mt-1 text-green-700">
                                    <li>Cálcio elevado (38-42 g/kg) é essencial para formação da casca</li>
                                    <li>Mantenha energia entre 2800-2900 kcal/kg para produção eficiente</li>
                                    <li>Suplementação de metionina melhora o tamanho dos ovos</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 border rounded-md">
                        <h4 className="font-medium mb-2">Correlação Nutrição-Sa��de</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          A análise de correlação entre formulações e ocorrências de saúde pode ajudar a identificar
                          padrões e melhorar a nutrição das aves.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="p-3 bg-muted rounded-md">
                            <h5 className="font-medium mb-1">Deficiência de Cálcio</h5>
                            <p>Pode causar casca fina nos ovos e problemas ósseos. Aumente o calcário na formulação.</p>
                          </div>

                          <div className="p-3 bg-muted rounded-md">
                            <h5 className="font-medium mb-1">Excesso de Proteína</h5>
                            <p>Pode causar problemas renais e aumento de amônia. Equilibre com energia adequada.</p>
                          </div>

                          <div className="p-3 bg-muted rounded-md">
                            <h5 className="font-medium mb-1">Baixa Energia</h5>
                            <p>Reduz produção de ovos e causa perda de peso. Aumente milho ou adicione óleo.</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-md">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          Planejamento de Consumo
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          O planejamento adequado do consumo de ração é essencial para garantir que as aves recebam
                          nutrição constante e para otimizar os custos de produção.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="p-3 bg-white rounded-md border border-blue-100">
                            <h5 className="font-medium mb-1 text-blue-700">Fase Inicial</h5>
                            <p className="mb-2">
                              Consumo médio: <strong>40g/ave/dia</strong>
                            </p>
                            <p>
                              Para 100 pintainhas, prepare aproximadamente <strong>4kg</strong> de ração por dia.
                            </p>
                          </div>

                          <div className="p-3 bg-white rounded-md border border-blue-100">
                            <h5 className="font-medium mb-1 text-blue-700">Fase de Crescimento</h5>
                            <p className="mb-2">
                              Consumo médio: <strong>80g/ave/dia</strong>
                            </p>
                            <p>
                              Para 100 frangas, prepare aproximadamente <strong>8kg</strong> de ração por dia.
                            </p>
                          </div>

                          <div className="p-3 bg-white rounded-md border border-blue-100">
                            <h5 className="font-medium mb-1 text-blue-700">Fase de Postura</h5>
                            <p className="mb-2">
                              Consumo médio: <strong>110g/ave/dia</strong>
                            </p>
                            <p>
                              Para 100 poedeiras, prepare aproximadamente <strong>11kg</strong> de ração por dia.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-white rounded-md border border-blue-100">
                          <h5 className="font-medium mb-1 text-blue-700">Dicas de Planejamento</h5>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Formule ração para períodos de 2-3 semanas para manter a qualidade nutricional</li>
                            <li>Monitore o consumo real e ajuste as formulações conforme necessário</li>
                            <li>Considere um aumento de 5-10% no consumo durante períodos de frio</li>
                            <li>Reduza o desperdício mantendo comedouros adequadamente ajustados</li>
                          </ul>
                        </div>
                      </div>

                      {/* Componente de explicação sobre o cálculo de duração */}
                      <div className="mt-6 p-4 bg-green-50 rounded-md">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-green-500" />
                          Como é Calculada a Duração da Ração
                        </h4>
                        <p className="text-ext-sm text-muted-foreground mb-4">
                          O sistema calcula automaticamente quanto tempo a ração formulada vai durar com base no consumo
                          diário das aves, que varia conforme a fase de desenvolvimento.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <h5 className="font-medium text-green-700">Fórmula de Cálculo</h5>
                            <p className="text-green-700">
                              Duração (dias) = Quantidade Total (kg) ÷ Consumo Diário Total (kg)
                            </p>
                            <p className="text-green-700">
                              Consumo Diário Total = Número de Aves × Consumo por Ave × Fatores de Ajuste
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h5 className="font-medium text-green-700">Fatores que Influenciam</h5>
                            <ul className="list-disc pl-5 space-y-1 text-green-700">
                              <li>Fase de desenvolvimento das aves</li>
                              <li>Temperatura ambiente (clima frio ou quente)</li>
                              <li>Acesso à pastagem (forrageamento)</li>
                              <li>Tamanho e peso das aves</li>
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-white rounded-md border border-green-100">
                          <h5 className="font-medium mb-1 text-green-700">Dicas para Maior Precisão</h5>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Monitore o consumo real e compare com a previsão</li>
                            <li>Ajuste os fatores ambientais conforme a estação do ano</li>
                            <li>Considere o tamanho e a raça específica das aves</li>
                            <li>Atualize regularmente o número de aves no lote (mortalidade)</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Syringe className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhuma formulação ativa para análise</p>
                      <p className="text-sm mt-2">
                        Ative formulações para começar a analisar o impacto na saúde das aves
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="estoque" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Estoque de Ingredientes
                </CardTitle>
                <CardDescription>Gerencie o estoque de ingredientes para formulação de ração</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead>Estoque (kg)</TableHead>
                          <TableHead>Preço (R$/kg)</TableHead>
                          <TableHead>Última Compra</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingredientes.length > 0 ? (
                          ingredientes.map((ingrediente) => {
                            // Verificar se há histórico de compras para este ingrediente
                            const nomeNormalizado = ingrediente.nome.toLowerCase().replace(/\s+/g, "_")
                            const historicoIngrediente = Object.entries(historicoCompras).find(
                              ([tipo]) => tipo.includes(nomeNormalizado) || nomeNormalizado.includes(tipo),
                            )

                            const ultimaCompra = historicoIngrediente ? historicoIngrediente[1][0]?.data : "N/A"
                            const estoqueBaixo = ingrediente.estoque < 10

                            return (
                              <TableRow key={ingrediente.id}>
                                <TableCell className="font-medium">{ingrediente.nome}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {ingrediente.estoque.toFixed(1)}
                                    {estoqueBaixo && (
                                      <Badge variant="destructive" className="text-xs">
                                        Baixo
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>R$ {ingrediente.preco.toFixed(2)}</TableCell>
                                <TableCell>{ultimaCompra}</TableCell>
                                <TableCell>
                                  {estoqueBaixo ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push("/dashboard/compras?tab=racao")}
                                    >
                                      <ShoppingBag className="mr-1 h-3 w-3" />
                                      Comprar
                                    </Button>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-50">
                                      Adequado
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                              Nenhum ingrediente cadastrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Estoque de Rações Formuladas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {estoqueRacoes.length > 0 ? (
                          <div className="space-y-4">
                            {estoqueRacoes.map((racao, index) => {
                              const formulacao = formulacoes.find((f) => f.id === racao.id)
                              return (
                                <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                                  <div>
                                    <div className="font-medium">{racao.nome}</div>
                                    <div className="text-sm text-muted-foreground">Fase: {racao.fase}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{racao.quantidade} kg</div>
                                    <div className="text-sm text-muted-foreground">
                                      {formulacao?.duracaoDias ? `Duração: ${formulacao.duracaoDias} dias` : ""}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-4">Nenhuma ração em estoque</div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Comparação de Preços</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Ingrediente</TableHead>
                                  <TableHead>Preço Atual</TableHead>
                                  <TableHead>Preço Médio</TableHead>
                                  <TableHead>Variação</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {ingredientes.length > 0 ? (
                                  ingredientes
                                    .filter((ing) => ing.preco > 0)
                                    .sort((a, b) => b.preco - a.preco)
                                    .slice(0, 5)
                                    .map((ingrediente) => {
                                      // Calcular preço médio histórico
                                      const nomeNormalizado = ingrediente.nome.toLowerCase().replace(/\s+/g, "_")
                                      const historicoIngrediente = Object.entries(historicoCompras).find(
                                        ([tipo]) => tipo.includes(nomeNormalizado) || nomeNormalizado.includes(tipo),
                                      )

                                      let precoMedio = ingrediente.preco
                                      let variacao = 0

                                      if (historicoIngrediente && historicoIngrediente[1].length > 1) {
                                        precoMedio =
                                          historicoIngrediente[1].reduce((sum, item) => sum + item.preco, 0) /
                                          historicoIngrediente[1].length
                                        variacao = ((ingrediente.preco - precoMedio) / precoMedio) * 100
                                      }

                                      return (
                                        <TableRow key={ingrediente.id}>
                                          <TableCell>{ingrediente.nome}</TableCell>
                                          <TableCell>R$ {ingrediente.preco.toFixed(2)}</TableCell>
                                          <TableCell>R$ {precoMedio.toFixed(2)}</TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-1">
                                              {variacao > 0 ? (
                                                <TrendingUp className="h-4 w-4 text-red-500" />
                                              ) : variacao < 0 ? (
                                                <TrendingDown className="h-4 w-4 text-green-500" />
                                              ) : (
                                                <span>-</span>
                                              )}
                                              {variacao !== 0 && `${Math.abs(variacao).toFixed(1)}%`}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                      Sem dados de preços
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Ranking de Ingredientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Mais Utilizados</h4>
                          {rankingIngredientes.length > 0 ? (
                            <div className="space-y-2">
                              {rankingIngredientes.slice(0, 5).map((item, index) => (
                                <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="h-6 w-6 rounded-full p-0 flex items-center justify-center"
                                    >
                                      {index + 1}
                                    </Badge>
                                    <span>{item.nome}</span>
                                  </div>
                                  <Badge variant="secondary">{item.usos} formulações</Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground py-4">Nenhum dado de uso disponível</div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Alertas de Estoque</h4>
                          {ingredientes.filter((ing) => ing.estoque < 10).length > 0 ? (
                            <div className="space-y-2">
                              {ingredientes
                                .filter((ing) => ing.estoque < 10)
                                .map((ingrediente) => (
                                  <div
                                    key={ingrediente.id}
                                    className="flex items-center justify-between p-2 border border-red-200 bg-red-50 rounded-md"
                                  >
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                      <span>{ingrediente.nome}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-red-600 font-medium">
                                        {ingrediente.estoque.toFixed(1)} kg
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push("/dashboard/compras?tab=racao")}
                                      >
                                        Comprar
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="p-4 border border-green-200 bg-green-50 rounded-md">
                              <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-500" />
                                <span className="text-green-700">Todos os ingredientes com estoque adequado</span>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <h5 className="font-medium mb-1 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-700">Controle Automático de Estoque</span>
                            </h5>
                            <p className="text-sm text-blue-700">
                              O sistema verifica automaticamente o estoque de ingredientes ao salvar novas formulações.
                              Você será alertado quando o estoque estiver baixo.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
