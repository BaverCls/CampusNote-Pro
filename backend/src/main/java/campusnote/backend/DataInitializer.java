package campusnote.backend;

import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class DataInitializer {
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @org.springframework.beans.factory.annotation.Value("${campusnote.admin.email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${campusnote.admin.password}")
    private String adminPassword;

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (isBlank(adminEmail) || isBlank(adminPassword)) {
                logger.info("Admin bootstrap skipped because admin credentials are not configured.");
                return;
            }

            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setFullName("System Admin");
                admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                admin.setRole(User.Role.ADMIN);
                admin.setCoinBalance(999999);
                admin.setUniversity("CampusNote HQ");
                admin.setIsActive(true);
                userRepository.save(admin);
                logger.info("Admin bootstrap completed.");
            }
        };
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
