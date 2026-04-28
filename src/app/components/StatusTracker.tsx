import { CheckCircle, Clock, FileText } from 'lucide-react';
import { recentDocuments } from '../mockData';

interface StatusTrackerProps {
  isLoading?: boolean;
}

export function StatusTracker({ isLoading }: StatusTrackerProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900 dark:text-white">Recent Uploads</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Last 7 days</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 animate-pulse">
              <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded mt-0.5"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-1.5"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
              </div>
              <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {recentDocuments.map((doc, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-white truncate">{doc.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{doc.date}</p>
              </div>
              <div className="flex-shrink-0">
                {doc.status === 'published' ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
                    <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Published</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-full">
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">Draft</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
