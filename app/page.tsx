"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Egg } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const { toast } = useToast()
  const { login, register, sendPasswordReset, needsPasswordReset, completePasswordReset, resendEmailConfirmation } = useAuth()
  const router = useRouter()

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
  }

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast({ title: "Informe o e-mail", description: "Digite seu e-mail para receber o link", variant: "destructive" })
      return
    }
    const ok = await sendPasswordReset(loginEmail)
    toast({ title: ok ? "Link enviado" : "Erro", description: ok ? "Verifique seu e-mail" : "Não foi possível enviar o link", variant: ok ? undefined : "destructive" })
  }

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return
    const ok = await completePasswordReset(newPassword)
    toast({ title: ok ? "Senha atualizada" : "Erro", description: ok ? "Você já pode fazer login" : "Não foi possível atualizar a senha", variant: ok ? undefined : "destructive" })
    if (ok) setNewPassword("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Egg className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">GRANJA DE BOLSO</CardTitle>
          <CardDescription>Gerencie sua granja de forma simples e eficiente</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {awaitingEmailConfirm && (
              <Alert className="mb-4">
                <AlertDescription>
                  Verifique seu e-mail para confirmar sua conta antes de entrar.
                </AlertDescription>
              </Alert>
            )}
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              {needsPasswordReset ? (
                <form onSubmit={handleCompleteReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Definir nova senha</Label>
                    <Input id="new-password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full">Atualizar senha</Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" onClick={handleForgotPassword}>Esqueci minha senha</Button>
                  </div>
                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </form>
              )}
            </TabsContent>
            <TabsContent value="register" forceMount>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Cadastrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Sistema de gestão para pequenos produtores
        </CardFooter>
      </Card>
    </div>
  )
}
