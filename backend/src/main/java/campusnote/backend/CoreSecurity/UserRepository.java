package campusnote.backend.CoreSecurity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    // Used for faculty-based leaderboard: order strictly by coinBalance desc
    List<User> findByFaculty_IdOrderByCoinBalanceDesc(Long facultyId);

    // Used for overall top contributors: order strictly by coinBalance desc
    List<User> findAllByOrderByCoinBalanceDesc();
}
