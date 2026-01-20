"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import {
  BarChart3,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Briefcase,
  Workflow,
  Activity,
  Egg,
  Home,
  LogOut,
  Menu,
  ShoppingCart,
  Tractor,
  Users,
  Truck,
  Bird,
  ShoppingBag,
  ComputerIcon as Blender,
  Syringe,
  Skull,
  DollarSign,
  Settings,
  CreditCard,
  CloudSun,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/hooks/use-auth"
import { useConfig } from "@/contexts/config-context"
import { formatDateExtended } from "@/lib/date-utils"
import { SubscriptionCheck } from "@/components/subscription-check"
import { useSubscription } from "@/contexts/subscription-context"
import { Badge } from "@/components/ui/badge"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, logout, requireAuth } = useAuth()
  const { isInTrial, daysLeftInTrial, daysLeftInSubscription, subscriptionStatus } = useSubscription()
  const { config, setTema } = useConfig()
  const isMobile = useIsMobile()
  const [currentDate] = useState(formatDateExtended(new Date()))
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileCategory, setMobileCategory] = useState<string | null>(null)
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)
  

  useEffect(() => {
    requireAuth()

    const runBackup = () => {
      import("@/services/backup-service").then(({ BackupService }) => {
        BackupService.checkAndRunAutoBackup()
      })
    }

    runBackup()

    window.addEventListener("online", runBackup)
    return () => window.removeEventListener("online", runBackup)
  }, [requireAuth])

  
  

  type LinkItem = { type: "link"; name: string; icon: React.ReactNode; path: string }
  type GroupItem = { type: "group"; name: string; icon: React.ReactNode; children: LinkItem[] }
  const menuItems: Array<LinkItem | GroupItem> = [
    { type: "link", name: "Início", icon: <Home className="h-5 w-5" />, path: "/dashboard" },
    {
      type: "group",
      name: "Operações",
      icon: <Workflow className="h-5 w-5" />,
      children: [
        { type: "link", name: "Manejo", icon: <Tractor className="h-5 w-5" />, path: "/dashboard/manejo" },
        { type: "link", name: "Vendas", icon: <ShoppingCart className="h-5 w-5" />, path: "/dashboard/vendas" },
        { type: "link", name: "Formulação", icon: <Blender className="h-5 w-5" />, path: "/dashboard/formulacao" },
      ],
    },
    {
      type: "group",
      name: "Cadastro",
      icon: <ClipboardList className="h-5 w-5" />,
      children: [
        { type: "link", name: "Animais", icon: <Bird className="h-5 w-5" />, path: "/dashboard/animais" },
        { type: "link", name: "Cliente", icon: <Users className="h-5 w-5" />, path: "/dashboard/clientes" },
        { type: "link", name: "Fornecedor", icon: <Truck className="h-5 w-5" />, path: "/dashboard/fornecedores" },
      ],
    },
    {
      type: "group",
      name: "Gestão",
      icon: <Briefcase className="h-5 w-5" />,
      children: [
        { type: "link", name: "Compras", icon: <ShoppingBag className="h-5 w-5" />, path: "/dashboard/compras" },
        { type: "link", name: "Financeiro", icon: <DollarSign className="h-5 w-5" />, path: "/dashboard/financeiro" },
        { type: "link", name: "Relatórios", icon: <BarChart3 className="h-5 w-5" />, path: "/dashboard/relatorios" },
      ],
    },
    {
      type: "group",
      name: "Monitoramento",
      icon: <Activity className="h-5 w-5" />,
      children: [
        { type: "link", name: "Clima", icon: <CloudSun className="h-5 w-5" />, path: "/dashboard/clima" },
        { type: "link", name: "Conhecimento", icon: <BookOpen className="h-5 w-5" />, path: "/dashboard/conhecimento" },
        { type: "link", name: "Saúde", icon: <Syringe className="h-5 w-5" />, path: "/dashboard/controle-saude" },
        { type: "link", name: "Mortalidade", icon: <Skull className="h-5 w-5" />, path: "/dashboard/mortalidade" },
      ],
    },
    { type: "link", name: "Configurações", icon: <Settings className="h-5 w-5" />, path: "/dashboard/configuracoes" },
    { type: "link", name: "Assinatura", icon: <CreditCard className="h-5 w-5" />, path: "/assinatura" },
  ]

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  

  const MenuLink = ({ item }: { item: LinkItem }) => {
    const isActive = pathname === item.path
    return (
      <div className="flex items-center gap-1">
        <Link
          href={item.path}
          prefetch={false}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent flex-1",
            isActive
              ? "bg-accent text-accent-foreground font-medium border-l-[4px] border-[#2E86DE]"
              : "text-muted-foreground",
          )}
          aria-current={isActive ? "page" : undefined}
          onClick={() => { if ("vibrate" in navigator) navigator.vibrate(10); setIsMobileMenuOpen(false) }}
        >
          <span aria-hidden="true" title={item.name}>{item.icon}</span>
          {!collapsed && item.name}
          {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
        </Link>
      </div>
    )
  }

  const MenuGroup = ({ group }: { group: GroupItem }) => {
    const childActive = group.children.some((c) => pathname === c.path || pathname.startsWith(c.path))
    const isOpen = openGroups[group.name] ?? childActive
    const toggle = () => setOpenGroups((s) => ({ ...s, [group.name]: !isOpen }))
    const subId = `submenu-${group.name.replace(/\s+/g, "-").toLowerCase()}`
    return (
      <div className="mb-1">
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
            childActive
              ? "bg-accent text-accent-foreground font-medium border-l-[4px] border-[#2E86DE]"
              : "text-muted-foreground",
          )}
          aria-expanded={isOpen}
          aria-controls={subId}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              toggle()
            }
          }}
        >
          <span aria-hidden="true" title={group.name}>{group.icon}</span>
          {!collapsed && group.name}
          <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")} />
        </button>
        <div
          id={subId}
          role="region"
          aria-label={group.name}
          className={cn(
            "mt-1 overflow-hidden transition-all duration-300 ease-in-out",
            isOpen && !collapsed ? "max-h-[500px]" : "max-h-0",
          )}
        >
          <div className={cn("ml-6 border-l pl-3 space-y-1", collapsed ? "hidden" : "")}
          >
            {group.children.map((c) => (
              <MenuLink key={c.path} item={c} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SubscriptionCheck>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px] shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-all duration-200">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 py-4">
                  <Egg className="h-6 w-6 text-primary" />
                  <span className="text-lg font-bold">GRANJA DE BOLSO</span>
                </div>
                <nav className="flex-1 overflow-auto py-2" role="navigation" aria-label="Menu principal">
                  {(isMobile
                    ? menuItems.filter(
                        (m) => m.type === "link" && ["Configurações", "Assinatura"].includes((m as any).name),
                      )
                    : menuItems
                  ).map((item) =>
                    item.type === "link" ? (
                      <MenuLink key={(item as any).path} item={item as any} />
                    ) : !isMobile && item.type === "group" ? (
                      <MenuGroup key={(item as any).name} group={item as any} />
                    ) : null,
                  )}
                </nav>
                <div className="border-t py-4">
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout}>
                    <LogOut className="mr-2 h-5 w-5" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Egg className="h-6 w-6 text-primary hidden md:block" />
            <span className="font-bold hidden md:block">GRANJA DE BOLSO</span>
          </div>

          <div className="flex-1 flex items-center justify-end gap-4">
            <div className="hidden md:block text-sm text-muted-foreground">{currentDate}</div>
            <PwaInstallButton />
            <Button
              variant="outline"
              size="icon"
              aria-label={config.tema === "escuro" ? "Tema claro" : "Tema escuro"}
              onClick={() => setTema(config.tema === "escuro" ? "claro" : "escuro")}
            >
              {config.tema === "escuro" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Status da assinatura */}
            <div className="hidden md:block">
              {isInTrial() ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Período de teste: {daysLeftInTrial()} dias restantes
                </Badge>
              ) : subscriptionStatus.active ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Assinatura ativa: {daysLeftInSubscription()} dias restantes
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Assinatura inativa
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Olá, {user.nome}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          <aside className={cn("hidden md:flex flex-col border-r bg-background transition-[width] duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-all", collapsed ? "w-[72px]" : "w-[240px]")}> 
            <div className="flex items-center justify-between px-3 py-3">
              <Button variant="ghost" size="icon" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} onClick={() => setCollapsed((c) => !c)}>
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-90" />}
              </Button>
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={config.tema === "escuro" ? "Tema claro" : "Tema escuro"}
                  onClick={() => setTema(config.tema === "escuro" ? "claro" : "escuro")}
                >
                  {config.tema === "escuro" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              )}
            </div>
            <nav className="flex-1 overflow-auto py-2 px-3" role="navigation" aria-label="Menu principal">
              {menuItems.map((item) =>
                item.type === "link" ? (
                  <MenuLink key={item.path} item={item} />
                ) : (
                  <MenuGroup key={item.name} group={item} />
                ),
              )}
            </nav>
          </aside>

          <main className="flex-1 overflow-auto p-4 md:p-6 pb-[80px] md:pb-6">{children}</main>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden" role="navigation" aria-label="Menu rápido" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="grid grid-cols-5">
            {menuItems
              .filter((m) => m.type === "group")
              .slice(0, 2)
              .map((g) => {
                const group = g as GroupItem
                const active = group.children.some((c) => pathname === c.path || pathname.startsWith(c.path))
                const pressed = mobileCategory === group.name
                return (
                <button
                  key={group.name}
                  type="button"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 h-[56px] focus:outline-none transition-all duration-200 px-2",
                    pressed || active
                      ? "bg-accent/50 text-accent-foreground rounded-md shadow-sm"
                      : "text-muted-foreground hover:bg-accent/40 rounded-md",
                  )}
                  aria-label={group.name}
                  aria-pressed={pressed}
                  aria-selected={pressed || active}
                  onClick={() => {
                    if ("vibrate" in navigator) navigator.vibrate(10)
                    setIsMobilePanelOpen((open) => (mobileCategory === group.name ? !open : true))
                    setMobileCategory(group.name)
                  }}
                >
                  <span aria-hidden="true">{group.icon}</span>
                  <span className="text-xs">{group.name}</span>
                </button>
                )
              })}

            <Link
              href="/dashboard"
              prefetch={false}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 h-[64px] focus:outline-none transition-all ease-in-out duration-200 px-2",
                pathname === "/dashboard"
                  ? "bg-accent/50 text-accent-foreground rounded-md shadow-sm"
                  : "text-muted-foreground hover:bg-accent/40 rounded-md",
              )}
              aria-label="Início"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              onClick={() => { if ("vibrate" in navigator) navigator.vibrate(10) }}
            >
              <span aria-hidden="true"><Home className="h-5 w-5" /></span>
              <span className="text-xs">Início</span>
            </Link>

            {menuItems
              .filter((m) => m.type === "group")
              .slice(2, 4)
              .map((g) => {
                const group = g as GroupItem
                const active = group.children.some((c) => pathname === c.path || pathname.startsWith(c.path))
                const pressed = mobileCategory === group.name
                return (
                  <button
                    key={group.name}
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2 h-[64px] focus:outline-none transition-all ease-in-out duration-200 px-2",
                      pressed || active
                        ? "bg-accent/50 text-accent-foreground rounded-md shadow-sm"
                        : "text-muted-foreground hover:bg-accent/40 rounded-md",
                    )}
                    aria-label={group.name}
                    aria-pressed={pressed}
                    aria-selected={pressed || active}
                    onClick={() => {
                      if ("vibrate" in navigator) navigator.vibrate(10)
                      setIsMobilePanelOpen((open) => (mobileCategory === group.name ? !open : true))
                      setMobileCategory(group.name)
                    }}
                  >
                    <span aria-hidden="true">{group.icon}</span>
                    <span className="text-xs">{group.name}</span>
                  </button>
                )
              })}
          </div>
        </div>

        <div
          className={cn(
            "fixed left-0 right-0 bottom-[64px] z-50 md:hidden transition-transform duration-200",
            isMobilePanelOpen
              ? "translate-y-0 opacity-100 visible pointer-events-auto"
              : "translate-y-full opacity-0 invisible pointer-events-none",
          )}
          role="region"
          aria-label={mobileCategory || "Menu categoria"}
          aria-hidden={!isMobilePanelOpen}
          style={{ willChange: 'transform' }}
        >
          <div className="mx-3 rounded-t-xl border bg-background shadow-lg max-h-[55vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between px-3 py-3">
              <span className="text-sm font-medium">Navegação</span>
              <Button variant="ghost" size="sm" onClick={() => setIsMobilePanelOpen(false)}>Fechar</Button>
            </div>
            <div className="px-2 pb-3">
              {menuItems
                .filter((m) => m.type === "group" && (m as GroupItem).name === mobileCategory)
                .map((g) => {
                  const group = g as GroupItem
                  return (
                    <div key={group.name} className="grid grid-cols-2 gap-2 px-2 pb-2">
                      {group.children.map((c) => {
                        const isActive = pathname === c.path
                        return (
                          <Link
                            key={c.path}
                            href={c.path}
                            prefetch={false}
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-3 py-3 min-h-[48px] text-sm transition-colors duration-200",
                              isActive ? "bg-accent/50 text-accent-foreground" : "hover:bg-accent text-foreground",
                            )}
                            aria-current={isActive ? "page" : undefined}
                            onClick={() => { if ("vibrate" in navigator) navigator.vibrate(10); setIsMobilePanelOpen(false) }}
                          >
                            <span aria-hidden="true">{c.icon}</span>
                            <span>{c.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        <Toaster />
      </div>
    </SubscriptionCheck>
  )
}
