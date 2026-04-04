# PharmaControl - Guia de Implantacao para Novo Cliente

> Documento de instrucoes para replicar o projeto PharmaControl em uma nova farmacia.
> Tempo estimado: 30-45 minutos por cliente.

---

## Visao Geral do Processo

```
1. Clonar repositorio
2. Criar projeto no Supabase
3. Executar migraces SQL (4 arquivos)
4. Configurar variaveis de ambiente
5. Deploy na Vercel (ou rodar local)
6. Primeiro acesso + setup da farmacia
```

---

## Passo 1: Clonar o Repositorio

```bash
# Opção A: Clonar direto
git clone <URL_DO_REPOSITORIO> pharmacontrol-<nome-cliente>
cd pharmacontrol-<nome-cliente>

# Opção B: Copiar pasta existente
cp -r pharmacontrol pharmacontrol-<nome-cliente>
cd pharmacontrol-<nome-cliente>

# Instalar dependencias
pnpm install
```

---

## Passo 2: Criar Projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique **"New Project"**
3. Preencha:
   - **Name:** `pharmacontrol-<nome-cliente>` (ex: `pharmacontrol-vidanatural`)
   - **Database Password:** Gere uma senha forte e guarde
   - **Region:** South America (São Paulo) — `sa-east-1`
4. Aguarde o projeto ser criado (~2 minutos)
5. Anote as informacoes (Settings > API):

```
Project URL:    https://XXXXXXXX.supabase.co
anon (public):  eyJhbGciOi... (chave longa)
service_role:   eyJhbGciOi... (chave longa, diferente da anon)
```

---

## Passo 3: Executar Migracoes SQL

Acesse o **SQL Editor** do Supabase:
`https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new`

Execute os 4 arquivos **na ordem**, um por vez:

### Migracao 1: Schema Principal
- Arquivo: `supabase/migrations/20260330000001_init_schema.sql`
- O que faz: Cria todas as 14 tabelas, enums, triggers, indices e a view `stock_summary`
- **Resultado esperado:** "Success. No rows returned"

### Migracao 2: Politicas RLS
- Arquivo: `supabase/migrations/20260330000002_rls_policies.sql`
- O que faz: Ativa Row Level Security em todas as tabelas e cria politicas de isolamento multi-tenant
- **Resultado esperado:** "Success. No rows returned"

### Migracao 3: Funcoes e Triggers
- Arquivo: `supabase/migrations/20260330000003_functions_triggers.sql`
- O que faz: Cria funcoes de negocio (stats do cliente, lembretes automaticos, alertas de estoque, numeracao de pedidos)
- **Resultado esperado:** "Success. No rows returned" (pode ter um NOTICE sobre pg_cron, e normal)

### Migracao 4: Dados Iniciais
- Arquivo: `supabase/migrations/20260330000004_seed_data.sql`
- O que faz: Cria templates padrao de mensagem (WhatsApp e E-mail)
- **IMPORTANTE:** Essa migracao so funciona DEPOIS que uma farmacia existir. Execute ela APOS o primeiro setup no app, OU pule e os templates serao criados manualmente depois.

### Configurar Auth (Email)

1. Acesse: `https://supabase.com/dashboard/project/<PROJECT_REF>/auth/providers`
2. Clique em **Email**
3. **Desative** "Confirm email" (para desenvolvimento / clientes que nao tem servidor SMTP)
4. Salve

---

## Passo 4: Configurar Variaveis de Ambiente

Copie o template e preencha:

```bash
cp .env.example .env.local
```

### Variaveis OBRIGATORIAS (minimo para funcionar):

```env
# Supabase (obter em Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron (gere uma string aleatoria)
CRON_SECRET=gere-uma-string-aleatoria-longa-aqui
```

> Para gerar o CRON_SECRET: `openssl rand -hex 32`

### Variaveis OPCIONAIS (ativar depois conforme necessidade):

```env
# E-mail (Resend) — para envio de lembretes por e-mail
RESEND_API_KEY=re_...

# WhatsApp (Evolution API) — para envio de lembretes por WhatsApp
EVOLUTION_API_URL=https://...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE_NAME=pharmacontrol

# Web Push (VAPID) — para notificacoes push no navegador
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:suporte@farmacia.com

# Sentry (Error Tracking) — para monitoramento de erros
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

---

## Passo 5: Deploy

### Opcao A: Rodar Local (teste)

```bash
pnpm dev
# Acesse http://localhost:3000
```

### Opcao B: Deploy na Vercel (producao)

```bash
# 1. Instalar Vercel CLI (se nao tiver)
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Linkar ao projeto
vercel link

# 4. Configurar variaveis de ambiente na Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET
# ... repetir para cada variavel

# 5. Deploy
vercel --prod
```

Ou pelo Dashboard da Vercel:
1. https://vercel.com/new
2. Importe o repositorio Git
3. Configure as variaveis de ambiente em Settings > Environment Variables
4. Deploy automatico a cada push

---

## Passo 6: Primeiro Acesso

1. Acesse a URL do app (local ou Vercel)
2. Clique **"Criar conta"**
3. Preencha nome, e-mail e senha
4. Sera redirecionado para **"Configurar Farmacia"**
5. Preencha: nome da farmacia, CNPJ, telefone, e-mail
6. Clique **"Comecar a usar"**
7. Pronto — o usuario e criado como **Administrador**

---

## Checklist de Implantacao

Use este checklist para cada novo cliente:

```
[ ] Repositorio clonado
[ ] Projeto Supabase criado
[ ] Migracao 1 executada (schema)
[ ] Migracao 2 executada (RLS)
[ ] Migracao 3 executada (funcoes/triggers)
[ ] Email confirmation desativada no Auth
[ ] .env.local configurado com as 3 chaves do Supabase
[ ] App rodando (local ou Vercel)
[ ] Primeiro usuario criado (registro + setup farmacia)
[ ] Migracao 4 executada (seed templates) — apos setup da farmacia
[ ] Teste: cadastrar 1 cliente
[ ] Teste: cadastrar 1 produto
[ ] Teste: dar entrada no estoque
[ ] Teste: criar 1 pedido
[ ] Teste: criar 1 lembrete manual
```

---

## Estrutura de Tabelas Criadas

| Tabela | Descricao | Dependencias |
|--------|-----------|-------------|
| `pharmacies` | Dados da farmacia (tenant) | nenhuma |
| `profiles` | Usuarios do sistema | `auth.users`, `pharmacies` |
| `customers` | Clientes/pacientes | `pharmacies`, `profiles` |
| `suppliers` | Fornecedores | `pharmacies` |
| `products` | Produtos, insumos, formulas | `pharmacies`, `suppliers` |
| `stock_items` | Estoque por lote | `pharmacies`, `products` |
| `stock_movements` | Auditoria de movimentacoes | `stock_items`, `products`, `profiles` |
| `orders` | Pedidos | `pharmacies`, `customers`, `profiles` |
| `order_items` | Itens do pedido | `orders`, `products` |
| `repurchase_reminders` | Lembretes de recompra | `pharmacies`, `customers`, `orders`, `products` |
| `notification_logs` | Log de notificacoes enviadas | `pharmacies`, `repurchase_reminders` |
| `message_templates` | Templates de mensagem | `pharmacies` |
| `stock_alerts_config` | Config de alertas de estoque | `pharmacies`, `products` |
| `audit_logs` | Log de auditoria (LGPD) | `pharmacies`, `profiles` |

### View

| View | Descricao |
|------|-----------|
| `stock_summary` | Posicao consolidada do estoque por produto (quantidade total, lotes, alertas) |

### Funcoes Automaticas (Triggers)

| Trigger | Quando Dispara | O que Faz |
|---------|----------------|-----------|
| `trigger_set_updated_at` | UPDATE em qualquer tabela | Atualiza `updated_at` automaticamente |
| `trigger_update_customer_stats` | Pedido marcado como "entregue" | Incrementa `total_orders` e `last_order_at` do cliente |
| `trigger_auto_schedule_reminder` | Pedido marcado como "entregue" | Cria lembretes de recompra baseados no ciclo do produto |
| `trigger_set_order_number` | INSERT em orders | Gera numero sequencial `PC-YYYY-NNNNNN` |

---

## Fluxo de Uso do Sistema

```
CADASTROS INICIAIS (fazer uma vez):
  Produtos → /stock/products/new
  Estoque  → /stock/entry

USO DIARIO:
  1. Cadastrar cliente      → /customers/new
  2. Criar pedido           → /orders/new (seleciona cliente + produtos)
  3. Atualizar status       → /orders/[id] (Recebido → Em Preparo → Pronto → Entregue)
  4. Ao entregar:
     - Estoque baixa automaticamente (se configurado)
     - Lembrete de recompra criado automaticamente (se produto tem ciclo)
  5. Monitorar lembretes    → /reminders (Hoje, Atrasados, Proximos)
  6. Monitorar estoque      → /stock (alertas criticos, vencimentos)

LEMBRETES MANUAIS:
  - Cliente recorrente      → /reminders/new (tipo: Recorrente, ex: 30 dias)
  - Cliente avulso          → /reminders/new (tipo: Avulso)
  - Estimativa de consumo   → /reminders/new (tipo: Estimativa, ex: 45 dias)
```

---

## Padroes de Dados Aceitos

Consulte o arquivo completo: `docs/PADROES_CADASTRO.md`

### Resumo rapido:

| Campo | Formato | Exemplo |
|-------|---------|---------|
| CPF | 11 digitos (com ou sem pontos) | `529.982.247-25` ou `52998224725` |
| Telefone | Formato livre | `(15) 99798-2554` |
| Data | AAAA-MM-DD (campo date) | `1999-06-17` |
| Valores R$ | Ponto decimal | `25.90` (nao `25,90`) |
| Unidades de medida | Sigla | `mg`, `g`, `kg`, `ml`, `L`, `un`, `cap`, `comp` |

---

## Solucao de Problemas Comuns

### "Permission denied" ao executar SQL
- Voce tentou criar funcoes no schema `auth.` — use `public.` em vez disso.
- As funcoes helper sao `public.get_my_pharmacy_id()` e `public.get_my_user_role()`.

### "Functions in index expression must be IMMUTABLE"
- O indice FTS usa `immutable_unaccent()` (wrapper). Verifique se a Migracao 1 foi executada completamente.

### Login retorna "E-mail ou senha incorretos"
- O Supabase exige confirmacao de e-mail por padrao.
- Solucao: Auth > Providers > Email > Desativar "Confirm email"
- Ou confirme o usuario manualmente em Auth > Users > 3 pontos > Confirm user.

### Tela branca apos login
- O usuario nao tem profile/farmacia.
- Acesse `/setup` diretamente para criar.

### Estoque mostra 0 mesmo com produtos cadastrados
- Cadastrar produto ≠ dar entrada no estoque.
- Va em `/stock/entry`, selecione o produto e registre a quantidade.

### Erro ao cadastrar cliente com CPF
- O sistema valida o formato (11 digitos, nao todos iguais).
- CPFs de teste validos: `52998224725`, `11144477735`, `38440034098`.

### Cron Jobs nao executam
- Verifique se `CRON_SECRET` esta configurado no Vercel e no `.env.local`.
- Os cron jobs so funcionam no Vercel (nao no localhost).
- Para testar local: `curl -H "Authorization: Bearer SEU_CRON_SECRET" http://localhost:3000/api/cron/send-reminders`

---

## Contatos e Referencias

- **CLAUDE.md** — Documento tecnico completo do projeto
- **docs/PADROES_CADASTRO.md** — Formatos aceitos em todos os cadastros
- **Supabase Docs** — https://supabase.com/docs
- **Vercel Docs** — https://vercel.com/docs
- **Next.js Docs** — https://nextjs.org/docs
