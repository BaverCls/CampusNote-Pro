package campusnote.backend.CoreDocumentManagement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByStatus(Document.DocumentStatus status);
    List<Document> findByUploaderId(Long uploaderId);
    List<Document> findByUploaderEmail(String email);
}
