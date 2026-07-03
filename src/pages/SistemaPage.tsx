import React, { useEffect, useMemo, useState } from 'react';
import { SystemSettingsData, THEME_PALETTES } from '@/types';
import { resolveThemePalette } from '@/lib/theme';
import { searchCity } from '@/lib/weather';
import { useToast } from '@/components/ui/ToastProvider';

interface SistemaPageProps {
  settings: SystemSettingsData;
  isSyncing?: boolean;
  errorMessage?: string;
  onSave: (data: SystemSettingsData) => Promise<void> | void;
  onPreviewPaletteChange: (paletteId: SystemSettingsData['selectedPalette'], customColor?: string) => void;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-[#0f1c2b]">{value}</div>
    </div>
  );
}

export default function SistemaPage({
  settings,
  isSyncing,
  errorMessage,
  onSave,
  onPreviewPaletteChange,
}: SistemaPageProps) {
  const toast = useToast();
  // Initialize with default weather config if not present
  const initialSettings = useMemo(() => {
    return {
      ...settings,
      weather: settings.weather || {
        display: {
          currentTemp: true,
          feelsLike: true,
          humidity: true,
          windSpeed: true,
          condition: true,
          dailyForecast: true,
          uvIndex: true,
          precipitation: true,
          pressure: true,
          visibility: true,
        },
        recentLocations: [],
      },
    };
  }, [settings]);
  const [draft, setDraft] = useState<SystemSettingsData>(initialSettings);
  const [defaultCitySearch, setDefaultCitySearch] = useState('');
  const [defaultCityError, setDefaultCityError] = useState('');
  const [isValidatingCity, setIsValidatingCity] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const summary = useMemo(
    () => [
      { label: 'Paleta ativa', value: resolveThemePalette(draft.selectedPalette, draft.customPaletteColor).name },
      { label: 'Ovos', value: currencyFormatter.format(draft.eggSalePrice) },
      { label: 'Aves', value: currencyFormatter.format(draft.birdSalePrice) },
      { label: 'Cama aviária', value: currencyFormatter.format(draft.litterSalePrice) },
    ],
    [draft],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(draft);
    toast.success('Preferências salvas', 'As configurações do sistema foram atualizadas com sucesso.');
  };

  return (
    <div className="app-section space-y-6">
      <section className="app-section-card">
        <div>
          <div className="app-section-badge">Configurações</div>
          <h1 className="app-section-title">Configurações • Sistema</h1>
          <p className="app-section-description">
            Defina preferências gerais do aplicativo, incluindo paleta visual e preços de referência para vendas.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div key={item.label}>
              <SummaryCard label={item.label} value={item.value} />
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}
      </section>

      <form className="app-section-card space-y-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-extrabold text-[#0f1c2b]">Preferências do aplicativo</h2>
          <p className="mt-1 text-sm text-gray-500">
            Esses valores ficam salvos na granja e servem como base para o uso diário do sistema.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Preço de venda do ovo</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={draft.eggSalePrice}
              onChange={(event) => setDraft((prev) => ({ ...prev, eggSalePrice: Number(event.target.value || 0) }))}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              placeholder="0,00"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Preço de venda das aves</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={draft.birdSalePrice}
              onChange={(event) => setDraft((prev) => ({ ...prev, birdSalePrice: Number(event.target.value || 0) }))}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              placeholder="0,00"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Preço da cama aviária</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={draft.litterSalePrice}
              onChange={(event) => setDraft((prev) => ({ ...prev, litterSalePrice: Number(event.target.value || 0) }))}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              placeholder="0,00"
            />
          </label>

          <div className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Fallback seguro do clima</span>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-blue-800">
                O fallback do OpenWeather agora fica protegido no servidor.
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Configure a variavel <code>OPENWEATHER_API_KEY</code> no ambiente do servidor para habilitar a contingencia sem expor a chave no navegador.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              O Open-Meteo continua como fonte principal. Se desejar fallback, gere sua chave em <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">openweathermap.org</a> e salve-a apenas no servidor.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-extrabold text-[#0f1c2b]">Clima</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure as preferências para a seção de clima.
          </p>

          <div className="mt-4 space-y-6">
            {/* Cidade Padrão */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Cidade padrão</h3>
              {draft.weather.defaultCity ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{draft.weather.defaultCity.name}</p>
                    <p className="text-xs text-gray-500">Substitui a localização automática</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(prev => ({
                        ...prev,
                        weather: {
                          ...prev.weather,
                          defaultCity: undefined,
                        },
                      }));
                      setDefaultCitySearch('');
                    }}
                    className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Digite o nome da cidade"
                        value={defaultCitySearch}
                        onChange={(e) => {
                          setDefaultCitySearch(e.target.value);
                          setDefaultCityError('');
                        }}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isValidatingCity || !defaultCitySearch}
                      onClick={async () => {
                        setIsValidatingCity(true);
                        setDefaultCityError('');
                        const result = await searchCity(defaultCitySearch);
                        if (result) {
                          setDraft(prev => ({
                            ...prev,
                            weather: {
                              ...prev.weather,
                              defaultCity: result,
                            },
                          }));
                          toast.success('Cidade padrão definida', `${result.name} será usada como referência climática.`);
                        } else {
                          setDefaultCityError('Cidade não encontrada. Verifique o nome e tente novamente.');
                          toast.warning('Cidade não encontrada', 'Verifique o nome informado e tente novamente.');
                        }
                        setIsValidatingCity(false);
                      }}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl disabled:opacity-50 disabled:hover:shadow-lg"
                    >
                      {isValidatingCity ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  {defaultCityError && (
                    <p className="text-xs text-red-600">{defaultCityError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Informações a Exibir */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Informações a exibir</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'currentTemp', label: 'Temperatura atual' },
                  { key: 'feelsLike', label: 'Sensação térmica' },
                  { key: 'humidity', label: 'Umidade relativa' },
                  { key: 'windSpeed', label: 'Velocidade do vento' },
                  { key: 'condition', label: 'Condição climática' },
                  { key: 'dailyForecast', label: 'Previsão dos próximos dias' },
                  { key: 'uvIndex', label: 'Índice UV' },
                  { key: 'precipitation', label: 'Precipitação' },
                  { key: 'pressure', label: 'Pressão atmosférica' },
                  { key: 'visibility', label: 'Visibilidade' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={draft.weather.display[item.key as keyof typeof draft.weather.display]}
                      onChange={(e) =>
                        setDraft(prev => ({
                          ...prev,
                          weather: {
                            ...prev.weather,
                            display: {
                              ...prev.weather.display,
                              [item.key]: e.target.checked,
                            },
                          },
                        }))
                      }
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSyncing}
            className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSyncing ? 'Salvando...' : 'Salvar preferências'}
          </button>
        </div>
      </form>
    </div>
  );
}
