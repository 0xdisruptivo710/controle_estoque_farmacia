'use client';

import React from 'react';

interface AlertCardProps {
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

const TYPE_CONFIG: Record<
  AlertCardProps['type'],
  { border: string; bg: string; iconColor: string; icon: React.ReactNode }
> = {
  critical: {
    border: 'border-l-[#FF3B30]',
    bg: 'bg-[#FF3B30]/5',
    iconColor: 'text-[#FF3B30]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M10 6v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="14" r="1" fill="currentColor" />
      </svg>
    ),
  },
  warning: {
    border: 'border-l-[#FF9500]',
    bg: 'bg-[#FF9500]/5',
    iconColor: 'text-[#FF9500]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 2L1 18h18L10 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M10 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
  info: {
    border: 'border-l-[#0A84FF]',
    bg: 'bg-[#0A84FF]/5',
    iconColor: 'text-[#0A84FF]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="7" r="1" fill="currentColor" />
        <path d="M10 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  success: {
    border: 'border-l-[#34C759]',
    bg: 'bg-[#34C759]/5',
    iconColor: 'text-[#34C759]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="M6 10l3 3 5-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

export function AlertCard({ type, title, message, action }: AlertCardProps) {
  const config = TYPE_CONFIG[type];

  return (
    <div
      className={`rounded-[12px] border-l-4 ${config.border} ${config.bg} p-4`}
      role="alert"
      aria-label={`${type === 'critical' ? 'Alerta critico' : type === 'warning' ? 'Aviso' : type === 'success' ? 'Sucesso' : 'Informacao'}: ${title}`}
    >
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 ${config.iconColor}`}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-[#1C1C1E] leading-tight">
            {title}
          </h3>
          <p className="mt-1 text-[13px] text-[#6E6E73] leading-relaxed">{message}</p>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-3 inline-flex items-center text-[13px] font-semibold text-[#0A84FF] hover:text-[#0A84FF]/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 rounded-[4px]"
              aria-label={action.label}
            >
              {action.label}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                className="ml-1"
              >
                <path
                  d="M5 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
