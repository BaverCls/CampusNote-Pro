package campusnote.backend.CoreSecurity;

import campusnote.backend.CoreDocumentManagement.DepartmentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.FacultyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthControllerTest {

    @Test
    void suspendedUserCannotLogin() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        AuthController controller = new AuthController(
                userRepository,
                mock(FacultyRepository.class),
                mock(DepartmentRepository.class),
                mock(DocumentRepository.class),
                passwordEncoder
        );

        User user = new User();
        user.setEmail("student@arel.edu.tr");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setIsActive(false);

        LoginRequestDTO request = new LoginRequestDTO();
        request.setEmail("student@arel.edu.tr");
        request.setPassword("secret123");

        when(userRepository.findByEmail("student@arel.edu.tr")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.login(request, new MockHttpSession());

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void forgotPasswordGeneratesTokenWhenUserExists() {
        UserRepository userRepository = mock(UserRepository.class);
        AuthController controller = new AuthController(
                userRepository,
                mock(FacultyRepository.class),
                mock(DepartmentRepository.class),
                mock(DocumentRepository.class),
                mock(PasswordEncoder.class)
        );

        User user = new User();
        user.setEmail("student@arel.edu.tr");

        when(userRepository.findByEmail("student@arel.edu.tr")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.forgotPassword(Map.of("email", "student@arel.edu.tr"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(user.getResetToken());
        assertNotNull(user.getResetTokenExpiry());
        assertTrue(user.getResetTokenExpiry().isAfter(LocalDateTime.now()));
        verify(userRepository).save(user);

        Map<?, ?> responseBody = (Map<?, ?>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Password reset link sent to email", responseBody.get("message"));
        assertEquals(user.getResetToken(), responseBody.get("token"));
    }

    @Test
    void forgotPasswordHidesUserExistenceWhenUserDoesNotExist() {
        UserRepository userRepository = mock(UserRepository.class);
        AuthController controller = new AuthController(
                userRepository,
                mock(FacultyRepository.class),
                mock(DepartmentRepository.class),
                mock(DocumentRepository.class),
                mock(PasswordEncoder.class)
        );

        when(userRepository.findByEmail("missing@arel.edu.tr")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.forgotPassword(Map.of("email", "missing@arel.edu.tr"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userRepository, never()).save(any(User.class));

        Map<?, ?> responseBody = (Map<?, ?>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("If an account exists with that email, a reset link has been sent.", responseBody.get("message"));
    }

    @Test
    void resetPasswordSuccessfullyUpdatesPasswordAndClearsToken() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        AuthController controller = new AuthController(
                userRepository,
                mock(FacultyRepository.class),
                mock(DepartmentRepository.class),
                mock(DocumentRepository.class),
                passwordEncoder
        );

        User user = new User();
        user.setEmail("student@arel.edu.tr");
        user.setPasswordHash("oldEncodedPassword");
        user.setResetToken("valid-token");
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));

        when(userRepository.findByResetToken("valid-token")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.resetPassword(Map.of(
                "token", "valid-token",
                "newPassword", "newSecretPassword"
        ));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(passwordEncoder.matches("newSecretPassword", user.getPasswordHash()));
        assertNull(user.getResetToken());
        assertNull(user.getResetTokenExpiry());
        verify(userRepository).save(user);

        Map<?, ?> responseBody = (Map<?, ?>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Password reset successfully", responseBody.get("message"));
    }

    @Test
    void resetPasswordFailsWhenTokenExpired() {
        UserRepository userRepository = mock(UserRepository.class);
        AuthController controller = new AuthController(
                userRepository,
                mock(FacultyRepository.class),
                mock(DepartmentRepository.class),
                mock(DocumentRepository.class),
                mock(PasswordEncoder.class)
        );

        User user = new User();
        user.setEmail("student@arel.edu.tr");
        user.setPasswordHash("oldEncodedPassword");
        user.setResetToken("expired-token");
        user.setResetTokenExpiry(LocalDateTime.now().minusMinutes(1));

        when(userRepository.findByResetToken("expired-token")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.resetPassword(Map.of(
                "token", "expired-token",
                "newPassword", "newSecretPassword"
        ));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(userRepository, never()).save(any(User.class));

        Map<?, ?> responseBody = (Map<?, ?>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Token expired", responseBody.get("error"));
    }

    @Test
    void resetPasswordFailsWhenTokenInvalid() {
        UserRepository userRepository = mock(UserRepository.class);
        AuthController controller = new AuthController(
                userRepository,
                mock(FacultyRepository.class),
                mock(DepartmentRepository.class),
                mock(DocumentRepository.class),
                mock(PasswordEncoder.class)
        );

        when(userRepository.findByResetToken("invalid-token")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.resetPassword(Map.of(
                "token", "invalid-token",
                "newPassword", "newSecretPassword"
        ));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(userRepository, never()).save(any(User.class));

        Map<?, ?> responseBody = (Map<?, ?>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Invalid token", responseBody.get("error"));
    }

    @Test
    void resetPasswordFailsWhenNewPasswordIsTooShort() {
        UserRepository userRepository = mock(UserRepository.class);
        AuthController controller = new AuthController(
                userRepository,
                mock(FacultyRepository.class),
                mock(DepartmentRepository.class),
                mock(DocumentRepository.class),
                mock(PasswordEncoder.class)
        );

        ResponseEntity<?> response = controller.resetPassword(Map.of(
                "token", "valid-token",
                "newPassword", "123"
        ));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(userRepository, never()).save(any(User.class));

        Map<?, ?> responseBody = (Map<?, ?>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Password must be at least 6 characters", responseBody.get("error"));
    }
}
