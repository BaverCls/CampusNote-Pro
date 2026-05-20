package campusnote.backend.CoreNotification;

import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void createForUser(User user, Long documentId, String type, String title, String message) {
        if (user == null || user.getId() == null) return;

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setDocumentId(documentId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getLatestForUser(String email) {
        return notificationRepository.findTop20ByUserEmailOrderByCreatedAtDesc(email);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        return notificationRepository.countByUserEmailAndReadStatusFalse(email);
    }

    @Transactional
    public Optional<Notification> markAsRead(Long id, String email) {
        return notificationRepository.findByIdAndUserEmail(id, email).map(notification -> {
            notification.setReadStatus(true);
            return notificationRepository.save(notification);
        });
    }

    @Transactional
    public int markAllAsRead(String email) {
        List<Notification> unread = notificationRepository.findByUserEmailAndReadStatusFalse(email);
        unread.forEach(notification -> notification.setReadStatus(true));
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    @Transactional(readOnly = true)
    public boolean userExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }
}
