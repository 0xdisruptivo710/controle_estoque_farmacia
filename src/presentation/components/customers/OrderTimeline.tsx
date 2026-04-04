'use client';

import React from 'react';
import { StatusBadge } from '@/presentation/components/common/StatusBadge';
import { Skeleton } from '@/presentation/components/common/Skeleton';
import { EmptyState } from '@/presentation/components/common/EmptyState';

interface TimelineOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items?: Array<{ productName: string; quantity: number }>;
}

interface OrderTimelineProps {
  orders: TimelineOrder[];
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function OrderTimeline({ orders, isLoading = false }: OrderTimelineProps) {
  if (isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-label="Carregando historico de pedidos"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-16 w-px mt-1" />
            </div>
            <div className="flex-1 rounded-[12px] bg-[#F2F2F7] p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Nenhum pedido"
        description="Este cliente ainda nao possui pedidos registrados."
        icon={
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            className="text-[#E5E5EA]"
          >
            <rect
              x="8"
              y="6"
              width="32"
              height="36"
              rx="4"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M16 16h16M16 24h10M16 32h14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        }
      />
    );
  }

  return (
    <div className="relative" role="list" aria-label="Historico de pedidos">
      {/* Timeline line */}
      <div
        className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-[#E5E5EA]"
        aria-hidden="true"
      />

      <div className="space-y-4">
        {orders.map((order, index) => (
          <div key={order.id} className="relative flex gap-4" role="listitem">
            {/* Dot */}
            <div className="relative z-10 mt-1.5 shrink-0">
              <div
                className={`h-[11px] w-[11px] rounded-full border-2 border-white ${
                  order.status === 'delivered'
                    ? 'bg-[#34C759]'
                    : order.status === 'cancelled'
                      ? 'bg-[#FF3B30]'
                      : index === 0
                        ? 'bg-[#0A84FF]'
                        : 'bg-[#E5E5EA]'
                }`}
                aria-hidden="true"
              />
            </div>

            {/* Card */}
            <div className="flex-1 rounded-[12px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#1C1C1E]">
                    {order.orderNumber}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <span className="text-[13px] text-[#6E6E73]">
                  {formatDate(order.orderDate)}
                </span>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mt-2 text-[13px] text-[#6E6E73]">
                  {order.items.map((item, itemIdx) => (
                    <span key={itemIdx}>
                      {item.productName} (x{item.quantity})
                      {itemIdx < order.items!.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 text-[15px] font-semibold text-[#1C1C1E]">
                {formatCurrency(order.totalAmount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
