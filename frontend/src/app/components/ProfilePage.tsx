import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { userStats as mockUserStats } from '../mockData';
import { Coins, Award, FileText, CheckCircle, Clock, Lock, Sparkles } from 'lucide-react';

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
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className="transform -rotate-90"
      >
        <circle
          cx="18" cy="18" r={radius}
          fill="none" stroke="#E5E5E5" strokeWidth="2.5"
        />
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

// ─── Belge satırı ──────────────────────────────────────────────────────────
function DocItem({ doc }: { doc: any }) {
  const accentColor = getAccentColor(doc.courseCode);

  const badgeClasses = doc.status === "published"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const badgeLabel = doc.status === "published" ? "Yayında" : "Taslak";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-2 flex items-center gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Fakülte renk çubuğu */}
      <div 
        className="w-1 h-9 rounded-full flex-shrink-0" 
        style={{ background: accentColor }} 
      />

      {/* Başlık & meta */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">
          {doc.title}
        </div>
        <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
          {doc.courseCode} · {doc.date}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="flex items-center gap-3 text-[13px] text-slate-400 dark:text-slate-500 flex-shrink-0">
        <span className="flex items-center gap-1">↓ {doc.downloads}</span>
        <span className="flex items-center gap-1">♡ {doc.likes}</span>
      </div>

      {/* AI Skor halkası */}
      <ScoreRing score={doc.aiScore} color={accentColor} />

      {/* Durum badge */}
      <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClasses}`}>
        {badgeLabel}
      </span>
    </div>
  );
}

// ─── Ana bileşen ───────────────────────────────────────────────────────────
export function ProfilePage() {
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const user = {
    name: "Sarah Chen",
    department: "Computer Engineering",
    year: "3rd Year",
    university: "Istanbul Arel University",
    memberSince: "September 2025",
    rank: mockUserStats.rank,
    coins: mockUserStats.campusCoins,
    initials: "SC",
    stats: {
      totalNotes: mockUserStats.notesUploaded,
      totalNotesTrend: "+2 bu ay",
      downloads: mockUserStats.totalDownloads,
      downloadsTrend: "+38 bu hafta",
      likes: mockUserStats.totalLikes,
      avgAiScore: 91,
    },
  };

  const docs = [
    {
      id: 1,
      title: "Data Structures & Algorithms — Complete Notes",
      courseCode: "CSE301",
      date: "15 Nis 2026",
      downloads: 156,
      likes: 32,
      aiScore: 96,
      status: "published",
    },
    {
      id: 2,
      title: "Machine Learning Fundamentals",
      courseCode: "CSE401",
      date: "10 Nis 2026",
      downloads: 98,
      likes: 21,
      aiScore: 92,
      status: "published",
    },
    {
      id: 3,
      title: "Database Systems — ER Diagrams",
      courseCode: "CSE302",
      date: "08 Nis 2026",
      downloads: 67,
      likes: 15,
      aiScore: null,
      status: "draft",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        activeItem="Profile"
        onProfileClick={() => navigate('/profile')}
      />
      <Header
        onProfileClick={() => navigate('/profile')}
        onMobileMenuClick={() => setIsMobileNavOpen(true)}
      />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeItem="Profile"
        onProfileClick={() => navigate('/profile')}
      />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto p-4 lg:p-8" style={{ maxWidth: "clamp(900px, 85%, 1400px)" }}>
          
          {/* ── HEADER ── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8 mb-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

              {/* Avatar + bilgiler */}
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-lg">
                  {user.initials}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    {user.department} · {user.year}
                  </div>
                  <div className="text-[14px] text-slate-500 dark:text-slate-500 mt-1">{user.university}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-wider font-semibold">Member Since: {user.memberSince}</div>
                </div>
              </div>

              {/* Rank & Coin badge'leri */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full px-4 py-2 shadow-sm">
                  <Award className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <span className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tight">
                    {user.rank} Rank
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-sm">
                  <Coins className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {user.coins.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">CampusCoin</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── STAT KARTLARI ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Toplam not"
              value={user.stats.totalNotes}
              trend={user.stats.totalNotesTrend}
              trendType="up"
            />
            <StatCard
              label="İndirme"
              value={user.stats.downloads.toLocaleString()}
              trend={user.stats.downloadsTrend}
              trendType="up"
            />
            <StatCard
              label="Beğeni"
              value={user.stats.likes}
              trend="Tüm zamanlar"
              trendType="neutral"
            />
            <StatCard
              label="Ort. AI Skoru"
              value={
                <div className="flex items-baseline gap-1">
                  <span>{user.stats.avgAiScore}</span>
                  <span className="text-sm text-slate-400 font-normal">/100</span>
                </div>
              }
              trend="Top 10%"
              trendType="up"
            />
          </div>

          {/* ── BELGELER ── */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Yüklenen belgeler
              </h2>
              <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 uppercase tracking-widest transition-colors">
                Tümünü gör →
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {docs.map((doc) => (
                <DocItem key={doc.id} doc={doc} />
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}