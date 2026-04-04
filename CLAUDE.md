# CLAUDE.md — PharmaControl: Orquestrador Principal do Projeto

> **Versão:** 1.1.0  
> **Projeto:** PharmaControl — Sistema de Controle de Estoque e Recompras para Farmácias de Manipulação  
> **Última atualização:** 2026-03-30  
> **Stack:** Next.js 14 (App Router) + TypeScript + Supabase + Tailwind CSS  
> **Deploy:** Vercel (produção + staging + preview automático por PR)

---

## 📋 VISÃO GERAL DO PROJETO

PharmaControl é uma aplicação web responsiva (mobile-first, com design iOS-inspired) destinada a farmácias de manipulação. Seu objetivo central é duplo:

1. **Controle de Estoque** — Gestão em tempo real dos insumos, fórmulas e produtos prontos, com alertas automáticos de nível crítico.
2. **Gestão de Recompras** — Rastreamento do histórico de compras de cada cliente e disparo automático de lembretes de recompra com base no ciclo de uso do produto.

### Princípio Fundamental
> Todo o código produzido neste projeto deve seguir rigorosamente os padrões definidos neste documento. Nenhuma exceção é permitida sem ADR (Architecture Decision Record) documentado.

---

## 🎨 DESIGN SYSTEM

### Identidade Visual
- **Referência de design:** iOS Human Interface Guidelines (adaptado para web)
- **Background:** `#FFFFFF` (branco puro)
- **Cor primária:** `#0A84FF` (iOS Blue)
- **Cor de ação/alerta:** `#FF3B30` (iOS Red)
- **Cor secundária:** `#F2F2F7` (iOS Gray 6 — superfícies e cards)
- **Cor de texto primário:** `#1C1C1E`
- **Cor de texto secundário:** `#6E6E73`
- **Cor de sucesso:** `#34C759` (iOS Green)
- **Cor de aviso:** `#FF9500` (iOS Orange)
- **Tipografia:** SF Pro Display / system-ui (títulos), SF Pro Text (corpo)
- **Border radius:** `12px` (cards), `8px` (inputs), `9999px` (badges/pills)
- **Sombra padrão:** `0 2px 12px rgba(0,0,0,0.08)`

### Tokens de Design
```css
/* src/styles/globals.css */
:root {
  --color-primary:       #0A84FF;
  --color-danger:        #FF3B30;
  --color-success:       #34C759;
  --color-warning:       #FF9500;
  --color-background:    #FFFFFF;
  --color-surface:       #F2F2F7;
  --color-text-primary:  #1C1C1E;
  --color-text-secondary:#6E6E73;
  --color-border:        #E5E5EA;
  --radius-sm:           8px;
  --radius-md:           12px;
  --radius-lg:           16px;
  --radius-pill:         9999px;
  --shadow-card:         0 2px 12px rgba(0,0,0,0.08);
  --shadow-modal:        0 8px 40px rgba(0,0,0,0.16);
}
```

```typescript
// src/design-system/tokens.ts
export const tokens = {
  colors: {
    primary:        '#0A84FF',
    danger:         '#FF3B30',
    success:        '#34C759',
    warning:        '#FF9500',
    background:     '#FFFFFF',
    surface:        '#F2F2F7',
    textPrimary:    '#1C1C1E',
    textSecondary:  '#6E6E73',
    border:         '#E5E5EA',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius:  { sm: 8, md: 12, lg: 16, pill: 9999 },
} as const;
```

---

## 🧑‍💻 AGENTES DO TIME

Este projeto é desenvolvido por um time de agentes especializados. Cada agente tem responsabilidades exclusivas, ferramentas e regras de atuação. Toda comunicação entre agentes ocorre via Pull Requests e Issues documentadas no GitHub.

---

### 🟦 AGENTE 1 — `@dev-frontend` (Desenvolvedor Frontend)

**Responsabilidade:** Construção de todas as páginas, componentes, layouts, navegação e lógica de UI da aplicação Next.js.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query v5, React Hook Form + Zod, Recharts, Framer Motion.

**Regras:**
- Componentes de página ficam em `app/` como Server Components por padrão.
- Componentes interativos usam `'use client'` explicitamente.
- Nunca use `any`. Use `unknown` com narrowing explícito.
- Skeleton loaders obrigatórios para todos os estados de carregamento.
- Virtualização obrigatória em listas longas (TanStack Virtual).
- Responsivo: mobile (375px), tablet (768px), desktop (1280px).
- ARIA labels em todos os elementos interativos (acessibilidade).
- Imagens via `next/image`, links via `next/link`.

**Variáveis de contexto:**
```
AGENT_ROLE=dev-frontend
FRAMEWORK=nextjs-14-app-router
STYLING=tailwind-css+shadcn-ui
STATE_CLIENT=zustand
STATE_SERVER=tanstack-query-v5
FORMS=react-hook-form+zod
CHARTS=recharts
ANIMATIONS=framer-motion
DEPLOY_PLATFORM=vercel
```

---

### 🟩 AGENTE 2 — `@dev-backend` (Desenvolvedor Backend)

**Responsabilidade:** API Routes do Next.js, Server Actions, Edge Functions do Supabase, lógica de negócio server-side, integração com WhatsApp/e-mail/push e políticas RLS.

**Stack:** Next.js Route Handlers + Server Actions, Supabase Edge Functions (Deno/TypeScript), PostgreSQL, pg_cron, Resend (e-mail), Evolution API (WhatsApp), Web Push API.

**Regras:**
- Toda API Route é stateless e idempotente.
- Chaves de idempotência em todas as operações de escrita críticas.
- Retry com backoff exponencial para chamadas externas.
- Todos os endpoints validam o JWT do Supabase antes de processar.
- Logs estruturados em JSON. Nunca exponha dados sensíveis em logs.
- Cada Route Handler tem uma única responsabilidade (SRP).
- Use `NextResponse` corretamente; nunca retorne dados não tipados.
- Vercel Cron Jobs autenticados via `CRON_SECRET`.

**Variáveis de contexto:**
```
AGENT_ROLE=dev-backend
RUNTIME=nodejs-edge-vercel
API_STYLE=nextjs-route-handlers+server-actions
DATABASE=supabase-postgresql
SCHEDULER=vercel-cron-jobs+pg_cron
EMAIL_PROVIDER=resend
WHATSAPP_PROVIDER=evolution-api
NOTIFICATION_SERVICE=web-push-api
IDEMPOTENCY=required-on-all-writes
```

---

### 🟨 AGENTE 3 — `@dev-database` (Engenheiro de Dados / DBA)

**Responsabilidade:** Modelagem do schema, migrações, índices, performance, Row Level Security (RLS), funções/triggers PostgreSQL e integridade referencial.

**Stack:** PostgreSQL 15+ (via Supabase), pg_cron, Supabase CLI.

**Regras:**
- Todo campo de data usa `TIMESTAMPTZ` (timezone-aware).
- Toda tabela tem `created_at`, `updated_at` e `deleted_at` (soft delete).
- RLS ativada em todas as tabelas sem exceção.
- Índices em todas as colunas usadas em JOINs e filtros frequentes.
- Triggers para atualização automática de `updated_at`.
- Nomenclatura: `snake_case` para tabelas e colunas, plural para tabelas.
- Toda migração é versionada e reversível (up + down).
- Nunca use `DROP` em produção sem aprovação do `@devops`.

**Variáveis de contexto:**
```
AGENT_ROLE=dev-database
DB_ENGINE=postgresql-15
RLS=enabled-all-tables
SOFT_DELETE=required
TIMEZONE=America/Sao_Paulo
NAMING_CONVENTION=snake_case
MIGRATIONS=supabase-cli-versioned
```

---

### 🟥 AGENTE 4 — `@devops` (Engenheiro DevOps / Infra)

**Responsabilidade:** CI/CD pipelines, configuração do Vercel (projetos, domínios, ambientes), variáveis de ambiente, monitoramento, alertas e gerenciamento de secrets.

**Stack:** GitHub Actions, Vercel CLI, Supabase CLI, Sentry, Vercel Analytics + Speed Insights, Vercel Cron Jobs.

**Regras:**
- Três ambientes no Vercel: `preview` (por PR), `staging` (branch `develop`), `production` (branch `main`).
- Secrets NUNCA em código — use Vercel Environment Variables + GitHub Secrets.
- Deploy para produção só via merge na `main` com PR aprovado.
- Preview deployments automáticos para cada Pull Request.
- Health checks + Sentry pós-deploy.
- Rollback via Vercel Dashboard em falha crítica.
- Alertas do Sentry configurados para erros P0/P1.
- Backup diário automático do Supabase.
- `vercel.json` versionado no repositório.

**Variáveis de contexto:**
```
AGENT_ROLE=devops
CI_CD=github-actions
DEPLOY_PLATFORM=vercel
ENVIRONMENTS=preview(PR),staging(develop),production(main)
ERROR_TRACKING=sentry
MONITORING=vercel-analytics+speed-insights
SECRETS_MANAGER=vercel-env-vars+github-secrets
CRON=vercel-cron-jobs
BACKUP_FREQUENCY=daily
ROLLBACK=vercel-dashboard
```

---

### 🟪 AGENTE 5 — `@cybersecurity` (Especialista em Segurança)

**Responsabilidade:** Auditoria de segurança, revisão de RLS, conformidade com LGPD, análise de vulnerabilidades e políticas de autenticação.

**Stack:** Supabase Auth (MFA), Row Level Security, OWASP Top 10 Web, Next.js Security Headers, Vercel Edge Middleware, audit logs.

**Regras:**
- Revisar toda PR que toque em autenticação, autorização ou dados pessoais.
- MFA opcional para todos; obrigatório para `admin`.
- Audit log de todas as operações sensíveis.
- Rate limiting nas API Routes públicas via Vercel Edge Middleware.
- Security headers no `next.config.js`: CSP, HSTS, X-Frame-Options.
- Validação de input em todos os pontos de entrada (server E client).
- Sessões expiram em 24h; refresh tokens em 30 dias.
- HTTPS forçado pelo Vercel em todos os ambientes (TLS 1.3).
- Cron Jobs validados via `CRON_SECRET` no header `Authorization`.

**Variáveis de contexto:**
```
AGENT_ROLE=cybersecurity
AUTH_PROVIDER=supabase-auth
MFA=optional-users,required-admin
COMPLIANCE=LGPD
SESSION_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=30d
AUDIT_LOG=enabled
RATE_LIMITING=vercel-edge-middleware
SECURITY_HEADERS=next-config
DATA_ENCRYPTION=at-rest-and-in-transit
CRON_AUTH=bearer-secret
```

---

### 🟫 AGENTE 6 — `@qa` (Engenheiro de Qualidade)

**Responsabilidade:** Estratégia de testes, automação, regressão, integração e critérios de aceite.

**Stack:** Vitest (unit), React Testing Library (component), Playwright (E2E contra preview URL da Vercel), MSW (mock de API), k6 (performance).

**Regras:**
- Cobertura mínima: 80% nos use cases e serviços de domínio.
- Todo bug corrigido tem teste de regressão.
- Testes E2E para fluxos críticos: login, cadastro de cliente, registro de pedido, disparo de lembrete.
- Playwright roda contra a preview URL gerada pela Vercel no CI.
- Nenhuma PR é mergeada sem testes passando no CI.

**Variáveis de contexto:**
```
AGENT_ROLE=qa
UNIT_TESTING=vitest
COMPONENT_TESTING=react-testing-library
E2E_TESTING=playwright
E2E_TARGET=vercel-preview-url
API_MOCKING=msw
PERFORMANCE_TESTING=k6
MIN_COVERAGE=80
REGRESSION_REQUIRED=on-every-bugfix
```

---

### ⬜ AGENTE 7 — `@tech-lead` (Arquiteto / Tech Lead)

**Responsabilidade:** Decisões arquiteturais, revisão de código crítico, resolução de conflitos técnicos, manutenção deste `CLAUDE.md` e garantia de aderência aos princípios SOLID e Clean Architecture.

**Regras:**
- Todo ADR deve ser aprovado pelo `@tech-lead`.
- Revisão obrigatória em PRs que alterem estrutura de pastas, interfaces de domínio ou contratos de API.
- Comunicação entre agentes: GitHub Issues + Pull Requests.
- Revisão de débito técnico a cada sprint.

**Variáveis de contexto:**
```
AGENT_ROLE=tech-lead
ADR_REQUIRED=on-architectural-changes
PR_REVIEW=mandatory-on-domain-changes
DEBT_TRACKING=github-issues
```

---

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Tecnológica Completa
```
Frontend:             Next.js 14 (App Router) + TypeScript
Estilização:          Tailwind CSS + shadcn/ui
State (client):       Zustand
State (server):       TanStack Query v5
Forms:                React Hook Form + Zod
Animações:            Framer Motion
Gráficos:             Recharts
API / Server Actions: Next.js Route Handlers + Server Actions
BaaS:                 Supabase (Auth + Database + Storage + Realtime + Edge Functions)
Database:             PostgreSQL 15 (via Supabase)
E-mail:               Resend
WhatsApp:             Evolution API
Push (web):           Web Push API (VAPID)
CI/CD:                GitHub Actions
Deploy:               Vercel
Cron Jobs:            Vercel Cron Jobs
Error Tracking:       Sentry
Analytics:            Vercel Analytics + Speed Insights
```

### Configuração Vercel (`vercel.json`)
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "regions": ["gru1"],
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/check-stock-alerts",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/sync-notification-status",
      "schedule": "*/30 * * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options",           "value": "DENY" },
        { "key": "X-Content-Type-Options",     "value": "nosniff" },
        { "key": "Referrer-Policy",            "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",         "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### Variáveis de Ambiente (Vercel Environment Variables)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=https://pharmacontrol.vercel.app

# Resend (e-mail)
RESEND_API_KEY=re_...

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE_NAME=pharmacontrol

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:suporte@pharmacontrol.com

# Sentry
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=pharmacontrol

# Vercel Cron Security
CRON_SECRET=random_long_string_here
```

### Estrutura de Pastas
```
pharmacontrol/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Lint + typecheck + testes
│       ├── e2e.yml                       # Playwright contra preview URL da Vercel
│       └── sentry-release.yml            # Release no Sentry pós-deploy
├── src/
│   ├── domain/                           # ← Camada mais interna (zero dependências externas)
│   │   ├── entities/
│   │   │   ├── Customer.ts
│   │   │   ├── Product.ts
│   │   │   ├── StockItem.ts
│   │   │   ├── Order.ts
│   │   │   └── Reminder.ts
│   │   ├── repositories/                 # Interfaces (abstrações — nunca implementações)
│   │   │   ├── ICustomerRepository.ts
│   │   │   ├── IProductRepository.ts
│   │   │   ├── IStockRepository.ts
│   │   │   ├── IOrderRepository.ts
│   │   │   └── IReminderRepository.ts
│   │   ├── events/                       # Domain events (imutáveis, nomeados no passado)
│   │   │   ├── OrderCreated.ts
│   │   │   ├── OrderDelivered.ts
│   │   │   ├── StockAlertTriggered.ts
│   │   │   └── ReminderScheduled.ts
│   │   └── value-objects/
│   │       ├── CPF.ts
│   │       ├── Phone.ts
│   │       └── Money.ts
│   ├── application/                      # Use cases + DTOs
│   │   ├── use-cases/
│   │   │   ├── customers/
│   │   │   │   ├── CreateCustomerUseCase.ts
│   │   │   │   ├── GetCustomerHistoryUseCase.ts
│   │   │   │   └── UpdateCustomerUseCase.ts
│   │   │   ├── stock/
│   │   │   │   ├── RegisterStockMovementUseCase.ts
│   │   │   │   ├── CheckStockAlertsUseCase.ts
│   │   │   │   └── GetStockDashboardUseCase.ts
│   │   │   ├── orders/
│   │   │   │   ├── CreateOrderUseCase.ts
│   │   │   │   ├── UpdateOrderStatusUseCase.ts
│   │   │   │   └── GetOrdersByCustomerUseCase.ts
│   │   │   └── reminders/
│   │   │       ├── ScheduleReminderUseCase.ts
│   │   │       └── SendPendingRemindersUseCase.ts
│   │   └── dtos/
│   │       ├── CustomerDTO.ts
│   │       ├── ProductDTO.ts
│   │       ├── StockDTO.ts
│   │       ├── OrderDTO.ts
│   │       └── ReminderDTO.ts
│   ├── infrastructure/                   # Implementações concretas
│   │   ├── repositories/
│   │   │   ├── SupabaseCustomerRepository.ts
│   │   │   ├── SupabaseProductRepository.ts
│   │   │   ├── SupabaseStockRepository.ts
│   │   │   ├── SupabaseOrderRepository.ts
│   │   │   └── SupabaseReminderRepository.ts
│   │   ├── services/
│   │   │   ├── ResendEmailService.ts
│   │   │   ├── EvolutionWhatsAppService.ts
│   │   │   ├── WebPushService.ts
│   │   │   └── EventBusService.ts
│   │   └── supabase/
│   │       ├── client.ts                 # Browser client (anon key)
│   │       ├── server.ts                 # Server client (cookies + service role)
│   │       └── middleware.ts             # Session refresh middleware
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── common/
│   │   │   │   ├── PageHeader.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   ├── AlertCard.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── RepurchaseChart.tsx
│   │   │   │   ├── AlertsFeed.tsx
│   │   │   │   └── ActivityFeed.tsx
│   │   │   ├── customers/
│   │   │   │   ├── CustomerCard.tsx
│   │   │   │   ├── CustomerForm.tsx
│   │   │   │   └── OrderTimeline.tsx
│   │   │   ├── stock/
│   │   │   │   ├── StockGauge.tsx
│   │   │   │   ├── StockMovementForm.tsx
│   │   │   │   └── StockAlertBanner.tsx
│   │   │   └── orders/
│   │   │       ├── OrderForm.tsx
│   │   │       ├── OrderStatusStepper.tsx
│   │   │       └── OrderItemsList.tsx
│   │   └── hooks/
│   │       ├── useCustomers.ts
│   │       ├── useStock.ts
│   │       ├── useOrders.ts
│   │       └── useReminders.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── notificationStore.ts
│   └── design-system/
│       ├── tokens.ts
│       └── typography.ts
├── app/                                  # Next.js App Router
│   ├── layout.tsx
│   ├── middleware.ts                     # Auth + rate limiting (Edge)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Sidebar + header
│   │   ├── page.tsx                      # Dashboard principal
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── orders/page.tsx
│   │   ├── stock/
│   │   │   ├── page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── movements/page.tsx
│   │   │   └── alerts/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reminders/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── team/page.tsx
│   │       ├── templates/page.tsx
│   │       └── integrations/page.tsx
│   └── api/
│       ├── customers/route.ts
│       ├── orders/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── status/route.ts
│       ├── stock/
│       │   ├── route.ts
│       │   └── movements/route.ts
│       ├── reminders/route.ts
│       ├── notifications/
│       │   ├── subscribe/route.ts        # Web Push subscription
│       │   └── send/route.ts
│       └── cron/                         # Vercel Cron Jobs (autenticados)
│           ├── send-reminders/route.ts
│           ├── check-stock-alerts/route.ts
│           └── sync-notification-status/route.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20260330000001_init_schema.sql
│   │   ├── 20260330000002_rls_policies.sql
│   │   ├── 20260330000003_functions_triggers.sql
│   │   └── 20260330000004_seed_data.sql
│   ├── functions/
│   │   └── _shared/
│   │       ├── cors.ts
│   │       └── auth.ts
│   └── config.toml
├── docs/
│   ├── adr/
│   │   ├── 001-nextjs-over-react-native.md
│   │   ├── 002-supabase-as-backend.md
│   │   └── 003-vercel-deployment.md
│   └── diagrams/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│       └── playwright/
├── public/
├── vercel.json
├── next.config.js
├── tailwind.config.ts
├── CLAUDE.md
├── CHANGELOG.md
└── README.md
```

---

## 📱 FUNCIONALIDADES DO APLICATIVO

### Módulo 1 — Dashboard Principal
- **KPIs em tempo real** via Supabase Realtime: clientes ativos, pedidos do mês, itens críticos de estoque, lembretes pendentes.
- **Gráfico de recompras:** linha temporal dos últimos 6 meses (Recharts).
- **Alertas prioritários:** top 5 alertas críticos (estoque + recompras vencidas).
- **Atividade recente:** feed das últimas 10 operações realizadas.

### Módulo 2 — Gestão de Clientes
- Cadastro completo: nome, CPF, telefone, WhatsApp, e-mail, endereço, nascimento, notas clínicas.
- Histórico completo de compras com timeline visual.
- Busca full-text (com unaccent) por nome, CPF ou telefone.
- Status: Ativo / Inativo / Pendente de recompra.
- Exportação de histórico em PDF.

### Módulo 3 — Controle de Estoque
- Cadastro de produtos/insumos (nome, princípio ativo, fornecedor, unidade, mínimo/máximo).
- Registro de movimentações: entrada, saída, ajuste, perda, vencimento.
- Alerta visual + Web Push quando estoque atingir nível mínimo.
- Alerta crítico (vermelho) quando estoque zerar.
- Controle de validade por lote com alerta de vencimento.
- Dashboard com gauge charts por produto.

### Módulo 4 — Registro de Pedidos
- Vinculação de pedido ao cliente.
- Seleção de produtos/fórmulas do catálogo.
- Campos: data do pedido, entrega estimada, valor, médico prescritor, número da receita.
- Status: Recebido → Em Manipulação → Pronto → Entregue → Cancelado.
- Baixa automática no estoque ao confirmar manipulação.
- Cálculo automático da próxima data de recompra.

### Módulo 5 — Lembretes de Recompra
- Geração automática ao registrar pedido entregue.
- Data calculada pelo ciclo de uso configurado por produto.
- Fila por data: hoje, amanhã, próxima semana, atrasados.
- Envio via: Web Push, WhatsApp, E-mail.
- Status: Agendado / Enviado / Visualizado / Convertido / Ignorado / Cancelado.
- **Vercel Cron Job** dispara diariamente às 9h (horário de Brasília = 12h UTC).

### Módulo 6 — Configurações
- Perfil da farmácia (nome, logo, CNPJ, contatos).
- Gestão de usuários da equipe (admin, farmacêutico, atendente).
- Templates de mensagem com variáveis dinâmicas (WhatsApp/E-mail).
- Configuração de thresholds de alerta de estoque.
- Integração com canais de comunicação.
- Logs de atividade e auditoria.

---

## 🗄️ BANCO DE DADOS — SCHEMA COMPLETO

### Configuração Recomendada: MCP do Supabase no Cursor

Para máxima produtividade, **recomendamos fortemente o uso do MCP do Supabase** no Cursor. O Claude Code executa migrações, cria funções e configura RLS diretamente na instância Supabase sem sair do editor.

**Configurar MCP no Cursor (`~/.cursor/mcp.json`):**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN"
      ]
    }
  }
}
```
> Obtenha o token em: `https://supabase.com/dashboard/account/tokens`

---

### SQL — Migração 001: Schema Principal

```sql
-- ============================================================
-- MIGRATION: 001_init_schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ENUM TYPES
CREATE TYPE user_role             AS ENUM ('admin', 'pharmacist', 'attendant');
CREATE TYPE stock_movement_type   AS ENUM ('entry', 'exit', 'adjustment', 'loss', 'expiration');
CREATE TYPE order_status          AS ENUM ('received', 'in_preparation', 'ready', 'delivered', 'cancelled');
CREATE TYPE reminder_status       AS ENUM ('scheduled', 'sent', 'viewed', 'converted', 'ignored', 'cancelled');
CREATE TYPE reminder_channel      AS ENUM ('push', 'whatsapp', 'email', 'sms');
CREATE TYPE customer_status       AS ENUM ('active', 'inactive', 'pending_repurchase');
CREATE TYPE product_category      AS ENUM ('raw_material', 'compound_formula', 'finished_product', 'packaging', 'other');
CREATE TYPE alert_level           AS ENUM ('ok', 'warning', 'critical');

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- pharmacies (Tenants)
-- ============================================================
CREATE TABLE pharmacies (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL,
  cnpj              VARCHAR(18) UNIQUE,
  crf_number        VARCHAR(50),
  phone             VARCHAR(20),
  email             VARCHAR(255),
  address           JSONB,
  logo_url          TEXT,
  settings          JSONB DEFAULT '{}',
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE TRIGGER set_pharmacies_updated_at BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_pharmacies_cnpj ON pharmacies(cnpj) WHERE deleted_at IS NULL;

-- ============================================================
-- profiles (Usuários — extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id   UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  full_name     VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'attendant',
  phone         VARCHAR(20),
  avatar_url    TEXT,
  push_endpoint TEXT,       -- Web Push subscription endpoint
  push_keys     JSONB,      -- { p256dh, auth }
  is_active     BOOLEAN DEFAULT TRUE,
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_profiles_pharmacy_id ON profiles(pharmacy_id) WHERE deleted_at IS NULL;

-- ============================================================
-- customers (Clientes/Pacientes)
-- ============================================================
CREATE TABLE customers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id         UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  full_name           VARCHAR(255) NOT NULL,
  cpf                 VARCHAR(14),
  birth_date          DATE,
  phone               VARCHAR(20),
  whatsapp            VARCHAR(20),
  email               VARCHAR(255),
  address             JSONB,
  gender              VARCHAR(20),
  prescribing_doctor  VARCHAR(255),
  clinical_notes      TEXT,
  status              customer_status DEFAULT 'active',
  tags                TEXT[] DEFAULT '{}',
  total_orders        INTEGER DEFAULT 0,
  last_order_at       TIMESTAMPTZ,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  UNIQUE(pharmacy_id, cpf)
);
CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_customers_pharmacy_id ON customers(pharmacy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_cpf        ON customers(cpf) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_status     ON customers(pharmacy_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_fts        ON customers
  USING gin(to_tsvector('portuguese', unaccent(full_name)));

-- ============================================================
-- suppliers (Fornecedores)
-- ============================================================
CREATE TABLE suppliers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id   UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  cnpj          VARCHAR(18),
  contact_name  VARCHAR(255),
  phone         VARCHAR(20),
  email         VARCHAR(255),
  address       JSONB,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE TRIGGER set_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_suppliers_pharmacy_id ON suppliers(pharmacy_id) WHERE deleted_at IS NULL;

-- ============================================================
-- products (Produtos, Insumos e Fórmulas)
-- ============================================================
CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id           UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  supplier_id           UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  name                  VARCHAR(255) NOT NULL,
  active_ingredient     VARCHAR(255),
  code                  VARCHAR(100),
  barcode               VARCHAR(100),
  category              product_category NOT NULL DEFAULT 'other',
  unit_of_measure       VARCHAR(50) NOT NULL,
  description           TEXT,
  minimum_stock         NUMERIC(12,3) DEFAULT 0,
  maximum_stock         NUMERIC(12,3),
  reorder_point         NUMERIC(12,3),
  repurchase_cycle_days INTEGER,
  unit_cost             NUMERIC(12,2),
  unit_price            NUMERIC(12,2),
  is_controlled         BOOLEAN DEFAULT FALSE,
  requires_prescription BOOLEAN DEFAULT FALSE,
  anvisa_code           VARCHAR(100),
  is_active             BOOLEAN DEFAULT TRUE,
  image_url             TEXT,
  created_by            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_products_pharmacy_id ON products(pharmacy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category    ON products(pharmacy_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_fts         ON products
  USING gin(to_tsvector('portuguese', unaccent(name)));

-- ============================================================
-- stock_items (Estoque por Produto/Lote)
-- ============================================================
CREATE TABLE stock_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id     UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lot_number      VARCHAR(100),
  quantity        NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit_cost       NUMERIC(12,2),
  expiration_date DATE,
  location        VARCHAR(100),
  alert_level     alert_level DEFAULT 'ok',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE TRIGGER set_stock_items_updated_at BEFORE UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_stock_items_product_id  ON stock_items(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_items_pharmacy_id ON stock_items(pharmacy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_items_expiration  ON stock_items(expiration_date)
  WHERE deleted_at IS NULL AND expiration_date IS NOT NULL;
CREATE INDEX idx_stock_items_alert       ON stock_items(pharmacy_id, alert_level)
  WHERE deleted_at IS NULL;

-- VIEW: Posição consolidada por produto
CREATE VIEW stock_summary AS
SELECT
  si.pharmacy_id,
  si.product_id,
  p.name               AS product_name,
  p.unit_of_measure,
  p.minimum_stock,
  p.maximum_stock,
  p.category,
  SUM(si.quantity)     AS total_quantity,
  COUNT(si.id)         AS lot_count,
  MIN(si.expiration_date) AS nearest_expiration,
  CASE
    WHEN SUM(si.quantity) <= 0                THEN 'critical'
    WHEN SUM(si.quantity) <= p.minimum_stock  THEN 'warning'
    ELSE 'ok'
  END                  AS computed_alert_level
FROM stock_items si
JOIN products p ON p.id = si.product_id
WHERE si.deleted_at IS NULL AND p.deleted_at IS NULL
GROUP BY si.pharmacy_id, si.product_id, p.name,
         p.unit_of_measure, p.minimum_stock, p.maximum_stock, p.category;

-- ============================================================
-- stock_movements (Auditoria de movimentações — imutável)
-- ============================================================
CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id     UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  stock_item_id   UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id),
  order_id        UUID,
  movement_type   stock_movement_type NOT NULL,
  quantity        NUMERIC(12,3) NOT NULL,
  quantity_before NUMERIC(12,3) NOT NULL,
  quantity_after  NUMERIC(12,3) NOT NULL,
  unit_cost       NUMERIC(12,2),
  reason          TEXT,
  reference_doc   VARCHAR(255),
  performed_by    UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stock_movements_product_id  ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_pharmacy_id ON stock_movements(pharmacy_id);
CREATE INDEX idx_stock_movements_created_at  ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_order_id    ON stock_movements(order_id)
  WHERE order_id IS NOT NULL;

-- ============================================================
-- orders (Pedidos)
-- ============================================================
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id           UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_number          VARCHAR(50) UNIQUE,
  status                order_status NOT NULL DEFAULT 'received',
  order_date            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_ready_date  TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  prescribing_doctor    VARCHAR(255),
  prescription_number   VARCHAR(100),
  subtotal              NUMERIC(12,2) DEFAULT 0,
  discount              NUMERIC(12,2) DEFAULT 0,
  total_amount          NUMERIC(12,2) DEFAULT 0,
  payment_method        VARCHAR(50),
  notes                 TEXT,
  internal_notes        TEXT,
  created_by            UUID NOT NULL REFERENCES profiles(id),
  updated_by            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_orders_pharmacy_id ON orders(pharmacy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_customer_id ON orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status      ON orders(pharmacy_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_order_date  ON orders(order_date DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- order_items (Itens do Pedido)
-- ============================================================
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    NUMERIC(12,3) NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  dosage      VARCHAR(255),
  posology    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================
-- repurchase_reminders (Lembretes de Recompra)
-- ============================================================
CREATE TABLE repurchase_reminders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id         UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
  scheduled_date      DATE NOT NULL,
  status              reminder_status NOT NULL DEFAULT 'scheduled',
  channel             reminder_channel NOT NULL DEFAULT 'whatsapp',
  message_template_id UUID,
  custom_message      TEXT,
  sent_at             TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  converted_at        TIMESTAMPTZ,
  conversion_order_id UUID REFERENCES orders(id),
  retry_count         INTEGER DEFAULT 0,
  last_error          TEXT,
  notes               TEXT,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
CREATE TRIGGER set_reminders_updated_at BEFORE UPDATE ON repurchase_reminders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_reminders_pharmacy_id    ON repurchase_reminders(pharmacy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_customer_id    ON repurchase_reminders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_scheduled_date ON repurchase_reminders(scheduled_date)
  WHERE deleted_at IS NULL AND status = 'scheduled';
CREATE INDEX idx_reminders_status         ON repurchase_reminders(pharmacy_id, status)
  WHERE deleted_at IS NULL;

-- ============================================================
-- notification_logs
-- ============================================================
CREATE TABLE notification_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id   UUID NOT NULL REFERENCES pharmacies(id),
  reminder_id   UUID REFERENCES repurchase_reminders(id),
  customer_id   UUID REFERENCES customers(id),
  profile_id    UUID REFERENCES profiles(id),
  channel       reminder_channel NOT NULL,
  recipient     VARCHAR(255) NOT NULL,
  subject       VARCHAR(500),
  message       TEXT NOT NULL,
  status        VARCHAR(50) NOT NULL,   -- queued, sent, delivered, failed
  provider_id   VARCHAR(255),
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notification_logs_pharmacy_id ON notification_logs(pharmacy_id);
CREATE INDEX idx_notification_logs_reminder_id ON notification_logs(reminder_id);
CREATE INDEX idx_notification_logs_created_at  ON notification_logs(created_at DESC);

-- ============================================================
-- message_templates
-- ============================================================
CREATE TABLE message_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  channel     reminder_channel NOT NULL,
  subject     VARCHAR(500),
  body        TEXT NOT NULL,
  variables   TEXT[] DEFAULT '{}',
  is_default  BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
CREATE TRIGGER set_message_templates_updated_at BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- stock_alerts_config
-- ============================================================
CREATE TABLE stock_alerts_config (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id     UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE, -- NULL = regra global
  alert_level     alert_level NOT NULL DEFAULT 'warning',
  threshold_value NUMERIC(12,3),
  notify_roles    user_role[] DEFAULT '{admin,pharmacist}',
  notify_channels reminder_channel[] DEFAULT '{push}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- audit_logs (LGPD — imutável)
-- ============================================================
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id   UUID REFERENCES pharmacies(id),
  profile_id    UUID REFERENCES profiles(id),
  action        VARCHAR(100) NOT NULL,   -- create, read, update, delete
  resource_type VARCHAR(100) NOT NULL,
  resource_id   UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_pharmacy_id ON audit_logs(pharmacy_id);
CREATE INDEX idx_audit_logs_profile_id  ON audit_logs(profile_id);
CREATE INDEX idx_audit_logs_resource    ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs(created_at DESC);
```

---

### SQL — Migração 002: Row Level Security

```sql
-- ============================================================
-- MIGRATION: 002_rls_policies.sql
-- ============================================================

ALTER TABLE pharmacies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE repurchase_reminders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;

-- Helpers: pharmacy_id e role do usuário autenticado
CREATE OR REPLACE FUNCTION auth.pharmacy_id()
RETURNS UUID AS $$
  SELECT pharmacy_id FROM profiles
  WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles
  WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Isolamento por farmácia (multi-tenancy)
CREATE POLICY "pharmacy_isolation" ON customers
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());
CREATE POLICY "pharmacy_isolation" ON products
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());
CREATE POLICY "pharmacy_isolation" ON stock_items
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());
CREATE POLICY "pharmacy_isolation" ON stock_movements
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());
CREATE POLICY "pharmacy_isolation" ON orders
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());
CREATE POLICY "pharmacy_isolation" ON repurchase_reminders
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());
CREATE POLICY "pharmacy_isolation" ON suppliers
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());
CREATE POLICY "pharmacy_isolation" ON message_templates
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());
CREATE POLICY "pharmacy_isolation" ON notification_logs
  FOR ALL USING (pharmacy_id = auth.pharmacy_id());

-- Admin: gerenciar configurações e usuários
CREATE POLICY "admin_only_pharmacy_settings" ON pharmacies
  FOR UPDATE USING (id = auth.pharmacy_id() AND auth.user_role() = 'admin');
CREATE POLICY "admin_manage_profiles" ON profiles
  FOR INSERT WITH CHECK (pharmacy_id = auth.pharmacy_id() AND auth.user_role() = 'admin');

-- Perfis: próprio + todos da farmácia (leitura)
CREATE POLICY "profile_visibility" ON profiles
  FOR SELECT USING (id = auth.uid() OR pharmacy_id = auth.pharmacy_id());
CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());
```

---

### SQL — Migração 003: Funções, Triggers e Jobs

```sql
-- ============================================================
-- MIGRATION: 003_functions_triggers.sql
-- ============================================================

-- Atualizar stats do cliente ao entregar pedido
CREATE OR REPLACE FUNCTION update_customer_order_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE customers
    SET total_orders = total_orders + 1, last_order_at = NOW(), status = 'active'
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_customer_stats
  AFTER UPDATE ON orders FOR EACH ROW
  EXECUTE FUNCTION update_customer_order_stats();

-- Criar lembrete automático ao entregar pedido
CREATE OR REPLACE FUNCTION auto_schedule_reminder()
RETURNS TRIGGER AS $$
DECLARE v_item RECORD; v_date DATE;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    FOR v_item IN
      SELECT oi.product_id, p.repurchase_cycle_days
      FROM order_items oi JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id AND p.repurchase_cycle_days IS NOT NULL
    LOOP
      v_date := (NOW() + (v_item.repurchase_cycle_days || ' days')::INTERVAL)::DATE;
      INSERT INTO repurchase_reminders
        (pharmacy_id, customer_id, order_id, product_id, scheduled_date, status, channel)
      VALUES (NEW.pharmacy_id, NEW.customer_id, NEW.id, v_item.product_id, v_date, 'scheduled', 'whatsapp')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_schedule_reminder
  AFTER UPDATE ON orders FOR EACH ROW
  EXECUTE FUNCTION auto_schedule_reminder();

-- Atualizar alert_level dos lotes
CREATE OR REPLACE FUNCTION refresh_stock_alert_levels()
RETURNS VOID AS $$
BEGIN
  UPDATE stock_items si
  SET alert_level = CASE
    WHEN si.quantity <= 0               THEN 'critical'::alert_level
    WHEN si.quantity <= p.minimum_stock THEN 'warning'::alert_level
    ELSE 'ok'::alert_level
  END
  FROM products p
  WHERE si.product_id = p.id AND si.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron: checar estoque a cada hora (backup do Vercel Cron)
SELECT cron.schedule('check-stock-alerts', '0 * * * *',
  'SELECT refresh_stock_alert_levels()');

-- Numeração sequencial de pedidos
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'PC-' || TO_CHAR(NOW(), 'YYYY') || '-'
      || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_set_order_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();
```

---

### SQL — Migração 004: Seed de Templates

```sql
-- ============================================================
-- MIGRATION: 004_seed_data.sql
-- ============================================================

INSERT INTO message_templates (pharmacy_id, name, channel, body, is_default, variables)
SELECT id,
  'Lembrete de Recompra — WhatsApp', 'whatsapp',
  'Olá, {{customer_name}}! 👋

Está chegando a hora de renovar seu {{product_name}}.

Seu ciclo de uso indica que o produto deve estar se esgotando em breve. Garantir a continuidade do seu tratamento é muito importante!

Entre em contato: 📞 {{pharmacy_phone}}
🏥 {{pharmacy_name}}

Responda PARAR para cancelar os lembretes.',
  TRUE, ARRAY['customer_name','product_name','pharmacy_name','pharmacy_phone']
FROM pharmacies;

INSERT INTO message_templates (pharmacy_id, name, channel, subject, body, is_default, variables)
SELECT id,
  'Lembrete de Recompra — E-mail', 'email',
  'Hora de renovar seu {{product_name}} — {{pharmacy_name}}',
  '<p>Olá, <strong>{{customer_name}}</strong>!</p>
<p>Seu produto <strong>{{product_name}}</strong> deve estar chegando ao fim.</p>
<p>Entre em contato para garantir a continuidade do seu tratamento.</p>
<br/><p><strong>{{pharmacy_name}}</strong><br/>
📞 {{pharmacy_phone}} | ✉️ {{pharmacy_email}}</p>',
  TRUE, ARRAY['customer_name','product_name','pharmacy_name','pharmacy_phone','pharmacy_email']
FROM pharmacies;
```

---

## ⚙️ VERCEL CRON JOBS

Os jobs são chamadas HTTP autenticadas para API Routes do Next.js, agendadas pelo Vercel.

```typescript
// app/api/cron/send-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const useCase = new SendPendingRemindersUseCase(/* deps */);
  const result = await useCase.execute({ date: new Date() });
  return NextResponse.json({ success: true, processed: result.count });
}
```

| Job | Schedule (UTC) | Horário BR | Descrição |
|-----|---------------|------------|-----------|
| `/api/cron/send-reminders` | `0 12 * * *` | 9h | Envia lembretes do dia |
| `/api/cron/check-stock-alerts` | `0 * * * *` | Toda hora | Verifica alertas de estoque |
| `/api/cron/sync-notification-status` | `*/30 * * * *` | A cada 30min | Sincroniza status de entrega |

---

## 🔄 FLUXO DE EVENTOS (EDA)

```
[POST /api/orders] ──► CreateOrderUseCase ──► OrderCreated
                                                    │
                                       ┌────────────┴────────────┐
                                       ▼                         ▼
                             StockMovementHandler         AuditLogHandler

[PATCH /api/orders/[id]/status → delivered]
        │
        ▼
UpdateOrderStatusUseCase ──► OrderDelivered
        │
        ├──► CustomerStatsHandler   (total_orders, last_order_at)
        ├──► ReminderScheduledHandler (cria repurchase_reminder)
        └──► StockAlertHandler       (verifica nível de estoque)

[Vercel Cron — 9h BR]
        │
        ▼
GET /api/cron/send-reminders ──► SendPendingRemindersUseCase
        │
        ├──► EvolutionWhatsAppService
        ├──► ResendEmailService
        └──► WebPushService
                │
                ▼
        notification_logs (audit de entrega)
```

---

## 📋 PADRÕES ARQUITETURAIS OBRIGATÓRIOS

### Clean Architecture — Regra de Dependência
```
[Vercel / Next.js] ──► [Route Handlers / Server Actions] ──► [Use Cases] ──► [Entities]
[Supabase Client]  ──► [Repository Implementations]      ──► [Interfaces]
```

### Interface → Implementação (SOLID)
```typescript
// ✅ Domínio: interface pura
export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByPharmacy(pharmacyId: string, filters: CustomerFilters): Promise<Customer[]>;
  save(customer: Customer): Promise<Customer>;
  softDelete(id: string): Promise<void>;
}

// ✅ Infra: implementação concreta injetada
export class SupabaseCustomerRepository implements ICustomerRepository {
  constructor(private readonly supabase: SupabaseClient) {}
  // ...
}
```

### Server Actions Tipadas
```typescript
'use server';
const schema = z.object({ customerId: z.string().uuid(), /* ... */ });

export async function createOrderAction(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };
  const supabase = createServerClient();
  const useCase = new CreateOrderUseCase(new SupabaseOrderRepository(supabase));
  return useCase.execute(parsed.data);
}
```

### Conventional Commits
```
feat(reminders): add automatic scheduling on order delivery
fix(stock): correct alert level for zero quantity
refactor(customers): extract search to use case
chore(deps): update next to 14.3.0
docs(adr): add vercel deployment decision record
test(orders): add integration tests for create order flow
ci(vercel): add e2e tests against preview url
```

---

## 🔒 CONFORMIDADE LGPD

- CPF, telefone, e-mail e dados clínicos são **PII sensível** — acesso registrado em `audit_logs`.
- Direito ao esquecimento: soft delete com opção de exclusão física formal.
- Consentimento para mensagens registrado e auditável.
- Dados clínicos criptografados na camada de aplicação.
- HTTPS forçado pelo Vercel em todos os ambientes.
- Retenção: `notification_logs` e `audit_logs` por 5 anos; movimentações de estoque por 10 anos.

---

## 🧪 CRITÉRIOS DE ACEITE

| Funcionalidade | Critério | Prioridade |
|---|---|---|
| Login | Supabase Auth + sessão persistente via cookies | P0 |
| Cadastro de cliente | Validação CPF + unicidade por farmácia | P0 |
| Registro de pedido | Baixa automática no estoque | P0 |
| Lembrete automático | Criado ao entregar pedido; disparado no dia correto | P0 |
| Vercel Cron | Jobs executados nos horários configurados | P0 |
| Alerta de estoque | Web push em < 5min após atingir nível mínimo | P1 |
| Dashboard | KPIs via Supabase Realtime, atualização < 2s | P1 |
| Histórico do cliente | Timeline paginada, resposta < 200ms | P1 |
| Busca de clientes | Full-text com unaccent, < 100ms | P1 |
| Preview Deploy | PR abre preview URL funcional na Vercel | P1 |
| Exportação PDF | Histórico de compras formatado | P2 |

---

## 🚀 PRIMEIROS PASSOS

```bash
# 1. Criar projeto Next.js
pnpm create next-app@latest pharmacontrol \
  --typescript --tailwind --app --src-dir --import-alias "@/*"

# 2. Instalar dependências
pnpm add @supabase/supabase-js @supabase/ssr \
  @tanstack/react-query zustand \
  react-hook-form zod @hookform/resolvers \
  recharts framer-motion web-push resend \
  @sentry/nextjs

# 3. Instalar shadcn/ui
pnpm dlx shadcn@latest init

# 4. Instalar Supabase CLI e conectar ao projeto
pnpm add -D supabase
pnpm supabase login
pnpm supabase link --project-ref YOUR_PROJECT_REF

# 5. Rodar migrações no Supabase
pnpm supabase db push

# 6. Configurar projeto na Vercel e puxar variáveis de ambiente
pnpm i -g vercel
vercel link
vercel env pull .env.local

# 7. Iniciar desenvolvimento
pnpm dev
```

---

## 📌 REFERÊNCIAS

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [LGPD — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [RDC 67/2007 — ANVISA](https://www.gov.br/anvisa)

---

*Este documento é vivo. Toda decisão arquitetural que não esteja aqui deve ser adicionada como ADR em `docs/adr/` e referenciada neste arquivo.*