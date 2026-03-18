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
    Row,
    Column,
} from '@react-email/components'
import * as React from 'react'

interface DailyBriefingEmailProps {
    ownerName: string
    gymName: string
    date: string
    slug: string
    urgentRenewals: { id: string, name: string, planName: string, daysLeft: number }[]
    followUps: { id: string, name: string, phone: string, planInterest: string | null }[]
    partialPayments: { id: string, memberName: string, amountDue: number, invoiceNumber: string }[]
    overdueInvoices: { id: string, name: string, amount: number }[]
    lowStockItems: { id: string, name: string, stock: number, category: string }[]
    yesterdayCheckIns?: number
    activeMembers?: number
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.emitra.dev'

export const DailyBriefingEmail = ({
    ownerName = 'Gym Owner',
    gymName = 'Your Gym',
    date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    slug = 'demo',
    urgentRenewals = [],
    followUps = [],
    partialPayments = [],
    overdueInvoices = [],
    lowStockItems = [],
    yesterdayCheckIns = 0,
    activeMembers = 0
}: DailyBriefingEmailProps) => {
    const isAllClear =
        urgentRenewals.length === 0 &&
        followUps.length === 0 &&
        partialPayments.length === 0 &&
        overdueInvoices.length === 0 &&
        lowStockItems.length === 0

    return (
        <Html>
            <Head />
            <Preview>Your daily briefing for {gymName} - {date}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={headerTitle}>GymMitra</Heading>
                        <Text style={headerSubtitle}>Daily Briefing • {date}</Text>
                    </Section>

                    <Section style={content}>
                        <Text style={greeting}>Good morning, {ownerName} 👋</Text>

                        <Section style={statsBox}>
                            <Row>
                                <Column>
                                    <Text style={statValue}>{activeMembers}</Text>
                                    <Text style={statLabel}>Active Members</Text>
                                </Column>
                                <Column>
                                    <Text style={statValue}>{yesterdayCheckIns}</Text>
                                    <Text style={statLabel}>Yesterday's Check-ins</Text>
                                </Column>
                            </Row>
                        </Section>

                        {isAllClear ? (
                            <Section style={allClearBox}>
                                <Text style={allClearText}>
                                    🎉 <strong>All clear for today!</strong> You have no urgent renewals, overdue invoices, or pending follow-ups. Have a great day!
                                </Text>
                            </Section>
                        ) : (
                            <Text style={paragraph}>
                                Here is what requires your attention today at {gymName}.
                            </Text>
                        )}

                        {!isAllClear && (
                            <>
                                {urgentRenewals.length > 0 && (
                                    <Section style={boxSection}>
                                        <Heading style={boxTitle}>🔴 Urgent Renewals ({urgentRenewals.length})</Heading>
                                        <Text style={boxSubtitle}>Memberships expiring today or tomorrow.</Text>
                                        <ul style={list}>
                                            {urgentRenewals.slice(0, 5).map((r, i) => (
                                                <li key={i} style={listItem}>
                                                    <strong>{r.name}</strong> ({r.planName}) — <span style={{ color: '#e11d48' }}>Expires {r.daysLeft === 0 ? 'Today' : 'Tomorrow'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {urgentRenewals.length > 5 && <Text style={moreText}>+ {urgentRenewals.length - 5} more</Text>}
                                        <Link href={`${baseUrl}/${slug}/renewals`} style={actionLink}>View all renewals →</Link>
                                        <Hr style={divider} />
                                    </Section>
                                )}

                                {followUps.length > 0 && (
                                    <Section style={boxSection}>
                                        <Heading style={boxTitle}>📞 Follow-ups Due Today ({followUps.length})</Heading>
                                        <Text style={boxSubtitle}>Leads that need to be contacted today.</Text>
                                        <ul style={list}>
                                            {followUps.slice(0, 5).map((f, i) => (
                                                <li key={i} style={listItem}>
                                                    <strong>{f.name}</strong> ({f.phone}) {f.planInterest ? `- Interested in: ${f.planInterest}` : ''}
                                                </li>
                                            ))}
                                        </ul>
                                        {followUps.length > 5 && <Text style={moreText}>+ {followUps.length - 5} more</Text>}
                                        <Link href={`${baseUrl}/${slug}/leads`} style={actionLink}>View all leads →</Link>
                                        <Hr style={divider} />
                                    </Section>
                                )}

                                {partialPayments.length > 0 && (
                                    <Section style={boxSection}>
                                        <Heading style={boxTitle}>⏳ Partial Payments Due ({partialPayments.length})</Heading>
                                        <Text style={boxSubtitle}>Members with outstanding balances.</Text>
                                        <ul style={list}>
                                            {partialPayments.slice(0, 5).map((p, i) => (
                                                <li key={i} style={listItem}>
                                                    <strong>{p.memberName}</strong> (Inv: {p.invoiceNumber}) — <strong>₹{p.amountDue.toLocaleString('en-IN')} due</strong>
                                                </li>
                                            ))}
                                        </ul>
                                        {partialPayments.length > 5 && <Text style={moreText}>+ {partialPayments.length - 5} more</Text>}
                                        <Link href={`${baseUrl}/${slug}/invoices?filter=partial`} style={actionLink}>View partial payments →</Link>
                                        <Hr style={divider} />
                                    </Section>
                                )}

                                {overdueInvoices.length > 0 && (
                                    <Section style={boxSection}>
                                        <Heading style={boxTitle}>⚠️ Overdue Invoices ({overdueInvoices.length})</Heading>
                                        <ul style={list}>
                                            {overdueInvoices.slice(0, 5).map((inv, i) => (
                                                <li key={i} style={listItem}>
                                                    <strong>{inv.name}</strong> — <strong>₹{inv.amount.toLocaleString('en-IN')}</strong>
                                                </li>
                                            ))}
                                        </ul>
                                        {overdueInvoices.length > 5 && <Text style={moreText}>+ {overdueInvoices.length - 5} more</Text>}
                                        <Link href={`${baseUrl}/${slug}/invoices?filter=overdue`} style={actionLink}>View overdue invoices →</Link>
                                        <Hr style={divider} />
                                    </Section>
                                )}

                                {lowStockItems.length > 0 && (
                                    <Section style={boxSection}>
                                        <Heading style={boxTitle}>📦 Low Stock Alert ({lowStockItems.length})</Heading>
                                        <ul style={list}>
                                            {lowStockItems.slice(0, 5).map((item, i) => (
                                                <li key={i} style={listItem}>
                                                    <strong>{item.name}</strong> ({item.category}) — <span style={{ color: item.stock <= 0 ? '#e11d48' : '#d97706' }}>{item.stock <= 0 ? 'Out of Stock' : `${item.stock} left`}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {lowStockItems.length > 5 && <Text style={moreText}>+ {lowStockItems.length - 5} more</Text>}
                                        <Link href={`${baseUrl}/${slug}/products`} style={actionLink}>Manage inventory →</Link>
                                    </Section>
                                )}
                            </>
                        )}

                        <Section style={footer}>
                            <Link href={`${baseUrl}/${slug}/dashboard`} style={buttonPrimary}>
                                Open Dashboard
                            </Link>
                        </Section>
                    </Section>

                    <Text style={footerText}>
                        This is an automated daily briefing from GymMitra.<br />
                        You are receiving this because you are an admin of {gymName}.
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

const headerSubtitle = {
    color: '#e0f2fe',
    fontSize: '14px',
    margin: '4px 0 0 0',
}

const content = {
    padding: '40px',
}

const greeting = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '0 0 10px 0',
}

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#475569',
    margin: '0 0 24px 0',
}

const allClearBox = {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
}

const allClearText = {
    color: '#065f46',
    fontSize: '16px',
    margin: '0',
    lineHeight: '24px',
}

const boxSection = {
    marginBottom: '20px',
}

const boxTitle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '0 0 4px 0',
}

const boxSubtitle = {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 12px 0',
}

const list = {
    margin: '0 0 12px 0',
    paddingLeft: '20px',
}

const listItem = {
    fontSize: '14px',
    color: '#334155',
    lineHeight: '24px',
}

const moreText = {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 12px 0',
    fontStyle: 'italic',
}

const actionLink = {
    fontSize: '14px',
    color: '#0ea5e9',
    fontWeight: '500',
    textDecoration: 'none',
}

const divider = {
    borderColor: '#e2e8f0',
    margin: '20px 0 0 0',
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

const statsBox = {
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'center' as const,
}

const statValue = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '0',
}

const statLabel = {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
}

export default DailyBriefingEmail
