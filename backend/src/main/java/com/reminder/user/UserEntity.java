package com.reminder.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @Column(length = 32)
    private String id;

    @Column(nullable = false, length = 100)
    private String username;

    @JsonIgnore
    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "real_name", length = 100)
    private String realName;

    @Column(name = "user_type", length = 20, nullable = false)
    private String userType = "COLD_START";

    @Column(name = "push_enabled")
    private Boolean pushEnabled = true;

    @Column(name = "push_token", length = 255)
    private String pushToken;

    @Column(name = "active_time_slot", length = 20)
    private String activeTimeSlot;

    @Column(name = "consecutive_miss_days")
    private Integer consecutiveMissDays = 0;

    @Column(name = "weekly_completion_rate", precision = 5, scale = 2)
    private BigDecimal weeklyCompletionRate = BigDecimal.ZERO;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Version
    private Integer version = 0;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
