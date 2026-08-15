import { KnowledgeModule } from '@/types';

export const gestaoDaPropriedade: KnowledgeModule = {
  id: 'gestao-da-propriedade',
  title: 'Gestão da Propriedade',
  category: 'gestão',
  summary: 'Gestão geral da propriedade rural para granja de galinhas caipiras, incluindo planejamento, organização, controle financeiro, registros e manutenção da infraestrutura.',
  objective: 'Orientar o produtor na gestão eficiente da propriedade, desde o planejamento inicial até o dia a dia, garantindo rentabilidade e sustentabilidade da granja.',
  technicalContent: [
    'A gestão da propriedade é fundamental para o sucesso da granja de galinhas caipiras. Uma boa gestão envolve planejamento, organização, controle financeiro, registros e manutenção da infraestrutura.',
    '# 1. Planejamento inicial: Antes de iniciar a criação, é essencial planejar: tamanho da granja (quantidade de aves), tipo de sistema (semi-intensivo, extensivo), infraestrutura necessária (galpões, piquetes), investimento inicial e fonte de financiamento (se necessário).',
    '# 2. Organização da propriedade: Divida a área em zones: área de criação, área de armazenamento de ração/equipamentos, área de descarte de resíduos, área de escritório/administrativa. Mantenha um layout que facilite o fluxo de trabalho.',
    '# 3. Controle financeiro: Registre todas as despesas (ração, medicamentos, equipamentos, energia, água, mão de obra) e receitas (venda de ovos, venda de aves, venda de esterco). Calcule custos por ave e por dúzia de ovos para definir preços adequados.',
    '# 4. Registros de produção: Mantenha registros detalhados de: número de aves por lote, idade, taxa de postura, consumo de ração e água, mortalidade, vacinações aplicadas, tratamentos veterinários, datas de entrada/saída de lotes.',
    '# 5. Manutenção da infraestrutura: Realize manutenção preventiva regular dos galpões, cercas, bebedouros, comedouros e equipamentos. Isso evita gastos maiores com reparos emergenciais.',
    '# 6. Gestão de resíduos: A esterco das aves pode ser utilizado como adubo orgânico. Armazene-o em local adequado (longe de fontes de água) e utilize-o ou venda-o para outros produtores.',
    '# 7. Gestão de mão de obra: Se houver funcionários, defina tarefas claras, horários e treinamentos periódicos sobre manejo, sanitização e biosseguridade.',
    '# 8. Planejamento de reposição de lotes: Planeje a renovação das aves com antecedência para manter a produção contínua. Considere o ciclo produtivo (geralmente 72-80 semanas para galinhas de postura).',
    '# 8.1 Escalonamento de produção: Para garantir fluxo contínuo de produção e receita durante todo o ano, recomenda-se o escalonamento de lotes. Como funciona:',
    '  - Alojar 4 lotes de aves, com intervalo de 12 a 16 semanas entre cada lote.',
    '  - Exemplo com 1.500 aves por lote, totalizando 6.000 aves alojadas.',
    '  - Após 72 semanas, o primeiro lote é descartado e substituído pelo quinto lote, mantendo sempre 4 lotes em produção.',
    '  - Resultado: média de 77% de postura (385 dúzias/dia ou 154 cartelas de 30 ovos/dia), com pico entre as 56ª e 66ª semanas.',
    '  - Passos: Alojar o primeiro lote no pinteiro; deixar por 2 semanas e transferir para o galpão 1; limpar e desinfetar o pinteiro e deixar vazio sanitário; repetir o processo para os outros lotes com intervalo de 12-16 semanas.',
    '# 9. Gestão de risco: Implemente medidas para reduzir riscos: seguro agrícola (se aplicável), reserva financeira para emergências, diversificação de produtos (ovos + carne + esterco), e programa de biosseguridade rigoroso.',
    '# 10. Avaliação periódica: A cada mês/semestre, avalie o desempenho da granja: rentabilidade, taxa de postura, custos, mortalidade. Use esses dados para tomar decisões de melhoria.',
  ],
  importantParameters: [
    {
      name: 'Custo inicial por ave',
      unit: 'R$/ave',
      idealValue: 'Variável',
      minValue: '-',
      maxValue: '-',
      description: 'Investimento inicial por ave (galinha + equipamentos + infraestrutura inicial).'
    },
    {
      name: 'Custo operacional mensal',
      unit: 'R$',
      idealValue: 'Controlado',
      minValue: '-',
      maxValue: '-',
      description: 'Total de despesas mensais (ração, medicamentos, energia, água, etc.).'
    },
    {
      name: 'Margem de lucro desejada',
      unit: '%',
      idealValue: '15 a 30',
      minValue: '10',
      maxValue: '40',
      description: 'Percentual de lucro desejado sobre os custos totais.'
    },
    {
      name: 'Rotatividade de lotes',
      unit: 'semanas',
      idealValue: '72 a 80',
      minValue: '60',
      maxValue: '90',
      description: 'Período de produção de cada lote de galinhas de postura.'
    },
    {
      name: 'Reserva financeira',
      unit: 'meses',
      idealValue: '3 a 6',
      minValue: '2',
      maxValue: '12',
      description: 'Valor reservado para emergências (equivalente a 3-6 meses de custos operacionais).'
    },
  ],
  bestPractices: [
    'Realize planejamento detalhado antes de iniciar a granja.',
    'Mantenha registros financeiros e de produção organizados e atualizados.',
    'Calcule custos regularmente para definir preços de venda adequados.',
    'Realize manutenção preventiva da infraestrutura.',
    'Armazene esterco de forma adequada e utilize-o ou venda-o como adubo.',
    'Treine regularmente a mão de obra sobre manejo e biosseguridade.',
    'Planeje a reposição de lotes com antecedência.',
    'Mantenha uma reserva financeira para emergências.',
    'Avalie o desempenho da granja mensalmente/semestralmente.',
    'Diversifique os produtos (ovos + esterco + aves de descarte) para aumentar receitas.',
  ],
  commonProblems: [
    {
      problem: 'Falta de registros adequados',
      possibleCauses: [
        'Desconhecimento da importância dos registros',
        'Falta de tempo ou organização',
        'Não ter um sistema de registro definido',
      ],
      recommendedSolutions: [
        'Use planilhas simples (Excel/Google Sheets) ou cadernos para registros.',
        'Reserve um tempo diário/semanal para atualizar os registros.',
        'Adote um sistema de gestão básico (mesmo manual).',
      ],
    },
    {
      problem: 'Controle financeiro inadequado',
      possibleCauses: [
        'Não separar despesas pessoais da granja',
        'Não registrar todas as despesas e receitas',
        'Não calcular custos unitários (por ave, por dúzia de ovos)',
      ],
      recommendedSolutions: [
        'Use uma conta bancária separada para a granja.',
        'Registra TODAS as despesas e receitas, mesmo pequenas.',
        'Calcule custos unitários mensalmente para definir preços.',
      ],
    },
    {
      problem: 'Manutenção negligenciada',
      possibleCauses: [
        'Falta de planejamento de manutenção',
        'Priorizar gastos com outras áreas',
        'Não fazer manutenção preventiva',
      ],
      recommendedSolutions: [
        'Crie um calendário de manutenção preventiva.',
        'Reserve um valor mensal para manutenções.',
        'Realize inspeções semanais na infraestrutura.',
      ],
    },
  ],
  commonMistakes: [
    'Não fazer planejamento inicial adequado.',
    'Misturar finanças pessoais com as da granja.',
    'Negligenciar registros de produção e financeiros.',
    'Não calcular custos unitários (por ave, por dúzia).',
    'Não fazer manutenção preventiva.',
    'Não planejar reposição de lotes com antecedência.',
    'Não ter reserva financeira para emergências.',
    'Não avaliar o desempenho da granja periodicamente.',
  ],
  managementChecklist: [
    {
      item: 'Atualizar registros de produção',
      frequency: 'Diário',
      responsible: 'Produtor',
      critical: true,
    },
    {
      item: 'Registrar despesas e receitas',
      frequency: 'Diário',
      responsible: 'Produtor',
      critical: true,
    },
    {
      item: 'Inspecionar infraestrutura (galpões, cercas)',
      frequency: 'Semanal',
      responsible: 'Produtor',
      critical: true,
    },
    {
      item: 'Calcular custos unitários',
      frequency: 'Mensal',
      responsible: 'Produtor',
      critical: true,
    },
    {
      item: 'Avaliar desempenho da granja',
      frequency: 'Mensal',
      responsible: 'Produtor',
      critical: true,
    },
    {
      item: 'Realizar manutenção preventiva',
      frequency: 'Mensal',
      responsible: 'Produtor',
      critical: false,
    },
    {
      item: 'Planejar reposição de lotes',
      frequency: 'Trimestral',
      responsible: 'Produtor',
      critical: true,
    },
    {
      item: 'Atualizar reserva financeira',
      frequency: 'Mensal',
      responsible: 'Produtor',
      critical: false,
    },
  ],
  intelligentRules: [
    {
      rule: 'Se custos excederem receitas por 2 meses consecutivos, reavalie preços e despesas.',
      condition: 'Custos > Receitas por 2 meses',
      action: '1. Reavalie preços de venda dos ovos. 2. Identifique despesas que podem ser reduzidas (ex: desperdício de ração). 3. Verifique se a taxa de postura está adequada.',
      priority: 'alta',
    },
    {
      rule: 'Se manutenção preventiva for negligenciada por mais de 3 meses, alertar sobre riscos.',
      condition: 'Manutenção preventiva > 3 meses atrasada',
      action: '1. Realize inspeção imediata da infraestrutura. 2. Execute manutenção prioritária (cercas, galpões, bebedouros). 3. Crie calendário de manutenção para evitar atrasos.',
      priority: 'alta',
    },
  ],
  technicalSources: [
    'AMARAL, Edilson Sousa do. Galinhas poedeiras: criação em semiconfinamento. 2ª edição. Brasília: EMATER-DF, 2009.',
    'EMBRAPA Meio-Norte — Criação de Galinhas Caipiras: Gestão e Administração. 2018.',
    'EMBRAPA Suínos e Aves — Gestão de Granjas Avícolas Alternativas. Circular Técnica, 2019.',
    'Serviço Brasileiro de Apoio às Micro e Pequenas Empresas (SEBRAE) — Guia de Gestão para Pequenos Produtores Avícolas. 2020.',
    'MACIEL, R. P. et al. Produção Alternativa de Aves: Gestão e Rentabilidade. Editora UFV, 2020.',
  ],
};
