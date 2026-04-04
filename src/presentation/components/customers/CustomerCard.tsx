'use client';

import React from 'react';
import { StatusBadge } from '@/presentation/components/common/StatusBadge';

interface CustomerCardProps {
  id: string;
  fullName: string;
  cpf?: string;
  phone?: string;
  email?: string;
  status: string;
  totalOrders: number;
  lastOrderAt?: string;
  onClick?: (id: string) => void;
}

function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

export function CustomerCard({
  id,
  fullName,
  cpf,
  phone,
  email,
  status,
  totalOrders,
  lastOrderAt,
  onClick,
}: CustomerCardProps) {
  return (
    <div
      className={`rounded-[12px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA] transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] active:scale-[0.99]'
          : ''
      }`}
      onClick={onClick ? () => onClick(id) : undefined}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Cliente: ${fullName}`}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(id);
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + info */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A84FF]/10 text-[14px] font-semibold text-[#0A84FF]"
            aria-hidden="true"
          >
            {fullName
              .split(' ')
              .slice(0, 2)
              .map((p) => p.charAt(0))
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[#1C1C1E] truncate leading-tight">
              {fullName}
            </h3>
            {cpf && (
              <p className="mt-0.5 text-[13px] text-[#6E6E73]">
                CPF: {maskCPF(cpf)}
              </p>
            )}
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Contact info */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#6E6E73]">
        {phone && (
          <span className="flex items-center gap-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 2h3l1 3-1.5 1.5a8 8 0 003.5 3.5L10 8.5l3 1v3a1 1 0 01-1 1A11 11 0 012 2.5a1 1 0 011-1"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {phone}
          </span>
        )}
        {email && (
          <span className="flex items-center gap-1 truncate">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="1.5"
                y="3"
                width="11"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M1.5 4.5L7 8l5.5-3.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {email}
          </span>
        )}
      </div>

      {/* Footer stats */}
      <div className="mt-3 flex items-center justify-between border-t border-[#E5E5EA] pt-3">
        <span className="text-[13px] text-[#6E6E73]">
          <span className="font-semibold text-[#1C1C1E]">{totalOrders}</span>{' '}
          {totalOrders === 1 ? 'pedido' : 'pedidos'}
        </span>
        {lastOrderAt && (
          <span className="text-[12px] text-[#6E6E73]">
            Ultimo: {formatDate(lastOrderAt)}
          </span>
        )}
      </div>
    </div>
  );
}
