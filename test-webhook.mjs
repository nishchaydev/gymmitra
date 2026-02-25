import fetch from 'node-fetch';

async function testWebhook() {
    const url = 'https://gym.emitra.dev/api/webhooks/onboarding';
    const secret = 'gym_mitra_secret_2026';

    // Simulate a payload
    const payload = {
        type: 'UPDATE',
        table: 'users',
        schema: 'auth',
        record: {
            id: 'fa82136e-52f1-4b16-a111-e730cb85bbfd',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString()
        },
        old_record: {
            id: 'fa82136e-52f1-4b16-a111-e730cb85bbfd',
            email: 'test@example.com',
            email_confirmed_at: null
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secret}`
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status HTTP Code: ${response.status}`);
        const text = await response.text();
        console.log(`Response Preview:`, text.substring(0, 300));

        // Also let's check headers
        console.log(`Headers:`, response.headers.raw());
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testWebhook();
