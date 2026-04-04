'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/client';

interface ProductOption {
  id: string;
  name: string;
  unit_of_measure: string;
  unit_cost: number | null;
}

export default function StockEntryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [referenceDoc, setReferenceDoc] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('products')
      .select('id, name, unit_of_measure, unit_cost')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name')
      .limit(200)
      .then(({ data }) => setProducts(data ?? []));
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);

  function handleProductChange(id: string) {
    setProductId(id);
    const p = products.find((prod) => prod.id === id);
    if (p?.unit_cost && !unitCost) {
      setUnitCost(String(p.unit_cost));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productId) { setError('Selecione um produto.'); return; }
    if (!quantity || Number(quantity) <= 0) { setError('Informe uma quantidade valida.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/stock/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          quantity: Number(quantity),
          lotNumber: lotNumber || undefined,
          unitCost: unitCost ? Number(unitCost) : undefined,
          expirationDate: expirationDate || undefined,
          location: location || undefined,
          reason: reason || undefined,
          referenceDoc: referenceDoc || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || `Erro ${res.status}`); return; }

      setSuccess(`Entrada registrada: ${quantity} ${selectedProduct?.unit_of_measure ?? 'un'} de ${selectedProduct?.name}`);

      // Reset form for next entry
      setProductId('');
      setQuantity('');
      setLotNumber('');
      setUnitCost('');
      setExpirationDate('');
      setLocation('');
      setReason('');
      setReferenceDoc('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/stock" className="p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Entrada de Estoque</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Registre a entrada de produtos no estoque</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#FF3B30' }} role="alert">{error}</div>
        )}
        {success && (
          <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#F0FFF4', color: '#34C759' }} role="status">
            {success}
            <button type="button" onClick={() => router.push('/stock')} className="ml-3 underline">Ver estoque</button>
          </div>
        )}

        {/* Produto e Quantidade */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Produto e Quantidade</h2>

          <div>
            <label htmlFor="productId" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Produto *</label>
            <select id="productId" value={productId} onChange={(e) => handleProductChange(e.target.value)} className="input-ios" required aria-label="Selecionar produto">
              <option value="">Selecionar produto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit_of_measure})</option>
              ))}
            </select>
            {products.length === 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>
                Nenhum produto cadastrado. <Link href="/stock/products/new" className="underline">Cadastre primeiro</Link>.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Quantidade * {selectedProduct ? `(${selectedProduct.unit_of_measure})` : ''}
              </label>
              <input id="quantity" type="number" step="0.001" min="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input-ios" placeholder="Ex: 100" required aria-label="Quantidade" />
            </div>
            <div>
              <label htmlFor="unitCost" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Custo Unitario (R$)</label>
              <input id="unitCost" type="number" step="0.01" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="input-ios" placeholder="0.00" aria-label="Custo unitario" />
            </div>
          </div>
        </div>

        {/* Lote e Validade */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Lote e Validade</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lotNumber" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Numero do Lote</label>
              <input id="lotNumber" type="text" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} className="input-ios" placeholder="Ex: LT-2026-001" aria-label="Numero do lote" />
            </div>
            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Data de Validade</label>
              <input id="expirationDate" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="input-ios" aria-label="Data de validade" />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Local de Armazenamento</label>
            <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-ios" placeholder="Ex: Prateleira A3, Geladeira 2" aria-label="Local de armazenamento" />
          </div>
        </div>

        {/* Referencia */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Referencia</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="referenceDoc" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Nota Fiscal / Documento</label>
              <input id="referenceDoc" type="text" value={referenceDoc} onChange={(e) => setReferenceDoc(e.target.value)} className="input-ios" placeholder="Ex: NF-12345" aria-label="Documento de referencia" />
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Motivo / Observacao</label>
              <input id="reason" type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="input-ios" placeholder="Ex: Compra fornecedor X" aria-label="Motivo" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/stock" className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancelar</Link>
          <button type="submit" disabled={loading || !productId || !quantity} className="btn-primary disabled:opacity-40" aria-label="Registrar entrada">
            {loading ? 'Registrando...' : 'Registrar Entrada'}
          </button>
        </div>
      </form>
    </div>
  );
}
