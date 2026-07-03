import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastRecord extends Required<Pick<ToastInput, 'title' | 'variant'>> {
  id: string;
  description?: string;
  durationMs: number;
}

interface ToastContextValue {
  showToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
  success: (title: string, description?: string, durationMs?: number) => string;
  error: (title: string, description?: string, durationMs?: number) => string;
  warning: (title: string, description?: string, durationMs?: number) => string;
  info: (title: string, description?: string, durationMs?: number) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS: Record<ToastVariant, number> = {
  success: 4200,
  error: 5600,
  warning: 5000,
  info: 4500,
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const accentClass =
    toast.variant === 'success'
      ? 'border-emerald-400/70'
      : toast.variant === 'error'
        ? 'border-rose-400/70'
        : toast.variant === 'warning'
          ? 'border-amber-400/70'
          : 'border-sky-400/70';

  const iconWrapperClass =
    toast.variant === 'success'
      ? 'bg-emerald-500/18 text-emerald-200'
      : toast.variant === 'error'
        ? 'bg-rose-500/18 text-rose-200'
        : toast.variant === 'warning'
          ? 'bg-amber-500/18 text-amber-100'
          : 'bg-sky-500/18 text-sky-100';

  const progressClass =
    toast.variant === 'success'
      ? 'bg-emerald-400/90'
      : toast.variant === 'error'
        ? 'bg-rose-400/90'
        : toast.variant === 'warning'
          ? 'bg-amber-400/90'
          : 'bg-sky-400/90';

  const Icon =
    toast.variant === 'success'
      ? CheckCircle2
      : toast.variant === 'error'
        ? AlertCircle
        : toast.variant === 'warning'
          ? TriangleAlert
          : Info;

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className={`pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl border bg-slate-950/92 text-white shadow-2xl backdrop-blur ${accentClass}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${iconWrapperClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold tracking-tight">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{toast.description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
          aria-label="Fechar notificação"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-1 w-full bg-white/6">
        <div
          className={`h-full origin-left animate-[toast-progress_linear_forwards] ${progressClass}`}
          style={{ animationDuration: `${toast.durationMs}ms` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = 'info', durationMs }: ToastInput) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const resolvedDuration = durationMs ?? TOAST_DURATION_MS[variant];
      const nextToast: ToastRecord = {
        id,
        title,
        description,
        variant,
        durationMs: resolvedDuration,
      };

      setToasts((current) => [...current.slice(-3), nextToast]);
      window.setTimeout(() => dismissToast(id), resolvedDuration);
      return id;
    },
    [dismissToast],
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
      success: (title, description, durationMs) => showToast({ title, description, durationMs, variant: 'success' }),
      error: (title, description, durationMs) => showToast({ title, description, durationMs, variant: 'error' }),
      warning: (title, description, durationMs) => showToast({ title, description, durationMs, variant: 'warning' }),
      info: (title, description, durationMs) => showToast({ title, description, durationMs, variant: 'info' }),
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(100vw-2rem,28rem)] flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div key={toast.id}>
            <ToastCard toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider.');
  }

  return context;
}
