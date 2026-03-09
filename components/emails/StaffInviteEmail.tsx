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
} from '@react-email/components';
import * as React from 'react';

interface StaffInviteEmailProps {
    gymName: string;
    gymLogo?: string | null;
    staffName: string;
    role: string;
    signupUrl: string;
}

export const StaffInviteEmail = ({
    gymName,
    gymLogo,
    staffName,
    role,
    signupUrl,
}: StaffInviteEmailProps) => {
    const previewText = `You've been invited to join ${gymName}!`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-slate-50 my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
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
                            Join <strong>{gymName}</strong>
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {staffName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            You have been invited to join <strong>{gymName}</strong> as a <strong>{role === 'TRAINER' ? 'Personal Trainer' : 'Staff Member'}</strong>.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            To accept this invitation and set up your account, please click the link below to sign up. Make sure to use this email address when registering.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Link
                                href={signupUrl}
                                className="bg-[#0066FF] rounded text-white text-[13px] font-semibold no-underline text-center px-5 py-3 inline-block"
                            >
                                Accept Invitation & Sign Up
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

export default StaffInviteEmail;
