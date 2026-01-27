"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DashboardLayout from "@/components/dashboard-layout"
import { Truck, Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Fornecedor } from "@/services/data-service"
import { useTips } from "@/contexts/tips-context"

export default function FornecedoresPage() {
  const { toast } = useToast()
  const { recordAction } = useTips()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])

  useEffect(() => {
    const savedFornecedores = localStorage.getItem("fornecedores")
    if (savedFornecedores) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFornecedores(JSON.parse(savedFornecedores))
    }
  }, [])
  
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    endereco: "",
    produtos: "",
  })

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const formatCNPJ = (input: string) => {
    let value = input.replace(/\D/g, "")
    if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2)
    if (value.length > 6) value = value.slice(0, 6) + "." + value.slice(6)
    if (value.length > 10) value = value.slice(0, 10) + "/" + value.slice(10)
    if (value.length > 15) value = value.slice(0, 15) + "-" + value.slice(15)
    return value.slice(0, 18)
  }

  const formatTelefone = (input: string) => {
    let value = input.replace(/\D/g, "")
    if (value.length > 2) value = "(" + value.slice(0, 2) + ") " + value.slice(2)
    if (value.length > 9) value = value.slice(0, 9) + "-" + value.slice(9)
    return value.slice(0, 15)
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCNPJ = formatCNPJ(e.target.value)
    setFormData((prev) => ({ ...prev, cnpj: formattedCNPJ }))
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedTelefone = formatTelefone(e.target.value)
    setFormData((prev) => ({ ...prev, telefone: formattedTelefone }))
  }

  const cadastrarFornecedor = () => {
    const { nome, cnpj, telefone, endereco, produtos } = formData

    if (!nome || !telefone || !endereco) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive",
      })
      return
    }

    if (cnpj && fornecedores.some((f) => f.cpfCnpj === cnpj)) {
      toast({
        title: "Erro",
        description: "CNPJ já cadastrado!",
        variant: "destructive",
      })
      return
    }

    // Create new supplier
    const newFornecedor: Fornecedor = {
      id: crypto.randomUUID(),
      nome,
      cpfCnpj: cnpj,
      telefone,
      endereco,
      produtos,
    }

    const updatedFornecedores = [...fornecedores, newFornecedor]

    // Save to localStorage
    localStorage.setItem("fornecedores", JSON.stringify(updatedFornecedores))

    setFornecedores(updatedFornecedores)

    toast({
      title: "Sucesso",
      description: "Fornecedor cadastrado com sucesso!",
    })

    recordAction("cadastrar_fornecedor")

    // Reset form
    setFormData({
      nome: "",
      cnpj: "",
      telefone: "",
      endereco: "",
      produtos: "",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Cadastrar Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(XX) XXXXX-XXXX"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleInputChange}
                    placeholder="Rua, número, bairro, cidade, estado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="produtos">Produtos Fornecidos</Label>
                  <Textarea
                    id="produtos"
                    name="produtos"
                    value={formData.produtos}
                    onChange={handleInputChange}
                    placeholder="Descreva os produtos fornecidos"
                    rows={3}
                  />
                </div>

                <Button className="w-full" onClick={cadastrarFornecedor}>
                  Cadastrar Fornecedor
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Lista de Fornecedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Produtos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.length > 0 ? (
                      fornecedores.map((fornecedor, index) => (
                        <TableRow key={index}>
                          <TableCell>{fornecedor.nome}</TableCell>
                          <TableCell>{fornecedor.cpfCnpj}</TableCell>
                          <TableCell>{fornecedor.telefone}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{fornecedor.produtos}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          Nenhum fornecedor cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
