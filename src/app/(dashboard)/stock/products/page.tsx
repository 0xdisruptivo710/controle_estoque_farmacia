'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  active_ingredient: string | null;
  category: string;
  unit_of_measure: string;
  minimum_stock: number;
  unit_cost: number | null;
  unit_price: number | null;
  is_active: boolean;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  raw_material: 'Materia Prima',
  compound_formula: 'Formula',
  finished_product: 'Produto Pronto',
  packaging: 'Embalagem',
  other: 'Outro',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.data ?? []);
    } catch {
      console.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Produtos</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {products.length} produto(s) cadastrado(s)
          </p>
        </div>
        <Link href="/stock/products/new" className="btn-primary" aria-label="Novo produto">
          + Novo Produto
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-ios flex-1"
          placeholder="Buscar por nome..."
          aria-label="Buscar produto"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-ios sm:w-48"
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas categorias</option>
          <option value="raw_material">Materia Prima</option>
          <option value="compound_formula">Formula</option>
          <option value="finished_product">Produto Pronto</option>
          <option value="packaging">Embalagem</option>
          <option value="other">Outro</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          Carregando produtos...
        </div>
      ) : products.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>Nenhum produto cadastrado</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Comece cadastrando seus insumos e formulas
          </p>
          <Link href="/stock/products/new" className="btn-primary inline-block mt-4">
            Cadastrar Primeiro Produto
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Nome</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Categoria</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Unidade</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Estoque Min.</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>Preco</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-[var(--color-surface)]"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                        {product.active_ingredient && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{product.active_ingredient}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                        {categoryLabels[product.category] ?? product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{product.unit_of_measure}</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: 'var(--color-text-secondary)' }}>{product.minimum_stock}</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: 'var(--color-text-primary)' }}>
                      {product.unit_price ? `R$ ${Number(product.unit_price).toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
