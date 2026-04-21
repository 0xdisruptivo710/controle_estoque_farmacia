# Guia — Criar acesso Owner (Platform Admin)

> Você é o dono do SaaS Aios/PharmaControl. Este guia te transforma em **platform admin**, com acesso transversal a **todas** as farmácias cadastradas.
>
> É um procedimento **de uma vez só**. Depois disso, novos platform admins podem ser concedidos via SQL.

---

## Caminho rápido (recomendado)

O jeito mais simples é rodar o script que cria tudo de uma vez: usuário com e-mail já confirmado, farmácia mestre, profile `admin` e marca como platform admin.

```bash
cd pharmacontrol

# Garanta que o .env.local tem NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
vercel env pull .env.local    # se ainda não tiver

pnpm owner:create             # interativo: pede e-mail, senha, nome
```

O script é **idempotente** — se o usuário já existir, atualiza a senha e confirma o email. Se a pharmacy/profile já existir, só marca como platform admin. Pronto: logue em `/login` com as credenciais exibidas no fim.

> **Por que rodar o script em vez de usar `/register`?** O fluxo de registro envia e-mail de confirmação, e o SMTP default do Supabase é instável. O script bypassa com `email_confirm=true`.

---

## Caminho manual (se preferir pela UI)

Você pode pular este caminho todo se o script acima funcionou.

### Pré-requisitos

- [ ] Migrações aplicadas no Supabase (`20260421000001_platform_admins.sql` e `20260421000002_team_invitations.sql`).
- [ ] Projeto rodando localmente ou deployado na Vercel.
- [ ] Acesso ao Supabase Dashboard do projeto (SQL editor).
- [ ] **Confirmação de email desativada** em Supabase Dashboard → Authentication → Providers → Email → desligue "Confirm email".

---

## Passo 1 — Aplicar as migrações

### Opção A — Supabase CLI (recomendado)
```bash
cd pharmacontrol
pnpm supabase db push
```

### Opção B — SQL editor do Dashboard
Abra o SQL editor do Supabase e cole, em ordem:
1. Conteúdo de `supabase/migrations/20260421000001_platform_admins.sql`
2. Conteúdo de `supabase/migrations/20260421000002_team_invitations.sql`

---

## Passo 2 — Criar sua conta pelo fluxo normal

1. Acesse `https://seu-deploy.vercel.app/register` (ou `http://localhost:3000/register` em dev).
2. Preencha:
   - **Nome completo:** seu nome
   - **E-mail:** `aios.chatbot@gmail.com` (ou o e-mail que usará como login)
   - **Senha:** escolha uma forte (mín. 6 caracteres, recomendado 12+)
3. Clique em **Criar Conta**. Você será redirecionado para `/setup`.

## Passo 3 — Configurar sua "farmácia mestre"

Em `/setup`, preencha:

| Campo | Valor sugerido |
|---|---|
| Nome da farmácia | `Aios — Administração` |
| CNPJ | (em branco — é opcional) |
| Telefone | seu WhatsApp pessoal |
| E-mail | `aios.chatbot@gmail.com` |

> **Por que isso?** O schema exige que todo usuário tenha `pharmacy_id`. Sua "farmácia mestre" é só um placeholder. Como platform admin, você ignora o isolamento e vê dados de todas as farmácias reais.

Clique em **Começar a usar**. Você cai no dashboard com `role = 'admin'` da sua farmácia mestre.

---

## Passo 4 — Virar platform admin (SQL)

Abra o **SQL editor do Supabase** e execute o bootstrap:

```sql
-- Conteúdo de: supabase/seed_platform_admin.sql
INSERT INTO x3_platform_admins (user_id, granted_by, notes)
SELECT
  u.id,
  u.id,
  'Initial platform admin — bootstrap'
FROM auth.users u
WHERE u.email = 'aios.chatbot@gmail.com'  -- <-- seu e-mail
ON CONFLICT (user_id) DO UPDATE
  SET revoked_at = NULL,
      notes = EXCLUDED.notes;
```

Verifique se funcionou:

```sql
SELECT p.id, p.full_name, p.is_platform_admin, pa.granted_at
FROM x3_profiles p
LEFT JOIN x3_platform_admins pa ON pa.user_id = p.id
WHERE p.is_platform_admin = TRUE;
```

Deve retornar exatamente uma linha — você. A trigger `sync_platform_admin_flag` setou `is_platform_admin = TRUE` automaticamente no seu profile.

---

## Passo 5 — Confirmar no app

1. **Deslogue e logue novamente** (para o middleware recarregar o estado).
2. No canto superior da `/settings/team`, você verá um badge laranja **"Platform"** ao lado do seu nome.
3. Teste: consulte qualquer tabela com `pharmacy_id` diferente da sua — deve retornar dados.

```sql
-- Exemplo de teste (como service role no SQL editor ou autenticado via JWT):
SELECT pharmacy_id, COUNT(*) as total_customers
FROM customers
GROUP BY pharmacy_id;
```

Você deve ver contagem para **todas** as farmácias.

---

## Suas credenciais finais

- **URL:** (produção) `https://seu-deploy.vercel.app/login` · (dev) `http://localhost:3000/login`
- **E-mail:** `aios.chatbot@gmail.com`
- **Senha:** a que você definiu no Passo 2
- **Farmácia visível:** `Aios — Administração` (mas você acessa todas via queries e RLS bypass)

---

## Conceder platform admin a outro usuário (futuro)

Como platform admin, você pode conceder o poder a mais alguém:

```sql
INSERT INTO x3_platform_admins (user_id, granted_by, notes)
SELECT u.id, auth.uid(), 'Motivo da concessão'
FROM auth.users u
WHERE u.email = 'outro@exemplo.com';
```

Para revogar:

```sql
UPDATE x3_platform_admins
SET revoked_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'outro@exemplo.com');
```

A trigger cuida de atualizar o flag em `x3_profiles` automaticamente.

---

## Problemas comuns

**"Profile not found" ao logar**
→ O Passo 3 não completou. Volte para `/setup` e finalize.

**`is_platform_admin` continua `FALSE` após o INSERT**
→ A trigger pode ter falhado silenciosamente. Force manualmente:
```sql
UPDATE x3_profiles SET is_platform_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'aios.chatbot@gmail.com');
```

**Não aparece badge "Platform" em `/settings/team`**
→ Faça logout/login para o cookie `pc_has_pharmacy` e o estado do React serem renovados.

**Criei a conta no ambiente errado (prod em vez de staging)**
→ Delete o profile e o auth.users pelo dashboard do Supabase (Auth → Users → Delete) e refaça no ambiente certo.
