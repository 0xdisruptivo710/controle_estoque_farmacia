'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Recuperar Senha
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Enviaremos um link para redefinir sua senha
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-6">
          {success ? (
            <div className="text-center py-4">
              <div
                className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--color-success-light)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                E-mail enviado!
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Verifique sua caixa de entrada e siga as instrucoes para redefinir sua senha.
              </p>
              <Link
                href="/login"
                className="btn-primary inline-flex"
                aria-label="Voltar para login"
              >
                Voltar para login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-ios"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  aria-label="Endereco de e-mail"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
                aria-label="Enviar link de recuperacao"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  'Enviar Link'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Lembrou a senha?{' '}
          <Link
            href="/login"
            className="font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
