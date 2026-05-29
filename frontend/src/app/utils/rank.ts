export type CampusRank = 'BRONZE' | 'GOLD' | 'PLATINUM'

export function getCampusRank(rank?: string, coinBalance = 0): CampusRank {
  if (coinBalance >= 1000) return 'PLATINUM'
  if (coinBalance >= 500) return 'GOLD'
  return 'BRONZE'
}

export function getRankConfig(rank?: string, coinBalance = 0) {
  const label = getCampusRank(rank, coinBalance)

  if (label === 'PLATINUM') {
    return {
      label,
      badge: 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]',
      avatar: 'bg-gradient-to-br from-slate-300 via-indigo-100 to-slate-400 dark:from-slate-700 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-slate-100 border border-indigo-200/30 dark:border-indigo-900/30',
      icon: 'text-indigo-600 dark:text-indigo-400',
    }
  }

  if (label === 'GOLD') {
    return {
      label,
      badge: 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.12)]',
      avatar: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white border border-yellow-300/40 dark:border-yellow-600/40',
      icon: 'text-amber-500',
    }
  }

  return {
    label,
    badge: 'bg-[#f4eadf] dark:bg-[#3a2418]/45 border border-[#b47a48]/40 dark:border-[#8a5a35]/45 text-[#6f4528] dark:text-[#d2a06f] shadow-[0_0_8px_rgba(111,69,40,0.08)]',
    avatar: 'bg-gradient-to-br from-[#8a5a35] via-[#6f4528] to-[#4b2f1f] text-white border border-[#8a5a35]/45 dark:border-[#b47a48]/35',
    icon: 'text-[#8a5a35] dark:text-[#d2a06f]',
  }
}
