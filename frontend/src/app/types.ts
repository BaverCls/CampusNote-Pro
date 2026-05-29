export interface NoteDocument {
  id: number;
  title: string;
  description?: string;
  courseCode: string;
  courseName?: string;
  faculty?: string;
  departmentName?: string;
  uploader?: string;
  uploaderName?: string;
  status: 'DRAFT' | 'UNDER REVIEW' | 'PUBLISHED' | 'REJECTED' | 'FLAGGED' | 'FAILED';
  aiScore?: number;
  score?: number;
  downloads: number;
  views: number;
  likes: number;
  reviewStatus?: string;
  uploadDate?: string;
  filePath?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  reportCount?: number;
  liked?: boolean;
}

export interface UploadedDocument {
  id: number;
  title: string;
  courseCode: string;
  downloads: number;
  likes: number;
  status: "published" | "draft";
  date: string;
}

export interface UserStats {
  notesUploaded: number;
  totalDownloads: number;
  totalLikes: number;
  campusCoins: number;
  rank: string;
  memberSince: string;
}

export interface RecentDocument {
  title: string;
  status: "published" | "draft";
  date: string;
}

export interface LeaderboardUser {
  name: string;
  coins: number;
  rank: string;
  position: number;
}
