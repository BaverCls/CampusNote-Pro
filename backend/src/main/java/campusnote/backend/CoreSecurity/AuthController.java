package campusnote.backend.CoreSecurity;

import campusnote.backend.CoreDocumentManagement.DepartmentRepository;
import campusnote.backend.CoreDocumentManagement.FacultyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, 
                          FacultyRepository facultyRepository,
                          DepartmentRepository departmentRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDTO registrationDTO) {
        try {
            if (userRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
            }

            User newUser = new User();
            newUser.setEmail(registrationDTO.getEmail());
            newUser.setFullName(registrationDTO.getFullName());
            newUser.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
            newUser.setCoinBalance(100);
            newUser.setRole(User.Role.STUDENT);
            newUser.setUniversity("Istanbul Arel University");

            var faculty = facultyRepository.findById(registrationDTO.getFacultyId());
            var department = departmentRepository.findById(registrationDTO.getDepartmentId());
            if (faculty.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Faculty not found"));
            }
            if (department.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Department not found"));
            }
            newUser.setFaculty(faculty.get());
            newUser.setDepartment(department.get());
            newUser.setYear(registrationDTO.getYear());

            userRepository.save(newUser);

            return ResponseEntity.ok(Map.of("message", "User registered successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Registration failed", "details", e.getMessage()));
        }
    }

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request, HttpSession session) {
        try {
            return userRepository.findByEmail(request.getEmail())
                    .map(user -> {
                        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
                        }

                        session.setAttribute("userId", user.getId());
                        session.setAttribute("userEmail", user.getEmail());
                        session.setAttribute("userRole", user.getRole().name());

                        return ResponseEntity.ok(convertToDTO(user));
                    })
                    .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid email or password")));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Login error", "details", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    private UserDTO convertToDTO(User user) {
        String facultyName = (user.getFaculty() != null) ? user.getFaculty().getName() : "N/A";
        Long facultyId = (user.getFaculty() != null) ? user.getFaculty().getId() : null;
        String deptName = (user.getDepartment() != null) ? user.getDepartment().getName() : (user.getDepartmentName() != null ? user.getDepartmentName() : "N/A");
        Long deptId = (user.getDepartment() != null) ? user.getDepartment().getId() : null;
        String roleName = (user.getRole() != null) ? user.getRole().name() : "STUDENT";
        
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getCoinBalance(),
                roleName,
                facultyId,
                facultyName,
                deptId,
                deptName,
                user.getBio(),
                user.getUniversity(),
                user.getIsActive(),
                user.getYear()
        );
    }
}
