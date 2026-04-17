-- Portfolio Management & Custodian Operations Schema
-- Abaci Investments: Merchant Bank (Custodian + Portfolio Manager)
-- Abaci is system of record; broker executes trades; reconciliation matches both

-- ============================================================
-- 1. Model Portfolios (investment strategies/templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS model_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  strategy TEXT, -- growth | value | income | balanced | shariah | custom
  risk_level TEXT, -- conservative | moderate | aggressive
  benchmark TEXT, -- e.g. DSEX, DS30
  target_allocations JSONB, -- { "sector": { "Banking": 30, "Pharma": 20 }, "security": { "BRAC": 10 } }
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Client Portfolios (links client to model + tracks AUM)
-- ============================================================
CREATE TABLE IF NOT EXISTS client_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model_portfolio_id UUID REFERENCES model_portfolios(id),
  portfolio_name TEXT NOT NULL DEFAULT 'Primary',
  inception_date DATE NOT NULL DEFAULT CURRENT_DATE,
  strategy TEXT,
  risk_level TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | suspended | closed | liquidating
  management_fee_rate NUMERIC DEFAULT 1.50, -- annual % of AUM
  performance_fee_rate NUMERIC DEFAULT 0, -- % of gains above hurdle
  hurdle_rate NUMERIC DEFAULT 0, -- annual % benchmark for perf fee
  high_water_mark NUMERIC DEFAULT 0, -- for perf fee calculation
  initial_deposit NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, portfolio_name)
);

CREATE INDEX IF NOT EXISTS idx_client_portfolios_client ON client_portfolios(client_id);

-- ============================================================
-- 3. Portfolio Holdings (Abaci's system of record)
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES client_portfolios(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  isin TEXT,
  symbol TEXT NOT NULL,
  security_name TEXT,
  exchange TEXT DEFAULT 'DSE', -- DSE | CSE
  quantity NUMERIC NOT NULL DEFAULT 0,
  avg_cost NUMERIC NOT NULL DEFAULT 0, -- weighted average cost per unit
  total_cost NUMERIC NOT NULL DEFAULT 0, -- quantity * avg_cost
  current_price NUMERIC DEFAULT 0,
  market_value NUMERIC DEFAULT 0, -- quantity * current_price
  unrealized_pl NUMERIC DEFAULT 0, -- market_value - total_cost
  unrealized_pl_pct NUMERIC DEFAULT 0,
  realized_pl NUMERIC DEFAULT 0, -- cumulative realized P&L from sells
  weight_pct NUMERIC DEFAULT 0, -- % of total portfolio
  sector TEXT,
  category TEXT, -- A | B | Z | N | G
  settlement_qty NUMERIC DEFAULT 0, -- unsettled buy quantity
  saleable_qty NUMERIC DEFAULT 0, -- quantity - settlement_qty
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(portfolio_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_client ON portfolio_holdings(client_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);

-- ============================================================
-- 4. Portfolio Transactions (every buy/sell/corporate action)
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES client_portfolios(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- buy | sell | dividend_cash | dividend_stock | rights | bonus | ipo_allotment | transfer_in | transfer_out | split | merger
  symbol TEXT NOT NULL,
  isin TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  gross_value NUMERIC NOT NULL DEFAULT 0, -- quantity * price
  -- Fee breakdown (Abaci records what broker charged)
  commission NUMERIC DEFAULT 0,
  exchange_fee NUMERIC DEFAULT 0,
  cdbl_fee NUMERIC DEFAULT 0,
  ait NUMERIC DEFAULT 0,
  other_charges NUMERIC DEFAULT 0,
  net_value NUMERIC NOT NULL DEFAULT 0, -- gross +/- fees
  -- Settlement
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  settlement_date DATE,
  is_settled BOOLEAN DEFAULT false,
  -- Source tracking
  source TEXT DEFAULT 'manual', -- manual | broker_api | broker_file | cdbl | corporate_action
  broker_ref TEXT, -- broker's execution ID for reconciliation
  broker_name TEXT,
  -- Status
  status TEXT DEFAULT 'confirmed', -- pending | confirmed | settled | cancelled | disputed
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ptxn_portfolio ON portfolio_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_ptxn_client ON portfolio_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_ptxn_symbol ON portfolio_transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_ptxn_trade_date ON portfolio_transactions(trade_date);
CREATE INDEX IF NOT EXISTS idx_ptxn_broker_ref ON portfolio_transactions(broker_ref);
CREATE INDEX IF NOT EXISTS idx_ptxn_status ON portfolio_transactions(status);

-- ============================================================
-- 5. Portfolio Valuations (daily NAV snapshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES client_portfolios(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id),
  valuation_date DATE NOT NULL,
  -- Portfolio value breakdown
  total_market_value NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  cash_balance NUMERIC NOT NULL DEFAULT 0,
  receivables NUMERIC DEFAULT 0, -- pending sell settlements
  payables NUMERIC DEFAULT 0, -- pending buy settlements
  nav NUMERIC NOT NULL DEFAULT 0, -- market_value + cash - payables + receivables
  -- Performance
  day_pl NUMERIC DEFAULT 0,
  day_pl_pct NUMERIC DEFAULT 0,
  inception_pl NUMERIC DEFAULT 0,
  inception_pl_pct NUMERIC DEFAULT 0,
  -- Composition
  num_holdings INTEGER DEFAULT 0,
  top_holding_symbol TEXT,
  top_holding_weight NUMERIC DEFAULT 0,
  holdings_snapshot JSONB, -- full holdings at this point
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(portfolio_id, valuation_date)
);

CREATE INDEX IF NOT EXISTS idx_pval_portfolio_date ON portfolio_valuations(portfolio_id, valuation_date);
CREATE INDEX IF NOT EXISTS idx_pval_client ON portfolio_valuations(client_id);

-- ============================================================
-- 6. Corporate Actions
-- ============================================================
CREATE TABLE IF NOT EXISTS corporate_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- cash_dividend | stock_dividend | rights_issue | bonus_share | stock_split | merger | ipo
  symbol TEXT NOT NULL,
  isin TEXT,
  security_name TEXT,
  -- Details
  record_date DATE,
  ex_date DATE,
  payment_date DATE,
  declaration_date DATE,
  -- Values
  rate NUMERIC, -- dividend per share, split ratio, bonus ratio, rights price
  ratio_from NUMERIC, -- for splits/bonus: e.g. 1:2 = from:1, to:2
  ratio_to NUMERIC,
  face_value NUMERIC,
  -- Processing
  status TEXT DEFAULT 'declared', -- declared | ex_date_passed | record_date_set | processing | applied | completed
  affected_clients INTEGER DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  source TEXT, -- dse_announcement | cdbl | manual
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_action_symbol ON corporate_actions(symbol);
CREATE INDEX IF NOT EXISTS idx_corp_action_type ON corporate_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_corp_action_record_date ON corporate_actions(record_date);

-- ============================================================
-- 7. Corporate Action Applications (per-client processing)
-- ============================================================
CREATE TABLE IF NOT EXISTS corporate_action_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_action_id UUID NOT NULL REFERENCES corporate_actions(id),
  portfolio_id UUID NOT NULL REFERENCES client_portfolios(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  symbol TEXT NOT NULL,
  holding_qty NUMERIC NOT NULL, -- qty held on record date
  entitled_amount NUMERIC DEFAULT 0, -- cash dividend amount
  entitled_shares NUMERIC DEFAULT 0, -- stock dividend/bonus shares
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES portfolio_transactions(id), -- links to the txn created
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_app_action ON corporate_action_applications(corporate_action_id);
CREATE INDEX IF NOT EXISTS idx_ca_app_client ON corporate_action_applications(client_id);

-- ============================================================
-- 8. Custodian Accounts (BO/CDBL registry)
-- ============================================================
CREATE TABLE IF NOT EXISTS custodian_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bo_account TEXT NOT NULL,
  dp_id TEXT, -- Depository Participant ID (Abaci's CDBL membership)
  cdbl_member_id TEXT,
  account_type TEXT DEFAULT 'individual', -- individual | joint | corporate | omnibus
  status TEXT DEFAULT 'active', -- active | frozen | suspended | closed
  opened_date DATE,
  closed_date DATE,
  linked_bank_account TEXT,
  linked_bank_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, bo_account)
);

CREATE INDEX IF NOT EXISTS idx_custodian_client ON custodian_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_custodian_bo ON custodian_accounts(bo_account);

-- ============================================================
-- 9. Settlement Tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS settlement_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES portfolio_transactions(id),
  portfolio_id UUID NOT NULL REFERENCES client_portfolios(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- buy | sell
  quantity NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  trade_date DATE NOT NULL,
  settlement_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | partial | settled | failed | cancelled
  broker_name TEXT,
  broker_ref TEXT,
  settled_at TIMESTAMPTZ,
  settled_amount NUMERIC,
  discrepancy NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlement_date ON settlement_tracking(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlement_status ON settlement_tracking(status);
CREATE INDEX IF NOT EXISTS idx_settlement_client ON settlement_tracking(client_id);

-- ============================================================
-- 10. RLS Policies
-- ============================================================

-- Model portfolios: admins manage, all can read
ALTER TABLE model_portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read model portfolios" ON model_portfolios;
CREATE POLICY "Anyone can read model portfolios" ON model_portfolios FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage model portfolios" ON model_portfolios;
CREATE POLICY "Admins manage model portfolios" ON model_portfolios FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Client portfolios: client sees own, admins see all
ALTER TABLE client_portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own portfolios" ON client_portfolios;
CREATE POLICY "Clients view own portfolios" ON client_portfolios FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage all portfolios" ON client_portfolios;
CREATE POLICY "Admins manage all portfolios" ON client_portfolios FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Portfolio holdings
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own holdings" ON portfolio_holdings;
CREATE POLICY "Clients view own holdings" ON portfolio_holdings FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage all holdings" ON portfolio_holdings;
CREATE POLICY "Admins manage all holdings" ON portfolio_holdings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Portfolio transactions
ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own transactions" ON portfolio_transactions;
CREATE POLICY "Clients view own transactions" ON portfolio_transactions FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage all transactions" ON portfolio_transactions;
CREATE POLICY "Admins manage all transactions" ON portfolio_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Portfolio valuations
ALTER TABLE portfolio_valuations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own valuations" ON portfolio_valuations;
CREATE POLICY "Clients view own valuations" ON portfolio_valuations FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage all valuations" ON portfolio_valuations;
CREATE POLICY "Admins manage all valuations" ON portfolio_valuations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Corporate actions: all can read, admins manage
ALTER TABLE corporate_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read corporate actions" ON corporate_actions;
CREATE POLICY "Anyone can read corporate actions" ON corporate_actions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage corporate actions" ON corporate_actions;
CREATE POLICY "Admins manage corporate actions" ON corporate_actions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Corporate action applications
ALTER TABLE corporate_action_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own CA applications" ON corporate_action_applications;
CREATE POLICY "Clients view own CA applications" ON corporate_action_applications FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage all CA applications" ON corporate_action_applications;
CREATE POLICY "Admins manage all CA applications" ON corporate_action_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Custodian accounts
ALTER TABLE custodian_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own custodian accounts" ON custodian_accounts;
CREATE POLICY "Clients view own custodian accounts" ON custodian_accounts FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage custodian accounts" ON custodian_accounts;
CREATE POLICY "Admins manage custodian accounts" ON custodian_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Settlement tracking
ALTER TABLE settlement_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own settlements" ON settlement_tracking;
CREATE POLICY "Clients view own settlements" ON settlement_tracking FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage all settlements" ON settlement_tracking;
CREATE POLICY "Admins manage all settlements" ON settlement_tracking FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
