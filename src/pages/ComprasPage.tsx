import React, { useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { AnimalRecord, PurchaseCategory, PurchasePaymentStatus, PurchaseRecord, SupplierRecord } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

interface ComprasPageProps {
  records: PurchaseRecord[];
  animals: AnimalRecord[];
  suppliers: SupplierRecord[];
  onSave: (record: PurchaseRecord) => Promise<void> | void;
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

const CATEGORY_LABELS: Record<PurchaseCategory, string> = {
  racao: 'Ração',
  ingrediente_racao: 'Ingrediente para ração',
  insumo_veterinario: 'Insumo veterinário',
  mao_de_obra: 'Mão de obra',
  material_operacional: 'Material operacional',
  aves: 'Lote de aves',
  outro: 'Outro insumo',
};

const PAYMENT_STATUS_LABELS: Record<PurchasePaymentStatus, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  pago: 'Pago',
};

const PURCHASE_CATEGORY_CONFIG: Record<
  PurchaseCategory,
  {
    intro: string;
    itemLabel: string;
    itemPlaceholder: string;
    supplierLabel: string;
    supplierPlaceholder: string;
    quantityLabel: string;
    quantityStep: number;
    unitLabel: string;
    unitPlaceholder: string;
    unitOptions: string[];
    unitPriceLabel: string;
    invoiceLabel: string;
    notesPlaceholder: string;
    linkLabel: string;
    linkHint: string;
  }
> = {
  racao: {
    intro: 'Registro voltado para compra de ração pronta, com foco em fase nutricional, fornecedor e lote atendido.',
    itemLabel: 'Tipo de ração',
    itemPlaceholder: 'Ex: Ração inicial 22%, crescimento, postura',
    supplierLabel: 'Fornecedor da ração',
    supplierPlaceholder: 'Selecione o fornecedor da ração',
    quantityLabel: 'Quantidade comprada',
    quantityStep: 0.01,
    unitLabel: 'Unidade da ração',
    unitPlaceholder: 'Ex: saco',
    unitOptions: ['saco', 'kg', 'ton', 'fardo'],
    unitPriceLabel: 'Valor por unidade/saco',
    invoiceLabel: 'Nota da ração',
    notesPlaceholder: 'Lote atendido, composição, condições de entrega e observações da compra de ração.',
    linkLabel: 'Lote que vai consumir a ração',
    linkHint: 'Vincule o lote principal para acompanhar o custo alimentar.',
  },
  ingrediente_racao: {
    intro: 'Cadastro focado em insumos para formulação de ração, como milho, farelo, núcleo, calcário e aditivos.',
    itemLabel: 'Ingrediente adquirido',
    itemPlaceholder: 'Ex: Milho moído, farelo de soja, núcleo vitamínico',
    supplierLabel: 'Fornecedor do ingrediente',
    supplierPlaceholder: 'Selecione o fornecedor do ingrediente',
    quantityLabel: 'Quantidade comprada',
    quantityStep: 0.01,
    unitLabel: 'Unidade do ingrediente',
    unitPlaceholder: 'Ex: kg',
    unitOptions: ['kg', 'saco', 'ton', 'litro'],
    unitPriceLabel: 'Valor por unidade',
    invoiceLabel: 'Nota do ingrediente',
    notesPlaceholder: 'Detalhes de formulação, qualidade da matéria-prima e observações do estoque.',
    linkLabel: 'Lote relacionado',
    linkHint: 'Vincule o lote se este ingrediente foi comprado para uma fase específica.',
  },
  insumo_veterinario: {
    intro: 'Cadastro para vacinas, medicamentos, desinfetantes e demais insumos de sanidade da granja.',
    itemLabel: 'Insumo veterinário',
    itemPlaceholder: 'Ex: Vacina Newcastle, vermífugo, desinfetante',
    supplierLabel: 'Fornecedor veterinário',
    supplierPlaceholder: 'Selecione o fornecedor do insumo',
    quantityLabel: 'Quantidade adquirida',
    quantityStep: 0.01,
    unitLabel: 'Unidade do insumo',
    unitPlaceholder: 'Ex: dose',
    unitOptions: ['dose', 'frasco', 'litro', 'caixa', 'un'],
    unitPriceLabel: 'Valor por unidade',
    invoiceLabel: 'Nota / receita / documento',
    notesPlaceholder: 'Observações sanitárias, lote de fabricação, manejo e condições de armazenamento.',
    linkLabel: 'Lote tratado',
    linkHint: 'Vincule o lote de aves que recebeu ou receberá o insumo.',
  },
  mao_de_obra: {
    intro: 'Cadastro de serviços contratados para limpeza, manutenção, manejo, vacinação e rotinas operacionais.',
    itemLabel: 'Serviço contratado',
    itemPlaceholder: 'Ex: Limpeza do galpão, vacinação, manutenção elétrica',
    supplierLabel: 'Prestador de serviço',
    supplierPlaceholder: 'Selecione o prestador, se cadastrado',
    quantityLabel: 'Quantidade',
    quantityStep: 1,
    unitLabel: 'Unidade do serviço',
    unitPlaceholder: 'Ex: diária',
    unitOptions: ['diária', 'hora', 'serviço', 'semana', 'mês'],
    unitPriceLabel: 'Valor por diária/hora/serviço',
    invoiceLabel: 'Recibo / documento',
    notesPlaceholder: 'Detalhes da atividade realizada, equipe envolvida e observações do serviço.',
    linkLabel: 'Lote ou área beneficiada',
    linkHint: 'Vincule um lote quando o serviço foi direcionado a um manejo específico.',
  },
  material_operacional: {
    intro: 'Cadastro para materiais de uso diário da granja, como cama, lona, utensílios, embalagens e manutenção.',
    itemLabel: 'Material operacional',
    itemPlaceholder: 'Ex: Maravalha, lona, balde, bandeja, caixa plástica',
    supplierLabel: 'Fornecedor do material',
    supplierPlaceholder: 'Selecione o fornecedor do material',
    quantityLabel: 'Quantidade adquirida',
    quantityStep: 0.01,
    unitLabel: 'Unidade do material',
    unitPlaceholder: 'Ex: un',
    unitOptions: ['un', 'rolo', 'pacote', 'kg', 'm'],
    unitPriceLabel: 'Valor por unidade',
    invoiceLabel: 'Nota do material',
    notesPlaceholder: 'Aplicação na operação, setor de uso e observações do material adquirido.',
    linkLabel: 'Lote ou setor relacionado',
    linkHint: 'Vincule o lote quando o material for destinado a um grupo específico de aves.',
  },
  aves: {
    intro: 'Cadastro específico para aquisição de novos lotes de aves, conectado ao lote recebido e ao fornecedor de origem.',
    itemLabel: 'Descrição do lote adquirido',
    itemPlaceholder: 'Ex: Pintainhas Isa Brown com 1 dia, lote de recria',
    supplierLabel: 'Fornecedor das aves',
    supplierPlaceholder: 'Selecione o fornecedor das aves',
    quantityLabel: 'Quantidade de aves',
    quantityStep: 1,
    unitLabel: 'Unidade',
    unitPlaceholder: 'Ex: cabeça',
    unitOptions: ['cabeça', 'lote', 'un'],
    unitPriceLabel: 'Valor por ave/lote',
    invoiceLabel: 'Nota / GTA / documento',
    notesPlaceholder: 'Origem do lote, idade das aves, transporte e observações de recebimento.',
    linkLabel: 'Lote cadastrado no sistema',
    linkHint: 'Vincule o lote recém-cadastrado para unir cadastro zootécnico e compra.',
  },
  outro: {
    intro: 'Use esta opção para qualquer aquisição complementar da granja que não se enquadre nas categorias anteriores.',
    itemLabel: 'Item adquirido',
    itemPlaceholder: 'Ex: combustível, utensílio específico, item eventual',
    supplierLabel: 'Fornecedor',
    supplierPlaceholder: 'Selecione o fornecedor, se houver',
    quantityLabel: 'Quantidade',
    quantityStep: 0.01,
    unitLabel: 'Unidade',
    unitPlaceholder: 'Ex: un',
    unitOptions: ['un', 'kg', 'litro', 'pacote', 'serviço'],
    unitPriceLabel: 'Valor por unidade',
    invoiceLabel: 'Nota / documento',
    notesPlaceholder: 'Descreva o contexto da compra e como ela impacta a operação da granja.',
    linkLabel: 'Lote relacionado',
    linkHint: 'Opcional: vincule um lote se a compra foi feita para um grupo específico.',
  },
};

const emptyPurchaseRecord = (): Omit<PurchaseRecord, 'id' | 'createdAt'> => ({
  supplierId: '',
  linkedAnimalId: '',
  category: 'racao',
  itemName: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  quantity: 1,
  unit: 'un',
  unitPrice: 0,
  totalPrice: 0,
  invoiceNumber: '',
  paymentStatus: 'pago',
  notes: '',
  feedClassification: '',
  veterinaryPurpose: '',
  expirationDate: '',
  serviceType: '',
  operationalArea: '',
});

function isCurrentMonth(date: string) {
  const base = new Date(date);
  const now = new Date();
  return base.getMonth() === now.getMonth() && base.getFullYear() === now.getFullYear();
}

function getAnimalLabel(record: AnimalRecord) {
  return `${record.tag} • ${record.species} • ${record.quantity} aves`;
}

function getInitials(category: PurchaseCategory) {
  return CATEGORY_LABELS[category]
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');
}

function normalizeDraftForCategory(
  previous: Omit<PurchaseRecord, 'id' | 'createdAt'>,
  category: PurchaseCategory,
): Omit<PurchaseRecord, 'id' | 'createdAt'> {
  const defaultUnit = PURCHASE_CATEGORY_CONFIG[category].unitOptions[0] ?? 'un';

  return {
    ...previous,
    category,
    unit: defaultUnit,
    feedClassification: category === 'racao' || category === 'ingrediente_racao' ? previous.feedClassification : '',
    veterinaryPurpose: category === 'insumo_veterinario' ? previous.veterinaryPurpose : '',
    expirationDate: category === 'insumo_veterinario' ? previous.expirationDate : '',
    serviceType: category === 'mao_de_obra' ? previous.serviceType : '',
    operationalArea: category === 'material_operacional' ? previous.operationalArea : '',
  };
}

export default function ComprasPage({
  records,
  animals,
  suppliers,
  onSave,
  onDelete,
  isLoading = false,
  isSyncing = false,
  errorMessage,
  onRetry,
}: ComprasPageProps) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<PurchaseRecord, 'id' | 'createdAt'>>(emptyPurchaseRecord);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    supplierId: '',
    minValue: '',
    maxValue: '',
  });
  const categoryConfig = PURCHASE_CATEGORY_CONFIG[draft.category];

  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.companyName])), [suppliers]);
  const animalMap = useMemo(() => new Map(animals.map((animal) => [animal.id, animal])), [animals]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const supplierName = supplierMap.get(record.supplierId) || '';
      const linkedAnimal = record.linkedAnimalId ? animalMap.get(record.linkedAnimalId) : undefined;
      const haystack = [
        record.itemName,
        record.invoiceNumber,
        record.notes,
        CATEGORY_LABELS[record.category],
        supplierName,
        linkedAnimal ? getAnimalLabel(linkedAnimal) : '',
      ]
        .join(' ')
        .toLowerCase();

      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
      if (filters.category && record.category !== filters.category) return false;
      if (filters.supplierId && record.supplierId !== filters.supplierId) return false;
      if (filters.dateFrom && record.purchaseDate < filters.dateFrom) return false;
      if (filters.dateTo && record.purchaseDate > filters.dateTo) return false;
      if (filters.minValue && record.totalPrice < Number(filters.minValue)) return false;
      if (filters.maxValue && record.totalPrice > Number(filters.maxValue)) return false;
      return true;
    });
  }, [animalMap, filters, records, search, supplierMap]);

  const totals = useMemo(() => {
    const filteredTotal = filteredRecords.reduce((sum, record) => sum + record.totalPrice, 0);
    const monthTotal = records.filter((record) => isCurrentMonth(record.purchaseDate)).reduce((sum, record) => sum + record.totalPrice, 0);
    const pendingCount = records.filter((record) => record.paymentStatus !== 'pago').length;
    const averageTicket = filteredRecords.length ? filteredTotal / filteredRecords.length : 0;
    return { filteredTotal, monthTotal, pendingCount, averageTicket };
  }, [filteredRecords, records]);

  const reportByCategory = useMemo(() => {
    const totalsByCategory = new Map<PurchaseCategory, number>();
    records.forEach((record) => {
      totalsByCategory.set(record.category, (totalsByCategory.get(record.category) || 0) + record.totalPrice);
    });
    return Array.from(totalsByCategory.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [records]);

  const reportBySupplier = useMemo(() => {
    const totalsBySupplier = new Map<string, number>();
    records.forEach((record) => {
      const name = supplierMap.get(record.supplierId) || 'Sem fornecedor';
      totalsBySupplier.set(name, (totalsBySupplier.get(name) || 0) + record.totalPrice);
    });
    return Array.from(totalsBySupplier.entries())
      .map(([supplierName, total]) => ({ supplierName, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [records, supplierMap]);

  const linkedLots = useMemo(
    () =>
      animals
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((animal) => ({
          id: animal.id,
          title: getAnimalLabel(animal),
          supplierName: supplierMap.get(animal.supplierId) || 'Fornecedor não informado',
          invested: animal.totalPurchasePrice,
          birthDate: animal.birthDate,
        })),
    [animals, supplierMap],
  );

  const handleDraftChange = <K extends keyof Omit<PurchaseRecord, 'id' | 'createdAt'>>(key: K, value: Omit<PurchaseRecord, 'id' | 'createdAt'>[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      next.totalPrice = Number((next.quantity * next.unitPrice).toFixed(2));
      return next;
    });
  };

  const handleCategoryChange = (category: PurchaseCategory) => {
    setDraft((prev) => {
      const next = normalizeDraftForCategory(prev, category);
      next.totalPrice = Number((next.quantity * next.unitPrice).toFixed(2));
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(emptyPurchaseRecord());
  };

  const validateDraft = () => {
    if (!draft.itemName.trim()) return 'Informe o nome do item ou serviço adquirido.';
    if (!draft.purchaseDate) return 'Informe a data da compra.';
    if (draft.quantity <= 0) return 'A quantidade deve ser maior que zero.';
    if (draft.unitPrice < 0) return 'O valor unitário não pode ser negativo.';
    if ((draft.category === 'racao' || draft.category === 'ingrediente_racao') && !draft.feedClassification.trim()) {
      return 'Informe a classificação da ração ou ingrediente.';
    }
    if (draft.category === 'insumo_veterinario' && !draft.veterinaryPurpose.trim()) {
      return 'Informe a finalidade do insumo veterinário.';
    }
    if (draft.category === 'mao_de_obra' && !draft.serviceType.trim()) {
      return 'Informe o tipo de serviço contratado.';
    }
    if (draft.category === 'material_operacional' && !draft.operationalArea.trim()) {
      return 'Informe a área operacional do material.';
    }
    return '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validateDraft();
    if (validationMessage) {
      toast.warning('Revise os dados da compra', validationMessage);
      return;
    }

    const payload: PurchaseRecord = {
      ...draft,
      id: editingId ?? crypto.randomUUID(),
      createdAt: editingId ? records.find((record) => record.id === editingId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
      totalPrice: Number((draft.quantity * draft.unitPrice).toFixed(2)),
    };

    try {
      setIsSubmitting(true);
      await onSave(payload);
      resetForm();
    } catch {
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: PurchaseRecord) => {
    const { id, createdAt, ...rest } = record;
    setEditingId(id);
    setDraft(rest);
  };

  return (
    <div className="app-section space-y-6">
      <section className="app-section-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="app-section-badge">Gestão</div>
            <h1 className="app-section-title">Gestão • Compras</h1>
            <p className="app-section-description">
              Controle aquisições da granja com integração aos lotes de aves, fornecedores, filtros operacionais e relatórios de gastos.
            </p>
          </div>

          <label className="relative w-full xl:max-w-sm">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por item, nota, fornecedor, lote ou categoria"
              className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Gasto filtrado</div>
            <div className="mt-2 text-2xl font-extrabold text-[#0f1c2b]">{currencyFormatter.format(totals.filteredTotal)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Gasto do mês</div>
            <div className="mt-2 text-2xl font-extrabold text-[#0f1c2b]">{currencyFormatter.format(totals.monthTotal)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Compras pendentes</div>
            <div className="mt-2 text-2xl font-extrabold text-[#0f1c2b]">{totals.pendingCount}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Ticket médio</div>
            <div className="mt-2 text-2xl font-extrabold text-[#0f1c2b]">{currencyFormatter.format(totals.averageTicket)}</div>
          </div>
        </div>

        {(errorMessage || isSyncing) && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="text-sm font-medium text-amber-800">{errorMessage || 'Sincronizando compras com o Supabase...'}</div>
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="app-section-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">{editingId ? 'Editar compra' : 'Nova compra'}</h2>
              <p className="mt-1 text-sm text-gray-500">Cadastre aquisições com validação por categoria e cálculo automático do valor total.</p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            )}
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Tipo de compra</span>
              <select
                value={draft.category}
                onChange={(event) => handleCategoryChange(event.target.value as PurchaseCategory)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                required
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">{categoryConfig.supplierLabel}</span>
              <select
                value={draft.supplierId}
                onChange={(event) => handleDraftChange('supplierId', event.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">{categoryConfig.supplierPlaceholder}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.companyName}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-[#0f1c2b]">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">Fluxo adaptado</div>
              <div className="mt-1">{categoryConfig.intro}</div>
            </div>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">{categoryConfig.itemLabel}</span>
              <input
                value={draft.itemName}
                onChange={(event) => handleDraftChange('itemName', event.target.value)}
                placeholder={categoryConfig.itemPlaceholder}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data da compra</span>
              <input
                type="date"
                value={draft.purchaseDate}
                onChange={(event) => handleDraftChange('purchaseDate', event.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">{categoryConfig.linkLabel}</span>
              <select
                value={draft.linkedAnimalId}
                onChange={(event) => handleDraftChange('linkedAnimalId', event.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">Selecione</option>
                {animals.map((animal) => (
                  <option key={animal.id} value={animal.id}>
                    {getAnimalLabel(animal)}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">{categoryConfig.linkHint}</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">{categoryConfig.quantityLabel}</span>
              <input
                type="number"
                min={0}
                step={categoryConfig.quantityStep}
                value={draft.quantity}
                onChange={(event) => handleDraftChange('quantity', Number(event.target.value || 0))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">{categoryConfig.unitLabel}</span>
              <select
                value={draft.unit}
                onChange={(event) => handleDraftChange('unit', event.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                required
              >
                {categoryConfig.unitOptions.map((unitOption) => (
                  <option key={unitOption} value={unitOption}>
                    {unitOption}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">{categoryConfig.unitPlaceholder}</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">{categoryConfig.unitPriceLabel}</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={draft.unitPrice}
                onChange={(event) => handleDraftChange('unitPrice', Number(event.target.value || 0))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                required
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor total calculado</span>
              <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-bold text-[#0f1c2b]">
                {currencyFormatter.format(draft.totalPrice)}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Status do pagamento</span>
              <select
                value={draft.paymentStatus}
                onChange={(event) => handleDraftChange('paymentStatus', event.target.value as PurchasePaymentStatus)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">{categoryConfig.invoiceLabel}</span>
              <input
                value={draft.invoiceNumber}
                onChange={(event) => handleDraftChange('invoiceNumber', event.target.value)}
                placeholder="Ex: NF-2025-0001"
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </label>

            {(draft.category === 'racao' || draft.category === 'ingrediente_racao') && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Classificação da ração</span>
                <input
                  value={draft.feedClassification}
                  onChange={(event) => handleDraftChange('feedClassification', event.target.value)}
                  placeholder="Ex: inicial, crescimento, postura, milho, farelo de soja"
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </label>
            )}

            {draft.category === 'insumo_veterinario' && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Finalidade veterinária</span>
                  <input
                    value={draft.veterinaryPurpose}
                    onChange={(event) => handleDraftChange('veterinaryPurpose', event.target.value)}
                    placeholder="Ex: vacinação, vermifugação, desinfecção"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Validade</span>
                  <input
                    type="date"
                    value={draft.expirationDate}
                    onChange={(event) => handleDraftChange('expirationDate', event.target.value)}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>
              </>
            )}

            {draft.category === 'mao_de_obra' && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Tipo de serviço</span>
                <input
                  value={draft.serviceType}
                  onChange={(event) => handleDraftChange('serviceType', event.target.value)}
                  placeholder="Ex: limpeza, manejo, manutenção, vacinação"
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </label>
            )}

            {draft.category === 'material_operacional' && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Área operacional</span>
                <input
                  value={draft.operationalArea}
                  onChange={(event) => handleDraftChange('operationalArea', event.target.value)}
                  placeholder="Ex: galpão, piquete, estoque, expedição"
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Observações</span>
              <textarea
                value={draft.notes}
                onChange={(event) => handleDraftChange('notes', event.target.value)}
                placeholder={categoryConfig.notesPlaceholder}
                rows={4}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isSyncing}
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {isSubmitting ? 'Salvando...' : editingId ? 'Atualizar compra' : 'Salvar compra'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="app-section-card">
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Filtros operacionais</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Período inicial</span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Período final</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Tipo</span>
                <select
                  value={filters.category}
                  onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Todos</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Fornecedor</span>
                <select
                  value={filters.supplierId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, supplierId: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Todos</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor mínimo</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={filters.minValue}
                  onChange={(event) => setFilters((prev) => ({ ...prev, minValue: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor máximo</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={filters.maxValue}
                  onChange={(event) => setFilters((prev) => ({ ...prev, maxValue: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>
            </div>
          </div>

          <div className="app-section-card">
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Relatório gerencial</h2>
            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Gastos por categoria</div>
                <div className="mt-3 space-y-2">
                  {reportByCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm">
                      <span className="font-semibold text-[#0f1c2b]">{CATEGORY_LABELS[item.category]}</span>
                      <span className="font-extrabold text-[#0f1c2b]">{currencyFormatter.format(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Maiores fornecedores</div>
                <div className="mt-3 space-y-2">
                  {reportBySupplier.map((item) => (
                    <div key={item.supplierName} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm">
                      <span className="font-semibold text-[#0f1c2b]">{item.supplierName}</span>
                      <span className="font-extrabold text-[#0f1c2b]">{currencyFormatter.format(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <div className="app-section-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Compras registradas</h2>
              <p className="mt-1 text-sm text-gray-500">Lista integrada às compras da granja, organizada por data e sem duplicações de registro.</p>
            </div>
            <div className="text-sm font-bold text-gray-500">{filteredRecords.length} registro(s)</div>
          </div>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">Carregando compras...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">Nenhuma compra encontrada com os filtros atuais.</div>
            ) : (
              filteredRecords.map((record) => {
                const supplierName = supplierMap.get(record.supplierId) || 'Fornecedor não informado';
                const linkedAnimal = record.linkedAnimalId ? animalMap.get(record.linkedAnimalId) : undefined;
                return (
                  <div key={record.id} className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-sm font-extrabold text-brand-primary">
                          {getInitials(record.category)}
                        </div>
                        <div>
                          <div className="text-base font-extrabold text-[#0f1c2b]">{record.itemName}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            {CATEGORY_LABELS[record.category]} • {record.purchaseDate} • {supplierName}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
                            <span className="rounded-full bg-white px-3 py-1">{record.quantity} {record.unit}</span>
                            <span className="rounded-full bg-white px-3 py-1">{PAYMENT_STATUS_LABELS[record.paymentStatus]}</span>
                            {record.linkedAnimalId && linkedAnimal && <span className="rounded-full bg-white px-3 py-1">{getAnimalLabel(linkedAnimal)}</span>}
                            {record.invoiceNumber && <span className="rounded-full bg-white px-3 py-1">{record.invoiceNumber}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <div className="text-right">
                          <div className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor total</div>
                          <div className="text-xl font-extrabold text-[#0f1c2b]">{currencyFormatter.format(record.totalPrice)}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(record)}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-white"
                          >
                            <Edit3 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(record.id)}
                            disabled={isSyncing}
                            className="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>

                    {record.notes && <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">{record.notes}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="app-section-card">
          <div>
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Lotes integrados ao módulo de compras</h2>
            <p className="mt-1 text-sm text-gray-500">Todo novo lote cadastrado aparece automaticamente aqui para apoiar decisões de compra e reposição.</p>
          </div>

          <div className="mt-6 space-y-3">
            {linkedLots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">Nenhum lote de aves cadastrado até o momento.</div>
            ) : (
              linkedLots.map((lot) => (
                <div key={lot.id} className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <div className="text-sm font-extrabold text-[#0f1c2b]">{lot.title}</div>
                  <div className="mt-1 text-sm text-gray-500">{lot.supplierName}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
                    <span className="rounded-full bg-white px-3 py-1">Nascimento/lote: {lot.birthDate}</span>
                    <span className="rounded-full bg-white px-3 py-1">Investimento: {currencyFormatter.format(lot.invested)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
