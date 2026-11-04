package com.reminder.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {

    Optional<UserEntity> findByUsername(String username);

    List<UserEntity> findByUserType(String userType);

    long countByUserType(String userType);

    @Query("SELECT u.userType, COUNT(u) FROM UserEntity u WHERE u.deletedAt IS NULL GROUP BY u.userType")
    List<Object[]> countGroupByType();
}
