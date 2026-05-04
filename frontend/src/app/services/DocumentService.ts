import { NoteDocument } from '../types';

const API_URL = 'http://localhost:8080/api';

export interface DocumentUploadData {
  title: string;
  courseCode: string;
  faculty: string;
  filePath: string;
}

interface DocumentApiDTO {
  id: number;
  title: string;
  courseCode: string;
  faculty?: string;
  score?: number;
  uploaderName?: string;
  uploadDate?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'REJECTED';
  filePath?: string;
}

const toNoteDocument = (doc: DocumentApiDTO): NoteDocument => ({
  id: doc.id,
  title: doc.title,
  courseCode: doc.courseCode,
  faculty: doc.faculty || '',
  uploader: doc.uploaderName || 'Anonymous',
  uploaderName: doc.uploaderName || 'Anonymous',
  status: doc.status || 'DRAFT',
  aiScore: doc.score ?? 0,
  score: doc.score ?? 0,
  downloads: 0,
  views: 0,
  likes: 0,
  uploadDate: doc.uploadDate,
  filePath: doc.filePath,
});

export const DocumentService = {
  // Cache keys
  FEED_CACHE: 'campusnote_feed_cache',
  USER_DOCS_CACHE: 'campusnote_user_docs_cache',

  async getFeed(): Promise<NoteDocument[]> {
    // 1. Try to return from cache first for instant UI
    const cached = localStorage.getItem(this.FEED_CACHE);
    let initialData = cached ? JSON.parse(cached) : [];

    try {
      const response = await fetch(`${API_URL}/documents/feed`, {
        mode: 'cors',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: DocumentApiDTO[] = await response.json();
      const data = payload.map(toNoteDocument);
      
      // 2. Update cache with fresh data
      localStorage.setItem(this.FEED_CACHE, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Feed Fetch Error (using cache):', error);
      return initialData; // 3. Return cached data even if network fails
    }
  },

  async getUserDocuments(): Promise<NoteDocument[]> {
    const cacheKey = `${this.USER_DOCS_CACHE}_me`;
    const cached = localStorage.getItem(cacheKey);
    let initialData = cached ? JSON.parse(cached) : [];

    try {
      const response = await fetch(`${API_URL}/documents/my`, {
        mode: 'cors',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: DocumentApiDTO[] = await response.json();
      const data = payload.map(toNoteDocument);
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('My Docs Fetch Error (using cache):', error);
      return initialData;
    }
  },

  async getAllDocuments(): Promise<NoteDocument[]> {
    try {
      const response = await fetch(`${API_URL}/documents/all`, {
        mode: 'cors',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: DocumentApiDTO[] = await response.json();
      return payload.map(toNoteDocument);
    } catch (error) {
      console.error('All Docs Fetch Error:', error);
      return [];
    }
  },

  async uploadDocument(data: DocumentUploadData): Promise<NoteDocument | null> {
    try {
      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      const payload: DocumentApiDTO = await response.json();
      return toNoteDocument(payload);
    } catch (error) {
      console.error('Document Upload Error:', error);
      return null;
    }
  },

  async reviewDocument(id: number, score: number, approve: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/documents/${id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, approve }),
      });
      return response.ok;
    } catch (error) {
      console.error('Document Review Error:', error);
      return false;
    }
  }
};
