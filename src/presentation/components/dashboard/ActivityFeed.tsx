'use client';

import React from 'react';
import { Skeleton } from '@/presentation/components/common/Skeleton';
import { EmptyState } from '@/presentation/components/common/EmptyState';

interface Activity {
  id: string;
  action: string;
  resource: string;
  user: string;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
}

function formatTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export function ActivityFeed({
  activities,
  isLoading = false,
}: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-[12px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA]"
        role="status"
        aria-label="Carregando atividades"
      >
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA]">
      <h2 className="text-[17px] font-semibold text-[#1C1C1E] mb-4">
        Atividade Recente
      </h2>
      {activities.length === 0 ? (
        <EmptyState
          title="Nenhuma atividade"
          description="As acoes recentes da equipe aparecerao aqui."
        />
      ) : (
        <div className="relative" role="list" aria-label="Lista de atividades recentes">
          {/* Timeline vertical line */}
          <div
            className="absolute left-4 top-4 bottom-4 w-px bg-[#E5E5EA]"
            aria-hidden="true"
          />

          <div className="space-y-0">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="relative flex items-start gap-3 py-3 pl-0"
                role="listitem"
              >
                {/* Avatar / dot */}
                <div className="relative z-10 shrink-0">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F7] text-[11px] font-semibold text-[#6E6E73] border-2 border-white"
                    aria-hidden="true"
                  >
                    {getInitials(activity.user)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[14px] text-[#1C1C1E] leading-snug">
                    <span className="font-semibold">{activity.user}</span>{' '}
                    <span className="text-[#6E6E73]">{activity.action}</span>{' '}
                    <span className="font-medium">{activity.resource}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#6E6E73]">
                    {formatTime(activity.createdAt)}
                  </p>
                </div>

                {/* Separator line between items (except last) */}
                {index < activities.length - 1 && (
                  <div
                    className="absolute bottom-0 left-11 right-0 h-px bg-[#E5E5EA]/60"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
