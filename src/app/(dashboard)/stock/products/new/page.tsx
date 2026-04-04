'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    activeIngredient: '',
    code: '',
    barcode: '',
    category: 'raw_material',
    unitOfMeasure: '',
    description: '',
    minimumStock: '',
    maximumStock: '',
    repurchaseCycleDays: '',
    unitCost: '',
    unitPrice: '',
    isControlled: false,
    requiresPrescription: false,
    anvisaCode: '',
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Nome do produto e obrigatorio.');
      return;
    }
    if (!form.unitOfMeasure.trim()) {
      setError('Unidade de medida e obrigatoria.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          activeIngredient: form.activeIngredient || undefined,
          code: form.code || undefined,
          barcode: form.barcode || undefined,
          category: form.category,
          unitOfMeasure: form.unitOfMeasure.trim(),
          description: form.description || undefined,
          minimumStock: form.minimumStock ? Number(form.minimumStock) : 0,
          maximumStock: form.maximumStock ? Number(form.maximumStock) : undefined,
          repurchaseCycleDays: form.repurchaseCycleDays ? Number(form.repurchaseCycleDays) : undefined,
          unitCost: form.unitCost ? Number(form.unitCost) : undefined,
          unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
          isControlled: form.isControlled,
          requiresPrescription: form.requiresPrescription,
          anvisaCode: form.anvisaCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Erro ${res.status}`);
        return;
      }

      router.push('/stock/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/stock/products"
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
          aria-label="Voltar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Novo Produto</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cadastre um insumo, formula ou produto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#FF3B30' }} role="alert">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Informacoes do Produto</h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Nome *</label>
            <input id="name" type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className="input-ios" placeholder="Ex: Vitamina C 500mg" required aria-label="Nome do produto" />
          </div>

          <div>
            <label htmlFor="activeIngredient" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Principio Ativo</label>
            <input id="activeIngredient" type="text" value={form.activeIngredient} onChange={(e) => updateField('activeIngredient', e.target.value)} className="input-ios" placeholder="Ex: Acido Ascorbico" aria-label="Principio ativo" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Categoria *</label>
              <select id="category" value={form.category} onChange={(e) => updateField('category', e.target.value)} className="input-ios" aria-label="Categoria">
                <option value="raw_material">Materia Prima</option>
                <option value="compound_formula">Formula Manipulada</option>
                <option value="finished_product">Produto Pronto</option>
                <option value="packaging">Embalagem</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label htmlFor="unitOfMeasure" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Unidade de Medida *</label>
              <select id="unitOfMeasure" value={form.unitOfMeasure} onChange={(e) => updateField('unitOfMeasure', e.target.value)} className="input-ios" required aria-label="Unidade de medida">
                <option value="">Selecionar</option>
                <option value="mg">mg (miligrama)</option>
                <option value="g">g (grama)</option>
                <option value="kg">kg (quilograma)</option>
                <option value="ml">ml (mililitro)</option>
                <option value="L">L (litro)</option>
                <option value="un">un (unidade)</option>
                <option value="cap">cap (capsula)</option>
                <option value="comp">comp (comprimido)</option>
                <option value="env">env (envelope)</option>
                <option value="fr">fr (frasco)</option>
                <option value="cx">cx (caixa)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Codigo Interno</label>
              <input id="code" type="text" value={form.code} onChange={(e) => updateField('code', e.target.value)} className="input-ios" placeholder="Ex: VIT-C-500" aria-label="Codigo interno" />
            </div>
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Codigo de Barras</label>
              <input id="barcode" type="text" value={form.barcode} onChange={(e) => updateField('barcode', e.target.value)} className="input-ios" placeholder="Ex: 7891234567890" aria-label="Codigo de barras" />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Descricao</label>
            <textarea id="description" value={form.description} onChange={(e) => updateField('description', e.target.value)} className="input-ios min-h-[60px] resize-y" placeholder="Descricao opcional..." aria-label="Descricao" />
          </div>
        </div>

        {/* Stock & Pricing */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Estoque e Precos</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="minimumStock" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Estoque Minimo</label>
              <input id="minimumStock" type="number" step="0.001" value={form.minimumStock} onChange={(e) => updateField('minimumStock', e.target.value)} className="input-ios" placeholder="0" aria-label="Estoque minimo" />
            </div>
            <div>
              <label htmlFor="maximumStock" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Estoque Maximo</label>
              <input id="maximumStock" type="number" step="0.001" value={form.maximumStock} onChange={(e) => updateField('maximumStock', e.target.value)} className="input-ios" placeholder="Opcional" aria-label="Estoque maximo" />
            </div>
            <div>
              <label htmlFor="repurchaseCycleDays" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Ciclo Recompra (dias)</label>
              <input id="repurchaseCycleDays" type="number" value={form.repurchaseCycleDays} onChange={(e) => updateField('repurchaseCycleDays', e.target.value)} className="input-ios" placeholder="Ex: 30" aria-label="Ciclo de recompra em dias" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unitCost" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Custo Unitario (R$)</label>
              <input id="unitCost" type="number" step="0.01" value={form.unitCost} onChange={(e) => updateField('unitCost', e.target.value)} className="input-ios" placeholder="0.00" aria-label="Custo unitario" />
            </div>
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Preco de Venda (R$)</label>
              <input id="unitPrice" type="number" step="0.01" value={form.unitPrice} onChange={(e) => updateField('unitPrice', e.target.value)} className="input-ios" placeholder="0.00" aria-label="Preco de venda" />
            </div>
          </div>
        </div>

        {/* Regulatory */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Regulatorio</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isControlled} onChange={(e) => updateField('isControlled', e.target.checked)} className="w-5 h-5 rounded" aria-label="Produto controlado" />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Produto controlado</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => updateField('requiresPrescription', e.target.checked)} className="w-5 h-5 rounded" aria-label="Exige receita" />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Exige receita medica</span>
            </label>
          </div>

          <div>
            <label htmlFor="anvisaCode" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Codigo ANVISA</label>
            <input id="anvisaCode" type="text" value={form.anvisaCode} onChange={(e) => updateField('anvisaCode', e.target.value)} className="input-ios" placeholder="Ex: 1.0573.0123.001-1" aria-label="Codigo ANVISA" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/stock/products" className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn-primary" aria-label="Salvar produto">
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
