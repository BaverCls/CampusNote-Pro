package campusnote.backend.CoreDocumentManagement;

import jakarta.servlet.http.HttpSession;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final R2Properties r2Properties;
    private final R2StorageService r2StorageService;

    @Value("${campusnote.upload-dir:uploads}")
    private String uploadDir;

    // Backward compatible constructor for tests
    public DocumentController(DocumentService documentService) {
        this(documentService, new R2Properties(), null);
    }

    // Full constructor for runtime injection
    @org.springframework.beans.factory.annotation.Autowired
    public DocumentController(DocumentService documentService, 
                              @org.springframework.context.annotation.Lazy R2Properties r2Properties, 
                              @org.springframework.context.annotation.Lazy R2StorageService r2StorageService) {
        this.documentService = documentService;
        this.r2Properties = r2Properties;
        this.r2StorageService = r2StorageService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam String courseCode,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String content,
            HttpSession session) {
        try {
            String userEmail = (String) session.getAttribute("userEmail");
            if (userEmail == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
            if (file.isEmpty() || !originalName.toLowerCase().endsWith(".pdf") || !"application/pdf".equalsIgnoreCase(file.getContentType())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are allowed"));
            }

            byte[] signature = new byte[5];
            int bytesRead;
            try (var inputStream = file.getInputStream()) {
                bytesRead = inputStream.read(signature);
            }
            if (bytesRead < signature.length || !"%PDF-".equals(new String(signature, java.nio.charset.StandardCharsets.US_ASCII))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid PDF file. Please upload a valid PDF."));
            }

            int maxMb = r2Properties.getMaxFileSizeMb();
            long maxBytes = (long) maxMb * 1024 * 1024;
            if (file.getSize() > maxBytes) {
                return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds " + maxMb + "MB limit"));
            }

            if (courseCode == null || courseCode.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Course code is required"));
            }

            Document savedDoc;
            boolean isR2 = r2Properties.isEnabled();

            if (isR2) {
                Long userId = (Long) session.getAttribute("userId");
                if (userId == null) {
                    userId = 0L; // Fallback
                }
                String r2ObjectKey = "documents/" + userId + "/" + UUID.randomUUID() + ".pdf";
                
                try {
                    r2StorageService.uploadFile(r2ObjectKey, file.getBytes(), file.getContentType());
                } catch (Exception e) {
                    return ResponseEntity.status(500).body(Map.of("error", "R2 Upload failed: " + e.getMessage()));
                }

                try {
                    savedDoc = documentService.uploadDocument(
                            title != null && !title.isBlank() ? title : originalName,
                            content,
                            courseCode,
                            faculty,
                            r2ObjectKey,
                            file.getSize(),
                            userEmail,
                            "R2"
                    );
                } catch (Exception e) {
                    try {
                        r2StorageService.deleteFile(r2ObjectKey);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                    return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                }
            } else {
                Path storageRoot = Path.of(uploadDir).toAbsolutePath().normalize();
                Files.createDirectories(storageRoot);
                String safeName = originalName.replaceAll("[^A-Za-z0-9._-]", "_");
                Path storedFile = storageRoot.resolve(UUID.randomUUID() + "_" + safeName).normalize();
                if (!storedFile.startsWith(storageRoot)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid file name"));
                }
                file.transferTo(storedFile);

                try {
                    savedDoc = documentService.uploadDocument(
                            title != null && !title.isBlank() ? title : originalName,
                            content,
                            courseCode,
                            faculty,
                            storedFile.toString(),
                            file.getSize(),
                            userEmail
                    );
                } catch (IllegalArgumentException e) {
                    Files.deleteIfExists(storedFile);
                    return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                }
            }

            return ResponseEntity.ok(documentService.convertToDTO(savedDoc, userEmail));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getUserDocuments(HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            return ResponseEntity.ok(documentService.getUserDocuments(email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch documents: " + e.getMessage()));
        }
    }

    @GetMapping("/feed")
    public ResponseEntity<?> getFeed(HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            return ResponseEntity.ok(documentService.getPublicDocuments(email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch feed: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) String sortBy,
            HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            return ResponseEntity.ok(documentService.searchDocuments(query, facultyId, sortBy, email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Search failed: " + e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll(HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            return ResponseEntity.ok(documentService.getAllDocuments(email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch all documents: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> reviewDocument(@PathVariable Long id, @RequestBody ReviewRequest request, HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            boolean success = documentService.reviewDocument(id, request.getScore(), request.isApprove());
            return success ? ResponseEntity.ok().build() : ResponseEntity.status(404).body(Map.of("error", "Document not found"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Review failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<?> viewDocument(@PathVariable Long id) {
        try {
            boolean updated = documentService.incrementViewCount(id);
            if (!updated) {
                return ResponseEntity.status(404).body(Map.of("error", "Document not found"));
            }
            return ResponseEntity.ok(Map.of("message", "View count updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "View count update failed", "details", e.getMessage()));
        }
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<?> viewFile(@PathVariable Long id) throws Exception {
        Document doc = documentService.getDocumentById(id).orElseThrow();
        if ("R2".equals(doc.getStorageProvider())) {
            int ttl = r2Properties.getPresignedUrlTtlSeconds();
            String presignedUrl = r2StorageService.generatePresignedGetUrl(
                    doc.getFilePath(),
                    ttl,
                    doc.getTitle() + ".pdf",
                    false
            );
            return ResponseEntity.status(302)
                    .location(java.net.URI.create(presignedUrl))
                    .build();
        } else {
            Path file = documentService.getReadablePdfPath(id, false).orElseThrow();
            Resource resource = new UrlResource(file.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
                    .body(resource);
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable Long id) throws Exception {
        Document doc = documentService.getDocumentById(id).orElseThrow();
        documentService.incrementDownloadCount(id);
        if ("R2".equals(doc.getStorageProvider())) {
            int ttl = r2Properties.getPresignedUrlTtlSeconds();
            String presignedUrl = r2StorageService.generatePresignedGetUrl(
                    doc.getFilePath(),
                    ttl,
                    doc.getTitle() + ".pdf",
                    true
            );
            return ResponseEntity.status(302)
                    .location(java.net.URI.create(presignedUrl))
                    .build();
        } else {
            Path file = documentService.getReadablePdfPath(id, true).orElseThrow();
            Resource resource = new UrlResource(file.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                    .body(resource);
        }
    }

    @GetMapping(value = "/{id}/thumbnail", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<Resource> thumbnail(@PathVariable Long id) {
        try {
            Document doc = documentService.getDocumentById(id).orElseThrow();
            boolean isR2 = "R2".equals(doc.getStorageProvider());
            
            Path thumbnail = null;
            if (isR2) {
                Path thumbDir = Path.of(uploadDir).resolve("thumbnails").toAbsolutePath().normalize();
                Files.createDirectories(thumbDir);
                String safeName = doc.getTitle().replaceAll("[^A-Za-z0-9._-]", "_");
                thumbnail = thumbDir.resolve("r2_" + doc.getId() + "_" + safeName + ".png");
                
                if (!Files.exists(thumbnail)) {
                    byte[] pdfBytes = r2StorageService.downloadFileBytes(doc.getFilePath());
                    Path tempPdf = Files.createTempFile("r2_temp_", ".pdf");
                    try {
                        Files.write(tempPdf, pdfBytes);
                        try (PDDocument pdfDocument = Loader.loadPDF(tempPdf.toFile())) {
                            PDFRenderer renderer = new PDFRenderer(pdfDocument);
                            BufferedImage image = renderer.renderImageWithDPI(0, 96, ImageType.RGB);
                            if (!ImageIO.write(image, "png", thumbnail.toFile())) {
                                return ResponseEntity.notFound().build();
                            }
                        }
                    } finally {
                        Files.deleteIfExists(tempPdf);
                    }
                }
            } else {
                var pdfOpt = documentService.getReadablePdfPath(id, false);
                if (pdfOpt.isEmpty()) {
                    return ResponseEntity.notFound().build();
                }

                Path pdf = pdfOpt.get();
                Path pdfParent = pdf.getParent();
                if (pdfParent == null) {
                    return ResponseEntity.notFound().build();
                }

                Path thumbDir = pdfParent.resolve("thumbnails");
                Files.createDirectories(thumbDir);
                thumbnail = thumbDir.resolve(pdf.getFileName().toString() + ".png");

                if (!Files.exists(thumbnail)) {
                    try (PDDocument pdfDocument = Loader.loadPDF(pdf.toFile())) {
                        PDFRenderer renderer = new PDFRenderer(pdfDocument);
                        BufferedImage image = renderer.renderImageWithDPI(0, 96, ImageType.RGB);
                        if (!ImageIO.write(image, "png", thumbnail.toFile())) {
                            return ResponseEntity.notFound().build();
                        }
                    }
                }
            }

            Resource resource = new UrlResource(thumbnail.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            documentService.incrementViewCount(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .contentLength(Files.size(thumbnail))
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeDocument(@PathVariable Long id, HttpSession session) {
        try {
            String email = (String) session.getAttribute("userEmail");
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            boolean updated = documentService.toggleLike(id, email);
            if (!updated) {
                return ResponseEntity.status(404).body(Map.of("error", "Document not found or not published"));
            }
            return ResponseEntity.ok(Map.of("message", "Like toggled"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Like toggle failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<?> reportDocument(@PathVariable Long id, HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        boolean updated = documentService.reportDocument(id);
        if (!updated) {
            return ResponseEntity.status(404).body(Map.of("error", "Document not found"));
        }
        return ResponseEntity.ok(Map.of("message", "Report recorded"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id, HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        String role = (String) session.getAttribute("userRole");
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        try {
            boolean deleted = documentService.deleteDocument(id);
            if (!deleted) {
                return ResponseEntity.status(404).body(Map.of("error", "Document not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Document deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Document delete failed", "details", e.getMessage()));
        }
    }
}
