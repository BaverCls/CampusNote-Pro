package campusnote.backend.CoreSecurity;

import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminControllerTest {

    @Test
    void thresholdUpdateRequiresAdminAndWritesAuditLog() {
        AuditLogRepository auditLogRepository = mock(AuditLogRepository.class);
        DocumentService documentService = mock(DocumentService.class);
        AdminController controller = new AdminController(
                mock(UserRepository.class),
                mock(DocumentRepository.class),
                documentService,
                auditLogRepository
        );

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userRole", "ADMIN");
        session.setAttribute("userEmail", "admin@arel.edu.tr");

        ResponseEntity<?> response = controller.updateThreshold(Map.of("threshold", 85), session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(documentService).setGlobalAiThreshold(85);
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void nonAdminCannotUpdateThreshold() {
        AuditLogRepository auditLogRepository = mock(AuditLogRepository.class);
        DocumentService documentService = mock(DocumentService.class);
        AdminController controller = new AdminController(
                mock(UserRepository.class),
                mock(DocumentRepository.class),
                documentService,
                auditLogRepository
        );

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userRole", "STUDENT");
        session.setAttribute("userEmail", "student@arel.edu.tr");

        ResponseEntity<?> response = controller.updateThreshold(Map.of("threshold", 85), session);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(documentService, never()).setGlobalAiThreshold(anyInt());
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void nonAdminCannotListUsers() {
        AdminController controller = new AdminController(
                mock(UserRepository.class),
                mock(DocumentRepository.class),
                mock(DocumentService.class),
                mock(AuditLogRepository.class)
        );

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userRole", "STUDENT");
        session.setAttribute("userEmail", "student@arel.edu.tr");

        ResponseEntity<?> response = controller.listUsers(session);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}
