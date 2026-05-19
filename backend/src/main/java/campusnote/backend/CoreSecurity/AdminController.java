package campusnote.backend.CoreSecurity;

import campusnote.backend.CoreDocumentManagement.DocumentDTO;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final AuditLogRepository auditLogRepository;

    public AdminController(UserRepository userRepository, 
                           DocumentRepository documentRepository,
                           DocumentService documentService,
                           AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.documentService = documentService;
        this.auditLogRepository = auditLogRepository;
    }

    private boolean isAdmin(HttpSession session) {
        String role = (String) session.getAttribute("userRole");
        return "ADMIN".equals(role);
    }

    private String getAdminEmail(HttpSession session) {
        return (String) session.getAttribute("userEmail");
    }

    // FR-ST-53: Display an aggregated total of flagged documents
    // FR-ST-63: Display the total database storage consumption
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).build();
        
        long totalDocs = documentRepository.count();
        long flaggedCount = documentRepository.findAll().stream()
                .filter(doc -> "FLAGGED".equals(doc.getStatus()))
                .count();
        
        double storageUsedGb = documentService.getTotalStoredBytes() / 1024.0 / 1024.0 / 1024.0;
        
        return ResponseEntity.ok(Map.of(
            "totalDocuments", totalDocs,
            "flaggedDocuments", flaggedCount,
            "storageUsedGb", String.format("%.2f", storageUsedGb),
            "totalUsers", userRepository.count(),
            "aiThreshold", documentService.getGlobalAiThreshold()
        ));
    }

    // FR-ST-48: View a table of all registered users
    // FR-ST-49: Filter the user table based on academic Department
    @GetMapping("/users")
    public ResponseEntity<?> listUsers(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).build();
        List<UserDTO> users = userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
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
                user.getYear(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
                user.getRank() != null ? user.getRank() : "NEWBIE",
                0, // totalDownloads
                0  // totalLikes
        );
    }

    @PostMapping("/users/{id}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).build();
        
        return userRepository.findById(id).map(user -> {
            user.setIsActive(false); // FR-ST-50
            userRepository.save(user);
            
            // FR-ST-59: Audit log
            logAction("SUSPEND_USER", getAdminEmail(session), "User ID: " + id);
            
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/flagged")
    public ResponseEntity<?> listFlagged(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).build();
        
        // FR-ST-52: Documents with FLAGGED status
        List<DocumentDTO> flagged = documentRepository.findAll().stream()
                .filter(doc -> "FLAGGED".equals(doc.getStatus()))
                .map(doc -> documentService.convertToDTO(doc, getAdminEmail(session)))
                .collect(Collectors.toList());
        return ResponseEntity.ok(flagged);
    }

    @PostMapping("/documents/{id}/dismiss")
    public ResponseEntity<?> dismissReport(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).build();
        
        return documentRepository.findById(id).map(doc -> {
            doc.setStatus("PUBLISHED"); // FR-ST-56
            doc.setIsPublic(1);
            documentRepository.save(doc);
            
            logAction("DISMISS_REPORT", getAdminEmail(session), "Doc ID: " + id);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).build();
        
        if (documentService.deleteDocument(id)) {
            // FR-ST-58: Audit log
            logAction("DELETE_DOCUMENT", getAdminEmail(session), "Doc ID: " + id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/threshold")
    public ResponseEntity<?> updateThreshold(@RequestBody Map<String, Integer> body, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).build();
        
        Integer threshold = body.get("threshold");
        if (threshold != null) {
            documentService.setGlobalAiThreshold(threshold);
            
            // FR-ST-60: Audit log
            logAction("MODIFY_THRESHOLD", getAdminEmail(session), "New threshold: " + threshold);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/logs")
    public ResponseEntity<?> listLogs(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).build();
        // FR-ST-62: Chronological list of logs
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    private void logAction(String action, String adminEmail, String target) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setAdminEmail(adminEmail != null ? adminEmail : "SYSTEM");
        log.setTarget(target);
        auditLogRepository.save(log);
    }
}
