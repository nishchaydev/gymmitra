import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
    Row,
    Column,
} from '@react-email/components';
import * as React from 'react';

interface StaffCredentialEmailProps {
    gymName: string;
    gymLogo?: string | null;
    staffName: string;
    role: string;
    email: string;
    setPasswordUrl: string;
    loginUrl: string;
}

export const StaffCredentialEmail = ({
    gymName,
    gymLogo,
    staffName,
    role,
    email,
    setPasswordUrl,
    loginUrl,
}: StaffCredentialEmailProps) => {
    const previewText = `Set your password for ${gymName}`;
    const roleLabel = role === 'TRAINER' ? 'Personal Trainer'
        : role === 'MANAGER' ? 'Manager'
        : role === 'FRONT_DESK' ? 'Front Desk'
        : 'Staff Member';

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-slate-50 my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[480px] bg-white">
                        {gymLogo && (
                            <Section className="mt-[32px] text-center">
                                <Img
                                    src={gymLogo}
                                    width="120"
                                    height="auto"
                                    alt={gymName}
                                    className="mx-auto"
                                />
                            </Section>
                        )}

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Welcome to <strong>{gymName}</strong>! 👋
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello <strong>{staffName}</strong>,
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            You have been added as a <strong>{roleLabel}</strong> at <strong>{gymName}</strong>.
                            To get started, please set your password by clicking the button below:
                        </Text>

                        {/* Set Password CTA */}
                        <Section className="text-center mt-[24px] mb-[16px]">
                            <Link
                                href={setPasswordUrl}
                                className="bg-[#0066FF] rounded text-white text-[13px] font-semibold no-underline text-center px-5 py-3 inline-block"
                            >
                                Set Your Password →
                            </Link>
                        </Section>

                        {/* Account Info Box */}
                        <Section className="bg-slate-50 border border-solid border-[#e2e8f0] rounded-lg p-[16px] my-[24px]">
                            <Row>
                                <Column className="w-[100px]">
                                    <Text className="text-[#64748b] text-[12px] font-semibold uppercase tracking-wide m-0">
                                        Email
                                    </Text>
                                </Column>
                                <Column>
                                    <Text className="text-black text-[14px] font-mono m-0">
                                        {email}
                                    </Text>
                                </Column>
                            </Row>
                            <Hr className="border-[#e2e8f0] my-[12px]" />
                            <Row>
                                <Column className="w-[100px]">
                                    <Text className="text-[#64748b] text-[12px] font-semibold uppercase tracking-wide m-0">
                                        Role
                                    </Text>
                                </Column>
                                <Column>
                                    <Text className="text-black text-[14px] m-0">
                                        {roleLabel}
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                        <Text className="text-[#64748b] text-[13px] leading-[22px]">
                            ⏰ This link expires in 24 hours. After setting your password, you can log in anytime at:
                        </Text>

                        <Section className="text-center mb-[32px]">
                            <Link
                                href={loginUrl}
                                className="text-[#0066FF] text-[13px] font-semibold no-underline"
                            >
                                {loginUrl}
                            </Link>
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-[#8898aa] text-[12px] leading-[24px] text-center">
                            Powered by <strong>GymMitra</strong>
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default StaffCredentialEmail;

