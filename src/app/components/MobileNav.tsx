import { Home, BookOpen, TrendingUp, Trophy, X, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: string;
  onProfileClick?: () => void;
}

export function MobileNav({ isOpen, onClose, activeItem = 'Dashboard', onProfileClick }: MobileNavProps) {
  const navigate = useNavigate();
  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'My Faculty', id: 'MyFaculty', path: '#' },
    { icon: TrendingUp, label: 'Top Documents', id: 'TopDocuments', path: '#' },
    { icon: Trophy, label: 'Leaderboard', id: 'Leaderboard', path: '#' },
    { icon: Shield, label: 'Admin', id: 'Admin', path: '/admin' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      ></div>

      <div className="fixed top-0 left-0 w-64 h-screen bg-slate-900 z-50 lg:hidden flex flex-col p-6 transform transition-transform">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-xl">CampusNote Pro</h1>
            <p className="text-slate-400 text-sm mt-1">Academic Repository</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onClose();
                      if (item.path !== '#') navigate(item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onProfileClick?.();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-4"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">SC</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-white">Sarah Chen</p>
              <p className="text-xs text-slate-400">View Profile</p>
            </div>
          </button>

          <div className="text-slate-400 text-sm">
            <p>Version 2.1.0</p>
            <p className="mt-1">© 2026 CampusNote</p>
          </div>
        </div>
      </div>
    </>
  );
}
