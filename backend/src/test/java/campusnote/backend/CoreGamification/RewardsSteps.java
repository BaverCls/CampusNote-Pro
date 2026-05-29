package campusnote.backend.CoreGamification;

import campusnote.backend.CoreDocumentManagement.Course;
import campusnote.backend.CoreDocumentManagement.CourseRepository;
import campusnote.backend.CoreDocumentManagement.Document;
import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import campusnote.backend.CoreNotification.NotificationService;
import campusnote.backend.CoreSecurity.User;
import campusnote.backend.CoreSecurity.UserRepository;
import campusnote.backend.LiaisonAI.LiaisonService;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class RewardsSteps {

    private User user;
    private Course course;
    private Document document;
    private DocumentRepository documentRepository;
    private DocumentService documentService;

    @Given("a user with {int} coins")
    public void aUserWithCoins(int coins) {
        user = new User();
        user.setId(1L);
        user.setCoinBalance(coins);
    }

    @Given("a document with {int} AKTS")
    public void aDocumentWithAkts(int akts) {
        course = new Course();
        course.setEcts(akts);

        document = new Document();
        document.setId(20L);
        document.setUser(user);
        document.setCourse(course);
        document.setStatus("UNDER_REVIEW");
    }

    @When("the document is successfully published")
    public void theDocumentIsSuccessfullyPublished() {
        documentRepository = mock(DocumentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        CourseRepository courseRepository = mock(CourseRepository.class);
        LiaisonService liaisonService = mock(LiaisonService.class);
        GamificationService gamificationService = mock(GamificationService.class);
        NotificationService notificationService = mock(NotificationService.class);

        when(documentRepository.findById(20L)).thenReturn(Optional.of(document));
        documentService = new DocumentService(
                documentRepository,
                userRepository,
                courseRepository,
                liaisonService,
                gamificationService,
                notificationService
        );

        documentService.finalizeAIRanking(20L, 100);
    }

    @Then("the user should have {int} coins \\({int} + {int}*{int})")
    public void theUserShouldHaveCoins(int expectedCoins, int startingCoins, int akts, int multiplier) {
        assertEquals(startingCoins + akts * multiplier, expectedCoins);
        assertEquals(expectedCoins, user.getCoinBalance());
    }
}
