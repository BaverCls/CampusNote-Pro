package campusnote.backend.LiaisonAI;

import campusnote.backend.CoreDocumentManagement.Document;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import campusnote.backend.CoreNotification.NotificationService;
import campusnote.backend.CoreSecurity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LiaisonServiceTest {

    private DocumentRepository documentRepository;
    private DocumentService documentService;
    private NotificationService notificationService;
    private LiaisonService liaisonService;

    @BeforeEach
    void setUp() {
        documentRepository = mock(DocumentRepository.class);
        documentService = mock(DocumentService.class);
        notificationService = mock(NotificationService.class);
        liaisonService = new LiaisonService(documentRepository, documentService, notificationService);
    }

    @Test
    void triggerEvaluationUpdatesStatusSendsNotificationAndFinalizes() {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@arel.edu.tr");

        Document doc = new Document();
        doc.setId(10L);
        doc.setTitle("Computer Networks");
        doc.setFilePath("uploads/mock.pdf"); // will trigger mock text extraction
        doc.setStatus("DRAFT");
        doc.setCourseCode("CS101");
        doc.setUser(user);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        // run evaluation synchronously in the test
        liaisonService.triggerEvaluation(10L);

        // Verify status changed to UNDER REVIEW and saved
        assertEquals("UNDER REVIEW", doc.getStatus());
        verify(documentRepository).save(doc);

        // Verify notification sent
        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_UNDER_REVIEW"),
                eq("AI evaluation started"),
                contains("Computer Networks")
        );

        // Verify finalization is called
        verify(documentService).finalizeAIRanking(eq(10L), anyInt());
    }
}
