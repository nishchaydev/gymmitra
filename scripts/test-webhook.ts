import fs from 'fs';

async function testWebhook() {
    const payload = {
        type: "INSERT",
        table: "auth.users",
        schema: "auth",
        record: {
            id: "test-uuid-1234",
            email: "test@example.com", // Will be replaced by your email in the test command
            name: "Test Gym Owner",
        },
        old_record: null
    };

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/onboarding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer gym_mitra_secret_2026'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Webhook Response Matrix:', {
            status: response.status,
            ok: response.ok,
            data: data
        });
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testWebhook();
