import { KnowledgeModule } from '@/types';

export const cria: KnowledgeModule = {
  id: 'cria',
  title: 'Cria de Galinhas de Postura Caipira (0 a 6 semanas)',
  category: 'produção',
  summary: 'Aprenda o manejo adequado na fase de cria (0 a 6 semanas) para garantir alta sobrevivência, crescimento uniforme e desenvolvimento saudável dos pintinhos.',
  objective: 'Orientar o produtor sobre todos os aspectos da fase de cria: recebimento dos pintinhos, temperatura, alimentação, água, instalações, desenvolvimento, vacinação e manejo geral.',
  technicalContent: [
    'A fase de cria compreende o período do nascimento até aproximadamente 6 semanas de idade. É uma fase crítica para a formação dos órgãos, desenvolvimento ósseo e imunológico, preparando as aves para as fases seguintes (recria e postura).',
    'Os principais objetivos da fase de cria são: alta sobrevivência (acima de 95% ideal), crescimento uniforme do lote, boa formação corporal, desenvolvimento saudável e redução da mortalidade.',
    'Recebimento dos pintinhos: preparar o ambiente 24 a 48 horas antes da chegada (aquecer o galpão, limpar, desinfetar). Garantir temperatura adequada, água limpa à vontade e ração inicial disponível. Observar o comportamento inicial dos pintinhos e permitir adaptação gradual ao local.',
    'Manejo da temperatura: a temperatura é crítica na fase de cria. Use o comportamento dos pintinhos como indicador (amontoados = frio, espalhados e com asas abertas = calor). Reduzir a temperatura gradualmente conforme a idade.',
    'Alimentação na fase de cria: a ração inicial é fundamental, com níveis nutricionais adequados de proteína (18-22%), energia, vitaminas e minerais. Fornecer ração à vontade ou em frequência regular, e armazenar em local seco e protegido.',
    'Manejo da água: água limpa e fresca deve estar disponível contínua, pois é essencial para o crescimento. Limpar os bebedouros regularmente para evitar contaminação.',
    'Instalações para pintinhos: usar círculo de proteção nos primeiros dias, cama limpa e seca, ventilação adequada sem correntes de ar diretas e densidade adequada (30-40 pintinhos/m² inicial).',
    'Desenvolvimento dos pintinhos: acompanhar o crescimento corporal, formação de penas, ganho de peso semanal e uniformidade do lote.',
    'Avaliação do lote: monitorar mortalidade (<2% na primeira semana ideal), consumo de ração, peso médio, uniformidade e comportamento das aves.',
    'Vacinação e sanidade: seguir o calendário de vacinação recomendado, manter limpeza regular e medidas de biosseguridade para prevenção de doenças.'
  ],
  importantParameters: [
    {
      name: 'Temperatura - 1ª semana',
      unit: '°C',
      idealValue: '32 a 35',
      minValue: '30',
      maxValue: '37',
      description: 'Temperatura ideal na área dos pintinhos na primeira semana.'
    },
    {
      name: 'Temperatura - 2ª semana',
      unit: '°C',
      idealValue: '29 a 32',
      minValue: '27',
      maxValue: '34',
      description: 'Temperatura recomendada na segunda semana.'
    },
    {
      name: 'Temperatura - 3ª semana',
      unit: '°C',
      idealValue: '26 a 29',
      minValue: '24',
      maxValue: '31',
      description: 'Temperatura recomendada na terceira semana.'
    },
    {
      name: 'Temperatura - 4ª semana',
      unit: '°C',
      idealValue: '23 a 26',
      minValue: '21',
      maxValue: '28',
      description: 'Temperatura recomendada na quarta semana.'
    },
    {
      name: 'Temperatura - 5ª a 6ª semana',
      unit: '°C',
      idealValue: '20 a 23',
      minValue: '18',
      maxValue: '25',
      description: 'Temperatura recomendada na quinta e sexta semana.'
    },
    {
      name: 'Proteína na ração inicial',
      unit: '%',
      idealValue: '18 a 22',
      minValue: '17',
      maxValue: '23',
      description: 'Teor de proteína ideal na ração inicial de cria.'
    },
    {
      name: 'Peso aos 7 dias',
      unit: 'g',
      idealValue: '100 a 120',
      minValue: '80',
      maxValue: '140',
      description: 'Peso médio esperado aos 7 dias de idade.'
    },
    {
      name: 'Peso aos 42 dias (6 semanas)',
      unit: 'g',
      idealValue: '400 a 500',
      minValue: '350',
      maxValue: '550',
      description: 'Peso médio esperado ao final da fase de cria (6 semanas).'
    },
    {
      name: 'Mortalidade na 1ª semana',
      unit: '%',
      idealValue: '<2',
      minValue: '0',
      maxValue: '3',
      description: 'Mortalidade máxima aceitável na primeira semana.'
    },
    {
      name: 'Mortalidade total na cria',
      unit: '%',
      idealValue: '<5',
      minValue: '0',
      maxValue: '8',
      description: 'Mortalidade total máxima aceitável na fase de cria (0-6 semanas).'
    },
    {
      name: 'Densidade inicial',
      unit: 'pintinhos/m²',
      idealValue: '30 a 40',
      minValue: '25',
      maxValue: '45',
      description: 'Densidade ideal de lotação nos primeiros dias.'
    },
    {
      name: 'Densidade aos 42 dias',
      unit: 'aves/m²',
      idealValue: '15 a 20',
      minValue: '12',
      maxValue: '25',
      description: 'Densidade ideal ao final da fase de cria.'
    }
  ],
  bestPractices: [
    'Preparar o galpão 24-48h antes da chegada dos pintinhos.',
    'Usar círculo de proteção nos primeiros 7-10 dias.',
    'Manter temperatura adequada, usando o comportamento das aves como guia.',
    'Fornecer água fresca e limpa à vontade 24h/dia.',
    'Usar ração inicial de alta qualidade e balanceada.',
    'Manter cama limpa e seca o tempo todo.',
    'Garantir ventilação sem correntes de ar diretas.',
    'Seguir rigorosamente o calendário de vacinação.',
    'Acompanhar o peso semanal e a uniformidade do lote.',
    'Isolar pintinhos doentes ou fracos para tratamento individual.',
    'Registrar tudo: mortalidade, consumo, peso, vacinação.',
    'Evitar entrada de pessoas não autorizadas na área de cria.'
  ],
  commonProblems: [
    {
      problem: 'Pintinhos amontoados',
      possibleCauses: [
        'Temperatura muito baixa',
        'Corrente de vento direta',
        'Distribuição de calor inadequada'
      ],
      recommendedSolutions: [
        'Ajustar o aquecimento para aumentar a temperatura',
        'Melhorar a proteção contra correntes de vento',
        'Verificar a distribuição do calor no galpão'
      ]
    },
    {
      problem: 'Diarreia',
      possibleCauses: [
        'Água contaminada',
        'Ração de má qualidade',
        'Estresse',
        'Doença infecciosa'
      ],
      recommendedSolutions: [
        'Trocar a água imediatamente e limpar os bebedouros',
        'Verificar a qualidade e armazenamento da ração',
        'Reduzir fontes de estresse',
        'Consultar veterinário se persistir'
      ]
    },
    {
      problem: 'Baixo consumo de ração',
      possibleCauses: [
        'Temperatura muito alta',
        'Água insuficiente ou de má qualidade',
        'Ração não palatável ou estragada',
        'Doença'
      ],
      recommendedSolutions: [
        'Reduzir a temperatura se estiver muito alta',
        'Garantir água fresca à vontade',
        'Trocar a ração por uma nova',
        'Observar sinais de doença e consultar veterinário'
      ]
    },
    {
      problem: 'Crescimento atrasado',
      possibleCauses: [
        'Nutrição inadequada',
        'Temperatura incorreta',
        'Doença crônica',
        'Parasitas',
        'Densidade excessiva'
      ],
      recommendedSolutions: [
        'Ajustar a ração para atender às necessidades',
        'Corrigir a temperatura do galpão',
        'Consultar veterinário para diagnóstico',
        'Reduzir a densidade de lotação'
      ]
    },
    {
      problem: 'Mortalidade elevada',
      possibleCauses: [
        'Temperatura inadequada',
        'Doenças',
        'Predadores',
        'Amônia alta',
        'Mau manejo no recebimento'
      ],
      recommendedSolutions: [
        'Verificar e corrigir a temperatura imediatamente',
        'Consultar veterinário urgentemente',
        'Melhorar a segurança contra predadores',
        'Aumentar a ventilação para reduzir amônia',
        'Revisar o manejo na chegada dos pintinhos'
      ]
    }
  ],
  commonMistakes: [
    'Não preparar o galpão antes da chegada dos pintinhos',
    'Manter temperatura muito baixa ou muito alta',
    'Não usar círculo de proteção',
    'Fornecer ração de baixa qualidade',
    'Negligenciar a limpeza da água e bebedouros',
    'Não monitorar a temperatura regularmente',
    'Deixar correntes de ar diretas nas aves',
    'Não seguir o calendário de vacinação',
    'Manter cama úmida e suja',
    'Lotar excessivamente o galpão',
    'Não pesar as aves regularmente',
    'Isolar pintinhos fracos ou doentes'
  ],
  managementChecklist: [
    { item: 'Conferir temperatura do galpão', frequency: '3-4x/dia', responsible: 'Produtor', critical: true },
    { item: 'Conferir água fresca à vontade', frequency: '2x/dia', responsible: 'Produtor', critical: true },
    { item: 'Conferir ração disponível', frequency: '2x/dia', responsible: 'Produtor', critical: true },
    { item: 'Observar comportamento dos pintinhos', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Avaliar mortalidade diária', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Limpar equipamentos (bebedouros, comedouros)', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Verificar condição da cama', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Registrar informações do lote', frequency: 'Diário', responsible: 'Produtor', critical: false },
    { item: 'Pesar amostra do lote', frequency: 'Semanal', responsible: 'Produtor', critical: true },
    { item: 'Realizar vacinações no calendário', frequency: 'Conforme calendário', responsible: 'Produtor/Veterinário', critical: true }
  ],
  intelligentRules: [
    {
      rule: 'Se idade <= 7 dias e temperatura abaixo do recomendado, alertar risco de baixa sobrevivência',
      condition: 'Idade <= 7 dias E temperatura < recomendado',
      action: '1. Aumentar a temperatura imediatamente para 32-35°C\n2. Verificar distribuição do calor\n3. Isolar pintinhos fracos se necessário',
      priority: 'alta'
    },
    {
      rule: 'Se consumo de ração abaixo do esperado, solicitar verificação de água, temperatura e qualidade da ração',
      condition: 'Consumo de ração < esperado',
      action: '1. Verificar disponibilidade e qualidade da água\n2. Verificar temperatura do galpão\n3. Verificar qualidade e palatabilidade da ração\n4. Observar sinais de doença',
      priority: 'alta'
    },
    {
      rule: 'Se mortalidade acima do padrão, orientar avaliação das condições ambientais e sanitárias',
      condition: 'Mortalidade > padrão',
      action: '1. Verificar temperatura e ventilação\n2. Inspecionar qualidade da água e ração\n3. Observar sinais de doença no lote\n4. Consultar veterinário urgentemente',
      priority: 'alta'
    },
    {
      rule: 'Se pintinhos amontoados, verificar temperatura e correntes de vento',
      condition: 'Pintinhos amontoados',
      action: '1. Aumentar temperatura se estiver baixa\n2. Verificar e bloquear correntes de vento',
      priority: 'alta'
    },
    {
      rule: 'Se cama úmida, aumentar ventilação e trocar cama molhada',
      condition: 'Cama úmida',
      action: '1. Aumentar ventilação (sem correntes de ar)\n2. Trocar a parte molhada da cama',
      priority: 'média'
    }
  ],
  technicalSources: [
    'AMARAL, Edilson Sousa do. Galinhas poedeiras: criação em semiconfinamento. 2ª edição. Brasília: EMATER-DF, 2009.',
    'EMBRAPA Suínos e Aves. Manejo de Pintinhos de Postura. Circular Técnica, 2012.',
    'EMBRAPA Meio Norte. Criação de Galinhas Caipiras para Produção de Ovos. 2018.',
    'Manual de Manejo de Pintinhos de Postura. Associação Brasileira de Avicultura (ABA), 2019.',
    'LOPES, D. C. et al. Nutrição e Manejo de Aves de Postura. Editora UFV, 2019.',
    'MACIEL, R. P. et al. Produção Alternativa de Aves. Editora UFV, 2020.'
  ]
};
