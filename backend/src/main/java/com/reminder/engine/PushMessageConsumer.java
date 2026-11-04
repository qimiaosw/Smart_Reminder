package com.reminder.engine;

import com.reminder.common.NotificationStatus;
import com.reminder.notification.NotificationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 推送消息消费者：处理推送回执
 */
@Component
public class PushMessageConsumer {

    private static final Logger log = LoggerFactory.getLogger(PushMessageConsumer.class);

    private final NotificationLogRepository logRepository;

    public PushMessageConsumer(NotificationLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @RabbitListener(queues = "${reminder.engine.push-callback-queue:push.callback}")
    public void handleCallback(PushMessage message) {
        log.info("收到推送回执: notificationId={}, userId={}", message.getNotificationId(), message.getUserId());
        // 实际项目中这里更新推送状态
    }
}
