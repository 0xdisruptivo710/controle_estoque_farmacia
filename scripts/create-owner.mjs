#!/usr/bin/env node
/**
 * Bootstrap the platform-owner account (super-admin).
 *
 * Bypasses the email-confirmation flow: creates the auth user with
 * email_confirm=true, a "master" pharmacy, the profile, and marks
 * the user as platform admin — all in one shot via service role.
 *
 * Usage:
 *   pnpm owner:create
 *
 * Env vars read from .env.local (or shell):
 *   NEXT_PUBLIC_SUPABASE_URL       (required)
 *   SUPABASE_SERVICE_ROLE_KEY      (required)
 *   OWNER_EMAIL, OWNER_PASSWORD,
 *   OWNER_NAME, PHARMACY_NAME      (optional — prompted if missing)
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '\n❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      '   Run: vercel env pull .env.local\n',
  );
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
async function ask(question, fallback) {
  const suffix = fallback ? ` [${fallback}]` : '';
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || fallback || '';
}

const email = (process.env.OWNER_EMAIL || (await ask('E-mail do owner', 'aios.chatbot@gmail.com'))).toLowerCase();
const password = process.env.OWNER_PASSWORD || (await ask('Senha (mín 6 caracteres)'));
const fullName = process.env.OWNER_NAME || (await ask('Nome completo', 'Owner Aios'));
const pharmacyName = process.env.PHARMACY_NAME || (await ask('Nome da farmácia mestre', 'Aios — Administração'));

rl.close();

if (!email.includes('@')) {
  console.error('❌ E-mail inválido.');
  process.exit(1);
}
if (!password || password.length < 6) {
  console.error('❌ Senha precisa ter no mínimo 6 caracteres.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('\n🔎 Verificando estado atual...');

// 1. Find or create auth.users
let userId;
const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listError) {
  console.error('❌ Erro listando usuários:', listError.message);
  process.exit(1);
}
const existing = list.users.find((u) => u.email?.toLowerCase() === email);

if (existing) {
  console.log(`   ↻ Auth user já existe (${existing.id}) — atualizando senha e confirmando email...`);
  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    console.error('❌ Erro atualizando user:', error.message);
    process.exit(1);
  }
  userId = existing.id;
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    console.error('❌ Erro criando user:', error?.message ?? 'desconhecido');
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`   ✓ Auth user criado (${userId})`);
}

// 2. Find or create pharmacy + profile
const { data: profile } = await admin
  .from('x3_profiles')
  .select('id, pharmacy_id, role')
  .eq('id', userId)
  .maybeSingle();

let pharmacyId;

if (profile?.pharmacy_id) {
  pharmacyId = profile.pharmacy_id;
  console.log(`   ↻ Profile já existe (pharmacy ${pharmacyId}) — garantindo role=admin...`);
  await admin.from('x3_profiles').update({ role: 'admin', is_active: true, full_name: fullName }).eq('id', userId);
} else {
  const { data: pharmacy, error: pErr } = await admin
    .from('pharmacies')
    .insert({ name: pharmacyName, email })
    .select('id')
    .single();
  if (pErr || !pharmacy) {
    console.error('❌ Erro criando pharmacy:', pErr?.message ?? 'desconhecido');
    process.exit(1);
  }
  pharmacyId = pharmacy.id;

  const { error: prErr } = await admin
    .from('x3_profiles')
    .upsert(
      {
        id: userId,
        pharmacy_id: pharmacyId,
        full_name: fullName,
        role: 'admin',
        is_active: true,
      },
      { onConflict: 'id' },
    );
  if (prErr) {
    console.error('❌ Erro criando profile:', prErr.message);
    process.exit(1);
  }
  console.log(`   ✓ Pharmacy + profile criados (pharmacy ${pharmacyId})`);
}

// 3. Mark as platform admin (idempotent)
const { error: paErr } = await admin
  .from('x3_platform_admins')
  .upsert(
    {
      user_id: userId,
      granted_by: userId,
      notes: 'Bootstrap owner via scripts/create-owner.mjs',
      revoked_at: null,
    },
    { onConflict: 'user_id' },
  );
if (paErr) {
  console.error('❌ Erro marcando platform admin:', paErr.message);
  console.error('   Rode as migrações antes: pnpm supabase db push');
  process.exit(1);
}
console.log('   ✓ Marcado como platform admin');

// 4. Summary
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
console.log('\n✅ PRONTO\n');
console.log(`   E-mail: ${email}`);
console.log(`   Senha:  ${password}`);
console.log(`   Login:  ${appUrl}/login`);
console.log('\nDica: rode "pnpm dev" e logue com essas credenciais.\n');
