import { authFetch } from './AuthService';
import { API_URL } from './config';

export interface FacultyMeta {
  id: number;
  name: string;
}

export interface DepartmentMeta {
  id: number;
  name: string;
  facultyId: number | null;
}

export const MetaService = {
  async getFaculties(): Promise<FacultyMeta[]> {
    const response = await fetch(`${API_URL}/meta/faculties`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch faculties (${response.status})`);
    }
    return response.json();
  },

  async getDepartments(): Promise<DepartmentMeta[]> {
    const response = await fetch(`${API_URL}/meta/departments`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch departments (${response.status})`);
    }
    return response.json();
  },
};
