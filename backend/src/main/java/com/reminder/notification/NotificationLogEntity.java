package com.reminder.notification;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notification_logs")
public class NotificationLogEntity {

    @Id
    @Column(length = 32)
    private String id;

    @Column(name = "user_id", length = 32, nullable = false)
    private String userId;

    @Column(name = "experiment_id")
    private Long experimentId;

    @Column(name = "template_id", length = 50)
    private String templateId;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 20)
    private String channel = "push";

    @Column(length = 20)
    private String status = "pending";

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "extra_data", columnDefinition = "JSON")
    private String extraData;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
