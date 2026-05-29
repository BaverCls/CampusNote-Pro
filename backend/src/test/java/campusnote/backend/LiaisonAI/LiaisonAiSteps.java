package campusnote.backend.LiaisonAI;

import campusnote.backend.CoreDocumentManagement.Document;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import campusnote.backend.CoreNotification.NotificationService;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

public class LiaisonAiSteps {

    private LiaisonService liaisonService;
    private DocumentRepository documentRepository;
    private DocumentService documentService;
    private NotificationService notificationService;
    private Document doc;
    private String text;
    private String courseCode;
    private int score;

    @Given("a CS101 PDF text containing algorithm course keywords")
    public void aCs101PdfTextContainingAlgorithmCourseKeywords() {
        text = "This algorithm note explains complexity, data structure, programming variable usage, and function design.";
        courseCode = "CS101";
        liaisonService = new LiaisonService(mock(DocumentRepository.class), mock(DocumentService.class), mock(NotificationService.class));
    }

    @Given("a CS101 PDF text without academic course keywords")
    public void aCs101PdfTextWithoutAcademicCourseKeywords() {
        text = "Lunch menu, parking reminder, and unrelated social announcement.";
        courseCode = "CS101";
        liaisonService = new LiaisonService(mock(DocumentRepository.class), mock(DocumentService.class), mock(NotificationService.class));
    }

    @When("Liaison AI calculates the quality score")
    public void liaisonAiCalculatesTheQualityScore() {
        score = liaisonService.calculateScore(text, courseCode);
    }

    @Then("the score is high enough to publish")
    public void theScoreIsHighEnoughToPublish() {
        assertTrue(score >= 80, "Expected publishable score but got " + score);
    }

    @Then("the score is below the publish threshold")
    public void theScoreIsBelowThePublishThreshold() {
        assertTrue(score < 80, "Expected below-threshold score but got " + score);
    }

    @Given("a running PyTorch AI microservice")
    public void aRunningPyTorchAiMicroservice() throws Exception {
        documentRepository = mock(DocumentRepository.class);
        documentService = mock(DocumentService.class);
        notificationService = mock(NotificationService.class);
        liaisonService = new LiaisonService(documentRepository, documentService, notificationService);

        HttpClient mockHttpClient = mock(HttpClient.class);
        @SuppressWarnings("unchecked")
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn("{\"documentId\":10,\"score\":95,\"decision\":\"PUBLISH\",\"confidence\":0.95,\"matchedSignals\":[\"algorithm\"],\"modelVersion\":\"pytorch-demo-v1\"}");
        doReturn(mockResponse).when(mockHttpClient).send(any(), any());

        ReflectionTestUtils.setField(liaisonService, "httpClient", mockHttpClient);
    }

    @Given("a CS101 PDF text to evaluate")
    public void aCs101PdfTextToEvaluate() {
        text = "This algorithm explains data structure.";
        courseCode = "CS101";

        doc = new Document();
        doc.setId(10L);
        doc.setTitle("Test Doc");
        doc.setFilePath("uploads/mock.pdf");
        doc.setStatus("DRAFT");
        doc.setCourseCode(courseCode);

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));
    }

    @Given("a document waits for AI evaluation")
    public void aDocumentWaitsForAiEvaluation() {
        documentRepository = mock(DocumentRepository.class);
        documentService = mock(DocumentService.class);
        notificationService = mock(NotificationService.class);
        liaisonService = new LiaisonService(documentRepository, documentService, notificationService);

        doc = new Document();
        doc.setId(10L);
        doc.setTitle("Test Doc");
        doc.setFilePath("uploads/mock.pdf");
        doc.setStatus("DRAFT");
        doc.setCourseCode("CS101");

        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc));
    }

    @Given("the AI service returns score {int}")
    public void theAiServiceReturnsScore(int aiScore) throws Exception {
        HttpClient mockHttpClient = mock(HttpClient.class);
        @SuppressWarnings("unchecked")
        HttpResponse<String> mockResponse = mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(String.format(
                "{\"documentId\":10,\"score\":%d,\"decision\":\"PUBLISH\",\"confidence\":0.99,\"matchedSignals\":[\"algorithm\"],\"modelVersion\":\"pytorch-demo-v1\"}",
                aiScore
        ));
        doReturn(mockResponse).when(mockHttpClient).send(any(), any());

        ReflectionTestUtils.setField(liaisonService, "httpClient", mockHttpClient);
    }

    @When("the evaluation is triggered")
    public void theEvaluationIsTriggered() {
        liaisonService.triggerEvaluation(10L);
    }

    @Then("the score returned by the PyTorch service is saved")
    public void theScoreReturnedByThePyTorchServiceIsSaved() {
        verify(documentService).finalizeAIRanking(eq(10L), eq(95));
    }

    @Then("the system rejects the document")
    public void theSystemRejectsTheDocument() {
        assertEquals("REJECTED", doc.getStatus());
    }

    @Then("the final score does not use {int}")
    public void theFinalScoreDoesNotUse(int invalidScore) {
        verify(documentService, never()).finalizeAIRanking(eq(10L), eq(invalidScore));
    }

    @Then("the rejection reason mentions invalid AI score")
    public void theRejectionReasonMentionsInvalidAiScore() {
        verify(notificationService).createForUser(
                any(),
                eq(10L),
                eq("DOCUMENT_REJECTED"),
                eq("Document rejected"),
                contains("invalid AI score")
        );
    }
}

