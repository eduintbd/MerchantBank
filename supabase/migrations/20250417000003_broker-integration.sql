-- Broker Integration & Reconciliation Schema
-- Abaci → Broker order routing, fill ingestion, daily reconciliation

-- ============================================================
-- 1. Broker Connections (multi-broker support)
-- ============================================================
CREATE TABLE IF NOT EXISTS broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_name TEXT NOT NULL,
  broker_code TEXT NOT NULL UNIQUE,
  api_base_url TEXT,
  api_version TEXT DEFAULT 'v1',
  auth_method TEXT DEFAULT 'api_key', -- api_key | oauth2 | hmac
  -- Credentials stored as encrypted JSON (keys managed externally)
  credentials_ref TEXT, -- reference to secrets manager or env var name
  -- Webhook config (broker → Abaci)
  webhook_secret TEXT, -- HMAC secret for validating inbound webhooks
  webhook_url TEXT, -- our endpoint URL to share with broker
  -- Capabilities
  supports_realtime BOOLEAN DEFAULT false,
  supports_websocket BOOLEAN DEFAULT false,
  supports_file_upload BOOLEAN DEFAULT true,
  -- Status
  status TEXT DEFAULT 'sandbox', -- sandbox | testing | active | suspended | disconnected
  last_heartbeat TIMESTAMPTZ,
  last_error TEXT,
  -- Contact
  tech_contact_name TEXT,
  tech_contact_email TEXT,
  tech_contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Broker Orders (Abaci's outbound order log)
-- ============================================================
CREATE TABLE IF NOT EXISTS broker_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES broker_connections(id),
  portfolio_id UUID REFERENCES client_portfolios(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  -- Abaci side
  abaci_order_id TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  -- Broker side
  broker_order_id TEXT, -- assigned by broker on acceptance
  -- Order details
  symbol TEXT NOT NULL,
  isin TEXT,
  exchange TEXT DEFAULT 'DSE',
  side TEXT NOT NULL, -- BUY | SELL
  order_type TEXT DEFAULT 'LIMIT', -- MARKET | LIMIT
  quantity INTEGER NOT NULL,
  limit_price NUMERIC,
  time_in_force TEXT DEFAULT 'DAY', -- DAY | IOC | GTC
  board TEXT DEFAULT 'PUBLIC', -- PUBLIC | BLOCK | SPOT
  -- Status
  status TEXT DEFAULT 'DRAFT', -- DRAFT | SUBMITTED | ACCEPTED | OPEN | PARTIALLY_FILLED | FILLED | CANCELLED | REJECTED | EXPIRED
  filled_qty INTEGER DEFAULT 0,
  avg_fill_price NUMERIC DEFAULT 0,
  remaining_qty INTEGER DEFAULT 0,
  rejection_reason TEXT,
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  first_fill_at TIMESTAMPTZ,
  last_fill_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Audit
  created_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broker_orders_client ON broker_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_broker_orders_symbol ON broker_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_broker_orders_status ON broker_orders(status);
CREATE INDEX IF NOT EXISTS idx_broker_orders_broker ON broker_orders(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_orders_abaci_id ON broker_orders(abaci_order_id);
CREATE INDEX IF NOT EXISTS idx_broker_orders_broker_id_ref ON broker_orders(broker_order_id);

-- ============================================================
-- 3. Broker Executions (inbound fills — raw from broker)
-- ============================================================
CREATE TABLE IF NOT EXISTS broker_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES broker_connections(id),
  -- Dedup key
  exec_id TEXT NOT NULL, -- broker's unique execution ID
  -- Order linkage
  broker_order_id TEXT,
  abaci_order_id TEXT,
  broker_order_ref UUID REFERENCES broker_orders(id),
  -- Client
  client_code TEXT NOT NULL,
  client_id UUID REFERENCES profiles(id),
  portfolio_id UUID REFERENCES client_portfolios(id),
  -- Trade details
  symbol TEXT NOT NULL,
  isin TEXT,
  exchange TEXT DEFAULT 'DSE',
  side TEXT NOT NULL, -- BUY | SELL
  exec_type TEXT NOT NULL, -- FILL | PARTIAL_FILL | CANCEL | REJECT
  exec_qty INTEGER NOT NULL,
  exec_price NUMERIC NOT NULL,
  gross_value NUMERIC NOT NULL,
  -- Fee breakdown
  commission NUMERIC DEFAULT 0,
  exchange_fee NUMERIC DEFAULT 0,
  cdbl_fee NUMERIC DEFAULT 0,
  ait NUMERIC DEFAULT 0,
  other_charges NUMERIC DEFAULT 0,
  net_value NUMERIC NOT NULL,
  -- Dates
  trade_date DATE NOT NULL,
  settlement_date DATE,
  exec_time TIMESTAMPTZ,
  -- Cumulative (for partial fills)
  cum_qty INTEGER,
  leaves_qty INTEGER,
  -- Processing
  processing_status TEXT DEFAULT 'received', -- received | matched | applied | failed | duplicate
  matched_transaction_id UUID REFERENCES portfolio_transactions(id),
  error_message TEXT,
  raw_payload JSONB, -- store the original broker message
  -- Source
  source TEXT DEFAULT 'webhook', -- webhook | api_poll | file_import | manual
  category TEXT, -- stock category A/B/Z/N/G
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(broker_id, exec_id)
);

CREATE INDEX IF NOT EXISTS idx_broker_exec_broker ON broker_executions(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_exec_client ON broker_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_broker_exec_symbol ON broker_executions(symbol);
CREATE INDEX IF NOT EXISTS idx_broker_exec_trade_date ON broker_executions(trade_date);
CREATE INDEX IF NOT EXISTS idx_broker_exec_status ON broker_executions(processing_status);
CREATE INDEX IF NOT EXISTS idx_broker_exec_order ON broker_executions(abaci_order_id);

-- ============================================================
-- 4. Reconciliation Runs (daily recon sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES broker_connections(id),
  recon_date DATE NOT NULL,
  recon_type TEXT NOT NULL, -- trade | position | settlement | cash
  -- Results
  status TEXT DEFAULT 'running', -- running | completed | failed | partial
  total_items INTEGER DEFAULT 0,
  matched INTEGER DEFAULT 0,
  mismatched INTEGER DEFAULT 0,
  missing_abaci INTEGER DEFAULT 0, -- in broker but not Abaci
  missing_broker INTEGER DEFAULT 0, -- in Abaci but not broker
  -- Summaries
  total_discrepancy_value NUMERIC DEFAULT 0,
  summary JSONB,
  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  -- Audit
  triggered_by UUID REFERENCES profiles(id),
  data_source TEXT, -- api | file_upload | manual
  source_file_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recon_runs_date ON reconciliation_runs(recon_date);
CREATE INDEX IF NOT EXISTS idx_recon_runs_broker ON reconciliation_runs(broker_id);
CREATE INDEX IF NOT EXISTS idx_recon_runs_status ON reconciliation_runs(status);

-- ============================================================
-- 5. Reconciliation Items (per-item match results)
-- ============================================================
CREATE TABLE IF NOT EXISTS reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recon_run_id UUID NOT NULL REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
  -- What we're matching
  item_type TEXT NOT NULL, -- holding | trade | settlement | cash_balance
  client_id UUID REFERENCES profiles(id),
  client_code TEXT,
  symbol TEXT,
  -- Match result
  match_status TEXT NOT NULL, -- matched | qty_mismatch | price_mismatch | cost_mismatch | missing_abaci | missing_broker | value_mismatch
  -- Abaci values (our system of record)
  abaci_qty NUMERIC,
  abaci_price NUMERIC,
  abaci_value NUMERIC,
  abaci_avg_cost NUMERIC,
  -- Broker values
  broker_qty NUMERIC,
  broker_price NUMERIC,
  broker_value NUMERIC,
  broker_avg_cost NUMERIC,
  -- Discrepancy
  qty_diff NUMERIC DEFAULT 0,
  value_diff NUMERIC DEFAULT 0,
  cost_diff NUMERIC DEFAULT 0,
  -- Resolution
  resolution_status TEXT DEFAULT 'open', -- open | investigating | resolved | accepted
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  -- References
  abaci_ref_id UUID, -- portfolio_holding or portfolio_transaction id
  broker_ref_id UUID, -- broker_execution id
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recon_items_run ON reconciliation_items(recon_run_id);
CREATE INDEX IF NOT EXISTS idx_recon_items_status ON reconciliation_items(match_status);
CREATE INDEX IF NOT EXISTS idx_recon_items_resolution ON reconciliation_items(resolution_status);
CREATE INDEX IF NOT EXISTS idx_recon_items_client ON reconciliation_items(client_id);

-- ============================================================
-- 6. RLS Policies
-- ============================================================

ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage broker connections" ON broker_connections;
CREATE POLICY "Admins manage broker connections" ON broker_connections FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

ALTER TABLE broker_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own orders" ON broker_orders;
CREATE POLICY "Clients view own orders" ON broker_orders FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage broker orders" ON broker_orders;
CREATE POLICY "Admins manage broker orders" ON broker_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

ALTER TABLE broker_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage executions" ON broker_executions;
CREATE POLICY "Admins manage executions" ON broker_executions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage recon runs" ON reconciliation_runs;
CREATE POLICY "Admins manage recon runs" ON reconciliation_runs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage recon items" ON reconciliation_items;
CREATE POLICY "Admins manage recon items" ON reconciliation_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
