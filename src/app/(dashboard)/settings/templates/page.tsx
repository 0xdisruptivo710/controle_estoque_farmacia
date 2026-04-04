'use client';

import { PageHeader } from '@/presentation/components/common/PageHeader';

export default function TemplatesSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates de Mensagem"
        description="Modelos usados nos lembretes de recompra"
        action={{ label: 'Novo Template', onClick: () => {} }}
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-[#E5E5EA] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#34C759]/10 text-[#34C759]">
                WhatsApp
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0A84FF]/10 text-[#0A84FF]">
                Padrao
              </span>
            </div>
            <button className="text-sm text-[#0A84FF] hover:underline" aria-label="Editar template WhatsApp">
              Editar
            </button>
          </div>
          <h3 className="font-semibold text-[#1C1C1E]">Lembrete de Recompra - WhatsApp</h3>
          <p className="text-sm text-[#6E6E73] mt-1 line-clamp-2">
            {`Olá, {{customer_name}}! Está chegando a hora de renovar seu {{product_name}}...`}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {['customer_name', 'product_name', 'pharmacy_name', 'pharmacy_phone'].map((v) => (
              <span key={v} className="text-xs px-2 py-0.5 rounded bg-[#F2F2F7] text-[#6E6E73]">
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5EA] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FF9500]/10 text-[#FF9500]">
                E-mail
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0A84FF]/10 text-[#0A84FF]">
                Padrao
              </span>
            </div>
            <button className="text-sm text-[#0A84FF] hover:underline" aria-label="Editar template E-mail">
              Editar
            </button>
          </div>
          <h3 className="font-semibold text-[#1C1C1E]">Lembrete de Recompra - E-mail</h3>
          <p className="text-sm text-[#6E6E73] mt-1 line-clamp-2">
            {`Hora de renovar seu {{product_name}} — {{pharmacy_name}}`}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {['customer_name', 'product_name', 'pharmacy_name', 'pharmacy_phone', 'pharmacy_email'].map((v) => (
              <span key={v} className="text-xs px-2 py-0.5 rounded bg-[#F2F2F7] text-[#6E6E73]">
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
