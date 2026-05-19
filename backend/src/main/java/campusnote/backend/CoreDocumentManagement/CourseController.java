package campusnote.backend.CoreDocumentManagement;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.BindingResult;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    public CourseController(CourseRepository courseRepository, 
                            FacultyRepository facultyRepository, 
                            DepartmentRepository departmentRepository) {
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<CourseDTO> getAll() {
        return courseRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@Valid @RequestBody CourseCreateRequest payload, BindingResult bindingResult, HttpSession session) {
        if (bindingResult.hasErrors()) {
            List<String> errors = bindingResult.getFieldErrors().stream()
                    .map(e -> e.getField() + ": " + e.getDefaultMessage())
                    .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of("error", "Validation failed", "details", errors));
        }

        String role = (String) session.getAttribute("userRole");
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        try {
            Course course = new Course();
            course.setName(payload.getName().trim());
            course.setCode(payload.getCode().trim().toUpperCase());
            course.setEcts(payload.getEcts());
            course.setSemester(payload.getSemester());
            course.setYear(payload.getYear());
            
            if (courseRepository.existsByCode(course.getCode())) {
                return ResponseEntity.status(409).body(Map.of("error", "Course code already exists"));
            }

            var departmentOpt = departmentRepository.findById(payload.getDepartmentId());
            var facultyOpt = facultyRepository.findById(payload.getFacultyId());

            if (departmentOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Department not found"));
            }
            if (facultyOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Faculty not found"));
            }

            course.setDepartment(departmentOpt.get());
            course.setFaculty(facultyOpt.get());
            return ResponseEntity.ok(toDTO(courseRepository.save(course)));
        } catch (Exception e) {
            e.printStackTrace(); // Log to terminal
            return ResponseEntity.badRequest().body(Map.of("error", "Error creating course", "details", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpSession session) {
        String role = (String) session.getAttribute("userRole");
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        if (!courseRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Course not found"));
        }
        courseRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Course deleted"));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CourseCreateRequest payload, HttpSession session) {
        String role = (String) session.getAttribute("userRole");
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        var existingOpt = courseRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Course not found"));
        }

        String normalizedCode = payload.getCode().trim().toUpperCase();
        if (courseRepository.existsByCode(normalizedCode) && !existingOpt.get().getCode().equalsIgnoreCase(normalizedCode)) {
            return ResponseEntity.status(409).body(Map.of("error", "Course code already exists"));
        }

        var departmentOpt = departmentRepository.findById(payload.getDepartmentId());
        var facultyOpt = facultyRepository.findById(payload.getFacultyId());
        if (departmentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Department not found"));
        }
        if (facultyOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Faculty not found"));
        }

        Course course = existingOpt.get();
        course.setName(payload.getName().trim());
        course.setCode(normalizedCode);
        course.setEcts(payload.getEcts());
        course.setSemester(payload.getSemester());
        course.setYear(payload.getYear());
        course.setDepartment(departmentOpt.get());
        course.setFaculty(facultyOpt.get());

        return ResponseEntity.ok(toDTO(courseRepository.save(course)));
    }

    private CourseDTO toDTO(Course course) {
        Department department = course.getDepartment();
        Faculty faculty = course.getFaculty();
        if (faculty == null && department != null) {
            faculty = department.getFaculty();
        }

        return new CourseDTO(
                course.getId(),
                course.getName(),
                course.getCode(),
                course.getEcts(),
                course.getSemester(),
                course.getYear(),
                department != null ? new RelatedUnitDTO(department.getId(), department.getName()) : null,
                faculty != null ? new RelatedUnitDTO(faculty.getId(), faculty.getName()) : null
        );
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedUnitDTO {
        private Long id;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseDTO {
        private Long id;
        private String name;
        private String code;
        private Integer ects;
        private Integer semester;
        private Integer year;
        private RelatedUnitDTO department;
        private RelatedUnitDTO faculty;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseCreateRequest {
        @NotBlank(message = "Course name is required")
        private String name;

        @NotBlank(message = "Course code is required")
        private String code;

        @NotNull(message = "ECTS is required")
        @Min(value = 1, message = "ECTS must be at least 1")
        private Integer ects;

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be at least 1")
        private Integer semester;

        @NotNull(message = "Year is required")
        @Min(value = 1, message = "Year must be at least 1")
        @jakarta.validation.constraints.Max(value = 4, message = "Year must be at most 4")
        private Integer year;

        @NotNull(message = "Department ID is required")
        private Long departmentId;

        @NotNull(message = "Faculty ID is required")
        private Long facultyId;
    }
}
