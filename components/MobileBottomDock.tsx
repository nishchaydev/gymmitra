'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Plus,
  IndianRupee,
  MoreHorizontal,
  ShoppingBag,
  Receipt,
  CalendarCheck,
  Settings,
  LogOut,
  X,
  ChevronRight,
  UserPlus,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface MobileBottomDockProps {
  plan?: string
  trialExpiresAt?: string | null
  role?: string
  isExpired?: boolean
  userEmail?: string
}

const dockItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'members', label: 'Members', icon: Users, path: '/members' },
  { id: 'fab', label: '', icon: Plus, path: '' },
  { id: 'invoices', label: 'Payments', icon: IndianRupee, path: '/invoices' },
  { id: 'more', label: 'More', icon: MoreHorizontal, path: '' },
] as const

const moreItems = [
  { label: 'Products', icon: ShoppingBag, path: '/products' },
  { label: 'Expenses', icon: Receipt, path: '/expenses' },
  { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
  { label: 'Add Member', icon: UserPlus, path: '/members/new' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

export function MobileBottomDock({ plan, trialExpiresAt, role, isExpired, userEmail }: MobileBottomDockProps) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const handleNavTap = (path: string) => {
    // Subtle haptic feedback on supported devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    router.push(`/${slug}${path}`)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsMoreOpen(false)
    router.push('/')
    router.refresh()
  }

  const isActive = (path: string) => {
    if (!path) return false
    const fullPath = `/${slug}${path}`
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`)
  }

  // Trial badge
  const trialDaysLeft = trialExpiresAt
    ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <>
      {/* Dock - only visible on mobile */}
      <nav
        id="mobile-bottom-dock"
        className="fixed bottom-0 inset-x-0 z-50 md:hidden dock-glass"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-[68px] px-2 max-w-lg mx-auto">
          {dockItems.map((item) => {
            // FAB center button
            if (item.id === 'fab') {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavTap('/checkin')}
                  className="relative -mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary/30 active:scale-90 transition-transform duration-150"
                  aria-label="Quick Check-in"
                >
                  <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
                </button>
              )
            }

            // "More" button  
            if (item.id === 'more') {
              return (
                <button
                  key={item.id}
                  onClick={() => setIsMoreOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 group active:scale-90 transition-transform duration-150"
                  aria-label="More options"
                >
                  <div className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200',
                    isMoreOpen ? 'bg-primary-50' : ''
                  )}>
                    <item.icon className={cn(
                      'h-[22px] w-[22px] transition-colors duration-200',
                      isMoreOpen ? 'text-primary-500' : 'text-drift-400'
                    )} />
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold tracking-tight transition-colors duration-200',
                    isMoreOpen ? 'text-primary-500' : 'text-drift-400'
                  )}>
                    {item.label}
                  </span>
                </button>
              )
            }

            // Regular nav items
            const active = isActive(item.path)
            return (
              <button
                key={item.id}
                onClick={() => handleNavTap(item.path)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 group active:scale-90 transition-transform duration-150"
              >
                <div className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200',
                  active ? 'bg-primary-50' : ''
                )}>
                  <item.icon className={cn(
                    'h-[22px] w-[22px] transition-colors duration-200',
                    active ? 'text-primary-500' : 'text-drift-400 group-hover:text-drift-600'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold tracking-tight transition-colors duration-200',
                  active ? 'text-primary-500' : 'text-drift-400'
                )}>
                  {item.label}
                </span>
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary-500" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* "More" Sheet */}
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[70vh]" showCloseButton={false}>
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-3">
            <div className="w-10 h-1 rounded-full bg-drift-300" />
          </div>

          <SheetHeader className="px-5 pb-3">
            <SheetTitle className="text-lg font-bold text-drift-900 tracking-tight">
              Menu
            </SheetTitle>
            <SheetDescription className="text-xs text-drift-400">
              {userEmail || 'Gym Owner'} · {role || 'Staff'}
            </SheetDescription>
          </SheetHeader>

          {/* Trial badge */}
          {plan === 'TRIAL' && (
            <div className="mx-5 mb-3">
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold',
                isExpired
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-amber-50 text-amber-600 border border-amber-100'
              )}>
                {isExpired ? '⚠️ Trial Expired' : `⏳ Trial · ${trialDaysLeft} days left`}
              </div>
            </div>
          )}

          {/* Nav items */}
          <div className="px-3 space-y-1">
            {moreItems.map((item) => {
              const active = isActive(item.path)
              return (
                <SheetClose asChild key={item.path}>
                  <Link
                    href={`/${slug}${item.path}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-primary-50 text-primary-600 font-bold'
                        : 'text-drift-700 hover:bg-drift-50 active:bg-drift-100'
                    )}
                  >
                    <item.icon className={cn(
                      'h-5 w-5',
                      active ? 'text-primary-500' : 'text-drift-400'
                    )} />
                    {item.label}
                    <ChevronRight className="h-4 w-4 text-drift-300 ml-auto" />
                  </Link>
                </SheetClose>
              )
            })}
          </div>

          {/* Logout */}
          <div className="px-3 mt-4 pt-3 border-t border-drift-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors duration-150 w-full"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
