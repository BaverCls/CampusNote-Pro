package campusnote.backend.CoreDocumentManagement;

import lombok.Data;

@Data
public class ReviewRequest {
    private int score;
    private boolean approve;
}
