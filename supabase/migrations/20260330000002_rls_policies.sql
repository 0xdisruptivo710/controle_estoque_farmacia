-- ============================================================
-- MIGRATION: 20260330000002_rls_policies.sql
-- PharmaControl — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
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

-- ============================================================
-- Helper functions in PUBLIC schema
-- (Supabase does not allow creating functions in the auth schema)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_pharmacy_id()
RETURNS UUID AS $$
  SELECT pharmacy_id FROM public.profiles
  WHERE id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- Multi-tenancy isolation policies (pharmacy_id scoping)
-- ============================================================

CREATE POLICY "pharmacy_isolation" ON customers
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "pharmacy_isolation" ON products
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "pharmacy_isolation" ON stock_items
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "pharmacy_isolation" ON stock_movements
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "pharmacy_isolation" ON orders
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "pharmacy_isolation" ON repurchase_reminders
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "pharmacy_isolation" ON suppliers
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "pharmacy_isolation" ON message_templates
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "pharmacy_isolation" ON notification_logs
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

-- ============================================================
-- order_items: access via order ownership (pharmacy isolation)
-- ============================================================

CREATE POLICY "pharmacy_isolation" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.pharmacy_id = public.get_my_pharmacy_id()
    )
  );

-- ============================================================
-- stock_alerts_config: pharmacy isolation
-- ============================================================

CREATE POLICY "pharmacy_isolation" ON stock_alerts_config
  FOR ALL USING (pharmacy_id = public.get_my_pharmacy_id());

-- ============================================================
-- audit_logs: pharmacy isolation (select + insert only)
-- ============================================================

CREATE POLICY "pharmacy_isolation" ON audit_logs
  FOR SELECT USING (pharmacy_id = public.get_my_pharmacy_id());

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (pharmacy_id = public.get_my_pharmacy_id());

-- ============================================================
-- Pharmacy settings: read own + admin-only updates
-- ============================================================

CREATE POLICY "pharmacy_read_own" ON pharmacies
  FOR SELECT USING (id = public.get_my_pharmacy_id());

CREATE POLICY "admin_only_pharmacy_settings" ON pharmacies
  FOR UPDATE USING (
    id = public.get_my_pharmacy_id()
    AND public.get_my_user_role() = 'admin'
  );

-- ============================================================
-- Profiles: visibility and management
-- ============================================================

-- All users can see profiles in their pharmacy
CREATE POLICY "profile_visibility" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR pharmacy_id = public.get_my_pharmacy_id()
  );

-- Users can update their own profile
CREATE POLICY "profile_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Only admin can create new profiles (invite team members)
CREATE POLICY "admin_manage_profiles" ON profiles
  FOR INSERT WITH CHECK (
    pharmacy_id = public.get_my_pharmacy_id()
    AND public.get_my_user_role() = 'admin'
  );
