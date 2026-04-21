-- ============================================================
-- ONE-OFF BOOTSTRAP: grant platform admin to yourself
--
-- Run this in the Supabase SQL editor (as service role / postgres).
-- Only needed the FIRST time — after this you can grant/revoke
-- other platform admins via the app or via SQL.
--
-- Replace the email below with YOUR login email.
-- ============================================================

INSERT INTO x3_platform_admins (user_id, granted_by, notes)
SELECT
  u.id,
  u.id, -- self-granted (bootstrap)
  'Initial platform admin — bootstrap'
FROM auth.users u
WHERE u.email = 'aios.chatbot@gmail.com'  -- <-- CHANGE THIS
ON CONFLICT (user_id) DO UPDATE
  SET revoked_at = NULL,
      notes = EXCLUDED.notes;

-- Verify:
SELECT p.id, p.full_name, p.is_platform_admin, pa.granted_at
FROM x3_profiles p
LEFT JOIN x3_platform_admins pa ON pa.user_id = p.id
WHERE p.is_platform_admin = TRUE;
