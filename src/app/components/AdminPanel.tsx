"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Flag,
  Settings,
  Database,
  AlertTriangle,
  Search,
  Ban,
  Eye,
  Trash2,
  CheckCircle,
  Activity,
  FileText,
  Shield,
  Menu,
  X
} from 'lucide-react';

// --- MOCK DATA ---
const mockUsers = [
  { id: '1', name: 'Sarah Chen', email: 'schen@arel.edu.tr', status: 'Active', joined: '2025-09-12' },
  { id: '2', name: 'Mehmet Yılmaz', email: 'myilmaz@arel.edu.tr', status: 'Active', joined: '2025-10-05' },
  { id: '3', name: 'Ayşe Demir', email: 'ademir@arel.edu.tr', status: 'Suspended', joined: '2025-11-20' },
  { id: '4', name: 'John Doe', email: 'jdoe@arel.edu.tr', status: 'Active', joined: '2026-01-15' },
];

const mockReportedDocs = [
  { id: '101', title: 'Advanced Algorithms Midterm', uploader: 'John Doe', reports: 5, aiScore: 42 },
  { id: '102', title: 'Physics 101 Formulas', uploader: 'Mehmet Yılmaz', reports: 3, aiScore: 68 },
  { id: '103', title: 'Database Systems Final Notes', uploader: 'Ayşe Demir', reports: 8, aiScore: 25 },
];

const mockAuditLogs = [
  { id: 'a1', action: 'Admin suspended User Ayşe Demir', admin: 'SuperAdmin', date: '2 hours ago' },
  { id: 'a2', action: 'Admin deleted Document "Calculus Cheat Sheet"', admin: 'Moderator_1', date: '5 hours ago' },
  { id: 'a3', action: 'Admin updated AI Threshold to 75', admin: 'SuperAdmin', date: '1 day ago' },
  { id: 'a4', action: 'Admin ignored report for "History Notes"', admin: 'Moderator_2', date: '1 day ago' },
];

export function AdminPanel() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aiThreshold, setAiThreshold] = useState(70);
  const [searchQuery, setSearchQuery] = useState('');

  const activeMenu = 'Dashboard'; // Mock active state

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', id: 'Dashboard' },
    { icon: Users, label: 'User Management', id: 'Users' },
    { icon: Flag, label: 'Reported Docs', id: 'Reports' },
    { icon: Settings, label: 'System Settings', id: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* --- SIDEBAR --- */}
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 flex flex-col p-6 transform transition-transform lg:translate-x-0 lg:static lg:h-screen ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-500" />
              Admin Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1">System Control</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <li key={item.id}>
                  <button
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
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Back to App</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-slate-900 dark:text-white font-medium">Admin Dashboard</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="mx-auto space-y-8" style={{ maxWidth: "clamp(900px, 85%, 1400px)" }}>
            
            {/* 1. Dashboard Overview */}
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cloud Storage Consumption */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                      <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-medium">Cloud Storage Consumption</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">AWS S3 Bucket Usage</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">450 GB Used</span>
                      <span className="text-slate-500 dark:text-slate-400">1 TB Total</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Pending Flagged Documents */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-medium">Action Required</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Pending Flagged</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-4xl text-slate-900 dark:text-white font-bold">12</p>
                    <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">Documents awaiting review</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. User Account Control */}
            <section>
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">User Management</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage registered student accounts</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">Name</th>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">Email</th>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">Joined</th>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm text-slate-900 dark:text-white">{user.name}</td>
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm text-slate-500 dark:text-slate-400">{user.joined}</td>
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="View User">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Suspend Account">
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 3. Content Moderation & Flagging */}
            <section>
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Reported Documents</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Queue of documents flagged by users or AI for review</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">Document Title</th>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">Uploader</th>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">Negative Reports</th>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">AI Quality Score</th>
                        <th className="pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockReportedDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm text-slate-900 dark:text-white font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {doc.title}
                          </td>
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm text-slate-600 dark:text-slate-400">{doc.uploader}</td>
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              {doc.reports}
                            </span>
                          </td>
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              doc.aiScore >= 70 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                              : doc.aiScore >= 50 ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' 
                              : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            }`}>
                              {doc.aiScore}/100
                            </span>
                          </td>
                          <td className="py-4 border-b border-slate-100 dark:border-slate-800/50 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Ignore
                              </button>
                              <button className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1">
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 4. System Settings & Audit Logs */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settings */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 h-fit">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">System Configuration</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Global settings for the platform</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        AI Ranking Passing Score Threshold
                      </label>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{aiThreshold}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Documents receiving an AI score below this threshold will automatically be sent to the Reported Documents queue.
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={aiThreshold}
                      onChange={(e) => setAiThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>0 (Strict)</span>
                      <span>100 (Lenient)</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Audit Trail</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Recent administrative actions</p>
                </div>

                <div className="space-y-4">
                  {mockAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 flex-shrink-0">
                        <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white">{log.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {log.admin}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            {log.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                  View Full Audit Log
                </button>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}