"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/dashboard-layout"
import { Calendar, Syringe, Clock, AlertCircle, PieChart, Wheat, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useTips } from "@/contexts/tips-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Lote } from "@/services/data-service"

interface ItemFormulacao {
  ingredienteId: string
  percentual: number
}

interface Formulacao {
  id: string
  nome: string
  fase: "inicial" | "crescimento" | "postura"
  itens: ItemFormulacao[]
  ativa?: boolean
}

interface Fornecedor {
  cpfCnpj: string
  nome: string
}

interface AplicacaoSaude {
  data: string
  loteId: string
  fase: string
  tipo: "vacina" | "medicamento"
  nome: string
  veterinario: string
  quantidade: number | string
  observacoes: string
  proximaDose: string
  dataProxima?: string
  formulacaoId: string | null
}

interface HistoricoFormulacao {
  data: string
  loteId: string
  formulacaoId: string
  formulacaoNome: string
  aplicacaoTipo: string
  aplicacaoNome: string
}

export default function ControleSaudePage() {
  const { toast } = useToast()
  const { recordAction } = useTips()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [aplicacoesSaude, setAplicacoesSaude] = useState<AplicacaoSaude[]>([])
  const [formData, setFormData] = useState({
    data: new Date().toLocaleDateString("pt-BR"),
    loteId: "",
    fase: "",
    tipo: "vacina",
    nome: "",
    veterinario: "",
    quantidade: "",
    observacoes: "",
    proximaDose: "",
  })

  const [formulacoes, setFormulacoes] = useState<Formulacao[]>([])
  const [formulacaoSelecionada, setFormulacaoSelecionada] = useState("")
  const [historicoFormulacoes, setHistoricoFormulacoes] = useState<HistoricoFormulacao[]>([])

  const loadData = () => {
    try {
      const lotesData = JSON.parse(localStorage.getItem("lotes") || "[]")
      const fornecedoresData = JSON.parse(localStorage.getItem("fornecedores") || "[]")
      const aplicacoesSaudeData = JSON.parse(localStorage.getItem("aplicacoesSaude") || "[]")
      const formulacoesData = JSON.parse(localStorage.getItem("formulacoes") || "[]")
      const historicoFormulacoesData = JSON.parse(localStorage.getItem("historicoFormulacoes") || "[]")

      setLotes(lotesData as Lote[])
      setFornecedores(fornecedoresData as Fornecedor[])
      setAplicacoesSaude(aplicacoesSaudeData as AplicacaoSaude[])
      setFormulacoes((formulacoesData as Formulacao[]).filter((f) => f.ativa))
      setHistoricoFormulacoes(historicoFormulacoesData as HistoricoFormulacao[])
    } catch (error) {
      console.error("Erro ao carregar dados de saúde:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de saúde.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    setTimeout(loadData, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "loteId") {
      atualizarFaseSaude(value)
    }

    if (name === "tipo" || name === "nome") {
      atualizarProximaDose()
    }
  }

  const formatDate = (input: string) => {
    let value = input.replace(/\D/g, "")
    if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2)
    if (value.length > 5) value = value.slice(0, 5) + "/" + value.slice(5)
    return value.slice(0, 10)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedDate = formatDate(e.target.value)
    setFormData((prev) => ({ ...prev, data: formattedDate }))

    // Update next dose date when application date changes
    atualizarProximaDose()
  }

  const validateDate = (date: string, allowFuture = false) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/
    if (!regex.test(date)) return false

    const [dia, mes, ano] = date.split("/").map(Number)
    const dataInserida = new Date(ano, mes - 1, dia)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (dataInserida.getDate() !== dia || dataInserida.getMonth() !== mes - 1 || dataInserida.getFullYear() !== ano)
      return false
    if (!allowFuture && dataInserida > hoje) return false
    return true
  }

  const atualizarFaseSaude = (loteId: string) => {
    const lote = lotes.find((l) => l.id === loteId)
    if (!lote) {
      setFormData((prev) => ({ ...prev, fase: "" }))
      return
    }

    const hoje = new Date()
    const dataCompraStr = (lote.dataCompra || "01/01/2024").split("/").reverse().join("-")
    const dataCompra = new Date(dataCompraStr)
    const dias = Math.floor((hoje.getTime() - dataCompra.getTime()) / (1000 * 60 * 60 * 24))

    let fase = "Indefinida"
    if (dias < 42) {
      fase = "Inicial (0-6 semanas)"
    } else if (dias < 112) {
      fase = "Crescimento (7-17 semanas)"
    } else {
      fase = "Postura (18+ semanas)"
    }

    setFormData((prev) => ({ ...prev, fase }))
  }

  const atualizarProximaDose = () => {
    const { tipo, nome, data } = formData
    if (!tipo || !nome || !data || !validateDate(data)) return

    let diasProxima = 0

    if (tipo === "vacina") {
      switch (nome) {
        case "marek":
          diasProxima = 0 // Dose única
          break
        case "newcastle":
          diasProxima = 21
          break
        case "bouba":
          diasProxima = 0 // Dose única
          break
        case "gumboro":
          diasProxima = 14
          break
        case "bronquite":
          diasProxima = 30
          break
        case "coriza":
          diasProxima = 42
          break
        default:
          diasProxima = 0
      }
    } else {
      switch (nome) {
        case "antibiotico":
          diasProxima = 7
          break
        case "vermifugo":
          diasProxima = 90
          break
        case "vitaminico":
          diasProxima = 30
          break
        case "antiparasitario":
          diasProxima = 60
          break
        default:
          diasProxima = 0
      }
    }

    if (diasProxima > 0) {
      const [dia, mes, ano] = data.split("/").map(Number)
      const dataAplicacao = new Date(ano, mes - 1, dia)
      dataAplicacao.setDate(dataAplicacao.getDate() + diasProxima)

      setFormData((prev) => ({ ...prev, proximaDose: diasProxima.toString() }))
    } else {
      setFormData((prev) => ({ ...prev, proximaDose: "" }))
    }
  }

  const registrarAplicacaoSaude = () => {
    const { data, loteId, fase, tipo, nome, veterinario, quantidade, observacoes, proximaDose } = formData

    if (!data || !loteId || !tipo || !nome || !veterinario) {
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

    // Calculate next dose date
    let dataProxima = ""
    if (proximaDose && Number.parseInt(proximaDose) > 0) {
      const [dia, mes, ano] = data.split("/").map(Number)
      const dataAplicacao = new Date(ano, mes - 1, dia)
      dataAplicacao.setDate(dataAplicacao.getDate() + Number.parseInt(proximaDose))
      dataProxima = dataAplicacao.toLocaleDateString("pt-BR")
    }

    // Create new health application
    const newAplicacao: AplicacaoSaude = {
      data,
      loteId,
      fase,
      tipo: tipo as "vacina" | "medicamento",
      nome,
      veterinario,
      quantidade: quantidade ? Number.parseFloat(quantidade) : 0,
      observacoes: observacoes || "Nenhuma",
      proximaDose: Number.parseInt(proximaDose) > 0 ? proximaDose : "",
      dataProxima,
      formulacaoId: formulacaoSelecionada || null,
    }

    const updatedAplicacoes = [...aplicacoesSaude, newAplicacao]

    // Save to localStorage
    localStorage.setItem("aplicacoesSaude", JSON.stringify(updatedAplicacoes))

    setAplicacoesSaude(updatedAplicacoes)

    // Registrar no histórico de formulações se uma formulação foi selecionada
    if (formulacaoSelecionada) {
      const formulacao = formulacoes.find((f) => f.id === formulacaoSelecionada)
      if (formulacao) {
        const novoHistorico = {
          data,
          loteId,
          formulacaoId: formulacaoSelecionada,
          formulacaoNome: formulacao.nome,
          aplicacaoTipo: tipo,
          aplicacaoNome: nome,
        }

        const historicoAtualizado = [...historicoFormulacoes, novoHistorico]
        localStorage.setItem("historicoFormulacoes", JSON.stringify(historicoAtualizado))
        setHistoricoFormulacoes(historicoAtualizado)
      }
    }

    toast({
      title: "Sucesso",
      description: "Aplicação registrada com sucesso!",
    })

    recordAction("registrar_aplicacao_saude", { tipo, nome })

    // Reset form
    setFormData({
      data: new Date().toLocaleDateString("pt-BR"),
      loteId: "",
      fase: "",
      tipo: "vacina",
      nome: "",
      veterinario: "",
      quantidade: "",
      observacoes: "",
      proximaDose: "",
    })
    setFormulacaoSelecionada("")
  }

  const calcularDiasRestantes = (dataProxima: string) => {
    if (!dataProxima) return null

    const [dia, mes, ano] = dataProxima.split("/").map(Number)
    const dataFutura = new Date(ano, mes - 1, dia)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const diferenca = Math.ceil((dataFutura.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diferenca
  }

  const getStatusBadge = (diasRestantes: number | null) => {
    if (diasRestantes === null) return null

    if (diasRestantes < 0) {
      return <Badge variant="destructive">Atrasado</Badge>
    } else if (diasRestantes === 0) {
      return <Badge variant="destructive">Hoje</Badge>
    } else if (diasRestantes <= 3) {
      return <Badge variant="destructive">Urgente</Badge>
    } else if (diasRestantes <= 7) {
      return <Badge variant="secondary">Em breve</Badge>
    } else {
      return <Badge variant="outline">Agendado</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Controle de Saúde</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-primary" />
                Registrar Aplicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data da Aplicação</Label>
                  <div className="relative">
                    <Input
                      id="data"
                      name="data"
                      value={formData.data}
                      onChange={handleDateChange}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
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
                  <Label htmlFor="fase">Fase das Aves</Label>
                  <Input id="fase" name="fase" value={formData.fase} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    name="tipo"
                    value={formData.tipo}
                    onValueChange={(value) => handleSelectChange("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacina">Vacina</SelectItem>
                      <SelectItem value="medicamento">Medicamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Select
                    name="nome"
                    value={formData.nome}
                    onValueChange={(value) => handleSelectChange("nome", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.tipo === "vacina" ? (
                        <>
                          <SelectItem value="marek">Marek</SelectItem>
                          <SelectItem value="newcastle">Newcastle</SelectItem>
                          <SelectItem value="bouba">Bouba Aviária</SelectItem>
                          <SelectItem value="gumboro">Gumboro</SelectItem>
                          <SelectItem value="bronquite">Bronquite Infecciosa</SelectItem>
                          <SelectItem value="coriza">Coriza Infecciosa</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="antibiotico">Antibiótico (ex.: Tilosina)</SelectItem>
                          <SelectItem value="vermifugo">Vermífugo (ex.: Levamisol)</SelectItem>
                          <SelectItem value="vitaminico">Vitamínico (ex.: AD3E)</SelectItem>
                          <SelectItem value="antiparasitario">Antiparasitário (ex.: Ivermectina)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veterinario">Veterinário/Fornecedor</Label>
                  <Select
                    name="veterinario"
                    value={formData.veterinario}
                    onValueChange={(value) => handleSelectChange("veterinario", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veterinário ou fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.cpfCnpj} value={fornecedor.cpfCnpj}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade Aplicada</Label>
                  <Input
                    id="quantidade"
                    name="quantidade"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.quantidade}
                    onChange={handleInputChange}
                    placeholder="Doses ou ml"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    placeholder="Detalhes da aplicação"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formulacao">Formulação de Ração Atual</Label>
                  <Select name="formulacao" value={formulacaoSelecionada} onValueChange={setFormulacaoSelecionada}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a formulação (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {formulacoes.map((formulacao) => (
                        <SelectItem key={formulacao.id} value={formulacao.id}>
                          {formulacao.nome} ({formulacao.fase})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Associar uma formulação ajuda a analisar o impacto nutricional na saúde
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proximaDose">Próxima Dose (dias)</Label>
                  <Input
                    id="proximaDose"
                    name="proximaDose"
                    type="number"
                    min="0"
                    value={formData.proximaDose}
                    onChange={handleInputChange}
                    placeholder="Intervalo em dias (se aplicável)"
                  />
                </div>

                <Button className="w-full" onClick={registrarAplicacaoSaude}>
                  Registrar Aplicação
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Próximas Aplicações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Data Prevista</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aplicacoesSaude.filter((a) => a.dataProxima).length > 0 ? (
                        aplicacoesSaude
                          .filter((a) => a.dataProxima)
                          .sort((a, b) => {
                            const diasA = calcularDiasRestantes(a.dataProxima!) || 0
                            const diasB = calcularDiasRestantes(b.dataProxima!) || 0
                            return diasA - diasB
                          })
                          .map((aplicacao, index) => {
                            const diasRestantes = calcularDiasRestantes(aplicacao.dataProxima!)
                            return (
                              <TableRow key={index}>
                                <TableCell>{aplicacao.loteId}</TableCell>
                                <TableCell>
                                  {aplicacao.tipo === "vacina" ? "Vacina: " : "Medicamento: "}
                                  {aplicacao.nome}
                                </TableCell>
                                <TableCell>{aplicacao.dataProxima}</TableCell>
                                <TableCell>
                                  {getStatusBadge(diasRestantes)}
                                  {diasRestantes !== null && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {diasRestantes < 0
                                        ? `${Math.abs(diasRestantes)} dias atrás`
                                        : diasRestantes === 0
                                          ? "Hoje"
                                          : `${diasRestantes} dias`}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                            Nenhuma aplicação programada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Alertas de Saúde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aplicacoesSaude
                    .filter((a) => a.dataProxima)
                    .filter((a) => {
                      const diasRestantes = calcularDiasRestantes(a.dataProxima!)
                      return diasRestantes !== null && diasRestantes <= 7
                    }).length > 0 ? (
                    aplicacoesSaude
                      .filter((a) => a.dataProxima)
                      .filter((a) => {
                        const diasRestantes = calcularDiasRestantes(a.dataProxima!)
                        return diasRestantes !== null && diasRestantes <= 7
                      })
                      .map((aplicacao, index) => {
                        const diasRestantes = calcularDiasRestantes(aplicacao.dataProxima!)
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-md ${
                              diasRestantes !== null && diasRestantes <= 0
                                ? "bg-destructive/10 text-destructive"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 mt-0.5" />
                              <div>
                                <p className="font-medium">
                                  {diasRestantes !== null && diasRestantes < 0
                                    ? "Aplicação atrasada!"
                                    : diasRestantes === 0
                                      ? "Aplicação para hoje!"
                                      : "Aplicação em breve!"}
                                </p>
                                <p className="text-sm">
                                  {aplicacao.tipo === "vacina" ? "Vacina" : "Medicamento"} {aplicacao.nome} para o{" "}
                                  {aplicacao.loteId} em {aplicacao.dataProxima}
                                  {diasRestantes !== null && (
                                    <span className="ml-1">
                                      (
                                      {diasRestantes < 0
                                        ? `${Math.abs(diasRestantes)} dias atrás`
                                        : diasRestantes === 0
                                          ? "Hoje"
                                          : `em ${diasRestantes} dias`}
                                      )
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <div className="text-center text-muted-foreground py-4">Nenhum alerta de saúde no momento</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wheat className="h-5 w-5 text-primary" />
                  Análise Nutricional e Saúde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historicoFormulacoes.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Formulações Recentes por Lote</h4>
                          <div className="space-y-2">
                            {Array.from(new Set(historicoFormulacoes.map((h) => h.loteId))).map((loteId) => {
                              const ultimaFormulacao = historicoFormulacoes
                                .filter((h) => h.loteId === loteId)
                                .sort((a, b) => {
                                  const dateA = new Date(a.data.split("/").reverse().join("-"))
                                  const dateB = new Date(b.data.split("/").reverse().join("-"))
                                  return dateB.getTime() - dateA.getTime()
                                })[0]

                              return ultimaFormulacao ? (
                                <div key={loteId} className="flex items-center justify-between p-2 border rounded-md">
                                  <div>
                                    <span className="font-medium">{loteId}</span>
                                    <div className="text-sm text-muted-foreground">
                                      {ultimaFormulacao.formulacaoNome}
                                    </div>
                                  </div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <PieChart className="h-4 w-4 mr-1" />
                                        Detalhes
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Detalhes da Formulação</DialogTitle>
                                        <DialogDescription>
                                          Informações nutricionais da formulação {ultimaFormulacao.formulacaoNome}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-2 mt-4">
                                        <p>
                                          <strong>Lote:</strong> {loteId}
                                        </p>
                                        <p>
                                          <strong>Última atualização:</strong> {ultimaFormulacao.data}
                                        </p>
                                        <p>
                                          <strong>Fase:</strong>{" "}
                                          {formulacoes.find((f) => f.id === ultimaFormulacao.formulacaoId)?.fase ||
                                            "Desconhecida"}
                                        </p>
                                        <div className="mt-4">
                                          <h4 className="font-medium mb-2">Composição Nutricional</h4>
                                          <div className="grid grid-cols-2 gap-2 text-sm">
                                            {formulacoes
                                              .find((f) => f.id === ultimaFormulacao.formulacaoId)
                                              ?.itens.map((item, index: number) => {
                                              const ingredientesList: { id: string; nome: string }[] = JSON.parse(
                                                localStorage.getItem("ingredientes") || "[]",
                                              )
                                              const ingrediente = ingredientesList.find(
                                                (ing) => ing.id === item.ingredienteId,
                                              )
                                                return ingrediente ? (
                                                  <div key={index} className="flex justify-between">
                                                    <span>{ingrediente.nome}</span>
                                                    <span>{item.percentual}%</span>
                                                  </div>
                                                ) : null
                                              })}
                                          </div>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              ) : null
                            })}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Correlações Nutricionais</h4>
                          <div className="space-y-2">
                            {aplicacoesSaude
                              .filter((a) => a.formulacaoId)
                              .slice(0, 5)
                              .map((aplicacao, index) => {
                                const formulacao = formulacoes.find((f) => f.id === aplicacao.formulacaoId) || {
                                  nome: "Formulação não encontrada",
                                  fase: "Desconhecida",
                                }
                                return (
                                  <div key={index} className="p-2 border rounded-md">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="font-medium">
                                          {aplicacao.tipo === "vacina" ? "Vacina" : "Medicamento"}: {aplicacao.nome}
                                        </span>
                                        <div className="text-sm text-muted-foreground">
                                          {aplicacao.data} - {aplicacao.loteId}
                                        </div>
                                      </div>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" size="sm">
                                            <Wheat className="h-4 w-4 mr-1" />
                                            Nutrição
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent>
                                          <div className="space-y-2">
                                            <h4 className="font-medium">Formulação: {formulacao.nome}</h4>
                                            <p className="text-sm">Fase: {formulacao.fase}</p>
                                            <div className="text-sm text-muted-foreground">
                                              A análise de correlação entre esta aplicação e a formulação pode ajudar a
                                              identificar padrões nutricionais relacionados à saúde.
                                            </div>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </div>
                                )
                              })}

                            <div className="p-3 bg-muted rounded-md mt-4">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">Dicas de Nutrição e Saúde</p>
                                  <ul className="text-sm space-y-1 mt-1">
                                    <li>
                                      Formulações com alto teor de proteína podem reduzir a necessidade de antibióticos
                                    </li>
                                    <li>
                                      Níveis adequados de cálcio são essenciais para prevenção de problemas ósseos
                                    </li>
                                    <li>Monitore a relação entre mudanças na formulação e ocorrências de saúde</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <Wheat className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Nenhuma associação entre formulações e aplicações de saúde registrada</p>
                      <p className="text-sm mt-2">
                        Associe formulações de ração às aplicações de saúde para analisar o impacto nutricional
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Aplicações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Próxima Dose</TableHead>
                    <TableHead>Formulação</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aplicacoesSaude.length > 0 ? (
                    aplicacoesSaude.map((aplicacao, index) => {
                      const formulacao = formulacoes.find((f) => f.id === aplicacao.formulacaoId)
                      return (
                        <TableRow key={index}>
                          <TableCell>{aplicacao.data}</TableCell>
                          <TableCell>{aplicacao.loteId}</TableCell>
                          <TableCell>{aplicacao.tipo === "vacina" ? "Vacina" : "Medicamento"}</TableCell>
                          <TableCell>{aplicacao.nome}</TableCell>
                          <TableCell>{aplicacao.quantidade || "N/A"}</TableCell>
                          <TableCell>{aplicacao.dataProxima || "N/A"}</TableCell>
                          <TableCell>
                            {formulacao ? (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Wheat className="h-3 w-3" />
                                {formulacao.nome}
                              </Badge>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{aplicacao.observacoes}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                        Nenhuma aplicação registrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
