"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DashboardLayout from "@/components/dashboard-layout"
import { Calendar, ShoppingCart, DollarSign } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useConfig } from "@/contexts/config-context"
import type { Cliente, Venda, Estoque, Lote } from "@/services/data-service"
import { ConfigService } from "@/services/config-service"
import { useTips } from "@/contexts/tips-context"

export default function VendasPage() {
  const { toast } = useToast()
  const { config } = useConfig()
  const { recordAction } = useTips()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [estoque, setEstoque] = useState<Estoque>({
    ovos: 0,
    galinhas_vivas: 0,
    galinhas_limpas: 0,
    cama_aves: 0,
  })
  const [lotes, setLotes] = useState<Lote[]>([])

  useEffect(() => {
    const savedClientes = localStorage.getItem("clientes")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedClientes) setClientes(JSON.parse(savedClientes))

    const savedVendas = localStorage.getItem("vendas")
    if (savedVendas) setVendas(JSON.parse(savedVendas))

    const savedEstoque = localStorage.getItem("estoque")
    if (savedEstoque) setEstoque(JSON.parse(savedEstoque))

    const savedLotes = localStorage.getItem("lotes")
    if (savedLotes) setLotes(JSON.parse(savedLotes))
  }, [])
  
  const [formData, setFormData] = useState({
    data: new Date().toLocaleDateString("pt-BR"),
    cliente: "",
    produto: "ovos" as "ovos" | "galinhas_vivas" | "galinhas_limpas" | "cama_aves",
    quantidade: "",
    pagamento: "dinheiro",
    valor: "0.00",
    loteId: "",
  })

  // Preços dos produtos - agora usando as configurações do sistema
  const PRECOS = {
    ovos: ConfigService.getDefaultPrice("ovos", config),
    galinhas_vivas: ConfigService.getDefaultPrice("galinhas_vivas", config),
    galinhas_limpas: ConfigService.getDefaultPrice("galinhas_limpas", config),
    cama_aves: ConfigService.getDefaultPrice("cama_aves", config),
  }

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Calculate total value when quantity changes
    if (name === "quantidade") {
      const quantidade = Number.parseInt(value) || 0
      const produto = formData.produto
      const valorTotal = (quantidade * PRECOS[produto as keyof typeof PRECOS]).toFixed(2)
      setFormData((prev) => ({ ...prev, valor: valorTotal }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "produto") {
      const produto = value as "ovos" | "galinhas_vivas" | "galinhas_limpas" | "cama_aves"
      const quantidade = Number.parseInt(formData.quantidade) || 0
      const valorTotal = (quantidade * PRECOS[produto]).toFixed(2)
      setFormData((prev) => ({ ...prev, produto, valor: valorTotal }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const registrarVenda = () => {
    const { data, cliente, produto, quantidade, pagamento, valor, loteId } = formData

    if (!data || !cliente || !produto || !quantidade || !pagamento || !loteId) {
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

    const quantidadeNum = Number.parseInt(quantidade)

    if (estoque[produto] < quantidadeNum) {
      toast({
        title: "Erro",
        description: "Estoque insuficiente!",
        variant: "destructive",
      })
      return
    }

    // Create new sale
    const newVenda: Venda = {
      data,
      cliente,
      produto,
      quantidade: quantidadeNum,
      pagamento,
      valor: Number.parseFloat(valor),
      loteId,
    }

    const updatedVendas = [...vendas, newVenda]

    // Update stock
    const updatedEstoque = { ...estoque }
    updatedEstoque[produto] -= quantidadeNum

    // Verificar se o estoque ficou baixo após a venda
    if (
      (produto === "ovos" || produto === "galinhas_vivas" || produto === "galinhas_limpas") &&
      ConfigService.isLowStock(
        produto as "ovos" | "galinhas_vivas" | "galinhas_limpas",
        updatedEstoque[produto],
        config,
      ) &&
      ConfigService.shouldShowAlert("alertasEstoque", config)
    ) {
      toast({
        title: "Alerta de Estoque",
        description: `O estoque de ${produto} está baixo!`,
      })
    }

    // Save to localStorage
    localStorage.setItem("vendas", JSON.stringify(updatedVendas))
    localStorage.setItem("estoque", JSON.stringify(updatedEstoque))

    setVendas(updatedVendas)
    setEstoque(updatedEstoque)

    toast({
      title: "Sucesso",
      description: "Venda registrada com sucesso!",
    })

    recordAction("registrar_venda", { produto })

    // Reset form
    setFormData({
      data: new Date().toLocaleDateString("pt-BR"),
      cliente: "",
      produto: "ovos",
      quantidade: "",
      pagamento: "dinheiro",
      valor: "0.00",
      loteId: "",
    })
  }

  const formatCurrency = (value: number) => {
    return ConfigService.formatCurrency(value, config)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Registrar Venda
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
                        value={formData.data}
                        onChange={handleDateChange}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente</Label>
                    <Select
                      name="cliente"
                      value={formData.cliente}
                      onValueChange={(value) => handleSelectChange("cliente", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id || cliente.cpfCnpj} value={cliente.id || cliente.cpfCnpj || "unknown"}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="produto">Produto</Label>
                    <Select
                      name="produto"
                      value={formData.produto}
                      onValueChange={(value) => handleSelectChange("produto", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ovos">Ovos</SelectItem>
                        <SelectItem value="galinhas_vivas">Galinhas Vivas</SelectItem>
                        <SelectItem value="galinhas_limpas">Galinhas Limpas</SelectItem>
                        <SelectItem value="cama_aves">Cama das Aves</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      name="quantidade"
                      type="number"
                      min="1"
                      value={formData.quantidade}
                      onChange={handleInputChange}
                      placeholder={`Disponível: ${estoque[formData.produto] || 0}`}
                    />
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
                    <Label htmlFor="pagamento">Forma de Pagamento</Label>
                    <Select
                      name="pagamento"
                      value={formData.pagamento}
                      onValueChange={(value) => handleSelectChange("pagamento", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="pix">Pix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor Total ({config.unidades.moeda})</Label>
                    <div className="relative">
                      <Input id="valor" name="valor" value={formData.valor} readOnly className="bg-muted" />
                      <DollarSign className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6" onClick={registrarVenda}>
                  Registrar Venda
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Estoque Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Ovos</span>
                    <span className="font-medium">{estoque.ovos} unidades</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Galinhas Vivas</span>
                    <span className="font-medium">{estoque.galinhas_vivas} unidades</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Galinhas Limpas</span>
                    <span className="font-medium">{estoque.galinhas_limpas} unidades</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cama das Aves</span>
                    <span className="font-medium">{estoque.cama_aves} unidades</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Lote</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.length > 0 ? (
                    vendas.map((venda, index) => {
                      const cliente = clientes.find((c) => (c.id && c.id === venda.cliente) || c.cpfCnpj === venda.cliente)
                      return (
                        <TableRow key={index}>
                          <TableCell>{venda.data}</TableCell>
                          <TableCell>{cliente ? cliente.nome : "Desconhecido"}</TableCell>
                          <TableCell>
                            {venda.produto === "ovos"
                              ? "Ovos"
                              : venda.produto === "galinhas_vivas"
                                ? "Galinhas Vivas"
                                : venda.produto === "galinhas_limpas"
                                  ? "Galinhas Limpas"
                                  : "Cama das Aves"}
                          </TableCell>
                          <TableCell>{venda.quantidade}</TableCell>
                          <TableCell>{formatCurrency(venda.valor)}</TableCell>
                          <TableCell>
                            {venda.pagamento === "dinheiro"
                              ? "Dinheiro"
                              : venda.pagamento === "cartao"
                                ? "Cartão"
                                : "Pix"}
                          </TableCell>
                          <TableCell>{venda.loteId}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                        Nenhuma venda registrada
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
