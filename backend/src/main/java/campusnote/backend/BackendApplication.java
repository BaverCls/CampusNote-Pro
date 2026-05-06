package campusnote.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@EnableAsync
@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				String frontendUrl = System.getenv("FRONTEND_URL");
				List<String> origins = new java.util.ArrayList<>(List.of(
					"http://localhost:8000", 
					"http://localhost:5173", 
					"http://localhost:3000"
				));
				
				if (frontendUrl != null && !frontendUrl.isEmpty()) {
					origins.add(frontendUrl);
					// Ayrıca URL'nin sonu slaşlı/slaşsız her iki halini de ekleyelim
					if (frontendUrl.endsWith("/")) {
						origins.add(frontendUrl.substring(0, frontendUrl.length() - 1));
					} else {
						origins.add(frontendUrl + "/");
					}
				}

				registry.addMapping("/**")
						.allowedOrigins(origins.toArray(new String[0]))
						.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
						.allowedHeaders("*")
						.allowCredentials(true);
			}
		};
	}
}
