package campusnote.backend.CoreDocumentManagement;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AcademicMetadataInitializer implements CommandLineRunner {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;

    public AcademicMetadataInitializer(
            FacultyRepository facultyRepository,
            DepartmentRepository departmentRepository,
            CourseRepository courseRepository
    ) {
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Faculty engineering = upsertFaculty("Engineering");
        Faculty medicine = upsertFaculty("Medicine");
        Faculty business = upsertFaculty("Business");
        Faculty law = upsertFaculty("Law");
        Faculty architecture = upsertFaculty("Architecture");

        Department computerEngineering = upsertDepartment("Computer Engineering", engineering);
        Department electricalEngineering = upsertDepartment("Electrical Engineering", engineering);
        upsertDepartment("Mechanical Engineering", engineering);
        Department generalMedicine = upsertDepartment("General Medicine", medicine);
        Department businessAdministration = upsertDepartment("Business Administration", business);
        upsertDepartment("Economics", business);
        upsertDepartment("International Law", law);
        upsertDepartment("Interior Design", architecture);

        upsertCourse("Intro to Programming", "CS101", 6, computerEngineering, engineering, 1, 2024);
        upsertCourse("Data Structures", "CS201", 6, computerEngineering, engineering, 3, 2024);
        upsertCourse("Algorithms", "CS301", 6, computerEngineering, engineering, 5, 2024);
        upsertCourse("Circuit Theory", "EE101", 5, electricalEngineering, engineering, 1, 2024);
        upsertCourse("Anatomy I", "MED101", 8, generalMedicine, medicine, 1, 2024);
        upsertCourse("Principles of Management", "BUS101", 5, businessAdministration, business, 1, 2024);
    }

    private Faculty upsertFaculty(String name) {
        return facultyRepository.findByNameIgnoreCase(name)
                .map(faculty -> {
                    faculty.setName(name);
                    return facultyRepository.save(faculty);
                })
                .orElseGet(() -> {
                    Faculty faculty = new Faculty();
                    faculty.setName(name);
                    return facultyRepository.save(faculty);
                });
    }

    private Department upsertDepartment(String name, Faculty faculty) {
        return departmentRepository.findByName(name)
                .map(department -> {
                    department.setName(name);
                    department.setFaculty(faculty);
                    return departmentRepository.save(department);
                })
                .orElseGet(() -> {
                    Department department = new Department();
                    department.setName(name);
                    department.setFaculty(faculty);
                    return departmentRepository.save(department);
                });
    }

    private void upsertCourse(
            String name,
            String code,
            Integer ects,
            Department department,
            Faculty faculty,
            Integer semester,
            Integer academicYear
    ) {
        Course course = courseRepository.findByCode(code).orElseGet(Course::new);
        course.setName(name);
        course.setCode(code);
        course.setEcts(ects);
        course.setDepartment(department);
        course.setFaculty(faculty);
        course.setSemester(semester);
        course.setYear(academicYear);
        courseRepository.save(course);
    }
}
