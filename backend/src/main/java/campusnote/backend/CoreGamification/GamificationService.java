package campusnote.backend.CoreGamification;

import campusnote.backend.CoreSecurity.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.TreeMap;

@Service
public class GamificationService {

    private final UserRepository userRepository;

    // FR-ST-35: Virtual rank thresholds
    private static final TreeMap<Integer, String> RANK_THRESHOLDS = new TreeMap<>(Map.of(
        0, "ROOKIE",
        500, "SCHOLAR",
        1500, "SAGE",
        3000, "LEGEND"
    ));

    public GamificationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void updateRank(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            int balance = user.getCoinBalance() != null ? user.getCoinBalance() : 0;
            
            // Find the highest rank threshold met
            String newRank = RANK_THRESHOLDS.floorEntry(balance).getValue();
            
            // FR-ST-36: Upgrade rank if threshold met
            if (!newRank.equals(user.getRank())) {
                user.setRank(newRank);
                userRepository.save(user);
            }
        });
    }

    // FR-ST-33: Award coins based on AKTS (Logic: AKTS * 10)
    @Transactional
    public void awardCoins(Long userId, int amount) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setCoinBalance((user.getCoinBalance() != null ? user.getCoinBalance() : 0) + amount);
            userRepository.save(user);
            updateRank(userId);
        });
    }
}
