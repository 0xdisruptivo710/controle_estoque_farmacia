'use client';

import React from 'react';

interface StockGaugeProps {
  productName: string;
  currentQty: number;
  minQty: number;
  maxQty?: number;
  unit: string;
  alertLevel: 'ok' | 'warning' | 'critical';
}

const LEVEL_CONFIG: Record<
  StockGaugeProps['alertLevel'],
  { color: string; bg: string; label: string }
> = {
  ok: { color: '#34C759', bg: '#34C759', label: 'Normal' },
  warning: { color: '#FF9500', bg: '#FF9500', label: 'Alerta' },
  critical: { color: '#FF3B30', bg: '#FF3B30', label: 'Critico' },
};

export function StockGauge({
  productName,
  currentQty,
  minQty,
  maxQty,
  unit,
  alertLevel,
}: StockGaugeProps) {
  const config = LEVEL_CONFIG[alertLevel];
  const reference = maxQty ?? minQty * 3;
  const percentage = reference > 0 ? Math.min((currentQty / reference) * 100, 100) : 0;

  // SVG circular gauge
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="rounded-[12px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA]"
      aria-label={`Estoque de ${productName}: ${currentQty} ${unit}, nivel ${config.label}`}
    >
      <div className="flex items-center gap-4">
        {/* Circular gauge */}
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="#E5E5EA"
              strokeWidth="8"
            />
            {/* Filled arc */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={config.bg}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 48 48)"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[18px] font-bold leading-none"
              style={{ color: config.color }}
            >
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-[#1C1C1E] truncate leading-tight">
            {productName}
          </h3>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#6E6E73]">Atual</span>
              <span className="font-semibold text-[#1C1C1E]">
                {currentQty} {unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#6E6E73]">Minimo</span>
              <span className="text-[#6E6E73]">
                {minQty} {unit}
              </span>
            </div>
            {maxQty !== undefined && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6E6E73]">Maximo</span>
                <span className="text-[#6E6E73]">
                  {maxQty} {unit}
                </span>
              </div>
            )}
          </div>

          {/* Status pill */}
          <div className="mt-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: `${config.color}20`,
                color: config.color,
              }}
            >
              {config.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
