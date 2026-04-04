'use client';

import { PageHeader } from '@/presentation/components/common/PageHeader';

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Gerencie os usuarios da sua farmacia"
        action={{ label: 'Convidar Membro', onClick: () => {} }}
      />

      <div className="bg-white rounded-xl border border-[#E5E5EA] divide-y divide-[#E5E5EA]">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0A84FF] flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div>
              <p className="font-medium text-[#1C1C1E]">Administrador</p>
              <p className="text-sm text-[#6E6E73]">admin@farmacia.com</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0A84FF]/10 text-[#0A84FF]">
            Admin
          </span>
        </div>
      </div>

      <p className="text-sm text-[#6E6E73] text-center">
        Configure o Supabase para gerenciar usuarios
      </p>
    </div>
  );
}
