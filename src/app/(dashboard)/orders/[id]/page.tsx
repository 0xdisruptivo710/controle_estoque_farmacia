'use client';

import { use } from 'react';
import Link from 'next/link';
import { useOrder, useUpdateOrderStatus } from '@/presentation/hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import type { OrderStatus } from '@/application/dtos/OrderDTO';

const steps: { key: OrderStatus; label: string }[] = [
  { key: 'received', label: 'Recebido' },
  { key: 'in_preparation', label: 'Em Preparo' },
  { key: 'ready', label: 'Pronto' },
  { key: 'delivered', label: 'Entregue' },
];

const statusConfig: Record<string, { text: string; className: string }> = {
  received: { text: 'Recebido', className: 'badge-primary' },
  in_preparation: { text: 'Em Preparo', className: 'badge-warning' },
  ready: { text: 'Pronto', className: 'badge-success' },
  delivered: { text: 'Entregue', className: 'badge-success' },
  cancelled: { text: 'Cancelado', className: 'badge-danger' },
};

function getStepIndex(status: OrderStatus): number {
  const idx = steps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useAuthStore((s) => s.user);
  const { data: order, isLoading, error } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();

  async function handleAdvanceStatus() {
    if (!order || !user) return;
    const currentIdx = getStepIndex(order.status);
    if (currentIdx < 0 || currentIdx >= steps.length - 1) return;
    const nextStatus = steps[currentIdx + 1].key;

    await updateStatus.mutateAsync({
      orderId: order.id,
      dto: { status: nextStatus, updatedBy: user.id },
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
          <div className="card p-6 space-y-3">
            <div className="h-5 w-64 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
            <div className="h-4 w-48 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
            Pedido nao encontrado ou erro ao carregar.
          </p>
          <Link href="/orders" className="btn-primary mt-4 inline-flex" aria-label="Voltar para pedidos">
            Voltar para Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const status = statusConfig[order.status] ?? statusConfig.received;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
          aria-label="Voltar para lista de pedidos"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              {order.orderNumber}
            </h1>
            <span className={`badge ${status.className}`}>{status.text}</span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Cliente: {order.customerName}
          </p>
        </div>
      </div>

      {/* Status Stepper */}
      {!isCancelled && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Progresso
          </h2>
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: isCompleted ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: isCompleted ? '#FFFFFF' : 'var(--color-text-secondary)',
                        border: isCurrent ? '2px solid var(--color-primary)' : 'none',
                      }}
                    >
                      {isCompleted && idx < currentStepIdx ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className="text-xs mt-1.5 font-medium text-center hidden sm:block"
                      style={{ color: isCompleted ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-2"
                      style={{
                        backgroundColor: idx < currentStepIdx ? 'var(--color-primary)' : 'var(--color-border)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {currentStepIdx < steps.length - 1 && (
            <button
              onClick={handleAdvanceStatus}
              disabled={updateStatus.isPending}
              className="btn-primary w-full mt-4"
              aria-label={`Avancar para ${steps[currentStepIdx + 1]?.label}`}
            >
              {updateStatus.isPending
                ? 'Atualizando...'
                : `Avancar para "${steps[currentStepIdx + 1]?.label}"`}
            </button>
          )}
        </div>
      )}

      {/* Order details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Detalhes do Pedido
          </h2>
          <div className="space-y-2">
            <InfoRow label="Data do Pedido" value={new Date(order.orderDate).toLocaleDateString('pt-BR')} />
            <InfoRow
              label="Entrega Estimada"
              value={order.estimatedReadyDate ? new Date(order.estimatedReadyDate).toLocaleDateString('pt-BR') : undefined}
            />
            <InfoRow
              label="Entregue em"
              value={order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('pt-BR') : undefined}
            />
            <InfoRow label="Medico" value={order.prescribingDoctor} />
            <InfoRow label="Receita" value={order.prescriptionNumber} />
            <InfoRow label="Pagamento" value={order.paymentMethod} />
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Valores
          </h2>
          <div className="space-y-2">
            <InfoRow label="Subtotal" value={`R$ ${order.subtotal.toFixed(2)}`} />
            <InfoRow label="Desconto" value={`R$ ${order.discount.toFixed(2)}`} />
            <div className="pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Total
                </span>
                <span className="text-lg font-bold" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
                  R$ {order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Itens do Pedido ({order.items.length})
        </h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {item.productName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.quantity}x R$ {item.unitPrice.toFixed(2)}
                  {item.dosage ? ` - ${item.dosage}` : ''}
                </p>
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                R$ {item.totalPrice.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {(order.notes || order.internalNotes) && (
        <div className="card p-5 space-y-3">
          {order.notes && (
            <div>
              <h2 className="text-sm font-semibold uppercase mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Observacoes
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{order.notes}</p>
            </div>
          )}
          {order.internalNotes && (
            <div>
              <h2 className="text-sm font-semibold uppercase mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Notas Internas
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{order.internalNotes}</p>
            </div>
          )}
        </div>
      )}
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
