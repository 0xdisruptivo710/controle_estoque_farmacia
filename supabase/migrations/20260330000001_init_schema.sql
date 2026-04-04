-- ============================================================
-- MIGRATION: 20260330000001_init_schema.sql
-- PharmaControl — Schema Principal
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- pg_cron: optional — not available on all Supabase plans
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "pg_cron";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension not available — skipping. Stock alert refresh will rely on Vercel Cron Jobs.';
END;
$$;

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role             AS ENUM ('admin', 'pharmacist', 'attendant');
CREATE TYPE stock_movement_type   AS ENUM ('entry', 'exit', 'adjustment', 'loss', 'expiration');
CREATE TYPE order_status          AS ENUM ('received', 'in_preparation', 'ready', 'delivered', 'cancelled');
CREATE TYPE reminder_status       AS ENUM ('scheduled', 'sent', 'viewed', 'converted', 'ignored', 'cancelled');
CREATE TYPE reminder_channel      AS ENUM ('push', 'whatsapp', 'email', 'sms');
CREATE TYPE customer_status       AS ENUM ('active', 'inactive', 'pending_repurchase');
CREATE TYPE product_category      AS ENUM ('raw_material', 'compound_formula', 'finished_product', 'packaging', 'other');
CREATE TYPE alert_level           AS ENUM ('ok', 'warning', 'critical');

-- ============================================================
-- Immutable wrapper for unaccent (required for GIN index expressions)
-- ============================================================
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT unaccent('unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- ============================================================
-- Trigger function: updated_at automatico
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
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

CREATE TRIGGER set_pharmacies_updated_at
  BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_pharmacies_cnpj ON pharmacies(cnpj) WHERE deleted_at IS NULL;

-- ============================================================
-- profiles (Usuarios — extends auth.users)
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

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
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

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_customers_pharmacy_id ON customers(pharmacy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_cpf         ON customers(cpf) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_status      ON customers(pharmacy_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_fts         ON customers
  USING gin(to_tsvector('portuguese', immutable_unaccent(full_name)));

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

CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_suppliers_pharmacy_id ON suppliers(pharmacy_id) WHERE deleted_at IS NULL;

-- ============================================================
-- products (Produtos, Insumos e Formulas)
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

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_products_pharmacy_id ON products(pharmacy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category    ON products(pharmacy_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_fts         ON products
  USING gin(to_tsvector('portuguese', immutable_unaccent(name)));

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

CREATE TRIGGER set_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_stock_items_product_id  ON stock_items(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_items_pharmacy_id ON stock_items(pharmacy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_items_expiration  ON stock_items(expiration_date)
  WHERE deleted_at IS NULL AND expiration_date IS NOT NULL;
CREATE INDEX idx_stock_items_alert       ON stock_items(pharmacy_id, alert_level)
  WHERE deleted_at IS NULL;

-- ============================================================
-- VIEW: Posicao consolidada por produto
-- ============================================================
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
-- stock_movements (Auditoria de movimentacoes — imutavel)
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

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
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

CREATE TRIGGER set_order_items_updated_at
  BEFORE UPDATE ON order_items
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

CREATE TRIGGER set_reminders_updated_at
  BEFORE UPDATE ON repurchase_reminders
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

CREATE TRIGGER set_message_templates_updated_at
  BEFORE UPDATE ON message_templates
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
-- audit_logs (LGPD — imutavel)
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
