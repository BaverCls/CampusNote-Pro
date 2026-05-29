package campusnote.backend.CoreDocumentManagement;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {
    private Long id;
    private String title;
    private String content;
    private Integer type;
    private Long userId;
    private String uploaderName;
    private String uploadedAt;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long facultyId;
    private String facultyName;
    private Long departmentId;
    private String departmentName;
    private String status;
    private Double score;
    private String uploadDate;
    private String faculty;
    private Integer downloadCount;
    private Integer viewCount;
    private Integer likeCount;
    private String filePath;
    private String fileUrl;
    private String thumbnailUrl;
    private Integer reportCount;
    private boolean liked;
}
