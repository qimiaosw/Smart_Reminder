package com.reminder.abtest;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ab_test_groups")
public class ExperimentGroupEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "experiment_id", nullable = false)
    private Long experimentId;

    @Column(name = "group_name", length = 50, nullable = false)
    private String groupName;

    @Column(name = "config_json", columnDefinition = "JSON")
    private String configJson;

    @Column(name = "traffic_percent")
    private Integer trafficPercent = 0;

    @Column(name = "user_count")
    private Integer userCount = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
