package campusnote.backend.CoreDocumentManagement;

import lombok.Data;

@Data
public class DocumentUploadRequest {
    private String title;
    private String content;
    private String courseCode;
    private String faculty;
    private String filePath;
}
