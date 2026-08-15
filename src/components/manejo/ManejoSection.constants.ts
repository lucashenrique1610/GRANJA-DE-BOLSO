import {
  AnimalRecord,
  GalpaoRecord,
  HealthProfessionalRecord,
  HealthRecord,
  MortalityRecord,
  VeterinaryStockRecord,
  ManejoRecord,
  DisponibilidadeVenda,
  HealthProfessionalAccessLevel,
  MortalityCause,
  MortalityCauseStatus,
  VeterinaryStockCategory,
} from '@/types';

export const TURNO_LABELS: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
};

export const TAMANHO_OVOS_LABELS: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
  extra: 'Extra',
};

export const HEALTH_PROCEDURE_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  tratamento: 'Tratamento',
  monitoramento: 'Monitoramento',
  vacina: 'Vacina',
  medicamento: 'Medicamento',
  outro: 'Outro',
};

export const HEALTH_RECOVERY_LABELS: Record<HealthRecord['recoveryStatus'], string> = {
  em_tratamento: 'Em tratamento',
  recuperado: 'Recuperado',
  monitoramento: 'Monitoramento',
  cronico: 'Crônico',
};

export const ACCESS_LABELS: Record<HealthProfessionalAccessLevel, string> = {
  visualizacao: 'Somente leitura',
  registro: 'Registro autorizado',
  gestao: 'Gestão completa',
};

export const STOCK_CATEGORY_LABELS: Record<VeterinaryStockCategory, string> = {
  vacina: 'Vacina',
  medicamento: 'Medicamento',
  material: 'Material',
  outro: 'Outro',
};

export const MORTALITY_CAUSE_LABELS: Record<MortalityCause, string> = {
  doenca: 'Doença',
  estresse_calor: 'Estresse por Calor',
  outros: 'Outros',
};

export const MORTALITY_CAUSE_STATUS_LABELS: Record<MortalityCauseStatus, string> = {
  suspeita: 'Suspeita',
  confirmada: 'Confirmada',
};

export const HEALTH_PROCEDURE_OPTIONS = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'tratamento', label: 'Tratamento' },
  { value: 'monitoramento', label: 'Monitoramento' },
];

export const emptyGalpaoDraft: Omit<GalpaoRecord, 'id' | 'createdAt'> = {
  name: '',
  code: '',
  capacity: 0,
  currentBirdCount: 0,
  mortalityThresholdPercent: 5,
  location: '',
  notes: '',
};

export const emptyProfessionalDraft: Omit<HealthProfessionalRecord, 'id' | 'createdAt'> = {
  name: '',
  role: '',
  councilNumber: '',
  phone: '',
  email: '',
  accessLevel: 'registro',
  isActive: true,
  notes: '',
};

export const emptyHealthDraft: Omit<HealthRecord, 'id' | 'createdAt'> = {
  occurredAt: new Date().toISOString().slice(0, 16),
  procedureType: 'consulta',
  animalId: '',
  galpaoId: '',
  professionalId: '',
  title: '',
  diseaseName: '',
  affectedBirdCount: 0,
  estimatedCost: 0,
  recoveryStatus: 'monitoramento',
  notes: '',
  vaccineName: '',
  medicationName: '',
  applicationMethod: '',
  treatmentDetails: '',
  consultationCost: 0,
  returnDate: '',
  treatmentType: undefined,
  productName: '',
  nextDoseDate: undefined,
};

export const emptyStockDraft: Omit<VeterinaryStockRecord, 'id' | 'createdAt'> = {
  name: '',
  category: 'vacina',
  supplierId: '',
  batchNumber: '',
  quantity: 0,
  unit: 'un',
  minimumStock: 0,
  expirationDate: '',
  storageLocation: '',
  costPerUnit: 0,
  notes: '',
};

export const emptyMortalityDraft: Omit<MortalityRecord, 'id' | 'createdAt'> = {
  date: new Date().toISOString().slice(0, 10),
  galpaoId: '',
  animalId: '',
  responsibleProfessionalId: '',
  deadCount: 0,
  causeStatus: 'suspeita',
  cause: 'outros',
  notes: '',
  attachments: [],
};

export const emptyManejoDraft: Omit<ManejoRecord, 'id' | 'createdAt' | 'updatedAt'> = {
  date: new Date().toISOString().slice(0, 10),
  animalId: '',
  turno: 'manha',
  ovosColetados: 0,
  ovosDanificados: 0,
  racaoKg: 0,
  formulationId: '',
  portaAberta: false,
  pesoMedioOvos: 0,
  tamanhoOvos: 'medio',
};

export const emptyDisponibilidadeDraft: Omit<DisponibilidadeVenda, 'id' | 'createdAt' | 'updatedAt'> = {
  date: new Date().toISOString().slice(0, 10),
  galinhasVivas: 0,
  galinhasLimpas: 0,
  camaAviarioUnidades: 0,
};

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const numberFormatter = new Intl.NumberFormat('pt-BR');

export function matchesDateRange(value: string, from: string, to: string) {
  const dateValue = value.slice(0, 10);
  if (from && dateValue < from) return false;
  if (to && dateValue > to) return false;
  return true;
}

function getLotesFromGalpao(galpao: GalpaoRecord) {
  try {
    const parsed = JSON.parse(galpao.notes);
    if (Array.isArray(parsed.lotes)) {
      return parsed.lotes as { id: string; tag: string; lot: string; quantity: number; currentQuantity?: number }[];
    }
  } catch {
    // ignore
  }
  return [];
}

export function findGalpaoForAnimal(animalId: string, galpoes: GalpaoRecord[]) {
  return galpoes.find((galpao) => {
    const lotes = getLotesFromGalpao(galpao);
    return lotes.some((lote) => lote.id === animalId);
  });
}

export function getCardTone(type: 'critical' | 'warning' | 'info' | 'success') {
  if (type === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (type === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (type === 'success') return 'border-green-200 bg-green-50 text-green-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

export function normalizeHealthProcedureType(type: HealthRecord['procedureType']) {
  if (type === 'vacina' || type === 'medicamento') return 'tratamento';
  if (type === 'outro') return 'monitoramento';
  return type;
}
