'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StockSummaryItem {
  productId: string;
  productName: string;
  unitOfMeasure: string;
  minimumStock: number;
  maximumStock: number | null;
  category: string;
  totalQuantity: number;
  lotCount: number;
  nearestExpiration: string | null;
  alertLevel: 'ok' | 'warning' | 'critical';
}

interface StockDashboardData {
  totalProducts: number;
  productsWithStock: number;
  criticalAlerts: number;
  warningAlerts: number;
  expiringThisMonth: number;
  summaries: StockSummaryItem[];
}

interface ReminderItem {
  id: string;
  customerId: string;
  customerName: string;
  productId?: string;
  productName?: string;
  scheduledDate: string;
  status: 'scheduled' | 'sent' | 'viewed' | 'converted' | 'ignored' | 'cancelled';
  channel: string;
}

interface RemindersData {
  data: ReminderItem[];
  total: number;
  overdue: number;
  today: number;
  upcoming: number;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: 'received' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled';
  orderDate: string;
  totalAmount: number;
}

interface OrdersData {
  data: OrderItem[];
  total: number;
}

interface CustomersData {
  data: unknown[];
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function getRelativeDate(dateStr: string): { label: string; urgency: 'overdue' | 'today' | 'future' } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -1) {
    return { label: `Ha ${Math.abs(diffDays)} dias`, urgency: 'overdue' };
  }
  if (diffDays === -1) {
    return { label: 'Ontem', urgency: 'overdue' };
  }
  if (diffDays === 0) {
    return { label: 'Hoje', urgency: 'today' };
  }
  if (diffDays === 1) {
    return { label: 'Amanha', urgency: 'future' };
  }
  return { label: `Em ${diffDays} dias`, urgency: 'future' };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  received: 'Recebido',
  in_preparation: 'Em Manipulacao',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  received: { bg: '#0A84FF1A', text: '#0A84FF' },
  in_preparation: { bg: '#FF95001A', text: '#FF9500' },
  ready: { bg: '#34C7591A', text: '#34C759' },
  delivered: { bg: '#6E6E731A', text: '#6E6E73' },
  cancelled: { bg: '#FF3B301A', text: '#FF3B30' },
};

const REMINDER_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  sent: 'Enviado',
  viewed: 'Visualizado',
  converted: 'Convertido',
  ignored: 'Ignorado',
  cancelled: 'Cancelado',
};

// ---------------------------------------------------------------------------
// Icons (inline SVG components)
// ---------------------------------------------------------------------------

function IconPeople({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconClipboard({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  );
}

function IconWarning({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconBell({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconPlus({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconPackage({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconCheck({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAlertCircle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconCalendar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconUserPlus({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Components
// ---------------------------------------------------------------------------

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: 'var(--color-surface)' }}
    />
  );
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card p-5">
          <div className="flex items-center gap-4">
            <SkeletonPulse className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-3 w-20" />
              <SkeletonPulse className="h-7 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonPulse className="w-2 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
          <SkeletonPulse className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function StockSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
          <SkeletonPulse className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Error Component
// ---------------------------------------------------------------------------

function SectionError({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-lg text-sm"
      style={{ backgroundColor: '#FF3B301A', color: 'var(--color-danger)' }}
    >
      <IconAlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State Component
// ---------------------------------------------------------------------------

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-3" style={{ color: 'var(--color-border)' }}>
        {icon}
      </div>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {message}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuthStore();
  const pharmacyId = user?.pharmacyId ?? '';

  // Data state
  const [stockData, setStockData] = useState<StockDashboardData | null>(null);
  const [remindersData, setRemindersData] = useState<RemindersData | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [customersData, setCustomersData] = useState<CustomersData | null>(null);

  // Loading state
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Error state
  const [errorStock, setErrorStock] = useState<string | null>(null);
  const [errorReminders, setErrorReminders] = useState<string | null>(null);
  const [errorOrders, setErrorOrders] = useState<string | null>(null);
  const [errorCustomers, setErrorCustomers] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!pharmacyId) return;

    // Fetch all endpoints in parallel
    const stockPromise = fetch('/api/stock/dashboard')
      .then(async (res) => {
        if (!res.ok) throw new Error('Falha ao carregar dados de estoque');
        return res.json() as Promise<StockDashboardData>;
      })
      .then((data) => { setStockData(data); setErrorStock(null); })
      .catch((err: Error) => setErrorStock(err.message))
      .finally(() => setLoadingStock(false));

    const remindersPromise = fetch(`/api/reminders?pharmacyId=${pharmacyId}&limit=5`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Falha ao carregar lembretes');
        return res.json() as Promise<RemindersData>;
      })
      .then((data) => { setRemindersData(data); setErrorReminders(null); })
      .catch((err: Error) => setErrorReminders(err.message))
      .finally(() => setLoadingReminders(false));

    const ordersPromise = fetch(`/api/orders?pharmacyId=${pharmacyId}&limit=5`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Falha ao carregar pedidos');
        return res.json() as Promise<OrdersData>;
      })
      .then((data) => { setOrdersData(data); setErrorOrders(null); })
      .catch((err: Error) => setErrorOrders(err.message))
      .finally(() => setLoadingOrders(false));

    const customersPromise = fetch(`/api/customers?pharmacyId=${pharmacyId}&limit=1`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Falha ao carregar clientes');
        return res.json() as Promise<CustomersData>;
      })
      .then((data) => { setCustomersData(data); setErrorCustomers(null); })
      .catch((err: Error) => setErrorCustomers(err.message))
      .finally(() => setLoadingCustomers(false));

    await Promise.allSettled([stockPromise, remindersPromise, ordersPromise, customersPromise]);
  }, [pharmacyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived values
  const totalAlerts = (stockData?.criticalAlerts ?? 0) + (stockData?.warningAlerts ?? 0);
  const isKPILoading = loadingStock || loadingReminders || loadingOrders || loadingCustomers;

  // Filter stock summaries for critical/warning items (max 5)
  const criticalStockItems = (stockData?.summaries ?? [])
    .filter((s) => s.alertLevel === 'critical' || s.alertLevel === 'warning')
    .sort((a, b) => {
      if (a.alertLevel === 'critical' && b.alertLevel !== 'critical') return -1;
      if (a.alertLevel !== 'critical' && b.alertLevel === 'critical') return 1;
      return a.totalQuantity - b.totalQuantity;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* KPI CARDS ROW                                                    */}
      {/* ---------------------------------------------------------------- */}
      {isKPILoading ? (
        <KPISkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Clientes Ativos */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#0A84FF1A', color: '#0A84FF' }}
              >
                <IconPeople size={24} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Clientes Ativos
                </p>
                <p
                  className="text-2xl font-bold mt-0.5"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {errorCustomers ? '--' : (customersData?.total ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Pedidos do Mes */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#0A84FF1A', color: '#0A84FF' }}
              >
                <IconClipboard size={24} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Pedidos do Mes
                </p>
                <p
                  className="text-2xl font-bold mt-0.5"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {errorOrders ? '--' : (ordersData?.total ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Alertas de Estoque */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: totalAlerts > 0 ? '#FF3B301A' : '#FF95001A',
                  color: totalAlerts > 0 ? '#FF3B30' : '#FF9500',
                }}
              >
                <IconWarning size={24} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Alertas de Estoque
                </p>
                <p
                  className="text-2xl font-bold mt-0.5"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {errorStock ? '--' : totalAlerts}
                </p>
              </div>
            </div>
          </div>

          {/* Lembretes Pendentes */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FF95001A', color: '#FF9500' }}
              >
                <IconBell size={24} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Lembretes Pendentes
                </p>
                <p
                  className="text-2xl font-bold mt-0.5"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {errorReminders ? '--' : (remindersData?.total ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TWO-COLUMN LAYOUT                                                */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ============================================================== */}
        {/* LEFT COLUMN (3/5 = 60%)                                        */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 space-y-6">
          {/* -------------------------------------------------------------- */}
          {/* Lembretes de Recompra                                          */}
          {/* -------------------------------------------------------------- */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Lembretes de Recompra
              </h3>
              <Link
                href="/reminders"
                className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-primary)' }}
                aria-label="Ver todos os lembretes"
              >
                Ver todos
                <IconChevronRight size={14} />
              </Link>
            </div>

            {/* Reminder counts */}
            {!loadingReminders && !errorReminders && remindersData && (
              <div className="flex gap-3 mb-4 flex-wrap">
                {remindersData.overdue > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: '#FF3B301A', color: '#FF3B30' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#FF3B30' }}
                    />
                    {remindersData.overdue} atrasado{remindersData.overdue !== 1 ? 's' : ''}
                  </span>
                )}
                {remindersData.today > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: '#FF95001A', color: '#FF9500' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#FF9500' }}
                    />
                    {remindersData.today} hoje
                  </span>
                )}
                {remindersData.upcoming > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: '#0A84FF1A', color: '#0A84FF' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#0A84FF' }}
                    />
                    {remindersData.upcoming} agendado{remindersData.upcoming !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {/* Reminder list */}
            {loadingReminders ? (
              <ListSkeleton rows={4} />
            ) : errorReminders ? (
              <SectionError message={errorReminders} />
            ) : remindersData && remindersData.data.length > 0 ? (
              <div className="space-y-1">
                {remindersData.data.map((reminder) => {
                  const relative = getRelativeDate(reminder.scheduledDate);
                  const urgencyColors = {
                    overdue: '#FF3B30',
                    today: '#FF9500',
                    future: '#0A84FF',
                  };
                  const barColor = urgencyColors[relative.urgency];

                  return (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50"
                    >
                      {/* Color indicator bar */}
                      <div
                        className="w-1 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: barColor }}
                      />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {reminder.customerName}
                        </p>
                        <p
                          className="text-xs truncate mt-0.5"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {reminder.productName ?? 'Produto nao especificado'}
                        </p>
                      </div>
                      {/* Date */}
                      <div className="text-right shrink-0">
                        <p
                          className="text-xs font-medium"
                          style={{ color: barColor }}
                        >
                          {relative.label}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {formatDate(reminder.scheduledDate)}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                        style={{
                          backgroundColor: relative.urgency === 'overdue' ? '#FF3B301A' : '#0A84FF1A',
                          color: relative.urgency === 'overdue' ? '#FF3B30' : '#0A84FF',
                        }}
                      >
                        {REMINDER_STATUS_LABELS[reminder.status] ?? reminder.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                message="Nenhum lembrete agendado"
                icon={<IconBell size={40} />}
              />
            )}
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Pedidos Recentes                                               */}
          {/* -------------------------------------------------------------- */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Pedidos Recentes
              </h3>
              <Link
                href="/orders"
                className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-primary)' }}
                aria-label="Ver todos os pedidos"
              >
                Ver todos
                <IconChevronRight size={14} />
              </Link>
            </div>

            {loadingOrders ? (
              <ListSkeleton rows={4} />
            ) : errorOrders ? (
              <SectionError message={errorOrders} />
            ) : ordersData && ordersData.data.length > 0 ? (
              <div className="space-y-1">
                {ordersData.data.map((order) => {
                  const statusStyle = ORDER_STATUS_COLORS[order.status] ?? ORDER_STATUS_COLORS.received;
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50"
                    >
                      {/* Order number pill */}
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-mono font-medium shrink-0"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
                      >
                        {order.orderNumber}
                      </span>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {order.customerName}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {formatDate(order.orderDate)}
                        </p>
                      </div>
                      {/* Amount */}
                      <span
                        className="text-sm font-semibold shrink-0"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {formatCurrency(order.totalAmount)}
                      </span>
                      {/* Status badge */}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                message="Nenhum pedido registrado"
                icon={<IconClipboard size={40} />}
              />
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN (2/5 = 40%)                                       */}
        {/* ============================================================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* -------------------------------------------------------------- */}
          {/* Estoque Critico                                                */}
          {/* -------------------------------------------------------------- */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Estoque Critico
              </h3>
              <Link
                href="/stock"
                className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-primary)' }}
                aria-label="Ver todo o estoque"
              >
                Ver todos
                <IconChevronRight size={14} />
              </Link>
            </div>

            {/* Alert summary counts */}
            {!loadingStock && !errorStock && stockData && (stockData.criticalAlerts > 0 || stockData.warningAlerts > 0) && (
              <div className="flex gap-3 mb-4 flex-wrap">
                {stockData.criticalAlerts > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: '#FF3B301A', color: '#FF3B30' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#FF3B30' }}
                    />
                    {stockData.criticalAlerts} critico{stockData.criticalAlerts !== 1 ? 's' : ''}
                  </span>
                )}
                {stockData.warningAlerts > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: '#FF95001A', color: '#FF9500' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#FF9500' }}
                    />
                    {stockData.warningAlerts} baixo{stockData.warningAlerts !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {loadingStock ? (
              <StockSkeleton />
            ) : errorStock ? (
              <SectionError message={errorStock} />
            ) : criticalStockItems.length > 0 ? (
              <div className="space-y-4">
                {criticalStockItems.map((item) => {
                  const maxVal = item.minimumStock > 0 ? item.minimumStock * 2 : 100;
                  const percentage = Math.min((item.totalQuantity / maxVal) * 100, 100);
                  const barColor = item.alertLevel === 'critical' ? '#FF3B30' : '#FF9500';

                  return (
                    <div key={item.productId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p
                          className="text-sm font-medium truncate flex-1 mr-2"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {item.productName}
                        </p>
                        <p
                          className="text-xs font-medium shrink-0"
                          style={{ color: barColor }}
                        >
                          {item.totalQuantity} / {item.minimumStock} {item.unitOfMeasure}
                        </p>
                      </div>
                      {/* Progress bar */}
                      <div
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.max(percentage, 2)}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                message="Estoque saudavel - nenhum alerta"
                icon={<IconCheck size={40} />}
              />
            )}
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Acoes Rapidas                                                  */}
          {/* -------------------------------------------------------------- */}
          <div className="card p-5">
            <h3
              className="text-base font-semibold mb-4"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
            >
              Acoes Rapidas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/customers/new"
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-colors hover:bg-gray-50"
                style={{ backgroundColor: 'var(--color-surface)' }}
                aria-label="Cadastrar novo cliente"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#0A84FF1A', color: '#0A84FF' }}
                >
                  <IconUserPlus size={18} />
                </div>
                <span
                  className="text-xs font-medium text-center"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Novo Cliente
                </span>
              </Link>

              <Link
                href="/orders/new"
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-colors hover:bg-gray-50"
                style={{ backgroundColor: 'var(--color-surface)' }}
                aria-label="Criar novo pedido"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#34C7591A', color: '#34C759' }}
                >
                  <IconPlus size={18} />
                </div>
                <span
                  className="text-xs font-medium text-center"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Novo Pedido
                </span>
              </Link>

              <Link
                href="/reminders"
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-colors hover:bg-gray-50"
                style={{ backgroundColor: 'var(--color-surface)' }}
                aria-label="Gerenciar lembretes"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#FF95001A', color: '#FF9500' }}
                >
                  <IconCalendar size={18} />
                </div>
                <span
                  className="text-xs font-medium text-center"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Lembretes
                </span>
              </Link>

              <Link
                href="/stock"
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-colors hover:bg-gray-50"
                style={{ backgroundColor: 'var(--color-surface)' }}
                aria-label="Ver estoque"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#6E6E731A', color: '#6E6E73' }}
                >
                  <IconPackage size={18} />
                </div>
                <span
                  className="text-xs font-medium text-center"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Ver Estoque
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
