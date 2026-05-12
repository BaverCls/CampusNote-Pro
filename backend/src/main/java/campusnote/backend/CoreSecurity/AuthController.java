package campusnote.backend.CoreSecurity;

import campusnote.backend.CoreDocumentManagement.DepartmentRepository;
import campusnote.backend.CoreDocumentManagement.FacultyRepository;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
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
    private final DocumentRepository documentRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, 
                          FacultyRepository facultyRepository,
                          DepartmentRepository departmentRepository,
                          DocumentRepository documentRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.documentRepository = documentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDTO registrationDTO) {
        try {
            if (!registrationDTO.getEmail().toLowerCase().endsWith("@arel.edu.tr")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only @arel.edu.tr emails are allowed"));
            }

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
    // FR-ST-02: Deny login attempts containing incorrect credentials
    // FR-ST-03: Display an error message upon a denied login attempt
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

    // FR-ST-05: Terminate the active session upon clicking the sign-out button
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    // FR-ST-04: Provide a password reset link via email
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        return userRepository.findByEmail(email).map(user -> {
            String token = java.util.UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            // In a real system, we would send an email here.
            System.out.println("Reset token for " + email + ": " + token);
            return ResponseEntity.ok(Map.of("message", "Password reset link sent to email", "token", token));
        }).orElse(ResponseEntity.ok(Map.of("message", "If an account exists with that email, a reset link has been sent.")));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("password");
        
        return userRepository.findByResetToken(token).map(user -> {
            if (user.getResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Token expired"));
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "Invalid token")));
    }

    private UserDTO convertToDTO(User user) {
        String facultyName = (user.getFaculty() != null) ? user.getFaculty().getName() : "N/A";
        Long facultyId = (user.getFaculty() != null) ? user.getFaculty().getId() : null;
        String deptName = (user.getDepartment() != null) ? user.getDepartment().getName() : (user.getDepartmentName() != null ? user.getDepartmentName() : "N/A");
        Long deptId = (user.getDepartment() != null) ? user.getDepartment().getId() : null;
        String roleName = (user.getRole() != null) ? user.getRole().name() : "STUDENT";
        String createdAtStr = user.getCreatedAt() != null ? user.getCreatedAt().toString() : "";
        
        Long totalDownloads = documentRepository.sumDownloadsByUserId(user.getId());
        Long totalLikes = documentRepository.sumLikesByUserId(user.getId());

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
                user.getYear(),
                createdAtStr,
                user.getRank() != null ? user.getRank() : "ROOKIE",
                totalDownloads != null ? totalDownloads.intValue() : 0,
                totalLikes != null ? totalLikes.intValue() : 0
        );
    }
}
