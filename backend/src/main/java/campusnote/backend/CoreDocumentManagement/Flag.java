package campusnote.backend.CoreDocumentManagement;

import campusnote.backend.CoreSecurity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "flag")
@Getter
@Setter
public class Flag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doc_id")
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime flaggedAt;

    private Integer reason;

    private Integer status;

    @PrePersist
    protected void onCreate() {
        flaggedAt = LocalDateTime.now();
    }
}
