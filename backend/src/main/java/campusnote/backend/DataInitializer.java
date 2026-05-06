package campusnote.backend;

import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail("admin1234@campusnote.com").isEmpty()) {
                User admin = new User();
                admin.setEmail("admin1234@campusnote.com");
                admin.setFullName("System Admin");
                admin.setPassword(passwordEncoder.encode("Teatime1029"));
                admin.setRole(User.Role.ADMIN);
                admin.setCoinBalance(999999);
                admin.setUniversity("CampusNote HQ");
                admin.setIsActive(true);
                userRepository.save(admin);
                System.out.println("Admin user created: admin1234@campusnote.com / Teatime1029");
            }
        };
    }
}
