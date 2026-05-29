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
import { AuthService, authFetch } from '../services/AuthService';
import { API_URL } from '../services/config';
import { NoteDocument } from '../types';
import { AdminCourseManager } from './AdminCourseManager';
import { Book } from 'lucide-react'; // Import a new icon for courses
import { toast } from 'sonner';
import { DepartmentMeta, FacultyMeta, MetaService } from '../services/MetaService';

function OverviewMetricSkeleton({ className = 'h-8 w-24' }: { className?: string }) {
  return <span className={`block ${className} rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse`} />;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  
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
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [aiThreshold, setAiThreshold] = useState(80);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedUserEdit, setSelectedUserEdit] = useState({ facultyId: '', departmentId: '', year: '' });
  const [faculties, setFaculties] = useState<FacultyMeta[]>([]);
  const [departments, setDepartments] = useState<DepartmentMeta[]>([]);
  const [documentStatusFilter, setDocumentStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING' | 'FLAGGED' | 'REJECTED'>('ALL');
  const [userActionId, setUserActionId] = useState<number | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Review Action States
  const [reviewScores, setReviewScores] = useState<{[key: number]: number}>({});
  const [reviewingDocumentId, setReviewingDocumentId] = useState<number | null>(null);
  const [reviewingAction, setReviewingAction] = useState<'approve' | 'reject' | 'flag' | null>(null);

  useEffect(() => {
    fetchAllData();
    Promise.all([MetaService.getFaculties(), MetaService.getDepartments()])
      .then(([facs, depts]) => {
        setFaculties(facs);
        setDepartments(depts);
      })
      .catch((error) => {
        console.error('Admin metadata fetch failed:', error);
        toast.error('Academic metadata could not be loaded.');
      });
  }, []);

  const openUserDetails = (user: UserData) => {
    setSelectedUser(user);
    setSelectedUserEdit({
      facultyId: user.facultyId ? String(user.facultyId) : '',
      departmentId: user.departmentId ? String(user.departmentId) : '',
      year: user.year ? String(user.year) : '',
    });
  };

  const fetchAllData = async () => {
    setLoading(true);
    setLoadErrors([]);

    const readJson = async (response: Response, label: string) => {
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      return response.json();
    };

    const results = await Promise.allSettled([
      UserService.getUsers(),
      DocumentService.getAllDocuments(),
      authFetch(`${API_URL}/admin/stats`).then((res) => readJson(res, 'Stats')),
      authFetch(`${API_URL}/admin/logs`).then((res) => readJson(res, 'Audit logs')),
    ]);

    const errors: string[] = [];

    if (results[0].status === 'fulfilled') {
      setUsers(results[0].value);
    } else {
      errors.push('Users could not be loaded.');
      console.error('Admin users fetch failed:', results[0].reason);
    }

    if (results[1].status === 'fulfilled') {
      setDocuments(results[1].value);
    } else {
      errors.push('Documents could not be loaded.');
      console.error('Admin documents fetch failed:', results[1].reason);
    }

    if (results[2].status === 'fulfilled') {
      const statsData = results[2].value;
      setStats(statsData);
      if (typeof statsData.aiThreshold === 'number') setAiThreshold(statsData.aiThreshold);
    } else {
      errors.push('Stats could not be loaded.');
      console.error('Admin stats fetch failed:', results[2].reason);
    }

    if (results[3].status === 'fulfilled') {
      setAuditLogs(results[3].value);
    } else {
      errors.push('Audit logs could not be loaded.');
      console.error('Admin logs fetch failed:', results[3].reason);
    }

    setLoadErrors(errors);
    setLoading(false);
  };

  const handleReview = async (id: number, approve: boolean) => {
    const score = reviewScores[id] || 0;
    if (approve && score < 80) {
      toast.error("Score must be at least 80 to publish.");
      return;
    }
    setReviewingDocumentId(id);
    setReviewingAction(approve ? 'approve' : 'reject');
    const success = await DocumentService.reviewDocument(id, score, approve);
    if (success) {
      fetchAllData(); // Refresh both to update counts
      toast.success(approve ? 'Document approved.' : 'Document rejected.');
    } else {
      toast.error(approve ? 'Approve failed.' : 'Reject failed.');
    }
    setReviewingDocumentId(null);
    setReviewingAction(null);
  };

  const handleFlagDocument = async (id: number) => {
    setReviewingDocumentId(id);
    setReviewingAction('flag');
    const success = await DocumentService.flagDocument(id);
    if (success) {
      fetchAllData();
      toast.success('Document flagged for admin attention.');
    } else {
      toast.error('Flag failed.');
    }
    setReviewingDocumentId(null);
    setReviewingAction(null);
  };

  const handleToggleSuspension = async (user: UserData) => {
    const isSelf = currentUser?.id === user.id || currentUser?.email === user.email;
    if (isSelf) {
      toast.error('You cannot suspend your own admin account.');
      return;
    }

    const shouldUnsuspend = user.isActive === false;
    const actionLabel = shouldUnsuspend ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${user.email}?`)) return;

    setUserActionId(user.id);
    const success = shouldUnsuspend
      ? await UserService.unsuspendUser(user.id)
      : await UserService.banUser(user.id);

    if (success) {
      toast.success(shouldUnsuspend ? 'User unsuspended.' : 'User suspended.');
      fetchAllData();
    } else {
      toast.error(shouldUnsuspend ? 'Unsuspend failed.' : 'Suspend failed.');
    }
    setUserActionId(null);
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
  const reportedDocuments = documents.filter((doc) => (doc.reportCount ?? 0) > 0 || doc.status === 'FLAGGED');
  const statusFilters = [
    { id: 'ALL', label: 'All' },
    { id: 'PUBLISHED', label: 'Published' },
    { id: 'PENDING', label: 'Draft/Pending' },
    { id: 'FLAGGED', label: 'Flagged' },
    { id: 'REJECTED', label: 'Rejected' },
  ] as const;
  const filteredDocuments = documents.filter((doc) => {
    const status = doc.status || 'DRAFT';
    const query = documentSearchQuery.trim().toLowerCase();
    const matchesQuery = !query || [
      doc.title,
      doc.uploaderName,
      doc.uploader,
      doc.courseCode,
      doc.faculty,
      doc.departmentName,
    ].some((value) => value?.toLowerCase().includes(query));
    if (documentStatusFilter === 'ALL') return matchesQuery;
    const matchesStatus = documentStatusFilter === 'PENDING'
      ? status === 'DRAFT' || status === 'UNDER REVIEW'
      : status === documentStatusFilter;
    return matchesStatus && matchesQuery;
  });
  const editableDepartments = departments.filter((department) => (
    selectedUserEdit.facultyId ? String(department.facultyId) === selectedUserEdit.facultyId : true
  ));
  const getDocumentStatusBadge = (status?: NoteDocument['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return { label: 'Published', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' };
      case 'REJECTED':
        return { label: 'Rejected', classes: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' };
      case 'FLAGGED':
        return { label: 'Flagged', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' };
      case 'FAILED':
        return { label: 'Failed', classes: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' };
      case 'UNDER REVIEW':
        return { label: 'Under Review', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' };
      case 'DRAFT':
      default:
        return { label: 'Draft', classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  const handleUpdateUserAcademicInfo = async () => {
    if (!selectedUser) return;
    const facultyId = Number(selectedUserEdit.facultyId);
    const departmentId = Number(selectedUserEdit.departmentId);
    const year = Number(selectedUserEdit.year);

    if (!Number.isInteger(facultyId) || facultyId <= 0 || !Number.isInteger(departmentId) || departmentId <= 0 || !Number.isInteger(year) || year < 1 || year > 4) {
      toast.error('Select a faculty, department, and year.');
      return;
    }

    setIsUpdatingUser(true);
    const updated = await UserService.updateAdminUser(selectedUser.id, { facultyId, departmentId, year });
    if (updated) {
      toast.success('User academic info updated.');
      setSelectedUser(updated);
      setSelectedUserEdit({
        facultyId: updated.facultyId ? String(updated.facultyId) : '',
        departmentId: updated.departmentId ? String(updated.departmentId) : '',
        year: updated.year ? String(updated.year) : '',
      });
      await fetchAllData();
    } else {
      toast.error('User update failed.');
    }
    setIsUpdatingUser(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 flex flex-col p-6 transform transition-transform lg:translate-x-0 lg:static lg:h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />
            Admin Panel
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close admin menu"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  setIsMobileMenuOpen(false);
                }}
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
            {loadErrors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {loadErrors.join(' ')}
              </div>
            )}
            
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
                          <span className="text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                            {loading ? <OverviewMetricSkeleton className="h-4 w-20" /> : `${stats.storageUsedGb} GB Used`}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">10 GB Enterprise Tier</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          {loading ? (
                            <div className="h-full w-1/3 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-full"></div>
                          ) : (
                            <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${(parseFloat(stats.storageUsedGb) / 10) * 100}%` }}></div>
                          )}
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
                        {loading ? (
                          <>
                            <OverviewMetricSkeleton className="h-12 w-20" />
                            <OverviewMetricSkeleton className="h-3 w-40 mt-3" />
                          </>
                        ) : (
                          <>
                            <p className="text-5xl text-slate-900 dark:text-white font-black">{stats.flaggedDocuments}</p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mt-2">
                              {stats.flaggedDocuments > 0 ? `${stats.flaggedDocuments} items reported by AI or Users` : 'Clean moderation queue'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">User Base</h3>
                    {loading ? (
                      <>
                        <OverviewMetricSkeleton />
                        <OverviewMetricSkeleton className="h-3 w-32 mt-3" />
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-black dark:text-white">{users.length}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">Live platform metric</p>
                      </>
                    )}
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Total Documents</h3>
                    {loading ? (
                      <>
                        <OverviewMetricSkeleton />
                        <OverviewMetricSkeleton className="h-3 w-28 mt-3" />
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-black dark:text-white">{documents.length}</p>
                        <p className="text-xs text-indigo-500 font-bold mt-1">{documents.filter(d => d.status === 'PUBLISHED').length} Published</p>
                      </>
                    )}
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
                        <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                        <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                            No users found
                          </td>
                        </tr>
                      ) : filteredUsers.map(user => (
                        <tr key={user.id} className="group">
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-l-xl text-sm font-bold text-slate-900 dark:text-white border-y border-l border-transparent group-hover:border-indigo-500/20 transition-all">
                            {user.fullName || 'No Name'}
                          </td>
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 text-sm text-slate-600 dark:text-slate-400 border-y border-transparent group-hover:border-indigo-500/20 transition-all">
                            {user.email}
                          </td>
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 text-sm border-y border-transparent group-hover:border-indigo-500/20 transition-all">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                              user.isActive === false
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                            }`}>
                              {user.isActive === false ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 text-sm font-black text-amber-600 border-y border-transparent group-hover:border-indigo-500/20 transition-all">
                            {user.coinBalance} C
                          </td>
                          <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl text-right border-y border-r border-transparent group-hover:border-indigo-500/20 transition-all">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openUserDetails(user)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition-all"
                                title="View User"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleSuspension(user)}
                                disabled={userActionId === user.id || currentUser?.id === user.id || currentUser?.email === user.email}
                                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title={user.isActive === false ? 'Unsuspend User' : 'Suspend User'}
                              >
                                {userActionId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                {user.isActive === false ? 'Unsuspend' : 'Suspend'}
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
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Academic Note Review</h2>
                    <p className="text-sm text-slate-500 font-medium">Verify documents according to READ standards</p>
                  </div>
                  <div className="space-y-3 w-full lg:w-auto">
                    <div className="relative w-full lg:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={documentSearchQuery}
                        onChange={(e) => setDocumentSearchQuery(e.target.value)}
                        placeholder="Search title, uploader, course..."
                        className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusFilters.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setDocumentStatusFilter(filter.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                            documentStatusFilter === filter.id
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 italic">No documents in the system yet.</div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-16 px-6 text-center">
                      <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">No documents match this filter</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Try changing your filters or search terms.
                      </p>
                    </div>
                  ) : (
                    filteredDocuments.map(doc => {
                      const badge = getDocumentStatusBadge(doc.status);
                      const canReview = doc.status === 'DRAFT' || doc.status === 'UNDER REVIEW' || doc.status === 'FLAGGED' || !doc.status;
                      const isReviewing = reviewingDocumentId === doc.id;

                      return (
                      <div key={doc.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                            <FileText className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-bold dark:text-white text-sm md:text-base">{doc.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">{doc.courseCode} - By {doc.uploaderName || 'Anonymous'}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full inline-block ${badge.classes}`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                                {doc.reportCount !== undefined ? `Reports: ${doc.reportCount}` : 'Reports: Not available'}
                              </span>
                              {doc.status === 'FLAGGED' && (
                                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300">
                                  Needs admin attention
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {canReview && (
                          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-500 ml-1">QUALITY SCORE</span>
                              <span className="text-[9px] text-slate-400 ml-1 mb-1">Score 0-100</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0-100"
                                value={reviewScores[doc.id] || ''}
                                onChange={(e) => setReviewScores({...reviewScores, [doc.id]: Number(e.target.value)})}
                                disabled={isReviewing}
                                className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded text-xs font-bold dark:text-white disabled:opacity-60"
                              />
                            </div>
                            <button
                              onClick={() => handleReview(doc.id, true)}
                              disabled={isReviewing}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
                            >
                              {isReviewing && reviewingAction === 'approve' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Approve document
                            </button>
                            <button
                              onClick={() => handleReview(doc.id, false)}
                              disabled={isReviewing}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors disabled:opacity-60 disabled:cursor-wait"
                            >
                              {isReviewing && reviewingAction === 'reject' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Reject document
                            </button>
                            <button
                              onClick={() => handleFlagDocument(doc.id)}
                              disabled={isReviewing}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-bold hover:bg-orange-200 transition-colors disabled:opacity-60 disabled:cursor-wait"
                            >
                              {isReviewing && reviewingAction === 'flag' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Flag document
                            </button>
                          </div>
                        )}
                        
                        {doc.status === 'PUBLISHED' && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl">
                              <CheckCircle className="w-4 h-4" /> Score: {doc.score ?? 'Not scored'}
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
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeMenu === 'Reports' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reports</h2>
                    <p className="text-sm text-slate-500 font-medium">User-submitted document reports will appear here for admin review.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                    <Flag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                      {reportedDocuments.length} Active
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading reports...
                  </div>
                ) : reportedDocuments.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-16 px-6 text-center">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Flag className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">No reports yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      User-submitted document reports will appear here for admin review.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                      <thead>
                        <tr>
                          <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Document</th>
                          <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Course</th>
                          <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Reports</th>
                          <th className="px-4 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportedDocuments.map((doc) => (
                          <tr key={doc.id} className="group">
                            <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-l-xl text-sm font-bold text-slate-900 dark:text-white border-y border-l border-transparent group-hover:border-amber-500/20 transition-all">
                              {doc.title}
                            </td>
                            <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 text-sm text-slate-600 dark:text-slate-400 border-y border-transparent group-hover:border-amber-500/20 transition-all">
                              {doc.courseCode}
                            </td>
                            <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 text-sm font-black text-amber-600 border-y border-transparent group-hover:border-amber-500/20 transition-all">
                              {doc.reportCount ?? 0}
                            </td>
                            <td className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl border-y border-r border-transparent group-hover:border-amber-500/20 transition-all">
                              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/10 rounded text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">
                                {doc.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                            No audit logs yet
                          </td>
                        </tr>
                      ) : auditLogs.map((log, idx) => (
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

      {selectedUser && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Details</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">View and edit academic information</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close user details"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {(selectedUser.fullName || selectedUser.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{selectedUser.fullName || 'No Name'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Role</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedUser.role || 'STUDENT'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Status</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedUser.isActive === false ? 'Suspended' : 'Active'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Faculty</p>
                  <select
                    value={selectedUserEdit.facultyId}
                    onChange={(e) => setSelectedUserEdit({ facultyId: e.target.value, departmentId: '', year: selectedUserEdit.year })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Select faculty</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Department</p>
                  <select
                    value={selectedUserEdit.departmentId}
                    onChange={(e) => setSelectedUserEdit({ ...selectedUserEdit, departmentId: e.target.value })}
                    disabled={!selectedUserEdit.facultyId}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                  >
                    <option value="">Select department</option>
                    {editableDepartments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Year</p>
                  <select
                    value={selectedUserEdit.year}
                    onChange={(e) => setSelectedUserEdit({ ...selectedUserEdit, year: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Select year</option>
                    {[1, 2, 3, 4].map((year) => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Coins</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedUser.coinBalance ?? 0} C</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:border-indigo-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdateUserAcademicInfo}
                  disabled={isUpdatingUser}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isUpdatingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
