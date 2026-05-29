import { useState } from 'react';
import { CheckCircle, Download, Eye, ThumbsUp, Clock, Sparkles, FileText, Lock, X, Flag, Loader2 } from 'lucide-react';
import { DocumentService } from '../services/DocumentService';

interface DocumentCardProps {
  title: string;
  description?: string;
  courseCode: string;
  courseName?: string;
  faculty?: string;
  departmentName?: string;
  uploader: string;
  status: 'DRAFT' | 'UNDER REVIEW' | 'PUBLISHED' | 'REJECTED' | 'FLAGGED' | 'FAILED';
  aiScore?: number;
  downloads: number;
  views: number;
  likes: number;
  reviewStatus?: string;
  uploadDate?: string;
  filePath?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  reportCount?: number;
  id: number;
  liked?: boolean;
}

export function DocumentCard({
  title,
  description,
  courseCode,
  courseName,
  faculty,
  departmentName,
  uploader,
  status,
  aiScore,
  downloads,
  views,
  likes,
  reviewStatus,
  uploadDate,
  filePath,
  fileUrl,
  thumbnailUrl,
  reportCount,
  id,
  liked,
}: DocumentCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentDownloads, setCurrentDownloads] = useState(downloads);
  const [isLiked, setIsLiked] = useState(liked);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'preview' | 'download' | 'like' | 'report' | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingAction) return;
    
    setLoadingAction('download');
    const ok = await DocumentService.downloadDocument(id);
    if (ok) {
      setCurrentDownloads(prev => prev + 1);
      showFeedback('success', 'Download started');
    } else {
      showFeedback('error', 'Download failed');
    }
    setLoadingAction(null);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingAction) return;

    setLoadingAction('like');
    const ok = await DocumentService.likeDocument(id);
    if (!ok) {
      showFeedback('error', 'Like failed');
      setLoadingAction(null);
      return;
    }

    if (isLiked) {
        setCurrentLikes(prev => prev - 1);
        setIsLiked(false);
        showFeedback('success', 'Like removed');
    } else {
        setCurrentLikes(prev => prev + 1);
        setIsLiked(true);
        showFeedback('success', 'Liked');
    }
    setLoadingAction(null);
  };

  const handlePreview = async () => {
    if (loadingAction) return;
    setLoadingAction('preview');
    setPreviewOpen(true);
    const ok = await DocumentService.viewDocument(id);
    if (!ok) showFeedback('error', 'Preview tracking failed');
    setLoadingAction(null);
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingAction) return;
    setLoadingAction('report');
    const ok = await DocumentService.reportDocument(id);
    showFeedback(ok ? 'success' : 'error', ok ? 'Report submitted' : 'Report failed');
    setLoadingAction(null);
  };
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return {
          label: 'Published',
          classes: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
          icon: CheckCircle
        };
      case 'DRAFT':
        return {
          label: 'Draft',
          classes: 'text-slate-600 bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400',
          icon: Lock
        };
      case 'UNDER REVIEW':
        return {
          label: 'Under Review',
          classes: 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
          icon: Clock
        };
      case 'FLAGGED':
      case 'FAILED':
        return {
          label: status === 'FAILED' ? 'Failed' : 'Flagged',
          classes: 'text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-400',
          icon: Flag
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          classes: 'text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-400',
          icon: Clock
        };
      default:
        return { label: status, classes: '', icon: Clock };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const previewUrl = fileUrl || filePath;
  const fileLower = (previewUrl || '').toLowerCase();
  const isImage = /\.(png|jpe?g|webp|gif)$/.test(fileLower);
  const isPdf = fileLower.endsWith('.pdf') || Boolean(fileUrl);
  const canPreview = Boolean(previewUrl && (isImage || isPdf || previewUrl.startsWith('http')));
  const formatValue = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return 'Not available';
    return String(value);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-all group flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-slate-900 dark:text-white font-semibold mb-1 line-clamp-1">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{courseCode} - {courseName || 'Unknown course'}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.classes}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{statusConfig.label}</span>
        </div>
      </div>

      {/* FR-ST-43: The system shall display a visual thumbnail preview of the document */}
      <div className="relative aspect-[4/3] mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group-hover:border-indigo-300 dark:group-hover:border-indigo-900 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex items-center justify-center">
          {thumbnailUrl && !thumbnailFailed ? (
            <img
              src={thumbnailUrl}
              alt={`${title} first page`}
              className="w-full h-full object-cover object-top"
              onError={() => setThumbnailFailed(true)}
            />
          ) : isImage && previewUrl ? (
            <img src={previewUrl} alt={title} className="w-full h-full object-cover" />
          ) : isPdf ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-12 h-12 text-indigo-200 dark:text-indigo-900/50" />
              <span className="text-[10px] font-black text-indigo-300 dark:text-indigo-800 uppercase tracking-widest">PDF Document</span>
            </div>
          ) : (
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/20 to-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-[10px] font-medium text-white uppercase tracking-wider">First Page Preview</span>
            </div>
            {canPreview && (
              <button
                onClick={handlePreview}
                disabled={Boolean(loadingAction)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-black/35 px-2 py-1 rounded disabled:opacity-60 disabled:cursor-wait"
              >
                {loadingAction === 'preview' && <Loader2 className="w-3 h-3 animate-spin" />}
                Preview
              </button>
            )}
            <button
              onClick={() => setDetailsOpen(true)}
              className="text-[10px] font-semibold text-white bg-black/35 px-2 py-1 rounded"
            >
              Details
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1 flex flex-col">
        {status === 'PUBLISHED' && aiScore !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                AI Score: {aiScore}/100
              </span>
            </div>
            
            <button 
              onClick={handleDownload}
              disabled={Boolean(loadingAction)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-500/20 group/dl disabled:opacity-60 disabled:cursor-wait"
              title="Download Document"
            >
              {loadingAction === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover/dl:scale-110 transition-transform" />}
              <span className="text-xs font-bold">Download</span>
            </button>
          </div>
        )}

        {actionFeedback && (
          <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
          }`}>
            {actionFeedback.message}
          </div>
        )}

        {status === 'REJECTED' && (
          <div className="px-3 py-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-sm text-amber-700 dark:text-amber-400 italic">
                {reviewStatus || 'Rejected by manual review'}
              </span>
            </div>
          </div>
        )}

        {(status === 'FLAGGED' || status === 'FAILED') && (
          <div className="px-3 py-2 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-lg">
            <span className="text-sm text-red-700 dark:text-red-400 italic">
              Awaiting moderation review
            </span>
          </div>
        )}

        {(status === 'DRAFT' || status === 'UNDER REVIEW') && (
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
             <span className="text-sm text-slate-500 italic">{status === 'UNDER REVIEW' ? 'Liaison AI is reviewing this document' : 'Not yet submitted for review'}</span>
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
              <span className="text-xs">{currentDownloads}</span>
            </div>
            <button 
              onClick={handleLike}
              disabled={Boolean(loadingAction)}
              className={`flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-wait ${isLiked ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-indigo-600'}`}
              title={isLiked ? 'Remove like' : 'Like document'}
            >
              {loadingAction === 'like' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />}
              <span className="text-xs">{currentLikes}</span>
            </button>
            {status === 'PUBLISHED' && (
              <button
                onClick={handleReport}
                disabled={Boolean(loadingAction)}
                className="flex items-center gap-1 hover:text-red-600 transition-colors disabled:opacity-60 disabled:cursor-wait"
                title="Report document"
              >
                {loadingAction === 'report' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                <span className="sr-only">Report</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[80px]">{uploader || 'Anonymous'}</span>
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center border border-white dark:border-slate-700">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{(uploader || 'A').charAt(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {previewOpen && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white"
            >
              <X className="w-4 h-4" />
            </button>
            {isPdf ? (
              <iframe src={previewUrl} className="w-full h-full" title={title} />
            ) : isImage ? (
              <img src={previewUrl} alt={title} className="w-full h-full object-contain bg-slate-950" />
            ) : (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="block p-8 text-indigo-600">
                Open file in new tab
              </a>
            )}
          </div>
        </div>
      )}

      {detailsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{courseCode} - {courseName || 'Unknown course'}</p>
              </div>
              <button
                onClick={() => setDetailsOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close document details"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{formatValue(description)}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailField label="Faculty" value={formatValue(faculty)} />
                <DetailField label="Department" value={formatValue(departmentName)} />
                <DetailField label="Course" value={`${courseCode} - ${courseName || 'Unknown course'}`} />
                <DetailField label="Status" value={statusConfig.label} />
                <DetailField label="Uploader" value={formatValue(uploader)} />
                <DetailField label="Upload date" value={formatValue(uploadDate)} />
                <DetailField label="Quality score" value={aiScore !== undefined ? `${aiScore}/100` : 'Not available'} />
                <DetailField label="Likes" value={String(currentLikes)} />
                <DetailField label="Downloads" value={String(currentDownloads)} />
                <DetailField label="Views" value={String(views ?? 'Not available')} />
                <DetailField label="Reports" value={reportCount !== undefined ? String(reportCount) : 'Not available'} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
