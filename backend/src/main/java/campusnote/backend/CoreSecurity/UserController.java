package campusnote.backend.CoreSecurity;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:8000")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream()
            .map(u -> new UserDTO(u.getId(), u.getEmail(), u.getFullName(), u.getCoinBalance(), u.getRole().name()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getProfile(HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        if (email == null) {
            return ResponseEntity.status(401).build();
        }

        return userRepository.findByEmail(email)
            .map(u -> ResponseEntity.ok(new UserDTO(u.getId(), u.getEmail(), u.getFullName(), u.getCoinBalance(), u.getRole().name())))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserDTO>> getLeaderboard() {
        try {
            List<UserDTO> leaderboard = userRepository.findAll().stream()
                .sorted((u1, u2) -> Integer.compare(u2.getCoinBalance(), u1.getCoinBalance()))
                .limit(10)
                .map(u -> {
                    String name = (u.getFullName() == null || u.getFullName().isEmpty()) ? "Anonymous" : u.getFullName();
                    return new UserDTO(u.getId(), u.getEmail(), name, u.getCoinBalance(), u.getRole().name());
                })
                .collect(Collectors.toList());
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
