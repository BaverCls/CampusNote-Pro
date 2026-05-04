package campusnote.backend.CoreSecurity;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpSession;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:8000")
@Validated
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody UserRegistrationDTO registrationDTO) {
        // Validation automatically handles the @arel.edu.tr check due to @Valid and the DTO annotations
        
        // Check if user exists
        if (userRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered.");
        }

        User newUser = new User();
        newUser.setEmail(registrationDTO.getEmail());
        newUser.setFullName(registrationDTO.getFullName());
        
        // Encode password using BCrypt
        newUser.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
        
        // Give new users 0 initial coins
        newUser.setCoinBalance(0);
        newUser.setRole(User.Role.STUDENT);

        userRepository.save(newUser);

        return ResponseEntity.ok("User registered successfully. Welcome to CampusNote!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request, HttpSession session) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        return ResponseEntity.status(401).body("Invalid email or password.");
                    }

                    session.setAttribute("userId", user.getId());
                    session.setAttribute("userEmail", user.getEmail());
                    session.setAttribute("userRole", user.getRole().name());

                    return ResponseEntity.ok(new UserDTO(
                            user.getId(),
                            user.getEmail(),
                            user.getFullName(),
                            user.getCoinBalance(),
                            user.getRole().name()
                    ));
                })
                .orElse(ResponseEntity.status(401).body("Invalid email or password."));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }
}
