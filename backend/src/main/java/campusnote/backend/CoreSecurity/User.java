package campusnote.backend.CoreSecurity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @Email
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@arel\\.edu\\.tr$", message = "Only @arel.edu.tr emails are allowed")
    private String email;
    
    private String fullName;

    @Column(nullable = false)
    private String password; // Will store BCrypt hash

    private int coinBalance = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'STUDENT'")
    private Role role = Role.STUDENT;

    public enum Role {
        STUDENT,
        ADMIN
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public int getCoinBalance() { return coinBalance; }
    public void setCoinBalance(int coinBalance) { this.coinBalance = coinBalance; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
