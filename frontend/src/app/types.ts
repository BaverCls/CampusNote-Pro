export interface NoteDocument {
  id: number;
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