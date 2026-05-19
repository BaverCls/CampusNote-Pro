-- Faculties (must match frontend constants.ts IDs)
INSERT INTO faculty (id, name) VALUES (1, 'Engineering') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO faculty (id, name) VALUES (2, 'Medicine') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO faculty (id, name) VALUES (3, 'Business') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO faculty (id, name) VALUES (4, 'Law') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO faculty (id, name) VALUES (5, 'Architecture') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Departments (must match frontend constants.ts IDs and facultyId references)
INSERT INTO department (id, name, faculty_id) VALUES (1, 'Computer Engineering', 1) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id;
INSERT INTO department (id, name, faculty_id) VALUES (2, 'Electrical Engineering', 1) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id;
INSERT INTO department (id, name, faculty_id) VALUES (3, 'Mechanical Engineering', 1) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id;
INSERT INTO department (id, name, faculty_id) VALUES (4, 'General Medicine', 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id;
INSERT INTO department (id, name, faculty_id) VALUES (5, 'Business Administration', 3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id;
INSERT INTO department (id, name, faculty_id) VALUES (6, 'Economics', 3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id;
INSERT INTO department (id, name, faculty_id) VALUES (7, 'International Law', 4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id;
INSERT INTO department (id, name, faculty_id) VALUES (8, 'Interior Design', 5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id;

-- Courses (must match frontend constants.ts codes)
INSERT INTO course (id, name, code, ects, department_id, semester, academic_year) VALUES (1, 'Intro to Programming', 'CS101', 6, 1, 1, 2024) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, ects = EXCLUDED.ects, department_id = EXCLUDED.department_id;
INSERT INTO course (id, name, code, ects, department_id, semester, academic_year) VALUES (2, 'Data Structures', 'CS201', 6, 1, 3, 2024) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, ects = EXCLUDED.ects, department_id = EXCLUDED.department_id;
INSERT INTO course (id, name, code, ects, department_id, semester, academic_year) VALUES (3, 'Algorithms', 'CS301', 6, 1, 5, 2024) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, ects = EXCLUDED.ects, department_id = EXCLUDED.department_id;
INSERT INTO course (id, name, code, ects, department_id, semester, academic_year) VALUES (4, 'Circuit Theory', 'EE101', 5, 2, 1, 2024) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, ects = EXCLUDED.ects, department_id = EXCLUDED.department_id;
INSERT INTO course (id, name, code, ects, department_id, semester, academic_year) VALUES (5, 'Anatomy I', 'MED101', 8, 4, 1, 2024) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, ects = EXCLUDED.ects, department_id = EXCLUDED.department_id;
INSERT INTO course (id, name, code, ects, department_id, semester, academic_year) VALUES (6, 'Principles of Management', 'BUS101', 5, 5, 1, 2024) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, ects = EXCLUDED.ects, department_id = EXCLUDED.department_id;
