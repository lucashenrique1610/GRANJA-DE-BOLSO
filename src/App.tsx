/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FarmConfigData, FarmProfileData, OnboardingState, RegistrationCredentials, SystemSettingsData, ThemePaletteId, UserPersonalData, FONT_OPTIONS, RADIUS_OPTIONS } from '@/types';
import { resolveThemePalette } from '@/lib/theme';
import AppShell from '@/components/AppShell';
import LoginScreen from '@/components/LoginScreen';
import MfaChallengeScreen from '@/components/MfaChallengeScreen';
import OnboardingHero from '@/components/OnboardingHero';
import PasswordRecoveryScreen from '@/components/PasswordRecoveryScreen';
import StepColorCustomize from '@/components/StepColorCustomize';
import StepFarmConfig from '@/components/StepFarmConfig';
import StepFinalization from '@/components/StepFinalization';
import StepPersonalData from '@/components/StepPersonalData';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import PWAUpdateBanner from '@/components/PWAUpdateBanner';
import {
  createMyGranja,
  getAuthSecurityStatus,
  getMyLatestGranja,
  getMyUser,
  isSupabaseConfigured,
  setBillingAccessState,
  signOut,
  signUpWithEmail,
  startMyTrial15Days,
  supabase,
  supabaseConfigIssue,
  updateMyGranja,
  upsertMyUser,
  verifyTotpMfa,
} from '@/lib/supabase';

const LOCAL_STORAGE_KEY = 'granjadebolso_onboarding_state';
const DARK_MODE_STORAGE_KEY = 'granjadebolso_dark_mode';
const IDLE_LOGOUT_MS = 30 * 60 * 1000;

const initialDefaultState: OnboardingState = {
  step: 0,
  personal: {
    fullName: '',
    email: '',
    phone: '',
  },
  farm: {
    farmName: '',
    state: '',
    city: '',
    birdCount: 150,
  },
  selectedPalette: 'blue',
  marketingSource: '',
  systemSettings: {
    selectedPalette: 'blue',
    fontFamily: 'inter',
    borderRadius: 'rounded',
    eggSalePrice: 0,
    birdSalePrice: 0,
    litterSalePrice: 0,
    weather: {
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
  },
};

function normalizeState(state: Partial<OnboardingState>): OnboardingState {
  return {
    ...initialDefaultState,
    ...state,
    personal: {
      ...initialDefaultState.personal,
      ...state.personal,
    },
    farm: {
      ...initialDefaultState.farm,
      ...state.farm,
    },
    systemSettings: {
      ...initialDefaultState.systemSettings,
      ...state.systemSettings,
      selectedPalette: state.systemSettings?.selectedPalette ?? state.selectedPalette ?? initialDefaultState.selectedPalette,
    },
    selectedPalette: state.selectedPalette ?? state.systemSettings?.selectedPalette ?? initialDefaultState.selectedPalette,
  };
}

function getPendingOnboardingStep(state: OnboardingState) {
  if (!state.personal.fullName.trim() || !state.personal.email.trim() || !state.personal.phone.trim()) {
    return 1;
  }

  if (!state.farm.farmName.trim() || !state.farm.state.trim() || !state.farm.city.trim()) {
    return 2;
  }

  if (!state.selectedPalette) {
    return 3;
  }

  return 4;
}

function hasCompleteOnboardingData(state: OnboardingState, emailOverride?: string) {
  const email = (emailOverride ?? state.personal.email).trim();
  return Boolean(
    state.personal.fullName.trim() &&
      email &&
      state.personal.phone.trim() &&
      state.farm.farmName.trim() &&
      state.farm.state.trim() &&
      state.farm.city.trim() &&
      state.marketingSource.trim(),
  );
}

export default function App() {
  const [appState, setAppState] = useState<OnboardingState>(initialDefaultState);
  const [loginNotice, setLoginNotice] = useState('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<{ factorId: string; friendlyName: string; email: string | null } | null>(null);
  const [mfaError, setMfaError] = useState('');
  const [isMfaSubmitting, setIsMfaSubmitting] = useState(false);
  const appStateRef = useRef(appState);
  const pendingSignupPasswordRef = useRef('');
  const lastHydratedSessionKeyRef = useRef<string | null>(null);
  const lastAuthStateRef = useRef<string | null>(null);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const clearPendingSignupPassword = useCallback(() => {
    pendingSignupPasswordRef.current = '';
  }, []);

  const clearAuthenticatedClientState = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear local storage state:', e);
    }

    setBillingAccessState({ allowed: true, reason: 'signed_out' });
    appStateRef.current = initialDefaultState;
    setAppState(initialDefaultState);
  }, []);

  const sanitizeForStorage = (state: OnboardingState): OnboardingState => {
    const { password: _legacyPassword, ...safePersonal } = (state.personal ?? {}) as UserPersonalData & { password?: string };

    return normalizeState({
      ...state,
      personal: safePersonal,
    });
  };

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.step === 'number') {
          setAppState(sanitizeForStorage(normalizeState(parsed)));
        }
      }
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
      setIsDarkMode(stored === 'true');
    } catch {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDarkMode));
    } catch {}

    document.documentElement.classList.toggle('dark-theme', isDarkMode);
    document.body.classList.toggle('dark-theme', isDarkMode);
  }, [isDarkMode]);

  const saveState = (updater: OnboardingState | ((prev: OnboardingState) => OnboardingState)) => {
    setAppState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: OnboardingState) => OnboardingState)(prev) : updater;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitizeForStorage(next)));
      } catch (e) {
        console.error('Failed to save state to local storage:', e);
      }
      return next;
    });
  };

  const refreshMfaRequirement = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setMfaChallenge(null);
      setMfaError('');
      return;
    }

    try {
      const status = await getAuthSecurityStatus();
      const verifiedFactor = status.verifiedTotpFactors[0] || null;
      if (verifiedFactor && status.currentLevel !== 'aal2') {
        setMfaChallenge({
          factorId: verifiedFactor.id,
          friendlyName: verifiedFactor.friendlyName,
          email: status.email,
        });
      } else {
        setMfaChallenge(null);
        setMfaError('');
      }
    } catch (error) {
      console.warn('Falha ao avaliar requisito de MFA:', error);
      setMfaChallenge(null);
      setMfaError('');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let isActive = true;

    const syncOnboardingToSupabase = async (state: OnboardingState, emailOverride?: string) => {
      const email = (emailOverride ?? state.personal.email).trim();
      const user = await upsertMyUser({
        full_name: state.personal.fullName,
        email,
        phone: state.personal.phone,
      });

      const granjaPayload = {
        farm_name: state.farm.farmName,
        state: state.farm.state,
        city: state.farm.city,
        bird_count: state.farm.birdCount,
        selected_palette: state.selectedPalette,
        marketing_source: state.marketingSource,
        egg_sale_price: state.systemSettings.eggSalePrice,
        bird_sale_price: state.systemSettings.birdSalePrice,
        litter_sale_price: state.systemSettings.litterSalePrice,
        auto_backup_enabled: false,
        auto_backup_frequency: 'weekly',
        auto_backup_last_run_at: null,
        auto_backup_keep_count: 10,
      };

      const existingGranja = await getMyLatestGranja();
      const granja = existingGranja
        ? await updateMyGranja(existingGranja.id, granjaPayload)
        : await createMyGranja(granjaPayload);

      await startMyTrial15Days();

      return { user, granja };
    };

    const hydrateFromSession = async (email: string) => {
      try {
        let [user, granja] = await Promise.all([getMyUser(), getMyLatestGranja()]);
        const pendingState = appStateRef.current;

        if (!granja && hasCompleteOnboardingData(pendingState, email)) {
          const synced = await syncOnboardingToSupabase(
            {
              ...pendingState,
              personal: {
                ...pendingState.personal,
                email,
              },
            },
            email,
          );
          user = synced.user;
          granja = synced.granja;
        }

        if (!isActive) {
          return;
        }

        const shouldEnterApp = Boolean(granja || user?.app_role === 'admin');

        saveState((prev) => {
          const nextPalette =
            granja?.selected_palette
              ? (granja.selected_palette as ThemePaletteId)
              : prev.selectedPalette;

          const nextState: OnboardingState = {
            ...prev,
            step: shouldEnterApp ? 5 : getPendingOnboardingStep(prev),
            personal: {
              ...prev.personal,
              fullName: user?.full_name || prev.personal.fullName,
              email: email || prev.personal.email,
              phone: user?.phone || prev.personal.phone,
            },
            farm: {
              ...prev.farm,
              farmName: granja?.farm_name || prev.farm.farmName,
              state: granja?.state || prev.farm.state,
              city: granja?.city || prev.farm.city,
              birdCount: typeof granja?.bird_count === 'number' ? granja.bird_count : prev.farm.birdCount,
            },
            selectedPalette: nextPalette,
            marketingSource: granja?.marketing_source ?? prev.marketingSource,
            systemSettings: {
              selectedPalette: nextPalette,
              fontFamily: prev.systemSettings.fontFamily || 'inter',
              borderRadius: prev.systemSettings.borderRadius || 'rounded',
              eggSalePrice: Number(granja?.egg_sale_price ?? prev.systemSettings.eggSalePrice ?? 0),
              birdSalePrice: Number(granja?.bird_sale_price ?? prev.systemSettings.birdSalePrice ?? 0),
              litterSalePrice: Number(granja?.litter_sale_price ?? prev.systemSettings.litterSalePrice ?? 0),
              weather: prev.systemSettings.weather || {
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
            },
          };

          return shouldEnterApp
            ? nextState
            : {
                ...nextState,
                step: getPendingOnboardingStep(nextState),
              };
        });

        if (!isActive) {
          return;
        }

        if (shouldEnterApp) {
          setLoginNotice('');
        } else {
          setLoginNotice('Sua conta foi autenticada, mas a granja inicial ainda não foi salva. Finalize o cadastro para continuar.');
        }
        await refreshMfaRequirement();
      } catch (e: any) {
        console.warn('Falha ao carregar dados do Supabase, continuando com dados locais:', e);
        // Even if there's an error, don't crash the app! Continue with local state!
      }
    };

    const clearSessionState = () => {
      if (!isActive) {
        return;
      }

      setIsPasswordRecovery(false);
      setMfaChallenge(null);
      setMfaError('');
      if (appStateRef.current.step === 5) {
        clearAuthenticatedClientState();
      }
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        lastAuthStateRef.current = event;
        setIsPasswordRecovery(true);
        setLoginNotice('');
        return;
      }

      if (session?.user?.email) {
        const sessionKey = `${session.user.id}:${session.access_token ?? 'no-token'}`;
        const shouldSkipHydration =
          (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
          lastHydratedSessionKeyRef.current === sessionKey;

        lastAuthStateRef.current = event;
        if (shouldSkipHydration) {
          return;
        }

        lastHydratedSessionKeyRef.current = sessionKey;
        setLoginNotice('');
        void hydrateFromSession(session.user.email);
        return;
      }

      if (lastAuthStateRef.current === 'SIGNED_OUT') {
        return;
      }

      lastAuthStateRef.current = 'SIGNED_OUT';
      lastHydratedSessionKeyRef.current = null;
      clearSessionState();
    });

    return () => {
      isActive = false;
      data.subscription.unsubscribe();
    };
  }, [clearAuthenticatedClientState, refreshMfaRequirement]);

  // Immediate live theme sync
  useEffect(() => {
    const activePaletteObj = resolveThemePalette(appState.selectedPalette, appState.systemSettings.customPaletteColor);
    document.documentElement.style.setProperty('--brand-primary', activePaletteObj.themeVars.primary);
    document.documentElement.style.setProperty('--brand-hover', activePaletteObj.themeVars.primaryHover);
    document.documentElement.style.setProperty('--brand-active', activePaletteObj.themeVars.primaryActive);
    document.documentElement.style.setProperty('--brand-bg', activePaletteObj.themeVars.bgContainer);
    document.documentElement.style.setProperty('--brand-main', activePaletteObj.themeVars.bgMain);

    // Inject font & border-radius
    const fontOption = FONT_OPTIONS.find((f) => f.id === appState.systemSettings.fontFamily);
    if (fontOption) {
      document.documentElement.style.setProperty('--app-font', fontOption.css);
      document.body.style.fontFamily = fontOption.css;
    }
    const radiusOption = RADIUS_OPTIONS.find((r) => r.id === appState.systemSettings.borderRadius);
    if (radiusOption) {
      document.documentElement.style.setProperty('--app-radius', radiusOption.value);
    }
  }, [appState.selectedPalette, appState.systemSettings.fontFamily, appState.systemSettings.borderRadius]);

  // View transitions helper
  const handleStartOnboarding = () => {
    clearPendingSignupPassword();
    setLoginNotice('');
    saveState((prev) => ({ ...prev, step: 1 }));
  };

  const handleGoToLogin = () => {
    clearPendingSignupPassword();
    saveState((prev) => ({ ...prev, step: -1 }));
  };

  const handlePersonalDataSubmit = (personalData: UserPersonalData, credentials: RegistrationCredentials) => {
    pendingSignupPasswordRef.current = credentials.password;
    saveState((prev) => ({
      ...prev,
      personal: personalData,
      step: 2,
    }));
  };

  const handleFarmConfigSubmit = (farmData: FarmConfigData) => {
    saveState((prev) => ({
      ...prev,
      farm: farmData,
      step: 3,
    }));
  };

  const handlePaletteSelect = (paletteId: ThemePaletteId, customColor?: string) => {
    saveState((prev) => ({
      ...prev,
      selectedPalette: paletteId,
      systemSettings: {
        ...prev.systemSettings,
        selectedPalette: paletteId,
        ...(customColor ? { customPaletteColor: customColor } : {}),
      },
    }));
  };

  const handleColorCustomizeNext = () => {
    saveState((prev) => ({ ...prev, step: 4 }));
  };

  const handleMarketingComplete = async (source: string) => {
    saveState((prev) => ({ ...prev, marketingSource: source }));

    if (!isSupabaseConfigured) {
      clearPendingSignupPassword();
      if (supabaseConfigIssue === 'service_role') {
        setLoginNotice('Chave do Supabase inválida: você colou uma service_role key. Use a anon public key (Settings → API → anon public).');
      } else {
        setLoginNotice('Supabase não está configurado. Crie ou preencha o arquivo .env na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e reinicie o npm run dev.');
      }
      saveState((prev) => ({ ...prev, step: -1 }));
      return;
    }

    const current = appStateRef.current;
    const email = current.personal.email?.trim();
    const password = pendingSignupPasswordRef.current;
    if (!email || !password) {
      clearPendingSignupPassword();
      setLoginNotice('Finalize o cadastro com e-mail e senha e faça login para sincronizar com a nuvem.');
      saveState((prev) => ({ ...prev, step: -1 }));
      return;
    }

    try {
      const signUpResult = await signUpWithEmail(email, password, {
        full_name: current.personal.fullName,
        phone: current.personal.phone,
      });
      const hasSession = !!signUpResult.session;

      if (!hasSession) {
        setLoginNotice('Conta criada. Confirme seu e-mail e entre para concluir automaticamente o salvamento dos dados da granja.');
        saveState((prev) => ({ ...prev, step: -1 }));
        return;
      }

      const currentWithMarketing = {
        ...current,
        marketingSource: source,
      };

      await upsertMyUser({
        full_name: currentWithMarketing.personal.fullName,
        email,
        phone: currentWithMarketing.personal.phone,
      });

      const existingGranja = await getMyLatestGranja();
      const granjaPayload = {
        farm_name: currentWithMarketing.farm.farmName,
        state: currentWithMarketing.farm.state,
        city: currentWithMarketing.farm.city,
        bird_count: currentWithMarketing.farm.birdCount,
        selected_palette: currentWithMarketing.selectedPalette,
        marketing_source: currentWithMarketing.marketingSource,
        egg_sale_price: currentWithMarketing.systemSettings.eggSalePrice,
        bird_sale_price: currentWithMarketing.systemSettings.birdSalePrice,
        litter_sale_price: currentWithMarketing.systemSettings.litterSalePrice,
        auto_backup_enabled: false,
        auto_backup_frequency: 'weekly',
        auto_backup_last_run_at: null,
        auto_backup_keep_count: 10,
      };

      if (existingGranja) {
        await updateMyGranja(existingGranja.id, granjaPayload);
      } else {
        await createMyGranja(granjaPayload);
      }

      await startMyTrial15Days();

      saveState((prev) => ({ ...prev, step: 5 }));
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : '';
      if (message.toLowerCase().includes('user already registered') || message.toLowerCase().includes('already registered')) {
        setLoginNotice('Este e-mail já possui conta. Entre com sua senha para continuar.');
        saveState((prev) => ({ ...prev, step: -1 }));
        return;
      }
      setLoginNotice(message || 'Falha ao criar conta. Tente novamente.');
      saveState((prev) => ({ ...prev, step: -1 }));
    } finally {
      clearPendingSignupPassword();
    }
  };

  const handleLoginSuccess = () => {
    setLoginNotice('');
  };

  const handleMfaVerify = async (code: string) => {
    if (!mfaChallenge) return;

    try {
      setIsMfaSubmitting(true);
      setMfaError('');
      await verifyTotpMfa(mfaChallenge.factorId, code);
      await refreshMfaRequirement();
    } catch (error: any) {
      setMfaError(error?.message || 'Nao foi possivel validar o segundo fator.');
    } finally {
      setIsMfaSubmitting(false);
    }
  };

  const handlePasswordRecovered = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await signOut();
      }
    } catch (e) {
      console.error('Falha ao encerrar sessao de recuperacao:', e);
    } finally {
      clearAuthenticatedClientState();
      setIsPasswordRecovery(false);
      setMfaChallenge(null);
      setMfaError('');
      setLoginNotice('Senha redefinida com sucesso. Entre com a nova senha.');
      setAppState((prev) => ({ ...initialDefaultState, step: -1, selectedPalette: prev.selectedPalette, systemSettings: prev.systemSettings }));
    }
  }, [clearAuthenticatedClientState]);

  const handleLogout = useCallback(async (reason?: string) => {
    try {
      if (isSupabaseConfigured) {
        await signOut();
      }
    } catch (e) {
      console.error('Falha ao sair:', e);
    } finally {
      clearPendingSignupPassword();
      clearAuthenticatedClientState();
      setIsPasswordRecovery(false);
      setMfaChallenge(null);
      setMfaError('');
      setLoginNotice(reason || '');
    }
  }, [clearAuthenticatedClientState, clearPendingSignupPassword]);

  useEffect(() => {
    if (appState.step !== 5) {
      return;
    }

    let timeoutId = 0;

    const resetIdleTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        void handleLogout('Sua sessão foi encerrada por inatividade. Faça login novamente.');
      }, IDLE_LOGOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        resetIdleTimer();
      }
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resetIdleTimer();

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [appState.step, handleLogout]);

  const handleReset = () => {
    clearPendingSignupPassword();
    setLoginNotice('');
    saveState({ ...initialDefaultState, step: 1 });
  };

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((v) => !v);
  }, []);

  const handlePersonalProfileUpdate = useCallback((personal: Omit<UserPersonalData, 'password'>) => {
    saveState((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        ...personal,
      },
    }));
  }, []);

  const handleFarmProfileUpdate = useCallback((farmProfile: FarmProfileData) => {
    saveState((prev) => ({
      ...prev,
      farm: {
        ...prev.farm,
        farmName: farmProfile.farmName,
        state: farmProfile.state,
        city: farmProfile.city,
        birdCount: farmProfile.birdCount,
      },
      selectedPalette: farmProfile.selectedPalette,
      marketingSource: farmProfile.marketingSource,
      systemSettings: {
        ...prev.systemSettings,
        selectedPalette: farmProfile.selectedPalette,
      },
    }));
  }, []);

  const handleSystemSettingsUpdate = useCallback((systemSettings: SystemSettingsData) => {
    saveState((prev) => ({
      ...prev,
      selectedPalette: systemSettings.selectedPalette,
      systemSettings,
    }));
  }, []);

  const handleSystemPalettePreview = useCallback((paletteId: SystemSettingsData['selectedPalette'], customColor?: string) => {
    setAppState((prev) => ({
      ...prev,
      selectedPalette: paletteId,
      systemSettings: {
        ...prev.systemSettings,
        selectedPalette: paletteId,
        customPaletteColor: customColor || prev.systemSettings.customPaletteColor,
      },
    }));
  }, []);

  return (
    <div className={`w-full min-h-screen bg-brand-main transition-colors ${isDarkMode ? 'dark-theme' : ''}`}>
      {/* Switch Screens dynamically based on step index */}
      {!isPasswordRecovery && appState.step === -1 && (
        <LoginScreen
          onLogin={handleLoginSuccess}
          onGoToSignup={handleReset}
          initialEmail={appState.personal.email}
          notice={loginNotice}
        />
      )}

      {isPasswordRecovery && (
        <PasswordRecoveryScreen onRecovered={handlePasswordRecovered} />
      )}

      {!isPasswordRecovery && appState.step === 0 && (
        <OnboardingHero
          onStart={handleStartOnboarding}
          onGoToLogin={handleGoToLogin}
        />
      )}

      {!isPasswordRecovery && appState.step === 1 && (
        <StepPersonalData
          initialData={appState.personal}
          onNext={handlePersonalDataSubmit}
          onBack={() => {
            clearPendingSignupPassword();
            saveState((prev) => ({ ...prev, step: 0 }));
          }}
        />
      )}

      {!isPasswordRecovery && appState.step === 2 && (
        <StepFarmConfig
          initialData={appState.farm}
          onNext={handleFarmConfigSubmit}
          onBack={() => saveState((prev) => ({ ...prev, step: 1 }))}
        />
      )}

      {!isPasswordRecovery && appState.step === 3 && (
        <StepColorCustomize
          selectedPalette={appState.selectedPalette}
          onChangePalette={handlePaletteSelect}
          onNext={handleColorCustomizeNext}
          onBack={() => saveState((prev) => ({ ...prev, step: 2 }))}
        />
      )}

      {!isPasswordRecovery && appState.step === 4 && (
        <StepFinalization
          initialSource={appState.marketingSource}
          onBack={() => saveState((prev) => ({ ...prev, step: 3 }))}
          onComplete={handleMarketingComplete}
        />
      )}

      {!isPasswordRecovery && appState.step === 5 && (
        mfaChallenge ? (
          <MfaChallengeScreen
            email={mfaChallenge.email}
            factorName={mfaChallenge.friendlyName}
            errorMessage={mfaError}
            isSubmitting={isMfaSubmitting}
            onVerify={handleMfaVerify}
            onLogout={handleLogout}
          />
        ) : (
          <AppShell
            appState={appState}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onUpdatePersonalProfile={handlePersonalProfileUpdate}
            onUpdateFarmProfile={handleFarmProfileUpdate}
            onUpdateSystemSettings={handleSystemSettingsUpdate}
            onPreviewSystemPaletteChange={handleSystemPalettePreview}
          />
        )
      )}

      {/* PWA Banners — visíveis em todas as telas */}
      <PWAUpdateBanner />
      <PWAInstallBanner />
    </div>
  );
}
