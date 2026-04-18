'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronRight,
  UserPlus,
  FileText,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'
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

// ── Quick Action items that fan out from FAB ──
const quickActions = [
  {
    id: 'add-member',
    label: 'Add Member',
    icon: UserPlus,
    path: '/members/new',
    color: 'bg-ocean-500',
    shadowColor: 'shadow-ocean-500/30',
  },
  {
    id: 'create-invoice',
    label: 'New Invoice',
    icon: FileText,
    path: '/invoices/new',
    color: 'bg-primary-500',
    shadowColor: 'shadow-primary-500/30',
  },
]

export function MobileBottomDock({ plan, trialExpiresAt, role, isExpired, userEmail }: MobileBottomDockProps) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isFabOpen, setIsFabOpen] = useState(false)

  const haptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])

  const handleNavTap = (path: string) => {
    haptic()
    router.push(`/${slug}${path}`)
  }

  const handleFabTap = () => {
    haptic()
    setIsFabOpen((prev) => !prev)
  }

  const handleQuickAction = (path: string) => {
    haptic()
    setIsFabOpen(false)
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
      {/* ── FAB Quick Action Overlay ── */}
      <AnimatePresence>
        {isFabOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="fab-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px] md:hidden"
              onClick={() => setIsFabOpen(false)}
            />

            {/* Quick action buttons — fan out from center-bottom */}
            <div className="fixed bottom-0 inset-x-0 z-[56] md:hidden pointer-events-none">
              <div className="relative max-w-lg mx-auto h-[240px]">
                {quickActions.map((action, i) => {
                  // Position: fan out symmetrically from center
                  // For 2 items: left-of-center, right-of-center
                  const angleOffset = quickActions.length === 2 ? [-35, 35] : [-45, 0, 45]
                  const angle = angleOffset[i] ?? 0
                  const radius = 110 // distance from FAB
                  const radians = ((angle - 90) * Math.PI) / 180
                  const xPos = Math.cos(radians) * radius
                  const yPos = Math.sin(radians) * radius

                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: xPos,
                        y: yPos,
                      }}
                      exit={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 22,
                        delay: i * 0.06,
                      }}
                      className={cn(
                        'pointer-events-auto absolute flex flex-col items-center gap-2',
                        'active:scale-90 transition-transform duration-100',
                      )}
                      style={{
                        // Anchor point: center-bottom of the dock area
                        left: '50%',
                        bottom: '90px', // just above the FAB
                        marginLeft: '-28px', // half of button width
                      }}
                      onClick={() => handleQuickAction(action.path)}
                      aria-label={action.label}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg',
                          action.color,
                          action.shadowColor,
                        )}
                      >
                        <action.icon className="h-6 w-6 text-white" strokeWidth={2} />
                      </div>
                      <span className="text-[11px] font-bold text-white tracking-tight drop-shadow-sm whitespace-nowrap">
                        {action.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Dock — only visible on mobile ── */}
      <nav
        id="mobile-bottom-dock"
        className="fixed bottom-0 inset-x-0 z-[57] md:hidden dock-glass"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-[68px] px-2 max-w-lg mx-auto">
          {dockItems.map((item) => {
            // ── FAB center button ──
            if (item.id === 'fab') {
              return (
                <motion.button
                  key={item.id}
                  onClick={handleFabTap}
                  className={cn(
                    'relative -mt-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-shadow duration-200',
                    isFabOpen
                      ? 'bg-drift-800 shadow-drift-800/30'
                      : 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary/30',
                  )}
                  aria-label={isFabOpen ? 'Close quick actions' : 'Open quick actions'}
                  whileTap={{ scale: 0.85 }}
                >
                  <motion.div
                    animate={{ rotate: isFabOpen ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
                  </motion.div>
                  {/* Pulse ring — only when closed */}
                  {!isFabOpen && (
                    <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
                  )}
                </motion.button>
              )
            }

            // ── "More" button ──
            if (item.id === 'more') {
              return (
                <button
                  key={item.id}
                  onClick={() => { setIsFabOpen(false); setIsMoreOpen(true) }}
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

            // ── Regular nav items ──
            const active = isActive(item.path)
            return (
              <button
                key={item.id}
                onClick={() => { setIsFabOpen(false); handleNavTap(item.path) }}
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

      {/* ── "More" Sheet ── */}
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
