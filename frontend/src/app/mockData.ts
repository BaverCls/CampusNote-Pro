import { NoteDocument, UploadedDocument, UserStats, RecentDocument, LeaderboardUser } from './types';

export const mockDocuments: NoteDocument[] = [
  {
    id: 1,
    title: 'Quantum Computing - Introduction & Qubits',
    courseCode: 'CSE501',
    uploader: 'Sarah Chen',
    status: 'under-review',
    downloads: 0,
    views: 12,
    likes: 0,
    reviewStatus: 'Awaiting AI Score',
  },
  {
    id: 2,
    title: 'Cloud Architecture - AWS Best Practices',
    courseCode: 'CSE402',
    uploader: 'Sarah Chen',
    status: 'draft',
    downloads: 0,
    views: 8,
    likes: 0,
    reviewStatus: 'Drafting content...',
  },
  {
    id: 3,
    title: 'Data Structures & Algorithms - Complete Notes',
    courseCode: 'CSE301',
    aiScore: 96,
    uploader: 'Alex Kim',
    status: 'published',
    downloads: 1243,
    views: 3421,
    likes: 287,
  },
  {
    id: 4,
    title: 'Machine Learning Fundamentals',
    courseCode: 'CSE401',
    aiScore: 92,
    uploader: 'Jordan Lee',
    status: 'published',
    downloads: 987,
    views: 2156,
    likes: 194,
  },
  {
    id: 5,
    title: 'Database Systems - ER Diagrams & SQL',
    courseCode: 'CSE302',
    aiScore: 89,
    uploader: 'Maya Patel',
    status: 'published',
    downloads: 756,
    views: 1892,
    likes: 143,
  },
];

export const userStats: UserStats = {
  notesUploaded: 12,
  totalDownloads: 450,
  totalLikes: 89,
  campusCoins: 2450,
  rank: "Gold",
  memberSince: "September 2025",
};

export const uploadedDocuments: UploadedDocument[] = [
  { id: 1, title: "Data Structures & Algorithms - Complete Notes", courseCode: "CSE301", downloads: 156, likes: 32, status: "published", date: "2026-04-15" },
  { id: 2, title: "Machine Learning Fundamentals", courseCode: "CSE401", downloads: 98, likes: 21, status: "published", date: "2026-04-10" },
  { id: 3, title: "Database Systems - ER Diagrams", courseCode: "CSE302", downloads: 67, likes: 15, status: "draft", date: "2026-04-08" },
  { id: 4, title: "Operating Systems Process Management", courseCode: "CSE303", downloads: 129, likes: 21, status: "published", date: "2026-04-05" },
];

export const recentDocuments: RecentDocument[] = [
  { title: 'Data Structures & Algorithms', status: 'published', date: '2 hours ago' },
  { title: 'Machine Learning Notes', status: 'draft', date: '1 day ago' },
  { title: 'Database Systems ER Diagrams', status: 'published', date: '3 days ago' },
];

export const topUsers: LeaderboardUser[] = [
  { name: 'Alex Kim', coins: 5240, rank: 'Platinum', position: 1 },
  { name: 'Maya Patel', coins: 4150, rank: 'Gold', position: 2 },
  { name: 'Chris Wong', coins: 3890, rank: 'Gold', position: 3 },
];

export const faculties = ['Engineering', 'Science', 'Business', 'Arts', 'Medicine'];

export const departments: Record<string, string[]> = {
  Engineering: ['Computer Science', 'Electrical', 'Mechanical', 'Civil'],
  Science: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
  Business: ['Finance', 'Marketing', 'Management', 'Accounting'],
  Arts: ['English', 'History', 'Philosophy', 'Fine Arts'],
  Medicine: ['Clinical Medicine', 'Surgery', 'Pediatrics', 'Radiology'],
};

export const courses: Record<string, string[]> = {
  'Computer Science': ['CSE101', 'CSE201', 'CSE301', 'CSE401'],
  Electrical: ['EE101', 'EE201', 'EE301', 'EE401'],
  Mechanical: ['ME101', 'ME201', 'ME301', 'ME401'],
};

// Sanal API İsteği (Mock API Fetch) - 800ms gecikme ile verileri döndürür
export const fetchDocuments = (): Promise<NoteDocument[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDocuments);
    }, 800);
  });
};