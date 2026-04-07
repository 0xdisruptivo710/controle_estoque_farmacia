'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/client';

interface CustomerOption { id: string; full_name: string; cpf: string | null }
interface ProductOption { id: string; name: string; repurchase_cycle_days: number | null }

export default function NewReminderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [productId, setProductId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [customMessage, setCustomMessage] = useState('');
  const [reminderType, setReminderType] = useState<'once' | 'recurring' | 'estimate'>('once');
  const [recurringDays, setRecurringDays] = useState('30');

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('customers').select('id, full_name, cpf').is('deleted_at', null).order('full_name').limit(200),
      supabase.from('products').select('id, name, repurchase_cycle_days').eq('is_active', true).is('deleted_at', null).order('name').limit(200),
    ]).then(([c, p]) => {
      setCustomers(c.data ?? []);
      setProducts(p.data ?? []);
    });
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.cpf && c.cpf.includes(customerSearch))
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  function handleProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product?.repurchase_cycle_days && !scheduledDate) {
      const date = new Date();
      date.setDate(date.getDate() + product.repurchase_cycle_days);
      setScheduledDate(date.toISOString().split('T')[0]);
      setRecurringDays(String(product.repurchase_cycle_days));
    }
  }

  function calculateEstimatedDate() {
    if (!recurringDays) return;
    const date = new Date();
    date.setDate(date.getDate() + Number(recurringDays));
    setScheduledDate(date.toISOString().split('T')[0]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!customerId) { setError('Selecione um cliente.'); return; }
    if (!scheduledDate) { setError('Informe a data do lembrete.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/reminders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId,
          productId: productId || undefined,
          scheduledDate,
          channel,
          customMessage: customMessage || undefined,
          isRecurring: reminderType === 'recurring',
          recurringDays: reminderType !== 'once' ? Number(recurringDays) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || `Erro ${res.status}`); return; }
      router.push('/reminders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/reminders" className="p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Novo Lembrete</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Agende um aviso de recompra para o cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#FF3B30' }} role="alert">{error}</div>
        )}

        {/* Tipo de Lembrete */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Tipo de Lembrete</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'once' as const, title: 'Avulso', desc: 'Lembrete unico, nao se repete' },
              { value: 'recurring' as const, title: 'Recorrente', desc: 'Se repete automaticamente (ex: todo mes)' },
              { value: 'estimate' as const, title: 'Estimativa', desc: 'Baseado na duracao estimada do remedio' },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setReminderType(type.value)}
                className="text-left p-4 rounded-xl transition-all"
                style={{
                  border: reminderType === type.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: reminderType === type.value ? 'rgba(10,132,255,0.05)' : 'var(--color-background)',
                }}
                aria-pressed={reminderType === type.value}
              >
                <p className="text-sm font-semibold" style={{ color: reminderType === type.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                  {type.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cliente */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Cliente</h2>

          <div className="relative">
            <label htmlFor="customerSearch" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Buscar cliente *</label>
            <input
              id="customerSearch"
              type="text"
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setShowDropdown(true); if (!e.target.value) setCustomerId(''); }}
              onFocus={() => setShowDropdown(true)}
              className="input-ios"
              placeholder="Digite o nome ou CPF..."
              autoComplete="off"
              aria-label="Buscar cliente"
            />
            {selectedCustomer && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-success)' }}>Selecionado: {selectedCustomer.full_name}</p>
            )}
            {showDropdown && customerSearch && filteredCustomers.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                {filteredCustomers.slice(0, 10).map((c) => (
                  <button key={c.id} type="button" onClick={() => { setCustomerId(c.id); setCustomerSearch(c.full_name); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-surface)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.full_name}</span>
                    {c.cpf && <span className="ml-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{c.cpf}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Produto + Data */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Produto e Agendamento</h2>

          <div>
            <label htmlFor="productId" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Produto (qual remedio vai acabar?)</label>
            <select id="productId" value={productId} onChange={(e) => handleProductChange(e.target.value)} className="input-ios" aria-label="Produto">
              <option value="">Nenhum produto especifico</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.repurchase_cycle_days ? `(ciclo: ${p.repurchase_cycle_days} dias)` : ''}
                </option>
              ))}
            </select>
          </div>

          {(reminderType === 'recurring' || reminderType === 'estimate') && (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor="recurringDays" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                  {reminderType === 'recurring' ? 'Repetir a cada (dias)' : 'Duracao estimada do remedio (dias)'}
                </label>
                <input id="recurringDays" type="number" min="1" value={recurringDays} onChange={(e) => setRecurringDays(e.target.value)} className="input-ios" placeholder="30" aria-label="Intervalo em dias" />
              </div>
              <button type="button" onClick={calculateEstimatedDate} className="px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                Calcular data
              </button>
            </div>
          )}

          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Data do lembrete *</label>
            <input id="scheduledDate" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="input-ios" required aria-label="Data do lembrete" />
            {scheduledDate && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Faltam {Math.ceil((new Date(scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias para o envio
              </p>
            )}
          </div>
        </div>

        {/* Canal e Mensagem */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>Canal de Envio</h2>

          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
              { value: 'push', label: 'Push', color: '#FF9500' },
            ].map((ch) => (
              <button
                key={ch.value}
                type="button"
                onClick={() => setChannel(ch.value)}
                className="py-3 rounded-xl text-sm font-medium transition-all text-center"
                style={{
                  border: channel === ch.value ? `2px solid ${ch.color}` : '1px solid var(--color-border)',
                  backgroundColor: channel === ch.value ? `${ch.color}10` : 'var(--color-background)',
                  color: channel === ch.value ? ch.color : 'var(--color-text-secondary)',
                }}
                aria-pressed={channel === ch.value}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="customMessage" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>Mensagem personalizada (opcional)</label>
            <textarea id="customMessage" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} className="input-ios min-h-[80px] resize-y"
              placeholder="Deixe em branco para usar o template padrao. Variaveis disponiveis: {{customer_name}}, {{product_name}}, {{pharmacy_name}}" aria-label="Mensagem personalizada" />
          </div>
        </div>

        {/* Resumo */}
        {customerId && scheduledDate && (
          <div className="card p-5" style={{ backgroundColor: 'rgba(10,132,255,0.04)', borderColor: 'var(--color-primary)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>Resumo</h3>
            <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-primary)' }}>
              <li>Cliente: <strong>{selectedCustomer?.full_name}</strong></li>
              {productId && <li>Produto: <strong>{products.find((p) => p.id === productId)?.name}</strong></li>}
              <li>Data: <strong>{new Date(scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></li>
              <li>Canal: <strong>{channel === 'whatsapp' ? 'WhatsApp' : 'Push'}</strong></li>
              <li>Tipo: <strong>{reminderType === 'once' ? 'Avulso (unico)' : reminderType === 'recurring' ? `Recorrente (a cada ${recurringDays} dias)` : `Estimativa (${recurringDays} dias)`}</strong></li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/reminders" className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancelar</Link>
          <button type="submit" disabled={loading || !customerId || !scheduledDate} className="btn-primary disabled:opacity-40" aria-label="Agendar lembrete">
            {loading ? 'Agendando...' : 'Agendar Lembrete'}
          </button>
        </div>
      </form>
    </div>
  );
}
