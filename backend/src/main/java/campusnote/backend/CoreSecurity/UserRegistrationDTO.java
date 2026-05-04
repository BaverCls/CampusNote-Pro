package campusnote.backend.CoreSecurity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UserRegistrationDTO {

    @NotBlank
    @Email
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@arel\\.edu\\.tr$", message = "Only @arel.edu.tr emails are allowed")
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String fullName;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}
