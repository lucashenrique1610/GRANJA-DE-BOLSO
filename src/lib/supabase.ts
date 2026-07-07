import { createClient } from '@supabase/supabase-js';
import { assertPasswordPolicy } from '@/lib/passwordSecurity';
import type { PasswordPolicyContext } from '@/lib/passwordSecurity';
import {
  AnimalRecord,
  BackupAutomationSettings,
  BackupRecord,
  BackupSnapshot,
  ClientRecord,
  GalpaoRecord,
  HealthProfessionalRecord,
  HealthRecord,
  InvestmentProject,
  MortalityRecord,
  PurchaseRecord,
  SupplierRecord,
  ThemePaletteId,
  VeterinaryStockRecord,
  ManejoRecord,
  DisponibilidadeVenda,
  VendaRecord,
  IngredientRecord,
  FormulationRecord,
  FormulatedFeedStockRecord,
} from '@/types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export interface AuthSecurityFactorSummary {
  id: string;
  friendlyName: string;
  factorType: string;
  status: string;
  createdAt?: string;
}

export interface AuthSecurityStatus {
  email: string | null;
  emailConfirmed: boolean;
  emailConfirmedAt: string | null;
  currentLevel: string | null;
  nextLevel: string | null;
  factors: AuthSecurityFactorSummary[];
  verifiedTotpFactors: AuthSecurityFactorSummary[];
}

export interface TotpEnrollment {
  factorId: string;
  friendlyName: string;
  qrCodeSvg: string;
  secret: string;
  uri: string;
}

function isServiceRoleKey(key: string) {
  try {
    const parts = key.split('.');
    if (parts.length < 2) return false;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    return parsed?.role === 'service_role';
  } catch {
    return false;
  }
}

export const supabaseConfigIssue: 'missing' | 'service_role' | null =
  !supabaseUrl || !supabaseAnonKey ? 'missing' : isServiceRoleKey(supabaseAnonKey) ? 'service_role' : null;

export const isSupabaseConfigured = supabaseConfigIssue === null;

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

let billingAccessState = {
  allowed: true,
  reason: 'init',
};

export interface SupabaseUserRow {
  id: string;
  created_at?: string;
  full_name: string;
  email: string;
  phone?: string | null;
  app_role?: 'usuario' | 'moderador' | 'admin';
}

export interface SupabaseGranjaRow {
  id: string;
  created_at?: string;
  user_id: string;
  farm_name?: string;
  state?: string;
  city?: string;
  bird_count?: number;
  selected_palette?: string;
  marketing_source?: string;
  egg_sale_price?: number;
  bird_sale_price?: number;
  litter_sale_price?: number;
  auto_backup_enabled?: boolean;
  auto_backup_frequency?: string;
  auto_backup_last_run_at?: string | null;
  auto_backup_keep_count?: number;
}

interface SupabaseAnimalRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  supplier_id: string | null;
  tag: string;
  lot: string;
  species: string;
  purpose: string;
  breed: string;
  quantity: number;
  current_quantity: number | null;
  total_purchase_price: number;
  average_weight_kg: number;
  birth_date: string;
  status: string;
  notes: string;
}

interface SupabaseClientRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: string;
  notes: string;
}

interface SupabaseSupplierRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  company_name: string;
  contact_name: string;
  category: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: string;
  notes: string;
}

interface SupabasePurchaseRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  supplier_id: string | null;
  linked_animal_id: string | null;
  category: string;
  item_name: string;
  purchase_date: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  invoice_number: string;
  payment_status: string;
  notes: string;
  feed_classification: string;
  veterinary_purpose: string;
  expiration_date: string | null;
  service_type: string;
  operational_area: string;
}

interface SupabaseGalpaoRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  name: string;
  code: string;
  capacity: number;
  current_bird_count: number;
  mortality_threshold_percent: number;
  location: string;
  notes: string;
}

interface SupabaseHealthProfessionalRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  name: string;
  role: string;
  council_number: string;
  phone: string;
  email: string;
  access_level: string;
  is_active: boolean;
  notes: string;
}

interface SupabaseHealthRecordRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  occurred_at: string;
  procedure_type: string;
  animal_id: string;
  galpao_id?: string;
  professional_id?: string;
  title: string;
  disease_name?: string;
  affected_bird_count?: number;
  estimated_cost?: number;
  recovery_status?: string;
  notes: string;
  vaccine_name?: string;
  medication_name?: string;
  application_method?: string;
  treatment_details?: string;
  // Novos campos
  consultation_cost?: number;
  return_date?: string;
  treatment_type?: string;
  product_name?: string;
  next_dose_date?: string;
}

interface SupabaseVeterinaryStockRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  name: string;
  category: string;
  supplier_id: string | null;
  batch_number: string;
  quantity: number;
  unit: string;
  minimum_stock: number;
  expiration_date: string | null;
  storage_location: string;
  cost_per_unit: number;
  notes: string;
}


interface SupabaseMortalityRow {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  granja_id: string;
  date: string;
  animal_id: string;
  galpao_id?: string | null;
  responsible_professional_id?: string | null;
  dead_count: number;
  cause: string;
  notes: string;
  cause_status?: string | null;
}

interface SupabaseBackupRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string | null;
  name: string;
  snapshot: BackupSnapshot;
}

interface SupabaseManejoRow {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  granja_id: string;
  date: string;
  animal_id: string;
  turno: string;
  ovos_coletados: number;
  ovos_danificados: number;
  racao_kg: number;
  formulation_id?: string;
  porta_aberta: boolean;
  peso_medio_ovos: number;
  tamanho_ovos: string;
}

interface SupabaseDisponibilidadeRow {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  granja_id: string;
  date: string;
  galinhas_vivas: number;
  galinhas_limpas: number;
  cama_aviario_unidades: number;
}

interface SupabaseVendaRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  date: string;
  client_id: string;
  produto: string;
  quantidade: number;
  lote: string;
  forma_pagamento: string;
  valor_unitario: number;
  valor_total: number;
  notes: string;
}

interface SupabaseIngredientRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  name: string;
  dry_matter: number;
  protein: number;
  energy: number;
  calcium: number;
  phosphorus: number;
  phosphorus_total?: number;
  phosphorus_available?: number;
  sodium?: number;
  potassium?: number;
  methionine: number;
  met_cis: number;
  lysine: number;
  threonine?: number;
  tryptophan?: number;
  fiber: number;
  ether_extract?: number;
  price: number;
  stock: number;
  data_source?: string;
  reference_year?: number;
  last_updated?: string;
  technical_notes?: string;
  user_editable?: boolean;
}

interface SupabaseFormulationRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  name: string;
  phase: string;
  animal_id?: string;
  ingredients: any;
  is_active: boolean;
}

interface SupabaseFormulatedFeedStockRow {
  id: string;
  created_at?: string;
  user_id: string;
  granja_id: string;
  formulation_id: string;
  quantity_kg: number;
  produced_at: string;
}

function mapAnimalRow(row: SupabaseAnimalRow): AnimalRecord {
  return {
    id: row.id,
    tag: row.tag,
    supplierId: row.supplier_id ?? '',
    lot: row.lot,
    species: row.species,
    purpose: row.purpose,
    breed: row.breed,
    quantity: row.quantity,
    currentQuantity: Number(row.current_quantity ?? row.quantity ?? 0),
    totalPurchasePrice: Number(row.total_purchase_price ?? 0),
    averageWeightKg: Number(row.average_weight_kg ?? 0),
    birthDate: row.birth_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapClientRow(row: SupabaseClientRow): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    phone: row.phone,
    email: row.email,
    city: row.city,
    state: row.state,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapSupplierRow(row: SupabaseSupplierRow): SupplierRecord {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    category: row.category,
    phone: row.phone,
    email: row.email,
    city: row.city,
    state: row.state,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapPurchaseRow(row: SupabasePurchaseRow): PurchaseRecord {
  return {
    id: row.id,
    supplierId: row.supplier_id ?? '',
    linkedAnimalId: row.linked_animal_id ?? '',
    category: row.category as PurchaseRecord['category'],
    itemName: row.item_name,
    purchaseDate: row.purchase_date,
    quantity: Number(row.quantity ?? 0),
    unit: row.unit,
    unitPrice: Number(row.unit_price ?? 0),
    totalPrice: Number(row.total_price ?? 0),
    invoiceNumber: row.invoice_number,
    paymentStatus: row.payment_status as PurchaseRecord['paymentStatus'],
    notes: row.notes,
    feedClassification: row.feed_classification,
    veterinaryPurpose: row.veterinary_purpose,
    expirationDate: row.expiration_date ?? '',
    serviceType: row.service_type,
    operationalArea: row.operational_area,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapGalpaoRow(row: SupabaseGalpaoRow): GalpaoRecord {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    capacity: Number(row.capacity ?? 0),
    currentBirdCount: Number(row.current_bird_count ?? 0),
    mortalityThresholdPercent: Number(row.mortality_threshold_percent ?? 5),
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapHealthProfessionalRow(row: SupabaseHealthProfessionalRow): HealthProfessionalRecord {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    councilNumber: row.council_number,
    phone: row.phone,
    email: row.email,
    accessLevel: row.access_level as HealthProfessionalRecord['accessLevel'],
    isActive: Boolean(row.is_active),
    notes: row.notes,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapHealthRecordRow(row: SupabaseHealthRecordRow): HealthRecord {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    procedureType: row.procedure_type as HealthRecord['procedureType'],
    animalId: row.animal_id,
    galpaoId: row.galpao_id,
    professionalId: row.professional_id,
    title: row.title,
    diseaseName: row.disease_name,
    affectedBirdCount: row.affected_bird_count !== undefined ? Number(row.affected_bird_count) : undefined,
    estimatedCost: row.estimated_cost !== undefined ? Number(row.estimated_cost) : undefined,
    recoveryStatus: row.recovery_status as HealthRecord['recoveryStatus'],
    notes: row.notes,
    vaccineName: row.vaccine_name,
    medicationName: row.medication_name,
    applicationMethod: row.application_method,
    treatmentDetails: row.treatment_details,
    // Novos campos
    consultationCost: row.consultation_cost !== undefined ? Number(row.consultation_cost) : undefined,
    returnDate: row.return_date,
    treatmentType: row.treatment_type as HealthRecord['treatmentType'],
    productName: row.product_name,
    nextDoseDate: row.next_dose_date,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapVeterinaryStockRow(row: SupabaseVeterinaryStockRow): VeterinaryStockRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category as VeterinaryStockRecord['category'],
    supplierId: row.supplier_id ?? '',
    batchNumber: row.batch_number,
    quantity: Number(row.quantity ?? 0),
    unit: row.unit,
    minimumStock: Number(row.minimum_stock ?? 0),
    expirationDate: row.expiration_date ?? '',
    storageLocation: row.storage_location,
    costPerUnit: Number(row.cost_per_unit ?? 0),
    notes: row.notes,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapMortalityRow(row: SupabaseMortalityRow): MortalityRecord {
  return {
    id: row.id,
    date: row.date,
    animalId: row.animal_id,
    galpaoId: row.galpao_id,
    responsibleProfessionalId: row.responsible_professional_id,
    deadCount: Number(row.dead_count ?? 0),
    cause: row.cause as MortalityRecord['cause'],
    notes: row.notes,
    causeStatus: (row.cause_status as any) || null,
    attachments: [],
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function mapManejoRow(row: SupabaseManejoRow): ManejoRecord {
  return {
    id: row.id,
    date: row.date,
    animalId: row.animal_id,
    turno: row.turno as ManejoRecord['turno'],
    ovosColetados: Number(row.ovos_coletados ?? 0),
    ovosDanificados: Number(row.ovos_danificados ?? 0),
    racaoKg: Number(row.racao_kg ?? 0),
    formulationId: row.formulation_id,
    portaAberta: Boolean(row.porta_aberta),
    pesoMedioOvos: Number(row.peso_medio_ovos ?? 0),
    tamanhoOvos: row.tamanho_ovos,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function mapDisponibilidadeRow(row: SupabaseDisponibilidadeRow): DisponibilidadeVenda {
  return {
    id: row.id,
    date: row.date,
    galinhasVivas: Number(row.galinhas_vivas ?? 0),
    galinhasLimpas: Number(row.galinhas_limpas ?? 0),
    camaAviarioUnidades: Number(row.cama_aviario_unidades ?? 0),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function mapVendaRow(row: SupabaseVendaRow): VendaRecord {
  return {
    id: row.id,
    date: row.date,
    clientId: row.client_id,
    produto: row.produto as VendaRecord['produto'],
    quantidade: Number(row.quantidade ?? 0),
    lote: row.lote,
    formaPagamento: row.forma_pagamento as VendaRecord['formaPagamento'],
    valorUnitario: Number(row.valor_unitario ?? 0),
    valorTotal: Number(row.valor_total ?? 0),
    notes: row.notes,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapIngredientRow(row: any): IngredientRecord {
  return {
    id: row.id,
    name: row.name,
    dryMatter: Number(row.dry_matter ?? 88),
    protein: Number(row.protein ?? 0),
    energy: Number(row.energy ?? 0),
    calcium: Number(row.calcium ?? 0),
    phosphorusTotal: Number(row.phosphorus_total ?? row.phosphorus ?? 0),
    phosphorusAvailable: Number(row.phosphorus_available ?? row.phosphorus ?? 0),
    sodium: Number(row.sodium ?? 0),
    potassium: Number(row.potassium ?? 0),
    methionine: Number(row.methionine ?? 0),
    metCis: Number(row.met_cis ?? 0),
    lysine: Number(row.lysine ?? 0),
    threonine: Number(row.threonine ?? 0),
    tryptophan: Number(row.tryptophan ?? 0),
    fiber: Number(row.fiber ?? 0),
    etherExtract: Number(row.ether_extract ?? 0),
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    dataSource: row.data_source ?? '',
    referenceYear: Number(row.reference_year ?? new Date().getFullYear()),
    lastUpdated: row.last_updated ?? new Date().toISOString(),
    technicalNotes: row.technical_notes ?? '',
    userEditable: row.user_editable !== undefined ? Boolean(row.user_editable) : true,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapFormulationRow(row: SupabaseFormulationRow): FormulationRecord {
  return {
    id: row.id,
    name: row.name,
    phase: row.phase as FormulationRecord['phase'],
    animalId: (row as any).animal_id,
    ingredients: row.ingredients,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapFormulatedFeedStockRow(row: SupabaseFormulatedFeedStockRow): FormulatedFeedStockRecord {
  return {
    id: row.id,
    formulationId: row.formulation_id,
    quantityKg: Number(row.quantity_kg ?? 0),
    producedAt: row.produced_at,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function normalizeBackupSnapshot(snapshot: BackupSnapshot): BackupSnapshot {
  const paletteId = snapshot?.systemSettings?.selectedPalette;
  const fallbackPalette = snapshot?.farmProfile?.selectedPalette;
  const selectedPalette =
    paletteId
      ? paletteId
      : fallbackPalette
        ? fallbackPalette
        : 'blue';

  return {
    version: 1,
    exportedAt: snapshot?.exportedAt || new Date().toISOString(),
    personal: {
      fullName: snapshot?.personal?.fullName || '',
      email: snapshot?.personal?.email || '',
      phone: snapshot?.personal?.phone || '',
    },
    farmProfile: {
      farmName: snapshot?.farmProfile?.farmName || '',
      state: snapshot?.farmProfile?.state || '',
      city: snapshot?.farmProfile?.city || '',
      birdCount: Number(snapshot?.farmProfile?.birdCount ?? 0),
      selectedPalette,
      marketingSource: snapshot?.farmProfile?.marketingSource || '',
    },
    systemSettings: {
      selectedPalette,
      fontFamily: (snapshot?.systemSettings as any)?.fontFamily || 'inter',
      borderRadius: (snapshot?.systemSettings as any)?.borderRadius || 'rounded',
      eggSalePrice: Number(snapshot?.systemSettings?.eggSalePrice ?? 0),
      birdSalePrice: Number(snapshot?.systemSettings?.birdSalePrice ?? 0),
      litterSalePrice: Number(snapshot?.systemSettings?.litterSalePrice ?? 0),
      weather: snapshot?.systemSettings?.weather || {
        display: {
          currentTemp: true,
          feelsLike: true,
          humidity: true,
          windSpeed: true,
          condition: true,
          dailyForecast: true,
          uvIndex: true,
          precipitation: true,
          pressure: true,
          visibility: true,
        },
        recentLocations: [],
      },
    },
    backupSettings: {
      enabled: Boolean(snapshot?.backupSettings?.enabled),
      frequency:
        snapshot?.backupSettings?.frequency === 'daily' ||
        snapshot?.backupSettings?.frequency === 'weekly' ||
        snapshot?.backupSettings?.frequency === 'monthly'
          ? snapshot.backupSettings.frequency
          : 'weekly',
      lastRunAt: snapshot?.backupSettings?.lastRunAt || '',
      keepCount: Math.max(1, Number(snapshot?.backupSettings?.keepCount ?? 10)),
    },
    animals: Array.isArray(snapshot?.animals) ? snapshot.animals : [],
    clients: Array.isArray(snapshot?.clients) ? snapshot.clients : [],
    suppliers: Array.isArray(snapshot?.suppliers) ? snapshot.suppliers : [],
    galpoes: Array.isArray(snapshot?.galpoes) ? snapshot.galpoes : [],
    healthProfessionals: Array.isArray(snapshot?.healthProfessionals) ? snapshot.healthProfessionals : [],
    healthRecords: Array.isArray(snapshot?.healthRecords) ? snapshot.healthRecords : [],
    veterinaryStock: Array.isArray(snapshot?.veterinaryStock) ? snapshot.veterinaryStock : [],
    mortalityRecords: Array.isArray(snapshot?.mortalityRecords) ? snapshot.mortalityRecords : [],
    manejoRecords: Array.isArray(snapshot?.manejoRecords) ? snapshot.manejoRecords : [],
    disponibilidadeVenda: Array.isArray(snapshot?.disponibilidadeVenda) ? snapshot.disponibilidadeVenda : [],
    vendas: Array.isArray(snapshot?.vendas) ? snapshot.vendas : [],
    ingredients: Array.isArray(snapshot?.ingredients) ? snapshot.ingredients : [],
    formulations: Array.isArray(snapshot?.formulations) ? snapshot.formulations : [],
    formulatedFeedStock: Array.isArray(snapshot?.formulatedFeedStock) ? snapshot.formulatedFeedStock : [],
  };
}

const BACKUP_COLLECTION_KEYS = [
  'animals',
  'clients',
  'suppliers',
  'galpoes',
  'healthProfessionals',
  'healthRecords',
  'veterinaryStock',
  'mortalityRecords',
  'manejoRecords',
  'disponibilidadeVenda',
  'vendas',
  'ingredients',
  'formulations',
  'formulatedFeedStock',
] as const;

function isValidDateValue(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function validateBackupSnapshot(snapshot: BackupSnapshot): BackupSnapshot {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('Arquivo de backup inválido. Estrutura principal não reconhecida.');
  }

  if (snapshot.version !== 1) {
    throw new Error('Versão de backup não suportada. Gere um novo backup antes de restaurar.');
  }

  if (!snapshot.exportedAt || !isValidDateValue(snapshot.exportedAt)) {
    throw new Error('Arquivo de backup inválido. Data de exportação ausente ou corrompida.');
  }

  const normalized = normalizeBackupSnapshot(snapshot);

  if (!normalized.personal.email.trim()) {
    throw new Error('Arquivo de backup inválido. Email do proprietário não foi encontrado.');
  }

  if (!normalized.farmProfile.farmName.trim()) {
    throw new Error('Arquivo de backup inválido. Nome da granja não foi encontrado.');
  }

  let totalRecords = 0;
  for (const key of BACKUP_COLLECTION_KEYS) {
    const records = normalized[key];
    if (!Array.isArray(records)) {
      throw new Error(`Arquivo de backup inválido. A coleção "${key}" está corrompida.`);
    }

    if (records.length > 10000) {
      throw new Error(`Arquivo de backup inválido. A coleção "${key}" excede o limite de segurança.`);
    }

    totalRecords += records.length;
  }

  if (totalRecords > 50000) {
    throw new Error('Arquivo de backup inválido. O volume total de registros excede o limite de segurança.');
  }

  return normalized;
}

export function getBackupAutomationSettingsFromGranja(granja: SupabaseGranjaRow | null): BackupAutomationSettings {
  return {
    enabled: Boolean(granja?.auto_backup_enabled),
    frequency:
      granja?.auto_backup_frequency === 'daily' ||
      granja?.auto_backup_frequency === 'weekly' ||
      granja?.auto_backup_frequency === 'monthly'
        ? granja.auto_backup_frequency
        : 'weekly',
    lastRunAt: granja?.auto_backup_last_run_at ?? '',
    keepCount: Math.max(1, Number(granja?.auto_backup_keep_count ?? 10)),
  };
}

function mapBackupRow(row: SupabaseBackupRow): BackupRecord {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at ?? new Date().toISOString(),
    snapshot: normalizeBackupSnapshot(row.snapshot),
  };
}

async function getAuthenticatedUserAndGranja(requireGranja = true) {
  assertBillingAccess();
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const granja = await getMyLatestGranja();
  if (!granja && requireGranja) {
    throw new Error('Nenhuma granja encontrada para o usuário. Finalize o cadastro inicial da granja antes de continuar.');
  }

  return {
    userId: userData.user.id,
    granjaId: granja?.id ?? null,
  };
}

function applyGranjaScope<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  granjaId: string | null,
): T {
  return granjaId ? query.eq('granja_id', granjaId) : query;
}

function requireSupabase() {
  if (!supabase) {
    if (supabaseConfigIssue === 'service_role') {
      throw new Error('Chave inválida no front-end: você configurou uma service_role key. Use a anon public key.');
    }
    throw new Error('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

export function setBillingAccessState(nextState: { allowed: boolean; reason?: string }) {
  billingAccessState = {
    allowed: nextState.allowed,
    reason: nextState.reason || 'unknown',
  };
}

function assertBillingAccess() {
  if (billingAccessState.allowed) {
    return;
  }

  throw new Error('Seu acesso ao aplicativo está bloqueado. Escolha um plano na seção Assinatura para continuar.');
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { full_name?: string; phone?: string },
) {
  const sb = requireSupabase();
  const normalizedEmail = email.trim().toLowerCase();
  const fullName = metadata?.full_name?.trim();
  const phone = metadata?.phone?.trim();
  const normalizedMetadata = {
    ...(fullName ? { full_name: fullName } : {}),
    ...(phone ? { phone } : {}),
  };

  assertPasswordPolicy(password, {
    email: normalizedEmail,
    fullName,
    phone,
  });

  const signUpPayload =
    Object.keys(normalizedMetadata).length > 0
      ? {
          email: normalizedEmail,
          password,
          options: {
            data: normalizedMetadata,
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        }
      : {
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        };

  const { data, error } = await sb.auth.signUp(signUpPayload);
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  return data;
}

export async function resendSignupConfirmationEmail(email: string) {
  const sb = requireSupabase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Informe o e-mail para reenviar a confirmação.');

  const emailRedirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { data, error } = await sb.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
  if (error) throw error;
  return data;
}

export async function requestPasswordResetEmail(email: string) {
  const sb = requireSupabase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Informe o e-mail da conta para redefinir a senha.');

  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
  const { data, error } = await sb.auth.resetPasswordForEmail(
    normalizedEmail,
    redirectTo ? { redirectTo } : undefined,
  );
  if (error) throw error;
  return data;
}

export async function updateCurrentUserPassword(password: string, context: PasswordPolicyContext = {}) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;

  assertPasswordPolicy(password, {
    ...context,
    email: context.email ?? userData.user?.email ?? undefined,
  });

  const { data, error } = await sb.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

function mapFactorSummary(factor: any): AuthSecurityFactorSummary {
  return {
    id: factor.id,
    friendlyName: factor.friendly_name || 'Aplicativo autenticador',
    factorType: factor.factor_type || factor.factorType || 'unknown',
    status: factor.status || 'unknown',
    createdAt: factor.created_at,
  };
}

export async function getAuthSecurityStatus(): Promise<AuthSecurityStatus> {
  const sb = requireSupabase();
  const [{ data: userData, error: userError }, { data: factorsData, error: factorsError }, { data: aalData, error: aalError }] =
    await Promise.all([
      sb.auth.getUser(),
      sb.auth.mfa.listFactors(),
      sb.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

  if (userError) throw userError;
  if (factorsError) throw factorsError;
  if (aalError) throw aalError;

  const user = userData.user;
  const allFactors = (factorsData?.all ?? []).map(mapFactorSummary);
  const verifiedTotpFactors = allFactors.filter((factor) => factor.factorType === 'totp' && factor.status === 'verified');
  const emailConfirmedAt = user?.email_confirmed_at || (user as any)?.confirmed_at || null;

  return {
    email: user?.email ?? null,
    emailConfirmed: Boolean(emailConfirmedAt),
    emailConfirmedAt,
    currentLevel: aalData?.currentLevel ?? null,
    nextLevel: aalData?.nextLevel ?? null,
    factors: allFactors,
    verifiedTotpFactors,
  };
}

export async function enrollTotpMfa(friendlyName = 'Granja de Bolso') {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  });

  if (error) throw error;

  return {
    factorId: data.id,
    friendlyName: data.friendly_name || friendlyName,
    qrCodeSvg: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  } satisfies TotpEnrollment;
}

export async function verifyTotpMfa(factorId: string, code: string) {
  const sb = requireSupabase();
  const normalizedCode = code.trim();
  if (!normalizedCode) throw new Error('Informe o código do aplicativo autenticador.');

  const { data, error } = await sb.auth.mfa.challengeAndVerify({
    factorId,
    code: normalizedCode,
  });
  if (error) throw error;
  return data;
}

export async function unenrollMfaFactor(factorId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = requireSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

export async function startMyTrial15Days() {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('start_my_trial_15_days');
  if (error) throw error;
  return data;
}


export async function getMyUser() {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await sb
    .from('users')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  
  // Make sure phone is optional even if the table doesn't have it
  if (data && data.phone === undefined) {
    (data as any).phone = null;
  }
  
  return data as any;
}

export async function upsertMyUser(user: { full_name: string; email: string; phone?: string | null }) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  // 1. Tenta com payload completo
  const fullPayload: any = {
    id: userData.user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
  };

  try {
    const { data, error } = await sb
      .from('users')
      .upsert(fullPayload, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error) {
      return data as SupabaseUserRow;
    }
    console.warn('[upsertMyUser] Erro com payload completo:', error);
  } catch (e) {
    console.warn('[upsertMyUser] Exceção com payload completo:', e);
  }

  // 2. Tenta com payload mínimo (sem phone)
  const minimalPayload: any = {
    id: userData.user.id,
    full_name: user.full_name,
    email: user.email,
  };

  try {
    const { data, error } = await sb
      .from('users')
      .upsert(minimalPayload, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error) {
      return data as SupabaseUserRow;
    }
    console.warn('[upsertMyUser] Erro com payload mínimo:', error);
    throw error; // Lança o erro para o app tratar
  } catch (e) {
    console.error('[upsertMyUser] Falha total:', e);
    throw e;
  }
}

export async function listUsers() {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseUserRow[];
}

export async function createMyGranja(granja: Partial<Omit<SupabaseGranjaRow, 'id' | 'created_at' | 'user_id'>>) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  // 1. Tenta com payload completo
  const fullPayload: any = {
    user_id: userData.user.id,
    farm_name: granja.farm_name || '',
    state: granja.state || '',
    city: granja.city || '',
    bird_count: granja.bird_count || 0,
    selected_palette: granja.selected_palette || 'blue',
    marketing_source: granja.marketing_source || '',
    egg_sale_price: granja.egg_sale_price || 0,
    bird_sale_price: granja.bird_sale_price || 0,
    litter_sale_price: granja.litter_sale_price || 0,
    auto_backup_enabled: granja.auto_backup_enabled || false,
    auto_backup_frequency: granja.auto_backup_frequency || 'weekly',
    auto_backup_last_run_at: granja.auto_backup_last_run_at || null,
    auto_backup_keep_count: granja.auto_backup_keep_count || 10,
  };

  try {
    const { data, error } = await sb
      .from('granjas')
      .insert([fullPayload])
      .select('*')
      .single();

    if (!error) {
      return fillMissingGranjaFields({
        ...data,
        ...granja,
      });
    }
    console.warn('[createMyGranja] Erro com payload completo:', error);
  } catch (e) {
    console.warn('[createMyGranja] Exceção com payload completo:', e);
  }

  // 2. Tenta com payload médio (sem backup)
  const mediumPayload: any = {
    user_id: userData.user.id,
    farm_name: granja.farm_name || '',
    state: granja.state || '',
    city: granja.city || '',
    bird_count: granja.bird_count || 0,
    selected_palette: granja.selected_palette || 'blue',
    marketing_source: granja.marketing_source || '',
    egg_sale_price: granja.egg_sale_price || 0,
    bird_sale_price: granja.bird_sale_price || 0,
    litter_sale_price: granja.litter_sale_price || 0,
  };

  try {
    const { data, error } = await sb
      .from('granjas')
      .insert([mediumPayload])
      .select('*')
      .single();

    if (!error) {
      return fillMissingGranjaFields({
        ...data,
        ...granja,
      });
    }
    console.warn('[createMyGranja] Erro com payload médio:', error);
  } catch (e) {
    console.warn('[createMyGranja] Exceção com payload médio:', e);
  }

  // 3. Tenta com payload mínimo (apenas campos essenciais)
  const minimalPayload: any = {
    user_id: userData.user.id,
    farm_name: granja.farm_name || '',
    state: granja.state || '',
    city: granja.city || '',
    bird_count: granja.bird_count || 0,
  };

  try {
    const { data, error } = await sb
      .from('granjas')
      .insert([minimalPayload])
      .select('*')
      .single();

    if (!error) {
      return fillMissingGranjaFields({
        ...data,
        ...granja,
      });
    }
    console.warn('[createMyGranja] Erro com payload mínimo:', error);
    throw error;
  } catch (e) {
    console.error('[createMyGranja] Falha total:', e);
    throw e;
  }
}

function fillMissingGranjaFields(granja: any): SupabaseGranjaRow {
  return {
    id: granja.id,
    created_at: granja.created_at,
    user_id: granja.user_id,
    farm_name: granja.farm_name || '',
    state: granja.state || '',
    city: granja.city || '',
    bird_count: Number(granja.bird_count || 0),
    selected_palette: granja.selected_palette || 'blue',
    marketing_source: granja.marketing_source || '',
    egg_sale_price: Number(granja.egg_sale_price || 0),
    bird_sale_price: Number(granja.bird_sale_price || 0),
    litter_sale_price: Number(granja.litter_sale_price || 0),
    auto_backup_enabled: Boolean(granja.auto_backup_enabled || false),
    auto_backup_frequency: granja.auto_backup_frequency || 'weekly',
    auto_backup_last_run_at: granja.auto_backup_last_run_at || null,
    auto_backup_keep_count: Number(granja.auto_backup_keep_count || 10),
  };
}

export async function updateMyGranja(
  granjaId: string,
  granja: Partial<Omit<SupabaseGranjaRow, 'id' | 'created_at' | 'user_id'>>,
) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  // 1. Tenta com payload completo
  try {
    const fullUpdate: any = {};
    if (granja.farm_name !== undefined) fullUpdate.farm_name = granja.farm_name;
    if (granja.state !== undefined) fullUpdate.state = granja.state;
    if (granja.city !== undefined) fullUpdate.city = granja.city;
    if (granja.bird_count !== undefined) fullUpdate.bird_count = granja.bird_count;
    if (granja.selected_palette !== undefined) fullUpdate.selected_palette = granja.selected_palette;
    if (granja.marketing_source !== undefined) fullUpdate.marketing_source = granja.marketing_source;
    if (granja.egg_sale_price !== undefined) fullUpdate.egg_sale_price = granja.egg_sale_price;
    if (granja.bird_sale_price !== undefined) fullUpdate.bird_sale_price = granja.bird_sale_price;
    if (granja.litter_sale_price !== undefined) fullUpdate.litter_sale_price = granja.litter_sale_price;
    if (granja.auto_backup_enabled !== undefined) fullUpdate.auto_backup_enabled = granja.auto_backup_enabled;
    if (granja.auto_backup_frequency !== undefined) fullUpdate.auto_backup_frequency = granja.auto_backup_frequency;
    if (granja.auto_backup_last_run_at !== undefined) fullUpdate.auto_backup_last_run_at = granja.auto_backup_last_run_at;
    if (granja.auto_backup_keep_count !== undefined) fullUpdate.auto_backup_keep_count = granja.auto_backup_keep_count;
    const { data, error } = await sb
      .from('granjas')
      .update(fullUpdate)
      .eq('id', granjaId)
      .eq('user_id', userData.user.id)
      .select('*')
      .single();

    if (!error) {
      return fillMissingGranjaFields({
        ...data,
        ...granja,
      });
    }
    console.warn('[updateMyGranja] Erro com payload completo:', error);
  } catch (e) {
    console.warn('[updateMyGranja] Exceção com payload completo:', e);
  }

  // 2. Tenta com payload médio (sem backup)
  try {
    const mediumUpdate: any = {};
    if (granja.farm_name !== undefined) mediumUpdate.farm_name = granja.farm_name;
    if (granja.state !== undefined) mediumUpdate.state = granja.state;
    if (granja.city !== undefined) mediumUpdate.city = granja.city;
    if (granja.bird_count !== undefined) mediumUpdate.bird_count = granja.bird_count;
    if (granja.selected_palette !== undefined) mediumUpdate.selected_palette = granja.selected_palette;
    if (granja.marketing_source !== undefined) mediumUpdate.marketing_source = granja.marketing_source;
    if (granja.egg_sale_price !== undefined) mediumUpdate.egg_sale_price = granja.egg_sale_price;
    if (granja.bird_sale_price !== undefined) mediumUpdate.bird_sale_price = granja.bird_sale_price;
    if (granja.litter_sale_price !== undefined) mediumUpdate.litter_sale_price = granja.litter_sale_price;
    const { data, error } = await sb
      .from('granjas')
      .update(mediumUpdate)
      .eq('id', granjaId)
      .eq('user_id', userData.user.id)
      .select('*')
      .single();

    if (!error) {
      return fillMissingGranjaFields({
        ...data,
        ...granja,
      });
    }
    console.warn('[updateMyGranja] Erro com payload médio:', error);
  } catch (e) {
    console.warn('[updateMyGranja] Exceção com payload médio:', e);
  }

  // 3. Tenta com payload mínimo (apenas campos essenciais)
  try {
    const minimalUpdate: any = {};
    if (granja.farm_name !== undefined) minimalUpdate.farm_name = granja.farm_name;
    if (granja.state !== undefined) minimalUpdate.state = granja.state;
    if (granja.city !== undefined) minimalUpdate.city = granja.city;
    if (granja.bird_count !== undefined) minimalUpdate.bird_count = granja.bird_count;
    const { data, error } = await sb
      .from('granjas')
      .update(minimalUpdate)
      .eq('id', granjaId)
      .eq('user_id', userData.user.id)
      .select('*')
      .single();

    if (!error) {
      return fillMissingGranjaFields({
        ...data,
        ...granja,
      });
    }
    console.warn('[updateMyGranja] Erro com payload mínimo:', error);
    throw error;
  } catch (e) {
    console.error('[updateMyGranja] Falha total:', e);
    throw e;
  }
}

export async function updateMyGranjaAutoBackupSettings(
  granjaId: string,
  settings: {
    auto_backup_enabled: boolean;
    auto_backup_frequency: BackupAutomationSettings['frequency'];
    auto_backup_last_run_at: string | null;
    auto_backup_keep_count: number;
  },
) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const { data, error } = await sb
    .from('granjas')
    .update({
      auto_backup_enabled: settings.auto_backup_enabled,
      auto_backup_frequency: settings.auto_backup_frequency,
      auto_backup_last_run_at: settings.auto_backup_last_run_at,
      auto_backup_keep_count: settings.auto_backup_keep_count,
    })
    .eq('id', granjaId)
    .eq('user_id', userData.user.id)
    .select('*')
    .single();

  if (error) throw error;
  return fillMissingGranjaFields(data as SupabaseGranjaRow);
}

export async function updateMyGranjaBirdCount(granjaId: string, birdCount: number) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  try {
    const { data, error } = await sb
      .from('granjas')
      .update({ bird_count: Math.max(0, Math.round(birdCount)) })
      .eq('id', granjaId)
      .eq('user_id', userData.user.id)
      .select('*')
      .single();

    if (!error && data) {
      return fillMissingGranjaFields(data as any);
    }
  } catch (e) {
    console.warn('Updating bird count failed, returning mock...');
  }

  return fillMissingGranjaFields({
    id: granjaId,
    user_id: userData.user.id,
    bird_count: Math.max(0, Math.round(birdCount)),
  });
}

export async function getMyLatestGranja() {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) return null;
  if (!userData.user) return null;

  // Tenta várias abordagens para carregar a granja REAL do banco de dados
  // 1. Tenta com todas as colunas
  try {
    const { data, error } = await sb
      .from('granjas')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return fillMissingGranjaFields(data);
    }
    if (error) console.warn('[getMyLatestGranja] Erro com todas as colunas:', error);
  } catch (e) {
    console.warn('[getMyLatestGranja] Exceção com todas as colunas:', e);
  }

  // 2. Tenta com apenas as colunas básicas
  try {
    const { data, error } = await sb
      .from('granjas')
      .select('id, created_at, user_id, farm_name, state, city, bird_count, selected_palette, marketing_source')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return fillMissingGranjaFields(data);
    }
    if (error) console.warn('[getMyLatestGranja] Erro com colunas básicas:', error);
  } catch (e) {
    console.warn('[getMyLatestGranja] Exceção com colunas básicas:', e);
  }

  // 3. Tenta com o mínimo de colunas (apenas id e user_id)
  try {
    const { data, error } = await sb
      .from('granjas')
      .select('id, user_id, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      // Pega os dados do localStorage para completar
      const savedState = localStorage.getItem('granjadebolso_onboarding_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        return fillMissingGranjaFields({
          ...data,
          farm_name: parsedState.farm?.farmName || '',
          state: parsedState.farm?.state || '',
          city: parsedState.farm?.city || '',
          bird_count: parsedState.farm?.birdCount || 0,
          selected_palette: parsedState.selectedPalette || 'blue',
          marketing_source: parsedState.marketingSource || '',
          egg_sale_price: parsedState.systemSettings?.eggSalePrice || 0,
          bird_sale_price: parsedState.systemSettings?.birdSalePrice || 0,
          litter_sale_price: parsedState.systemSettings?.litterSalePrice || 0,
          auto_backup_enabled: false,
          auto_backup_frequency: 'weekly',
          auto_backup_last_run_at: null,
          auto_backup_keep_count: 10,
        });
      }
      
      return fillMissingGranjaFields({
        ...data,
        farm_name: '',
        state: '',
        city: '',
        bird_count: 0,
        selected_palette: 'blue',
        marketing_source: '',
        egg_sale_price: 0,
        bird_sale_price: 0,
        litter_sale_price: 0,
        auto_backup_enabled: false,
        auto_backup_frequency: 'weekly',
        auto_backup_last_run_at: null,
        auto_backup_keep_count: 10,
      });
    }
    if (error) console.warn('[getMyLatestGranja] Erro com colunas mínimas:', error);
  } catch (e) {
    console.warn('[getMyLatestGranja] Exceção com colunas mínimas:', e);
  }
  return null;
}

export async function listMyAnimals() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('animais').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapAnimalRow(row as SupabaseAnimalRow));
}

export async function upsertMyAnimal(record: AnimalRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    supplier_id: record.supplierId || null,
    tag: record.tag,
    lot: record.lot,
    species: record.species,
    purpose: record.purpose,
    breed: record.breed,
    quantity: record.quantity,
    current_quantity: record.currentQuantity ?? record.quantity,
    total_purchase_price: record.totalPurchasePrice,
    average_weight_kg: record.averageWeightKg,
    birth_date: record.birthDate,
    status: record.status,
    notes: record.notes,
  };

  const { data, error } = await sb.from('animais').upsert(payload).select('*').single();
  if (error) throw error;
  return mapAnimalRow(data as SupabaseAnimalRow);
}

export async function deleteMyAnimal(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb.from('animais').delete().eq('id', id).eq('user_id', userId).eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyClients() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('clientes').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapClientRow(row as SupabaseClientRow));
}

export async function upsertMyClient(record: ClientRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    name: record.name,
    document: record.document,
    phone: record.phone,
    email: record.email,
    city: record.city,
    state: record.state,
    status: record.status,
    notes: record.notes,
  };

  const { data, error } = await sb.from('clientes').upsert(payload).select('*').single();
  if (error) throw error;
  return mapClientRow(data as SupabaseClientRow);
}

export async function deleteMyClient(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb.from('clientes').delete().eq('id', id).eq('user_id', userId).eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMySuppliers() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('fornecedores').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapSupplierRow(row as SupabaseSupplierRow));
}

export async function upsertMySupplier(record: SupplierRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    company_name: record.companyName,
    contact_name: record.contactName,
    category: record.category,
    phone: record.phone,
    email: record.email,
    city: record.city,
    state: record.state,
    status: record.status,
    notes: record.notes,
  };

  const { data, error } = await sb.from('fornecedores').upsert(payload).select('*').single();
  if (error) throw error;
  return mapSupplierRow(data as SupabaseSupplierRow);
}

export async function deleteMySupplier(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb
    .from('fornecedores')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyPurchases() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('compras').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('purchase_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapPurchaseRow(row as SupabasePurchaseRow));
}

export async function upsertMyPurchase(record: PurchaseRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    supplier_id: record.supplierId || null,
    linked_animal_id: record.linkedAnimalId || null,
    category: record.category,
    item_name: record.itemName,
    purchase_date: record.purchaseDate,
    quantity: record.quantity,
    unit: record.unit,
    unit_price: record.unitPrice,
    total_price: record.totalPrice,
    invoice_number: record.invoiceNumber,
    payment_status: record.paymentStatus,
    notes: record.notes,
    feed_classification: record.feedClassification,
    veterinary_purpose: record.veterinaryPurpose,
    expiration_date: record.expirationDate || null,
    service_type: record.serviceType,
    operational_area: record.operationalArea,
  };

  const { data, error } = await sb.from('compras').upsert(payload).select('*').single();
  if (error) throw error;
  return mapPurchaseRow(data as SupabasePurchaseRow);
}

export async function deleteMyPurchase(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb.from('compras').delete().eq('id', id).eq('user_id', userId).eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyGalpoes() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('galpoes').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapGalpaoRow(row as SupabaseGalpaoRow));
}

export async function upsertMyGalpao(record: GalpaoRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    name: record.name,
    code: record.code,
    capacity: record.capacity,
    current_bird_count: record.currentBirdCount,
    mortality_threshold_percent: record.mortalityThresholdPercent,
    location: record.location,
    notes: record.notes,
  };

  const { data, error } = await sb.from('galpoes').upsert(payload).select('*').single();
  if (error) throw error;
  return mapGalpaoRow(data as SupabaseGalpaoRow);
}

export async function deleteMyGalpao(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb.from('galpoes').delete().eq('id', id).eq('user_id', userId).eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyHealthProfessionals() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('profissionais_saude').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapHealthProfessionalRow(row as SupabaseHealthProfessionalRow));
}

export async function upsertMyHealthProfessional(record: HealthProfessionalRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    name: record.name,
    role: record.role,
    council_number: record.councilNumber,
    phone: record.phone,
    email: record.email,
    access_level: record.accessLevel,
    is_active: record.isActive,
    notes: record.notes,
  };

  const { data, error } = await sb.from('profissionais_saude').upsert(payload).select('*').single();
  if (error) throw error;
  return mapHealthProfessionalRow(data as SupabaseHealthProfessionalRow);
}

export async function deleteMyHealthProfessional(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb
    .from('profissionais_saude')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyHealthRecords() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('saude_registros').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapHealthRecordRow(row as SupabaseHealthRecordRow));
}

export async function upsertMyHealthRecord(record: HealthRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    occurred_at: record.occurredAt ? new Date(record.occurredAt).toISOString() : new Date().toISOString(),
    procedure_type: record.procedureType,
    animal_id: record.animalId,
    galpao_id: record.galpaoId || null,
    professional_id: record.professionalId || null,
    title: record.title,
    disease_name: record.diseaseName,
    affected_bird_count: record.affectedBirdCount,
    estimated_cost: record.estimatedCost,
    recovery_status: record.recoveryStatus,
    notes: record.notes,
    vaccine_name: record.vaccineName,
    medication_name: record.medicationName,
    application_method: record.applicationMethod,
    treatment_details: record.treatmentDetails,
    // Novos campos
    consultation_cost: record.consultationCost,
    return_date: record.returnDate,
    treatment_type: record.treatmentType,
    product_name: record.productName,
    next_dose_date: record.nextDoseDate,
  };

  const { data, error } = await sb.from('saude_registros').upsert(payload).select('*').single();
  if (error) throw error;
  return mapHealthRecordRow(data as SupabaseHealthRecordRow);
}

export async function deleteMyHealthRecord(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb
    .from('saude_registros')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyVeterinaryStock() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('estoque_veterinario').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('expiration_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapVeterinaryStockRow(row as SupabaseVeterinaryStockRow));
}

export async function upsertMyVeterinaryStock(record: VeterinaryStockRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    name: record.name,
    category: record.category,
    supplier_id: record.supplierId || null,
    batch_number: record.batchNumber,
    quantity: record.quantity,
    unit: record.unit,
    minimum_stock: record.minimumStock,
    expiration_date: record.expirationDate || null,
    storage_location: record.storageLocation,
    cost_per_unit: record.costPerUnit,
    notes: record.notes,
  };

  const { data, error } = await sb.from('estoque_veterinario').upsert(payload).select('*').single();
  if (error) throw error;
  return mapVeterinaryStockRow(data as SupabaseVeterinaryStockRow);
}

export async function deleteMyVeterinaryStock(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb
    .from('estoque_veterinario')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyMortalityRecords() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('mortalidade_registros').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapMortalityRow(row as SupabaseMortalityRow));
}

export async function upsertMyMortalityRecord(record: MortalityRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    date: record.date,
    animal_id: record.animalId,
    dead_count: record.deadCount,
    cause: record.cause,
    notes: record.notes,
    galpao_id: record.galpaoId || null,
    responsible_professional_id: record.responsibleProfessionalId || null,
    cause_status: record.causeStatus || null,
  };
  const { data, error } = await sb.from('mortalidade_registros').upsert(payload).select('*').single();
  if (error) {
    console.error('Erro ao enviar para supabase:', error);
    throw error;
  }
  return mapMortalityRow(data as SupabaseMortalityRow);
}

export async function deleteMyMortalityRecord(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb
    .from('mortalidade_registros')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyManejoRecords() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('manejo_registros').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapManejoRow(row as SupabaseManejoRow));
}

export async function upsertMyManejoRecord(record: ManejoRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload: any = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    date: record.date,
    animal_id: record.animalId,
    turno: record.turno,
    ovos_coletados: record.ovosColetados,
    ovos_danificados: record.ovosDanificados,
    racao_kg: record.racaoKg,
    porta_aberta: record.portaAberta,
    peso_medio_ovos: record.pesoMedioOvos,
    tamanho_ovos: record.tamanhoOvos,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error: testError } = await sb.from('manejo_registros').select('formulation_id').limit(1);
    if (!testError) {
      payload.formulation_id = record.formulationId;
    }
  } catch (e) {}

  const { data, error } = await sb.from('manejo_registros').upsert(payload).select('*').single();
  if (error) throw error;
  return mapManejoRow(data as SupabaseManejoRow);
}

export async function deleteMyManejoRecord(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb
    .from('manejo_registros')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyDisponibilidadeVenda() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('disponibilidade_venda').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapDisponibilidadeRow(row as SupabaseDisponibilidadeRow));
}

export async function upsertMyDisponibilidadeVenda(record: DisponibilidadeVenda) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    date: record.date,
    galinhas_vivas: record.galinhasVivas,
    galinhas_limpas: record.galinhasLimpas,
    cama_aviario_unidades: record.camaAviarioUnidades,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb.from('disponibilidade_venda').upsert(payload).select('*').single();
  if (error) throw error;
  return mapDisponibilidadeRow(data as SupabaseDisponibilidadeRow);
}

export async function deleteMyDisponibilidadeVenda(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb
    .from('disponibilidade_venda')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyVendas() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('vendas').select('*').eq('user_id', userId),
    granjaId,
  )
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapVendaRow(row as SupabaseVendaRow));
}

export async function upsertMyVenda(record: VendaRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const payload = {
    id: record.id,
    user_id: userId,
    granja_id: granjaId,
    date: record.date,
    client_id: record.clientId,
    produto: record.produto,
    quantidade: record.quantidade,
    lote: record.lote,
    forma_pagamento: record.formaPagamento,
    valor_unitario: record.valorUnitario,
    valor_total: record.valorTotal,
    notes: record.notes,
  };

  const { data, error } = await sb.from('vendas').upsert(payload).select('*').single();
  if (error) throw error;
  return mapVendaRow(data as SupabaseVendaRow);
}

export async function deleteMyVenda(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  const { error } = await sb
    .from('vendas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (error) throw error;
}

export async function listMyIngredients() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('ingredientes').select('*').eq('user_id', userId),
    granjaId,
  ).order('created_at', { ascending: false });

  if (error) {
    console.warn('Tabela ingredientes não encontrada ou erro ao carregar:', error);
    return [];
  }
  return (data || []).map((row) => mapIngredientRow(row as SupabaseIngredientRow));
}

export async function upsertMyIngredient(record: IngredientRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  
  // Primeiro, verifica quais colunas existem
  const existingColumns = new Set<string>();
  
  try {
    // Tenta consultar a tabela para verificar colunas
    const { error: testError, data: colCheck } = await sb.from('ingredientes').select('*').limit(1);
    if (!testError && colCheck && colCheck.length > 0) {
      Object.keys(colCheck[0]).forEach((col) => existingColumns.add(col));
    }
  } catch (e) {
    console.warn('[DEBUG] Erro ao verificar colunas:', e);
  }
  
  // Monta o payload com as colunas que existem
  let payload: any = {
    id: record.id,
    user_id: userId,
    name: record.name,
    protein: record.protein,
    energy: record.energy,
    calcium: record.calcium,
    // Keep phosphorus for backward compatibility
    phosphorus: record.phosphorusAvailable,
    methionine: record.methionine,
    lysine: record.lysine,
    fiber: record.fiber,
    price: record.price,
    stock: record.stock,
  };
  
  if (existingColumns.has('granja_id')) {
    payload.granja_id = granjaId;
  }
  
  if (existingColumns.has('dry_matter')) {
    payload.dry_matter = record.dryMatter;
  }
  
  if (existingColumns.has('met_cis')) {
    payload.met_cis = record.metCis;
  }

  if (existingColumns.has('phosphorus_total')) {
    payload.phosphorus_total = record.phosphorusTotal;
  }
  if (existingColumns.has('phosphorus_available')) {
    payload.phosphorus_available = record.phosphorusAvailable;
  }
  if (existingColumns.has('sodium')) {
    payload.sodium = record.sodium;
  }
  if (existingColumns.has('potassium')) {
    payload.potassium = record.potassium;
  }
  if (existingColumns.has('threonine')) {
    payload.threonine = record.threonine;
  }
  if (existingColumns.has('tryptophan')) {
    payload.tryptophan = record.tryptophan;
  }
  if (existingColumns.has('ether_extract')) {
    payload.ether_extract = record.etherExtract;
  }
  if (existingColumns.has('data_source')) {
    payload.data_source = record.dataSource;
  }
  if (existingColumns.has('reference_year')) {
    payload.reference_year = record.referenceYear;
  }
  if (existingColumns.has('last_updated')) {
    payload.last_updated = record.lastUpdated;
  }
  if (existingColumns.has('technical_notes')) {
    payload.technical_notes = record.technicalNotes;
  }
  if (existingColumns.has('user_editable')) {
    payload.user_editable = record.userEditable;
  }
  
  const { data, error } = await sb.from('ingredientes').upsert(payload).select('*').single();
  
  if (error) {
    console.error('[DEBUG] ERRO NO SUPABASE AO UPSERT:', error);
    throw error;
  }
  const mapped = mapIngredientRow(data as any);
  return mapped;
}

export async function deleteMyIngredient(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  
  // Tenta com granja_id, se falhar tenta sem
  let { error } = await sb
    .from('ingredientes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  
  if (error && error.message?.includes('granja_id')) {
    // Tenta sem granja_id
    const { error: error2 } = await sb
      .from('ingredientes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error2) throw error2;
  } else if (error) {
    throw error;
  }
}

export async function listMyFormulacoes() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('formulacoes').select('*').eq('user_id', userId),
    granjaId,
  ).order('created_at', { ascending: false });

  if (error) {
    console.warn('Tabela formulacoes não encontrada ou erro ao carregar:', error);
    return [];
  }
  return (data || []).map((row) => mapFormulationRow(row as SupabaseFormulationRow));
}

export async function upsertMyFormulacao(record: FormulationRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  
  const payload: any = {
    id: record.id,
    user_id: userId,
    name: record.name,
    phase: record.phase,
    ingredients: record.ingredients,
    is_active: record.isActive,
  };
  
  // Testa se a coluna animal_id existe
  let hasAnimalIdColumn = false;
  try {
    const { data: testData, error: testError } = await sb.from('formulacoes').select('animal_id').limit(1);
    if (!testError) {
      hasAnimalIdColumn = true;
    } else {
      console.warn('[DEBUG] Coluna animal_id NÃO existe:', testError);
    }
  } catch (e) {
    console.warn('[DEBUG] Erro ao testar coluna animal_id:', e);
  }

  if (hasAnimalIdColumn) {
    payload.animal_id = record.animalId;
  }
  
  // Tenta adicionar granja_id
  try {
    const { error: testError } = await sb.from('formulacoes').select('granja_id').limit(1);
    if (!testError) {
      payload.granja_id = granjaId;
    }
  } catch (e) {}
  const { data, error } = await sb.from('formulacoes').upsert(payload).select('*').single();
  if (error) throw error;
  return mapFormulationRow(data as SupabaseFormulationRow);
}

export async function deleteMyFormulacao(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  
  let { error } = await sb
    .from('formulacoes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  
  if (error && error.message?.includes('granja_id')) {
    const { error: error2 } = await sb
      .from('formulacoes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error2) throw error2;
  } else if (error) {
    throw error;
  }
}

export async function listMyFormulatedFeedStock() {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja(false);
  const { data, error } = await applyGranjaScope(
    sb.from('estoque_racao_formulada').select('*').eq('user_id', userId),
    granjaId,
  ).order('produced_at', { ascending: false });

  if (error) {
    console.warn('Tabela estoque_racao_formulada não encontrada ou erro ao carregar:', error);
    return [];
  }
  return (data || []).map((row) => mapFormulatedFeedStockRow(row as SupabaseFormulatedFeedStockRow));
}

export async function upsertMyFormulatedFeedStock(record: FormulatedFeedStockRecord) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  
  const payload: any = {
    id: record.id,
    user_id: userId,
    formulation_id: record.formulationId,
    quantity_kg: record.quantityKg,
    produced_at: record.producedAt,
  };
  
  // Tenta adicionar granja_id
  try {
    const { error: testError } = await sb.from('estoque_racao_formulada').select('granja_id').limit(1);
    if (!testError) {
      payload.granja_id = granjaId;
    }
  } catch (e) {}
  
  const { data, error } = await sb.from('estoque_racao_formulada').upsert(payload).select('*').single();
  if (error) throw error;
  return mapFormulatedFeedStockRow(data as SupabaseFormulatedFeedStockRow);
}

export async function deleteMyFormulatedFeedStock(id: string) {
  const sb = requireSupabase();
  const { userId, granjaId } = await getAuthenticatedUserAndGranja();
  
  let { error } = await sb
    .from('estoque_racao_formulada')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  
  if (error && error.message?.includes('granja_id')) {
    const { error: error2 } = await sb
      .from('estoque_racao_formulada')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error2) throw error2;
  } else if (error) {
    throw error;
  }
}

export async function buildMyBackupSnapshot(): Promise<BackupSnapshot> {
  const user = await getMyUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const granja = await getMyLatestGranja();
  if (!granja) {
    throw new Error('Nenhuma granja encontrada para o usuário. Finalize o cadastro inicial da granja antes de continuar.');
  }

  const [
    animals,
    clients,
    suppliers,
    galpoes,
    healthProfessionals,
    healthRecords,
    veterinaryStock,
    mortalityRecords,
    manejoRecords,
    disponibilidadeVenda,
    vendas,
    ingredients,
    formulations,
    formulatedFeedStock,
  ] = await Promise.all([
    listMyAnimals(),
    listMyClients(),
    listMySuppliers(),
    listMyGalpoes(),
    listMyHealthProfessionals(),
    listMyHealthRecords(),
    listMyVeterinaryStock(),
    listMyMortalityRecords(),
    listMyManejoRecords(),
    listMyDisponibilidadeVenda(),
    listMyVendas(),
    listMyIngredients(),
    listMyFormulacoes(),
    listMyFormulatedFeedStock(),
  ]);
  const selectedPalette = granja.selected_palette ? (granja.selected_palette as ThemePaletteId) : 'blue';

  return normalizeBackupSnapshot({
    version: 1,
    exportedAt: new Date().toISOString(),
    personal: {
      fullName: user.full_name,
      email: user.email,
      phone: user.phone ?? '',
    },
    farmProfile: {
      farmName: granja.farm_name,
      state: granja.state,
      city: granja.city,
      birdCount: Number(granja.bird_count ?? 0),
      selectedPalette,
      marketingSource: granja.marketing_source ?? '',
    },
    systemSettings: {
      selectedPalette,
      fontFamily: 'inter',
      borderRadius: 'rounded',
      eggSalePrice: Number(granja.egg_sale_price ?? 0),
      birdSalePrice: Number(granja.bird_sale_price ?? 0),
      litterSalePrice: Number(granja.litter_sale_price ?? 0),
      weather: {
        display: {
          currentTemp: true,
          feelsLike: true,
          humidity: true,
          windSpeed: true,
          condition: true,
          dailyForecast: true,
          uvIndex: true,
          precipitation: true,
          pressure: true,
          visibility: true,
        },
        recentLocations: [],
      },
    },
    backupSettings: getBackupAutomationSettingsFromGranja(granja),
    animals,
    clients,
    suppliers,
    galpoes,
    healthProfessionals,
    healthRecords,
    veterinaryStock,
    mortalityRecords,
    manejoRecords,
    disponibilidadeVenda,
    vendas,
    ingredients,
    formulations,
    formulatedFeedStock,
  });
}

export async function saveMyBackupToSupabase(name: string) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const snapshot = await buildMyBackupSnapshot();
  const granja = await getMyLatestGranja();

  const { data, error } = await sb
    .from('backups')
    .insert([
      {
        user_id: userData.user.id,
        granja_id: granja?.id ?? null,
        name: name.trim() || `Backup ${new Date().toLocaleString('pt-BR')}`,
        snapshot,
      },
    ])
    .select('*')
    .single();

  if (error) throw error;
  return mapBackupRow(data as SupabaseBackupRow);
}

export async function listMyBackups() {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const { data, error } = await sb
    .from('backups')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapBackupRow(row as SupabaseBackupRow));
}

export async function deleteMyBackup(id: string) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const { error } = await sb.from('backups').delete().eq('id', id).eq('user_id', userData.user.id);
  if (error) throw error;
}

export async function restoreMyBackupSnapshot(snapshot: BackupSnapshot) {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const normalized = validateBackupSnapshot(snapshot);

  await upsertMyUser({
    full_name: normalized.personal.fullName,
    email: normalized.personal.email,
    phone: normalized.personal.phone,
  });

  const granjaPayload = {
    farm_name: normalized.farmProfile.farmName,
    state: normalized.farmProfile.state,
    city: normalized.farmProfile.city,
    bird_count: normalized.farmProfile.birdCount,
    selected_palette: normalized.systemSettings.selectedPalette,
    marketing_source: normalized.farmProfile.marketingSource,
    egg_sale_price: normalized.systemSettings.eggSalePrice,
    bird_sale_price: normalized.systemSettings.birdSalePrice,
    litter_sale_price: normalized.systemSettings.litterSalePrice,
    auto_backup_enabled: normalized.backupSettings.enabled,
    auto_backup_frequency: normalized.backupSettings.frequency,
    auto_backup_last_run_at: normalized.backupSettings.lastRunAt || null,
    auto_backup_keep_count: normalized.backupSettings.keepCount,
  };

  const currentGranja = await getMyLatestGranja();
  const savedGranja = currentGranja
    ? await updateMyGranja(currentGranja.id, granjaPayload)
    : await createMyGranja(granjaPayload);

  const userId = userData.user.id;
  const granjaId = savedGranja.id;

  const { error: deleteMortalityError } = await sb
    .from('mortalidade_registros')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteMortalityError) throw deleteMortalityError;

  const { error: deleteHealthError } = await sb
    .from('saude_registros')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteHealthError) throw deleteHealthError;

  const { error: deleteStockError } = await sb
    .from('estoque_veterinario')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteStockError) throw deleteStockError;

  const { error: deleteProfessionalsError } = await sb
    .from('profissionais_saude')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteProfessionalsError) throw deleteProfessionalsError;

  const { error: deleteGalpoesError } = await sb.from('galpoes').delete().eq('user_id', userId).eq('granja_id', granjaId);
  if (deleteGalpoesError) throw deleteGalpoesError;

  const { error: deleteAnimalsError } = await sb.from('animais').delete().eq('user_id', userId).eq('granja_id', granjaId);
  if (deleteAnimalsError) throw deleteAnimalsError;

  const { error: deleteClientsError } = await sb.from('clientes').delete().eq('user_id', userId).eq('granja_id', granjaId);
  if (deleteClientsError) throw deleteClientsError;

  const { error: deleteSuppliersError } = await sb
    .from('fornecedores')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteSuppliersError) throw deleteSuppliersError;

  const { error: deleteManejoError } = await sb
    .from('manejo_registros')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteManejoError) throw deleteManejoError;

  const { error: deleteDisponibilidadeError } = await sb
    .from('disponibilidade_venda')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteDisponibilidadeError) throw deleteDisponibilidadeError;

  const { error: deleteIngredientesError } = await sb
    .from('ingredientes')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteIngredientesError) throw deleteIngredientesError;

  const { error: deleteFormulacoesError } = await sb
    .from('formulacoes')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteFormulacoesError) throw deleteFormulacoesError;

  const { error: deleteEstoqueRacaoError } = await sb
    .from('estoque_racao_formulada')
    .delete()
    .eq('user_id', userId)
    .eq('granja_id', granjaId);
  if (deleteEstoqueRacaoError) throw deleteEstoqueRacaoError;

  if (normalized.suppliers.length > 0) {
    const supplierPayload = normalized.suppliers.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      company_name: record.companyName,
      contact_name: record.contactName,
      category: record.category,
      phone: record.phone,
      email: record.email,
      city: record.city,
      state: record.state,
      status: record.status,
      notes: record.notes,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('fornecedores').insert(supplierPayload);
    if (error) throw error;
  }

  if (normalized.clients.length > 0) {
    const clientPayload = normalized.clients.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      name: record.name,
      document: record.document,
      phone: record.phone,
      email: record.email,
      city: record.city,
      state: record.state,
      status: record.status,
      notes: record.notes,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('clientes').insert(clientPayload);
    if (error) throw error;
  }

  if (normalized.animals.length > 0) {
    const availableSupplierIds = new Set(normalized.suppliers.map((record) => record.id));
    const animalPayload = normalized.animals.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      supplier_id: availableSupplierIds.has(record.supplierId) ? record.supplierId : null,
      tag: record.tag,
      lot: record.lot,
      species: record.species,
      purpose: record.purpose,
      breed: record.breed,
      quantity: record.quantity,
      current_quantity: record.currentQuantity ?? record.quantity,
      total_purchase_price: record.totalPurchasePrice,
      average_weight_kg: record.averageWeightKg,
      birth_date: record.birthDate,
      status: record.status,
      notes: record.notes,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('animais').insert(animalPayload);
    if (error) throw error;
  }

  if (normalized.galpoes.length > 0) {
    const galpaoPayload = normalized.galpoes.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      name: record.name,
      code: record.code,
      capacity: record.capacity,
      current_bird_count: record.currentBirdCount,
      mortality_threshold_percent: record.mortalityThresholdPercent,
      location: record.location,
      notes: record.notes,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('galpoes').insert(galpaoPayload);
    if (error) throw error;
  }

  if (normalized.healthProfessionals.length > 0) {
    const professionalPayload = normalized.healthProfessionals.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      name: record.name,
      role: record.role,
      council_number: record.councilNumber,
      phone: record.phone,
      email: record.email,
      access_level: record.accessLevel,
      is_active: record.isActive,
      notes: record.notes,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('profissionais_saude').insert(professionalPayload);
    if (error) throw error;
  }

  if (normalized.veterinaryStock.length > 0) {
    const availableSupplierIds = new Set(normalized.suppliers.map((record) => record.id));
    const stockPayload = normalized.veterinaryStock.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      name: record.name,
      category: record.category,
      supplier_id: availableSupplierIds.has(record.supplierId) ? record.supplierId : null,
      batch_number: record.batchNumber,
      quantity: record.quantity,
      unit: record.unit,
      minimum_stock: record.minimumStock,
      expiration_date: record.expirationDate || null,
      storage_location: record.storageLocation,
      cost_per_unit: record.costPerUnit,
      notes: record.notes,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('estoque_veterinario').insert(stockPayload);
    if (error) throw error;
  }

  if (normalized.healthRecords.length > 0) {
    const availableAnimalIds = new Set(normalized.animals.map((record) => record.id));
    const availableGalpaoIds = new Set(normalized.galpoes.map((record) => record.id));
    const availableProfessionalIds = new Set(normalized.healthProfessionals.map((record) => record.id));
    const healthPayload = normalized.healthRecords
      .filter(
        (record) =>
          availableAnimalIds.has(record.animalId) &&
          availableGalpaoIds.has(record.galpaoId) &&
          availableProfessionalIds.has(record.professionalId),
      )
      .map((record) => ({
        id: record.id,
        user_id: userId,
        granja_id: granjaId,
        occurred_at: record.occurredAt,
        procedure_type: record.procedureType,
        animal_id: record.animalId,
        galpao_id: record.galpaoId,
        professional_id: record.professionalId,
        title: record.title,
        disease_name: record.diseaseName,
        affected_bird_count: record.affectedBirdCount,
        estimated_cost: record.estimatedCost,
        recovery_status: record.recoveryStatus,
        notes: record.notes,
        created_at: record.createdAt,
      }));

    if (healthPayload.length > 0) {
      const { error } = await sb.from('saude_registros').insert(healthPayload);
      if (error) throw error;
    }
  }

  if (normalized.mortalityRecords.length > 0) {
    const availableAnimalIds = new Set(normalized.animals.map((record) => record.id));
    const availableGalpaoIds = new Set(normalized.galpoes.map((record) => record.id));
    const availableProfessionalIds = new Set(normalized.healthProfessionals.map((record) => record.id));
    const mortalityPayload = normalized.mortalityRecords
      .filter(
        (record) =>
          availableAnimalIds.has(record.animalId) &&
          (!record.galpaoId || availableGalpaoIds.has(record.galpaoId)) &&
          (!record.responsibleProfessionalId || availableProfessionalIds.has(record.responsibleProfessionalId)),
      )
      .map((record) => ({
        id: record.id,
        user_id: userId,
        granja_id: granjaId,
        date: record.date,
        galpao_id: record.galpaoId || null,
        animal_id: record.animalId,
        responsible_professional_id: record.responsibleProfessionalId || null,
        dead_count: record.deadCount,
        cause_status: record.causeStatus,
        cause: record.cause,
        notes: record.notes,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      }));

    if (mortalityPayload.length > 0) {
      const { error } = await sb.from('mortalidade_registros').insert(mortalityPayload);
      if (error) throw error;
    }
  }

  if (normalized.manejoRecords.length > 0) {
    const availableAnimalIds = new Set(normalized.animals.map((record) => record.id));
    const manejoPayload = normalized.manejoRecords
      .filter((record) => availableAnimalIds.has(record.animalId))
      .map((record) => ({
        id: record.id,
        user_id: userId,
        granja_id: granjaId,
        date: record.date,
        animal_id: record.animalId,
        turno: record.turno,
        ovos_coletados: record.ovosColetados,
        ovos_danificados: record.ovosDanificados,
        racao_kg: record.racaoKg,
        porta_aberta: record.portaAberta,
        peso_medio_ovos: record.pesoMedioOvos,
        tamanho_ovos: record.tamanhoOvos,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      }));

    if (manejoPayload.length > 0) {
      const { error } = await sb.from('manejo_registros').insert(manejoPayload);
      if (error) throw error;
    }
  }

  if (normalized.disponibilidadeVenda.length > 0) {
    const disponibilidadePayload = normalized.disponibilidadeVenda.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      date: record.date,
      galinhas_vivas: record.galinhasVivas,
      galinhas_limpas: record.galinhasLimpas,
      cama_aviario_unidades: record.camaAviarioUnidades,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    }));

    const { error } = await sb.from('disponibilidade_venda').insert(disponibilidadePayload);
    if (error) throw error;
  }

  if (normalized.ingredients.length > 0) {
    const ingredientsPayload = normalized.ingredients.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      name: record.name,
      dry_matter: record.dryMatter,
      protein: record.protein,
      energy: record.energy,
      calcium: record.calcium,
      phosphorus: record.phosphorusAvailable,
      methionine: record.methionine,
      met_cis: record.metCis,
      lysine: record.lysine,
      fiber: record.fiber,
      price: record.price,
      stock: record.stock,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('ingredientes').insert(ingredientsPayload);
    if (error) throw error;
  }

  if (normalized.formulations.length > 0) {
    const formulationsPayload = normalized.formulations.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      name: record.name,
      phase: record.phase,
      ingredients: record.ingredients,
      is_active: record.isActive,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('formulacoes').insert(formulationsPayload);
    if (error) throw error;
  }

  if (normalized.formulatedFeedStock.length > 0) {
    const formulatedFeedStockPayload = normalized.formulatedFeedStock.map((record) => ({
      id: record.id,
      user_id: userId,
      granja_id: granjaId,
      formulation_id: record.formulationId,
      quantity_kg: record.quantityKg,
      produced_at: record.producedAt,
      created_at: record.createdAt,
    }));

    const { error } = await sb.from('estoque_racao_formulada').insert(formulatedFeedStockPayload);
    if (error) throw error;
  }
}

// =====================================================
// INVESTIMENTOS
// =====================================================

/**
 * Salva (upsert) um projeto de investimento completo no Supabase.
 * Usa a RPC save_investment_project que faz upsert do projeto
 * e reinserção atômica de todos os itens.
 */
export async function saveInvestmentProject(project: InvestmentProject): Promise<void> {
  assertBillingAccess();
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const granja = await getMyLatestGranja();

  const payload = {
    id:            project.id,
    granjaId:      granja?.id ?? null,
    nome:          project.nome,
    status:        project.status,
    dataInicio:    project.dataInicio,
    dataConclusao: project.dataConclusao ?? null,
    isCustomized:  project.isCustomized ?? false,
    calcParams:    null,
    items: project.items.map((item) => ({
      id:           item.id,
      projectId:    item.projectId,
      categoria:    item.categoria,
      descricao:    item.descricao,
      quantidade:   item.quantidade,
      precoUnitario: item.precoUnitario,
    })),
  };

  const { data, error } = await sb.rpc('save_investment_project', { p_payload: payload });
  if (error) throw error;
  if (data && data.success === false) {
    throw new Error(data.error ?? 'Erro ao salvar projeto.');
  }
}

/**
 * Carrega todos os projetos de investimento do usuário autenticado,
 * incluindo seus itens completos.
 */
export async function loadInvestmentProjects(): Promise<InvestmentProject[]> {
  assertBillingAccess();
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  // Busca projetos
  const { data: projects, error: projError } = await sb
    .from('investment_projects')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (projError) throw projError;
  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p: any) => p.id);

  // Busca todos os itens dos projetos em uma única query
  const { data: items, error: itemsError } = await sb
    .from('investment_items')
    .select('*')
    .in('project_id', projectIds)
    .eq('user_id', userData.user.id);

  if (itemsError) throw itemsError;

  const itemsByProject: Record<string, any[]> = {};
  for (const item of items ?? []) {
    if (!itemsByProject[item.project_id]) itemsByProject[item.project_id] = [];
    itemsByProject[item.project_id].push(item);
  }

  return projects.map((p: any): InvestmentProject => ({
    id:            p.id,
    nome:          p.nome,
    status:        p.status,
    dataInicio:    p.data_inicio,
    dataConclusao: p.data_conclusao ?? undefined,
    isCustomized:  Boolean(p.is_customized),
    createdAt:     p.created_at ?? new Date().toISOString(),
    updatedAt:     p.updated_at ?? new Date().toISOString(),
    items: (itemsByProject[p.id] ?? []).map((i: any) => ({
      id:           i.id,
      projectId:    i.project_id,
      categoria:    i.categoria,
      descricao:    i.descricao,
      quantidade:   Number(i.quantidade ?? 1),
      precoUnitario: Number(i.preco_unitario ?? 0),
    })),
  }));
}

/**
 * Deleta um projeto de investimento (e seus itens via CASCADE) do Supabase.
 */
export async function deleteInvestmentProject(projectId: string): Promise<void> {
  assertBillingAccess();
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Usuário não autenticado.');

  const { data, error } = await sb.rpc('delete_investment_project', { p_project_id: projectId });
  if (error) throw error;
  if (data && data.success === false) {
    throw new Error(data.error ?? 'Erro ao deletar projeto.');
  }
}
