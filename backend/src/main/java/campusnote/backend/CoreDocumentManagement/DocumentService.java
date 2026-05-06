package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    public DocumentService(DocumentRepository documentRepository, 
                           UserRepository userRepository,
                           CourseRepository courseRepository,
                           FacultyRepository facultyRepository,
                           DepartmentRepository departmentRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
    }

    @PostConstruct
    @Transactional
    public void publishAllExistingDocuments() {
        List<Document> drafts = documentRepository.findAll();
        for (Document doc : drafts) {
            if (doc.getIsPublic() == null || doc.getIsPublic() != 1) {
                doc.setIsPublic(1);
                doc.setScore(85.0);
                if (doc.getCourseCode() == null) doc.setCourseCode("GENERAL");
                if (doc.getFacultyName() == null) doc.setFacultyName("GENERAL");
                documentRepository.save(doc);
            }
        }
    }

    @Transactional
    public Document uploadDocument(String title, String content, String courseCode, String faculty, String filePath, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Document doc = new Document();
        doc.setTitle(title);
        doc.setContent(content);
        doc.setUser(user);
        doc.setFilePath(filePath);
        doc.setCourseCode(courseCode != null ? courseCode : "GENERAL");
        doc.setFacultyName(faculty != null ? faculty : "GENERAL");
        
        // Course lookup: graceful — if not found, upload still succeeds without course link
        if (courseCode != null && !courseCode.isBlank()) {
            Optional<Course> courseOpt = courseRepository.findByCode(courseCode);
            if (courseOpt.isPresent()) {
                Course course = courseOpt.get();
                doc.setCourse(course);
                // Deduce Faculty and Department from Course
                if (course.getDepartment() != null) {
                    doc.setDepartment(course.getDepartment());
                    if (course.getDepartment().getFaculty() != null) {
                        doc.setFaculty(course.getDepartment().getFaculty());
                        doc.setFacultyName(course.getDepartment().getFaculty().getName());
                    }
                }
            }
        }

        // Fallback: if faculty/department not set via course, try to get from user's own faculty/department
        if (doc.getFaculty() == null && user.getFaculty() != null) {
            doc.setFaculty(user.getFaculty());
        }
        if (doc.getDepartment() == null && user.getDepartment() != null) {
            doc.setDepartment(user.getDepartment());
        }
        
        doc.setType(1); // Default type
        doc.setIsPublic(0); // Default to draft/private
        
        return documentRepository.save(doc);
    }

    public List<DocumentDTO> getPublicDocuments(String currentUserEmail) {
        return documentRepository.findByIsPublic(1)
                .stream()
                .map(doc -> convertToDTO(doc, currentUserEmail))
                .collect(Collectors.toList());
    }

    public List<DocumentDTO> searchDocuments(String query, String currentUserEmail) {
        String lowerQuery = query.toLowerCase();
        return documentRepository.findByIsPublic(1)
                .stream()
                .filter(doc -> doc.getTitle().toLowerCase().contains(lowerQuery) || 
                              (doc.getCourse() != null && doc.getCourse().getCode().toLowerCase().contains(lowerQuery)))
                .map(doc -> convertToDTO(doc, currentUserEmail))
                .collect(Collectors.toList());
    }

    public List<DocumentDTO> getAllDocuments(String currentUserEmail) {
        return documentRepository.findAll()
                .stream()
                .map(doc -> convertToDTO(doc, currentUserEmail))
                .collect(Collectors.toList());
    }

    public List<DocumentDTO> getUserDocuments(String email) {
        return documentRepository.findByUserEmail(email)
                .stream()
                .map(doc -> convertToDTO(doc, email))
                .collect(Collectors.toList());
    }

    private DocumentDTO convertToDTO(Document doc) {
        return convertToDTO(doc, null);
    }

    private DocumentDTO convertToDTO(Document doc, String currentUserEmail) {
        String uploaderName = (doc.getUser() != null) ? doc.getUser().getFullName() : "Anonymous";
        String courseCode = (doc.getCourse() != null) ? doc.getCourse().getCode() : "N/A";
        Long courseId = (doc.getCourse() != null) ? doc.getCourse().getId() : null;
        Long userId = (doc.getUser() != null) ? doc.getUser().getId() : null;
        
        Long facultyId = (doc.getFaculty() != null) ? doc.getFaculty().getId() : null;
        String facultyName = (doc.getFaculty() != null) ? doc.getFaculty().getName() : "N/A";
        Long departmentId = (doc.getDepartment() != null) ? doc.getDepartment().getId() : null;
        String departmentName = (doc.getDepartment() != null) ? doc.getDepartment().getName() : "N/A";

        String statusStr = (doc.getIsPublic() != null && doc.getIsPublic() == 1) ? "PUBLISHED" : (doc.getIsPublic() != null && doc.getIsPublic() == -1 ? "REJECTED" : "DRAFT");
        String uploadDateStr = doc.getUploadedAt() != null ? doc.getUploadedAt().toString() : "";
        Double score = doc.getScore() != null ? doc.getScore() : 0.0;

        DocumentDTO dto = new DocumentDTO();
        dto.setId(doc.getId());
        dto.setTitle(doc.getTitle());
        dto.setContent(doc.getContent());
        dto.setType(doc.getType());
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
        dto.setDownloadCount(doc.getDownloadCount() != null ? doc.getDownloadCount() : 0);
        dto.setViewCount(doc.getViewCount() != null ? doc.getViewCount() : 0);
        dto.setLikeCount(doc.getLikedByUsers().size());
        dto.setFilePath(doc.getFilePath());

        if (currentUserEmail != null) {
            dto.setLiked(doc.getLikedByUsers().stream().anyMatch(u -> u.getEmail().equals(currentUserEmail)));
        }

        return dto;
    }

    @Transactional
    public boolean reviewDocument(Long id, Integer score, boolean approve) {
        return documentRepository.findById(id).map(doc -> {
            double finalScore = score != null ? score.doubleValue() : 0.0;
            doc.setScore(finalScore);
            if (approve) {
                doc.setIsPublic(1); // PUBLISHED
                if (doc.getUser() != null) {
                    int reward = (int) (finalScore * 10);
                    doc.getUser().setCoinBalance((doc.getUser().getCoinBalance() != null ? doc.getUser().getCoinBalance() : 0) + reward);
                }
            } else {
                doc.setIsPublic(-1); // REJECTED
            }
            documentRepository.save(doc);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean incrementViewCount(Long id) {
        return documentRepository.findById(id).map(doc -> {
            doc.setViewCount((doc.getViewCount() == null ? 0 : doc.getViewCount()) + 1);
            documentRepository.save(doc);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean incrementDownloadCount(Long id) {
        return documentRepository.findById(id).map(doc -> {
            doc.setDownloadCount((doc.getDownloadCount() == null ? 0 : doc.getDownloadCount()) + 1);
            documentRepository.save(doc);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean toggleLike(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return documentRepository.findById(id).map(doc -> {
            boolean alreadyLiked = doc.getLikedByUsers().stream().anyMatch(u -> u.getId().equals(user.getId()));
            if (alreadyLiked) {
                doc.getLikedByUsers().removeIf(u -> u.getId().equals(user.getId()));
            } else {
                doc.getLikedByUsers().add(user);
            }
            documentRepository.save(doc);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean deleteDocument(Long id) {
        return documentRepository.findById(id).map(doc -> {
            // Prevent FK issues on document_likes join table
            doc.getLikedByUsers().clear();
            documentRepository.save(doc);
            documentRepository.delete(doc);
            return true;
        }).orElse(false);
    }
}
