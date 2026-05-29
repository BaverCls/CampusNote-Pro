import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, GraduationCap, School, Layers, Calendar, Hash, Loader2, Pencil } from 'lucide-react';
import { CourseService, Course, CourseUpsertPayload } from '../services/CourseService';
import { MetaService, FacultyMeta, DepartmentMeta } from '../services/MetaService';
import { toast } from 'sonner';

export function AdminCourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [faculties, setFaculties] = useState<FacultyMeta[]>([]);
  const [departments, setDepartments] = useState<DepartmentMeta[]>([]);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFacultyId, setFilterFacultyId] = useState<string>('');
  const [filterDepartmentId, setFilterDepartmentId] = useState<number>(0);
  const [filterYear, setFilterYear] = useState<number>(0);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    ects: 5,
    semester: 1,
    year: 1,
    departmentId: 0,
    facultyId: ''
  });

  useEffect(() => {
    fetchCourses();
    Promise.all([MetaService.getFaculties(), MetaService.getDepartments()])
      .then(([facs, depts]) => {
        setFaculties(facs);
        setDepartments(depts);
      })
      .catch(() => toast.error('Failed to load faculty/department metadata'));
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const data = await CourseService.getAll();
    setCourses(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', ects: 5, semester: 1, year: 1, departmentId: 0, facultyId: '' });
    setEditingCourseId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId || !formData.facultyId) {
      toast.error('Please select both faculty and department');
      return;
    }

    const payload: CourseUpsertPayload = {
      name: formData.name,
      code: formData.code,
      ects: Number(formData.ects),
      semester: Number(formData.semester),
      year: Number(formData.year),
      departmentId: Number(formData.departmentId),
      facultyId: Number(formData.facultyId)
    };
    const result = editingCourseId
      ? await CourseService.update(editingCourseId, payload)
      : await CourseService.create(payload);

    if (result) {
      toast.success(editingCourseId ? 'Course updated successfully!' : 'Course created successfully!');
      resetForm();
      setIsAdding(false);
      fetchCourses();
    } else {
      toast.error(editingCourseId ? 'Failed to update course' : 'Failed to create course');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      const success = await CourseService.delete(id);
      if (success) {
        toast.success('Course deleted');
        fetchCourses();
      }
    }
  };

  const handleEdit = (course: Course) => {
    const facultyIdFromDept = course.department?.id 
      ? departments.find(d => d.id === course.department?.id)?.facultyId 
      : null;

    setFormData({
      name: course.name || '',
      code: course.code || '',
      ects: course.ects || 5,
      semester: course.semester || 1,
      year: (course.year && course.year >= 1 && course.year <= 4) ? course.year : 1,
      departmentId: course.department?.id || 0,
      facultyId: (course.faculty?.id || facultyIdFromDept) ? String(course.faculty?.id || facultyIdFromDept) : '',
    });
    setEditingCourseId(course.id);
    setIsAdding(true);
  };

  const filteredDepts = departments.filter(d => String(d.facultyId) === formData.facultyId);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      (course.code?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (course.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
    const matchesFaculty = filterFacultyId 
      ? (course.faculty?.id === Number(filterFacultyId) || 
         departments.find(d => d.id === course.department?.id)?.facultyId === Number(filterFacultyId))
      : true;

    const matchesDept = filterDepartmentId 
      ? course.department?.id === filterDepartmentId 
      : true;

    const matchesYear = filterYear 
      ? course.year === filterYear 
      : true;

    return matchesSearch && matchesFaculty && matchesDept && matchesYear;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Course Management</h2>
          <p className="text-sm text-slate-500 font-medium">Curriculum and academic units</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
            isAdding 
              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' 
              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
          }`}
        >
          {isAdding ? <Layers className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'View All Courses' : 'Add New Course'}
        </button>
      </div>

      {isAdding ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-600/10 p-8 shadow-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            {editingCourseId ? 'Edit Academic Unit' : 'Create Academic Unit'}
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" /> Course Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Data Structures"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl focus:outline-none transition-all dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" /> Course Code
              </label>
              <input
                required
                type="text"
                placeholder="e.g. CENL 202"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl focus:outline-none transition-all dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" /> Faculty
              </label>
              <select
                required
                value={formData.facultyId}
                onChange={e => setFormData({...formData, facultyId: e.target.value, departmentId: 0})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl focus:outline-none transition-all dark:text-white"
              >
                <option value="">Select Faculty</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <School className="w-4 h-4 text-slate-400" /> Department
              </label>
              <select
                required
                disabled={!formData.facultyId}
                value={formData.departmentId}
                onChange={e => setFormData({...formData, departmentId: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl focus:outline-none transition-all dark:text-white disabled:opacity-50"
              >
                <option value={0}>Select Department</option>
                {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ECTS</label>
                <input
                  type="number"
                  value={formData.ects}
                  onChange={e => setFormData({...formData, ects: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl focus:outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Year</label>
                <select
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl focus:outline-none transition-all dark:text-white"
                >
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Semester</label>
                <select
                  value={formData.semester}
                  onChange={e => setFormData({...formData, semester: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-xl focus:outline-none transition-all dark:text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                {editingCourseId ? 'Update Course' : 'Save Course to Curriculum'}
              </button>
            </div>
            {editingCourseId && (
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel Editing
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search & Filters Pane */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Course</label>
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600 dark:text-white text-xs"
              />
            </div>
            
            {/* Faculty Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Faculty</label>
              <select
                value={filterFacultyId}
                onChange={e => {
                  setFilterFacultyId(e.target.value);
                  setFilterDepartmentId(0);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600 dark:text-white text-xs"
              >
                <option value="">All Faculties</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {/* Department Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
              <select
                value={filterDepartmentId}
                onChange={e => setFilterDepartmentId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600 dark:text-white text-xs"
              >
                <option value={0}>All Departments</option>
                {departments
                  .filter(d => !filterFacultyId || String(d.facultyId) === filterFacultyId)
                  .map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                }
              </select>
            </div>

            {/* Year Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Year</label>
              <select
                value={filterYear}
                onChange={e => setFilterYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600 dark:text-white text-xs"
              >
                <option value={0}>All Years</option>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-medium">Loading courses...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="py-20 text-center text-slate-500 italic">No courses found matching filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Code</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Course Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">ECTS</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Academic Unit</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredCourses.map(course => (
                      <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-black text-indigo-600">{course.code}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{course.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase">Year {course.year} • Semester {course.semester}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded text-xs font-bold">
                            {course.ects}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {course.department?.name || 'Unknown Dept'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(course)}
                            className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
