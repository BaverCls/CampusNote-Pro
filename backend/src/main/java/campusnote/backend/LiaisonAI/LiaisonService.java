package campusnote.backend.LiaisonAI;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class LiaisonService {
    private static final Logger logger = LoggerFactory.getLogger(LiaisonService.class);

    @Async
    public void triggerEvaluation(Long docId) {
        logger.info("Liaison Communication Association: Triggering AI Evaluation for Doc ID [{}]", docId);
        // Simulate external AI processing
    }
}
