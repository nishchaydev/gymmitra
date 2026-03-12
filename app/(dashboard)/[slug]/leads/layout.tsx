import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Lead Management' };

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
