/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Mail, Lock, ArrowRight, Wheat, Eye, EyeOff, LineChart, ShieldCheck, Beaker, Sprout, CheckCircle2 } from 'lucide-react';
import { requestPasswordResetEmail, resendSignupConfirmationEmail, signInWithEmail, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';

interface LoginScreenProps {
  onLogin: () => void;
  onGoToSignup: () => void;
  initialEmail?: string;
  notice?: string;
}

export default function LoginScreen({ onLogin, onGoToSignup, initialEmail, notice }: LoginScreenProps) {
  const toast = useToast();
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginCooldownUntil, setLoginCooldownUntil] = useState(0);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (notice) {
      toast.info('Aviso da conta', notice);
    }
  }, [notice, toast]);

  useEffect(() => {
    if (authNotice) {
      toast.success('Tudo certo', authNotice);
    }
  }, [authNotice, toast]);

  useEffect(() => {
    if (authError) {
      toast.error('Falha na autenticação', authError);
    }
  }, [authError, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setNeedsEmailConfirmation(false);

    const now = Date.now();
    if (now < loginCooldownUntil) {
      const remainingSeconds = Math.ceil((loginCooldownUntil - now) / 1000);
      setAuthError(`Muitas tentativas. Tente novamente em ${remainingSeconds} segundos.`);
      return;
    }

    if (!isSupabaseConfigured) {
      setAuthError('Falha ao conectar com o servidor. Por favor, verifique sua conexão ou tente novamente mais tarde.');
      return;
    }

    if (!email.trim() || !password) {
      setAuthError('Por favor, preencha todos os campos do formulário.');
      return;
    }

    try {
      await signInWithEmail(email.trim(), password);
      setPassword('');
      setLoginAttempts(0);
      onLogin();
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : '';
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setLoginCooldownUntil(Date.now() + 60000); // 1 minute cooldown
      }

      if (message.toLowerCase().includes('invalid login credentials')) {
        setAuthError('E-mail ou senha inválidos.');
        return;
      }
      if (message.toLowerCase().includes('email not confirmed')) {
        setAuthError('Confirme seu e-mail antes de entrar.');
        setNeedsEmailConfirmation(true);
        return;
      }
      setAuthError(message || 'Falha ao autenticar. Tente novamente.');
    }
  };

  const handleRequestPasswordReset = async () => {
    setAuthError('');
    setAuthNotice('');
    setNeedsEmailConfirmation(false);

    if (!isSupabaseConfigured) {
      setAuthError('Falha ao conectar com o servidor. Tente novamente mais tarde.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setAuthError('Informe seu e-mail para receber o link de redefinicao.');
      return;
    }

    try {
      setIsResettingPassword(true);
      await requestPasswordResetEmail(trimmedEmail);
      setPassword('');
      setAuthNotice('Enviamos um link seguro para redefinir sua senha. Verifique seu e-mail.');
    } catch (error: any) {
      setAuthError(error?.message || 'Nao foi possivel enviar o link de redefinicao.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleResendConfirmation = async () => {
    setAuthError('');
    setAuthNotice('');

    const trimmedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setAuthError('Informe o e-mail cadastrado para reenviar a confirmação.');
      return;
    }

    try {
      setIsResendingConfirmation(true);
      await resendSignupConfirmationEmail(trimmedEmail);
      setAuthNotice('Reenviamos o e-mail de confirmação. Verifique sua caixa de entrada e spam.');
    } catch (error: any) {
      setAuthError(error?.message || 'Nao foi possivel reenviar a confirmação do e-mail.');
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  return (
    <div className="bg-brand-main text-on-surface min-h-screen flex items-center justify-center font-sans antialiased selection:bg-brand-primary selection:text-white">
      <div className="w-full min-h-screen flex flex-col md:flex-row">
        {/* Left Side: Hero Image and Advantages (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-1/2 lg:w-7/12 relative bg-[#0f1c2b] overflow-hidden flex-col justify-between p-12">
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{ backgroundImage: `url('/hero_background.png')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1c2b]/95 via-[#0f1c2b]/50 to-transparent" />
          
          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <Wheat className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Granja de Bolso</h2>
              <p className="text-xs text-brand-primary uppercase tracking-widest font-bold">Ecossistema Avícola</p>
            </div>
          </div>

          {/* Center Advantages */}
          <div className="relative z-10 my-auto py-6">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white mb-3 leading-tight">
              A gestão da sua granja <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-[#80c0ff]">elevada a outro nível.</span>
            </h3>
            <p className="text-slate-300 text-xs lg:text-sm font-medium mb-6 max-w-lg leading-relaxed">
              Assuma o controle total da sua produção caipira. Da formulação inteligente de ração até a venda final, simplificamos o complexo para você focar no que importa: resultados.
            </p>

            <div className="grid gap-3">
              {[
                { icon: LineChart, title: "Zootecnia & Rentabilidade", desc: "Acompanhe mortalidade, postura, peso e margem de lucro por lote." },
                { icon: Beaker, title: "Formulação Precisa", desc: "Cálculo automático de nutrientes para reduzir custos com ração." },
                { icon: ShieldCheck, title: "Sanidade & Bem-estar", desc: "Controle de vacinas, protocolos e alertas sanitários em dia." },
                { icon: Sprout, title: "Manejo Inteligente", desc: "Gestão de galpões, piquetes, iluminação e ambiência da granja." },
              ].map((adv, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="mt-1 p-2 bg-brand-primary/20 rounded-lg text-brand-primary">
                    <adv.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">{adv.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{adv.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-slate-400 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Feito por quem entende: criado de avicultor para avicultor.</span>
            </div>
            <span>v3.1.0</span>
          </div>
        </div>

        {/* Right Side: Form Canvas */}
        <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 md:p-8 bg-white h-screen overflow-y-auto">
          <div className="w-full max-w-sm flex flex-col gap-5 my-auto">
            
            {/* Header / Logo Area */}
            <div className="flex flex-col items-center mb-6">
              <img
                src="/logo.png"
                alt="Logo Granja de Bolso"
                className="w-36 h-36 md:w-44 md:h-44 object-contain drop-shadow-sm mb-2"
              />
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">
                Acesse sua conta para continuar
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Email Input Group */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700" htmlFor="email-login">
                  Email Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="email-login"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.com"
                    className="w-full bg-slate-50 border border-gray-300 text-sm text-[#0f1c2b] py-2.5 pl-12 pr-4 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-colors rounded-full"
                  />
                </div>
              </div>

              {/* Password Input Group */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700" htmlFor="password-login">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    id="password-login"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-gray-300 text-sm text-[#0f1c2b] py-2.5 pl-12 pr-12 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-colors rounded-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Utilities Row: Remember & Forget */}
              <div className="flex items-center justify-between mt-1 mb-2">
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary focus:ring-offset-white bg-slate-50 cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="text-xs font-semibold text-gray-500 cursor-pointer select-none"
                  >
                    Lembrar-me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleRequestPasswordReset}
                  disabled={isResettingPassword}
                  className="text-xs font-bold text-brand-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResettingPassword ? 'Enviando...' : 'Esqueci minha senha'}
                </button>
              </div>

              {needsEmailConfirmation && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-900">Confirmação pendente</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-amber-800">
                    Confirme seu e-mail para concluir o acesso. Se precisar, reenvie a mensagem de confirmação abaixo.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isResendingConfirmation}
                    className="mt-3 w-full rounded-full border border-brand-primary/30 bg-brand-primary/5 px-4 py-2.5 text-xs font-bold text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResendingConfirmation ? 'Reenviando confirmação...' : 'Reenviar e-mail de confirmação'}
                  </button>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                className="w-full h-11 bg-brand-primary text-white font-bold py-3 hover:bg-brand-hover active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-sm rounded-full cursor-pointer text-sm"
              >
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Footer Sign Up Link */}
            <div className="text-center text-xs font-semibold text-gray-500 mt-2">
              Não tem uma conta?{' '}
              <button
                onClick={onGoToSignup}
                className="text-brand-primary hover:underline font-bold"
              >
                Cadastre-se
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
