import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import { differenceInDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Gym Mitra <hello@mail.emitra.dev>';

async function runTrialReminders() {
    console.log('--- Running Trial Expiration Reminders ---');

    // 1. Get all gyms on TRIAL plan
    const trialGyms = await prisma.gymProfile.findMany({
        where: {
            saasPlan: 'TRIAL',
            trialExpiresAt: { not: null }
        },
        select: {
            id: true,
            name: true,
            email: true,
            ownerName: true,
            trialExpiresAt: true,
            slug: true,
            lastTrialReminderMilestone: true
        }
    });

    console.log(`Found ${trialGyms.length} gyms on TRIAL.`);

    const now = startOfDay(new Date());

    for (const gym of trialGyms) {
        if (!gym.trialExpiresAt || !gym.email) continue;

        const expiryDate = startOfDay(new Date(gym.trialExpiresAt));
        const daysLeft = differenceInDays(expiryDate, now);

        // Define reminder milestones
        // 30, 15, 7, 3, 1, 0 (Expired)
        let subject = '';
        let html = '';

        const loginUrl = `https://gym.emitra.dev/${gym.slug}/settings?tab=billing`;

        if (daysLeft === 30) {
            subject = `Your Gym Mitra Trial: 30 Days Remaining`;
            html = `<p>Hi ${gym.ownerName || 'Gym Owner'},</p>
                    <p>You've completed your first month with <strong>Gym Mitra</strong>! We hope you're enjoying the automated billing and member management.</p>
                    <p>Just a reminder that you have <strong>30 days</strong> left in your free trial.</p>
                    <p>To avoid any interruption in service, you can activate your permanent license anytime here: <a href="${loginUrl}">${loginUrl}</a></p>
                    <p>Best,<br/>Team Gym Mitra</p>`;
        } else if (daysLeft === 15) {
            subject = `15 Days Left in Your Gym Mitra Trial`;
            html = `<p>Hi ${gym.ownerName || 'Gym Owner'},</p>
                    <p>Your free trial of <strong>Gym Mitra</strong> expires in <strong>15 days</strong>.</p>
                    <p>Don't wait until the last minute! Activate your license today to keep your gym running smoothly: <a href="${loginUrl}">${loginUrl}</a></p>
                    <p>If you have any questions, just reply to this email.</p>
                    <p>Best,<br/>Team Gym Mitra</p>`;
        } else if (daysLeft === 7) {
            subject = `Action Required: 7 Days Remaining in Trial`;
            html = `<p>Hi ${gym.ownerName || 'Gym Owner'},</p>
                    <p>Your <strong>Gym Mitra</strong> trial ends in exactly <strong>one week</strong>.</p>
                    <p>After your trial expires, your access to the dashboard will be restricted until a license is activated.</p>
                    <p>Secure your access now: <a href="${loginUrl}">${loginUrl}</a></p>
                    <p>Best,<br/>Team Gym Mitra</p>`;
        } else if (daysLeft === 3) {
            subject = `⚠️ Urgent: 3 Days Left in Your Trial`;
            html = `<p>Hi ${gym.ownerName || 'Gym Owner'},</p>
                    <p>Your trial is almost over! Only <strong>3 days</strong> remain.</p>
                    <p>Activate your license now to prevent any downtime for your staff and members: <a href="${loginUrl}">${loginUrl}</a></p>
                    <p>Best,<br/>Team Gym Mitra</p>`;
        } else if (daysLeft === 1) {
            subject = `Final Day: Your Gym Mitra Trial Expires Tomorrow`;
            html = `<p>Hi ${gym.ownerName || 'Gym Owner'},</p>
                    <p>Today is the <strong>final day</strong> of your free trial.</p>
                    <p>Access will be restricted tomorrow. Act now to maintain your records and continue using the system: <a href="${loginUrl}">${loginUrl}</a></p>
                    <p>Best,<br/>Team Gym Mitra</p>`;
        } else if (daysLeft === 0) {
            subject = `🚨 Trial Expired: Action Needed for ${gym.name}`;
            html = `<p>Hi ${gym.ownerName || 'Gym Owner'},</p>
                    <p>Your 1-month trial of <strong>Gym Mitra</strong> has officially expired.</p>
                    <p><strong>What happens next?</strong></p>
                    <ul>
                        <li>Your dashboard access is now restricted.</li>
                        <li>Your data is safe for the next <strong>15 days</strong>.</li>
                        <li>On ${new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}, your gym data will be scheduled for permanent deletion if not activated.</li>
                    </ul>
                    <p>Unlock your account now: <a href="${loginUrl}">${loginUrl}</a></p>
                    <p>Best,<br/>Team Gym Mitra</p>`;
        }

        if (subject && html) {
            // Check if reminder for this milestone was already sent
            if (gym.lastTrialReminderMilestone === daysLeft) {
                console.log(`- Skipping ${daysLeft}d reminder for ${gym.slug} (milestone already met)`);
                continue;
            }

            console.log(`Sending reminder to ${gym.slug} (${daysLeft} days left)`);
            try {
                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: [gym.email],
                    subject: subject,
                    html: html
                });
                
                await prisma.gymProfile.update({
                    where: { id: gym.id },
                    data: { lastTrialReminderMilestone: daysLeft }
                });

                console.log(`✅ Sent reminder to ${gym.name}`);
            } catch (err) {
                console.error(`❌ Failed to send email for ${gym.slug}:`, err);
            }
        }
    }

    console.log('--- Finished Trial Reminders ---');
}

runTrialReminders()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
