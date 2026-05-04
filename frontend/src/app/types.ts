export interface NoteDocument {
  id: number;
  title: string;
  courseCode: string;
  faculty?: string;
  uploader?: string;
  uploaderName?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'REJECTED';
  aiScore?: number;
  score?: number;
  downloads: number;
  views: number;
  likes: number;
  reviewStatus?: string;
  uploadDate?: string;
  filePath?: string;
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