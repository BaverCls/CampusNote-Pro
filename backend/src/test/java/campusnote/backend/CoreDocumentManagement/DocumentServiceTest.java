package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreGamification.GamificationService;
import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import campusnote.backend.LiaisonAI.LiaisonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DocumentServiceTest {

    private DocumentRepository documentRepository;
    private UserRepository userRepository;
    private CourseRepository courseRepository;
    private LiaisonService liaisonService;
    private GamificationService gamificationService;
    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        documentRepository = mock(DocumentRepository.class);
        userRepository = mock(UserRepository.class);
        courseRepository = mock(CourseRepository.class);
        liaisonService = mock(LiaisonService.class);
        gamificationService = mock(GamificationService.class);
        documentService = new DocumentService(documentRepository, userRepository, courseRepository, liaisonService, gamificationService);
    }

    @Test
    void uploadCreatesDraftAndTriggersAiReview() {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@arel.edu.tr");

        Course course = new Course();
        course.setCode("CS101");

        when(userRepository.findByEmail("student@arel.edu.tr")).thenReturn(Optional.of(user));
        when(courseRepository.findByCode("CS101")).thenReturn(Optional.of(course));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(10L);
            return doc;
        });

        Document saved = documentService.uploadDocument(
                "notes.pdf",
                null,
                "CS101",
                "Engineering",
                "uploads/notes.pdf",
                1024L,
                "student@arel.edu.tr"
        );

        assertEquals("DRAFT", saved.getStatus());
        assertEquals(0, saved.getIsPublic());
        assertEquals(1024L, saved.getFileSize());
        verify(liaisonService).triggerEvaluation(10L);
    }

    @Test
    void aiPublishesAndAwardsCoinsWhenScoreMeetsThreshold() {
        User user = new User();
        user.setId(1L);
        user.setCoinBalance(100);

        Course course = new Course();
        course.setEcts(6);

        Document doc = new Document();
        doc.setId(10L);
        doc.setUser(user);
        doc.setCourse(course);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        documentService.finalizeAIRanking(10L, 80);

        assertEquals("PUBLISHED", doc.getStatus());
        assertEquals(1, doc.getIsPublic());
        assertEquals(160, user.getCoinBalance());
        verify(gamificationService).updateRank(1L);
        verify(documentRepository).save(doc);
    }

    @Test
    void aiFlagsWhenScoreIsBelowThreshold() {
        Document doc = new Document();
        doc.setId(10L);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        documentService.finalizeAIRanking(10L, 79);

        assertEquals("FLAGGED", doc.getStatus());
        assertEquals(0, doc.getIsPublic());
    }

    @Test
    void fiveReportsFlagPublishedDocument() {
        Document doc = new Document();
        doc.setId(10L);
        doc.setStatus("PUBLISHED");
        doc.setIsPublic(1);
        doc.setReportCount(4);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        assertTrue(documentService.reportDocument(10L));

        assertEquals(5, doc.getReportCount());
        assertEquals("FLAGGED", doc.getStatus());
        assertEquals(0, doc.getIsPublic());
    }

    @Test
    void storageTelemetrySumsStoredPdfSizes() {
        Document first = new Document();
        first.setFileSize(1024L);
        Document second = new Document();
        second.setFileSize(2048L);

        when(documentRepository.findAll()).thenReturn(List.of(first, second));

        assertEquals(3072L, documentService.getTotalStoredBytes());
    }
}
