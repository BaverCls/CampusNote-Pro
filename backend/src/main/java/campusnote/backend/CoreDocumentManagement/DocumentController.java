package campusnote.backend.CoreDocumentManagement;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(@RequestBody DocumentUploadRequest request, HttpSession session) {
        String userEmail = (String) session.getAttribute("userEmail");
        if (userEmail == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Document savedDoc = documentService.uploadDocument(
                request.getTitle(),
                request.getCourseCode(),
                request.getFaculty(),
                request.getFilePath(),
                userEmail
        );
        
        return ResponseEntity.ok(new DocumentDTO(
                savedDoc.getId(),
                savedDoc.getTitle(),
                savedDoc.getCourseCode(),
                savedDoc.getFaculty(),
                savedDoc.getAiScore(),
                savedDoc.getUploader().getFullName(),
                savedDoc.getUploadDate().toString(),
                savedDoc.getStatus().name(),
                savedDoc.getFilePath()
        ));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> reviewDocument(@PathVariable Long id, @RequestBody Map<String, Object> reviewData) {
        try {
            // Safely handle number casting from JSON
            int score = ((Number) reviewData.get("score")).intValue();
            boolean approve = (boolean) reviewData.get("approve");
            documentService.reviewDocument(id, score, approve);
            return ResponseEntity.ok("Document reviewed successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Review failed: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getUserDocuments(HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(documentService.getUserDocuments(email));
    }

    @GetMapping("/feed")
    public ResponseEntity<List<DocumentDTO>> getFeed() {
        return ResponseEntity.ok(documentService.getPublishedDocuments());
    }

    @GetMapping("/all")
    public ResponseEntity<List<DocumentDTO>> getAll() {
        return ResponseEntity.ok(documentService.getAllDocuments());
    }
}
