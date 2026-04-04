'use client';

import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const orderItemSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  productName: z.string().min(1),
  quantity: z
    .number({ message: 'Informe a quantidade' })
    .positive('Quantidade deve ser maior que zero'),
  unitPrice: z
    .number({ message: 'Informe o preco' })
    .nonnegative('Preco nao pode ser negativo'),
});

const orderSchema = z.object({
  customerSearch: z.string().optional(),
  customerId: z.string().min(1, 'Selecione um cliente'),
  items: z.array(orderItemSchema).min(1, 'Adicione ao menos um item'),
  prescribingDoctor: z.string().optional(),
  prescriptionNumber: z.string().optional(),
  estimatedReadyDate: z.string().optional(),
  discount: z.number().nonnegative('Desconto nao pode ser negativo').default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Customer {
  id: string;
  fullName: string;
  cpf?: string;
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
}

interface OrderFormProps {
  customers: Customer[];
  products: Product[];
  onSubmit: (data: OrderFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  onCustomerSearch?: (query: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const inputClass =
  'w-full rounded-[8px] border border-[#E5E5EA] bg-white px-3.5 py-2.5 text-[15px] text-[#1C1C1E] placeholder:text-[#6E6E73]/60 transition-colors focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20';

const labelClass = 'block text-[13px] font-semibold text-[#6E6E73] mb-1.5';

const errorClass = 'mt-1 text-[12px] text-[#FF3B30]';

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartao de Credito' },
  { value: 'debit_card', label: 'Cartao de Debito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'bank_transfer', label: 'Transferencia' },
  { value: 'other', label: 'Outro' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OrderForm({
  customers,
  products,
  onSubmit,
  isSubmitting = false,
  onCustomerSearch,
}: OrderFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(orderSchema) as any,
    defaultValues: {
      customerSearch: '',
      customerId: '',
      items: [],
      prescribingDoctor: '',
      prescriptionNumber: '',
      estimatedReadyDate: '',
      discount: 0,
      paymentMethod: '',
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchDiscount = watch('discount') ?? 0;

  const subtotal = watchItems.reduce(
    (sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
    0
  );
  const total = Math.max(subtotal - watchDiscount, 0);

  // Customer search state
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(customerQuery.toLowerCase()) ||
      (c.cpf && c.cpf.includes(customerQuery))
  );

  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setValue('customerId', customer.id, { shouldValidate: true });
      setSelectedCustomerName(customer.fullName);
      setCustomerQuery('');
      setShowCustomerDropdown(false);
    },
    [setValue]
  );

  const handleAddProduct = useCallback(
    (product: Product) => {
      append({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
      });
    },
    [append]
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}
      className="space-y-8"
      noValidate
      aria-label="Formulario de pedido"
    >
      {/* ------ Customer Selection ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Cliente
        </legend>

        <div className="relative">
          <label htmlFor="customerSearch" className={labelClass}>
            Buscar cliente *
          </label>

          {selectedCustomerName ? (
            <div className="flex items-center gap-2 rounded-[8px] border border-[#0A84FF] bg-[#0A84FF]/5 px-3.5 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A84FF]/10 text-[11px] font-semibold text-[#0A84FF]">
                {selectedCustomerName
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p.charAt(0))
                  .join('')
                  .toUpperCase()}
              </div>
              <span className="flex-1 text-[15px] font-medium text-[#1C1C1E]">
                {selectedCustomerName}
              </span>
              <button
                type="button"
                onClick={() => {
                  setValue('customerId', '');
                  setSelectedCustomerName('');
                }}
                className="text-[#6E6E73] hover:text-[#FF3B30] transition-colors p-1"
                aria-label="Remover cliente selecionado"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <input
                id="customerSearch"
                type="text"
                className={inputClass}
                placeholder="Nome ou CPF do cliente..."
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setShowCustomerDropdown(true);
                  onCustomerSearch?.(e.target.value);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                aria-expanded={showCustomerDropdown}
                aria-haspopup="listbox"
                aria-invalid={!!errors.customerId}
                role="combobox"
                aria-controls="customer-listbox"
              />
              {showCustomerDropdown && customerQuery.length > 0 && (
                <ul
                  id="customer-listbox"
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-[8px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.16)] border border-[#E5E5EA]"
                >
                  {filteredCustomers.length === 0 ? (
                    <li className="px-3.5 py-2.5 text-[14px] text-[#6E6E73]">
                      Nenhum cliente encontrado
                    </li>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <li
                        key={customer.id}
                        role="option"
                        aria-selected={false}
                        className="cursor-pointer px-3.5 py-2.5 text-[14px] text-[#1C1C1E] hover:bg-[#F2F2F7] transition-colors"
                        onClick={() => handleSelectCustomer(customer)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSelectCustomer(customer);
                        }}
                        tabIndex={0}
                      >
                        <span className="font-medium">{customer.fullName}</span>
                        {customer.cpf && (
                          <span className="ml-2 text-[12px] text-[#6E6E73]">
                            {customer.cpf}
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          )}

          <input type="hidden" {...register('customerId')} />
          {errors.customerId && (
            <p className={errorClass} role="alert">
              {errors.customerId.message}
            </p>
          )}
        </div>
      </fieldset>

      {/* ------ Items ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Itens do Pedido
        </legend>

        {/* Add product */}
        <div>
          <label htmlFor="addProduct" className={labelClass}>
            Adicionar produto
          </label>
          <select
            id="addProduct"
            className={inputClass}
            value=""
            onChange={(e) => {
              const product = products.find((p) => p.id === e.target.value);
              if (product) handleAddProduct(product);
            }}
            aria-label="Selecionar produto para adicionar"
          >
            <option value="" disabled>
              Selecione um produto...
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatCurrency(p.unitPrice)}
              </option>
            ))}
          </select>
        </div>

        {/* Items list */}
        {fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-[12px] border border-[#E5E5EA] bg-[#F2F2F7]/50 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[14px] font-semibold text-[#1C1C1E]">
                    {watchItems[index]?.productName ?? field.productName}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-[#FF3B30] hover:text-[#FF3B30]/70 transition-colors p-0.5"
                    aria-label={`Remover ${watchItems[index]?.productName ?? 'item'}`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={`items.${index}.quantity`}
                      className={labelClass}
                    >
                      Quantidade
                    </label>
                    <input
                      id={`items.${index}.quantity`}
                      type="number"
                      step="0.001"
                      min="0"
                      className={inputClass}
                      aria-invalid={!!errors.items?.[index]?.quantity}
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className={errorClass} role="alert">
                        {errors.items[index].quantity.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor={`items.${index}.unitPrice`}
                      className={labelClass}
                    >
                      Preco unitario (R$)
                    </label>
                    <input
                      id={`items.${index}.unitPrice`}
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputClass}
                      aria-invalid={!!errors.items?.[index]?.unitPrice}
                      {...register(`items.${index}.unitPrice`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.items?.[index]?.unitPrice && (
                      <p className={errorClass} role="alert">
                        {errors.items[index].unitPrice.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-right text-[13px] text-[#6E6E73]">
                  Subtotal:{' '}
                  <span className="font-semibold text-[#1C1C1E]">
                    {formatCurrency(
                      (watchItems[index]?.quantity ?? 0) *
                        (watchItems[index]?.unitPrice ?? 0)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {errors.items && typeof errors.items.message === 'string' && (
          <p className={errorClass} role="alert">
            {errors.items.message}
          </p>
        )}
      </fieldset>

      {/* ------ Prescription ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Prescricao
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <label htmlFor="prescriptionNumber" className={labelClass}>
              Numero da receita
            </label>
            <input
              id="prescriptionNumber"
              type="text"
              className={inputClass}
              placeholder="REC-00001"
              {...register('prescriptionNumber')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="estimatedReadyDate" className={labelClass}>
            Data estimada de entrega
          </label>
          <input
            id="estimatedReadyDate"
            type="date"
            className={inputClass}
            {...register('estimatedReadyDate')}
          />
        </div>
      </fieldset>

      {/* ------ Payment ------ */}
      <fieldset className="space-y-4">
        <legend className="text-[17px] font-semibold text-[#1C1C1E] mb-2">
          Pagamento
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="discount" className={labelClass}>
              Desconto (R$)
            </label>
            <input
              id="discount"
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0,00"
              aria-invalid={!!errors.discount}
              {...register('discount', { valueAsNumber: true })}
            />
            {errors.discount && (
              <p className={errorClass} role="alert">
                {errors.discount.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="paymentMethod" className={labelClass}>
              Forma de pagamento
            </label>
            <select
              id="paymentMethod"
              className={inputClass}
              {...register('paymentMethod')}
              aria-label="Selecionar forma de pagamento"
            >
              <option value="">Selecione...</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* ------ Notes ------ */}
      <div>
        <label htmlFor="notes" className={labelClass}>
          Observacoes
        </label>
        <textarea
          id="notes"
          rows={3}
          className={`${inputClass} resize-y`}
          placeholder="Observacoes adicionais..."
          {...register('notes')}
        />
      </div>

      {/* ------ Totals ------ */}
      <div className="rounded-[12px] bg-[#F2F2F7] p-4 space-y-2">
        <div className="flex justify-between text-[14px] text-[#6E6E73]">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        {watchDiscount > 0 && (
          <div className="flex justify-between text-[14px] text-[#FF3B30]">
            <span>Desconto</span>
            <span className="tabular-nums">-{formatCurrency(watchDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[18px] font-bold text-[#1C1C1E] pt-2 border-t border-[#E5E5EA]">
          <span>Total</span>
          <span className="tabular-nums text-[#0A84FF]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* ------ Submit ------ */}
      <div className="flex justify-end pt-4 border-t border-[#E5E5EA]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0A84FF] px-6 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#0A84FF]/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
          aria-label={isSubmitting ? 'Criando pedido...' : 'Criar pedido'}
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
              Criando pedido...
            </>
          ) : (
            'Criar pedido'
          )}
        </button>
      </div>
    </form>
  );
}
