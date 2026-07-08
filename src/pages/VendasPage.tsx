import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  SystemSettingsData,
  ClientRecord,
  AnimalRecord,
  DisponibilidadeVenda,
  VendaRecord,
  ProdutoVenda,
  FormaPagamento,
  ManejoRecord,
} from '@/types';
import { getAnimalLabel } from '@/lib/manejo';
import { useToast } from '@/components/ui/ToastProvider';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const PRODUTO_LABELS: Record<ProdutoVenda, string> = {
  ovos: 'Ovos',
  galinhas_vivas: 'Galinhas Vivas',
  galinhas_limpas: 'Galinhas Limpas',
  cama_aviario: 'Cama de Aviário',
};

const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'Pix',
};

const emptyVendaDraft: Omit<VendaRecord, 'id' | 'createdAt'> = {
  date: new Date().toISOString().slice(0, 10),
  clientId: '',
  produto: 'ovos',
  quantidade: 0,
  lote: '',
  formaPagamento: 'dinheiro',
  valorUnitario: 0,
  valorTotal: 0,
  notes: '',
};

interface VendasPageProps {
  settings: SystemSettingsData;
  clients: ClientRecord[];
  animals: AnimalRecord[];
  disponibilidadeVenda: DisponibilidadeVenda[];
  vendas: VendaRecord[];
  manejoRecords: ManejoRecord[];
  onSaveVenda: (record: VendaRecord) => Promise<void> | void;
  onDeleteVenda: (id: string) => Promise<void> | void;
  isLoading?: boolean;
  isSyncing?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export default function VendasPage({
  settings,
  clients,
  animals,
  disponibilidadeVenda,
  vendas,
  manejoRecords,
  onSaveVenda,
  onDeleteVenda,
  isLoading = false,
  isSyncing = false,
  errorMessage,
  onRetry,
}: VendasPageProps) {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<'form' | 'history'>('form');
  const [editingVendaId, setEditingVendaId] = useState<string | null>(null);
  const [vendaDraft, setVendaDraft] = useState<Omit<VendaRecord, 'id' | 'createdAt'>>(emptyVendaDraft);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const currentStock = useMemo(() => {
    const latestDisponibilidade = disponibilidadeVenda[0];
    
    // Calcular total de ovos coletados do manejo
    const totalOvosColetados = manejoRecords.reduce((sum, m) => sum + (m.ovosColetados || 0), 0);
    const totalOvosVendidos = vendas
      .filter((v) => v.produto === 'ovos')
      .reduce((sum, v) => sum + v.quantidade, 0);
    
    const totalGalinhasVivasVendidas = vendas
      .filter((v) => v.produto === 'galinhas_vivas')
      .reduce((sum, v) => sum + v.quantidade, 0);
    const totalGalinhasLimpasVendidas = vendas
      .filter((v) => v.produto === 'galinhas_limpas')
      .reduce((sum, v) => sum + v.quantidade, 0);
    const totalCamaAviarioVendida = vendas
      .filter((v) => v.produto === 'cama_aviario')
      .reduce((sum, v) => sum + v.quantidade, 0);

    return {
      ovos: Math.max(0, totalOvosColetados - totalOvosVendidos),
      galinhas_vivas: Math.max(0, (latestDisponibilidade?.galinhasVivas ?? 0) - totalGalinhasVivasVendidas),
      galinhas_limpas: Math.max(0, (latestDisponibilidade?.galinhasLimpas ?? 0) - totalGalinhasLimpasVendidas),
      cama_aviario: Math.max(0, (latestDisponibilidade?.camaAviarioUnidades ?? 0) - totalCamaAviarioVendida),
    };
  }, [disponibilidadeVenda, vendas, manejoRecords]);

  const valorUnitario = useMemo(() => {
    switch (vendaDraft.produto) {
      case 'ovos':
        return settings.eggSalePrice;
      case 'galinhas_vivas':
      case 'galinhas_limpas':
        return settings.birdSalePrice;
      case 'cama_aviario':
        return settings.litterSalePrice;
      default:
        return 0;
    }
  }, [vendaDraft.produto, settings]);

  const valorTotal = useMemo(() => {
    return valorUnitario * vendaDraft.quantidade;
  }, [valorUnitario, vendaDraft.quantidade]);

  useEffect(() => {
    setVendaDraft((prev) => ({
      ...prev,
      valorUnitario,
      valorTotal,
    }));
  }, [valorUnitario, valorTotal]);

  const handleResetForm = () => {
    setEditingVendaId(null);
    setVendaDraft(emptyVendaDraft);
    setAlertMessage(null);
  };

  const handleEditVenda = (venda: VendaRecord) => {
    setEditingVendaId(venda.id);
    setVendaDraft({
      date: venda.date,
      clientId: venda.clientId,
      produto: venda.produto,
      quantidade: venda.quantidade,
      lote: venda.lote,
      formaPagamento: venda.formaPagamento,
      valorUnitario: venda.valorUnitario,
      valorTotal: venda.valorTotal,
      notes: venda.notes,
    });
    setActiveSection('form');
  };

  const handleSaveVenda = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendaDraft.clientId) {
      toast.warning('Cliente obrigatório', 'Selecione um cliente para continuar a venda.');
      return;
    }
    if (!vendaDraft.lote) {
      toast.warning('Lote obrigatório', 'Selecione um lote para registrar a venda.');
      return;
    }
    if (vendaDraft.quantidade <= 0) {
      toast.warning('Quantidade inválida', 'A quantidade precisa ser maior que zero.');
      return;
    }

    if (vendaDraft.quantidade > currentStock[vendaDraft.produto]) {
      toast.error(
        'Estoque insuficiente',
        `Você tem ${currentStock[vendaDraft.produto]} ${PRODUTO_LABELS[vendaDraft.produto]} disponíveis.`,
      );
      return;
    }

    await onSaveVenda({
      ...vendaDraft,
      id: editingVendaId ?? crypto.randomUUID(),
      createdAt: editingVendaId
        ? vendas.find((v) => v.id === editingVendaId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
    });

    handleResetForm();
  };

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const animalMap = useMemo(() => new Map(animals.map((a) => [a.id, a])), [animals]);

  const tabs = [
    { id: 'form' as const, label: 'Nova Venda' },
    { id: 'history' as const, label: 'Histórico' },
  ];

  return (
    <div className="app-section space-y-6">
      {/* Tab Navigation without the card wrapper */}
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

      {/* Error/Sync message still visible */}
      {(errorMessage || isSyncing) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm font-medium text-amber-800">
            {errorMessage || 'Sincronizando dados de vendas com o Supabase...'}
          </div>
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

      {activeSection === 'form' && (
        <section className="app-section-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-brand-primary" />
                <h2 className="text-lg font-extrabold text-[#0f1c2b]">
                  {editingVendaId ? 'Editar Venda' : 'Nova Venda'}
                </h2>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data</span>
              <input
                type="date"
                value={vendaDraft.date}
                onChange={(e) => setVendaDraft((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Cliente</span>
              <select
                value={vendaDraft.clientId}
                onChange={(e) => setVendaDraft((prev) => ({ ...prev, clientId: e.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">Selecione</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Produto</span>
              <select
                value={vendaDraft.produto}
                onChange={(e) => setVendaDraft((prev) => ({ ...prev, produto: e.target.value as ProdutoVenda }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                {Object.entries(PRODUTO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                Quantidade (Disponível: {currentStock[vendaDraft.produto]})
              </span>
              <input
                type="number"
                min={0}
                value={vendaDraft.quantidade}
                onChange={(e) => setVendaDraft((prev) => ({ ...prev, quantidade: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lote de Origem</span>
              <select
                value={vendaDraft.lote}
                onChange={(e) => setVendaDraft((prev) => ({ ...prev, lote: e.target.value }))}
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
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Forma de Pagamento</span>
              <select
                value={vendaDraft.formaPagamento}
                onChange={(e) => setVendaDraft((prev) => ({ ...prev, formaPagamento: e.target.value as FormaPagamento }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                {Object.entries(FORMA_PAGAMENTO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor Unitário</p>
              <p className="text-2xl font-extrabold text-[#0f1c2b]">{currencyFormatter.format(valorUnitario)}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor Total</p>
              <p className="text-2xl font-extrabold text-[#0f1c2b]">{currencyFormatter.format(valorTotal)}</p>
            </div>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Observações</span>
              <textarea
                value={vendaDraft.notes}
                onChange={(e) => setVendaDraft((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveVenda}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {editingVendaId ? 'Atualizar Venda' : 'Salvar Venda'}
              </button>
              {editingVendaId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {activeSection === 'history' && (
        <section className="app-section-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Histórico de Vendas</h2>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                    Produto
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                    Quantidade
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                    Valor Total
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                    Forma de Pagamento
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda) => (
                  <tr key={venda.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-[#0f1c2b]">{venda.date}</td>
                    <td className="py-3 px-4 text-sm text-[#0f1c2b]">
                      {clientMap.get(venda.clientId)?.name ?? 'Cliente removido'}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#0f1c2b]">
                      {PRODUTO_LABELS[venda.produto]}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#0f1c2b]">{venda.quantidade}</td>
                    <td className="py-3 px-4 text-sm font-bold text-[#0f1c2b]">
                      {currencyFormatter.format(venda.valorTotal)}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#0f1c2b]">
                      {FORMA_PAGAMENTO_LABELS[venda.formaPagamento]}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditVenda(venda)}
                          className="inline-flex items-center justify-center rounded-full border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-slate-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteVenda(venda.id)}
                          className="inline-flex items-center justify-center rounded-full border border-red-300 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
