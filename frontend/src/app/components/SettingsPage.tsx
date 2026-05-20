import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User, Mail, GraduationCap, Calendar, Shield } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { AuthService } from '../services/AuthService';

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
                <SettingField label="Faculty" value={currentUser.facultyName || 'Not set'} />
                <SettingField label="Department" value={currentUser.departmentName || 'Not set'} />
                <SettingField label="Year" value={currentUser.year ? `Year ${currentUser.year}` : 'Not set'} />
                <SettingField label="Role" value={currentUser.role || 'STUDENT'} />
              </div>
            </section>

            <aside className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile editing</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Profile editing will be available soon from this settings area.
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
