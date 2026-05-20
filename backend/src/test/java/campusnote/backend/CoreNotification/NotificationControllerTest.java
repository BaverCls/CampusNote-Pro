package campusnote.backend.CoreNotification;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class NotificationControllerTest {

    @Test
    void unauthenticatedNotificationListReturns401() {
        NotificationService notificationService = mock(NotificationService.class);
        NotificationController controller = new NotificationController(notificationService);

        ResponseEntity<?> response = controller.listNotifications(new MockHttpSession());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void unauthenticatedUnreadCountReturns401() {
        NotificationService notificationService = mock(NotificationService.class);
        NotificationController controller = new NotificationController(notificationService);

        ResponseEntity<?> response = controller.unreadCount(new MockHttpSession());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void otherUserCannotMarkNotificationRead() {
        NotificationService notificationService = mock(NotificationService.class);
        NotificationController controller = new NotificationController(notificationService);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userEmail", "attacker@arel.edu.tr");

        when(notificationService.markAsRead(10L, "attacker@arel.edu.tr")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.markAsRead(10L, session);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
