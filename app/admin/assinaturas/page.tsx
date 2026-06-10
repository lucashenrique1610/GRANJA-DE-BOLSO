"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, X, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"

// Interface para representar uma assinatura pendente
interface PendingSubscription {
  id: string
  userId: string
  userName: string
  userEmail: string
  planId: string
  planName: string
  amount: number
  reference: string
  date: string
  status: "pending" | "confirmed" | "rejected"
}

export default function AdminAssinaturasPage() {
  const { toast } = useToast()
  const { requireAuth } = useAuth()
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([])
  const [referenceInput, setReferenceInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Verificar autenticação e carregar dados reais
  useEffect(() => {
    requireAuth()

    const fetchSubscriptions = async () => {
        try {
            // Buscar sessão para token
            const sessionStr = localStorage.getItem("granja_session")
            if (!sessionStr) return
            const { access_token } = JSON.parse(sessionStr)

            // Buscar assinaturas do banco via API (vamos criar essa rota ou usar supabase client direto)
            // Aqui vamos usar uma rota API para garantir segurança e acesso admin
            const res = await fetch("/api/admin/subscriptions", {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            })
            
            if (res.ok) {
                const data = await res.json()
                setPendingSubscriptions(data)
            }
        } catch (error) {
            console.error("Erro ao carregar assinaturas:", error)
            toast({
                title: "Erro",
                description: "Não foi possível carregar as assinaturas.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    fetchSubscriptions()
  }, [requireAuth, toast])

  const handleConfirmSubscription = async (id: string) => {
    try {
        const sessionStr = localStorage.getItem("granja_session")
        if (!sessionStr) return
        const { access_token } = JSON.parse(sessionStr)

        const res = await fetch(`/api/admin/subscriptions/${id}/confirm`, {
            method: "POST",
            headers: { Authorization: `Bearer ${access_token}` }
        })

        if (!res.ok) throw new Error("Falha ao confirmar")

        setPendingSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, status: "confirmed" } : sub)))
        toast({
            title: "Assinatura confirmada",
            description: "O usuário agora tem acesso ao sistema.",
        })
    } catch {
        toast({
            title: "Erro",
            description: "Não foi possível confirmar a assinatura.",
            variant: "destructive"
        })
    }
  }

  const handleRejectSubscription = (id: string) => {
    // Em um sistema real, isso enviaria uma requisição para o backend
    setPendingSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, status: "rejected" } : sub)))

    toast({
      title: "Assinatura rejeitada",
      description: "O usuário foi notificado.",
      variant: "destructive",
    })
  }

  const handleSearchByReference = () => {
    if (!referenceInput) {
      toast({
        title: "Referência necessária",
        description: "Por favor, insira uma referência para buscar.",
        variant: "destructive",
      })
      return
    }

    // Em um sistema real, isso enviaria uma requisição para o backend
    toast({
      title: "Buscando assinatura",
      description: `Buscando assinatura com referência: ${referenceInput}`,
    })

    // Simular busca
    const found = pendingSubscriptions.find((sub) => sub.reference.toLowerCase() === referenceInput.toLowerCase())

    if (found) {
      // Destacar a assinatura encontrada
      setPendingSubscriptions((prev) => [found, ...prev.filter((sub) => sub.id !== found.id)])
    } else {
      toast({
        title: "Não encontrada",
        description: "Nenhuma assinatura encontrada com esta referência.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando assinaturas pendentes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Administração de Assinaturas</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Assinaturas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pendingSubscriptions.filter((sub) => sub.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Confirmadas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pendingSubscriptions.filter((sub) => sub.status === "confirmed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R${" "}
              {pendingSubscriptions
                .filter((sub) => sub.status === "confirmed")
                .reduce((sum, sub) => sum + sub.amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Buscar Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="reference" className="sr-only">
                Referência
              </Label>
              <Input
                id="reference"
                placeholder="Digite a referência do pagamento"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
              />
            </div>
            <Button onClick={handleSearchByReference}>Buscar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSubscriptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>{subscription.date}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.userName}</div>
                        <div className="text-sm text-muted-foreground">{subscription.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{subscription.planName}</TableCell>
                    <TableCell>R$ {subscription.amount.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-xs">{subscription.reference}</TableCell>
                    <TableCell>
                      {subscription.status === "pending" && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Pendente
                        </Badge>
                      )}
                      {subscription.status === "confirmed" && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Confirmada
                        </Badge>
                      )}
                      {subscription.status === "rejected" && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Rejeitada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscription.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                            onClick={() => handleConfirmSubscription(subscription.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                            onClick={() => handleRejectSubscription(subscription.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma assinatura pendente encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Esta é uma página de administração. Apenas administradores devem ter acesso a esta área.
        </AlertDescription>
      </Alert>
    </div>
  )
}
