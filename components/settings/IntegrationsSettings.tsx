"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
    MessageCircle, 
    Calendar, 
    Slack, 
    Mail, 
    Link2, 
    ExternalLink,
    CheckCircle2,
    AlertCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function IntegrationsSettings() {
    const integrations = [
        {
            id: 'whatsapp',
            name: 'WhatsApp Business',
            description: 'Send automated invoices and renewal reminders.',
            icon: MessageCircle,
            status: 'connected',
            type: 'Messaging'
        },
        {
            id: 'google-calendar',
            name: 'Google Calendar',
            description: 'Sync personal training sessions and class schedules.',
            icon: Calendar,
            status: 'disconnected',
            type: 'Scheduling'
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Get real-time alerts for new memberships and payments.',
            icon: Slack,
            status: 'disconnected',
            type: 'Collaboration'
        },
        {
            id: 'email',
            name: 'Email Marketing',
            description: 'Connect with Mailchimp or SendGrid for newsletters.',
            icon: Mail,
            status: 'disconnected',
            type: 'Marketing'
        }
    ]

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Connected Apps</CardTitle>
                            <CardDescription>
                                Connect your favorite tools to automate your gym operations.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            {integrations.filter(i => i.status === 'connected').length} Active
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {integrations.map((app) => (
                            <div 
                                key={app.id} 
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                        <app.icon className="h-6 w-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900">{app.name}</h4>
                                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider py-0 h-4">
                                                {app.type}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 max-w-md">{app.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {app.status === 'connected' ? (
                                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-sm border border-emerald-100">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Connected
                                        </div>
                                    ) : (
                                        <Button variant="outline" size="sm" className="rounded-full font-bold shadow-sm">
                                            Connect <ExternalLink className="ml-2 h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        Custom API Webhooks
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Advanced users can connect custom endpoints for real-time data sync.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-400" />
                            <span className="text-sm text-slate-300 font-medium font-mono tracking-tighter">No webhooks configured yet.</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-white border-slate-700 hover:bg-slate-800">
                            Add Webhook
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
