'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import Link from 'next/link'
import { IndianRupee, Users, TrendingUp, CalendarCheck } from 'lucide-react'

interface MetricCard {
  id: string
  label: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  href: string
  color: string
  bgClass: string
  iconBgClass: string
  badgeText?: string
  badgeClass?: string
}

interface SwipeableMetricCardsProps {
  slug: string
  revenue: string
  activeMembers: number
  totalMembers: number
  netIncome: number
  expenseRatio: number
  dailyCheckins: number
  isDemo: boolean
}

export function SwipeableMetricCards({
  slug,
  revenue,
  activeMembers,
  totalMembers,
  netIncome,
  expenseRatio,
  dailyCheckins,
  isDemo,
}: SwipeableMetricCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [containerWidth, setContainerWidth] = useState(0)

  const cards: MetricCard[] = [
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: `₹${revenue}`,
      icon: IndianRupee,
      href: `/${slug}/invoices`,
      color: 'text-primary-500',
      bgClass: 'from-primary-500/[0.06] to-primary-500/[0.01]',
      iconBgClass: 'bg-primary-50',
      badgeText: isDemo ? undefined : 'LIVE',
      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100/80',
    },
    {
      id: 'members',
      label: 'Active Members',
      value: activeMembers,
      subtitle: `${totalMembers} total · ${totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}% active`,
      icon: Users,
      href: `/${slug}/members`,
      color: 'text-ocean-500',
      bgClass: 'from-ocean-500/[0.06] to-ocean-500/[0.01]',
      iconBgClass: 'bg-ocean-50',
    },
    {
      id: 'income',
      label: 'Net Income',
      value: `₹${netIncome.toLocaleString('en-IN')}`,
      subtitle: `${expenseRatio.toFixed(1)}% expense ratio`,
      icon: TrendingUp,
      href: `/${slug}/invoices`,
      color: 'text-midnight-500',
      bgClass: 'from-midnight-500/[0.06] to-midnight-500/[0.01]',
      iconBgClass: 'bg-midnight-50',
    },
    {
      id: 'checkins',
      label: "Today's Check-ins",
      value: dailyCheckins,
      icon: CalendarCheck,
      href: `/${slug}/attendance`,
      color: 'text-amber-600',
      bgClass: 'from-amber-500/[0.06] to-amber-500/[0.01]',
      iconBgClass: 'bg-amber-50',
      badgeText: isDemo ? undefined : 'REAL-TIME',
      badgeClass: 'bg-amber-50 text-amber-600 border-amber-100/80',
    },
  ]

  // Measure container width for drag constraints
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Reset carousel position on mount (fixes stale position on navigate-back)
  useEffect(() => {
    setActiveIndex(0)
    x.set(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync x with current activeIndex when containerWidth re-measures
  useEffect(() => {
    if (containerWidth > 0 && activeIndex > 0) {
      const CARD_GAP_SYNC = 12
      const CARD_WIDTH_SYNC = containerWidth - 40
      x.set(-(activeIndex * (CARD_WIDTH_SYNC + CARD_GAP_SYNC)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth])

  const CARD_GAP = 12
  const CARD_WIDTH = containerWidth - 40 // 20px padding each side for peek
  const totalDrag = (CARD_WIDTH + CARD_GAP) * (cards.length - 1)

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x
    const threshold = CARD_WIDTH / 4

    let newIndex = activeIndex

    if (offset < -threshold || velocity < -500) {
      newIndex = Math.min(activeIndex + 1, cards.length - 1)
    } else if (offset > threshold || velocity > 500) {
      newIndex = Math.max(activeIndex - 1, 0)
    }

    setActiveIndex(newIndex)
    animate(x, -(newIndex * (CARD_WIDTH + CARD_GAP)), {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    })
  }

  const goToCard = (index: number) => {
    setActiveIndex(index)
    animate(x, -(index * (CARD_WIDTH + CARD_GAP)), {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    })
  }

  // Opacity transform for "Updated" text
  const cardOpacity = (index: number) => {
    return index === activeIndex ? 1 : 0.6
  }

  return (
    <div className="w-full overflow-hidden -mx-4 px-0" ref={containerRef}>
      {/* Cards carousel */}
      <motion.div
        className="flex cursor-grab active:cursor-grabbing"
        style={{ x, paddingLeft: 20, paddingRight: 20 }}
        drag="x"
        dragConstraints={{ left: -totalDrag, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="flex-shrink-0"
            style={{
              width: CARD_WIDTH || '85vw',
              marginRight: index < cards.length - 1 ? CARD_GAP : 0,
              opacity: cardOpacity(index),
            }}
          >
            <Link href={card.href} className="block" draggable={false}>
              <div className={`group relative overflow-hidden border border-drift-100 bg-white shadow-sm rounded-2xl active:scale-[0.97] transition-transform duration-200`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgClass}`} />
                <div className="relative p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold text-drift-500 uppercase tracking-[0.15em]">
                      {card.label}
                    </span>
                    <div className={`${card.iconBgClass} rounded-xl p-2 shadow-sm`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-3xl font-bold tracking-tight text-slate-900 truncate">
                    {card.value}
                  </div>

                  {/* Subtitle or badge */}
                  <div className="mt-2.5">
                    {card.subtitle ? (
                      <p className="text-[11px] text-drift-400 font-semibold tracking-tight">
                        {card.subtitle}
                      </p>
                    ) : card.badgeText ? (
                      <div className={`flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full border ${card.badgeClass}`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                          {card.badgeText}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-4 pb-1">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className={`rounded-full transition-all duration-300 ${
              index === activeIndex
                ? 'w-6 h-1.5 bg-primary-500'
                : 'w-1.5 h-1.5 bg-drift-300 hover:bg-drift-400'
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
