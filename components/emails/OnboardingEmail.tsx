import {
    Body,
    Button,
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

interface OnboardingEmailProps {
    ownerName: string;
    gymName: string;
    loginUrl: string;
    serviceAgreementUrl: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev';

export const OnboardingEmail = ({
    ownerName,
    gymName,
    loginUrl,
    serviceAgreementUrl,
}: OnboardingEmailProps) => {
    const previewText = `Welcome to Gym Mitra ERP - Next Steps for ${gymName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans leading-relaxed text-gray-800">
                    <Container className="border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] max-w-[600px]">
                        <Section className="mt-[20px]">
                            {/* Fallback to text if logo image is missing/broken */}
                            <Heading className="text-blue-600 text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                                Gym Mitra ERP
                            </Heading>
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Welcome aboard, {ownerName}!
                        </Heading>
                        <Text className="text-[14px] leading-[24px]">
                            We're absolutely thrilled to have <strong>{gymName}</strong> join the Gym Mitra ecosystem. You've taken the first major step toward streamlining your operations and growing your fitness business.
                        </Text>

                        <Text className="text-[14px] leading-[24px]">
                            To complete your onboarding process and protect both your business and your members, please review our official Service Agreement.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-blue-600 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                href={serviceAgreementUrl}
                            >
                                Read & Accept Service Agreement
                            </Button>
                        </Section>

                        <Text className="text-[14px] leading-[24px]">
                            Once you have reviewed the agreement, you can dive straight into your dashboard to start configuring your membership plans, staff, and point-of-sale inventory.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-gray-100 rounded text-gray-800 border border-solid border-gray-300 text-[14px] font-semibold no-underline text-center px-6 py-3"
                                href={loginUrl}
                            >
                                Go to Dashboard
                            </Button>
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            If you have any questions, reply directly to this email or contact our support team at support@emitra.dev. We are here to help you succeed!
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                            © {new Date().getFullYear()} eMitra Technologies. All rights reserved.
                            <br />
                            Gym Mitra ERP - The #1 Gym Management Software
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

OnboardingEmail.PreviewProps = {
    ownerName: 'Alex',
    gymName: 'Titanium Fitness',
    loginUrl: `${baseUrl}/dashboard`,
    serviceAgreementUrl: `${baseUrl}/legal/service-agreement`,
} as OnboardingEmailProps;

export default OnboardingEmail;
