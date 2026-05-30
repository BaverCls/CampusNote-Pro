import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { DocumentService } from '../services/DocumentService';
import { AuthService } from '../services/AuthService';
import { NoteDocument } from '../types';

interface StatusTrackerProps {
  isLoading?: boolean;
}

export function StatusTracker({ isLoading: parentLoading }: StatusTrackerProps) {
  const [documents, setDocuments] = useState<NoteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const currentUser = AuthService.getCurrentUser();

  const [statusFilter, setStatusFilter] = useState<'LATEST' | 'PUBLISHED' | 'REJECTED' | 'DRAFT'>('LATEST');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset currentPage to 1 when statusFilter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const fetchMyDocs = async () => {
    if (!currentUser) return;
    try {
      setErrorMessage('');
      const docs = await DocumentService.getUserDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("StatusTracker Fetch Error:", err);
      setErrorMessage('Something went wrong while loading your uploads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDocs();
  }, [currentUser?.email]);

  // Expose refresh to window for easy calling from App.tsx
  useEffect(() => {
    (window as any).refreshStatusTracker = fetchMyDocs;
  }, []);

  const getStatusDetails = (status?: NoteDocument['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return {
          label: 'Published',
          description: 'Visible to students',
          icon: CheckCircle,
          classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
          iconClass: 'text-emerald-500',
        };
      case 'FLAGGED':
        return {
          label: 'Flagged',
          description: 'Needs admin attention',
          icon: AlertTriangle,
          classes: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
          iconClass: 'text-orange-500',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          description: 'Not published',
          icon: AlertTriangle,
          classes: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
          iconClass: 'text-red-500',
        };
      case 'UNDER REVIEW':
        return {
          label: 'Under Review',
          description: 'Waiting for review',
          icon: Clock,
          classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
          iconClass: 'text-amber-500',
        };
      case 'DRAFT':
      default:
        return {
          label: 'Draft',
          description: 'Not published yet',
          icon: Clock,
          classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
          iconClass: 'text-slate-500',
        };
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => b.id - a.id);

  const filteredDocuments = sortedDocuments.filter(doc => {
    if (statusFilter === 'LATEST') return true;
    if (statusFilter === 'PUBLISHED') return doc.status === 'PUBLISHED';
    if (statusFilter === 'REJECTED') return doc.status === 'REJECTED';
    if (statusFilter === 'DRAFT') return doc.status === 'DRAFT' || doc.status === 'UNDER REVIEW';
    return true;
  });

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / itemsPerPage));

  // Adjust currentPage if it goes out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredDocuments.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-all shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-slate-900 dark:text-white font-bold tracking-tight">Submission Status</h3>
          <span className="hidden sm:inline text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">
            Live
          </span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 outline-none"
        >
          <option value="LATEST">Latest</option>
          <option value="PUBLISHED">Published</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>
      
      {(loading || parentLoading) && documents.length === 0 ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
        </div>
      ) : errorMessage ? (
        <div className="text-center py-10">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{errorMessage}</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">No submissions found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {statusFilter === 'PUBLISHED' && "You don't have any published documents yet."}
            {statusFilter === 'REJECTED' && "No rejected documents found. Excellent!"}
            {statusFilter === 'DRAFT' && "You don't have any draft or under-review documents currently."}
            {statusFilter === 'LATEST' && "Upload your first note to start earning CampusCoins."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {paginatedDocuments.map((doc) => {
              const statusDetails = getStatusDetails(doc.status);
              const StatusIcon = statusDetails.icon;
              return (
                <div key={doc.id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white font-bold truncate max-w-[150px]">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                        {doc.courseCode} - {doc.courseName || 'Unknown course'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {doc.status === 'REJECTED' && doc.aiFeedback ? (
                          <span className="text-red-500 dark:text-red-400 font-semibold">
                            Reason: {doc.aiFeedback}
                          </span>
                        ) : (
                          statusDetails.description
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusDetails.classes}`}>
                      <StatusIcon className={`w-4 h-4 ${statusDetails.iconClass}`} />
                      <span className="text-[11px] font-black uppercase">
                        {statusDetails.label}
                      </span>
                    </div>
                    {(doc.status === 'PUBLISHED' || doc.status === 'REJECTED') && (
                      <span className={`text-[10px] font-black ${doc.status === 'PUBLISHED' ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'}`}>
                        AI Score: {doc.score != null ? Math.round(doc.score) : 0}/100
                      </span>
                    )}
                    {doc.status === 'PUBLISHED' && (
                      <span className="text-[9px] font-bold text-slate-400">
                        {doc.ects != null && doc.ects > 0 ? `+${doc.ects * 10} CampusCoins` : 'CampusCoins pending'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
