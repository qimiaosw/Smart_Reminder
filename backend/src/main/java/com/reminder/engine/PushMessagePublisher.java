package com.reminder.engine;

import com.reminder.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * 推送消息发布者：发送到 RabbitMQ
 */
@Component
public class PushMessagePublisher {

    private final RabbitTemplate rabbitTemplate;

    public PushMessagePublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishPushRequest(PushMessage message) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_PUSH,
                RabbitMQConfig.RK_PUSH_REQUEST,
                message);
    }

    public void publishCallback(PushMessage message) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_PUSH,
                RabbitMQConfig.RK_PUSH_CALLBACK,
                message);
    }
}
