'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useReminders, useUpdateReminderStatus } from '@/presentation/hooks/useReminders';
import type { ReminderResponseDTO } from '@/application/dtos/ReminderDTO';
import type { ReminderStatus } from '@/application/dtos/ReminderDTO';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SegmentTab = 'all' | 'overdue' | 'today' | 'scheduled' | 'sent';

interface ActiveFilters {
  search: string;
  statuses: ReminderStatus[];
  dateFrom: string;
  dateTo: string;
  productName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isOverdue(dateStr: string, status: string): boolean {
  if (status !== 'scheduled') return false;
  const d = new Date(dateStr);
  return d < startOfToday();
}

function isToday(dateStr: string): boolean {
  return isSameDay(new Date(dateStr), new Date());
}

function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(new Date(dateStr), tomorrow);
}

function daysDiff(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const now = startOfToday();
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeDate(dateStr: string): string {
  const diff = daysDiff(dateStr);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanha';
  if (diff === -1) return 'Ontem';
  if (diff < -1) return `Ha ${Math.abs(diff)} dias`;
  return `Em ${diff} dias`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ReminderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  scheduled: {
    label: 'Agendado',
    bg: 'rgba(10,132,255,0.10)',
    text: '#0A84FF',
    dot: '#0A84FF',
  },
  sent: {
    label: 'Enviado',
    bg: 'rgba(52,199,89,0.10)',
    text: '#34C759',
    dot: '#34C759',
  },
  viewed: {
    label: 'Visualizado',
    bg: 'rgba(52,199,89,0.10)',
    text: '#34C759',
    dot: '#34C759',
  },
  converted: {
    label: 'Convertido',
    bg: 'rgba(52,199,89,0.10)',
    text: '#248A3D',
    dot: '#248A3D',
  },
  ignored: {
    label: 'Ignorado',
    bg: 'rgba(255,149,0,0.10)',
    text: '#FF9500',
    dot: '#FF9500',
  },
  cancelled: {
    label: 'Cancelado',
    bg: 'rgba(110,110,115,0.10)',
    text: '#6E6E73',
    dot: '#6E6E73',
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        fill="#25D366"
      />
      <path
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.108-1.14l-.292-.174-2.868.852.852-2.868-.174-.292A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"
        fill="#25D366"
      />
    </svg>
  );
}

function BellIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF9500"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KPICard({
  label,
  value,
  color,
  bgColor,
  icon,
  isLoading,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3 transition-all"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <>
            <div
              className="h-6 w-10 rounded animate-pulse mb-1"
              style={{ backgroundColor: 'var(--color-surface)' }}
            />
            <div
              className="h-3 w-16 rounded animate-pulse"
              style={{ backgroundColor: 'var(--color-surface)' }}
            />
          </>
        ) : (
          <>
            <p
              className="text-2xl font-bold leading-none"
              style={{ color, fontFamily: 'var(--font-display)' }}
            >
              {value}
            </p>
            <p
              className="text-xs font-medium mt-0.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {label}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function ReminderSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div
          className="w-1 h-14 rounded-full shrink-0"
          style={{ backgroundColor: 'var(--color-surface)' }}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-32 rounded"
              style={{ backgroundColor: 'var(--color-surface)' }}
            />
            <div
              className="h-5 w-16 rounded-full"
              style={{ backgroundColor: 'var(--color-surface)' }}
            />
          </div>
          <div
            className="h-3 w-40 rounded"
            style={{ backgroundColor: 'var(--color-surface)' }}
          />
          <div className="flex gap-3">
            <div
              className="h-3 w-20 rounded"
              style={{ backgroundColor: 'var(--color-surface)' }}
            />
            <div
              className="h-3 w-14 rounded"
              style={{ backgroundColor: 'var(--color-surface)' }}
            />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div
            className="h-8 w-24 rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)' }}
          />
          <div
            className="h-8 w-20 rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)' }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reminder Card
// ---------------------------------------------------------------------------

function ReminderCard({
  reminder,
  onSend,
  onCancel,
  onConvert,
  onReschedule,
  isUpdating,
}: {
  reminder: ReminderResponseDTO;
  onSend: (id: string) => void;
  onCancel: (id: string) => void;
  onConvert: (id: string) => void;
  onReschedule: (id: string) => void;
  isUpdating: boolean;
}) {
  const overdue = isOverdue(reminder.scheduledDate, reminder.status);
  const today = isToday(reminder.scheduledDate);
  const statusInfo = STATUS_CONFIG[reminder.status];
  const diff = daysDiff(reminder.scheduledDate);

  // Left border color based on urgency
  let borderColor = 'var(--color-border)';
  if (overdue) borderColor = '#FF3B30';
  else if (today && reminder.status === 'scheduled') borderColor = '#FF9500';
  else if (reminder.status === 'sent' || reminder.status === 'converted' || reminder.status === 'viewed')
    borderColor = '#34C759';
  else if (reminder.status === 'cancelled' || reminder.status === 'ignored')
    borderColor = '#AEAEB2';
  else if (reminder.status === 'scheduled') borderColor = '#0A84FF';

  return (
    <div
      className="flex items-start gap-3 p-4 transition-colors hover:bg-[#F9F9FB]"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {reminder.customerName}
          </span>

          {/* Status badge */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: overdue
                ? 'rgba(255,59,48,0.10)'
                : statusInfo.bg,
              color: overdue ? '#FF3B30' : statusInfo.text,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: overdue ? '#FF3B30' : statusInfo.dot,
              }}
            />
            {overdue ? 'Atrasado' : statusInfo.label}
          </span>

          {/* Channel icon */}
          {reminder.channel === 'whatsapp' ? (
            <WhatsAppIcon size={14} />
          ) : (
            <BellIcon size={14} />
          )}
        </div>

        {/* Product name */}
        {reminder.productName && (
          <p
            className="text-sm mt-0.5 truncate"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {reminder.productName}
          </p>
        )}

        {/* Date info */}
        <div className="flex items-center gap-3 mt-1.5">
          <span
            className="inline-flex items-center gap-1 text-xs"
            style={{
              color: overdue
                ? '#FF3B30'
                : today
                  ? '#FF9500'
                  : 'var(--color-text-secondary)',
              fontWeight: overdue || today ? 600 : 400,
            }}
          >
            <CalendarIcon />
            {formatDate(reminder.scheduledDate)}
          </span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: overdue
                ? 'rgba(255,59,48,0.08)'
                : today
                  ? 'rgba(255,149,0,0.08)'
                  : isTomorrow(reminder.scheduledDate)
                    ? 'rgba(10,132,255,0.08)'
                    : 'var(--color-surface)',
              color: overdue
                ? '#FF3B30'
                : today
                  ? '#FF9500'
                  : isTomorrow(reminder.scheduledDate)
                    ? '#0A84FF'
                    : 'var(--color-text-secondary)',
            }}
          >
            {overdue
              ? `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'dia atrasado' : 'dias atrasado'}`
              : relativeDate(reminder.scheduledDate)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {reminder.status === 'scheduled' && (
          <>
            <button
              onClick={() => onSend(reminder.id)}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
              style={{
                backgroundColor: 'rgba(52,199,89,0.12)',
                color: '#34C759',
              }}
              aria-label={`Enviar lembrete para ${reminder.customerName}`}
            >
              Enviar agora
            </button>
            <button
              onClick={() => onCancel(reminder.id)}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
              style={{
                backgroundColor: 'rgba(255,59,48,0.08)',
                color: '#FF3B30',
              }}
              aria-label={`Cancelar lembrete de ${reminder.customerName}`}
            >
              Cancelar
            </button>
          </>
        )}

        {reminder.status === 'sent' && (
          <button
            onClick={() => onConvert(reminder.id)}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
            style={{
              backgroundColor: 'rgba(52,199,89,0.12)',
              color: '#248A3D',
            }}
            aria-label={`Marcar como convertido: ${reminder.customerName}`}
          >
            Convertido
          </button>
        )}

        {(reminder.status === 'cancelled' || reminder.status === 'ignored') && (
          <button
            onClick={() => onReschedule(reminder.id)}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
            style={{
              backgroundColor: 'rgba(10,132,255,0.10)',
              color: '#0A84FF',
            }}
            aria-label={`Reagendar lembrete de ${reminder.customerName}`}
          >
            Reagendar
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-secondary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
          <line x1="1" y1="1" x2="23" y2="23" opacity={hasFilters ? '1' : '0'} />
        </svg>
      </div>
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {hasFilters ? 'Nenhum lembrete encontrado' : 'Nenhum lembrete ainda'}
      </h3>
      <p
        className="text-sm max-w-sm mx-auto"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {hasFilters
          ? 'Tente ajustar os filtros ou limpar a busca para ver mais resultados.'
          : 'Os lembretes sao criados automaticamente ao entregar pedidos, ou voce pode criar um manualmente.'}
      </p>
      {!hasFilters && (
        <Link
          href="/reminders/new"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
          }}
          aria-label="Criar primeiro lembrete"
        >
          <PlusIcon />
          Criar primeiro lembrete
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function RemindersPage() {
  const [activeSegment, setActiveSegment] = useState<SegmentTab>('all');
  const [filters, setFilters] = useState<ActiveFilters>({
    search: '',
    statuses: [],
    dateFrom: '',
    dateTo: '',
    productName: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const LIMIT = 20;

  const { data: remindersData, isLoading, error } = useReminders({
    page,
    limit: LIMIT,
  });
  const updateStatus = useUpdateReminderStatus();

  const allReminders = remindersData?.data ?? [];

  // Compute counts from the raw data
  const overdueCount = remindersData?.overdue ?? 0;
  const todayCount = remindersData?.today ?? 0;
  const totalScheduled = remindersData?.upcoming ?? 0;

  // Converted this month (client-side count)
  const convertedThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return allReminders.filter(
      (r) =>
        r.status === 'converted' &&
        r.convertedAt &&
        new Date(r.convertedAt) >= monthStart
    ).length;
  }, [allReminders]);

  // Collect unique product names for product filter dropdown
  const productNames = useMemo(() => {
    const names = new Set<string>();
    allReminders.forEach((r) => {
      if (r.productName) names.add(r.productName);
    });
    return Array.from(names).sort();
  }, [allReminders]);

  // Apply segment + filters
  const filteredReminders = useMemo(() => {
    let list = allReminders;

    // Segment filter
    switch (activeSegment) {
      case 'overdue':
        list = list.filter((r) => isOverdue(r.scheduledDate, r.status));
        break;
      case 'today':
        list = list.filter((r) => isToday(r.scheduledDate));
        break;
      case 'scheduled':
        list = list.filter((r) => r.status === 'scheduled' && !isOverdue(r.scheduledDate, r.status));
        break;
      case 'sent':
        list = list.filter((r) => r.status === 'sent' || r.status === 'viewed');
        break;
    }

    // Text search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          (r.productName && r.productName.toLowerCase().includes(q))
      );
    }

    // Status filter chips
    if (filters.statuses.length > 0) {
      list = list.filter((r) => filters.statuses.includes(r.status));
    }

    // Date range
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      list = list.filter((r) => new Date(r.scheduledDate) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((r) => new Date(r.scheduledDate) <= to);
    }

    // Product filter
    if (filters.productName) {
      list = list.filter((r) => r.productName === filters.productName);
    }

    return list;
  }, [allReminders, activeSegment, filters]);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.statuses.length > 0 ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.productName !== '';

  // Handlers
  const handleSend = useCallback(
    (id: string) => updateStatus.mutateAsync({ id, status: 'sent' }),
    [updateStatus]
  );

  const handleCancel = useCallback(
    (id: string) => updateStatus.mutateAsync({ id, status: 'cancelled' }),
    [updateStatus]
  );

  const handleConvert = useCallback(
    (id: string) => updateStatus.mutateAsync({ id, status: 'converted' }),
    [updateStatus]
  );

  const handleReschedule = useCallback(
    (id: string) => {
      setRescheduleId(id);
      // Default to 7 days from now
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setRescheduleDate(d.toISOString().split('T')[0]);
    },
    []
  );

  const confirmReschedule = useCallback(async () => {
    if (!rescheduleId || !rescheduleDate) return;
    await updateStatus.mutateAsync({ id: rescheduleId, status: 'scheduled' });
    setRescheduleId(null);
    setRescheduleDate('');
  }, [rescheduleId, rescheduleDate, updateStatus]);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', statuses: [], dateFrom: '', dateTo: '', productName: '' });
  }, []);

  const toggleStatusFilter = useCallback((status: ReminderStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  }, []);

  // Segment tabs config
  const segments: { value: SegmentTab; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'overdue', label: 'Atrasados' },
    { value: 'today', label: 'Hoje' },
    { value: 'scheduled', label: 'Agendados' },
    { value: 'sent', label: 'Enviados' },
  ];

  const statusChips: { value: ReminderStatus; label: string }[] = [
    { value: 'scheduled', label: 'Agendado' },
    { value: 'sent', label: 'Enviado' },
    { value: 'viewed', label: 'Visualizado' },
    { value: 'converted', label: 'Convertido' },
    { value: 'ignored', label: 'Ignorado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const totalPages = Math.ceil((remindersData?.total ?? 0) / LIMIT);

  return (
    <div className="space-y-5">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Lembretes de Recompra
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Gerencie os lembretes de recompra dos seus clientes
          </p>
        </div>
        {/* Desktop "Novo Lembrete" button */}
        <Link
          href="/reminders/new"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
          }}
          aria-label="Novo lembrete"
        >
          <PlusIcon />
          Novo Lembrete
        </Link>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* KPI Summary Cards                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Atrasados"
          value={overdueCount}
          color="#FF3B30"
          bgColor="rgba(255,59,48,0.10)"
          isLoading={isLoading}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF3B30"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <KPICard
          label="Hoje"
          value={todayCount}
          color="#FF9500"
          bgColor="rgba(255,149,0,0.10)"
          isLoading={isLoading}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF9500"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <KPICard
          label="Agendados"
          value={totalScheduled}
          color="#0A84FF"
          bgColor="rgba(10,132,255,0.10)"
          isLoading={isLoading}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0A84FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <KPICard
          label="Convertidos (mes)"
          value={convertedThisMonth}
          color="#34C759"
          bgColor="rgba(52,199,89,0.10)"
          isLoading={isLoading}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34C759"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Segmented Control (iOS-style tabs)                                */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="flex rounded-xl p-1 overflow-x-auto"
        style={{ backgroundColor: 'var(--color-surface)' }}
        role="tablist"
        aria-label="Filtrar lembretes por categoria"
      >
        {segments.map((seg) => (
          <button
            key={seg.value}
            role="tab"
            aria-selected={activeSegment === seg.value}
            aria-label={`Filtrar: ${seg.label}`}
            onClick={() => { setActiveSegment(seg.value); setPage(1); }}
            className="flex-1 min-w-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor:
                activeSegment === seg.value ? '#FFFFFF' : 'transparent',
              color:
                activeSegment === seg.value
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
              boxShadow:
                activeSegment === seg.value
                  ? '0 1px 4px rgba(0,0,0,0.08)'
                  : 'none',
              fontWeight: activeSegment === seg.value ? 600 : 500,
            }}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Search bar + Filter toggle                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <SearchIcon />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Buscar por cliente ou produto..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all outline-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid transparent',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            }}
            aria-label="Buscar lembretes"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="px-3 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
          style={{
            backgroundColor: showFilters || hasActiveFilters
              ? 'rgba(10,132,255,0.10)'
              : 'var(--color-surface)',
            color: showFilters || hasActiveFilters
              ? 'var(--color-primary)'
              : 'var(--color-text-secondary)',
          }}
          aria-label="Mostrar filtros avancados"
          aria-expanded={showFilters}
        >
          <FilterIcon />
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Advanced Filters (collapsible)                                    */}
      {/* ----------------------------------------------------------------- */}
      {showFilters && (
        <div
          className="rounded-xl p-4 space-y-4"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          {/* Status chips */}
          <div>
            <label
              className="block text-xs font-semibold uppercase mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusChips.map((chip) => {
                const active = filters.statuses.includes(chip.value);
                const cfg = STATUS_CONFIG[chip.value];
                return (
                  <button
                    key={chip.value}
                    onClick={() => toggleStatusFilter(chip.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                    style={{
                      backgroundColor: active ? cfg.bg : 'var(--color-surface)',
                      color: active ? cfg.text : 'var(--color-text-secondary)',
                      border: active
                        ? `1px solid ${cfg.text}`
                        : '1px solid transparent',
                    }}
                    aria-pressed={active}
                    aria-label={`Filtrar por status: ${chip.label}`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range + Product */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="filterDateFrom"
                className="block text-xs font-semibold uppercase mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Data inicial
              </label>
              <input
                id="filterDateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
                aria-label="Filtro data inicial"
              />
            </div>
            <div>
              <label
                htmlFor="filterDateTo"
                className="block text-xs font-semibold uppercase mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Data final
              </label>
              <input
                id="filterDateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
                aria-label="Filtro data final"
              />
            </div>
            <div>
              <label
                htmlFor="filterProduct"
                className="block text-xs font-semibold uppercase mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Produto
              </label>
              <select
                id="filterProduct"
                value={filters.productName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    productName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
                aria-label="Filtro por produto"
              >
                <option value="">Todos os produtos</option>
                {productNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                style={{
                  color: 'var(--color-primary)',
                  backgroundColor: 'rgba(10,132,255,0.08)',
                }}
                aria-label="Limpar todos os filtros"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Reschedule Modal (inline)                                         */}
      {/* ----------------------------------------------------------------- */}
      {rescheduleId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setRescheduleId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Reagendar lembrete"
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Reagendar Lembrete
            </h3>
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Escolha uma nova data para o lembrete.
            </p>
            <div>
              <label
                htmlFor="rescheduleDate"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Nova data
              </label>
              <input
                id="rescheduleDate"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                aria-label="Nova data do lembrete"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRescheduleId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
                aria-label="Cancelar reagendamento"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReschedule}
                disabled={!rescheduleDate || updateStatus.isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                }}
                aria-label="Confirmar reagendamento"
              >
                {updateStatus.isPending ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Reminders List                                                    */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        {isLoading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i < 4 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <ReminderSkeleton />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'rgba(255,59,48,0.10)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF3B30"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--color-danger)' }}
            >
              Erro ao carregar lembretes
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Verifique sua conexao e tente novamente.
            </p>
          </div>
        ) : filteredReminders.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters || activeSegment !== 'all'} />
        ) : (
          <div>
            {/* Results count */}
            <div
              className="px-4 py-2.5 text-xs font-medium"
              style={{
                color: 'var(--color-text-secondary)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {filteredReminders.length}{' '}
              {filteredReminders.length === 1 ? 'lembrete' : 'lembretes'}
              {hasActiveFilters ? ' (filtrados)' : ''}
            </div>

            {/* List */}
            <div>
              {filteredReminders.map((reminder, index) => (
                <div
                  key={reminder.id}
                  style={{
                    borderBottom:
                      index < filteredReminders.length - 1
                        ? '1px solid var(--color-border)'
                        : 'none',
                  }}
                >
                  <ReminderCard
                    reminder={reminder}
                    onSend={handleSend}
                    onCancel={handleCancel}
                    onConvert={handleConvert}
                    onReschedule={handleReschedule}
                    isUpdating={updateStatus.isPending}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Pagination                                                        */}
      {/* ----------------------------------------------------------------- */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-30"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
            aria-label="Pagina anterior"
          >
            Anterior
          </button>
          <span
            className="text-sm font-medium px-3"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-30"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
            aria-label="Proxima pagina"
          >
            Proximo
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Mobile FAB                                                        */}
      {/* ----------------------------------------------------------------- */}
      <Link
        href="/reminders/new"
        className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 z-40"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(10,132,255,0.40)',
        }}
        aria-label="Novo lembrete"
      >
        <PlusIcon />
      </Link>
    </div>
  );
}
