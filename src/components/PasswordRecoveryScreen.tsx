/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { validatePasswordPolicy } from '@/lib/passwordSecurity';
import { updateCurrentUserPassword } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';

interface PasswordRecoveryScreenProps {
  onRecovered: () => void;
}

export default function PasswordRecoveryScreen({ onRecovered }: PasswordRecoveryScreenProps) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const passwordPolicy = validatePasswordPolicy(password);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!passwordPolicy.isValid) {
      const message = `A nova senha ainda nao atende aos requisitos: ${passwordPolicy.messages.join(', ')}.`;
      setErrorMessage(message);
      toast.warning('Senha fraca', message, 6500);
      return;
    }

    if (password !== confirmPassword) {
      const message = 'As senhas informadas nao coincidem.';
      setErrorMessage(message);
      toast.warning('Senhas diferentes', message);
      return;
    }

    try {
      setIsSaving(true);
      await updateCurrentUserPassword(password);
      setPassword('');
      setConfirmPassword('');
      toast.success('Senha redefinida', 'Sua nova senha foi salva com sucesso.');
      onRecovered();
    } catch (error: any) {
      const message = error?.message || 'Nao foi possivel redefinir a senha. Solicite um novo link e tente novamente.';
      setErrorMessage(message);
      toast.error('Falha ao redefinir senha', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-brand-main min-h-screen flex items-center justify-center px-4 py-8 font-sans text-[#0f1c2b]">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-bg text-brand-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Criar nova senha</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">Use uma senha forte para proteger sua conta.</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Nova senha</span>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-full border border-gray-300 bg-slate-50 py-3 pl-12 pr-12 text-sm outline-none transition-colors focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
                placeholder="Minimo 12 caracteres com simbolos"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Confirmar senha</span>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-full border border-gray-300 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition-colors focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
                placeholder="Repita sua nova senha"
                required
              />
            </div>
          </label>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {passwordPolicy.checks.map((check) => (
                <div key={check.id} className={`flex items-center gap-2 ${check.id === 'notPersonal' ? 'sm:col-span-2' : ''}`}>
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${check.passed ? 'border-green-300 bg-green-100 text-green-700' : 'border-gray-300 bg-slate-100 text-gray-300'}`}>
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className={`text-[11px] font-semibold ${check.passed ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {errorMessage && <p className="text-xs font-medium text-red-700">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="flex h-11 w-full items-center justify-center rounded-full bg-brand-primary px-4 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
