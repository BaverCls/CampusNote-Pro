export interface UserData {
  id: number;
  email: string;
  fullName: string;
  coinBalance: number;
}

const API_URL = 'http://localhost:8080/api';

export const UserService = {
  LEADERBOARD_CACHE: 'campusnote_leaderboard_cache',

  async getUsers(): Promise<UserData[]> {
    try {
      const response = await fetch(`${API_URL}/users`, {
        mode: 'cors',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Users Fetch Error:', error);
      return [];
    }
  },

  async getProfile(): Promise<UserData | null> {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        mode: 'cors',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Profile Fetch Error:', error);
      return null;
    }
  },

  async getLeaderboard(): Promise<UserData[]> {
    const cached = localStorage.getItem(this.LEADERBOARD_CACHE);
    let initialData = cached ? JSON.parse(cached) : [];

    try {
      const response = await fetch(`${API_URL}/users/leaderboard`, {
        mode: 'cors',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      localStorage.setItem(this.LEADERBOARD_CACHE, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Leaderboard Fetch Error (using cache):', error);
      return initialData;
    }
  }
};
