package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import campusnote.backend.CoreGamification.GamificationService;
import campusnote.backend.CoreNotification.NotificationService;
import campusnote.backend.LiaisonAI.LiaisonService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
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
    private final NotificationService notificationService;

    // FR-DOC-64: Global AI algorithm passing score
    private int globalAiThreshold = 80;

    public DocumentService(DocumentRepository documentRepository, 
                           UserRepository userRepository,
                           CourseRepository courseRepository,
                           @Lazy LiaisonService liaisonService,
                           GamificationService gamificationService,
                           NotificationService notificationService) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.liaisonService = liaisonService;
        this.gamificationService = gamificationService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Document uploadDocument(String title, String content, String courseCode, String faculty, String filePath, Long fileSize, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Document doc = new Document();
        doc.setTitle(title);
        doc.setContent(content);
        doc.setUser(user);
        doc.setFilePath(filePath);
        doc.setFileSize(fileSize != null ? fileSize : 0L);
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
            String previousStatus = doc.getStatus();
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
            notifyDocumentStatusChanged(doc, previousStatus);
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

    @Transactional(readOnly = true)
    public List<DocumentDTO> getPublicDocuments(String currentUserEmail) {
        return documentRepository.findByIsPublic(1)
                .stream()
                .map(doc -> convertToDTO(doc, currentUserEmail))
                .collect(Collectors.toList());
    }

    // FR-ST-41: Filter search results based on the academic Faculty
    // FR-ST-42: Order the displayed document results by the count of "Downloads"
    @Transactional(readOnly = true)
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
        } else if ("score".equals(sortBy)) {
            stream = stream.sorted((a, b) -> Double.compare(b.getScore() != null ? b.getScore() : 0.0,
                                                            a.getScore() != null ? a.getScore() : 0.0));
        } else {
            stream = stream.sorted((a, b) -> {
                if (a.getUploadedAt() == null && b.getUploadedAt() == null) return 0;
                if (a.getUploadedAt() == null) return 1;
                if (b.getUploadedAt() == null) return -1;
                return b.getUploadedAt().compareTo(a.getUploadedAt());
            });
        }
        
        return stream.map(doc -> convertToDTO(doc, currentUserEmail))
                    .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentDTO> getAllDocuments(String currentUserEmail) {
        return documentRepository.findAll()
                .stream()
                .map(doc -> convertToDTO(doc, currentUserEmail))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentDTO> getUserDocuments(String email) {
        return documentRepository.findByUserEmail(email)
                .stream()
                .map(doc -> convertToDTO(doc, email))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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
        dto.setFileUrl("/api/documents/" + doc.getId() + "/file");
        dto.setThumbnailUrl("/api/documents/" + doc.getId() + "/thumbnail");
        dto.setReportCount(doc.getReportCount() != null ? doc.getReportCount() : 0);

        if (currentUserEmail != null) {
            dto.setLiked(doc.getLikedByUsers().stream().anyMatch(u -> u.getEmail().equals(currentUserEmail)));
        }

        return dto;
    }

    @Transactional
    public boolean reviewDocument(Long id, Integer score, boolean approve) {
        return documentRepository.findById(id).map(doc -> {
            String previousStatus = doc.getStatus();
            double finalScore = score != null ? score.doubleValue() : 0.0;
            doc.setScore(finalScore);
            if (approve) {
                if (finalScore >= globalAiThreshold) {
                    doc.setStatus("PUBLISHED");
                    doc.setIsPublic(1);
                    awardCoinsForDocument(doc);
                } else {
                    doc.setStatus("FLAGGED");
                    doc.setIsPublic(0);
                }
            } else {
                doc.setStatus("REJECTED");
                doc.setIsPublic(-1);
            }
            documentRepository.save(doc);
            notifyDocumentStatusChanged(doc, previousStatus);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean flagDocument(Long id) {
        return documentRepository.findById(id).map(doc -> {
            String previousStatus = doc.getStatus();
            doc.setStatus("FLAGGED");
            doc.setIsPublic(0);
            documentRepository.save(doc);
            notifyDocumentStatusChanged(doc, previousStatus);
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
            String previousStatus = doc.getStatus();
            doc.setReportCount((doc.getReportCount() != null ? doc.getReportCount() : 0) + 1);
            if (doc.getReportCount() >= 5) {
                doc.setStatus("FLAGGED");
                doc.setIsPublic(0);
            }
            documentRepository.save(doc);
            notifyDocumentStatusChanged(doc, previousStatus);
            return true;
        }).orElse(false);
    }

    private void notifyDocumentStatusChanged(Document doc, String previousStatus) {
        String status = doc.getStatus();
        if (status == null || status.equals(previousStatus)) return;

        if ("PUBLISHED".equals(status)) {
            notificationService.createForUser(
                    doc.getUser(),
                    doc.getId(),
                    "DOCUMENT_PUBLISHED",
                    "Document published",
                    String.format("Your document \"%s\" is now published.", doc.getTitle())
            );
        } else if ("FLAGGED".equals(status)) {
            notificationService.createForUser(
                    doc.getUser(),
                    doc.getId(),
                    "DOCUMENT_FLAGGED",
                    "Document flagged",
                    String.format("Your document \"%s\" needs admin review.", doc.getTitle())
            );
        } else if ("REJECTED".equals(status)) {
            notificationService.createForUser(
                    doc.getUser(),
                    doc.getId(),
                    "DOCUMENT_REJECTED",
                    "Document rejected",
                    String.format("Your document \"%s\" was rejected after review.", doc.getTitle())
            );
        }
    }

    public void setGlobalAiThreshold(int threshold) {
        // FR-DOC-64: Administrative control over the minimum score threshold
        this.globalAiThreshold = threshold;
    }

    public int getGlobalAiThreshold() {
        return globalAiThreshold;
    }

    public Optional<Path> getReadablePdfPath(Long id, boolean requirePublished) {
        return documentRepository.findById(id)
                .filter(doc -> !requirePublished || "PUBLISHED".equals(doc.getStatus()))
                .map(Document::getFilePath)
                .filter(path -> path != null && !path.isBlank())
                .map(Path::of)
                .filter(path -> java.nio.file.Files.exists(path) && java.nio.file.Files.isReadable(path));
    }

    @Transactional(readOnly = true)
    public long getTotalStoredBytes() {
        return documentRepository.findAll().stream()
                .map(Document::getFileSize)
                .filter(size -> size != null && size > 0)
                .mapToLong(Long::longValue)
                .sum();
    }
}
