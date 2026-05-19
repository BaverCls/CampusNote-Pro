import { NoteDocument } from '../types';
import { authFetch } from './AuthService';
import { API_URL } from './config';

export interface DocumentUploadData {
  title: string;
  content?: string;
  courseCode: string;
  faculty: string;
  file: File;
}

function assertValidDocumentId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid document id: expected positive integer but got ${String(id)}`);
  }
}

interface DocumentApiDTO {
  id: number;
  title: string;
  courseCode: string;
  faculty?: string;
  score?: number;
  uploaderName?: string;
  uploadDate?: string;
  status?: 'DRAFT' | 'UNDER REVIEW' | 'PUBLISHED' | 'REJECTED' | 'FLAGGED' | 'FAILED';
  filePath?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  downloadCount?: number;
  viewCount?: number;
  likeCount?: number;
  reportCount?: number;
  liked?: boolean;
}

interface ApiActionResponse {
  message: string;
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
  downloads: doc.downloadCount ?? 0,
  views: doc.viewCount ?? 0,
  likes: doc.likeCount ?? 0,
  uploadDate: doc.uploadDate,
  filePath: doc.filePath,
  fileUrl: doc.fileUrl ? `${API_URL}${doc.fileUrl}` : undefined,
  thumbnailUrl: doc.thumbnailUrl ? `${API_URL}${doc.thumbnailUrl}` : undefined,
  reportCount: doc.reportCount ?? 0,
  liked: doc.liked,
});

export const DocumentService = {
  FEED_CACHE: 'campusnote_feed_cache',
  USER_DOCS_CACHE: 'campusnote_user_docs_cache',

  async getFeed(): Promise<NoteDocument[]> {
    const cached = localStorage.getItem(this.FEED_CACHE);
    let initialData = cached ? JSON.parse(cached) : [];

    try {
      const response = await authFetch(`${API_URL}/documents/feed`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: DocumentApiDTO[] = await response.json();
      const data = payload.map(toNoteDocument);
      
      localStorage.setItem(this.FEED_CACHE, JSON.stringify(data));
      return data;
    } catch (error) {
      // CRITICAL: If session expired, don't just return cache, let authFetch handle it
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
      
      console.error('Feed Fetch Error (using cache):', error);
      return initialData;
    }
  },

  async searchDocuments(query: string, facultyId?: string, sortBy?: 'latest' | 'downloads' | 'score'): Promise<NoteDocument[]> {
    const params = new URLSearchParams();
    params.set('query', query || '');
    if (facultyId) params.set('facultyId', facultyId);
    if (sortBy) params.set('sortBy', sortBy);

    const response = await authFetch(`${API_URL}/documents/search?${params.toString()}`, {
      mode: 'cors',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload: DocumentApiDTO[] = await response.json();
    return payload.map(toNoteDocument);
  },

  async getUserDocuments(): Promise<NoteDocument[]> {
    const cacheKey = `${this.USER_DOCS_CACHE}_me`;
    const cached = localStorage.getItem(cacheKey);
    let initialData = cached ? JSON.parse(cached) : [];

    try {
      const response = await authFetch(`${API_URL}/documents/my`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: DocumentApiDTO[] = await response.json();
      const data = payload.map(toNoteDocument);
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
      console.error('My Docs Fetch Error (using cache):', error);
      return initialData;
    }
  },

  async getAllDocuments(): Promise<NoteDocument[]> {
    try {
      const response = await authFetch(`${API_URL}/documents/all`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: DocumentApiDTO[] = await response.json();
      return payload.map(toNoteDocument);
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
      console.error('All Docs Fetch Error:', error);
      throw error;
    }
  },

  async uploadDocument(data: DocumentUploadData): Promise<NoteDocument | null> {
    if (!data.title?.trim() || !data.courseCode?.trim() || !data.file) {
      throw new Error('Validation failed: title, courseCode and file are required');
    }
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('courseCode', data.courseCode);
    formData.append('faculty', data.faculty || '');
    if (data.content) formData.append('content', data.content);

    const response = await authFetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Upload failed: ${response.status} ${errorBody}`);
    }
    const payload: DocumentApiDTO = await response.json();
    return toNoteDocument(payload);
  },

  async reviewDocument(id: number, score: number, approve: boolean): Promise<boolean> {
    try {
      assertValidDocumentId(id);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        throw new Error(`Validation failed: score must be 0-100 but got ${score}`);
      }
      const response = await authFetch(`${API_URL}/documents/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, approve }),
      });
      return response.ok;
    } catch (error) {
      console.error('Document Review Error:', error);
      return false;
    }
  },

  async viewDocument(id: number): Promise<void> {
    try {
      assertValidDocumentId(id);
      await authFetch(`${API_URL}/documents/${id}/view`, { method: 'POST' });
    } catch (error) {
      console.error('View Document Error:', error);
    }
  },

  async downloadDocument(id: number): Promise<void> {
    try {
      assertValidDocumentId(id);
      window.location.href = `${API_URL}/documents/${id}/download`;
    } catch (error) {
      console.error('Download Document Error:', error);
    }
  },

  async likeDocument(id: number): Promise<void> {
    try {
      assertValidDocumentId(id);
      await authFetch(`${API_URL}/documents/${id}/like`, { method: 'POST' });
    } catch (error) {
      console.error('Like Document Error:', error);
    }
  }
  ,
  async reportDocument(id: number): Promise<boolean> {
    try {
      assertValidDocumentId(id);
      const response = await authFetch(`${API_URL}/documents/${id}/report`, { method: 'POST' });
      return response.ok;
    } catch (error) {
      console.error('Report Document Error:', error);
      return false;
    }
  }
  ,
  async deleteDocument(id: number): Promise<boolean> {
    try {
      assertValidDocumentId(id);
      const response = await authFetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
      if (!response.ok) return false;
      await response.json().catch(() => ({}) as ApiActionResponse);
      return true;
    } catch (error) {
      console.error('Delete Document Error:', error);
      return false;
    }
  }
};
