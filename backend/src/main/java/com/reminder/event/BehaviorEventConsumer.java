package com.reminder.event;

import com.reminder.abtest.ExperimentEntity;
import com.reminder.abtest.ExperimentRepository;
import com.reminder.abtest.ExperimentService;
import com.reminder.engine.ContentGenerator;
import com.reminder.engine.FrequencyControlService;
import com.reminder.engine.PushMessage;
import com.reminder.engine.PushMessagePublisher;
import com.reminder.notification.NotificationService;
import com.reminder.notification.PushTemplateEntity;
import com.reminder.notification.PushTemplateRepository;
import com.reminder.task.TaskRepository;
import com.reminder.user.UserEntity;
import com.reminder.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 用户行为事件消费者
 * 消费 user.behavior.event 队列中的事件，更新用户画像并触发自律型推送
 */
@Component
public class BehaviorEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(BehaviorEventConsumer.class);

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final FrequencyControlService frequencyControl;
    private final PushTemplateRepository templateRepository;
    private final NotificationService notificationService;
    private final PushMessagePublisher publisher;
    private final ExperimentRepository experimentRepository;
    private final ExperimentService experimentService;
    private final ContentGenerator contentGenerator;

    public BehaviorEventConsumer(UserRepository userRepository,
                                  TaskRepository taskRepository,
                                  FrequencyControlService frequencyControl,
                                  PushTemplateRepository templateRepository,
                                  NotificationService notificationService,
                                  PushMessagePublisher publisher,
                                  ExperimentRepository experimentRepository,
                                  ExperimentService experimentService,
                                  ContentGenerator contentGenerator) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.frequencyControl = frequencyControl;
        this.templateRepository = templateRepository;
        this.notificationService = notificationService;
        this.publisher = publisher;
        this.experimentRepository = experimentRepository;
        this.experimentService = experimentService;
        this.contentGenerator = contentGenerator;
    }

    @RabbitListener(queues = "user.behavior.event")
    public void handleEvent(Map<String, Object> message) {
        String userId = (String) message.get("userId");
        String eventType = (String) message.get("eventType");
        log.debug("收到行为事件: userId={}, eventType={}", userId, eventType);

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        switch (eventType) {
            case "open_app" -> handleOpenApp(user);
            case "complete_task", "complete_subtask" -> handleTaskComplete(user);
            case "click_notification" -> handleClickNotification(user, message);
        }
    }

    /**
     * 用户打开 App → 更新活跃时间，重置连续未完成计数
     */
    private void handleOpenApp(UserEntity user) {
        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * 完成任务/微任务 → 重新计算完成率，检查是否需要触发自律型推送
     */
    private void handleTaskComplete(UserEntity user) {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);

        // 重新计算近 7 天完成率
        long weekTotal = taskRepository.countTotalSince(user.getId(), weekAgo);
        long weekCompleted = taskRepository.countCompletedSince(user.getId(), weekAgo);
        if (weekTotal > 0) {
            user.setWeeklyCompletionRate(
                    BigDecimal.valueOf(weekCompleted).divide(BigDecimal.valueOf(weekTotal), 2, java.math.RoundingMode.HALF_UP));
        }

        // 检查今日是否全部完成
        long todayTotal = taskRepository.countByUserIdAndTaskDate(user.getId(), today);
        long todayCompleted = taskRepository.countByUserIdAndStatusAndTaskDate(user.getId(), "COMPLETED", today);

        if (todayTotal > 0 && todayCompleted >= todayTotal) {
            user.setConsecutiveMissDays(0);
            userRepository.save(user);

            // 自律型用户全部完成任务 → 发送进度鼓励推送
            if ("SELF_DRIVEN".equals(user.getUserType())) {
                triggerSelfDrivenPush(user, todayCompleted, todayTotal);
            }
        } else {
            userRepository.save(user);
        }
    }

    /**
     * 点击推送通知
     */
    private void handleClickNotification(UserEntity user, Map<String, Object> message) {
        // 标记推送已读在 NotificationService 中处理
    }

    /**
     * 自律型用户全部完成任务时触发一次性鼓励推送
     */
    private void triggerSelfDrivenPush(UserEntity user, long completed, long total) {
        if (!frequencyControl.canSend(user)) return;

        // 选择自律型模板
        List<PushTemplateEntity> matched = templateRepository
                .findByTargetUserTypeAndIsActiveTrue("SELF_DRIVEN");
        PushTemplateEntity template = matched.isEmpty() ? null : matched.get(0);
        if (template == null) {
            List<PushTemplateEntity> general = templateRepository
                    .findByTargetUserTypeIsNullAndIsActiveTrue();
            template = general.isEmpty() ? null : general.get(0);
        }
        if (template == null) return;

        int percentile = Math.min(95, (int) (user.getWeeklyCompletionRate().doubleValue() * 80 + 20));

        ContentGenerator.PushContent content = contentGenerator.generate(
                user, template, (int) (total - completed), 0, percentile);

        // 实验分流
        Long experimentId = null;
        List<ExperimentEntity> running = experimentRepository.findByStatus("RUNNING");
        for (ExperimentEntity exp : running) {
            String targetType = exp.getTargetUserType();
            if (targetType == null || targetType.isEmpty() || "SELF_DRIVEN".equals(targetType)) {
                experimentService.assignUserToGroup(user.getId(), exp.getId());
                experimentId = exp.getId();
                break;
            }
        }

        var notif = notificationService.createNotification(
                user.getId(), template.getId(), content.title(), content.body(), experimentId);

        frequencyControl.recordPush(user);

        PushMessage pushMsg = new PushMessage();
        pushMsg.setNotificationId(notif.getId());
        pushMsg.setUserId(user.getId());
        pushMsg.setTemplateId(template.getId());
        pushMsg.setTitle(content.title());
        pushMsg.setBody(content.body());
        pushMsg.setUserType(user.getUserType());
        pushMsg.setScheduledAt(LocalDateTime.now());
        if (experimentId != null) {
            pushMsg.setExperimentId(experimentId);
        }

        publisher.publishPushRequest(pushMsg);
        log.info("自律型推送: userId={}, title={}", user.getId(), content.title());
    }
}
