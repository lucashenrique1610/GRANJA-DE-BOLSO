
export interface ContentSection {
  title?: string
  items: string[]
}

export interface KnowledgeItem {
  id: string
  title: string
  imageSrc?: string
  imageAlt?: string
  description: string
  sections?: ContentSection[] // Used for multi-section content
  listItems?: string[] // Used for simple list content
  badges: string[]
  footerText?: string
}

export interface KnowledgeTab {
  id: string
  label: string
  iconName: string
  title: string
  description?: string // Optional description for the tab header
  items: KnowledgeItem[]
}

export const KNOWLEDGE_DATA: KnowledgeTab[] = [
  {
    id: "clima-ideal",
    label: "Clima Ideal",
    iconName: "CloudSun",
    title: "Clima Ideal",
    items: [
      {
        id: "clima-condicoes",
        title: "Condições climáticas ótimas",
        imageSrc: "/images/thermometer.png",
        imageAlt: "Ilustração de termômetro",
        description: "Faixas de conforto para aves caipiras em produção.",
        listItems: [
          "Temperatura de conforto (adultas): 18–24°C. Operacional: 12–30°C.",
          "Umidade relativa ideal: 50–70%. Acima de 80% aumenta risco de doenças; abaixo de 40% resseca vias aéreas.",
          "Ventilação: renovação de ar constante; no verão, intensificar a troca para dissipar calor.",
          "Velocidade do ar: 0,2–0,5 m/s dentro do galinheiro para conforto sem corrente excessiva."
        ],
        badges: ["Temperatura", "Umidade", "Ventilação"],
        footerText: "Conforto térmico reduz mortalidade e melhora a postura."
      },
      {
        id: "clima-adaptacao",
        title: "Adaptação a temperaturas",
        imageSrc: "/images/fan.png",
        imageAlt: "Ventilação e sombreamento",
        description: "Medidas práticas para frio e calor extremos.",
        sections: [
          {
            title: "Frio",
            items: [
              "Isolamento térmico do telhado e fechamento de frestas.",
              "Cama seca e profunda (10–15 cm) para retenção de calor.",
              "Cortinas e anteparos para reduzir correntes de ar.",
              "Aquecimento para pintinhos: 32–34°C na 1ª semana; reduzir 2–3°C/semana."
            ]
          },
          {
            title: "Calor",
            items: [
              "Sombreamento eficiente (telhado claro ou tela 50–70%).",
              "Ventiladores/exaustores para aumentar a circulação do ar.",
              "Nebulização fina ou resfriamento evaporativo em climas secos.",
              "Água fresca e eletrólitos nas horas mais quentes."
            ]
          },
          {
            title: "Estresse térmico",
            items: [
              "Sinais: ofego, asas abertas, queda de consumo e postura.",
              "Resposta: reduzir densidade, aumentar ventilação e ofertar água fria."
            ]
          }
        ],
        badges: ["Frio", "Calor", "Estresse térmico"]
      },
      {
        id: "clima-controle",
        title: "Controle no galinheiro",
        imageSrc: "/images/barn.png",
        imageAlt: "Galinheiro e controle ambiental",
        description: "Uso coordenado de aquecimento, exaustão e sombreamento.",
        sections: [
          {
            title: "Aquecimento",
            items: [
              "Fontes: infravermelho, aquecedores a gás ou elétricos com termostato.",
              "Meta por fase: pintinhos (32–34°C), recria (24–28°C), produção (20–24°C)."
            ]
          },
          {
            title: "Exaustão/Ventilação",
            items: [
              "Manter fluxo de ar uniforme, sem jatos direcionados às aves.",
              "Aumentar renovação de ar em períodos quentes para remover calor e umidade."
            ]
          },
          {
            title: "Sombreamento",
            items: [
              "Telhas térmicas, forros refletivos ou telas de sombreamento.",
              "Árvores e barreiras naturais reduzem carga térmica em áreas externas."
            ]
          }
        ],
        badges: ["Aquecimento", "Exaustão", "Sombreamento"]
      }
    ]
  },
  {
    id: "manejo",
    label: "Manejo",
    iconName: "Tractor",
    title: "Manejo",
    items: [
      {
        id: "manejo-rotinas",
        title: "Rotinas diárias",
        imageSrc: "/images/eggs.png",
        imageAlt: "Coleta de ovos",
        description: "Procedimentos essenciais para free-range/caipira.",
        listItems: [
          "Coleta de ovos 2–3x ao dia; manter ninhos limpos e secos.",
          "Inspeção das aves (locomoção, penas, crista, respiração) e retirada de doentes.",
          "Verificação de água e comedouros; limpeza diária de resíduos.",
          "Tratamento e revolvimento da cama (5–8 cm de espessura) para manter seca.",
          "Controle de pragas (roedores, insetos) e manutenção de telas e cercas."
        ],
        badges: ["Coleta", "Inspeção", "Cama"]
      },
      {
        id: "manejo-bioseguranca",
        title: "Biosegurança",
        description: "Prevenção de doenças e proteção do plantel.",
        listItems: [
          "Instalar pedilúvio/rodolúvio na entrada com desinfetante trocado regularmente.",
          "Restringir visitas e uso de EPIs dedicados; lavar mãos ao entrar.",
          "Quarentena de novas aves e controle de trânsito entre lotes.",
          "Limpeza e desinfecção periódica; manejo adequado de carcaças e dejetos."
        ],
        badges: ["Pedilúvio", "Quarentena", "Desinfecção"]
      },
      {
        id: "manejo-ambiente",
        title: "Ambiente e densidade",
        description: "Espaço interno e piquetes com bem-estar.",
        listItems: [
          "Densidade interna típica: 7 aves/m² (galpão de piso único com cama).",
          "Área externa: 2 aves/m² (free-range certificado) como referência de bem-estar.",
          "Ninhos: 1 boca de ninho/5 aves ou 0,8 m² de ninho coletivo/100 aves.",
          "Iluminação: mínimo de 8h de luz contínua e 6h de escuro contínuo.",
          "Rotação de piquetes semanal para recuperação da vegetação."
        ],
        badges: ["Densidade", "Ninhos", "Iluminação"]
      },
      {
        id: "manejo-registros",
        title: "Registros e rotina",
        description: "Acompanhamento técnico e ajustes.",
        listItems: [
          "Registrar produção diária de ovos por lote e por ave.",
          "Consumo de ração/água, mortalidade e ocorrências sanitárias.",
          "Calendário de vacinação e vermifugação conforme orientação técnica.",
          "Ajustar manejo conforme estação (clima frio/quente) e fase das aves."
        ],
        badges: ["Produção", "Vacinação", "Ajustes"]
      }
    ]
  },
  {
    id: "fase-aves",
    label: "Fase das Aves",
    iconName: "Egg",
    title: "Fase das Aves",
    items: [
      {
        id: "fase-cria",
        title: "Cria (0–30 dias)",
        description: "Aquecimento, proteção e início nutricional.",
        listItems: [
          "Temperatura na 1ª semana: 32–34°C; reduzir 2–3°C/semana até ~24–26°C na 5ª semana.",
          "Densidade de cria em piso: 20–22 aves/m²; pinteiro fechado e sem correntes de ar.",
          "Cama seca e fofa (5–8 cm); círculos de proteção e fonte de calor confiável.",
          "Ração inicial balanceada e água fresca ad libitum; altura de bebedouros/comedouros ajustada.",
          "Observação de comportamento (distribuição ao redor da fonte de calor) para ajustes finos."
        ],
        badges: ["Aquecimento", "Densidade", "Cama"]
      },
      {
        id: "fase-recria",
        title: "Recria (31–90 dias)",
        description: "Crescimento, uniformidade e adaptação.",
        listItems: [
          "Temperatura de conforto: 24–28°C; ventilação sem jatos diretos.",
          "Densidade interna típica: 7–9 aves/m²; acesso diário a piquetes com rotação.",
          "Ração de recria com perfil adequado; água limpa e fresca sempre disponível.",
          "Meta: uniformidade do lote, desenvolvimento ósseo e emplumamento completos.",
          "Treinamento para ninhos e poleiros ao final da recria."
        ],
        badges: ["Ventilação", "Piquetes", "Uniformidade"]
      },
      {
        id: "fase-producao",
        title: "Produção (≥ 18–20 semanas)",
        description: "Postura, conforto e recursos.",
        listItems: [
          "Ninhos: 1 boca/5 aves ou 0,8 m²/100 aves em ninho coletivo; coleta 2–3x/dia.",
          "Densidade interna de referência: 7 aves/m²; área externa 2 aves/m² com vegetação.",
          "Nutrição de postura com cálcio e fósforo adequados; ajuste conforme desempenho.",
          "Ambiente: ventilação e sombreamento eficientes; mínimo de 6h de escuro contínuo.",
          "Monitorar produção diária, qualidade de casca e condição corporal."
        ],
        badges: ["Ninhos", "Nutrição", "Bem-estar"]
      },
      {
        id: "fase-transicao",
        title: "Transições e metas",
        description: "Critérios práticos para troca de fase.",
        listItems: [
          "Troca de ração quando metas de peso e emplumamento forem atingidas.",
          "Reduzir aquecimento gradualmente de acordo com comportamento e temperatura.",
          "Introduzir ninhos e poleiros antes da maturidade sexual para melhor adaptação.",
          "Revisar densidade e espaço de recursos a cada fase para evitar estresse."
        ],
        badges: ["Peso-alvo", "Adaptação", "Recursos"]
      }
    ]
  },
  {
    id: "racas-poedeiras",
    label: "Raças de Galinhas Poedeiras",
    iconName: "Bird",
    title: "Raças de Galinhas Poedeiras",
    items: [
      {
        id: "racas-caracteristicas",
        title: "Características e rusticidade",
        description: "Perfis comuns em sistemas caipira/free-range.",
        listItems: [
          "Linhas comerciais marrons (ex.: Isa Brown, Lohmann, Embrapa 051): boa postura, ovos castanhos.",
          "Raças rústicas (ex.: Plymouth Rock, Rhode Island Red): maior capacidade de forrageamento.",
          "Comportamento: baixa agressividade, boa adaptação ao pastejo e clima variável.",
          "Seleção por saúde, resistência e uniformidade do lote."
        ],
        badges: ["Rusticidade", "Forrageamento", "Ovos castanhos"]
      },
      {
        id: "racas-produtividade",
        title: "Produtividade comparativa",
        description: "Metas praticadas e parâmetros de referência.",
        listItems: [
          "Idade de início de postura: 18–20 semanas; pico aos 28–32 semanas.",
          "Postura anual (linhas comerciais): ~280–320 ovos/ave/ano em manejo adequado.",
          "Peso do ovo: 58–62 g em poedeiras marrons; casca mais espessa em sistemas ativos.",
          "Conversão alimentar: ajustar por fase e clima; monitorar consumo diário."
        ],
        badges: ["Postura", "Pico", "Peso do ovo"]
      },
      {
        id: "racas-adaptacao",
        title: "Adaptação a condições",
        description: "Clima, manejo e expressões naturais.",
        listItems: [
          "Climas quentes: foco em sombreamento e ventilação; água fresca constante.",
          "Climas frios: cama profunda, vedação e aquecimento para lotes jovens.",
          "Free-range: rotação de piquetes, proteção contra predadores e pontos de sombra.",
          "Bem-estar: acesso a ninhos, poleiros e banhos de areia."
        ],
        badges: ["Clima", "Sistema", "Bem-estar"]
      }
    ]
  },
  {
    id: "misturas-racao",
    label: "Misturas de Ração",
    iconName: "ChefHat",
    title: "Misturas de Ração",
    items: [
      {
        id: "racao-perfis",
        title: "Perfis nutricionais por fase",
        description: "Faixas de referência e ajustes práticos.",
        listItems: [
          "Cria (0–4/5 sem): PB 20–22%; Ca 0,9–1,0%; Pd 0,45–0,50%; EM 2850–2950 kcal/kg.",
          "Recria (5–13 sem): PB 16–18%; Ca 0,8–0,9%; Pd 0,40–0,45%; EM 2700–2850 kcal/kg.",
          "Postura (≥ 18 semanas): PB 16–18%; Ca 3,5–4,2%; Pd 0,35–0,45%; EM 2700–2800 kcal/kg.",
          "Metionina + cistina: ajustar conforme metas de produção e matéria-prima."
        ],
        badges: ["Proteína", "Energia", "Cálcio"]
      },
      {
        id: "racao-receitas",
        title: "Receitas balanceadas (exemplo)",
        description: "Ajuste por análise de ingredientes locais.",
        listItems: [
          "Milho/energia: base da formulação (50–60%).",
          "Farelo de soja/proteína: 18–28% conforme fase.",
          "Calcário e fosfato: atender Ca/P; incluir sal e premix vitamínico-mineral.",
          "Óleos/enzimas: conforme necessidade de energia e digestibilidade.",
          "Alternativas locais (sorgo, farelo de trigo, DDG): ajustar com suporte técnico."
        ],
        badges: ["Ingredientes", "Premix", "Energia"]
      },
      {
        id: "racao-calculos",
        title: "Cálculos e preparo",
        description: "Quantidades, escalas e controle.",
        listItems: [
          "Definir lote padrão (ex.: 100 kg) para facilitar proporções.",
          "Pesar ingredientes com precisão; misturar secos antes de líquidos.",
          "Registrar lote, data e origem de insumos; armazenar em local seco e ventilado.",
          "Ajustar formulação por desempenho observado e análises periódicas."
        ],
        badges: ["Batch", "Registro", "Armazenamento"]
      }
    ]
  },
  {
    id: "regras-galinheiro",
    label: "Regras para Construção de Galinheiro",
    iconName: "Settings",
    title: "Regras para Construção de Galinheiro",
    items: [
      {
        id: "galinheiro-dimensionamento",
        title: "Dimensionamento e layout",
        description: "Espaços, orientação e fluxos.",
        listItems: [
          "Orientar galpões para máxima ventilação e luz difusa; evitar insolação direta excessiva.",
          "Densidade interna referência: 7 aves/m²; ajustar por estrutura e bem-estar.",
          "Prever áreas por fase: postura e incubação, cria, recria e produção com acesso a piquetes.",
          "Fluxo interno separado para alimentação, água, ninhos e áreas de descanso."
        ],
        badges: ["Orientação", "Densidade", "Fluxo"]
      },
      {
        id: "galinheiro-ventilacao",
        title: "Ventilação e iluminação",
        description: "Conforto térmico e fotoperíodo.",
        listItems: [
          "Janelas e aberturas opostas para ventilação cruzada; uso de telas para proteção.",
          "Exaustores/ventiladores em climas quentes; sombreamento do telhado e áreas externas.",
          "Luz natural preferencial; garantir mínimo de 8h contínuas de luz e 6h de escuro.",
          "Iluminação artificial difusa, sem pontos de ofuscamento."
        ],
        badges: ["Ventilação", "Iluminação", "Sombreamento"]
      },
      {
        id: "galinheiro-materiais",
        title: "Materiais e cama",
        description: "Durabilidade, higiene e manejo.",
        listItems: [
          "Estrutura simples e funcional com materiais locais; evitar frestas e pontos de acúmulo.",
          "Piso com drenagem; cama de 5–8 cm (maravalha, palha, casca de cereais) bem distribuída.",
          "Rotina de revolvimento, remoção e substituição da cama; desinfecção periódica.",
          "Telas e cercas resistentes para impedir entrada de predadores."
        ],
        badges: ["Cama", "Desinfecção", "Cercas"]
      },
      {
        id: "galinheiro-piquetes",
        title: "Piquetes e cercamento",
        description: "Acesso externo, rotação e proteção.",
        listItems: [
          "Acesso diário aos piquetes com rotação semanal para recuperação da vegetação.",
          "Drenagem adequada e pontos de sombra; oferta de banhos de areia.",
          "Cercas com altura suficiente e malha adequada para evitar predadores."
        ],
        badges: ["Rotação", "Drenagem", "Proteção"]
      }
    ]
  },
  {
    id: "documentacao",
    label: "Documentação Necessária",
    iconName: "FileText",
    title: "Documentação Necessária",
    items: [
      {
        id: "doc-registros",
        title: "Registros obrigatórios",
        description: "Produção, sanidade e insumos.",
        listItems: [
          "Produção diária de ovos por lote/ave; perdas e descartes.",
          "Mortalidade, tratamentos aplicados, vermifugação e vacinação.",
          "Estoque de ração e ingredientes; origem e lote de insumos.",
          "Entrada/saída de aves e movimentação entre lotes."
        ],
        badges: ["Produção", "Sanidade", "Insumos"]
      },
      {
        id: "doc-sanitarios",
        title: "Controles sanitários",
        description: "Programas, protocolos e biossegurança.",
        listItems: [
          "Programa de vacinação conforme orientação técnica (ex.: Newcastle, Gumboro, Bronquite Infecciosa).",
          "Registros de pedilúvio/rodolúvio, limpeza e desinfecção periódicas.",
          "Inspeções internas e correções de não conformidades."
        ],
        badges: ["Vacinação", "Biossegurança", "Inspeção"]
      },
      {
        id: "doc-licencas",
        title: "Licenças e autorizações",
        description: "Ambientais, sanitárias e comerciais.",
        listItems: [
          "Autorizações ambientais e sanitárias conforme legislação local.",
          "Registro junto aos órgãos municipais/estaduais quando aplicável.",
          "Atendimento a normas de bem-estar animal e inspeções."
        ],
        badges: ["Ambiental", "Sanitária", "Fiscalização"]
      },
      {
        id: "doc-rastreabilidade",
        title: "Rastreabilidade",
        description: "Lotes, datas e fornecedores.",
        listItems: [
          "Manter identificação de lotes de aves e de ovos por data.",
          "Registrar fornecedores, notas e referências para auditoria.",
          "Guardar registros mínimos exigidos pelo período legal e técnico."
        ],
        badges: ["Lotes", "Fornecedores", "Auditoria"]
      }
    ]
  },
  {
    id: "agua-alimentacao",
    label: "Água e Alimentação",
    iconName: "Droplets",
    title: "Água e Alimentação",
    items: [
      {
        id: "agua-sistemas",
        title: "Sistemas de água",
        description: "Abastecimento, dimensionamento e limpeza.",
        listItems: [
          "Bebedouro pendular: 1 unidade para 80–100 aves; manter altura do prato ao nível do dorso.",
          "Nipple: 1 nipple para 8–12 aves; ajustar altura conforme crescimento e manter pressão adequada.",
          "Limpeza diária dos bebedouros; flush das linhas e sanitização periódica.",
          "Consumo típico de água por ave aumenta no calor; garantir oferta constante e fresca."
        ],
        badges: ["Bebedouro", "Nipple", "Sanitização"]
      },
      {
        id: "agua-qualidade",
        title: "Qualidade da água",
        description: "Parâmetros e correções básicas.",
        listItems: [
          "pH recomendado ~6,5–7,8; corrigir com acidificação leve quando necessário.",
          "Cloração com residual livre de ~2–3 ppm; verificar diariamente em pontos distantes.",
          "Evitar turbidez e excesso de minerais; filtrar e tratar conforme análise.",
          "Ausência de coliformes; realizar testes periódicos e correções imediatas."
        ],
        badges: ["pH", "Cloro", "Microbiologia"]
      },
      {
        id: "agua-programacao",
        title: "Programação alimentar",
        description: "Horários, ajustes e suplementação.",
        listItems: [
          "Em climas quentes, priorizar oferta nas primeiras horas da manhã e fim da tarde.",
          "Ajustar granulometria e forma (farelada/finamente moída) conforme fase e desempenho.",
          "Suplementar cálcio para poedeiras conforme necessidade (ex.: calcário grosso no fim do dia).",
          "Monitorar consumo diário e corrigir desvios rapidamente."
        ],
        badges: ["Horários", "Granulometria", "Cálcio"]
      },
      {
        id: "agua-comedouros",
        title: "Comedouros e espaço",
        description: "Dimensionamento e manutenção.",
        listItems: [
          "Troncos/calhas: 8–10 cm de espaço linear por ave em alimentação simultânea.",
          "Comedouro pendular redondo: 1 para 40–50 aves; ajustar altura ao dorso das aves.",
          "Limpeza diária de resíduos e ajuste para evitar desperdício e competição."
        ],
        badges: ["Espaço", "Altura", "Limpeza"]
      }
    ]
  },
  {
    id: "doencas-prevencoes",
    label: "Doenças e Prevenções",
    iconName: "ShieldAlert",
    title: "Doenças e Prevenções",
    items: [
      {
        id: "doencas-principais",
        title: "Principais enfermidades",
        description: "Foco em sistemas caipira/free-range.",
        listItems: [
          "Respiratórias: Newcastle, Bronquite Infecciosa, Coriza Infecciosa.",
          "Imunossupressoras: Gumboro (Doença de Bursa), Marek.",
          "Entéricas/parasitas: Coccidiose, Salmonella, vermes gastrointestinais.",
          "Cutâneas: Bouba aviária (pox) em ambientes com mosquitos."
        ],
        badges: ["Respiratórias", "Entéricas", "Pox"]
      },
      {
        id: "doencas-sintomas",
        title: "Sintomas e diagnóstico",
        description: "Observação clínica e ações.",
        listItems: [
          "Letargia, perda de apetite, queda de postura e perda de peso.",
          "Secreção nasal/ocular, tosse, chiado; fezes aquosas ou sanguinolentas em coccidiose.",
          "Exame de necropsia e consulta veterinária para confirmação e conduta.",
          "Isolamento de aves doentes e limpeza intensiva do ambiente."
        ],
        badges: ["Observação", "Necropsia", "Isolamento"]
      },
      {
        id: "doencas-vacinas",
        title: "Programa de vacinação (exemplo)",
        description: "Ajustar conforme orientação técnica local.",
        listItems: [
          "Dia 1: Marek (em incubatório). 7–10 dias: Newcastle + Bronquite (spray).",
          "14–21 dias: Gumboro com reforço conforme risco e orientação.",
          "6–8 semanas: Newcastle óleo/inativada; 10–12 semanas: Bouba (wing-web).",
          "Pré-postura: reforços para Newcastle/Bronquite conforme necessidade."
        ],
        badges: ["Calendário", "Reforços", "Aplicação"]
      },
      {
        id: "doencas-preventivas",
        title: "Medidas preventivas",
        description: "Biossegurança e manejo.",
        listItems: [
          "Pedilúvio/rodolúvio, controle de visitantes e EPIs dedicados.",
          "Higienização de bebedouros/comedouros e desinfecção periódica de instalações.",
          "Controle de roedores/insetos e proteção contra predadores.",
          "Rotação de piquetes e prevenção de superlotação."
        ],
        badges: ["Biossegurança", "Higiene", "Controle pragas"]
      }
    ]
  },
  {
    id: "galinheiro",
    label: "Galinheiro",
    iconName: "Home",
    title: "Galinheiro",
    items: [
      {
        id: "galinheiro-manutencao",
        title: "Manutenção e limpeza",
        description: "Rotinas diárias, semanais e mensais.",
        listItems: [
          "Limpeza diária de bebedouros e comedouros; remoção de resíduos.",
          "Troca/revolvimento de cama conforme umidade; manter 5–8 cm, seca e fofa.",
          "Inspeção de ninhos e coleta 2–3x/dia; higienização e reposição de material.",
          "Desinfecção periódica de superfícies e equipamentos; controle de pragas.",
          "Revisão estrutural mensal: telas, cercas, portas, telhado e drenagem."
        ],
        badges: ["Rotina", "Higiene", "Inspeção"]
      },
      {
        id: "galinheiro-equipamentos",
        title: "Equipamentos essenciais",
        description: "Seleção, ajuste e manutenção.",
        listItems: [
          "Bebedouros (pendular/nipple) e comedouros ajustados à altura do dorso.",
          "Ninhos e poleiros dimensionados; banhos de areia em áreas externas.",
          "Campânulas/aquecedores para cria; termômetro e higrômetro para monitoramento.",
          "Ventiladores/exaustores conforme clima; telas e cercas contra predadores."
        ],
        badges: ["Ninhos", "Poleiros", "Ventilação"]
      },
      {
        id: "galinheiro-organizacao",
        title: "Organização do espaço",
        description: "Fluxos, zonas e sinalização.",
        listItems: [
          "Zonas para alimentação, água, descanso e postura com acesso fácil e sem obstruções.",
          "Fluxo unidirecional preferencial; evitar cruzamentos e pontos de competição.",
          "Altura e posicionamento dos equipamentos ajustados por fase e porte das aves.",
          "Sinalização básica de rotinas e segurança; controle de acesso com pedilúvio."
        ],
        badges: ["Fluxo", "Zonas", "Acesso"]
      }
    ]
  },
  {
    id: "venda-ovos",
    label: "Venda de Ovos",
    iconName: "ShoppingBag",
    title: "Venda de Ovos",
    items: [
      {
        id: "venda-qualidade",
        title: "Qualidade e classificação",
        description: "Integridade, ovoscopia e classes de peso.",
        listItems: [
          "Limpeza a seco; evitar lavagem para não remover cutícula protetora.",
          "Ovoscopia para descartar ovos com trincas, sujos ou com defeitos.",
          "Classificação por peso (ex.: grande, médio, pequeno) conforme prática local.",
          "Registrar lote, data de postura e validade estimada."
        ],
        badges: ["Classe", "Ovoscopia", "Validade"]
      },
      {
        id: "venda-embalagem",
        title: "Embalagem e armazenamento",
        description: "Conservação, rotação e condições.",
        listItems: [
          "Embalagens limpas e íntegras; proteger de odores e contaminações.",
          "Armazenar em local fresco, ventilado e longe do sol; ideal 7–15°C e umidade 60–80%.",
          "Evitar condensação; usar rotação PEPS (primeiro a entrar, primeiro a sair).",
          "Validar prazo de venda conforme condições de armazenamento e regulamentos locais."
        ],
        badges: ["Embalagem", "Temperatura", "PEPS"]
      },
      {
        id: "venda-canais",
        title: "Canais e precificação",
        description: "Varejo, atacado e logística.",
        listItems: [
          "Varejo local, feiras e mercados; restaurantes e pequenos comércios.",
          "Negociação por classe de peso e volume; política de preços transparente.",
          "Rotulagem com dados mínimos (lote, data, contato) conforme exigência local.",
          "Planejar logística de entrega e devoluções; controle de lotes vendidos."
        ],
        badges: ["Varejo", "Atacado", "Rotulagem"]
      }
    ]
  }
]
