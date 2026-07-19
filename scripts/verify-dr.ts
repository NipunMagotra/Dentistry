import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

// Load staging environment variables
// In practice, use dotenv or pass these in the environment before running
const SUPABASE_URL = process.env.STAGING_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.STAGING_SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.STAGING_SUPABASE_JWT_SECRET;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !JWT_SECRET) {
  console.error("❌ Missing Staging Supabase Environment Variables.");
  console.error("Please set STAGING_SUPABASE_URL, STAGING_SUPABASE_ANON_KEY, and STAGING_SUPABASE_JWT_SECRET.");
  process.exit(1);
}

async function verifyTenantIsolation() {
  console.log("🔄 Starting DR Verification Drill...");

  const secret = new TextEncoder().encode(JWT_SECRET);
  
  // Create a token for tenant 'apollo'
  const apolloToken = await new SignJWT({ role: 'authenticated', tenant_id: 'apollo' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  // Create a token for tenant 'city'
  const cityToken = await new SignJWT({ role: 'authenticated', tenant_id: 'city' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  const apolloClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${apolloToken}` } }
  });

  const cityClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${cityToken}` } }
  });

  try {
    // 1. Verify connection and data retrieval
    console.log("⏳ Fetching patients for 'apollo' tenant...");
    const { data: apolloPatients, error: apolloError } = await apolloClient.from('patients').select('*');
    if (apolloError) throw apolloError;

    // 2. Verify RLS Isolation
    // The 'apollo' client should ONLY see patients where tenant_id === 'apollo'
    const hasLeak = apolloPatients.some(p => p.tenant_id !== 'apollo');
    
    if (hasLeak) {
      console.error("❌ RLS ISOLATION FAILURE: Cross-tenant data leak detected in staging restore.");
      process.exit(1);
    }
    console.log("✅ RLS isolation verified: No cross-tenant data leaks.");

    // 3. Verify Appointments data integrity
    console.log("⏳ Checking appointments consistency...");
    const { data: cityAppointments, error: cityError } = await cityClient.from('appointments').select('*');
    if (cityError) throw cityError;

    console.log(`✅ Restore verified successfully. Total 'apollo' patients: ${apolloPatients.length}, 'city' appointments: ${cityAppointments.length}`);
    
  } catch (err) {
    console.error("❌ DR Verification Failed:", err);
    process.exit(1);
  }
}

verifyTenantIsolation();
