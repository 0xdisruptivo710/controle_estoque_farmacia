'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function SetupPage() {
  const router = useRouter();
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyCnpj, setPharmacyCnpj] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const [pharmacyEmail, setPharmacyEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/login');
        return;
      }
      // If user already has a profile with pharmacy, skip setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('pharmacy_id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.pharmacy_id) {
        document.cookie = 'pc_has_pharmacy=1; path=/; max-age=2592000; SameSite=Lax';
        window.location.href = '/';
        return;
      }

      setUserEmail(data.user.email ?? '');
      setPharmacyEmail(data.user.email ?? '');
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pharmacyName, pharmacyCnpj, pharmacyPhone, pharmacyEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Erro ${res.status}: falha ao configurar.`);
        return;
      }

      // Set cookie so middleware skips profile DB query on redirect
      document.cookie = 'pc_has_pharmacy=1; path=/; max-age=2592000; SameSite=Lax';
      window.location.href = '/';
    } catch (err) {
      setError(`Erro de rede: ${err instanceof Error ? err.message : 'tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L12 22" />
              <path d="M2 12L22 12" />
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Configurar Farmacia
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Preencha os dados da sua farmacia para comecar
          </p>
          {userEmail && (
            <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Logado como: {userEmail}
            </p>
          )}
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: '#FFF0F0', color: '#FF3B30' }}
                role="alert"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="pharmacyName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Nome da Farmacia *
              </label>
              <input
                id="pharmacyName"
                type="text"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="input-ios"
                placeholder="Ex: Farmacia Vida Natural"
                required
                aria-label="Nome da farmacia"
              />
            </div>

            <div>
              <label htmlFor="pharmacyCnpj" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                CNPJ
              </label>
              <input
                id="pharmacyCnpj"
                type="text"
                value={pharmacyCnpj}
                onChange={(e) => setPharmacyCnpj(formatCNPJ(e.target.value))}
                className="input-ios"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                aria-label="CNPJ da farmacia"
              />
            </div>

            <div>
              <label htmlFor="pharmacyPhone" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Telefone
              </label>
              <input
                id="pharmacyPhone"
                type="tel"
                value={pharmacyPhone}
                onChange={(e) => setPharmacyPhone(formatPhone(e.target.value))}
                className="input-ios"
                placeholder="(11) 99999-9999"
                maxLength={15}
                aria-label="Telefone da farmacia"
              />
            </div>

            <div>
              <label htmlFor="pharmacyEmail" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                E-mail da Farmacia
              </label>
              <input
                id="pharmacyEmail"
                type="email"
                value={pharmacyEmail}
                onChange={(e) => setPharmacyEmail(e.target.value)}
                className="input-ios"
                placeholder="contato@farmacia.com"
                aria-label="E-mail da farmacia"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !pharmacyName.trim()}
              className="btn-primary w-full"
              aria-label="Configurar farmacia"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Configurando...
                </span>
              ) : (
                'Comecar a usar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
