'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCustomers } from '@/presentation/hooks/useCustomers';
import type { CustomerFilters } from '@/domain/repositories/ICustomerRepository';

const statusLabels: Record<string, { text: string; className: string }> = {
  active: { text: 'Ativo', className: 'badge-success' },
  inactive: { text: 'Inativo', className: 'badge-danger' },
  pending_repurchase: { text: 'Recompra Pendente', className: 'badge-warning' },
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const filters: CustomerFilters = {
    search: search || undefined,
    status: statusFilter ? (statusFilter as CustomerFilters['status']) : undefined,
    page,
    limit,
  };

  const { data, isLoading, error } = useCustomers(filters);
  const customers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Clientes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {total} cliente(s) cadastrado(s)
          </p>
        </div>
        <Link href="/customers/new" className="btn-primary" aria-label="Cadastrar novo cliente">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Cliente
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-ios"
              placeholder="Buscar por nome, CPF ou telefone..."
              aria-label="Buscar clientes"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input-ios sm:w-48"
            aria-label="Filtrar por status"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="pending_repurchase">Recompra Pendente</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: 'var(--color-surface)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3" style={{ backgroundColor: 'var(--color-surface)' }} />
                  <div className="h-3 rounded w-1/4" style={{ backgroundColor: 'var(--color-surface)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
              Erro ao carregar clientes. Tente novamente.
            </p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Nenhum cliente encontrado
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {search ? 'Tente ajustar os filtros de busca.' : 'Cadastre seu primeiro cliente para comecar.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                    <th className="text-left text-xs font-semibold uppercase px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Nome
                    </th>
                    <th className="text-left text-xs font-semibold uppercase px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      CPF
                    </th>
                    <th className="text-left text-xs font-semibold uppercase px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Telefone
                    </th>
                    <th className="text-left text-xs font-semibold uppercase px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold uppercase px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Ultimo Pedido
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const status = statusLabels[customer.status] ?? statusLabels.active;
                    return (
                      <tr
                        key={customer.id}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                        onClick={() => window.location.href = `/customers/${customer.id}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ backgroundColor: 'var(--color-primary)' }}
                            >
                              {customer.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {customer.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {customer.cpf ?? '--'}
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {customer.phone ?? '--'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`badge ${status.className}`}>{status.text}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {customer.lastOrderAt
                            ? new Date(customer.lastOrderAt).toLocaleDateString('pt-BR')
                            : '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {customers.map((customer) => {
                const status = statusLabels[customer.status] ?? statusLabels.active;
                return (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="flex items-center gap-3 p-4 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {customer.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {customer.fullName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {customer.phone ?? customer.cpf ?? 'Sem contato'}
                      </p>
                    </div>
                    <span className={`badge ${status.className}`}>{status.text}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Pagina {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              aria-label="Pagina anterior"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              aria-label="Proxima pagina"
            >
              Proximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
