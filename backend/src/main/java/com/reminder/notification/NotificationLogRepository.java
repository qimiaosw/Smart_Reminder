package com.reminder.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLogEntity, String> {

    List<NotificationLogEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<NotificationLogEntity> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    long countByUserIdAndStatus(String userId, String status);

    @Query("SELECT COUNT(n) FROM NotificationLogEntity n WHERE n.userId IN :userIds")
    long countByUserIds(@Param("userIds") List<String> userIds);

    @Query("SELECT COUNT(n) FROM NotificationLogEntity n WHERE n.userId IN :userIds AND n.status = :status")
    long countByUserIdsAndStatus(@Param("userIds") List<String> userIds, @Param("status") String status);

    List<NotificationLogEntity> findByCreatedAtBetweenOrderByCreatedAtAsc(LocalDateTime start, LocalDateTime end);
}
