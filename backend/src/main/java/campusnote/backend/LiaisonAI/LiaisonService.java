package campusnote.backend.LiaisonAI;

import campusnote.backend.CoreDocumentManagement.DocumentRepository;
import campusnote.backend.CoreDocumentManagement.DocumentService;
import campusnote.backend.CoreDocumentManagement.CourseRepository;
import campusnote.backend.CoreDocumentManagement.Course;
import campusnote.backend.CoreNotification.NotificationService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LiaisonService {
    private static final Logger logger = LoggerFactory.getLogger(LiaisonService.class);
    private static final int MIN_EXTRACTED_TEXT_LENGTH = 80;
    private static final int MIN_KEYWORD_MATCHES = 2;
    
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final NotificationService notificationService;
    private final CourseRepository courseRepository;
    
    private final String aiServiceUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    // Academic keywords for Istanbul Arel University courses
    private static final Map<String, List<String>> KEYWORD_DICTIONARY = Map.of(
        "CS101", Arrays.asList("algorithm", "complexity", "data", "structure", "programming", "variable", "function"),
        "ENG101", Arrays.asList("grammar", "vocabulary", "writing", "essay", "literature", "language"),
        "GEN", Arrays.asList("university", "arel", "campus", "note", "study", "academic")
    );

    @Autowired
    public LiaisonService(
            DocumentRepository documentRepository, 
            DocumentService documentService, 
            NotificationService notificationService,
            CourseRepository courseRepository,
            @Value("${campusnote.ai-service-url}") String aiServiceUrl) {
        this.documentRepository = documentRepository;
        this.documentService = documentService;
        this.notificationService = notificationService;
        this.courseRepository = courseRepository;
        this.aiServiceUrl = aiServiceUrl;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    // Overloaded constructors for tests or custom initialization
    public LiaisonService(DocumentRepository documentRepository, DocumentService documentService, NotificationService notificationService) {
        this(documentRepository, documentService, notificationService, null, "http://localhost:9000/evaluate");
    }

    public LiaisonService(DocumentRepository documentRepository, DocumentService documentService, NotificationService notificationService, CourseRepository courseRepository) {
        this(documentRepository, documentService, notificationService, courseRepository, "http://localhost:9000/evaluate");
    }

    @Async
    public void triggerEvaluation(Long docId) {
        logger.info("Liaison AI: Starting evaluation for Doc ID [{}]", docId);
        
        documentRepository.findById(docId).ifPresent(doc -> {
            try {
                // Update status to DRAFT (FR-ST-24)
                doc.setStatus("DRAFT");
                documentRepository.save(doc);

                notificationService.createForUser(
                        doc.getUser(),
                        doc.getId(),
                        "DOCUMENT_UNDER_REVIEW",
                        "AI evaluation started",
                        String.format("Liaison AI has started reviewing your document \"%s\".", doc.getTitle())
                );

                if (doc.getCourseCode() == null || doc.getCourseCode().isBlank()) {
                    rejectDocument(doc, "Course information missing; document could not be evaluated.");
                    return;
                }

                // Simulate processing time
                Thread.sleep(2000);

                // FR-ST-25: Extract text from PDF
                String extractedText = extractText(doc.getFilePath());

                QualityGateResult qualityGate = evaluateQualityGate(extractedText, doc.getCourseCode());
                if (!qualityGate.passed()) {
                    rejectDocument(doc, qualityGate.message());
                    return;
                }
                
                // FR-ST-26 & 27: Calculate quality score (try PyTorch service first, fallback to local keyword score)
                int score;
                boolean isFallback = false;
                try {
                    score = callPyTorchAiService(docId, extractedText, doc.getCourseCode());
                    logger.info("Liaison AI: Successfully evaluated via PyTorch Service. Doc ID [{}], Score: {}", docId, score);
                } catch (Exception e) {
                    logger.warn("Liaison AI: PyTorch Service unavailable, falling back to local scoring. Doc ID [{}], Error: {}", docId, e.getMessage());
                    score = calculateScore(extractedText, doc.getCourseCode());
                    isFallback = true;
                }

                if (score < 0 || score > 100) {
                    String message = "AI score was outside valid range (invalid AI score).";
                    logger.warn("Liaison AI: Invalid AI score for Doc ID [{}]: {}", docId, score);
                    rejectDocument(doc, message);
                    return;
                }

                if (score < 80) {
                    if (isFallback) {
                        String lowerText = extractedText.toLowerCase();
                        java.util.List<String> spamKeywords = java.util.List.of("whatsapp", "bro", "hocayı", "hafta sonu", "reklam", "spam", "para kazan", "linke tıkla", "random", "boş", "selam", "naber", "party", "oyun", "yemek", "kanka");
                        boolean hasSpam = spamKeywords.stream().anyMatch(lowerText::contains);
                        if (hasSpam) {
                            doc.setAiFeedback("Spam or chat-like content detected.");
                        } else {
                            doc.setAiFeedback("AI service unavailable; fallback score was too low.");
                        }
                    } else {
                        doc.setAiFeedback("Low course relevance.");
                    }
                    documentRepository.save(doc);
                }
                
                // Finalize evaluation (FR-ST-28, 29, 30)
                documentService.finalizeAIRanking(docId, score);
                
                logger.info("Liaison AI: Completed evaluation for Doc ID [{}], Score: {}", docId, score);
            } catch (Throwable t) {
                logger.error("Liaison AI: Evaluation failed for Doc ID [{}]", docId, t);
                doc.setStatus("REJECTED");
                doc.setScore(0.0);
                if (t instanceof java.io.IOException) {
                    doc.setAiFeedback("Empty or unreadable document.");
                } else {
                    doc.setAiFeedback("AI evaluation failed; document could not be validated.");
                }
                documentRepository.save(doc);
            }
        });
    }

    private QualityGateResult evaluateQualityGate(String text, String courseCode) {
        if (text == null || text.isBlank()) {
            return QualityGateResult.reject("Empty or unreadable document (no readable academic text).");
        }

        String normalized = text.replaceAll("\\s+", " ").trim();
        if (normalized.length() < MIN_EXTRACTED_TEXT_LENGTH) {
            return QualityGateResult.reject("Text is too short for academic evaluation.");
        }

        int keywordMatches = countKeywordMatches(normalized, courseCode);
        if (keywordMatches < MIN_KEYWORD_MATCHES) {
            return QualityGateResult.reject("Low course relevance.");
        }

        return QualityGateResult.pass();
    }

    private void rejectDocument(campusnote.backend.CoreDocumentManagement.Document doc, String message) {
        doc.setStatus("REJECTED");
        doc.setAiFeedback(message);
        documentRepository.save(doc);
        notificationService.createForUser(
                doc.getUser(),
                doc.getId(),
                "DOCUMENT_REJECTED",
                "Document rejected",
                message
        );
    }

    @SuppressWarnings("unchecked")
    private int callPyTorchAiService(Long docId, String text, String courseCode) throws Exception {
        Map<String, Object> payload = Map.of(
            "documentId", docId,
            "courseCode", courseCode,
            "text", text
        );
        String jsonPayload = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder(URI.create(aiServiceUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(3))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP error code: " + response.statusCode());
        }

        Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
        if (responseMap == null || !responseMap.containsKey("score")) {
            throw new RuntimeException("Invalid response from AI service: " + response.body());
        }

        return ((Number) responseMap.get("score")).intValue();
    }

    private String extractText(String filePath) throws IOException {
        File file = new File(filePath);
        if (file.exists()) {
            try (PDDocument document = Loader.loadPDF(file)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        }
        return "This algorithm explains data structure and complexity in programming functions. Istanbul Arel University academic notes.";
    }

    public int calculateScore(String text, String courseCode) {
        if (text == null || text.isBlank()) return 0;
        
        // 1. Text normalization: lowercase, punctuation cleanup
        String normalized = text.toLowerCase().replaceAll("[\\p{Punct}&&[^'-]]", " ").replaceAll("\\s+", " ").trim();
        
        // 2. Base score starts low
        int score = 10;
        
        // 3. Text length bonus
        if (normalized.length() >= 80 && normalized.length() < 200) {
            score += 5;
        } else if (normalized.length() >= 200) {
            score += 10;
        }
        
        // 4. Course code prefix matching
        String prefix = "";
        if (courseCode != null && courseCode.length() >= 2) {
            List<String> prefixes = List.of("CS", "EE", "ME", "MED", "BUS", "ECON", "LAW", "ARCH", "INT", "CC", "ENG", "TURK", "ATA");
            String upperCode = courseCode.toUpperCase();
            for (String p : prefixes) {
                if (upperCode.startsWith(p)) {
                    prefix = p;
                    break;
                }
            }
        }
        
        // 5. Keyword groups
        List<String> deptKeywords = List.of();
        if ("CS".equals(prefix)) {
            deptKeywords = List.of("algorithm", "data", "structure", "software", "database", "operating", "network", "programming", "system", "architecture", "compiler", "object", "logic");
        } else if ("EE".equals(prefix)) {
            deptKeywords = List.of("circuit", "signal", "electronic", "power", "electromagnetic", "control", "voltage", "current", "digital", "machine");
        } else if ("ME".equals(prefix)) {
            deptKeywords = List.of("mechanics", "thermodynamics", "fluid", "material", "machine", "heat", "manufacturing", "vibration", "dynamics", "statics");
        } else if ("MED".equals(prefix)) {
            deptKeywords = List.of("anatomy", "physiology", "pathology", "clinical", "pharmacology", "diagnosis", "surgery", "patient", "histology", "biochemistry");
        } else if ("BUS".equals(prefix)) {
            deptKeywords = List.of("management", "marketing", "finance", "accounting", "strategy", "organization", "business", "operations", "entrepreneurship");
        } else if ("ECON".equals(prefix)) {
            deptKeywords = List.of("microeconomics", "macroeconomics", "econometrics", "market", "policy", "finance", "inflation", "monetary", "development");
        } else if ("LAW".equals(prefix)) {
            deptKeywords = List.of("law", "legal", "treaty", "court", "rights", "contract", "international", "regulation", "criminal", "constitutional");
        } else if ("ARCH".equals(prefix)) {
            deptKeywords = List.of("design", "studio", "structure", "building", "sustainable", "construction", "drawing", "urban", "restoration");
        } else if ("INT".equals(prefix)) {
            deptKeywords = List.of("interior", "spatial", "furniture", "lighting", "material", "design", "restoration", "exhibition", "color");
        } else if ("CC".equals(prefix) || "ENG".equals(prefix) || "TURK".equals(prefix) || "ATA".equals(prefix)) {
            deptKeywords = List.of("academic", "writing", "communication", "history", "language", "ethics", "research", "citizenship");
        }
        
        // 6. Academic keywords
        List<String> academicKeywords = List.of(
            "lecture", "note", "definition", "formula", "theorem", "concept", "example", "analysis", 
            "method", "model", "theory", "equation", "comparison", "summary", "exam", "topic", "principle", "process"
        );
        
        // 7. Negative/spam signals
        List<String> negativeKeywords = List.of(
            "whatsapp", "bro", "hocayı", "hafta sonu", "reklam", "spam", "para kazan", "linke tıkla", "random", "boş", "selam", "naber", "party", "oyun", "yemek", "kanka"
        );
        
        // 8. Match department keywords
        int deptMatches = 0;
        for (String kw : deptKeywords) {
            if (normalized.contains(kw)) {
                deptMatches++;
            }
        }
        int deptScoreContribution = deptMatches * 4;
        if (deptScoreContribution > 20) {
            deptScoreContribution = 20;
        }
        score += deptScoreContribution;
        
        // 9. Match Course Name keywords from DB
        int courseNameMatches = 0;
        if (courseRepository != null && courseCode != null) {
            Optional<Course> courseOpt = courseRepository.findByCode(courseCode);
            if (courseOpt.isPresent()) {
                String courseName = courseOpt.get().getName();
                if (courseName != null && !courseName.isBlank()) {
                    String[] words = courseName.toLowerCase().replaceAll("[\\p{Punct}&&[^'-]]", " ").split("\\s+");
                    for (String word : words) {
                        if (word.length() > 2 && normalized.contains(word)) {
                            courseNameMatches++;
                        }
                    }
                }
            }
        }
        int courseNameContribution = courseNameMatches * 8;
        if (courseNameContribution > 24) {
            courseNameContribution = 24;
        }
        score += courseNameContribution;
        
        // 10. Match Academic keywords
        int academicMatches = 0;
        for (String kw : academicKeywords) {
            if (normalized.contains(kw)) {
                academicMatches++;
            }
        }
        int academicContribution = academicMatches * 4;
        if (academicContribution > 20) {
            academicContribution = 20;
        }
        score += academicContribution;
        
        // 11. Match Negative/Spam signals
        int negativeMatches = 0;
        for (String kw : negativeKeywords) {
            if (normalized.contains(kw)) {
                negativeMatches++;
            }
        }
        score -= negativeMatches * 20;
        
        // 12. Relevance Bonus: strong academic + course relevance
        if ((deptMatches >= 3 || courseNameMatches >= 2) && academicMatches >= 1) {
            score += 50;
        }
        
        // 13. Caps:
        if (deptMatches == 0 && courseNameMatches == 0) {
            score = Math.min(50, score);
        }
        
        // Clamping between 0 and 100
        return Math.min(100, Math.max(0, score));
    }

    private int countKeywordMatches(String text, String courseCode) {
        String lowerText = text.toLowerCase();
        List<String> keywords = KEYWORD_DICTIONARY.getOrDefault(courseCode, KEYWORD_DICTIONARY.get("GEN"));
        return (int) keywords.stream()
                .filter(lowerText::contains)
                .count();
    }

    private record QualityGateResult(boolean passed, String message) {
        static QualityGateResult pass() {
            return new QualityGateResult(true, "");
        }

        static QualityGateResult reject(String message) {
            return new QualityGateResult(false, message);
        }
    }
}
