package campusnote.backend.LiaisonAI;

import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class LiaisonService {
    private static final Logger logger = LoggerFactory.getLogger(LiaisonService.class);
    
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;

    // Academic keywords for Istanbul Arel University courses
    private static final Map<String, List<String>> KEYWORD_DICTIONARY = Map.of(
        "CS101", Arrays.asList("algorithm", "complexity", "data", "structure", "programming", "variable", "function"),
        "ENG101", Arrays.asList("grammar", "vocabulary", "writing", "essay", "literature", "language"),
        "GEN", Arrays.asList("university", "arel", "campus", "note", "study", "academic")
    );

    public LiaisonService(DocumentRepository documentRepository, DocumentService documentService) {
        this.documentRepository = documentRepository;
        this.documentService = documentService;
    }

    @Async
    public void triggerEvaluation(Long docId) {
        logger.info("Liaison AI: Starting evaluation for Doc ID [{}]", docId);
        
        documentRepository.findById(docId).ifPresent(doc -> {
            try {
                // Update status to UNDER REVIEW (FR-ST-24)
                doc.setStatus("UNDER REVIEW");
                documentRepository.save(doc);

                // Simulate processing time
                Thread.sleep(2000);

                // FR-ST-25: Extract text from PDF
                String extractedText = extractText(doc.getFilePath());
                
                // FR-ST-26 & 27: Calculate quality score
                int score = calculateScore(extractedText, doc.getCourseCode());
                
                // Finalize evaluation (FR-ST-28, 29, 30)
                documentService.finalizeAIRanking(docId, score);
                
                logger.info("Liaison AI: Completed evaluation for Doc ID [{}], Score: {}", docId, score);
            } catch (Exception e) {
                logger.error("Liaison AI: Evaluation failed for Doc ID [{}]", docId, e);
                doc.setStatus("FAILED");
                documentRepository.save(doc);
            }
        });
    }

    private String extractText(String filePath) throws IOException {
        // In a real S3 scenario, we'd download the file. 
        // For the prototype, we check if local file exists or return mock text.
        File file = new File(filePath);
        if (file.exists()) {
            try (PDDocument document = Loader.loadPDF(file)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        }
        // Mock text for demo purposes if file doesn't exist
        return "This algorithm explains data structure and complexity in programming functions. Istanbul Arel University academic notes.";
    }

    private int calculateScore(String text, String courseCode) {
        if (text == null || text.isBlank()) return 0;
        
        String lowerText = text.toLowerCase();
        
        // FR-ST-26: The AI ranking service shall calculate a quality score based on keyword density
        // FR-ST-27: The AI ranking service shall calculate a quality score based on relevance to the specific Department/Course dictionary
        List<String> keywords = KEYWORD_DICTIONARY.getOrDefault(courseCode, KEYWORD_DICTIONARY.get("GEN"));
        
        long matchCount = keywords.stream()
                .filter(lowerText::contains)
                .count();
        
        // Calculate density percentage
        double density = (double) matchCount / keywords.size();
        int score = (int) (density * 100);
        
        // Ensure it's between 0 and 100
        return Math.min(100, Math.max(0, score));
    }
}
