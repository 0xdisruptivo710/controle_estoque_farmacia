-- ============================================================
-- MIGRATION: 20260330000003_functions_triggers.sql
-- PharmaControl — Business Logic Functions, Triggers & Jobs
-- ============================================================

-- ============================================================
-- Function: Update customer stats when an order is delivered
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_order_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE customers
    SET total_orders = total_orders + 1,
        last_order_at = NOW(),
        status = 'active'
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_customer_stats
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_order_stats();

-- ============================================================
-- Function: Auto-schedule repurchase reminder on order delivery
-- ============================================================
CREATE OR REPLACE FUNCTION auto_schedule_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_date DATE;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    FOR v_item IN
      SELECT oi.product_id, p.repurchase_cycle_days
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
        AND p.repurchase_cycle_days IS NOT NULL
    LOOP
      v_date := (NOW() + (v_item.repurchase_cycle_days || ' days')::INTERVAL)::DATE;

      INSERT INTO repurchase_reminders
        (pharmacy_id, customer_id, order_id, product_id, scheduled_date, status, channel)
      VALUES
        (NEW.pharmacy_id, NEW.customer_id, NEW.id, v_item.product_id, v_date, 'scheduled', 'whatsapp')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_schedule_reminder
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_schedule_reminder();

-- ============================================================
-- Function: Refresh stock alert levels across all stock items
-- ============================================================
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
  WHERE si.product_id = p.id
    AND si.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- pg_cron: schedule stock alert refresh every hour (optional)
-- Falls back to Vercel Cron Jobs if pg_cron is not available
-- ============================================================
DO $$
BEGIN
  PERFORM cron.schedule(
    'check-stock-alerts',
    '0 * * * *',
    'SELECT refresh_stock_alert_levels()'
  );
  RAISE NOTICE 'pg_cron job "check-stock-alerts" scheduled successfully.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available — stock alert refresh will rely on Vercel Cron Job at /api/cron/check-stock-alerts.';
END;
$$;

-- ============================================================
-- Order number sequence and auto-generation
-- ============================================================
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

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();
