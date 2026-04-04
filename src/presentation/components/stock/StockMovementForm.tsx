'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const MOVEMENT_TYPES = [
  { value: 'entry', label: 'Entrada' },
  { value: 'exit', label: 'Saida' },
  { value: 'adjustment', label: 'Ajuste' },
  { value: 'loss', label: 'Perda' },
  { value: 'expiration', label: 'Vencimento' },
] as const;

const movementSchema = z.object({
  movementType: z.enum(['entry', 'exit', 'adjustment', 'loss', 'expiration'], {
    message: 'Selecione o tipo de movimentacao',
  }),
  quantity: z
    .number({ message: 'Informe a quantidade' })
    .positive('Quantidade deve ser maior que zero'),
  reason: z.string().optional(),
  referenceDoc: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface StockMovementFormProps {
  productName?: string;
  onSubmit: (data: MovementFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

const inputClass =
  'w-full rounded-[8px] border border-[#E5E5EA] bg-white px-3.5 py-2.5 text-[15px] text-[#1C1C1E] placeholder:text-[#6E6E73]/60 transition-colors focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20';

const labelClass = 'block text-[13px] font-semibold text-[#6E6E73] mb-1.5';

const errorClass = 'mt-1 text-[12px] text-[#FF3B30]';

export function StockMovementForm({
  productName,
  onSubmit,
  isSubmitting = false,
}: StockMovementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movementType: undefined,
      quantity: undefined,
      reason: '',
      referenceDoc: '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
      aria-label={`Registrar movimentacao de estoque${productName ? ` para ${productName}` : ''}`}
    >
      {productName && (
        <div className="rounded-[8px] bg-[#F2F2F7] px-3.5 py-2.5 text-[14px] text-[#6E6E73]">
          Produto:{' '}
          <span className="font-semibold text-[#1C1C1E]">{productName}</span>
        </div>
      )}

      {/* Movement Type */}
      <div>
        <label htmlFor="movementType" className={labelClass}>
          Tipo de movimentacao *
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Tipo de movimentacao">
          {MOVEMENT_TYPES.map((type) => (
            <label
              key={type.value}
              className="relative"
            >
              <input
                type="radio"
                value={type.value}
                className="peer sr-only"
                {...register('movementType')}
                aria-label={type.label}
              />
              <div className="cursor-pointer rounded-[8px] border border-[#E5E5EA] px-3 py-2 text-center text-[13px] font-medium text-[#6E6E73] transition-all peer-checked:border-[#0A84FF] peer-checked:bg-[#0A84FF]/10 peer-checked:text-[#0A84FF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#0A84FF] peer-focus-visible:ring-offset-2 hover:bg-[#F2F2F7]">
                {type.label}
              </div>
            </label>
          ))}
        </div>
        {errors.movementType && (
          <p className={errorClass} role="alert">
            {errors.movementType.message}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="quantity" className={labelClass}>
          Quantidade *
        </label>
        <input
          id="quantity"
          type="number"
          step="0.001"
          min="0"
          className={inputClass}
          placeholder="0"
          aria-required="true"
          aria-invalid={!!errors.quantity}
          {...register('quantity', { valueAsNumber: true })}
        />
        {errors.quantity && (
          <p className={errorClass} role="alert">
            {errors.quantity.message}
          </p>
        )}
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className={labelClass}>
          Motivo / Observacoes
        </label>
        <textarea
          id="reason"
          rows={3}
          className={`${inputClass} resize-y`}
          placeholder="Motivo da movimentacao..."
          {...register('reason')}
        />
      </div>

      {/* Reference Document */}
      <div>
        <label htmlFor="referenceDoc" className={labelClass}>
          Documento de referencia
        </label>
        <input
          id="referenceDoc"
          type="text"
          className={inputClass}
          placeholder="NF-e, lote, etc."
          {...register('referenceDoc')}
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0A84FF] px-6 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0A84FF]/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
          aria-label={isSubmitting ? 'Registrando...' : 'Registrar movimentacao'}
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
              Registrando...
            </>
          ) : (
            'Registrar movimentacao'
          )}
        </button>
      </div>
    </form>
  );
}
