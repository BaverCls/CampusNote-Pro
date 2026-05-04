package campusnote.backend.CoreDocumentManagement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {
    private Long id;
    private String title;
    private String courseCode;
    private String faculty;
    private Integer score;
    private String uploaderName;
    private String uploadDate;
    private String status;
    private String filePath;
}
