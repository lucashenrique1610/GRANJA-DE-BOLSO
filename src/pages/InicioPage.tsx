import React, { useMemo, useState, useEffect } from 'react';
import {
  AnimalRecord,
  VendaRecord,
  PurchaseRecord,
  ManejoRecord,
  MortalityRecord,
  SystemSettingsData,
  FarmConfigData,
  UnifiedWeatherData,
} from '@/types';
import { getWeatherData, searchCity } from '@/lib/weather';
import { RouteId } from '@/components/Sidebar';
import {
  TrendingUp,
  TrendingDown,
  Bird,
  DollarSign,
  ShoppingBag,
  ClipboardList,
  Wallet,
  Activity,
  ArrowRight,
  CloudSun,
  Thermometer,
  Sun,
  Moon,
  Sunset,
  CheckCircle2,
  AlertCircle,
  Clock,
  PieChart,
  History,
  Scale
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InicioPageProps {
  animals: AnimalRecord[];
  vendas: VendaRecord[];
  compras: PurchaseRecord[];
  manejos: ManejoRecord[];
  mortalities: MortalityRecord[];
  settings: SystemSettingsData;
  farm: FarmConfigData;
  onNavigate: (route: RouteId) => void;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

export default function InicioPage({
  animals,
  vendas,
  compras,
  manejos,
  mortalities,
  settings,
  farm,
  onNavigate,
}: InicioPageProps) {
  const today = new Date();
  
  const [weatherData, setWeatherData] = useState<UnifiedWeatherData | null>(null);
  const [performancePeriod, setPerformancePeriod] = useState<7 | 15 | 30>(7);
  const [performanceLot, setPerformanceLot] = useState<string>('all');
  
  useEffect(() => {
    async function loadWeather() {
      try {
        const cityToSearch = settings.weather?.defaultCity?.name || farm.city || 'São Paulo';
        const coords = settings.weather?.defaultCity || await searchCity(cityToSearch);
        
        if (coords) {
          const data = await getWeatherData(coords.lat, coords.lon, coords.name || cityToSearch);
          setWeatherData(data);
        }
      } catch (err) {
        void err;
      }
    }
    loadWeather();
  }, [settings.weather?.defaultCity, farm.city]);
  
  // KPIs
  const totalBirds = useMemo(() => {
    return animals.reduce((sum, a) => sum + (a.currentQuantity ?? a.quantity), 0);
  }, [animals]);

  const { revenue30d, expenses30d } = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

    const rev = vendas
      .filter((v) => v.date >= dateLimit)
      .reduce((sum, v) => sum + v.valorTotal, 0);

    const exp = compras
      .filter((c) => c.purchaseDate >= dateLimit)
      .reduce((sum, c) => sum + c.totalPrice, 0);

    return { revenue30d: rev, expenses30d: exp };
  }, [vendas, compras]);

  const mortalityRate = useMemo(() => {
    const totalMortality = mortalities.reduce((sum, m) => sum + m.deadCount, 0);
    const initialBirds = animals.reduce((sum, a) => sum + a.quantity, 0);
    return initialBirds > 0 ? (totalMortality / initialBirds) * 100 : 0;
  }, [mortalities, animals]);

  const zootechnicalMetrics = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const dateLimit7 = sevenDaysAgo.toISOString().split('T')[0];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const dateLimit30 = thirtyDaysAgo.toISOString().split('T')[0];

    const manejos7d = manejos.filter((m) => m.date >= dateLimit7);
    const totalOvos7d = manejos7d.reduce((sum, m) => sum + m.ovosColetados, 0);
    const totalRacaoKg7d = manejos7d.reduce((sum, m) => sum + m.racaoKg, 0);
    
    const postura7d = totalBirds > 0 ? (totalOvos7d / (totalBirds * 7)) * 100 : 0;
    const ca7d = totalOvos7d > 0 ? (totalRacaoKg7d * 1000) / totalOvos7d : 0;

    const manejos30d = manejos.filter((m) => m.date >= dateLimit30);
    const totalOvos30d = manejos30d.reduce((sum, m) => sum + m.ovosColetados, 0);
    const custoPorOvo = totalOvos30d > 0 ? expenses30d / totalOvos30d : 0;

    return { postura7d, ca7d, custoPorOvo };
  }, [manejos, totalBirds, expenses30d]);

  const recentActivities = useMemo(() => {
    const activities: Array<{ id: string; date: string; title: string; subtitle: string; type: 'manejo' | 'venda' | 'compra' | 'mortalidade' }> = [];

    manejos.forEach(m => activities.push({ id: `m-${m.id}`, date: m.date, title: `Manejo (${m.turno})`, subtitle: `${m.ovosColetados} ovos, ${m.racaoKg}kg ração`, type: 'manejo' }));
    vendas.forEach(v => activities.push({ id: `v-${v.id}`, date: v.date, title: 'Venda Realizada', subtitle: currencyFormatter.format(v.valorTotal), type: 'venda' }));
    compras.forEach(c => activities.push({ id: `c-${c.id}`, date: c.purchaseDate, title: 'Compra Efetuada', subtitle: `${c.itemName || 'Produto'} - ${currencyFormatter.format(c.totalPrice)}`, type: 'compra' }));
    mortalities.forEach(m => activities.push({ id: `mt-${m.id}`, date: m.date, title: 'Mortalidade Registrada', subtitle: `${m.deadCount} ave(s) - ${m.cause}`, type: 'mortalidade' }));

    return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [manejos, vendas, compras, mortalities]);

  // Performance Chart Data
  const performanceChartData = useMemo(() => {
    const labels: string[] = [];
    const dataOvos: number[] = [];
    const dataRacao: number[] = [];
    const dataMortalidade: number[] = [];

    const filteredManejos = performanceLot === 'all' ? manejos : manejos.filter(m => m.animalId === performanceLot);
    const filteredMortalities = performanceLot === 'all' ? mortalities : mortalities.filter(m => m.animalId === performanceLot);

    for (let i = performancePeriod - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayManejos = filteredManejos.filter((m) => m.date.startsWith(dateStr));
      const totalOvos = dayManejos.reduce((sum, m) => sum + m.ovosColetados, 0);
      const totalRacao = dayManejos.reduce((sum, m) => sum + m.racaoKg, 0);

      const dayMortalities = filteredMortalities.filter((m) => m.date.startsWith(dateStr));
      const totalMortality = dayMortalities.reduce((sum, m) => sum + m.deadCount, 0);
      
      labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      dataOvos.push(totalOvos);
      dataRacao.push(totalRacao);
      dataMortalidade.push(totalMortality);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Ovos (un)',
          data: dataOvos,
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(251,191,36,0.15)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
            gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.15)');
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.45,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgb(251, 191, 36)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(251, 191, 36)',
          pointHoverBorderWidth: 3,
          yAxisID: 'y',
        },
        {
          label: 'Ração (kg)',
          data: dataRacao,
          borderColor: 'rgb(99, 179, 237)',
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(99,179,237,0.1)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(99, 179, 237, 0.35)');
            gradient.addColorStop(1, 'rgba(99, 179, 237, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.45,
          borderWidth: 2.5,
          borderDash: [],
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(99, 179, 237)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Mortalidade',
          data: dataMortalidade,
          borderColor: 'rgb(252, 129, 129)',
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(252,129,129,0.08)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(252, 129, 129, 0.25)');
            gradient.addColorStop(1, 'rgba(252, 129, 129, 0.0)');
            return gradient;
          },
          fill: true,
          borderDash: [6, 4],
          tension: 0.45,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(252, 129, 129)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [manejos, mortalities, performancePeriod, performanceLot]);

  // Financial Chart Data (Last 6 months)
  const financialChartData = useMemo(() => {
    const labels: string[] = [];
    const revData: number[] = [];
    const expData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
      
      const monthRev = vendas
        .filter((v) => v.date.startsWith(monthStr))
        .reduce((sum, v) => sum + v.valorTotal, 0);
        
      const monthExp = compras
        .filter((c) => c.purchaseDate.startsWith(monthStr))
        .reduce((sum, c) => sum + c.totalPrice, 0);

      labels.push(d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase());
      revData.push(monthRev);
      expData.push(monthExp);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: revData,
          backgroundColor: 'rgba(34, 197, 94, 0.8)', // green-500
          borderRadius: 4,
        },
        {
          label: 'Despesas',
          data: expData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500
          borderRadius: 4,
        },
      ],
    };
  }, [vendas, compras]);

  const balance = revenue30d - expenses30d;

  // Contextual features
  const currentHour = today.getHours();
  let greeting = 'Bom dia';
  let TimeIcon = Sun;
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde';
    TimeIcon = Sunset;
  } else if (currentHour >= 18) {
    greeting = 'Boa noite';
    TimeIcon = Moon;
  }

  const currentShift = currentHour < 12 ? 'manha' : 'tarde';
  const shiftLabel = currentShift === 'manha' ? 'Manhã' : 'Tarde';
  
  const todayStr = today.toISOString().split('T')[0];
  const isShiftManejoDone = manejos.some(
    (m) => m.date.startsWith(todayStr) && m.turno === currentShift
  );

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-28 md:pb-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TimeIcon className="w-6 h-6 text-brand-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{greeting}!</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Bem-vindo(a) ao seu painel de controle da granja.</p>
        </div>
      </div>

      {/* Smart Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isShiftManejoDone ? (
          <div 
            onClick={() => onNavigate('manejo')}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">Manejo da {shiftLabel} Pendente</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400/80">Registre o consumo de ração e coleta de ovos agora.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/50 rounded-2xl p-4 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 dark:text-green-100">Manejo da {shiftLabel} Concluído</h3>
                <p className="text-sm text-green-700 dark:text-green-400/80">Excelente trabalho! Os dados já foram registrados.</p>
              </div>
          </div>
        )}
        
        {/* Additional Smart Alert placeholder (e.g. low stock, high mortality) */}
        {mortalityRate > 5 && (
          <div 
            onClick={() => onNavigate('animais')}
            className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
          >
             <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-100">Atenção à Mortalidade</h3>
                <p className="text-sm text-red-700 dark:text-red-400/80">Taxa de mortalidade ({mortalityRate.toFixed(1)}%) acima de 5%.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Weather Widget */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-sm flex flex-row lg:flex-col justify-between items-center lg:items-start text-white">
          <div>
            <span className="text-blue-100 text-xs font-semibold block truncate max-w-[120px] lg:max-w-none">{weatherData ? weatherData.location : 'Carregando...'}</span>
            <span className="text-2xl md:text-3xl font-bold block mt-1">
              {weatherData ? `${Math.round(weatherData.temperature)}°C` : '--°C'}
            </span>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-blue-100">
              <Thermometer className="w-3 h-3" />
              <span>{weatherData ? `${Math.round(weatherData.temperatureMin)}° / ${Math.round(weatherData.temperatureMax)}°` : '-- / --'}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <CloudSun className="w-6 h-6" />
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="kpi-label">Aves</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Bird className="w-4 h-4" />
            </div>
          </div>
          <span className="kpi-value">{numberFormatter.format(totalBirds)}</span>
          <span className="kpi-sub">Mort.: {mortalityRate.toFixed(1)}%</span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="kpi-label">Receitas 30d</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="kpi-value text-green-600">{currencyFormatter.format(revenue30d)}</span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="kpi-label">Despesas 30d</span>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <span className="kpi-value text-red-600">{currencyFormatter.format(expenses30d)}</span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="kpi-label">Saldo 30d</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${balance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className={`kpi-value ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currencyFormatter.format(balance)}</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Gráfico de Desempenho 3D */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Header escuro com gradiente */}
          <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-4 py-4 md:px-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Desempenho</h2>
                  <p className="text-xs text-slate-400">Ovos · Ração · Mortalidade</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={performanceLot}
                  onChange={(e) => setPerformanceLot(e.target.value)}
                  className="px-2 py-1.5 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                >
                  <option value="all">Todos os Lotes</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.tag} ({a.lot})</option>)}
                </select>
                <select
                  value={performancePeriod}
                  onChange={(e) => setPerformancePeriod(Number(e.target.value) as any)}
                  className="px-2 py-1.5 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                >
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                </select>
              </div>
            </div>
            {/* Mini legenda colorida */}
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span className="w-3 h-1.5 rounded-full bg-amber-400 inline-block" />Ovos
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span className="w-3 h-1.5 rounded-full bg-sky-400 inline-block" />Ração
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span className="w-4 h-px border-t-2 border-dashed border-red-400 inline-block" />Mort.
              </span>
            </div>
          </div>
          {/* Área do gráfico */}
          <div className="bg-slate-900/95 p-4 flex-1">
            <div className="h-52 md:h-64">
              <Line
                data={performanceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(2, 8, 23, 0.95)',
                      titleColor: '#f1f5f9',
                      bodyColor: '#cbd5e1',
                      borderColor: 'rgba(148,163,184,0.15)',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 12,
                      displayColors: true,
                      boxWidth: 8,
                      boxHeight: 8,
                      callbacks: {
                        title: (items) => `📅 ${items[0]?.label}`,
                      }
                    },
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      beginAtZero: true,
                      grid: { color: 'rgba(148, 163, 184, 0.08)' },
                      ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 5 },
                      border: { display: false },
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      beginAtZero: true,
                      grid: { drawOnChartArea: false },
                      ticks: { color: '#ef4444', font: { size: 10 }, precision: 0, maxTicksLimit: 4 },
                      border: { display: false },
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0 },
                      border: { display: false },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Financeiro (Últimos 6 meses)</h2>
          </div>
          <div className="h-52 md:h-64">
            <Bar
              data={financialChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    callbacks: {
                      label: (ctx) => ` ${ctx.dataset.label}: ${currencyFormatter.format(ctx.raw as number)}`,
                    },
                  },
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zootechnical Metrics & Shortcuts */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-primary" />
            Indicadores Zootécnicos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Taxa de Postura (7d)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{zootechnicalMetrics.postura7d.toFixed(1)}%</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Conversão Alimentar (7d)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{zootechnicalMetrics.ca7d.toFixed(0)}</span>
                <span className="text-sm text-slate-500">g/ovo</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Custo Estimado (30d)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currencyFormatter.format(zootechnicalMetrics.custoPorOvo)}</span>
                <span className="text-sm text-slate-500">/ovo</span>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button
              onClick={() => onNavigate('manejo')}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 active:scale-95 border border-slate-100 transition-all group min-h-[88px]"
            >
              <div className="w-11 h-11 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Manejo</span>
            </button>

            <button
              onClick={() => onNavigate('vendas')}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 active:scale-95 border border-slate-100 transition-all group min-h-[88px]"
            >
              <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Vendas</span>
            </button>

            <button
              onClick={() => onNavigate('compras')}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 active:scale-95 border border-slate-100 transition-all group min-h-[88px]"
            >
              <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Compras</span>
            </button>

            <button
              onClick={() => onNavigate('animais')}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 active:scale-95 border border-slate-100 transition-all group min-h-[88px]"
            >
              <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Bird className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Lotes</span>
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-primary" />
            Atividades Recentes
          </h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${act.type === 'venda' ? 'bg-green-500' : act.type === 'compra' ? 'bg-red-500' : act.type === 'mortalidade' ? 'bg-orange-500' : 'bg-brand-primary'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{act.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{act.subtitle}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(act.date).toLocaleDateString('pt-BR')} {act.date.includes('T') && new Date(act.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma atividade recente encontrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

