package campusnote.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

// NOT: CORS yapılandırması SecurityConfig.java üzerinden yönetilmektedir.
// Bu sınıfta WebMvcConfigurer CORS tanımı KASITLI OLARAK kaldırılmıştır.
// İki ayrı CORS tanımı (MVC + Security filter) çakışmaya ve production'da
// çözülemeyen CORS hatalarına yol açıyordu.

@EnableAsync
@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}
}
