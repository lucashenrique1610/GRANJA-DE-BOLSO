"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/dashboard-layout"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useConfig } from "@/contexts/config-context"
import { DataService } from "@/services/data-service"
import {
  User,
  Settings,
  Database,
  Download,
  Save,
  Moon,
  Sun,
  Loader2,
  AlertTriangle,
  Egg,
  Bird,
  DollarSign,
  Scale,
  RefreshCw,
  Trash2,
  Cloud,
  Lock,
  Check,
  CalendarIcon,
  Upload
} from "lucide-react"
import { BackupService, type BackupMetadata } from "@/services/backup-service"

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const { user, updateUser } = useAuth()
  const { config, updateNotificacoes, updateUnidades, updateSistema, setTema, updateClima } = useConfig()
  const [activeTab, setActiveTab] = useState("perfil")
  const [supabaseStatus, setSupabaseStatus] = useState<"idle" | "ok" | "error">("idle")

  // Configurações de perfil
  const [perfilForm, setPerfilForm] = useState({
    nome: "",
    email: "",
    telefone: "",
  })

  // Configurações de senha
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  })

  // Estado para backup
  const [backupData, setBackupData] = useState<string | null>(null)
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const [cloudBackups, setCloudBackups] = useState<BackupMetadata[]>([])
  const [backupPassword, setBackupPassword] = useState("")
  const [isBackupLoading, setIsBackupLoading] = useState(false)
  const [autoBackupFreq, setAutoBackupFreq] = useState<"daily" | "weekly" | "off">("off")
  const [retentionDays, setRetentionDays] = useState("30")
  const [lastAutoBackup, setLastAutoBackup] = useState<number | null>(null)

  useEffect(() => {
    if (activeTab === "backup" && user) {
      loadCloudBackups()
    }
    const cfg = localStorage.getItem("backup_auto_config")
    if (cfg) {
        try {
            const p = JSON.parse(cfg)
            setAutoBackupFreq(p.frequency)
            if (p.retention) setRetentionDays(String(p.retention))
            if (p.lastBackup) setLastAutoBackup(p.lastBackup)
        } catch {}
    }
    const key = localStorage.getItem("backup_auto_key")
    if (key) setBackupPassword(key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const loadCloudBackups = async () => {
    try {
      const list = await BackupService.listBackups()
      setCloudBackups(list)
    } catch (e) {
      console.error(e)
    }
  }

  const handleRetentionChange = (val: string) => {
      setRetentionDays(val)
      const cfgRaw = localStorage.getItem("backup_auto_config")
      if (cfgRaw) {
          try {
              const cfg = JSON.parse(cfgRaw)
              cfg.retention = parseInt(val)
              localStorage.setItem("backup_auto_config", JSON.stringify(cfg))
          } catch {}
      }
  }

  const handleAutoBackupChange = (val: string) => {
    const freq = val as "daily" | "weekly" | "off"
    setAutoBackupFreq(freq)
    if (freq === "off") {
        localStorage.removeItem("backup_auto_config")
        localStorage.removeItem("backup_auto_key")
        toast({ title: "Backup Automático", description: "Desativado" })
    } else {
        if (!backupPassword) {
            toast({ title: "Senha requerida", description: "Digite a senha acima para habilitar o automático", variant: "destructive" })
            setAutoBackupFreq("off")
            return
        }
        localStorage.setItem("backup_auto_config", JSON.stringify({ 
            frequency: freq, 
            lastBackup: 0,
            retention: parseInt(retentionDays)
        }))
        localStorage.setItem("backup_auto_key", backupPassword)
        toast({ title: "Backup Automático", description: `Ativado: ${freq === 'daily' ? 'Diário' : 'Semanal'}` })
    }
  }


  const handleCloudBackup = async () => {
    if (!backupPassword) {
      toast({ title: "Senha requerida", description: "Defina uma senha para criptografar seu backup", variant: "destructive" })
      return
    }
    setIsBackupLoading(true)
    try {
      await BackupService.createBackup(backupPassword, `Backup manual por ${user?.nome || "Usuário"}`)
      toast({ title: "Sucesso", description: "Backup na nuvem realizado com sucesso!" })
      loadCloudBackups()
    } catch (e: any) {
      console.error("Erro no backup:", e)
      const msg = e.message || String(e)
      toast({ 
        title: "Erro no Backup", 
        description: `Falha: ${msg}`, 
        variant: "destructive" 
      })
    } finally {
      setIsBackupLoading(false)
    }
  }

  const handleCloudRestore = async (id: string) => {
    if (!backupPassword) {
      toast({ title: "Senha requerida", description: "Informe a senha para descriptografar o backup", variant: "destructive" })
      return
    }
    if (!confirm("Isso substituirá TODOS os dados atuais. Continuar?")) return

    setIsBackupLoading(true)
    try {
      await BackupService.restoreBackup(id, backupPassword)
      toast({ title: "Sucesso", description: "Dados restaurados! Recarregando..." })
    } catch (e: any) {
      console.error("Erro no restore:", e)
      const msg = e.message || String(e)
      toast({ 
        title: "Erro na Restauração", 
        description: `Falha: ${msg}`, 
        variant: "destructive" 
      })
      setIsBackupLoading(false)
    }
  }


  useEffect(() => {
    // Carregar dados do usuário
    if (user) {
      setPerfilForm({
        nome: user.nome || "",
        email: user.email || "",
        telefone: user.telefone || "",
      })
    }
  }, [user])

  const handlePerfilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPerfilForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSenhaForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSistemaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    updateSistema(name as keyof typeof config.sistema, value)
  }

  const salvarPerfil = async () => {
    if (!perfilForm.nome || !perfilForm.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios!",
        variant: "destructive",
      })
      return
    }

    // Atualizar dados do usuário
    if (updateUser) {
      const ok = await updateUser({
        ...(user || { id: "", email: perfilForm.email }),
        nome: perfilForm.nome,
        email: perfilForm.email,
        telefone: perfilForm.telefone,
      })
      toast({
        title: ok ? "Sucesso" : "Erro",
        description: ok ? "Perfil atualizado com sucesso!" : "Falha ao atualizar o perfil",
        variant: ok ? undefined : "destructive",
      })
    }
  }

  const alterarSenha = () => {
    if (!senhaForm.senhaAtual || !senhaForm.novaSenha || !senhaForm.confirmarSenha) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios!",
        variant: "destructive",
      })
      return
    }

    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem!",
        variant: "destructive",
      })
      return
    }

    // Verificar senha atual (simulado)
    if (senhaForm.senhaAtual !== "senha123") {
      toast({
        title: "Erro",
        description: "Senha atual incorreta!",
        variant: "destructive",
      })
      return
    }

    // Atualizar senha (simulado)
    toast({
      title: "Sucesso",
      description: "Senha alterada com sucesso!",
    })

    // Limpar formulário
    setSenhaForm({
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    })
  }

  const salvarConfiguracoes = () => {
    // As configurações já são salvas automaticamente pelos métodos do contexto
    toast({
      title: "Sucesso",
      description: "Configurações salvas com sucesso!",
    })
  }

  const testarConexao = async () => {
    const res = await DataService.testSupabaseConnection()
    if (res.ok) {
      toast({ title: "Supabase", description: "Conexão bem-sucedida" })
      setSupabaseStatus("ok")
    } else {
      toast({ title: "Supabase", description: res.error || "Falha na conexão", variant: "destructive" })
      setSupabaseStatus("error")
    }
  }

  const gerarBackup = () => {
    try {
      // Coletar todos os dados do localStorage
      const backup: Record<string, unknown> = {}

      // Lista de chaves a serem incluídas no backup
      const keysToBackup = [
        "lotes",
        "clientes",
        "fornecedores",
        "vendas",
        "compras",
        "estoque",
        "manejoDia",
        "aplicacoesSaude",
        "mortalidade",
        "formulacoes",
        "ingredientes",
        "estoqueIngredientes",
        "estoqueRacoes",
        "rankingIngredientes",
        "historicoFormulacoes",
        "pesosLotes",
        "usuarios",
        "configuracoes",
      ]

      keysToBackup.forEach((key) => {
        const data = localStorage.getItem(key)
        if (data) {
          backup[key] = JSON.parse(data)
        }
      })

      // Adicionar metadados
      backup.metadata = {
        dataBackup: new Date().toISOString(),
        versao: "1.0.0",
        usuario: user?.nome,
      }

      // Converter para JSON
      const backupJson = JSON.stringify(backup, null, 2)

      // Criar link para download
      const blob = new Blob([backupJson], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `granja-de-bolso-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Backup gerado",
        description: "O arquivo de backup foi baixado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao gerar backup:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o backup!",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupFile(e.target.files[0])

      // Ler conteúdo do arquivo
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setBackupData(event.target.result as string)
        }
      }
      reader.readAsText(e.target.files[0])
    }
  }

  const restaurarBackup = () => {
    if (!backupData) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo de backup selecionado!",
        variant: "destructive",
      })
      return
    }

    try {
      const data = JSON.parse(backupData)

      // Verificar se o backup é válido
      if (!data.metadata) {
        throw new Error("Arquivo de backup inválido!")
      }

      // Confirmar restauração
      if (!confirm("Atenção! Restaurar o backup substituirá todos os dados atuais. Deseja continuar?")) {
        return
      }

      // Restaurar dados
      Object.keys(data).forEach((key) => {
        if (key !== "metadata") {
          localStorage.setItem(key, JSON.stringify(data[key]))
        }
      })

      toast({
        title: "Backup restaurado",
        description: "Os dados foram restaurados com sucesso! A página será recarregada.",
      })

      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Erro ao restaurar backup:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao restaurar o backup! Verifique se o arquivo é válido.",
        variant: "destructive",
      })
    }
  }

  const limparDados = () => {
    if (
      !confirm(
        "ATENÇÃO! Esta ação irá apagar TODOS os dados do sistema. Esta ação não pode ser desfeita. Deseja continuar?",
      )
    ) {
      return
    }

    if (!confirm("Tem certeza? Todos os dados serão perdidos permanentemente.")) {
      return
    }

    // Lista de chaves a serem removidas
    const keysToRemove = [
      "lotes",
      "clientes",
      "fornecedores",
      "vendas",
      "compras",
      "estoque",
      "manejoDia",
      "aplicacoesSaude",
      "mortalidade",
      "formulacoes",
      "ingredientes",
      "estoqueIngredientes",
      "estoqueRacoes",
      "rankingIngredientes",
      "historicoFormulacoes",
    ]

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })

    toast({
      title: "Dados limpos",
      description: "Todos os dados foram removidos com sucesso! A página será recarregada.",
      variant: "destructive",
    })

    // Recarregar a página após 2 segundos
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  const reiniciarSistema = () => {
    if (!confirm("Esta ação irá reiniciar o sistema para os valores padrão. Deseja continuar?")) {
      return
    }

    // Inicializar estoque
    const estoquePadrao = {
      ovos: 0,
      galinhas_vivas: 0,
      galinhas_limpas: 0,
      cama_aves: 0,
    }

    localStorage.setItem("estoque", JSON.stringify(estoquePadrao))

    // Inicializar outras estruturas básicas
    localStorage.setItem("lotes", JSON.stringify([]))
    localStorage.setItem("clientes", JSON.stringify([]))
    localStorage.setItem("fornecedores", JSON.stringify([]))
    localStorage.setItem("vendas", JSON.stringify([]))
    localStorage.setItem("compras", JSON.stringify([]))
    localStorage.setItem("manejoDia", JSON.stringify({}))
    localStorage.setItem("aplicacoesSaude", JSON.stringify([]))
    localStorage.setItem("mortalidade", JSON.stringify([]))

    toast({
      title: "Sistema reiniciado",
      description: "O sistema foi reiniciado com os valores padrão! A página será recarregada.",
    })

    // Recarregar a página após 2 segundos
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

          <Button onClick={salvarConfiguracoes}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="aparencia" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Backup
            </TabsTrigger>
          </TabsList>

          {/* Aba de Perfil */}
          <TabsContent value="perfil" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>Atualize suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={perfilForm.nome}
                      onChange={handlePerfilChange}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={perfilForm.email}
                      onChange={handlePerfilChange}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={perfilForm.telefone}
                      onChange={handlePerfilChange}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>
                </div>

                <Button onClick={salvarPerfil}>Salvar Perfil</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Atualize sua senha de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha Atual</Label>
                  <Input
                    id="senhaAtual"
                    name="senhaAtual"
                    type="password"
                    value={senhaForm.senhaAtual}
                    onChange={handleSenhaChange}
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    name="novaSenha"
                    type="password"
                    value={senhaForm.novaSenha}
                    onChange={handleSenhaChange}
                    placeholder="Digite sua nova senha"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type="password"
                    value={senhaForm.confirmarSenha}
                    onChange={handleSenhaChange}
                    placeholder="Confirme sua nova senha"
                  />
                </div>

                <Button onClick={alterarSenha}>Alterar Senha</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Aparência */}
          <TabsContent value="aparencia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Aparência
                </CardTitle>
                <CardDescription>Personalize a aparência do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant={config.tema === "claro" ? "default" : "outline"}
                      className="flex items-center gap-2 w-32"
                      onClick={() => setTema("claro")}
                    >
                      <Sun className="h-4 w-4" />
                      Claro
                    </Button>

                    <Button
                      variant={config.tema === "escuro" ? "default" : "outline"}
                      className="flex items-center gap-2 w-32"
                      onClick={() => setTema("escuro")}
                    >
                      <Moon className="h-4 w-4" />
                      Escuro
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Notificações</Label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="alertasEstoque">Alertas de Estoque Baixo</Label>
                        <p className="text-sm text-muted-foreground">Receber alertas quando o estoque estiver baixo</p>
                      </div>
                      <Switch
                        id="alertasEstoque"
                        checked={config.notificacoes.alertasEstoque}
                        onCheckedChange={(checked) => updateNotificacoes("alertasEstoque", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="lembretesManejos">Lembretes de Manejos</Label>
                        <p className="text-sm text-muted-foreground">Receber lembretes para realizar manejos diários</p>
                      </div>
                      <Switch
                        id="lembretesManejos"
                        checked={config.notificacoes.lembretesManejos}
                        onCheckedChange={(checked) => updateNotificacoes("lembretesManejos", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="aplicacoesSaude">Aplicações de Saúde</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber alertas para aplicações de saúde programadas
                        </p>
                      </div>
                      <Switch
                        id="aplicacoesSaude"
                        checked={config.notificacoes.aplicacoesSaude}
                        onCheckedChange={(checked) => updateNotificacoes("aplicacoesSaude", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="relatoriosSemanal">Relatórios Semanais</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber relatórios semanais de produção e financeiro
                        </p>
                      </div>
                      <Switch
                        id="relatoriosSemanal"
                        checked={config.notificacoes.relatoriosSemanal}
                        onCheckedChange={(checked) => updateNotificacoes("relatoriosSemanal", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Unidades de Medida</Label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unidadePeso">Unidade de Peso</Label>
                      <Select value={config.unidades.peso} onValueChange={(value) => updateUnidades("peso", value as "kg" | "g")}>
                        <SelectTrigger id="unidadePeso">
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                          <SelectItem value="g">Gramas (g)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unidadeTemperatura">Unidade de Temperatura</Label>
                      <Select
                        value={config.unidades.temperatura}
                        onValueChange={(value) => updateUnidades("temperatura", value as "celsius" | "fahrenheit")}
                      >
                        <SelectTrigger id="unidadeTemperatura">
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="celsius">Celsius (°C)</SelectItem>
                          <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unidadeMoeda">Moeda</Label>
                      <Select value={config.unidades.moeda} onValueChange={(value) => updateUnidades("moeda", value as "BRL" | "USD" | "EUR")}>
                        <SelectTrigger id="unidadeMoeda">
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">Real (R$)</SelectItem>
                          <SelectItem value="USD">Dólar (US$)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={salvarConfiguracoes}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Aba de Sistema */}
          <TabsContent value="sistema" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Configurações do Sistema
                </CardTitle>
                <CardDescription>Personalize os valores padrão e comportamentos do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Alertas e Limites</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diasAlertaEstoqueBaixo" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Dias para Alerta de Estoque Baixo
                      </Label>
                      <Input
                        id="diasAlertaEstoqueBaixo"
                        name="diasAlertaEstoqueBaixo"
                        type="number"
                        min="1"
                        max="30"
                        value={config.sistema.diasAlertaEstoqueBaixo}
                        onChange={handleSistemaChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Número de dias antes de alertar sobre estoque baixo
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantidadeEstoqueBaixoOvos" className="flex items-center gap-2">
                        <Egg className="h-4 w-4 text-amber-500" />
                        Limite de Estoque Baixo (Ovos)
                      </Label>
                      <Input
                        id="quantidadeEstoqueBaixoOvos"
                        name="quantidadeEstoqueBaixoOvos"
                        type="number"
                        min="1"
                        value={config.sistema.quantidadeEstoqueBaixoOvos}
                        onChange={handleSistemaChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Quantidade mínima de ovos antes de alertar sobre estoque baixo
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantidadeEstoqueBaixoAves" className="flex items-center gap-2">
                        <Bird className="h-4 w-4 text-amber-500" />
                        Limite de Estoque Baixo (Aves)
                      </Label>
                      <Input
                        id="quantidadeEstoqueBaixoAves"
                        name="quantidadeEstoqueBaixoAves"
                        type="number"
                        min="1"
                        value={config.sistema.quantidadeEstoqueBaixoAves}
                        onChange={handleSistemaChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Quantidade mínima de aves antes de alertar sobre estoque baixo
                      </p>
                    </div>
                  </div>
                </div>

              <Separator />

              <div className="space-y-4">
                <Label>Clima</Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provedorClima">Provedor</Label>
                    <Select value={config.clima.provedor} onValueChange={(value) => updateClima("provedor", value as "open-meteo" | "openweather")}>
                      <SelectTrigger id="provedorClima">
                        <SelectValue placeholder="Selecione o provedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open-meteo">Open-Meteo (sem chave)</SelectItem>
                        <SelectItem value="openweather">OpenWeatherMap (chave necessária)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKeyClima">Chave de API (OpenWeather)</Label>
                  <Input
                    id="apiKeyClima"
                    value={config.clima.apiKey}
                    onChange={(e) => updateClima("apiKey", e.target.value)}
                    placeholder="Insira sua chave de API"
                  />
                  <p className="text-xs text-muted-foreground">Necessária apenas para OpenWeatherMap</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Status da Conexão (Supabase)</Label>
                      <p className="text-sm text-muted-foreground">
                        A conexão é gerenciada automaticamente pelo servidor.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={testarConexao}>Verificar Conexão</Button>
                       <Badge variant={supabaseStatus === "ok" ? "default" : supabaseStatus === "error" ? "destructive" : "outline"}>
                         {supabaseStatus === "ok" ? "Conectado" : supabaseStatus === "error" ? "Erro" : "Verificar"}
                       </Badge>
                    </div>
                  </div>
                </div>
                </div>
              </div>

                <div className="space-y-4">
                  <Label>Valores Padrão para Vendas</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="precoDefaultOvos" className="flex items-center gap-2">
                        <Egg className="h-4 w-4" />
                        <DollarSign className="h-4 w-4" />
                        Preço Padrão - Ovos (unidade)
                      </Label>
                      <Input
                        id="precoDefaultOvos"
                        name="precoDefaultOvos"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={config.sistema.precoDefaultOvos}
                        onChange={handleSistemaChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="precoDefaultGalinhasVivas" className="flex items-center gap-2">
                        <Bird className="h-4 w-4" />
                        <DollarSign className="h-4 w-4" />
                        Preço Padrão - Galinhas Vivas
                      </Label>
                      <Input
                        id="precoDefaultGalinhasVivas"
                        name="precoDefaultGalinhasVivas"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={config.sistema.precoDefaultGalinhasVivas}
                        onChange={handleSistemaChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="precoDefaultGalinhasLimpas" className="flex items-center gap-2">
                        <Bird className="h-4 w-4" />
                        <Scale className="h-4 w-4" />
                        Preço Padrão - Galinhas Limpas
                      </Label>
                      <Input
                        id="precoDefaultGalinhasLimpas"
                        name="precoDefaultGalinhasLimpas"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={config.sistema.precoDefaultGalinhasLimpas}
                        onChange={handleSistemaChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="precoDefaultCamaAves" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Preço Padrão - Cama das Aves
                      </Label>
                      <Input
                        id="precoDefaultCamaAves"
                        name="precoDefaultCamaAves"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={config.sistema.precoDefaultCamaAves}
                        onChange={handleSistemaChange}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Ações do Sistema</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center gap-2" onClick={reiniciarSistema}>
                      <RefreshCw className="h-4 w-4" />
                      Reiniciar Sistema
                    </Button>

                    <Button variant="destructive" className="flex items-center gap-2" onClick={limparDados}>
                      <Trash2 className="h-4 w-4" />
                      Limpar Todos os Dados
                    </Button>
                  </div>

                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Atenção! As ações acima são irreversíveis. Faça um backup antes de prosseguir.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={salvarConfiguracoes}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Aba de Backup */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Backup e Restauração
                </CardTitle>
                <CardDescription>Faça backup dos seus dados ou restaure a partir de um arquivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Backup Nuvem */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Cloud className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-lg">Backup em Nuvem (Supabase)</h3>
                    </div>
                    
                    {!user ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4"/>
                            <AlertDescription>Você precisa estar logado para usar o backup em nuvem.</AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="backupPass">Senha de Criptografia (Obrigatória)</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="backupPass" 
                                            type="password" 
                                            placeholder="Sua senha secreta de backup" 
                                            className="pl-9"
                                            value={backupPassword}
                                            onChange={e => setBackupPassword(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleCloudBackup} disabled={isBackupLoading || !backupPassword}>
                                        {isBackupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Cloud className="h-4 w-4 mr-2"/>}
                                        Fazer Backup Agora
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Seus dados são criptografados de ponta a ponta. Você precisará desta senha para restaurar. Não a perca!
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 p-3 border rounded-md bg-background">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Backup Automático</Label>
                                        <p className="text-xs text-muted-foreground">Realizar backup criptografado automaticamente</p>
                                    </div>
                                    <Select value={autoBackupFreq} onValueChange={handleAutoBackupChange}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Frequência" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="off">Desativado</SelectItem>
                                            <SelectItem value="daily">Diário</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {autoBackupFreq !== "off" && (
                                    <>
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="space-y-0.5">
                                                <Label>Retenção de Histórico</Label>
                                                <p className="text-xs text-muted-foreground">Manter backups por quantos dias?</p>
                                            </div>
                                            <Select value={retentionDays} onValueChange={handleRetentionChange}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Período" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="7">7 Dias</SelectItem>
                                                    <SelectItem value="30">30 Dias</SelectItem>
                                                    <SelectItem value="60">60 Dias</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {lastAutoBackup && lastAutoBackup > 0 && (
                                            <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-2">
                                                <Check className="h-3 w-3 text-green-500" />
                                                Último backup automático: {new Date(lastAutoBackup).toLocaleString()}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="mt-4">
                                <h4 className="font-medium mb-2 text-sm">Backups Disponíveis</h4>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2 bg-background">
                                    {cloudBackups.length === 0 ? (
                                        <p className="text-sm text-center py-4 text-muted-foreground">Nenhum backup encontrado.</p>
                                    ) : (
                                        cloudBackups.map(bk => (
                                            <div key={bk.id} className="flex items-center justify-between p-2 border-b last:border-0 text-sm hover:bg-muted/50 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="font-medium flex items-center gap-2">
                                                        <CalendarIcon className="h-3 w-3"/>
                                                        {new Date(bk.created_at).toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {(bk.size / 1024).toFixed(1)} KB • v{bk.version} {bk.note && `• ${bk.note}`}
                                                    </span>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => handleCloudRestore(bk.id)} disabled={isBackupLoading}>
                                                    Restaurar
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Button className="flex items-center gap-2" onClick={gerarBackup} variant="secondary">
                      <Download className="h-4 w-4" />
                      Baixar Backup Local (JSON)
                    </Button>

                    <p className="text-sm text-muted-foreground">
                      Baixe um arquivo com todos os dados do sistema para guardar em segurança no seu dispositivo
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Restaurar Backup Local</Label>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="backupFile">Selecione o arquivo de backup</Label>
                        <Input id="backupFile" type="file" accept=".json" onChange={handleFileChange} />
                        <p className="text-xs text-muted-foreground">Selecione um arquivo de backup no formato JSON</p>
                      </div>

                      {backupFile && (
                        <div className="p-4 border rounded-md bg-muted">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Arquivo selecionado:</span>
                            <span>{backupFile.name}</span>
                            <Badge variant="outline">{(backupFile.size / 1024).toFixed(2)} KB</Badge>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={restaurarBackup}
                        disabled={!backupFile}
                      >
                        <Upload className="h-4 w-4" />
                        Restaurar Dados Locais
                      </Button>

                      <Alert variant="warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Atenção! Restaurar um backup substituirá todos os dados atuais do sistema.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
