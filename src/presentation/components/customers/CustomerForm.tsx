'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// CPF validation helper
// ---------------------------------------------------------------------------
function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(digits[10], 10);
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const customerSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidCPF(val),
      'CPF invalido'
    ),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('E-mail invalido').optional().or(z.literal('')),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  prescribingDoctor: z.string().optional(),
  clinicalNotes: z.string().optional(),
  tags: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

// ---------------------------------------------------------------------------
// CPF mask
// ---------------------------------------------------------------------------
function applyCPFMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// ---------------------------------------------------------------------------
// Reusable field styles
// ---------------------------------------------------------------------------
const inputClass =
  'w-full rounded-[8px] border border-[#E5E5EA] bg-white px-3.5 py-2.5 text-[15px] text-[#1C1C1E] placeholder:text-[#6E6E73]/60 transition-colors focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20';

const labelClass = 'block text-[13px] font-semibold text-[#6E6E73] mb-1.5';

const errorClass = 'mt-1 text-[12px] text-[#FF3B30]';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CustomerForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: '',
      cpf: '',
      birthDate: '',
      phone: '',
      whatsapp: '',
      email: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      prescribingDoctor: '',
      clinicalNotes: '',
      tags: '',
      ...defaultValues,
    },
  });

  const [tagsInput, setTagsInput] = useState(defaultValues?.tags ?? '');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
      noValidate
      aria-label="Formulario de cadastro de cliente"
    >
      {/* ------ Personal Info ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Dados Pessoais
        </legend>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className={labelClass}>
            Nome completo *
          </label>
          <input
            id="fullName"
            type="text"
            className={inputClass}
            placeholder="Maria da Silva"
            aria-required="true"
            aria-invalid={!!errors.fullName}
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className={errorClass} role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* CPF */}
          <div>
            <label htmlFor="cpf" className={labelClass}>
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              className={inputClass}
              placeholder="000.000.000-00"
              maxLength={14}
              aria-invalid={!!errors.cpf}
              {...register('cpf', {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  const masked = applyCPFMask(e.target.value);
                  setValue('cpf', masked, { shouldValidate: false });
                },
              })}
            />
            {errors.cpf && (
              <p className={errorClass} role="alert">
                {errors.cpf.message}
              </p>
            )}
          </div>

          {/* Birth Date */}
          <div>
            <label htmlFor="birthDate" className={labelClass}>
              Data de nascimento
            </label>
            <input
              id="birthDate"
              type="date"
              className={inputClass}
              aria-invalid={!!errors.birthDate}
              {...register('birthDate')}
            />
          </div>
        </div>
      </fieldset>

      {/* ------ Contact ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Contato
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelClass}>
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              className={inputClass}
              placeholder="(11) 99999-9999"
              aria-invalid={!!errors.phone}
              {...register('phone')}
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className={labelClass}>
              WhatsApp
            </label>
            <input
              id="whatsapp"
              type="tel"
              className={inputClass}
              placeholder="(11) 99999-9999"
              aria-invalid={!!errors.whatsapp}
              {...register('whatsapp')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className={inputClass}
            placeholder="cliente@email.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className={errorClass} role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
      </fieldset>

      {/* ------ Address ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Endereco
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="street" className={labelClass}>
              Rua
            </label>
            <input
              id="street"
              type="text"
              className={inputClass}
              placeholder="Rua das Flores"
              {...register('street')}
            />
          </div>
          <div>
            <label htmlFor="number" className={labelClass}>
              Numero
            </label>
            <input
              id="number"
              type="text"
              className={inputClass}
              placeholder="123"
              {...register('number')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="complement" className={labelClass}>
              Complemento
            </label>
            <input
              id="complement"
              type="text"
              className={inputClass}
              placeholder="Apto 101"
              {...register('complement')}
            />
          </div>
          <div>
            <label htmlFor="neighborhood" className={labelClass}>
              Bairro
            </label>
            <input
              id="neighborhood"
              type="text"
              className={inputClass}
              placeholder="Centro"
              {...register('neighborhood')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className={labelClass}>
              Cidade
            </label>
            <input
              id="city"
              type="text"
              className={inputClass}
              placeholder="Sao Paulo"
              {...register('city')}
            />
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>
              Estado
            </label>
            <input
              id="state"
              type="text"
              className={inputClass}
              placeholder="SP"
              maxLength={2}
              {...register('state')}
            />
          </div>
          <div>
            <label htmlFor="zipCode" className={labelClass}>
              CEP
            </label>
            <input
              id="zipCode"
              type="text"
              className={inputClass}
              placeholder="00000-000"
              maxLength={9}
              {...register('zipCode')}
            />
          </div>
        </div>
      </fieldset>

      {/* ------ Clinical ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Informacoes Clinicas
        </legend>

        <div>
          <label htmlFor="prescribingDoctor" className={labelClass}>
            Medico prescritor
          </label>
          <input
            id="prescribingDoctor"
            type="text"
            className={inputClass}
            placeholder="Dr. Joao Souza"
            {...register('prescribingDoctor')}
          />
        </div>

        <div>
          <label htmlFor="clinicalNotes" className={labelClass}>
            Notas clinicas
          </label>
          <textarea
            id="clinicalNotes"
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Observacoes sobre o paciente..."
            {...register('clinicalNotes')}
          />
        </div>
      </fieldset>

      {/* ------ Tags ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Tags
        </legend>
        <div>
          <label htmlFor="tags" className={labelClass}>
            Tags (separadas por virgula)
          </label>
          <input
            id="tags"
            type="text"
            className={inputClass}
            placeholder="VIP, Dermato, Recorrente"
            value={tagsInput}
            onChange={(e) => {
              setTagsInput(e.target.value);
              setValue('tags', e.target.value);
            }}
          />
          {tagsInput && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagsInput
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-[#0A84FF]/10 px-2.5 py-0.5 text-[12px] font-medium text-[#0A84FF]"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>
      </fieldset>

      {/* ------ Submit ------ */}
      <div className="flex justify-end pt-4 border-t border-[#E5E5EA]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0A84FF] px-6 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0A84FF]/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
          aria-label={isSubmitting ? 'Salvando...' : 'Salvar cliente'}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-75"
                />
              </svg>
              Salvando...
            </>
          ) : (
            'Salvar cliente'
          )}
        </button>
      </div>
    </form>
  );
}
