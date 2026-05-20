import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User, Mail, GraduationCap, Calendar, Shield, Coins, Award } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { AuthService } from '../services/AuthService';

function formatRole(role?: string) {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'STUDENT') return 'Student';
  return 'Not set';
}

function formatAccountDate(createdAt?: string) {
  if (!createdAt) return 'Not available yet';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Not available yet';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getProfileCompletion(user: ReturnType<typeof AuthService.getCurrentUser>) {
  const fields = [
    { label: 'name', complete: Boolean(user?.fullName?.trim()) },
    { label: 'email', complete: Boolean(user?.email?.trim()) },
    { label: 'university', complete: Boolean(user?.university?.trim()) },
    { label: 'faculty', complete: Boolean(user?.facultyName || user?.facultyId) },
    { label: 'department', complete: Boolean(user?.departmentName || user?.departmentId) },
    { label: 'year', complete: Boolean(user?.year) },
  ];
  const completed = fields.filter((field) => field.complete).length;
  const missing = fields.filter((field) => !field.complete).map((field) => field.label);
  return { completed, total: fields.length, percent: Math.round((completed / fields.length) * 100), missing };
}

function SettingField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className="text-sm font-semibold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  if (!currentUser) return null;

  const displayName = currentUser.fullName || currentUser.email.split('@')[0];
  const hasCoins = currentUser.coinBalance !== undefined && currentUser.coinBalance !== null;
  const rank = currentUser.rank;
  const completion = getProfileCompletion(currentUser);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar activeItem="Settings" onProfileClick={() => navigate('/profile')} />
      <Header onProfileClick={() => navigate('/profile')} onMobileMenuClick={() => setIsMobileNavOpen(true)} />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeItem="Settings"
        onProfileClick={() => navigate('/profile')}
      />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto p-4 lg:p-8" style={{ maxWidth: "clamp(900px, 85%, 1100px)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-slate-900 dark:text-white">Settings</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
                Review your account preferences and profile details
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-lg font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{displayName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SettingField label="Name" value={displayName} />
                <SettingField label="Email" value={currentUser.email} />
                <SettingField label="University" value={currentUser.university || 'Not set'} />
                <SettingField label="Faculty" value={currentUser.facultyName || 'Not set'} />
                <SettingField label="Department" value={currentUser.departmentName || 'Not set'} />
                <SettingField label="Year" value={currentUser.year ? `Year ${currentUser.year}` : 'Not set'} />
                <SettingField label="Role" value={formatRole(currentUser.role)} />
                <SettingField label="Account Created" value={formatAccountDate(currentUser.createdAt)} />
                <SettingField label="CampusCoin" value={hasCoins ? `${currentUser.coinBalance.toLocaleString()} C` : 'Not available yet'} />
                <SettingField label="Rank" value={rank || 'Not available yet'} />
              </div>
            </section>

            <aside className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile completion</h3>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{completion.percent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${completion.percent}%` }}></div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {completion.completed}/{completion.total} completed
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {completion.missing.length > 0 ? `Missing: ${completion.missing.join(', ')}` : 'All required profile details are complete.'}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Coins className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">CampusCoin</h3>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {hasCoins ? currentUser.coinBalance.toLocaleString() : 'Not available yet'}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Earn coins by publishing notes and helping classmates.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rank</h3>
                </div>
                <div className="text-lg font-black uppercase text-slate-900 dark:text-white">
                  {rank || 'Not available yet'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile editing</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Profile editing is available from your profile page. Settings keeps account details read-only for now.
                </p>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  View profile
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Password and security preferences are coming soon.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                  <Mail className="w-4 h-4 text-slate-400 mx-auto mb-2" />
                  <div className="text-[10px] font-bold uppercase text-slate-400">Email</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                  <GraduationCap className="w-4 h-4 text-slate-400 mx-auto mb-2" />
                  <div className="text-[10px] font-bold uppercase text-slate-400">Academic</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                  <Calendar className="w-4 h-4 text-slate-400 mx-auto mb-2" />
                  <div className="text-[10px] font-bold uppercase text-slate-400">Year</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
