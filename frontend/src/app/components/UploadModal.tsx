import { useState, useEffect } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DocumentService } from '../services/DocumentService';
import { AuthService } from '../services/AuthService';
import { CourseService, Course } from '../services/CourseService';
import { MetaService, FacultyMeta, DepartmentMeta } from '../services/MetaService';
import { toast } from 'sonner';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<FacultyMeta[]>([]);
  const [departments, setDepartments] = useState<DepartmentMeta[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadCourses();
      loadMeta();
    }
  }, [isOpen]);

  const loadMeta = async () => {
    try {
      const [facs, depts] = await Promise.all([MetaService.getFaculties(), MetaService.getDepartments()]);
      setFaculties(facs);
      setDepartments(depts);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await CourseService.getAll();
      setAllCourses(data);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setUploadError('Courses could not be loaded. Please try again.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const currentUser = AuthService.getCurrentUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // FR-ST-15: PDF only
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed.');
        return;
      }
      
      // FR-ST-16: 50MB limit
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('File size exceeds 50MB limit.');
        return;
      }
      
      setUploadError('');
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCourseId) return;

    if (!currentUser) {
      navigate('/login');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const faculty = faculties.find(f => String(f.id) === selectedFacultyId)?.name || '';
      const course = allCourses.find(c => c.id.toString() === selectedCourseId);

      const result = await DocumentService.uploadDocument({
        title: selectedFile.name,
        courseCode: course?.code || '',
        faculty: faculty,
        file: selectedFile
      });

      if (result) {
        toast.success('Upload received. Liaison AI is reviewing your PDF.');
        onClose();
        if (onSuccess) onSuccess();
        let checks = 0;
        const uploadedId = result.id;
        const interval = window.setInterval(async () => {
          checks += 1;
          const docs = await DocumentService.getUserDocuments();
          const uploaded = docs.find((doc) => doc.id === uploadedId);
          if (uploaded?.status === 'PUBLISHED') {
            toast.success(`${uploaded.title} passed AI verification and is now published.`);
            window.clearInterval(interval);
            if (onSuccess) onSuccess();
          } else if (uploaded?.status === 'REJECTED' || uploaded?.status === 'FLAGGED' || uploaded?.status === 'FAILED') {
            toast.error(`${uploaded.title} was uploaded but rejected by review.`);
            window.clearInterval(interval);
            if (onSuccess) onSuccess();
          } else if (checks >= 8) {
            window.clearInterval(interval);
          }
        }, 1500);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        return;
      }
      console.error('Document Upload Error:', error);
      const errorMsg = error instanceof Error ? error.message : '';
      if (errorMsg.includes('413')) {
        setUploadError('File is too large. Maximum allowed size is 50 MB.');
      } else if (errorMsg.includes('400')) {
        setUploadError('Only PDF files are allowed.');
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // FR-ST-15: PDF only
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed.');
        return;
      }
      // FR-ST-16: 50MB limit
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('File size exceeds 50MB limit.');
        return;
      }
      setUploadError('');
      setSelectedFile(file);
    }
  };

  if (!isOpen) return null;

  // Filter logic
  const filteredDepartments = departments.filter(d => String(d.facultyId) === selectedFacultyId);
  const filteredCourses = allCourses.filter(c => c.department?.id.toString() === selectedDeptId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-slate-900 dark:text-white font-bold text-xl">Upload Study Note</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {uploadError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
              {uploadError}
            </div>
          )}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            {selectedFile ? (
              <div className="flex items-center justify-between gap-3 p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl w-full max-w-md mx-auto shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-left truncate max-w-[200px] sm:max-w-xs">
                    <p className="text-slate-900 dark:text-white font-semibold truncate text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadError('');
                    const fileInput = document.getElementById('note-file-input') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium mb-2">
                  Drag and drop your PDF here
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">or</p>
                <label className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-all font-semibold shadow-md active:scale-95">
                  Browse Files
                  <input
                    id="note-file-input"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-4">
                  Maximum file size: 50MB
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Select Faculty</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {faculties.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFacultyId(String(f.id));
                      setSelectedDeptId('');
                      setSelectedCourseId('');
                    }}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                      selectedFacultyId === String(f.id)
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Department</label>
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedCourseId('');
                }}
                disabled={!selectedFacultyId}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <option value="">Choose Department</option>
                {filteredDepartments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={!selectedDeptId || loadingCourses}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <option value="">{loadingCourses ? 'Loading courses...' : 'Choose Course'}</option>
                {filteredCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={!selectedFile || !selectedCourseId || isUploading}
              onClick={handleUpload}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-600/20 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
