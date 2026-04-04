'use client';

import React from 'react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosage?: string;
  posology?: string;
}

interface OrderItemsListProps {
  items: OrderItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[12px] bg-[#F2F2F7] p-6 text-center">
        <p className="text-[14px] text-[#6E6E73]">
          Nenhum item adicionado ao pedido.
        </p>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="rounded-[12px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E5EA] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Itens do pedido">
          <thead>
            <tr className="border-b border-[#E5E5EA] bg-[#F2F2F7]">
              <th
                scope="col"
                className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]"
              >
                Produto
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]"
              >
                Dosagem
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]"
              >
                Posologia
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]"
              >
                Qtd
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]"
              >
                Preco Unit.
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-[#6E6E73]"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#E5E5EA] last:border-b-0"
              >
                <td className="px-4 py-3 text-[14px] font-medium text-[#1C1C1E]">
                  {item.productName}
                </td>
                <td className="px-4 py-3 text-[14px] text-[#6E6E73]">
                  {item.dosage ?? '-'}
                </td>
                <td className="px-4 py-3 text-[14px] text-[#6E6E73] max-w-[200px] truncate">
                  {item.posology ?? '-'}
                </td>
                <td className="px-4 py-3 text-[14px] text-[#1C1C1E] text-right tabular-nums">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-[14px] text-[#6E6E73] text-right tabular-nums">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-4 py-3 text-[14px] font-semibold text-[#1C1C1E] text-right tabular-nums">
                  {formatCurrency(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#F2F2F7]">
              <td
                colSpan={5}
                className="px-4 py-3 text-right text-[14px] font-semibold text-[#1C1C1E]"
              >
                Total
              </td>
              <td className="px-4 py-3 text-right text-[16px] font-bold text-[#0A84FF] tabular-nums">
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
