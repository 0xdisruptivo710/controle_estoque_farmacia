'use client';

import Link from 'next/link';

const settingSections = [
  {
    title: 'Farmacia',
    description: 'Nome, CNPJ, logo e dados de contato',
    href: '/settings',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a2.25 2.25 0 0 1 1.09-1.928l7.45-4.47a2.25 2.25 0 0 1 2.42 0l7.45 4.47a2.25 2.25 0 0 1 1.09 1.928" />
      </svg>
    ),
  },
  {
    title: 'Equipe',
    description: 'Gerenciar usuarios e permissoes',
    href: '/settings/team',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    title: 'Templates de Mensagem',
    description: 'Modelos para WhatsApp, E-mail e Push',
    href: '/settings/templates',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
  {
    title: 'Integracoes',
    description: 'WhatsApp, E-mail e notificacoes push',
    href: '/settings/integrations',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1C1E]">Configuracoes</h1>
        <p className="text-[#6E6E73] mt-1">Gerencie sua farmacia e integracoes</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-start gap-4 p-5 bg-white rounded-xl border border-[#E5E5EA] hover:border-[#0A84FF] hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-[#F2F2F7] rounded-lg flex items-center justify-center text-[#0A84FF]">
              {section.icon}
            </div>
            <div>
              <h3 className="font-semibold text-[#1C1C1E]">{section.title}</h3>
              <p className="text-sm text-[#6E6E73] mt-0.5">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
