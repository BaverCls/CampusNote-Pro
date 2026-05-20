package campusnote.backend.CoreNotification;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> listNotifications(HttpSession session) {
        String email = getCurrentUserEmail(session);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!notificationService.userExists(email)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<NotificationDTO> notifications = notificationService.getLatestForUser(email)
                .stream()
                .map(NotificationDTO::from)
                .toList();

        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(HttpSession session) {
        String email = getCurrentUserEmail(session);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        if (!notificationService.userExists(email)) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(email)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, HttpSession session) {
        String email = getCurrentUserEmail(session);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        return notificationService.markAsRead(id, email)
                .map(notification -> ResponseEntity.ok(NotificationDTO.from(notification)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(HttpSession session) {
        String email = getCurrentUserEmail(session);
        if (email == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        int updated = notificationService.markAllAsRead(email);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    private String getCurrentUserEmail(HttpSession session) {
        return (String) session.getAttribute("userEmail");
    }

    public record NotificationDTO(
            Long id,
            Long documentId,
            String type,
            String title,
            String message,
            boolean readStatus,
            String createdAt
    ) {
        static NotificationDTO from(Notification notification) {
            return new NotificationDTO(
                    notification.getId(),
                    notification.getDocumentId(),
                    notification.getType(),
                    notification.getTitle(),
                    notification.getMessage(),
                    notification.isReadStatus(),
                    notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : null
            );
        }
    }
}
