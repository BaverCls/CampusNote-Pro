import { authFetch } from './AuthService';
import { API_URL } from './config';

export interface Course {
  id: number;
  name: string;
  code: string;
  ects: number;
  semester: number;
  year: number;
  department?: {
    id: number;
    name: string;
  };
  faculty?: {
    id: number;
    name: string;
  };
}

export interface CourseUpsertPayload {
  name: string;
  code: string;
  ects: number;
  semester: number;
  year: number;
  departmentId: number;
  facultyId: number;
}

export interface ApiActionResponse {
  message: string;
}

export const CourseService = {
  async getAll(): Promise<Course[]> {
    try {
      const response = await authFetch(`${API_URL}/courses`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return await response.json();
    } catch (error) {
      console.error('Course Fetch Error:', error);
      throw error;
    }
  },

  async create(data: CourseUpsertPayload): Promise<Course | null> {
    if (!data.name.trim() || !data.code.trim()) {
      console.error('Course Creation Error: name/code are required');
      return null;
    }
    const numericFields = { 
      ects: data.ects, 
      semester: data.semester, 
      year: data.year, 
      departmentId: data.departmentId, 
      facultyId: data.facultyId 
    };

    for (const [field, val] of Object.entries(numericFields)) {
      if (!Number.isInteger(val) || val <= 0) {
        console.error(`Course Creation Error: invalid ${field} value:`, val);
        return null;
      }
    }

    if (data.year < 1 || data.year > 4) {
      console.error('Course Creation Error: year must be 1-4');
      return null;
    }

    try {
      console.log('Sending Course Creation Payload:', JSON.stringify(data, null, 2));
      const response = await authFetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Course Creation Error Details:', errorData);
        throw new Error(`Failed to create course (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error('Course Creation Error:', error);
      return null;
    }
  },

  async update(id: number, data: CourseUpsertPayload): Promise<Course | null> {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('Course Update Error: invalid course id type');
      return null;
    }
    if (!data.name.trim() || !data.code.trim()) {
      console.error('Course Update Error: name/code are required');
      return null;
    }
    const numericFields = { 
      ects: data.ects, 
      semester: data.semester, 
      year: data.year, 
      departmentId: data.departmentId, 
      facultyId: data.facultyId 
    };

    for (const [field, val] of Object.entries(numericFields)) {
      if (!Number.isInteger(val) || val <= 0) {
        console.error(`Course Update Error: invalid ${field} value:`, val);
        return null;
      }
    }

    if (data.year < 1 || data.year > 4) {
      console.error('Course Update Error: year must be 1-4');
      return null;
    }
    try {
      const response = await authFetch(`${API_URL}/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Course Update Error Details:', errorData);
        throw new Error(`Failed to update course (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error('Course Update Error:', error);
      return null;
    }
  },

  async delete(id: number): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      console.error('Course Deletion Error: invalid course id type');
      return false;
    }
    try {
      const response = await authFetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Course Deletion Error:', error);
      return false;
    }
  }
};
