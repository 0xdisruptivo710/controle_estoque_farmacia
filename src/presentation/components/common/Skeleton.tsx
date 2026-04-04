'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines <= 1) {
    return (
      <div
        role="status"
        aria-label="Carregando..."
        className={`animate-pulse rounded-[8px] bg-[#F2F2F7] ${className}`}
      />
    );
  }

  return (
    <div role="status" aria-label="Carregando..." className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-[8px] bg-[#F2F2F7] h-4 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          } ${className}`}
        />
      ))}
    </div>
  );
}
