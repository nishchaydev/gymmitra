import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface OnboardingEmailProps {
    ownerName: string;
    gymName: string;
    loginUrl: string;
    serviceAgreementUrl: string;
    saasPlan: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev';

export const OnboardingEmail = ({
    ownerName,
    gymName,
    loginUrl,
    serviceAgreementUrl,
    saasPlan,
}: OnboardingEmailProps) => {
    const previewText = `Welcome to Gym Mitra, ${ownerName}! Your workspace is ready.`;
    const year = new Date().getFullYear();

    return (
        <Html>
            <Head>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                `}</style>
            </Head>
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-[#f4f4f5] my-0 mx-auto" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
                    <Container className="mx-auto py-[40px] max-w-[600px]">

                        {/* Header with gradient */}
                        <Section className="bg-[#1a1a2e] rounded-t-[12px] px-[40px] pt-[40px] pb-[32px] text-center">
                            <Text className="text-[28px] font-bold m-0 p-0" style={{ color: '#ffffff' }}>
                                Gym<span style={{ color: '#3b82f6' }}>Mitra</span>
                            </Text>
                            <Text className="text-[11px] tracking-[3px] uppercase m-0 mt-[4px]" style={{ color: '#94a3b8' }}>
                                Technologies
                            </Text>
                        </Section>

                        {/* Main content */}
                        <Section className="bg-white px-[40px] py-[36px]">
                            <Heading className="text-[22px] font-semibold text-[#1a1a2e] m-0 mb-[16px]">
                                Welcome aboard, {ownerName}! 🚀
                            </Heading>

                            <Text className="text-[15px] leading-[26px] text-[#374151] m-0 mb-[20px]">
                                We are thrilled to have you join Gym Mitra. Your workspace <strong>"{gymName}"</strong> is now fully set up and ready to go.
                            </Text>

                            <Text className="text-[15px] leading-[26px] text-[#374151] m-0 mb-[8px]">
                                Here are your next steps to get the most out of Gym Mitra:
                            </Text>

                            {/* Feature highlights */}
                            <Section className="bg-[#f8fafc] rounded-[8px] p-[20px] my-[16px] border border-solid border-[#e2e8f0]">
                                <Row className="mb-[12px]">
                                    <Column className="w-[32px] align-top">
                                        <Text className="text-[18px] m-0 p-0">👥</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[14px] text-[#374151] m-0 p-0">
                                            <strong>Add Members</strong> — Start digitizing your member records
                                        </Text>
                                    </Column>
                                </Row>
                                <Row className="mb-[12px]">
                                    <Column className="w-[32px] align-top">
                                        <Text className="text-[18px] m-0 p-0">🧾</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[14px] text-[#374151] m-0 p-0">
                                            <strong>Generate Invoices</strong> — Create professional GST-ready invoices in 1 click
                                        </Text>
                                    </Column>
                                </Row>
                                <Row className="mb-[12px]">
                                    <Column className="w-[32px] align-top">
                                        <Text className="text-[18px] m-0 p-0">📊</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[14px] text-[#374151] m-0 p-0">
                                            <strong>Track Attendance</strong> — Keep an eye on daily footfall with QR check-ins
                                        </Text>
                                    </Column>
                                </Row>
                                <Row>
                                    <Column className="w-[32px] align-top">
                                        <Text className="text-[18px] m-0 p-0">🏪</Text>
                                    </Column>
                                    <Column>
                                        <Text className="text-[14px] text-[#374151] m-0 p-0">
                                            <strong>Point of Sale</strong> — Manage supplements and merchandise inventory
                                        </Text>
                                    </Column>
                                </Row>
                            </Section>

                            {/* CTA Button */}
                            <Section className="text-center mt-[28px] mb-[28px]">
                                <Button
                                    className="bg-[#3b82f6] rounded-[8px] text-white text-[15px] font-semibold no-underline text-center px-[32px] py-[14px]"
                                    href={loginUrl}
                                    style={{ boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}
                                >
                                    Go to your Dashboard →
                                </Button>
                            </Section>

                            <Hr className="border-[#e2e8f0] my-[24px]" />

                            {/* Service Agreement */}
                            <Text className="text-[13px] leading-[22px] text-[#6b7280] m-0 mb-[16px]">
                                📋 Please review our{' '}
                                <Link href={serviceAgreementUrl} className="text-[#3b82f6] underline">
                                    Service Agreement
                                </Link>{' '}
                                to complete your onboarding. This protects both your business and your members.
                            </Text>

                            <Text className="text-[13px] leading-[22px] text-[#6b7280] m-0">
                                If you have any questions, simply reply to this email. We're here to help you grow!
                            </Text>

                            <Text className="text-[14px] leading-[22px] text-[#374151] mt-[24px] mb-[0px]">
                                Best,
                                <br />
                                The Gym Mitra Team
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="bg-[#1a1a2e] rounded-b-[12px] px-[40px] py-[28px]">
                            {/* Legal Links */}
                            <Row className="mb-[16px]">
                                <Column className="text-center">
                                    <Link href={`${baseUrl}/legal/privacy`} className="text-[12px] text-[#94a3b8] no-underline mx-[8px]">
                                        Privacy Policy
                                    </Link>
                                    <Text className="inline text-[12px] text-[#475569] mx-[4px]">•</Text>
                                    <Link href={`${baseUrl}/legal/terms`} className="text-[12px] text-[#94a3b8] no-underline mx-[8px]">
                                        Terms of Service
                                    </Link>
                                    <Text className="inline text-[12px] text-[#475569] mx-[4px]">•</Text>
                                    <Link href={serviceAgreementUrl} className="text-[12px] text-[#94a3b8] no-underline mx-[8px]">
                                        Service Agreement
                                    </Link>
                                    <Text className="inline text-[12px] text-[#475569] mx-[4px]">•</Text>
                                    <Link href={`${baseUrl}/legal/refund`} className="text-[12px] text-[#94a3b8] no-underline mx-[8px]">
                                        Refund Policy
                                    </Link>
                                </Column>
                            </Row>

                            <Hr className="border-[#2d2d4e] my-[12px]" />

                            {/* Company Info */}
                            <Text className="text-[11px] text-[#64748b] text-center m-0 mb-[4px]">
                                © {year} Gym Emitra Technologies Pvt. Ltd. All rights reserved.
                            </Text>
                            <Text className="text-[11px] text-[#64748b] text-center m-0 mb-[4px]">
                                Gym Mitra — India's #1 Gym Management Platform
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
                            You received this email because you signed up for Gym Mitra.
                            <br />
                            If you did not create this account, you can safely ignore this email.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

OnboardingEmail.PreviewProps = {
    ownerName: 'Nishchay',
    gymName: 'Iron Paradise Gym',
    loginUrl: `${baseUrl}/dashboard`,
    serviceAgreementUrl: `${baseUrl}/legal/service-agreement`,
    saasPlan: 'BASIC',
} as OnboardingEmailProps;

export default OnboardingEmail;
