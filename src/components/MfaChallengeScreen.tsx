import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface MfaChallengeScreenProps {
  email?: string | null;
  factorName?: string;
  errorMessage?: string;
  isSubmitting?: boolean;
  onVerify: (code: string) => Promise<void> | void;
  onLogout: () => Promise<void> | void;
}

export default function MfaChallengeScreen({
  email,
  factorName,
  errorMessage,
  isSubmitting,
  onVerify,
  onLogout,
}: MfaChallengeScreenProps) {
  const toast = useToast();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (errorMessage) {
      toast.error('Código inválido', errorMessage);
    }
  }, [errorMessage, toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onVerify(code);
  };

  return (
    <div className="min-h-screen bg-brand-main px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-primary/10 text-brand-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-2xl font-extrabold text-[#0f1c2b]">Verificação em duas etapas</h1>
            <p className="mt-2 text-sm text-gray-500">
              Digite o código do seu aplicativo autenticador para concluir a entrada{email ? ` da conta ${email}` : ''}.
            </p>
            {factorName && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                Fator ativo: {factorName}
              </p>
            )}
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Código TOTP</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-full border border-gray-300 bg-slate-50 py-3 pl-12 pr-4 text-center text-lg font-bold tracking-[0.35em] text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  placeholder="000000"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={code.length !== 6 || isSubmitting}
              className="w-full rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Validando...' : 'Confirmar código'}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Sair da conta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
