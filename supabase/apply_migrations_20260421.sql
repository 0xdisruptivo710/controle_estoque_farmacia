-- ============================================================
-- APLICAÇÃO ÚNICA — cole no SQL editor do Supabase:
-- https://supabase.com/dashboard/project/ehlpmukjdknnyhkycncb/sql/new
--
-- Combina duas migrações (20260421000001 + 20260421000002).
-- Idempotente. Não toca em policies existentes de outras tabelas.
-- ============================================================

-- ============================================================
-- MIGRAÇÃO 1: Platform admin (super-admin cross-tenant)
-- ============================================================

-- 1.1 Tabela fonte de verdade
CREATE TABLE IF NOT EXISTS x3_platform_admins (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_platform_admins_updated_at ON x3_platform_admins;
CREATE TRIGGER set_platform_admins_updated_at
  BEFORE UPDATE ON x3_platform_admins
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_platform_admins_active
  ON x3_platform_admins(user_id) WHERE revoked_at IS NULL;

-- 1.2 Flag cacheado em x3_profiles
ALTER TABLE x3_profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_platform_admin
  ON x3_profiles(id) WHERE is_platform_admin = TRUE;

-- 1.3 Trigger de sincronização tabela ↔ flag
CREATE OR REPLACE FUNCTION sync_platform_admin_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE x3_profiles SET is_platform_admin = (NEW.revoked_at IS NULL) WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE x3_profiles SET is_platform_admin = FALSE WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_platform_admin_flag ON x3_platform_admins;
CREATE TRIGGER trigger_sync_platform_admin_flag
  AFTER INSERT OR UPDATE OR DELETE ON x3_platform_admins
  FOR EACH ROW EXECUTE FUNCTION sync_platform_admin_flag();

-- 1.4 Função RLS helper em public (auth é restrito)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM x3_profiles
     WHERE id = auth.uid() AND deleted_at IS NULL LIMIT 1),
    FALSE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, anon, service_role;

-- 1.5 RLS na tabela x3_platform_admins (auto-contida)
ALTER TABLE x3_platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admin_read" ON x3_platform_admins;
CREATE POLICY "platform_admin_read" ON x3_platform_admins
  FOR SELECT USING (public.is_platform_admin());

DROP POLICY IF EXISTS "platform_admin_write" ON x3_platform_admins;
CREATE POLICY "platform_admin_write" ON x3_platform_admins
  FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- ============================================================
-- MIGRAÇÃO 2: Team invitations
-- ============================================================

CREATE TABLE IF NOT EXISTS x3_invitations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id       UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  full_name         VARCHAR(255) NOT NULL,
  email             VARCHAR(255) NOT NULL,
  whatsapp          VARCHAR(20),
  role              user_role NOT NULL,
  token             VARCHAR(64) UNIQUE NOT NULL,
  invited_by        UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  expires_at        TIMESTAMPTZ NOT NULL,
  sent_via          VARCHAR(20),
  sent_at           TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  accepted_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_invitations_updated_at ON x3_invitations;
CREATE TRIGGER set_invitations_updated_at
  BEFORE UPDATE ON x3_invitations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_invitations_pharmacy_id
  ON x3_invitations(pharmacy_id) WHERE revoked_at IS NULL AND accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON x3_invitations(token) WHERE revoked_at IS NULL AND accepted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_unique_pending
  ON x3_invitations(pharmacy_id, LOWER(email))
  WHERE revoked_at IS NULL AND accepted_at IS NULL;

ALTER TABLE x3_invitations ENABLE ROW LEVEL SECURITY;

-- RLS autocontida: não depende de auth.pharmacy_id() nem auth.user_role()
DROP POLICY IF EXISTS "invitation_admin_manage" ON x3_invitations;
CREATE POLICY "invitation_admin_manage" ON x3_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM x3_profiles p
      WHERE p.id = auth.uid()
        AND (
          (p.pharmacy_id = x3_invitations.pharmacy_id AND p.role = 'admin')
          OR p.is_platform_admin = TRUE
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM x3_profiles p
      WHERE p.id = auth.uid()
        AND (
          (p.pharmacy_id = x3_invitations.pharmacy_id AND p.role = 'admin')
          OR p.is_platform_admin = TRUE
        )
    )
  );

-- ============================================================
-- FIM. Verificação opcional:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_name IN ('x3_platform_admins', 'x3_invitations');
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'x3_profiles' AND column_name = 'is_platform_admin';
-- ============================================================
