package campusnote.backend.CoreDocumentManagement;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalMatchers.aryEq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DocumentControllerTest {

    private DocumentService documentService;
    private MockMvc mockMvc;
    private Path uploadDir;

    @BeforeEach
    void setUp() throws Exception {
        documentService = mock(DocumentService.class);
        DocumentController controller = new DocumentController(documentService);
        uploadDir = Files.createTempDirectory("campusnote-upload-test");
        ReflectionTestUtils.setField(controller, "uploadDir", uploadDir.toString());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void uploadStoresPdfUnderConfiguredDirectory() throws Exception {
        DocumentDTO dto = new DocumentDTO();
        dto.setTitle("Algorithms");
        dto.setStatus("DRAFT");

        when(documentService.uploadDocument(eq("Algorithms"), eq("Lecture notes"), eq("CS101"), eq("Engineering"), any(), eq(19L), eq("student@arel.edu.tr")))
                .thenAnswer(invocation -> {
                    String storedPath = invocation.getArgument(4);
                    assertTrue(Path.of(storedPath).startsWith(uploadDir));
                    assertTrue(Files.exists(Path.of(storedPath)));

                    Document doc = new Document();
                    doc.setId(42L);
                    doc.setTitle("Algorithms");
                    doc.setFilePath(storedPath);
                    return doc;
                });
        when(documentService.convertToDTO(any(Document.class), eq("student@arel.edu.tr"))).thenReturn(dto);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "algorithms notes.pdf",
                "application/pdf",
                "%PDF-1.4 test bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("courseCode", "CS101")
                        .param("faculty", "Engineering")
                        .param("title", "Algorithms")
                        .param("content", "Lecture notes")
                        .sessionAttr("userEmail", "student@arel.edu.tr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Algorithms"));

        verify(documentService).uploadDocument(eq("Algorithms"), eq("Lecture notes"), eq("CS101"), eq("Engineering"), any(), eq(19L), eq("student@arel.edu.tr"));
    }

    @Test
    void uploadStoresPdfInR2WhenR2StorageIsEnabled() throws Exception {
        R2Properties r2Properties = new R2Properties();
        ReflectionTestUtils.setField(r2Properties, "enabled", true);
        ReflectionTestUtils.setField(r2Properties, "maxFileSizeMb", 50);
        R2StorageService r2StorageService = mock(R2StorageService.class);
        DocumentController controller = new DocumentController(documentService, r2Properties, r2StorageService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        DocumentDTO dto = new DocumentDTO();
        dto.setTitle("Algorithms");
        dto.setStatus("DRAFT");

        when(documentService.uploadDocument(
                eq("Algorithms"),
                eq("Lecture notes"),
                eq("CS101"),
                eq("Engineering"),
                any(),
                eq(19L),
                eq("student@arel.edu.tr"),
                eq("R2")
        )).thenAnswer(invocation -> {
            Document doc = new Document();
            doc.setId(42L);
            doc.setTitle("Algorithms");
            doc.setFilePath(invocation.getArgument(4));
            doc.setStorageProvider("R2");
            return doc;
        });
        when(documentService.convertToDTO(any(Document.class), eq("student@arel.edu.tr"))).thenReturn(dto);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "algorithms notes.pdf",
                "application/pdf",
                "%PDF-1.4 test bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("courseCode", "CS101")
                        .param("faculty", "Engineering")
                        .param("title", "Algorithms")
                        .param("content", "Lecture notes")
                        .sessionAttr("userEmail", "student@arel.edu.tr")
                        .sessionAttr("userId", 7L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Algorithms"));

        verify(r2StorageService).uploadFile(
                startsWith("documents/7/"),
                aryEq("%PDF-1.4 test bytes".getBytes()),
                eq("application/pdf")
        );
        verify(documentService).uploadDocument(
                eq("Algorithms"),
                eq("Lecture notes"),
                eq("CS101"),
                eq("Engineering"),
                startsWith("documents/7/"),
                eq(19L),
                eq("student@arel.edu.tr"),
                eq("R2")
        );
    }

    @Test
    void uploadRejectsNonPdfBeforeR2Storage() throws Exception {
        R2Properties r2Properties = new R2Properties();
        ReflectionTestUtils.setField(r2Properties, "enabled", true);
        ReflectionTestUtils.setField(r2Properties, "maxFileSizeMb", 50);
        R2StorageService r2StorageService = mock(R2StorageService.class);
        DocumentController controller = new DocumentController(documentService, r2Properties, r2StorageService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "notes.txt",
                "text/plain",
                "plain text".getBytes()
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("courseCode", "CS101")
                        .sessionAttr("userEmail", "student@arel.edu.tr")
                        .sessionAttr("userId", 7L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only PDF files are allowed"));

        verify(r2StorageService, never()).uploadFile(any(), any(), any());
        verify(documentService, never()).uploadDocument(any(), any(), any(), any(), any(), anyLong(), any());
        verify(documentService, never()).uploadDocument(any(), any(), any(), any(), any(), anyLong(), any(), any());
    }

    @Test
    void uploadRejectsSpoofPdfBeforeR2Storage() throws Exception {
        R2Properties r2Properties = new R2Properties();
        ReflectionTestUtils.setField(r2Properties, "enabled", true);
        ReflectionTestUtils.setField(r2Properties, "maxFileSizeMb", 50);
        R2StorageService r2StorageService = mock(R2StorageService.class);
        DocumentController controller = new DocumentController(documentService, r2Properties, r2StorageService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fake-notes.pdf",
                "application/pdf",
                "this is plain text pretending to be a PDF".getBytes()
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("courseCode", "CS101")
                        .sessionAttr("userEmail", "student@arel.edu.tr")
                        .sessionAttr("userId", 7L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(anyOf(
                        containsString("Invalid PDF file"),
                        containsString("valid PDF")
                )));

        verify(r2StorageService, never()).uploadFile(any(), any(), any());
        verify(documentService, never()).uploadDocument(any(), any(), any(), any(), any(), anyLong(), any());
        verify(documentService, never()).uploadDocument(any(), any(), any(), any(), any(), anyLong(), any(), any());
    }

    @Test
    void uploadRejectsNonPdfFilesBeforeStorage() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "notes.txt",
                "text/plain",
                "plain text".getBytes()
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("courseCode", "CS101")
                        .sessionAttr("userEmail", "student@arel.edu.tr"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only PDF files are allowed"));

        verify(documentService, never()).uploadDocument(any(), any(), any(), any(), any(), anyLong(), any());
    }
}
