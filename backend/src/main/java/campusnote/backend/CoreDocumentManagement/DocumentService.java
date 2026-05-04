package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public DocumentService(DocumentRepository documentRepository, 
                           UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Document uploadDocument(String title, String courseCode, String faculty, String filePath, String userEmail) {
        User uploader = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Document doc = new Document();
        doc.setTitle(title);
        doc.setCourseCode(courseCode);
        doc.setFaculty(faculty);
        doc.setFilePath(filePath);
        doc.setUploader(uploader);
        doc.setStatus(Document.DocumentStatus.DRAFT);
        doc.setAiScore(0); // Initial score

        return documentRepository.save(doc);
    }

    @Transactional
    public void reviewDocument(Long docId, int score, boolean approve) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        doc.setAiScore(score);
        
        if (approve && score >= 80) {
            doc.setStatus(Document.DocumentStatus.PUBLISHED);
            
            // Reward (READ FR-ST-17)
            User uploader = doc.getUploader();
            uploader.setCoinBalance(uploader.getCoinBalance() + 10);
            userRepository.save(uploader);
        } else if (!approve) {
            doc.setStatus(Document.DocumentStatus.REJECTED);
        }

        documentRepository.save(doc);
    }

    public List<DocumentDTO> getPublishedDocuments() {
        return documentRepository.findByStatus(Document.DocumentStatus.PUBLISHED)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DocumentDTO> getAllDocuments() {
        return documentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DocumentDTO> getUserDocuments(String email) {
        return documentRepository.findByUploaderEmail(email)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private DocumentDTO convertToDTO(Document doc) {
        String uploaderName = (doc.getUploader() != null) ? doc.getUploader().getFullName() : "Anonymous";
        return new DocumentDTO(
                doc.getId(),
                doc.getTitle(),
                doc.getCourseCode(),
                doc.getFaculty(),
                doc.getAiScore() != null ? doc.getAiScore() : 0,
                uploaderName,
                doc.getUploadDate() != null ? doc.getUploadDate().toString() : "",
                doc.getStatus() != null ? doc.getStatus().name() : Document.DocumentStatus.DRAFT.name(),
                doc.getFilePath()
        );
    }
}
