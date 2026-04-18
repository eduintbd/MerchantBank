// ═══════════════════════════════════════════════════════════
// Twilio WhatsApp Bot — Account Signup with OTP Verification
// ═══════════════════════════════════════════════════════════
//
// Deploy as a Twilio Function at:
//   https://timberwolf-mastiff-9776.twil.io/demo-reply
//
// Environment Variables (Twilio Functions > Settings > Environment Variables):
//   SUPABASE_URL         = https://fnwmvopralrpvryncxdc.supabase.co
//   SUPABASE_SERVICE_KEY  = <your Supabase SERVICE ROLE key>
//
// Dependencies (Twilio Functions > Settings > Dependencies):
//   @supabase/supabase-js  ^2.0.0
//
// Flow:
//   1. User sends message → bot sends 6-digit OTP
//   2. User replies with OTP → verified
//   3. Bot asks for full name
//   4. Bot asks for email (optional)
//   5. Account created in Supabase profiles table
// ═══════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

// In-memory sessions (resets on cold start — fine for sandbox)
const sessions = {};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.handler = async function (context, event, callback) {
  const twiml = new Twilio.twiml.MessagingResponse();
  const from = event.From; // "whatsapp:+880XXXXXXXXXX"
  const body = (event.Body || '').trim();
  const phone = from.replace('whatsapp:', '');

  const supabase = createClient(
    context.SUPABASE_URL || 'https://fnwmvopralrpvryncxdc.supabase.co',
    context.SUPABASE_SERVICE_KEY
  );

  // Initialize session
  if (!sessions[phone]) {
    // Check if phone already has a verified profile
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, full_name, phone_verified')
      .eq('phone', phone)
      .maybeSingle();

    if (existing && existing.phone_verified) {
      sessions[phone] = { step: 'returning' };
    } else {
      sessions[phone] = { step: 'start' };
    }
  }

  const session = sessions[phone];

  // Allow "reset" at any time to start over
  if (body.toLowerCase() === 'reset' || body.toLowerCase() === 'restart') {
    delete sessions[phone];
    twiml.message(`Session reset. Type *hi* to start again.`);
    return callback(null, twiml);
  }

  try {
    switch (session.step) {

      // ── Returning verified user ──
      case 'returning':
        twiml.message(
          `Welcome back to *Abaci Investments*! 🏦\n\n` +
          `Your account is already verified.\n\n` +
          `Need help? Just reply here anytime.\n` +
          `Type *reset* to start over.`
        );
        session.step = 'support';
        break;

      // ── Support for existing users ──
      case 'support':
        twiml.message(
          `Thanks for your message. Our team will get back to you shortly. 💬\n\n` +
          `Quick links:\n` +
          `• Dashboard\n` +
          `• Trading\n` +
          `• KYC Verification\n` +
          `• Learning Academy`
        );
        break;

      // ── Step 1: Send OTP ──
      case 'start': {
        const code = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

        // Invalidate old OTPs for this phone
        await supabase
          .from('whatsapp_otp')
          .update({ verified: true })
          .eq('phone', phone)
          .eq('verified', false);

        // Store new OTP
        await supabase.from('whatsapp_otp').insert({
          phone,
          code,
          verified: false,
          attempts: 0,
          expires_at: expiresAt,
        });

        session.otp = code;
        session.otpExpires = expiresAt;
        session.step = 'verify_otp';

        twiml.message(
          `Assalamu Alaikum! Welcome to *Abaci Investments* 🏦\n\n` +
          `To verify your WhatsApp number, please enter this code:\n\n` +
          `🔐 *${code}*\n\n` +
          `This code expires in 10 minutes.\n` +
          `Type *resend* to get a new code.`
        );
        break;
      }

      // ── Step 2: Verify OTP ──
      case 'verify_otp': {
        // Handle resend
        if (body.toLowerCase() === 'resend') {
          session.step = 'start';
          // Re-trigger the start step
          const code = generateOtp();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

          await supabase
            .from('whatsapp_otp')
            .update({ verified: true })
            .eq('phone', phone)
            .eq('verified', false);

          await supabase.from('whatsapp_otp').insert({
            phone,
            code,
            verified: false,
            attempts: 0,
            expires_at: expiresAt,
          });

          session.otp = code;
          session.otpExpires = expiresAt;
          session.step = 'verify_otp';

          twiml.message(
            `New code sent! 🔐\n\n` +
            `Your verification code is: *${code}*\n\n` +
            `Expires in 10 minutes.`
          );
          break;
        }

        // Check expiry
        if (new Date() > new Date(session.otpExpires)) {
          session.step = 'start';
          twiml.message(
            `⏰ Your code has expired.\n\n` +
            `Type *hi* to get a new verification code.`
          );
          break;
        }

        // Increment attempts in DB
        await supabase
          .from('whatsapp_otp')
          .update({ attempts: session.attempts ? session.attempts + 1 : 1 })
          .eq('phone', phone)
          .eq('code', session.otp)
          .eq('verified', false);

        // Check code
        const digits = body.replace(/\D/g, '');
        if (digits !== session.otp) {
          session.attempts = (session.attempts || 0) + 1;
          if (session.attempts >= 5) {
            session.step = 'start';
            twiml.message(
              `❌ Too many failed attempts.\n\n` +
              `Type *hi* to get a new code.`
            );
            break;
          }
          twiml.message(
            `❌ Incorrect code. You have ${5 - session.attempts} attempts left.\n\n` +
            `Please enter the 6-digit code, or type *resend* for a new one.`
          );
          break;
        }

        // Mark OTP as verified in DB
        await supabase
          .from('whatsapp_otp')
          .update({ verified: true })
          .eq('phone', phone)
          .eq('code', session.otp);

        session.verified = true;
        session.step = 'ask_name';

        twiml.message(
          `✅ *Phone verified!*\n\n` +
          `Now let's set up your account.\n\n` +
          `What is your *full name*?`
        );
        break;
      }

      // ── Step 3: Collect name ──
      case 'ask_name':
        if (body.length < 2) {
          twiml.message(`Please enter your full name (at least 2 characters).`);
          break;
        }
        session.fullName = body;
        twiml.message(
          `Thanks, *${session.fullName}*! 👋\n\n` +
          `What is your *email address*?\n\n` +
          `(Type *skip* if you don't have one)`
        );
        session.step = 'ask_email';
        break;

      // ── Step 4: Collect email & create account ──
      case 'ask_email': {
        const isSkip = body.toLowerCase() === 'skip';
        const email = isSkip ? '' : body.toLowerCase().trim();

        if (!isSkip && !email.includes('@')) {
          twiml.message(`That doesn't look like a valid email.\n\nPlease try again or type *skip*.`);
          break;
        }

        session.email = email;
        const referralCode = 'ABCI-' + Date.now().toString(36).toUpperCase().slice(-6);

        // Create profile in Supabase
        const { data: profile, error } = await supabase
          .from('profiles')
          .upsert({
            id: crypto.randomUUID(),
            full_name: session.fullName,
            email: session.email || '',
            phone: phone,
            role: 'investor',
            kyc_status: 'pending',
            is_approved: false,
            referral_code: referralCode,
            signup_source: 'whatsapp',
            phone_verified: true,
          }, { onConflict: 'phone' })
          .select()
          .single();

        if (error) {
          console.error('Supabase profile error:', error);
          twiml.message(
            `Something went wrong creating your account.\n\n` +
            `Please try again later or type *reset* to start over.`
          );
          session.step = 'start';
          break;
        }

        // Log as lead
        await supabase.from('leads').insert({
          visitor_id: 'wa-' + phone,
          name: session.fullName,
          phone: phone,
          email: session.email || null,
          source: 'whatsapp_bot',
          device: 'whatsapp',
          created_at: new Date().toISOString(),
        }).catch(() => {});

        twiml.message(
          `✅ *Account Created Successfully!*\n\n` +
          `Welcome to Abaci Investments, *${session.fullName}*!\n\n` +
          `📋 Your details:\n` +
          `• Name: ${session.fullName}\n` +
          `• Phone: ${phone} ✓\n` +
          (session.email ? `• Email: ${session.email}\n` : '') +
          `• Referral Code: *${referralCode}*\n\n` +
          `🔗 *Next steps:*\n` +
          `1. Visit your dashboard to explore\n` +
          `2. Complete KYC verification\n` +
          `3. Start trading on DSE & CSE\n\n` +
          `Need help anytime? Just message us here! 💬`
        );

        session.step = 'support';
        session.profileId = profile?.id;
        break;
      }

      // ── Default ──
      default:
        delete sessions[phone];
        twiml.message(
          `Welcome to *Abaci Investments*! 🏦\n\n` +
          `Type *hi* to start account opening.`
        );
        break;
    }
  } catch (err) {
    console.error('Bot error:', err);
    twiml.message(`Something went wrong. Please try again or type *reset*.`);
    session.step = 'start';
  }

  callback(null, twiml);
};
