require('dotenv').config({ path: '.env.local' });
// Fallback to .env
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

async function testRBAC() {
    console.log('🛡️ Starting SEC-04: RBAC Bypass Simulation...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase env variables.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hardcoded test credentials logically provided by user
    const email = "guptanishchay1158@gmail.com";
    const password = "admin123";

    console.log(`\n🔑 Authenticating as test user: ${email}`);

    // 1. Sign in via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError || !authData.session) {
        console.error('❌ Authentication failed:', authError?.message || 'No session returned');
        return;
    }

    console.log(`✅ Authentication successful! JWT Token acquired.`);

    const jwt = authData.session.access_token;

    // 2. Fetch the user's role/profile from the backend or JWT
    // Attempt to access restricted financial data at the API router level
    console.log(`\n🕵️‍♂️ Attempting to access restricted API endpoint: /api/reports?type=revenue`);

    try {
        const response = await fetch('http://localhost:3000/api/reports?type=revenue', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Cookie': `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${jwt}` // Supabase SSR relies on cookies usually
            }
        });

        const status = response.status;
        console.log(`API Response Status: ${status}`);

        if (status === 200) {
            console.log('⚠️ SECURITY ALERT: API returned 200 OK!');
            console.log('If this test account is a TRAINER or MEMBER, this is a Critical Privilege Escalation bypass!');
            console.log('If this test account is an OWNER, the RBAC allowed them as expected.');
        } else if (status === 401 || status === 403) {
            console.log('✅ PASS: API rejected the request with 401/403. RBAC is successfully protecting the endpoint.');
        } else {
            console.log(`Unexpected status ${status}. Ensure the local Next server is running.`);
        }

    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

testRBAC();
