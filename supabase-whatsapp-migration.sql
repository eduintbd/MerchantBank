-- ============================================
-- WhatsApp Signup — Migration
-- Adds phone uniqueness + OTP verification
-- ============================================

-- 1. Add unique constraint on phone (skip nulls/empty)
-- First clean up any duplicates
UPDATE profiles SET phone = NULL WHERE phone = '';

-- Add unique index (only on non-null phones)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON profiles (phone)
  WHERE phone IS NOT NULL AND phone != '';

-- 2. Add signup_source column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'web';

-- 3. Add phone_verified flag
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- 4. WhatsApp OTP verification table
CREATE TABLE IF NOT EXISTS whatsapp_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS whatsapp_otp_phone_idx ON whatsapp_otp (phone, verified, expires_at);

-- Auto-cleanup expired OTPs (optional — run via pg_cron)
-- SELECT cron.schedule('cleanup-otp', '*/30 * * * *', $$DELETE FROM whatsapp_otp WHERE expires_at < now() - interval '1 hour'$$);
