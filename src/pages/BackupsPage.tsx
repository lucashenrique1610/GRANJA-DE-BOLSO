import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackupAutomationSettings, BackupFrequency, BackupRecord, BackupSnapshot } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

interface BackupsPageProps {
  records: BackupRecord[];
  automation: BackupAutomationSettings;
  isLoading?: boolean;
  isSyncing?: boolean;
  errorMessage?: string;
  onCreateSupabaseBackup: (name: string) => Promise<void> | void;
  onDownloadCurrentBackup: () => Promise<BackupSnapshot>;
  onDownloadSavedBackup: (record: BackupRecord) => void;
  onRestoreBackup: (snapshot: BackupSnapshot) => Promise<void> | void;
  onDeleteBackup: (id: string) => Promise<void> | void;
  onSaveAutomation: (settings: BackupAutomationSettings) => Promise<void> | void;
  onRetry: () => Promise<void> | void;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function triggerDownload(snapshot: BackupSnapshot, fileName: string) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getBackupFileName(baseName: string) {
  const normalized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${normalized || 'backup'}-${new Date().toISOString().slice(0, 10)}.json`;
}

const MAX_BACKUP_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const RESTORE_CONFIRMATION_TEXT = 'RESTAURAR';

function getBackupRecordCount(snapshot: BackupSnapshot) {
  return (
    snapshot.animals.length +
    snapshot.clients.length +
    snapshot.suppliers.length +
    snapshot.galpoes.length +
    snapshot.healthProfessionals.length +
    snapshot.healthRecords.length +
    snapshot.veterinaryStock.length +
    snapshot.mortalityRecords.length +
    snapshot.manejoRecords.length +
    snapshot.disponibilidadeVenda.length +
    snapshot.vendas.length +
    snapshot.ingredients.length +
    snapshot.formulations.length +
    snapshot.formulatedFeedStock.length
  );
}

export default function BackupsPage({
  records,
  automation,
  isLoading,
  isSyncing,
  errorMessage,
  onCreateSupabaseBackup,
  onDownloadCurrentBackup,
  onDownloadSavedBackup,
  onRestoreBackup,
  onDeleteBackup,
  onSaveAutomation,
  onRetry,
}: BackupsPageProps) {
  const toast = useToast();
  const [backupName, setBackupName] = useState(`Backup ${new Date().toLocaleDateString('pt-BR')}`);
  const [automationDraft, setAutomationDraft] = useState<BackupAutomationSettings>(automation);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAutomationDraft(automation);
  }, [automation]);

  const summary = useMemo(() => {
    const latest = records[0];
    return {
      total: records.length,
      latest: latest ? formatDateTime(latest.createdAt) : 'Nenhum backup salvo',
    };
  }, [records]);

  const handleSaveBackup = async () => {
    await onCreateSupabaseBackup(backupName);
    toast.success('Backup salvo', 'Seu backup foi armazenado com segurança no Supabase.');
  };

  const handleDownloadCurrent = async () => {
    const snapshot = await onDownloadCurrentBackup();
    triggerDownload(snapshot, getBackupFileName(backupName));
    toast.success('Arquivo gerado', 'O backup foi baixado em formato JSON.');
  };

  const handleRestore = async (snapshot: BackupSnapshot, sourceLabel: string) => {
    const totalRecords = getBackupRecordCount(snapshot);
    const confirmed = window.confirm(
      `Deseja restaurar os dados deste backup de ${sourceLabel}?\n\n` +
        `Granja: ${snapshot.farmProfile?.farmName || 'Não identificada'}\n` +
        `Exportado em: ${snapshot.exportedAt ? formatDateTime(snapshot.exportedAt) : 'Data inválida'}\n` +
        `Total aproximado de registros: ${totalRecords}\n\n` +
        'Isso substituirá os cadastros atuais.',
    );
    if (!confirmed) return;

    const challenge = window.prompt(
      `Para confirmar a restauração destrutiva, digite ${RESTORE_CONFIRMATION_TEXT}.`,
      '',
    );
    if (challenge !== RESTORE_CONFIRMATION_TEXT) {
      toast.warning('Restauração cancelada', 'A confirmação digitada não confere.');
      return;
    }

    await onRestoreBackup(snapshot);
    toast.success('Backup restaurado', 'Os dados da conta foram restaurados com sucesso.');
  };

  const handleSaveAutomation = async () => {
    await onSaveAutomation(automationDraft);
    toast.success('Automação salva', 'A rotina automática de backup foi atualizada.');
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('Selecione um arquivo JSON de backup válido.');
      }

      if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
        throw new Error('O arquivo de backup excede o limite de 5 MB permitido por segurança.');
      }

      const raw = await file.text();
      if (!raw.trim()) {
        throw new Error('O arquivo selecionado está vazio.');
      }

      const parsed = JSON.parse(raw) as BackupSnapshot;
      await handleRestore(parsed, `arquivo ${file.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível validar o arquivo de backup.';
      toast.error('Falha ao validar backup', message);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="app-section space-y-6">
      <section className="app-section-card">
        <div>
          <div className="app-section-badge">Configurações</div>
          <h1 className="app-section-title">Configurações • Backups</h1>
          <p className="app-section-description">
            Salve seus dados no Supabase, baixe um arquivo JSON de segurança e restaure backups quando necessário.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Backups salvos</div>
            <div className="mt-2 text-2xl font-extrabold text-[#0f1c2b]">{summary.total}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Último backup</div>
            <div className="mt-2 text-lg font-extrabold text-[#0f1c2b]">{summary.latest}</div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

      </section>

      <section className="app-section-card space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-[#0f1c2b]">Backup automático</h2>
          <p className="mt-1 text-sm text-gray-500">
            Quando ativado, o sistema cria um backup automaticamente ao entrar no aplicativo assim que a frequência vencer.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Ativar backup automático</span>
            <select
              value={automationDraft.enabled ? 'enabled' : 'disabled'}
              onChange={(event) =>
                setAutomationDraft((prev) => ({ ...prev, enabled: event.target.value === 'enabled' }))
              }
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            >
              <option value="disabled">Desativado</option>
              <option value="enabled">Ativado</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Frequência</span>
            <select
              value={automationDraft.frequency}
              onChange={(event) =>
                setAutomationDraft((prev) => ({ ...prev, frequency: event.target.value as BackupFrequency }))
              }
              disabled={!automationDraft.enabled}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Quantidade máxima de backups automáticos</span>
            <input
              type="number"
              min={1}
              max={100}
              value={automationDraft.keepCount}
              onChange={(event) =>
                setAutomationDraft((prev) => ({ ...prev, keepCount: Math.max(1, Number(event.target.value || 1)) }))
              }
              disabled={!automationDraft.enabled}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Ex: 10"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-600">
          Último backup automático: {automation.lastRunAt ? formatDateTime(automation.lastRunAt) : 'Ainda não executado'}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSaveAutomation()}
            disabled={isSyncing}
            className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSyncing ? 'Processando...' : 'Salvar automação'}
          </button>
        </div>
      </section>

      <section className="app-section-card space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-[#0f1c2b]">Criar backup</h2>
          <p className="mt-1 text-sm text-gray-500">
            Você pode guardar o backup na sua conta do Supabase ou baixar um arquivo local para segurança extra.
          </p>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Nome do backup</span>
          <input
            value={backupName}
            onChange={(event) => setBackupName(event.target.value)}
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            placeholder="Ex: Backup semanal"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleSaveBackup()}
            disabled={isSyncing}
            className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSyncing ? 'Processando...' : 'Salvar no Supabase'}
          </button>
          <button
            type="button"
            onClick={() => void handleDownloadCurrent()}
            disabled={isSyncing}
            className="rounded-full border border-brand-primary px-5 py-3 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Baixar arquivo JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSyncing}
            className="rounded-full border border-gray-300 px-5 py-3 text-sm font-bold text-[#0f1c2b] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Fazer upload e restaurar
          </button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileSelected} />
        </div>
      </section>

      <section className="app-section-card space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Backups salvos no Supabase</h2>
            <p className="mt-1 text-sm text-gray-500">Use os backups da sua conta para restaurar ou baixar novamente.</p>
          </div>
          <button
            type="button"
            onClick={() => void onRetry()}
            className="rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-[#0f1c2b] transition-colors hover:bg-slate-50"
          >
            Atualizar lista
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
            Carregando backups...
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500">
            Nenhum backup salvo no Supabase até o momento.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-base font-extrabold text-[#0f1c2b]">{record.name}</div>
                    <div className="mt-1 text-sm text-gray-500">
                      {formatDateTime(record.createdAt)} • {record.snapshot.animals.length} animais • {record.snapshot.clients.length} clientes •{' '}
                      {record.snapshot.suppliers.length} fornecedores
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onDownloadSavedBackup(record)}
                      className="rounded-full border border-gray-300 px-4 py-2 text-xs font-bold text-[#0f1c2b] transition-colors hover:bg-white"
                    >
                      Baixar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRestore(record.snapshot, `backup ${record.name}`)}
                      disabled={isSyncing}
                      className="rounded-full border border-brand-primary px-4 py-2 text-xs font-bold text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Restaurar
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDeleteBackup(record.id)}
                      disabled={isSyncing}
                      className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
