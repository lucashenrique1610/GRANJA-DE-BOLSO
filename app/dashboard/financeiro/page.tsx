"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DashboardLayout from "@/components/dashboard-layout"
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Lote, Venda, Compra } from "@/services/data-service"

export default function FinanceiroPage() {
  const { toast } = useToast()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [selectedLote, setSelectedLote] = useState("todos")
  const [financialData, setFinancialData] = useState({
    receitas: 0,
    despesas: 0,
    lucroLiquido: 0,
    margemLucro: 0,
  })
  const [custoPorLote, setCustoPorLote] = useState({
    custoTotal: 0,
    receitaLote: 0,
    lucroLote: 0,
  })
  const [categoriasDespesas, setCategoriasDespesas] = useState<{ [key: string]: number }>({})
  const [chartInstance, setChartInstance] = useState<any>(null)

  useEffect(() => {
    // Load data from localStorage
    loadData()
  }, [])

  useEffect(() => {
    // Update financial data when lote selection changes
    atualizarFinanceiro()
  }, [selectedLote, vendas, compras, lotes])

  const loadData = () => {
    try {
      const lotesData = JSON.parse(localStorage.getItem("lotes") || "[]")
      const vendasData = JSON.parse(localStorage.getItem("vendas") || "[]")
      const comprasData = JSON.parse(localStorage.getItem("compras") || "[]")

      setLotes(lotesData)
      setVendas(vendasData)
      setCompras(comprasData)
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar dados financeiros.",
        variant: "destructive",
      })
    }
  }

  const atualizarFinanceiro = () => {
    // Calculate revenues and expenses
    let receitas = vendas.reduce((sum, v) => sum + v.valor, 0)
    let despesas = compras.reduce((sum, c) => sum + c.valor, 0) + lotes.reduce((sum, l) => sum + l.valorLote, 0)

    if (selectedLote !== "todos") {
      receitas = vendas.filter((v) => v.loteId === selectedLote).reduce((sum, v) => sum + v.valor, 0)
      despesas =
        compras.filter((c) => c.loteId === selectedLote).reduce((sum, c) => sum + c.valor, 0) +
        lotes.filter((l) => l.id === selectedLote).reduce((sum, l) => sum + l.valorLote, 0)
    }

    const lucroLiquido = receitas - despesas
    const margemLucro = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0

    setFinancialData({
      receitas,
      despesas,
      lucroLiquido,
      margemLucro,
    })

    // Update cost per batch
    if (selectedLote !== "todos") {
      atualizarCustoPorLote(selectedLote)
    }

    // Update expense categories
    atualizarCategoriasDespesas()

    // Update chart
    atualizarGraficoFluxoCaixa(receitas, despesas, lucroLiquido)
  }

  const atualizarCustoPorLote = (loteId: string) => {
    if (!loteId || loteId === "todos") return

    const lote = lotes.find((l) => l.id === loteId)
    if (!lote) return

    const custoLote = lotes.filter((l) => l.id === loteId).reduce((sum, l) => sum + l.valorLote, 0)

    // Simplified calculation for feed cost
    const custoRacao = compras
      .filter((c) => c.categoria === "Ração" && c.loteId === loteId)
      .reduce((sum, c) => sum + c.valor, 0)

    // Simplified calculation for health cost
    const custoSaude = compras
      .filter((c) => c.categoria === "Veterinário" && c.loteId === loteId)
      .reduce((sum, c) => sum + c.valor, 0)

    const receitaLote = vendas.filter((v) => v.loteId === loteId).reduce((sum, v) => sum + v.valor, 0)

    const custoTotal = custoLote + custoRacao + custoSaude
    const lucroLote = receitaLote - custoTotal

    setCustoPorLote({
      custoTotal,
      receitaLote,
      lucroLote,
    })
  }

  const atualizarCategoriasDespesas = () => {
    const categorias: { [key: string]: number } = {
      Ração: 0,
      Veterinário: 0,
      "Mão de Obra": 0,
      "Produtos Diversos": 0,
      "Compra de Lotes": 0,
    }

    // Group expenses by category
    compras.forEach((c) => {
      if (selectedLote !== "todos" && c.loteId !== selectedLote) return

      if (categorias[c.categoria] !== undefined) {
        categorias[c.categoria] += c.valor
      } else {
        categorias[c.categoria] = c.valor
      }
    })

    // Add lote purchases
    if (selectedLote === "todos") {
      categorias["Compra de Lotes"] = lotes.reduce((sum, l) => sum + l.valorLote, 0)
    } else {
      const lote = lotes.find((l) => l.id === selectedLote)
      if (lote) {
        categorias["Compra de Lotes"] = lote.valorLote
      }
    }

    setCategoriasDespesas(categorias)
  }

  const atualizarGraficoFluxoCaixa = (receitas: number, despesas: number, lucro: number) => {
    // In a real implementation, this would use Chart.js to render a chart
    // For this example, we'll just update the state
    setChartInstance({ receitas, despesas, lucro })
  }

  const exportarRelatorioFinanceiro = () => {
    const dados = [
      ["Data", "Categoria", "Descrição", "Valor"],
      ...vendas.map((v) => [v.data, "Receita", v.produto, v.valor]),
      ...compras.map((c) => [c.data, "Despesa", c.categoria, c.valor]),
      ...lotes.map((l) => [l.dataCompra, "Despesa", "Compra de Lote", l.valorLote]),
    ]

    // In a real implementation, this would create a CSV file for download
    toast({
      title: "Exportação",
      description: "Relatório financeiro exportado com sucesso!",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>

          <div className="flex items-center gap-2">
            <Select value={selectedLote} onValueChange={setSelectedLote}>
              <SelectTrigger className="w-[180px]">
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

            <Button variant="outline" size="icon" onClick={exportarRelatorioFinanceiro}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receitas Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(financialData.receitas)}</div>
                <div className="flex items-center gap-1 text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Despesas Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(financialData.despesas)}</div>
                <div className="flex items-center gap-1 text-red-500">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div
                  className={`text-2xl font-bold ${financialData.lucroLiquido >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {formatCurrency(financialData.lucroLiquido)}
                </div>
                <DollarSign
                  className={`h-5 w-5 ${financialData.lucroLiquido >= 0 ? "text-emerald-500" : "text-red-500"}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Margem de Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div
                  className={`text-2xl font-bold ${financialData.margemLucro >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {formatPercent(financialData.margemLucro)}
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedLote !== "todos" && (
          <Card>
            <CardHeader>
              <CardTitle>Análise do Lote {selectedLote}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Custo Total</div>
                  <div className="text-xl font-bold">{formatCurrency(custoPorLote.custoTotal)}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Receita do Lote</div>
                  <div className="text-xl font-bold">{formatCurrency(custoPorLote.receitaLote)}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Lucro do Lote</div>
                  <div
                    className={`text-xl font-bold ${custoPorLote.lucroLote >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {formatCurrency(custoPorLote.lucroLote)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(categoriasDespesas).map(([categoria, valor]) => (
                      <TableRow key={categoria}>
                        <TableCell>{categoria}</TableCell>
                        <TableCell className="text-right">{formatCurrency(valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mb-2" />
                  <p>Gráfico de fluxo de caixa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ...vendas.map((v) => ({
                      data: v.data,
                      tipo: "Receita",
                      descricao: `Venda de ${v.produto}`,
                      valor: v.valor,
                    })),
                    ...compras.map((c) => ({
                      data: c.data,
                      tipo: "Despesa",
                      descricao: c.descricao || c.categoria,
                      valor: -c.valor,
                    })),
                  ]
                    .sort((a, b) => {
                      const dateA = new Date(a.data.split("/").reverse().join("-"))
                      const dateB = new Date(b.data.split("/").reverse().join("-"))
                      return dateB.getTime() - dateA.getTime()
                    })
                    .slice(0, 10)
                    .map((transacao, index) => (
                      <TableRow key={index}>
                        <TableCell>{transacao.data}</TableCell>
                        <TableCell>{transacao.tipo}</TableCell>
                        <TableCell>{transacao.descricao}</TableCell>
                        <TableCell
                          className={`text-right ${transacao.valor >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {formatCurrency(transacao.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
