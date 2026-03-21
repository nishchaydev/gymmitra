"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
    Building2, 
    QrCode, 
    Users, 
    ClipboardList, 
    CreditCard, 
    Bell, 
    Upload,
    ChevronRight
} from "lucide-react"

interface SettingsSidebarProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    slug: string
}

export function SettingsSidebar({ activeTab, setActiveTab, slug }: SettingsSidebarProps) {
    const items = [
        {
            id: 'profile',
            label: 'General',
            icon: Building2,
            description: 'Gym profile & identity'
        },
        {
            id: 'staff',
            label: 'Staff Members',
            icon: Users,
            description: 'Manage gym team'
        },
        {
            id: 'billing',
            label: 'Billing',
            icon: CreditCard,
            description: 'Subscription & usage'
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: Bell,
            description: 'Alerts & updates'
        },
        {
            id: 'import-members',
            label: 'Import Members',
            icon: Upload,
            description: 'Bulk import via CSV'
        },
        {
            id: 'qr-poster',
            label: 'QR Poster',
            icon: QrCode,
            description: 'Branded QR designs'
        },
        {
            id: 'whatsapp',
            label: 'WA Templates',
            icon: ClipboardList,
            description: 'Automated messaging'
        },
        {
            id: 'plans',
            label: 'Membership Plans',
            icon: ClipboardList,
            description: 'Define & manage plans'
        }
    ]

    return (
        <nav className="flex flex-col space-y-1">
            {items.map((item) => (
                <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                        "w-full justify-start items-center px-4 py-6 rounded-xl transition-all duration-200 group relative",
                        activeTab === item.id 
                            ? "bg-primary/5 text-primary shadow-sm ring-1 ring-primary/10" 
                            : "hover:bg-slate-50 text-slate-600"
                    )}
                    onClick={() => setActiveTab(item.id)}
                >
                    <div className={cn(
                        "p-2 rounded-lg mr-3 transition-colors",
                        activeTab === item.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    )}>
                        <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                        <span className="font-semibold text-sm">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-medium truncate w-full">{item.description}</span>
                    </div>
                    {activeTab === item.id && (
                        <div className="absolute right-3">
                            <ChevronRight className="h-4 w-4 opacity-50" />
                        </div>
                    )}
                </Button>
            ))}
        </nav>
    )
}
