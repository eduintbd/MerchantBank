-- Enhanced KYC & Client Management Schema for BSEC Merchant Banking
-- Aligns with BSEC e-KYC guidelines and EOD brokerage processes

-- ============================================================
-- 1. Extend profiles table with BSEC-required fields
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS mother_name TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Bangladeshi',
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS permanent_address TEXT,
  ADD COLUMN IF NOT EXISTS present_address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS post_code TEXT,
  ADD COLUMN IF NOT EXISTS nid_type TEXT DEFAULT 'nid', -- nid | passport | birth_cert
  ADD COLUMN IF NOT EXISTS passport_number TEXT,
  ADD COLUMN IF NOT EXISTS passport_expiry DATE,

  -- Bank & BO details
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS bank_routing_number TEXT,
  ADD COLUMN IF NOT EXISTS bo_type TEXT, -- individual | joint | corporate
  ADD COLUMN IF NOT EXISTS cdbl_dp_id TEXT,

  -- Investment profile
  ADD COLUMN IF NOT EXISTS investor_category TEXT DEFAULT 'RB', -- RB (Retail), MB (Margin), FI, NRB, MF, AMC, EMP
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'Cash', -- Cash | Margin
  ADD COLUMN IF NOT EXISTS income_source TEXT,
  ADD COLUMN IF NOT EXISTS annual_income TEXT,
  ADD COLUMN IF NOT EXISTS net_worth TEXT,
  ADD COLUMN IF NOT EXISTS investment_experience TEXT, -- none | 1-3yr | 3-5yr | 5yr+
  ADD COLUMN IF NOT EXISTS risk_tolerance TEXT, -- conservative | moderate | aggressive
  ADD COLUMN IF NOT EXISTS investment_objective TEXT, -- capital_preservation | income | growth | speculation

  -- Client lifecycle
  ADD COLUMN IF NOT EXISTS client_status TEXT DEFAULT 'pending_review', -- active | suspended | closed | pending_review
  ADD COLUMN IF NOT EXISTS rm_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS client_code TEXT,
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_verified_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS kyc_expiry DATE,
  ADD COLUMN IF NOT EXISTS last_kyc_update TIMESTAMPTZ,

  -- Nominee (primary)
  ADD COLUMN IF NOT EXISTS nominee_nid TEXT,
  ADD COLUMN IF NOT EXISTS nominee_phone TEXT,
  ADD COLUMN IF NOT EXISTS nominee_address TEXT,
  ADD COLUMN IF NOT EXISTS nominee_share_pct NUMERIC DEFAULT 100,
  ADD COLUMN IF NOT EXISTS nominee_dob DATE,

  -- Compliance flags
  ADD COLUMN IF NOT EXISTS is_pep BOOLEAN DEFAULT false, -- Politically Exposed Person
  ADD COLUMN IF NOT EXISTS pep_details TEXT,
  ADD COLUMN IF NOT EXISTS is_ip BOOLEAN DEFAULT false, -- Interested Person
  ADD COLUMN IF NOT EXISTS aml_risk_level TEXT DEFAULT 'low', -- low | medium | high
  ADD COLUMN IF NOT EXISTS sanctions_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declaration_signed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_signed_at TIMESTAMPTZ;

-- ============================================================
-- 2. Additional nominees table (BSEC allows multiple)
-- ============================================================
CREATE TABLE IF NOT EXISTS nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  nid_number TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  share_percentage NUMERIC NOT NULL DEFAULT 100,
  document_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nominees_user ON nominees(user_id);

-- ============================================================
-- 3. KYC approval audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS kyc_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- submitted | approved | rejected | returned | escalated
  status_from TEXT,
  status_to TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewer_name TEXT,
  reason TEXT,
  notes TEXT,
  documents_reviewed TEXT[], -- array of doc types reviewed
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_approvals_user ON kyc_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_approvals_action ON kyc_approvals(action);

-- ============================================================
-- 4. Client compliance checks log
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL, -- pep_screening | sanctions | aml_risk | document_verification | annual_review
  result TEXT NOT NULL, -- pass | fail | flagged | pending
  details JSONB,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_user ON compliance_checks(user_id);

-- ============================================================
-- 5. Enhance kyc_documents with review fields
-- ============================================================
ALTER TABLE kyc_documents
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS expires_at DATE,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- ============================================================
-- 6. Client activity log (audit trail for all changes)
-- ============================================================
CREATE TABLE IF NOT EXISTS client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- profile_update | kyc_submit | kyc_approve | status_change | rm_assign | document_upload | login | trade
  description TEXT,
  metadata JSONB,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_activity_user ON client_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_type ON client_activity_log(activity_type);

-- ============================================================
-- 7. Fee schedule (for brokerage operations)
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL, -- commission | exchange_fee | cdbl_fee | ait | laga
  rate NUMERIC NOT NULL,
  min_amount NUMERIC DEFAULT 0,
  max_amount NUMERIC,
  description TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default BSEC fee schedule
INSERT INTO fee_schedule (fee_type, rate, min_amount, description, effective_from) VALUES
  ('commission', 0.30, 0, 'Brokerage Commission (max 0.40%)', CURRENT_DATE),
  ('exchange_fee', 0.03, 0, 'Exchange/Laga Fee', CURRENT_DATE),
  ('cdbl_fee', 0.0175, 5, 'CDBL Settlement Fee (min BDT 5)', CURRENT_DATE),
  ('ait', 0.05, 0, 'Advance Income Tax on trades', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. RLS Policies
-- ============================================================

-- Nominees: users see own, admins see all
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own nominees" ON nominees;
CREATE POLICY "Users can manage own nominees"
  ON nominees FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all nominees" ON nominees;
CREATE POLICY "Admins can manage all nominees"
  ON nominees FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- KYC approvals: admins only for write, users can read own
ALTER TABLE kyc_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own kyc approvals" ON kyc_approvals;
CREATE POLICY "Users can view own kyc approvals"
  ON kyc_approvals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage kyc approvals" ON kyc_approvals;
CREATE POLICY "Admins can manage kyc approvals"
  ON kyc_approvals FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Compliance checks: admin only
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage compliance checks" ON compliance_checks;
CREATE POLICY "Admins can manage compliance checks"
  ON compliance_checks FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Client activity log: users see own, admins see all
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON client_activity_log;
CREATE POLICY "Users can view own activity"
  ON client_activity_log FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all activity" ON client_activity_log;
CREATE POLICY "Admins can manage all activity"
  ON client_activity_log FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Fee schedule: read for all, write for admins
ALTER TABLE fee_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read fee schedule" ON fee_schedule;
CREATE POLICY "Anyone can read fee schedule"
  ON fee_schedule FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage fee schedule" ON fee_schedule;
CREATE POLICY "Admins can manage fee schedule"
  ON fee_schedule FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
