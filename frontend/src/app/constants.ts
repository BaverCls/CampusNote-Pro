export const faculties = [
  { id: '1', name: 'Engineering', icon: '🛠️' },
  { id: '2', name: 'Medicine', icon: '🩺' },
  { id: '3', name: 'Business', icon: '📊' },
  { id: '4', name: 'Law', icon: '⚖️' },
  { id: '5', name: 'Architecture', icon: '🏛️' },
];

export const departments = [
  { id: '1', name: 'Computer Engineering', facultyId: '1' },
  { id: '2', name: 'Electrical Engineering', facultyId: '1' },
  { id: '3', name: 'Mechanical Engineering', facultyId: '1' },
  { id: '4', name: 'General Medicine', facultyId: '2' },
  { id: '5', name: 'Business Administration', facultyId: '3' },
  { id: '6', name: 'Economics', facultyId: '3' },
  { id: '7', name: 'International Law', facultyId: '4' },
  { id: '8', name: 'Interior Design', facultyId: '5' },
];

export const courses = [
  // Computer Engineering (Dept 1)
  { id: '1', name: 'CS101 - Intro to Programming', deptId: '1', code: 'CS101' },
  { id: '2', name: 'CS201 - Data Structures', deptId: '1', code: 'CS201' },
  { id: '3', name: 'CS301 - Algorithms', deptId: '1', code: 'CS301' },
  
  // Electrical Engineering (Dept 2)
  { id: '4', name: 'EE101 - Circuit Theory', deptId: '2', code: 'EE101' },
  
  // Medicine (Dept 4)
  { id: '5', name: 'MED101 - Anatomy I', deptId: '4', code: 'MED101' },
  
  // Business (Dept 5)
  { id: '6', name: 'BUS101 - Principles of Management', deptId: '5', code: 'BUS101' },
];
