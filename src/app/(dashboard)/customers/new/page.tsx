'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateCustomer } from '@/presentation/hooks/useCustomers';
import { useAuthStore } from '@/store/authStore';

export default function NewCustomerPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createCustomer = useCreateCustomer();

  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    phone: '',
    whatsapp: '',
    email: '',
    birthDate: '',
    gender: '',
    prescribingDoctor: '',
    clinicalNotes: '',
  });

  const [error, setError] = useState('');

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Nome completo e obrigatorio.');
      return;
    }

    if (!user) {
      setError('Voce precisa estar logado.');
      return;
    }

    try {
      await createCustomer.mutateAsync({
        pharmacyId: user.pharmacyId,
        fullName: formData.fullName.trim(),
        cpf: formData.cpf || undefined,
        phone: formData.phone || undefined,
        whatsapp: formData.whatsapp || undefined,
        email: formData.email || undefined,
        birthDate: formData.birthDate || undefined,
        gender: formData.gender || undefined,
        prescribingDoctor: formData.prescribingDoctor || undefined,
        clinicalNotes: formData.clinicalNotes || undefined,
        createdBy: user.id,
      });

      router.push('/customers');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao cadastrar: ${message}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
          aria-label="Voltar para lista de clientes"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
            Novo Cliente
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Preencha os dados do cliente
          </p>
        </div>
      </div>

      {/* Form */}
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

        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Informacoes Basicas
          </h2>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              Nome completo *
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              className="input-ios"
              placeholder="Nome completo do cliente"
              required
              aria-label="Nome completo"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                value={formData.cpf}
                onChange={(e) => updateField('cpf', e.target.value)}
                className="input-ios"
                placeholder="000.000.000-00"
                aria-label="CPF"
              />
            </div>
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Data de Nascimento
              </label>
              <input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateField('birthDate', e.target.value)}
                className="input-ios"
                aria-label="Data de nascimento"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              Genero
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => updateField('gender', e.target.value)}
              className="input-ios"
              aria-label="Genero"
            >
              <option value="">Selecionar</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
              <option value="prefiro_nao_dizer">Prefiro nao dizer</option>
            </select>
          </div>
        </div>

        {/* Contact Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Contato
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="input-ios"
                placeholder="(00) 00000-0000"
                aria-label="Telefone"
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => updateField('whatsapp', e.target.value)}
                className="input-ios"
                placeholder="(00) 00000-0000"
                aria-label="WhatsApp"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="input-ios"
              placeholder="cliente@email.com"
              aria-label="E-mail"
            />
          </div>
        </div>

        {/* Clinical Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
            Informacoes Clinicas
          </h2>

          <div>
            <label htmlFor="prescribingDoctor" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              Medico Prescritor
            </label>
            <input
              id="prescribingDoctor"
              type="text"
              value={formData.prescribingDoctor}
              onChange={(e) => updateField('prescribingDoctor', e.target.value)}
              className="input-ios"
              placeholder="Nome do medico"
              aria-label="Medico prescritor"
            />
          </div>

          <div>
            <label htmlFor="clinicalNotes" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              Notas Clinicas
            </label>
            <textarea
              id="clinicalNotes"
              value={formData.clinicalNotes}
              onChange={(e) => updateField('clinicalNotes', e.target.value)}
              className="input-ios min-h-[80px] resize-y"
              placeholder="Observacoes clinicas relevantes..."
              aria-label="Notas clinicas"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/customers"
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createCustomer.isPending}
            className="btn-primary"
            aria-label="Salvar cliente"
          >
            {createCustomer.isPending ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
