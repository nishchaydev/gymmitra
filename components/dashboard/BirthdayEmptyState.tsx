import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Cake, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type BirthdayEmptyStateProps = {
  hasData: boolean
  totalMembers: number
  membersWithDob: number
  gymName: string
  slug: string
}

export function BirthdayEmptyState({ 
  hasData, 
  totalMembers, 
  membersWithDob, 
  gymName, 
  slug 
}: BirthdayEmptyStateProps) {
  const missingDobCount = totalMembers - membersWithDob
  const hasAnyData = membersWithDob > 0
  
  if (!hasData && totalMembers === 0) {
    // No members at all
    return (
      <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group/card hover:shadow-indigo-500/10 transition-all duration-500 h-full">
        <CardHeader className="bg-gradient-to-r from-pink-50/30 to-transparent px-6 py-6 border-b border-drift-100/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2.5 text-lg font-black text-slate-900 uppercase tracking-tight">
                <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                Birthdays
              </CardTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Upcoming celebrations</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100/50 shadow-sm">
              <Cake className="h-5 w-5 text-pink-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6 px-6">
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <Cake className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              No members yet
            </p>
            <p className="text-xs text-slate-500 text-center">
              Add your first member to start tracking birthdays
            </p>
            <Link href={`/${slug}/members/new`}>
              <Button size="sm" className="w-full mt-4">
                Add First Member
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasAnyData) {
    // Has members but none have DOB
    return (
      <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group/card hover:shadow-indigo-500/10 transition-all duration-500 h-full">
        <CardHeader className="bg-gradient-to-r from-pink-50/30 to-transparent px-6 py-6 border-b border-drift-100/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2.5 text-lg font-black text-slate-900 uppercase tracking-tight">
                <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                Birthdays
              </CardTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Upcoming celebrations</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100/50 shadow-sm">
              <Cake className="h-5 w-5 text-pink-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6 px-6">
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-pink-500" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              No birthdays to show
            </p>
            <p className="text-xs text-slate-500 text-center">
              {missingDobCount} members are missing date of birth. Add DOB to member profiles to start wishing them.
            </p>
            <Link href={`/${slug}/members`}>
              <Button size="sm" className="w-full mt-4">
                Complete Member Profiles
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Has some data but not all
  return (
    <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group/card hover:shadow-indigo-500/10 transition-all duration-500 h-full">
      <CardHeader className="bg-gradient-to-r from-pink-50/30 to-transparent px-6 py-6 border-b border-drift-100/30">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2.5 text-lg font-black text-slate-900 uppercase tracking-tight">
              <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              Birthdays
            </CardTitle>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Upcoming celebrations</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100/50 shadow-sm">
            <Cake className="h-5 w-5 text-pink-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-6 px-6">
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-pink-500 animate-spin" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Loading birthdays...
          </p>
          <p className="text-xs text-slate-500 text-center">
            {membersWithDob} of {totalMembers} members have date of birth set
          </p>
        </div>
      </CardContent>
    </Card>
  )
}