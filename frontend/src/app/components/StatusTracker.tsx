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
  const currentUser = AuthService.getCurrentUser();

  const fetchMyDocs = async () => {
    if (!currentUser) return;
    try {
      const docs = await DocumentService.getUserDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("StatusTracker Fetch Error:", err);
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-900 dark:text-white font-bold tracking-tight">Submission Status</h3>
        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-2 py-1 rounded-full font-black uppercase">
          Live Tracking
        </span>
      </div>
      
      {(loading || parentLoading) && documents.length === 0 ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-xs text-slate-500 font-medium italic">No active submissions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-900 dark:text-white font-bold truncate max-w-[150px]">
                    {doc.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                    {doc.courseCode}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  {doc.status === 'PUBLISHED' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : doc.status === 'REJECTED' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  )}
                  <span className={`text-[11px] font-black uppercase ${
                    doc.status === 'PUBLISHED' ? 'text-emerald-600' : 
                    doc.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {doc.status || 'DRAFT'}
                  </span>
                </div>
                {doc.status === 'PUBLISHED' && (
                  <span className="text-[9px] font-bold text-slate-400">+10 CampusCoins</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
