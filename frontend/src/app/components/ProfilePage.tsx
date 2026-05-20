import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Coins, Award, FileText, CheckCircle, Clock, Lock, Sparkles, User as UserIcon } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { DocumentService } from '../services/DocumentService';
import { UserService } from '../services/UserService';
import { MetaService, FacultyMeta, DepartmentMeta } from '../services/MetaService';
import { NoteDocument } from '../types';
import { Settings, Save, X as CloseIcon, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const AREL_UNIVERSITY = 'Istanbul Arel University';

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

// ─── Yardımcı: Fakülte koduna göre renk döndürür ───────────────────────────
const FACULTY_COLORS: Record<string, string> = {
  CSE: "#7F77DD",
  EEE: "#1D9E75",
  BUS: "#D85A30",
  MED: "#D4537E",
  LAW: "#BA7517",
};

function getAccentColor(courseCode = "") {
  const prefix = courseCode.replace(/[^A-Z]/g, "").slice(0, 3);
  return FACULTY_COLORS[prefix] || "#888780";
}

// ─── Skor halkası (SVG) ────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number | null; color: string }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = score != null
    ? circumference - (score / 100) * circumference
    : circumference;

  return (
    <div className="relative flex-shrink-0 w-9 h-9">
      <svg width="36" height="36" viewBox="0 0 36 36" className="transform -rotate-90">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="#E5E5E5" strokeWidth="2.5" />
        {score != null && (
          <circle
            cx="18" cy="18" r={radius}
            fill="none"
            stroke={color || "#7F77DD"}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-slate-900 dark:text-white">
        {score != null ? score : "—"}
      </div>
    </div>
  );
}

// ─── Stat kartı ────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, trendType = "neutral" }: { label: string; value: React.ReactNode; trend?: string; trendType?: "up" | "neutral" }) {
  const trendColorClass = trendType === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400";
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
      <div className="text-[13px] text-slate-500 dark:text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">
        {value}
      </div>
      {trend && (
        <div className={`text-[13px] mt-1.5 font-medium ${trendColorClass}`}>{trend}</div>
      )}
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const currentUser = AuthService.getCurrentUser();
  const [docs, setDocs] = useState<NoteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [faculties, setFaculties] = useState<FacultyMeta[]>([]);
  const [departments, setDepartments] = useState<DepartmentMeta[]>([]);
  const [editData, setEditData] = useState({
    fullName: currentUser?.fullName || '',
    bio: currentUser?.bio || '',
    university: currentUser?.university || '',
    facultyId: currentUser?.facultyId?.toString() || '',
    departmentId: currentUser?.departmentId?.toString() || ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role === 'ADMIN') {
      navigate('/admin');
    }
  }, [currentUser?.id, currentUser?.email, navigate]);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'ADMIN') return;
    setLoading(true);
    DocumentService.getUserDocuments()
      .then(setDocs)
      .finally(() => setLoading(false));
  }, [currentUser?.id, currentUser?.email, currentUser?.role]);

  useEffect(() => {
    Promise.all([MetaService.getFaculties(), MetaService.getDepartments()])
      .then(([facs, depts]) => {
        setFaculties(facs);
        setDepartments(depts);
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const dataToSend: any = { ...editData };
    
    if (editData.facultyId) dataToSend.facultyId = Number(editData.facultyId);
    else delete dataToSend.facultyId;
    
    if (editData.departmentId) dataToSend.departmentId = Number(editData.departmentId);
    else delete dataToSend.departmentId;
    if (!editData.university) delete dataToSend.university;

    const updated = await UserService.updateProfile(dataToSend);
    setIsSaving(false);
    
    if (updated) {
      AuthService.saveUser(updated);
      setIsEditing(false);
      toast.success('Profile updated successfully!', {
        icon: <Check className="w-4 h-4 text-emerald-500" />,
        className: 'rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30'
      });
      window.dispatchEvent(new Event('user-data-updated'));
    } else {
      toast.error('Failed to update profile.');
    }
  };

  if (!currentUser || currentUser.role === 'ADMIN') return null;

  const analytics = useMemo(() => {
    const totalNotes = docs.length;
    const published = docs.filter((d) => d.status === 'PUBLISHED').length;
    const rejected = docs.filter((d) => d.status === 'REJECTED').length;
    const drafts = totalNotes - published - rejected;
    
    // FR-ST-10: Display an aggregated total of downloads received across all of the user's documents
    const totalDownloads = docs.reduce((sum, d) => sum + (d.downloadCount || 0), 0);
    
    // FR-ST-13: Display an aggregated total of 'Likes' received across all of the user's documents
    const totalLikes = docs.reduce((sum, d) => sum + (d.likeCount || 0), 0);

    const avgAiScore = published ? Math.round(docs.filter(d => d.status === 'PUBLISHED').reduce((sum, d) => sum + (d.score ?? d.aiScore ?? 0), 0) / published) : 0;
    
    const topFaculty = docs.reduce<Record<string, number>>((acc, d) => {
      const key = d.faculty || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const bestDoc = [...docs].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    const topFacultyName = Object.entries(topFaculty).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    return { totalNotes, published, rejected, drafts, totalDownloads, totalLikes, avgAiScore, topFacultyName, bestDoc };
  }, [docs]);

  const user = {
    name: currentUser.fullName || currentUser.email.split('@')[0],
    email: currentUser.email,
    bio: currentUser.bio || "No bio yet...",
    university: currentUser.university || 'Not set',
    department: currentUser.departmentName || "Student",
    // FR-ST-08: The system shall display the user's "Member since" (Registration Date) on the user profile
    memberSince: formatAccountDate(currentUser.createdAt),
    // FR-ST-32: The system shall display the user's virtual rank on the user profile
    rank: currentUser.rank,
    // FR-ST-31: The system shall display the user's current CampusCoin balance on the user profile
    coins: currentUser.coinBalance,
    initials: (currentUser.fullName || currentUser.email).charAt(0).toUpperCase(),
    stats: {
      totalNotes: analytics.totalNotes,
      downloads: analytics.totalDownloads,
      likes: analytics.totalLikes,
      avgAiScore: analytics.avgAiScore,
    },
  };
  const completion = getProfileCompletion(currentUser);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar activeItem="Profile" onProfileClick={() => navigate('/profile')} />
      <Header onProfileClick={() => navigate('/profile')} onMobileMenuClick={() => setIsMobileNavOpen(true)} />
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} activeItem="Profile" onProfileClick={() => navigate('/profile')} />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto p-4 lg:p-8" style={{ maxWidth: "clamp(900px, 85%, 1400px)" }}>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 mb-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-lg">
                  {user.initials}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">{user.email}</div>
                  <div className="text-[14px] text-slate-500 dark:text-slate-500 mt-1">{user.university}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-wider font-semibold">Account Created: {user.memberSince}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-wider font-semibold">Role: {formatRole(currentUser.role)}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-full px-4 py-2 shadow-sm">
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-tight">
                    {user.rank ? `${user.rank} Rank` : 'Rank not available yet'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-sm">
                  <Coins className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{user.coins !== undefined && user.coins !== null ? user.coins.toLocaleString() : 'Not available yet'}</span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">CampusCoin</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-sm hover:border-indigo-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  <Settings className="w-4 h-4" /> Edit Profile
                </button>
              </div>
            </div>
            {user.bio && <p className="mt-6 text-slate-600 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">{user.bio}</p>}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Profile completion</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {completion.completed}/{completion.total} completed
                </p>
              </div>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{completion.percent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${completion.percent}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              {completion.missing.length > 0 ? `Missing: ${completion.missing.join(', ')}` : 'All required profile details are complete.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Notes" value={user.stats.totalNotes} />
            <StatCard label="Published" value={analytics.published} />
            <StatCard label="Rejected" value={analytics.rejected} />
            <StatCard label="Avg. AI Score" value={`${user.stats.avgAiScore}/100`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <StatCard label="Draft Queue" value={analytics.drafts} />
            <StatCard label="Top Faculty" value={analytics.topFacultyName} />
            <StatCard label="Best Score" value={analytics.bestDoc ? `${analytics.bestDoc.score ?? 0}/100` : '-'} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Your Documents</h2>
            </div>

            {!loading && docs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">You haven't uploaded any documents yet.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {docs.map((doc) => (
                        <div key={doc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{doc.title}</div>
                            <div className="text-xs text-slate-500">{doc.courseCode} • {doc.faculty || 'Unknown'}</div>
                          </div>
                          <div className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {doc.status}
                          </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    value={editData.fullName}
                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                    disabled={!!currentUser?.fullName}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">University</label>
                  <select
                    value={editData.university}
                    onChange={(e) => setEditData({...editData, university: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                  >
                    <option value="">Not set</option>
                    <option value={AREL_UNIVERSITY}>{AREL_UNIVERSITY}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Faculty</label>
                    <select 
                      value={editData.facultyId}
                      onChange={(e) => setEditData({...editData, facultyId: e.target.value, departmentId: ''})}
                      disabled={!!currentUser?.facultyId}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/50"
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                    <select 
                      value={editData.departmentId}
                      onChange={(e) => setEditData({...editData, departmentId: e.target.value})}
                      disabled={!!currentUser?.departmentId || !editData.facultyId}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/50"
                    >
                      <option value="">Select Department</option>
                      {departments.filter(d => String(d.facultyId) === editData.facultyId).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bio</label>
                  <textarea 
                    rows={3}
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white resize-none"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex gap-3">
                <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
