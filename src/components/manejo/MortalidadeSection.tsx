
import React, { useMemo } from 'react';
import { Skull, Plus, X, Edit3, Trash2 } from 'lucide-react';
import { AnimalRecord, GalpaoRecord, MortalityRecord, MortalityCause } from '@/types';
import { emptyMortalityDraft, MORTALITY_CAUSE_LABELS, findGalpaoForAnimal } from './ManejoSection.constants';

function getAnimalLabel(animal: AnimalRecord): string {
  return `${animal.tag} • ${animal.quantity} aves`;
}

function getGalpaoLabel(galpao: GalpaoRecord): string {
  return `${galpao.name} (Cap: ${galpao.capacity})`;
}

interface MortalidadeSectionProps {
  animals: AnimalRecord[];
  galpoes: GalpaoRecord[];
  mortalityRecords: MortalityRecord[];
  isLoading: boolean;
  isSyncing: boolean;
  editingMortalityId: string | null;
  setEditingMortalityId: (id: string | null) => void;
  mortalityDraft: Omit<MortalityRecord, 'id' | 'createdAt'>;
  setMortalityDraft: (draft: Omit<MortalityRecord, 'id' | 'createdAt'>) => void;
  onSaveMortalityRecord: (record: MortalityRecord) => Promise<void>;
  onDeleteMortalityRecord: (id: string) => Promise<void>;
  onResetMortalityForm: () => void;
}

export const MortalidadeSection: React.FC<MortalidadeSectionProps> = ({
  animals,
  galpoes,
  mortalityRecords,
  isLoading,
  isSyncing,
  editingMortalityId,
  setEditingMortalityId,
  mortalityDraft,
  setMortalityDraft,
  onSaveMortalityRecord,
  onDeleteMortalityRecord,
  onResetMortalityForm,
}) => {
  const animalMap = useMemo(() => {
    const map = new Map<string, AnimalRecord>();
    animals.forEach((a) => map.set(a.id, a));
    return map;
  }, [animals]);

  const filteredMortalityRecords = useMemo(() => {
    return [...mortalityRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mortalityRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveMortalityRecord({
      ...mortalityDraft,
      id: editingMortalityId || crypto.randomUUID(),
      createdAt: editingMortalityId ? mortalityRecords.find((r) => r.id === editingMortalityId)!.createdAt : new Date().toISOString(),
    });
    if (!editingMortalityId) {
      onResetMortalityForm();
    }
  };

  const handleEdit = (record: MortalityRecord) => {
    setEditingMortalityId(record.id);
    setMortalityDraft(record);
  };

  return (
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

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
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
                onClick={() => { onResetMortalityForm(); setEditingMortalityId(null); }}
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
                        onClick={() => handleEdit(record)}
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
  );
};
