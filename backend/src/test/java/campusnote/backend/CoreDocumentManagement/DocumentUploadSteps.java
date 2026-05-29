package campusnote.backend.CoreDocumentManagement;

import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

public class DocumentUploadSteps {

    private DocumentService documentService;
    private R2StorageService r2StorageService;
    private MockMvc mockMvc;
    private Path uploadDir;
    private MockMultipartFile uploadFile;
    private MvcResult response;
    private String userEmail;
    private String storedPath;

    @Before
    public void setUp() throws Exception {
        documentService = mock(DocumentService.class);
        r2StorageService = mock(R2StorageService.class);
        DocumentController controller = new DocumentController(documentService);
        uploadDir = Files.createTempDirectory("campusnote-bdd-upload");
        ReflectionTestUtils.setField(controller, "uploadDir", uploadDir.toString());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @After
    public void tearDown() throws Exception {
        if (uploadDir != null && Files.exists(uploadDir)) {
            try (var paths = Files.walk(uploadDir)) {
                paths.sorted((a, b) -> b.compareTo(a)).forEach(path -> {
                    try {
                        Files.deleteIfExists(path);
                    } catch (Exception ignored) {
                    }
                });
            }
        }
    }

    @Given("an authenticated student session")
    public void anAuthenticatedStudentSession() {
        userEmail = "student@arel.edu.tr";
    }

    @Given("R2 storage is enabled")
    public void r2StorageIsEnabled() {
        R2Properties r2Properties = new R2Properties();
        ReflectionTestUtils.setField(r2Properties, "enabled", true);
        ReflectionTestUtils.setField(r2Properties, "maxFileSizeMb", 50);
        DocumentController controller = new DocumentController(documentService, r2Properties, r2StorageService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Given("the student selected a valid PDF named {string}")
    public void theStudentSelectedAValidPdfNamed(String fileName) {
        uploadFile = new MockMultipartFile("file", fileName, "application/pdf", "%PDF-1.4 valid notes".getBytes());
        stubSuccessfulUpload();
    }

    @Given("the student selected a non-PDF file named {string}")
    public void theStudentSelectedANonPdfFileNamed(String fileName) {
        uploadFile = new MockMultipartFile("file", fileName, "text/plain", "not a pdf".getBytes());
    }

    @Given("the student selected a spoof PDF named {string}")
    public void theStudentSelectedASpoofPdfNamed(String fileName) {
        uploadFile = new MockMultipartFile("file", fileName, "application/pdf", "not a real pdf".getBytes());
    }

    @When("the student uploads the file for course {string}")
    public void theStudentUploadsTheFileForCourse(String courseCode) throws Exception {
        response = mockMvc.perform(multipart("/api/documents/upload")
                        .file(uploadFile)
                        .param("courseCode", courseCode)
                        .sessionAttr("userEmail", userEmail))
                .andReturn();
    }

    @Then("the upload API accepts the request")
    public void theUploadApiAcceptsTheRequest() {
        assertEquals(200, response.getResponse().getStatus());
    }

    @Then("the PDF is stored under the configured upload directory")
    public void thePdfIsStoredUnderTheConfiguredUploadDirectory() {
        assertNotNull(storedPath);
        Path path = Path.of(storedPath);
        assertTrue(path.startsWith(uploadDir));
        assertTrue(Files.exists(path));
    }

    @Then("document metadata is saved for AI review")
    public void documentMetadataIsSavedForAiReview() {
        verify(documentService).uploadDocument(anyString(), isNull(), anyString(), isNull(), eq(storedPath), anyLong(), eq(userEmail));
    }

    @Then("the upload API rejects the request with {string}")
    public void theUploadApiRejectsTheRequestWith(String expectedError) throws Exception {
        assertEquals(400, response.getResponse().getStatus());
        assertTrue(response.getResponse().getContentAsString().contains(expectedError));
    }

    @Then("no document metadata is saved")
    public void noDocumentMetadataIsSaved() {
        verify(documentService, never()).uploadDocument(any(), any(), any(), any(), any(), anyLong(), any());
        verify(documentService, never()).uploadDocument(any(), any(), any(), any(), any(), anyLong(), any(), any());
    }

    @Then("no file is uploaded to R2")
    public void noFileIsUploadedToR2() {
        verify(r2StorageService, never()).uploadFile(any(), any(), any());
    }

    private void stubSuccessfulUpload() {
        when(documentService.uploadDocument(anyString(), isNull(), anyString(), isNull(), anyString(), anyLong(), eq(userEmail)))
                .thenAnswer(invocation -> {
                    storedPath = invocation.getArgument(4);
                    Document doc = new Document();
                    doc.setId(100L);
                    doc.setTitle(invocation.getArgument(0));
                    doc.setFilePath(storedPath);
                    return doc;
                });
        DocumentDTO dto = new DocumentDTO();
        dto.setId(100L);
        dto.setTitle("Uploaded PDF");
        dto.setStatus("DRAFT");
        when(documentService.convertToDTO(any(Document.class), eq(userEmail))).thenReturn(dto);
    }
}
