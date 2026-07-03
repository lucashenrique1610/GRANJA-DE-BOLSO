import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FarmProfileData, THEME_PALETTES, UserPersonalData } from '@/types';
import { resolveThemePalette } from '@/lib/theme';
import {
  enrollTotpMfa,
  getAuthSecurityStatus,
  resendSignupConfirmationEmail,
  type AuthSecurityStatus,
  type TotpEnrollment,
  unenrollMfaFactor,
  verifyTotpMfa,
} from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';

type PersonalProfileInput = Omit<UserPersonalData, 'password'>;

interface PerfilPageProps {
  personal: PersonalProfileInput;
  farm: FarmProfileData;
  isSyncing?: boolean;
  errorMessage?: string;
  onSavePersonal: (data: PersonalProfileInput) => Promise<void> | void;
  onSaveFarm: (data: FarmProfileData) => Promise<void> | void;
}

const marketingOptions = [
  { value: 'social', label: 'Redes sociais' },
  { value: 'referral', label: 'Indicação' },
  { value: 'search', label: 'Pesquisa no Google' },
  { value: 'events', label: 'Eventos' },
  { value: 'other', label: 'Outros' },
];

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-[#0f1c2b]">{value}</div>
    </div>
  );
}

export default function PerfilPage({
  personal,
  farm,
  isSyncing,
  errorMessage,
  onSavePersonal,
  onSaveFarm,
}: PerfilPageProps) {
  const toast = useToast();
  const [personalDraft, setPersonalDraft] = useState<PersonalProfileInput>(personal);
  const [farmDraft, setFarmDraft] = useState<FarmProfileData>(farm);
  const [securityStatus, setSecurityStatus] = useState<AuthSecurityStatus | null>(null);
  const [isSecurityLoading, setIsSecurityLoading] = useState(true);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [isRemovingMfa, setIsRemovingMfa] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEnrollment, setPendingEnrollment] = useState<TotpEnrollment | null>(null);

  useEffect(() => {
    setPersonalDraft(personal);
  }, [personal]);

  useEffect(() => {
    setFarmDraft(farm);
  }, [farm]);

  const loadSecurityStatus = useCallback(async () => {
    try {
      setIsSecurityLoading(true);
      const nextStatus = await getAuthSecurityStatus();
      setSecurityStatus(nextStatus);
    } catch (error: any) {
      toast.error('Falha ao carregar segurança', error?.message || 'Nao foi possivel carregar o status de seguranca da conta.');
    } finally {
      setIsSecurityLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSecurityStatus();
  }, [loadSecurityStatus]);

  const summary = useMemo(
    () => [
      { label: 'Responsável', value: personal.fullName || 'Não informado' },
      { label: 'Granja', value: farm.farmName || 'Não informada' },
      { label: 'Plantel', value: `${farm.birdCount || 0} aves` },
    ],
    [farm.birdCount, farm.farmName, personal.fullName],
  );

  const handlePersonalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSavePersonal({
      fullName: personalDraft.fullName.trim(),
      email: personalDraft.email.trim(),
      phone: personalDraft.phone.trim(),
    });
    toast.success('Perfil pessoal salvo', 'Seus dados principais foram atualizados com sucesso.');
  };

  const handleFarmSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSaveFarm({
      ...farmDraft,
      farmName: farmDraft.farmName.trim(),
      state: farmDraft.state.trim(),
      city: farmDraft.city.trim(),
      marketingSource: farmDraft.marketingSource.trim(),
    });
    toast.success('Perfil da granja salvo', 'As informações da granja foram atualizadas com sucesso.');
  };

  const handleResendConfirmation = async () => {
    if (!securityStatus?.email) return;

    try {
      setIsResendingConfirmation(true);
      await resendSignupConfirmationEmail(securityStatus.email);
      toast.success('Confirmação reenviada', 'Verifique sua caixa de entrada e a pasta de spam.');
    } catch (error: any) {
      toast.error('Falha ao reenviar confirmação', error?.message || 'Nao foi possivel reenviar a confirmação de e-mail.');
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const handleEnrollMfa = async () => {
    try {
      setIsEnrollingMfa(true);
      setVerificationCode('');
      const enrollment = await enrollTotpMfa('Granja de Bolso');
      setPendingEnrollment(enrollment);
      toast.info('MFA iniciado', 'Escaneie o QR Code no aplicativo autenticador e confirme com o código de 6 dígitos.', 6500);
      await loadSecurityStatus();
    } catch (error: any) {
      toast.error('Falha ao ativar MFA', error?.message || 'Nao foi possivel iniciar o cadastro do MFA.');
    } finally {
      setIsEnrollingMfa(false);
    }
  };

  const handleVerifyEnrollment = async () => {
    if (!pendingEnrollment) return;

    try {
      setIsVerifyingMfa(true);
      await verifyTotpMfa(pendingEnrollment.factorId, verificationCode);
      setPendingEnrollment(null);
      setVerificationCode('');
      toast.success('MFA ativado', 'No próximo acesso, o sistema passará a exigir o segundo fator.');
      await loadSecurityStatus();
    } catch (error: any) {
      toast.error('Falha ao validar MFA', error?.message || 'Nao foi possivel validar o codigo do aplicativo autenticador.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleUnenrollFactor = async (factorId: string) => {
    if (!window.confirm('Deseja realmente remover este fator MFA? O proximo login voltara a depender apenas da senha.')) {
      return;
    }

    try {
      setIsRemovingMfa(true);
      await unenrollMfaFactor(factorId);
      setPendingEnrollment(null);
      setVerificationCode('');
      toast.success('MFA removido', 'O próximo login voltará a depender apenas da senha.');
      await loadSecurityStatus();
    } catch (error: any) {
      toast.error('Falha ao remover MFA', error?.message || 'Nao foi possivel remover o fator MFA.');
    } finally {
      setIsRemovingMfa(false);
    }
  };

  return (
    <div className="app-section space-y-6">
      <section className="app-section-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="app-section-badge">Configurações</div>
            <h1 className="app-section-title">Configurações • Perfil</h1>
            <p className="app-section-description">
              Atualize os dados do cadastro do usuário e mantenha o perfil principal da granja sempre correto.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
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

      <section className="grid gap-6 xl:grid-cols-2">
        <form className="app-section-card space-y-5" onSubmit={handlePersonalSubmit}>
          <div>
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Perfil pessoal</h2>
            <p className="mt-1 text-sm text-gray-500">
              Estes dados são salvos na tabela `users` e identificam o responsável pela conta.
            </p>
          </div>

          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Nome completo</span>
              <input
                type="text"
                required
                value={personalDraft.fullName}
                onChange={(event) => setPersonalDraft((prev) => ({ ...prev, fullName: event.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="Digite o nome do responsável"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">E-mail</span>
              <input
                type="email"
                required
                value={personalDraft.email}
                onChange={(event) => setPersonalDraft((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="nome@empresa.com"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Telefone</span>
              <input
                type="tel"
                required
                value={personalDraft.phone}
                onChange={(event) => setPersonalDraft((prev) => ({ ...prev, phone: event.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="(00) 00000-0000"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSyncing}
              className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSyncing ? 'Salvando...' : 'Salvar perfil pessoal'}
            </button>
          </div>
        </form>

        <form className="app-section-card space-y-5" onSubmit={handleFarmSubmit}>
          <div>
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Perfil da granja</h2>
            <p className="mt-1 text-sm text-gray-500">
              Atualize os dados principais da operação salvos na tabela `granjas`.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Nome da granja</span>
              <input
                type="text"
                required
                value={farmDraft.farmName}
                onChange={(event) => setFarmDraft((prev) => ({ ...prev, farmName: event.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="Ex: Granja São José"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Estado</span>
              <input
                type="text"
                required
                value={farmDraft.state}
                onChange={(event) => setFarmDraft((prev) => ({ ...prev, state: event.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="UF"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Cidade</span>
              <input
                type="text"
                required
                value={farmDraft.city}
                onChange={(event) => setFarmDraft((prev) => ({ ...prev, city: event.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="Cidade principal"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Quantidade de aves</span>
              <input
                type="number"
                min={0}
                required
                value={farmDraft.birdCount}
                onChange={(event) =>
                  setFarmDraft((prev) => ({ ...prev, birdCount: Number(event.target.value || 0) }))
                }
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder="0"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Origem do cadastro</span>
              <select
                required
                value={farmDraft.marketingSource}
                onChange={(event) => setFarmDraft((prev) => ({ ...prev, marketingSource: event.target.value }))}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">Selecione</option>
                {marketingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Paleta principal</span>
              <div className="flex items-center gap-2">
                <select
                  value={farmDraft.selectedPalette}
                  onChange={(event) =>
                    setFarmDraft((prev) => ({ ...prev, selectedPalette: event.target.value as FarmProfileData['selectedPalette'] }))
                  }
                  className="flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  {Object.values(THEME_PALETTES).map((palette) => (
                    <option key={palette.id} value={palette.id}>
                      {palette.name}
                    </option>
                  ))}
                </select>
                {farmDraft.selectedPalette === 'custom' && (
                  <div className="relative">
                    <input
                      type="color"
                      value={farmDraft.customPaletteColor || '#6366f1'}
                      onChange={(e) => {
                        const color = e.target.value;
                        setFarmDraft(prev => ({ ...prev, customPaletteColor: color }));
                      }}
                      className="h-[46px] w-[46px] rounded-xl border border-gray-300 cursor-pointer p-1"
                      title="Escolha sua cor personalizada"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSyncing}
              className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSyncing ? 'Salvando...' : 'Salvar perfil da granja'}
            </button>
          </div>
        </form>
      </section>

      <section className="app-section-card space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-[#0f1c2b]">Segurança da conta</h2>
          <p className="mt-1 text-sm text-gray-500">
            O hash da senha é gerenciado pelo Supabase Auth. Aqui você valida confirmação de e-mail e segundo fator TOTP para manter o modelo zero-knowledge.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="E-mail confirmado"
            value={securityStatus?.emailConfirmed ? 'Sim' : isSecurityLoading ? 'Carregando...' : 'Pendente'}
          />
          <SummaryCard
            label="MFA TOTP"
            value={securityStatus?.verifiedTotpFactors.length ? 'Ativo' : isSecurityLoading ? 'Carregando...' : 'Inativo'}
          />
          <SummaryCard
            label="Nível AAL"
            value={securityStatus?.currentLevel?.toUpperCase() || (isSecurityLoading ? 'Carregando...' : 'AAL1')}
          />
        </div>

        {!securityStatus?.emailConfirmed && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-900">Confirmação de e-mail pendente.</p>
            <p className="mt-1 text-xs text-amber-800">
              Enquanto o e-mail nao estiver confirmado, a conta continua dependente do fluxo de verificação enviado pelo Supabase.
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isResendingConfirmation || !securityStatus?.email}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResendingConfirmation ? 'Reenviando confirmação...' : 'Reenviar e-mail de confirmação'}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#0f1c2b]">Autenticação multifator TOTP</h3>
              <p className="mt-1 text-xs text-gray-500">
                Depois de configurado e verificado, o app passa a exigir o código do autenticador antes de liberar o acesso completo.
              </p>
            </div>
            {!pendingEnrollment && securityStatus && securityStatus.verifiedTotpFactors.length === 0 && (
              <button
                type="button"
                onClick={handleEnrollMfa}
                disabled={isEnrollingMfa}
                className="rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEnrollingMfa ? 'Preparando MFA...' : 'Ativar MFA'}
              </button>
            )}
          </div>

          {securityStatus?.verifiedTotpFactors.length ? (
            <div className="mt-4 space-y-3">
              {securityStatus.verifiedTotpFactors.map((factor) => (
                <div key={factor.id} className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0f1c2b]">{factor.friendlyName}</p>
                    <p className="text-xs text-gray-500">
                      Tipo: {factor.factorType.toUpperCase()} • Status: {factor.status} • Criado em {factor.createdAt ? new Date(factor.createdAt).toLocaleString('pt-BR') : 'data indisponível'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnenrollFactor(factor.id)}
                    disabled={isRemovingMfa}
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRemovingMfa ? 'Removendo...' : 'Remover MFA'}
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {pendingEnrollment && (
            <div className="mt-4 space-y-4 rounded-2xl border border-blue-200 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-[#0f1c2b]">Passo 1: escaneie o QR Code</p>
                <p className="mt-1 text-xs text-gray-500">
                  Use Google Authenticator, Microsoft Authenticator, 1Password ou outro aplicativo TOTP.
                </p>
              </div>

              <div className="flex justify-center rounded-2xl border border-dashed border-blue-200 bg-slate-50 p-4">
                <div
                  className="h-52 w-52 [&_svg]:h-full [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: pendingEnrollment.qrCodeSvg }}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Chave secreta manual</p>
                <p className="mt-2 break-all font-mono text-sm text-[#0f1c2b]">{pendingEnrollment.secret}</p>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Passo 2: informe o código de 6 dígitos</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="000000"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleVerifyEnrollment}
                  disabled={verificationCode.length !== 6 || isVerifyingMfa}
                  className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifyingMfa ? 'Validando...' : 'Confirmar MFA'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingEnrollment(null);
                    setVerificationCode('');
                  }}
                  className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
