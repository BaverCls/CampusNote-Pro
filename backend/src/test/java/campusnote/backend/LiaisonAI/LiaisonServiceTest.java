package campusnote.backend.LiaisonAI;

import campusnote.backend.CoreDocumentManagement.Document;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import campusnote.backend.CoreDocumentManagement.Course;
import campusnote.backend.CoreDocumentManagement.CourseRepository;
import campusnote.backend.CoreNotification.NotificationService;
import campusnote.backend.CoreSecurity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;

import java.io.File;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class LiaisonServiceTest {

    private DocumentRepository documentRepository;
    private DocumentService documentService;
    private NotificationService notificationService;
    private CourseRepository courseRepository;
    private LiaisonService liaisonService;

    @BeforeEach
    void setUp() {
        documentRepository = mock(DocumentRepository.class);
        documentService = mock(DocumentService.class);
        notificationService = mock(NotificationService.class);
        courseRepository = mock(CourseRepository.class);
        liaisonService = new LiaisonService(documentRepository, documentService, notificationService, courseRepository);
    }

    private String createBlankPdf() throws IOException {
        File tempFile = File.createTempFile("blank", ".pdf");
        tempFile.deleteOnExit();
        try (PDDocument document = new PDDocument()) {
            document.addPage(new PDPage());
            document.save(tempFile);
        }
        return tempFile.getAbsolutePath();
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

        liaisonService.triggerEvaluation(10L);

        verify(documentRepository).save(doc);

        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_UNDER_REVIEW"),
                eq("AI evaluation started"),
                contains("Computer Networks")
        );

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
        // Under our robust fallback, the score returned is 85 (base 10, length +5, dept matches +16, academic matches +4, relevance +50)
        verify(documentService).finalizeAIRanking(eq(10L), eq(85));
    }

    @Test
    void evaluateRejectsAiScoreOutsideValidRange() throws Exception {
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
        when(mockResponse.body()).thenReturn("{\"documentId\":10,\"score\":999,\"decision\":\"PUBLISH\",\"confidence\":0.99,\"matchedSignals\":[\"algorithm\"],\"modelVersion\":\"pytorch-demo-v1\"}");
        doReturn(mockResponse).when(mockHttpClient).send(any(), any());

        ReflectionTestUtils.setField(liaisonService, "httpClient", mockHttpClient);

        liaisonService.triggerEvaluation(10L);

        assertEquals("REJECTED", doc.getStatus());
        verify(documentService, never()).finalizeAIRanking(eq(10L), eq(999));
        verify(notificationService).createForUser(
                eq(user),
                eq(10L),
                eq("DOCUMENT_REJECTED"),
                eq("Document rejected"),
                contains("invalid AI score")
        );
    }

    @Test
    void testEvaluationUnavailableNotDefaultTo85() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@arel.edu.tr");

        Document doc = new Document();
        doc.setId(11L);
        doc.setTitle("Advanced Algorithms");
        doc.setFilePath("uploads/mock.pdf");
        doc.setStatus("DRAFT");
        doc.setCourseCode("CS201");
        doc.setUser(user);

        Course course = new Course();
        course.setCode("CS201");
        course.setName("Programming");
        when(courseRepository.findByCode("CS201")).thenReturn(Optional.of(course));

        when(documentRepository.findById(11L)).thenReturn(Optional.of(doc));

        HttpClient mockHttpClient = mock(HttpClient.class);
        when(mockHttpClient.send(any(), any())).thenThrow(new IOException("Connection refused"));

        ReflectionTestUtils.setField(liaisonService, "httpClient", mockHttpClient);

        liaisonService.triggerEvaluation(11L);

        verify(documentRepository).save(doc);
        verify(notificationService).createForUser(
                eq(user),
                eq(11L),
                eq("DOCUMENT_UNDER_REVIEW"),
                eq("AI evaluation started"),
                contains("Advanced Algorithms")
        );
        // Validates that it doesn't default to 85, but uses the calculated 93 because of the course name match!
        verify(documentService).finalizeAIRanking(eq(11L), eq(93));
    }

    @Test
    void testIrrelevantChatTextCS201() {
        String irrelevantText = "selam kanka naber nasılsın party oyun yemek whatsapp linke tıkla spam random";
        int score = liaisonService.calculateScore(irrelevantText, "CS201");
        assertTrue(score < 50, "Irrelevant chat text should score low, got: " + score);
    }

    @Test
    void testCourseRelatedAcademicTextCS201() {
        Course course = new Course();
        course.setCode("CS201");
        course.setName("Data Structures and Algorithms");
        when(courseRepository.findByCode("CS201")).thenReturn(Optional.of(course));

        String academicText = "This algorithm lecture note explains data structure complexity and programming system design definition. Excellent course on data structures and algorithms.";
        int score = liaisonService.calculateScore(academicText, "CS201");
        assertTrue(score >= 80, "Relevant academic text should score high, got: " + score);
    }

    @Test
    void testEmptyTextOrUnreadableRejected() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@arel.edu.tr");

        Document doc = new Document();
        doc.setId(12L);
        doc.setTitle("Empty Document");
        doc.setFilePath(createBlankPdf());
        doc.setStatus("DRAFT");
        doc.setCourseCode("CS101");
        doc.setUser(user);

        when(documentRepository.findById(12L)).thenReturn(Optional.of(doc));

        liaisonService.triggerEvaluation(12L);

        assertEquals("REJECTED", doc.getStatus());
        verify(notificationService).createForUser(
                eq(user),
                eq(12L),
                eq("DOCUMENT_REJECTED"),
                eq("Document rejected"),
                contains("no readable academic text")
        );
    }

    @Test
    void testInvalidAiScoreOutsideBoundsRejected() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@arel.edu.tr");

        Document doc = new Document();
        doc.setId(13L);
        doc.setTitle("Bad Score Doc");
        doc.setFilePath("uploads/mock.pdf");
        doc.setStatus("DRAFT");
        doc.setCourseCode("CS101");
        doc.setUser(user);

        when(documentRepository.findById(13L)).thenReturn(Optional.of(doc));

        HttpClient mockHttpClient = mock(HttpClient.class);
        @SuppressWarnings("unchecked")
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        // Return a score of -5 which is invalid
        when(mockResponse.body()).thenReturn("{\"documentId\":13,\"score\":-5,\"decision\":\"PUBLISH\",\"confidence\":0.99,\"matchedSignals\":[],\"modelVersion\":\"pytorch-demo\"}");
        doReturn(mockResponse).when(mockHttpClient).send(any(), any());

        ReflectionTestUtils.setField(liaisonService, "httpClient", mockHttpClient);

        liaisonService.triggerEvaluation(13L);

        assertEquals("REJECTED", doc.getStatus());
        verify(documentService, never()).finalizeAIRanking(eq(13L), eq(-5));
    }

    @Test
    void testMedicalAcademicNoteMEDCode() {
        Course course = new Course();
        course.setCode("MED101");
        course.setName("Anatomy and Physiology");
        when(courseRepository.findByCode("MED101")).thenReturn(Optional.of(course));

        String goodText = "This anatomy lecture note explains the physiology and pathology of cardiovascular system definitions. Highly detailed clinical study of patient diagnosis and pharmacology.";
        int goodScore = liaisonService.calculateScore(goodText, "MED101");

        String spamText = "whatsapp kanka anatomy bro, anatomy study for MED101 class. linke tıkla spam random";
        int spamScore = liaisonService.calculateScore(spamText, "MED101");

        assertTrue(goodScore >= 80, "Expected high score for medical academic note, got: " + goodScore);
        assertTrue(spamScore < 50, "Expected low score for spam medical note, got: " + spamScore);
        assertTrue(goodScore > spamScore, "Good note should score higher than spam note");
    }

    @Test
    void testLawAcademicNoteLAWCode() {
        Course course = new Course();
        course.setCode("LAW202");
        course.setName("International Law and Regulations");
        when(courseRepository.findByCode("LAW202")).thenReturn(Optional.of(course));

        String goodText = "This law lecture note explains the international legal treaty, court rights, and contract regulation principles. Constitutional law definition.";
        int goodScore = liaisonService.calculateScore(goodText, "LAW202");

        String spamText = "whatsapp kanka law bro, legal treaty. linke tıkla spam random";
        int spamScore = liaisonService.calculateScore(spamText, "LAW202");

        assertTrue(goodScore >= 80, "Expected high score for law academic note, got: " + goodScore);
        assertTrue(spamScore < 50, "Expected low score for spam law note, got: " + spamScore);
        assertTrue(goodScore > spamScore, "Good note should score higher than spam note");
    }
}
