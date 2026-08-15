import { KnowledgeModule } from '@/types';

export const instalacoes: KnowledgeModule = {
  id: 'instalacoes',
  title: 'Instalações para Galinhas de Postura Caipira',
  category: 'instalações',
  summary: 'Aprenda a planejar e construir instalações adequadas para galinhas de postura caipira, garantindo conforto, segurança, higiene e produtividade.',
  objective: 'Orientar o produtor na escolha do local, dimensionamento, construção e manejo das instalações (galpão e piquetes) para criação de galinhas de postura caipira.',
  technicalContent: [
    'As instalações são fundamentais para o sucesso da criação de galinhas de postura caipira, pois influenciam diretamente na saúde, bem-estar e produtividade das aves.',
    'Os principais objetivos de um galinheiro adequado são: proteção contra predadores, conforto térmico, segurança, higiene, facilidade de manejo e redução de estresse nas aves.',
    'Para a localização da instalação, é importante escolher um terreno com boa drenagem (para evitar acumulação de água), orientação solar favorável (entrada de sol pela manhã, sombra à tarde), boa ventilação natural e proteção contra ventos fortes. Deve estar próximo de fontes de água e área para armazenamento de ração.',
    'A estrutura do galpão deve ter piso impermeável (cimento ou pedra) para facilitar a limpeza, paredes resistentes (madeira, bloco ou pallets), cobertura que proteja do sol e chuva, sistema de ventilação adequado (janelas laterais ou aberturas superiores), iluminação natural + artificial (totalizando 14-16h/dia), portas de fácil acesso e telas de proteção contra predadores e insetos.',
    'Equipamentos internos essenciais: comedouros (suficientes para todas as aves), bebedouros (água limpa à vontade 24h/dia), ninhos (1 para cada 4-5 aves, localizados em local escuro e tranquilo), poleiros (para as aves dormirem) e área de descanso com cama seca.',
    'O dimensionamento do galpão deve levar em conta a quantidade de aves, idade, sistema de criação e acesso aos piquetes. Recomenda-se 4-6 aves/m² no galpão e 3-10 m²/ave no piquete.',
    'A área externa (piquete) é muito importante no sistema caipira, pois permite forrageamento. Deve ser dividida em áreas para rotação, ter sombra (árvores ou telhados artificiais), vegetação adequada (gramíneas, leguminosas) e cercas resistentes.',
    'A cama do galpão serve para absorver umidade, manter o conforto e facilitar limpeza. Tipos de materiais: maravalha, palha de arroz, palha de milho, casca de café, casca de pinhão. É fundamental manter a cama sempre seca; sinais de problemas: cama úmida, odor forte, presença de moscas ou fungos.',
    'Instalações inadequadas podem causar queda de produção, aumento de doenças, estresse térmico, ovos sujos ou quebrados e aumento da mortalidade.'
  ],
  importantParameters: [
    {
      name: 'Densidade no galpão (postura)',
      unit: 'aves/m²',
      idealValue: '4 a 6',
      minValue: '3',
      maxValue: '7',
      description: 'Número máximo de aves adultas de postura por metro quadrado no galpão.'
    },
    {
      name: 'Área de piquete por ave',
      unit: 'm²/ave',
      idealValue: '3 a 10',
      minValue: '3',
      maxValue: '20',
      description: 'Área mínima de pastagem por ave para forrageamento no sistema caipira.'
    },
    {
      name: 'Ninhos por ave',
      unit: 'ninhos/aves',
      idealValue: '1 para 4-5',
      minValue: '1 para 4',
      maxValue: '1 para 6',
      description: 'Quantidade de ninhos necessária para evitar ovos fora do ninho.'
    },
    {
      name: 'Espaço de comedouro por ave',
      unit: 'cm/ave',
      idealValue: '10 a 15',
      minValue: '8',
      maxValue: '20',
      description: 'Espaço linear no comedouro para cada ave adulta.'
    },
    {
      name: 'Espaço de bebedouro por ave',
      unit: 'cm/ave',
      idealValue: '2,5 a 5',
      minValue: '2',
      maxValue: '7',
      description: 'Espaço linear no bebedouro para cada ave adulta.'
    },
    {
      name: 'Altura dos poleiros',
      unit: 'cm',
      idealValue: '60 a 80',
      minValue: '40',
      maxValue: '100',
      description: 'Altura ideal dos poleiros do chão para as aves dormirem.'
    },
    {
      name: 'Iluminação diária total',
      unit: 'horas/dia',
      idealValue: '14 a 16',
      minValue: '12',
      maxValue: '17',
      description: 'Total de horas de luz (natural + artificial) para manter a postura.'
    },
    {
      name: 'Temperatura ideal no galpão',
      unit: '°C',
      idealValue: '18 a 24',
      minValue: '15',
      maxValue: '30',
      description: 'Faixa de temperatura ideal para galinhas de postura adultas.'
    },
    {
      name: 'Umidade relativa ideal',
      unit: '%',
      idealValue: '50 a 70',
      minValue: '40',
      maxValue: '80',
      description: 'Faixa de umidade relativa recomendada no galpão.'
    }
  ],
  bestPractices: [
    'Planeje as instalações antes de adquirir as aves.',
    'Escolha terreno elevado com boa drenagem.',
    'Orientar o galpão de leste a oeste para aproveitar sol da manhã.',
    'Construa cercas resistentes contra predadores (cães, gatos, raposas).',
    'Use tela anti-inseto nas aberturas para controlar moscas e mosquitos.',
    'Garanta ventilação natural sem correntes de ar diretas nas aves.',
    'Coloque os ninhos em local escuro e tranquilo, longe da entrada.',
    'Forneça sombra nos piquetes (árvores ou estruturas artificiais).',
    'Rode os piquetes para permitir recuperação da vegetação.',
    'Mantenha a cama sempre seca e limpa.',
    'Instale iluminação artificial para complementar a luz natural no inverno.',
    'Armazene ração e equipamentos em local seco e protegido.'
  ],
  commonProblems: [
    {
      problem: 'Ovos sujos ou quebrados',
      possibleCauses: [
        'Ninhos insuficientes ou mal localizados',
        'Ninhos sem cama limpa',
        'Cama do galpão úmida ou suja',
        'Poucos poleiros ou poleiros mal posicionados'
      ],
      recommendedSolutions: [
        'Adicionar mais ninhos (1 para 4-5 aves)',
        'Colocar ninhos em local escuro e tranquilo',
        'Limpar e trocar a cama dos ninhos regularmente',
        'Manter a cama do galpão sempre seca',
        'Instalar poleiros em altura adequada'
      ]
    },
    {
      problem: 'Estresse térmico (calor excessivo)',
      possibleCauses: [
        'Pouca ventilação no galpão',
        'Falta de sombra no galpão e piquetes',
        'Pouca água à disposição',
        'Temperatura ambiente muito alta'
      ],
      recommendedSolutions: [
        'Aumentar a ventilação do galpão',
        'Fornecer sombra nos piquetes',
        'Garantir água fresca à vontade 24h/dia',
        'Molhar o piso do galpão nos dias muito quentes',
        'Reduzir a densidade de aves no verão'
      ]
    },
    {
      problem: 'Ataque de predadores',
      possibleCauses: [
        'Cercas inadequadas ou com buracos',
        'Portas abertas à noite',
        'Ausência de telas nas aberturas',
        'Localização da granja próxima de matas'
      ],
      recommendedSolutions: [
        'Consertar buracos nas cercas',
        'Usar tela de arame fino (galvanizado) de pequeno espaçamento',
        'Fechar portas e janelas do galpão à noite',
        'Instale telas anti-predador em todas as aberturas',
        'Considere usar cão de guarda (treinado) para proteção'
      ]
    },
    {
      problem: 'Cama úmida e com odor forte',
      possibleCauses: [
        'Pouca ventilação',
        'Bebedouros vazando',
        'Drenagem inadequada do galpão',
        'Troca de cama irregular'
      ],
      recommendedSolutions: [
        'Melhorar a ventilação do galpão',
        'Consertar vazamentos nos bebedouros',
        'Garantir boa drenagem no terreno',
        'Trocar ou repor a cama regularmente',
        'Adicionar cal virgem ou calcário para controlar umidade (opcional)'
      ]
    }
  ],
  commonMistakes: [
    'Construir o galpão em terreno baixo ou com má drenagem',
    'Não planejar ventilação adequada',
    'Usar poucos ninhos ou localizá-los em local iluminado',
    'Não instalar telas anti-predador nas aberturas',
    'Alocar pouca área no piquete por ave',
    'Não fazer rotação dos piquetes',
    'Não fornecer sombra nos piquetes',
    'Manter bebedouros com vazamentos',
    'Negligenciar a limpeza regular da cama',
    'Dimensionar o galpão muito pequeno'
  ],
  managementChecklist: [
    { item: 'Verificar limpeza do galpão e piquetes', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Verificar funcionamento dos bebedouros', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Verificar funcionamento dos comedouros', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Verificar ventilação do galpão', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Verificar segurança (cercas, portas, telas)', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Verificar condições dos ninhos', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Limpar ninhos e trocar cama', frequency: '2 vezes por semana', responsible: 'Produtor', critical: false },
    { item: 'Repor cama do galpão quando necessário', frequency: 'Semanal', responsible: 'Produtor', critical: true },
    { item: 'Rotação de piquetes', frequency: 'A cada 15-30 dias', responsible: 'Produtor', critical: false },
    { item: 'Verificar iluminação (natural + artificial)', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Limpeza e desinfecção completa do galpão', frequency: 'Entre lotes', responsible: 'Produtor', critical: true }
  ],
  intelligentRules: [
    {
      rule: 'Se temperatura > 30°C e ventilação baixa, alertar sobre risco de estresse térmico',
      condition: 'Temperatura > 30°C E ventilação inadequada',
      action: '1. Aumentar ventilação\n2. Fornecer sombra extra\n3. Garantir água fresca constantemente',
      priority: 'alta'
    },
    {
      rule: 'Se muitos ovos fora do ninho, verificar quantidade e localização dos ninhos',
      condition: '> 10% dos ovos fora do ninho',
      action: '1. Verificar número de ninhos (1/4-5 aves)\n2. Verificar localização dos ninhos (escuro/tranquilo)\n3. Limpar e trocar a cama dos ninhos',
      priority: 'alta'
    },
    {
      rule: 'Se cama úmida ou com odor forte, verificar ventilação e bebedouros',
      condition: 'Cama úmida OU odor forte',
      action: '1. Verificar vazamentos nos bebedouros\n2. Aumentar ventilação\n3. Trocar/repor cama',
      priority: 'média'
    },
    {
      rule: 'Se umidade relativa > 80%, aumentar ventilação',
      condition: 'Umidade relativa > 80%',
      action: '1. Abrir janelas/aberturas\n2. Verificar drenagem do galpão',
      priority: 'média'
    },
    {
      rule: 'Se luz natural < 12h/dia, ligar iluminação artificial',
      condition: 'Luz natural < 12h/dia',
      action: '1. Complementar com luz artificial para total de 14-16h/dia',
      priority: 'média'
    }
  ],
  technicalSources: [
    'AMARAL, Edilson Sousa do. Galinhas poedeiras: criação em semiconfinamento. 2ª edição. Brasília: EMATER-DF, 2009.',
    'EMBRAPA Suínos e Aves. Sistema de Produção de Ovos Caipira. Circular Técnica nº 56. 2010.',
    'EMBRAPA Meio Norte. Criação de Galinhas Caipiras para Produção de Ovos. 2018.',
    'Manual de Instalações Avícolas. Associação Brasileira de Avicultura (ABA), 2019.',
    'CAMPOS, D. M. et al. Instalações para Avicultura Alternativa. Editora UFV, 2020.',
    'LOPES, D. C. et al. Nutrição e Manejo de Aves de Postura. Editora UFV, 2019.'
  ]
};
