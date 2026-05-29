package campusnote.backend.CoreSecurity;

import campusnote.backend.CoreDocumentManagement.Department;
import campusnote.backend.CoreDocumentManagement.Faculty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "password", nullable = false)
    private String passwordHash;

    @Column(name = "coin_balance")
    private Integer coinBalance = 0;

    @Enumerated(EnumType.STRING)
    private Role role = Role.STUDENT;

    @Column(name = "bio")
    private String bio;

    @Column(name = "department_name")
    private String departmentName;

    @Column(name = "university")
    private String university;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "academic_year")
    private Integer year;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
    private String rank = "BRONZE";

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // FR-ST-47: Non-Administrator access control handled via Role
    public enum Role {
        STUDENT, ADMIN
    }
}
