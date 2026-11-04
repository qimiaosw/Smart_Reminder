package com.reminder.engine;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 推送消息 DTO（发送到 RabbitMQ）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PushMessage {

    private String notificationId;
    private String userId;
    private String templateId;
    private String title;
    private String body;
    private String userType;
    private Long experimentId;
    private String experimentGroup;
    private LocalDateTime scheduledAt;
}
