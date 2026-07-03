import React, { useEffect, useMemo, useState } from 'react';
import { Palette, Type, SquareRoundCorner, Moon, Sun, Eye, Check, Paintbrush } from 'lucide-react';
import {
  SystemSettingsData,
  THEME_PALETTES,
  ThemePaletteId,
  FONT_OPTIONS,
  ThemeFontFamily,
  RADIUS_OPTIONS,
  ThemeBorderRadius,
} from '@/types';
import { resolveThemePalette } from '@/lib/theme';
import { useToast } from '@/components/ui/ToastProvider';

interface PersonalizacaoPageProps {
  settings: SystemSettingsData;
  isDarkMode: boolean;
  isSyncing?: boolean;
  errorMessage?: string;
  onSave: (data: SystemSettingsData) => Promise<void> | void;
  onToggleDarkMode: () => void;
  onPreviewPaletteChange: (paletteId: SystemSettingsData['selectedPalette'], customColor?: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper for visual consistency
// ─────────────────────────────────────────────────────────────────────────────
function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="app-section-card space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-brand-bg text-brand-primary flex-shrink-0" style={{ borderRadius: 'var(--app-radius, 1rem)' }}>
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-[#0f1c2b]">{title}</h2>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function PersonalizacaoPage({
  settings,
  isDarkMode,
  isSyncing,
  errorMessage,
  onSave,
  onToggleDarkMode,
  onPreviewPaletteChange,
}: PersonalizacaoPageProps) {
  const toast = useToast();
  const [draft, setDraft] = useState<SystemSettingsData>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Live preview: apply font & radius instantly
  useEffect(() => {
    const fontOption = FONT_OPTIONS.find((f) => f.id === draft.fontFamily);
    if (fontOption) {
      document.documentElement.style.setProperty('--app-font', fontOption.css);
      document.body.style.fontFamily = fontOption.css;
    }
    const radiusOption = RADIUS_OPTIONS.find((r) => r.id === draft.borderRadius);
    if (radiusOption) {
      document.documentElement.style.setProperty('--app-radius', radiusOption.value);
    }
  }, [draft.fontFamily, draft.borderRadius]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(draft);
    toast.success('Personalização salva', 'As alterações visuais foram aplicadas à sua conta.');
  };

  const activePalette = resolveThemePalette(draft.selectedPalette, draft.customPaletteColor);

  return (
    <div className="app-section space-y-6">
      {/* Header */}
      <section className="app-section-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="app-section-badge">Configurações</div>
            <h1 className="app-section-title">Personalização</h1>
            <p className="app-section-description">
              Personalize a identidade visual do seu aplicativo. Escolha cores, tipografia e estilo de bordas que combinem com sua granja.
            </p>
          </div>
        </div>

        {/* Preview badges */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4" style={{ borderRadius: 'var(--app-radius, 1rem)' }}>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Tema</div>
            <div className="mt-2 text-xl font-extrabold text-[#0f1c2b]">{isDarkMode ? 'Escuro' : 'Claro'}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4" style={{ borderRadius: 'var(--app-radius, 1rem)' }}>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Paleta</div>
            <div className="mt-2 text-xl font-extrabold text-[#0f1c2b]">{activePalette.name}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4" style={{ borderRadius: 'var(--app-radius, 1rem)' }}>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Tipografia</div>
            <div className="mt-2 text-xl font-extrabold text-[#0f1c2b]">
              {FONT_OPTIONS.find((f) => f.id === draft.fontFamily)?.name || 'Inter'}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4" style={{ borderRadius: 'var(--app-radius, 1rem)' }}>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Bordas</div>
            <div className="mt-2 text-xl font-extrabold text-[#0f1c2b]">
              {RADIUS_OPTIONS.find((r) => r.id === draft.borderRadius)?.name || 'Arredondado'}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" style={{ borderRadius: 'var(--app-radius, 1rem)' }}>
            {errorMessage}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── 1) Modo Claro / Escuro ──────────────────────────────────────── */}
        <SettingsSection
          icon={isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          title="Modo de exibição"
          description="Alterne entre o modo claro e o modo escuro para melhor conforto visual durante o uso."
        >
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { if (isDarkMode) onToggleDarkMode(); }}
              className={[
                'relative group flex flex-col items-center gap-3 p-6 border-2 transition-all duration-200 cursor-pointer',
                !isDarkMode
                  ? 'border-brand-primary bg-brand-bg shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white',
              ].join(' ')}
              style={{ borderRadius: 'var(--app-radius, 1rem)' }}
            >
              {!isDarkMode && (
                <div className="absolute top-3 right-3">
                  <Check className="w-4 h-4 text-brand-primary" />
                </div>
              )}
              <div className="w-full h-20 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-gray-100 flex items-center justify-center">
                <Sun className="w-8 h-8 text-amber-500" />
              </div>
              <span className="text-sm font-bold text-[#0f1c2b]">Modo Claro</span>
            </button>

            <button
              type="button"
              onClick={() => { if (!isDarkMode) onToggleDarkMode(); }}
              className={[
                'relative group flex flex-col items-center gap-3 p-6 border-2 transition-all duration-200 cursor-pointer',
                isDarkMode
                  ? 'border-brand-primary bg-brand-bg shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white',
              ].join(' ')}
              style={{ borderRadius: 'var(--app-radius, 1rem)' }}
            >
              {isDarkMode && (
                <div className="absolute top-3 right-3">
                  <Check className="w-4 h-4 text-brand-primary" />
                </div>
              )}
              <div className="w-full h-20 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
                <Moon className="w-8 h-8 text-blue-400" />
              </div>
              <span className="text-sm font-bold text-[#0f1c2b]">Modo Escuro</span>
            </button>
          </div>
        </SettingsSection>

        {/* ─── 2) Paleta de Cores ──────────────────────────────────────────── */}
        <SettingsSection
          icon={<Palette className="w-5 h-5" />}
          title="Paleta de cores"
          description="Escolha a identidade cromática do sistema. Selecione entre paletas curadas ou defina sua própria cor de marca."
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.values(THEME_PALETTES).map((palette) => {
              const isActive = draft.selectedPalette === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => {
                    setDraft((prev) => ({ ...prev, selectedPalette: palette.id }));
                    onPreviewPaletteChange(palette.id, draft.customPaletteColor);
                  }}
                  className={[
                    'relative group flex flex-col items-center gap-3 p-4 border-2 transition-all duration-200 cursor-pointer',
                    isActive
                      ? 'border-brand-primary bg-brand-bg shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white',
                  ].join(' ')}
                  style={{ borderRadius: 'var(--app-radius, 1rem)' }}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-brand-primary" />
                    </div>
                  )}
                  {/* Color circles */}
                  <div className="flex -space-x-2">
                    {palette.colors.map((color, idx) => (
                      <div
                        key={idx}
                        style={{ backgroundColor: color }}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#0f1c2b] text-center leading-tight">
                    {palette.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom color picker */}
          {draft.selectedPalette === 'custom' && (
            <div className="mt-4 p-5 bg-slate-50 border border-gray-200 space-y-3" style={{ borderRadius: 'var(--app-radius, 1rem)' }}>
              <div className="flex items-center gap-3">
                <Paintbrush className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span className="text-sm font-bold text-[#0f1c2b]">Cor personalizada da marca</span>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={draft.customPaletteColor || '#6366f1'}
                  onChange={(e) => {
                    const color = e.target.value;
                    setDraft((prev) => ({ ...prev, customPaletteColor: color }));
                    onPreviewPaletteChange('custom', color);
                  }}
                  className="w-14 h-14 cursor-pointer p-1 border border-gray-300"
                  style={{ borderRadius: 'var(--app-radius, 1rem)' }}
                />
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={draft.customPaletteColor || '#6366f1'}
                    onChange={(e) => {
                      const color = e.target.value;
                      setDraft((prev) => ({ ...prev, customPaletteColor: color }));
                      if (/^#[0-9a-fA-F]{6}$/.test(color)) {
                        onPreviewPaletteChange('custom', color);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 bg-white text-sm font-mono text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    style={{ borderRadius: 'var(--app-radius, 1rem)' }}
                    placeholder="#HEX"
                  />
                  <p className="text-xs text-gray-400">Insira um código HEX válido ou use o seletor de cor.</p>
                </div>
              </div>
            </div>
          )}
        </SettingsSection>

        {/* ─── 3) Tipografia ───────────────────────────────────────────────── */}
        <SettingsSection
          icon={<Type className="w-5 h-5" />}
          title="Tipografia"
          description="Escolha a fonte principal usada em todos os textos do sistema. A alteração é aplicada instantaneamente."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FONT_OPTIONS.map((font) => {
              const isActive = draft.fontFamily === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, fontFamily: font.id }))}
                  className={[
                    'relative group flex flex-col items-start gap-2 p-5 border-2 transition-all duration-200 cursor-pointer text-left',
                    isActive
                      ? 'border-brand-primary bg-brand-bg shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white',
                  ].join(' ')}
                  style={{ borderRadius: 'var(--app-radius, 1rem)' }}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-4 h-4 text-brand-primary" />
                    </div>
                  )}
                  <span
                    className="text-2xl font-extrabold text-[#0f1c2b] leading-tight"
                    style={{ fontFamily: font.css }}
                  >
                    Aa
                  </span>
                  <span className="text-sm font-bold text-[#0f1c2b]">{font.name}</span>
                  <span
                    className="text-xs text-gray-500 leading-relaxed"
                    style={{ fontFamily: font.css }}
                  >
                    Granja de Bolso 2026
                  </span>
                </button>
              );
            })}
          </div>
        </SettingsSection>

        {/* ─── 4) Arredondamento de Bordas ─────────────────────────────────── */}
        <SettingsSection
          icon={<Eye className="w-5 h-5" />}
          title="Estilo de bordas"
          description="Defina o nível de arredondamento dos cartões, botões e campos do sistema."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {RADIUS_OPTIONS.map((radius) => {
              const isActive = draft.borderRadius === radius.id;
              return (
                <button
                  key={radius.id}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, borderRadius: radius.id }))}
                  className={[
                    'relative group flex flex-col items-center gap-3 p-5 border-2 transition-all duration-200 cursor-pointer',
                    isActive
                      ? 'border-brand-primary bg-brand-bg shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white',
                  ].join(' ')}
                  style={{ borderRadius: radius.value }}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-brand-primary" />
                    </div>
                  )}
                  {/* Preview shape */}
                  <div
                    className="w-16 h-12 bg-brand-primary/20 border-2 border-brand-primary/40"
                    style={{ borderRadius: radius.value }}
                  />
                  <div className="text-center">
                    <span className="block text-sm font-bold text-[#0f1c2b]">{radius.name}</span>
                    <span className="block text-xs text-gray-400 font-mono">{radius.preview}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live preview card */}
          <div className="mt-4 p-5 bg-slate-50 border border-gray-200" style={{ borderRadius: 'var(--app-radius, 1rem)' }}>
            <div className="flex items-center gap-3 mb-3">
              <Eye className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <span className="text-sm font-bold text-[#0f1c2b]">Pré-visualização</span>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                className="px-5 py-2.5 bg-brand-primary text-white font-bold text-sm transition-colors hover:bg-brand-hover"
                style={{ borderRadius: 'var(--app-radius, 1rem)' }}
              >
                Botão primário
              </button>
              <button
                type="button"
                className="px-5 py-2.5 bg-white border border-gray-300 text-[#0f1c2b] font-bold text-sm hover:bg-slate-50"
                style={{ borderRadius: 'var(--app-radius, 1rem)' }}
              >
                Botão secundário
              </button>
              <input
                type="text"
                readOnly
                value="Campo de texto"
                className="px-4 py-2.5 border border-gray-300 bg-white text-sm text-gray-500 outline-none"
                style={{ borderRadius: 'var(--app-radius, 1rem)' }}
              />
              <div
                className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold"
                style={{ borderRadius: 'var(--app-radius, 1rem)' }}
              >
                Badge de status
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* ─── Save ────────────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSyncing}
            className="px-6 py-3 bg-brand-primary text-white font-bold text-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            style={{ borderRadius: 'var(--app-radius, 1rem)' }}
          >
            {isSyncing ? 'Salvando...' : 'Salvar personalização'}
          </button>
        </div>
      </form>
    </div>
  );
}
