import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { AuthService } from '../services/AuthService';
import { UserData, UserService } from '../services/UserService';
import { FacultyMeta, MetaService } from '../services/MetaService';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [faculties, setFaculties] = useState<FacultyMeta[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  useEffect(() => {
    MetaService.getFaculties()
      .then((data) => {
        setFaculties(data);
        const engineering = data.find((f) => f.name.toLowerCase().includes('engineering')) ?? data[0];
        const fallbackId = engineering ? engineering.id : null;
        const userFacultyId = currentUser?.role !== 'ADMIN' ? currentUser?.facultyId ?? null : null;
        setSelectedFacultyId(userFacultyId ?? fallbackId);
      })
      .catch(() => {
        setFaculties([]);
        setErrorMessage('Something went wrong while loading faculties.');
      });
  }, [currentUser?.facultyId, currentUser?.role]);

  useEffect(() => {
    if (!selectedFacultyId) return;
    setLoading(true);
    setErrorMessage('');
    const facultyName = faculties.find((f) => f.id === selectedFacultyId)?.name ?? 'Engineering';
    UserService.getLeaderboardForFaculty(facultyName)
      .then((data) => setUsers(data))
      .catch(() => {
        setUsers([]);
        setErrorMessage('Something went wrong while loading the leaderboard.');
      })
      .finally(() => setLoading(false));
  }, [selectedFacultyId, faculties]);

  const selectedFacultyName = useMemo(
    () => faculties.find((f) => f.id === selectedFacultyId)?.name ?? 'Engineering Faculty',
    [faculties, selectedFacultyId]
  );

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar activeItem="Leaderboard" onProfileClick={() => navigate('/profile')} />
      <Header onProfileClick={() => navigate('/profile')} onMobileMenuClick={() => setIsMobileNavOpen(true)} />
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} activeItem="Leaderboard" onProfileClick={() => navigate('/profile')} />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto p-4 lg:p-8" style={{ maxWidth: 'clamp(900px, 85%, 1400px)' }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Leaderboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Top contributors by faculty coin balance.</p>
            <select
              value={selectedFacultyId ?? ''}
              onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            >
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Showing: {selectedFacultyName}</p>
            {errorMessage && (
              <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">{errorMessage}</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40">
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">Rank</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">Tier</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500 text-right">Coins</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-6 py-8 text-slate-500" colSpan={5}>Loading leaderboard...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td className="px-6 py-8 text-slate-500" colSpan={5}>No data yet. Try changing your filters.</td></tr>
                ) : (
                  users.map((user, idx) => {
                    const tierLabel = user.coinBalance > 5000 ? 'Platinum' : user.coinBalance > 1000 ? 'Gold' : 'Bronze';
                    const tierClasses = user.coinBalance > 5000
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                      : user.coinBalance > 1000
                      ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                      : 'bg-[#f4eadf] dark:bg-[#3a2418]/45 border border-[#b47a48]/40 dark:border-[#8a5a35]/45 text-[#6f4528] dark:text-[#d2a06f]';
                    const departmentLabel = user.departmentName || user.facultyName || 'N/A';
                    return (
                      <tr key={user.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">#{idx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{user.fullName || user.email.split('@')[0]}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{departmentLabel}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${tierClasses}`}>
                            {tierLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-amber-600">{user.coinBalance.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
