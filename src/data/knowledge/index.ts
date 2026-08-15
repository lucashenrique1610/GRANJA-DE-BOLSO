import { KnowledgeCategory, KnowledgeModule, KnowledgeCategoryIdOrLegacy } from '@/types';

// Função auxiliar para criar módulo vazio com metadados
function createMetadataModule(
  id: string,
  title: string,
  category: KnowledgeCategoryIdOrLegacy,
  summary: string
): KnowledgeModule {
  return {
    id,
    title,
    category,
    summary,
    technicalContent: [],
    bestPractices: [],
    commonMistakes: [],
    practicalChecklist: [],
    technicalSources: [],
  };
}

// Mapeamento de IDs de módulos concluídos para importadores
const moduleImports: Record<string, () => Promise<Record<string, KnowledgeModule>>> = {
  'fundamentos-criacao-caipira': () => import('./fundamentos-criacao-caipira'),
  'instalacoes': () => import('./instalacoes'),
  'escolha-da-linhagem': () => import('./escolha-da-linhagem'),
  'cria': () => import('./cria'),
  'recria': () => import('./recria'),
  'pre-postura': () => import('./pre-postura'),
  'postura': () => import('./postura'),
  'nutricao': () => import('./nutricao'),
  'manejo-da-agua': () => import('./manejo-da-agua'),
  'sanidade': () => import('./sanidade'),
  'vacinacao': () => import('./vacinacao'),
  'biosseguridade': () => import('./biosseguridade'),
  'producao-de-ovos': () => import('./producao-de-ovos'),
  'classificacao-de-ovos': () => import('./classificacao-de-ovos'),
  'comercializacao': () => import('./comercializacao'),
  'custos': () => import('./custos'),
  'indicadores-zootecnicos': () => import('./indicadores-zootecnicos'),
  'bem-estar-animal': () => import('./bem-estar-animal'),
  'manejo-de-piquetes': () => import('./manejo-de-piquetes'),
  'reproducao': () => import('./reproducao'),
  'incubacao': () => import('./incubacao'),
  'gestao-da-propriedade': () => import('./gestao-da-propriedade'),
  'solucao-de-problemas': () => import('./solucao-de-problemas'),
};

// Categorias com apenas metadados dos módulos (para manter o bundle pequeno)
const CATEGORIES: KnowledgeCategory[] = [
  {
    id: 'fundamentos',
    title: '1. Fundamentos',
    summary: 'Conceitos essenciais para iniciar na criação de galinhas caipiras de postura',
    modules: [
      createMetadataModule('fundamentos-criacao-caipira', 'Fundamentos Criação Caipira', 'fundamentos', 'Conceitos básicos para começar sua granja'),
      createMetadataModule('historia-da-avicultura', 'História da Avicultura', 'fundamentos', 'Conheça a evolução da avicultura ao longo dos tempos'),
      createMetadataModule('sistemas-de-producao', 'Sistemas de Produção', 'fundamentos', 'Diferentes sistemas de produção de ovos caipiros'),
      createMetadataModule('glossario-tecnico', 'Glossário Técnico', 'fundamentos', 'Termos técnicos utilizados na avicultura'),
      createMetadataModule('planejamento-inicial', 'Planejamento Inicial', 'fundamentos', 'Passos para planejar sua granja'),
      createMetadataModule('legislacao-basica', 'Legislação Básica', 'fundamentos', 'Normas e regulamentações aplicáveis'),
    ],
  },
  {
    id: 'planejamento-da-granja',
    title: '2. Planejamento da Granja',
    summary: 'Como planejar a estrutura e organização da sua granja',
    modules: [
      createMetadataModule('escolha-do-terreno', 'Escolha do Terreno', 'planejamento-da-granja', 'Como escolher o terreno ideal para sua granja'),
      createMetadataModule('planejamento-da-producao', 'Planejamento da Produção', 'planejamento-da-granja', 'Planeje sua capacidade de produção'),
      createMetadataModule('dimensionamento', 'Dimensionamento', 'planejamento-da-granja', 'Dimensionamento das instalações'),
      createMetadataModule('capacidade-de-alojamento', 'Capacidade de Alojamento', 'planejamento-da-granja', 'Calcule a capacidade ideal de alojamento'),
      createMetadataModule('fluxograma-da-producao', 'Fluxograma da Produção', 'planejamento-da-granja', 'Fluxo de trabalho na granja'),
      createMetadataModule('licenciamento-ambiental', 'Licenciamento Ambiental', 'planejamento-da-granja', 'Processos de licenciamento'),
      createMetadataModule('planejamento-financeiro', 'Planejamento Financeiro', 'planejamento-da-granja', 'Planejamento financeiro da granja'),
    ],
  },
  {
    id: 'instalacoes',
    title: '3. Instalações',
    summary: 'Tudo sobre as instalações da granja',
    modules: [
      createMetadataModule('instalacoes', 'Instalações', 'instalacoes', 'Como construir e organizar suas instalações'),
      createMetadataModule('orientacao-solar', 'Orientação Solar', 'instalacoes', 'Importância da orientação solar'),
      createMetadataModule('ventilacao', 'Ventilação', 'instalacoes', 'Ventilação adequada no galpão'),
      createMetadataModule('ambiencia', 'Ambiência', 'instalacoes', 'Controle da ambiência'),
      createMetadataModule('iluminacao', 'Iluminação', 'instalacoes', 'Iluminação ideal para postura'),
      createMetadataModule('aquecimento', 'Aquecimento', 'instalacoes', 'Aquecimento no galpão'),
      createMetadataModule('cama-aviaria', 'Cama Aviária', 'instalacoes', 'Tipos e manejo da cama'),
      createMetadataModule('poleiros', 'Poleiros', 'instalacoes', 'Poleiros para as aves'),
      createMetadataModule('ninhos', 'Ninhos', 'instalacoes', 'Ninhos para postura'),
      createMetadataModule('cercas', 'Cercas', 'instalacoes', 'Cercas para piquetes'),
      createMetadataModule('sombrite', 'Sombrite', 'instalacoes', 'Uso de sombrite'),
      createMetadataModule('depositos', 'Depósitos', 'instalacoes', 'Depósitos para armazenamento'),
      createMetadataModule('silos', 'Silos', 'instalacoes', 'Silos para ração'),
      createMetadataModule('armazenamento-da-racao', 'Armazenamento da Ração', 'instalacoes', 'Armazenamento adequado da ração'),
    ],
  },
  {
    id: 'equipamentos',
    title: '4. Equipamentos',
    summary: 'Equipamentos essenciais para a granja',
    modules: [
      createMetadataModule('bebedouros', 'Bebedouros', 'equipamentos', 'Tipos de bebedouros'),
      createMetadataModule('comedouros', 'Comedouros', 'equipamentos', 'Tipos de comedouros'),
      createMetadataModule('aquecedores', 'Aquecedores', 'equipamentos', 'Aquecedores para pintinhos'),
      createMetadataModule('incubadoras', 'Incubadoras', 'equipamentos', 'Incubadoras de ovos'),
      createMetadataModule('ovoscopio', 'Ovoscópio', 'equipamentos', 'Uso do ovoscópio'),
      createMetadataModule('balancas', 'Balanças', 'equipamentos', 'Balanças para pesagem'),
      createMetadataModule('pulverizadores', 'Pulverizadores', 'equipamentos', 'Pulverizadores para desinfecção'),
      createMetadataModule('epis', 'EPIs', 'equipamentos', 'Equipamentos de Proteção Individual'),
      createMetadataModule('geradores', 'Geradores', 'equipamentos', 'Geradores de energia'),
    ],
  },
  {
    id: 'genetica-e-linhagens',
    title: '5. Genética e Linhagens',
    summary: 'Genética, linhagens e cruzamentos',
    modules: [
      createMetadataModule('escolha-da-linhagem', 'Escolha da Linhagem', 'genetica-e-linhagens', 'Como escolher a linhagem ideal para sua granja'),
      createMetadataModule('embrapa-051', 'Embrapa 051', 'genetica-e-linhagens', 'Linhagem Embrapa 051'),
      createMetadataModule('isa-brown', 'ISA Brown', 'genetica-e-linhagens', 'Linhagem ISA Brown'),
      createMetadataModule('lohmann-brown', 'Lohmann Brown', 'genetica-e-linhagens', 'Linhagem Lohmann Brown'),
      createMetadataModule('hy-line-brown', 'Hy-Line Brown', 'genetica-e-linhagens', 'Linhagem Hy-Line Brown'),
      createMetadataModule('novogen', 'Novogen', 'genetica-e-linhagens', 'Linhagem Novogen'),
      createMetadataModule('dekalb', 'Dekalb', 'genetica-e-linhagens', 'Linhagem Dekalb'),
      createMetadataModule('glk', 'GLK', 'genetica-e-linhagens', 'Linhagem GLK'),
      createMetadataModule('gl6', 'GL6', 'genetica-e-linhagens', 'Linhagem GL6'),
      createMetadataModule('ovos-azuis', 'Ovos Azuis', 'genetica-e-linhagens', 'Linhagens que produzem ovos azuis'),
      createMetadataModule('ovos-verdes', 'Ovos Verdes', 'genetica-e-linhagens', 'Linhagens que produzem ovos verdes'),
      createMetadataModule('ovos-chocolate', 'Ovos Chocolate', 'genetica-e-linhagens', 'Linhagens que produzem ovos chocolate'),
      createMetadataModule('cruzamentos', 'Cruzamentos', 'genetica-e-linhagens', 'Cruzamentos de linhagens'),
      createMetadataModule('melhoramento-genetico', 'Melhoramento Genético', 'genetica-e-linhagens', 'Melhoramento genético'),
    ],
  },
  {
    id: 'manejo',
    title: '6. Manejo',
    summary: 'Manejo geral das aves',
    modules: [
      createMetadataModule('bem-estar-animal', 'Bem-estar Animal', 'manejo', 'Como garantir o bem-estar das suas aves'),
      createMetadataModule('manejo-de-piquetes', 'Manejo de Piquetes', 'manejo', 'Manejo dos piquetes de pastagem'),
      createMetadataModule('manejo-da-agua', 'Manejo da Água', 'manejo', 'Como gerenciar a água para as aves'),
      createMetadataModule('debicagem', 'Debicagem', 'manejo', 'Debicagem das aves'),
      createMetadataModule('pesagem', 'Pesagem', 'manejo', 'Pesagem das aves'),
      createMetadataModule('uniformidade', 'Uniformidade', 'manejo', 'Uniformidade do lote'),
      createMetadataModule('densidade', 'Densidade', 'manejo', 'Densidade de alojamento'),
      createMetadataModule('transporte', 'Transporte', 'manejo', 'Transporte das aves'),
      createMetadataModule('descarte', 'Descarte', 'manejo', 'Descarte de aves'),
      createMetadataModule('introducao-de-novas-aves', 'Introdução de Novas Aves', 'manejo', 'Introduzindo novas aves no lote'),
      createMetadataModule('manejo-diario', 'Manejo Diário', 'manejo', 'Manejo diário das aves'),
    ],
  },
  {
    id: 'fases-da-producao',
    title: '7. Fases da Produção',
    summary: 'Cria, recria, pré-postura e postura',
    modules: [
      createMetadataModule('cria', 'Cria', 'fases-da-producao', 'Manejo de pintinhos na fase de cria'),
      createMetadataModule('recria', 'Recria', 'fases-da-producao', 'Manejo das aves na fase de recria'),
      createMetadataModule('pre-postura', 'Pré-postura', 'fases-da-producao', 'Preparação para a fase de postura'),
      createMetadataModule('postura', 'Postura', 'fases-da-producao', 'Manejo durante a fase de postura'),
    ],
  },
  {
    id: 'nutricao',
    title: '8. Nutrição',
    summary: 'Nutrição das aves',
    modules: [
      createMetadataModule('nutricao', 'Nutrição', 'nutricao', 'Como nutrir suas aves adequadamente'),
      createMetadataModule('nutrientes', 'Nutrientes', 'nutricao', 'Principais nutrientes'),
      createMetadataModule('ingredientes', 'Ingredientes', 'nutricao', 'Ingredientes da ração'),
      createMetadataModule('vitaminas', 'Vitaminas', 'nutricao', 'Vitaminas essenciais'),
      createMetadataModule('minerais', 'Minerais', 'nutricao', 'Minerais importantes'),
      createMetadataModule('aminoacidos', 'Aminoácidos', 'nutricao', 'Aminoácidos essenciais'),
      createMetadataModule('enzimas', 'Enzimas', 'nutricao', 'Uso de enzimas'),
      createMetadataModule('micotoxinas', 'Micotoxinas', 'nutricao', 'Controle de micotoxinas'),
      createMetadataModule('deficiencias-nutricionais', 'Deficiências Nutricionais', 'nutricao', 'Deficiências e suas soluções'),
      createMetadataModule('alimentacao-por-fase', 'Alimentação por Fase', 'nutricao', 'Alimentação em cada fase'),
      createMetadataModule('alimentacao-alternativa', 'Alimentação Alternativa', 'nutricao', 'Alimentos alternativos'),
      createMetadataModule('pastagens', 'Pastagens', 'nutricao', 'Pastagens para forrageamento'),
    ],
  },
  {
    id: 'formulacao-de-racao',
    title: '9. Formulação de Ração',
    summary: 'Formulação e balanceamento de rações',
    modules: [
      createMetadataModule('formulacao', 'Formulação', 'formulacao-de-racao', 'Princípios da formulação'),
      createMetadataModule('balanceamento', 'Balanceamento', 'formulacao-de-racao', 'Balanceamento da ração'),
      createMetadataModule('energia', 'Energia', 'formulacao-de-racao', 'Energia na ração'),
      createMetadataModule('proteina', 'Proteína', 'formulacao-de-racao', 'Proteína na ração'),
      createMetadataModule('calcio', 'Cálcio', 'formulacao-de-racao', 'Cálcio na ração'),
      createMetadataModule('fosforo', 'Fósforo', 'formulacao-de-racao', 'Fósforo na ração'),
      createMetadataModule('lisina', 'Lisina', 'formulacao-de-racao', 'Lisina na ração'),
      createMetadataModule('metionina', 'Metionina', 'formulacao-de-racao', 'Metionina na ração'),
      createMetadataModule('formulacao-por-fase', 'Formulação por Fase', 'formulacao-de-racao', 'Formulação para cada fase'),
      createMetadataModule('custo-minimo', 'Custo Mínimo', 'formulacao-de-racao', 'Formulação de custo mínimo'),
    ],
  },
  {
    id: 'sanidade',
    title: '10. Sanidade',
    summary: 'Sanidade, vacinação e biosseguridade',
    modules: [
      createMetadataModule('sanidade', 'Sanidade', 'sanidade', 'Como manter a sanidade da sua granja'),
      createMetadataModule('vacinacao', 'Vacinação', 'sanidade', 'Programa de vacinação das aves'),
      createMetadataModule('biosseguridade', 'Biosseguridade', 'sanidade', 'Medidas de biosseguridade'),
      createMetadataModule('parasitas', 'Parasitas', 'sanidade', 'Controle de parasitas'),
      createMetadataModule('verminoses', 'Verminoses', 'sanidade', 'Verminoses em aves'),
      createMetadataModule('piolhos', 'Piolhos', 'sanidade', 'Controle de piolhos'),
      createMetadataModule('acaros', 'Ácaros', 'sanidade', 'Controle de ácaros'),
      createMetadataModule('coccidiose', 'Coccidiose', 'sanidade', 'Prevenção e tratamento'),
      createMetadataModule('newcastle', 'Newcastle', 'sanidade', 'Doença de Newcastle'),
      createMetadataModule('marek', 'Marek', 'sanidade', 'Doença de Marek'),
      createMetadataModule('bronquite', 'Bronquite', 'sanidade', 'Bronquite infecciosa'),
      createMetadataModule('coriza', 'Coriza', 'sanidade', 'Coriza infecciosa'),
      createMetadataModule('bouba', 'Bouba', 'sanidade', 'Bouba aviária'),
      createMetadataModule('salmonella', 'Salmonella', 'sanidade', 'Controle de Salmonella'),
      createMetadataModule('micoplasmose', 'Micoplasmose', 'sanidade', 'Micoplasmose'),
      createMetadataModule('necropsia', 'Necropsia', 'sanidade', 'Procedimento de necropsia'),
      createMetadataModule('diagnostico', 'Diagnóstico', 'sanidade', 'Diagnóstico de doenças'),
    ],
  },
  {
    id: 'reproducao-e-incubacao',
    title: '11. Reprodução e Incubação',
    summary: 'Reprodução natural e artificial, incubação',
    modules: [
      createMetadataModule('reproducao', 'Reprodução', 'reproducao-e-incubacao', 'Manejo da reprodução das aves'),
      createMetadataModule('incubacao', 'Incubação', 'reproducao-e-incubacao', 'Como incubar ovos corretamente'),
      createMetadataModule('matrizes', 'Matrizes', 'reproducao-e-incubacao', 'Manejo de matrizes'),
      createMetadataModule('galos', 'Galos', 'reproducao-e-incubacao', 'Manejo de galos'),
      createMetadataModule('fertilidade', 'Fertilidade', 'reproducao-e-incubacao', 'Fertilidade dos ovos'),
      createMetadataModule('armazenamento-dos-ovos-ferteis', 'Armazenamento dos Ovos Férteis', 'reproducao-e-incubacao', 'Armazenamento adequado'),
      createMetadataModule('ovoscopia', 'Ovoscopia', 'reproducao-e-incubacao', 'Ovoscopia dos ovos'),
      createMetadataModule('eclosao', 'Eclosão', 'reproducao-e-incubacao', 'Processo de eclosão'),
    ],
  },
  {
    id: 'producao-de-ovos',
    title: '12. Produção de Ovos',
    summary: 'Produção, curva de produção, qualidade dos ovos',
    modules: [
      createMetadataModule('producao-de-ovos', 'Produção de Ovos', 'producao-de-ovos', 'Como maximizar a produção de ovos'),
      createMetadataModule('classificacao-de-ovos', 'Classificação de Ovos', 'producao-de-ovos', 'Como classificar seus ovos'),
      createMetadataModule('curva-de-producao', 'Curva de Produção', 'producao-de-ovos', 'Curva de produção de ovos'),
      createMetadataModule('pico-de-postura', 'Pico de Postura', 'producao-de-ovos', 'Pico de postura'),
      createMetadataModule('persistencia', 'Persistência', 'producao-de-ovos', 'Persistência da produção'),
      createMetadataModule('qualidade-da-casca', 'Qualidade da Casca', 'producao-de-ovos', 'Qualidade da casca'),
      createMetadataModule('qualidade-da-gema', 'Qualidade da Gema', 'producao-de-ovos', 'Qualidade da gema'),
      createMetadataModule('qualidade-do-albumen', 'Qualidade do Albumen', 'producao-de-ovos', 'Qualidade do albúmen'),
      createMetadataModule('defeitos-dos-ovos', 'Defeitos dos Ovos', 'producao-de-ovos', 'Defeitos comuns'),
    ],
  },
  {
    id: 'comercializacao',
    title: '13. Comercialização',
    summary: 'Venda, marketing, fidelização',
    modules: [
      createMetadataModule('comercializacao', 'Comercialização', 'comercializacao', 'Como vender seus ovos'),
      createMetadataModule('precificacao', 'Precificação', 'comercializacao', 'Como precificar os ovos'),
      createMetadataModule('embalagens', 'Embalagens', 'comercializacao', 'Embalagens para ovos'),
      createMetadataModule('rotulagem', 'Rotulagem', 'comercializacao', 'Rotulagem dos ovos'),
      createMetadataModule('delivery', 'Delivery', 'comercializacao', 'Venda por delivery'),
      createMetadataModule('venda-direta', 'Venda Direta', 'comercializacao', 'Venda direta ao consumidor'),
      createMetadataModule('supermercados', 'Supermercados', 'comercializacao', 'Venda em supermercados'),
      createMetadataModule('marketing', 'Marketing', 'comercializacao', 'Marketing da granja'),
      createMetadataModule('fidelizacao-de-clientes', 'Fidelização de Clientes', 'comercializacao', 'Fidelização de clientes'),
    ],
  },
  {
    id: 'gestao',
    title: '14. Gestão',
    summary: 'Gestão financeira, estoque, RH',
    modules: [
      createMetadataModule('custos', 'Custos', 'gestao', 'Como gerenciar os custos da sua granja'),
      createMetadataModule('gestao-da-propriedade', 'Gestão da Propriedade', 'gestao', 'Como gerenciar sua propriedade'),
      createMetadataModule('indicadores-zootecnicos', 'Indicadores Zootécnicos', 'gestao', 'Indicadores para monitorar sua granja'),
      createMetadataModule('fluxo-de-caixa', 'Fluxo de Caixa', 'gestao', 'Controle de fluxo de caixa'),
      createMetadataModule('estoque', 'Estoque', 'gestao', 'Controle de estoque'),
      createMetadataModule('compras', 'Compras', 'gestao', 'Gestão de compras'),
      createMetadataModule('vendas', 'Vendas', 'gestao', 'Gestão de vendas'),
      createMetadataModule('planejamento-gestao', 'Planejamento', 'gestao', 'Planejamento estratégico'),
      createMetadataModule('inventario', 'Inventário', 'gestao', 'Inventário da granja'),
      createMetadataModule('funcionarios', 'Funcionários', 'gestao', 'Gestão de funcionários'),
    ],
  },
  {
    id: 'sustentabilidade',
    title: '15. Sustentabilidade',
    summary: 'Práticas sustentáveis na granja',
    modules: [
      createMetadataModule('compostagem', 'Compostagem', 'sustentabilidade', 'Compostagem de resíduos'),
      createMetadataModule('esterco', 'Esterco', 'sustentabilidade', 'Uso do esterco'),
      createMetadataModule('energia-solar', 'Energia Solar', 'sustentabilidade', 'Uso de energia solar'),
      createMetadataModule('agua-da-chuva', 'Água da Chuva', 'sustentabilidade', 'Aproveitamento de água da chuva'),
      createMetadataModule('arborizacao', 'Arborização', 'sustentabilidade', 'Arborização da granja'),
      createMetadataModule('aproveitamento-de-residuos', 'Aproveitamento de Resíduos', 'sustentabilidade', 'Aproveitamento de resíduos'),
    ],
  },
  {
    id: 'legislacao',
    title: '16. Legislação',
    summary: 'Normas e regulamentações',
    modules: [
      createMetadataModule('mapa', 'MAPA', 'legislacao', 'Normas do MAPA'),
      createMetadataModule('vigilancia-sanitaria', 'Vigilância Sanitária', 'legislacao', 'Vigilância sanitária'),
      createMetadataModule('transporte-legislacao', 'Transporte', 'legislacao', 'Legislação de transporte'),
      createMetadataModule('comercializacao-legislacao', 'Comercialização', 'legislacao', 'Legislação de comercialização'),
      createMetadataModule('rotulagem-legislacao', 'Rotulagem', 'legislacao', 'Legislação de rotulagem'),
      createMetadataModule('selo-de-inspecao', 'Selo de Inspeção', 'legislacao', 'Selo de inspeção'),
      createMetadataModule('normas-ambientais', 'Normas Ambientais', 'legislacao', 'Normas ambientais'),
    ],
  },
  {
    id: 'solucao-de-problemas',
    title: '17. Solução de Problemas',
    summary: 'Problemas comuns e soluções',
    modules: [
      createMetadataModule('solucao-de-problemas', 'Solução de Problemas', 'solucao-de-problemas', 'Resolva problemas comuns na granja'),
      createMetadataModule('baixa-postura', 'Baixa Postura', 'solucao-de-problemas', 'Causas e soluções'),
      createMetadataModule('canibalismo', 'Canibalismo', 'solucao-de-problemas', 'Prevenção e tratamento'),
      createMetadataModule('alta-mortalidade', 'Alta Mortalidade', 'solucao-de-problemas', 'Causas e soluções'),
      createMetadataModule('ovos-sem-casca', 'Ovos Sem Casca', 'solucao-de-problemas', 'Causas e soluções'),
      createMetadataModule('casca-fina', 'Casca Fina', 'solucao-de-problemas', 'Causas e soluções'),
      createMetadataModule('ovos-pequenos', 'Ovos Pequenos', 'solucao-de-problemas', 'Causas e soluções'),
      createMetadataModule('gema-clara', 'Gema Clara', 'solucao-de-problemas', 'Causas e soluções'),
      createMetadataModule('diarreia', 'Diarreia', 'solucao-de-problemas', 'Causas e tratamento'),
      createMetadataModule('desidratacao', 'Desidratação', 'solucao-de-problemas', 'Causas e tratamento'),
      createMetadataModule('prolapso', 'Prolapso', 'solucao-de-problemas', 'Causas e tratamento'),
    ],
  },
  {
    id: 'biblioteca-tecnica',
    title: '18. Biblioteca Técnica',
    summary: 'Artigos, manuais, publicações',
    modules: [
      createMetadataModule('artigos-cientificos', 'Artigos Científicos', 'biblioteca-tecnica', 'Artigos científicos'),
      createMetadataModule('manuais', 'Manuais', 'biblioteca-tecnica', 'Manuais técnicos'),
      createMetadataModule('publicacoes-da-embrapa', 'Publicações da Embrapa', 'biblioteca-tecnica', 'Publicações da Embrapa'),
      createMetadataModule('boletins-tecnicos', 'Boletins Técnicos', 'biblioteca-tecnica', 'Boletins técnicos'),
      createMetadataModule('estudos-de-caso', 'Estudos de Caso', 'biblioteca-tecnica', 'Estudos de caso'),
      createMetadataModule('materiais-de-universidades', 'Materiais de Universidades', 'biblioteca-tecnica', 'Materiais de universidades'),
    ],
  },
  {
    id: 'faq',
    title: '19. Perguntas Frequentes (FAQ)',
    summary: 'Perguntas frequentes dos produtores',
    modules: [
      createMetadataModule('faq-geral', 'FAQ Geral', 'faq', 'Perguntas frequentes'),
    ],
  },
  {
    id: 'ferramentas-tecnicas',
    title: '20. Ferramentas Técnicas',
    summary: 'Ferramentas para auxiliar na gestão',
    modules: [
      createMetadataModule('calculadora-de-consumo-de-racao', 'Calculadora de Consumo de Ração', 'ferramentas-tecnicas', 'Calculadora de consumo'),
      createMetadataModule('calculadora-de-consumo-de-agua', 'Calculadora de Consumo de Água', 'ferramentas-tecnicas', 'Calculadora de consumo'),
      createMetadataModule('calculadora-de-mortalidade', 'Calculadora de Mortalidade', 'ferramentas-tecnicas', 'Calculadora de mortalidade'),
      createMetadataModule('calculadora-de-producao', 'Calculadora de Produção', 'ferramentas-tecnicas', 'Calculadora de produção'),
      createMetadataModule('calculadora-de-lucro', 'Calculadora de Lucro', 'ferramentas-tecnicas', 'Calculadora de lucro'),
      createMetadataModule('calculadora-de-densidade', 'Calculadora de Densidade', 'ferramentas-tecnicas', 'Calculadora de densidade'),
      createMetadataModule('calculadora-de-incubacao', 'Calculadora de Incubação', 'ferramentas-tecnicas', 'Calculadora de incubação'),
    ],
  },
];

// Map kebab-case module IDs to camelCase export names
const idToExportName: Record<string, string> = {
  'fundamentos-criacao-caipira': 'fundamentosCriacaoCaipira',
  'instalacoes': 'instalacoes',
  'escolha-da-linhagem': 'escolhaDaLinhagem',
  'cria': 'cria',
  'recria': 'recria',
  'pre-postura': 'prePostura',
  'postura': 'postura',
  'nutricao': 'nutricao',
  'manejo-da-agua': 'manejoDaAgua',
  'sanidade': 'sanidade',
  'vacinacao': 'vacinacao',
  'biosseguridade': 'biosseguridade',
  'producao-de-ovos': 'producaoDeOvos',
  'classificacao-de-ovos': 'classificacaoDeOvos',
  'comercializacao': 'comercializacao',
  'custos': 'custos',
  'indicadores-zootecnicos': 'indicadoresZootecnicos',
  'bem-estar-animal': 'bemEstarAnimal',
  'manejo-de-piquetes': 'manejoDePiquetes',
  'reproducao': 'reproducao',
  'incubacao': 'incubacao',
  'gestao-da-propriedade': 'gestaoDaPropriedade',
  'solucao-de-problemas': 'solucaoDeProblemas',
};

// Função para carregar um módulo completo dinamicamente
export async function loadKnowledgeModule(id: string): Promise<KnowledgeModule> {
  // Verifica se o módulo está no mapeamento de importações
  if (moduleImports[id]) {
    try {
      const moduleExports = await moduleImports[id]();
      const exportName = idToExportName[id];
      if (exportName && moduleExports[exportName]) {
        return moduleExports[exportName];
      }
    } catch (error) {
      console.error(`Erro ao carregar módulo ${id}:`, error);
    }
  }

  // Retorna o módulo de metadados como fallback
  const metadataModule = getAllKnowledgeModules().find((m) => m.id === id);
  if (metadataModule) {
    return metadataModule as KnowledgeModule;
  }

  // Fallback final
  return {
    id,
    title: 'Módulo não encontrado',
    category: 'gestao', // Use a valid category as fallback
    summary: 'Conteúdo não disponível',
    technicalContent: [],
    bestPractices: [],
    commonMistakes: [],
    practicalChecklist: [],
    technicalSources: [],
  };
}

// Função para obter todas as categorias
export function getKnowledgeCategories(): KnowledgeCategory[] {
  return CATEGORIES;
}

// Função para obter todos os módulos (flat, apenas metadados)
export function getAllKnowledgeModules(): KnowledgeModule[] {
  return CATEGORIES.flatMap((cat) => cat.modules) as KnowledgeModule[];
}

// Função para obter módulo por ID (apenas metadados, para retrocompatibilidade)
export function getKnowledgeModule(id: string): KnowledgeModule | undefined {
  return getAllKnowledgeModules().find((m) => m.id === id);
}

// Função para obter categoria por ID
export function getKnowledgeCategory(id: string): KnowledgeCategory | undefined {
  return CATEGORIES.find((cat) => cat.id === id);
}

// Exportar para retrocompatibilidade
export const KNOWLEDGE_MODULES = getAllKnowledgeModules();
