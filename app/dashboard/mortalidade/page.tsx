"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import DashboardLayout from "@/components/dashboard-layout"
import { Skull } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DateInput } from "@/components/date-input"
import { DataTable } from "@/components/data-table"
import useLocalStorage from "@/hooks/use-local-storage"
import type { Lote, Mortalidade as MortalidadeRec, Estoque } from "@/services/data-service"
import { validateDate } from "@/lib/date-utils"
// Remover importações de Table não utilizadas

export default function MortalidadePage() {
  const { toast } = useToast()
  // Usar apenas o getter já que o setter não é usado
  const [lotes] = useLocalStorage<Lote[]>("lotes", [])
  const [mortalidade, setMortalidade] = useLocalStorage<MortalidadeRec[]>("mortalidade", [])
  const [formData, setFormData] = useState({
    data: new Date().toLocaleDateString("pt-BR"),
    loteId: "",
    quantidade: "",
    causa: "doenca",
    observacoes: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const registrarMortalidade = () => {
    const { data, loteId, quantidade, causa, observacoes } = formData

    if (!data || !loteId || !quantidade) {
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

    // Get current stock
    let estoque: Estoque
    try {
      estoque = JSON.parse(localStorage.getItem("estoque") || "{}")
    } catch (e) {
      console.error("Erro ao ler estoque:", e)
      toast({
        title: "Erro",
        description: "Falha ao ler dados do estoque.",
        variant: "destructive",
      })
      return
    }

    if (Number.parseInt(quantidade) > estoque.galinhas_vivas) {
      toast({
        title: "Erro",
        description: "Quantidade de mortalidade excede o estoque de galinhas vivas!",
        variant: "destructive",
      })
      return
    }

    // Add new mortality record
    const newMortalidade: MortalidadeRec = {
      data,
      loteId,
      quantidade: Number.parseInt(quantidade),
      causa,
      observacoes: observacoes || "Nenhuma",
    }

    // Update stock
    estoque.galinhas_vivas -= Number.parseInt(quantidade)

    // Save to localStorage
    localStorage.setItem("estoque", JSON.stringify(estoque))
    setMortalidade([...mortalidade, newMortalidade])

    toast({
      title: "Sucesso",
      description: "Mortalidade registrada com sucesso!",
    })

    // Reset form
    setFormData({
      data: new Date().toLocaleDateString("pt-BR"),
      loteId: "",
      quantidade: "",
      causa: "doenca",
      observacoes: "",
    })
  }

  const getCausaDisplay = (causa: string) => {
    switch (causa) {
      case "doenca":
        return "Doença"
      case "calor":
        return "Estresse por Calor"
      default:
        return "Outros"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Registro de Mortalidade</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skull className="h-5 w-5 text-destructive" />
                Registrar Mortalidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DateInput
                  id="data"
                  label="Data"
                  value={formData.data}
                  onChange={(value) => setFormData((prev) => ({ ...prev, data: value }))}
                  required
                />

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
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    name="quantidade"
                    type="number"
                    min="0"
                    value={formData.quantidade}
                    onChange={handleInputChange}
                    placeholder="Quantidade de aves"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="causa">Causa Suspeita</Label>
                  <Select
                    name="causa"
                    value={formData.causa}
                    onValueChange={(value) => handleSelectChange("causa", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a causa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doenca">Doença</SelectItem>
                      <SelectItem value="calor">Estresse por Calor</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    placeholder="Detalhes sobre a ocorrência"
                    rows={3}
                  />
                </div>

                <Button className="w-full" onClick={registrarMortalidade}>
                  Registrar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mortalidade</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={mortalidade}
                columns={[
                  { header: "Data", accessor: "data" },
                  { header: "Lote", accessor: "loteId" },
                  { header: "Quantidade", accessor: "quantidade" },
                  {
                    header: "Causa",
                    accessor: (item) => getCausaDisplay(item.causa),
                  },
                  {
                    header: "Observações",
                    accessor: "observacoes",
                    className: "max-w-[200px] truncate",
                  },
                ]}
                emptyMessage="Nenhum registro de mortalidade encontrado"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
