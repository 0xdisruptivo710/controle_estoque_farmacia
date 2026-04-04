'use client';

import React from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-[12px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden border border-[#E5E5EA]">
        <table className="w-full" role="status" aria-label="Carregando dados da tabela">
          <thead>
            <tr className="border-b border-[#E5E5EA] bg-[#F2F2F7]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73] ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-[#E5E5EA] last:border-b-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-[12px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA]">
        <EmptyState
          title="Nada por aqui"
          description={emptyMessage}
        />
      </div>
    );
  }

  return (
    <div className="rounded-[12px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden border border-[#E5E5EA]">
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Tabela de dados">
          <thead>
            <tr className="border-b border-[#E5E5EA] bg-[#F2F2F7]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73] ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-[#E5E5EA] last:border-b-0 transition-colors duration-150 ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#F2F2F7]/60 active:bg-[#F2F2F7]'
                    : ''
                }`}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick ? `Linha ${rowIdx + 1}` : undefined}
                onKeyDown={
                  onRowClick
                    ? (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col) => {
                  const value = getNestedValue(row, col.key);
                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-[14px] text-[#1C1C1E] ${col.className ?? ''}`}
                    >
                      {col.render ? col.render(value, row) : String(value ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
