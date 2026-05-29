import { useState, useEffect } from 'react';
import { Crown, Medal, Award, Loader2, RefreshCcw } from 'lucide-react';
import { UserService, UserData } from '../services/UserService';
import { useNavigate } from 'react-router-dom';
import { getRankConfig } from '../utils/rank';

interface LeaderboardWidgetProps {
  isLoading?: boolean;
}

export function LeaderboardWidget({ isLoading: externalLoading }: LeaderboardWidgetProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLeaderboard = async () => {
    setError(false);
    try {
      const data = await UserService.getLeaderboard();
      const contributors = (data || [])
        .filter((u) => {
          const username = u.email?.split('@')?.[0]?.toLowerCase() || '';
          const fullName = (u.fullName || '').toLowerCase();
          const role = (u.role || '').toLowerCase();
          return (
            role !== 'admin' &&
            username !== 'system_admin' &&
            fullName !== 'system_admin' &&
            !fullName.includes('system admin')
          );
        })
        .sort((a, b) => (b.coinBalance || 0) - (a.coinBalance || 0))
        .slice(0, 3);

      setUsers(contributors);
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-amber-500" />;
      case 2: return <Medal className="w-5 h-5 text-slate-400 dark:text-slate-300" />;
      case 3: return <Award className="w-5 h-5 text-amber-700 dark:text-amber-600" />;
      default: return <div className="w-5 h-5 text-xs text-slate-400 flex items-center justify-center font-bold">{position}</div>;
    }
  };

  const isLoading = (externalLoading || loading) && users.length === 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-slate-900 dark:text-white font-bold tracking-tight">Top Contributors</h3>
          {error && <RefreshCcw className="w-3 h-3 text-red-500 animate-spin" />}
        </div>
        <button 
          onClick={() => navigate('/leaderboard')}
          className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 px-2 py-1 rounded-lg font-black uppercase transition-colors"
        >
          View All
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 animate-pulse">
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
             <Award className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-xs text-slate-500 font-medium italic">No contributors yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => {
            const rankConfig = getRankConfig(user.rank, user.coinBalance);
            return (
              <div
                key={user.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 group"
              >
                <div className="flex-shrink-0 w-6 flex justify-center">
                  {getPositionIcon(index + 1)}
                </div>
                <div className="relative">
                  <div className={`w-10 h-10 ${rankConfig.avatar} rounded-full flex items-center justify-center font-black text-sm shadow-md group-hover:scale-110 transition-transform`}>
                    {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-white dark:border-slate-900">
                      <Crown className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
                  <p className="text-sm text-slate-900 dark:text-white truncate font-bold">{user.fullName || user.email.split('@')[0]}</p>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${rankConfig.badge}`}>
                    {rankConfig.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-amber-600 dark:text-amber-500">{user.coinBalance.toLocaleString()}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">coins</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
