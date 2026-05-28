package campusnote.backend.LiaisonAI;

import campusnote.backend.CoreDocumentManagement.Document;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import campusnote.backend.CoreNotification.NotificationService;
import campusnote.backend.CoreSecurity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.Optional;

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
    void triggerEvaluationMarksUnderReviewSendsNotificationAndFinalizes() {
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

        verify(documentRepository).save(doc);

        // Verify notification sent
        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_UNDER_REVIEW"),
                eq("AI evaluation started"),
                contains("Computer Networks")
        );

        // Final production status is owned by DocumentService; this service only starts review and delegates finalization.
        verify(documentService).finalizeAIRanking(eq(10L), anyInt());
    }

    @Test
    void triggerEvaluationWithPyTorchAiServiceSuccessUsesCanonicalModelScore() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@arel.edu.tr");

        Document doc = new Document();
        doc.setId(10L);
        doc.setTitle("Computer Networks");
        doc.setFilePath("uploads/mock.pdf");
        doc.setStatus("DRAFT");
        doc.setCourseCode("CS101");
        doc.setUser(user);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        HttpClient mockHttpClient = mock(HttpClient.class);
        @SuppressWarnings("unchecked")
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn("{\"documentId\":10,\"score\":95,\"decision\":\"PUBLISH\",\"confidence\":0.95,\"matchedSignals\":[\"algorithm\"],\"modelVersion\":\"pytorch-demo-v1\"}");
        doReturn(mockResponse).when(mockHttpClient).send(any(), any());

        ReflectionTestUtils.setField(liaisonService, "httpClient", mockHttpClient);

        liaisonService.triggerEvaluation(10L);

        verify(documentRepository).save(doc);
        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_UNDER_REVIEW"),
                eq("AI evaluation started"),
                contains("Computer Networks")
        );
        verify(documentService).finalizeAIRanking(eq(10L), eq(95));
    }

    @Test
    void triggerEvaluationWithAiServiceUnavailableFallsBackToKeywordRatioScoring() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@arel.edu.tr");

        Document doc = new Document();
        doc.setId(10L);
        doc.setTitle("Computer Networks");
        doc.setFilePath("uploads/mock.pdf");
        doc.setStatus("DRAFT");
        doc.setCourseCode("CS101");
        doc.setUser(user);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));

        HttpClient mockHttpClient = mock(HttpClient.class);
        when(mockHttpClient.send(any(), any())).thenThrow(new IOException("Connection refused"));

        ReflectionTestUtils.setField(liaisonService, "httpClient", mockHttpClient);

        liaisonService.triggerEvaluation(10L);

        verify(documentRepository).save(doc);
        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_UNDER_REVIEW"),
                eq("AI evaluation started"),
                contains("Computer Networks")
        );
        // Primary AI service scores come from the PyTorch model. If unavailable, fallback uses
        // a simple keyword ratio, so it is not expected to match the canonical PyTorch score.
        // Local mock text contains 6 out of 7 CS101 keywords.
        // "functions" also matches the "function" keyword via contains().
        // Score = (6/7) * 100 = 85
        verify(documentService).finalizeAIRanking(eq(10L), eq(85));
    }
}
