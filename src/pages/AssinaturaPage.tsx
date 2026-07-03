import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Crown,
  LifeBuoy,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import {
  BillingAccessView,
  BillingPlanView,
  BillingStatusResponse,
  createCheckoutSession,
  createPortalSession,
  fetchBillingStatus,
} from '@/lib/billing';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
});

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function translateStatus(status: string | null | undefined) {
  switch (status) {
    case 'active':
      return 'Ativa';
    case 'legacy_active':
      return 'Acesso legado';
    case 'trialing':
      return 'Em teste';
    case 'trial_expired':
      return 'Teste expirado';
    case 'past_due':
      return 'Pagamento pendente';
    case 'unpaid':
      return 'Pagamento em atraso';
    case 'canceled':
      return 'Cancelada';
    case 'incomplete':
      return 'Aguardando confirmação';
    case 'incomplete_expired':
      return 'Expirada';
    default:
      return 'Sem assinatura';
  }
}

function statusClassName(status: string | null | undefined) {
  switch (status) {
    case 'active':
    case 'legacy_active':
    case 'trialing':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'trial_expired':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'past_due':
    case 'unpaid':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function formatCycle(plan: BillingPlanView) {
  if (plan.interval === 'year') {
    return 'por ano';
  }

  if (plan.intervalCount === 1) {
    return 'por mês';
  }

  return `a cada ${plan.intervalCount} meses`;
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  return dateFormatter.format(new Date(value));
}

function SummaryMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-brand-primary shadow-sm">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-lg font-extrabold text-[#0f1c2b]">{value}</div>
    </div>
  );
}

interface AssinaturaPageProps {
  initialBillingData?: BillingStatusResponse | null;
  onBillingDataChange?: (data: BillingStatusResponse) => void;
}

function getAccessBanner(access: BillingAccessView | undefined) {
  if (!access) {
    return null;
  }

  if (access.reason === 'promoter_free_access') {
    return {
      tone: 'emerald',
      title: 'Acesso gratuito de divulgador',
      message:
        'Sua conta foi liberada como divulgador e pode usar todos os modulos do sistema sem cobranca recorrente.',
    };
  }

  if (access.reason === 'trial_active') {
    return {
      tone: 'emerald',
      title: 'Teste grátis ativo',
      message:
        access.trialDaysRemaining > 0
          ? `Seu acesso está liberado por mais ${access.trialDaysRemaining} dia(s). Escolha um plano quando quiser para evitar bloqueio ao final do período.`
          : 'Seu teste grátis está ativo no momento.',
    };
  }

  if (access.reason === 'trial_expired') {
    return {
      tone: 'rose',
      title: 'Teste grátis encerrado',
      message:
        'Seu período de teste de 15 dias terminou. Escolha um plano para liberar novamente todos os módulos do aplicativo.',
    };
  }

  if (access.reason === 'subscription_required' || access.reason === 'entitlement_missing') {
    return {
      tone: 'amber',
      title: 'Assinatura necessária',
      message:
        'Sua conta precisa de uma assinatura ativa para voltar a usar os módulos do sistema.',
    };
  }

  return null;
}

export default function AssinaturaPage({
  initialBillingData = null,
  onBillingDataChange,
}: AssinaturaPageProps) {
  const toast = useToast();
  const [billingData, setBillingData] = useState<BillingStatusResponse | null>(initialBillingData);
  const [isLoading, setIsLoading] = useState(!initialBillingData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionPlanCode, setActionPlanCode] = useState<string | null>(null);
  const [isManagingPortal, setIsManagingPortal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!initialBillingData) {
      return;
    }

    setBillingData(initialBillingData);
    setIsLoading(false);
  }, [initialBillingData]);

  const loadBillingStatus = useCallback(async (showBackgroundLoader = false) => {
    setErrorMessage('');

    if (showBackgroundLoader) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetchBillingStatus();
      setBillingData(response);
      onBillingDataChange?.(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar os dados da assinatura.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onBillingDataChange]);

  useEffect(() => {
    loadBillingStatus(Boolean(initialBillingData));
  }, [initialBillingData, loadBillingStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billingResult = params.get('billing');

    if (!billingResult) {
      return;
    }

    if (billingResult === 'success') {
      toast.success(
        'Pagamento iniciado com sucesso',
        'Assim que a Stripe confirmar a assinatura, o status sera atualizado aqui.',
      );
      loadBillingStatus(true);
    } else if (billingResult === 'cancelled') {
      toast.warning(
        'Checkout cancelado',
        'Nenhuma cobranca foi concluida. Voce pode escolher outro plano quando quiser.',
      );
    } else if (billingResult === 'portal-return') {
      toast.info(
        'Portal encerrado',
        'As alteracoes realizadas no portal da Stripe serao refletidas nesta tela.',
      );
      loadBillingStatus(true);
    }

    params.delete('billing');
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [loadBillingStatus, toast]);

  const subscription = billingData?.subscription || null;
  const access = billingData?.access;
  const accessBanner = getAccessBanner(access);

  const highlightedPlan = useMemo(
    () => billingData?.plans.find((plan) => plan.highlight) || null,
    [billingData],
  );

  const currentPlanName =
    access?.reason === 'promoter_free_access' && !subscription?.stripeSubscriptionId
      ? 'Acesso gratuito de divulgador'
      : subscription?.planName || 'Sem assinatura ativa';
  const currentStatus =
    access?.reason === 'promoter_free_access'
      ? 'Liberado sem cobranca'
      : translateStatus(subscription?.status);

  const summaryItems = useMemo(
    () => [
      {
        label: 'Plano atual',
        value: currentPlanName,
        icon: <BadgeCheck className="h-4 w-4" />,
      },
      {
        label: 'Status',
        value: currentStatus,
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        label:
          access?.reason === 'promoter_free_access'
            ? 'Liberacao desde'
            : subscription?.status === 'trialing'
            ? 'Fim do teste'
            : 'Proxima cobranca',
        value:
          access?.reason === 'promoter_free_access'
            ? formatDate(access.promoterEnabledAt || null)
            : formatDate(subscription?.trialEndsAt || subscription?.currentPeriodEnd || null),
        icon: <CalendarClock className="h-4 w-4" />,
      },
      {
        label: 'Valor atual',
        value:
          access?.reason === 'promoter_free_access'
            ? 'Gratuito'
            : typeof subscription?.amountCents === 'number'
            ? currencyFormatter.format(subscription.amountCents / 100)
            : 'Nao informado',
        icon: <Sparkles className="h-4 w-4" />,
      },
    ],
    [access, currentPlanName, currentStatus, subscription],
  );

  const handleCheckout = useCallback(
    async (planCode: BillingPlanView['code']) => {
      setActionPlanCode(planCode);

      try {
        const result = await createCheckoutSession(planCode);
        toast.info('Redirecionando para o checkout', 'Voce sera levado para a area segura da Stripe.');
        window.location.href = result.url;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Nao foi possivel iniciar a assinatura.';
        toast.error('Falha ao iniciar checkout', message);
      } finally {
        setActionPlanCode(null);
      }
    },
    [toast],
  );

  const handleManageSubscription = useCallback(async () => {
    setIsManagingPortal(true);

    try {
      const result = await createPortalSession();
      toast.info('Abrindo portal da assinatura', 'Voce sera redirecionado para a Stripe.');
      window.location.href = result.url;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel abrir o portal da assinatura.';
      toast.error('Falha ao abrir portal', message);
    } finally {
      setIsManagingPortal(false);
    }
  }, [toast]);

  return (
    <div className="app-section space-y-6">
      <section className="app-section-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="app-section-badge">Configurações</div>
            <h1 className="app-section-title">Configurações • Assinatura</h1>
            <p className="app-section-description">
              Escolha o ciclo de cobrança recorrente que melhor combina com a sua granja e acompanhe o status da assinatura em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadBillingStatus(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar status
            </button>

            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={!billingData?.portalAvailable || isManagingPortal}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isManagingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />}
              Gerenciar assinatura
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

        {accessBanner && (
          <div
            className={[
              'mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold',
              accessBanner.tone === 'emerald'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : accessBanner.tone === 'rose'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-amber-200 bg-amber-50 text-amber-800',
            ].join(' ')}
          >
            <div className="font-extrabold">{accessBanner.title}</div>
            <div className="mt-1 font-medium">{accessBanner.message}</div>
          </div>
        )}

        {!billingData?.billingConfigured && !isLoading && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            A infraestrutura da Stripe ainda nao foi finalizada no ambiente do servidor. Configure as chaves e os <code>price_id</code> para liberar o checkout recorrente.
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.label}>
              <SummaryMetric label={item.label} value={item.value} icon={item.icon} />
            </div>
          ))}
        </div>

        {subscription && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-brand-primary/5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-extrabold text-[#0f1c2b]">{subscription.planName}</h2>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClassName(subscription.status)}`}>
                    {translateStatus(subscription.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {subscription.status === 'trialing'
                    ? `Seu teste grátis vai até ${formatDate(subscription.trialEndsAt)}.`
                    : subscription.status === 'trial_expired'
                    ? `Seu teste grátis terminou em ${formatDate(subscription.trialEndsAt)}.`
                    : subscription.cancelAtPeriodEnd
                    ? `A assinatura permanece ativa ate ${formatDate(subscription.currentPeriodEnd)}.`
                    : `Renovacao prevista para ${formatDate(subscription.currentPeriodEnd)}.`}
                </p>
              </div>

              {highlightedPlan && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Melhor economia atual: {highlightedPlan.name} por {highlightedPlan.priceDisplay}.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="app-section-card space-y-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold text-[#0f1c2b]">Planos recorrentes</h2>
          <p className="text-sm text-slate-500">
            Todos os planos usam cobrança automática pela Stripe e podem ser gerenciados no portal do cliente.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
              Carregando opcoes de assinatura...
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-3">
            {billingData?.plans.map((plan) => {
              const isCurrentPlan = subscription?.planCode === plan.code && subscription.status === 'active';
              const isBusy = actionPlanCode === plan.code;
              const planIcon =
                plan.supportTier === 'priority' ? (
                  <Crown className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                );

              return (
                <article
                  key={plan.code}
                  className={`relative overflow-hidden rounded-3xl border p-6 transition-all ${
                    plan.highlight
                      ? 'border-brand-primary bg-brand-primary/[0.04] shadow-xl shadow-brand-primary/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                      {planIcon}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        plan.highlight
                          ? 'bg-brand-primary text-white'
                          : plan.supportTier === 'priority'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-xl font-extrabold text-[#0f1c2b]">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{plan.description}</p>
                  </div>

                  <div className="mt-5 flex items-end gap-2">
                    <div className="text-3xl font-black tracking-tight text-[#0f1c2b]">{plan.priceDisplay}</div>
                    <div className="pb-1 text-sm font-semibold text-slate-500">{formatCycle(plan)}</div>
                  </div>

                  <div className="mt-2 text-sm font-medium text-slate-500">
                    Equivalente a {plan.equivalentMonthlyDisplay} por mes.
                  </div>

                  {plan.discountPercent > 0 && (
                    <div className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      Desconto de {plan.discountPercent}% em relacao ao mensal.
                    </div>
                  )}

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                        <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!plan.configured && (
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                      Cadastre o <code>price_id</code> deste plano na Stripe para habilitar o checkout.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCheckout(plan.code)}
                    disabled={!plan.configured || isCurrentPlan || isBusy || !billingData?.billingConfigured}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f1c2b] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Abrindo checkout...
                      </>
                    ) : isCurrentPlan ? (
                      'Plano atual'
                    ) : (
                      <>
                        Assinar agora
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
