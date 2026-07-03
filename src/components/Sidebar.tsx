import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Home,
  ClipboardList,
  ShoppingBag,
  Beaker,
  Bird,
  Users,
  Truck,
  ShoppingCart,
  Wallet,
  FileText,
  CloudSun,
  BookOpen,
  HeartPulse,
  Cog,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
  SlidersHorizontal,
  DatabaseBackup,
  Palette,
  Calculator,
  MessageCircle,
  Mail,
  ShieldCheck,
} from 'lucide-react';

export type RouteId =
  | 'admin'
  | 'inicio'
  | 'manejo'
  | 'vendas'
  | 'formulacao'
  | 'animais'
  | 'cliente'
  | 'fornecedor'
  | 'galpoes'
  | 'profissionais'
  | 'compras'
  | 'financeiro'
  | 'relatorios'
  | 'investimentos'
  | 'clima'
  | 'conhecimento'
  | 'perfil'
  | 'sistema'
  | 'personalizacao'
  | 'backups'
  | 'assinatura';

interface SidebarProps {
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  allowedRoutes?: RouteId[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  isDarkMode: boolean;
  isMobileOpen: boolean;
  onRequestOpenMobile: () => void;
  onRequestCloseMobile: () => void;
}

type MenuItem = {
  id: RouteId;
  label: string;
  icon: React.ReactNode;
};

type MenuCategory =
  | { kind: 'single'; item: MenuItem }
  | { kind: 'group'; id: string; label: string; icon: React.ReactNode; items: MenuItem[] };

const ACCORDION_DURATION_MS = 400;
const ACCORDION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

const cloneMenuIcon = (icon: React.ReactNode, className: string) => {
  if (!React.isValidElement(icon)) {
    return icon;
  }

  return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
    className,
  });
};

// ---------------------------------------------------------------------------
// SidebarGroupItem — proper React component so useState hooks are always valid
// ---------------------------------------------------------------------------
interface SidebarGroupItemProps {
  key?: React.Key;
  cat: Extract<MenuCategory, { kind: 'group' }>;
  groupId: string;
  isCollapsed: boolean;
  isDarkMode: boolean;
  activeRoute: RouteId;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onNavigate: (route: RouteId) => void;
}

const SidebarGroupItem = React.memo(function SidebarGroupItem({
  cat,
  groupId,
  isCollapsed,
  isDarkMode,
  activeRoute,
  isOpen,
  onToggle,
  onNavigate,
}: SidebarGroupItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const hasActiveChild = cat.items.some((item) => item.id === activeRoute);

  useEffect(() => {
    const contentElement = contentRef.current;

    if (!contentElement) {
      return;
    }

    const syncContentHeight = () => {
      setContentHeight(contentElement.scrollHeight);
    };

    syncContentHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncContentHeight);
      return () => window.removeEventListener('resize', syncContentHeight);
    }

    const resizeObserver = new ResizeObserver(syncContentHeight);
    resizeObserver.observe(contentElement);

    return () => resizeObserver.disconnect();
  }, [cat.items.length, isCollapsed]);

  return (
    <div
      className="relative space-y-1.5"
      style={{ zIndex: isHovered && isCollapsed ? 9999 : undefined }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Group header button */}
      <button
        type="button"
        onClick={() => { if (!isCollapsed) onToggle(groupId); }}
        className={[
          'w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold leading-5 tracking-[0.01em] transition-[background-color,color,box-shadow,transform] duration-200',
          hasActiveChild
            ? isDarkMode
              ? 'text-slate-100 bg-slate-800/70 shadow-md'
              : 'text-slate-800 bg-brand-bg shadow-sm'
            : isDarkMode
            ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
          isCollapsed ? 'justify-center px-3' : '',
        ].join(' ')}
        aria-expanded={!isCollapsed ? isOpen : undefined}
        aria-label={`${cat.label} (${cat.items.length} sub-itens)`}
        title={isCollapsed ? cat.label : undefined}
      >
        <span
          className="flex-shrink-0"
          style={hasActiveChild ? { color: 'var(--brand-primary)' } : undefined}
        >
          {cloneMenuIcon(cat.icon, isCollapsed ? 'h-5.5 w-5.5' : 'h-[1.125rem] w-[1.125rem]')}
        </span>

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{cat.label}</span>
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              } ${isOpen ? 'rotate-180' : ''}`}
              style={{ transitionTimingFunction: ACCORDION_EASING }}
            />
          </>
        )}
      </button>

      {/* Collapsed → hover popover */}
      {isCollapsed && isHovered && (
        <div
          className="absolute left-[100%] top-0 z-[9999] min-w-[13rem] pt-0 pb-0 pl-2 pr-0"
          role="menu"
        >
          <div
            className={[
              'rounded-xl p-2 shadow-2xl border',
              isDarkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200',
            ].join(' ')}
          >
          <div
            className={`px-3 py-2 mb-1 border-b text-xs font-bold uppercase tracking-wider ${
              isDarkMode
                ? 'border-slate-700 text-slate-400'
                : 'border-slate-100 text-slate-500'
            }`}
          >
            {cat.label}
          </div>
          <div className="space-y-0.5" role="none">
            {cat.items.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={[
                    'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium leading-5 tracking-[0.01em] transition-[background-color,color,box-shadow] duration-150',
                    isActive
                      ? isDarkMode
                        ? 'bg-slate-700/80 shadow-sm'
                        : 'bg-brand-bg shadow-sm'
                      : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
                  ].join(' ')}
                  style={
                    isActive
                      ? { color: 'var(--brand-primary)' }
                      : undefined
                  }
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  role="menuitem"
                >
                  <span
                    className="flex-shrink-0"
                    style={isActive ? { color: 'var(--brand-primary)' } : undefined}
                  >
                    {cloneMenuIcon(item.icon, 'h-4.5 w-4.5')}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* Expanded → animated sub-items */}
      {!isCollapsed && (
        <div
          className="overflow-hidden will-change-[max-height,opacity,transform]"
          style={{
            maxHeight: isOpen ? `${contentHeight}px` : '0px',
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
            transition: `max-height ${ACCORDION_DURATION_MS}ms ${ACCORDION_EASING}, opacity 320ms ease, transform ${ACCORDION_DURATION_MS}ms ${ACCORDION_EASING}`,
          }}
        >
          <div
            ref={contentRef}
            className={`ml-6 border-l pl-3 space-y-1 pb-1 pt-1 ${
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            }`}
          >
            {cat.items.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={[
                    'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium leading-5 tracking-[0.01em] transition-[background-color,color,box-shadow] duration-150',
                    isActive
                      ? isDarkMode
                        ? 'bg-slate-800/90 shadow-sm'
                        : 'bg-brand-bg shadow-sm'
                      : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                  ].join(' ')}
                  style={isActive ? { color: 'var(--brand-primary)' } : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                >
                  {/* Active indicator dot */}
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--brand-primary)' }}
                    />
                  )}
                  <span
                    style={isActive ? { color: 'var(--brand-primary)' } : undefined}
                    className="flex-shrink-0"
                  >
                    {cloneMenuIcon(item.icon, 'h-4.5 w-4.5')}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Sidebar component
// ---------------------------------------------------------------------------
function Sidebar({
  activeRoute,
  onNavigate,
  allowedRoutes,
  isCollapsed,
  onToggleCollapsed,
  isDarkMode,
  isMobileOpen,
  onRequestOpenMobile,
  onRequestCloseMobile,
}: SidebarProps) {
  const categories = useMemo<MenuCategory[]>(
    () => [
      {
        kind: 'single',
        item: { id: 'admin', label: 'Administração', icon: <ShieldCheck className="w-5 h-5" /> },
      },
      {
        kind: 'single',
        item: { id: 'inicio', label: 'Início', icon: <Home className="w-5 h-5" /> },
      },
      {
        kind: 'group',
        id: 'operacoes',
        label: 'Operações',
        icon: <ClipboardList className="w-5 h-5" />,
        items: [
          { id: 'manejo', label: 'Manejo', icon: <ClipboardList className="w-4 h-4" /> },
          { id: 'vendas', label: 'Vendas', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'formulacao', label: 'Formulação', icon: <Beaker className="w-4 h-4" /> },
        ],
      },
      {
        kind: 'group',
        id: 'cadastro',
        label: 'Cadastro',
        icon: <Bird className="w-5 h-5" />,
        items: [
          { id: 'animais', label: 'Animais', icon: <Bird className="w-4 h-4" /> },
          { id: 'galpoes', label: 'Galpões', icon: <Home className="w-4 h-4" /> },
          { id: 'profissionais', label: 'Profissionais', icon: <HeartPulse className="w-4 h-4" /> },
          { id: 'cliente', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
          { id: 'fornecedor', label: 'Fornecedores', icon: <Truck className="w-4 h-4" /> },
        ],
      },
      {
        kind: 'group',
        id: 'gestao',
        label: 'Gestão',
        icon: <Wallet className="w-5 h-5" />,
        items: [
          { id: 'compras', label: 'Compras', icon: <ShoppingCart className="w-4 h-4" /> },
          { id: 'financeiro', label: 'Financeiro', icon: <Wallet className="w-4 h-4" /> },
          { id: 'investimentos', label: 'Investimentos', icon: <Calculator className="w-4 h-4" /> },
          { id: 'relatorios', label: 'Relatórios', icon: <FileText className="w-4 h-4" /> },
        ],
      },
      {
        kind: 'group',
        id: 'monitoramento',
        label: 'Monitoramento',
        icon: <CloudSun className="w-5 h-5" />,
        items: [
          { id: 'clima', label: 'Clima', icon: <CloudSun className="w-4 h-4" /> },
          { id: 'conhecimento', label: 'Conhecimento', icon: <BookOpen className="w-4 h-4" /> },
        ],
      },
      {
        kind: 'group',
        id: 'configuracoes',
        label: 'Configurações',
        icon: <Cog className="w-5 h-5" />,
        items: [
          { id: 'perfil', label: 'Perfil', icon: <UserCircle2 className="w-4 h-4" /> },
          { id: 'personalizacao', label: 'Personalização', icon: <Palette className="w-4 h-4" /> },
          { id: 'sistema', label: 'Sistema', icon: <SlidersHorizontal className="w-4 h-4" /> },
          { id: 'backups', label: 'Backups', icon: <DatabaseBackup className="w-4 h-4" /> },
          { id: 'assinatura', label: 'Assinatura', icon: <Cog className="w-4 h-4" /> },
        ],
      },
    ],
    []
  );

  const visibleCategories = useMemo(() => {
    if (!allowedRoutes?.length) {
      return categories.filter(
        (category) => category.kind !== 'single' || category.item.id !== 'admin'
      );
    }

    const allowedRouteSet = new Set<RouteId>(allowedRoutes);

    return categories.flatMap((category) => {
      if (category.kind === 'single') {
        return allowedRouteSet.has(category.item.id) ? [category] : [];
      }

      const visibleItems = category.items.filter((item) => allowedRouteSet.has(item.id));

      if (visibleItems.length === 0) {
        return [];
      }

      return [
        {
          ...category,
          items: visibleItems,
        },
      ];
    });
  }, [allowedRoutes, categories]);

  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const isNavigatingRef = useRef(false);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);

  // Auto-open the group containing the active route
  useEffect(() => {
    const activeGroup = visibleCategories.find(
      (cat) => cat.kind === 'group' && cat.items.some((item) => item.id === activeRoute)
    );
    if (activeGroup?.kind === 'group') {
      setOpenGroupId(activeGroup.id);
    }
  }, [activeRoute, visibleCategories]);

  // Keyboard: close mobile sidebar with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMobileOpen && e.key === 'Escape') onRequestCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onRequestCloseMobile]);

  // Focus trap for mobile sidebar
  useEffect(() => {
    if (isMobileOpen && mobileSidebarRef.current) {
      const first = mobileSidebarRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }
  }, [isMobileOpen]);

  const handleNavigate = useCallback((route: RouteId) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onNavigate(route);
    if (isMobileOpen) {
      onRequestCloseMobile();
    }
    setTimeout(() => { isNavigatingRef.current = false; }, 300);
  }, [isMobileOpen, onNavigate, onRequestCloseMobile]);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroupId((prev) => (prev === id ? null : id));
  }, []);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const renderSingleItem = (item: MenuItem, isCompact: boolean) => {
    const isActive = activeRoute === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNavigate(item.id)}
        className={[
          'w-full relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold leading-5 tracking-[0.01em] transition-[background-color,color,box-shadow,transform] duration-200',
          isActive
            ? isDarkMode
              ? 'bg-slate-800/80 shadow-md'
              : 'bg-brand-bg shadow-md'
            : isDarkMode
            ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
          isCompact ? 'justify-center px-3' : '',
        ].join(' ')}
        style={isActive ? { color: 'var(--brand-primary)' } : undefined}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        title={isCompact ? item.label : undefined}
      >
        {isActive && !isCompact && (
          <span
            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
            style={{ background: 'var(--brand-primary)' }}
          />
        )}
        <span
          className="flex-shrink-0"
          style={isActive ? { color: 'var(--brand-primary)' } : undefined}
        >
          {cloneMenuIcon(item.icon, isCompact ? 'h-5.5 w-5.5' : 'h-[1.125rem] w-[1.125rem]')}
        </span>
        {!isCompact && (
          <>
            <span className="truncate flex-1">{item.label}</span>
            <ChevronRight
              className="h-4 w-4 flex-shrink-0"
              style={isActive ? { color: 'var(--brand-primary)' } : { color: '#94a3b8' }}
            />
          </>
        )}
      </button>
    );
  };

  const renderSidebarContent = ({ forceExpanded = false }: { forceExpanded?: boolean } = {}) => {
    const isCompact = isCollapsed && !forceExpanded;

    return (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center border-b flex-shrink-0 ${
          isDarkMode ? 'border-slate-700/60' : 'border-slate-200'
        } ${isCompact ? 'justify-center px-3 py-4' : 'justify-between px-4 py-4'}`}
      >
        {isCompact ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-brand-bg hover:bg-slate-200'
            }`}
            aria-label="Expandir menu lateral"
          >
            <ChevronRight
              className={`w-5 h-5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}
            />
          </button>
        ) : (
          <>
            <img
              src="/logo.png"
              alt="Logo Granja de Bolso"
              className="h-14 w-auto object-contain drop-shadow-sm sm:h-16"
            />
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={`hidden md:inline-flex w-9 h-9 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer shadow-sm flex-shrink-0 ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100 border border-slate-200'
              }`}
              aria-label="Recolher menu lateral"
            >
              <ChevronLeft className={`w-4 h-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`} />
            </button>
            <button
              type="button"
              onClick={onRequestCloseMobile}
              className={`md:hidden w-9 h-9 inline-flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer shadow-sm ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100'
              }`}
              aria-label="Fechar menu lateral"
            >
              <ChevronLeft className={`w-4 h-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`} />
            </button>
          </>
        )}
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin"
        role="navigation"
        aria-label="Menu principal"
      >
        {visibleCategories.map((cat, idx) => {
          if (cat.kind === 'single') {
            return <div key={`single-${idx}`}>{renderSingleItem(cat.item, isCompact)}</div>;
          }
          return (
            <SidebarGroupItem
              key={cat.id}
              cat={cat as Extract<MenuCategory, { kind: 'group' }>}
              groupId={cat.id}
              isCollapsed={isCompact}
              isDarkMode={isDarkMode}
              activeRoute={activeRoute}
              isOpen={openGroupId === cat.id}
              onToggle={toggleGroup}
              onNavigate={handleNavigate}
            />
          );
        })}
      </nav>

      {!isCompact ? (
        <div className={`mt-auto mx-4 mb-4 p-4 rounded-2xl shrink-0 ${isDarkMode ? 'bg-slate-800/80 border border-slate-700' : 'bg-brand-primary/5 border border-brand-primary/10'}`}>
          <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Precisa de Ajuda?</div>
          
          <a href="https://wa.me/5533998542100" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 mb-2.5 text-sm font-bold transition-colors ${isDarkMode ? 'text-slate-300 hover:text-[#25D366]' : 'text-slate-700 hover:text-[#25D366]'}`}>
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white shadow-sm border border-slate-100'}`}>
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
            </div>
            <span>(33) 99854-2100</span>
          </a>
          
          <a href="mailto:granjadebolso@gmail.com" className={`flex items-center gap-3 text-sm font-bold transition-colors ${isDarkMode ? 'text-slate-300 hover:text-brand-primary' : 'text-slate-700 hover:text-brand-primary'}`}>
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white shadow-sm border border-slate-100'}`}>
              <Mail className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
            </div>
            <span className="truncate" title="granjadebolso@gmail.com">E-mail Suporte</span>
          </a>
        </div>
      ) : (
        <div className="mt-auto mx-auto mb-4 shrink-0 flex flex-col gap-2">
           <a href="https://wa.me/5533998542100" target="_blank" rel="noopener noreferrer" className={`p-2 rounded-xl transition-colors flex items-center justify-center ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-brand-primary/10 text-slate-500'}`} title="Suporte WhatsApp: (33) 99854-2100">
             <MessageCircle className="w-5 h-5 text-[#25D366]" />
           </a>
        </div>
      )}
    </div>
    );
  };

  // -------------------------------------------------------------------------
  // Bottom mobile nav
  // -------------------------------------------------------------------------
  const bottomNavGroups = useMemo<Array<{ id: RouteId; label: string; icon: React.ReactNode; routes: RouteId[] }>>(
    () => {
      if (allowedRoutes?.length) {
        return allowedRoutes.map((route) => ({
          id: route,
          label:
            route === 'admin'
              ? 'Admin'
              : route === 'assinatura'
              ? 'Assinatura'
              : route === 'perfil'
              ? 'Perfil'
              : 'Menu',
          icon:
            route === 'admin'
              ? <ShieldCheck className="w-6 h-6" />
              : route === 'perfil'
              ? <UserCircle2 className="w-6 h-6" />
              : <Cog className="w-6 h-6" />,
          routes: [route],
        }));
      }

      return [
        { id: 'inicio', label: 'Início', icon: <Home className="w-6 h-6" />, routes: ['inicio'] },
        { id: 'manejo', label: 'Manejo', icon: <ClipboardList className="w-6 h-6" />, routes: ['manejo', 'formulacao'] },
        { id: 'vendas', label: 'Vendas', icon: <ShoppingBag className="w-6 h-6" />, routes: ['vendas'] },
      ];
    },
    [allowedRoutes],
  );

  const isMoreActive = !bottomNavGroups.some((grp) => grp.routes.includes(activeRoute));

  // -------------------------------------------------------------------------
  // Classes
  // -------------------------------------------------------------------------
  const widthClass = isCollapsed ? 'w-[4.5rem]' : 'w-64';
  const desktopClass = `hidden md:flex ${widthClass} flex-col z-40 overflow-visible transition-all duration-300 ${
    isDarkMode
      ? 'bg-slate-900 border-slate-700/60'
      : 'bg-white border-slate-200'
  } border-r shadow-xl`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={desktopClass} aria-label="Menu lateral principal">
        {renderSidebarContent()}
      </aside>

      {/* Mobile overlay + sidebar */}
      <div
        className={`md:hidden fixed inset-0 z-40 ${isMobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!isMobileOpen}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onRequestCloseMobile}
          aria-hidden="true"
        />
        <aside
          ref={mobileSidebarRef}
          className={`absolute left-0 top-0 bottom-0 w-[min(18rem,calc(100vw-1rem))] sm:w-72 ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700'
              : 'bg-white border-slate-200'
          } border-r shadow-2xl transform transition-transform duration-300 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Menu lateral móvel"
          role="dialog"
          aria-modal="true"
        >
          {renderSidebarContent({ forceExpanded: true })}
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className={[
          'md:hidden fixed left-0 right-0 bottom-0 z-30 border-t backdrop-blur-xl',
          isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200',
        ].join(' ')}
        aria-label="Navegação inferior"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        <div className="relative grid grid-cols-4 gap-1 px-2 pt-2 pb-1">
          {bottomNavGroups.map((grp) => {
            const isActive = grp.routes.includes(activeRoute);
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => handleNavigate(grp.id)}
                className={[
                  'relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[11px] font-semibold tracking-[0.01em] transition-all duration-300 overflow-hidden group',
                  isActive
                    ? isDarkMode
                      ? 'text-brand-primary'
                      : 'text-brand-primary'
                    : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800/50'
                    : 'text-slate-500 hover:bg-slate-50',
                ].join(' ')}
                style={isActive ? { color: 'var(--brand-primary)' } : undefined}
                aria-current={isActive ? 'page' : undefined}
                aria-label={grp.label}
              >
                <div 
                  className={`absolute inset-0 transition-transform duration-300 rounded-2xl ${isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} ${isDarkMode ? 'bg-brand-primary/10' : 'bg-brand-primary/10'}`}
                />
                
                <div className={`relative transition-transform duration-300 ${isActive ? '-translate-y-1 scale-110' : 'group-active:scale-95'}`}>
                  {cloneMenuIcon(grp.icon, 'h-5.5 w-5.5')}
                </div>
                
                <span 
                  className={`absolute bottom-1.5 w-full text-center leading-tight transition-all duration-300 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                >
                  {grp.label}
                </span>
              </button>
            );
          })}

          {!allowedRoutes?.length && (
            <button
              type="button"
              onClick={onRequestOpenMobile}
              className={[
                'relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[11px] font-semibold tracking-[0.01em] transition-all duration-300 overflow-hidden group',
                isMoreActive
                  ? isDarkMode
                    ? 'text-brand-primary'
                    : 'text-brand-primary'
                  : isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800/50'
                  : 'text-slate-500 hover:bg-slate-50',
              ].join(' ')}
              style={isMoreActive ? { color: 'var(--brand-primary)' } : undefined}
              aria-label="Mais opções"
            >
              <div 
                className={`absolute inset-0 transition-transform duration-300 rounded-2xl ${isMoreActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} ${isDarkMode ? 'bg-brand-primary/10' : 'bg-brand-primary/10'}`}
              />
              
              <div className={`relative transition-transform duration-300 ${isMoreActive ? '-translate-y-1 scale-110' : 'group-active:scale-95'}`}>
                <Menu className="h-5.5 w-5.5" />
              </div>
              
              <span 
                className={`absolute bottom-1.5 w-full text-center leading-tight transition-all duration-300 ${isMoreActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              >
                Mais
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

export default React.memo(Sidebar);
