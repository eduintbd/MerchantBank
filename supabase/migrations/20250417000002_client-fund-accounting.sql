-- Client Fund Accounting Schema
-- Merchant bank fund management: deposits, withdrawals, fees, NAV

-- ============================================================
-- 1. Fund Accounts (per-client cash position summary)
-- ============================================================
CREATE TABLE IF NOT EXISTS fund_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES client_portfolios(id),
  account_name TEXT DEFAULT 'Primary',
  currency TEXT DEFAULT 'BDT',
  -- Balances
  cash_balance NUMERIC NOT NULL DEFAULT 0,
  receivables NUMERIC DEFAULT 0, -- pending sell settlements, dividends
  payables NUMERIC DEFAULT 0, -- pending buy settlements, fees due
  available_balance NUMERIC NOT NULL DEFAULT 0, -- cash - payables
  -- Totals
  total_deposits NUMERIC DEFAULT 0,
  total_withdrawals NUMERIC DEFAULT 0,
  total_fees_charged NUMERIC DEFAULT 0,
  total_dividends_received NUMERIC DEFAULT 0,
  -- Status
  status TEXT DEFAULT 'active', -- active | frozen | closed
  last_transaction_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, account_name)
);

CREATE INDEX IF NOT EXISTS idx_fund_accounts_client ON fund_accounts(client_id);

-- ============================================================
-- 2. Client Funds Ledger (append-only, immutable)
-- ============================================================
CREATE TABLE IF NOT EXISTS client_funds_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_account_id UUID NOT NULL REFERENCES fund_accounts(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  portfolio_id UUID REFERENCES client_portfolios(id),
  -- Transaction details
  entry_type TEXT NOT NULL, -- deposit | withdrawal | buy_settlement | sell_settlement | management_fee | performance_fee | custody_fee | dividend | interest | ipo_application | ipo_refund | adjustment | transfer
  description TEXT NOT NULL,
  reference_id UUID, -- links to portfolio_transaction, fee_billing, etc.
  reference_type TEXT, -- transaction | fee_billing | corporate_action | manual
  -- Amounts
  debit NUMERIC DEFAULT 0, -- money going out
  credit NUMERIC DEFAULT 0, -- money coming in
  running_balance NUMERIC NOT NULL, -- balance after this entry
  -- Source
  instrument TEXT, -- related security symbol if applicable
  counterparty TEXT, -- broker name, bank name, etc.
  value_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Audit
  recorded_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'posted', -- pending_approval | posted | reversed
  reversal_of UUID REFERENCES client_funds_ledger(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cfl_fund_account ON client_funds_ledger(fund_account_id);
CREATE INDEX IF NOT EXISTS idx_cfl_client ON client_funds_ledger(client_id);
CREATE INDEX IF NOT EXISTS idx_cfl_entry_type ON client_funds_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_cfl_value_date ON client_funds_ledger(value_date);

-- ============================================================
-- 3. Fee Billing (management + performance fee tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  portfolio_id UUID NOT NULL REFERENCES client_portfolios(id),
  fee_type TEXT NOT NULL, -- management_fee | performance_fee | custody_fee | advisory_fee | other
  -- Period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  -- Calculation
  aum_basis NUMERIC NOT NULL DEFAULT 0, -- AUM used for calculation
  fee_rate NUMERIC NOT NULL, -- annual rate applied
  calculated_amount NUMERIC NOT NULL, -- the fee amount
  discount NUMERIC DEFAULT 0,
  vat NUMERIC DEFAULT 0, -- 15% VAT on fees
  net_amount NUMERIC NOT NULL, -- calculated - discount + vat
  -- Performance fee specifics
  period_return NUMERIC, -- portfolio return for period
  hurdle_return NUMERIC, -- benchmark return
  excess_return NUMERIC, -- return above hurdle
  high_water_mark_before NUMERIC,
  high_water_mark_after NUMERIC,
  -- Status
  status TEXT DEFAULT 'draft', -- draft | approved | invoiced | paid | waived | reversed
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  paid_date DATE,
  ledger_entry_id UUID REFERENCES client_funds_ledger(id),
  -- Audit
  calculated_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_billing_client ON fee_billing(client_id);
CREATE INDEX IF NOT EXISTS idx_fee_billing_portfolio ON fee_billing(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_fee_billing_period ON fee_billing(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_fee_billing_status ON fee_billing(status);

-- ============================================================
-- 4. Deposit/Withdrawal Requests
-- ============================================================
CREATE TABLE IF NOT EXISTS fund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  fund_account_id UUID REFERENCES fund_accounts(id),
  request_type TEXT NOT NULL, -- deposit | withdrawal
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BDT',
  -- Payment details
  payment_method TEXT, -- bank_transfer | cheque | beftn | rtgs | cash
  bank_name TEXT,
  bank_account TEXT,
  cheque_number TEXT,
  transaction_reference TEXT,
  -- Status flow: requested → approved → processed → completed
  status TEXT DEFAULT 'requested', -- requested | approved | processing | completed | rejected | cancelled
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Links
  ledger_entry_id UUID REFERENCES client_funds_ledger(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_requests_client ON fund_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_fund_requests_status ON fund_requests(status);

-- ============================================================
-- 5. RLS Policies
-- ============================================================

ALTER TABLE fund_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own fund accounts" ON fund_accounts;
CREATE POLICY "Clients view own fund accounts" ON fund_accounts FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage fund accounts" ON fund_accounts;
CREATE POLICY "Admins manage fund accounts" ON fund_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

ALTER TABLE client_funds_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own ledger" ON client_funds_ledger;
CREATE POLICY "Clients view own ledger" ON client_funds_ledger FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage ledger" ON client_funds_ledger;
CREATE POLICY "Admins manage ledger" ON client_funds_ledger FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

ALTER TABLE fee_billing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own fees" ON fee_billing;
CREATE POLICY "Clients view own fees" ON fee_billing FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage fees" ON fee_billing;
CREATE POLICY "Admins manage fees" ON fee_billing FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

ALTER TABLE fund_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view own fund requests" ON fund_requests;
CREATE POLICY "Clients view own fund requests" ON fund_requests FOR SELECT USING (auth.uid() = client_id);
DROP POLICY IF EXISTS "Clients create fund requests" ON fund_requests;
CREATE POLICY "Clients create fund requests" ON fund_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Admins manage fund requests" ON fund_requests;
CREATE POLICY "Admins manage fund requests" ON fund_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
