package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreSecurity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Document {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String courseCode;

    @Column(nullable = false)
    private String faculty;

    @Column(nullable = false)
    private String filePath;

    @Enumerated(EnumType.STRING)
    private DocumentStatus status = DocumentStatus.DRAFT;

    private Integer aiScore;

    @ManyToOne
    @JoinColumn(name = "uploader_id")
    private User uploader;

    private LocalDateTime uploadDate = LocalDateTime.now();

    public enum DocumentStatus {
        DRAFT, PUBLISHED, REJECTED
    }
}
