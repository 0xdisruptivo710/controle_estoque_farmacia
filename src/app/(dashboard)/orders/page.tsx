'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOrders } from '@/presentation/hooks/useOrders';

type StatusTab = '' | 'received' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled';

const tabs: { value: StatusTab; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'received', label: 'Recebidos' },
  { value: 'in_preparation', label: 'Em Preparo' },
  { value: 'ready', label: 'Prontos' },
  { value: 'delivered', label: 'Entregues' },
  { value: 'cancelled', label: 'Cancelados' },
];

const statusConfig: Record<string, { text: string; className: string }> = {
  received: { text: 'Recebido', className: 'badge-primary' },
  in_preparation: { text: 'Em Preparo', className: 'badge-warning' },
  ready: { text: 'Pronto', className: 'badge-success' },
  delivered: { text: 'Entregue', className: 'badge-success' },
  cancelled: { text: 'Cancelado', className: 'badge-danger' },
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusTab>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useOrders({
    status: statusFilter || undefined,
    page,
    limit,
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Pedidos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {total} pedido(s) encontrado(s)
          </p>
        </div>
        <Link href="/orders/new" className="btn-primary" aria-label="Novo pedido">
          + Novo Pedido
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: statusFilter === tab.value ? 'var(--color-primary)' : 'var(--color-background)',
              color: statusFilter === tab.value ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: statusFilter === tab.value ? 'none' : '1px solid var(--color-border)',
            }}
            aria-label={`Filtrar por ${tab.label}`}
            aria-pressed={statusFilter === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3" style={{ backgroundColor: 'var(--color-surface)' }} />
                  <div className="h-3 rounded w-1/4" style={{ backgroundColor: 'var(--color-surface)' }} />
                </div>
                <div className="h-6 w-20 rounded-full" style={{ backgroundColor: 'var(--color-surface)' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
              Erro ao carregar pedidos. Tente novamente.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Nenhum pedido encontrado
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {statusFilter ? 'Nenhum pedido com este status.' : 'Os pedidos aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {orders.map((order) => {
              const status = statusConfig[order.status] ?? statusConfig.received;
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-[var(--color-surface)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {order.orderNumber}
                      </span>
                      <span className={`badge ${status.className}`}>{status.text}</span>
                    </div>
                    <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {order.customerName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      {new Date(order.orderDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      R$ {order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {order.items.length} item(ns)
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Pagina {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              aria-label="Pagina anterior"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              aria-label="Proxima pagina"
            >
              Proximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
