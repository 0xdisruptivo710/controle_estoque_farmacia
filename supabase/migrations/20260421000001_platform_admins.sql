-- ============================================================
-- MIGRATION: 20260421000001_platform_admins.sql
-- Adds super-admin (platform owner) tier that transcends pharmacy tenancy.
--
-- Design (hybrid A + B):
--   - Option B: x3_platform_admins is the SOURCE OF TRUTH (audit trail)
--   - Option A: x3_profiles.is_platform_admin is a CACHED FLAG (fast RLS)
--   - Trigger keeps flag in sync with table
-- ============================================================

-- ============================================================
-- 1. Source of truth: x3_platform_admins
-- ============================================================
CREATE TABLE IF NOT EXISTS x3_platform_admins (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_platform_admins_updated_at
  BEFORE UPDATE ON x3_platform_admins
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_platform_admins_active
  ON x3_platform_admins(user_id)
  WHERE revoked_at IS NULL;

-- ============================================================
-- 2. Cached flag on x3_profiles
-- ============================================================
ALTER TABLE x3_profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_platform_admin
  ON x3_profiles(id)
  WHERE is_platform_admin = TRUE;

-- ============================================================
-- 3. Sync trigger — table is the source of truth, flag follows
-- ============================================================
CREATE OR REPLACE FUNCTION sync_platform_admin_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE x3_profiles
      SET is_platform_admin = (NEW.revoked_at IS NULL)
      WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE x3_profiles
      SET is_platform_admin = (NEW.revoked_at IS NULL)
      WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE x3_profiles
      SET is_platform_admin = FALSE
      WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_platform_admin_flag ON x3_platform_admins;
CREATE TRIGGER trigger_sync_platform_admin_flag
  AFTER INSERT OR UPDATE OR DELETE ON x3_platform_admins
  FOR EACH ROW EXECUTE FUNCTION sync_platform_admin_flag();

-- ============================================================
-- 4. RLS helper — reads the flag, never the table (fast path)
--    Lives in public (not auth) schema — SQL editor users lack
--    permission to DDL on auth schema.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin
     FROM x3_profiles
     WHERE id = auth.uid()
       AND deleted_at IS NULL
     LIMIT 1),
    FALSE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, anon, service_role;

-- ============================================================
-- 5. RLS on x3_platform_admins itself
--    Only platform admins may read or manage this table.
-- ============================================================
ALTER TABLE x3_platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admin_read" ON x3_platform_admins;
CREATE POLICY "platform_admin_read" ON x3_platform_admins
  FOR SELECT USING (public.is_platform_admin());

DROP POLICY IF EXISTS "platform_admin_write" ON x3_platform_admins;
CREATE POLICY "platform_admin_write" ON x3_platform_admins
  FOR ALL USING (public.is_platform_admin())
             WITH CHECK (public.is_platform_admin());

-- ============================================================
-- 6. Extend existing tenant-isolation policies
--    Platform admins bypass pharmacy_id filter on every tenant table.
-- ============================================================
DO $$
DECLARE
  t TEXT;
  tenant_tables TEXT[] := ARRAY[
    'customers',
    'suppliers',
    'products',
    'stock_items',
    'stock_movements',
    'orders',
    'repurchase_reminders',
    'notification_logs',
    'message_templates'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "pharmacy_isolation" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "pharmacy_isolation" ON %I '
      'FOR ALL USING (pharmacy_id = auth.pharmacy_id() OR public.is_platform_admin()) '
      'WITH CHECK (pharmacy_id = auth.pharmacy_id() OR public.is_platform_admin())',
      t
    );
  END LOOP;
END $$;

-- pharmacies — platform admin sees all
DROP POLICY IF EXISTS "pharmacy_self_or_platform" ON pharmacies;
CREATE POLICY "pharmacy_self_or_platform" ON pharmacies
  FOR SELECT USING (id = auth.pharmacy_id() OR public.is_platform_admin());

-- x3_profiles — platform admin sees all users across tenants
DROP POLICY IF EXISTS "profile_visibility" ON x3_profiles;
CREATE POLICY "profile_visibility" ON x3_profiles
  FOR SELECT USING (
    id = auth.uid()
    OR pharmacy_id = auth.pharmacy_id()
    OR public.is_platform_admin()
  );

-- ============================================================
-- ROLLBACK (manual — run if you need to revert)
-- ============================================================
-- DROP POLICY IF EXISTS "profile_visibility" ON x3_profiles;
-- DROP POLICY IF EXISTS "pharmacy_self_or_platform" ON pharmacies;
-- (recreate original pharmacy_isolation policies without OR public.is_platform_admin())
-- DROP POLICY IF EXISTS "platform_admin_read"  ON x3_platform_admins;
-- DROP POLICY IF EXISTS "platform_admin_write" ON x3_platform_admins;
-- DROP TRIGGER IF EXISTS trigger_sync_platform_admin_flag ON x3_platform_admins;
-- DROP FUNCTION IF EXISTS public.is_platform_admin();
-- DROP FUNCTION IF EXISTS sync_platform_admin_flag();
-- ALTER TABLE x3_profiles DROP COLUMN IF EXISTS is_platform_admin;
-- DROP TABLE IF EXISTS x3_platform_admins;
