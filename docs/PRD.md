# PRD — PharmaControl

> **Versão:** 1.3.0
> **Última atualização:** 2026-04-21 (pós-aplicação real em produção)
> **Stack real (vs. CLAUDE.md original):** Next.js **16.2.2** (App Router) · React 19.2 · TypeScript 5 · Tailwind v4 · Supabase SSR 0.10 · Sentry 10 · Zustand 5 · TanStack Query 5 · Recharts 3 · Framer Motion 12

---

## 1. Produto

### 1.1 Visão
Sistema web responsivo (mobile-first, design iOS) para **farmácias de manipulação**. Dois pilares:

1. **Controle de Estoque** em tempo real — insumos, fórmulas, produtos prontos, alertas automáticos de nível crítico e vencimento.
2. **Gestão de Recompras** — histórico por cliente e disparo automático de lembretes via WhatsApp baseado no ciclo de uso do produto.

### 1.2 Público-alvo
- **Gerente/proprietária** (`role = admin`) — configura a farmácia, gerencia equipe, vê relatórios.
- **Farmacêutica responsável** (`role = pharmacist`) — opera estoque, aprova manipulação, registra pedidos.
- **Atendente** (`role = attendant`) — cadastra cliente, registra pedido, dispara lembrete.
- **Platform admin** (novo, 2026-04-21) — dono do SaaS (Aios), vê dados de todas as farmácias.

### 1.3 Ecossistema
PharmaControl é **um módulo dentro do Aios CRM**. WhatsApp é entregue via API da FlwChat/Aios (número já conectado ao CRM). Não há canal de e-mail para clientes (removido).

---

## 2. Estrutura do repositório

```
pharmacontrol/
├── docs/
│   ├── PRD.md                          ← este arquivo
│   └── superpowers/specs/              ← design specs versionados
├── public/
├── src/
│   ├── app/                            ← Next.js App Router (rotas + API)
│   ├── domain/                         ← Camada de negócio pura (zero deps externas)
│   ├── application/                    ← Use cases (orquestração de domínio)
│   ├── infrastructure/                 ← Implementações concretas (Supabase, FlwChat, etc)
│   ├── presentation/                   ← Componentes React + hooks de UI
│   ├── design-system/                  ← Tokens (cores, spacing, radius)
│   ├── store/                          ← Zustand stores (auth, UI, notifications)
│   ├── types/                          ← Tipos TypeScript compartilhados
│   └── middleware.ts                   ← Edge middleware (auth gate + session refresh)
├── supabase/
│   ├── config.toml
│   ├── functions/                      ← Edge Functions (Deno)
│   ├── migrations/                     ← SQL versionadas (timestamp-prefixed)
│   └── seed_platform_admin.sql         ← bootstrap one-off do super-admin
├── package.json
├── next.config.ts
├── vercel.json                         ← config de cron jobs + headers
└── CLAUDE.md                           ← regras do projeto e padrões
```

### 2.1 Clean Architecture — regra de dependência

```
              ┌─────────────────────────────────┐
              │   src/app/  (Next.js routes)    │  ← Presentation/delivery
              └──────────────┬──────────────────┘
                             │ usa
              ┌──────────────▼──────────────────┐
              │   src/presentation/ + hooks     │  ← UI components
              └──────────────┬──────────────────┘
                             │ chama via fetch/server actions
              ┌──────────────▼──────────────────┐
              │      src/application/           │  ← Use cases
              └──────────────┬──────────────────┘
                             │ depende de interfaces
              ┌──────────────▼──────────────────┐
              │        src/domain/              │  ← Entidades + interfaces (Repo, Events)
              └──────────────▲──────────────────┘
                             │ implementa
              ┌──────────────┴──────────────────┐
              │     src/infrastructure/         │  ← Supabase repos + FlwChat + Push
              └─────────────────────────────────┘
```

**Regra:** domain **não importa** de application, infrastructure ou presentation. Sempre setas para dentro.

---

## 3. Detalhamento de pastas

### 3.1 `src/app/` — Next.js App Router
Páginas e API routes. Os parênteses em nomes de pastas criam **route groups** (não aparecem na URL).

```
app/
├── layout.tsx                     ← root layout (fontes, providers)
├── page.tsx                       ← landing (raramente acessada — middleware redireciona)
├── providers.tsx                  ← React Query + Sentry providers
│
├── (auth)/                        ← rotas públicas de autenticação
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── setup/page.tsx             ← onboarding pós-signup (cria pharmacy + profile)
│
├── invite/[token]/page.tsx        ← NOVO (2026-04-21): aceite público de convite
│
├── (dashboard)/                   ← rotas protegidas (exigem sessão + profile)
│   ├── layout.tsx                 ← sidebar + header + verificação de profile
│   ├── page.tsx                   ← dashboard principal (KPIs)
│   ├── customers/
│   │   ├── page.tsx               ← lista
│   │   ├── new/page.tsx           ← criar
│   │   └── [id]/
│   │       ├── page.tsx           ← detalhe
│   │       └── orders/page.tsx    ← histórico de pedidos do cliente
│   ├── orders/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── stock/
│   │   ├── page.tsx               ← visão consolidada
│   │   ├── entry/page.tsx         ← entrada de lote
│   │   ├── movements/page.tsx     ← histórico de movimentações
│   │   └── products/
│   │       ├── page.tsx
│   │       └── new/page.tsx
│   ├── reminders/
│   │   ├── page.tsx               ← fila de lembretes (hoje, amanhã, atrasados)
│   │   └── new/page.tsx
│   └── settings/
│       ├── page.tsx               ← perfil da farmácia
│       ├── team/page.tsx          ← NOVO: gestão de membros e convites
│       ├── templates/page.tsx     ← templates de mensagens WhatsApp
│       └── integrations/page.tsx  ← FlwChat config (token, fromPhone)
│
└── api/                           ← Route Handlers
    ├── setup/route.ts             ← POST: cria pharmacy+profile após signup
    ├── customers/route.ts
    ├── orders/
    │   ├── route.ts
    │   └── [id]/
    │       ├── route.ts
    │       └── status/route.ts    ← PATCH de status (dispara triggers)
    ├── products/route.ts
    ├── stock/
    │   ├── route.ts
    │   ├── dashboard/route.ts
    │   ├── items/route.ts
    │   └── movements/route.ts
    ├── reminders/
    │   ├── route.ts
    │   └── manual/route.ts
    ├── notifications/
    │   ├── subscribe/route.ts     ← Web Push VAPID subscription
    │   └── send/route.ts
    ├── settings/integrations/route.ts
    │
    ├── team/                      ← NOVO: endpoints protegidos de equipe
    │   ├── route.ts               ← GET membros
    │   ├── members/[userId]/route.ts  ← PATCH (ativar/desativar, alterar papel)
    │   └── invitations/
    │       ├── route.ts           ← GET lista, POST cria convite
    │       └── [id]/
    │           ├── route.ts       ← DELETE (revoga)
    │           └── resend/route.ts ← POST (reenvia WhatsApp)
    │
    ├── invitations/               ← NOVO: endpoints PÚBLICOS (token auth)
    │   └── [token]/
    │       ├── route.ts           ← GET preview do convite
    │       └── accept/route.ts    ← POST cria auth.users + profile
    │
    └── cron/                      ← Vercel Cron (autenticado via CRON_SECRET)
        ├── send-reminders/route.ts          (9h BR diário)
        ├── check-stock-alerts/route.ts      (toda hora)
        └── sync-notification-status/route.ts (a cada 30min)
```

### 3.2 `src/domain/` — Camada de negócio pura

```
domain/
├── entities/          ← classes puras (Customer, Order, StockItem, Reminder...)
├── repositories/      ← INTERFACES apenas (ICustomerRepository, IOrderRepository...)
├── events/            ← domain events imutáveis (OrderDelivered, StockAlertTriggered)
└── value-objects/     ← tipos com validação (CPF, Phone, Money)
```

**Importante:** nenhum arquivo aqui importa do Supabase, Next, ou libs externas. É a parte da aplicação que sobrevive a qualquer mudança de tech stack.

### 3.3 `src/application/` — Use Cases

```
application/
├── dtos/              ← contratos de entrada/saída dos use cases
└── use-cases/         ← orquestração (1 use case = 1 ação de negócio)
    ├── customers/     (CreateCustomerUseCase, GetCustomerHistoryUseCase...)
    ├── orders/        (CreateOrderUseCase, UpdateOrderStatusUseCase...)
    ├── reminders/     (ScheduleReminderUseCase, SendPendingRemindersUseCase)
    └── stock/         (RegisterStockMovementUseCase, CheckStockAlertsUseCase...)
```

Use cases recebem **interfaces** de repositório pelo construtor (DI manual). Testáveis sem Supabase.

### 3.4 `src/infrastructure/` — Implementações concretas

```
infrastructure/
├── repositories/      ← SupabaseCustomerRepository implements ICustomerRepository
├── services/          ← FlwChatWhatsAppService, WebPushService, EventBusService
└── supabase/
    ├── client.ts            ← browser client (anon key)
    ├── server.ts            ← server-side: createServerClient + createServiceRoleClient
    ├── middleware.ts        ← helper updateSession (legado, coexiste com src/middleware.ts)
    └── auth-helpers.ts      ← getAuthenticatedProfile, requirePlatformAdmin, requirePharmacyAdmin
```

**Padrão crítico (memory):** rotas de API devem usar `createServiceRoleClient` para ler `x3_profiles`. A RLS bloqueia o anon client nesse contexto.

### 3.5 `src/presentation/` — UI
```
presentation/
├── components/
│   ├── common/        (PageHeader, DataTable, StatusBadge, EmptyState, Skeleton, AlertCard)
│   ├── ui/            (shadcn-like primitives)
│   ├── dashboard/     (KPICard, RepurchaseChart, AlertsFeed, ActivityFeed)
│   ├── customers/     (CustomerCard, CustomerForm, OrderTimeline)
│   ├── stock/         (StockGauge, StockMovementForm, StockAlertBanner)
│   └── orders/        (OrderForm, OrderStatusStepper, OrderItemsList)
└── hooks/             (useCustomers, useStock, useOrders, useReminders — TanStack Query wrappers)
```

### 3.6 `src/store/` — Estado cliente (Zustand)
- `authStore.ts` — sessão + profile em cache
- `uiStore.ts` — modais, toasts, preferências
- `notificationStore.ts` — push subscription state

### 3.7 `supabase/`
- `migrations/` — versionadas `YYYYMMDDHHMMSS_nome.sql`. Cada migração inclui bloco de rollback comentado.
- `functions/_shared/` — helpers usados por Edge Functions (cors, auth)
- `config.toml` — configuração do projeto local

---

## 4. Autenticação e hierarquia de usuários

### 4.1 Quatro estados possíveis de um request

| Estado | Como detecta | Destino |
|---|---|---|
| Não autenticado | `supabase.auth.getUser()` → null | redireciona `/login` |
| Autenticado, sem profile | user existe mas `x3_profiles` vazio | redireciona `/setup` |
| Autenticado, com profile | cookie `pc_has_pharmacy=1` (fast path) ou query `x3_profiles` | libera acesso |
| Aceitando convite | URL começa com `/invite/` | público — token é a auth |

### 4.2 Hierarquia de papéis

| Papel (DB) | Função real | Capacidades |
|---|---|---|
| `platform_admin` (flag) | Dono do SaaS | **Tudo, em todas farmácias** |
| `admin` | Gerente da farmácia | Convidar/remover usuários, configurar, operar |
| `pharmacist` | Farmacêutica responsável | Operar estoque/pedidos, aprovar manipulação |
| `attendant` | Atendente de balcão | Cadastrar cliente, registrar pedido, disparar lembrete |

Ver `CLAUDE.md` para detalhamento de cada agente de desenvolvimento.

### 4.3 Super-admin (platform admin) — design híbrido A+B

Implementado em `20260421000001_platform_admins.sql`.

- **Fonte de verdade:** tabela `x3_platform_admins` (com auditoria: `granted_by`, `granted_at`, `revoked_at`, `notes`).
- **Cache:** coluna `is_platform_admin` em `x3_profiles` para RLS rápido sem JOIN.
- **Sincronização:** trigger `trigger_sync_platform_admin_flag` mantém flag ↔ tabela.
- **Helper SQL:** `public.is_platform_admin()` retorna `BOOLEAN` lendo o flag (em `public` schema, não `auth`, pois o SQL editor do Supabase não permite DDL em `auth`).
- **RLS:** policies próprias de `x3_platform_admins`, `pc_invitations`, e extensão de `profile_visibility` em `x3_profiles`. Tabelas de tenant (`customers`, `orders`, etc.) **não** foram alteradas — platform admin usa service role para ler cross-tenant (mesmo padrão das demais API routes).
- **Bootstrap:** `pnpm owner:create` → `scripts/create-owner.mjs` usa service role para criar auth user (com `email_confirm=true`, bypassando email SMTP), pharmacy, profile e marcar como platform admin. Idempotente.

### 4.4 Fluxo de convite (novo)

```
ADMIN                                        INVITEE
-----                                        -------
[/settings/team]
  POST /api/team/invitations
    ├── valida admin?
    ├── gera token aleatório 32b
    ├── INSERT pc_invitations (expires +7d)
    └── se whatsapp+FlwChat OK → sendWhatsApp
  modal: "enviado via WhatsApp" ou "copie o link"
                                             ↓ (recebe link)
                                             GET /invite/[token]
                                             GET /api/invitations/[token]
                                               → preview {nome, email, papel, farmácia}
                                             formulário: nome, senha
                                             POST /api/invitations/[token]/accept
                                               ├── admin.auth.admin.createUser(email, pwd, email_confirm=true)
                                               ├── INSERT x3_profiles (pharmacy_id, role)
                                               └── UPDATE invitations SET accepted_at
                                             redireciona /login?email=...
```

**Decisões-chave:**
- `auth.users` é criado **apenas no aceite** (evita ghost accounts).
- Email do convidado é username imutável (Supabase Auth).
- Convite é **single-use** (`accepted_at` + unique partial index nos pendentes).
- Admin pode **reenviar** (renova `expires_at` +7d) e **revogar** (seta `revoked_at`).
- Desativar membro = `is_active = FALSE` (soft, reversível). `auth.users` fica intacto para preservar FKs de auditoria.

---

## 5. Banco de dados

### 5.1 Tabelas (15 no total após esta sprint)

**Prefixadas com `x3_`** (coexistência com Aios):
- `x3_profiles` — usuários da farmácia (liga `auth.users` ↔ `pharmacies`)
- `x3_platform_admins` — super-admins (novo)
- `pc_invitations` — convites pendentes (novo)

**Sem prefixo:**
- `pharmacies` — tenants
- `customers` · `suppliers` · `products`
- `stock_items` · `stock_movements` (+ view `stock_summary`)
- `orders` · `order_items`
- `repurchase_reminders` · `notification_logs` · `message_templates`
- `stock_alerts_config` · `audit_logs`

### 5.2 Invariantes

- Todas as tabelas de dados têm `created_at`, `updated_at`, `deleted_at` (soft delete).
- Trigger `trigger_set_updated_at` atualiza `updated_at` em toda modificação.
- Multi-tenancy via `pharmacy_id NOT NULL` + RLS.
- Todo `TIMESTAMPTZ` (timezone-aware).

### 5.3 RLS
- `pharmacy_isolation`: **não foi alterada** — o live DB não tem `auth.pharmacy_id()` do design original. Policies existentes permanecem intactas. Platform admin lê cross-tenant via service role.
- `profile_visibility`: próprio OR mesma farmácia OR platform admin (a única policy de tenant que foi estendida).
- `invitation_admin_manage`: inline EXISTS check — `role = 'admin'` OR `is_platform_admin = TRUE`.

### 5.4 Triggers e jobs
- `auto_schedule_reminder` — cria lembrete ao entregar pedido
- `update_customer_order_stats` — atualiza `total_orders` e `last_order_at`
- `refresh_stock_alert_levels` — pg_cron horário (backup do Vercel Cron)
- `set_order_number` — gera `PC-YYYY-NNNNNN`
- `sync_platform_admin_flag` — sincroniza flag (novo)

### 5.5 Vercel Cron Jobs (definidos em `vercel.json`)

| Rota | Cron (UTC) | Horário BR | Finalidade |
|---|---|---|---|
| `/api/cron/send-reminders` | `0 12 * * *` | 9h | Envia lembretes do dia |
| `/api/cron/check-stock-alerts` | `0 * * * *` | toda hora | Refresh de `alert_level` |
| `/api/cron/sync-notification-status` | `*/30 * * * *` | a cada 30min | Sincroniza delivery status |

Autenticados via `Authorization: Bearer ${CRON_SECRET}`.

---

## 6. Integrações

| Serviço | Uso | Arquivos-chave |
|---|---|---|
| **Supabase** | Auth + DB + Storage + Realtime + Edge Functions | `src/infrastructure/supabase/*` |
| **FlwChat (Aios)** | WhatsApp (lembretes + convites) | `src/infrastructure/services/FlwChatWhatsAppService.ts` |
| **Web Push** | Notificações in-app (VAPID) | `src/app/api/notifications/*` |
| **Sentry** | Error tracking | `@sentry/nextjs` (config em `next.config.ts`) |
| **Resend** | Instalado mas **não usado** (email removido) | legado |

### 6.1 Variáveis de ambiente (Vercel)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# App
NEXT_PUBLIC_APP_URL

# FlwChat (pode ser sobrescrito por pharmacy.settings.flwchat)
FLWCHAT_API_URL, FLWCHAT_API_TOKEN

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

# Sentry
SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT

# Cron
CRON_SECRET
```

---

## 7. O que foi entregue nesta sprint (2026-04-21)

### 7.1 Super-admin (platform admin)
- Tabela `x3_platform_admins` + coluna `is_platform_admin` em `x3_profiles`
- Função `public.is_platform_admin()` + trigger de sync
- 3 policies próprias (nas tabelas novas + `x3_profiles.profile_visibility`) — tenant tables intactas (bypass via service role)
- Helpers `requirePlatformAdmin` e `requirePharmacyAdmin` em `auth-helpers.ts`
- **Bootstrap automatizado:** `scripts/create-owner.mjs` via `pnpm owner:create` — evita fluxo de e-mail instável
- Bootstrap SQL alternativo em `supabase/seed_platform_admin.sql` (caso queira via SQL editor)

### 7.2 Fluxo de convites
- Tabela `pc_invitations` com unique partial index para anti-duplicação
- 7 endpoints: list/create/revoke/resend (admin) + preview/accept (público)
- Página `/settings/team` rebuild (lista membros + convites pendentes + modal)
- Página pública `/invite/[token]` (preview + aceite)
- Integração FlwChat com fallback manual (sempre mostra link para copiar)
- Middleware ajustado para permitir `/invite/*` sem auth

---

## 8. Próximos passos conhecidos

| Prioridade | Item | Razão |
|---|---|---|
| P0 | Dashboard `/platform` para super-admin | Hoje platform admin vê tudo via RLS mas sem UI dedicada |
| P1 | Enforcement de `role` em use cases | `pharmacist` e `attendant` hoje têm permissões quase iguais |
| P1 | MFA para `admin` | Previsto em `@cybersecurity` mas não implementado |
| P2 | Migrar `middleware.ts` → `proxy.ts` | Next.js 16 renomeou o arquivo; funciona como-is |
| P2 | Audit log de ações sensíveis | Tabela `audit_logs` existe mas não há handlers registrando |
| P2 | Cron `cleanup-expired-invitations` | Hoje convites expirados ficam na tabela indefinidamente |
| P3 | E-mail de boas-vindas pós-aceite | Nice-to-have (decisão: não depender de e-mail) |

---

## 9. Armadilhas e restrições aprendidas na aplicação real

Lições da primeira aplicação em produção (2026-04-21). Documentadas aqui para futuros agentes não repetirem o mesmo ciclo de debug.

### 9.1 Fluxo `/register` é instável sem SMTP
Supabase Auth exige confirmação de e-mail por padrão. Sem SMTP configurado, o `signUp()` cria o user mas não gera sessão, e o usuário é redirecionado de `/register` → `/setup` → `/login` (parece "nada acontece").
**Solução adotada:** script `scripts/create-owner.mjs` (`pnpm owner:create`) usa service role com `email_confirm=true` para criar o owner sem depender de SMTP. Para convites de atendentes, o fluxo `/invite/[token]` também cria o user via service role, pulando confirmação.
**Ação para quem for desativar confirmação no Dashboard:** Authentication → Providers → Email → desligar "Confirm email" (só faça se estiver confortável; a solução via service role é preferível).

### 9.2 Schema `auth` é restrito no SQL editor
`CREATE OR REPLACE FUNCTION auth.is_platform_admin()` retorna `ERROR: 42501: permission denied for schema auth`. O SQL editor do Supabase Dashboard roda em um role sem DDL em `auth`. Funções `auth.pharmacy_id()` e `auth.user_role()` referenciadas na CLAUDE.md original **não foram criadas** no banco vivo — tentativas legadas provavelmente também falharam.
**Solução adotada:** todas as funções helper em `public` schema. RLS que precisa dessas funções **não as usa** — inline o EXISTS em vez disso (ver `invitation_admin_manage`).

### 9.3 Colisão de namespace `x3_*`
O prefixo `x3_` é compartilhado com o Aios CRM (mesma instância Supabase). Uma tabela `x3_invitations` pré-existente no Aios tem schema diferente da nossa — `CREATE TABLE IF NOT EXISTS` pulou a criação e os índices subsequentes falharam com `column "revoked_at" does not exist`.
**Solução adotada:** tabelas PharmaControl-específicas novas usam prefixo `pc_` (ex: `pc_invitations`). Somente tabelas que de fato **têm** correspondência com Aios (como `x3_profiles`, `x3_platform_admins`) mantêm `x3_`.
**Regra:** antes de criar nova tabela `x3_<nome>`, verifique se já existe no Aios.

### 9.4 CLI do Supabase precisa de postinstall manual no pnpm
O pacote `supabase` como devDependency tem `postinstall` que baixa o binário. O pnpm com `executedSideEffectsBuildScripts` às vezes não executa, deixando `node_modules/supabase/bin/` vazio.
**Fix:** rodar `node node_modules/supabase/scripts/postinstall.js` manualmente. Depois disso, `supabase link` + `supabase db push` funcionam.
**Alternativa para evitar link interativo:** aplicar migrações via SQL editor usando `supabase/apply_migrations_*.sql` (consolidado idempotente).

### 9.5 File line endings (CRLF) em Windows
Git avisa `LF will be replaced by CRLF` em todos os writes. Não é bug — é normal no Windows. Ignorar.

---

## 10. Convenções

- **Commits:** Conventional Commits (`feat(...)`, `fix(...)`, `chore(...)`, `refactor(...)`, `docs(...)`).
- **Migrations:** timestamp `YYYYMMDDHHMMSS_nome.sql`, bloco de rollback comentado.
- **Nomenclatura DB:** `snake_case`, plural para tabelas.
- **TypeScript:** nunca `any`. Use `unknown` + narrowing.
- **Componentes:** Server Components por padrão. `'use client'` explícito quando interativo.
- **ARIA labels** em todos os elementos interativos.
- **Soft delete** via `deleted_at`; desativação via `is_active = false` quando o registro ainda precisa existir (membros).
