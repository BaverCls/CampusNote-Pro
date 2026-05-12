package campusnote.backend.CoreSecurity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private Integer coinBalance;
    private String role;
    private Long facultyId;
    private String facultyName;
    private Long departmentId;
    private String departmentName;
    private String bio;
    private String university;
    private Boolean isActive;
    private Integer year;
    private String createdAt;
    private String rank;
    private Integer totalDownloads;
    private Integer totalLikes;
}
