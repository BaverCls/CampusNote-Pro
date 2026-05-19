"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Flag,
  Settings,
  Database,
  AlertTriangle,
  Search,
  CheckCircle,
  FileText,
  Shield,
  Menu,
  X,
  Loader2,
  Ban,
  Eye
} from 'lucide-react';
import { UserService, UserData } from '../services/UserService';
import { DocumentService } from '../services/DocumentService';
import { authFetch } from '../services/AuthService';
import { API_URL } from '../services/config';
import { NoteDocument } from '../types';
import { AdminCourseManager } from './AdminCourseManager';
import { Book } from 'lucide-react'; // Import a new icon for courses
import { toast } from 'sonner';

export function AdminPanel() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [users, setUsers] = useState<UserData[]>([]);
  const [documents, setDocuments] = useState<NoteDocument[]>([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    flaggedDocuments: 0,
    storageUsedGb: '0.00',
    totalUsers: 0,
    aiThreshold: 80
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiThreshold, setAiThreshold] = useState(80);

  // Review Action States
  const [reviewScores, setReviewScores] = useState<{[key: number]: number}>({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userData, docData, statsData, logsData] = await Promise.all([
        UserService.getUsers(),
        DocumentService.getAllDocuments(),
        authFetch(`${API_URL}/admin/stats`).then(res => res.json()),
        authFetch(`${API_URL}/admin/logs`).then(res => res.json())
      ]);
      setUsers(userData);
      setDocuments(docData);
      setStats(statsData);
      if (typeof statsData.aiThreshold === 'number') setAiThreshold(statsData.aiThreshold);
      setAuditLogs(logsData);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: number, approve: boolean) => {
    const score = reviewScores[id] || 0;
    if (approve && score < 80) {
      alert("Note: Per READ requirements, score must be at least 80 to publish.");
      return;
    }
    
    const success = await DocumentService.reviewDocument(id, score, approve);
    if (success) {
      fetchAllData(); // Refresh both to update counts
    }
  };

  const handleBan = async (id: number) => {
    if (window.confirm("Are you sure you want to ban this user?")) {
      const success = await UserService.banUser(id);
      if (success) {
        toast.success("User successfully banned.");
        fetchAllData();
      } else {
        toast.error("Ban failed! Check backend API.");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      const success = await UserService.deleteUser(id);
      if (success) {
        toast.success("User deleted successfully.");
        fetchAllData();
      } else {
        toast.error("Delete failed! Spring Boot endpoint missing or error.");
      }
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (window.confirm('Delete this reviewed note permanently?')) {
      const success = await DocumentService.deleteDocument(id);
      if (success) {
        toast.success('Document deleted successfully.');
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      } else {
        toast.error('Document delete failed.');
      }
    }
  };

  const handleThresholdUpdate = async () => {
    const response = await authFetch(`${API_URL}/admin/threshold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: aiThreshold }),
    });
    if (response.ok) {
      toast.success('AI threshold updated.');
      fetchAllData();
    } else {
      toast.error('Threshold update failed.');
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', id: 'Dashboard' },
    { icon: Users, label: 'User Management', id: 'Users' },
    { icon: Book, label: 'Course Management', id: 'Courses' }, // New Item
    { icon: FileText, label: 'Notes Review', id: 'Notes' },
    { icon: Flag, label: 'Reports', id: 'Reports' },
    { icon: Shield, label: 'Audit Logs', id: 'Logs' }, // FR-ST-62
    { icon: Settings, label: 'Settings', id: 'Settings' },
  ];

  const filteredUsers = users.filter(user => 
    user.role !== 'ADMIN' && (
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const pendingNotesCount = documents.filter(d => d.status === 'DRAFT' || !d.status).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 flex flex-col p-6 transform transition-transform lg:translate-x-0 lg:static lg:h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />
            Admin Panel
          </h1>
        </div>
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${activeMenu === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button onClick={() => navigate('/')} className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <LayoutDashboard className="w-5 h-5" /> Back to App
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Menu /></button>
          <h1 className="text-slate-900 dark:text-white font-medium">Admin Dashboard</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto space-y-8" style={{ maxWidth: "clamp(900px, 85%, 1400px)" }}>
            
            {activeMenu === 'Dashboard' && (
              <>
                <section>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">System Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 md:col-span-2 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          {/* FR-ST-63: Display the total database storage consumption */}
                          <h3 className="text-slate-900 dark:text-white font-bold">Prototype Storage</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Local PDF storage, S3-equivalent telemetry</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">{stats.storageUsedGb} GB Used</span>
                          <span className="text-slate-500 dark:text-slate-400">10 GB Enterprise Tier</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${(parseFloat(stats.storageUsedGb) / 10) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                          {/* FR-ST-53: Display an aggregated total of flagged documents */}
                          <h3 className="text-slate-900 dark:text-white font-bold">Flagged Docs</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Moderation Queue</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-5xl text-slate-900 dark:text-white font-black">{stats.flaggedDocuments}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mt-2">
                          {stats.flaggedDocuments > 0 ? `${stats.flaggedDocuments} items reported by AI or Users` : 'Clean moderation queue'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">User Base</h3>
                    <p className="text-3xl font-black dark:text-white">{users.length}</p>
                    <p className="text-xs text-emerald-500 font-bold mt-1">↑ 12% from last week</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Total Documents</h3>
                    <p className="text-3xl font-black dark:text-white">{documents.length}</p>
                    <p className="text-xs text-indigo-500 font-bold mt-1">{documents.filter(d => d.status === 'PUBLISHED').length} Published</p>
                  </div>
                </div>
              </>
            )}

            {activeMenu === 'Users' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">User Management</h2>
                    <p className="text-sm text-slate-500 font-medium">Real-time database records</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl focus:outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr>
                        <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                        <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                        <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                        <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="group">
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-l-xl text-sm font-bold text-slate-900 dark:text-white border-y border-l border-transparent group-hover:border-indigo-500/20 transition-all">
                            {user.fullName || 'No Name'}
                          </td>
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 text-sm text-slate-600 dark:text-slate-400 border-y border-transparent group-hover:border-indigo-500/20 transition-all">
                            {user.email}
                          </td>
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 text-sm font-black text-amber-600 border-y border-transparent group-hover:border-indigo-500/20 transition-all">
                            {user.coinBalance} C
                          </td>
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl text-right border-y border-r border-transparent group-hover:border-indigo-500/20 transition-all">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition-all">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleBan(user.id)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition-all"
                            title="Ban User"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900 transition-all"
                                title="Delete User"
                              >
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
            )}

            {activeMenu === 'Courses' && (
              <AdminCourseManager />
            )}

            {activeMenu === 'Notes' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Academic Note Review</h2>
                  <p className="text-sm text-slate-500 font-medium">Verify documents according to READ standards</p>
                </div>
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 italic">No documents in the system yet.</div>
                  ) : (
                    documents.map(doc => (
                      <div key={doc.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                            <FileText className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-bold dark:text-white text-sm md:text-base">{doc.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">{doc.courseCode} • By {doc.uploaderName}</p>
                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full mt-2 inline-block ${
                              doc.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 
                              doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {doc.status || 'DRAFT'}
                            </span>
                          </div>
                        </div>

                        {(doc.status === 'DRAFT' || !doc.status) && (
                          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-500 ml-1">QUALITY SCORE</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0-100"
                                value={reviewScores[doc.id] || ''}
                                onChange={(e) => setReviewScores({...reviewScores, [doc.id]: Number(e.target.value)})}
                                className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded text-xs font-bold dark:text-white"
                              />
                            </div>
                            <button
                              onClick={() => handleReview(doc.id, true)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(doc.id, false)}
                              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        
                        {doc.status === 'PUBLISHED' && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl">
                              <CheckCircle className="w-4 h-4" /> Score: {doc.score}
                            </div>
                            <button
                              onClick={() => handleDeleteNote(doc.id)}
                              className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {doc.status === 'REJECTED' && (
                          <button
                            onClick={() => handleDeleteNote(doc.id)}
                            className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900 transition-all"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeMenu === 'Logs' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="mb-8">
                  {/* FR-ST-62: The system shall display a chronological list of administrative logs */}
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Administrative Audit Logs</h2>
                  <p className="text-sm text-slate-500 font-medium">Tracking system changes and user moderation actions</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Admin</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} className="group">
                          <td className="py-4 text-xs text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 text-sm font-bold text-slate-900 dark:text-white">
                            {log.adminEmail}
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black uppercase text-indigo-600">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-600 dark:text-slate-400">
                            {log.target}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMenu === 'Settings' && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">System Configuration</h2>
                    <p className="text-sm text-slate-500">READ v2.0 Global Constraints</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">AI Quality Threshold</label>
                        <span className="text-sm font-black text-indigo-600">{aiThreshold}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={aiThreshold}
                        onChange={(e) => setAiThreshold(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <button onClick={handleThresholdUpdate} className="w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:opacity-90 transition-all">
                      Update Global Rules
                    </button>
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
