/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserPersonalData {
  fullName: string;
  email: string;
  phone: string;
}

export interface RegistrationCredentials {
  password: string;
}

export interface FarmConfigData {
  farmName: string;
  state: string;
  city: string;
  birdCount: number;
}

export interface FarmProfileData extends FarmConfigData {
  selectedPalette: ThemePaletteId;
  customPaletteColor?: string;
  marketingSource: string;
}

export type ThemeFontFamily = 'inter' | 'roboto' | 'outfit' | 'poppins' | 'nunito';
export type ThemeBorderRadius = 'sharp' | 'soft' | 'rounded' | 'pill';

export const FONT_OPTIONS: { id: ThemeFontFamily; name: string; css: string }[] = [
  { id: 'inter', name: 'Inter', css: '"Inter", ui-sans-serif, system-ui, sans-serif' },
  { id: 'roboto', name: 'Roboto', css: '"Roboto", ui-sans-serif, system-ui, sans-serif' },
  { id: 'outfit', name: 'Outfit', css: '"Outfit", ui-sans-serif, system-ui, sans-serif' },
  { id: 'poppins', name: 'Poppins', css: '"Poppins", ui-sans-serif, system-ui, sans-serif' },
  { id: 'nunito', name: 'Nunito', css: '"Nunito", ui-sans-serif, system-ui, sans-serif' },
];

export const RADIUS_OPTIONS: { id: ThemeBorderRadius; name: string; value: string; preview: string }[] = [
  { id: 'sharp', name: 'Quadrado', value: '0.375rem', preview: '6px' },
  { id: 'soft', name: 'Suave', value: '0.75rem', preview: '12px' },
  { id: 'rounded', name: 'Arredondado', value: '1rem', preview: '16px' },
  { id: 'pill', name: 'Pílula', value: '1.5rem', preview: '24px' },
];

export interface SystemSettingsData {
  selectedPalette: ThemePaletteId;
  customPaletteColor?: string;
  fontFamily: ThemeFontFamily;
  borderRadius: ThemeBorderRadius;
  eggSalePrice: number;
  birdSalePrice: number;
  litterSalePrice: number;
  weather: {
    defaultCity?: {
      name: string;
      lat: number;
      lon: number;
    };
    display: {
      currentTemp: boolean;
      feelsLike: boolean;
      humidity: boolean;
      windSpeed: boolean;
      condition: boolean;
      dailyForecast: boolean;
      uvIndex: boolean;
      precipitation: boolean;
      pressure: boolean;
      visibility: boolean;
    };
    recentLocations: Array<{
      name: string;
      lat: number;
      lon: number;
      timestamp: number;
    }>;
  };
}

export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export interface BackupAutomationSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  lastRunAt: string;
  keepCount: number;
}

export type ThemePaletteId = 'blue' | 'green' | 'brown' | 'yellow' | 'minimal' | 'custom';

export interface ThemePalette {
  id: ThemePaletteId;
  name: string;
  colors: string[]; // Represent circles e.g. [primary, secondary, light-bg]
  themeVars: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    bgContainer: string;
    bgMain: string;
  };
}

export interface OnboardingState {
  step: number; // 0: Live Landing, 1: personal details, 2: farm info, 3: choose theme, 4: marketing source, 5: dashboard (finalized)
  personal: UserPersonalData;
  farm: FarmConfigData;
  selectedPalette: ThemePaletteId;
  marketingSource: string;
  systemSettings: SystemSettingsData;
}

export interface AnimalRecord {
  id: string;
  tag: string;
  supplierId: string;
  lot: string;
  species: string;
  purpose: string;
  breed: string;
  quantity: number;
  currentQuantity?: number;
  totalPurchasePrice: number;
  averageWeightKg: number;
  birthDate: string;
  status: string;
  notes: string;
  createdAt: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: string;
  notes: string;
  createdAt: string;
}

export interface SupplierRecord {
  id: string;
  companyName: string;
  contactName: string;
  category: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: string;
  notes: string;
  createdAt: string;
}

export type PurchaseCategory =
  | 'racao'
  | 'ingrediente_racao'
  | 'insumo_veterinario'
  | 'mao_de_obra'
  | 'material_operacional'
  | 'aves'
  | 'outro';

export type PurchasePaymentStatus = 'pendente' | 'pago' | 'parcial';

export interface PurchaseRecord {
  id: string;
  supplierId: string;
  linkedAnimalId: string;
  category: PurchaseCategory;
  itemName: string;
  purchaseDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  invoiceNumber: string;
  paymentStatus: PurchasePaymentStatus;
  notes: string;
  feedClassification: string;
  veterinaryPurpose: string;
  expirationDate: string;
  serviceType: string;
  operationalArea: string;
  createdAt: string;
}

export interface GalpaoRecord {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentBirdCount: number;
  mortalityThresholdPercent: number;
  location: string;
  notes: string;
  createdAt: string;
}

export type HealthProfessionalAccessLevel = 'visualizacao' | 'registro' | 'gestao';

export interface HealthProfessionalRecord {
  id: string;
  name: string;
  role: string;
  councilNumber: string;
  phone: string;
  email: string;
  accessLevel: HealthProfessionalAccessLevel;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

// Novas categorias de procedimentos (3 categorias principais)
export type HealthProcedureType = 'consulta' | 'tratamento' | 'monitoramento';

// Tipos históricos mantidos para retrocompatibilidade
export type LegacyHealthProcedureType = 'consulta' | 'tratamento' | 'vacina' | 'medicamento' | 'monitoramento' | 'outro';

export type HealthRecoveryStatus = 'em_tratamento' | 'recuperado' | 'monitoramento' | 'cronico';

export interface HealthRecord {
  id: string;
  occurredAt: string;
  procedureType: HealthProcedureType | LegacyHealthProcedureType;
  animalId: string;
  galpaoId?: string; // Opicional para monitoramento
  professionalId?: string; // Opicional para monitoramento
  title: string;
  diseaseName?: string;
  affectedBirdCount?: number;
  estimatedCost?: number;
  recoveryStatus?: HealthRecoveryStatus;
  notes: string;
  // Campos específicos para Consulta
  consultationCost?: number; // Valor monetário da consulta
  returnDate?: string; // Data de retorno
  // Campos específicos para Tratamento
  treatmentType?: 'vacina' | 'medicamento'; // Tipo de tratamento
  productName?: string; // Nome do produto (vacina/medicamento)
  applicationMethod?: string; // Método de aplicação
  treatmentDetails?: string; // Detalhes do tratamento
  nextDoseDate?: string; // Data da próxima dose
  // Campos históricos mantidos para retrocompatibilidade
  vaccineName?: string;
  medicationName?: string;
  createdAt: string;
}

// Interface para alertas de saúde
export interface HealthAlert {
  id: string;
  healthRecordId: string;
  type: 'next_dose' | 'return_visit';
  title: string;
  description: string;
  scheduledDate: string;
  isRead: boolean;
  readAt?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  createdAt: string;
}

export type VeterinaryStockCategory = 'vacina' | 'medicamento' | 'material' | 'outro';

export interface VeterinaryStockRecord {
  id: string;
  name: string;
  category: VeterinaryStockCategory;
  supplierId: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  expirationDate: string;
  storageLocation: string;
  costPerUnit: number;
  notes: string;
  createdAt: string;
}

export interface MortalityAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeInBytes: number;
  dataUrl: string;
  uploadedAt: string;
}

export type MortalityCause = 'doenca' | 'estresse_calor' | 'outros';
export type MortalityCauseStatus = 'suspeita' | 'confirmada';

export interface MortalityRecord {
  id: string;
  date: string;
  occurredAt?: string;
  galpaoId?: string;
  animalId: string;
  responsibleProfessionalId?: string;
  deadCount: number;
  causeStatus?: MortalityCauseStatus;
  cause: MortalityCause | string;
  notes: string;
  attachments?: MortalityAttachment[];
  createdAt: string;
  updatedAt?: string;
}

// New types for Manejo section
export type ManejoTurno = 'manha' | 'tarde';

export interface ManejoRecord {
  id: string;
  date: string;
  animalId: string;
  turno: ManejoTurno;
  ovosColetados: number;
  ovosDanificados: number;
  racaoKg: number;
  formulationId?: string;
  portaAberta: boolean;
  pesoMedioOvos: number;
  tamanhoOvos: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisponibilidadeVenda {
  id: string;
  date: string;
  galinhasVivas: number;
  galinhasLimpas: number;
  camaAviarioUnidades: number;
  createdAt: string;
  updatedAt: string;
}

export type ProdutoVenda = 'ovos' | 'galinhas_vivas' | 'galinhas_limpas' | 'cama_aviario';

export type FormaPagamento = 'dinheiro' | 'cartao' | 'pix';

export interface VendaRecord {
  id: string;
  date: string;
  clientId: string;
  produto: ProdutoVenda;
  quantidade: number;
  lote: string;
  formaPagamento: FormaPagamento;
  valorUnitario: number;
  valorTotal: number;
  notes: string;
  createdAt: string;
}

// Types for Formulacao section
export type NutritionalPhase = 'inicial_1_21' | 'crescimento_1_22_42' | 'crescimento_2_43_105' | 'pre_postura_106_126' | 'postura';

export interface IngredientRecord {
  id: string;
  name: string;
  dryMatter: number; // % Matéria Seca
  protein: number; // % PB (Proteína Bruta)
  energy: number; // kcal/kg EM (Energia Metabolizável)
  calcium: number; // % Cálcio
  phosphorusTotal: number; // % Fósforo Total
  phosphorusAvailable: number; // % Fósforo Disponível
  sodium: number; // % Sódio
  potassium: number; // % Potássio
  methionine: number; // % Metionina
  metCis: number; // % Metionina + Cistina
  lysine: number; // % Lisina
  threonine: number; // % Treonina
  tryptophan: number; // % Triptofano
  fiber: number; // % Fibra Bruta
  etherExtract: number; // % Extrato Etéreo
  price: number; // R$/kg
  stock: number; // kg
  dataSource: string; // Fonte da Informação
  referenceYear: number; // Ano da Referência
  lastUpdated: string; // Data da Última Atualização
  technicalNotes: string; // Observações Técnicas
  userEditable: boolean; // Permitir Edição pelo Usuário
  createdAt: string;
}

export interface FormulationIngredient {
  ingredientId: string;
  percentage: number;
}

export interface FormulationRecord {
  id: string;
  name: string;
  phase: NutritionalPhase;
  animalId?: string;
  ingredients: FormulationIngredient[];
  isActive: boolean;
  createdAt: string;
}

export interface FormulatedFeedStockRecord {
  id: string;
  formulationId: string;
  quantityKg: number;
  producedAt: string;
  createdAt: string;
}

export interface WeatherForecastItem {
  time: string;
  temperature: number;
  weatherCode: number;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  weatherCode: number;
}

export interface UnifiedWeatherData {
  temperature: number;
  feelsLike: number;
  temperatureMax: number;
  temperatureMin: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  description: string;
  weatherCode: number;
  uvIndex: number;
  precipitation: number;
  cloudCover: number;
  forecast12h: WeatherForecastItem[];
  forecast5d: DailyForecastItem[];
  location: string;
  lastUpdated: string;
  source: 'open-meteo' | 'openweather';
}

export interface Recommendation {
  id: string;
  tipo: 'alerta' | 'recomendacao' | 'sucesso';
  categoria?: 'clima' | 'nutricao' | 'sanidade' | 'producao' | 'geral';
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  knowledgeModuleId?: string;
}

export type InvestmentCategory = 'infraestrutura' | 'equipamentos' | 'mao_de_obra' | 'licencas' | 'outros';

export interface InvestmentItem {
  id: string;
  projectId: string;
  categoria: InvestmentCategory;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
}

export interface InvestmentProject {
  id: string;
  nome: string;
  status: 'planejamento' | 'em_andamento' | 'concluido' | 'cancelado';
  dataInicio: string;
  dataConclusao?: string;
  items: InvestmentItem[];
  isCustomized?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackupSnapshot {
  version: 1;
  exportedAt: string;
  personal: Omit<UserPersonalData, 'password'>;
  farmProfile: FarmProfileData;
  systemSettings: SystemSettingsData;
  backupSettings: BackupAutomationSettings;
  animals: AnimalRecord[];
  clients: ClientRecord[];
  suppliers: SupplierRecord[];
  galpoes: GalpaoRecord[];
  healthProfessionals: HealthProfessionalRecord[];
  healthRecords: HealthRecord[];
  veterinaryStock: VeterinaryStockRecord[];
  mortalityRecords: MortalityRecord[];
  manejoRecords: ManejoRecord[];
  disponibilidadeVenda: DisponibilidadeVenda[];
  vendas: VendaRecord[];
  ingredients: IngredientRecord[];
  formulations: FormulationRecord[];
  formulatedFeedStock: FormulatedFeedStockRecord[];
}

export interface BackupRecord {
  id: string;
  name: string;
  createdAt: string;
  snapshot: BackupSnapshot;
}

export type KnowledgeCategoryId =
  | 'fundamentos'
  | 'planejamento-da-granja'
  | 'instalacoes'
  | 'equipamentos'
  | 'genetica-e-linhagens'
  | 'manejo'
  | 'fases-da-producao'
  | 'nutricao'
  | 'formulacao-de-racao'
  | 'sanidade'
  | 'reproducao-e-incubacao'
  | 'producao-de-ovos'
  | 'comercializacao'
  | 'gestao'
  | 'sustentabilidade'
  | 'legislacao'
  | 'solucao-de-problemas'
  | 'biblioteca-tecnica'
  | 'faq'
  | 'ferramentas-tecnicas';

// Retrocompatibilidade: aceitar os antigos nomes de categoria
export type KnowledgeCategoryIdOrLegacy = KnowledgeCategoryId | 'instalações' | 'produção' | 'gestão' | 'negócios';

export type KnowledgeModuleId = string;

export interface KnowledgeCategory {
  id: KnowledgeCategoryId;
  title: string;
  summary: string;
  modules: KnowledgeModule[];
}

export interface KnowledgeParameter {
  name: string;
  unit?: string;
  idealValue?: string;
  minValue?: string;
  maxValue?: string;
  description: string;
}

export interface KnowledgeProblem {
  problem: string;
  possibleCauses: string[];
  recommendedSolutions: string[];
}

export interface KnowledgeChecklistItem {
  item: string;
  frequency: string;
  responsible: string;
  critical: boolean;
}

export interface KnowledgeIntelligentRule {
  rule: string;
  condition: string;
  action: string;
  priority: 'alta' | 'média' | 'baixa';
}

export interface KnowledgeModule {
  id: KnowledgeModuleId;
  title: string;
  category: KnowledgeCategoryIdOrLegacy;
  summary: string;
  introduction?: string;
  objectives?: string[];
  fundamentalConcepts?: string[];
  technicalContent: string[];
  bestPractices: string[];
  stepByStep?: string[];
  commonMistakes: string[];
  practicalChecklist?: KnowledgeChecklistItem[];
  technicalTables?: KnowledgeParameter[];
  expertTips?: string[];
  faq?: { question: string; answer: string }[];
  technicalSources: string[];
  // Campos mantidos para retrocompatibilidade
  objective?: string;
  importantParameters?: KnowledgeParameter[];
  commonProblems?: KnowledgeProblem[];
  managementChecklist?: KnowledgeChecklistItem[];
  intelligentRules?: KnowledgeIntelligentRule[];
}

export const THEME_PALETTES: Record<ThemePaletteId, ThemePalette> = {
  blue: {
    id: 'blue',
    name: 'Corporate (Azul Indigo)',
    colors: ['#3b82f6', '#2563eb', '#eff6ff'],
    themeVars: {
      primary: 'rgb(59, 130, 246)',
      primaryHover: 'rgb(37, 99, 235)',
      primaryActive: 'rgb(29, 78, 216)',
      bgContainer: 'rgba(59, 130, 246, 0.08)',
      bgMain: 'rgb(248, 250, 252)',
    },
  },
  green: {
    id: 'green',
    name: 'Tech Agro (Esmeralda)',
    colors: ['#10b981', '#059669', '#ecfdf5'],
    themeVars: {
      primary: 'rgb(16, 185, 129)',
      primaryHover: 'rgb(5, 150, 105)',
      primaryActive: 'rgb(4, 120, 87)',
      bgContainer: 'rgba(16, 185, 129, 0.08)',
      bgMain: 'rgb(244, 250, 246)',
    },
  },
  brown: {
    id: 'brown',
    name: 'Terracotta (Laranja Quente)',
    colors: ['#ea580c', '#c2410c', '#fff7ed'],
    themeVars: {
      primary: 'rgb(234, 88, 12)',
      primaryHover: 'rgb(194, 65, 12)',
      primaryActive: 'rgb(154, 52, 18)',
      bgContainer: 'rgba(234, 88, 12, 0.08)',
      bgMain: 'rgb(255, 251, 248)',
    },
  },
  yellow: {
    id: 'yellow',
    name: 'Sunset (Amarelo Ouro)',
    colors: ['#eab308', '#ca8a04', '#fefce8'],
    themeVars: {
      primary: 'rgb(234, 179, 8)',
      primaryHover: 'rgb(202, 138, 4)',
      primaryActive: 'rgb(161, 98, 7)',
      bgContainer: 'rgba(234, 179, 8, 0.08)',
      bgMain: 'rgb(254, 252, 232)',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Obsidian (Escuro Minimalista)',
    colors: ['#334155', '#1e293b', '#f8fafc'],
    themeVars: {
      primary: 'rgb(51, 65, 85)',
      primaryHover: 'rgb(30, 41, 59)',
      primaryActive: 'rgb(15, 23, 42)',
      bgContainer: 'rgba(51, 65, 85, 0.08)',
      bgMain: 'rgb(248, 250, 252)',
    },
  },
  custom: {
    id: 'custom',
    name: 'Personalizada (Sua Marca)',
    colors: ['#6366f1', '#4f46e5', '#eef2ff'],
    themeVars: {
      primary: 'rgb(99, 102, 241)',
      primaryHover: 'rgb(79, 70, 229)',
      primaryActive: 'rgb(67, 56, 202)',
      bgContainer: 'rgba(99, 102, 241, 0.08)',
      bgMain: 'rgb(248, 250, 252)',
    },
  },
};

// --- NEW: Intelligent Recommendation System Types ---
export type HeaterType =
  | 'campainha_eletrica'
  | 'campainha_gas'
  | 'aquecedor_infravermelho'
  | 'radiador_oleo'
  | 'nenhum'
  | 'outro';

export interface IntelligentRecommendationContext {
  lotId?: string;
  species?: string;
  ageDays: number;
  phase?: NutritionalPhase;
  birdCount: number;
  heaterType?: HeaterType;
  currentTemp?: number; // Current ambient temperature in °C
  weatherData?: UnifiedWeatherData;
  // Add more context fields as needed (region, equipment, etc.)
}

export type QuestionType = 'single_choice' | 'text' | 'number';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  placeholder?: string;
}

export interface PersonalizedTip {
  id: string;
  title: string;
  content: string;
  priority: 'alta' | 'media' | 'baixa';
  category: 'aquecimento' | 'nutricao' | 'sanidade' | 'instalacoes' | 'geral';
  sourceModule?: string;
}

export interface RecommendationFlow {
  id: string;
  name: string;
  triggers: (ctx: IntelligentRecommendationContext) => boolean;
  questions: Question[];
  getRecommendations: (ctx: IntelligentRecommendationContext, answers: Record<string, any>) => PersonalizedTip[];
}

export type VaccineApplicationMethod =
  | 'subcutanea'
  | 'spray'
  | 'ocular'
  | 'agua_bebida'
  | 'puncao_asa'
  | 'intramuscular';

export type VaccineCaipiraDose = 'unica' | 'primeira' | 'segunda' | 'reforco' | 'reforco_adulto';

export interface VaccineScheduleEntry {
  id: string;
  ageMinDays: number;
  ageMaxDays: number;
  targetAgeDays: number;
  vaccines: string[];
  applicationMethod: VaccineApplicationMethod;
  dose: VaccineCaipiraDose;
  isObligatory: boolean;
  pastureCritical: boolean;
  notes: string;
  category: 'incubatorio' | 'cria' | 'recria' | 'pre_postura' | 'postura_adulta';
  source: 'embrapa' | 'ima' | 'mapa' | 'programa_nacional_sanidade_aviaria';
  adjustmentForCaipira?: string;
}

export type LtiRiskRegionMG =
  | 'terras_altas_mantiqueira'
  | 'sul_minas'
  | 'demais_regioes';

export const LTI_RISK_MUNICIPIOS_MG: Record<LtiRiskRegionMG, string[]> = {
  terras_altas_mantiqueira: [
    'Itamonte', 'Itanhandu', 'Passa Quatro', 'Pouso Alto',
    'Caxambu', 'São Lourenço', 'Pocos de Caldas', 'Lambari',
  ],
  sul_minas: [
    'Poços de Caldas', 'Varginha', 'Passos', 'Alfenas',
    'Lavras', 'Três Corações', 'Itajubá', 'Santa Rita do Sapucaí',
  ],
  demais_regioes: [],
};

export interface CaipiraHealthRules {
  boubaAnticipada: boolean;
  ltiRecombinanteObrigatorio: boolean;
  coccidioseIncubatorio: boolean;
  vermifugacaoIntervaloMeses: 3 | 4;
  takeTestObrigatorio: boolean;
  biosseguridadePiqueteDrenagem: boolean;
  regiaoLTI: LtiRiskRegionMG;
}

export interface ScheduledVaccineReminder {
  id: string;
  animalId: string;
  animalTag: string;
  scheduleEntryId: string;
  vaccines: string[];
  applicationMethod: VaccineApplicationMethod;
  scheduledDate: string;
  ageAtScheduledDateDays: number;
  currentAgeDays: number;
  daysUntil: number;
  status: 'atrasado' | 'hoje' | 'pendente' | 'proximo' | 'concluido';
  pastureCritical: boolean;
  category: VaccineScheduleEntry['category'];
  notes: string;
  adjustmentNote?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface TakeTestReminder {
  id: string;
  animalId: string;
  animalTag: string;
  boubaAppliedDate: string;
  testDate: string;
  daysUntil: number;
  status: 'atrasado' | 'hoje' | 'pendente' | 'concluido';
}

export interface VermifugacaoReminder {
  id: string;
  animalId: string;
  animalTag: string;
  lastDewormingDate: string | null;
  scheduledDate: string;
  daysUntil: number;
  intervalMonths: 3 | 4;
  status: 'atrasado' | 'hoje' | 'pendente' | 'proximo';
  observation: string;
}
