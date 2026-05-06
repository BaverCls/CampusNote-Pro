package campusnote.backend.CoreSecurity;

import campusnote.backend.CoreDocumentManagement.Faculty;
import campusnote.backend.CoreDocumentManagement.FacultyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api")
public class LeaderboardController {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;

    public LeaderboardController(UserRepository userRepository, FacultyRepository facultyRepository) {
        this.userRepository = userRepository;
        this.facultyRepository = facultyRepository;
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserDTO>> getLeaderboard(
            @RequestParam(required = false) String faculty,
            HttpSession session
    ) {
        try {
            Long targetFacultyId = resolveTargetFacultyId(faculty, session);
            if (targetFacultyId == null) {
                return ResponseEntity.ok(List.of());
            }

            List<User> users = userRepository.findByFaculty_IdOrderByCoinBalanceDesc(targetFacultyId);

            // Strict filtering: remove admin/system admin users
            List<UserDTO> result = users.stream()
                    .filter(u -> u.getRole() != User.Role.ADMIN)
                    .filter(this::isNotSystemAdmin)
                    .limit(50) // top 50 contributors
                    .map(this::convertToDTO)
                    .toList();

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    private Long resolveTargetFacultyId(String faculty, HttpSession session) {
        // 1) Query param wins
        if (faculty != null && !faculty.isBlank()) {
            return facultyRepository.findByNameIgnoreCase(faculty.trim()).map(Faculty::getId).orElse(null);
        }

        // 2) Otherwise try the logged-in user's faculty (if not admin)
        String email = (String) session.getAttribute("userEmail");
        if (email != null) {
            return userRepository.findByEmail(email)
                    .filter(u -> u.getRole() != User.Role.ADMIN)
                    .map(u -> u.getFaculty() != null ? u.getFaculty().getId() : null)
                    .orElse(null);
        }

        // 3) Fallback: Engineering faculty
        return facultyRepository.findAll().stream()
                .filter(f -> f.getName() != null && f.getName().toLowerCase(Locale.ROOT).contains("engineering"))
                .map(Faculty::getId)
                .findFirst()
                .orElseGet(() -> facultyRepository.findAll().stream().findFirst().map(Faculty::getId).orElse(null));
    }

    private boolean isNotSystemAdmin(User u) {
        String email = u.getEmail() != null ? u.getEmail().trim().toLowerCase(Locale.ROOT) : "";
        String fullName = u.getFullName() != null ? u.getFullName().trim().toLowerCase(Locale.ROOT) : "";
        String username = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;

        // Explicit requirement: username 'system_admin' and admin/fullName variants
        if ("system_admin".equals(username)) return false;
        if ("system_admin".equals(fullName)) return false;
        if (fullName.contains("system admin") || fullName.contains("system_admin")) return false;
        return true;
    }

    private UserDTO convertToDTO(User user) {
        String facultyName = (user.getFaculty() != null) ? user.getFaculty().getName() : "N/A";
        Long facultyId = (user.getFaculty() != null) ? user.getFaculty().getId() : null;
        String deptName = (user.getDepartment() != null) ? user.getDepartment().getName()
                : (user.getDepartmentName() != null ? user.getDepartmentName() : "N/A");
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

