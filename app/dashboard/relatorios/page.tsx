"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "@/components/dashboard-layout"
import { BarChart3, PieChart, LineChart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"


export default function RelatoriosPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("producao")
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mes")
  const [loteSelecionado, setLoteSelecionado] = useState("todos")
  const [lotes, setLotes] = useState<Lote[]>([])
  
  useEffect(() => {
    const savedLotes = localStorage.getItem("lotes")
    if (savedLotes) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLotes(JSON.parse(savedLotes))
    }
  }, [])
  
  const [dadosCarregados] = useState(true)

  const exportarRelatorio = () => {
    toast({
      title: "Exportação iniciada",
      description: "O relatório será baixado em breve.",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>

          <div className="flex items-center gap-2">
            <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="ano">Ano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={loteSelecionado} onValueChange={setLoteSelecionado}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Lote" />
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

            <Button variant="outline" size="sm" onClick={exportarRelatorio}>
              Exportar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="producao" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Produção
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="saude" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Saúde
            </TabsTrigger>
          </TabsList>

          <TabsContent value="producao" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produção de Ovos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {dadosCarregados ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <BarChart3 className="h-16 w-16 mb-2" />
                      <p>Gráfico de produção de ovos por {periodoSelecionado}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Carregando dados...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consumo de Ração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {dadosCarregados ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <BarChart3 className="h-16 w-16 mb-2" />
                      <p>Gráfico de consumo de ração por {periodoSelecionado}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Carregando dados...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {dadosCarregados ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <LineChart className="h-16 w-16 mb-2" />
                      <p>Gráfico de receitas e despesas por {periodoSelecionado}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Carregando dados...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lucratividade por Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {dadosCarregados ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <PieChart className="h-16 w-16 mb-2" />
                      <p>Gráfico de lucratividade por produto</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Carregando dados...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saude" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mortalidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {dadosCarregados ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <LineChart className="h-16 w-16 mb-2" />
                      <p>Gráfico de mortalidade por {periodoSelecionado}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Carregando dados...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aplicações de Saúde</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {dadosCarregados ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <BarChart3 className="h-16 w-16 mb-2" />
                      <p>Gráfico de aplicações de saúde por tipo</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Carregando dados...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

