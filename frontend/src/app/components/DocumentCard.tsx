import { useState } from 'react';
import { CheckCircle, Download, Eye, ThumbsUp, Clock, Sparkles, FileText, Lock, X, Flag } from 'lucide-react';
import { DocumentService } from '../services/DocumentService';

interface DocumentCardProps {
  title: string;
  courseCode: string;
  uploader: string;
  status: 'DRAFT' | 'UNDER REVIEW' | 'PUBLISHED' | 'REJECTED' | 'FLAGGED' | 'FAILED';
  aiScore?: number;
  downloads: number;
  views: number;
  likes: number;
  reviewStatus?: string;
  filePath?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  reportCount?: number;
  id: number;
  liked?: boolean;
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
  filePath,
  fileUrl,
  thumbnailUrl,
  id,
  liked,
}: DocumentCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentDownloads, setCurrentDownloads] = useState(downloads);
  const [isLiked, setIsLiked] = useState(liked);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // FR-ST-14: The system shall increase the "download count" upon clicking the download button
    await DocumentService.downloadDocument(id);
    setCurrentDownloads(prev => prev + 1);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // FR-ST-16: The system shall increase the document's "Like count" upon clicking the like button
    await DocumentService.likeDocument(id);
    if (isLiked) {
        setCurrentLikes(prev => prev - 1);
        setIsLiked(false);
    } else {
        setCurrentLikes(prev => prev + 1);
        setIsLiked(true);
    }
  };

  const handlePreview = async () => {
    setPreviewOpen(true);
    await DocumentService.viewDocument(id);
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await DocumentService.reportDocument(id);
    if (ok) alert('Report submitted for moderation review.');
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

      {/* FR-ST-43: The system shall display a visual thumbnail preview of the document */}
      <div className="relative aspect-[4/3] mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group-hover:border-indigo-300 dark:group-hover:border-indigo-900 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex items-center justify-center">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={`${title} first page`} className="w-full h-full object-cover object-top" />
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
                className="text-[10px] font-semibold text-white bg-black/35 px-2 py-1 rounded"
              >
                Preview
              </button>
            )}
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
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-500/20 group/dl"
              title="Download Document"
            >
              <Download className="w-4 h-4 group-hover/dl:scale-110 transition-transform" />
            </button>
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
              className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-indigo-600'}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{currentLikes}</span>
            </button>
            {status === 'PUBLISHED' && (
              <button
                onClick={handleReport}
                className="flex items-center gap-1 hover:text-red-600 transition-colors"
                title="Report document"
              >
                <Flag className="w-3.5 h-3.5" />
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
    </div>
  );
}
