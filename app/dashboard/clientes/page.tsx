"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DashboardLayout from "@/components/dashboard-layout"
import { Users, User, Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/data-table"
import { formatPhone, formatCPF, formatCNPJ } from "@/lib/format-utils"
import { DataService, type Cliente } from "@/services/data-service"
import { useTips } from "@/contexts/tips-context"

export default function ClientesPage() {
  const { toast } = useToast()
  const { recordAction } = useTips()
  const [activeTab, setActiveTab] = useState("fisico")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [formFisico, setFormFisico] = useState({
    nome: "",
    endereco: "",
    whatsapp: "",
    cpf: "",
  })
  const [formJuridico, setFormJuridico] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    endereco: "",
  })
  useEffect(() => {
    const load = async () => {
      try {
        const data = await DataService.getClientes()
        setClientes(data)
      } catch (error) {
        console.error("Erro ao carregar clientes:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de clientes!",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  const handleFisicoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormFisico((prev) => ({ ...prev, [name]: value }))
  }

  const handleJuridicoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormJuridico((prev) => ({ ...prev, [name]: value }))
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value)
    setFormFisico((prev) => ({ ...prev, cpf: formattedCPF }))
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCNPJ = formatCNPJ(e.target.value)
    setFormJuridico((prev) => ({ ...prev, cnpj: formattedCNPJ }))
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>, form: "fisico" | "juridico") => {
    const formattedTelefone = formatPhone(e.target.value)
    if (form === "fisico") {
      setFormFisico((prev) => ({ ...prev, whatsapp: formattedTelefone }))
    } else {
      setFormJuridico((prev) => ({ ...prev, telefone: formattedTelefone }))
    }
  }

  const cadastrarClienteFisico = async () => {
    const { nome, endereco, whatsapp, cpf } = formFisico

    if (!nome || !endereco || !whatsapp) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive",
      })
      return
    }

    if (cpf && clientes.some((c) => c.cpfCnpj === cpf)) {
      toast({
        title: "Erro",
        description: "CPF já cadastrado!",
        variant: "destructive",
      })
      return
    }

    try {
      const newCliente: Cliente = {
        id: crypto.randomUUID(),
        nome,
        endereco,
        telefone: whatsapp,
        cpfCnpj: cpf,
        tipo: "fisico",
      }
      await DataService.saveCliente(newCliente)
      setClientes([...clientes, newCliente])

      toast({
        title: "Sucesso",
        description: "Cliente físico cadastrado com sucesso!",
      })
      recordAction("cadastrar_cliente", { tipo: "fisico" })

      setFormFisico({
        nome: "",
        endereco: "",
        whatsapp: "",
        cpf: "",
      })
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cliente!",
        variant: "destructive",
      })
    }
  }

  const cadastrarClienteJuridico = async () => {
    const { nome, endereco, telefone, cnpj } = formJuridico

    if (!nome || !endereco || !telefone) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive",
      })
      return
    }

    if (cnpj && clientes.some((c) => c.cpfCnpj === cnpj)) {
      toast({
        title: "Erro",
        description: "CNPJ já cadastrado!",
        variant: "destructive",
      })
      return
    }

    try {
      const newCliente: Cliente = {
        id: crypto.randomUUID(),
        nome,
        endereco,
        telefone,
        cpfCnpj: cnpj,
        tipo: "juridico",
      }
      await DataService.saveCliente(newCliente)
      setClientes([...clientes, newCliente])

      toast({
        title: "Sucesso",
        description: "Cliente jurídico cadastrado com sucesso!",
      })
      recordAction("cadastrar_cliente", { tipo: "juridico" })

      setFormJuridico({
        nome: "",
        endereco: "",
        telefone: "",
        cnpj: "",
      })
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cliente!",
        variant: "destructive",
      })
    }
  }

  const deletarCliente = async (id: string) => {
    try {
      await DataService.deleteCliente(id)
      setClientes(clientes.filter((c) => c.id !== id))
      toast({
        title: "Sucesso",
        description: "Cliente deletado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao deletar cliente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível deletar o cliente!",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fisico" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Pessoa Física
            </TabsTrigger>
            <TabsTrigger value="juridico" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Pessoa Jurídica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fisico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Cadastrar Cliente Físico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formFisico.nome}
                      onChange={handleFisicoChange}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={formFisico.cpf}
                      onChange={handleCPFChange}
                      placeholder="XXX.XXX.XXX-XX"
                      maxLength={14}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={formFisico.whatsapp}
                      onChange={(e) => handleTelefoneChange(e, "fisico")}
                      placeholder="(XX) XXXXX-XXXX"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      name="endereco"
                      value={formFisico.endereco}
                      onChange={handleFisicoChange}
                      placeholder="Rua, número, bairro, cidade, estado"
                    />
                  </div>
                </div>

                <Button className="w-full mt-6" onClick={cadastrarClienteFisico}>
                  Cadastrar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="juridico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Cadastrar Cliente Jurídico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                    <Input
                      id="nomeEmpresa"
                      name="nome"
                      value={formJuridico.nome}
                      onChange={handleJuridicoChange}
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      value={formJuridico.cnpj}
                      onChange={handleCNPJChange}
                      placeholder="XX.XXX.XXX/XXXX-XX"
                      maxLength={18}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formJuridico.telefone}
                      onChange={(e) => handleTelefoneChange(e, "juridico")}
                      placeholder="(XX) XXXXX-XXXX"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="enderecoEmpresa">Endereço</Label>
                    <Input
                      id="enderecoEmpresa"
                      name="endereco"
                      value={formJuridico.endereco}
                      onChange={handleJuridicoChange}
                      placeholder="Rua, número, bairro, cidade, estado"
                    />
                  </div>
                </div>

                <Button className="w-full mt-6" onClick={cadastrarClienteJuridico}>
                  Cadastrar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Lista de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={clientes}
              columns={[
                { header: "Nome", accessor: "nome" },
                {
                  header: "Tipo",
                  accessor: (cliente) => (cliente.tipo === "fisico" ? "Pessoa Física" : "Pessoa Jurídica"),
                },
                { header: "CPF/CNPJ", accessor: "cpfCnpj" },
                { header: "Telefone", accessor: "telefone" },
                {
                  header: "Endereço",
                  accessor: "endereco",
                  className: "max-w-[200px] truncate",
                },
                {
                  header: "Ações",
                  accessor: (cliente) => (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletarCliente(cliente.id)}
                    >
                      Deletar
                    </Button>
                  ),
                },
              ]}
              emptyMessage={loading ? "Carregando..." : "Nenhum cliente cadastrado"}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
