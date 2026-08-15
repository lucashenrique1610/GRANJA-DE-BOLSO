import React, { useState, useMemo } from 'react';
import {
  SystemSettingsData,
  VendaRecord,
  PurchaseRecord,
  AnimalRecord,
  ManejoRecord,
} from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { sanitizeSpreadsheetCell } from '@/lib/exportUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Filter, Loader2, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

const CATEGORY_LABELS: Record<string, string> = {
  racao: 'Ração',
  ingrediente_racao: 'Ingrediente para Ração',
  insumo_veterinario: 'Insumo Veterinário',
  mao_de_obra: 'Mão de Obra',
  material_operacional: 'Material Operacional',
  aves: 'Compra de Aves',
  outro: 'Outros',
};

const PRODUTO_LABELS: Record<string, string> = {
  ovos: 'Ovos',
  galinhas_vivas: 'Galinhas Vivas',
  galinhas_limpas: 'Galinhas Limpas',
  cama_aviaria: 'Cama de Aviário',
  cama_aviário: 'Cama de Aviário',
};

interface RelatoriosPageProps {
  settings: SystemSettingsData;
  vendas: VendaRecord[];
  compras: PurchaseRecord[];
  animais: AnimalRecord[];
  manejoRecords: ManejoRecord[];
}

export default function RelatoriosPage({
  settings,
  vendas,
  compras,
  animais,
  manejoRecords,
}: RelatoriosPageProps) {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLote, setSelectedLote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = useMemo(() => {
    let filteredVendas = [...vendas];
    let filteredCompras = [...compras];

    if (dateFrom) {
      filteredVendas = filteredVendas.filter((v) => v.date >= dateFrom);
      filteredCompras = filteredCompras.filter((c) => c.purchaseDate >= dateFrom);
    }
    if (dateTo) {
      filteredVendas = filteredVendas.filter((v) => v.date <= dateTo);
      filteredCompras = filteredCompras.filter((c) => c.purchaseDate <= dateTo);
    }
    if (selectedCategory) {
      filteredCompras = filteredCompras.filter((c) => c.category === selectedCategory);
    }
    if (selectedLote) {
      filteredVendas = filteredVendas.filter((v) => v.lote === selectedLote);
      filteredCompras = filteredCompras.filter((c) => c.linkedAnimalId === selectedLote);
    }

    return { filteredVendas, filteredCompras };
  }, [vendas, compras, dateFrom, dateTo, selectedCategory, selectedLote]);

  const { filteredVendas, filteredCompras } = filteredData;

  const totalReceitas = useMemo(() => {
    return filteredVendas.reduce((sum, v) => sum + v.valorTotal, 0);
  }, [filteredVendas]);

  const totalDespesas = useMemo(() => {
    return filteredCompras.reduce((sum, c) => sum + c.totalPrice, 0);
  }, [filteredCompras]);

  const lucroLiquido = totalReceitas - totalDespesas;

  const despesasPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    filteredCompras.forEach((c) => {
      const current = map.get(c.category) || 0;
      map.set(c.category, current + c.totalPrice);
    });
    return Array.from(map.entries())
      .map(([category, total]) => ({
        category,
        total,
        label: CATEGORY_LABELS[category] || category,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredCompras]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { receitas: number; despesas: number }>();
    
    filteredVendas.forEach((v) => {
      const month = v.date.slice(0, 7);
      const current = map.get(month) || { receitas: 0, despesas: 0 };
      map.set(month, { ...current, receitas: current.receitas + v.valorTotal });
    });
    
    filteredCompras.forEach((c) => {
      const month = c.purchaseDate.slice(0, 7);
      const current = map.get(month) || { receitas: 0, despesas: 0 };
      map.set(month, { ...current, despesas: current.despesas + c.totalPrice });
    });

    const months = Array.from(map.keys()).sort();
    return {
      labels: months.map((m) => {
        const [year, month] = m.split('-');
        return `${month}/${year}`;
      }),
      receitas: months.map((m) => map.get(m)!.receitas),
      despesas: months.map((m) => map.get(m)!.despesas),
    };
  }, [filteredVendas, filteredCompras]);

  const barChartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Receitas',
        data: monthlyData.receitas,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
      {
        label: 'Despesas',
        data: monthlyData.despesas,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      },
    ],
  };

  const pieChartData = {
    labels: despesasPorCategoria.map((d) => d.label),
    datasets: [
      {
        data: despesasPorCategoria.map((d) => d.total),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
          '#06B6D4',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const exportToCSV = () => {
    setIsLoading(true);
    try {
      const combinedTransactions = [
        ...filteredVendas.map((v) => ({
          Tipo: 'Receita',
          Data: v.date,
          Descrição: `Venda de ${PRODUTO_LABELS[v.produto] || v.produto}`,
          Valor: v.valorTotal,
          Lote: animais.find((a) => a.id === v.lote)?.tag || v.lote,
          FormaPagamento: v.formaPagamento,
        })),
        ...filteredCompras.map((c) => ({
          Tipo: 'Despesa',
          Data: c.purchaseDate,
          Descrição: `Compra de ${c.itemName}`,
          Valor: -c.totalPrice,
          Categoria: CATEGORY_LABELS[c.category] || c.category,
          Lote: c.linkedAnimalId ? (animais.find((a) => a.id === c.linkedAnimalId)?.tag || c.linkedAnimalId) : '',
        })),
      ].sort((a, b) => b.Data.localeCompare(a.Data));

      const sanitizedRows = combinedTransactions.map((transaction) =>
        Object.fromEntries(
          Object.entries(transaction).map(([key, value]) => [
            key,
            typeof value === 'string' ? sanitizeSpreadsheetCell(value) : value,
          ]),
        ),
      );

      const csv = Papa.unparse(sanitizedRows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    setIsLoading(true);
    try {
      const combinedTransactions = [
        ...filteredVendas.map((v) => ({
          Tipo: 'Receita',
          Data: v.date,
          Descrição: `Venda de ${PRODUTO_LABELS[v.produto] || v.produto}`,
          Valor: v.valorTotal,
          Lote: animais.find((a) => a.id === v.lote)?.tag || v.lote,
          FormaPagamento: v.formaPagamento,
        })),
        ...filteredCompras.map((c) => ({
          Tipo: 'Despesa',
          Data: c.purchaseDate,
          Descrição: `Compra de ${c.itemName}`,
          Valor: -c.totalPrice,
          Categoria: CATEGORY_LABELS[c.category] || c.category,
          Lote: c.linkedAnimalId ? (animais.find((a) => a.id === c.linkedAnimalId)?.tag || c.linkedAnimalId) : '',
        })),
      ].sort((a, b) => b.Data.localeCompare(a.Data));

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Transações');
      sheet.addRow(Object.keys(combinedTransactions[0] ?? {}));
      for (const transaction of combinedTransactions) {
        sheet.addRow(transaction);
      }
      sheet.columns.forEach((column) => {
        column.width = Math.max(12, (column.values?.[0]?.toString?.().length ?? 0) + 2);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    setIsLoading(true);
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Relatório Financeiro', 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Período: ${dateFrom || 'Início'} até ${dateTo || 'Atual'}`, 14, 32);
      
      const tableData = [
        ['Indicador', 'Valor'],
        ['Total Receitas', currencyFormatter.format(totalReceitas)],
        ['Total Despesas', currencyFormatter.format(totalDespesas)],
        ['Lucro Líquido', currencyFormatter.format(lucroLiquido)],
      ];
      
      autoTable(doc, {
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: 40,
      });
      
      const transactionsData = [
        ...filteredVendas.map((v) => [
          dateFormatter.format(new Date(v.date)),
          'Receita',
          `Venda de ${PRODUTO_LABELS[v.produto] || v.produto}`,
          currencyFormatter.format(v.valorTotal),
        ]),
        ...filteredCompras.map((c) => [
          dateFormatter.format(new Date(c.purchaseDate)),
          'Despesa',
          `Compra de ${c.itemName}`,
          currencyFormatter.format(-c.totalPrice),
        ]),
      ].sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
      
      doc.setFontSize(14);
      doc.text('Transações', 14, (doc as any).lastAutoTable.finalY + 20);
      
      autoTable(doc, {
        head: [['Data', 'Tipo', 'Descrição', 'Valor']],
        body: transactionsData,
        startY: (doc as any).lastAutoTable.finalY + 30,
      });
      
      doc.save(`relatorio-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => {
    const uniqueCats = new Set(compras.map((c) => c.category));
    return Array.from(uniqueCats);
  }, [compras]);

  return (
    <div className="app-section space-y-6">
      {/* Export buttons */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={exportToCSV}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full bg-white border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          CSV
        </button>
        <button
          onClick={exportToExcel}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full bg-white border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Excel
        </button>
        <button
          onClick={exportToPDF}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          PDF
        </button>
      </div>

      <section className="app-section-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-extrabold text-[#0f1c2b]">Filtros</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data Inicial</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data Final</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Categoria</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lote</span>
            <select
              value={selectedLote}
              onChange={(e) => setSelectedLote(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">Todos</option>
              {animais.map((animal) => (
                <option key={animal.id} value={animal.id}>{animal.tag} - {animal.species}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="app-section-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Receitas Totais</div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-green-600">
            {currencyFormatter.format(totalReceitas)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{filteredVendas.length} transações</div>
        </div>

        <div className="app-section-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-100">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Despesas Totais</div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-600">
            {currencyFormatter.format(totalDespesas)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{filteredCompras.length} transações</div>
        </div>

        <div className="app-section-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-blue-100">
              <div className="w-6 h-6 flex items-center justify-center text-blue-600 font-bold">$</div>
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Lucro Líquido</div>
          </div>
          <div className={`mt-2 text-2xl font-extrabold ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currencyFormatter.format(lucroLiquido)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="app-section-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Receitas vs Despesas (Mensal)</h2>
          </div>
          <div className="h-80">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="app-section-card">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Despesas por Categoria</h2>
          </div>
          <div className="h-80">
            <Pie
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                },
              }}
            />
          </div>
        </section>
      </div>

      <section className="app-section-card">
        <h2 className="text-lg font-extrabold text-[#0f1c2b] mb-4">Transações Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Data</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Descrição</th>
                <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Valor</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...filteredVendas.map((v) => ({
                  id: v.id,
                  date: v.date,
                  type: 'receita',
                  description: `Venda de ${PRODUTO_LABELS[v.produto] || v.produto}`,
                  amount: v.valorTotal,
                })),
                ...filteredCompras.map((c) => ({
                  id: c.id,
                  date: c.purchaseDate,
                  type: 'despesa',
                  description: `Compra de ${c.itemName}`,
                  amount: -c.totalPrice,
                })),
              ]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 50)
                .map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-700">{dateFormatter.format(new Date(t.date))}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                          t.type === 'receita'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {t.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{t.description}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        t.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {currencyFormatter.format(t.amount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
