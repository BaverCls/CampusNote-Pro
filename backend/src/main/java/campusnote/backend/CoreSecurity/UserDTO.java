package campusnote.backend.CoreSecurity;

public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private int coinBalance;
    private String role;

    public UserDTO(Long id, String email, String fullName, int coinBalance, String role) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.coinBalance = coinBalance;
        this.role = role;
    }

    // Getters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public int getCoinBalance() { return coinBalance; }
    public String getRole() { return role; }
}
