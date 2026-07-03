import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Edit3,
  FileDown,
  HeartPulse,
  Plus,
  ShieldCheck,
  Skull,
  Trash2,
  Warehouse,
  X,
  Calendar,
  Droplets,
  Wind,
  Thermometer,
  AlertCircle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  CloudLightning,
  Activity,
  Leaf,
  Egg,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import {
  AnimalRecord,
  GalpaoRecord,
  HealthProfessionalAccessLevel,
  HealthProfessionalRecord,
  HealthRecord,
  MortalityAttachment,
  MortalityCause,
  MortalityCauseStatus,
  MortalityRecord,
  PurchaseRecord,
  SupplierRecord,
  VeterinaryStockCategory,
  VeterinaryStockRecord,
  ManejoRecord,
  DisponibilidadeVenda,
  Recommendation,
  FormulationRecord,
  FormulatedFeedStockRecord,
  KnowledgeModule,
  UnifiedWeatherData,
} from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { KNOWLEDGE_MODULES } from '@/data/knowledge';
import KnowledgeModulePage from '@/components/KnowledgeModulePage';
import HealthRecordCard from '@/components/HealthRecordCard';
import {
  buildHealthReport,
  buildMortalityReport,
  calculateMortalityRate,
  canProfessionalManageHealth,
  getAnimalCurrentQuantity,
  getAnimalLabel,
  getGalpaoLabel,
  getVeterinaryStockStatus,
  summarizeVeterinaryStock,
  NUTRITIONAL_TARGETS,
  getBirdAgeInDays,
  getPhaseByAge,
  getNextDoseAlerts,
  getHealthProcedureLabel,
} from '@/lib/manejo';
import { readWeatherCache } from '@/lib/weather';
import { exportRowsToExcel, exportRowsToPdf } from '@/lib/exportUtils';

export type ManejoSection = 'registro' | 'disponibilidade' | 'historico' | 'recomendacoes' | 'saude' | 'mortalidade';

export interface ManejoModuleProps {
  section?: ManejoSection;
  animals: AnimalRecord[];
  galpoes: GalpaoRecord[];
  suppliers: SupplierRecord[];
  purchases: PurchaseRecord[];
  healthProfessionals: HealthProfessionalRecord[];
  healthRecords: HealthRecord[];
  veterinaryStock: VeterinaryStockRecord[];
  mortalityRecords: MortalityRecord[];
  manejoRecords: ManejoRecord[];
  disponibilidadeVenda: DisponibilidadeVenda[];
  formulations: FormulationRecord[];
  formulatedFeedStock: FormulatedFeedStockRecord[];
  onSaveGalpao: (record: GalpaoRecord) => Promise<void> | void;
  onDeleteGalpao: (id: string) => Promise<void> | void;
  onSaveHealthProfessional: (record: HealthProfessionalRecord) => Promise<void> | void;
  onDeleteHealthProfessional: (id: string) => Promise<void> | void;
  onSaveHealthRecord: (record: HealthRecord) => Promise<void> | void;
  onDeleteHealthRecord: (id: string) => Promise<void> | void;
  onSaveVeterinaryStock: (record: VeterinaryStockRecord) => Promise<void> | void;
  onDeleteVeterinaryStock: (id: string) => Promise<void> | void;
  onSaveMortalityRecord: (record: MortalityRecord) => Promise<void> | void;
  onDeleteMortalityRecord: (id: string) => Promise<void> | void;
  onSaveManejoRecord: (record: ManejoRecord) => Promise<void> | void;
  onDeleteManejoRecord: (id: string) => Promise<void> | void;
  onSaveDisponibilidadeVenda: (record: DisponibilidadeVenda) => Promise<void> | void;
  onDeleteDisponibilidadeVenda: (id: string) => Promise<void> | void;
  onSaveFormulatedFeed: (record: FormulatedFeedStockRecord) => Promise<void> | void;
  isLoading?: boolean;
  isSyncing?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

const HEALTH_PROCEDURE_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  tratamento: 'Tratamento',
  monitoramento: 'Monitoramento',
  // Mantidos para retrocompatibilidade
  vacina: 'Vacina',
  medicamento: 'Medicamento',
  outro: 'Outro',
};

const HEALTH_PROCEDURE_OPTIONS = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'tratamento', label: 'Tratamento' },
  { value: 'monitoramento', label: 'Monitoramento' },
];

const HEALTH_RECOVERY_LABELS: Record<HealthRecord['recoveryStatus'], string> = {
  em_tratamento: 'Em tratamento',
  recuperado: 'Recuperado',
  monitoramento: 'Monitoramento',
  cronico: 'Crônico',
};

const ACCESS_LABELS: Record<HealthProfessionalAccessLevel, string> = {
  visualizacao: 'Somente leitura',
  registro: 'Registro autorizado',
  gestao: 'Gestão completa',
};

const STOCK_CATEGORY_LABELS: Record<VeterinaryStockCategory, string> = {
  vacina: 'Vacina',
  medicamento: 'Medicamento',
  material: 'Material',
  outro: 'Outro',
};

const MORTALITY_CAUSE_LABELS: Record<MortalityCause, string> = {
  doenca: 'Doença',
  estresse_calor: 'Estresse por Calor',
  outros: 'Outros',
};

const MORTALITY_CAUSE_STATUS_LABELS: Record<MortalityCauseStatus, string> = {
  suspeita: 'Suspeita',
  confirmada: 'Confirmada',
};

const TURNO_LABELS: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
};

const TAMANHO_OVOS_LABELS: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
  extra: 'Extra',
};

const emptyGalpaoDraft: Omit<GalpaoRecord, 'id' | 'createdAt'> = {
  name: '',
  code: '',
  capacity: 0,
  currentBirdCount: 0,
  mortalityThresholdPercent: 5,
  location: '',
  notes: '',
};

const emptyProfessionalDraft: Omit<HealthProfessionalRecord, 'id' | 'createdAt'> = {
  name: '',
  role: '',
  councilNumber: '',
  phone: '',
  email: '',
  accessLevel: 'registro',
  isActive: true,
  notes: '',
};

const emptyHealthDraft: Omit<HealthRecord, 'id' | 'createdAt'> = {
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
  // Novos campos
  consultationCost: 0,
  returnDate: '',
  treatmentType: undefined,
  productName: '',
  nextDoseDate: undefined,
};

const emptyStockDraft: Omit<VeterinaryStockRecord, 'id' | 'createdAt'> = {
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

const emptyMortalityDraft: Omit<MortalityRecord, 'id' | 'createdAt'> = {
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

const emptyManejoDraft: Omit<ManejoRecord, 'id' | 'createdAt' | 'updatedAt'> = {
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

const emptyDisponibilidadeDraft: Omit<DisponibilidadeVenda, 'id' | 'createdAt' | 'updatedAt'> = {
  date: new Date().toISOString().slice(0, 10),
  galinhasVivas: 0,
  galinhasLimpas: 0,
  camaAviarioUnidades: 0,
};

function matchesDateRange(value: string, from: string, to: string) {
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

function findGalpaoForAnimal(animalId: string, galpoes: GalpaoRecord[]) {
  return galpoes.find((galpao) => {
    const lotes = getLotesFromGalpao(galpao);
    return lotes.some((lote) => lote.id === animalId);
  });
}
async function readAttachments(files: FileList | null): Promise<MortalityAttachment[]> {
  if (!files || files.length === 0) return [];

  const normalizedFiles = Array.from(files).slice(0, 5);
  return Promise.all(
    normalizedFiles.map(
      (file) =>
        new Promise<MortalityAttachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: crypto.randomUUID(),
              fileName: file.name,
              mimeType: file.type || 'application/octet-stream',
              sizeInBytes: file.size,
              dataUrl: String(reader.result || ''),
              uploadedAt: new Date().toISOString(),
            });
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function getCardTone(type: 'critical' | 'warning' | 'info' | 'success') {
  if (type === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (type === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (type === 'success') return 'border-green-200 bg-green-50 text-green-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function normalizeHealthProcedureType(type: HealthRecord['procedureType']) {
  if (type === 'vacina' || type === 'medicamento') return 'tratamento';
  if (type === 'outro') return 'monitoramento';
  return type;
}

export default function ManejoPage({
  section = 'registro',
  animals,
  galpoes,
  suppliers,
  purchases,
  healthProfessionals,
  healthRecords,
  veterinaryStock,
  mortalityRecords,
  manejoRecords,
  disponibilidadeVenda,
  formulations,
  formulatedFeedStock,
  onSaveGalpao,
  onDeleteGalpao,
  onSaveHealthProfessional,
  onDeleteHealthProfessional,
  onSaveHealthRecord,
  onDeleteHealthRecord,
  onSaveVeterinaryStock,
  onDeleteVeterinaryStock,
  onSaveMortalityRecord,
  onDeleteMortalityRecord,
  onSaveManejoRecord,
  onDeleteManejoRecord,
  onSaveDisponibilidadeVenda,
  onDeleteDisponibilidadeVenda,
  onSaveFormulatedFeed,
  isLoading = false,
  isSyncing = false,
  errorMessage,
  onRetry,
}: ManejoModuleProps) {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<ManejoSection>(section);

  const [editingGalpaoId, setEditingGalpaoId] = useState<string | null>(null);
  const [galpaoDraft, setGalpaoDraft] = useState<Omit<GalpaoRecord, 'id' | 'createdAt'>>(emptyGalpaoDraft);

  const [editingProfessionalId, setEditingProfessionalId] = useState<string | null>(null);
  const [professionalDraft, setProfessionalDraft] = useState<Omit<HealthProfessionalRecord, 'id' | 'createdAt'>>(emptyProfessionalDraft);

  const [isHealthFormOpen, setIsHealthFormOpen] = useState(false);
  const [editingHealthId, setEditingHealthId] = useState<string | null>(null);
  const [healthDraft, setHealthDraft] = useState<Omit<HealthRecord, 'id' | 'createdAt'>>(emptyHealthDraft);
  const [healthHasNextDose, setHealthHasNextDose] = useState(false);

  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState<Omit<VeterinaryStockRecord, 'id' | 'createdAt'>>(emptyStockDraft);

  const [editingMortalityId, setEditingMortalityId] = useState<string | null>(null);
  const [mortalityDraft, setMortalityDraft] = useState<Omit<MortalityRecord, 'id' | 'createdAt'>>(emptyMortalityDraft);

  const [editingManejoId, setEditingManejoId] = useState<string | null>(null);
  const [manejoDraft, setManejoDraft] = useState<Omit<ManejoRecord, 'id' | 'createdAt' | 'updatedAt'>>(emptyManejoDraft);

  const [editingDisponibilidadeId, setEditingDisponibilidadeId] = useState<string | null>(null);
  const [disponibilidadeDraft, setDisponibilidadeDraft] = useState<Omit<DisponibilidadeVenda, 'id' | 'createdAt' | 'updatedAt'>>(emptyDisponibilidadeDraft);
  
  const [registroSubSection, setRegistroSubSection] = useState<'form' | 'disponibilidade' | 'historico'>('form');

  const [healthSearch, setHealthSearch] = useState('');
  const [healthFilters, setHealthFilters] = useState({
    animalId: '',
    galpaoId: '',
    professionalId: '',
    procedureType: '',
    from: '',
    to: '',
  });

  const notifyValidation = useCallback((message: string) => {
    toast.warning('Revise os dados informados', message);
    return false;
  }, [toast]);

  const [stockSearch, setStockSearch] = useState('');
  const [mortalitySearch, setMortalitySearch] = useState('');
  const [mortalityFilters, setMortalityFilters] = useState({
    animalId: '',
    galpaoId: '',
    causeStatus: '',
    from: '',
    to: '',
  });

  const [weatherData, setWeatherData] = useState<UnifiedWeatherData | null>(null);

  useEffect(() => {
    const cached = readWeatherCache();
    if (cached) {
      setWeatherData(cached);
    }

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('clima-sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'WEATHER_UPDATE' && event.data?.data) {
          setWeatherData(event.data.data);
        }
      };
      return () => channel.close();
    }
  }, []);

  const [selectedKnowledgeModule, setSelectedKnowledgeModule] = useState<KnowledgeModule | null>(null);
  const [readHealthAlerts, setReadHealthAlerts] = useState<Set<string>>(new Set());

  // Calcular alertas de saúde
  const healthAlerts = useMemo(() => {
    const allAlerts = getNextDoseAlerts(healthRecords, animals);
    // Filtrar alertas já lidos
    return allAlerts.filter(alert => !readHealthAlerts.has(alert.id));
  }, [healthRecords, animals, readHealthAlerts]);

  // Calculate feed stock and days remaining
  const feedSummary = useMemo(() => {
    // Get total stock for selected formulation
    const totalStock = formulatedFeedStock
      .filter(stock => stock.formulationId === manejoDraft.formulationId)
      .reduce((sum, stock) => sum + stock.quantityKg, 0);

    // Get selected animal/lot
    const selectedAnimal = animals.find(a => a.id === manejoDraft.animalId);
    
    let daysRemaining = null;
    if (selectedAnimal && totalStock > 0) {
      const ageDays = getBirdAgeInDays(selectedAnimal.birthDate);
      const phase = getPhaseByAge(ageDays);
      const birdCount = getAnimalCurrentQuantity(selectedAnimal);
      const dailyConsumptionPerBirdG = NUTRITIONAL_TARGETS[phase].consumption;
      const totalDailyConsumptionKg = (dailyConsumptionPerBirdG * birdCount) / 1000;
      
      if (totalDailyConsumptionKg > 0) {
        daysRemaining = totalStock / totalDailyConsumptionKg;
      }
    }

    return {
      totalStock,
      daysRemaining,
    };
  }, [formulatedFeedStock, manejoDraft.formulationId, manejoDraft.animalId, animals]);

  useEffect(() => {
    setActiveSection(section);
  }, [section]);

  const animalMap = useMemo(() => new Map(animals.map((animal) => [animal.id, animal])), [animals]);
  const galpaoMap = useMemo(() => new Map(galpoes.map((galpao) => [galpao.id, galpao])), [galpoes]);
  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.companyName])), [suppliers]);
  const professionalMap = useMemo(() => new Map(healthProfessionals.map((professional) => [professional.id, professional])), [healthProfessionals]);

  const authorizedProfessionals = useMemo(
    () => healthProfessionals.filter((professional) => canProfessionalManageHealth(professional)),
    [healthProfessionals],
  );

  const veterinaryPurchaseCount = useMemo(
    () => purchases.filter((purchase) => purchase.category === 'insumo_veterinario').length,
    [purchases],
  );

  const filteredHealthRecords = useMemo(() => {
    return healthRecords.filter((record) => {
      const animal = animalMap.get(record.animalId);
      const galpao = galpaoMap.get(record.galpaoId);
      const professional = professionalMap.get(record.professionalId);
      const haystack = [
        record.title,
        record.diseaseName,
        record.notes,
        animal?.tag,
        galpao?.name,
        professional?.name,
        HEALTH_PROCEDURE_LABELS[record.procedureType],
      ]
        .join(' ')
        .toLowerCase();

      if (healthSearch.trim() && !haystack.includes(healthSearch.trim().toLowerCase())) return false;
      if (healthFilters.animalId && record.animalId !== healthFilters.animalId) return false;
      if (healthFilters.galpaoId && record.galpaoId !== healthFilters.galpaoId) return false;
      if (healthFilters.professionalId && record.professionalId !== healthFilters.professionalId) return false;
      if (healthFilters.procedureType && record.procedureType !== healthFilters.procedureType) return false;
      if (!matchesDateRange(record.occurredAt, healthFilters.from, healthFilters.to)) return false;
      return true;
    });
  }, [animalMap, galpaoMap, healthFilters, healthRecords, healthSearch, professionalMap]);

  const filteredStockRecords = useMemo(() => {
    return veterinaryStock.filter((record) => {
      const supplierName = supplierMap.get(record.supplierId) || '';
      const haystack = [record.name, record.batchNumber, record.notes, record.storageLocation, supplierName].join(' ').toLowerCase();
      return !stockSearch.trim() || haystack.includes(stockSearch.trim().toLowerCase());
    });
  }, [stockSearch, supplierMap, veterinaryStock]);

  const filteredMortalityRecords = useMemo(() => {
    return mortalityRecords.filter((record) => {
      const animal = animalMap.get(record.animalId);
      const haystack = [record.cause, record.notes, animal?.tag].join(' ').toLowerCase();

      if (mortalitySearch.trim() && !haystack.includes(mortalitySearch.trim().toLowerCase())) return false;
      if (mortalityFilters.animalId && record.animalId !== mortalityFilters.animalId) return false;
      if (!matchesDateRange(record.date, mortalityFilters.from, mortalityFilters.to)) return false;
      return true;
    });
  }, [animalMap, mortalityFilters, mortalityRecords, mortalitySearch]);

  const healthReport = useMemo(() => buildHealthReport(filteredHealthRecords, animals, galpoes), [animals, filteredHealthRecords, galpoes]);
  const stockSummary = useMemo(() => summarizeVeterinaryStock(filteredStockRecords), [filteredStockRecords]);
  const mortalityReport = useMemo(
    () => buildMortalityReport(filteredMortalityRecords, animals),
    [animals, filteredMortalityRecords],
  );

  // Assistente Inteligente: Context-aware recommendations
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const now = new Date();

    // 1. Context Analysis
    const activeAnimals = animals.filter(a => getAnimalCurrentQuantity(a) > 0);
    const hasCria = activeAnimals.some(a => getPhaseByAge(getBirdAgeInDays(a.birthDate)) === 'inicial_1_21');
    const hasPostura = activeAnimals.some(a => getPhaseByAge(getBirdAgeInDays(a.birthDate)) === 'postura' || getPhaseByAge(getBirdAgeInDays(a.birthDate)) === 'pre_postura_106_126');
    const totalBirds = activeAnimals.reduce((acc, a) => acc + getAnimalCurrentQuantity(a), 0);

    // 2. Weather & Climate Insights
    if (weatherData) {
      const temp = weatherData.temperature;
      const feelsLike = weatherData.feelsLike;
      const hum = weatherData.humidity;

      // Cria risk: Very sensitive to cold
      if (hasCria && (temp < 28 || feelsLike < 28)) {
        recs.push({
          id: 'cria-cold-risk',
          tipo: 'alerta',
          categoria: 'clima',
          titulo: 'Alerta Crítico: Lotes em Fase de Cria',
          descricao: `A sensação térmica está em ${Math.round(feelsLike)}°C. Pintinhos não regulam a própria temperatura. Ligue as campânulas/aquecedores imediatamente para evitar amontoamento e mortalidade.`,
          prioridade: 'alta',
          knowledgeModuleId: 'cria',
        });
      }

      // Heat stress (general)
      if (temp >= 30 || feelsLike >= 32) {
        recs.push({
          id: 'heat-stress',
          tipo: 'alerta',
          categoria: 'clima',
          titulo: 'Risco Elevado de Estresse Térmico',
          descricao: `Temperatura/Sensação térmica acima de 30°C. Aumente a vazão dos bebedouros, fracione a ração nos horários mais frescos (início da manhã/fim da tarde) e ligue ventiladores/nebulizadores.`,
          prioridade: 'alta',
          knowledgeModuleId: 'bem-estar-animal',
        });
      } else if (temp < 15) {
        recs.push({
          id: 'cold-stress',
          tipo: 'alerta',
          categoria: 'clima',
          titulo: 'Queda Brusca de Temperatura',
          descricao: `Os termômetros marcam ${Math.round(temp)}°C. Baixe as cortinas de leste/oeste para bloquear ventos encanados, mas mantenha frestas no teto para renovação de ar (evitar amônia).`,
          prioridade: 'media',
          knowledgeModuleId: 'instalacoes',
        });
      }

      // Humidity & Sanity
      if (hum > 80) {
        recs.push({
          id: 'high-humidity',
          tipo: 'alerta',
          categoria: 'sanidade',
          titulo: 'Alerta de Umidade: Cama e Cascudinho',
          descricao: `Umidade excessiva (${hum}%). Alto risco de coccidiose, amônia tóxica e proliferação de cascudinhos na cama do aviário. Revire a cama e adicione cal se necessário.`,
          prioridade: 'alta',
          knowledgeModuleId: 'sanidade',
        });
      }

      if (weatherData.precipitation > 15) {
        recs.push({
          id: 'heavy-rain',
          tipo: 'recomendacao',
          categoria: 'clima',
          titulo: 'Previsão de Chuva Forte',
          descricao: 'Verifique imediatamente telhados e calhas. Vazamentos sobre a cama geram crostas e favorecem doenças respiratórias severas.',
          prioridade: 'media',
          knowledgeModuleId: 'instalacoes',
        });
      }
    }

    // 3. Nutrition & Performance Insights
    if (manejoRecords.length >= 3) {
      const sortedRecords = [...manejoRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recent = sortedRecords.slice(0, 3);
      const avgRecentFeed = recent.reduce((sum, r) => sum + r.racaoKg, 0) / recent.length;
      const lastRecord = recent[0];
      
      // Consumption drop
      if (lastRecord && avgRecentFeed > 0 && lastRecord.racaoKg < avgRecentFeed * 0.8) {
        recs.push({
          id: 'low-consumption',
          tipo: 'alerta',
          categoria: 'nutricao',
          titulo: 'Atenção: Queda no Consumo de Ração',
          descricao: `O consumo de ontem (${lastRecord.racaoKg}kg) caiu mais de 20% em relação à média recente. Isso pode indicar água quente nas tubulações, micotoxinas na ração ou início de um desafio sanitário.`,
          prioridade: 'alta',
          knowledgeModuleId: 'nutricao',
        });
      }

      // Egg drop
      if (hasPostura) {
        const avgEggs = recent.reduce((sum, r) => sum + (r.ovosColetados - r.ovosDanificados), 0) / recent.length;
        const lastEggs = lastRecord ? (lastRecord.ovosColetados - lastRecord.ovosDanificados) : 0;
        if (lastRecord && avgEggs > 0 && lastEggs < avgEggs * 0.85) {
          recs.push({
            id: 'egg-drop',
            tipo: 'alerta',
            categoria: 'producao',
            titulo: 'Alerta: Queda na Postura',
            descricao: `Foram colhidos ${lastEggs} ovos válidos ontem, abaixo da média de ${Math.round(avgEggs)}. Verifique imediatamente o fornecimento de água, horas de luz (fotoperíodo) e a qualidade da ração.`,
            prioridade: 'alta',
            knowledgeModuleId: 'producao-de-ovos',
          });
        }
      }
    }

    // 4. General Daily Tips (Rotational/Contextual)
    if (totalBirds > 0) {
      const todayDay = now.getDate();
      const dailyTips = [
        {
          titulo: 'Dica do Dia: Limpeza de Bebedouros',
          descricao: 'Biofilmes nos canos reduzem a eficácia de vacinas e medicamentos. Faça a descarga das linhas de água pelo menos 1x por semana usando flush.',
          modulo: 'manejo-da-agua'
        },
        {
          titulo: 'Dica do Dia: Pesagem Semanal',
          descricao: 'Pese sempre de 1% a 2% das aves do lote no mesmo dia e horário toda semana. A uniformidade ideal deve estar acima de 80%.',
          modulo: 'indicadores-zootecnicos'
        },
        {
          titulo: 'Dica do Dia: Biosseguridade Básica',
          descricao: 'Mantenha o pedilúvio na entrada do galpão sempre abastecido com desinfetante renovado e limite o acesso de visitantes.',
          modulo: 'biosseguridade'
        }
      ];
      
      const tip = dailyTips[todayDay % dailyTips.length];
      recs.push({
        id: `daily-tip-${todayDay}`,
        tipo: 'recomendacao',
        categoria: 'geral',
        titulo: tip.titulo,
        descricao: tip.descricao,
        prioridade: 'baixa',
        knowledgeModuleId: tip.modulo,
      });
    } else {
      recs.push({
        id: 'no-birds',
        tipo: 'recomendacao',
        categoria: 'geral',
        titulo: 'Vazio Sanitário',
        descricao: 'Não há lotes ativos no momento. Este é o período ideal para limpeza profunda, desinfecção das instalações e manutenção de equipamentos.',
        prioridade: 'baixa',
        knowledgeModuleId: 'instalacoes',
      });
    }

    return recs;
  }, [weatherData, manejoRecords, animals]);

  // Sort recommendations by priority
  const sortedRecommendations = useMemo(() => {
    const priorityOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
    return [...recommendations].sort((a, b) => priorityOrder[a.prioridade] - priorityOrder[b.prioridade]);
  }, [recommendations]);

  const resetGalpaoForm = () => {
    setEditingGalpaoId(null);
    setGalpaoDraft(emptyGalpaoDraft);
  };

  const resetProfessionalForm = () => {
    setEditingProfessionalId(null);
    setProfessionalDraft(emptyProfessionalDraft);
  };

  const resetHealthForm = () => {
    setEditingHealthId(null);
    setHealthDraft(emptyHealthDraft);
    setHealthHasNextDose(false);
  };

  const resetStockForm = () => {
    setEditingStockId(null);
    setStockDraft(emptyStockDraft);
  };

  const resetMortalityForm = () => {
    setEditingMortalityId(null);
    setMortalityDraft(emptyMortalityDraft);
  };

  const resetManejoForm = () => {
    setEditingManejoId(null);
    setManejoDraft(emptyManejoDraft);
  };

  const resetDisponibilidadeForm = () => {
    setEditingDisponibilidadeId(null);
    setDisponibilidadeDraft(emptyDisponibilidadeDraft);
  };

  const handleSaveManejo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manejoDraft.date) return notifyValidation('Informe a data do registro.');
    if (!manejoDraft.animalId) return notifyValidation('Selecione o lote.');
    if (manejoDraft.ovosColetados < 0) return notifyValidation('A quantidade de ovos coletados não pode ser negativa.');
    if (manejoDraft.ovosDanificados < 0) return notifyValidation('A quantidade de ovos danificados não pode ser negativa.');
    if (manejoDraft.ovosDanificados > manejoDraft.ovosColetados) {
      return notifyValidation('A quantidade de ovos danificados não pode ser maior que a coletada.');
    }
    if (manejoDraft.racaoKg < 0) return notifyValidation('A quantidade de ração não pode ser negativa.');
    if (manejoDraft.pesoMedioOvos < 0) return notifyValidation('O peso médio não pode ser negativo.');

    // Deduct feed from stock if we have a selected formulation and racaoKg > 0
    if (manejoDraft.formulationId && manejoDraft.racaoKg > 0) {
      // Get existing stock for this formulation
      const existingStock = formulatedFeedStock.filter(
        stock => stock.formulationId === manejoDraft.formulationId
      );
      
      if (existingStock.length > 0) {
        // Deduct from the latest stock first
        let remainingToDeduct = manejoDraft.racaoKg;
        // Sort by producedAt descending to use newest first
        const sortedStock = [...existingStock].sort(
          (a, b) => new Date(b.producedAt).getTime() - new Date(a.producedAt).getTime()
        );
        
        for (const stockItem of sortedStock) {
          if (remainingToDeduct <= 0) break;
          
          if (stockItem.quantityKg <= remainingToDeduct) {
            // Use all of this stock item
            remainingToDeduct -= stockItem.quantityKg;
            // We could delete it, but maybe just set to 0 for history
            await onSaveFormulatedFeed({
              ...stockItem,
              quantityKg: 0
            });
          } else {
            // Deduct part of this stock item
            await onSaveFormulatedFeed({
              ...stockItem,
              quantityKg: stockItem.quantityKg - remainingToDeduct
            });
            remainingToDeduct = 0;
          }
        }
      }
    }

    await onSaveManejoRecord({
      ...manejoDraft,
      id: editingManejoId ?? crypto.randomUUID(),
      createdAt: editingManejoId
        ? manejoRecords.find((item) => item.id === editingManejoId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    resetManejoForm();
  };

  const handleSaveDisponibilidade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disponibilidadeDraft.date) return notifyValidation('Informe a data.');
    if (disponibilidadeDraft.galinhasVivas < 0) return notifyValidation('A quantidade de galinhas vivas não pode ser negativa.');
    if (disponibilidadeDraft.galinhasLimpas < 0) return notifyValidation('A quantidade de galinhas limpas não pode ser negativa.');
    if (disponibilidadeDraft.camaAviarioUnidades < 0) return notifyValidation('As unidades de cama de aviário não podem ser negativas.');

    await onSaveDisponibilidadeVenda({
      ...disponibilidadeDraft,
      id: editingDisponibilidadeId ?? crypto.randomUUID(),
      createdAt: editingDisponibilidadeId
        ? disponibilidadeVenda.find((item) => item.id === editingDisponibilidadeId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    resetDisponibilidadeForm();
  };

  const handleSaveGalpao = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!galpaoDraft.name.trim()) return notifyValidation('Informe o nome do galpão.');
    if (galpaoDraft.capacity <= 0) return notifyValidation('Informe a capacidade do galpão.');
    if (galpaoDraft.currentBirdCount < 0) return notifyValidation('A quantidade atual de aves não pode ser negativa.');

    await onSaveGalpao({
      ...galpaoDraft,
      id: editingGalpaoId ?? crypto.randomUUID(),
      createdAt: editingGalpaoId ? galpoes.find((item) => item.id === editingGalpaoId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    });
    resetGalpaoForm();
  };

  const handleSaveProfessional = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!professionalDraft.name.trim()) return notifyValidation('Informe o nome do profissional responsável.');
    if (!professionalDraft.role.trim()) return notifyValidation('Informe a função do profissional.');

    await onSaveHealthProfessional({
      ...professionalDraft,
      id: editingProfessionalId ?? crypto.randomUUID(),
      createdAt:
        editingProfessionalId
          ? healthProfessionals.find((item) => item.id === editingProfessionalId)?.createdAt ?? new Date().toISOString()
          : new Date().toISOString(),
    });
    resetProfessionalForm();
  };

  const handleSaveHealth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedProcedureType = normalizeHealthProcedureType(healthDraft.procedureType);

    if (!healthDraft.occurredAt) {
      notifyValidation('Informe a data e hora da intervenção.');
      return false;
    }
    if (!healthDraft.animalId) {
      notifyValidation('Selecione o lote afetado.');
      return false;
    }
    if (!healthDraft.notes.trim()) {
      notifyValidation('Registre observações detalhadas da intervenção.');
      return false;
    }

    const requiresProfessional = normalizedProcedureType === 'consulta' || normalizedProcedureType === 'tratamento';

    if (!healthDraft.galpaoId && normalizedProcedureType !== 'monitoramento') {
      notifyValidation('Selecione o galpão relacionado.');
      return false;
    }

    if (requiresProfessional && !healthDraft.professionalId) {
      notifyValidation('Selecione o profissional responsável.');
      return false;
    }

    const professional = healthDraft.professionalId ? professionalMap.get(healthDraft.professionalId) : undefined;
    if (requiresProfessional && !canProfessionalManageHealth(professional)) {
      notifyValidation('O profissional selecionado não possui permissão para registrar ou editar dados de saúde.');
      return false;
    }

    if (normalizedProcedureType === 'consulta') {
      if ((healthDraft.consultationCost ?? 0) < 0) {
        notifyValidation('Informe um valor válido para a consulta.');
        return false;
      }
    }

    if (normalizedProcedureType === 'tratamento') {
      if (!healthDraft.treatmentType) {
        notifyValidation('Selecione se o tratamento é remédio ou vacina.');
        return false;
      }
      if (!healthDraft.productName?.trim()) {
        notifyValidation('Informe o nome do produto.');
        return false;
      }
      if (!healthDraft.applicationMethod?.trim()) {
        notifyValidation('Selecione a forma de aplicação.');
        return false;
      }
      if ((healthDraft.affectedBirdCount ?? 0) <= 0) {
        notifyValidation('Informe a quantidade de aves tratadas.');
        return false;
      }
      if (healthHasNextDose && !healthDraft.nextDoseDate) {
        notifyValidation('Informe a data da próxima dose.');
        return false;
      }
    }

    const animal = animalMap.get(healthDraft.animalId);
    const normalizedAffectedBirdCount =
      normalizedProcedureType === 'consulta'
        ? (animal ? getAnimalCurrentQuantity(animal) : 0)
        : (healthDraft.affectedBirdCount ?? 0);

    if (animal && normalizedAffectedBirdCount > getAnimalCurrentQuantity(animal)) {
      notifyValidation('A quantidade de aves afetadas não pode ser maior que a população viva do lote.');
      return false;
    }

    await onSaveHealthRecord({
      ...healthDraft,
      procedureType: normalizedProcedureType as HealthRecord['procedureType'],
      title: healthDraft.title.trim() || getHealthProcedureLabel(normalizedProcedureType),
      galpaoId: normalizedProcedureType === 'monitoramento' ? undefined : healthDraft.galpaoId,
      professionalId: requiresProfessional ? healthDraft.professionalId : undefined,
      affectedBirdCount: normalizedProcedureType === 'monitoramento' ? undefined : normalizedAffectedBirdCount,
      consultationCost: normalizedProcedureType === 'consulta' ? healthDraft.consultationCost : undefined,
      returnDate: normalizedProcedureType === 'consulta' ? healthDraft.returnDate : undefined,
      treatmentType: normalizedProcedureType === 'tratamento' ? healthDraft.treatmentType : undefined,
      productName: normalizedProcedureType === 'tratamento' ? healthDraft.productName : undefined,
      applicationMethod: normalizedProcedureType === 'tratamento' ? healthDraft.applicationMethod : undefined,
      treatmentDetails: normalizedProcedureType === 'tratamento' ? healthDraft.treatmentDetails : undefined,
      nextDoseDate: normalizedProcedureType === 'tratamento' && healthHasNextDose ? healthDraft.nextDoseDate : undefined,
      estimatedCost:
        normalizedProcedureType === 'consulta'
          ? (healthDraft.consultationCost ?? 0)
          : (healthDraft.estimatedCost ?? 0),
      id: editingHealthId ?? crypto.randomUUID(),
      createdAt: editingHealthId
        ? healthRecords.find((item) => item.id === editingHealthId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
    });
    resetHealthForm();
    return true;
  };

  const handleEditHealthRecord = useCallback((record: HealthRecord) => {
    const { id, createdAt, ...rest } = record;
    const normalizedProcedureType = normalizeHealthProcedureType(record.procedureType);
    setEditingHealthId(id);
    setHealthHasNextDose(Boolean(record.nextDoseDate));
    setHealthDraft({ ...rest, procedureType: normalizedProcedureType });
    setIsHealthFormOpen(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }, []);

  const handleDeleteHealthRecord = useCallback(
    (id: string) => {
      void onDeleteHealthRecord(id);
    },
    [onDeleteHealthRecord],
  );

  const handleSaveStock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stockDraft.name.trim()) return notifyValidation('Informe o nome do insumo veterinário.');
    if (stockDraft.quantity < 0) return notifyValidation('A quantidade em estoque não pode ser negativa.');
    if (stockDraft.minimumStock < 0) return notifyValidation('O estoque mínimo não pode ser negativo.');

    await onSaveVeterinaryStock({
      ...stockDraft,
      id: editingStockId ?? crypto.randomUUID(),
      createdAt: editingStockId ? veterinaryStock.find((item) => item.id === editingStockId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    });
    resetStockForm();
  };

  const handleSaveMortality = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mortalityDraft.date) return notifyValidation('Informe a data da ocorrência.');
    if (!mortalityDraft.animalId) return notifyValidation('Selecione o lote.');
    if (mortalityDraft.deadCount <= 0) return notifyValidation('Informe a quantidade de perdas.');

    const animal = animalMap.get(mortalityDraft.animalId);
    const previousRecord = editingMortalityId ? mortalityRecords.find((item) => item.id === editingMortalityId) : undefined;
    const availableBirds =
      (animal ? getAnimalCurrentQuantity(animal) : 0) +
      (previousRecord && previousRecord.animalId === mortalityDraft.animalId ? previousRecord.deadCount : 0);

    if (animal && mortalityDraft.deadCount > availableBirds) {
      return notifyValidation('A quantidade informada excede a população disponível no lote.');
    }

    const recordToSave = {
      ...mortalityDraft,
      id: editingMortalityId ?? crypto.randomUUID(),
      createdAt:
        editingMortalityId
          ? mortalityRecords.find((item) => item.id === editingMortalityId)?.createdAt ?? new Date().toISOString()
          : new Date().toISOString(),
    };
    await onSaveMortalityRecord(recordToSave);
    resetMortalityForm();
  };

  const handleAddAttachments = async (files: FileList | null) => {
    try {
      const attachments = await readAttachments(files);
      setMortalityDraft((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...attachments].slice(0, 5),
      }));
    } catch {
      toast.error('Falha ao carregar anexos', 'Não foi possível processar os arquivos selecionados.');
    }
  };

  const healthExportRows = filteredHealthRecords.map((record) => [
    record.occurredAt.replace('T', ' '),
    HEALTH_PROCEDURE_LABELS[record.procedureType],
    animalMap.get(record.animalId)?.tag || 'Lote removido',
    galpaoMap.get(record.galpaoId)?.name || '-',
    professionalMap.get(record.professionalId)?.name || '-',
    record.title,
    record.diseaseName || '-',
    record.procedureType === 'monitoramento' ? '-' : String(record.affectedBirdCount ?? 0),
    record.procedureType === 'monitoramento' ? '-' : currencyFormatter.format(record.estimatedCost ?? 0),
    HEALTH_RECOVERY_LABELS[record.recoveryStatus],
  ]);

  const mortalityExportRows = filteredMortalityRecords.map((record) => [
    record.date,
    animalMap.get(record.animalId)?.tag || 'Lote removido',
    String(record.deadCount),
    String(record.cause),
    record.notes,
  ]);

  const tabs: Array<{ id: ManejoSection; label: string }> = [
    { id: 'registro', label: 'Registro de Manejo' },
    { id: 'recomendacoes', label: 'Recomendações e Clima' },
    { id: 'saude', label: 'Saúde' },
    { id: 'mortalidade', label: 'Mortalidade' },
  ];

  if (selectedKnowledgeModule) {
    return (
      <KnowledgeModulePage
        module={selectedKnowledgeModule}
        onBack={() => setSelectedKnowledgeModule(null)}
      />
    );
  }

  return (
    <div className="app-section space-y-6">
      <section className="app-section-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="app-section-badge">Operações</div>
            <h1 className="app-section-title">Operações • Manejo</h1>
            <p className="app-section-description">
              Centralize galpões, saúde e mortalidade em um fluxo integrado, com permissões sanitárias, alertas em tempo real,
              relatórios por lote e controle populacional automático.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                  activeSection === tab.id
                    ? 'bg-brand-primary text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-slate-50',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {(errorMessage || isSyncing) && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="text-sm font-medium text-amber-800">{errorMessage || 'Sincronizando dados de manejo com o Supabase...'}</div>
            {errorMessage && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-full border border-amber-300 px-4 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-white"
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </section>

      {/* Registro de Manejo */}
      {activeSection === 'registro' && (
        <section className="app-section-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-brand-primary" />
                <h2 className="text-lg font-extrabold text-[#0f1c2b]">Registro de Manejo</h2>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Preencha os dados da coleta, registre disponibilidade para venda e visualize o histórico.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRegistroSubSection('form')}
              className={[
                'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                registroSubSection === 'form'
                  ? 'bg-brand-primary text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-slate-50',
              ].join(' ')}
            >
              Formulário
            </button>
            <button
              type="button"
              onClick={() => setRegistroSubSection('disponibilidade')}
              className={[
                'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                registroSubSection === 'disponibilidade'
                  ? 'bg-brand-primary text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-slate-50',
              ].join(' ')}
            >
              Disponibilidade para Venda
            </button>
            <button
              type="button"
              onClick={() => setRegistroSubSection('historico')}
              className={[
                'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                registroSubSection === 'historico'
                  ? 'bg-brand-primary text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-slate-50',
              ].join(' ')}
            >
              Histórico de Manejo
            </button>
          </div>
          
          {registroSubSection === 'form' && (
            <div className="mt-6">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveManejo}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data</span>
                  <input
                    type="date"
                    value={manejoDraft.date}
                    onChange={(e) => setManejoDraft((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lote</span>
                  <select
                    value={manejoDraft.animalId}
                    onChange={(e) => {
                      const selectedAnimalId = e.target.value;
                      const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);
                      
                      // Lógica de correspondência mais robusta
                      const matchingFormulation = formulations.find((f) => {
                        // Converte para string e remove espaços em branco
                        const fAnimalId = String(f.animalId || '').trim();
                        const sAnimalId = String(selectedAnimalId || '').trim();
                        return fAnimalId === sAnimalId && fAnimalId !== '';
                      });
                      
                      let recommendedRacaoKg = 0;
                      if (selectedAnimal) {
                        const ageDays = getBirdAgeInDays(selectedAnimal.birthDate);
                        const phase = getPhaseByAge(ageDays);
                        const birdCount = getAnimalCurrentQuantity(selectedAnimal);
                        const consumptionPerBirdG = NUTRITIONAL_TARGETS[phase].consumption;
                        recommendedRacaoKg = (consumptionPerBirdG * birdCount) / 1000;
                      }
                      setManejoDraft((prev) => ({
                        ...prev,
                        animalId: selectedAnimalId,
                        formulationId: matchingFormulation?.id || '',
                        racaoKg: recommendedRacaoKg,
                      }));
                    }}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">Selecione</option>
                    {animals.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {getAnimalLabel(animal)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Turno</span>
                  <select
                    value={manejoDraft.turno}
                    onChange={(e) => setManejoDraft((prev) => ({ ...prev, turno: e.target.value as any }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    {Object.entries(TURNO_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Ovos Coletados</span>
                  <input
                    type="number"
                    min="0"
                    value={manejoDraft.ovosColetados}
                    onChange={(e) => setManejoDraft((prev) => ({ ...prev, ovosColetados: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Ovos Danificados</span>
                  <input
                    type="number"
                    min="0"
                    value={manejoDraft.ovosDanificados}
                    onChange={(e) => setManejoDraft((prev) => ({ ...prev, ovosDanificados: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Formulação Utilizada</span>
                  <select
                    value={manejoDraft.formulationId}
                    onChange={(e) => setManejoDraft((prev) => ({ ...prev, formulationId: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">Selecione uma formulação</option>
                    {formulations.filter((f) => !f.animalId || f.animalId === manejoDraft.animalId).map((formulation) => (
                      <option key={formulation.id} value={formulation.id}>
                        {formulation.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Ração (kg)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={manejoDraft.racaoKg}
                    onChange={(e) => setManejoDraft((prev) => ({ ...prev, racaoKg: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Peso Médio Ovos (g)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={manejoDraft.pesoMedioOvos}
                    onChange={(e) => setManejoDraft((prev) => ({ ...prev, pesoMedioOvos: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Tamanho dos Ovos</span>
                  <select
                    value={manejoDraft.tamanhoOvos}
                    onChange={(e) => setManejoDraft((prev) => ({ ...prev, tamanhoOvos: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    {Object.entries(TAMANHO_OVOS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500 text-gray-500">Porta Aberta</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <input
                      type="checkbox"
                      checked={manejoDraft.portaAberta}
                      onChange={(e) => setManejoDraft((prev) => ({ ...prev, portaAberta: e.target.checked }))}
                    />
                    <span className="text-sm text-[#0f1c2b]">{manejoDraft.portaAberta ? 'Sim' : 'Não'}</span>
                  </div>
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {editingManejoId ? 'Atualizar Registro' : 'Salvar Registro'}
                  </button>
                  {editingManejoId && (
                    <button
                      type="button"
                      onClick={resetManejoForm}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-8 rounded-2xl border border-gray-200 bg-slate-50 p-4">
                <h3 className="text-sm font-extrabold text-[#0f1c2b]">Resumo Rápido</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Ovos Bons</p>
                    <p className="text-2xl font-extrabold text-[#0f1c2b]">
                      {manejoDraft.ovosColetados - manejoDraft.ovosDanificados}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Taxa de Danificação</p>
                    <p className="text-2xl font-extrabold text-[#0f1c2b]">
                      {manejoDraft.ovosColetados > 0
                        ? `${((manejoDraft.ovosDanificados / manejoDraft.ovosColetados) * 100).toFixed(1)}%`
                        : '-'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Ovos/Danificados</p>
                    <p className="text-2xl font-extrabold text-[#0f1c2b]">
                      {manejoDraft.ovosColetados} / {manejoDraft.ovosDanificados}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Ração Disponível</p>
                    <p className="text-2xl font-extrabold text-[#0f1c2b]">
                      {feedSummary.totalStock.toFixed(1)} kg
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Dias de Ração</p>
                    <p className="text-2xl font-extrabold text-[#0f1c2b]">
                      {feedSummary.daysRemaining !== null 
                        ? `${Math.floor(feedSummary.daysRemaining)} dias` 
                        : '-'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Ração do Dia</p>
                    <p className="text-2xl font-extrabold text-[#0f1c2b]">
                      {manejoDraft.racaoKg.toFixed(1)} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {registroSubSection === 'disponibilidade' && (
            <div className="mt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-primary" />
                    <h3 className="text-lg font-extrabold text-[#0f1c2b]">Disponibilidade para Venda</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Atualize a disponibilidade de galinhas vivas, limpas e cama de aviário.
                  </p>
                </div>
              </div>

              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSaveDisponibilidade}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data</span>
                  <input
                    type="date"
                    value={disponibilidadeDraft.date}
                    onChange={(e) => setDisponibilidadeDraft((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <div></div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Galinhas Vivas</span>
                  <input
                    type="number"
                    min="0"
                    value={disponibilidadeDraft.galinhasVivas}
                    onChange={(e) => setDisponibilidadeDraft((prev) => ({ ...prev, galinhasVivas: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Galinhas Limpas</span>
                  <input
                    type="number"
                    min="0"
                    value={disponibilidadeDraft.galinhasLimpas}
                    onChange={(e) => setDisponibilidadeDraft((prev) => ({ ...prev, galinhasLimpas: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Cama de Aviário (unidades)</span>
                  <input
                    type="number"
                    min="0"
                    value={disponibilidadeDraft.camaAviarioUnidades}
                    onChange={(e) => setDisponibilidadeDraft((prev) => ({ ...prev, camaAviarioUnidades: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {editingDisponibilidadeId ? 'Atualizar Disponibilidade' : 'Salvar Disponibilidade'}
                  </button>
                  {editingDisponibilidadeId && (
                    <button
                      type="button"
                      onClick={resetDisponibilidadeForm}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-8">
                <h3 className="text-sm font-extrabold text-[#0f1c2b]">Últimos Registros de Disponibilidade</h3>
                <div className="mt-4 space-y-3">
                  {disponibilidadeVenda.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
                      Nenhum registro de disponibilidade ainda.
                    </div>
                  ) : (
                    [...disponibilidadeVenda]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((disp) => (
                        <div key={disp.id} className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="text-base font-extrabold text-[#0f1c2b]">
                                {new Date(disp.date).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="mt-2 grid gap-2 text-xs text-gray-500 md:grid-cols-3">
                                <span className="rounded-full bg-white px-3 py-1">
                                  Galinhas Vivas: {numberFormatter.format(disp.galinhasVivas)}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1">
                                  Galinhas Limpas: {numberFormatter.format(disp.galinhasLimpas)}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1">
                                  Cama: {numberFormatter.format(disp.camaAviarioUnidades)} un.
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const { id, createdAt, updatedAt, ...rest } = disp;
                                  setEditingDisponibilidadeId(id);
                                  setDisponibilidadeDraft(rest);
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-white"
                              >
                                <Edit3 className="h-4 w-4" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void onDeleteDisponibilidadeVenda(disp.id)}
                                disabled={isSyncing}
                                className="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {registroSubSection === 'historico' && (
            <div className="mt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <FileDown className="h-5 w-5 text-brand-primary" />
                    <h3 className="text-lg font-extrabold text-[#0f1c2b]">Histórico de Manejo</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Visualize e edite registros anteriores de manejo.</p>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                {manejoRecords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
                    Nenhum registro de manejo ainda.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Lote
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Turno
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Ovos Coletados
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Ovos Danificados
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Ovos Bons
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Ração (kg)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Formulação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {[...manejoRecords]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record) => {
                          const animal = animalMap.get(record.animalId);
                          const formulation = formulations.find((f) => f.id === record.formulationId);
                          const ovosBons = record.ovosColetados - record.ovosDanificados;
                          return (
                            <tr key={record.id}>
                              <td className="px-4 py-3 text-sm text-[#0f1c2b]">
                                {new Date(record.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {animal ? getAnimalLabel(animal) : 'Lote removido'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{TURNO_LABELS[record.turno]}</td>
                              <td className="px-4 py-3 text-sm text-[#0f1c2b]">
                                {numberFormatter.format(record.ovosColetados)}
                              </td>
                              <td className="px-4 py-3 text-sm text-red-600">
                                {numberFormatter.format(record.ovosDanificados)}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-green-600">{numberFormatter.format(ovosBons)}</td>
                              <td className="px-4 py-3 text-sm text-[#0f1c2b]">{record.racaoKg}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {formulation ? formulation.name : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const { id, createdAt, updatedAt, ...rest } = record;
                                      setEditingManejoId(id);
                                      setManejoDraft(rest);
                                      setRegistroSubSection('form');
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs font-bold text-gray-700 transition-colors hover:bg-slate-50"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void onDeleteManejoRecord(record.id)}
                                    disabled={isSyncing}
                                    className="inline-flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Assistente Inteligente de Manejo */}
      {activeSection === 'recomendacoes' && (
        <section className="grid gap-6">
          <div className="app-section-card relative overflow-hidden border-0 bg-white ring-1 ring-gray-200">
            {/* Premium Gradient Background Effect */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-brand-primary opacity-5 blur-3xl" />
            
            <div className="relative flex items-center gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-active text-white shadow-lg shadow-brand-primary/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0f1c2b]">Assistente Inteligente</h2>
                <p className="text-xs font-medium text-gray-500">Análise cruzada de clima, idade do lote e desempenho</p>
              </div>
            </div>

            <div className="relative mt-6 grid gap-4">
              {sortedRecommendations.map((rec) => {
                let Icon = AlertCircle;
                let bgClass = 'bg-gray-50';
                let borderClass = 'border-gray-200';
                let textClass = 'text-gray-800';
                let iconColor = 'text-gray-500';

                // Determine styles by priority and type
                if (rec.tipo === 'alerta') {
                  if (rec.prioridade === 'alta') {
                    bgClass = 'bg-red-50/80';
                    borderClass = 'border-red-200';
                    textClass = 'text-red-900';
                    iconColor = 'text-red-600';
                  } else {
                    bgClass = 'bg-amber-50/80';
                    borderClass = 'border-amber-200';
                    textClass = 'text-amber-900';
                    iconColor = 'text-amber-600';
                  }
                } else if (rec.tipo === 'sucesso') {
                  bgClass = 'bg-emerald-50/80';
                  borderClass = 'border-emerald-200';
                  textClass = 'text-emerald-900';
                  iconColor = 'text-emerald-600';
                } else {
                  bgClass = 'bg-brand-main';
                  borderClass = 'border-brand-primary/20';
                  textClass = 'text-brand-active';
                  iconColor = 'text-brand-primary';
                }

                // Determine icon by category
                if (rec.categoria === 'clima') Icon = CloudLightning;
                else if (rec.categoria === 'nutricao') Icon = Leaf;
                else if (rec.categoria === 'sanidade') Icon = ShieldAlert;
                else if (rec.categoria === 'producao') Icon = Egg;
                else if (rec.categoria === 'geral') Icon = Lightbulb;

                return (
                  <div
                    key={rec.id}
                    className={`group flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start transition-all hover:shadow-md ${bgClass} ${borderClass}`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-extrabold ${textClass}`}>{rec.titulo}</h3>
                        {rec.prioridade === 'alta' && (
                          <span className="inline-flex animate-pulse items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                            Urgente
                          </span>
                        )}
                      </div>
                      <p className={`mt-1.5 text-sm font-medium leading-relaxed opacity-90 ${textClass}`}>
                        {rec.descricao}
                      </p>
                      
                      {rec.knowledgeModuleId && (
                        <button
                          onClick={() => {
                            const module = KNOWLEDGE_MODULES.find(m => m.id === rec.knowledgeModuleId);
                            if (module) setSelectedKnowledgeModule(module);
                          }}
                          className={`mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-4 py-2 text-xs font-bold shadow-sm ring-1 ring-black/5 transition-all hover:bg-white hover:shadow ${iconColor}`}
                        >
                          <Activity className="h-3.5 w-3.5" />
                          Aprender como lidar com isso
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {activeSection === 'saude' && (
        <>
          {/* Caderneta de Saúde (Calendário e Lembretes) */}
          <section className="grid gap-6 mb-6">
            <div className="app-section-card relative overflow-hidden border-0 bg-white ring-1 ring-gray-200">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-brand-primary opacity-5 blur-3xl" />
              
              <div className="relative flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-active text-white shadow-lg shadow-brand-primary/30">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f1c2b]">Caderneta de Saúde</h2>
                  <p className="text-xs font-medium text-gray-500">Calendário de vacinação sugerido e lembretes de tratamentos ativos</p>
                </div>
              </div>

              <div className="relative mt-6 grid gap-4 lg:grid-cols-2">
                {/* Lotes em Tratamento Contínuo */}
                <div className="rounded-2xl border border-brand-primary/20 bg-brand-main p-4">
                  <div className="flex items-center gap-2 font-extrabold text-brand-active mb-4">
                    <Activity className="h-4 w-4" />
                    Lotes em Tratamento Contínuo
                  </div>
                  <div className="space-y-3">
                    {healthRecords.filter((r) => r.recoveryStatus === 'em_tratamento').length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                        Nenhum lote em tratamento no momento.
                      </div>
                    ) : (
                      healthRecords
                        .filter((r) => r.recoveryStatus === 'em_tratamento')
                        .map((r) => (
                          <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
                            <div>
                              <span className="block text-sm font-bold text-[#0f1c2b]">
                                {animalMap.get(r.animalId)?.tag || 'Lote Removido'}
                              </span>
                              <span className="block text-xs font-medium text-gray-500 truncate max-w-[200px]">
                                {r.title}
                              </span>
                            </div>
                            <span className="shrink-0 rounded-full bg-brand-primary/10 px-2 py-1 text-[10px] font-bold text-brand-active">
                              EM CURSO
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Previsão de Vacinação Padrão */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-800 mb-4">
                    <ShieldCheck className="h-4 w-4" />
                    Calendário de Vacinação Padrão (Sugestão)
                  </div>
                  <div className="space-y-3">
                    {animals.filter((a) => ['ativo', 'quarentena'].includes(a.status)).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-emerald-200 p-4 text-center text-sm text-emerald-600/70">
                        Nenhum lote ativo para vacinação.
                      </div>
                    ) : (
                      animals
                        .filter((a) => ['ativo', 'quarentena'].includes(a.status))
                        .map((animal) => {
                          const ageDays = getBirdAgeInDays(animal.birthDate);
                          // Regra simplificada de vacinação: Marek (1d), Gumboro (14d), Newcastle (21d), Bouba (28d)
                          const vaccines = [
                            { name: 'Marek / Bouba', day: 1 },
                            { name: 'Gumboro', day: 14 },
                            { name: 'Newcastle / Bronquite', day: 21 },
                            { name: 'Bouba Aviária (reforço)', day: 28 },
                            { name: 'Coriza / Salmonella', day: 42 },
                          ];
                          const pending = vaccines.find((v) => ageDays <= v.day);
                          if (!pending) return null;

                          return (
                            <div key={animal.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
                              <div>
                                <span className="block text-sm font-bold text-[#0f1c2b]">{animal.tag}</span>
                                <span className="block text-xs font-medium text-gray-500">Idade atual: {ageDays} dias</span>
                              </div>
                              <div className="text-right">
                                <span className="block text-sm font-extrabold text-emerald-600">{pending.name}</span>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.14em]">
                                  SUGERIDO DIA {pending.day}
                                </span>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Indicadores sanitários (Moved to Top) */}
          <section className="grid gap-6 mb-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Incidências</div>
                <div className="mt-1 text-2xl font-extrabold text-[#0f1c2b]">{filteredHealthRecords.length}</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Recuperação</div>
                <div className="mt-1 text-2xl font-extrabold text-[#0f1c2b]">{healthReport.recoveryRatePercent.toFixed(1)}%</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Custos Saúde</div>
                <div className="mt-1 text-2xl font-extrabold text-[#0f1c2b]">{currencyFormatter.format(healthReport.totalCost)}</div>
              </div>
              <div className={`rounded-2xl border shadow-sm p-4 flex flex-col justify-center ${authorizedProfessionals.length === 0 ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Permissões</div>
                <div className="mt-1 text-sm font-bold text-[#0f1c2b]">
                  {authorizedProfessionals.length === 0
                    ? 'Nenhum prof. autorizado'
                    : `${authorizedProfessionals.length} prof. apto(s)`}
                </div>
              </div>
            </div>
          </section>

          {/* Alertas de Saúde */}
          {healthAlerts.length > 0 && (
            <section className="mb-6">
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-amber-800">
                    Alertas de Saúde ({healthAlerts.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {healthAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between gap-3 rounded-xl p-3 ${
                        alert.priority === 'urgent' ? 'bg-red-100 border border-red-300' :
                        alert.priority === 'high' ? 'bg-orange-100 border border-orange-300' :
                        'bg-yellow-100 border border-yellow-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase tracking-[0.08em] ${
                            alert.priority === 'urgent' ? 'text-red-700' :
                            alert.priority === 'high' ? 'text-orange-700' :
                            'text-yellow-700'
                          }`}>
                            {alert.priority === 'urgent' ? 'URGENTE' :
                             alert.priority === 'high' ? 'IMPORTANTE' : 'AVISO'}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            {new Date(alert.scheduledDate).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#0f1c2b] mt-1">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReadHealthAlerts((prev) => new Set([...prev, alert.id]));
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="app-section-card flex flex-col h-full">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
                <div className="flex items-center gap-3">
                  <HeartPulse className="h-5 w-5 text-brand-primary" />
                  <h2 className="text-lg font-extrabold text-[#0f1c2b]">Histórico Médico</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => exportRowsToPdf('Relatório de Saúde', ['Data/Hora', 'Procedimento', 'Lote', 'Galpão', 'Profissional', 'Título', 'Doença', 'Aves afetadas', 'Custo', 'Status'], healthExportRows)} className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-slate-50">
                    <FileDown className="h-3 w-3" /> PDF
                  </button>
                  <button type="button" onClick={() => {
                    setIsHealthFormOpen(!isHealthFormOpen);
                    if (editingHealthId) resetHealthForm();
                  }} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-hover">
                    {isHealthFormOpen && !editingHealthId ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {isHealthFormOpen && !editingHealthId ? 'Cancelar' : 'Nova Intervenção'}
                  </button>
                </div>
              </div>
              
              {/* Form is collapsible */}
              {isHealthFormOpen && (
                <div className="mb-6 rounded-2xl border border-brand-primary/10 bg-brand-main/30 p-5 shadow-inner ring-1 ring-brand-primary/20">
                  <h3 className="text-sm font-bold text-[#0f1c2b] mb-4">
                    {editingHealthId ? 'Editar Intervenção' : 'Registrar Nova Intervenção'}
                  </h3>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={async (e) => {
                    const saved = await handleSaveHealth(e);
                    if (saved) setIsHealthFormOpen(false);
                  }}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data e hora</span>
                  <input type="datetime-local" value={healthDraft.occurredAt} onChange={(event) => setHealthDraft((prev) => ({ ...prev, occurredAt: event.target.value }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Tipo de procedimento</span>
                  <select value={healthDraft.procedureType} onChange={(event) => setHealthDraft((prev) => ({ ...prev, procedureType: event.target.value as HealthRecord['procedureType'] }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                    {HEALTH_PROCEDURE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lote afetado</span>
                  <select value={healthDraft.animalId} onChange={(event) => {
                    const animalId = event.target.value;
                    const selectedAnimal = animals.find(animal => animal.id === animalId);
                    // Auto-set galpão and affected bird count
                    const galpao = findGalpaoForAnimal(animalId, galpoes);
                    setHealthDraft((prev) => ({ 
                      ...prev, 
                      animalId, 
                      galpaoId: galpao?.id || prev.galpaoId,
                      affectedBirdCount: selectedAnimal ? (selectedAnimal.currentQuantity ?? selectedAnimal.quantity) : 0
                    }));
                  }} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                    <option value="">Selecione</option>
                    {animals.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {getAnimalLabel(animal)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Galpão</span>
                  <select value={healthDraft.galpaoId} onChange={(event) => {
                    const galpaoId = event.target.value;
                    // If selecting a galpão, optionally set animalId if needed
                    setHealthDraft((prev) => ({ ...prev, galpaoId }));
                  }} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                    <option value="">Selecione</option>
                    {galpoes.map((galpao) => (
                      <option key={galpao.id} value={galpao.id}>
                        {getGalpaoLabel(galpao)}
                      </option>
                    ))}
                  </select>
                </label>
                {healthDraft.procedureType !== 'monitoramento' && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Profissional autorizado</span>
                    <select value={healthDraft.professionalId} onChange={(event) => setHealthDraft((prev) => ({ ...prev, professionalId: event.target.value }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                      <option value="">Selecione</option>
                      {healthProfessionals.map((professional) => (
                        <option key={professional.id} value={professional.id}>
                          {professional.name} • {ACCESS_LABELS[professional.accessLevel]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {healthDraft.procedureType === 'tratamento' && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Aves afetadas</span>
                    <input type="number" min={0} value={healthDraft.affectedBirdCount} onChange={(event) => setHealthDraft((prev) => ({ ...prev, affectedBirdCount: Number(event.target.value || 0) }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                  </label>
                )}
                
                {/* Campos condicionais por tipo de procedimento */}

                {/* CAMPOS PARA CONSULTA */}
                {healthDraft.procedureType === 'consulta' && (
                  <>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor da consulta *</span>
                      <input type="number" min="0" step="0.01" required value={healthDraft.consultationCost || ''} onChange={(event) => setHealthDraft((prev) => ({ ...prev, consultationCost: Number(event.target.value) }))} placeholder="0.00" className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data de retorno</span>
                      <input type="datetime-local" value={healthDraft.returnDate || ''} onChange={(event) => setHealthDraft((prev) => ({ ...prev, returnDate: event.target.value }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                    </label>
                  </>
                )}

                {/* CAMPOS PARA TRATAMENTO */}
                {healthDraft.procedureType === 'tratamento' && (
                  <>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Tipo *</span>
                      <select value={healthDraft.treatmentType || ''} onChange={(event) => setHealthDraft((prev) => ({ ...prev, treatmentType: event.target.value as 'vacina' | 'medicamento' }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                        <option value="">Selecione</option>
                        <option value="vacina">Vacina</option>
                        <option value="medicamento">Remédio</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Nome do produto *</span>
                      <input required value={healthDraft.productName || ''} onChange={(event) => setHealthDraft((prev) => ({ ...prev, productName: event.target.value }))} placeholder="Ex: Amoxicilina, Newcastle Disease Vaccine" className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Modo de aplicação *</span>
                      <select value={healthDraft.applicationMethod || ''} onChange={(event) => setHealthDraft((prev) => ({ ...prev, applicationMethod: event.target.value }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                        <option value="">Selecione</option>
                        <option value="água">Na água</option>
                        <option value="seringa">Seringa</option>
                        <option value="oral">Via oral</option>
                        <option value="injeção">Injeção</option>
                        <option value="outro">Outro</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Próximas doses?</span>
                      <select value={healthHasNextDose ? 'sim' : 'nao'} onChange={(event) => {
                        const enabled = event.target.value === 'sim';
                        setHealthHasNextDose(enabled);
                        setHealthDraft((prev) => ({ ...prev, nextDoseDate: enabled ? (prev.nextDoseDate || '') : undefined }));
                      }} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                        <option value="nao">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </label>
                    {healthHasNextDose ? (
                      <label className="flex flex-col gap-1.5 md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data da próxima dose *</span>
                        <input type="datetime-local" value={healthDraft.nextDoseDate || ''} onChange={(event) => setHealthDraft((prev) => ({ ...prev, nextDoseDate: event.target.value }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                      </label>
                    ) : null}
                    <label className="flex flex-col gap-1.5 md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Detalhes do tratamento</span>
                      <textarea value={healthDraft.treatmentDetails || ''} onChange={(event) => setHealthDraft((prev) => ({ ...prev, treatmentDetails: event.target.value }))} rows={3} placeholder="Descreva mais detalhes sobre o tratamento (opcional)" className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                    </label>
                  </>
                )}

                {/* CAMPOS PARA MONITORAMENTO */}
                {healthDraft.procedureType === 'monitoramento' && (
                  <label className="flex flex-col gap-1.5 md:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Observações *</span>
                    <textarea required value={healthDraft.notes || ''} onChange={(event) => setHealthDraft((prev) => ({ ...prev, notes: event.target.value }))} rows={5} placeholder="Registre suas observações sobre o lote/animais..." className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                  </label>
                )}
                
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Procedimento / título</span>
                  <input value={healthDraft.title} onChange={(event) => setHealthDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Ex: Vacinação de reforço, consulta emergencial, protocolo medicamentoso" className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Doença / condição</span>
                  <input value={healthDraft.diseaseName} onChange={(event) => setHealthDraft((prev) => ({ ...prev, diseaseName: event.target.value }))} placeholder="Ex: coccidiose, verminose, vacinação preventiva" className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Custo estimado</span>
                  <input type="number" min={0} step={0.01} value={healthDraft.estimatedCost} onChange={(event) => setHealthDraft((prev) => ({ ...prev, estimatedCost: Number(event.target.value || 0) }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Status de recuperação</span>
                  <select value={healthDraft.recoveryStatus} onChange={(event) => setHealthDraft((prev) => ({ ...prev, recoveryStatus: event.target.value as HealthRecord['recoveryStatus'] }))} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                    {Object.entries(HEALTH_RECOVERY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Observações detalhadas</span>
                  <textarea value={healthDraft.notes} onChange={(event) => setHealthDraft((prev) => ({ ...prev, notes: event.target.value }))} rows={4} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" disabled={isSyncing || ((healthDraft.procedureType === 'consulta' || healthDraft.procedureType === 'tratamento') && authorizedProfessionals.length === 0)} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60">
                    <Plus className="h-4 w-4" />
                    {editingHealthId ? 'Atualizar intervenção' : 'Salvar intervenção'}
                  </button>
                  {editingHealthId && (
                    <button type="button" onClick={() => { resetHealthForm(); setIsHealthFormOpen(false); }} className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-slate-50">
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>
                  </form>
                </div>
              )}

              <div className="mt-2 space-y-3">
                {isLoading ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">Carregando registros de saúde...</div>
                ) : filteredHealthRecords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">Nenhum registro encontrado com os filtros atuais.</div>
                ) : (
                  filteredHealthRecords.map((record) => (
                    <HealthRecordCard
                      key={record.id}
                      record={record}
                      procedureLabel={HEALTH_PROCEDURE_LABELS[record.procedureType]}
                      animalLabel={animalMap.get(record.animalId)?.tag || 'Lote removido'}
                      galpaoLabel={galpaoMap.get(record.galpaoId)?.name || 'Galpão removido'}
                      professionalLabel={professionalMap.get(record.professionalId)?.name || 'Sem profissional'}
                      recoveryLabel={HEALTH_RECOVERY_LABELS[record.recoveryStatus]}
                      formattedCost={(record.estimatedCost ?? 0) > 0 ? currencyFormatter.format(record.estimatedCost ?? 0) : null}
                      showProfessional={record.procedureType === 'consulta' || record.procedureType === 'tratamento' || record.procedureType === 'vacina' || record.procedureType === 'medicamento'}
                      showAffectedBirds={record.procedureType === 'tratamento' || record.procedureType === 'vacina' || record.procedureType === 'medicamento'}
                      onEdit={handleEditHealthRecord}
                      onDelete={handleDeleteHealthRecord}
                      isSyncing={isSyncing}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="app-section-card">
                <div className="flex items-center gap-3">
                  <Warehouse className="h-5 w-5 text-brand-primary" />
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0f1c2b]">Estoque veterinário (Compras)</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Visualização de insumos veterinários, remédios e vacinas adquiridos no módulo de Compras. Para adicionar um novo item, registre uma compra.
                    </p>
                  </div>
                </div>

                <label className="mt-6 flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Busca no estoque</span>
                  <input
                    value={stockSearch}
                    onChange={(event) => setStockSearch(event.target.value)}
                    placeholder="Buscar por item, fornecedor ou finalidade"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>

                <div className="mt-6 space-y-3">
                  {(() => {
                    const vetPurchases = purchases.filter((p) => p.category === 'insumo_veterinario');
                    const filteredVetPurchases = vetPurchases.filter((p) => {
                      const search = stockSearch.toLowerCase().trim();
                      if (!search) return true;
                      const supplierName = suppliers.find((s) => s.id === p.supplierId)?.companyName || '';
                      return (
                        p.itemName.toLowerCase().includes(search) ||
                        supplierName.toLowerCase().includes(search) ||
                        p.veterinaryPurpose.toLowerCase().includes(search)
                      );
                    });

                    if (filteredVetPurchases.length === 0) {
                      return (
                        <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                          Nenhum insumo veterinário encontrado. Registre compras no módulo de Gestão para exibi-las aqui.
                        </div>
                      );
                    }

                    return filteredVetPurchases.map((item) => {
                      const supplierName = suppliers.find((s) => s.id === item.supplierId)?.companyName || 'Fornecedor não vinculado';
                      
                      let expirationStatus = 'Regular';
                      let expirationColorClass = 'bg-white text-gray-700';
                      
                      if (item.expirationDate) {
                        const daysToExpiration = Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        if (daysToExpiration < 0) {
                          expirationStatus = 'Vencido';
                          expirationColorClass = 'bg-red-100 text-red-700';
                        } else if (daysToExpiration <= 30) {
                          expirationStatus = `Vence em ${daysToExpiration} dia(s)`;
                          expirationColorClass = 'bg-amber-100 text-amber-700';
                        }
                      }

                      return (
                        <div key={item.id} className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                          <div className="flex flex-col gap-3">
                            <div>
                              <div className="text-base font-extrabold text-[#0f1c2b]">{item.itemName}</div>
                              <div className="mt-1 text-sm text-gray-500">
                                Comprado em {new Date(item.purchaseDate).toLocaleDateString('pt-BR')} • {supplierName}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-600">
                                  {item.quantity} {item.unit}
                                </span>
                                {item.veterinaryPurpose && (
                                  <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-600">
                                    Finalidade: {item.veterinaryPurpose}
                                  </span>
                                )}
                                {item.expirationDate && (
                                  <span className={`rounded-full px-3 py-1 border border-transparent ${expirationColorClass}`}>
                                    {expirationStatus} (Val: {new Date(item.expirationDate).toLocaleDateString('pt-BR')})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {activeSection === 'mortalidade' && (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="app-section-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <Skull className="h-5 w-5 text-brand-primary" />
                    <h2 className="text-lg font-extrabold text-[#0f1c2b]">Registro de Mortalidade</h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Registre as perdas do plantel com validação de estoque e baixa automática nas quantidades vivas.
                  </p>
                </div>
              </div>

              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSaveMortality}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data</span>
                  <input
                    type="date"
                    value={mortalityDraft.date}
                    onChange={(event) => setMortalityDraft((prev) => ({ ...prev, date: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Galpão</span>
                  <select
                    value={mortalityDraft.galpaoId}
                    onChange={(event) => {
                      const galpaoId = event.target.value;
                      // If selecting a galpão, optionally set animalId if needed
                      setMortalityDraft((prev) => ({ ...prev, galpaoId }));
                    }}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">Selecione</option>
                    {galpoes.map((galpao) => (
                      <option key={galpao.id} value={galpao.id}>
                        {getGalpaoLabel(galpao)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lote</span>
                  <select
                    value={mortalityDraft.animalId}
                    onChange={(event) => {
                      const animalId = event.target.value;
                      // Find and set galpaoId for this animalId
                      const galpao = findGalpaoForAnimal(animalId, galpoes);
                      setMortalityDraft((prev) => ({ 
                        ...prev, 
                        animalId, 
                        galpaoId: galpao?.id || prev.galpaoId 
                      }));
                    }}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">Selecione</option>
                    {animals.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {getAnimalLabel(animal)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Quantidade</span>
                  <input
                    type="number"
                    min={1}
                    value={mortalityDraft.deadCount}
                    onChange={(event) => setMortalityDraft((prev) => ({ ...prev, deadCount: Number(event.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Causa Suspeita</span>
                  <select
                    value={mortalityDraft.cause}
                    onChange={(event) => setMortalityDraft((prev) => ({ ...prev, cause: event.target.value as MortalityCause }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    {Object.entries(MORTALITY_CAUSE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Observações</span>
                  <textarea
                    value={mortalityDraft.notes}
                    onChange={(event) => setMortalityDraft((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={4}
                    placeholder="Ex: Aves encontradas perto da porta, crista arroxeada..."
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {editingMortalityId ? 'Atualizar Registro' : 'Registrar Mortalidade'}
                  </button>
                  {editingMortalityId && (
                    <button
                      type="button"
                      onClick={resetMortalityForm}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="app-section-card">
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Histórico de Mortalidade</h2>
              <div className="mt-6 space-y-3">
                {isLoading ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
                    Carregando histórico...
                  </div>
                ) : filteredMortalityRecords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
                    Nenhum registro de mortalidade encontrado.
                  </div>
                ) : (
                  filteredMortalityRecords.map((record) => {
                    const animal = animalMap.get(record.animalId);

                    return (
                      <div key={record.id} className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <div className="text-base font-extrabold text-[#0f1c2b]">
                              {MORTALITY_CAUSE_LABELS[record.cause as MortalityCause] || record.cause}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {record.date} • {animal?.tag || 'Lote removido'}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
                              <span className="rounded-full bg-white px-3 py-1">
                                {record.deadCount} ave{record.deadCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {record.notes && (
                              <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">
                                {record.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const { id, createdAt, ...rest } = record;
                                setEditingMortalityId(id);
                                setMortalityDraft(rest);
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-white"
                            >
                              <Edit3 className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteMortalityRecord(record.id)}
                              disabled={isSyncing}
                              className="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
