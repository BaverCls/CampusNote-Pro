package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import campusnote.backend.CoreGamification.GamificationService;
import campusnote.backend.LiaisonAI.LiaisonService;
import org.springframework.context.annotation.Lazy;
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
    private final LiaisonService liaisonService;
    private final GamificationService gamificationService;

    // FR-DOC-64: Global AI algorithm passing score
    private int globalAiThreshold = 60;

    public DocumentService(DocumentRepository documentRepository, 
                           UserRepository userRepository,
                           CourseRepository courseRepository,
                           @Lazy LiaisonService liaisonService,
                           GamificationService gamificationService) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.liaisonService = liaisonService;
        this.gamificationService = gamificationService;
    }

    @PostConstruct
    @Transactional
    public void publishAllExistingDocuments() {
        List<Document> drafts = documentRepository.findAll();
        for (Document doc : drafts) {
            if (doc.getStatus() == null || doc.getStatus().equals("DRAFT")) {
                doc.setStatus("PUBLISHED");
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
        
        // Course lookup
        if (courseCode != null && !courseCode.isBlank()) {
            Optional<Course> courseOpt = courseRepository.findByCode(courseCode);
            if (courseOpt.isPresent()) {
                Course course = courseOpt.get();
                doc.setCourse(course);
                if (course.getDepartment() != null) {
                    doc.setDepartment(course.getDepartment());
                    if (course.getDepartment().getFaculty() != null) {
                        doc.setFaculty(course.getDepartment().getFaculty());
                        doc.setFacultyName(course.getDepartment().getFaculty().getName());
                    }
                }
            }
        }

        if (doc.getFaculty() == null && user.getFaculty() != null) {
            doc.setFaculty(user.getFaculty());
        }
        if (doc.getDepartment() == null && user.getDepartment() != null) {
            doc.setDepartment(user.getDepartment());
        }
        
        doc.setType(1); 
        doc.setIsPublic(0); 
        doc.setStatus("DRAFT"); // FR-ST-20
        
        Document saved = documentRepository.save(doc);
        
        // FR-ST-23: Transmit to AI Ranking Service
        liaisonService.triggerEvaluation(saved.getId());
        
        return saved;
    }

    @Transactional
    public void finalizeAIRanking(Long docId, int score) {
        documentRepository.findById(docId).ifPresent(doc -> {
            doc.setScore((double) score);
            
            // FR-DOC-28: Transition to Published if threshold met
            if (score >= globalAiThreshold) {
                doc.setStatus("PUBLISHED");
                doc.setIsPublic(1);
                
                // FR-ST-34: Add CampusCoin reward upon Published status
                awardCoinsForDocument(doc);
            } else {
                // FR-DOC-29: Flag if below threshold
                doc.setStatus("FLAGGED");
                doc.setIsPublic(0);
            }
            documentRepository.save(doc);
        });
    }

    private void awardCoinsForDocument(Document doc) {
        if (doc.getUser() != null && doc.getCourse() != null) {
            // FR-ST-33: Reward = AKTS * 10
            Integer akts = doc.getCourse().getEcts();
            if (akts == null) akts = 5; // Fallback
            
            int reward = akts * 10;
            User user = doc.getUser();
            user.setCoinBalance((user.getCoinBalance() != null ? user.getCoinBalance() : 0) + reward);
            userRepository.save(user);
            gamificationService.updateRank(user.getId());
        }
    }

    public List<DocumentDTO> getPublicDocuments(String currentUserEmail) {
        return documentRepository.findByIsPublic(1)
                .stream()
                .map(doc -> convertToDTO(doc, currentUserEmail))
                .collect(Collectors.toList());
    }

    // FR-ST-41: Filter search results based on the academic Faculty
    // FR-ST-42: Order the displayed document results by the count of "Downloads"
    public List<DocumentDTO> searchDocuments(String query, Long facultyId, String sortBy, String currentUserEmail) {
        String lowerQuery = query != null ? query.toLowerCase() : "";
        java.util.stream.Stream<Document> stream = documentRepository.findByIsPublic(1).stream();
        
        if (!lowerQuery.isEmpty()) {
            stream = stream.filter(doc -> doc.getTitle().toLowerCase().contains(lowerQuery) || 
                                         (doc.getCourse() != null && doc.getCourse().getCode().toLowerCase().contains(lowerQuery)));
        }
        
        if (facultyId != null) {
            stream = stream.filter(doc -> doc.getFaculty() != null && doc.getFaculty().getId().equals(facultyId));
        }
        
        if ("downloads".equals(sortBy)) {
            stream = stream.sorted((a, b) -> Integer.compare(b.getDownloadCount() != null ? b.getDownloadCount() : 0, 
                                                            a.getDownloadCount() != null ? a.getDownloadCount() : 0));
        } else {
            stream = stream.sorted((a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt()));
        }
        
        return stream.map(doc -> convertToDTO(doc, currentUserEmail))
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

    public DocumentDTO convertToDTO(Document doc, String currentUserEmail) {
        String uploaderName = (doc.getUser() != null) ? doc.getUser().getFullName() : "Anonymous";
        String courseCode = (doc.getCourse() != null) ? doc.getCourse().getCode() : "N/A";
        Long courseId = (doc.getCourse() != null) ? doc.getCourse().getId() : null;
        Long userId = (doc.getUser() != null) ? doc.getUser().getId() : null;
        
        Long facultyId = (doc.getFaculty() != null) ? doc.getFaculty().getId() : null;
        String facultyName = (doc.getFaculty() != null) ? doc.getFaculty().getName() : "N/A";
        Long departmentId = (doc.getDepartment() != null) ? doc.getDepartment().getId() : null;
        String departmentName = (doc.getDepartment() != null) ? doc.getDepartment().getName() : "N/A";

        String statusStr = doc.getStatus() != null ? doc.getStatus() : "DRAFT";
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
                doc.setStatus("PUBLISHED");
                doc.setIsPublic(1);
                awardCoinsForDocument(doc);
            } else {
                doc.setStatus("REJECTED");
                doc.setIsPublic(-1);
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
            // FR-ST-37: Only permit Likes on Published documents
            if (!"PUBLISHED".equals(doc.getStatus())) {
                return false;
            }
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
            doc.getLikedByUsers().clear();
            documentRepository.save(doc);
            documentRepository.delete(doc);
            return true;
        }).orElse(false);
    }

    // FR-ST-57: Auto-flag document after 5 negative reports
    @Transactional
    public boolean reportDocument(Long id) {
        return documentRepository.findById(id).map(doc -> {
            doc.setReportCount((doc.getReportCount() != null ? doc.getReportCount() : 0) + 1);
            if (doc.getReportCount() >= 5) {
                doc.setStatus("FLAGGED");
                doc.setIsPublic(0);
            }
            documentRepository.save(doc);
            return true;
        }).orElse(false);
    }

    public void setGlobalAiThreshold(int threshold) {
        // FR-DOC-64: Administrative control over the minimum score threshold
        this.globalAiThreshold = threshold;
    }
}
