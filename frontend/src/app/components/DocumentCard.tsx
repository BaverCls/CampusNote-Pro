import { CheckCircle, Download, Eye, ThumbsUp, Clock, Sparkles, FileText, Lock } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  courseCode: string;
  uploader: string;
  status: 'published' | 'draft' | 'under-review';
  aiScore?: number;
  downloads: number;
  views: number;
  likes: number;
  reviewStatus?: string;
}

export function DocumentCard({
  title,
  courseCode,
  uploader,
  status,
  aiScore,
  downloads,
  views,
  likes,
  reviewStatus,
}: DocumentCardProps) {
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'published':
        return {
          label: 'Published',
          classes: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
          icon: CheckCircle
        };
      case 'draft':
        return {
          label: 'Draft',
          classes: 'text-slate-600 bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400',
          icon: Lock
        };
      case 'under-review':
        return {
          label: 'Under Review',
          classes: 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
          icon: Clock
        };
      default:
        return { label: status, classes: '', icon: Clock };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-all group flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-slate-900 dark:text-white font-semibold mb-1 line-clamp-1">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{courseCode}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.classes}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{statusConfig.label}</span>
        </div>
      </div>

      {/* Document Thumbnail Preview */}
      <div className="relative aspect-[4/3] mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group-hover:border-indigo-300 dark:group-hover:border-indigo-900 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex items-center justify-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/20 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[10px] font-medium text-white uppercase tracking-wider">First Page Preview</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1 flex flex-col">
        {status === 'published' && aiScore !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                AI Score: {aiScore}/100
              </span>
            </div>
            
            <button 
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-500/20 group/dl"
              title="Download Document"
            >
              <Download className="w-4 h-4 group-hover/dl:scale-110 transition-transform" />
            </button>
          </div>
        )}

        {status === 'under-review' && (
          <div className="px-3 py-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-sm text-amber-700 dark:text-amber-400 italic">
                {reviewStatus || 'Analyzing content...'}
              </span>
            </div>
          </div>
        )}

        {status === 'draft' && (
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
             <span className="text-sm text-slate-500 italic">Not yet submitted for review</span>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs">{views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span className="text-xs">{downloads}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="text-xs">{likes}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[80px]">{uploader}</span>
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center border border-white dark:border-slate-700">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{uploader.charAt(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
