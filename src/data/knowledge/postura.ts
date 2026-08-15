import { KnowledgeModule } from '@/types';

export const postura: KnowledgeModule = {
  id: 'postura',
  title: 'Postura de Galinhas de Postura Caipira (23 a 72+ semanas)',
  category: 'produção',
  summary: 'A fase de postura é o período produtivo principal, onde as aves produzem ovos comercialmente. Um manejo adequado garante alta produtividade, qualidade dos ovos, saúde das aves e rentabilidade da granja. Esta fase geralmente inicia entre 22-24 semanas e pode durar até 72 semanas ou mais, dependendo do desempenho.',
  objective: 'Orientar o produtor sobre todos os aspectos do manejo da fase de postura: alimentação, água, instalações, ninhos, coleta de ovos, qualidade dos ovos, sanidade, controle de produção e registros.',
  technicalContent: [
    'A fase de postura é o período produtivo da granja, onde as aves começam a botar ovos regularmente. O objetivo é maximizar a produção de ovos de alta qualidade, mantendo a saúde e o bem-estar das aves.',
    'Durante a postura, as aves têm exigências nutricionais elevadas para manter a produção e a saúde. É essencial fornecer ração balanceada, água limpa à vontade e ambiente adequado.',
    'O pico de produção geralmente ocorre entre 28-35 semanas de idade, dependendo da linhagem, podendo atingir até 90% de postura para linhagens caipiras bem manejadas.',
    'Após o pico, a produção diminui gradualmente, mas com manejo adequado, é possível manter boa produtividade até 72 semanas ou mais.',
    '# 1. Alimentação na postura: A ração de postura deve fornecer nutrientes adequados para: produção de ovos, manutenção corporal, saúde e qualidade da casca. Principais nutrientes: proteína (16-18%), energia, cálcio (3.5-4.5%), fósforo, vitaminas e minerais. O cálcio é fundamental para a formação da casca dos ovos. A ração deve ser fornecida à vontade ou em horários regulares, evitando desperdício.',
    '# 2. Manejo da água: Água limpa e fresca é essencial, pois a ave consome aproximadamente 2-3 vezes mais água que ração. A falta de água reduz rapidamente a produção. Deve-se limpar os bebedouros regularmente e monitorar o consumo diário.',
    '# 3. Instalações e ambiente: As instalações devem proporcionar: conforto térmico, boa ventilação (sem correntes de ar), proteção contra predadores e chuva, espaço adequado. No sistema caipira, acesso ao piquete é importante para o bem-estar e comportamento natural.',
    '# 3.1 Programa de luz artificial: A luz é fundamental para estimular a postura, pois influencia a liberação de hormônios reprodutivos. Recomendações:',
    '  - **Período total de luz**: 14 a 16 horas por dia (luz natural + artificial) durante a fase de postura.',
    '  - **Intensidade da luz**: 10 a 20 lux no nível das aves (equivalente a uma lâmpada de 40W incandescente a 2 metros de distância, ou LED equivalente).',
    '  - **Distribuição uniforme**: As lâmpadas devem ser distribuídas de forma a iluminar todo o galpão uniformemente, evitando áreas escuras.',
    '  - **Horário fixo**: Manter horários regulares para ligar e desligar a luz artificial, para não causar estresse nas aves (ex: ligar às 5h e desligar às 21h, totalizando 16h de luz).',
    '  - **Aumento gradual**: Durante a fase de pré-postura (18-22 semanas), aumentar a duração da luz gradualmente de 10-12h para 14-16h, para estimular o início da postura.',
    '  - **Tipo de lâmpada**: Preferir lâmpadas de luz amarela ou branca quente, que são mais eficazes na estimulação da postura do que luzes frias (azul/verde).',
    '# 4. Manejo dos ninhos: Os ninhos devem ser: limpos, confortáveis, localizados em área tranquila e protegida. Recomenda-se 1 ninho para cada 4-5 aves. A limpeza regular dos ninhos evita ovos sujos e problemas sanitários.',
    '# 5. Coleta de ovos: A coleta deve ser realizada regularmente (2-3 vezes por dia) para: evitar ovos sujos, reduzir quebras, manter qualidade. Os ovos devem ser manuseados com cuidado e armazenados em local adequado.',
    '# 6. Qualidade dos ovos: A qualidade dos ovos depende de: nutrição, saúde das aves, manejo dos ninhos, coleta e armazenamento. Principais parâmetros de qualidade: tamanho, cor da casca, espessura da casca, qualidade do albumen e gema.',
    '# 7. Manejo sanitário: A prevenção de doenças é fundamental. Medidas importantes: vacinação, controle de parasitas, limpeza regular das instalações, biossegurança, observação diária das aves. Qualquer sinal de doença deve ser investigado rapidamente.',
    '# 8. Controle de produção: É essencial registrar: número de ovos produzidos por dia, mortalidade, consumo de ração, peso dos ovos, qualidade dos ovos. Estes registros ajudam a monitorar o desempenho do lote e tomar decisões.',
    '# 9. Bem-estar animal: No sistema caipira, o acesso ao piquete, espaço adequado, ambiente confortável e manejo tranquilo são importantes para o bem-estar das aves e também influenciam a produtividade.'
  ],
  importantParameters: [
    {
      name: 'Idade da fase',
      unit: 'semanas',
      idealValue: '23 a 72+',
      minValue: '22',
      maxValue: '100',
      description: 'Período produtivo principal das aves.'
    },
    {
      name: 'Pico de produção',
      unit: '% de postura',
      idealValue: '80-90',
      minValue: '70',
      maxValue: '95',
      description: 'Porcentagem máxima de postura esperada (varia por linhagem).'
    },
    {
      name: 'Proteína na ração de postura',
      unit: '%',
      idealValue: '16 a 18',
      minValue: '15',
      maxValue: '19',
      description: 'Teor de proteína ideal para produção de ovos.'
    },
    {
      name: 'Cálcio na ração de postura',
      unit: '%',
      idealValue: '3.5 a 4.5',
      minValue: '3.2',
      maxValue: '4.8',
      description: 'Necessário para formação da casca dos ovos.'
    },
    {
      name: 'Peso médio dos ovos',
      unit: 'g',
      idealValue: '50 a 60',
      minValue: '45',
      maxValue: '65',
      description: 'Peso médio de ovos de galinhas caipiras (varia por linhagem).'
    },
    {
      name: 'Densidade no galpão',
      unit: 'aves/m²',
      idealValue: '6 a 8',
      minValue: '5',
      maxValue: '10',
      description: 'Densidade de lotação recomendada para conforto.'
    },
    {
      name: 'Mortalidade mensal aceitável',
      unit: '%',
      idealValue: '<0.8',
      minValue: '0',
      maxValue: '1.2',
      description: 'Mortalidade máxima aceitável por mês durante a postura.'
    },
    {
      name: 'Conversão alimentar',
      unit: 'kg ração/doz ovos',
      idealValue: '1.8 a 2.2',
      minValue: '1.6',
      maxValue: '2.5',
      description: 'Eficiência da utilização da ração para produzir ovos.'
    },
    {
      name: 'Ninhos por ave',
      unit: 'ninhos/aves',
      idealValue: '1 para 4-5',
      minValue: '1 para 4',
      maxValue: '1 para 6',
      description: 'Quantidade ideal para evitar ovos no chão.'
    },
    {
      name: 'Coleta de ovos',
      unit: 'vezes/dia',
      idealValue: '2 a 3',
      minValue: '1',
      maxValue: '4',
      description: 'Frequência de coleta para manter qualidade.'
    }
  ],
  bestPractices: [
    'Fornecer ração de postura balanceada e de alta qualidade.',
    'Garantir água limpa e fresca à vontade 24h/dia.',
    'Manter ninhos limpos e confortáveis.',
    'Coletar ovos regularmente (2-3 vezes por dia).',
    'Manter limpeza regular das instalações.',
    'Seguir programa de vacinação e sanidade.',
    'Monitorar produção, mortalidade e consumo de ração diariamente.',
    'Garantir ventilação adequada sem correntes de ar.',
    'No sistema caipira, proporcionar acesso ao piquete com sombra e vegetação.',
    'Manusear ovos com cuidado para evitar quebras.',
    'Armazenar ovos em local fresco e adequado.',
    'Registrar todos os dados importantes do lote.'
  ],
  commonProblems: [
    {
      problem: 'Queda de produção',
      possibleCauses: [
        'Alimentação inadequada ou falta de ração',
        'Falta ou qualidade ruim da água',
        'Estresse (mudança de ambiente, manejo brusco)',
        'Doenças',
        'Iluminação inadequada (se aplicável)',
        'Temperatura excessiva ou insuficiente',
        'Idade avançada das aves'
      ],
      recommendedSolutions: [
        'Verificar qualidade e disponibilidade da ração',
        'Verificar água (qualidade e disponibilidade)',
        'Avaliar condições ambientais (temperatura, ventilação)',
        'Observar sinais de doença nas aves',
        'Revisar manejo para reduzir estresse',
        'Consultar veterinário se suspeitar de doença'
      ]
    },
    {
      problem: 'Ovos com casca fraca ou quebrados',
      possibleCauses: [
        'Deficiência de cálcio ou fósforo',
        'Deficiência de vitamina D',
        'Alimentação inadequada',
        'Temperatura excessiva',
        'Idade avançada das aves',
        'Coleta ou manejo inadequado dos ovos'
      ],
      recommendedSolutions: [
        'Revisar níveis de cálcio e fósforo na ração',
        'Garantir vitamina D adequada',
        'Melhorar manejo da coleta e armazenamento',
        'Avaliar temperatura do ambiente',
        'Verificar qualidade da ração'
      ]
    },
    {
      problem: 'Muitos ovos no chão',
      possibleCauses: [
        'Falta de ninhos',
        'Ninhos inadequados (localização, conforto)',
        'Densidade excessiva',
        'Ninhos sujos'
      ],
      recommendedSolutions: [
        'Aumentar número de ninhos (1 para 4-5 aves)',
        'Melhorar localização e conforto dos ninhos',
        'Reduzir densidade de lotação',
        'Limpar ninhos regularmente'
      ]
    },
    {
      problem: 'Ovos sujos',
      possibleCauses: [
        'Ninhos sujos',
        'Galpão ou piquete com muita sujeira',
        'Coleta infrequente',
        'Cama úmida ou suja'
      ],
      recommendedSolutions: [
        'Limpar ninhos regularmente',
        'Manter cama limpa e seca',
        'Aumentar frequência de coleta',
        'Melhorar limpeza das instalações'
      ]
    },
    {
      problem: 'Mortalidade elevada',
      possibleCauses: [
        'Doenças',
        'Predadores',
        'Estresse',
        'Alimentação ou água inadequada',
        'Instalações inadequadas'
      ],
      recommendedSolutions: [
        'Isolar aves doentes imediatamente',
        'Consultar veterinário urgentemente',
        'Melhorar segurança contra predadores',
        'Verificar alimentação e água',
        'Avaliar condições das instalações'
      ]
    }
  ],
  commonMistakes: [
    'Fornecer ração inadequada para a fase de postura.',
    'Negligenciar a limpeza dos ninhos.',
    'Coletar ovos poucas vezes por dia.',
    'Não monitorar produção e mortalidade regularmente.',
    'Superlotar o galpão ou piquetes.',
    'Ignorar sinais de doença nas aves.',
    'Não manter água limpa e disponível 24h/dia.',
    'Manusear ovos de forma inadequada.',
    'Não seguir programa de vacinação.',
    'Armazenar ovos em local inadequado.',
    'Não manter registros do lote.'
  ],
  managementChecklist: [
    { item: 'Conferir água limpa e fresca', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Conferir ração disponível e adequada', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Observar comportamento e saúde das aves', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Coletar ovos regularmente', frequency: '2-3x/dia', responsible: 'Produtor', critical: true },
    { item: 'Limpar ninhos', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Registrar produção e mortalidade', frequency: 'Diário', responsible: 'Produtor', critical: true },
    { item: 'Verificar condições das instalações', frequency: 'Diário', responsible: 'Produtor', critical: false },
    { item: 'Limpar bebedouros e comedouros', frequency: '2-3x/semana', responsible: 'Produtor', critical: true },
    { item: 'Avaliar qualidade dos ovos', frequency: 'Semanal', responsible: 'Produtor', critical: true },
    { item: 'Pesar amostra de aves', frequency: 'Mensal', responsible: 'Produtor', critical: false },
    { item: 'Realizar limpeza geral das instalações', frequency: 'Conforme necessidade', responsible: 'Produtor', critical: true }
  ],
  intelligentRules: [
    {
      rule: 'Se queda de produção >5% em 1-2 dias, verificar alimentação, água, ambiente e saúde das aves',
      condition: 'Queda de produção >5% em curto período',
      action: '1. Verificar disponibilidade e qualidade da ração\n2. Verificar disponibilidade e qualidade da água\n3. Avaliar temperatura e ventilação do ambiente\n4. Observar sinais de doença nas aves\n5. Verificar se houve mudança de manejo',
      priority: 'alta'
    },
    {
      rule: 'Se >10% dos ovos com casca fraca ou quebrados, avaliar cálcio, vitamina D e manejo',
      condition: '>10% ovos com problema de casca',
      action: '1. Revisar níveis de cálcio e fósforo na ração\n2. Verificar vitamina D na ração\n3. Melhorar manejo da coleta e armazenamento\n4. Avaliar temperatura do ambiente',
      priority: 'alta'
    },
    {
      rule: 'Se >10% dos ovos no chão, verificar quantidade, localização e limpeza dos ninhos',
      condition: '>10% ovos no chão',
      action: '1. Verificar número de ninhos (1 para 4-5 aves)\n2. Avaliar localização e conforto dos ninhos\n3. Limpar ninhos regularmente\n4. Reduzir densidade se necessário',
      priority: 'alta'
    },
    {
      rule: 'Se mortalidade >1% em uma semana, investigar causas urgentemente',
      condition: 'Mortalidade >1%/semana',
      action: '1. Isolar aves doentes imediatamente\n2. Consultar veterinário urgentemente\n3. Verificar alimentação e água\n4. Melhorar biossegurança\n5. Avaliar condições ambientais',
      priority: 'alta'
    },
    {
      rule: 'Se consumo de água diminuir significativamente, verificar qualidade da água e saúde das aves',
      condition: 'Consumo de água reduzido >10%',
      action: '1. Verificar qualidade e sabor da água\n2. Limpar bebedouros\n3. Observar sinais de doença nas aves\n4. Verificar temperatura do ambiente',
      priority: 'alta'
    }
  ],
  technicalSources: [
    'AMARAL, Edilson Sousa do. Galinhas poedeiras: criação em semiconfinamento. 2ª edição. Brasília: EMATER-DF, 2009.',
    'Embrapa Suínos e Aves — Manejo de aves de postura e produção de ovos.',
    'Embrapa Meio-Norte — Criação de galinhas caipiras para produção de ovos.',
    'Manual de Produção de Ovos Caipiras — Associação Brasileira de Avicultura (ABA).',
    'LOPES, D. C. et al. Nutrição e Manejo de Aves de Postura. Editora UFV, 2019.',
    'MACIEL, R. P. et al. Produção Alternativa de Aves. Editora UFV, 2020.'
  ]
};
