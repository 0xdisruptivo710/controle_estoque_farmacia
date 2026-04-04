'use client';

import { PageHeader } from '@/presentation/components/common/PageHeader';

const integrations = [
  {
    name: 'WhatsApp (Evolution API)',
    description: 'Envio de lembretes via WhatsApp',
    status: 'disconnected' as const,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    name: 'E-mail (Resend)',
    description: 'Envio de lembretes e notificacoes por e-mail',
    status: 'configured' as const,
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#0A84FF" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    name: 'Web Push (VAPID)',
    description: 'Notificacoes push no navegador',
    status: 'configured' as const,
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#FF9500" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
];

const statusMap = {
  connected: { label: 'Conectado', className: 'bg-[#34C759]/10 text-[#34C759]' },
  configured: { label: 'Configurado', className: 'bg-[#0A84FF]/10 text-[#0A84FF]' },
  disconnected: { label: 'Desconectado', className: 'bg-[#FF3B30]/10 text-[#FF3B30]' },
};

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integracoes"
        description="Configure os canais de comunicacao"
      />

      <div className="space-y-4">
        {integrations.map((integration) => {
          const s = statusMap[integration.status];
          return (
            <div
              key={integration.name}
              className="bg-white rounded-xl border border-[#E5E5EA] p-5 flex items-center gap-4"
            >
              <div className="flex-shrink-0">{integration.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1C1C1E]">{integration.name}</h3>
                <p className="text-sm text-[#6E6E73]">{integration.description}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.className}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-[#6E6E73] text-center">
        Configure as variaveis de ambiente no Vercel para ativar as integracoes
      </p>
    </div>
  );
}
