import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Load both .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendKey);
    const ADMIN_EMAILS = ['nikhilpal525@gmail.com', 'nishchaygupta54@gmail.com'];
    
    const fetchOptions: any = {};
    if (process.env.HTTPS_PROXY || process.env.http_proxy) {
       const proxyUrl = process.env.HTTPS_PROXY || process.env.http_proxy;
       if (proxyUrl) {
         fetchOptions.agent = new HttpsProxyAgent(proxyUrl);
       }
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'GymMitra <Admin@mail.emitra.dev>';
    const dummyPassword = 'test-password-123';
    const baseUrl = 'https://gym.emitra.dev';
    const now = new Date();
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);
    const trialEnd = trialExpiresAt.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
    const nowString = now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    console.log(`Sending demo trial emails using sender: ${fromEmail}`);

    // 1. Simulate Welcome Email (to the member/gym owner)
    // We'll send it to the admin emails so the founders can see what the user sees
    console.log('Sending Welcome Email Demo...');
    const memberResult = await resend.emails.send({
        from: fromEmail,
        to: ADMIN_EMAILS,
        subject: `Welcome to GymMitra, Test User! 🏋️`,
        html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
                <h1 style="font-size: 24px; margin-bottom: 8px;">Welcome to GymMitra! 🎉</h1>
                <p>Hi Test User,</p>
                <p><strong>Demo Gym Name</strong> is now set up with a <strong>30-day free trial</strong> (valid until ${trialEnd}).</p>

                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
                    <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px; color: #334155;">🔐 Your Login Credentials</p>
                    <p style="margin: 4px 0; font-size: 14px;">Email: <strong>test-user@example.com</strong></p>
                    <p style="margin: 4px 0; font-size: 14px;">Password: <strong>${dummyPassword}</strong></p>
                    <p style="margin: 12px 0 0; font-size: 14px; color: #ef4444; font-weight: 600;">⚠️ IMPORTANT: You MUST verify your email address before you can log in! Please check your inbox for a verification link.</p>
                </div>

                <p>Once you've verified your email, complete your gym setup in just a few minutes:</p>
                <a href="${baseUrl}/login" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                    Log In & Complete Setup →
                </a>
                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                    Your dashboard: <a href="${baseUrl}/demo-slug/dashboard">${baseUrl}/demo-slug/dashboard</a>
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">GymMitra · Smart Gym Management</p>
            </div>
        `,
    });
    console.log('Welcome Email Success!');

    // 2. Simulate Admin Notification (to the founders)
    console.log('Sending Admin Notification Demo...');
    const adminResult = await resend.emails.send({
        from: fromEmail,
        to: ADMIN_EMAILS,
        subject: `🆕 New Trial Signup: Demo Gym Name (New Delhi)`,
        html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
                <h2 style="font-size: 20px; margin-bottom: 16px;">🆕 New Trial Signup</h2>
                <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
                    <tr><td style="padding: 6px 12px; color: #64748b;">Gym Name</td><td style="padding: 6px 12px; font-weight: 600;">Demo Gym Name</td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Owner</td><td style="padding: 6px 12px; font-weight: 600;">Test User</td></tr>
                    <tr><td style="padding: 6px 12px; color: #64748b;">Phone</td><td style="padding: 6px 12px; font-weight: 600;">9999999999</td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Email</td><td style="padding: 6px 12px; font-weight: 600;">test-user@example.com</td></tr>
                    <tr><td style="padding: 6px 12px; color: #64748b;">City</td><td style="padding: 6px 12px; font-weight: 600;">New Delhi</td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Password</td><td style="padding: 6px 12px; font-weight: 600; font-family: monospace;">${dummyPassword}</td></tr>
                    <tr><td style="padding: 6px 12px; color: #64748b;">Slug</td><td style="padding: 6px 12px;"><a href="${baseUrl}/demo-slug/dashboard">demo-slug</a></td></tr>
                    <tr style="background: #f8fafc;"><td style="padding: 6px 12px; color: #64748b;">Signed Up</td><td style="padding: 6px 12px;">${nowString}</td></tr>
                </table>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">GymMitra Admin Alert</p>
            </div>
        `,
    });
    console.log('Admin Notification Success!');

  } catch (err: any) {
    console.error('Failed to send email:');
    console.error(err.message || err);
  }
}

main();
