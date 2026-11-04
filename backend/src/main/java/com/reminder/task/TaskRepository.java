package com.reminder.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, String> {

    List<TaskEntity> findByUserIdAndTaskDateOrderByCreatedAt(String userId, LocalDate date);

    List<TaskEntity> findByTaskDateBetweenOrderByTaskDateAsc(LocalDate start, LocalDate end);

    List<TaskEntity> findByUserIdAndStatusAndTaskDateBetweenOrderByTaskDateAsc(
            String userId, String status, LocalDate start, LocalDate end);

    long countByUserIdAndStatusAndTaskDate(String userId, String status, LocalDate date);

    long countByUserIdAndTaskDate(String userId, LocalDate date);

    @Query("SELECT COUNT(t) FROM TaskEntity t WHERE t.userId = :userId AND t.status = 'COMPLETED' AND t.taskDate >= :since")
    long countCompletedSince(@Param("userId") String userId, @Param("since") LocalDate since);

    @Query("SELECT COUNT(t) FROM TaskEntity t WHERE t.userId = :userId AND t.taskDate >= :since")
    long countTotalSince(@Param("userId") String userId, @Param("since") LocalDate since);

    @Query("SELECT COUNT(t) FROM TaskEntity t WHERE t.userId IN :userIds AND t.taskDate >= :since")
    long countTotalSinceForUsers(@Param("userIds") List<String> userIds, @Param("since") LocalDate since);

    @Query("SELECT COUNT(t) FROM TaskEntity t WHERE t.userId IN :userIds AND t.status = 'COMPLETED' AND t.taskDate >= :since")
    long countCompletedSinceForUsers(@Param("userIds") List<String> userIds, @Param("since") LocalDate since);
}
