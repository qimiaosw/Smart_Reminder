package com.reminder.event;

import com.reminder.common.BusinessException;
import com.reminder.config.RabbitMQConfig;
import com.reminder.user.UserService;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@Transactional
public class BehaviorEventService {

    private final BehaviorEventRepository repository;
    private final RabbitTemplate rabbitTemplate;
    private final UserService userService;

    public BehaviorEventService(BehaviorEventRepository repository,
                                 RabbitTemplate rabbitTemplate,
                                 UserService userService) {
        this.repository = repository;
        this.rabbitTemplate = rabbitTemplate;
        this.userService = userService;
    }

    /**
     * 记录行为事件并发送到 RabbitMQ
     */
    public BehaviorEventEntity recordEvent(String userId, String eventType, Map<String, Object> eventData) {
        // 持久化
        BehaviorEventEntity entity = new BehaviorEventEntity();
        entity.setUserId(userId);
        entity.setEventType(eventType);
        entity.setEventData(eventData != null ? eventData.toString() : null);
        entity.setCreatedAt(LocalDateTime.now());
        BehaviorEventEntity saved = repository.save(entity);

        // 发送到消息队列
        Map<String, Object> message = Map.of(
                "userId", userId,
                "eventType", eventType,
                "eventData", eventData,
                "timestamp", LocalDateTime.now().toString()
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_EVENT,
                RabbitMQConfig.RK_USER_BEHAVIOR,
                message);

        // 更新用户活跃时间
        if ("open_app".equals(eventType) || "complete_task".equals(eventType)) {
            userService.recordActivity(userId);
        }

        return saved;
    }
}
