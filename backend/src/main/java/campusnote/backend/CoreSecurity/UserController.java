package campusnote.backend.CoreSecurity;

import campusnote.backend.CoreDocumentManagement.DepartmentRepository;
import campusnote.backend.CoreDocumentManagement.FacultyRepository;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final DocumentRepository documentRepository;

    public UserController(UserRepository userRepository, 
                          FacultyRepository facultyRepository, 
                          DepartmentRepository departmentRepository,
                          DocumentRepository documentRepository) {
        this.userRepository = userRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.documentRepository = documentRepository;
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<UserDTO> getProfile(HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            if (email == null) {
                return ResponseEntity.status(401).build();
            }

            return userRepository.findByEmail(email)
                .map(u -> ResponseEntity.ok(convertToDTO(u)))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/leaderboard")
    @Transactional(readOnly = true)
    public ResponseEntity<List<UserDTO>> getLeaderboard(@RequestParam(required = false) Long facultyId) {
        try {
            List<User> raw = facultyId != null
                    ? userRepository.findByFaculty_IdOrderByCoinBalanceDesc(facultyId)
                    : userRepository.findAllByOrderByCoinBalanceDesc();

            List<UserDTO> leaderboard = raw.stream()
                    .filter(u -> u.getRole() != User.Role.ADMIN)
                    .filter(this::isNotSystemAdmin)
                    .limit(50) // Show top 50 in general leaderboard
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    private boolean isNotSystemAdmin(User u) {
        String email = u.getEmail() != null ? u.getEmail().trim().toLowerCase() : "";
        String fullName = u.getFullName() != null ? u.getFullName().trim().toLowerCase() : "";
        String username = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;

        // Explicit requirement: exclude username 'system_admin' or admin/fullName variants
        if ("system_admin".equals(username)) return false;
        if ("system_admin".equals(fullName)) return false;
        if (fullName.contains("system admin") || fullName.contains("system_admin")) return false;
        if ("admin".equals(u.getRole() != null ? u.getRole().name().toLowerCase() : "")) return false;
        return true;
    }

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<UserDTO> updateProfile(@RequestBody UserDTO updateData, HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            if (email == null) return ResponseEntity.status(401).build();

            return userRepository.findByEmail(email).map(user -> {
                if (updateData.getFullName() != null) user.setFullName(updateData.getFullName());
                if (updateData.getBio() != null) user.setBio(updateData.getBio());
                if (updateData.getUniversity() != null) user.setUniversity(updateData.getUniversity());
                
                if (updateData.getFacultyId() != null) {
                    facultyRepository.findById(updateData.getFacultyId()).ifPresent(user::setFaculty);
                }
                if (updateData.getDepartmentId() != null) {
                    departmentRepository.findById(updateData.getDepartmentId()).ifPresent(user::setDepartment);
                }
                
                userRepository.save(user);
                return ResponseEntity.ok(convertToDTO(user));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable Long id, HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        String role = (String) session.getAttribute("userRole");
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!"ADMIN".equals(role)) return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        
        return userRepository.findById(id).map(user -> {
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User banned"));
        }).orElse(ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id, HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        String role = (String) session.getAttribute("userRole");
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        try {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(409).body(Map.of("error", "User cannot be deleted due to related records"));
        }
    }

    private UserDTO convertToDTO(User user) {
        String facultyName = (user.getFaculty() != null) ? user.getFaculty().getName() : "N/A";
        Long facultyId = (user.getFaculty() != null) ? user.getFaculty().getId() : null;
        String deptName = (user.getDepartment() != null) ? user.getDepartment().getName() : (user.getDepartmentName() != null ? user.getDepartmentName() : "N/A");
        Long deptId = (user.getDepartment() != null) ? user.getDepartment().getId() : null;
        String roleName = (user.getRole() != null) ? user.getRole().name() : "STUDENT";
        
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
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
                user.getRank() != null ? user.getRank() : "BRONZE",
                totalDownloads != null ? totalDownloads.intValue() : 0,
                totalLikes != null ? totalLikes.intValue() : 0
        );
    }
}
