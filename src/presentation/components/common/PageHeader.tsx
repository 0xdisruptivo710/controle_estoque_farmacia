'use client';

import React from 'react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#1C1C1E] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[15px] text-[#6E6E73] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="mt-4 sm:mt-0 shrink-0">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0A84FF] px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0A84FF]/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
              aria-label={action.label}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0A84FF] px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0A84FF]/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
              aria-label={action.label}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
