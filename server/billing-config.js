const BILLING_PLANS = [
  {
    code: 'avicultor_monthly',
    name: 'Plano Avicultor',
    shortLabel: 'Mensal',
    description: 'Acesso completo a todos os módulos do sistema com cobrança mensal recorrente.',
    priceCents: 2000,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    discountPercent: 0,
    badge: 'Plano completo',
    highlight: false,
    supportTier: 'standard',
    priceEnvKey: 'STRIPE_PRICE_AVICULTOR_MONTHLY',
    features: [
      'Todos os módulos da plataforma',
      'Cadastros, manejo, clima, relatórios e backups',
      'Uso individual com sincronização na nuvem',
    ],
  },
  {
    code: 'avicultor_quarterly',
    name: 'Plano Trimestral',
    shortLabel: '3 meses',
    description: 'Mesmo acesso do plano Avicultor com renovação a cada 3 meses.',
    priceCents: 5700,
    currency: 'brl',
    interval: 'month',
    intervalCount: 3,
    discountPercent: 5,
    badge: 'Economia de 5%',
    highlight: false,
    supportTier: 'standard',
    priceEnvKey: 'STRIPE_PRICE_AVICULTOR_QUARTERLY',
    features: [
      'Tudo do plano Avicultor',
      'Renovação trimestral automática',
      'Economia sobre o valor mensal acumulado',
    ],
  },
  {
    code: 'avicultor_semiannual',
    name: 'Plano Semestral',
    shortLabel: '6 meses',
    description: 'Mais previsibilidade para a granja com desconto adicional.',
    priceCents: 11160,
    currency: 'brl',
    interval: 'month',
    intervalCount: 6,
    discountPercent: 7,
    badge: 'Economia de 7%',
    highlight: false,
    supportTier: 'standard',
    priceEnvKey: 'STRIPE_PRICE_AVICULTOR_SEMIANNUAL',
    features: [
      'Tudo do plano Avicultor',
      'Renovação semestral automática',
      'Melhor custo para médio prazo',
    ],
  },
  {
    code: 'avicultor_annual',
    name: 'Plano Anual',
    shortLabel: '12 meses',
    description: 'Maior economia anual para manter a operação sempre ativa.',
    priceCents: 21600,
    currency: 'brl',
    interval: 'year',
    intervalCount: 1,
    discountPercent: 10,
    badge: 'Melhor custo-benefício',
    highlight: true,
    supportTier: 'standard',
    priceEnvKey: 'STRIPE_PRICE_AVICULTOR_ANNUAL',
    features: [
      'Tudo do plano Avicultor',
      'Cobrança anual recorrente',
      'Maior economia entre os planos padrão',
    ],
  },
  {
    code: 'avicultor_priority_monthly',
    name: 'Avicultor Prioritário',
    shortLabel: 'Mensal',
    description: 'Plano completo com atendimento prioritário para suporte operacional.',
    priceCents: 2500,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    discountPercent: 0,
    badge: 'Suporte prioritário',
    highlight: false,
    supportTier: 'priority',
    priceEnvKey: 'STRIPE_PRICE_AVICULTOR_PRIORITY_MONTHLY',
    features: [
      'Tudo do plano Avicultor',
      'Fila prioritária no atendimento',
      'Ideal para operação com suporte mais rápido',
    ],
  },
];

function formatPriceInBrl(cents) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);
}

export function getBillingPlans() {
  return BILLING_PLANS.map((plan) => ({
    ...plan,
    equivalentMonthlyCents:
      plan.interval === 'year'
        ? Math.round(plan.priceCents / 12)
        : Math.round(plan.priceCents / plan.intervalCount),
  }));
}

export function getBillingPlanByCode(planCode) {
  return getBillingPlans().find((plan) => plan.code === planCode) || null;
}

export function getBillingPlanByPriceId(priceId) {
  if (!priceId) {
    return null;
  }

  return (
    getBillingPlans().find((plan) => process.env[plan.priceEnvKey] === priceId) ||
    null
  );
}

export function getPublicBillingPlans() {
  return getBillingPlans().map((plan) => ({
    code: plan.code,
    name: plan.name,
    shortLabel: plan.shortLabel,
    description: plan.description,
    priceCents: plan.priceCents,
    equivalentMonthlyCents: plan.equivalentMonthlyCents,
    currency: plan.currency,
    interval: plan.interval,
    intervalCount: plan.intervalCount,
    discountPercent: plan.discountPercent,
    badge: plan.badge,
    highlight: plan.highlight,
    supportTier: plan.supportTier,
    features: plan.features,
    priceDisplay: formatPriceInBrl(plan.priceCents),
    equivalentMonthlyDisplay: formatPriceInBrl(plan.equivalentMonthlyCents),
    configured: Boolean(process.env[plan.priceEnvKey]),
  }));
}

export function resolveConfiguredPlan(planCode) {
  const plan = getBillingPlanByCode(planCode);
  if (!plan) {
    return null;
  }

  const priceId = process.env[plan.priceEnvKey];
  if (!priceId) {
    return {
      ...plan,
      priceId: null,
      configured: false,
    };
  }

  return {
    ...plan,
    priceId,
    configured: true,
  };
}
