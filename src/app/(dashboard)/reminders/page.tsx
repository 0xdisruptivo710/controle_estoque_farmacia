'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReminders, useUpdateReminderStatus } from '@/presentation/hooks/useReminders';
import type { ReminderResponseDTO } from '@/application/dtos/ReminderDTO';

type TabFilter = 'all' | 'today' | 'overdue' | 'upcoming';

const statusConfig: Record<string, { text: string; className: string }> = {
  scheduled: { text: 'Agendado', className: 'badge-primary' },
  sent: { text: 'Enviado', className: 'badge-success' },
  viewed: { text: 'Visualizado', className: 'badge-success' },
  converted: { text: 'Convertido', className: 'badge-success' },
  ignored: { text: 'Ignorado', className: 'badge-warning' },
  cancelled: { text: 'Cancelado', className: 'badge-danger' },
};

const channelLabels: Record<string, string> = {
  push: 'Push',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  sms: 'SMS',
};

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isOverdue(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

function filterReminders(reminders: ReminderResponseDTO[], tab: TabFilter): ReminderResponseDTO[] {
  switch (tab) {
    case 'today':
      return reminders.filter((r) => isToday(r.scheduledDate));
    case 'overdue':
      return reminders.filter((r) => isOverdue(r.scheduledDate) && r.status === 'scheduled');
    case 'upcoming':
      return reminders.filter((r) => !isToday(r.scheduledDate) && !isOverdue(r.scheduledDate));
    default:
      return reminders;
  }
}

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const { data: remindersData, isLoading, error } = useReminders();
  const updateStatus = useUpdateReminderStatus();

  const allReminders = remindersData?.data ?? [];
  const reminders = filterReminders(allReminders, activeTab);

  const tabs: { value: TabFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: allReminders.length },
    { value: 'today', label: 'Hoje', count: remindersData?.today ?? 0 },
    { value: 'overdue', label: 'Atrasados', count: remindersData?.overdue ?? 0 },
    { value: 'upcoming', label: 'Proximos', count: remindersData?.upcoming ?? 0 },
  ];

  async function handleMarkSent(reminderId: string) {
    await updateStatus.mutateAsync({ id: reminderId, status: 'sent' });
  }

  async function handleCancel(reminderId: string) {
    await updateStatus.mutateAsync({ id: reminderId, status: 'cancelled' });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Lembretes de Recompra
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Gerencie os lembretes de recompra dos seus clientes
          </p>
        </div>
        <Link href="/reminders/new" className="btn-primary" aria-label="Novo lembrete">
          + Novo Lembrete
        </Link>
      </div>

      {/* Tab filters */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: activeTab === tab.value ? 'var(--color-primary)' : 'var(--color-background)',
              color: activeTab === tab.value ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: activeTab === tab.value ? 'none' : '1px solid var(--color-border)',
            }}
            aria-label={`Filtrar por ${tab.label}`}
            aria-pressed={activeTab === tab.value}
          >
            {tab.label}
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-xs font-bold"
              style={{
                backgroundColor: activeTab === tab.value ? 'rgba(255,255,255,0.25)' : 'var(--color-surface)',
                color: activeTab === tab.value ? '#FFFFFF' : 'var(--color-text-secondary)',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reminders list */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3" style={{ backgroundColor: 'var(--color-surface)' }} />
                  <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'var(--color-surface)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
              Erro ao carregar lembretes. Tente novamente.
            </p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Nenhum lembrete {activeTab !== 'all' ? 'nesta categoria' : 'encontrado'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Os lembretes sao criados automaticamente ao entregar pedidos.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {reminders.map((reminder) => {
              const statusInfo = statusConfig[reminder.status] ?? statusConfig.scheduled;
              const overdue = isOverdue(reminder.scheduledDate) && reminder.status === 'scheduled';

              return (
                <div key={reminder.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {reminder.customerName}
                        </span>
                        <span className={`badge ${statusInfo.className}`}>{statusInfo.text}</span>
                        {overdue && (
                          <span className="badge badge-danger">Atrasado</span>
                        )}
                      </div>
                      {reminder.productName && (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                          Produto: {reminder.productName}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          Data: {new Date(reminder.scheduledDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          Canal: {channelLabels[reminder.channel] ?? reminder.channel}
                        </span>
                      </div>
                    </div>

                    {reminder.status === 'scheduled' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleMarkSent(reminder.id)}
                          disabled={updateStatus.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
                          aria-label="Marcar como enviado"
                        >
                          Enviar
                        </button>
                        <button
                          onClick={() => handleCancel(reminder.id)}
                          disabled={updateStatus.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
                          aria-label="Cancelar lembrete"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
