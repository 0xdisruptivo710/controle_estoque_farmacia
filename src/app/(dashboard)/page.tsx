import { createServerClient } from '@/infrastructure/supabase/server';

interface KPIData {
  activeCustomers: number;
  monthlyOrders: number;
  stockAlerts: number;
  pendingReminders: number;
}

async function getDashboardData(): Promise<KPIData> {
  try {
    const supabase = await createServerClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [customersResult, ordersResult, stockResult, remindersResult] = await Promise.all([
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('order_date', startOfMonth)
        .is('deleted_at', null),
      supabase
        .from('stock_items')
        .select('id', { count: 'exact', head: true })
        .in('alert_level', ['warning', 'critical'])
        .is('deleted_at', null),
      supabase
        .from('repurchase_reminders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .is('deleted_at', null),
    ]);

    return {
      activeCustomers: customersResult.count ?? 0,
      monthlyOrders: ordersResult.count ?? 0,
      stockAlerts: stockResult.count ?? 0,
      pendingReminders: remindersResult.count ?? 0,
    };
  } catch {
    return {
      activeCustomers: 0,
      monthlyOrders: 0,
      stockAlerts: 0,
      pendingReminders: 0,
    };
  }
}

const kpiConfig = [
  {
    key: 'activeCustomers' as const,
    label: 'Clientes Ativos',
    color: 'var(--color-primary)',
    lightColor: 'var(--color-primary-light)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    key: 'monthlyOrders' as const,
    label: 'Pedidos do Mes',
    color: 'var(--color-success)',
    lightColor: 'var(--color-success-light)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
      </svg>
    ),
  },
  {
    key: 'stockAlerts' as const,
    label: 'Alertas de Estoque',
    color: 'var(--color-warning)',
    lightColor: 'var(--color-warning-light)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    key: 'pendingReminders' as const,
    label: 'Lembretes Pendentes',
    color: 'var(--color-danger)',
    lightColor: 'var(--color-danger-light)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
];

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiConfig.map((kpi) => (
          <div key={kpi.key} className="card p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: kpi.lightColor, color: kpi.color }}
              >
                {kpi.icon}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                  {data[kpi.key]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas Prioritarios */}
        <div className="card p-5">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Alertas Prioritarios
          </h3>
          {data.stockAlerts > 0 || data.pendingReminders > 0 ? (
            <div className="space-y-3">
              {data.stockAlerts > 0 && (
                <div
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-warning-light)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>
                    {data.stockAlerts} produto(s) com estoque baixo
                  </span>
                </div>
              )}
              {data.pendingReminders > 0 && (
                <div
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-primary-light)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                    {data.pendingReminders} lembrete(s) pendente(s)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Nenhum alerta no momento
              </p>
            </div>
          )}
        </div>

        {/* Atividade Recente */}
        <div className="card p-5">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Atividade Recente
          </h3>
          <div className="text-center py-8">
            <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              As atividades recentes aparecerão aqui
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
