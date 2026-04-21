-- ============================================================
-- MIGRATION: 20260421000002_team_invitations.sql
-- Team invitation flow: admin invites pharmacist/attendant.
-- Invitation stores pharmacy context + token; auth.users is only
-- created when the invitee accepts (to avoid ghost accounts).
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
  sent_via          VARCHAR(20), -- 'whatsapp' | 'manual' | null (pending)
  sent_at           TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  accepted_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_invitations_updated_at
  BEFORE UPDATE ON x3_invitations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_invitations_pharmacy_id
  ON x3_invitations(pharmacy_id)
  WHERE revoked_at IS NULL AND accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON x3_invitations(token)
  WHERE revoked_at IS NULL AND accepted_at IS NULL;

-- Prevent multiple pending invites for the same email in the same pharmacy
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_unique_pending
  ON x3_invitations(pharmacy_id, LOWER(email))
  WHERE revoked_at IS NULL AND accepted_at IS NULL;

-- ============================================================
-- RLS: admin of the pharmacy manages invites; platform admin sees all
-- Public accept flow uses service role, bypassing RLS.
-- ============================================================
ALTER TABLE x3_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitation_admin_manage" ON x3_invitations;
CREATE POLICY "invitation_admin_manage" ON x3_invitations
  FOR ALL
  USING (
    (pharmacy_id = auth.pharmacy_id() AND auth.user_role() = 'admin')
    OR public.is_platform_admin()
  )
  WITH CHECK (
    (pharmacy_id = auth.pharmacy_id() AND auth.user_role() = 'admin')
    OR public.is_platform_admin()
  );

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP POLICY IF EXISTS "invitation_admin_manage" ON x3_invitations;
-- DROP TABLE IF EXISTS x3_invitations;
