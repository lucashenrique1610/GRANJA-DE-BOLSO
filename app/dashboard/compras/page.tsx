"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DashboardLayout from "@/components/dashboard-layout"
import { Calendar, ShoppingBag, Wheat, Syringe, Wrench, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useTips } from "@/contexts/tips-context"

import { useRouter } from "next/navigation"
import { DataService, type Fornecedor, type Compra, type Ingrediente } from "@/services/data-service"

/*
interface EstoqueIngredientes {
  milho: number
  soja: number
  fuba_fino: number
  fuba_grosso: number
  trigo: number
  calcario_calcitico: number
  nucleo_inicial: number
  nucleo_crescimento: number
  nucleo_postura: number
}
*/

export default function ComprasPage() {
  const { toast } = useToast()
  const { recordAction } = useTips()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("racao")
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [formRacao, setFormRacao] = useState({
    data: new Date().toLocaleDateString("pt-BR"),
    tipo: "",
    fornecedor: "",
    quantidade: "",
    precoUnitario: "",
    descricao: "",
  })
  const [formVeterinario, setFormVeterinario] = useState({
    data: new Date().toLocaleDateString("pt-BR"),
    fornecedor: "",
    tipo: "",
    valor: "",
  })
  const [formMaoObra, setFormMaoObra] = useState({
    data: new Date().toLocaleDateString("pt-BR"),
    descricao: "",
    valor: "",
  })
  const [formProdutos, setFormProdutos] = useState({
    data: new Date().toLocaleDateString("pt-BR"),
    fornecedor: "",
    descricao: "",
    valor: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [fornecedoresData, comprasData, ingredientesData] = await Promise.all([
          DataService.getFornecedores(),
          DataService.getCompras(),
          DataService.getIngredientes(),
        ])

        setFornecedores(fornecedoresData)
        setCompras(comprasData)
        setIngredientesDisponiveis(ingredientesData)
        
        // Check for alerts
        ingredientesData.forEach((ingrediente) => {
          if (ingrediente.estoque < 10) {
            toast({
              title: "Atenção",
              description: `Estoque de ${ingrediente.nome} está baixo!`,
            })
          }
        })
      } catch (error) {
        console.error("Erro ao carregar dados de compras:", error)
        toast({
          title: "Erro",
          description: "Falha ao carregar dados de compras.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Check URL parameters for active tab
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get("tab")
      if (tab === "racao") {
        setActiveTab("racao")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast])

  const handleRacaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormRacao((prev) => ({ ...prev, [name]: value }))
  }

  const handleVeterinarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormVeterinario((prev) => ({ ...prev, [name]: value }))
  }

  const handleMaoObraChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormMaoObra((prev) => ({ ...prev, [name]: value }))
  }

  const handleProdutosChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormProdutos((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string, form: "racao" | "veterinario" | "produtos") => {
    if (form === "racao") {
      setFormRacao((prev) => ({ ...prev, [name]: value }))
    } else if (form === "veterinario") {
      setFormVeterinario((prev) => ({ ...prev, [name]: value }))
    } else {
      setFormProdutos((prev) => ({ ...prev, [name]: value }))
    }
  }

  const formatDate = (input: string) => {
    let value = input.replace(/\D/g, "")
    if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2)
    if (value.length > 5) value = value.slice(0, 5) + "/" + value.slice(5)
    return value.slice(0, 10)
  }

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    form: "racao" | "veterinario" | "maoObra" | "produtos",
  ) => {
    const formattedDate = formatDate(e.target.value)
    if (form === "racao") {
      setFormRacao((prev) => ({ ...prev, data: formattedDate }))
    } else if (form === "veterinario") {
      setFormVeterinario((prev) => ({ ...prev, data: formattedDate }))
    } else if (form === "maoObra") {
      setFormMaoObra((prev) => ({ ...prev, data: formattedDate }))
    } else {
      setFormProdutos((prev) => ({ ...prev, data: formattedDate }))
    }
  }

  const validateDate = (date: string) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/
    if (!regex.test(date)) return false

    const [dia, mes, ano] = date.split("/").map(Number)
    const dataInserida = new Date(ano, mes - 1, dia)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (dataInserida.getDate() !== dia || dataInserida.getMonth() !== mes - 1 || dataInserida.getFullYear() !== ano)
      return false
    if (dataInserida > hoje) return false
    return true
  }

  const registrarCompraRacao = async () => {
    const { data, tipo, fornecedor, quantidade, precoUnitario, descricao } = formRacao

    if (!data || !tipo || !fornecedor || !quantidade || !precoUnitario) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive",
      })
      return
    }

    if (Number(quantidade) <= 0 || Number(precoUnitario) <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade e preço devem ser positivos!",
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

    // Find ingredient
    const ingrediente = ingredientesDisponiveis.find((ing) => ing.id === tipo)
    
    if (!ingrediente) {
       toast({
        title: "Erro",
        description: "Ingrediente não encontrado no cadastro!",
        variant: "destructive",
      })
      return
    }

    const qtdCompra = Number.parseFloat(quantidade)
    const precoCompra = Number.parseFloat(precoUnitario)
    const valorTotal = qtdCompra * precoCompra

    // Update ingredient stock and price (Weighted Average)
    const estoqueAtual = ingrediente.estoque || 0
    const precoAtual = ingrediente.preco || 0
    
    const novoEstoque = estoqueAtual + qtdCompra
    const novoPrecoMedio = ((estoqueAtual * precoAtual) + valorTotal) / novoEstoque

    const ingredienteAtualizado = {
      ...ingrediente,
      estoque: novoEstoque,
      preco: novoPrecoMedio
    }

    try {
      // Create new purchase
      const newCompra: Compra = {
        id: crypto.randomUUID(),
        data,
        fornecedor,
        tipo: ingrediente.nome,
        quantidade: qtdCompra,
        valor: valorTotal,
        descricao: descricao || `Compra de ${ingrediente.nome}`,
        categoria: "Ração",
      }

      // Save purchase and updated ingredient
      const [savedCompra, savedIngrediente] = await Promise.all([
        DataService.saveCompra(newCompra),
        DataService.saveIngrediente(ingredienteAtualizado)
      ])

      // Update local state
      setCompras([...compras, savedCompra])
      setIngredientesDisponiveis(
        ingredientesDisponiveis.map((i) => i.id === savedIngrediente.id ? savedIngrediente : i)
      )

      toast({
        title: "Sucesso",
        description: "Compra de ração registrada e estoque atualizado!",
      })

      // Reset form
      setFormRacao({
        data: new Date().toLocaleDateString("pt-BR"),
        tipo: "",
        fornecedor: "",
        quantidade: "",
        precoUnitario: "",
        descricao: "",
      })
    } catch (error) {
      console.error("Erro ao registrar compra de ração:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a compra!",
        variant: "destructive",
      })
    }
  }

  const registrarCompraVeterinario = async () => {
    const { data, fornecedor, tipo, valor } = formVeterinario

    if (!data || !fornecedor || !tipo || !valor) {
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

    try {
      // Create new purchase
      const newCompra: Compra = {
        id: crypto.randomUUID(),
        data,
        fornecedor,
        tipo,
        quantidade: 1,
        valor: Number.parseFloat(valor),
        descricao: `Compra de ${tipo}`,
        categoria: "Veterinário",
      }

      const savedCompra = await DataService.saveCompra(newCompra)
      setCompras([...compras, savedCompra])

      toast({
        title: "Sucesso",
        description: "Compra veterinária registrada com sucesso!",
      })

      // Reset form
      setFormVeterinario({
        data: new Date().toLocaleDateString("pt-BR"),
        fornecedor: "",
        tipo: "",
        valor: "",
      })
    } catch (error) {
      console.error("Erro ao registrar compra veterinária:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a compra!",
        variant: "destructive",
      })
    }
  }

  const registrarCompraMaoObra = async () => {
    const { data, descricao, valor } = formMaoObra

    if (!data || !descricao || !valor) {
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

    try {
      // Create new purchase
      const newCompra: Compra = {
        id: crypto.randomUUID(),
        data,
        fornecedor: "",
        tipo: "Serviço",
        quantidade: 1,
        valor: Number.parseFloat(valor),
        descricao,
        categoria: "Mão de Obra",
      }

      const savedCompra = await DataService.saveCompra(newCompra)
      setCompras([...compras, savedCompra])

      toast({
        title: "Sucesso",
        description: "Mão de obra registrada com sucesso!",
      })

      recordAction("registrar_compra", { categoria: "mao_obra" })

      // Reset form
      setFormMaoObra({
        data: new Date().toLocaleDateString("pt-BR"),
        descricao: "",
        valor: "",
      })
    } catch (error) {
      console.error("Erro ao registrar mão de obra:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a compra!",
        variant: "destructive",
      })
    }
  }

  const registrarCompraProdutos = async () => {
    const { data, fornecedor, descricao, valor } = formProdutos

    if (!data || !fornecedor || !descricao || !valor) {
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

    try {
      // Create new purchase
      const newCompra: Compra = {
        id: crypto.randomUUID(),
        data,
        fornecedor,
        tipo: "Produto",
        quantidade: 1,
        valor: Number.parseFloat(valor),
        descricao,
        categoria: "Produtos Diversos",
      }

      const savedCompra = await DataService.saveCompra(newCompra)
      setCompras([...compras, savedCompra])

      toast({
        title: "Sucesso",
        description: "Compra de produtos registrada com sucesso!",
      })

      recordAction("registrar_compra", { categoria: "produtos" })

      // Reset form
      setFormProdutos({
        data: new Date().toLocaleDateString("pt-BR"),
        fornecedor: "",
        descricao: "",
        valor: "",
      })
    } catch (error) {
      console.error("Erro ao registrar compra de produtos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a compra!",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  const deletarCompra = async (id: string) => {
    try {
      await DataService.deleteCompra(id)
      setCompras(compras.filter((c) => c.id !== id))
      toast({
        title: "Sucesso",
        description: "Compra deletada com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao deletar compra:", error)
      toast({
        title: "Erro",
        description: "Não foi possível deletar a compra!",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Compras</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="racao" className="flex items-center gap-2">
              <Wheat className="h-4 w-4" />
              Ração
            </TabsTrigger>
            <TabsTrigger value="veterinario" className="flex items-center gap-2">
              <Syringe className="h-4 w-4" />
              Veterinário
            </TabsTrigger>
            <TabsTrigger value="maoObra" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Mão de Obra
            </TabsTrigger>
            <TabsTrigger value="produtos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="racao" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wheat className="h-5 w-5 text-primary" />
                  Registrar Compra de Ração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data</Label>
                    <div className="relative">
                      <Input
                        id="data"
                        name="data"
                        value={formRacao.data}
                        onChange={(e) => handleDateChange(e, "racao")}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Ingrediente</Label>
                    <Select
                      name="tipo"
                      value={formRacao.tipo}
                      onValueChange={(value) => handleSelectChange("tipo", value, "racao")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredientesDisponiveis.length > 0 ? (
                            ingredientesDisponiveis.map((ing) => (
                                <SelectItem key={ing.id} value={ing.id}>{ing.nome}</SelectItem>
                            ))
                        ) : (
                             <SelectItem value="none" disabled>Nenhum ingrediente cadastrado na Formulação</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Select
                      name="fornecedor"
                      value={formRacao.fornecedor}
                      onValueChange={(value) => handleSelectChange("fornecedor", value, "racao")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map((fornecedor) => (
                          <SelectItem key={fornecedor.id || fornecedor.cpfCnpj} value={fornecedor.id || fornecedor.cpfCnpj || "unknown"}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade (kg)</Label>
                    <Input
                      id="quantidade"
                      name="quantidade"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formRacao.quantidade}
                      onChange={handleRacaoChange}
                      placeholder="Quantidade em kg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precoUnitario">Preço Unitário (R$)</Label>
                    <Input
                      id="precoUnitario"
                      name="precoUnitario"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formRacao.precoUnitario}
                      onChange={handleRacaoChange}
                      placeholder="Preço por kg"
                    />
                  </div>

                  <div className="space-y-2">
                     <Label>Total Estimado</Label>
                     <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 items-center bg-muted/50">
                        {formRacao.quantidade && formRacao.precoUnitario 
                            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(formRacao.quantidade) * Number(formRacao.precoUnitario))
                            : "R$ 0,00"}
                     </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      name="descricao"
                      value={formRacao.descricao}
                      onChange={handleRacaoChange}
                      placeholder="Descreva detalhes da compra (opcional)"
                      rows={3}
                    />
                  </div>
                </div>

                <Button className="w-full mt-6" onClick={registrarCompraRacao}>
                  Registrar Compra
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="veterinario" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-primary" />
                  Registrar Compra Veterinária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataVet">Data</Label>
                    <div className="relative">
                      <Input
                        id="dataVet"
                        name="data"
                        value={formVeterinario.data}
                        onChange={(e) => handleDateChange(e, "veterinario")}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fornecedorVet">Fornecedor/Veterinário</Label>
                    <Select
                      name="fornecedor"
                      value={formVeterinario.fornecedor}
                      onValueChange={(value) => handleSelectChange("fornecedor", value, "veterinario")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor ou veterinário" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map((fornecedor) => (
                          <SelectItem key={fornecedor.id || fornecedor.cpfCnpj} value={fornecedor.id || fornecedor.cpfCnpj || "unknown"}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoVet">Tipo (Produto/Serviço)</Label>
                    <Input
                      id="tipoVet"
                      name="tipo"
                      value={formVeterinario.tipo}
                      onChange={handleVeterinarioChange}
                      placeholder="Descrição do produto ou serviço"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valorVet">Valor (R$)</Label>
                    <Input
                      id="valorVet"
                      name="valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formVeterinario.valor}
                      onChange={handleVeterinarioChange}
                      placeholder="Valor total"
                    />
                  </div>

                  <Button className="w-full" onClick={registrarCompraVeterinario}>
                    Registrar Compra
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maoObra" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Registrar Mão de Obra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataMao">Data</Label>
                    <div className="relative">
                      <Input
                        id="dataMao"
                        name="data"
                        value={formMaoObra.data}
                        onChange={(e) => handleDateChange(e, "maoObra")}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricaoMao">Descrição</Label>
                    <Textarea
                      id="descricaoMao"
                      name="descricao"
                      value={formMaoObra.descricao}
                      onChange={handleMaoObraChange}
                      placeholder="Descreva o serviço"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valorMao">Valor (R$)</Label>
                    <Input
                      id="valorMao"
                      name="valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formMaoObra.valor}
                      onChange={handleMaoObraChange}
                      placeholder="Valor total"
                    />
                  </div>

                  <Button className="w-full" onClick={registrarCompraMaoObra}>
                    Registrar Compra
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produtos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Registrar Produtos para Granja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataProd">Data</Label>
                    <div className="relative">
                      <Input
                        id="dataProd"
                        name="data"
                        value={formProdutos.data}
                        onChange={(e) => handleDateChange(e, "produtos")}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fornecedorProd">Fornecedor</Label>
                    <Select
                      name="fornecedor"
                      value={formProdutos.fornecedor}
                      onValueChange={(value) => handleSelectChange("fornecedor", value, "produtos")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map((fornecedor) => (
                          <SelectItem key={fornecedor.id || fornecedor.cpfCnpj} value={fornecedor.id || fornecedor.cpfCnpj || "unknown"}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricaoProd">Descrição</Label>
                    <Textarea
                      id="descricaoProd"
                      name="descricao"
                      value={formProdutos.descricao}
                      onChange={handleProdutosChange}
                      placeholder="Descreva o produto"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valorProd">Valor (R$)</Label>
                    <Input
                      id="valorProd"
                      name="valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formProdutos.valor}
                      onChange={handleProdutosChange}
                      placeholder="Valor total"
                    />
                  </div>

                  <Button className="w-full" onClick={registrarCompraProdutos}>
                    Registrar Compra
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Histórico de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : compras.length > 0 ? (
                      compras.map((compra) => {
                        const fornecedor = fornecedores.find((f) => (f.id && f.id === compra.fornecedor) || f.cpfCnpj === compra.fornecedor)
                        return (
                          <TableRow key={compra.id}>
                            <TableCell>{compra.data}</TableCell>
                            <TableCell>{compra.categoria}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {compra.descricao || (fornecedor ? fornecedor.nome : "N/A")}
                            </TableCell>
                            <TableCell>{compra.quantidade}</TableCell>
                            <TableCell>{formatCurrency(compra.valor)}</TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deletarCompra(compra.id)}
                              >
                                Deletar
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                          Nenhuma compra registrada
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
