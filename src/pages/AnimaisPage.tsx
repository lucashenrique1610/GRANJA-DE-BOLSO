import React, { useCallback, useMemo } from 'react';
import CadastroSection, { CadastroColumn, CadastroField } from '@/components/CadastroSection';
import { AnimalRecord, HealthRecord, SupplierRecord } from '@/types';
import {
  buildCaipiraHealthRules,
  getNextVaccineRecommendation,
} from '@/lib/vaccineCaipiraMG';
import { AlertCircle, CheckCircle2, Calendar, Syringe } from 'lucide-react';

interface AnimaisPageProps {
  records: AnimalRecord[];
  suppliers: SupplierRecord[];
  healthRecords?: HealthRecord[];
  farmState?: string;
  farmCity?: string;
  isPastureAccess?: boolean;
  editingId?: string | null;
  onSave: (record: AnimalRecord) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  isLoading?: boolean;
  isSyncing?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;

function getAgeInWeeks(birthDate: string) {
  const baseDate = new Date(birthDate);
  if (Number.isNaN(baseDate.getTime())) return 0;
  const diff = Date.now() - baseDate.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / WEEK_IN_MS);
}

function getUnitCost(record: Pick<AnimalRecord, 'quantity' | 'totalPurchasePrice'>) {
  if (!record.quantity || record.quantity <= 0) return 0;
  return record.totalPurchasePrice / record.quantity;
}

function getCycleStage(weeks: number) {
  if (weeks <= 6) {
    return {
      label: 'Fase de Cria',
      description: '1ª à 6ª semana: aquecimento, ração inicial, vacinação e manejo intensivo.',
    };
  }

  if (weeks <= 17) {
    return {
      label: 'Recria e Pré-Postura',
      description: '7ª à 17ª semana: crescimento, acesso ao pasto e preparo para postura.',
    };
  }

  if (weeks < 80) {
    return {
      label: 'Produção / Postura',
      description: '18ª à 80ª semana: início, pico e manutenção da produção de ovos.',
    };
  }

  return {
    label: 'Fim do Ciclo / Descarte',
    description: '80+ semanas: avaliar descarte do lote ou novo ciclo produtivo.',
  };
}

const emptyValues: Omit<AnimalRecord, 'id' | 'createdAt'> = {
  tag: '',
  supplierId: '',
  lot: '',
  species: '',
  purpose: '',
  breed: '',
  quantity: 0,
  totalPurchasePrice: 0,
  averageWeightKg: 0,
  birthDate: '',
  status: 'ativo',
  notes: '',
};

const speciesOptions = [
  { label: 'Isa Brown', value: 'Isa Brown' },
  { label: 'Hy-Line Brown', value: 'Hy-Line Brown' },
  { label: 'Lohmann Brown', value: 'Lohmann Brown' },
  { label: 'Novogen Brown', value: 'Novogen Brown' },
  { label: 'Hisex Brown', value: 'Hisex Brown' },
  { label: 'Novogen Tinted', value: 'Novogen Tinted' },
  { label: 'Lohmann Sandy', value: 'Lohmann Sandy' },
  { label: 'Embrapa 051', value: 'Embrapa 051' },
  { label: 'Galinha Caipira Negra (Black)', value: 'Galinha Caipira Negra (Black)' },
  { label: 'GLC (Galinha Linha Caipira)', value: 'GLC (Galinha Linha Caipira)' },
  { label: 'Paraíso Pedrês', value: 'Paraíso Pedrês' },
  { label: 'Pescoço Pelado Caipira (Label Rouge)', value: 'Pescoço Pelado Caipira (Label Rouge)' },
  { label: 'Rhode Island Red', value: 'Rhode Island Red' },
  { label: 'Plymouth Rock Barrada (Carijó)', value: 'Plymouth Rock Barrada (Carijó)' },
  { label: 'New Hampshire', value: 'New Hampshire' },
  { label: 'Leghorn (Legorne Branca)', value: 'Leghorn (Legorne Branca)' },
  { label: 'Australorp', value: 'Australorp' },
  { label: 'Sussex Arminhada (Light Sussex)', value: 'Sussex Arminhada (Light Sussex)' },
  { label: 'Wyandotte', value: 'Wyandotte' },
  { label: 'Orpington', value: 'Orpington' },
];

const baseColumns: Array<CadastroColumn<AnimalRecord> & { key: string }> = [
  { key: 'tag', label: 'Identificação' },
  { key: 'supplierId', label: 'Fornecedor' },
  {
    key: 'cycleStage',
    label: 'Fase do ciclo',
    render: (record) => getCycleStage(getAgeInWeeks(record.birthDate)).label,
  },
  {
    key: 'age',
    label: 'Idade',
    render: (record) => `${getAgeInWeeks(record.birthDate)} semana(s)`,
  },
  { key: 'quantity', label: 'Quantidade' },
  {
    key: 'totalPurchasePrice',
    label: 'Investimento',
    render: (record) => currencyFormatter.format(record.totalPurchasePrice),
  },
  {
    key: 'unitCost',
    label: 'Custo por ave',
    render: (record) => currencyFormatter.format(getUnitCost(record)),
  },
  {
    key: 'averageWeightKg',
    label: 'Peso médio',
    render: (record) => `${record.averageWeightKg.toFixed(2)} kg`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (record) => record.status.charAt(0).toUpperCase() + record.status.slice(1),
  },
];

const staticFields: CadastroField<AnimalRecord>[] = [
  { key: 'tag', label: 'Identificação', type: 'text', placeholder: 'Ex: Lote A-01', required: true },
  {
    key: 'species',
    label: 'Espécie / Linhagem',
    type: 'select',
    required: true,
    options: speciesOptions,
  },
  {
    key: 'purpose',
    label: 'Finalidade',
    type: 'select',
    required: true,
    options: [
      { label: 'Postura', value: 'postura' },
      { label: 'Engorda', value: 'engorda' },
      { label: 'Reprodução', value: 'reproducao' },
    ],
  },
  { key: 'birthDate', label: 'Data de nascimento/lote', type: 'date', required: true },
  { key: 'quantity', label: 'Quantidade', type: 'number', required: true, min: 0 },
  {
    key: 'totalPurchasePrice',
    label: 'Valor total pago (R$)',
    type: 'number',
    required: true,
    min: 0,
    step: 0.01,
  },
  { key: 'averageWeightKg', label: 'Peso médio (kg)', type: 'number', required: true, min: 0, step: 0.01 },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Ativo', value: 'ativo' },
      { label: 'Em quarentena', value: 'quarentena' },
      { label: 'Encerrado', value: 'encerrado' },
    ],
  },
  {
    key: 'notes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Informações sanitárias ou observações do lote.',
    layout: 'full',
  },
];

function getSearchableText(record: AnimalRecord, supplierName: string) {
  return [
    record.tag,
    supplierName,
    record.species,
    record.status,
    record.purpose,
    getCycleStage(getAgeInWeeks(record.birthDate)).label,
  ].join(' ');
}

function getSummary(items: AnimalRecord[]) {
  return [
    { label: 'Registros', value: String(items.length) },
    { label: 'Aves cadastradas', value: String(items.reduce((total, item) => total + item.quantity, 0)) },
    {
      label: 'Fornecedores ativos',
      value: String(new Set(items.map((item) => item.supplierId).filter(Boolean)).size),
    },
    {
      label: 'Investimento total',
      value: currencyFormatter.format(items.reduce((total, item) => total + item.totalPurchasePrice, 0)),
    },
    {
      label: 'Custo médio/ave',
      value: currencyFormatter.format(
        (() => {
          const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
          const totalInvested = items.reduce((total, item) => total + item.totalPurchasePrice, 0);
          return totalQuantity > 0 ? totalInvested / totalQuantity : 0;
        })(),
      ),
    },
  ];
}

export default function AnimaisPage({
  records,
  suppliers,
  healthRecords = [],
  farmState,
  farmCity,
  isPastureAccess = true,
  editingId,
  onSave,
  onDelete,
  isLoading,
  isSyncing,
  errorMessage,
  onRetry,
}: AnimaisPageProps) {
  const supplierMap = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.companyName])),
    [suppliers],
  );

  const supplierOptions = useMemo(
    () =>
      suppliers
        .filter((supplier) => supplier.status !== 'inativo')
        .map((supplier) => ({
          label: supplier.companyName,
          value: supplier.id,
        })),
    [suppliers],
  );

  const fields = useMemo<CadastroField<AnimalRecord>[]>(
    () => [
      staticFields[0],
      {
        key: 'supplierId',
        label: 'Fornecedor da compra',
        type: 'select',
        required: true,
        options: supplierOptions,
      },
      ...staticFields.slice(1),
    ],
    [supplierOptions],
  );

  const columns = useMemo(
    () =>
      baseColumns.map((column) =>
        column.key === 'supplierId'
          ? {
              ...column,
              render: (record: AnimalRecord) =>
                supplierMap.get(record.supplierId) || 'Fornecedor não informado',
            }
          : column,
      ),
    [supplierMap],
  );

  const getSearchableTextForRecord = useCallback(
    (record: AnimalRecord) => getSearchableText(record, supplierMap.get(record.supplierId) || ''),
    [supplierMap],
  );

  const healthRules = useMemo(
    () => buildCaipiraHealthRules({
      state: farmState ?? 'MG',
      city: farmCity,
      isPastureAccess,
    }),
    [farmState, farmCity, isPastureAccess],
  );

  const renderFormInsights = useCallback(
    (draft: Omit<AnimalRecord, 'id' | 'createdAt'>) => {
      const weeks = getAgeInWeeks(draft.birthDate);
      const stage = getCycleStage(weeks);
      const unitCost = getUnitCost({
        quantity: draft.quantity,
        totalPurchasePrice: draft.totalPurchasePrice,
      });
      const supplierName = supplierMap.get(draft.supplierId) || 'Fornecedor não informado';

      const nextVaccine = draft.birthDate
        ? getNextVaccineRecommendation(
            draft.birthDate,
            new Date().toISOString(),
            healthRules,
            healthRecords,
            editingId ?? undefined,
          )
        : null;

      const statusTone = (() => {
        if (!nextVaccine) return { chip: 'bg-slate-200 text-slate-700', ring: 'border-slate-300 bg-slate-50', icon: <CheckCircle2 className="h-4 w-4" />, text: 'Todas as vacinas do calendário inicial já foram aplicadas' };
        if (nextVaccine.status === 'urgente') return { chip: 'bg-red-200 text-red-900', ring: 'border-red-300 bg-red-50', icon: <AlertCircle className="h-4 w-4" />, text: 'Atrasada — aplique imediatamente' };
        if (nextVaccine.status === 'proximo') return { chip: 'bg-orange-200 text-orange-900', ring: 'border-orange-300 bg-orange-50', icon: <AlertCircle className="h-4 w-4" />, text: 'Aplicar nos próximos dias' };
        if (nextVaccine.status === 'agendado') return { chip: 'bg-blue-200 text-blue-900', ring: 'border-blue-300 bg-blue-50', icon: <Calendar className="h-4 w-4" />, text: 'Agendada conforme calendário vacinal' };
        return { chip: 'bg-emerald-200 text-emerald-900', ring: 'border-emerald-300 bg-emerald-50', icon: <CheckCircle2 className="h-4 w-4" />, text: 'Concluída' };
      })();

      return (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#0f1c2b]">Classificação automática do lote</h3>
            <p className="mt-1 text-sm text-gray-500">
              O sistema usa a idade em semanas para enquadrar o lote na fase correta do ciclo da ave.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">Fornecedor</div>
              <div className="mt-1 text-sm font-extrabold text-[#0f1c2b]">{supplierName}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">Fase atual</div>
              <div className="mt-1 text-sm font-extrabold text-[#0f1c2b]">{stage.label}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">Idade do lote</div>
              <div className="mt-1 text-sm font-extrabold text-[#0f1c2b]">{weeks} semana(s)</div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">Custo por ave</div>
              <div className="mt-1 text-sm font-extrabold text-[#0f1c2b]">{currencyFormatter.format(unitCost)}</div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Syringe className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-[#0f1c2b]">Próxima vacina recomendada</h3>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                Calendário IMA/MG caipira
              </span>
            </div>
            {!draft.birthDate ? (
              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                Informe a <span className="font-bold">data de nascimento</span> do lote para visualizar a próxima vacina recomendada automaticamente.
              </div>
            ) : nextVaccine ? (
              <div className={`rounded-2xl border p-4 ${statusTone.ring}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${statusTone.chip}`}>
                    {statusTone.icon}
                    {nextVaccine.status === 'urgente' ? 'Urgente' : nextVaccine.status === 'proximo' ? 'Próxima' : nextVaccine.status === 'agendado' ? 'Agendada' : 'Concluída'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 bg-white/70 border border-slate-300 rounded-full px-2 py-0.5">
                    {nextVaccine.categoryLabel}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 bg-white/70 border border-slate-300 rounded-full px-2 py-0.5">
                    {nextVaccine.applicationMethodLabel}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <h4 className="text-base font-extrabold text-[#0f1c2b] leading-tight">
                    {nextVaccine.entry.vaccines.join(' + ')}
                  </h4>
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-700">{new Date(nextVaccine.scheduledDate).toLocaleDateString('pt-BR')}</span>
                    <span className="mx-1.5 text-slate-400">•</span>
                    <span>idade alvo: {nextVaccine.entry.ageMinDays}–{nextVaccine.entry.ageMaxDays} dias</span>
                  </div>
                </div>
                {nextVaccine.daysUntil !== 0 && (
                  <p className="text-xs text-slate-700 mb-1.5">
                    {nextVaccine.daysUntil < 0
                      ? <>Atrasada em <span className="font-bold text-red-700">{Math.abs(nextVaccine.daysUntil)} dia(s)</span>.</>
                      : <>Faltam <span className="font-bold text-emerald-700">{nextVaccine.daysUntil} dia(s)</span> para a aplicação.</>}
                    <span className="text-slate-500"> Idade atual: {nextVaccine.currentAgeDays} dias.</span>
                  </p>
                )}
                {nextVaccine.notes && (
                  <p className="text-xs text-slate-600 border-t border-white/50 pt-2 mt-1 leading-snug">
                    {nextVaccine.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="inline h-4 w-4 mr-2 -mt-0.5" />
                Todas as vacinas do calendário inicial já foram aplicadas neste lote. Use a aba Saúde para reforços e acompanhamento contínuo.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
            {supplierOptions.length === 0
              ? 'Cadastre primeiro um fornecedor ativo para vincular a compra das aves.'
              : stage.description}
          </div>
        </div>
      );
    },
    [supplierMap, supplierOptions.length, healthRules, healthRecords, editingId],
  );

  return (
    <CadastroSection
      title="Cadastro • Animais"
      description="Controle os lotes de aves com investimento total, custo unitário calculado automaticamente e classificação por fase do ciclo produtivo."
      searchPlaceholder="Buscar por fornecedor, fase, finalidade, espécie ou identificação"
      formTitle="Novo cadastro de animais"
      itemLabel="animal"
      records={records}
      emptyValues={emptyValues}
      fields={fields}
      columns={columns}
      getSearchableText={getSearchableTextForRecord}
      getSummary={getSummary}
      renderFormInsights={renderFormInsights}
      onSave={onSave}
      onDelete={onDelete}
      isLoading={isLoading}
      isSyncing={isSyncing}
      errorMessage={errorMessage}
      onRetry={onRetry}
    />
  );
}
