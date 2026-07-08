import React, { useEffect, useMemo, useRef, useState, Suspense, lazy, useCallback } from 'react';
import { Clock3, LogOut, Moon, Sun } from 'lucide-react';
import {
  AnimalRecord,
  BackupAutomationSettings,
  BackupRecord,
  BackupSnapshot,
  ClientRecord,
  FarmProfileData,
  GalpaoRecord,
  HealthProfessionalRecord,
  HealthRecord,
  MortalityRecord,
  ManejoRecord,
  DisponibilidadeVenda,
  OnboardingState,
  PurchaseRecord,
  SupplierRecord,
  SystemSettingsData,
  UserPersonalData,
  VeterinaryStockRecord,
  VendaRecord,
  IngredientRecord,
  FormulationRecord,
  FormulatedFeedStockRecord,
} from '@/types';
import Sidebar, { RouteId } from '@/components/Sidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { BillingStatusResponse, fetchBillingStatus } from '@/lib/billing';

const AnimaisPage = lazy(() => import('@/pages/AnimaisPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AssinaturaPage = lazy(() => import('@/pages/AssinaturaPage'));
const BackupsPage = lazy(() => import('@/pages/BackupsPage'));
const ClientePage = lazy(() => import('@/pages/ClientePage'));
const ClimaPage = lazy(() => import('@/pages/ClimaPage'));
const ComprasPage = lazy(() => import('@/pages/ComprasPage'));
const ConhecimentoPage = lazy(() => import('@/pages/ConhecimentoPage'));
const FinanceiroPage = lazy(() => import('@/pages/FinanceiroPage'));
const FormulacaoPage = lazy(() => import('@/pages/FormulacaoPage'));
const FornecedorPage = lazy(() => import('@/pages/FornecedorPage'));
const GalpoesPage = lazy(() => import('@/pages/GalpoesPage'));
const ProfissionaisPage = lazy(() => import('@/pages/ProfissionaisPage'));
const InicioPage = lazy(() => import('@/pages/InicioPage'));
const InvestimentosPage = lazy(() => import('@/pages/InvestimentosPage'));
const ManejoPage = lazy(() => import('@/pages/ManejoPage'));
const PerfilPage = lazy(() => import('@/pages/PerfilPage'));
const PersonalizacaoPage = lazy(() => import('@/pages/PersonalizacaoPage'));
const RelatoriosPage = lazy(() => import('@/pages/RelatoriosPage'));
const SistemaPage = lazy(() => import('@/pages/SistemaPage'));
const VendasPage = lazy(() => import('@/pages/VendasPage'));
import {
  buildMyBackupSnapshot,
  createMyGranja,
  deleteMyBackup,
  deleteMyAnimal,
  deleteMyClient,
  deleteMyGalpao,
  deleteMyHealthProfessional,
  deleteMyHealthRecord,
  deleteMyMortalityRecord,
  deleteMyPurchase,
  deleteMySupplier,
  deleteMyVeterinaryStock,
  deleteMyManejoRecord,
  deleteMyDisponibilidadeVenda,
  deleteMyVenda,
  deleteMyIngredient,
  deleteMyFormulacao,
  deleteMyFormulatedFeedStock,
  getMyLatestGranja,
  getMyUser,
  getBackupAutomationSettingsFromGranja,
  isSupabaseConfigured,
  listMyBackups,
  listMyAnimals,
  listMyClients,
  listMyGalpoes,
  listMyHealthProfessionals,
  listMyHealthRecords,
  listMyMortalityRecords,
  listMyPurchases,
  listMySuppliers,
  listMyVeterinaryStock,
  listMyManejoRecords,
  listMyDisponibilidadeVenda,
  listMyVendas,
  listMyIngredients,
  listMyFormulacoes,
  listMyFormulatedFeedStock,
  restoreMyBackupSnapshot,
  saveMyBackupToSupabase,
  updateMyGranja,
  updateMyGranjaAutoBackupSettings,
  updateMyGranjaBirdCount,
  upsertMyUser,
  setBillingAccessState,
  upsertMyAnimal,
  upsertMyClient,
  upsertMyGalpao,
  upsertMyHealthProfessional,
  upsertMyHealthRecord,
  upsertMyMortalityRecord,
  upsertMyPurchase,
  upsertMySupplier,
  upsertMyVeterinaryStock,
  upsertMyManejoRecord,
  upsertMyDisponibilidadeVenda,
  upsertMyVenda,
  upsertMyIngredient,
  upsertMyFormulacao,
  upsertMyFormulatedFeedStock,
} from '@/lib/supabase';

interface AppShellProps {
  appState: OnboardingState;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdatePersonalProfile: (personal: Omit<UserPersonalData, 'password'>) => void;
  onUpdateFarmProfile: (farmProfile: FarmProfileData) => void;
  onUpdateSystemSettings: (systemSettings: SystemSettingsData) => void;
  onPreviewSystemPaletteChange: (paletteId: SystemSettingsData['selectedPalette'], customColor?: string) => void;
}

const DEFAULT_BACKUP_AUTOMATION: BackupAutomationSettings = {
  enabled: false,
  frequency: 'weekly',
  lastRunAt: '',
  keepCount: 10,
};

function getNextBackupTime(frequency: BackupAutomationSettings['frequency'], fromDate: Date) {
  const next = new Date(fromDate);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}

function getAccessLockMessage(
  billingData: BillingStatusResponse | null,
  billingError?: string | null,
) {
  const access = billingData?.access;

  if (billingError) {
    return {
      title: 'Não foi possível validar sua assinatura',
      description:
        'Tente atualizar a seção de assinatura para confirmar o período de teste ou a liberação do seu plano.',
    };
  }

  if (!access) {
    return {
      title: 'Validando acesso da conta',
      description:
        'Estamos conferindo o status do seu período de teste e da sua assinatura antes de liberar os módulos do sistema.',
    };
  }

  if (access.reason === 'trial_expired') {
    return {
      title: 'Seu teste grátis terminou',
      description:
        'Escolha um plano na seção de assinatura para voltar a usar os módulos da plataforma.',
    };
  }

  if (access.reason === 'subscription_required' || access.reason === 'entitlement_missing') {
    return {
      title: 'Assinatura obrigatória',
      description:
        'Sua conta precisa de um plano ativo para liberar novamente o acesso ao aplicativo.',
    };
  }

  return {
    title: 'Acesso temporariamente restrito',
    description:
      'Atualize o status da assinatura para validar novamente a liberação dos módulos.',
  };
}

export default function AppShell({
  appState,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  onUpdatePersonalProfile,
  onUpdateFarmProfile,
  onUpdateSystemSettings,
  onPreviewSystemPaletteChange,
}: AppShellProps) {
  const toast = useToast();
  const [activeRoute, setActiveRoute] = useState<RouteId>('inicio');
  // Persist sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [animalRecords, setAnimalRecords] = useState<AnimalRecord[]>([]);
  const [clientRecords, setClientRecords] = useState<ClientRecord[]>([]);
  const [supplierRecords, setSupplierRecords] = useState<SupplierRecord[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [galpaoRecords, setGalpaoRecords] = useState<GalpaoRecord[]>([]);
  const [healthProfessionalRecords, setHealthProfessionalRecords] = useState<HealthProfessionalRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [veterinaryStockRecords, setVeterinaryStockRecords] = useState<VeterinaryStockRecord[]>([]);
  const [mortalityRecords, setMortalityRecords] = useState<MortalityRecord[]>([]);
  const [manejoRecords, setManejoRecords] = useState<ManejoRecord[]>([]);
  const [disponibilidadeVenda, setDisponibilidadeVenda] = useState<DisponibilidadeVenda[]>([]);
  const [vendasRecords, setVendasRecords] = useState<VendaRecord[]>([]);
  const [ingredientRecords, setIngredientRecords] = useState<IngredientRecord[]>([]);
  const [formulationRecords, setFormulationRecords] = useState<FormulationRecord[]>([]);
  const [formulatedFeedStockRecords, setFormulatedFeedStockRecords] = useState<FormulatedFeedStockRecord[]>([]);
  const [isCadastrosLoading, setIsCadastrosLoading] = useState(true);
  const [isCadastrosSyncing, setIsCadastrosSyncing] = useState(false);
  const [cadastrosError, setCadastrosError] = useState<string | null>(null);
  const [isProfileSyncing, setIsProfileSyncing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [isBackupsLoading, setIsBackupsLoading] = useState(true);
  const [isBackupsSyncing, setIsBackupsSyncing] = useState(false);
  const [backupsError, setBackupsError] = useState<string | null>(null);
  const [backupAutomation, setBackupAutomation] = useState<BackupAutomationSettings>(DEFAULT_BACKUP_AUTOMATION);
  const [billingData, setBillingData] = useState<BillingStatusResponse | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'usuario' | 'moderador' | 'admin' | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const autoBackupRunRef = useRef(false);
  const lastCadastrosErrorRef = useRef<string | null>(null);
  const lastProfileErrorRef = useRef<string | null>(null);
  const lastBackupsErrorRef = useRef<string | null>(null);
  const lastBillingErrorRef = useRef<string | null>(null);
  const hasModuleAccess = billingData?.access.hasAccess ?? false;
  const isAdmin = currentUserRole === 'admin';
  const hasShellAccess = isAdmin || hasModuleAccess;
  const isAccessResolved = !isBillingLoading && !isRoleLoading;
  const allowedRoutes = useMemo<RouteId[] | undefined>(
    () =>
      isAdmin
        ? ['admin']
        : isAccessResolved && !hasModuleAccess
        ? ['assinatura']
        : undefined,
    [hasModuleAccess, isAccessResolved, isAdmin],
  );
  const accessLockMessage = useMemo(
    () => getAccessLockMessage(billingData, billingError),
    [billingData, billingError],
  );
  const trialDaysRemaining = !isAdmin && billingData?.access.reason === 'trial_active'
    ? billingData.access.trialDaysRemaining
    : null;

  const handleBillingDataChange = useCallback((nextBillingData: BillingStatusResponse) => {
    setBillingData(nextBillingData);
    setBillingError(null);
  }, []);

  const loadBillingAccess = useCallback(async (showBackgroundLoader = false) => {
    if (showBackgroundLoader) {
      setBillingError(null);
    } else {
      setIsBillingLoading(true);
      setBillingError(null);
    }

    try {
      const nextBillingData = await fetchBillingStatus();
      setBillingData(nextBillingData);
      setBillingError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível validar o acesso da assinatura.';
      setBillingError(message);
    } finally {
      setIsBillingLoading(false);
    }
  }, []);


  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUserRole = async () => {
      try {
        const user = await getMyUser();
        if (!isMounted) {
          return;
        }

        setCurrentUserRole(user?.app_role || 'usuario');
      } catch (error) {
        console.warn('Nao foi possivel carregar o papel do usuario autenticado:', error);
        if (isMounted) {
          setCurrentUserRole('usuario');
        }
      } finally {
        if (isMounted) {
          setIsRoleLoading(false);
        }
      }
    };

    void loadCurrentUserRole();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void loadBillingAccess();
  }, [loadBillingAccess]);

  useEffect(() => {
    if (!isAccessResolved) {
      return;
    }

    setBillingAccessState({
      allowed: hasShellAccess,
      reason:
        isAdmin
          ? 'admin_access'
          : billingData?.access.reason || (billingError ? 'billing_error' : 'billing_pending'),
    });
  }, [billingData, billingError, hasShellAccess, isAccessResolved, isAdmin]);

  useEffect(() => {
    if (!isAccessResolved) {
      return;
    }

    if (isAdmin) {
      if (activeRoute !== 'admin') {
        setActiveRoute('admin');
        setIsMobileSidebarOpen(false);
      }
      return;
    }

    if (hasModuleAccess || activeRoute === 'assinatura') {
      return;
    }

    setActiveRoute('assinatura');
    setIsMobileSidebarOpen(false);
  }, [activeRoute, hasModuleAccess, isAccessResolved, isAdmin]);

  const loadCadastros = useCallback(async () => {
    if (!isAccessResolved) {
      return;
    }

    if (isAdmin || !hasModuleAccess) {
      setCadastrosError(null);
      setIsCadastrosLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setCadastrosError('Supabase não está configurado para sincronizar os cadastros.');
      setIsCadastrosLoading(false);
      return;
    }

    try {
      setIsCadastrosLoading(true);
      setCadastrosError(null);
      const [animals, clients, suppliers, purchases, galpoes, professionals, health, stock, mortality, manejo, disponibilidade, vendas, ingredients, formulations, formulatedFeedStock] =
        await Promise.all([
          listMyAnimals(),
          listMyClients(),
          listMySuppliers(),
          listMyPurchases(),
          listMyGalpoes(),
          listMyHealthProfessionals(),
          listMyHealthRecords(),
          listMyVeterinaryStock(),
          listMyMortalityRecords(),
          listMyManejoRecords(),
          listMyDisponibilidadeVenda(),
          listMyVendas(),
          listMyIngredients(),
          listMyFormulacoes(),
          listMyFormulatedFeedStock(),
        ]);
        
      setAnimalRecords(animals);
      setClientRecords(clients);
      setSupplierRecords(suppliers);
      setPurchaseRecords(purchases);
      setGalpaoRecords(galpoes);
      setHealthProfessionalRecords(professionals);
      setHealthRecords(health);
      setVeterinaryStockRecords(stock);
      setMortalityRecords(mortality);
      setManejoRecords(manejo);
      setDisponibilidadeVenda(disponibilidade);
      setVendasRecords(vendas);
      setIngredientRecords(ingredients);
      setFormulationRecords(formulations);
      setFormulatedFeedStockRecords(formulatedFeedStock);

      // Save to IndexedDB cache
      import('@/lib/offlineStore').then(({ saveToCache }) => {
        saveToCache('app_cadastros', {
          animals, clients, suppliers, purchases, galpoes, professionals, health, stock, mortality, manejo, disponibilidade, vendas, ingredients, formulations, formulatedFeedStock
        });
      });
    } catch (error) {
      console.warn('Network error loading data, falling back to offline cache...', error);
      try {
        const { loadFromCache } = await import('@/lib/offlineStore');
        const cached = await loadFromCache('app_cadastros');
        if (cached) {
          setAnimalRecords(cached.animals || []);
          setClientRecords(cached.clients || []);
          setSupplierRecords(cached.suppliers || []);
          setPurchaseRecords(cached.purchases || []);
          setGalpaoRecords(cached.galpoes || []);
          setHealthProfessionalRecords(cached.professionals || []);
          setHealthRecords(cached.health || []);
          setVeterinaryStockRecords(cached.stock || []);
          setMortalityRecords(cached.mortality || []);
          setManejoRecords(cached.manejo || []);
          setDisponibilidadeVenda(cached.disponibilidade || []);
          setVendasRecords(cached.vendas || []);
          setIngredientRecords(cached.ingredients || []);
          setFormulationRecords(cached.formulations || []);
          setFormulatedFeedStockRecords(cached.formulatedFeedStock || []);
          // Don't set error message to keep the app usable silently in offline mode
          // But maybe a small warning banner would be nice (can be added later)
        } else {
          throw new Error('Sem cache local disponível.');
        }
      } catch (cacheError) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar cadastros do Supabase e sem cache local.';
        setCadastrosError(message);
      }
    } finally {
      setIsCadastrosLoading(false);
    }
  }, [hasModuleAccess, isAccessResolved, isAdmin]);

  useEffect(() => {
    void loadCadastros();
  }, [loadCadastros]);

  const loadBackups = useCallback(async () => {
    if (!isAccessResolved) {
      return;
    }

    if (isAdmin || !hasModuleAccess) {
      setBackupsError(null);
      setIsBackupsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setBackupsError('Supabase não está configurado para sincronizar os backups.');
      setIsBackupsLoading(false);
      return;
    }

    try {
      setIsBackupsLoading(true);
      setBackupsError(null);
      const backups = await listMyBackups();
      setBackupRecords(backups);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar backups.';
      setBackupsError(message);
    } finally {
      setIsBackupsLoading(false);
    }
  }, [hasModuleAccess, isAccessResolved, isAdmin]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  useEffect(() => {
    if (!cadastrosError) {
      lastCadastrosErrorRef.current = null;
      return;
    }

    if (lastCadastrosErrorRef.current === cadastrosError) {
      return;
    }

    toast.error('Falha ao sincronizar cadastros', cadastrosError);
    lastCadastrosErrorRef.current = cadastrosError;
  }, [cadastrosError, toast]);

  useEffect(() => {
    if (!profileError) {
      lastProfileErrorRef.current = null;
      return;
    }

    if (lastProfileErrorRef.current === profileError) {
      return;
    }

    toast.error('Falha ao salvar configurações', profileError);
    lastProfileErrorRef.current = profileError;
  }, [profileError, toast]);

  useEffect(() => {
    if (!backupsError) {
      lastBackupsErrorRef.current = null;
      return;
    }

    if (lastBackupsErrorRef.current === backupsError) {
      return;
    }

    toast.error('Falha ao processar backup', backupsError);
    lastBackupsErrorRef.current = backupsError;
  }, [backupsError, toast]);

  // Background Sync Processor
  useEffect(() => {
    let syncInterval: ReturnType<typeof setInterval>;

    if (isAdmin || !hasModuleAccess) {
      return;
    }

    const handleOnline = () => {
      import('@/lib/syncProcessor').then(({ processSyncQueue }) => processSyncQueue());
    };

    window.addEventListener('online', handleOnline);

    // Initial check and periodic polling every 30 seconds
    if (navigator.onLine) {
      handleOnline();
    }
    syncInterval = setInterval(() => {
      if (navigator.onLine) {
        import('@/lib/syncProcessor').then(({ processSyncQueue }) => processSyncQueue());
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(syncInterval);
    };
  }, [hasModuleAccess, isAdmin]);

  const refreshAppStateFromSupabase = async () => {
    if (!isAccessResolved) {
      return;
    }

    if (isAdmin) {
      setBackupAutomation(DEFAULT_BACKUP_AUTOMATION);
      return;
    }

    if (!hasModuleAccess) {
      setBackupAutomation(DEFAULT_BACKUP_AUTOMATION);
      return;
    }

    if (!isSupabaseConfigured) {
      setBackupAutomation(DEFAULT_BACKUP_AUTOMATION);
      return;
    }

    try {
      const [user, granja] = await Promise.all([getMyUser(), getMyLatestGranja()]);

      if (user) {
        onUpdatePersonalProfile({
          fullName: user.full_name,
          email: user.email,
          phone: user.phone ?? '',
        });
      }

      if (granja) {
        const selectedPalette =
          granja.selected_palette ? (granja.selected_palette as SystemSettingsData['selectedPalette']) : 'blue';
        setBackupAutomation(getBackupAutomationSettingsFromGranja(granja));

        onUpdateFarmProfile({
          farmName: granja.farm_name,
          state: granja.state,
          city: granja.city,
          birdCount: granja.bird_count,
          selectedPalette,
          marketingSource: granja.marketing_source ?? '',
        });

        onUpdateSystemSettings({
          selectedPalette,
          fontFamily: appState.systemSettings.fontFamily || 'inter',
          borderRadius: appState.systemSettings.borderRadius || 'rounded',
          eggSalePrice: Number(granja.egg_sale_price ?? 0),
          birdSalePrice: Number(granja.bird_sale_price ?? 0),
          litterSalePrice: Number(granja.litter_sale_price ?? 0),
          weather: appState.systemSettings.weather || {
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
        });
        return;
      }

      setBackupAutomation(DEFAULT_BACKUP_AUTOMATION);
    } catch (e) {
      console.warn('Unable to refresh app state from Supabase:', e);
      setBackupAutomation(DEFAULT_BACKUP_AUTOMATION);
    }
  };

  useEffect(() => {
    void refreshAppStateFromSupabase();
  }, [hasModuleAccess, isAccessResolved, isAdmin]);

  const upsertAnimal = useCallback(async (payload: AnimalRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyAnimal(payload);
      setAnimalRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar animal.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeAnimal = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyAnimal(id);
      setAnimalRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir animal.';
      setCadastrosError(message);
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertClient = useCallback(async (payload: ClientRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyClient(payload);
      setClientRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar cliente.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeClient = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyClient(id);
      setClientRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir cliente.';
      setCadastrosError(message);
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertSupplier = useCallback(async (payload: SupplierRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMySupplier(payload);
      setSupplierRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar fornecedor.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeSupplier = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMySupplier(id);
      setSupplierRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir fornecedor.';
      setCadastrosError(message);
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertPurchase = useCallback(async (payload: PurchaseRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyPurchase(payload);
      setPurchaseRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar compra.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removePurchase = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyPurchase(id);
      setPurchaseRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir compra.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const syncFarmPopulationCount = useCallback(async (nextAnimals: AnimalRecord[]) => {
    const totalBirds = nextAnimals.reduce((sum, item) => sum + (item.currentQuantity ?? item.quantity), 0);
    const currentGranja = await getMyLatestGranja();

    if (currentGranja) {
      await updateMyGranjaBirdCount(currentGranja.id, totalBirds);
    }

    onUpdateFarmProfile({
      farmName: appState.farm.farmName,
      state: appState.farm.state,
      city: appState.farm.city,
      birdCount: totalBirds,
      selectedPalette: appState.selectedPalette,
      marketingSource: appState.marketingSource,
    });
  }, [appState.farm, appState.selectedPalette, appState.marketingSource, onUpdateFarmProfile]);

  const upsertGalpao = useCallback(async (payload: GalpaoRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyGalpao(payload);
      setGalpaoRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar galpão.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeGalpao = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyGalpao(id);
      setGalpaoRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir galpão.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertHealthProfessional = useCallback(async (payload: HealthProfessionalRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyHealthProfessional(payload);
      setHealthProfessionalRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar profissional de saúde.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeHealthProfessional = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyHealthProfessional(id);
      setHealthProfessionalRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir profissional de saúde.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertHealth = useCallback(async (payload: HealthRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyHealthRecord(payload);
      setHealthRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar registro de saúde.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeHealth = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyHealthRecord(id);
      setHealthRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir registro de saúde.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertVeterinaryStock = useCallback(async (payload: VeterinaryStockRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyVeterinaryStock(payload);
      setVeterinaryStockRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar item do estoque veterinário.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeVeterinaryStock = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyVeterinaryStock(id);
      setVeterinaryStockRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir item do estoque veterinário.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertMortality = useCallback(async (payload: MortalityRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);

      const previous = mortalityRecords.find((item) => item.id === payload.id) ?? null;
      const saved = await upsertMyMortalityRecord(payload);
      let nextAnimals = [...animalRecords];
      let nextGalpoes = [...galpaoRecords];
      const changedAnimalIds = new Set<string>();
      const changedGalpaoIds = new Set<string>();

      const applyPopulationDelta = (record: MortalityRecord, multiplier: 1 | -1) => {
        nextAnimals = nextAnimals.map((animal) => {
          if (animal.id !== record.animalId) return animal;
          changedAnimalIds.add(animal.id);
          return {
            ...animal,
            currentQuantity: Math.max(0, (animal.currentQuantity ?? animal.quantity) + multiplier * record.deadCount),
          };
        });

        if (record.galpaoId) {
          nextGalpoes = nextGalpoes.map((galpao) => {
            if (galpao.id !== record.galpaoId) return galpao;
            changedGalpaoIds.add(galpao.id);
            return {
              ...galpao,
              currentBirdCount: Math.max(0, galpao.currentBirdCount + multiplier * record.deadCount),
            };
          });
        }
      };

      if (previous) applyPopulationDelta(previous, 1);
      applyPopulationDelta(saved, -1);

      const changedAnimals = nextAnimals.filter((animal) => changedAnimalIds.has(animal.id));
      const changedGalpoes = nextGalpoes.filter((galpao) => changedGalpaoIds.has(galpao.id));

      await Promise.all([
        ...changedAnimals.map((animal) => upsertMyAnimal(animal)),
        ...changedGalpoes.map((galpao) => upsertMyGalpao(galpao)),
      ]);
      await syncFarmPopulationCount(nextAnimals);

      setAnimalRecords(nextAnimals);
      setGalpaoRecords(nextGalpoes);
      setMortalityRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar registro de mortalidade.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, [mortalityRecords, animalRecords, galpaoRecords, syncFarmPopulationCount]);

  const removeMortality = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);

      const previous = mortalityRecords.find((item) => item.id === id);
      if (!previous) {
        await deleteMyMortalityRecord(id);
        setMortalityRecords((prev) => prev.filter((item) => item.id !== id));
        return;
      }

      await deleteMyMortalityRecord(id);

      const nextAnimals = animalRecords.map((animal) =>
        animal.id === previous.animalId
          ? {
              ...animal,
              currentQuantity: Math.max(0, (animal.currentQuantity ?? animal.quantity) + previous.deadCount),
            }
          : animal,
      );
      const nextGalpoes = previous.galpaoId
        ? galpaoRecords.map((galpao) =>
            galpao.id === previous.galpaoId
              ? {
                  ...galpao,
                  currentBirdCount: Math.max(0, galpao.currentBirdCount + previous.deadCount),
                }
              : galpao,
          )
        : galpaoRecords;

      await Promise.all([
        ...nextAnimals.filter((animal) => animal.id === previous.animalId).map((animal) => upsertMyAnimal(animal)),
        ...(previous.galpaoId ? nextGalpoes.filter((galpao) => galpao.id === previous.galpaoId).map((galpao) => upsertMyGalpao(galpao)) : []),
      ]);
      await syncFarmPopulationCount(nextAnimals);

      setAnimalRecords(nextAnimals);
      setGalpaoRecords(nextGalpoes);
      setMortalityRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir registro de mortalidade.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, [mortalityRecords, animalRecords, galpaoRecords, syncFarmPopulationCount]);

  const upsertManejo = useCallback(async (record: ManejoRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyManejoRecord(record);
      setManejoRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar registro de manejo.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeManejo = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyManejoRecord(id);
      setManejoRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir registro de manejo.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertDisponibilidade = useCallback(async (record: DisponibilidadeVenda) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyDisponibilidadeVenda(record);
      setDisponibilidadeVenda((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar disponibilidade para venda.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeDisponibilidade = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyDisponibilidadeVenda(id);
      setDisponibilidadeVenda((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir disponibilidade para venda.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertVenda = useCallback(async (record: VendaRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyVenda(record);
      setVendasRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar venda.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeVenda = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyVenda(id);
      setVendasRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir venda.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertIngredient = useCallback(async (record: IngredientRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyIngredient(record);
      setIngredientRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      console.error('[DEBUG] ERRO no AppShell upsertIngredient:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar ingrediente.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeIngredient = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyIngredient(id);
      setIngredientRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir ingrediente.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertFormulacao = useCallback(async (record: FormulationRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyFormulacao(record);
      setFormulationRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar formulação.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeFormulacao = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyFormulacao(id);
      setFormulationRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir formulação.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const upsertFormulatedFeedStock = useCallback(async (record: FormulatedFeedStockRecord) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      const saved = await upsertMyFormulatedFeedStock(record);
      setFormulatedFeedStockRecords((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar estoque de ração formulada.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const removeFormulatedFeedStock = useCallback(async (id: string) => {
    try {
      setIsCadastrosSyncing(true);
      setCadastrosError(null);
      await deleteMyFormulatedFeedStock(id);
      setFormulatedFeedStockRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir estoque de ração formulada.';
      setCadastrosError(message);
      throw error;
    } finally {
      setIsCadastrosSyncing(false);
    }
  }, []);

  const savePersonalProfile = async (payload: Omit<UserPersonalData, 'password'>) => {
    try {
      setIsProfileSyncing(true);
      setProfileError(null);
      const saved = await upsertMyUser({
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
      });

      onUpdatePersonalProfile({
        fullName: saved.full_name,
        email: saved.email,
        phone: saved.phone ?? '',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar perfil pessoal.';
      setProfileError(message);
      throw error;
    } finally {
      setIsProfileSyncing(false);
    }
  };

  const saveFarmProfile = async (payload: FarmProfileData) => {
    try {
      setIsProfileSyncing(true);
      setProfileError(null);

      const granjaPayload = {
        farm_name: payload.farmName,
        state: payload.state,
        city: payload.city,
        bird_count: payload.birdCount,
        selected_palette: payload.selectedPalette,
        marketing_source: payload.marketingSource,
        egg_sale_price: appState.systemSettings.eggSalePrice,
        bird_sale_price: appState.systemSettings.birdSalePrice,
        litter_sale_price: appState.systemSettings.litterSalePrice,
        auto_backup_enabled: backupAutomation.enabled,
        auto_backup_frequency: backupAutomation.frequency,
        auto_backup_last_run_at: backupAutomation.lastRunAt || null,
        auto_backup_keep_count: backupAutomation.keepCount,
      };

      const currentGranja = await getMyLatestGranja();
      const saved = currentGranja
        ? await updateMyGranja(currentGranja.id, granjaPayload)
        : await createMyGranja(granjaPayload);

      onUpdateFarmProfile({
        farmName: saved.farm_name,
        state: saved.state,
        city: saved.city,
        birdCount: saved.bird_count,
        selectedPalette:
          saved.selected_palette
            ? (saved.selected_palette as FarmProfileData['selectedPalette'])
            : payload.selectedPalette,
        marketingSource: saved.marketing_source,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar perfil da granja.';
      setProfileError(message);
      throw error;
    } finally {
      setIsProfileSyncing(false);
    }
  };

  const saveSystemSettings = async (payload: SystemSettingsData) => {
    try {
      setIsProfileSyncing(true);
      setProfileError(null);

      const currentGranja = await getMyLatestGranja();
      const granjaPayload = {
        farm_name: appState.farm.farmName,
        state: appState.farm.state,
        city: appState.farm.city,
        bird_count: appState.farm.birdCount,
        selected_palette: payload.selectedPalette,
        marketing_source: appState.marketingSource,
        egg_sale_price: payload.eggSalePrice,
        bird_sale_price: payload.birdSalePrice,
        litter_sale_price: payload.litterSalePrice,
        auto_backup_enabled: backupAutomation.enabled,
        auto_backup_frequency: backupAutomation.frequency,
        auto_backup_last_run_at: backupAutomation.lastRunAt || null,
        auto_backup_keep_count: backupAutomation.keepCount,
      };

      const saved = currentGranja
        ? await updateMyGranja(currentGranja.id, granjaPayload)
        : await createMyGranja(granjaPayload);

      onUpdateSystemSettings({
        selectedPalette: saved.selected_palette
          ? (saved.selected_palette as SystemSettingsData['selectedPalette'])
          : payload.selectedPalette,
        fontFamily: payload.fontFamily || 'inter',
        borderRadius: payload.borderRadius || 'rounded',
        eggSalePrice: Number(saved.egg_sale_price ?? payload.eggSalePrice),
        birdSalePrice: Number(saved.bird_sale_price ?? payload.birdSalePrice),
        litterSalePrice: Number(saved.litter_sale_price ?? payload.litterSalePrice),
        weather: payload.weather,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar preferências do sistema.';
      setProfileError(message);
      throw error;
    } finally {
      setIsProfileSyncing(false);
    }
  };

  const createSupabaseBackup = async (name: string) => {
    try {
      setIsBackupsSyncing(true);
      setBackupsError(null);
      const saved = await saveMyBackupToSupabase(name);
      setBackupRecords((prev) => [saved, ...prev]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar backup no Supabase.';
      setBackupsError(message);
      throw error;
    } finally {
      setIsBackupsSyncing(false);
    }
  };

  const saveBackupAutomation = async (settings: BackupAutomationSettings) => {
    try {
      setIsBackupsSyncing(true);
      setBackupsError(null);

      const currentGranja = await getMyLatestGranja();
      if (!currentGranja) {
        throw new Error('Nenhuma granja encontrada para configurar o backup automático.');
      }

      const saved = await updateMyGranjaAutoBackupSettings(currentGranja.id, {
        auto_backup_enabled: settings.enabled,
        auto_backup_frequency: settings.frequency,
        auto_backup_last_run_at: settings.lastRunAt || null,
        auto_backup_keep_count: settings.keepCount,
      });

      setBackupAutomation(getBackupAutomationSettingsFromGranja(saved));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar automação de backup.';
      setBackupsError(message);
      throw error;
    } finally {
      setIsBackupsSyncing(false);
    }
  };

  const exportCurrentBackup = async () => {
    try {
      setIsBackupsSyncing(true);
      setBackupsError(null);
      return await buildMyBackupSnapshot();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar arquivo de backup.';
      setBackupsError(message);
      throw error;
    } finally {
      setIsBackupsSyncing(false);
    }
  };

  const downloadSavedBackup = (record: BackupRecord) => {
    const blob = new Blob([JSON.stringify(record.snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'backup'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = async (snapshot: BackupSnapshot) => {
    try {
      setIsBackupsSyncing(true);
      setBackupsError(null);
      await restoreMyBackupSnapshot(snapshot);
      await Promise.all([loadCadastros(), loadBackups(), refreshAppStateFromSupabase()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao restaurar backup.';
      setBackupsError(message);
      throw error;
    } finally {
      setIsBackupsSyncing(false);
    }
  };

  const removeBackup = async (id: string) => {
    try {
      setIsBackupsSyncing(true);
      setBackupsError(null);
      await deleteMyBackup(id);
      setBackupRecords((prev) => prev.filter((record) => record.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir backup.';
      setBackupsError(message);
      throw error;
    } finally {
      setIsBackupsSyncing(false);
    }
  };

  useEffect(() => {
    if (isBackupsLoading || isBackupsSyncing || autoBackupRunRef.current || !backupAutomation.enabled) {
      return;
    }

    const lastRunDate = backupAutomation.lastRunAt ? new Date(backupAutomation.lastRunAt) : null;
    const isDue = !lastRunDate || Number.isNaN(lastRunDate.getTime()) || getNextBackupTime(backupAutomation.frequency, lastRunDate) <= new Date();

    if (!isDue) {
      return;
    }

    autoBackupRunRef.current = true;

    void (async () => {
      try {
        setIsBackupsSyncing(true);
        setBackupsError(null);

        const savedBackup = await saveMyBackupToSupabase(`Backup automático ${new Date().toLocaleString('pt-BR')}`);
        const currentGranja = await getMyLatestGranja();
        if (!currentGranja) {
          throw new Error('Nenhuma granja encontrada para executar o backup automático.');
        }

        const executedAt = new Date().toISOString();
        const savedGranja = await updateMyGranjaAutoBackupSettings(currentGranja.id, {
          auto_backup_enabled: true,
          auto_backup_frequency: backupAutomation.frequency,
          auto_backup_last_run_at: executedAt,
          auto_backup_keep_count: backupAutomation.keepCount,
        });

        setBackupAutomation(getBackupAutomationSettingsFromGranja(savedGranja));
        setBackupRecords((prev) => {
          const automaticBackups = [savedBackup, ...prev].filter((record) => record.name.startsWith('Backup automático '));
          const manualBackups = prev.filter((record) => !record.name.startsWith('Backup automático '));
          const keptAutomaticBackups = automaticBackups.slice(0, Math.max(1, backupAutomation.keepCount));
          const removedAutomaticBackups = automaticBackups.slice(Math.max(1, backupAutomation.keepCount));

          if (removedAutomaticBackups.length > 0) {
            void Promise.all(removedAutomaticBackups.map((record) => deleteMyBackup(record.id))).catch((error) => {
              const message = error instanceof Error ? error.message : 'Erro ao limpar backups automáticos antigos.';
              setBackupsError(message);
            });
          }

          return [...keptAutomaticBackups, ...manualBackups].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao executar backup automático.';
        setBackupsError(message);
      } finally {
        setIsBackupsSyncing(false);
        autoBackupRunRef.current = false;
      }
    })();
  }, [backupAutomation, isBackupsLoading, isBackupsSyncing]);

  const activeTitle = useMemo(() => {
    const titles: Record<RouteId, string> = {
      admin: 'Administração • Painel',
      inicio: 'Início',
      manejo: 'Operações • Manejo',
      vendas: 'Operações • Vendas',
      formulacao: 'Operações • Formulação',
      animais: 'Cadastro • Animais',
      galpoes: 'Cadastro • Galpões',
      profissionais: 'Cadastro • Profissionais',
      cliente: 'Cadastro • Cliente',
      fornecedor: 'Cadastro • Fornecedor',
      compras: 'Gestão • Compras',
      financeiro: 'Gestão • Financeiro',
      investimentos: 'Gestão • Investimentos',
      relatorios: 'Gestão • Relatórios',
      clima: 'Monitoramento • Clima',
      conhecimento: 'Monitoramento • Conhecimento',
      perfil: 'Configurações • Perfil',
      personalizacao: 'Configurações • Personalização',
      sistema: 'Configurações • Sistema',
      backups: 'Configurações • Backups',
      assinatura: 'Configurações • Assinatura',
    };
    return titles[activeRoute];
  }, [activeRoute]);

  const handleNavigate = useCallback((route: RouteId) => {
    if (isAdmin) {
      setActiveRoute('admin');
      setIsMobileSidebarOpen(false);
      return;
    }

    setActiveRoute(!hasModuleAccess && route !== 'assinatura' ? 'assinatura' : route);
    setIsMobileSidebarOpen(false);
  }, [hasModuleAccess, isAdmin]);

  const handleToggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((v) => !v);
  }, []);

  const handleOpenMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  const handleCloseMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const renderPage = () => {
    if (!isAccessResolved) {
      return (
        <div className="flex min-h-[420px] items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
              <div className="h-7 w-7 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-[#0f1c2b]">
              {accessLockMessage.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {accessLockMessage.description}
            </p>
          </div>
        </div>
      );
    }

    if (!isAdmin && !hasModuleAccess && activeRoute !== 'assinatura') {
      return (
        <AssinaturaPage
          initialBillingData={billingData}
          onBillingDataChange={handleBillingDataChange}
        />
      );
    }

    if (isAdmin && activeRoute !== 'admin') {
      return (
        <div className="flex min-h-[420px] items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
              <div className="h-7 w-7 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-[#0f1c2b]">Abrindo painel administrativo</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Estamos preparando o ambiente exclusivo do administrador.
            </p>
          </div>
        </div>
      );
    }

    switch (activeRoute) {
      case 'admin':
        return <AdminPage />;
      case 'inicio':
        return (
          <InicioPage
            animals={animalRecords}
            vendas={vendasRecords}
            compras={purchaseRecords}
            manejos={manejoRecords}
            mortalities={mortalityRecords}
            settings={appState.systemSettings}
            farm={appState.farm}
            onNavigate={handleNavigate}
          />
        );
      case 'manejo':
        return (
          <ManejoPage
            section="registro"
            animals={animalRecords}
            galpoes={galpaoRecords}
            suppliers={supplierRecords}
            purchases={purchaseRecords}
            healthProfessionals={healthProfessionalRecords}
            healthRecords={healthRecords}
            veterinaryStock={veterinaryStockRecords}
            mortalityRecords={mortalityRecords}
            manejoRecords={manejoRecords}
            disponibilidadeVenda={disponibilidadeVenda}
            formulations={formulationRecords}
            formulatedFeedStock={formulatedFeedStockRecords}
            onSaveGalpao={upsertGalpao}
            onDeleteGalpao={removeGalpao}
            onSaveHealthProfessional={upsertHealthProfessional}
            onDeleteHealthProfessional={removeHealthProfessional}
            onSaveHealthRecord={upsertHealth}
            onDeleteHealthRecord={removeHealth}
            onSaveVeterinaryStock={upsertVeterinaryStock}
            onDeleteVeterinaryStock={removeVeterinaryStock}
            onSaveMortalityRecord={upsertMortality}
            onDeleteMortalityRecord={removeMortality}
            onSaveManejoRecord={upsertManejo}
            onDeleteManejoRecord={removeManejo}
            onSaveDisponibilidadeVenda={upsertDisponibilidade}
            onDeleteDisponibilidadeVenda={removeDisponibilidade}
            onSaveFormulatedFeed={upsertFormulatedFeedStock}
            isLoading={isCadastrosLoading}
            isSyncing={isCadastrosSyncing}
            errorMessage={cadastrosError ?? undefined}
            onRetry={loadCadastros}
          />
        );
      case 'vendas':
        return (
          <VendasPage
            settings={appState.systemSettings}
            clients={clientRecords}
            animals={animalRecords}
            disponibilidadeVenda={disponibilidadeVenda}
            vendas={vendasRecords}
            manejoRecords={manejoRecords}
            onSaveVenda={upsertVenda}
            onDeleteVenda={removeVenda}
            isLoading={isCadastrosLoading}
            isSyncing={isCadastrosSyncing}
            errorMessage={cadastrosError ?? undefined}
            onRetry={loadCadastros}
          />
        );
      case 'formulacao':
        return (
          <FormulacaoPage
            animals={animalRecords}
            ingredients={ingredientRecords}
            formulations={formulationRecords}
            formulatedFeedStock={formulatedFeedStockRecords}
            onSaveIngredient={upsertIngredient}
            onDeleteIngredient={removeIngredient}
            onSaveFormulation={upsertFormulacao}
            onDeleteFormulation={removeFormulacao}
            onSaveFormulatedFeed={upsertFormulatedFeedStock}
          />
        );
      case 'animais':
        return (
          <AnimaisPage
            records={animalRecords}
            suppliers={supplierRecords}
            onSave={upsertAnimal}
            onDelete={removeAnimal}
            isLoading={isCadastrosLoading}
            isSyncing={isCadastrosSyncing}
            errorMessage={cadastrosError ?? undefined}
            onRetry={loadCadastros}
          />
        );
      case 'cliente':
        return (
          <ClientePage
            records={clientRecords}
            onSave={upsertClient}
            onDelete={removeClient}
            isLoading={isCadastrosLoading}
            isSyncing={isCadastrosSyncing}
            errorMessage={cadastrosError ?? undefined}
            onRetry={loadCadastros}
          />
        );
      case 'fornecedor':
        return (
          <FornecedorPage
            records={supplierRecords}
            onSave={upsertSupplier}
            onDelete={removeSupplier}
            isLoading={isCadastrosLoading}
            isSyncing={isCadastrosSyncing}
            errorMessage={cadastrosError ?? undefined}
            onRetry={loadCadastros}
          />
        );
      case 'galpoes':
        return (
          <GalpoesPage
            records={galpaoRecords}
            animals={animalRecords}
            onSave={upsertGalpao}
            onDelete={removeGalpao}
            isLoading={isCadastrosLoading}
            isSyncing={isCadastrosSyncing}
            errorMessage={cadastrosError ?? undefined}
            onRetry={loadCadastros}
          />
        );
      case 'profissionais':
        return (
          <ProfissionaisPage
            records={healthProfessionalRecords}
            onSave={upsertHealthProfessional}
            onDelete={removeHealthProfessional}
            isLoading={isCadastrosLoading}
            isSyncing={isCadastrosSyncing}
            errorMessage={cadastrosError ?? undefined}
            onRetry={loadCadastros}
          />
        );
      case 'compras':
        return (
          <ComprasPage
            records={purchaseRecords}
            animals={animalRecords}
            suppliers={supplierRecords}
            onSave={upsertPurchase}
            onDelete={removePurchase}
            isLoading={isCadastrosLoading}
            isSyncing={isCadastrosSyncing}
            errorMessage={cadastrosError ?? undefined}
            onRetry={loadCadastros}
          />
        );
      case 'financeiro':
        return (
          <FinanceiroPage
            settings={appState.systemSettings}
            vendas={vendasRecords}
            compras={purchaseRecords}
            animais={animalRecords}
          />
        );
      case 'investimentos':
        return <InvestimentosPage />;
      case 'relatorios':
        return (
          <RelatoriosPage
            settings={appState.systemSettings}
            vendas={vendasRecords}
            compras={purchaseRecords}
            animais={animalRecords}
            manejoRecords={manejoRecords}
          />
        );
      case 'clima':
        return <ClimaPage settings={appState.systemSettings} />;
      case 'conhecimento':
        return <ConhecimentoPage />;
      case 'perfil':
        return (
          <PerfilPage
            personal={{
              fullName: appState.personal.fullName,
              email: appState.personal.email,
              phone: appState.personal.phone,
            }}
            farm={{
              farmName: appState.farm.farmName,
              state: appState.farm.state,
              city: appState.farm.city,
              birdCount: appState.farm.birdCount,
              selectedPalette: appState.selectedPalette,
              marketingSource: appState.marketingSource,
            }}
            isSyncing={isProfileSyncing}
            errorMessage={profileError ?? undefined}
            onSavePersonal={savePersonalProfile}
            onSaveFarm={saveFarmProfile}
          />
        );
      case 'sistema':
        return (
          <SistemaPage
            settings={appState.systemSettings}
            isSyncing={isProfileSyncing}
            errorMessage={profileError ?? undefined}
            onSave={saveSystemSettings}
            onPreviewPaletteChange={onPreviewSystemPaletteChange}
          />
        );
      case 'personalizacao':
        return (
          <PersonalizacaoPage
            settings={appState.systemSettings}
            isDarkMode={isDarkMode}
            isSyncing={isProfileSyncing}
            errorMessage={profileError ?? undefined}
            onSave={saveSystemSettings}
            onToggleDarkMode={onToggleDarkMode}
            onPreviewPaletteChange={onPreviewSystemPaletteChange}
          />
        );
      case 'backups':
        return (
          <BackupsPage
            records={backupRecords}
            automation={backupAutomation}
            isLoading={isBackupsLoading}
            isSyncing={isBackupsSyncing}
            errorMessage={backupsError ?? undefined}
            onCreateSupabaseBackup={createSupabaseBackup}
            onDownloadCurrentBackup={exportCurrentBackup}
            onDownloadSavedBackup={downloadSavedBackup}
            onRestoreBackup={restoreBackup}
            onDeleteBackup={removeBackup}
            onSaveAutomation={saveBackupAutomation}
            onRetry={loadBackups}
          />
        );
      case 'assinatura':
        return (
          <AssinaturaPage
            initialBillingData={billingData}
            onBillingDataChange={handleBillingDataChange}
          />
        );
    }
  };

  return (
    <div
      className={[
        'min-h-screen flex transition-colors',
        isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-brand-main text-[#0f1c2b]',
      ].join(' ')}
    >
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        allowedRoutes={allowedRoutes}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={handleToggleSidebarCollapsed}
        isDarkMode={isDarkMode}
        isMobileOpen={isMobileSidebarOpen}
        onRequestOpenMobile={handleOpenMobileSidebar}
        onRequestCloseMobile={handleCloseMobileSidebar}
      />

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[calc(4.5rem+1rem)]' : 'md:ml-[calc(16rem+1rem)]'}`}>
        <header
          className="h-16 sticky top-0 z-30 flex items-center justify-between px-6 transition-all duration-250 shadow-xl rounded-2xl md:mx-4 md:mt-4"
          style={{
            background: isDarkMode 
              ? 'linear-gradient(to right, #0f172a, #1e293b)' 
              : 'linear-gradient(to right, var(--brand-bg) 0%, var(--brand-main) 100%)',
          }}
          role="banner"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <div className={`text-base font-extrabold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{activeTitle}</div>
              <div className={`flex items-center gap-2 text-xs font-semibold truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="truncate">{appState.personal.email || 'Conta'}</span>
                {isAdmin && (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {trialDaysRemaining !== null && (
              <button
                type="button"
                onClick={() => handleNavigate('assinatura')}
                className={[
                  'inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold shadow-sm transition-all',
                  isDarkMode
                    ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
                ].join(' ')}
                aria-label={`Você ainda tem ${trialDaysRemaining} dia(s) de teste gratuito`}
                title={`Você ainda tem ${trialDaysRemaining} dia(s) de teste gratuito`}
              >
                <Clock3 className="h-4 w-4" />
                <span className="hidden md:inline">
                  Teste grátis: {trialDaysRemaining} dia(s)
                </span>
                <span className="md:hidden">{trialDaysRemaining} dia(s)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleDarkMode}
              className={[
                'w-10 h-10 inline-flex items-center justify-center rounded-2xl active:scale-95 transition-all duration-250 cursor-pointer shadow-sm',
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700' 
                  : 'bg-white hover:bg-slate-50',
              ].join(' ')}
              aria-label={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
              title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-300" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            
            <button
              type="button"
              onClick={onLogout}
              className={[
                'px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-250 active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm',
                isDarkMode
                  ? 'bg-slate-800 hover:bg-red-950/50 text-red-400 hover:text-red-300'
                  : 'bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-slate-200',
              ].join(' ')}
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main 
          className={`flex-1 min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 md:px-4 md:pt-4 ${isDarkMode ? 'bg-[#0b1220]' : ''}`} 
          role="main"
        >
          {isAccessResolved && !isAdmin && !hasModuleAccess && (
            <div className="px-4 pt-4 md:px-6 md:pt-6">
              <section
                className={[
                  'rounded-3xl border px-5 py-5 shadow-sm',
                  billingError
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-rose-200 bg-rose-50 text-rose-900',
                ].join(' ')}
              >
                <h2 className="text-lg font-extrabold">{accessLockMessage.title}</h2>
                <p className="mt-2 text-sm font-medium leading-6">
                  {accessLockMessage.description}
                </p>
                {billingError && (
                  <p className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-amber-900">
                    Detalhe técnico: {billingError}
                  </p>
                )}
              </section>
            </div>
          )}

          <Suspense fallback={
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold text-gray-500 animate-pulse">Carregando módulo...</span>
              </div>
            </div>
          }>
            {renderPage()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
