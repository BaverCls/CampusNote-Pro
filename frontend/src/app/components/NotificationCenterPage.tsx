import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { AppNotification, NotificationService } from '../services/NotificationService';

const NOTIFICATIONS_UPDATED_EVENT = 'notifications-updated';

function formatNotificationDate(createdAt?: string | null) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function NotificationCenterPage() {
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = notifications.filter((notification) => !notification.readStatus).length;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage('');

    NotificationService.getNotifications()
      .then((data) => {
        if (isMounted) setNotifications(data);
      })
      .catch((error) => {
        if (error instanceof Error && error.message === 'SESSION_EXPIRED') return;
        if (isMounted) setErrorMessage('Could not load notifications.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const markAsRead = async (notification: AppNotification) => {
    if (notification.readStatus || updatingId) return;
    setUpdatingId(notification.id);
    setErrorMessage('');

    try {
      const updated = await NotificationService.markAsRead(notification.id);
      setNotifications((items) => items.map((item) => item.id === updated.id ? updated : item));
      window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') return;
      setErrorMessage('Could not update notification.');
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    setErrorMessage('');

    try {
      await NotificationService.markAllAsRead();
      setNotifications((items) => items.map((item) => ({ ...item, readStatus: true })));
      window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') return;
      setErrorMessage('Could not update notifications.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar activeItem="Notifications" onProfileClick={() => navigate('/profile')} />
      <Header onProfileClick={() => navigate('/profile')} onMobileMenuClick={() => setIsMobileNavOpen(true)} />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeItem="Notifications"
        onProfileClick={() => navigate('/profile')}
      />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto p-4 lg:p-8" style={{ maxWidth: "clamp(900px, 85%, 1100px)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-slate-900 dark:text-white">Notifications</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
                Review account and document updates in one place
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to dashboard
              </button>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0 || isMarkingAll}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Mark all as read
              </button>
            </div>
          </div>

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notification center</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
              </div>
            </div>

            {errorMessage && (
              <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-20 px-6 text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No notifications yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Document review and moderation updates will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification) => {
                  const isUpdating = updatingId === notification.id;
                  const content = (
                    <>
                      <span className={`mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0 ${notification.readStatus ? 'bg-slate-300 dark:bg-slate-700' : 'bg-indigo-600'}`}></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                          <h4 className={`text-sm ${notification.readStatus ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{formatNotificationDate(notification.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                        {!notification.readStatus && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-3">
                            {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
                            Mark as read
                          </span>
                        )}
                      </div>
                    </>
                  );

                  return notification.readStatus ? (
                    <div key={notification.id} className="flex items-start gap-4 px-5 py-4 bg-white dark:bg-slate-900">
                      {content}
                    </div>
                  ) : (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification)}
                      disabled={Boolean(updatingId)}
                      className="w-full flex items-start gap-4 px-5 py-4 text-left bg-indigo-50/60 dark:bg-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-colors disabled:cursor-wait"
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
