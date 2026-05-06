package campusnote.backend.CoreDocumentManagement;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(@RequestBody DocumentUploadRequest request, HttpSession session) {
        try {
            String userEmail = (String) session.getAttribute("userEmail");
            if (userEmail == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            Document savedDoc = documentService.uploadDocument(
                    request.getTitle(),
                    request.getContent(),
                    request.getCourseCode(),
                    request.getFaculty(),
                    request.getFilePath(),
                    userEmail
            );
            
            String uploaderName = (savedDoc.getUser() != null) ? savedDoc.getUser().getFullName() : "Anonymous";
            String courseCode = (savedDoc.getCourse() != null) ? savedDoc.getCourse().getCode() : "N/A";
            Long courseId = (savedDoc.getCourse() != null) ? savedDoc.getCourse().getId() : null;
            Long userId = (savedDoc.getUser() != null) ? savedDoc.getUser().getId() : null;
            
            Long facultyId = (savedDoc.getFaculty() != null) ? savedDoc.getFaculty().getId() : null;
            String facultyName = (savedDoc.getFaculty() != null) ? savedDoc.getFaculty().getName() : "N/A";
            Long departmentId = (savedDoc.getDepartment() != null) ? savedDoc.getDepartment().getId() : null;
            String departmentName = (savedDoc.getDepartment() != null) ? savedDoc.getDepartment().getName() : "N/A";

            String statusStr = (savedDoc.getIsPublic() != null && savedDoc.getIsPublic() == 1) ? "PUBLISHED" : (savedDoc.getIsPublic() != null && savedDoc.getIsPublic() == -1 ? "REJECTED" : "DRAFT");
            String uploadDateStr = savedDoc.getUploadedAt() != null ? savedDoc.getUploadedAt().toString() : "";
            Double score = savedDoc.getScore() != null ? savedDoc.getScore() : 0.0;

            DocumentDTO dto = new DocumentDTO();
            dto.setId(savedDoc.getId());
            dto.setTitle(savedDoc.getTitle());
            dto.setContent(savedDoc.getContent());
            dto.setType(savedDoc.getType());
            dto.setUserId(userId);
            dto.setUploaderName(uploaderName);
            dto.setCourseId(courseId);
            dto.setCourseCode(courseCode);
            dto.setFacultyId(facultyId);
            dto.setFacultyName(facultyName);
            dto.setFaculty(facultyName);
            dto.setDepartmentId(departmentId);
            dto.setDepartmentName(departmentName);
            dto.setStatus(statusStr);
            dto.setScore(score);
            dto.setUploadDate(uploadDateStr);
            dto.setUploadedAt(uploadDateStr);

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getUserDocuments(HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            return ResponseEntity.ok(documentService.getUserDocuments(email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch documents: " + e.getMessage()));
        }
    }

    @GetMapping("/feed")
    public ResponseEntity<?> getFeed(HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            return ResponseEntity.ok(documentService.getPublicDocuments(email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch feed: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String query, HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            return ResponseEntity.ok(documentService.searchDocuments(query, email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Search failed: " + e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll(HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            return ResponseEntity.ok(documentService.getAllDocuments(email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch all documents: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> reviewDocument(@PathVariable Long id, @RequestBody ReviewRequest request, HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            boolean success = documentService.reviewDocument(id, request.getScore(), request.isApprove());
            if (success) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Document not found"));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Review failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<?> viewDocument(@PathVariable Long id) {
        try {
            boolean updated = documentService.incrementViewCount(id);
            if (!updated) {
                return ResponseEntity.status(404).body(Map.of("error", "Document not found"));
            }
            return ResponseEntity.ok(Map.of("message", "View count updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "View count update failed", "details", e.getMessage()));
        }
    }

    @PostMapping("/{id}/download")
    public ResponseEntity<?> downloadDocument(@PathVariable Long id) {
        try {
            boolean updated = documentService.incrementDownloadCount(id);
            if (!updated) {
                return ResponseEntity.status(404).body(Map.of("error", "Document not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Download count updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Download count update failed", "details", e.getMessage()));
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeDocument(@PathVariable Long id, HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            boolean updated = documentService.toggleLike(id, email);
            if (!updated) {
                return ResponseEntity.status(404).body(Map.of("error", "Document not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Like toggled"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Like toggle failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id, HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        String role = (String) session.getAttribute("userRole");
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        try {
            boolean deleted = documentService.deleteDocument(id);
            if (!deleted) {
                return ResponseEntity.status(404).body(Map.of("error", "Document not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Document deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Document delete failed", "details", e.getMessage()));
        }
    }
}
