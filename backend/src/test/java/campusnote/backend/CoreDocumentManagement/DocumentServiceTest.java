package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreGamification.GamificationService;
import campusnote.backend.CoreNotification.NotificationService;
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
    private NotificationService notificationService;
    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        documentRepository = mock(DocumentRepository.class);
        userRepository = mock(UserRepository.class);
        courseRepository = mock(CourseRepository.class);
        liaisonService = mock(LiaisonService.class);
        gamificationService = mock(GamificationService.class);
        notificationService = mock(NotificationService.class);
        documentService = new DocumentService(documentRepository, userRepository, courseRepository, liaisonService, gamificationService, notificationService);
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
        assertEquals("CS101", saved.getCourseCode());
        assertSame(course, saved.getCourse());
        verify(liaisonService).triggerEvaluation(10L);
    }

    @Test
    void uploadRejectsUnknownCourseCode() {
        User user = new User();
        user.setEmail("student@arel.edu.tr");

        when(userRepository.findByEmail("student@arel.edu.tr")).thenReturn(Optional.of(user));
        when(courseRepository.findByCode("MADEUP101")).thenReturn(Optional.empty());

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () ->
                documentService.uploadDocument(
                        "notes.pdf",
                        null,
                        "MADEUP101",
                        "Engineering",
                        "uploads/notes.pdf",
                        1024L,
                        "student@arel.edu.tr"
                )
        );

        assertEquals("Course code must match an existing course", error.getMessage());
        verify(documentRepository, never()).save(any(Document.class));
        verify(liaisonService, never()).triggerEvaluation(anyLong());
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
    void publishedDocumentCreatesNotification() {
        User user = new User();
        user.setId(1L);

        Course course = new Course();
        course.setEcts(5);

        Document doc = new Document();
        doc.setId(10L);
        doc.setTitle("Algorithms");
        doc.setStatus("DRAFT");
        doc.setUser(user);
        doc.setCourse(course);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        documentService.finalizeAIRanking(10L, 80);

        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_PUBLISHED"),
                eq("Document published"),
                contains("Algorithms")
        );
    }

    @Test
    void rejectedDocumentCreatesNotification() {
        User user = new User();
        user.setId(1L);

        Document doc = new Document();
        doc.setId(10L);
        doc.setTitle("Physics Notes");
        doc.setStatus("DRAFT");
        doc.setUser(user);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        assertTrue(documentService.reviewDocument(10L, 20, false));

        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_REJECTED"),
                eq("Document rejected"),
                contains("Physics Notes")
        );
    }

    @Test
    void flaggedDocumentCreatesNotification() {
        User user = new User();
        user.setId(1L);

        Document doc = new Document();
        doc.setId(10L);
        doc.setTitle("Reported Notes");
        doc.setStatus("PUBLISHED");
        doc.setIsPublic(1);
        doc.setReportCount(4);
        doc.setUser(user);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        assertTrue(documentService.reportDocument(10L));

        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_FLAGGED"),
                eq("Document flagged"),
                contains("Reported Notes")
        );
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
