import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import * as React from 'react'

interface GymOwnerWelcomeEmailProps {
    ownerName: string
    gymName: string
    slug: string
    loginUrl: string
    trialExpiresAt?: Date
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.emitra.dev'

export const GymOwnerWelcomeEmail = ({
    ownerName = 'Gym Owner',
    gymName = 'Your Gym',
    slug = 'demo',
    loginUrl = 'https://gym.emitra.dev/login',
    trialExpiresAt
}: GymOwnerWelcomeEmailProps) => {
    const checkinUrl = `${baseUrl}/${slug}/checkin`
    const expiryDate = trialExpiresAt ? new Date(trialExpiresAt) : null

    return (
        <Html>
            <Head />
            <Preview>Welcome to GymMitra! Here are your next steps.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={headerTitle}>Welcome to GymMitra 🎉</Heading>
                    </Section>

                    <Section style={content}>
                        <Text style={greeting}>Hi {ownerName},</Text>

                        <Text style={paragraph}>
                            Thank you for joining GymMitra! Your account for <strong>{gymName}</strong> is now fully active with a <strong>60-day premium trial</strong>. 
                        </Text>

                        {expiryDate && (
                            <Section style={{...boxSection, backgroundColor: '#fff7ed', borderColor: '#ffedd5', padding: '16px'}}>
                                <Text style={{...paragraph, margin: 0, fontSize: '14px', color: '#9a3412'}}>
                                    ⏱️ <strong>Trial Alert:</strong> Your trial expires on <strong>{expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. 
                                    Please activate your license before then to avoid service interruption and data deletion (15 days grace period applies).
                                </Text>
                            </Section>
                        )}

                        <Text style={paragraph}>
                            We're excited to help you streamline your gym operations, save time, and grow your business.
                        </Text>

                        <Section style={boxSection}>
                            <Heading style={boxTitle}>🚀 Your Next Steps:</Heading>
                            <ul style={list}>
                                <li style={listItem}>
                                    <strong>1. Log in to your Dashboard</strong>: Your command center for managing members, invoices, and attendance.
                                    <br />
                                    <Link href={loginUrl} style={actionLink}>Access Dashboard →</Link>
                                </li>
                                <li style={listItem}>
                                    <strong>2. Set up your Kiosk / Self-Check-in</strong>: Open this link on a tablet or phone at your front desk so members can check in easily using their phone number.
                                    <br />
                                    <Link href={checkinUrl} style={actionLink}>{checkinUrl}</Link>
                                </li>
                                <li style={listItem}>
                                    <strong>3. Print your QR Check-in Poster</strong>: We've attached your custom welcome kit poster to this email! You can also regenerate and print it from the "Settings" tab in your dashboard.
                                </li>
                            </ul>
                        </Section>

                        <Text style={paragraph}>
                            If you need any help importing your existing data or setting up your plans, hit reply to this email, and our onboarding team will assist you personally.
                        </Text>

                        <Text style={paragraph}>
                            Let's build something great together.
                        </Text>

                        <Text style={signoff}>
                            Best,<br />
                            <strong>The GymMitra Team</strong>
                        </Text>

                        <Section style={footer}>
                            <Link href={loginUrl} style={buttonPrimary}>
                                Go To Dashboard
                            </Link>
                        </Section>
                    </Section>

                    <Text style={footerText}>
                        You are receiving this email because you signed up for GymMitra.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

const main = {
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '0',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '600px',
    overflow: 'hidden',
}

const header = {
    backgroundColor: '#0ea5e9',
    padding: '30px 40px',
    textAlign: 'center' as const,
}

const headerTitle = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
    letterSpacing: '-0.5px',
}

const content = {
    padding: '40px',
}

const greeting = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '0 0 16px 0',
}

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#475569',
    margin: '0 0 24px 0',
}

const boxSection = {
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
}

const boxTitle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '0 0 16px 0',
}

const list = {
    margin: '0',
    paddingLeft: '0',
    listStyleType: 'none',
}

const listItem = {
    fontSize: '15px',
    color: '#334155',
    lineHeight: '24px',
    marginBottom: '16px',
}

const actionLink = {
    fontSize: '15px',
    color: '#0ea5e9',
    fontWeight: '500',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '4px',
}

const signoff = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#475569',
    margin: '0 0 24px 0',
}

const footer = {
    marginTop: '32px',
    textAlign: 'center' as const,
}

const buttonPrimary = {
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
}

const footerText = {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center' as const,
    padding: '0 40px 30px',
    lineHeight: '1.5',
}

export default GymOwnerWelcomeEmail
