import { useState, useEffect } from 'react';
import { Search, Bell, Coins, Award, ChevronDown, User, Settings, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onProfileClick?: () => void;
  onMobileMenuClick?: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ onProfileClick, onMobileMenuClick, onSearch }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentUser(AuthService.getCurrentUser());
    };
    window.addEventListener('user-data-updated', handleUpdate);

    // Sayfa ilk yüklendiğinde mevcut temayı kontrol et
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
    
    return () => window.removeEventListener('user-data-updated', handleUpdate);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 fixed top-0 lg:left-64 left-0 right-0 z-10 transition-colors">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>

          <div className="lg:hidden">
            <h1 className="text-slate-900">CampusNote</h1>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search course code, faculty..."
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          {/* Dark Mode Toggle Butonu */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
          </button>

          <div className="hidden sm:flex items-center gap-2 lg:gap-4 pl-3 lg:pl-6 border-l border-slate-200 dark:border-slate-700">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span className="text-sm text-amber-900 dark:text-amber-500">{currentUser?.coinBalance || 0}</span>
            </div>

            <div className="flex items-center gap-3">
              {(currentUser?.coinBalance ?? 0) > 1000 && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg">
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm text-indigo-900 dark:text-indigo-400">
                    {(currentUser?.coinBalance ?? 0) > 5000 ? 'Platinum' : 'Gold'}
                  </span>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 lg:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                >
                  <div className="hidden lg:block text-right mr-2">
                    <p className="text-sm text-slate-900 dark:text-white relative z-10 font-bold">{currentUser?.email.split('@')[0] || 'Guest'}</p>
                    <div className="flex flex-col items-end">
                      {/* FR-ST-06: Display the user's enrolled academic Department on the dashboard navigation bar */}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight">{currentUser?.departmentName || 'General'}</p>
                      {/* FR-ST-07: Display the user's current academic year on the dashboard navigation bar */}
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Year {currentUser?.year || '1'}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white">{currentUser ? currentUser.email.charAt(0).toUpperCase() : 'G'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-20">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onProfileClick?.();
                        }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                          <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">View Profile</span>
                      </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                          <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Settings</span>
                      </button>
                        <div className="my-1 border-t border-slate-200 dark:border-slate-800"></div>
                        <button onClick={() => {
                          AuthService.logout();
                          navigate('/login');
                        }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
