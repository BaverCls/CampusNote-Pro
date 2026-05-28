package campusnote.backend;

import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @org.springframework.beans.factory.annotation.Value("${campusnote.admin.email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${campusnote.admin.password}")
    private String adminPassword;

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
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
                System.out.println("Admin user created with email: " + adminEmail);
            }
        };
    }
}
