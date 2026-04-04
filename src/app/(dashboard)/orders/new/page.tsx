'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/infrastructure/supabase/client';

interface CustomerOption {
  id: string;
  full_name: string;
  cpf: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  unit_price: number | null;
  unit_of_measure: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [prescribingDoctor, setPrescribingDoctor] = useState('');
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [estimatedReadyDate, setEstimatedReadyDate] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  // Add item form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  // Load customers and products
  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const [custResult, prodResult] = await Promise.all([
        supabase.from('customers').select('id, full_name, cpf').is('deleted_at', null).order('full_name').limit(200),
        supabase.from('products').select('id, name, unit_price, unit_of_measure').eq('is_active', true).is('deleted_at', null).order('name').limit(200),
      ]);

      setCustomers(custResult.data ?? []);
      setProducts(prodResult.data ?? []);
    }

    loadData();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.cpf && c.cpf.includes(customerSearch))
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const selectCustomer = useCallback((c: CustomerOption) => {
    setCustomerId(c.id);
    setCustomerSearch(c.full_name);
    setShowCustomerDropdown(false);
  }, []);

  function addItem() {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product || !itemQuantity) return;

    const price = itemPrice ? Number(itemPrice) : (product.unit_price ?? 0);

    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        unitOfMeasure: product.unit_of_measure,
        quantity: Number(itemQuantity),
        unitPrice: price,
      },
    ]);

    setSelectedProductId('');
    setItemQuantity('');
    setItemPrice('');
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountValue = discount ? Number(discount) : 0;
  const total = subtotal - discountValue;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!customerId) { setError('Selecione um cliente.'); return; }
    if (items.length === 0) { setError('Adicione ao menos um item.'); return; }
    if (!user) { setError('Voce precisa estar logado.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pharmacyId: user.pharmacyId,
          customerId,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          prescribingDoctor: prescribingDoctor || undefined,
          prescriptionNumber: prescriptionNumber || undefined,
          estimatedReadyDate: estimatedReadyDate || undefined,
          discount: discountValue,
          paymentMethod: paymentMethod || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Erro ${res.status}`);
        return;
      }

      router.push('/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="p-2 rounded-lg"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
          aria-label="Voltar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Novo Pedido</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Vincule um cliente e adicione os produtos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#FF3B30' }} role="alert">
            {error}
          </div>
        )}

        {/* Customer Selection */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Cliente</h2>

          <div className="relative">
            <label htmlFor="customerSearch" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              Buscar cliente *
            </label>
            <input
              id="customerSearch"
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
                if (!e.target.value) setCustomerId('');
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className="input-ios"
              placeholder="Digite o nome ou CPF do cliente..."
              autoComplete="off"
              aria-label="Buscar cliente"
            />
            {selectedCustomer && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-success)' }}>
                Selecionado: {selectedCustomer.full_name} {selectedCustomer.cpf ? `(${selectedCustomer.cpf})` : ''}
              </p>
            )}

            {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
              <div
                className="absolute z-10 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg"
                style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
              >
                {filteredCustomers.slice(0, 10).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-surface)]"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.full_name}</span>
                    {c.cpf && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{c.cpf}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Itens do Pedido ({items.length})
          </h2>

          {/* Add item */}
          <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find((p) => p.id === e.target.value);
                if (prod?.unit_price) setItemPrice(String(prod.unit_price));
              }}
              className="input-ios flex-1"
              aria-label="Selecionar produto"
            >
              <option value="">Selecionar produto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit_of_measure}) {p.unit_price ? `- R$ ${Number(p.unit_price).toFixed(2)}` : ''}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              className="input-ios sm:w-24"
              placeholder="Qtd"
              aria-label="Quantidade"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="input-ios sm:w-28"
              placeholder="Preco R$"
              aria-label="Preco unitario"
            />
            <button
              type="button"
              onClick={addItem}
              disabled={!selectedProductId || !itemQuantity}
              className="btn-primary whitespace-nowrap disabled:opacity-40"
              aria-label="Adicionar item"
            >
              + Adicionar
            </button>
          </div>

          {/* Items list */}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.productName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.quantity} {item.unitOfMeasure} x R$ {item.unitPrice.toFixed(2)} = R$ {(item.quantity * item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 rounded-lg transition-colors ml-2"
                    style={{ color: 'var(--color-danger)' }}
                    aria-label={`Remover ${item.productName}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Totals */}
              <div className="pt-2 space-y-1 text-sm text-right" style={{ borderTop: '1px solid var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>Subtotal: R$ {subtotal.toFixed(2)}</p>
                {discountValue > 0 && (
                  <p style={{ color: 'var(--color-danger)' }}>Desconto: -R$ {discountValue.toFixed(2)}</p>
                )}
                <p className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Total: R$ {total.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              Nenhum item adicionado. Selecione um produto acima.
            </p>
          )}
        </div>

        {/* Additional Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Informacoes Adicionais</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prescribingDoctor" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Medico Prescritor</label>
              <input id="prescribingDoctor" type="text" value={prescribingDoctor} onChange={(e) => setPrescribingDoctor(e.target.value)} className="input-ios" placeholder="Nome do medico" aria-label="Medico prescritor" />
            </div>
            <div>
              <label htmlFor="prescriptionNumber" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Numero da Receita</label>
              <input id="prescriptionNumber" type="text" value={prescriptionNumber} onChange={(e) => setPrescriptionNumber(e.target.value)} className="input-ios" placeholder="REC-2026-001" aria-label="Numero da receita" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="estimatedReadyDate" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Previsao de Entrega</label>
              <input id="estimatedReadyDate" type="date" value={estimatedReadyDate} onChange={(e) => setEstimatedReadyDate(e.target.value)} className="input-ios" aria-label="Data estimada de entrega" />
            </div>
            <div>
              <label htmlFor="discount" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Desconto (R$)</label>
              <input id="discount" type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input-ios" placeholder="0.00" aria-label="Desconto" />
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Forma de Pagamento</label>
              <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-ios" aria-label="Forma de pagamento">
                <option value="">Selecionar</option>
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartao de Credito</option>
                <option value="cartao_debito">Cartao de Debito</option>
                <option value="boleto">Boleto</option>
                <option value="convenio">Convenio</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Observacoes</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="input-ios min-h-[60px] resize-y" placeholder="Instrucoes especiais..." aria-label="Observacoes" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/orders" className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            Cancelar
          </Link>
          <button type="submit" disabled={loading || items.length === 0 || !customerId} className="btn-primary disabled:opacity-40" aria-label="Salvar pedido">
            {loading ? 'Salvando...' : `Salvar Pedido (R$ ${total.toFixed(2)})`}
          </button>
        </div>
      </form>
    </div>
  );
}
