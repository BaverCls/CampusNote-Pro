import { authFetch } from './AuthService';
import { API_URL } from './config';

export interface UserData {
  id: number;
  email: string;
  fullName: string;
  coinBalance: number;
  bio?: string;
  university?: string;
  facultyId?: number;
  departmentId?: number;
  facultyName?: string;
  departmentName?: string;
  isActive?: boolean;
  role?: 'STUDENT' | 'ADMIN';
  year?: number;
}

export const UserService = {
  LEADERBOARD_CACHE: 'campusnote_leaderboard_cache',

  async getUsers(): Promise<UserData[]> {
    try {
      const response = await authFetch(`${API_URL}/admin/users`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
      console.error('Users Fetch Error:', error);
      throw error;
    }
  },

  async getProfile(): Promise<UserData | null> {
    try {
      const response = await authFetch(`${API_URL}/users/me`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
      console.error('Profile Fetch Error:', error);
      return null;
    }
  },

  async updateProfile(data: Partial<UserData>): Promise<UserData | null> {
    try {
      const response = await authFetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Update failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
      console.error('Update Profile Error:', error);
      return null;
    }
  },

  async banUser(id: number): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('Ban User Error: invalid user id type');
      return false;
    }
    try {
      const response = await authFetch(`${API_URL}/admin/users/${id}/suspend`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Ban User Error:', error);
      return false;
    }
  },

  async deleteUser(id: number): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('Delete User Error: invalid user id type');
      return false;
    }
    try {
      const response = await authFetch(`${API_URL}/users/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Delete User Error:', error);
      return false;
    }
  },

  async getLeaderboard(facultyId?: number): Promise<UserData[]> {
    const cacheKey = facultyId ? `${this.LEADERBOARD_CACHE}_${facultyId}` : this.LEADERBOARD_CACHE;
    const url = facultyId ? `${API_URL}/users/leaderboard?facultyId=${facultyId}` : `${API_URL}/users/leaderboard`;

    try {
      const response = await authFetch(url, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
      console.error('Leaderboard Fetch Error:', error);
      throw error;
    }
  },

  async getLeaderboardForFaculty(facultyName?: string): Promise<UserData[]> {
    const normalized = facultyName?.trim() || '';
    const cacheKey = normalized
      ? `${this.LEADERBOARD_CACHE}_faculty_${normalized.toLowerCase()}`
      : `${this.LEADERBOARD_CACHE}_faculty_default`;

    const url = normalized
      ? `${API_URL}/leaderboard?faculty=${encodeURIComponent(normalized)}`
      : `${API_URL}/leaderboard`;

    try {
      const response = await authFetch(url, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
      console.error('Faculty Leaderboard Fetch Error:', error);
      throw error;
    }
  }
};
