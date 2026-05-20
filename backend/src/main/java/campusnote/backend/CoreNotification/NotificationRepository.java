package campusnote.backend.CoreNotification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop20ByUserEmailOrderByCreatedAtDesc(String email);
    long countByUserEmailAndReadStatusFalse(String email);
    Optional<Notification> findByIdAndUserEmail(Long id, String email);
    List<Notification> findByUserEmailAndReadStatusFalse(String email);
}
