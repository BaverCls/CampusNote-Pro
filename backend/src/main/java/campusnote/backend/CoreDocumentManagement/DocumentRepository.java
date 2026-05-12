package campusnote.backend.CoreDocumentManagement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByIsPublic(Integer isPublic);
    List<Document> findByUserId(Long userId);
    List<Document> findByUserEmail(String email);

    // FR-ST-10: Display an aggregated total of downloads received
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(d.downloadCount), 0) FROM Document d WHERE d.user.id = :userId")
    Long sumDownloadsByUserId(Long userId);

    // FR-ST-13: Display an aggregated total of 'Likes' received
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(l) FROM Document d JOIN d.likedByUsers l WHERE d.user.id = :userId")
    Long sumLikesByUserId(Long userId);
}
