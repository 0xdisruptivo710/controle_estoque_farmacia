'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : authError.message,
        );
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            PharmaControl
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Acesse sua conta para continuar
          </p>
        </div>

        {/* Form Card */}
        <div className="card p-6">
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-ios"
                placeholder="Sua senha"
                required
                autoComplete="current-password"
                aria-label="Senha"
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              aria-label="Entrar na conta"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Ainda nao tem conta?{' '}
          <Link
            href="/register"
            className="font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
