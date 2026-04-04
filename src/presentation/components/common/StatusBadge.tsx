'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const STATUS_LABEL_MAP: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending_repurchase: 'Recompra Pendente',
  delivered: 'Entregue',
  received: 'Recebido',
  in_preparation: 'Em Manipulacao',
  ready: 'Pronto',
  cancelled: 'Cancelado',
  scheduled: 'Agendado',
  sent: 'Enviado',
  viewed: 'Visualizado',
  converted: 'Convertido',
  ignored: 'Ignorado',
  ok: 'OK',
  warning: 'Alerta',
  critical: 'Critico',
};

const STATUS_VARIANT_MAP: Record<string, StatusBadgeProps['variant']> = {
  active: 'success',
  delivered: 'success',
  converted: 'success',
  ok: 'info',
  pending_repurchase: 'warning',
  scheduled: 'warning',
  in_preparation: 'warning',
  ready: 'warning',
  warning: 'warning',
  inactive: 'danger',
  cancelled: 'danger',
  critical: 'danger',
  received: 'info',
  sent: 'info',
  viewed: 'info',
  ignored: 'default',
};

const VARIANT_STYLES: Record<string, string> = {
  success: 'bg-[#34C759]/15 text-[#34C759]',
  warning: 'bg-[#FF9500]/15 text-[#FF9500]',
  danger: 'bg-[#FF3B30]/15 text-[#FF3B30]',
  info: 'bg-[#0A84FF]/15 text-[#0A84FF]',
  default: 'bg-[#F2F2F7] text-[#6E6E73]',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant ?? STATUS_VARIANT_MAP[status] ?? 'default';
  const label = STATUS_LABEL_MAP[status] ?? status;
  const styles = VARIANT_STYLES[resolvedVariant];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${styles}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
