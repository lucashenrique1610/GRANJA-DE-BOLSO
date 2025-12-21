"use client"

import { useEffect, useMemo, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import {
  CloudSun,
  Tractor,
  Egg,
  Bird,
  ChefHat,
  Settings,
  FileText,
  Droplets,
  ShieldAlert,
  Home,
  ShoppingBag,
} from "lucide-react"
import Image from "next/image"

const INDEX_MAP: Record<string, Array<{ id: string; label: string }>> = {
  "clima-ideal": [
    { id: "clima-condicoes", label: "Condições" },
    { id: "clima-adaptacao", label: "Adaptação" },
    { id: "clima-controle", label: "Controle" },
  ],
  manejo: [
    { id: "manejo-rotinas", label: "Rotinas" },
    { id: "manejo-bioseguranca", label: "Biosegurança" },
    { id: "manejo-ambiente", label: "Ambiente" },
    { id: "manejo-registros", label: "Registros" },
  ],
}

const IndexSidebar = ({ currentTab }: { currentTab: string }) => {
  const items = INDEX_MAP[currentTab] || []
  return (
    <aside className="hidden md:block sticky top-20 self-start" role="navigation" aria-label="Índice de tópicos">
      <div className="rounded-lg border bg-card p-3 w-[240px]">
        <div className="text-sm font-medium mb-2">Índice</div>
        <div className="space-y-1">
          {items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className="block rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {it.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}

const TopAnchor = () => <div id="top" />

const ControlsComp = ({
  state,
  onToggleSaved,
  onToggleCompleted,
  unread,
}: {
  state: { saved?: boolean; completed?: boolean; readAt?: number }
  onToggleSaved: () => void
  onToggleCompleted: () => void
  unread: boolean
}) => {
  const pct = state.completed ? 100 : state.readAt ? 50 : 0
  return (
    <div className="mt-4 space-y-3">
      <div className="h-1.5 w-full rounded bg-muted">
        <div
          className="h-1.5 rounded bg-primary transition-all"
          style={{ width: `${pct}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          role="progressbar"
        />
      </div>
      <div className="flex items-center gap-2">
        {unread ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            Novo
          </span>
        ) : state.completed ? (
          <Badge variant="outline">Concluído</Badge>
        ) : (
          <Badge variant="secondary">Em andamento</Badge>
        )}
        <button
          type="button"
          className="ml-auto inline-flex items-center rounded-md border px-2 py-1 text-xs transition-all hover:bg-accent"
          aria-pressed={!!state.saved}
          onClick={onToggleSaved}
        >
          {state.saved ? "Salvo" : "Salvar"}
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-md border px-2 py-1 text-xs transition-all hover:bg-accent"
          aria-pressed={!!state.completed}
          onClick={onToggleCompleted}
        >
          {state.completed ? "Concluído" : "Concluir"}
        </button>
      </div>
    </div>
  )
}

const PanelGrid = ({ children }: { children: React.ReactNode }) => (
  <div
    className="
      md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
      flex md:block gap-4 overflow-x-auto md:overflow-visible -mx-1 px-1 md:mx-0 md:px-0 snap-x md:snap-none
    "
    role="region"
    aria-label="Conteúdo da categoria"
  >
    {children}
  </div>
)

export default function ConhecimentoPage() {
  const [tab, setTab] = useState<string>(() => {
    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
      const q = params?.get("tab") || "clima-ideal"
      return q || "clima-ideal"
    } catch {
      return "clima-ideal"
    }
  })

  const [progress, setProgress] = useState<Record<string, { saved?: boolean; completed?: boolean; readAt?: number }>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem("knowledgeProgress")
      if (raw) {
        setProgress(JSON.parse(raw))
      }
    } catch {}
  }, [])


  useEffect(() => {
    try {
      localStorage.setItem("knowledgeProgress", JSON.stringify(progress))
    } catch {}
  }, [progress])

  const isUnread = useMemo(() => {
    return (id: string) => !progress[id]?.readAt
  }, [progress])

  const toggleSaved = (id: string) => {
    setProgress((p) => ({ ...p, [id]: { ...(p[id] || {}), saved: !(p[id]?.saved) } }))
  }

  const toggleCompleted = (id: string) => {
    setProgress((p) => ({ ...p, [id]: { ...(p[id] || {}), completed: !(p[id]?.completed) } }))
  }

  const markRead = (id: string) => {
    setProgress((p) => ({ ...p, [id]: { ...(p[id] || {}), readAt: Date.now() } }))
  }

  


  return (
    <DashboardLayout>
      <TopAnchor />
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Início</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/conhecimento">Conhecimento</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {tab === "clima-ideal" ? "Clima Ideal" : tab === "manejo" ? "Manejo" : "Tópicos"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6 border">
          <div className="flex items-center gap-3">
            <Bird className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Conhecimento</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Referência organizada sobre criação de galinha caipira, com tópicos práticos e atualizados.</p>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <div className="overflow-x-auto" aria-label="Categorias de conhecimento">
            <TabsList className="flex min-w-max gap-2">
              <TabsTrigger value="clima-ideal" className="flex items-center gap-2"><CloudSun className="h-4 w-4" />Clima Ideal</TabsTrigger>
              <TabsTrigger value="manejo" className="flex items-center gap-2"><Tractor className="h-4 w-4" />Manejo</TabsTrigger>
              <TabsTrigger value="fase-aves" className="flex items-center gap-2"><Egg className="h-4 w-4" />Fase das Aves</TabsTrigger>
              <TabsTrigger value="racas-poedeiras" className="flex items-center gap-2"><Bird className="h-4 w-4" />Raças de Galinhas Poedeiras</TabsTrigger>
              <TabsTrigger value="misturas-racao" className="flex items-center gap-2"><ChefHat className="h-4 w-4" />Misturas de Ração</TabsTrigger>
              <TabsTrigger value="regras-galinheiro" className="flex items-center gap-2"><Settings className="h-4 w-4" />Regras para Construção de Galinheiro</TabsTrigger>
              <TabsTrigger value="documentacao" className="flex items-center gap-2"><FileText className="h-4 w-4" />Documentação Necessária</TabsTrigger>
              <TabsTrigger value="agua-alimentacao" className="flex items-center gap-2"><Droplets className="h-4 w-4" />Água e Alimentação</TabsTrigger>
              <TabsTrigger value="doencas-prevencoes" className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Doenças e Prevenções</TabsTrigger>
              <TabsTrigger value="galinheiro" className="flex items-center gap-2"><Home className="h-4 w-4" />Galinheiro</TabsTrigger>
              <TabsTrigger value="venda-ovos" className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Venda de Ovos</TabsTrigger>
            </TabsList>
          </div>

          <div className="md:flex md:gap-6">
            <IndexSidebar currentTab={tab} />
            <div className="md:flex-1">
          <TabsContent value="clima-ideal">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CloudSun className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Clima Ideal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div
                    id="clima-condicoes"
                    className="p-4 rounded-lg border min-w-[280px] md:min-w-0 snap-start transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    role="article"
                    tabIndex={0}
                    onFocus={() => markRead("clima-condicoes")}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === "s") toggleSaved("clima-condicoes")
                      if (e.key.toLowerCase() === "c") toggleCompleted("clima-condicoes")
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-lg font-semibold">Condições climáticas ótimas</div>
                      <Image src="/images/thermometer.png" alt="Ilustração de termômetro" width={40} height={40} className="opacity-80" />
                    </div>
                    <p className="text-base text-muted-foreground mt-1">Faixas de conforto para aves caipiras em produção.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>
                        Temperatura de conforto (adultas): 18–24°C. Operacional: 12–30°C.
                      </li>
                      <li>
                        Umidade relativa ideal: 50–70%. Acima de 80% aumenta risco de doenças; abaixo de 40% resseca vias aéreas.
                      </li>
                      <li>
                        Ventilação: renovação de ar constante; no verão, intensificar a troca para dissipar calor.
                      </li>
                      <li>
                        Velocidade do ar: 0,2–0,5 m/s dentro do galinheiro para conforto sem corrente excessiva.
                      </li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Temperatura</Badge>
                      <Badge variant="secondary">Umidade</Badge>
                      <Badge variant="secondary">Ventilação</Badge>
                    </div>
                    <div className="mt-3 border-l-2 pl-3 text-sm italic text-muted-foreground">Conforto térmico reduz mortalidade e melhora a postura.</div>
                    <ControlsComp
                      state={progress["clima-condicoes"] || {}}
                      onToggleSaved={() => toggleSaved("clima-condicoes")}
                      onToggleCompleted={() => toggleCompleted("clima-condicoes")}
                      unread={isUnread("clima-condicoes")}
                    />
                  </div>

                  <div
                    id="clima-adaptacao"
                    className="p-4 rounded-lg border min-w-[280px] md:min-w-0 snap-start transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    role="article"
                    tabIndex={0}
                    onFocus={() => markRead("clima-adaptacao")}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === "s") toggleSaved("clima-adaptacao")
                      if (e.key.toLowerCase() === "c") toggleCompleted("clima-adaptacao")
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-lg font-semibold">Adaptação a temperaturas</div>
                      <Image src="/images/fan.png" alt="Ventilação e sombreamento" width={40} height={40} className="opacity-80" />
                    </div>
                    <p className="text-base text-muted-foreground mt-1">Medidas práticas para frio e calor extremos.</p>
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <div className="font-medium">Frio</div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Isolamento térmico do telhado e fechamento de frestas.</li>
                          <li>Cama seca e profunda (10–15 cm) para retenção de calor.</li>
                          <li>Cortinas e anteparos para reduzir correntes de ar.</li>
                          <li>Aquecimento para pintinhos: 32–34°C na 1ª semana; reduzir 2–3°C/semana.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium">Calor</div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Sombreamento eficiente (telhado claro ou tela 50–70%).</li>
                          <li>Ventiladores/exaustores para aumentar a circulação do ar.</li>
                          <li>Nebulização fina ou resfriamento evaporativo em climas secos.</li>
                          <li>Água fresca e eletrólitos nas horas mais quentes.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium">Estresse térmico</div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Sinais: ofego, asas abertas, queda de consumo e postura.</li>
                          <li>Resposta: reduzir densidade, aumentar ventilação e ofertar água fria.</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Frio</Badge>
                      <Badge variant="secondary">Calor</Badge>
                      <Badge variant="secondary">Estresse térmico</Badge>
                    </div>
                    <ControlsComp
                      state={progress["clima-adaptacao"] || {}}
                      onToggleSaved={() => toggleSaved("clima-adaptacao")}
                      onToggleCompleted={() => toggleCompleted("clima-adaptacao")}
                      unread={isUnread("clima-adaptacao")}
                    />
                  </div>

                  <div
                    id="clima-controle"
                    className="p-4 rounded-lg border min-w-[280px] md:min-w-0 snap-start transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    role="article"
                    tabIndex={0}
                    onFocus={() => markRead("clima-controle")}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === "s") toggleSaved("clima-controle")
                      if (e.key.toLowerCase() === "c") toggleCompleted("clima-controle")
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-lg font-semibold">Controle no galinheiro</div>
                      <Image src="/images/barn.png" alt="Galinheiro e controle ambiental" width={40} height={40} className="opacity-80" />
                    </div>
                    <p className="text-base text-muted-foreground mt-1">Uso coordenado de aquecimento, exaustão e sombreamento.</p>
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <div className="font-medium">Aquecimento</div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Fontes: infravermelho, aquecedores a gás ou elétricos com termostato.</li>
                          <li>Meta por fase: pintinhos (32–34°C), recria (24–28°C), produção (20–24°C).</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium">Exaustão/Ventilação</div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Manter fluxo de ar uniforme, sem jatos direcionados às aves.</li>
                          <li>Aumentar renovação de ar em períodos quentes para remover calor e umidade.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium">Sombreamento</div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Telhas térmicas, forros refletivos ou telas de sombreamento.</li>
                          <li>Árvores e barreiras naturais reduzem carga térmica em áreas externas.</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Aquecimento</Badge>
                      <Badge variant="secondary">Exaustão</Badge>
                      <Badge variant="secondary">Sombreamento</Badge>
                    </div>
                    <ControlsComp
                      state={progress["clima-controle"] || {}}
                      onToggleSaved={() => toggleSaved("clima-controle")}
                      onToggleCompleted={() => toggleCompleted("clima-controle")}
                      unread={isUnread("clima-controle")}
                    />
                  </div>
                </PanelGrid>
                <Separator className="my-6" />
                <div className="flex justify-end">
                  <a href="#top" className="text-sm underline">Voltar ao topo</a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manejo">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Tractor className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Manejo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div
                    id="manejo-rotinas"
                    className="p-4 rounded-lg border min-w-[280px] md:min-w-0 snap-start transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    role="article"
                    tabIndex={0}
                    onFocus={() => markRead("manejo-rotinas")}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === "s") toggleSaved("manejo-rotinas")
                      if (e.key.toLowerCase() === "c") toggleCompleted("manejo-rotinas")
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-lg font-semibold">Rotinas diárias</div>
                      <Image src="/images/eggs.png" alt="Coleta de ovos" width={40} height={40} className="opacity-80" />
                    </div>
                    <p className="text-base text-muted-foreground mt-1">Procedimentos essenciais para free-range/caipira.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Coleta de ovos 2–3x ao dia; manter ninhos limpos e secos.</li>
                      <li>Inspeção das aves (locomoção, penas, crista, respiração) e retirada de doentes.</li>
                      <li>Verificação de água e comedouros; limpeza diária de resíduos.</li>
                      <li>Tratamento e revolvimento da cama (5–8 cm de espessura) para manter seca.</li>
                      <li>Controle de pragas (roedores, insetos) e manutenção de telas e cercas.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Coleta</Badge>
                      <Badge variant="secondary">Inspeção</Badge>
                      <Badge variant="secondary">Cama</Badge>
                    </div>
                    <ControlsComp
                      state={progress["manejo-rotinas"] || {}}
                      onToggleSaved={() => toggleSaved("manejo-rotinas")}
                      onToggleCompleted={() => toggleCompleted("manejo-rotinas")}
                      unread={isUnread("manejo-rotinas")}
                    />
                  </div>

                  <div
                    id="manejo-bioseguranca"
                    className="p-4 rounded-lg border min-w-[280px] md:min-w-0 snap-start transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    role="article"
                    tabIndex={0}
                    onFocus={() => markRead("manejo-bioseguranca")}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === "s") toggleSaved("manejo-bioseguranca")
                      if (e.key.toLowerCase() === "c") toggleCompleted("manejo-bioseguranca")
                    }}
                  >
                    <div className="font-medium">Biosegurança</div>
                    <p className="text-base text-muted-foreground mt-1">Prevenção de doenças e proteção do plantel.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Instalar pedilúvio/rodolúvio na entrada com desinfetante trocado regularmente.</li>
                      <li>Restringir visitas e uso de EPIs dedicados; lavar mãos ao entrar.</li>
                      <li>Quarentena de novas aves e controle de trânsito entre lotes.</li>
                      <li>Limpeza e desinfecção periódica; manejo adequado de carcaças e dejetos.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Pedilúvio</Badge>
                      <Badge variant="secondary">Quarentena</Badge>
                      <Badge variant="secondary">Desinfecção</Badge>
                    </div>
                    <ControlsComp
                      state={progress["manejo-bioseguranca"] || {}}
                      onToggleSaved={() => toggleSaved("manejo-bioseguranca")}
                      onToggleCompleted={() => toggleCompleted("manejo-bioseguranca")}
                      unread={isUnread("manejo-bioseguranca")}
                    />
                  </div>

                  <div
                    id="manejo-ambiente"
                    className="p-4 rounded-lg border min-w-[280px] md:min-w-0 snap-start transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    role="article"
                    tabIndex={0}
                    onFocus={() => markRead("manejo-ambiente")}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === "s") toggleSaved("manejo-ambiente")
                      if (e.key.toLowerCase() === "c") toggleCompleted("manejo-ambiente")
                    }}
                  >
                    <div className="font-medium">Ambiente e densidade</div>
                    <p className="text-base text-muted-foreground mt-1">Espaço interno e piquetes com bem-estar.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Densidade interna típica: 7 aves/m² (galpão de piso único com cama).</li>
                      <li>Área externa: 2 aves/m² (free-range certificado) como referência de bem-estar.</li>
                      <li>Ninhos: 1 boca de ninho/5 aves ou 0,8 m² de ninho coletivo/100 aves.</li>
                      <li>Iluminação: mínimo de 8h de luz contínua e 6h de escuro contínuo.</li>
                      <li>Rotação de piquetes semanal para recuperação da vegetação.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Densidade</Badge>
                      <Badge variant="secondary">Ninhos</Badge>
                      <Badge variant="secondary">Iluminação</Badge>
                    </div>
                    <ControlsComp
                      state={progress["manejo-ambiente"] || {}}
                      onToggleSaved={() => toggleSaved("manejo-ambiente")}
                      onToggleCompleted={() => toggleCompleted("manejo-ambiente")}
                      unread={isUnread("manejo-ambiente")}
                    />
                  </div>

                  <div
                    id="manejo-registros"
                    className="p-4 rounded-lg border min-w-[280px] md:min-w-0 snap-start transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    role="article"
                    tabIndex={0}
                    onFocus={() => markRead("manejo-registros")}
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() === "s") toggleSaved("manejo-registros")
                      if (e.key.toLowerCase() === "c") toggleCompleted("manejo-registros")
                    }}
                  >
                    <div className="font-medium">Registros e rotina</div>
                    <p className="text-base text-muted-foreground mt-1">Acompanhamento técnico e ajustes.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Registrar produção diária de ovos por lote e por ave.</li>
                      <li>Consumo de ração/água, mortalidade e ocorrências sanitárias.</li>
                      <li>Calendário de vacinação e vermifugação conforme orientação técnica.</li>
                      <li>Ajustar manejo conforme estação (clima frio/quente) e fase das aves.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Produção</Badge>
                      <Badge variant="secondary">Vacinação</Badge>
                      <Badge variant="secondary">Ajustes</Badge>
                    </div>
                    <ControlsComp
                      state={progress["manejo-registros"] || {}}
                      onToggleSaved={() => toggleSaved("manejo-registros")}
                      onToggleCompleted={() => toggleCompleted("manejo-registros")}
                      unread={isUnread("manejo-registros")}
                    />
                  </div>
                </PanelGrid>
                <Separator className="my-6" />
                <div className="flex justify-end">
                  <a href="#top" className="text-sm underline">Voltar ao topo</a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            </div>
          </div>

          <TabsContent value="fase-aves">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Egg className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Fase das Aves</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Cria (0–30 dias)</div>
                    <p className="text-sm text-muted-foreground mt-1">Aquecimento, proteção e início nutricional.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Temperatura na 1ª semana: 32–34°C; reduzir 2–3°C/semana até ~24–26°C na 5ª semana.</li>
                      <li>Densidade de cria em piso: 20–22 aves/m²; pinteiro fechado e sem correntes de ar.</li>
                      <li>Cama seca e fofa (5–8 cm); círculos de proteção e fonte de calor confiável.</li>
                      <li>Ração inicial balanceada e água fresca ad libitum; altura de bebedouros/comedouros ajustada.</li>
                      <li>Observação de comportamento (distribuição ao redor da fonte de calor) para ajustes finos.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Aquecimento</Badge>
                      <Badge variant="secondary">Densidade</Badge>
                      <Badge variant="secondary">Cama</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Recria (31–90 dias)</div>
                    <p className="text-sm text-muted-foreground mt-1">Crescimento, uniformidade e adaptação.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Temperatura de conforto: 24–28°C; ventilação sem jatos diretos.</li>
                      <li>Densidade interna típica: 7–9 aves/m²; acesso diário a piquetes com rotação.</li>
                      <li>Ração de recria com perfil adequado; água limpa e fresca sempre disponível.</li>
                      <li>Meta: uniformidade do lote, desenvolvimento ósseo e emplumamento completos.</li>
                      <li>Treinamento para ninhos e poleiros ao final da recria.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Ventilação</Badge>
                      <Badge variant="secondary">Piquetes</Badge>
                      <Badge variant="secondary">Uniformidade</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Produção (≥ 18–20 semanas)</div>
                    <p className="text-sm text-muted-foreground mt-1">Postura, conforto e recursos.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Ninhos: 1 boca/5 aves ou 0,8 m²/100 aves em ninho coletivo; coleta 2–3x/dia.</li>
                      <li>Densidade interna de referência: 7 aves/m²; área externa 2 aves/m² com vegetação.</li>
                      <li>Nutrição de postura com cálcio e fósforo adequados; ajuste conforme desempenho.</li>
                      <li>Ambiente: ventilação e sombreamento eficientes; mínimo de 6h de escuro contínuo.</li>
                      <li>Monitorar produção diária, qualidade de casca e condição corporal.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Ninhos</Badge>
                      <Badge variant="secondary">Nutrição</Badge>
                      <Badge variant="secondary">Bem-estar</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Transições e metas</div>
                    <p className="text-sm text-muted-foreground mt-1">Critérios práticos para troca de fase.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Troca de ração quando metas de peso e emplumamento forem atingidas.</li>
                      <li>Reduzir aquecimento gradualmente de acordo com comportamento e temperatura.</li>
                      <li>Introduzir ninhos e poleiros antes da maturidade sexual para melhor adaptação.</li>
                      <li>Revisar densidade e espaço de recursos a cada fase para evitar estresse.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Peso-alvo</Badge>
                      <Badge variant="secondary">Adaptação</Badge>
                      <Badge variant="secondary">Recursos</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="racas-poedeiras">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bird className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Raças de Galinhas Poedeiras</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Características e rusticidade</div>
                    <p className="text-sm text-muted-foreground mt-1">Perfis comuns em sistemas caipira/free-range.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Linhas comerciais marrons (ex.: Isa Brown, Lohmann, Embrapa 051): boa postura, ovos castanhos.</li>
                      <li>Raças rústicas (ex.: Plymouth Rock, Rhode Island Red): maior capacidade de forrageamento.</li>
                      <li>Comportamento: baixa agressividade, boa adaptação ao pastejo e clima variável.</li>
                      <li>Seleção por saúde, resistência e uniformidade do lote.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Rusticidade</Badge>
                      <Badge variant="secondary">Forrageamento</Badge>
                      <Badge variant="secondary">Ovos castanhos</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Produtividade comparativa</div>
                    <p className="text-sm text-muted-foreground mt-1">Metas praticadas e parâmetros de referência.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Idade de início de postura: 18–20 semanas; pico aos 28–32 semanas.</li>
                      <li>Postura anual (linhas comerciais): ~280–320 ovos/ave/ano em manejo adequado.</li>
                      <li>Peso do ovo: 58–62 g em poedeiras marrons; casca mais espessa em sistemas ativos.</li>
                      <li>Conversão alimentar: ajustar por fase e clima; monitorar consumo diário.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Postura</Badge>
                      <Badge variant="secondary">Pico</Badge>
                      <Badge variant="secondary">Peso do ovo</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Adaptação a condições</div>
                    <p className="text-sm text-muted-foreground mt-1">Clima, manejo e expressões naturais.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Climas quentes: foco em sombreamento e ventilação; água fresca constante.</li>
                      <li>Climas frios: cama profunda, vedação e aquecimento para lotes jovens.</li>
                      <li>Free-range: rotação de piquetes, proteção contra predadores e pontos de sombra.</li>
                      <li>Bem-estar: acesso a ninhos, poleiros e banhos de areia.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Clima</Badge>
                      <Badge variant="secondary">Sistema</Badge>
                      <Badge variant="secondary">Bem-estar</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="misturas-racao">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ChefHat className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Misturas de Ração</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Perfis nutricionais por fase</div>
                    <p className="text-sm text-muted-foreground mt-1">Faixas de referência e ajustes práticos.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Cria (0–4/5 sem): PB 20–22%; Ca 0,9–1,0%; Pd 0,45–0,50%; EM 2850–2950 kcal/kg.</li>
                      <li>Recria (5–13 sem): PB 16–18%; Ca 0,8–0,9%; Pd 0,40–0,45%; EM 2700–2850 kcal/kg.</li>
                      <li>Postura (≥ 18 semanas): PB 16–18%; Ca 3,5–4,2%; Pd 0,35–0,45%; EM 2700–2800 kcal/kg.</li>
                      <li>Metionina + cistina: ajustar conforme metas de produção e matéria-prima.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Proteína</Badge>
                      <Badge variant="secondary">Energia</Badge>
                      <Badge variant="secondary">Cálcio</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Receitas balanceadas (exemplo)</div>
                    <p className="text-sm text-muted-foreground mt-1">Ajuste por análise de ingredientes locais.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Milho/energia: base da formulação (50–60%).</li>
                      <li>Farelo de soja/proteína: 18–28% conforme fase.</li>
                      <li>Calcário e fosfato: atender Ca/P; incluir sal e premix vitamínico-mineral.</li>
                      <li>Óleos/enzimas: conforme necessidade de energia e digestibilidade.</li>
                      <li>Alternativas locais (sorgo, farelo de trigo, DDG): ajustar com suporte técnico.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Ingredientes</Badge>
                      <Badge variant="secondary">Premix</Badge>
                      <Badge variant="secondary">Energia</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Cálculos e preparo</div>
                    <p className="text-sm text-muted-foreground mt-1">Quantidades, escalas e controle.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Definir lote padrão (ex.: 100 kg) para facilitar proporções.</li>
                      <li>Pesar ingredientes com precisão; misturar secos antes de líquidos.</li>
                      <li>Registrar lote, data e origem de insumos; armazenar em local seco e ventilado.</li>
                      <li>Ajustar formulação por desempenho observado e análises periódicas.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Batch</Badge>
                      <Badge variant="secondary">Registro</Badge>
                      <Badge variant="secondary">Armazenamento</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regras-galinheiro">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Regras para Construção de Galinheiro</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Dimensionamento e layout</div>
                    <p className="text-sm text-muted-foreground mt-1">Espaços, orientação e fluxos.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Orientar galpões para máxima ventilação e luz difusa; evitar insolação direta excessiva.</li>
                      <li>Densidade interna referência: 7 aves/m²; ajustar por estrutura e bem-estar.</li>
                      <li>Prever áreas por fase: postura e incubação, cria, recria e produção com acesso a piquetes.</li>
                      <li>Fluxo interno separado para alimentação, água, ninhos e áreas de descanso.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Orientação</Badge>
                      <Badge variant="secondary">Densidade</Badge>
                      <Badge variant="secondary">Fluxo</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Ventilação e iluminação</div>
                    <p className="text-sm text-muted-foreground mt-1">Conforto térmico e fotoperíodo.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Janelas e aberturas opostas para ventilação cruzada; uso de telas para proteção.</li>
                      <li>Exaustores/ventiladores em climas quentes; sombreamento do telhado e áreas externas.</li>
                      <li>Luz natural preferencial; garantir mínimo de 8h contínuas de luz e 6h de escuro.</li>
                      <li>Iluminação artificial difusa, sem pontos de ofuscamento.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Ventilação</Badge>
                      <Badge variant="secondary">Iluminação</Badge>
                      <Badge variant="secondary">Sombreamento</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Materiais e cama</div>
                    <p className="text-sm text-muted-foreground mt-1">Durabilidade, higiene e manejo.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Estrutura simples e funcional com materiais locais; evitar frestas e pontos de acúmulo.</li>
                      <li>Piso com drenagem; cama de 5–8 cm (maravalha, palha, casca de cereais) bem distribuída.</li>
                      <li>Rotina de revolvimento, remoção e substituição da cama; desinfecção periódica.</li>
                      <li>Telas e cercas resistentes para impedir entrada de predadores.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Cama</Badge>
                      <Badge variant="secondary">Desinfecção</Badge>
                      <Badge variant="secondary">Cercas</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Piquetes e cercamento</div>
                    <p className="text-sm text-muted-foreground mt-1">Acesso externo, rotação e proteção.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Acesso diário aos piquetes com rotação semanal para recuperação da vegetação.</li>
                      <li>Drenagem adequada e pontos de sombra; oferta de banhos de areia.</li>
                      <li>Cercas com altura suficiente e malha adequada para evitar predadores.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Rotação</Badge>
                      <Badge variant="secondary">Drenagem</Badge>
                      <Badge variant="secondary">Proteção</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentacao">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Documentação Necessária</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Registros obrigatórios</div>
                    <p className="text-sm text-muted-foreground mt-1">Produção, sanidade e insumos.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Produção diária de ovos por lote/ave; perdas e descartes.</li>
                      <li>Mortalidade, tratamentos aplicados, vermifugação e vacinação.</li>
                      <li>Estoque de ração e ingredientes; origem e lote de insumos.</li>
                      <li>Entrada/saída de aves e movimentação entre lotes.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Produção</Badge>
                      <Badge variant="secondary">Sanidade</Badge>
                      <Badge variant="secondary">Insumos</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Controles sanitários</div>
                    <p className="text-sm text-muted-foreground mt-1">Programas, protocolos e biossegurança.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Programa de vacinação conforme orientação técnica (ex.: Newcastle, Gumboro, Bronquite Infecciosa).</li>
                      <li>Registros de pedilúvio/rodolúvio, limpeza e desinfecção periódicas.</li>
                      <li>Inspeções internas e correções de não conformidades.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Vacinação</Badge>
                      <Badge variant="secondary">Biossegurança</Badge>
                      <Badge variant="secondary">Inspeção</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Licenças e autorizações</div>
                    <p className="text-sm text-muted-foreground mt-1">Ambientais, sanitárias e comerciais.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Autorizações ambientais e sanitárias conforme legislação local.</li>
                      <li>Registro junto aos órgãos municipais/estaduais quando aplicável.</li>
                      <li>Atendimento a normas de bem-estar animal e inspeções.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Ambiental</Badge>
                      <Badge variant="secondary">Sanitária</Badge>
                      <Badge variant="secondary">Fiscalização</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Rastreabilidade</div>
                    <p className="text-sm text-muted-foreground mt-1">Lotes, datas e fornecedores.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Manter identificação de lotes de aves e de ovos por data.</li>
                      <li>Registrar fornecedores, notas e referências para auditoria.</li>
                      <li>Guardar registros mínimos exigidos pelo período legal e técnico.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Lotes</Badge>
                      <Badge variant="secondary">Fornecedores</Badge>
                      <Badge variant="secondary">Auditoria</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agua-alimentacao">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Água e Alimentação</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Sistemas de água</div>
                    <p className="text-sm text-muted-foreground mt-1">Abastecimento, dimensionamento e limpeza.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Bebedouro pendular: 1 unidade para 80–100 aves; manter altura do prato ao nível do dorso.</li>
                      <li>Nipple: 1 nipple para 8–12 aves; ajustar altura conforme crescimento e manter pressão adequada.</li>
                      <li>Limpeza diária dos bebedouros; flush das linhas e sanitização periódica.</li>
                      <li>Consumo típico de água por ave aumenta no calor; garantir oferta constante e fresca.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Bebedouro</Badge>
                      <Badge variant="secondary">Nipple</Badge>
                      <Badge variant="secondary">Sanitização</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Qualidade da água</div>
                    <p className="text-sm text-muted-foreground mt-1">Parâmetros e correções básicas.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>pH recomendado ~6,5–7,8; corrigir com acidificação leve quando necessário.</li>
                      <li>Cloração com residual livre de ~2–3 ppm; verificar diariamente em pontos distantes.</li>
                      <li>Evitar turbidez e excesso de minerais; filtrar e tratar conforme análise.</li>
                      <li>Ausência de coliformes; realizar testes periódicos e correções imediatas.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">pH</Badge>
                      <Badge variant="secondary">Cloro</Badge>
                      <Badge variant="secondary">Microbiologia</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Programação alimentar</div>
                    <p className="text-sm text-muted-foreground mt-1">Horários, ajustes e suplementação.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Em climas quentes, priorizar oferta nas primeiras horas da manhã e fim da tarde.</li>
                      <li>Ajustar granulometria e forma (farelada/finamente moída) conforme fase e desempenho.</li>
                      <li>Suplementar cálcio para poedeiras conforme necessidade (ex.: calcário grosso no fim do dia).</li>
                      <li>Monitorar consumo diário e corrigir desvios rapidamente.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Horários</Badge>
                      <Badge variant="secondary">Granulometria</Badge>
                      <Badge variant="secondary">Cálcio</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Comedouros e espaço</div>
                    <p className="text-sm text-muted-foreground mt-1">Dimensionamento e manutenção.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Troncos/calhas: 8–10 cm de espaço linear por ave em alimentação simultânea.</li>
                      <li>Comedouro pendular redondo: 1 para 40–50 aves; ajustar altura ao dorso das aves.</li>
                      <li>Limpeza diária de resíduos e ajuste para evitar desperdício e competição.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Espaço</Badge>
                      <Badge variant="secondary">Altura</Badge>
                      <Badge variant="secondary">Limpeza</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doencas-prevencoes">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Doenças e Prevenções</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Principais enfermidades</div>
                    <p className="text-sm text-muted-foreground mt-1">Foco em sistemas caipira/free-range.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Respiratórias: Newcastle, Bronquite Infecciosa, Coriza Infecciosa.</li>
                      <li>Imunossupressoras: Gumboro (Doença de Bursa), Marek.</li>
                      <li>Entéricas/parasitas: Coccidiose, Salmonella, vermes gastrointestinais.</li>
                      <li>Cutâneas: Bouba aviária (pox) em ambientes com mosquitos.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Respiratórias</Badge>
                      <Badge variant="secondary">Entéricas</Badge>
                      <Badge variant="secondary">Pox</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Sintomas e diagnóstico</div>
                    <p className="text-sm text-muted-foreground mt-1">Observação clínica e ações.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Letargia, perda de apetite, queda de postura e perda de peso.</li>
                      <li>Secreção nasal/ocular, tosse, chiado; fezes aquosas ou sanguinolentas em coccidiose.</li>
                      <li>Exame de necropsia e consulta veterinária para confirmação e conduta.</li>
                      <li>Isolamento de aves doentes e limpeza intensiva do ambiente.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Observação</Badge>
                      <Badge variant="secondary">Necropsia</Badge>
                      <Badge variant="secondary">Isolamento</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Programa de vacinação (exemplo)</div>
                    <p className="text-sm text-muted-foreground mt-1">Ajustar conforme orientação técnica local.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Dia 1: Marek (em incubatório). 7–10 dias: Newcastle + Bronquite (spray).</li>
                      <li>14–21 dias: Gumboro com reforço conforme risco e orientação.</li>
                      <li>6–8 semanas: Newcastle óleo/inativada; 10–12 semanas: Bouba (wing-web).</li>
                      <li>Pré-postura: reforços para Newcastle/Bronquite conforme necessidade.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Calendário</Badge>
                      <Badge variant="secondary">Reforços</Badge>
                      <Badge variant="secondary">Aplicação</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Medidas preventivas</div>
                    <p className="text-sm text-muted-foreground mt-1">Biossegurança e manejo.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Pedilúvio/rodolúvio, controle de visitantes e EPIs dedicados.</li>
                      <li>Higienização de bebedouros/comedouros e desinfecção periódica de instalações.</li>
                      <li>Controle de roedores/insetos e proteção contra predadores.</li>
                      <li>Rotação de piquetes e prevenção de superlotação.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Biossegurança</Badge>
                      <Badge variant="secondary">Higiene</Badge>
                      <Badge variant="secondary">Controle pragas</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="galinheiro">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Galinheiro</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Manutenção e limpeza</div>
                    <p className="text-sm text-muted-foreground mt-1">Rotinas diárias, semanais e mensais.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Limpeza diária de bebedouros e comedouros; remoção de resíduos.</li>
                      <li>Troca/revolvimento de cama conforme umidade; manter 5–8 cm, seca e fofa.</li>
                      <li>Inspeção de ninhos e coleta 2–3x/dia; higienização e reposição de material.</li>
                      <li>Desinfecção periódica de superfícies e equipamentos; controle de pragas.</li>
                      <li>Revisão estrutural mensal: telas, cercas, portas, telhado e drenagem.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Rotina</Badge>
                      <Badge variant="secondary">Higiene</Badge>
                      <Badge variant="secondary">Inspeção</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Equipamentos essenciais</div>
                    <p className="text-sm text-muted-foreground mt-1">Seleção, ajuste e manutenção.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Bebedouros (pendular/nipple) e comedouros ajustados à altura do dorso.</li>
                      <li>Ninhos e poleiros dimensionados; banhos de areia em áreas externas.</li>
                      <li>Campânulas/aquecedores para cria; termômetro e higrômetro para monitoramento.</li>
                      <li>Ventiladores/exaustores conforme clima; telas e cercas contra predadores.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Ninhos</Badge>
                      <Badge variant="secondary">Poleiros</Badge>
                      <Badge variant="secondary">Ventilação</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Organização do espaço</div>
                    <p className="text-sm text-muted-foreground mt-1">Fluxos, zonas e sinalização.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Zonas para alimentação, água, descanso e postura com acesso fácil e sem obstruções.</li>
                      <li>Fluxo unidirecional preferencial; evitar cruzamentos e pontos de competição.</li>
                      <li>Altura e posicionamento dos equipamentos ajustados por fase e porte das aves.</li>
                      <li>Sinalização básica de rotinas e segurança; controle de acesso com pedilúvio.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Fluxo</Badge>
                      <Badge variant="secondary">Zonas</Badge>
                      <Badge variant="secondary">Acesso</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venda-ovos">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Venda de Ovos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <PanelGrid>
                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Qualidade e classificação</div>
                    <p className="text-sm text-muted-foreground mt-1">Integridade, ovoscopia e classes de peso.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Limpeza a seco; evitar lavagem para não remover cutícula protetora.</li>
                      <li>Ovoscopia para descartar ovos com trincas, sujos ou com defeitos.</li>
                      <li>Classificação por peso (ex.: grande, médio, pequeno) conforme prática local.</li>
                      <li>Registrar lote, data de postura e validade estimada.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Classe</Badge>
                      <Badge variant="secondary">Ovoscopia</Badge>
                      <Badge variant="secondary">Validade</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Embalagem e armazenamento</div>
                    <p className="text-sm text-muted-foreground mt-1">Conservação, rotação e condições.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Embalagens limpas e íntegras; proteger de odores e contaminações.</li>
                      <li>Armazenar em local fresco, ventilado e longe do sol; ideal 7–15°C e umidade 60–80%.</li>
                      <li>Evitar condensação; usar rotação PEPS (primeiro a entrar, primeiro a sair).</li>
                      <li>Validar prazo de venda conforme condições de armazenamento e regulamentos locais.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Embalagem</Badge>
                      <Badge variant="secondary">Temperatura</Badge>
                      <Badge variant="secondary">PEPS</Badge>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border min-w-[260px] md:min-w-0 snap-start">
                    <div className="font-medium">Canais e precificação</div>
                    <p className="text-sm text-muted-foreground mt-1">Varejo, atacado e logística.</p>
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                      <li>Varejo local, feiras e mercados; restaurantes e pequenos comércios.</li>
                      <li>Negociação por classe de peso e volume; política de preços transparente.</li>
                      <li>Rotulagem com dados mínimos (lote, data, contato) conforme exigência local.</li>
                      <li>Planejar logística de entrega e devoluções; controle de lotes vendidos.</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">Varejo</Badge>
                      <Badge variant="secondary">Atacado</Badge>
                      <Badge variant="secondary">Rotulagem</Badge>
                    </div>
                  </div>
                </PanelGrid>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
