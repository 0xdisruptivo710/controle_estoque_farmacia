'use client';

import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

export function KPICard({
  title,
  value,
  icon,
  trend,
  color = '#0A84FF',
}: KPICardProps) {
  return (
    <div
      className="rounded-[12px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: `${color}15` }}
          aria-hidden="true"
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
              trend.isPositive
                ? 'bg-[#34C759]/15 text-[#34C759]'
                : 'bg-[#FF3B30]/15 text-[#FF3B30]'
            }`}
            aria-label={`Tendencia: ${trend.isPositive ? 'positiva' : 'negativa'} ${trend.value}%`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className={trend.isPositive ? '' : 'rotate-180'}
            >
              <path
                d="M6 2.5v7M6 2.5L3 5.5M6 2.5l3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[28px] font-bold text-[#1C1C1E] leading-none tracking-tight">
          {value}
        </p>
        <p className="mt-1 text-[13px] text-[#6E6E73] font-medium">{title}</p>
      </div>
    </div>
  );
}
