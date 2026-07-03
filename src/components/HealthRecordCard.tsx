import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { HealthRecord } from '@/types';

export interface HealthRecordCardProps {
  record: HealthRecord;
  procedureLabel: string;
  animalLabel: string;
  galpaoLabel: string;
  professionalLabel: string;
  recoveryLabel: string;
  formattedCost: string | null;
  showProfessional: boolean;
  showAffectedBirds: boolean;
  onEdit: (record: HealthRecord) => void;
  onDelete: (id: string) => void;
  isSyncing: boolean;
}

function HealthRecordCard({
  record,
  procedureLabel,
  animalLabel,
  galpaoLabel,
  professionalLabel,
  recoveryLabel,
  formattedCost,
  showProfessional,
  showAffectedBirds,
  onEdit,
  onDelete,
  isSyncing,
}: HealthRecordCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-base font-extrabold text-[#0f1c2b]">{record.title}</div>
          <div className="mt-1 text-sm text-gray-500">
            {procedureLabel} • {record.occurredAt.replace('T', ' ')} • {animalLabel} • {galpaoLabel}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
            {showProfessional && <span className="rounded-full bg-white px-3 py-1">{professionalLabel}</span>}
            {showAffectedBirds && <span className="rounded-full bg-white px-3 py-1">{record.affectedBirdCount ?? 0} aves</span>}
            <span className="rounded-full bg-white px-3 py-1">{recoveryLabel}</span>
            {formattedCost && <span className="rounded-full bg-white px-3 py-1">{formattedCost}</span>}
          </div>
          {(record.diseaseName || record.notes) && (
            <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">
              {record.diseaseName ? `${record.diseaseName}. ` : ''}
              {record.notes}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(record)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-white"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(record.id)}
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
}

export default React.memo(HealthRecordCard);
