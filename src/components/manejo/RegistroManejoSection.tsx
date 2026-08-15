import React, { useCallback, useMemo, useState } from 'react';
import { Calendar, Plus, CheckCircle2, FileDown, Edit3, Trash2 } from 'lucide-react';
import {
  AnimalRecord,
  ManejoRecord,
  DisponibilidadeVenda,
  FormulationRecord,
  FormulatedFeedStockRecord,
  IntelligentRecommendationContext,
  RecommendationFlow,
  Question,
  PersonalizedTip,
} from '@/types';
import { getAnimalLabel, NUTRITIONAL_TARGETS, getBirdAgeInDays, getPhaseByAge } from '@/lib/manejo';
import {
  TURNO_LABELS,
  TAMANHO_OVOS_LABELS,
  emptyManejoDraft,
  emptyDisponibilidadeDraft,
  numberFormatter,
} from './ManejoSection.constants';

type RegistroSubSection = 'form' | 'disponibilidade' | 'historico';
type ManejoFilters = { animalId: string; turno: string; fromDate: string; toDate: string };
type ManejoSortBy = 'date' | 'ovosColetados';
type ManejoSortOrder = 'asc' | 'desc';

interface RegistroManejoSectionProps {
  animals: AnimalRecord[];
  manejoRecords: ManejoRecord[];
  disponibilidadeVenda: DisponibilidadeVenda[];
  formulations: FormulationRecord[];
  formulatedFeedStock: FormulatedFeedStockRecord[];
  onSaveManejoRecord: (record: ManejoRecord) => Promise<void> | void;
  onDeleteManejoRecord: (id: string) => Promise<void> | void;
  onSaveDisponibilidadeVenda: (record: DisponibilidadeVenda) => Promise<void> | void;
  onDeleteDisponibilidadeVenda: (id: string) => Promise<void> | void;
  onSaveFormulatedFeed: (record: FormulatedFeedStockRecord) => Promise<void> | void;
  isSyncing?: boolean;

  registroSubSection?: RegistroSubSection;
  setRegistroSubSection?: (value: RegistroSubSection) => void;

  editingManejoId?: string | null;
  setEditingManejoId?: (value: string | null) => void;
  manejoDraft?: Omit<ManejoRecord, 'id' | 'createdAt' | 'updatedAt'>;
  setManejoDraft?: React.Dispatch<React.SetStateAction<Omit<ManejoRecord, 'id' | 'createdAt' | 'updatedAt'>>>;
  resetManejoForm?: () => void;

  editingDisponibilidadeId?: string | null;
  setEditingDisponibilidadeId?: (value: string | null) => void;
  disponibilidadeDraft?: Omit<DisponibilidadeVenda, 'id' | 'createdAt' | 'updatedAt'>;
  setDisponibilidadeDraft?: React.Dispatch<React.SetStateAction<Omit<DisponibilidadeVenda, 'id' | 'createdAt' | 'updatedAt'>>>;
  resetDisponibilidadeForm?: () => void;

  manejoSearch?: string;
  setManejoSearch?: (value: string) => void;
  manejoFilters?: ManejoFilters;
  setManejoFilters?: React.Dispatch<React.SetStateAction<ManejoFilters>>;
  manejoSortBy?: ManejoSortBy;
  setManejoSortBy?: (value: ManejoSortBy) => void;
  manejoSortOrder?: ManejoSortOrder;
  setManejoSortOrder?: (value: ManejoSortOrder) => void;

  intelligentContext?: IntelligentRecommendationContext;
  activeFlow?: RecommendationFlow | null;
  currentQuestion?: Question | null;
  personalizedTips?: PersonalizedTip[];
  isQuestionnaireComplete?: boolean;
  answerQuestion?: (questionId: string, value: any) => void;
  resetQuestionnaire?: () => void;
}

export function RegistroManejoSection(props: RegistroManejoSectionProps) {
  const {
    animals,
    manejoRecords,
    disponibilidadeVenda,
    formulations,
    formulatedFeedStock,
    onSaveManejoRecord,
    onDeleteManejoRecord,
    onSaveDisponibilidadeVenda,
    onDeleteDisponibilidadeVenda,
    onSaveFormulatedFeed,
    isSyncing,
  } = props;

  const [localRegistroSubSection, setLocalRegistroSubSection] = useState<RegistroSubSection>('form');
  const [localEditingManejoId, setLocalEditingManejoId] = useState<string | null>(null);
  const [localManejoDraft, setLocalManejoDraft] = useState<Omit<ManejoRecord, 'id' | 'createdAt' | 'updatedAt'>>(emptyManejoDraft);
  const [localEditingDisponibilidadeId, setLocalEditingDisponibilidadeId] = useState<string | null>(null);
  const [localDisponibilidadeDraft, setLocalDisponibilidadeDraft] = useState<Omit<DisponibilidadeVenda, 'id' | 'createdAt' | 'updatedAt'>>(emptyDisponibilidadeDraft);
  const [localManejoSearch, setLocalManejoSearch] = useState('');
  const [localManejoFilters, setLocalManejoFilters] = useState<ManejoFilters>({ animalId: '', turno: '', fromDate: '', toDate: '' });
  const [localManejoSortBy, setLocalManejoSortBy] = useState<ManejoSortBy>('date');
  const [localManejoSortOrder, setLocalManejoSortOrder] = useState<ManejoSortOrder>('desc');

  const registroSubSection = props.registroSubSection ?? localRegistroSubSection;
  const setRegistroSubSection = props.setRegistroSubSection ?? setLocalRegistroSubSection;

  const editingManejoId = props.editingManejoId ?? localEditingManejoId;
  const setEditingManejoId = props.setEditingManejoId ?? setLocalEditingManejoId;
  const manejoDraft = props.manejoDraft ?? localManejoDraft;
  const setManejoDraft = props.setManejoDraft ?? setLocalManejoDraft;

  const editingDisponibilidadeId = props.editingDisponibilidadeId ?? localEditingDisponibilidadeId;
  const setEditingDisponibilidadeId = props.setEditingDisponibilidadeId ?? setLocalEditingDisponibilidadeId;
  const disponibilidadeDraft = props.disponibilidadeDraft ?? localDisponibilidadeDraft;
  const setDisponibilidadeDraft = props.setDisponibilidadeDraft ?? setLocalDisponibilidadeDraft;

  const manejoSearch = props.manejoSearch ?? localManejoSearch;
  const setManejoSearch = props.setManejoSearch ?? setLocalManejoSearch;
  const manejoFilters = props.manejoFilters ?? localManejoFilters;
  const setManejoFilters = props.setManejoFilters ?? setLocalManejoFilters;
  const manejoSortBy = props.manejoSortBy ?? localManejoSortBy;
  const setManejoSortBy = props.setManejoSortBy ?? setLocalManejoSortBy;
  const manejoSortOrder = props.manejoSortOrder ?? localManejoSortOrder;
  const setManejoSortOrder = props.setManejoSortOrder ?? setLocalManejoSortOrder;

  const resetManejoForm = props.resetManejoForm ?? (() => {
    setEditingManejoId(null);
    setManejoDraft(emptyManejoDraft);
  });

  const resetDisponibilidadeForm = props.resetDisponibilidadeForm ?? (() => {
    setEditingDisponibilidadeId(null);
    setDisponibilidadeDraft(emptyDisponibilidadeDraft);
  });

  const {
    intelligentContext,
    activeFlow,
    currentQuestion,
    personalizedTips = [],
    isQuestionnaireComplete = true,
    answerQuestion,
    resetQuestionnaire,
  } = props;

  const notifyValidation = useCallback((message: string) => {
    alert(message);
    return false;
  }, []);

  const animalMap = useMemo(() => new Map(animals.map((animal) => [animal.id, animal])), [animals]);

  // Calculate feed stock and days remaining
  const feedSummary = useMemo(() => {
    const totalStock = formulatedFeedStock
      .filter(stock => stock.formulationId === manejoDraft.formulationId)
      .reduce((sum, stock) => sum + stock.quantityKg, 0);

    const selectedAnimal = animals.find(a => a.id === manejoDraft.animalId);
    
    let daysRemaining = null;
    if (selectedAnimal && totalStock > 0) {
      const ageDays = getBirdAgeInDays(selectedAnimal.birthDate);
      const phase = getPhaseByAge(ageDays);
      const birdCount = Math.max(0, Number(selectedAnimal.currentQuantity ?? selectedAnimal.quantity ?? 0));
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

  // Filtered and sorted Manejo Records
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

  return (
    <section className="app-section-card">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-brand-primary" />
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Registro de Manejo</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Preencha os dados da coleta, registre disponibilidade para venda e visualize o histórico.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRegistroSubSection('form')}
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-primary/20 transition-all hover:bg-brand-hover hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </button>
            <button
              type="button"
              onClick={() => setRegistroSubSection('disponibilidade')}
              className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2.5 text-sm font-bold text-brand-primary transition-all hover:bg-brand-primary/5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Atualizar Disponibilidade
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
                  
                  const matchingFormulation = formulations.find((f) => {
                    const fAnimalId = String(f.animalId || '').trim();
                    const sAnimalId = String(selectedAnimalId || '').trim();
                    return fAnimalId === sAnimalId && fAnimalId !== '';
                  });
                  
                  let recommendedRacaoKg = 0;
                  if (selectedAnimal) {
                    const ageDays = getBirdAgeInDays(selectedAnimal.birthDate);
                    const phase = getPhaseByAge(ageDays);
                    const birdCount = Math.max(0, Number(selectedAnimal.currentQuantity ?? selectedAnimal.quantity ?? 0));
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
                  <Trash2 className="h-4 w-4" />
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
                  <Trash2 className="h-4 w-4" />
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <FileDown className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-lg font-extrabold text-[#0f1c2b]">Histórico de Manejo</h3>
                </div>
                <p className="mt-2 text-sm text-gray-500">Visualize e edite registros anteriores de manejo.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Buscar</span>
                <input
                  type="text"
                  value={manejoSearch}
                  onChange={(e) => setManejoSearch(e.target.value)}
                  placeholder="Buscar por lote ou data..."
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lote</span>
                <select
                  value={manejoFilters.animalId}
                  onChange={(e) => setManejoFilters({ ...manejoFilters, animalId: e.target.value })}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Todos</option>
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
                  value={manejoFilters.turno}
                  onChange={(e) => setManejoFilters({ ...manejoFilters, turno: e.target.value })}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Todos</option>
                  {Object.entries(TURNO_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setManejoSortBy('date');
                    setManejoSortOrder(manejoSortOrder === 'desc' ? 'asc' : 'desc');
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-slate-50"
                >
                  Ordenar por Data
                  {manejoSortBy === 'date' && (manejoSortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManejoSortBy('ovosColetados');
                    setManejoSortOrder(manejoSortOrder === 'desc' ? 'asc' : 'desc');
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-slate-50"
                >
                  Ordenar por Ovos
                  {manejoSortBy === 'ovosColetados' && (manejoSortOrder === 'desc' ? '↓' : '↑')}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data Início</span>
                <input
                  type="date"
                  value={manejoFilters.fromDate}
                  onChange={(e) => setManejoFilters({ ...manejoFilters, fromDate: e.target.value })}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data Fim</span>
                <input
                  type="date"
                  value={manejoFilters.toDate}
                  onChange={(e) => setManejoFilters({ ...manejoFilters, toDate: e.target.value })}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {filteredManejoRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
                Nenhum registro de manejo encontrado.
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
                  {filteredManejoRecords.map((record) => {
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
  );
}

export default RegistroManejoSection;
