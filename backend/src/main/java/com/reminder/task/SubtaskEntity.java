package com.reminder.task;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "subtasks")
public class SubtaskEntity {

    @Id
    @Column(length = 32)
    private String id;

    @Column(name = "task_id", length = 32, nullable = false)
    private String taskId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes = 5;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    private Boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
