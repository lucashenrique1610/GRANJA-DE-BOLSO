import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, Loader2, RefreshCcw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import {
  AdminUserOverviewItem,
  AdminUsersOverviewResponse,
  fetchAdminUsersOverview,
  updateUserPromoterAccess,
} from '@/lib/admin';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
});

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatDate(value: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  return dateFormatter.format(new Date(value));
}

function formatPhone(value: string | null) {
  return value && value.trim() ? value : 'Nao informado';
}

function translateSubscriptionStatus(status: string | null | undefined) {
  switch (status) {
    case 'active':
      return 'Ativa';
    case 'trialing':
      return 'Em teste';
    case 'trial_expired':
      return 'Teste expirado';
    case 'legacy_active':
      return 'Acesso legado';
    case 'past_due':
      return 'Pagamento pendente';
    case 'unpaid':
      return 'Pagamento em atraso';
    case 'canceled':
      return 'Cancelada';
    case 'incomplete':
      return 'Aguardando confirmacao';
    case 'incomplete_expired':
      return 'Expirada';
    default:
      return 'Sem assinatura';
  }
}

function formatSubscriptionValue(item: AdminUserOverviewItem) {
  if (item.access.reason === 'promoter_free_access') {
    return 'Gratuito';
  }

  if (typeof item.subscription?.amountCents === 'number') {
    return currencyFormatter.format(item.subscription.amountCents / 100);
  }

  return 'Nao informado';
}

function translateAccess(item: AdminUserOverviewItem) {
  if (item.access.reason === 'promoter_free_access') {
    return 'Divulgador gratuito';
  }

  if (item.access.reason === 'active_subscription') {
    return 'Assinatura ativa';
  }

  if (item.access.reason === 'legacy_access') {
    return 'Acesso legado';
  }

  if (item.access.reason === 'trial_active') {
    return `Teste ativo (${item.access.trialDaysRemaining} dia(s))`;
  }

  if (item.access.reason === 'trial_expired') {
    return 'Teste expirado';
  }

  return 'Assinatura necessaria';
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-4 text-3xl font-extrabold text-[#0f1c2b]">{value}</div>
    </div>
  );
}

export default function AdminPage() {
  const toast = useToast();
  const [data, setData] = useState<AdminUsersOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'divulgadores' | 'assinantes' | 'trial' | 'bloqueados'>('all');
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const loadOverview = useCallback(async (background = false) => {
    setErrorMessage('');

    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetchAdminUsersOverview();
      setData(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel carregar o painel administrativo.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (data?.users || []).filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.fullName.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.farm?.name || '').toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      if (filterMode === 'divulgadores') {
        return user.isDivulgador;
      }

      if (filterMode === 'assinantes') {
        return user.subscription?.status === 'active';
      }

      if (filterMode === 'trial') {
        return user.access.reason === 'trial_active';
      }

      if (filterMode === 'bloqueados') {
        return !user.access.hasAccess;
      }

      return true;
    });
  }, [data?.users, filterMode, searchTerm]);

  const usersCountLabel = useMemo(() => {
    const total = data?.summary.totalUsers ?? 0;
    const filtered = filteredUsers.length;
    return filtered === total
      ? `${total} usuario(s) cadastrados`
      : `${filtered} de ${total} usuario(s) exibidos`;
  }, [data?.summary.totalUsers, filteredUsers.length]);

  const handleToggleDivulgador = useCallback(
    async (user: AdminUserOverviewItem) => {
      setActionUserId(user.id);

      try {
        const enabled = !user.isDivulgador;
        await updateUserPromoterAccess(
          user.id,
          enabled,
          enabled ? 'Liberado pelo painel administrativo.' : 'Removido pelo painel administrativo.',
        );
        toast.success(
          enabled ? 'Divulgador liberado' : 'Divulgador removido',
          `${user.fullName} foi atualizado com sucesso.`,
        );
        await loadOverview(true);
      } catch (error) {
        toast.error(
          'Falha ao atualizar divulgador',
          error instanceof Error ? error.message : 'Nao foi possivel atualizar este usuario.',
        );
      } finally {
        setActionUserId(null);
      }
    },
    [loadOverview, toast],
  );

  return (
    <div className="app-section space-y-6">
      <section className="app-section-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="app-section-badge">Administração</div>
            <h1 className="app-section-title">Painel Administrativo</h1>
            <p className="app-section-description">
              Visualize os usuarios cadastrados, acompanhe o status das assinaturas e gerencie o acesso gratuito de divulgadores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOverview(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar painel
          </button>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={<Users className="h-5 w-5" />} label="Usuarios" value={data?.summary.totalUsers ?? 0} />
          <MetricCard icon={<Crown className="h-5 w-5" />} label="Admins" value={data?.summary.totalAdmins ?? 0} />
          <MetricCard icon={<ShieldCheck className="h-5 w-5" />} label="Divulgadores" value={data?.summary.totalDivulgadores ?? 0} />
          <MetricCard icon={<Sparkles className="h-5 w-5" />} label="Assinaturas ativas" value={data?.summary.totalActiveSubscriptions ?? 0} />
          <MetricCard icon={<RefreshCcw className="h-5 w-5" />} label="Trials ativos" value={data?.summary.totalTrialActive ?? 0} />
        </div>
      </section>

      <section className="app-section-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#0f1c2b]">Usuarios e assinaturas</h2>
            <p className="mt-1 text-sm text-slate-600">
              O administrador unico da plataforma ve apenas este painel e pode promover ou remover divulgadores.
            </p>
            <p className="mt-2 text-sm font-bold text-brand-primary">{usersCountLabel}</p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, e-mail ou granja"
              className="min-w-[18rem] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-brand-primary"
            />

            <select
              value={filterMode}
              onChange={(event) => setFilterMode(event.target.value as typeof filterMode)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-brand-primary"
            >
              <option value="all">Todos</option>
              <option value="divulgadores">Divulgadores</option>
              <option value="assinantes">Assinantes</option>
              <option value="trial">Trial ativo</option>
              <option value="bloqueados">Bloqueados</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <th className="px-4 py-4">Usuario</th>
                <th className="px-4 py-4">Telefone</th>
                <th className="px-4 py-4">Papel</th>
                <th className="px-4 py-4">Granja</th>
                <th className="px-4 py-4">Assinatura</th>
                <th className="px-4 py-4">Acesso</th>
                <th className="px-4 py-4">Divulgador</th>
                <th className="px-4 py-4">Acao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando painel administrativo...
                    </span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    Nenhum usuario encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="align-top text-sm text-slate-700">
                    <td className="px-4 py-4">
                      <div className="font-bold text-[#0f1c2b]">{user.fullName}</div>
                      <div className="mt-1 text-xs font-medium text-slate-500">{user.email}</div>
                      <div className="mt-1 text-xs text-slate-400">Cadastro: {formatDate(user.createdAt)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-700">{formatPhone(user.phone)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                        {user.appRole}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-700">{user.farm?.name || 'Sem granja'}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {user.farm?.city && user.farm?.state
                          ? `${user.farm.city} - ${user.farm.state}`
                          : 'Local nao informado'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-700">
                        {user.subscription?.planName || 'Sem assinatura'}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Status: {translateSubscriptionStatus(user.subscription?.status)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Valor: {formatSubscriptionValue(user)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Proximo marco:{' '}
                        {user.subscription?.currentPeriodEnd
                          ? formatDate(user.subscription.currentPeriodEnd)
                          : user.access.reason === 'trial_active'
                          ? formatDate(user.access.trialEndsAt)
                          : 'Nao informado'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-700">{translateAccess(user)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {user.access.reason === 'promoter_free_access'
                          ? `Desde ${formatDate(user.access.promoterEnabledAt)}`
                          : user.access.reason === 'trial_active'
                          ? `Ate ${formatDate(user.access.trialEndsAt)}`
                          : user.subscription?.currentPeriodEnd
                          ? `Periodo ate ${formatDate(user.subscription.currentPeriodEnd)}`
                          : 'Sem periodo ativo'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-bold',
                          user.isDivulgador
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500',
                        ].join(' ')}
                      >
                        {user.isDivulgador ? 'Ativo' : 'Nao'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleDivulgador(user)}
                        disabled={user.appRole === 'admin' || actionUserId === user.id}
                        className={[
                          'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all',
                          user.appRole === 'admin'
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : user.isDivulgador
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-brand-primary text-white hover:bg-brand-hover',
                        ].join(' ')}
                      >
                        {actionUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {user.appRole === 'admin'
                          ? 'Admin protegido'
                          : user.isDivulgador
                          ? 'Remover divulgador'
                          : 'Tornar divulgador'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
