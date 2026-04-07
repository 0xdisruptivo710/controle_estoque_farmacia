'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/presentation/components/common/PageHeader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlwChatConfig {
  apiToken: string | null;
  channelId: string | null;
  channelName: string | null;
  phoneNumber: string | null;
  connected: boolean;
}

interface FlwChatChannel {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IntegrationsSettingsPage() {
  // FlwChat state
  const [config, setConfig] = useState<FlwChatConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Test connection state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [channels, setChannels] = useState<FlwChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  // ---------------------------------------------------------------------------
  // Load current config on mount
  // ---------------------------------------------------------------------------

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/integrations');
      if (!res.ok) return;
      const data = await res.json();
      setConfig(data.flwchat ?? null);
      if (data.flwchat?.channelId) {
        setSelectedChannelId(data.flwchat.channelId);
      }
      if (data.flwchat?.phoneNumber) {
        setPhoneInput(data.flwchat.phoneNumber);
      }
    } catch {
      // silently fail — user will see disconnected state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ---------------------------------------------------------------------------
  // Test connection
  // ---------------------------------------------------------------------------

  const handleTest = async () => {
    if (!tokenInput.trim()) {
      setTestResult({ ok: false, message: 'Insira o token da API' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setChannels([]);

    try {
      const res = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken: tokenInput.trim() }),
      });

      const data = await res.json();

      if (data.connected) {
        setTestResult({ ok: true, message: 'Conexao estabelecida com sucesso!' });
        setChannels(data.channels ?? []);
        if (data.channels?.length === 1) {
          setSelectedChannelId(data.channels[0].id);
        }
      } else {
        setTestResult({ ok: false, message: data.error ?? 'Falha na conexao' });
      }
    } catch {
      setTestResult({ ok: false, message: 'Erro de rede ao testar conexao' });
    } finally {
      setTesting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Save config
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!tokenInput.trim()) {
      setSaveResult({ ok: false, message: 'Insira o token da API' });
      return;
    }

    setSaving(true);
    setSaveResult(null);

    const selectedChannel = channels.find((ch) => ch.id === selectedChannelId);

    try {
      const res = await fetch('/api/settings/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiToken: tokenInput.trim(),
          channelId: selectedChannelId || undefined,
          channelName: selectedChannel?.name ?? undefined,
          phoneNumber: phoneInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSaveResult({ ok: true, message: 'Configuracao salva com sucesso!' });
        setConfig(data.flwchat);
        // Clear token input after save — masked version is shown from config
        setTokenInput('');
      } else {
        const errMsg =
          typeof data.error === 'string'
            ? data.error
            : 'Erro ao salvar configuracao';
        setSaveResult({ ok: false, message: errMsg });
      }
    } catch {
      setSaveResult({ ok: false, message: 'Erro de rede ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isConnected = config?.connected ?? false;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integracoes"
        description="Configure os canais de comunicacao"
      />

      {/* ================================================================= */}
      {/* WhatsApp — Aios (FlwChat) Card                                    */}
      {/* ================================================================= */}
      <div
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--color-border, #E5E5EA)' }}
      >
        {/* Card header */}
        <button
          type="button"
          className="w-full flex items-center gap-4 p-5 text-left hover:bg-[#F2F2F7]/40 transition-colors"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label="WhatsApp — Aios (FlwChat)"
        >
          {/* WhatsApp icon */}
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#25D36615' }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-[15px]"
              style={{ color: 'var(--color-text-primary, #1C1C1E)' }}
            >
              WhatsApp — Aios (FlwChat)
            </h3>
            <p
              className="text-[13px] mt-0.5"
              style={{ color: 'var(--color-text-secondary, #6E6E73)' }}
            >
              Envio de lembretes de recompra via WhatsApp
            </p>
          </div>

          {/* Status badge */}
          {loading ? (
            <div
              className="w-20 h-6 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--color-surface, #F2F2F7)' }}
            />
          ) : (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
              style={
                isConnected
                  ? { backgroundColor: '#34C75915', color: '#34C759' }
                  : { backgroundColor: '#FF3B3015', color: '#FF3B30' }
              }
            >
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          )}

          {/* Chevron */}
          <svg
            className={`w-5 h-5 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--color-text-secondary, #6E6E73)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expandable config section */}
        {expanded && (
          <div
            className="border-t px-5 pb-5 pt-4 space-y-4"
            style={{ borderColor: 'var(--color-border, #E5E5EA)' }}
          >
            {/* Current saved token (masked) */}
            {config?.apiToken && (
              <div
                className="text-[13px] px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface, #F2F2F7)',
                  color: 'var(--color-text-secondary, #6E6E73)',
                }}
              >
                Token salvo: <span className="font-mono">{config.apiToken}</span>
                {config.channelName && (
                  <span className="ml-2">| Canal: {config.channelName}</span>
                )}
                {config.phoneNumber && (
                  <span className="ml-2">| Tel: {config.phoneNumber}</span>
                )}
              </div>
            )}

            {/* Token input */}
            <div>
              <label
                htmlFor="flwchat-token"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--color-text-primary, #1C1C1E)' }}
              >
                Token da API FlwChat
              </label>
              <div className="relative">
                <input
                  id="flwchat-token"
                  type={showToken ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setTestResult(null);
                    setSaveResult(null);
                  }}
                  placeholder="pn_..."
                  className="w-full rounded-lg border px-3 py-2.5 pr-10 text-[14px] font-mono outline-none transition-colors focus:ring-2"
                  style={{
                    borderColor: 'var(--color-border, #E5E5EA)',
                    color: 'var(--color-text-primary, #1C1C1E)',
                    backgroundColor: '#FFFFFF',
                  }}
                  aria-label="Token da API FlwChat"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/5 transition-colors"
                  aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
                >
                  {showToken ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#6E6E73" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#6E6E73" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Phone number input */}
            <div>
              <label
                htmlFor="flwchat-phone"
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--color-text-primary, #1C1C1E)' }}
              >
                Numero de WhatsApp
              </label>
              <input
                id="flwchat-phone"
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="w-full rounded-lg border px-3 py-2.5 text-[14px] outline-none transition-colors focus:ring-2"
                style={{
                  borderColor: 'var(--color-border, #E5E5EA)',
                  color: 'var(--color-text-primary, #1C1C1E)',
                  backgroundColor: '#FFFFFF',
                }}
                aria-label="Numero de WhatsApp para envio de mensagens"
              />
              <p
                className="text-[12px] mt-1"
                style={{ color: 'var(--color-text-secondary, #6E6E73)' }}
              >
                Numero conectado no Aios/FlwChat para envio de mensagens
              </p>
            </div>

            {/* Test connection button */}
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !tokenInput.trim()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-surface, #F2F2F7)',
                color: 'var(--color-text-primary, #1C1C1E)',
              }}
              aria-label="Testar conexao com FlwChat"
            >
              {testing ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#6E6E73" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              )}
              {testing ? 'Testando...' : 'Testar conexao'}
            </button>

            {/* Test result feedback */}
            {testResult && (
              <div
                className="text-[13px] px-3 py-2.5 rounded-lg flex items-center gap-2"
                style={{
                  backgroundColor: testResult.ok ? '#34C75910' : '#FF3B3010',
                  color: testResult.ok ? '#34C759' : '#FF3B30',
                }}
              >
                {testResult.ok ? (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                )}
                {testResult.message}
              </div>
            )}

            {/* Channel selector (visible after successful test) */}
            {channels.length > 0 && (
              <div>
                <label
                  htmlFor="flwchat-channel"
                  className="block text-[13px] font-medium mb-1.5"
                  style={{ color: 'var(--color-text-primary, #1C1C1E)' }}
                >
                  Canal WhatsApp
                </label>
                <select
                  id="flwchat-channel"
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-[14px] outline-none transition-colors focus:ring-2 appearance-none bg-white"
                  style={{
                    borderColor: 'var(--color-border, #E5E5EA)',
                    color: 'var(--color-text-primary, #1C1C1E)',
                  }}
                  aria-label="Selecionar canal WhatsApp"
                >
                  <option value="">Selecione um canal...</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Save button */}
            {(channels.length > 0 || config?.connected) && (
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !tokenInput.trim()}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-primary, #0A84FF)' }}
                  aria-label="Salvar configuracao FlwChat"
                >
                  {saving ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>

                {/* Save result feedback */}
                {saveResult && (
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: saveResult.ok ? '#34C759' : '#FF3B30' }}
                  >
                    {saveResult.message}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* Web Push Card                                                      */}
      {/* ================================================================= */}
      <div
        className="bg-white rounded-xl border p-5 flex items-center gap-4"
        style={{ borderColor: 'var(--color-border, #E5E5EA)' }}
      >
        {/* Bell icon */}
        <div
          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#FF950015' }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#FF9500"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-[15px]"
            style={{ color: 'var(--color-text-primary, #1C1C1E)' }}
          >
            Notificacoes Push
          </h3>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: 'var(--color-text-secondary, #6E6E73)' }}
          >
            Alertas no navegador para a equipe
          </p>
        </div>

        {/* Status badge */}
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: '#34C75915', color: '#34C759' }}
        >
          Ativo
        </span>
      </div>
    </div>
  );
}
