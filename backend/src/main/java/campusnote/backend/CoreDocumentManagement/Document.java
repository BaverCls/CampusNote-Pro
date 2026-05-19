package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreSecurity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
public class Document {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "course_code", nullable = false)
    private String courseCode;

    @Lob
    private String content;

    private Integer type;

    @Column(name = "faculty", nullable = false)
    private String facultyName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id")
    private User user;

    private LocalDateTime uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    private Integer isPublic;
    private String status = "DRAFT";

    @Column(name = "score")
    private Double score = 0.0;

    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize = 0L;

    @Column(name = "thumbnail_path")
    private String thumbnailPath;

    @ManyToMany
    @JoinTable(
        name = "document_likes",
        joinColumns = @JoinColumn(name = "document_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private java.util.Set<User> likedByUsers = new java.util.HashSet<>();

    @Column(name = "report_count")
    private Integer reportCount = 0;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
