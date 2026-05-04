package campusnote.backend.CoreGamification;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GamificationService {

    @Transactional
    public void awardCoins(Long userId) {
        // Increases coinBalance by exactly 10 units.
        // UserRepository.findById(userId)...
        // user.setCoinBalance(user.getCoinBalance() + 10);
    }

    @Transactional
    public void notifyUser(Long userId, String message) {
        // Creates a persistent record in the Notification table.
        // Notification notification = new Notification(userId, message);
        // notificationRepository.save(notification);
    }
}
