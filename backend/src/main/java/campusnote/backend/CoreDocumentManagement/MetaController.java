package campusnote.backend.CoreDocumentManagement;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/meta")
public class MetaController {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    public MetaController(FacultyRepository facultyRepository, DepartmentRepository departmentRepository) {
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping("/faculties")
    public List<FacultyDTO> getFaculties() {
        return facultyRepository.findAll().stream()
                .map(f -> new FacultyDTO(f.getId(), f.getName()))
                .collect(Collectors.toList());
    }

    @GetMapping("/departments")
    public List<DepartmentDTO> getDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> new DepartmentDTO(d.getId(), d.getName(), d.getFaculty() != null ? d.getFaculty().getId() : null))
                .collect(Collectors.toList());
    }

    public static class FacultyDTO {
        public Long id;
        public String name;
        public FacultyDTO(Long id, String name) { this.id = id; this.name = name; }
    }

    public static class DepartmentDTO {
        public Long id;
        public String name;
        public Long facultyId;
        public DepartmentDTO(Long id, String name, Long facultyId) { this.id = id; this.name = name; this.facultyId = facultyId; }
    }
}
