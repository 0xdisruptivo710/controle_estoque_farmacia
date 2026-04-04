'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StockSummary {
  productId: string;
  productName: string;
  unitOfMeasure: string;
  minimumStock: number;
  maximumStock: number | null;
  category: string;
  totalQuantity: number;
  lotCount: number;
  nearestExpiration: string | null;
  alertLevel: string;
}

interface DashboardData {
  totalProducts: number;
  productsWithStock: number;
  criticalAlerts: number;
  warningAlerts: number;
  expiringThisMonth: number;
  summaries: StockSummary[];
}

const categoryLabels: Record<string, string> = {
  raw_material: 'Materia Prima',
  compound_formula: 'Formula',
  finished_product: 'Produto Pronto',
  packaging: 'Embalagem',
  other: 'Outro',
};

export default function StockPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stock/dashboard', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError('Falha ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  const summaries = data?.summaries ?? [];
  const withStock = summaries.filter((s) => s.lotCount > 0);
  const withoutStock = summaries.filter((s) => s.lotCount === 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Controle de Estoque
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Visao geral do estoque de produtos e insumos
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/stock/entry" className="btn-primary" aria-label="Entrada de estoque">
            + Entrada
          </Link>
          <Link
            href="/stock/products"
            className="px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}
            aria-label="Ver produtos"
          >
            Produtos
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Produtos Cadastrados" value={data?.totalProducts ?? 0} loading={loading} color="#0A84FF" />
        <KPICard label="Com Estoque" value={data?.productsWithStock ?? 0} loading={loading} color="#34C759" />
        <KPICard label="Alertas Criticos" value={data?.criticalAlerts ?? 0} loading={loading} color="#FF3B30" />
        <KPICard label="Alertas de Aviso" value={data?.warningAlerts ?? 0} loading={loading} color="#FF9500" />
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FFF0F0', color: '#FF3B30' }}>{error}</div>
      )}

      {/* Products with stock */}
      {withStock.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Produtos em Estoque ({withStock.length})
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {withStock.map((s) => (
              <div key={s.productId} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{s.productName}</span>
                    <AlertBadge level={s.alertLevel} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {categoryLabels[s.category] ?? s.category} · {s.lotCount} lote(s)
                    {s.nearestExpiration && ` · Vence: ${new Date(s.nearestExpiration).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {s.totalQuantity} {s.unitOfMeasure}
                  </p>
                  {s.minimumStock > 0 && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Min: {s.minimumStock}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products without stock */}
      {withoutStock.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Sem Estoque Registrado ({withoutStock.length})
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {withoutStock.map((s) => (
              <div key={s.productId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{s.productName}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>({categoryLabels[s.category] ?? s.category})</span>
                </div>
                <Link
                  href={`/stock/entry?product=${s.productId}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ color: 'var(--color-primary)', backgroundColor: 'rgba(10,132,255,0.08)' }}
                >
                  Dar entrada
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && summaries.length === 0 && (
        <div className="card p-12 text-center">
          <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Nenhum produto cadastrado</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Cadastre produtos e registre entradas de estoque</p>
          <Link href="/stock/products/new" className="btn-primary inline-block mt-4">Cadastrar Produto</Link>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, loading, color }: { label: string; value: number; loading: boolean; color: string }) {
  return (
    <div className="card p-4">
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
          <div className="h-8 w-12 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
        </div>
      ) : (
        <>
          <p className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
        </>
      )}
    </div>
  );
}

function AlertBadge({ level }: { level: string }) {
  if (level === 'ok') return null;
  const config = level === 'critical'
    ? { text: 'Critico', bg: '#FF3B3015', color: '#FF3B30' }
    : { text: 'Baixo', bg: '#FF950015', color: '#FF9500' };

  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bg, color: config.color }}>
      {config.text}
    </span>
  );
}
