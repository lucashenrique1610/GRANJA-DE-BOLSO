import React, { useMemo, useState } from 'react';
import { SystemSettingsData, VendaRecord, PurchaseRecord, AnimalRecord } from '@/types';
import { getAnimalLabel } from '@/lib/manejo';

interface FinanceiroPageProps {
  settings: SystemSettingsData;
  vendas: VendaRecord[];
  compras: PurchaseRecord[];
  animais: AnimalRecord[];
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function FinanceiroPage({ settings, vendas, compras, animais }: FinanceiroPageProps) {
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');

  // Filtrar dados por lote selecionado
  const vendasFiltradas = useMemo(() => {
    if (!selectedLoteId) return vendas;
    return vendas.filter(venda => venda.lote === selectedLoteId);
  }, [vendas, selectedLoteId]);

  const comprasFiltradas = useMemo(() => {
    if (!selectedLoteId) return compras;
    
    // Filtrar compras vinculadas ao lote OU compras de aves desse lote
    return compras.filter(compra => {
      if (compra.linkedAnimalId === selectedLoteId) return true;
      if (compra.category === 'aves') {
        // Verificar se a compra está relacionada ao lote (caso a compra esteja vinculada)
        return compra.linkedAnimalId === selectedLoteId;
      }
      return false;
    });
  }, [compras, selectedLoteId]);

  // Cálculo de receitas
  const totalReceitas = useMemo(() => {
    return vendasFiltradas.reduce((total, venda) => total + venda.valorTotal, 0);
  }, [vendasFiltradas]);

  // Cálculo de despesas
  const totalDespesas = useMemo(() => {
    return comprasFiltradas.reduce((total, compra) => total + compra.totalPrice, 0);
  }, [comprasFiltradas]);

  // Cálculo de lucro líquido
  const lucroLiquido = totalReceitas - totalDespesas;

  // Cálculo de margem de lucro
  const margemLucro = totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100) : 0;

  // Livro Caixa: unificar vendas e compras
  const livroCaixa = useMemo(() => {
    const transacoes = [
      ...vendasFiltradas.map(venda => ({
        id: venda.id,
        tipo: 'receita',
        data: venda.date,
        descricao: `Venda de ${venda.produto === 'ovos' ? 'ovos' : venda.produto === 'galinhas_vivas' ? 'galinhas vivas' : venda.produto === 'galinhas_limpas' ? 'galinhas limpas' : 'cama de aviário'}`,
        valor: venda.valorTotal,
        formaPagamento: venda.formaPagamento,
      })),
      ...comprasFiltradas.map(compra => ({
        id: compra.id,
        tipo: 'despesa',
        data: compra.purchaseDate,
        descricao: `Compra de ${compra.itemName}`,
        valor: -compra.totalPrice,
        categoria: compra.category,
      })),
    ];

    // Ordenar por data decrescente
    return transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [vendasFiltradas, comprasFiltradas]);

  // Categorização de despesas
  const despesasPorCategoria = useMemo(() => {
    const categorias = new Map<string, number>();
    
    comprasFiltradas.forEach(compra => {
      const current = categorias.get(compra.category) || 0;
      categorias.set(compra.category, current + compra.totalPrice);
    });

    return Array.from(categorias.entries())
      .map(([categoria, total]) => ({
        categoria,
        total,
        percentual: totalDespesas > 0 ? (total / totalDespesas) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [comprasFiltradas, totalDespesas]);

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      racao: 'Ração',
      ingrediente_racao: 'Ingrediente para Ração',
      insumo_veterinario: 'Insumo Veterinário',
      mao_de_obra: 'Mão de Obra',
      material_operacional: 'Material Operacional',
      aves: 'Compra de Aves',
      outro: 'Outros',
    };
    return labels[categoria] || categoria;
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      cartao: 'Cartão',
      pix: 'PIX',
    };
    return labels[forma] || forma;
  };

  return (
    <div className="app-section space-y-6">
      {/* Filtro por Lote */}
      <div>
        <label className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500 block mb-2">
          Filtrar por Lote
        </label>
        <select
          value={selectedLoteId}
          onChange={(e) => setSelectedLoteId(e.target.value)}
          className="w-full max-w-md rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        >
          <option value="">Todos os lotes</option>
          {animais.map(animal => (
            <option key={animal.id} value={animal.id}>
              {getAnimalLabel(animal)}
            </option>
          ))}
        </select>
      </div>

      {/* Cards Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="app-section-card">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Receitas Totais</div>
          <div className="mt-2 text-2xl font-extrabold text-green-600">
            {currencyFormatter.format(totalReceitas)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {vendasFiltradas.length} venda{''}
            {vendasFiltradas.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="app-section-card">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Despesas Totais</div>
          <div className="mt-2 text-2xl font-extrabold text-red-600">
            {currencyFormatter.format(totalDespesas)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {comprasFiltradas.length} compra{''}
            {comprasFiltradas.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="app-section-card">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Lucro Líquido</div>
          <div className={`mt-2 text-2xl font-extrabold ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currencyFormatter.format(lucroLiquido)}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'}
          </div>
        </div>

        <div className="app-section-card">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Margem de Lucro</div>
          <div className={`mt-2 text-2xl font-extrabold ${margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {margemLucro.toFixed(2)}%
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Percentual sobre receitas
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Despesas por Categoria */}
        <section className="app-section-card">
          <h2 className="text-lg font-extrabold text-[#0f1c2b] mb-4">Despesas por Categoria</h2>
          <div className="space-y-3">
            {despesasPorCategoria.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma despesa registrada.</p>
            ) : (
              despesasPorCategoria.map((item) => (
                <div key={item.categoria} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-[#0f1c2b]">{getCategoriaLabel(item.categoria)}</div>
                    <div className="text-xs text-gray-500">{item.percentual.toFixed(1)}% das despesas</div>
                  </div>
                  <div className="text-sm font-bold text-[#0f1c2b]">{currencyFormatter.format(item.total)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Livro Caixa */}
        <section className="app-section-card">
          <h2 className="text-lg font-extrabold text-[#0f1c2b] mb-4">Livro Caixa</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {livroCaixa.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma transação registrada.</p>
            ) : (
              livroCaixa.map((transacao) => (
                <div key={transacao.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transacao.tipo === 'receita' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transacao.tipo === 'receita' ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0f1c2b]">{transacao.descricao}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(transacao.data).toLocaleDateString('pt-BR')}
                        {transacao.formaPagamento && ` • ${getFormaPagamentoLabel(transacao.formaPagamento)}`}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${transacao.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currencyFormatter.format(transacao.valor)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}