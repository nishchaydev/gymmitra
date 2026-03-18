import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';
import * as React from 'react';
import { getBaseUrl } from '@/lib/utils';

interface OnboardingEmailProps {
    ownerName: string;
    gymName: string;
    loginUrl: string;
    serviceAgreementUrl: string;
    saasPlan: string;
    trialExpiresAt?: Date;
    brandName?: string; // Added brandName to interface
}



export const OnboardingEmail = ({
    ownerName,
    gymName,
    loginUrl,
    serviceAgreementUrl,
    saasPlan,
    trialExpiresAt,
    brandName = "GymMitra", // Added brandName with default value
}: OnboardingEmailProps) => {
    const previewText = `Welcome to ${brandName}, ${ownerName}! Your workspace "${gymName}" is ready.`; // Used brandName
    const year = new Date().getFullYear();
    const baseUrl = getBaseUrl();

    return (
        <Html>
            <Head>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                `}</style>
            </Head>
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-[#f0f2f5] my-0 mx-auto" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
                    <Container className="mx-auto py-[32px] max-w-[600px]">

                        {/* ═══════════ HEADER ═══════════ */}
                        <Section className="bg-[#0f172a] rounded-t-[16px] px-[40px] pt-[36px] pb-[28px] text-center">
                            <Text className="text-[32px] font-extrabold m-0 p-0 tracking-tight" style={{ color: '#ffffff' }}>
                                Gym<span style={{ color: '#60a5fa' }}>Mitra</span>
                            </Text>
                            <Text className="text-[11px] tracking-[4px] uppercase m-0 mt-[6px] font-medium" style={{ color: '#94a3b8' }}>
                                SMART GYM MANAGEMENT
                            </Text>
                        </Section>

                        {/* ═══════════ HERO BANNER ═══════════ */}
                        <Section className="bg-gradient-to-r px-[40px] py-[28px] text-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}>
                            <Text className="text-[14px] font-semibold m-0 mb-[8px] tracking-wide uppercase" style={{ color: '#60a5fa' }}>
                                🎉 You&apos;re All Set
                            </Text>
                            <Heading className="text-[26px] font-extrabold m-0 mb-[8px] leading-tight" style={{ color: '#ffffff' }}>
                                Welcome aboard, {ownerName}!
                            </Heading>
                            <Text className="text-[15px] m-0" style={{ color: '#cbd5e1' }}>
                                Your workspace <strong style={{ color: '#ffffff' }}>&quot;{gymName}&quot;</strong> is live and ready to go.
                            </Text>
                        </Section>

                        {/* ═══════════ MAIN CONTENT ═══════════ */}
                        <Section className="bg-white px-[40px] py-[32px]">

                            {/* Quick-Start Checklist */}
                            <Heading className="text-[18px] font-bold text-[#0f172a] m-0 mb-[16px]">
                                🚀 Quick-Start Checklist
                            </Heading>

                            <Text className="text-[14px] leading-[24px] text-[#475569] m-0 mb-[20px]">
                                Complete these 4 steps in the next 10 minutes to fully activate your gym workspace:
                            </Text>

                            {/* Checklist Items */}
                            <Section className="mb-[24px]">
                                {/* Step 1 */}
                                <Section className="bg-[#f8fafc] rounded-[10px] p-[16px] mb-[10px] border-l-[4px]" style={{ borderLeftColor: '#3b82f6' }}>
                                    <Row>
                                        <Column className="w-[40px] align-top">
                                            <Text className="text-[20px] m-0 p-0 text-center font-bold" style={{ color: '#3b82f6' }}>1</Text>
                                        </Column>
                                        <Column>
                                            <Text className="text-[14px] font-semibold text-[#1e293b] m-0 mb-[2px]">
                                                👥 Add Your First Members
                                            </Text>
                                            <Text className="text-[13px] text-[#64748b] m-0">
                                                Import existing members or add them one by one. Each member gets a unique QR code for attendance.
                                            </Text>
                                        </Column>
                                    </Row>
                                </Section>

                                {/* Step 2 */}
                                <Section className="bg-[#f8fafc] rounded-[10px] p-[16px] mb-[10px] border-l-[4px]" style={{ borderLeftColor: '#10b981' }}>
                                    <Row>
                                        <Column className="w-[40px] align-top">
                                            <Text className="text-[20px] m-0 p-0 text-center font-bold" style={{ color: '#10b981' }}>2</Text>
                                        </Column>
                                        <Column>
                                            <Text className="text-[14px] font-semibold text-[#1e293b] m-0 mb-[2px]">
                                                🧾 Create Your First Invoice
                                            </Text>
                                            <Text className="text-[13px] text-[#64748b] m-0">
                                                Generate professional GST-ready invoices in one click. Share via WhatsApp or print instantly.
                                            </Text>
                                        </Column>
                                    </Row>
                                </Section>

                                {/* Step 3 */}
                                <Section className="bg-[#f8fafc] rounded-[10px] p-[16px] mb-[10px] border-l-[4px]" style={{ borderLeftColor: '#f59e0b' }}>
                                    <Row>
                                        <Column className="w-[40px] align-top">
                                            <Text className="text-[20px] m-0 p-0 text-center font-bold" style={{ color: '#f59e0b' }}>3</Text>
                                        </Column>
                                        <Column>
                                            <Text className="text-[14px] font-semibold text-[#1e293b] m-0 mb-[2px]">
                                                📊 Set Up Attendance Kiosk
                                            </Text>
                                            <Text className="text-[13px] text-[#64748b] m-0">
                                                Open the kiosk on any tablet at your entrance. Members scan QR to check in automatically.
                                            </Text>
                                        </Column>
                                    </Row>
                                </Section>

                                {/* Step 4 */}
                                <Section className="bg-[#f8fafc] rounded-[10px] p-[16px] border-l-[4px]" style={{ borderLeftColor: '#8b5cf6' }}>
                                    <Row>
                                        <Column className="w-[40px] align-top">
                                            <Text className="text-[20px] m-0 p-0 text-center font-bold" style={{ color: '#8b5cf6' }}>4</Text>
                                        </Column>
                                        <Column>
                                            <Text className="text-[14px] font-semibold text-[#1e293b] m-0 mb-[2px]">
                                                🏪 Add Products & Supplements
                                            </Text>
                                            <Text className="text-[13px] text-[#64748b] m-0">
                                                Set up your supplement shop, merchandise, and track inventory with the built-in POS system.
                                            </Text>
                                        </Column>
                                    </Row>
                                </Section>
                            </Section>

                            {/* Trial Expiry Notice */}
                            {trialExpiresAt && (
                                <Section className="bg-[#fff7ed] rounded-[10px] p-[16px] mb-[24px] border border-solid border-[#ffedd5]">
                                    <Text className="text-[14px] font-bold text-[#9a3412] m-0 mb-[4px]">
                                        ⏱️ Your 30-Day Trial Has Begun
                                    </Text>
                                    <Text className="text-[13px] text-[#c2410c] m-0">
                                        Your premium trial expires on <strong>{new Date(trialExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. 
                                        After this, you&apos;ll need a License Key to continue. 
                                        <br />
                                        <span className="text-[11px] font-medium mt-[4px] block">
                                            Important: If not activated within 15 days of expiry, all data will be permanently deleted.
                                        </span>
                                    </Text>
                                </Section>
                            )}

                            {/* CTA Button */}
                            <Section className="text-center mt-[12px] mb-[28px]">
                                <Button
                                    className="bg-[#2563eb] rounded-[10px] text-white text-[16px] font-bold no-underline text-center px-[40px] py-[16px]"
                                    href={loginUrl}
                                    style={{ boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)' }}
                                >
                                    Open Your Dashboard →
                                </Button>
                            </Section>

                            <Hr className="border-[#e2e8f0] my-[24px]" />

                            {/* ═══════════ WHAT'S INCLUDED ═══════════ */}
                            <Heading className="text-[16px] font-bold text-[#0f172a] m-0 mb-[16px]">
                                ✨ What&apos;s Included in Your Plan
                            </Heading>

                            <Section className="bg-[#f0fdf4] rounded-[10px] p-[20px] border border-solid border-[#bbf7d0]">
                                <Row className="mb-[8px]">
                                    <Column className="w-[24px] align-top">
                                        <Text className="text-[14px] m-0 p-0">✅</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[13px] text-[#166534] m-0">Unlimited members & invoices</Text>
                                    </Column>
                                </Row>
                                <Row className="mb-[8px]">
                                    <Column className="w-[24px] align-top">
                                        <Text className="text-[14px] m-0 p-0">✅</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[13px] text-[#166534] m-0">QR-based attendance kiosk</Text>
                                    </Column>
                                </Row>
                                <Row className="mb-[8px]">
                                    <Column className="w-[24px] align-top">
                                        <Text className="text-[14px] m-0 p-0">✅</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[13px] text-[#166534] m-0">Revenue analytics & reports dashboard</Text>
                                    </Column>
                                </Row>
                                <Row className="mb-[8px]">
                                    <Column className="w-[24px] align-top">
                                        <Text className="text-[14px] m-0 p-0">✅</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[13px] text-[#166534] m-0">WhatsApp invoice sharing</Text>
                                    </Column>
                                </Row>
                                <Row>
                                    <Column className="w-[24px] align-top">
                                        <Text className="text-[14px] m-0 p-0">✅</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[13px] text-[#166534] m-0">Product & supplement POS system</Text>
                                    </Column>
                                </Row>
                            </Section>

                            <Hr className="border-[#e2e8f0] my-[24px]" />

                            {/* ═══════════ SUPPORT SECTION ═══════════ */}
                            <Section className="bg-[#eff6ff] rounded-[10px] p-[20px] border border-solid border-[#bfdbfe]">
                                <Text className="text-[14px] font-semibold text-[#1e40af] m-0 mb-[8px]">
                                    💬 Need Help Getting Started?
                                </Text>
                                <Text className="text-[13px] text-[#3b82f6] m-0 mb-[4px]">
                                    Simply reply to this email and our team will get back to you within 24 hours. We&apos;re here to make your gym management effortless.
                                </Text>
                            </Section>

                            {/* Service Agreement */}
                            <Text className="text-[12px] leading-[20px] text-[#94a3b8] m-0 mt-[20px]">
                                📋 By continuing to use GymMitra, you agree to our{' '}
                                <Link href={serviceAgreementUrl} className="text-[#3b82f6] underline">
                                    Service Agreement
                                </Link>. Please review it for your records.
                            </Text>

                            <Text className="text-[14px] leading-[22px] text-[#374151] mt-[24px] mb-[0px]">
                                Best regards,
                                <br />
                                <strong>The GymMitra Team</strong>
                            </Text>
                        </Section>

                        {/* ═══════════ FOOTER ═══════════ */}
                        <Section className="bg-[#0f172a] rounded-b-[16px] px-[40px] py-[28px]">
                            {/* Legal Links */}
                            <Row className="mb-[16px]">
                                <Column className="text-center">
                                    <Link href={`${baseUrl}/legal/privacy`} className="text-[12px] text-[#94a3b8] no-underline mx-[6px]">
                                        Privacy Policy
                                    </Link>
                                    <Text className="inline text-[12px] text-[#475569] mx-[4px]">•</Text>
                                    <Link href={`${baseUrl}/legal/terms`} className="text-[12px] text-[#94a3b8] no-underline mx-[6px]">
                                        Terms of Service
                                    </Link>
                                    <Text className="inline text-[12px] text-[#475569] mx-[4px]">•</Text>
                                    <Link href={serviceAgreementUrl} className="text-[12px] text-[#94a3b8] no-underline mx-[6px]">
                                        Service Agreement
                                    </Link>
                                    <Text className="inline text-[12px] text-[#475569] mx-[4px]">•</Text>
                                    <Link href={`${baseUrl}/legal/refund`} className="text-[12px] text-[#94a3b8] no-underline mx-[6px]">
                                        Refund Policy
                                    </Link>
                                </Column>
                            </Row>

                            <Hr className="border-[#1e293b] my-[12px]" />

                            {/* Company Info */}
                            <Text className="text-[11px] text-[#64748b] text-center m-0 mb-[4px]">
                                © {year} Gym Emitra Technologies Pvt. Ltd. All rights reserved.
                            </Text>
                            <Text className="text-[11px] text-[#64748b] text-center m-0 mb-[4px]">
                                GymMitra — India&apos;s #1 Gym Management Platform
                            </Text>
                            <Text className="text-[11px] text-[#475569] text-center m-0">
                                <Link href="mailto:support@emitra.dev" className="text-[#64748b] no-underline">
                                    support@emitra.dev
                                </Link>
                                {' '} | {' '}
                                <Link href="https://gym.emitra.dev" className="text-[#64748b] no-underline">
                                    gym.emitra.dev
                                </Link>
                            </Text>
                        </Section>

                        {/* Unsubscribe */}
                        <Text className="text-[11px] text-[#9ca3af] text-center mt-[16px]">
                            You received this email because you signed up for GymMitra.
                            <br />
                            If you did not create this account, you can safely ignore this email.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

const previewBaseUrl = getBaseUrl();

OnboardingEmail.PreviewProps = {
    ownerName: 'Nishchay',
    gymName: 'Iron Paradise Gym',
    loginUrl: `${previewBaseUrl}/dashboard`,
    serviceAgreementUrl: `${previewBaseUrl}/legal/service-agreement`,
    saasPlan: 'FREE',
} as OnboardingEmailProps;

export default OnboardingEmail;
