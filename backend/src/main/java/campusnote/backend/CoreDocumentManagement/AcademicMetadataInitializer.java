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
        System.out.println("====== ACADEMIC METADATA INITIALIZER RUNNING ======");
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
        Department architectureDept = upsertDepartment("Architecture", architecture);
        Department interiorDesign = upsertDepartment("Interior Design", architecture);
        Department commonCurriculum = upsertDepartment("Common Curriculum", business);

        // ==================== COMPUTER ENGINEERING (24 courses) ====================
        // Year 1
        upsertCourse("Introduction to Programming", "CS101", 6, computerEngineering, engineering, 1, 1);
        upsertCourse("Object-Oriented Programming", "CS102", 6, computerEngineering, engineering, 2, 1);
        upsertCourse("Calculus I", "MATH101", 4, computerEngineering, engineering, 1, 1);
        upsertCourse("Physics I", "PHYS101", 4, computerEngineering, engineering, 1, 1);
        upsertCourse("Academic English I", "ENG101", 3, computerEngineering, engineering, 1, 1);
        upsertCourse("Introduction to Computer Engineering", "CS103", 5, computerEngineering, engineering, 1, 1);
        // Year 2
        upsertCourse("Data Structures", "CS201", 6, computerEngineering, engineering, 3, 2);
        upsertCourse("Logic Design", "CS202", 5, computerEngineering, engineering, 3, 2);
        upsertCourse("Discrete Mathematics", "CS203", 5, computerEngineering, engineering, 3, 2);
        upsertCourse("Programming Language Concepts", "CS204", 5, computerEngineering, engineering, 4, 2);
        upsertCourse("Linear Algebra", "MATH201", 5, computerEngineering, engineering, 3, 2);
        upsertCourse("Systems Programming", "CS205", 5, computerEngineering, engineering, 4, 2);
        // Year 3
        upsertCourse("Database Systems", "CS301", 5, computerEngineering, engineering, 5, 3);
        upsertCourse("Operating Systems", "CS302", 6, computerEngineering, engineering, 5, 3);
        upsertCourse("Algorithms and Complexity", "CS303", 6, computerEngineering, engineering, 5, 3);
        upsertCourse("Software Engineering Methods", "CS304", 6, computerEngineering, engineering, 6, 3);
        upsertCourse("Computer Architecture", "CS305", 5, computerEngineering, engineering, 5, 3);
        upsertCourse("Formal Languages and Automata", "CS306", 5, computerEngineering, engineering, 6, 3);
        // Year 4
        upsertCourse("Software Capstone Project I", "CS401", 6, computerEngineering, engineering, 7, 4);
        upsertCourse("Software Capstone Project II", "CS402", 6, computerEngineering, engineering, 8, 4);
        upsertCourse("Computer Networks", "CS403", 5, computerEngineering, engineering, 7, 4);
        upsertCourse("Artificial Intelligence", "CS404", 6, computerEngineering, engineering, 7, 4);
        upsertCourse("Distributed Systems", "CS405", 5, computerEngineering, engineering, 7, 4);
        upsertCourse("Cyber Security Fundamentals", "CS406", 5, computerEngineering, engineering, 8, 4);

        // ==================== ELECTRICAL ENGINEERING (24 courses) ====================
        // Year 1
        upsertCourse("Circuits I", "EE101", 5, electricalEngineering, engineering, 1, 1);
        upsertCourse("Introduction to Electrical Engineering", "EE102", 4, electricalEngineering, engineering, 2, 1);
        upsertCourse("Calculus I", "MATH101", 4, electricalEngineering, engineering, 1, 1);
        upsertCourse("Physics I", "PHYS101", 4, electricalEngineering, engineering, 1, 1);
        upsertCourse("Engineering Graphics", "EE103", 4, electricalEngineering, engineering, 1, 1);
        upsertCourse("General Chemistry", "CHEM101", 4, electricalEngineering, engineering, 1, 1);
        // Year 2
        upsertCourse("Circuits II", "EE201", 5, electricalEngineering, engineering, 3, 2);
        upsertCourse("Digital Logic Systems", "EE202", 5, electricalEngineering, engineering, 3, 2);
        upsertCourse("Electronic Circuits I", "EE203", 5, electricalEngineering, engineering, 3, 2);
        upsertCourse("Signals and Systems", "EE204", 6, electricalEngineering, engineering, 4, 2);
        upsertCourse("Electromagnetic Fields", "EE205", 5, electricalEngineering, engineering, 3, 2);
        upsertCourse("Differential Equations", "MATH202", 5, electricalEngineering, engineering, 3, 2);
        // Year 3
        upsertCourse("Electronic Circuits II", "EE301", 5, electricalEngineering, engineering, 5, 3);
        upsertCourse("Communication Systems I", "EE302", 5, electricalEngineering, engineering, 5, 3);
        upsertCourse("Control Engineering", "EE303", 5, electricalEngineering, engineering, 5, 3);
        upsertCourse("Electrical Machines", "EE304", 5, electricalEngineering, engineering, 5, 3);
        upsertCourse("Microprocessors", "EE305", 5, electricalEngineering, engineering, 5, 3);
        upsertCourse("Electromagnetic Waves", "EE306", 5, electricalEngineering, engineering, 6, 3);
        // Year 4
        upsertCourse("Graduation Design Project I", "EE401", 6, electricalEngineering, engineering, 7, 4);
        upsertCourse("Graduation Design Project II", "EE402", 6, electricalEngineering, engineering, 8, 4);
        upsertCourse("Power System Analysis", "EE403", 5, electricalEngineering, engineering, 7, 4);
        upsertCourse("Digital Signal Processing", "EE404", 5, electricalEngineering, engineering, 7, 4);
        upsertCourse("Microwave Engineering", "EE405", 5, electricalEngineering, engineering, 7, 4);
        upsertCourse("Renewable Energy Sources", "EE406", 5, electricalEngineering, engineering, 8, 4);

        // ==================== MECHANICAL ENGINEERING (24 courses) ====================
        // Year 1
        upsertCourse("Introduction to CAD", "ME101", 5, mechanicalEngineering, engineering, 1, 1);
        upsertCourse("Engineering Statics", "ME102", 5, mechanicalEngineering, engineering, 2, 1);
        upsertCourse("Calculus I", "MATH101", 4, mechanicalEngineering, engineering, 1, 1);
        upsertCourse("Physics I", "PHYS101", 4, mechanicalEngineering, engineering, 1, 1);
        upsertCourse("Introduction to Mechanical Engineering", "ME103", 4, mechanicalEngineering, engineering, 1, 1);
        upsertCourse("General Chemistry", "CHEM101", 4, mechanicalEngineering, engineering, 1, 1);
        // Year 2
        upsertCourse("Thermodynamics I", "ME201", 5, mechanicalEngineering, engineering, 3, 2);
        upsertCourse("Strength of Materials I", "ME202", 5, mechanicalEngineering, engineering, 3, 2);
        upsertCourse("Engineering Dynamics", "ME203", 5, mechanicalEngineering, engineering, 3, 2);
        upsertCourse("Manufacturing Processes", "ME204", 5, mechanicalEngineering, engineering, 4, 2);
        upsertCourse("Materials Science", "ME205", 5, mechanicalEngineering, engineering, 3, 2);
        upsertCourse("Differential Equations", "MATH202", 5, mechanicalEngineering, engineering, 3, 2);
        // Year 3
        upsertCourse("Fluid Mechanics I", "ME301", 5, mechanicalEngineering, engineering, 5, 3);
        upsertCourse("Machine Elements I", "ME302", 5, mechanicalEngineering, engineering, 5, 3);
        upsertCourse("Heat Transfer I", "ME303", 6, mechanicalEngineering, engineering, 5, 3);
        upsertCourse("Dynamics of Machinery", "ME304", 5, mechanicalEngineering, engineering, 6, 3);
        upsertCourse("Thermodynamics II", "ME305", 5, mechanicalEngineering, engineering, 5, 3);
        upsertCourse("System Control", "ME306", 5, mechanicalEngineering, engineering, 6, 3);
        // Year 4
        upsertCourse("Senior Capstone Design I", "ME401", 6, mechanicalEngineering, engineering, 7, 4);
        upsertCourse("Senior Capstone Design II", "ME402", 6, mechanicalEngineering, engineering, 8, 4);
        upsertCourse("Heat Transfer II", "ME403", 5, mechanicalEngineering, engineering, 7, 4);
        upsertCourse("Machine Elements II", "ME404", 5, mechanicalEngineering, engineering, 7, 4);
        upsertCourse("Fluid Mechanics II", "ME405", 5, mechanicalEngineering, engineering, 7, 4);
        upsertCourse("Mechanical Vibrations", "ME406", 5, mechanicalEngineering, engineering, 8, 4);

        // ==================== GENERAL MEDICINE (24 courses) ====================
        // Year 1
        upsertCourse("Basic Anatomy I", "MED101", 6, generalMedicine, medicine, 1, 1);
        upsertCourse("Medical Biochemistry I", "MED102", 5, generalMedicine, medicine, 1, 1);
        upsertCourse("Histology and Embryology I", "MED103", 5, generalMedicine, medicine, 1, 1);
        upsertCourse("Physiology I", "MED104", 6, generalMedicine, medicine, 2, 1);
        upsertCourse("Medical Biology and Genetics", "MED105", 5, generalMedicine, medicine, 1, 1);
        upsertCourse("Medical Terminology", "MED106", 3, generalMedicine, medicine, 1, 1);
        // Year 2
        upsertCourse("Basic Anatomy II", "MED201", 6, generalMedicine, medicine, 3, 2);
        upsertCourse("Medical Biochemistry II", "MED202", 5, generalMedicine, medicine, 3, 2);
        upsertCourse("Histology and Embryology II", "MED203", 5, generalMedicine, medicine, 3, 2);
        upsertCourse("Physiology II", "MED204", 6, generalMedicine, medicine, 4, 2);
        upsertCourse("Biophysics", "MED205", 5, generalMedicine, medicine, 3, 2);
        upsertCourse("Immunology", "MED206", 5, generalMedicine, medicine, 4, 2);
        // Year 3
        upsertCourse("Pharmacology I", "MED301", 5, generalMedicine, medicine, 5, 3);
        upsertCourse("Pathology I", "MED302", 5, generalMedicine, medicine, 5, 3);
        upsertCourse("Medical Microbiology", "MED303", 5, generalMedicine, medicine, 5, 3);
        upsertCourse("Introduction to Clinical Sciences", "MED304", 5, generalMedicine, medicine, 5, 3);
        upsertCourse("Public Health and Epidemiology", "MED305", 5, generalMedicine, medicine, 5, 3);
        upsertCourse("Pathophysiology", "MED306", 5, generalMedicine, medicine, 6, 3);
        // Year 4
        upsertCourse("Internal Medicine Rotation", "MED401", 6, generalMedicine, medicine, 7, 4);
        upsertCourse("General Surgery Rotation", "MED402", 6, generalMedicine, medicine, 7, 4);
        upsertCourse("Pediatrics Rotation", "MED403", 6, generalMedicine, medicine, 7, 4);
        upsertCourse("Obstetrics and Gynecology", "MED404", 6, generalMedicine, medicine, 8, 4);
        upsertCourse("Cardiology", "MED405", 6, generalMedicine, medicine, 7, 4);
        upsertCourse("Neurology and Psychiatry", "MED406", 6, generalMedicine, medicine, 8, 4);

        // ==================== BUSINESS ADMINISTRATION (24 courses) ====================
        // Year 1
        upsertCourse("Principles of Management", "BUS101", 5, businessAdministration, business, 1, 1);
        upsertCourse("Financial Accounting I", "BUS102", 5, businessAdministration, business, 2, 1);
        upsertCourse("Introduction to Microeconomics", "ECON101", 5, businessAdministration, business, 1, 1);
        upsertCourse("Business Mathematics", "MATH103", 4, businessAdministration, business, 1, 1);
        upsertCourse("Business Communication", "BUS103", 4, businessAdministration, business, 1, 1);
        upsertCourse("Computer Literacy", "CC101", 3, businessAdministration, business, 1, 1);
        // Year 2
        upsertCourse("Organizational Behavior", "BUS201", 5, businessAdministration, business, 3, 2);
        upsertCourse("Marketing Principles", "BUS202", 5, businessAdministration, business, 3, 2);
        upsertCourse("Financial Accounting II", "BUS203", 5, businessAdministration, business, 3, 2);
        upsertCourse("Business Statistics", "BUS204", 5, businessAdministration, business, 4, 2);
        upsertCourse("Managerial Economics", "BUS205", 5, businessAdministration, business, 3, 2);
        upsertCourse("Commercial Law", "BUS206", 5, businessAdministration, business, 4, 2);
        // Year 3
        upsertCourse("Operations Management", "BUS301", 6, businessAdministration, business, 5, 3);
        upsertCourse("Corporate Finance I", "BUS302", 5, businessAdministration, business, 5, 3);
        upsertCourse("Consumer Behavior", "BUS303", 5, businessAdministration, business, 5, 3);
        upsertCourse("Human Resource Management", "BUS304", 5, businessAdministration, business, 5, 3);
        upsertCourse("Management Information Systems", "BUS305", 5, businessAdministration, business, 5, 3);
        upsertCourse("Corporate Finance II", "BUS306", 5, businessAdministration, business, 6, 3);
        // Year 4
        upsertCourse("Strategic Management", "BUS401", 6, businessAdministration, business, 7, 4);
        upsertCourse("Business Ethics", "BUS402", 4, businessAdministration, business, 7, 4);
        upsertCourse("International Business", "BUS403", 5, businessAdministration, business, 7, 4);
        upsertCourse("Marketing Research", "BUS404", 5, businessAdministration, business, 7, 4);
        upsertCourse("Innovation and Entrepreneurship", "BUS405", 5, businessAdministration, business, 7, 4);
        upsertCourse("Change Management", "BUS406", 5, businessAdministration, business, 8, 4);

        // ==================== ECONOMICS (24 courses) ====================
        // Year 1
        upsertCourse("Introduction to Microeconomics", "ECON101", 5, economics, business, 1, 1);
        upsertCourse("Introduction to Macroeconomics", "ECON102", 5, economics, business, 2, 1);
        upsertCourse("Mathematical Economics I", "MATH103", 4, economics, business, 1, 1);
        upsertCourse("Financial Accounting I", "BUS102", 5, economics, business, 2, 1);
        upsertCourse("Economic History", "ECON103", 4, economics, business, 1, 1);
        upsertCourse("Computer Literacy", "CC101", 3, economics, business, 1, 1);
        // Year 2
        upsertCourse("Intermediate Microeconomics", "ECON201", 5, economics, business, 3, 2);
        upsertCourse("Intermediate Macroeconomics", "ECON202", 5, economics, business, 3, 2);
        upsertCourse("Statistics for Economists", "ECON203", 5, economics, business, 3, 2);
        upsertCourse("Mathematical Economics II", "ECON204", 5, economics, business, 4, 2);
        upsertCourse("Public Finance", "ECON205", 5, economics, business, 3, 2);
        upsertCourse("Financial Markets", "ECON206", 5, economics, business, 4, 2);
        // Year 3
        upsertCourse("Econometrics I", "ECON301", 6, economics, business, 5, 3);
        upsertCourse("International Economics I", "ECON302", 5, economics, business, 5, 3);
        upsertCourse("History of Economic Thought", "ECON303", 5, economics, business, 5, 3);
        upsertCourse("Game Theory", "ECON304", 5, economics, business, 5, 3);
        upsertCourse("Econometrics II", "ECON305", 5, economics, business, 5, 3);
        upsertCourse("International Economics II", "ECON306", 5, economics, business, 6, 3);
        // Year 4
        upsertCourse("Monetary Theory and Policy", "ECON401", 5, economics, business, 7, 4);
        upsertCourse("Development Economics", "ECON402", 5, economics, business, 7, 4);
        upsertCourse("Applied Macroeconomics", "ECON403", 5, economics, business, 7, 4);
        upsertCourse("Industrial Organization", "ECON404", 5, economics, business, 7, 4);
        upsertCourse("Behavioral Economics", "ECON405", 5, economics, business, 7, 4);
        upsertCourse("Environmental Economics", "ECON406", 5, economics, business, 8, 4);

        // ==================== COMMON CURRICULUM (24 courses) ====================
        // Year 1
        upsertCourse("Communication Skills", "CC101", 3, commonCurriculum, business, 1, 1);
        upsertCourse("Academic Writing", "CC102", 3, commonCurriculum, business, 2, 1);
        upsertCourse("Turkish Language I", "CC103", 3, commonCurriculum, business, 1, 1);
        upsertCourse("History of Turkish Revolution I", "CC104", 3, commonCurriculum, business, 1, 1);
        upsertCourse("English for Academic Purposes I", "CC105", 3, commonCurriculum, business, 1, 1);
        upsertCourse("Critical Reading", "CC106", 3, commonCurriculum, business, 2, 1);
        // Year 2
        upsertCourse("Critical Thinking", "CC201", 3, commonCurriculum, business, 3, 2);
        upsertCourse("Sociology of Education", "CC202", 3, commonCurriculum, business, 3, 2);
        upsertCourse("Turkish Language II", "CC203", 3, commonCurriculum, business, 3, 2);
        upsertCourse("History of Turkish Revolution II", "CC204", 3, commonCurriculum, business, 3, 2);
        upsertCourse("English for Academic Purposes II", "CC205", 3, commonCurriculum, business, 3, 2);
        upsertCourse("Ethics and Values", "CC206", 3, commonCurriculum, business, 4, 2);
        // Year 3
        upsertCourse("Research Methods", "CC301", 4, commonCurriculum, business, 5, 3);
        upsertCourse("Statistics and Data Literacy", "CC302", 4, commonCurriculum, business, 5, 3);
        upsertCourse("Project Management", "CC303", 4, commonCurriculum, business, 5, 3);
        upsertCourse("Environmental Science", "CC304", 4, commonCurriculum, business, 5, 3);
        upsertCourse("Science and Technology Studies", "CC305", 4, commonCurriculum, business, 5, 3);
        upsertCourse("Intercultural Communication", "CC306", 4, commonCurriculum, business, 6, 3);
        // Year 4
        upsertCourse("Global Citizenship", "CC401", 4, commonCurriculum, business, 7, 4);
        upsertCourse("Career Development Seminar", "CC402", 3, commonCurriculum, business, 7, 4);
        upsertCourse("Leadership Development", "CC403", 4, commonCurriculum, business, 7, 4);
        upsertCourse("Innovation Seminar", "CC404", 4, commonCurriculum, business, 7, 4);
        upsertCourse("Conflict Resolution", "CC405", 4, commonCurriculum, business, 7, 4);
        upsertCourse("Social Responsibility Projects", "CC406", 4, commonCurriculum, business, 8, 4);

        // ==================== INTERNATIONAL LAW (24 courses) ====================
        // Year 1
        upsertCourse("Introduction to Law", "LAW101", 5, internationalLaw, law, 1, 1);
        upsertCourse("Constitutional Law I", "LAW102", 5, internationalLaw, law, 1, 1);
        upsertCourse("Roman Law", "LAW103", 4, internationalLaw, law, 1, 1);
        upsertCourse("Civil Law I", "LAW104", 5, internationalLaw, law, 1, 1);
        upsertCourse("Legal Research and Writing", "LAW105", 4, internationalLaw, law, 2, 1);
        upsertCourse("Constitutional Law II", "LAW106", 5, internationalLaw, law, 2, 1);
        // Year 2
        upsertCourse("Public International Law I", "LAW201", 5, internationalLaw, law, 3, 2);
        upsertCourse("Contract Law I", "LAW202", 5, internationalLaw, law, 3, 2);
        upsertCourse("Civil Law II", "LAW203", 5, internationalLaw, law, 3, 2);
        upsertCourse("Criminal Law I", "LAW204", 5, internationalLaw, law, 3, 2);
        upsertCourse("Administrative Law I", "LAW205", 5, internationalLaw, law, 3, 2);
        upsertCourse("Contract Law II", "LAW206", 5, internationalLaw, law, 4, 2);
        // Year 3
        upsertCourse("Law of Treaties", "LAW301", 5, internationalLaw, law, 5, 3);
        upsertCourse("Human Rights Law", "LAW302", 5, internationalLaw, law, 5, 3);
        upsertCourse("Criminal Law II", "LAW303", 5, internationalLaw, law, 5, 3);
        upsertCourse("Administrative Law II", "LAW304", 5, internationalLaw, law, 5, 3);
        upsertCourse("Commercial Law", "LAW305", 5, internationalLaw, law, 5, 3);
        upsertCourse("Public International Law II", "LAW306", 5, internationalLaw, law, 6, 3);
        // Year 4
        upsertCourse("International Dispute Resolution", "LAW401", 6, internationalLaw, law, 7, 4);
        upsertCourse("Maritime Law", "LAW402", 5, internationalLaw, law, 7, 4);
        upsertCourse("Private International Law", "LAW403", 5, internationalLaw, law, 7, 4);
        upsertCourse("International Environmental Law", "LAW404", 5, internationalLaw, law, 7, 4);
        upsertCourse("Intellectual Property Law", "LAW405", 5, internationalLaw, law, 7, 4);
        upsertCourse("Law of the European Union", "LAW406", 5, internationalLaw, law, 8, 4);

        // ==================== ARCHITECTURE (24 courses) ====================
        // Year 1
        upsertCourse("Basic Design Studio I", "ARCH101", 6, architectureDept, architecture, 1, 1);
        upsertCourse("Architectural Drawing I", "ARCH102", 4, architectureDept, architecture, 1, 1);
        upsertCourse("Introduction to Architecture", "ARCH103", 4, architectureDept, architecture, 1, 1);
        upsertCourse("Basic Design Studio II", "ARCH104", 6, architectureDept, architecture, 2, 1);
        upsertCourse("Architectural Drawing II", "ARCH105", 4, architectureDept, architecture, 2, 1);
        upsertCourse("Architectural Geometry", "ARCH106", 4, architectureDept, architecture, 2, 1);
        // Year 2
        upsertCourse("Architectural History I", "ARCH201", 5, architectureDept, architecture, 3, 2);
        upsertCourse("Structural Systems I", "ARCH202", 5, architectureDept, architecture, 3, 2);
        upsertCourse("Architectural Design Studio I", "ARCH203", 6, architectureDept, architecture, 3, 2);
        upsertCourse("Architectural History II", "ARCH204", 5, architectureDept, architecture, 4, 2);
        upsertCourse("Structural Systems II", "ARCH205", 5, architectureDept, architecture, 4, 2);
        upsertCourse("Architectural Design Studio II", "ARCH206", 6, architectureDept, architecture, 4, 2);
        // Year 3
        upsertCourse("Environmental Control Systems", "ARCH301", 5, architectureDept, architecture, 5, 3);
        upsertCourse("Urban Design Studio I", "ARCH302", 6, architectureDept, architecture, 5, 3);
        upsertCourse("Advanced Architectural Design I", "ARCH303", 6, architectureDept, architecture, 5, 3);
        upsertCourse("Building Materials and Construction", "ARCH304", 5, architectureDept, architecture, 5, 3);
        upsertCourse("Landscape Architecture", "ARCH305", 5, architectureDept, architecture, 5, 3);
        upsertCourse("Advanced Architectural Design II", "ARCH306", 6, architectureDept, architecture, 6, 3);
        // Year 4
        upsertCourse("Professional Practice and Ethics", "ARCH401", 5, architectureDept, architecture, 7, 4);
        upsertCourse("Diploma Studio Project", "ARCH402", 6, architectureDept, architecture, 8, 4);
        upsertCourse("Restoration and Preservation", "ARCH403", 5, architectureDept, architecture, 7, 4);
        upsertCourse("Architectural Construction Management", "ARCH404", 5, architectureDept, architecture, 7, 4);
        upsertCourse("Sustainable Design", "ARCH405", 5, architectureDept, architecture, 7, 4);
        upsertCourse("Architectural Acoustics", "ARCH406", 5, architectureDept, architecture, 8, 4);

        // ==================== INTERIOR DESIGN (24 courses) ====================
        // Year 1
        upsertCourse("Spatial Design Studio I", "INT101", 6, interiorDesign, architecture, 1, 1);
        upsertCourse("Drafting and Visualization I", "INT102", 4, interiorDesign, architecture, 1, 1);
        upsertCourse("Introduction to Interior Design", "INT103", 4, interiorDesign, architecture, 1, 1);
        upsertCourse("Spatial Design Studio II", "INT104", 6, interiorDesign, architecture, 2, 1);
        upsertCourse("Drafting and Visualization II", "INT105", 4, interiorDesign, architecture, 2, 1);
        upsertCourse("Color Theory in Space", "INT106", 4, interiorDesign, architecture, 2, 1);
        // Year 2
        upsertCourse("Materials and Methods I", "INT201", 5, interiorDesign, architecture, 3, 2);
        upsertCourse("History of Interior Design I", "INT202", 5, interiorDesign, architecture, 3, 2);
        upsertCourse("Interior Design Studio I", "INT203", 6, interiorDesign, architecture, 3, 2);
        upsertCourse("Materials and Methods II", "INT204", 5, interiorDesign, architecture, 4, 2);
        upsertCourse("History of Interior Design II", "INT205", 5, interiorDesign, architecture, 4, 2);
        upsertCourse("Interior Design Studio II", "INT206", 6, interiorDesign, architecture, 4, 2);
        // Year 3
        upsertCourse("Lighting Design in Interiors", "INT301", 5, interiorDesign, architecture, 5, 3);
        upsertCourse("Furniture Design I", "INT302", 5, interiorDesign, architecture, 5, 3);
        upsertCourse("Advanced Interior Design Studio I", "INT303", 6, interiorDesign, architecture, 5, 3);
        upsertCourse("Building Physics and Comfort", "INT304", 5, interiorDesign, architecture, 5, 3);
        upsertCourse("Interior Details and Construction", "INT305", 5, interiorDesign, architecture, 5, 3);
        upsertCourse("Advanced Interior Design Studio II", "INT306", 6, interiorDesign, architecture, 6, 3);
        // Year 4
        upsertCourse("Interior Professional Practice", "INT401", 5, interiorDesign, architecture, 7, 4);
        upsertCourse("Graduation Studio Project", "INT402", 6, interiorDesign, architecture, 8, 4);
        upsertCourse("Furniture Design II", "INT403", 5, interiorDesign, architecture, 7, 4);
        upsertCourse("Interior Restoration", "INT404", 5, interiorDesign, architecture, 7, 4);
        upsertCourse("Sustainable Interior Materials", "INT405", 5, interiorDesign, architecture, 7, 4);
        upsertCourse("Exhibition and Stage Design", "INT406", 5, interiorDesign, architecture, 8, 4);
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
        Course course = courseRepository.findByCode(code).orElse(null);
        if (course == null) {
            System.out.println("Inserting new course: " + code + " - " + name);
            course = new Course();
            course.setName(name);
            course.setCode(code);
            course.setEcts(ects);
            course.setDepartment(department);
            course.setFaculty(faculty);
            course.setSemester(semester);
            course.setYear(academicYear);
            courseRepository.save(course);
        } else {
            System.out.println("Course already exists, reusing: " + code);
        }
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
