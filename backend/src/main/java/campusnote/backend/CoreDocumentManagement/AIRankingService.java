package campusnote.backend.CoreDocumentManagement;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class AIRankingService {

    private final Random random = new Random();

    /**
     * Simulates AI-based document quality evaluation (FR-ST-15).
     * In a real scenario, this would scan the PDF for keywords.
     */
    public int evaluateDocument(Document document) {
        // Random score between 40 and 100 for simulation
        return 40 + random.nextInt(61);
    }
}
