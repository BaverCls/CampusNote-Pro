INSERT INTO faculty (id, name) VALUES (1, 'Faculty of Engineering and Architecture') ON CONFLICT DO NOTHING;
INSERT INTO department (id, name, faculty_id) VALUES (1, 'Computer Engineering', 1) ON CONFLICT DO NOTHING;
INSERT INTO course (id, code, name, ects, department_id) VALUES (1, 'CENG 101', 'Introduction to Computer Engineering', 6, 1) ON CONFLICT DO NOTHING;
