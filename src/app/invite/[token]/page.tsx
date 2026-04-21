'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type InviteStatus =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; data: { fullName: string; email: string; role: string; pharmacyName: string; expiresAt: string } };

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  pharmacist: 'Farmaceutica',
  attendant: 'Atendente',
};

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const [status, setStatus] = useState<InviteStatus>({ kind: 'loading' });
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setStatus({ kind: 'error', message: data.error ?? 'Convite invalido.' });
          return;
        }
        setStatus({ kind: 'loaded', data });
        setFullName(data.fullName);
      } catch {
        if (active) setStatus({ kind: 'error', message: 'Erro ao carregar convite.' });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    if (password !== confirmPassword) {
      setSubmitError('As senhas nao coincidem.');
      return;
    }
    if (password.length < 6) {
      setSubmitError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Erro ao aceitar convite.');
        return;
      }
      router.push(`/login?email=${encodeURIComponent(data.email)}&invited=1`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F2F2F7]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0A84FF] flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L12 22" />
              <path d="M2 12L22 12" />
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1C1C1E]">PharmaControl</h1>
        </div>

        <div className="card p-6">
          {status.kind === 'loading' && (
            <p className="text-center text-sm text-[#6E6E73]">Carregando convite...</p>
          )}

          {status.kind === 'error' && (
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="font-semibold text-[#1C1C1E] mb-1">Convite invalido</p>
              <p className="text-sm text-[#6E6E73]">{status.message}</p>
            </div>
          )}

          {status.kind === 'loaded' && (
            <>
              <div className="mb-6 pb-5 border-b border-[#E5E5EA]">
                <p className="text-sm text-[#6E6E73] mb-1">Convite para</p>
                <p className="font-semibold text-[#1C1C1E]">{status.data.pharmacyName}</p>
                <p className="text-sm text-[#6E6E73] mt-1">
                  Como <strong>{ROLE_LABEL[status.data.role] ?? status.data.role}</strong>
                </p>
              </div>

              <form onSubmit={accept} className="space-y-4">
                {submitError && (
                  <div className="rounded-lg px-4 py-3 text-sm font-medium bg-[#FFF0F0] text-[#FF3B30]" role="alert">
                    {submitError}
                  </div>
                )}

                <div>
                  <label htmlFor="acc-email" className="block text-sm font-medium mb-1.5 text-[#1C1C1E]">
                    E-mail (login)
                  </label>
                  <input
                    id="acc-email"
                    type="email"
                    value={status.data.email}
                    readOnly
                    className="input-ios bg-[#F2F2F7]"
                    aria-label="E-mail de login"
                  />
                </div>

                <div>
                  <label htmlFor="acc-name" className="block text-sm font-medium mb-1.5 text-[#1C1C1E]">
                    Nome completo *
                  </label>
                  <input
                    id="acc-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-ios"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="acc-pwd" className="block text-sm font-medium mb-1.5 text-[#1C1C1E]">
                    Criar senha *
                  </label>
                  <input
                    id="acc-pwd"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-ios"
                    placeholder="Minimo 6 caracteres"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="acc-pwd2" className="block text-sm font-medium mb-1.5 text-[#1C1C1E]">
                    Confirmar senha *
                  </label>
                  <input
                    id="acc-pwd2"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-ios"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Aceitando...' : 'Aceitar convite'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
