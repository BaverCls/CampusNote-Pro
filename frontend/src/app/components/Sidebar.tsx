import React, { useState, useEffect } from 'react';
import { Home, BookOpen, TrendingUp, Trophy, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/AuthService';

interface SidebarProps {
  activeItem?: string;
  onProfileClick?: () => void;
}

export function Sidebar({ activeItem = 'Dashboard', onProfileClick }: SidebarProps) {
  const navigate = useNavigate();
  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'My Faculty', id: 'MyFaculty', path: '#' },
    { icon: TrendingUp, label: 'Top Documents', id: 'TopDocuments', path: '#' },
    { icon: Trophy, label: 'Leaderboard', id: 'Leaderboard', path: '/leaderboard' },
    ...(AuthService.isAdmin() ? [{ icon: Shield, label: 'Admin Panel', id: 'Admin', path: '/admin' }] : []),
  ];

  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentUser(AuthService.getCurrentUser());
    };
    window.addEventListener('user-data-updated', handleUpdate);
    return () => window.removeEventListener('user-data-updated', handleUpdate);
  }, []);

  return (
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 flex-col p-6 hidden lg:flex">
      <div className="mb-8">
        <h1 className="text-white text-xl">CampusNote Pro</h1>
        <p className="text-slate-400 text-sm mt-1">Academic Repository</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => item.path !== '#' && navigate(item.path)}
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
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-4"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">{currentUser ? currentUser.email.charAt(0).toUpperCase() : 'G'}</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm text-white">{currentUser?.email.split('@')[0] || 'Guest'}</p>
            <p className="text-xs text-slate-400">View Profile</p>
          </div>
        </button>

        <div className="text-slate-400 text-sm">
          <p>Version 2.1.0</p>
          <p className="mt-1">© 2026 CampusNote</p>
        </div>
      </div>
    </div>
  );
}
