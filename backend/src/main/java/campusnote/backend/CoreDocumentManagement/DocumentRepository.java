package campusnote.backend.CoreDocumentManagement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByIsPublic(Integer isPublic);
    List<Document> findByUserId(Long userId);
    List<Document> findByUserEmail(String email);
}
