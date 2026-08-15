import { KnowledgeModule } from '@/types';

export const escolhaDaLinhagem: KnowledgeModule = {
  id: 'escolha-da-linhagem',
  title: 'Escolha da Linhagem para Galinhas de Postura Caipira',
  category: 'produção',
  summary: 'Aprenda a escolher a linhagem ideal para sua granja, considerando desempenho, adaptação, rusticidade e rentabilidade.',
  objective: 'Orientar o produtor sobre os conceitos de linhagens, características desejáveis, fatores de escolha, avaliação de fornecedores e relação entre genética e produção de ovos.',
  technicalContent: [
    'A escolha da linhagem é fundamental para o sucesso da produção de ovos caipiros, pois a genética influencia diretamente o desempenho, a adaptação e a rentabilidade.',
    'Conceitos básicos: Raça é um grupo de aves com características morfológicas e fisiológicas uniformes; Linhagem é uma subpopulação de uma raça selecionada para características específicas; Híbrido é o cruzamento entre linhagens diferentes, visando heterose (vigor híbrido).',
    'As características desejáveis em aves para postura caipira são: boa produção de ovos (250-300 ovos/ano ideal), rusticidade, resistência ao ambiente, adaptação ao clima brasileiro, boa conversão alimentar, longevidade produtiva e comportamento adequado para sistema livre (forrageamento, sociabilidade).',
    'Antes de comprar as aves, é importante avaliar: objetivo da criação (produção comercial, consumo familiar, venda de ovos diferenciados), quantidade de aves, clima da região, disponibilidade de alimentação, sistema de manejo (intensivo, semi-intensivo, extensivo) e mercado consumidor.',
    'Tipos de aves utilizadas em postura caipira: linhagens comerciais caipiras (desenvolvidas para alta produção + rusticidade), aves rústicas selecionadas e raças tradicionais (Caipira da Paraíba, Pedrês, Pescoço Pelado, etc.). A escolha deve priorizar desempenho e adaptação, não apenas aparência.',
    'Avaliação do fornecedor: verificar procedência das aves, qualidade dos pintinhos (origem de matrizes saudáveis), vacinação (programa de vacinação inicial), histórico sanitário da granja de origem e uniformidade do lote.',
    'Características de um lote saudável na chegada: pintinhos ativos e alertas, boa aparência (plumagem uniforme, olhos brilhantes, bicos e pernas normais), tamanho uniforme e ausência de sinais de doença (diarreia, secreções, apatia).',
    'Relação entre genética e produção: a linhagem influencia a idade de início da postura (18-22 semanas), pico produtivo (80-90% de postura), tamanho dos ovos (55-65g ideal), persistência de produção (manutenção do pico por mais tempo) e consumo de ração (100-130g/ave/dia).',
    'Escolha errada da linhagem pode causar: baixa produção, aves pouco adaptadas ao clima ou sistema, excesso de consumo de ração, dificuldade de manejo e baixa rentabilidade.'
  ],
  importantParameters: [
    {
      name: 'Idade de início da postura',
      unit: 'semanas',
      idealValue: '18 a 22',
      minValue: '17',
      maxValue: '24',
      description: 'Idade ideal para as aves começarem a botar ovos.'
    },
    {
      name: 'Pico de produção esperado',
      unit: '%',
      idealValue: '80 a 90',
      minValue: '70',
      maxValue: '95',
      description: 'Percentual de postura máxima esperado no pico da produção.'
    },
    {
      name: 'Produção anual de ovos',
      unit: 'ovos/ave/ano',
      idealValue: '250 a 300',
      minValue: '180',
      maxValue: '320',
      description: 'Número total de ovos esperados por ave em um ciclo produtivo.'
    },
    {
      name: 'Peso médio dos ovos',
      unit: 'g',
      idealValue: '55 a 65',
      minValue: '50',
      maxValue: '70',
      description: 'Peso ideal dos ovos para comercialização.'
    },
    {
      name: 'Consumo de ração por ave/dia',
      unit: 'g/ave/dia',
      idealValue: '100 a 130',
      minValue: '90',
      maxValue: '140',
      description: 'Consumo diário esperado de ração por ave adulta.'
    },
    {
      name: 'Conversão alimentar',
      unit: 'kg ração/kg ovos',
      idealValue: '2,2 a 2,8',
      minValue: '2,0',
      maxValue: '3,2',
      description: 'Quantidade de ração necessária para produzir 1 kg de ovos.'
    },
    {
      name: 'Peso da ave na maturidade',
      unit: 'kg',
      idealValue: '1,6 a 2,0',
      minValue: '1,4',
      maxValue: '2,4',
      description: 'Peso ideal da ave adulta de postura caipira.'
    },
    {
      name: 'Longevidade produtiva',
      unit: 'meses',
      idealValue: '12 a 18',
      minValue: '10',
      maxValue: '24',
      description: 'Tempo ideal de produção antes do descarte ou renovação do lote.'
    }
  ],
  bestPractices: [
    'Defina claramente o objetivo da sua criação antes de escolher a linhagem.',
    'Priorize linhagens adaptadas ao clima da sua região.',
    'Pesquise e compare diferentes fornecedores.',
    'Solicite informações sobre o histórico sanitário das aves.',
    'Escolha lotes uniformes em tamanho e desenvolvimento.',
    'Garanta que as aves recebam vacinação inicial pelo fornecedor.',
    'Leve em conta a disponibilidade de alimentação na sua região.',
    'Avalie o desempenho real de linhagens na sua região (converse com outros produtores).',
    'Não escolha apenas por aparência; priorize desempenho e adaptação.',
    'Planeje a renovação do lote de forma periódica.'
  ],
  commonProblems: [
    {
      problem: 'Baixa produção de ovos',
      possibleCauses: [
        'Linhagem não especializada em postura',
        'Aves não adaptadas ao clima',
        'Alimentação inadequada',
        'Manejo deficiente'
      ],
      recommendedSolutions: [
        'Escolha linhagens selecionadas para postura',
        'Trocar por linhagem adaptada à região',
        'Ajustar formulação da ração',
        'Melhorar o manejo geral'
      ]
    },
    {
      problem: 'Alto consumo de ração',
      possibleCauses: [
        'Linhagem com baixa conversão alimentar',
        'Aves muito grandes',
        'Temperatura muito baixa',
        'Ração com baixo teor de nutrientes'
      ],
      recommendedSolutions: [
        'Escolha linhagens com melhor conversão alimentar',
        'Usar linhagens de tamanho moderado',
        'Melhorar proteção contra frio',
        'Ajustar a ração para atender às necessidades'
      ]
    },
    {
      problem: 'Alta mortalidade no início',
      possibleCauses: [
        'Pintinhos de má qualidade',
        'Linhagem não resistente a doenças locais',
        'Mau manejo na recepção',
        'Fornecedor sem histórico sanitário'
      ],
      recommendedSolutions: [
        'Comprar de fornecedores confiáveis',
        'Escolher linhagens resistentes e adaptadas',
        'Melhorar manejo na recepção dos pintinhos',
        'Solicitar histórico sanitário ao fornecedor'
      ]
    },
    {
      problem: 'Início da postura muito atrasado',
      possibleCauses: [
        'Linhagem de desenvolvimento tardio',
        'Alimentação inadequada na fase de recria',
        'Iluminação insuficiente',
        'Estresse excessivo'
      ],
      recommendedSolutions: [
        'Escolha linhagens com início precoce da postura',
        'Garantir nutrição adequada na recria',
        'Aumentar o período de iluminação',
        'Reduzir fontes de estresse'
      ]
    }
  ],
  commonMistakes: [
    'Escolher linhagem apenas por preço, sem verificar qualidade',
    'Comprar de fornecedores sem histórico sanitário',
    'Não considerar o clima da região na escolha',
    'Escolher linhagem por aparência, não por desempenho',
    'Adquirir pintinhos não vacinados',
    'Não planejar a renovação do lote',
    'Misturar diferentes linhagens no mesmo galpão sem planejamento',
    'Ignorar a conversão alimentar na escolha da linhagem',
    'Não conversar com outros produtores sobre a linhagem',
    'Não ter objetivo definido para a criação'
  ],
  managementChecklist: [
    { item: 'Definir objetivo da criação', frequency: 'Antes de comprar', responsible: 'Produtor', critical: true },
    { item: 'Avaliar fornecedores de pintinhos', frequency: 'Antes de comprar', responsible: 'Produtor', critical: true },
    { item: 'Conferir histórico sanitário do fornecedor', frequency: 'Antes de comprar', responsible: 'Produtor', critical: true },
    { item: 'Conhecer características da linhagem', frequency: 'Antes de comprar', responsible: 'Produtor', critical: true },
    { item: 'Avaliar adaptação à região', frequency: 'Antes de comprar', responsible: 'Produtor', critical: true },
    { item: 'Planejar alimentação e instalações', frequency: 'Antes de comprar', responsible: 'Produtor', critical: true },
    { item: 'Verificar vacinação inicial', frequency: 'Na recepção dos pintinhos', responsible: 'Produtor', critical: true },
    { item: 'Avaliar uniformidade do lote', frequency: 'Na recepção dos pintinhos', responsible: 'Produtor', critical: true },
    { item: 'Monitorar desempenho produtivo', frequency: 'Mensal', responsible: 'Produtor', critical: true },
    { item: 'Planejar renovação do lote', frequency: 'Anual', responsible: 'Produtor', critical: false }
  ],
  intelligentRules: [
    {
      rule: 'Se produtor deseja alta produção comercial de ovos, recomendar avaliar linhagens especializadas em postura',
      condition: 'Objetivo: alta produção comercial de ovos',
      action: '1. Considerar linhagens comerciais caipiras selecionadas para postura\n2. Verificar histórico de desempenho na região',
      priority: 'alta'
    },
    {
      rule: 'Se sistema possui poucos recursos e manejo familiar, priorizar aves rústicas e adaptadas',
      condition: 'Manejo familiar E recursos limitados',
      action: '1. Priorizar raças tradicionais ou aves rústicas selecionadas\n2. Escolher linhagens com baixa exigência nutricional',
      priority: 'alta'
    },
    {
      rule: 'Se região possui clima quente, considerar linhagens com melhor adaptação ao calor',
      condition: 'Clima quente',
      action: '1. Escolher linhagens adaptadas a altas temperaturas\n2. Priorizar aves de plumagem mais clara ou pescoço pelado',
      priority: 'alta'
    },
    {
      rule: 'Se mercado valoriza ovos grandes, verificar linhagens com potencial para ovos de maior tamanho',
      condition: 'Mercado valoriza ovos grandes',
      action: '1. Escolher linhagens que produzam ovos com 60g+',
      priority: 'média'
    },
    {
      rule: 'Se alimentação é um custo alto, priorizar linhagens com melhor conversão alimentar',
      condition: 'Custo de ração elevado',
      action: '1. Escolher linhagens com conversão alimentar < 2,8',
      priority: 'média'
    }
  ],
  technicalSources: [
    'AMARAL, Edilson Sousa do. Galinhas poedeiras: criação em semiconfinamento. 2ª edição. Brasília: EMATER-DF, 2009.',
    'EMBRAPA Suínos e Aves. Sistema de Produção de Ovos Caipira. Circular Técnica nº 56. 2010.',
    'EMBRAPA Meio Norte. Criação de Galinhas Caipiras para Produção de Ovos. 2018.',
    'Manual de Genética Avícola. Associação Brasileira de Avicultura (ABA), 2020.',
    'MACIEL, R. P. et al. Melhoramento Genético de Aves para Produção Alternativa. Editora UFV, 2019.',
    'LOPES, D. C. et al. Nutrição e Manejo de Aves de Postura. Editora UFV, 2019.'
  ]
};
