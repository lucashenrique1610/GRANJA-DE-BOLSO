import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  HeartPulse,
  Plus,
  Syringe,
  X,
} from 'lucide-react';
import {
  AnimalRecord,
  GalpaoRecord,
  HealthRecord,
  HealthProfessionalRecord,
  PurchaseRecord,
  SupplierRecord,
} from '@/types';
import {
  HEALTH_PROCEDURE_LABELS,
  HEALTH_RECOVERY_LABELS,
  ACCESS_LABELS,
  HEALTH_PROCEDURE_OPTIONS,
  findGalpaoForAnimal,
  normalizeHealthProcedureType,
} from './ManejoSection.constants';
import HealthRecordCard from '@/components/HealthRecordCard';
import {
  generateVaccineReminders,
  generateAdultVaccineReminders,
  buildCaipiraHealthRules,
} from '@/lib/vaccineCaipiraMG';

type CalendarCommitmentStatus = 'atrasado' | 'hoje' | 'proximo' | 'pendente' | 'agendado';

interface CalendarCommitment {
  id: string;
  date: string;
  title: string;
  animalTag: string;
  status: CalendarCommitmentStatus;
  source: 'calendario_oficial' | 'proxima_dose';
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function getAnimalCurrentQuantity(animal: AnimalRecord): number {
  return animal.currentQuantity ?? animal.quantity;
}

function getAnimalLabel(animal: AnimalRecord): string {
  return `${animal.tag} • ${getAnimalCurrentQuantity(animal)} aves`;
}

function getGalpaoLabel(galpao: GalpaoRecord): string {
  return `${galpao.name} (Cap: ${galpao.capacity})`;
}

function formatDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildCalendarDays(monthDate: Date): Date[] {
  const firstDay = startOfMonth(monthDate);
  const gridStart = addDays(firstDay, -firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function isSameMonth(date: Date, monthDate: Date): boolean {
  return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function getCommitmentTone(status: CalendarCommitmentStatus) {
  if (status === 'atrasado') {
    return {
      badge: 'bg-red-100 text-red-700 border-red-200',
      dot: 'bg-red-500',
      surface: 'border-red-200 bg-red-50',
    };
  }

  if (status === 'hoje') {
    return {
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      surface: 'border-amber-200 bg-amber-50',
    };
  }

  if (status === 'proximo') {
    return {
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      surface: 'border-blue-200 bg-blue-50',
    };
  }

  return {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    surface: 'border-emerald-200 bg-emerald-50',
  };
}

function isVaccineFollowUpRecord(record: HealthRecord): boolean {
  if (!record.nextDoseDate) return false;
  if (record.treatmentType === 'vacina' || record.procedureType === 'vacina') return true;

  const searchableText = `${record.productName ?? ''} ${record.vaccineName ?? ''} ${record.title ?? ''}`.toLowerCase();
  return /(vacina|newcastle|bronquite|bouba|gumboro|marek|coccidiose|coriza|salmonella|lti)/i.test(searchableText);
}

function getEditableDraft(record: HealthRecord): Omit<HealthRecord, 'id' | 'createdAt'> {
  const { id: _id, createdAt: _createdAt, ...rest } = record;
  const normalizedProcedureType = normalizeHealthProcedureType(record.procedureType);
  const inferredTreatmentType =
    record.procedureType === 'vacina'
      ? 'vacina'
      : record.procedureType === 'medicamento'
        ? 'medicamento'
        : record.treatmentType;

  return {
    ...rest,
    procedureType: normalizedProcedureType,
    treatmentType: normalizedProcedureType === 'tratamento' ? inferredTreatmentType : undefined,
  };
}

interface SaudeSectionProps {
  animals: AnimalRecord[];
  galpoes: GalpaoRecord[];
  healthRecords: HealthRecord[];
  healthProfessionals: HealthProfessionalRecord[];
  purchases: PurchaseRecord[];
  suppliers: SupplierRecord[];
  isLoading: boolean;
  isSyncing: boolean;
  isHealthFormOpen: boolean;
  setIsHealthFormOpen: (open: boolean) => void;
  editingHealthId: string | null;
  setEditingHealthId: (id: string | null) => void;
  healthDraft: Omit<HealthRecord, 'id' | 'createdAt'>;
  setHealthDraft: (draft: Omit<HealthRecord, 'id' | 'createdAt'>) => void;
  healthHasNextDose: boolean;
  setHealthHasNextDose: (has: boolean) => void;
  readHealthAlerts: Set<string>;
  setReadHealthAlerts: (alerts: Set<string>) => void;
  stockSearch: string;
  setStockSearch: (search: string) => void;
  healthFilter: string;
  setHealthFilter: (filter: string) => void;
  onSaveHealthRecord: (event: React.FormEvent<HTMLFormElement>) => Promise<boolean>;
  onDeleteHealthRecord: (id: string) => Promise<void>;
  onResetHealthForm: () => void;
  farmState?: string;
  farmCity?: string;
  isPastureAccess?: boolean;
}

export const SaudeSection: React.FC<SaudeSectionProps> = ({
  animals,
  galpoes,
  healthRecords,
  healthProfessionals,
  isLoading,
  isSyncing,
  setIsHealthFormOpen,
  editingHealthId,
  setEditingHealthId,
  healthDraft,
  setHealthDraft,
  healthHasNextDose,
  setHealthHasNextDose,
  healthFilter,
  setHealthFilter,
  onSaveHealthRecord,
  onDeleteHealthRecord,
  onResetHealthForm,
  farmState,
  farmCity,
  isPastureAccess = true,
}) => {
  const [displayMonth, setDisplayMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => formatDateKey(new Date()));

  const animalMap = useMemo(() => {
    const map = new Map<string, AnimalRecord>();
    animals.forEach((a) => map.set(a.id, a));
    return map;
  }, [animals]);

  const galpaoMap = useMemo(() => {
    const map = new Map<string, GalpaoRecord>();
    galpoes.forEach((g) => map.set(g.id, g));
    return map;
  }, [galpoes]);

  const professionalMap = useMemo(() => {
    const map = new Map<string, HealthProfessionalRecord>();
    healthProfessionals.forEach((p) => map.set(p.id, p));
    return map;
  }, [healthProfessionals]);

  const filteredHealthRecords = useMemo(() => {
    return healthRecords
      .filter((record) => {
        const normalizedType = normalizeHealthProcedureType(record.procedureType);
        if (healthFilter && normalizedType !== healthFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [healthRecords, healthFilter]);

  const healthRules = useMemo(
    () => buildCaipiraHealthRules({ state: farmState, city: farmCity, isPastureAccess }),
    [farmState, farmCity, isPastureAccess],
  );

  const vaccineReminders = useMemo(
    () => [
      ...generateVaccineReminders(animals, healthRecords, healthRules),
      ...generateAdultVaccineReminders(animals, healthRecords),
    ].sort((a, b) => {
      const p: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (p[a.priority] !== p[b.priority]) return p[a.priority] - p[b.priority];
      return a.daysUntil - b.daysUntil;
    }),
    [animals, healthRecords, healthRules],
  );

  const authorizedProfessionals = useMemo(
    () => healthProfessionals.filter((professional) => professional.isActive && professional.accessLevel !== 'visualizacao'),
    [healthProfessionals],
  );

  const calendarCommitments = useMemo<CalendarCommitment[]>(() => {
    const scheduledVaccines = vaccineReminders.map((reminder) => ({
      id: reminder.id,
      date: reminder.scheduledDate,
      title: reminder.vaccines.join(' + '),
      animalTag: reminder.animalTag,
      status: reminder.status,
      source: 'calendario_oficial' as const,
    }));

    const nextDoseCommitments = healthRecords
      .filter(isVaccineFollowUpRecord)
      .map((record) => ({
        id: `next-dose-${record.id}`,
        date: record.nextDoseDate as string,
        title: `Próxima dose: ${record.productName || record.vaccineName || record.title}`,
        animalTag: animalMap.get(record.animalId)?.tag || 'Lote removido',
        status: 'agendado' as const,
        source: 'proxima_dose' as const,
      }));

    return [...scheduledVaccines, ...nextDoseCommitments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [animalMap, healthRecords, vaccineReminders]);

  const commitmentsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarCommitment[]>();
    calendarCommitments.forEach((commitment) => {
      const key = formatDateKey(commitment.date);
      const current = grouped.get(key) ?? [];
      current.push(commitment);
      grouped.set(key, current);
    });

    grouped.forEach((items, key) => {
      grouped.set(
        key,
        items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      );
    });

    return grouped;
  }, [calendarCommitments]);

  const monthDays = useMemo(() => buildCalendarDays(displayMonth), [displayMonth]);

  const monthCommitments = useMemo(
    () =>
      calendarCommitments.filter((commitment) => isSameMonth(new Date(commitment.date), displayMonth)),
    [calendarCommitments, displayMonth],
  );

  const selectedDayCommitments = commitmentsByDate.get(selectedDateKey) ?? [];
  const recentHealthRecords = filteredHealthRecords.slice(0, 6);

  const applyMonthSelection = (targetMonth: Date) => {
    const monthStart = startOfMonth(targetMonth);
    setDisplayMonth(monthStart);

    const firstCommitmentOfMonth = calendarCommitments.find((commitment) =>
      isSameMonth(new Date(commitment.date), monthStart),
    );

    setSelectedDateKey(
      firstCommitmentOfMonth ? formatDateKey(firstCommitmentOfMonth.date) : formatDateKey(monthStart),
    );
  };

  const resetQuickForm = () => {
    onResetHealthForm();
    setEditingHealthId(null);
    setHealthHasNextDose(false);
    setIsHealthFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const focusDate = healthDraft.nextDoseDate || healthDraft.occurredAt;
    const success = await onSaveHealthRecord(e as React.FormEvent<HTMLFormElement>);

    if (success) {
      resetQuickForm();

      if (focusDate) {
        const targetDate = new Date(focusDate);
        setDisplayMonth(startOfMonth(targetDate));
        setSelectedDateKey(formatDateKey(targetDate));
      }
    }
  };

  const handleEdit = (record: HealthRecord) => {
    setEditingHealthId(record.id);
    setHealthDraft(getEditableDraft(record));
    setIsHealthFormOpen(true);
    setHealthHasNextDose(!!record.nextDoseDate);
    document.getElementById('saude-registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleProcedureTypeChange = (procedureType: HealthRecord['procedureType']) => {
    setHealthDraft({
      ...healthDraft,
      procedureType,
      galpaoId: procedureType === 'monitoramento' ? '' : healthDraft.galpaoId,
      professionalId: procedureType === 'monitoramento' ? '' : healthDraft.professionalId,
      consultationCost: procedureType === 'consulta' ? healthDraft.consultationCost : 0,
      returnDate: procedureType === 'consulta' ? healthDraft.returnDate : '',
      treatmentType: procedureType === 'tratamento' ? (healthDraft.treatmentType ?? 'vacina') : undefined,
      productName: procedureType === 'tratamento' ? healthDraft.productName : '',
      applicationMethod: procedureType === 'tratamento' ? healthDraft.applicationMethod : '',
      treatmentDetails: procedureType === 'tratamento' ? healthDraft.treatmentDetails : '',
      nextDoseDate: procedureType === 'tratamento' && healthHasNextDose ? healthDraft.nextDoseDate : undefined,
    });

    if (procedureType !== 'tratamento') {
      setHealthHasNextDose(false);
    }
  };

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => document.getElementById('saude-registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#0f1c2b] transition-colors hover:bg-slate-50"
        >
          <HeartPulse className="h-4 w-4 text-brand-primary" />
          Área de registro
        </button>
        <button
          type="button"
          onClick={() => document.getElementById('saude-calendario')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#0f1c2b] transition-colors hover:bg-slate-50"
        >
          <Calendar className="h-4 w-4 text-brand-primary" />
          Calendário vacinal
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <section id="saude-registro" className="app-section-card scroll-mt-24">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-main text-brand-active">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f1c2b]">Registro rápido de saúde</h2>
                  <p className="text-sm text-gray-500">
                    Preencha apenas os campos essenciais para vacina, tratamento ou monitoramento.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {recentHealthRecords.length} registro(s) recente(s)
            </div>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data e hora</span>
              <input
                type="datetime-local"
                value={healthDraft.occurredAt}
                onChange={(event) => setHealthDraft({ ...healthDraft, occurredAt: event.target.value })}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Tipo de registro</span>
              <select
                value={healthDraft.procedureType}
                onChange={(event) => handleProcedureTypeChange(event.target.value as HealthRecord['procedureType'])}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                {HEALTH_PROCEDURE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lote</span>
              <select
                value={healthDraft.animalId}
                onChange={(event) => {
                  const animalId = event.target.value;
                  const selectedAnimal = animals.find((animal) => animal.id === animalId);
                  const relatedGalpao = findGalpaoForAnimal(animalId, galpoes);

                  setHealthDraft({
                    ...healthDraft,
                    animalId,
                    galpaoId: healthDraft.procedureType === 'monitoramento' ? '' : (relatedGalpao?.id ?? healthDraft.galpaoId),
                    affectedBirdCount: selectedAnimal ? getAnimalCurrentQuantity(selectedAnimal) : 0,
                  });
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
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Galpão</span>
              <select
                value={healthDraft.galpaoId || ''}
                onChange={(event) => setHealthDraft({ ...healthDraft, galpaoId: event.target.value })}
                disabled={healthDraft.procedureType === 'monitoramento'}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:bg-slate-100 disabled:text-gray-400"
              >
                <option value="">{healthDraft.procedureType === 'monitoramento' ? 'Não obrigatório' : 'Selecione'}</option>
                {galpoes.map((galpao) => (
                  <option key={galpao.id} value={galpao.id}>
                    {getGalpaoLabel(galpao)}
                  </option>
                ))}
              </select>
            </label>

            {healthDraft.procedureType !== 'monitoramento' && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Profissional</span>
                <select
                  value={healthDraft.professionalId || ''}
                  onChange={(event) => setHealthDraft({ ...healthDraft, professionalId: event.target.value })}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Selecione</option>
                  {authorizedProfessionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name} • {ACCESS_LABELS[professional.accessLevel]}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {healthDraft.procedureType === 'consulta' && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor da consulta</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={healthDraft.consultationCost || ''}
                    onChange={(event) => setHealthDraft({ ...healthDraft, consultationCost: Number(event.target.value) })}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Retorno</span>
                  <input
                    type="datetime-local"
                    value={healthDraft.returnDate || ''}
                    onChange={(event) => setHealthDraft({ ...healthDraft, returnDate: event.target.value })}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
              </>
            )}

            {healthDraft.procedureType === 'tratamento' && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Classificação</span>
                  <select
                    value={healthDraft.treatmentType || ''}
                    onChange={(event) =>
                      setHealthDraft({
                        ...healthDraft,
                        treatmentType: event.target.value as 'vacina' | 'medicamento',
                        title: '',
                      })
                    }
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">Selecione</option>
                    <option value="vacina">Vacina</option>
                    <option value="medicamento">Medicamento</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Produto aplicado</span>
                  <input
                    value={healthDraft.productName || ''}
                    onChange={(event) => setHealthDraft({ ...healthDraft, productName: event.target.value })}
                    placeholder="Ex: Newcastle, Bouba Forte"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Aplicação</span>
                  <select
                    value={healthDraft.applicationMethod || ''}
                    onChange={(event) => setHealthDraft({ ...healthDraft, applicationMethod: event.target.value })}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">Selecione</option>
                    <option value="água">Na água</option>
                    <option value="seringa">Seringa</option>
                    <option value="oral">Via oral</option>
                    <option value="injeção">Injeção</option>
                    <option value="outro">Outro</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Aves atendidas</span>
                  <input
                    type="number"
                    min={0}
                    value={healthDraft.affectedBirdCount || 0}
                    onChange={(event) => setHealthDraft({ ...healthDraft, affectedBirdCount: Number(event.target.value || 0) })}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Gerar próxima dose</span>
                  <select
                    value={healthHasNextDose ? 'sim' : 'nao'}
                    onChange={(event) => {
                      const enabled = event.target.value === 'sim';
                      setHealthHasNextDose(enabled);
                      setHealthDraft({
                        ...healthDraft,
                        nextDoseDate: enabled ? (healthDraft.nextDoseDate || '') : undefined,
                      });
                    }}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </label>

                {healthHasNextDose && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data da próxima dose</span>
                    <input
                      type="datetime-local"
                      value={healthDraft.nextDoseDate || ''}
                      onChange={(event) => setHealthDraft({ ...healthDraft, nextDoseDate: event.target.value })}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                  </label>
                )}
              </>
            )}

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Observações</span>
              <textarea
                value={healthDraft.notes}
                onChange={(event) => setHealthDraft({ ...healthDraft, notes: event.target.value })}
                rows={4}
                placeholder="Descreva o atendimento, sintomas, vacina aplicada ou observação de campo."
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </label>

            {authorizedProfessionals.length === 0 && healthDraft.procedureType !== 'monitoramento' && (
              <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Cadastre um profissional com permissão de registro para salvar consultas, vacinas ou tratamentos.
              </div>
            )}

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSyncing || ((healthDraft.procedureType === 'consulta' || healthDraft.procedureType === 'tratamento') && authorizedProfessionals.length === 0)}
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {editingHealthId ? 'Atualizar registro' : 'Salvar registro'}
              </button>

              <button
                type="button"
                onClick={resetQuickForm}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Limpar formulário
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0f1c2b]">Registros recentes</h3>
                <p className="text-sm text-gray-500">Visualize, filtre e edite rapidamente os últimos lançamentos.</p>
              </div>

              <label className="flex min-w-[180px] flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Filtro</span>
                <select
                  value={healthFilter}
                  onChange={(event) => setHealthFilter(event.target.value)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Todos</option>
                  {HEALTH_PROCEDURE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-3">
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
                  Carregando registros de saúde...
                </div>
              ) : recentHealthRecords.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
                  Nenhum registro encontrado com os filtros atuais.
                </div>
              ) : (
                recentHealthRecords.map((record) => (
                  <HealthRecordCard
                    key={record.id}
                    record={record}
                    procedureLabel={HEALTH_PROCEDURE_LABELS[normalizeHealthProcedureType(record.procedureType)] || record.procedureType}
                    animalLabel={animalMap.get(record.animalId)?.tag || 'Lote removido'}
                    galpaoLabel={galpaoMap.get(record.galpaoId || '')?.name || 'Galpão não vinculado'}
                    professionalLabel={professionalMap.get(record.professionalId || '')?.name || 'Sem profissional'}
                    recoveryLabel={record.recoveryStatus ? HEALTH_RECOVERY_LABELS[record.recoveryStatus] : 'Sem status'}
                    formattedCost={null}
                    showProfessional={record.procedureType !== 'monitoramento'}
                    showAffectedBirds={record.procedureType === 'tratamento' || record.procedureType === 'vacina' || record.procedureType === 'medicamento'}
                    onEdit={handleEdit}
                    onDelete={onDeleteHealthRecord}
                    isSyncing={isSyncing}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <section id="saude-calendario" className="app-section-card scroll-mt-24">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Syringe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0f1c2b]">Calendário de vacinação</h2>
                <p className="text-sm text-gray-500">
                  Os dias com compromissos ficam destacados e o detalhe aparece ao selecionar uma data.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.08em]">
              <span className="rounded-full border border-red-200 bg-red-100 px-3 py-1 text-red-700">
                Atrasados: {calendarCommitments.filter((item) => item.status === 'atrasado').length}
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-amber-700">
                Hoje: {calendarCommitments.filter((item) => item.status === 'hoje').length}
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-blue-700">
                Próximos: {calendarCommitments.filter((item) => item.status === 'proximo').length}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => applyMonthSelection(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
              className="rounded-full border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-slate-50"
            >
              Mês anterior
            </button>
            <div className="text-center">
              <div className="text-lg font-extrabold capitalize text-[#0f1c2b]">{formatMonthLabel(displayMonth)}</div>
              <div className="text-xs font-medium text-gray-500">{monthCommitments.length} compromisso(s) no mês</div>
            </div>
            <button
              type="button"
              onClick={() => applyMonthSelection(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
              className="rounded-full border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-slate-50"
            >
              Próximo mês
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-gray-400">
                {label}
              </div>
            ))}

            {monthDays.map((day) => {
              const dayKey = formatDateKey(day);
              const commitments = commitmentsByDate.get(dayKey) ?? [];
              const priorityCommitment = commitments[0];
              const tone = priorityCommitment ? getCommitmentTone(priorityCommitment.status) : null;
              const isCurrentMonth = isSameMonth(day, displayMonth);
              const isSelected = selectedDateKey === dayKey;
              const isToday = dayKey === formatDateKey(new Date());

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => setSelectedDateKey(dayKey)}
                  className={[
                    'min-h-[82px] rounded-2xl border p-2 text-left transition-all',
                    isSelected ? 'border-brand-primary bg-brand-main shadow-sm ring-2 ring-brand-primary/20' : 'border-gray-200 bg-white hover:border-gray-300',
                    !isCurrentMonth ? 'opacity-45' : '',
                    commitments.length > 0 && !isSelected ? tone?.surface : '',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-bold ${isToday ? 'text-brand-active' : 'text-[#0f1c2b]'}`}>
                      {day.getDate()}
                    </span>
                    {commitments.length > 0 && (
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                        {commitments.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    {commitments.slice(0, 2).map((commitment) => (
                      <div key={commitment.id} className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-700">
                        <span className={`h-2 w-2 rounded-full ${getCommitmentTone(commitment.status).dot}`} />
                        <span className="truncate">{commitment.animalTag}</span>
                      </div>
                    ))}

                    {commitments.length > 2 && (
                      <div className="text-[10px] font-semibold text-gray-500">+{commitments.length - 2} compromisso(s)</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0f1c2b]">
                  {new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <p className="text-sm text-gray-500">Detalhamento dos compromissos da data selecionada.</p>
              </div>

              {selectedDayCommitments.length > 0 && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-600 shadow-sm">
                  {selectedDayCommitments.length} item(ns)
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {selectedDayCommitments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-sm text-gray-500">
                  Nenhum compromisso vacinal nesta data.
                </div>
              ) : (
                selectedDayCommitments.map((commitment) => {
                  const tone = getCommitmentTone(commitment.status);
                  return (
                    <div key={commitment.id} className={`rounded-2xl border p-4 ${tone.surface}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-[#0f1c2b]">{commitment.title}</div>
                          <div className="mt-1 text-sm text-gray-600">{commitment.animalTag}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${tone.badge}`}>
                            {commitment.status}
                          </span>
                          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600">
                            {commitment.source === 'proxima_dose' ? 'Próxima dose' : 'Calendário oficial'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
              <CheckCircle2 className="h-4 w-4" />
              Atualização automática do calendário
            </div>
            <p className="mt-2 text-sm text-emerald-800">
              Ao salvar um novo registro com próxima dose ou ao confirmar uma vacina já aplicada, o calendário é recalculado e os dias destacados são atualizados.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
};
