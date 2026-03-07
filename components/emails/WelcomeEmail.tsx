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

interface WelcomeEmailProps {
    gymName: string;
    gymLogo?: string | null;
    memberName: string;
    planName: string;
    expiryDate: string;
    gymAddress?: string | null;
    gymContact?: string | null;
    invoiceUrl?: string;
}

export const WelcomeEmail = ({
    gymName,
    gymLogo,
    memberName,
    planName,
    expiryDate,
    gymAddress,
    gymContact,
    invoiceUrl,
}: WelcomeEmailProps) => {
    const previewText = `Welcome to ${gymName}, ${memberName}!`;

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
                            Welcome to <strong>{gymName}</strong>!
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {memberName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Your membership at <strong>{gymName}</strong> is now active. We&apos;re excited to have you with us!
                        </Text>
                        <Section className="bg-slate-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[14px] leading-[24px] m-0">
                                <strong>Plan:</strong> {planName}
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px] m-0">
                                <strong>Expiry Date:</strong> {expiryDate}
                            </Text>
                        </Section>
                        {invoiceUrl && (
                            <Section className="text-center mt-[10px] mb-[20px]">
                                <Link
                                    href={invoiceUrl}
                                    className="bg-[#0066FF] rounded text-white text-[13px] font-semibold no-underline text-center px-5 py-3 inline-block"
                                >
                                    View Your Invoice
                                </Link>
                            </Section>
                        )}
                        <Text className="text-black text-[14px] leading-[24px]">
                            See you at the gym!
                        </Text>
                        {(gymAddress || gymContact) && (
                            <>
                                <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                                <Text className="text-[#666666] text-[12px] leading-[24px]">
                                    {gymAddress && <span>{gymAddress}<br /></span>}
                                    {gymContact && <span>Contact: {gymContact}</span>}
                                </Text>
                            </>
                        )}
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

export default WelcomeEmail;
