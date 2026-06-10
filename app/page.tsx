"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Egg, Loader2, User, Mail, Lock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const { toast } = useToast()
  const { login, register, sendPasswordReset, needsPasswordReset, completePasswordReset, resendEmailConfirmation } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const dict = {
    "pt-BR": {
      registerSuccessTitle: "Cadastro realizado com sucesso!",
      registerSuccessDesc:
        "Por favor, verifique seu e-mail para confirmar sua conta antes de fazer login.",
      unconfirmedTitle: "Conta não verificada",
      unconfirmedDesc:
        "Por favor, verifique seu e-mail e clique no link de confirmação antes de fazer login.",
      resend: "Reenviar e-mail de confirmação",
      loginErrorTitle: "Erro de login",
      loginErrorDesc: "Email ou senha incorretos!",
    },
    en: {
      registerSuccessTitle: "Sign up successful!",
      registerSuccessDesc: "Please check your email to confirm your account before logging in.",
      unconfirmedTitle: "Account not verified",
      unconfirmedDesc: "Please check your email and click the confirmation link before logging in.",
      resend: "Resend confirmation email",
      loginErrorTitle: "Login error",
      loginErrorDesc: "Email or password incorrect!",
    },
  } as const
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "pt-BR"
  const t = dict[(lang as keyof typeof dict) || "pt-BR"] || dict["pt-BR"]

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState("login")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await login(loginEmail, loginPassword)
      if (res.ok) {
        router.replace("/dashboard")
      } else {
        if (res.unconfirmed) {
          toast({
            title: t.unconfirmedTitle,
            description: t.unconfirmedDesc,
            variant: "warning",
            action: (
              <button
                onClick={async () => {
                  if (!loginEmail) return
                  const ok = await resendEmailConfirmation(loginEmail)
                  toast({
                    title: ok ? "Email reenviado" : "Erro",
                    description: ok ? "Verifique sua caixa de entrada" : "Não foi possível reenviar",
                    variant: ok ? "success" : "destructive",
                    duration: 6000,
                  })
                }}
                className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm"
                aria-label={t.resend}
              >
                {t.resend}
              </button>
            ),
            duration: 7000,
          })
        } else {
          toast({ 
              title: t.loginErrorTitle, 
              description: res.errorMessage || t.loginErrorDesc, 
              variant: "destructive", 
              duration: 6000 
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!registerName || !registerEmail || !registerPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos!",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const reg = await register(registerName, registerEmail, registerPassword)
      if (reg.ok) {
        toast({
          title: t.registerSuccessTitle,
          description: t.registerSuccessDesc,
          variant: "success",
          duration: 6000,
        })
        setAwaitingEmailConfirm(true)

        // Reset form and switch to login tab
        setRegisterName("")
        setRegisterEmail("")
        setRegisterPassword("")
      } else {
        if (reg.notConfigured) {
          toast({
            title: "Supabase não configurado",
            description: "Informe a URL e a Anon Key do Supabase nas Configurações para habilitar cadastro.",
            variant: "warning",
            action: (
              <button
                onClick={() => router.push("/dashboard/configuracoes")}
                className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm"
                aria-label="Abrir Configurações"
              >
                Abrir Configurações
              </button>
            ),
            duration: 7000,
          })
        } else {
          toast({
            title: "Erro",
            description: reg.errorMessage || "Não foi possível cadastrar. Verifique o email e tente novamente.",
            variant: "destructive",
            duration: 6000,
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast({ title: "Informe o e-mail", description: "Digite seu e-mail para receber o link", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const ok = await sendPasswordReset(loginEmail)
      toast({ title: ok ? "Link enviado" : "Erro", description: ok ? "Verifique seu e-mail" : "Não foi possível enviar o link", variant: ok ? undefined : "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return
    setIsLoading(true)
    try {
      const ok = await completePasswordReset(newPassword)
      toast({ title: ok ? "Senha atualizada" : "Erro", description: ok ? "Você já pode fazer login" : "Não foi possível atualizar a senha", variant: ok ? undefined : "destructive" })
      if (ok) setNewPassword("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 overflow-hidden relative">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse delay-700"></div>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl z-10 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-700 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="flex justify-center mb-4 transform hover:scale-110 transition-transform duration-300">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg text-white">
              <Egg className="h-10 w-10" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            GRANJA DE BOLSO
          </CardTitle>
          <CardDescription className="text-base">
            Gerencie sua granja de forma simples e eficiente
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {awaitingEmailConfirm && (
              <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 animate-in slide-in-from-top-2">
                <AlertDescription>
                  Verifique seu e-mail para confirmar sua conta antes de entrar.
                </AlertDescription>
              </Alert>
            )}
            
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-xl bg-slate-100/80 p-1">
              <TabsTrigger 
                value="login" 
                className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md h-full"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md h-full"
              >
                Cadastro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" forceMount className="data-[state=inactive]:hidden animate-in fade-in slide-in-from-right-4 duration-300">
              {needsPasswordReset ? (
                <form onSubmit={handleCompleteReset} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Definir nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        id="new-password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required 
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Atualizar senha
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800 font-medium" 
                        onClick={handleForgotPassword}
                      >
                        Esqueci minha senha
                      </Button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95" 
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="register" forceMount className="data-[state=inactive]:hidden animate-in fade-in slide-in-from-left-4 duration-300">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                      className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95" 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar conta gratuita"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <p className="text-xs text-center text-slate-400 font-medium">
            Sistema de gestão para pequenos produtores <br />
            © {new Date().getFullYear()} Granja de Bolso
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
