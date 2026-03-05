import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config'; // Load env vars

// Ensure your RESEND_API_KEY is available in your .env file
const resendKey = process.env.RESEND_API_KEY;
if (!resendKey) {
    throw new Error("RESEND_API_KEY is not defined in the environment variables.");
}
const resend = new Resend(resendKey);

async function sendSeoReport() {
    try {
        console.log("Loading HTML template...");
        const htmlPath = path.join(process.cwd(), 'seo-email-template.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        console.log("Sending email via Resend...");
        const { data, error } = await resend.emails.send({
            from: 'eMitra Team <report@mail.emitra.dev>', // Replace with your exact sender if needed
            to: ['siakhargone@gmail.com'],
            subject: 'siakhargone.in — February 2026 Search Performance Report',
            html: htmlContent,
        });

        if (error) {
            console.error("❌ Failed to send email:");
            console.error(error);
        } else {
            console.log("✅ Email sent successfully!");
            console.log("Response data:", data);
        }
    } catch (err) {
        console.error("❌ An unexpected error occurred:");
        console.error(err);
    }
}

sendSeoReport();
