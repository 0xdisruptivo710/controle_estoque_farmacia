'use client';

import { use } from 'react';
import Link from 'next/link';
import { useCustomer } from '@/presentation/hooks/useCustomers';
import { useCustomerOrders } from '@/presentation/hooks/useOrders';

const statusLabels: Record<string, { text: string; className: string }> = {
  active: { text: 'Ativo', className: 'badge-success' },
  inactive: { text: 'Inativo', className: 'badge-danger' },
  pending_repurchase: { text: 'Recompra Pendente', className: 'badge-warning' },
};

const orderStatusLabels: Record<string, { text: string; className: string }> = {
  received: { text: 'Recebido', className: 'badge-primary' },
  in_preparation: { text: 'Em Preparo', className: 'badge-warning' },
  ready: { text: 'Pronto', className: 'badge-success' },
  delivered: { text: 'Entregue', className: 'badge-success' },
  cancelled: { text: 'Cancelado', className: 'badge-danger' },
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: customer, isLoading, error } = useCustomer(id);
  const { data: ordersData } = useCustomerOrders(id);

  const orders = ordersData?.data ?? [];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
          <div className="card p-6 space-y-3">
            <div className="h-5 w-64 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
            <div className="h-4 w-48 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
            <div className="h-4 w-56 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
            Cliente nao encontrado ou erro ao carregar.
          </p>
          <Link href="/customers" className="btn-primary mt-4 inline-flex" aria-label="Voltar para clientes">
            Voltar para Clientes
          </Link>
        </div>
      </div>
    );
  }

  const status = statusLabels[customer.status] ?? statusLabels.active;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
          aria-label="Voltar para lista de clientes"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            {customer.fullName}
          </h1>
          <span className={`badge ${status.className} mt-1`}>{status.text}</span>
        </div>
      </div>

      {/* Customer info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Dados Pessoais
          </h2>
          <div className="space-y-2">
            <InfoRow label="CPF" value={customer.cpf} />
            <InfoRow label="E-mail" value={customer.email} />
            <InfoRow label="Telefone" value={customer.phone} />
            <InfoRow label="WhatsApp" value={customer.whatsapp} />
            <InfoRow label="Nascimento" value={customer.birthDate ? new Date(customer.birthDate).toLocaleDateString('pt-BR') : undefined} />
            <InfoRow label="Genero" value={customer.gender} />
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Informacoes Clinicas
          </h2>
          <div className="space-y-2">
            <InfoRow label="Medico" value={customer.prescribingDoctor} />
            <InfoRow label="Total de Pedidos" value={String(customer.totalOrders)} />
            <InfoRow
              label="Ultimo Pedido"
              value={customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('pt-BR') : undefined}
            />
          </div>
          {customer.clinicalNotes && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Notas Clinicas
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {customer.clinicalNotes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order history */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Historico de Pedidos
        </h2>
        {orders.length === 0 ? (
          <div className="text-center py-6">
            <svg className="mx-auto mb-2" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Nenhum pedido registrado
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const orderStatus = orderStatusLabels[order.status] ?? orderStatusLabels.received;
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {order.orderNumber}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(order.orderDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      R$ {order.totalAmount.toFixed(2)}
                    </span>
                    <span className={`badge ${orderStatus.className}`}>{orderStatus.text}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {value || '--'}
      </span>
    </div>
  );
}
