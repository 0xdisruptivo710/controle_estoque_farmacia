'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/presentation/components/common/PageHeader';

type Role = 'admin' | 'pharmacist' | 'attendant';

interface Member {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  isPlatformAdmin: boolean;
  isSelf: boolean;
  lastSeenAt: string | null;
}

interface Invitation {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
  role: Exclude<Role, 'admin'>;
  sentVia: string | null;
  sentAt: string | null;
  expiresAt: string;
  inviteUrl: string;
  isExpired: boolean;
  createdAt: string;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  pharmacist: 'Farmaceutica',
  attendant: 'Atendente',
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000);
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<{ inviteUrl: string; whatsappSent: boolean; whatsappError: string | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/team'),
        fetch('/api/team/invitations'),
      ]);
      const membersData = await membersRes.json();
      const invitesData = await invitesRes.json();
      setMembers(membersData.members ?? []);
      setInvitations(invitesData.invitations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(id: string) {
    if (!confirm('Revogar este convite?')) return;
    await fetch(`/api/team/invitations/${id}`, { method: 'DELETE' });
    void load();
  }

  async function resend(id: string) {
    const res = await fetch(`/api/team/invitations/${id}/resend`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? 'Falha ao reenviar');
    else alert('Convite reenviado via WhatsApp.');
    void load();
  }

  async function toggleActive(member: Member) {
    await fetch(`/api/team/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    void load();
  }

  async function changeRole(member: Member, role: Role) {
    await fetch(`/api/team/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    void load();
  }

  function copyLink(url: string) {
    void navigator.clipboard.writeText(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Gerencie os usuarios da sua farmacia"
        action={{ label: 'Convidar Membro', onClick: () => setShowModal(true) }}
      />

      {/* Active members */}
      <section>
        <h2 className="text-sm font-semibold text-[#6E6E73] uppercase tracking-wide mb-3">
          Membros ativos ({members.length})
        </h2>
        <div className="bg-white rounded-xl border border-[#E5E5EA] divide-y divide-[#E5E5EA]">
          {loading ? (
            <div className="p-4 text-sm text-[#6E6E73]">Carregando...</div>
          ) : members.length === 0 ? (
            <div className="p-4 text-sm text-[#6E6E73]">Nenhum membro.</div>
          ) : (
            members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                onToggleActive={() => toggleActive(m)}
                onChangeRole={(r) => changeRole(m, r)}
              />
            ))
          )}
        </div>
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#6E6E73] uppercase tracking-wide mb-3">
            Convites pendentes ({invitations.length})
          </h2>
          <div className="bg-white rounded-xl border border-[#E5E5EA] divide-y divide-[#E5E5EA]">
            {invitations.map((i) => (
              <InvitationRow
                key={i.id}
                invite={i}
                onCopy={() => copyLink(i.inviteUrl)}
                onResend={() => resend(i.id)}
                onRevoke={() => revoke(i.id)}
              />
            ))}
          </div>
        </section>
      )}

      {showModal && (
        <InviteModal
          onClose={() => setShowModal(false)}
          onCreated={(r) => {
            setResult(r);
            setShowModal(false);
            void load();
          }}
        />
      )}

      {result && <InviteResultModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
}

function MemberRow({
  member,
  onToggleActive,
  onChangeRole,
}: {
  member: Member;
  onToggleActive: () => void;
  onChangeRole: (r: Role) => void;
}) {
  const initial = member.fullName.charAt(0).toUpperCase();
  return (
    <div className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-full bg-[#0A84FF] flex items-center justify-center text-white font-semibold shrink-0"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-[#1C1C1E] truncate">{member.fullName}</p>
            {member.isSelf && (
              <span className="text-xs text-[#6E6E73]">(voce)</span>
            )}
            {member.isPlatformAdmin && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500]">
                Platform
              </span>
            )}
            {!member.isActive && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#6E6E73]/10 text-[#6E6E73]">
                Desativado
              </span>
            )}
          </div>
          <p className="text-sm text-[#6E6E73] truncate">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <select
          value={member.role}
          onChange={(e) => onChangeRole(e.target.value as Role)}
          disabled={member.isSelf}
          aria-label={`Papel de ${member.fullName}`}
          className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] border-0 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] disabled:opacity-60"
        >
          <option value="admin">Admin</option>
          <option value="pharmacist">Farmaceutica</option>
          <option value="attendant">Atendente</option>
        </select>
        {!member.isSelf && (
          <button
            type="button"
            onClick={onToggleActive}
            className="text-sm text-[#0A84FF] hover:underline"
            aria-label={member.isActive ? `Desativar ${member.fullName}` : `Reativar ${member.fullName}`}
          >
            {member.isActive ? 'Desativar' : 'Reativar'}
          </button>
        )}
      </div>
    </div>
  );
}

function InvitationRow({
  invite,
  onCopy,
  onResend,
  onRevoke,
}: {
  invite: Invitation;
  onCopy: () => void;
  onResend: () => void;
  onRevoke: () => void;
}) {
  const days = daysUntil(invite.expiresAt);
  return (
    <div className={`p-4 flex items-center justify-between gap-3 ${invite.isExpired ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <p className="font-medium text-[#1C1C1E] truncate">{invite.fullName}</p>
        <p className="text-sm text-[#6E6E73] truncate">
          {invite.email} · {ROLE_LABEL[invite.role]}
        </p>
        <p className="text-xs text-[#6E6E73] mt-0.5">
          {invite.isExpired
            ? 'Expirado'
            : `Expira em ${days} dia${days === 1 ? '' : 's'}`}
          {invite.sentVia === 'whatsapp' && ' · enviado via WhatsApp'}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onCopy}
          className="text-sm text-[#0A84FF] hover:underline"
          aria-label="Copiar link de convite"
        >
          Copiar link
        </button>
        {invite.whatsapp && (
          <button
            type="button"
            onClick={onResend}
            className="text-sm text-[#0A84FF] hover:underline"
            aria-label="Reenviar via WhatsApp"
          >
            Reenviar
          </button>
        )}
        <button
          type="button"
          onClick={onRevoke}
          className="text-sm text-[#FF3B30] hover:underline"
          aria-label="Revogar convite"
        >
          Revogar
        </button>
      </div>
    </div>
  );
}

function InviteModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: { inviteUrl: string; whatsappSent: boolean; whatsappError: string | null }) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState<'pharmacist' | 'attendant'>('attendant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          whatsapp: whatsapp.replace(/\D/g, ''),
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar convite.');
        return;
      }
      onCreated({
        inviteUrl: data.inviteUrl,
        whatsappSent: data.whatsappSent,
        whatsappError: data.whatsappError,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-[0_8px_40px_rgba(0,0,0,0.16)]">
        <h2 className="text-xl font-bold text-[#1C1C1E] mb-1">Convidar membro</h2>
        <p className="text-sm text-[#6E6E73] mb-5">
          O convidado recebera um link para definir a senha.
        </p>

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm font-medium bg-[#FFF0F0] text-[#FF3B30]" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="inv-name" className="block text-sm font-medium mb-1.5 text-[#1C1C1E]">
              Nome completo *
            </label>
            <input
              id="inv-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-ios"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="inv-email" className="block text-sm font-medium mb-1.5 text-[#1C1C1E]">
              E-mail (login) *
            </label>
            <input
              id="inv-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-ios"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="inv-wa" className="block text-sm font-medium mb-1.5 text-[#1C1C1E]">
              WhatsApp (para envio automatico)
            </label>
            <input
              id="inv-wa"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
              className="input-ios"
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
            <p className="mt-1 text-xs text-[#6E6E73]">
              Opcional. Se nao preenchido, voce copia o link manualmente.
            </p>
          </div>

          <div>
            <label htmlFor="inv-role" className="block text-sm font-medium mb-1.5 text-[#1C1C1E]">
              Papel *
            </label>
            <select
              id="inv-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'pharmacist' | 'attendant')}
              className="input-ios"
            >
              <option value="attendant">Atendente</option>
              <option value="pharmacist">Farmaceutica</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-[8px] border border-[#E5E5EA] text-[15px] font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Enviando...' : 'Criar convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteResultModal({
  result,
  onClose,
}: {
  result: { inviteUrl: string; whatsappSent: boolean; whatsappError: string | null };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-[0_8px_40px_rgba(0,0,0,0.16)]">
        <h2 className="text-xl font-bold text-[#1C1C1E] mb-3">Convite criado</h2>

        {result.whatsappSent ? (
          <p className="text-sm text-[#34C759] font-medium mb-4">
            Enviado via WhatsApp
          </p>
        ) : result.whatsappError ? (
          <p className="text-sm text-[#FF9500] mb-4">
            {result.whatsappError} Use o link abaixo.
          </p>
        ) : (
          <p className="text-sm text-[#6E6E73] mb-4">
            Compartilhe o link abaixo com o convidado.
          </p>
        )}

        <div className="bg-[#F2F2F7] rounded-lg p-3 mb-4">
          <p className="text-xs font-mono break-all text-[#1C1C1E]">{result.inviteUrl}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={copy}
            className="flex-1 px-5 py-2.5 rounded-[8px] border border-[#E5E5EA] text-[15px] font-semibold text-[#1C1C1E] hover:bg-[#F2F2F7]"
          >
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
          <button type="button" onClick={onClose} className="btn-primary flex-1">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
