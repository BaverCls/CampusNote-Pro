import { useState, useEffect } from 'react';
import { Plus, Filter, SortAsc, Search, AlertCircle, BookOpen, TrendingUp } from 'lucide-react';
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
import { RegisterPage } from './components/RegisterPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { SettingsPage } from './components/SettingsPage';
import { faculties } from './constants';
import { NoteDocument } from './types';
import { AuthService } from './services/AuthService';
import { DocumentService } from './services/DocumentService';
import { Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'downloads' | 'score'>('latest');
  const navigate = useNavigate();

  const currentUser = AuthService.getCurrentUser();

  const fetchFeed = () => {
    setIsLoading(true);
    const request = searchQuery.trim() || facultyFilter || sortBy !== 'latest'
      ? DocumentService.searchDocuments(searchQuery, facultyFilter, sortBy)
      : DocumentService.getFeed();
    request
      .then((data) => {
        setDocuments(data);
      })
      .catch((err) => console.error("Feed error:", err))
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchFeed();
    AuthService.refreshUser(); // Sync coins and profile data from DB
  }, [currentUser?.id, currentUser?.email, navigate, searchQuery, facultyFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        activeItem="Dashboard"
        onProfileClick={() => navigate('/profile')}
      />
      <Header
        onProfileClick={() => navigate('/profile')}
        onMobileMenuClick={() => setIsMobileNavOpen(true)}
        onSearch={setSearchQuery}
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
              <h2 className="text-slate-900 dark:text-white mb-2">
                Welcome back, {currentUser?.fullName || currentUser?.email.split('@')[0] || 'Student'}
              </h2>
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
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, course, uploader..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Filter by:</span>
              </div>
              <select
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">All Faculties</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <SortAsc className="w-4 h-4 text-indigo-600" />
                <span>Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'downloads' | 'score')}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
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
          ) : documents.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <FileTextEmpty />
              <p className="text-slate-800 dark:text-slate-200 font-semibold">No documents yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Uploaded and published notes will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} {...doc} uploader={doc.uploaderName || doc.uploader || 'Anonymous'} />
              ))}
            </div>
          )}
        </div>
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchFeed}
      />
    </div>
  );
}

type DocumentListPageProps = {
  activeItem: 'MyFaculty' | 'TopDocuments';
  title: string;
  description: string;
  emptyMessage: string;
  mode: 'faculty' | 'top';
};

function DocumentListPage({ activeItem, title, description, emptyMessage, mode }: DocumentListPageProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [documents, setDocuments] = useState<NoteDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const currentUser = AuthService.getCurrentUser();
  const userFacultyId = currentUser?.facultyId ? String(currentUser.facultyId) : '';
  const userFacultyName = currentUser?.facultyName || faculties.find((faculty) => faculty.id === userFacultyId)?.name;
  const PageIcon = mode === 'faculty' ? BookOpen : TrendingUp;

  useEffect(() => {
    let isMounted = true;

    if (mode === 'faculty' && !userFacultyId) {
      setDocuments([]);
      setErrorMessage('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const request = mode === 'faculty'
      ? DocumentService.searchDocuments(searchQuery, userFacultyId, 'latest')
      : DocumentService.searchDocuments(searchQuery, undefined, 'downloads');

    request
      .then((data) => {
        if (isMounted) setDocuments(data);
      })
      .catch((err) => {
        console.error(`${title} error:`, err);
        if (isMounted) {
          setDocuments([]);
          setErrorMessage('Could not load documents. Please try again later.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mode, searchQuery, title, userFacultyId]);

  const showMissingFaculty = mode === 'faculty' && !userFacultyId;
  const showEmpty = !isLoading && !errorMessage && !showMissingFaculty && documents.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar
        activeItem={activeItem}
        onProfileClick={() => navigate('/profile')}
      />
      <Header
        onProfileClick={() => navigate('/profile')}
        onMobileMenuClick={() => setIsMobileNavOpen(true)}
        onSearch={setSearchQuery}
      />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeItem={activeItem}
        onProfileClick={() => navigate('/profile')}
      />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto p-4 lg:p-8" style={{ maxWidth: "clamp(900px, 85%, 1400px)" }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                  <PageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-slate-900 dark:text-white">{title}</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">{description}</p>
              {mode === 'faculty' && userFacultyName && (
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
                  Faculty: {userFacultyName}
                </p>
              )}
            </div>
          </div>

          {(showMissingFaculty || errorMessage) && (
            <div className="mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {showMissingFaculty ? 'Faculty information is missing' : 'Unable to load documents'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {showMissingFaculty
                    ? 'Set your faculty in your profile to see documents from your faculty.'
                    : errorMessage}
                </p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-slate-900 dark:text-white mb-4 font-semibold">
              {mode === 'faculty' ? 'Faculty Documents' : 'Popular Documents'}
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <DocumentCardSkeleton key={i} />
              ))}
            </div>
          ) : showEmpty ? (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <FileTextEmpty />
              <p className="text-slate-700 dark:text-slate-300 font-medium">{emptyMessage}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} {...doc} uploader={doc.uploaderName || doc.uploader || 'Anonymous'} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FileTextEmpty() {
  return (
    <div className="mx-auto mb-4 w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
      <BookOpen className="w-6 h-6 text-slate-400" />
    </div>
  );
}

function ProfileWrapper() {
  return <ProfilePage />;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!AuthService.isAdmin()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/profile" element={
          <PrivateRoute>
            <ProfileWrapper />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        <Route path="/leaderboard" element={
          <PrivateRoute>
            <LeaderboardPage />
          </PrivateRoute>
        } />
        <Route path="/my-faculty" element={
          <PrivateRoute>
            <DocumentListPage
              activeItem="MyFaculty"
              title="My Faculty"
              description="Notes shared by students from your faculty"
              emptyMessage="No documents from your faculty yet."
              mode="faculty"
            />
          </PrivateRoute>
        } />
        <Route path="/top-documents" element={
          <PrivateRoute>
            <DocumentListPage
              activeItem="TopDocuments"
              title="Top Documents"
              description="Most useful notes ranked by popularity"
              emptyMessage="No top documents yet."
              mode="top"
            />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
