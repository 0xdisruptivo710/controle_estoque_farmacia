'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  icon?: React.ReactNode;
}

const defaultIcon = (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    className="text-[#E5E5EA]"
  >
    <rect
      x="8"
      y="12"
      width="48"
      height="40"
      rx="6"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <path
      d="M8 24h48"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <circle cx="16" cy="18" r="2" fill="currentColor" />
    <circle cx="22" cy="18" r="2" fill="currentColor" />
    <circle cx="28" cy="18" r="2" fill="currentColor" />
    <path
      d="M24 38h16M28 33h8"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-6">{icon ?? defaultIcon}</div>
      <h3 className="text-[17px] font-semibold text-[#1C1C1E] leading-tight">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-[15px] text-[#6E6E73] leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0A84FF] px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0A84FF]/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
              aria-label={action.label}
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0A84FF] px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0A84FF]/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
              aria-label={action.label}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
