import { useState, useEffect } from 'react';
import { Plus, Filter, SortAsc } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DocumentCard } from './components/DocumentCard';
import { UploadModal } from './components/UploadModal';
import { LeaderboardWidget } from './components/LeaderboardWidget';
import { StatusTracker } from './components/StatusTracker';
import { ProfilePage } from './components/ProfilePage';
import { MobileNav } from './components/MobileNav';
import { AdminPanel } from './components/AdminPanel';
import { LoginPage } from './components/LoginPage';
import { fetchDocuments, faculties } from './mockData';
import { NoteDocument } from './types';

function DocumentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        </div>
        <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      </div>
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4"></div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-14 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [documents, setDocuments] = useState<NoteDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    fetchDocuments().then((data) => {
      setDocuments(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        activeItem="Dashboard"
        onProfileClick={() => navigate('/profile')}
      />
      <Header
        onProfileClick={() => navigate('/profile')}
        onMobileMenuClick={() => setIsMobileNavOpen(true)}
      />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeItem="Dashboard"
        onProfileClick={() => navigate('/profile')}
      />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto p-4 lg:p-8" style={{ maxWidth: "clamp(900px, 85%, 1400px)" }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h2 className="text-slate-900 dark:text-white mb-2">Welcome back, Sarah</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
                Discover and share academic resources with your community
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full lg:w-auto"
            >
              <Plus className="w-5 h-5" />
              Upload Note
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="xl:col-span-2 space-y-6">
              <StatusTracker isLoading={isLoading} />
            </div>
            <div>
              <LeaderboardWidget isLoading={isLoading} />
            </div>
          </div>

          {/* Filter & Sort Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Filter by:</span>
              </div>
              <select className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <option value="">All Faculties</option>
                {faculties.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <SortAsc className="w-4 h-4 text-indigo-600" />
                <span>Sort by:</span>
              </div>
              <select className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <option value="latest">Latest</option>
                <option value="downloads">Most Downloaded</option>
                <option value="score">Highest Score</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-slate-900 dark:text-white mb-4 font-semibold">Recent Documents</h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <DocumentCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} {...doc} />
              ))}
            </div>
          )}
        </div>
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}

function ProfileWrapper() {
  return <ProfilePage />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfileWrapper />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}