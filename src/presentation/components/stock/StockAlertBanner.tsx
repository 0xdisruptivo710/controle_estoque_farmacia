'use client';

import React from 'react';
import Link from 'next/link';

interface StockAlertBannerProps {
  criticalCount: number;
  warningCount: number;
  detailsHref?: string;
}

export function StockAlertBanner({
  criticalCount,
  warningCount,
  detailsHref = '/stock/alerts',
}: StockAlertBannerProps) {
  if (criticalCount === 0 && warningCount === 0) return null;

  const hasCritical = criticalCount > 0;

  return (
    <div
      className={`rounded-[12px] px-4 py-3 ${
        hasCritical
          ? 'bg-[#FF3B30]/10 border border-[#FF3B30]/30'
          : 'bg-[#FF9500]/10 border border-[#FF9500]/30'
      }`}
      role="alert"
      aria-label={`${criticalCount} itens criticos e ${warningCount} itens em alerta no estoque`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              hasCritical ? 'bg-[#FF3B30]/20' : 'bg-[#FF9500]/20'
            }`}
            aria-hidden="true"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className={hasCritical ? 'text-[#FF3B30]' : 'text-[#FF9500]'}
            >
              <path
                d="M9 2L1 16h16L9 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 7v3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="9" cy="13" r="0.8" fill="currentColor" />
            </svg>
          </div>

          {/* Text */}
          <div>
            <p
              className={`text-[14px] font-semibold ${
                hasCritical ? 'text-[#FF3B30]' : 'text-[#FF9500]'
              }`}
            >
              {hasCritical && (
                <span>
                  {criticalCount} {criticalCount === 1 ? 'item critico' : 'itens criticos'}
                </span>
              )}
              {hasCritical && warningCount > 0 && <span> e </span>}
              {warningCount > 0 && (
                <span>
                  {warningCount} em alerta
                </span>
              )}
            </p>
            <p className="text-[13px] text-[#6E6E73]">
              {hasCritical
                ? 'Produtos precisam de reposicao urgente.'
                : 'Produtos proximos do nivel minimo.'}
            </p>
          </div>
        </div>

        {/* Action */}
        <Link
          href={detailsHref}
          className={`inline-flex items-center gap-1 rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            hasCritical
              ? 'bg-[#FF3B30] hover:bg-[#FF3B30]/90 focus-visible:ring-[#FF3B30]'
              : 'bg-[#FF9500] hover:bg-[#FF9500]/90 focus-visible:ring-[#FF9500]'
          }`}
          aria-label="Ver detalhes dos alertas de estoque"
        >
          Ver Detalhes
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
