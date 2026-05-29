package campusnote.backend.CoreDocumentManagement;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Component
public class AcademicMetadataInitializer implements CommandLineRunner {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final jakarta.persistence.EntityManager entityManager;
    private final DataSource dataSource;

    public AcademicMetadataInitializer(
            FacultyRepository facultyRepository,
            DepartmentRepository departmentRepository,
            CourseRepository courseRepository,
            jakarta.persistence.EntityManager entityManager,
            DataSource dataSource
    ) {
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.entityManager = entityManager;
        this.dataSource = dataSource;
    }

    @Override
    @Transactional
    public void run(String... args) {
        syncPostgresSequences();

        Faculty engineering = upsertFaculty("Engineering");
        Faculty medicine = upsertFaculty("Medicine");
        Faculty business = upsertFaculty("Business");
        Faculty law = upsertFaculty("Law");
        Faculty architecture = upsertFaculty("Architecture");

        Department computerEngineering = upsertDepartment("Computer Engineering", engineering);
        Department electricalEngineering = upsertDepartment("Electrical Engineering", engineering);
        Department mechanicalEngineering = upsertDepartment("Mechanical Engineering", engineering);
        Department generalMedicine = upsertDepartment("General Medicine", medicine);
        Department businessAdministration = upsertDepartment("Business Administration", business);
        Department economics = upsertDepartment("Economics", business);
        Department internationalLaw = upsertDepartment("International Law", law);
        Department interiorDesign = upsertDepartment("Interior Design", architecture);
        Department commonCurriculum = upsertDepartment("Common Curriculum", business);

        upsertCourse("Intro to Programming", "CS101", 6, computerEngineering, engineering, 1, 2024);
        upsertCourse("Data Structures", "CS201", 6, computerEngineering, engineering, 3, 2024);
        upsertCourse("Algorithms", "CS301", 6, computerEngineering, engineering, 5, 2024);
        upsertCourse("Database Systems", "CS305", 5, computerEngineering, engineering, 5, 2024);

        upsertCourse("Circuit Theory", "EEE101", 5, electricalEngineering, engineering, 1, 2024);
        upsertCourse("Digital Logic", "EEE102", 5, electricalEngineering, engineering, 2, 2024);
        upsertCourse("Signals and Systems", "EEE201", 6, electricalEngineering, engineering, 3, 2024);
        upsertCourse("Power Electronics", "EEE302", 5, electricalEngineering, engineering, 6, 2024);

        upsertCourse("Statics", "ME101", 5, mechanicalEngineering, engineering, 1, 2024);
        upsertCourse("Thermodynamics", "ME201", 6, mechanicalEngineering, engineering, 3, 2024);
        upsertCourse("Fluid Mechanics", "ME301", 6, mechanicalEngineering, engineering, 5, 2024);
        upsertCourse("Machine Design", "ME302", 5, mechanicalEngineering, engineering, 6, 2024);

        upsertCourse("Anatomy I", "MED101", 6, generalMedicine, medicine, 1, 2024);
        upsertCourse("Physiology I", "MED102", 6, generalMedicine, medicine, 2, 2024);
        upsertCourse("Biochemistry", "MED201", 5, generalMedicine, medicine, 3, 2024);
        upsertCourse("Clinical Skills", "MED301", 4, generalMedicine, medicine, 5, 2024);

        upsertCourse("Principles of Management", "BUS101", 5, businessAdministration, business, 1, 2024);
        upsertCourse("Financial Accounting", "BUS102", 5, businessAdministration, business, 2, 2024);
        upsertCourse("Marketing Management", "BUS201", 5, businessAdministration, business, 3, 2024);
        upsertCourse("Operations Management", "BUS301", 6, businessAdministration, business, 5, 2024);

        upsertCourse("Microeconomics", "ECON101", 5, economics, business, 1, 2024);
        upsertCourse("Macroeconomics", "ECON102", 5, economics, business, 2, 2024);
        upsertCourse("Econometrics", "ECON201", 6, economics, business, 3, 2024);
        upsertCourse("International Economics", "ECON301", 5, economics, business, 5, 2024);

        upsertCourse("Introduction to Law", "LAW101", 5, internationalLaw, law, 1, 2024);
        upsertCourse("Constitutional Law", "LAW102", 5, internationalLaw, law, 2, 2024);
        upsertCourse("International Public Law", "LAW201", 6, internationalLaw, law, 3, 2024);
        upsertCourse("Human Rights Law", "LAW301", 5, internationalLaw, law, 5, 2024);

        upsertCourse("Design Studio I", "INT101", 6, interiorDesign, architecture, 1, 2024);
        upsertCourse("Technical Drawing", "INT102", 4, interiorDesign, architecture, 2, 2024);
        upsertCourse("Material and Texture", "INT201", 5, interiorDesign, architecture, 3, 2024);
        upsertCourse("Lighting Design", "INT301", 5, interiorDesign, architecture, 5, 2024);

        upsertCourse("Turkish I", "TURK101", 3, commonCurriculum, business, 1, 2024);
        upsertCourse("English I", "ENG101", 3, commonCurriculum, business, 1, 2024);
        upsertCourse("Ataturk Principles I", "ATA101", 3, commonCurriculum, business, 1, 2024);
        upsertCourse("Academic Writing", "GEN101", 3, commonCurriculum, business, 2, 2024);
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

    private void syncPostgresSequences() {
        if (!isPostgresDatabase()) {
            return;
        }

        entityManager.createNativeQuery("SELECT setval('faculty_id_seq', COALESCE((SELECT MAX(id) FROM faculty), 1), true)").getSingleResult();
        entityManager.createNativeQuery("SELECT setval('department_id_seq', COALESCE((SELECT MAX(id) FROM department), 1), true)").getSingleResult();
        entityManager.createNativeQuery("SELECT setval('course_id_seq', COALESCE((SELECT MAX(id) FROM course), 1), true)").getSingleResult();
    }

    private boolean isPostgresDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            String productName = connection.getMetaData().getDatabaseProductName();
            return productName != null && productName.toLowerCase().contains("postgresql");
        } catch (SQLException e) {
            System.err.println("Database product check failed, skipping sequence sync: " + e.getMessage());
            return false;
        }
    }
}
