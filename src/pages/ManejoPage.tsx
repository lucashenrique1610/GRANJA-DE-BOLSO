
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  X,
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
  getHealthProcedureLabel,
} from '@/lib/manejo';
import { readWeatherCache } from '@/lib/weather';
import { exportRowsToExcel, exportRowsToPdf } from '@/lib/exportUtils';
import { useIntelligentRecommendations } from '@/hooks/useIntelligentRecommendations';
import { RegistroManejoSection } from '@/components/manejo/RegistroManejoSection';
import { RecomendacoesSection } from '@/components/manejo/RecomendacoesSection';
import { SaudeSection } from '@/components/manejo/SaudeSection';
import { MortalidadeSection } from '@/components/manejo/MortalidadeSection';
import {
  aggregateUnifiedHealthAlerts,
  buildCaipiraHealthRules,
} from '@/lib/vaccineCaipiraMG';
import {
  emptyGalpaoDraft,
  emptyProfessionalDraft,
  emptyHealthDraft,
  emptyStockDraft,
  emptyMortalityDraft,
  emptyManejoDraft,
  emptyDisponibilidadeDraft,
  findGalpaoForAnimal,
  getCardTone,
  normalizeHealthProcedureType,
  currencyFormatter,
  numberFormatter,
  matchesDateRange,
} from '@/components/manejo/ManejoSection.constants';

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
  farmState?: string;
  farmCity?: string;
  isPastureAccess?: boolean;
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
  farmState,
  farmCity,
  isPastureAccess = true,
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

  const [manejoSearch, setManejoSearch] = useState('');
  const [manejoFilters, setManejoFilters] = useState({
    animalId: '',
    turno: '',
    fromDate: '',
    toDate: '',
  });
  const [manejoSortBy, setManejoSortBy] = useState<'date' | 'ovosColetados'>('date');
  const [manejoSortOrder, setManejoSortOrder] = useState<'asc' | 'desc'>('desc');

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
  
  const {
    context: intelligentContext,
    activeFlow,
    currentQuestion,
    tips: personalizedTips,
    isQuestionnaireComplete,
    setContext: setIntelligentContext,
    answerQuestion,
    resetQuestionnaire,
  } = useIntelligentRecommendations();
  
  useEffect(() => {
    if (manejoDraft.animalId) {
      const selectedAnimal = animals.find(a => a.id === manejoDraft.animalId);
      if (selectedAnimal) {
        const ageDays = getBirdAgeInDays(selectedAnimal.birthDate);
        const phase = getPhaseByAge(ageDays);
        setIntelligentContext({
          lotId: selectedAnimal.id,
          species: selectedAnimal.species,
          ageDays,
          phase,
          birdCount: getAnimalCurrentQuantity(selectedAnimal),
          weatherData,
        });
      }
    } else {
      setIntelligentContext({
        ageDays: 0,
        birdCount: 0,
        weatherData,
      });
    }
  }, [manejoDraft.animalId, animals, weatherData, setIntelligentContext]);

  const healthRules = useMemo(
    () => buildCaipiraHealthRules({ state: farmState, city: farmCity, isPastureAccess: isPastureAccess ?? true }),
    [farmState, farmCity, isPastureAccess],
  );

  const healthAlerts = useMemo(() => {
    const allAlerts = aggregateUnifiedHealthAlerts({
      animals,
      healthRecords,
      rules: healthRules,
      maxDaysWindow: 30,
    });
    return allAlerts.filter(alert => !readHealthAlerts.has(alert.id));
  }, [animals, healthRecords, healthRules, readHealthAlerts]);

  const feedSummary = useMemo(() => {
    const totalStock = formulatedFeedStock
      .filter(stock => stock.formulationId === manejoDraft.formulationId)
      .reduce((sum, stock) => sum + stock.quantityKg, 0);

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
  
  const filteredManejoRecords = useMemo(() => {
    let results = [...manejoRecords];

    if (manejoSearch.trim()) {
      const searchLower = manejoSearch.toLowerCase();
      results = results.filter(record => {
        const animal = animalMap.get(record.animalId);
        const animalLabel = animal ? getAnimalLabel(animal).toLowerCase() : '';
        const dateStr = new Date(record.date).toLocaleDateString('pt-BR');
        return (
          animalLabel.includes(searchLower) ||
          dateStr.includes(searchLower) ||
          String(record.ovosColetados).includes(searchLower)
        );
      });
    }

    if (manejoFilters.animalId) {
      results = results.filter(record => record.animalId === manejoFilters.animalId);
    }

    if (manejoFilters.turno) {
      results = results.filter(record => record.turno === manejoFilters.turno);
    }

    if (manejoFilters.fromDate) {
      results = results.filter(record => record.date >= manejoFilters.fromDate);
    }
    if (manejoFilters.toDate) {
      results = results.filter(record => record.date <= manejoFilters.toDate);
    }

    results.sort((a, b) => {
      if (manejoSortBy === 'date') {
        return manejoSortOrder === 'desc'
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return manejoSortOrder === 'desc'
          ? b.ovosColetados - a.ovosColetados
          : a.ovosColetados - b.ovosColetados;
      }
    });

    return results;
  }, [manejoRecords, manejoSearch, manejoFilters, manejoSortBy, manejoSortOrder, animalMap]);

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

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const now = new Date();

    const activeAnimals = animals.filter(a => getAnimalCurrentQuantity(a) > 0);
    const hasCria = activeAnimals.some(a => getPhaseByAge(getBirdAgeInDays(a.birthDate)) === 'inicial_1_21');
    const hasPostura = activeAnimals.some(a => getPhaseByAge(getBirdAgeInDays(a.birthDate)) === 'postura' || getPhaseByAge(getBirdAgeInDays(a.birthDate)) === 'pre_postura_106_126');
    const totalBirds = activeAnimals.reduce((acc, a) => acc + getAnimalCurrentQuantity(a), 0);

    if (weatherData) {
      const temp = weatherData.temperature;
      const feelsLike = weatherData.feelsLike;
      const hum = weatherData.humidity;

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

    if (manejoRecords.length >= 3) {
      const sortedRecords = [...manejoRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recent = sortedRecords.slice(0, 3);
      const avgRecentFeed = recent.reduce((sum, r) => sum + r.racaoKg, 0) / recent.length;
      const lastRecord = recent[0];
      
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

    if (manejoDraft.formulationId && manejoDraft.racaoKg > 0) {
      const existingStock = formulatedFeedStock.filter(
        stock => stock.formulationId === manejoDraft.formulationId
      );
      
      if (existingStock.length > 0) {
        let remainingToDeduct = manejoDraft.racaoKg;
        const sortedStock = [...existingStock].sort(
          (a, b) => new Date(b.producedAt).getTime() - new Date(a.producedAt).getTime()
        );
        
        for (const stockItem of sortedStock) {
          if (remainingToDeduct <= 0) break;
          
          if (stockItem.quantityKg <= remainingToDeduct) {
            remainingToDeduct -= stockItem.quantityKg;
            await onSaveFormulatedFeed({
              ...stockItem,
              quantityKg: 0
            });
          } else {
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

  const handleSaveHealth = async (event: React.FormEvent<HTMLFormElement>): Promise<boolean> => {
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

  const healthExportRows = filteredHealthRecords.map((record) => ({
    'Data/Hora': record.occurredAt.replace('T', ' '),
    'Procedimento': record.procedureType,
    'Lote': animalMap.get(record.animalId)?.tag || 'Lote removido',
    'Galpão': galpaoMap.get(record.galpaoId)?.name || '-',
    'Profissional': professionalMap.get(record.professionalId)?.name || '-',
    'Título': record.title,
    'Doença': record.diseaseName || '-',
    'Aves afetadas': record.affectedBirdCount,
    'Custo': (record.estimatedCost ?? 0),
    'Status': record.recoveryStatus,
  }));

  const mortalityExportRows = filteredMortalityRecords.map((record) => ({
    'Data': record.date,
    'Lote': animalMap.get(record.animalId)?.tag || 'Lote removido',
    'Quantidade': record.deadCount,
    'Causa': record.cause,
    'Observações': record.notes,
  }));

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
      <div className="flex flex-wrap gap-2 mb-2">
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

      {healthAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-amber-900">
              Alertas de Saúde ({healthAlerts.length})
            </h3>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 bg-white/70 border border-amber-200 rounded-full px-2.5 py-0.5">
              Visível em todas as abas
            </span>
          </div>
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {healthAlerts.slice(0, 5).map((alert) => {
              const tone =
                alert.priority === 'urgent'
                  ? 'bg-red-100/90 border border-red-300'
                  : alert.priority === 'high'
                    ? 'bg-orange-100/90 border border-orange-300'
                    : alert.priority === 'medium'
                      ? 'bg-yellow-100/90 border border-yellow-300'
                      : 'bg-slate-100 border border-slate-300';
              const chip =
                alert.priority === 'urgent'
                  ? 'bg-red-200 text-red-900'
                  : alert.priority === 'high'
                    ? 'bg-orange-200 text-orange-900'
                    : alert.priority === 'medium'
                      ? 'bg-yellow-200 text-yellow-900'
                      : 'bg-slate-200 text-slate-700';
              const chipLabel =
                alert.priority === 'urgent' ? 'URGENTE' : alert.priority === 'high' ? 'ALTA' : alert.priority === 'medium' ? 'MÉDIA' : 'BAIXA';
              return (
                <div key={alert.id} className={`flex items-start justify-between gap-3 rounded-xl p-3 ${tone}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.12em] rounded-full px-2 py-0.5 ${chip}`}>
                        {chipLabel}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                        {new Date(alert.scheduledDate).toLocaleDateString('pt-BR')}
                      </span>
                      {alert.animalTag && (
                        <span className="text-[10px] font-bold text-slate-700 bg-white/70 rounded-full px-2 py-0.5 border border-slate-300">
                          {alert.animalTag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[#0f1c2b] leading-snug">{alert.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">{alert.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Set(readHealthAlerts);
                      next.add(alert.id);
                      setReadHealthAlerts(next);
                    }}
                    className="shrink-0 text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-white/50"
                    aria-label="Dispensar alerta"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {healthAlerts.length > 5 && (
              <button
                type="button"
                onClick={() => setActiveSection('saude')}
                className="w-full text-center text-xs font-bold text-amber-800 hover:text-amber-900 py-1.5 rounded-lg hover:bg-white/50 transition-colors"
              >
                + {healthAlerts.length - 5} alerta(s) adicional(is) — ver detalhes na aba Saúde
              </button>
            )}
          </div>
        </div>
      )}

      {(errorMessage || isSyncing) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
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

      {activeSection === 'registro' && (
        <RegistroManejoSection
          animals={animals}
          manejoRecords={filteredManejoRecords}
          disponibilidadeVenda={disponibilidadeVenda}
          formulations={formulations}
          formulatedFeedStock={formulatedFeedStock}
          onSaveManejoRecord={handleSaveManejo}
          onDeleteManejoRecord={onDeleteManejoRecord}
          onSaveDisponibilidadeVenda={handleSaveDisponibilidade}
          onDeleteDisponibilidadeVenda={onDeleteDisponibilidadeVenda}
          onSaveFormulatedFeed={onSaveFormulatedFeed}
          isSyncing={isSyncing}
          registroSubSection={registroSubSection}
          setRegistroSubSection={setRegistroSubSection}
          manejoSearch={manejoSearch}
          setManejoSearch={setManejoSearch}
          manejoFilters={manejoFilters}
          setManejoFilters={setManejoFilters}
          manejoSortBy={manejoSortBy}
          setManejoSortBy={setManejoSortBy}
          manejoSortOrder={manejoSortOrder}
          setManejoSortOrder={setManejoSortOrder}
          manejoDraft={manejoDraft}
          setManejoDraft={setManejoDraft}
          editingManejoId={editingManejoId}
          setEditingManejoId={setEditingManejoId}
          resetManejoForm={resetManejoForm}
          disponibilidadeDraft={disponibilidadeDraft}
          setDisponibilidadeDraft={setDisponibilidadeDraft}
          editingDisponibilidadeId={editingDisponibilidadeId}
          setEditingDisponibilidadeId={setEditingDisponibilidadeId}
          resetDisponibilidadeForm={resetDisponibilidadeForm}
          intelligentContext={intelligentContext}
          activeFlow={activeFlow}
          currentQuestion={currentQuestion}
          personalizedTips={personalizedTips}
          isQuestionnaireComplete={isQuestionnaireComplete}
          answerQuestion={answerQuestion}
          resetQuestionnaire={resetQuestionnaire}
        />
      )}

      {activeSection === 'recomendacoes' && (
        <RecomendacoesSection
          recommendations={sortedRecommendations}
          animals={animals}
          galpoes={galpoes}
          selectedKnowledgeModule={selectedKnowledgeModule}
          setSelectedKnowledgeModule={setSelectedKnowledgeModule}
          weatherData={weatherData}
        />
      )}

      {activeSection === 'saude' && (
        <SaudeSection
          animals={animals}
          galpoes={galpoes}
          healthRecords={healthRecords}
          healthProfessionals={healthProfessionals}
          purchases={purchases}
          suppliers={suppliers}
          isLoading={isLoading}
          isSyncing={isSyncing}
          isHealthFormOpen={isHealthFormOpen}
          setIsHealthFormOpen={setIsHealthFormOpen}
          editingHealthId={editingHealthId}
          setEditingHealthId={setEditingHealthId}
          healthDraft={healthDraft}
          setHealthDraft={setHealthDraft}
          healthHasNextDose={healthHasNextDose}
          setHealthHasNextDose={setHealthHasNextDose}
          readHealthAlerts={readHealthAlerts}
          setReadHealthAlerts={setReadHealthAlerts}
          stockSearch={stockSearch}
          setStockSearch={setStockSearch}
          healthFilter={healthFilters.procedureType}
          setHealthFilter={(filter) => setHealthFilters((prev) => ({ ...prev, procedureType: filter }))}
          onSaveHealthRecord={handleSaveHealth}
          onDeleteHealthRecord={handleDeleteHealthRecord}
          onResetHealthForm={resetHealthForm}
          farmState={farmState}
          farmCity={farmCity}
          isPastureAccess={isPastureAccess}
        />
      )}

      {activeSection === 'mortalidade' && (
        <MortalidadeSection
          animals={animals}
          galpoes={galpoes}
          mortalityRecords={mortalityRecords}
          isLoading={isLoading}
          isSyncing={isSyncing}
          editingMortalityId={editingMortalityId}
          setEditingMortalityId={setEditingMortalityId}
          mortalityDraft={mortalityDraft}
          setMortalityDraft={setMortalityDraft}
          onSaveMortalityRecord={handleSaveMortality}
          onDeleteMortalityRecord={onDeleteMortalityRecord}
          onResetMortalityForm={resetMortalityForm}
        />
      )}
    </div>
  );
}
