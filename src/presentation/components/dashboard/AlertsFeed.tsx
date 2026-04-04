'use client';

import React from 'react';
import { AlertCard } from '@/presentation/components/common/AlertCard';
import { Skeleton } from '@/presentation/components/common/Skeleton';
import { EmptyState } from '@/presentation/components/common/EmptyState';

interface Alert {
  id: string;
  type: 'critical' | 'warning';
  title: string;
  message: string;
  createdAt: string;
}

interface AlertsFeedProps {
  alerts: Alert[];
  isLoading?: boolean;
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}min atras`;
  if (diffHours < 24) return `${diffHours}h atras`;
  if (diffDays < 7) return `${diffDays}d atras`;
  return date.toLocaleDateString('pt-BR');
}

export function AlertsFeed({ alerts, isLoading = false }: AlertsFeedProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-[12px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA]"
        role="status"
        aria-label="Carregando alertas"
      >
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[12px] bg-[#F2F2F7] p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA]">
      <h2 className="text-[17px] font-semibold text-[#1C1C1E] mb-4">
        Alertas Prioritarios
      </h2>
      {alerts.length === 0 ? (
        <EmptyState
          title="Nenhum alerta"
          description="Todos os indicadores estao dentro dos parametros normais."
          icon={
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
              className="text-[#34C759]"
            >
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" />
              <path
                d="M15 24l6 6 12-14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="Lista de alertas">
          {alerts.map((alert) => (
            <div key={alert.id} role="listitem">
              <div className="relative">
                <AlertCard
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                />
                <span className="absolute top-3 right-3 text-[11px] text-[#6E6E73] font-medium">
                  {formatRelativeTime(alert.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
