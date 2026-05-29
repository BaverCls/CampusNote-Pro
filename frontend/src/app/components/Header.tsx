import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Coins, Award, ChevronDown, User, Settings, LogOut, Menu, Moon, Sun, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/AuthService';
import { AppNotification, NotificationService } from '../services/NotificationService';

const NOTIFICATIONS_UPDATED_EVENT = 'notifications-updated';

interface HeaderProps {
  onProfileClick?: () => void;
  onMobileMenuClick?: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ onProfileClick, onMobileMenuClick, onSearch }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    NotificationService.getUnreadCount()
      .then(setUnreadCount)
      .catch((error) => {
        if (error instanceof Error && error.message === 'SESSION_EXPIRED') return;
        console.error('Notification unread count error:', error);
      });
  }, [currentUser?.id, currentUser?.email]);

  useEffect(() => {
    const refreshUnreadCount = () => {
      if (!AuthService.getCurrentUser()) {
        setUnreadCount(0);
        return;
      }

      NotificationService.getUnreadCount()
        .then(setUnreadCount)
        .catch((error) => {
          if (error instanceof Error && error.message === 'SESSION_EXPIRED') return;
          console.error('Notification unread count refresh error:', error);
        });
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshUnreadCount);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshUnreadCount);
  }, []);

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const loadNotifications = () => {
    if (!currentUser) return;

    setIsNotificationLoading(true);
    setNotificationError('');
    NotificationService.getNotifications()
      .then(setNotifications)
      .catch((error) => {
        if (error instanceof Error && error.message === 'SESSION_EXPIRED') return;
        console.error('Notification list error:', error);
        setNotificationError('Could not load notifications.');
      })
      .finally(() => setIsNotificationLoading(false));
  };

  const toggleNotifications = () => {
    setIsNotificationOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        setIsDropdownOpen(false);
        loadNotifications();
      }
      return nextOpen;
    });
  };

  const markNotificationAsRead = async (notification: AppNotification) => {
    if (notification.readStatus) return;
    try {
      const updated = await NotificationService.markAsRead(notification.id);
      setNotifications((items) => items.map((item) => item.id === updated.id ? updated : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') return;
      console.error('Mark notification read error:', error);
      setNotificationError('Could not update notification.');
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((items) => items.map((item) => ({ ...item, readStatus: true })));
      setUnreadCount(0);
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') return;
      console.error('Mark all notifications read error:', error);
      setNotificationError('Could not update notifications.');
    }
  };

  const formatNotificationDate = (createdAt?: string | null) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

          <div className="relative" ref={notificationRef}>
            <button
              onClick={toggleNotifications}
              className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-30">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {isNotificationLoading ? (
                    <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading notifications...
                    </div>
                  ) : notificationError ? (
                    <div className="px-4 py-6 text-sm text-red-600 dark:text-red-400">{notificationError}</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const content = (
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notification.readStatus ? 'bg-slate-300 dark:bg-slate-700' : 'bg-indigo-600'}`}></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{notification.title}</p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatNotificationDate(notification.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
                            {!notification.readStatus && (
                              <span className="inline-block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                                Mark as read
                              </span>
                            )}
                          </div>
                        </div>
                      );

                      return notification.readStatus ? (
                        <div
                          key={notification.id}
                          className="w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                        >
                          {content}
                        </div>
                      ) : (
                        <button
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification)}
                          className="w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-indigo-50/60 dark:bg-indigo-500/10"
                        >
                          {content}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/notifications');
                    }}
                    className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 lg:gap-4 pl-3 lg:pl-6 border-l border-slate-200 dark:border-slate-700">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span className="text-sm text-amber-900 dark:text-amber-500">{currentUser?.coinBalance || 0}</span>
            </div>

            <div className="flex items-center gap-3">
              {currentUser && (
                <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  (currentUser.coinBalance ?? 0) > 5000 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                    : (currentUser.coinBalance ?? 0) > 1000
                    ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.12)]'
                    : 'bg-[#f4eadf] dark:bg-[#3a2418]/45 border border-[#b47a48]/40 dark:border-[#8a5a35]/45 text-[#6f4528] dark:text-[#d2a06f] shadow-[0_0_8px_rgba(111,69,40,0.08)]'
                }`}>
                  <Award className={`w-4 h-4 ${
                    (currentUser.coinBalance ?? 0) > 5000 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : (currentUser.coinBalance ?? 0) > 1000 
                      ? 'text-amber-500' 
                      : 'text-[#8a5a35] dark:text-[#d2a06f]'
                  }`} />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {(currentUser.coinBalance ?? 0) > 5000 ? 'Platinum' : (currentUser.coinBalance ?? 0) > 1000 ? 'Gold' : 'Bronze'}
                  </span>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  data-testid="user-menu-button"
                  className="flex items-center gap-2 lg:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                >
                  <div className="hidden lg:block text-right mr-2">
                    <p className="text-sm text-slate-900 dark:text-white relative z-10 font-bold">{currentUser?.fullName || currentUser?.email.split('@')[0] || 'Guest'}</p>
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
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Settings</span>
                      </button>
                        <div className="my-1 border-t border-slate-200 dark:border-slate-800"></div>
                        <button
                          onClick={() => AuthService.logout()}
                          data-testid="logout-button"
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                        >
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
