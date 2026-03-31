/**
 * Seed test users for HeroStock.AI
 *
 * Run:  node scripts/seed-users.mjs
 *
 * Creates:
 *   - Admin:    admin@herostock.ai    / Admin@123
 *   - Investor: investor@herostock.ai / Investor@123
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  console.error('Missing VITE_SUPABASE_URL in .env');
  process.exit(1);
}

// Try service role key first (can create users directly), fall back to anon key + signUp
const useServiceRole = !!serviceKey;
const supabase = createClient(url, serviceKey || anonKey);

const users = [
  {
    email: 'admin@herostock.ai',
    password: 'Admin@123',
    full_name: 'Admin User',
    role: 'admin',
    kyc_status: 'verified',
    is_approved: true,
  },
  {
    email: 'investor@herostock.ai',
    password: 'Investor@123',
    full_name: 'Test Investor',
    role: 'investor',
    kyc_status: 'verified',
    is_approved: true,
  },
];

async function seedUsers() {
  for (const u of users) {
    console.log(`\nCreating ${u.role}: ${u.email} ...`);

    let userId;

    if (useServiceRole) {
      // Service role can create + auto-confirm users
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });

      if (error) {
        if (error.message?.includes('already been registered')) {
          console.log(`  -> Already exists, updating profile...`);
          // Fetch existing user
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existing = listData?.users?.find(x => x.email === u.email);
          userId = existing?.id;
        } else {
          console.error(`  -> Error: ${error.message}`);
          continue;
        }
      } else {
        userId = data.user.id;
        console.log(`  -> Auth user created: ${userId}`);
      }
    } else {
      // No service role key — use signUp (may require email confirmation)
      const { data, error } = await supabase.auth.signUp({
        email: u.email,
        password: u.password,
        options: { data: { full_name: u.full_name } },
      });

      if (error) {
        console.error(`  -> Error: ${error.message}`);
        continue;
      }
      userId = data.user?.id;
      if (!data.session) {
        console.log(`  -> Created but email confirmation may be required.`);
        console.log(`     Disable "Enable email confirmations" in Supabase Auth settings to skip.`);
      } else {
        console.log(`  -> Auth user created: ${userId}`);
      }
    }

    if (userId) {
      // Upsert profile
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: userId,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        kyc_status: u.kyc_status,
        is_approved: u.is_approved,
        referral_code: 'HERO-' + userId.substring(0, 6).toUpperCase(),
      }, { onConflict: 'id' });

      if (profileErr) {
        console.error(`  -> Profile error: ${profileErr.message}`);
      } else {
        console.log(`  -> Profile upserted (role: ${u.role})`);
      }
    }
  }

  console.log('\n--- Done ---');
  console.log('\nTest Credentials:');
  console.log('  Admin:    admin@herostock.ai    / Admin@123');
  console.log('  Investor: investor@herostock.ai / Investor@123');
}

seedUsers();
