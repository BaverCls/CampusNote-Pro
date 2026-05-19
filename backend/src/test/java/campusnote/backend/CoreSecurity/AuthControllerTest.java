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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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
        user.setPassword(passwordEncoder.encode("secret123"));
        user.setIsActive(false);

        LoginRequestDTO request = new LoginRequestDTO();
        request.setEmail("student@arel.edu.tr");
        request.setPassword("secret123");

        when(userRepository.findByEmail("student@arel.edu.tr")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.login(request, new MockHttpSession());

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}
