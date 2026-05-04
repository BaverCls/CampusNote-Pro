import { Crown, Medal, Award } from 'lucide-react';
import { topUsers } from '../mockData';

interface LeaderboardWidgetProps {
  isLoading?: boolean;
}

export function LeaderboardWidget({ isLoading }: LeaderboardWidgetProps) {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-amber-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400 dark:text-slate-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-700 dark:text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Platinum':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500';
      case 'Gold':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500';
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900 dark:text-white">Top Contributors</h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
          View All
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 animate-pulse">
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-1.5"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-10 mb-1.5"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {topUsers.map((user) => (
            <div
              key={user.position}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex-shrink-0">
                {getPositionIcon(user.position)}
              </div>
              <div className="relative">
                <div
                  className={`w-12 h-12 ${getRankColor(
                    user.rank
                  )} rounded-full flex items-center justify-center`}
                >
                  <span className="text-white">{user.name.charAt(0)}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-100 dark:border-slate-900">
                  <span className="text-xs dark:text-white">{user.position}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.rank} Rank</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-amber-600 dark:text-amber-400">{user.coins.toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">coins</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
