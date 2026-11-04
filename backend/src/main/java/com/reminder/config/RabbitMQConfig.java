package com.reminder.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // ── 交换机 ──
    public static final String EXCHANGE_PUSH = "reminder.push";
    public static final String EXCHANGE_EVENT = "reminder.event";

    // ── 队列 ──
    public static final String QUEUE_PUSH_REQUEST = "push.request";
    public static final String QUEUE_PUSH_CALLBACK = "push.callback";
    public static final String QUEUE_USER_BEHAVIOR = "user.behavior.event";

    // ── Routing Key ──
    public static final String RK_PUSH_REQUEST = "push.request";
    public static final String RK_PUSH_CALLBACK = "push.callback";
    public static final String RK_USER_BEHAVIOR = "user.behavior.event";

    // ==================== 交换机 ====================

    @Bean
    public DirectExchange pushExchange() {
        return new DirectExchange(EXCHANGE_PUSH, true, false);
    }

    @Bean
    public DirectExchange eventExchange() {
        return new DirectExchange(EXCHANGE_EVENT, true, false);
    }

    // ==================== 队列 ====================

    @Bean
    public Queue pushRequestQueue() {
        return new Queue(QUEUE_PUSH_REQUEST, true);
    }

    @Bean
    public Queue pushCallbackQueue() {
        return new Queue(QUEUE_PUSH_CALLBACK, true);
    }

    @Bean
    public Queue userBehaviorQueue() {
        return new Queue(QUEUE_USER_BEHAVIOR, true);
    }

    // ==================== 绑定 ====================

    @Bean
    public Binding bindPushRequest(Queue pushRequestQueue, DirectExchange pushExchange) {
        return BindingBuilder.bind(pushRequestQueue).to(pushExchange).with(RK_PUSH_REQUEST);
    }

    @Bean
    public Binding bindPushCallback(Queue pushCallbackQueue, DirectExchange pushExchange) {
        return BindingBuilder.bind(pushCallbackQueue).to(pushExchange).with(RK_PUSH_CALLBACK);
    }

    @Bean
    public Binding bindUserBehavior(Queue userBehaviorQueue, DirectExchange eventExchange) {
        return BindingBuilder.bind(userBehaviorQueue).to(eventExchange).with(RK_USER_BEHAVIOR);
    }
}
