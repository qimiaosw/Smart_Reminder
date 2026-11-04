package com.reminder.engine;

import com.reminder.abtest.ExperimentEntity;
import com.reminder.abtest.ExperimentRepository;
import com.reminder.abtest.ExperimentService;
import com.reminder.config.EngineConfig;
import com.reminder.notification.NotificationService;
import com.reminder.notification.PushTemplateEntity;
import com.reminder.notification.PushTemplateRepository;
import com.reminder.task.TaskRepository;
import com.reminder.user.UserEntity;
import com.reminder.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.Duration;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 提醒引擎调度器：定时扫描待提醒用户，触发推送
 */
@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final UserRepository userRepository;
    private final PushTemplateRepository templateRepository;
    private final NotificationService notificationService;
    private final TimingDecisionService timingDecision;
    private final AIContentGenerator aiContentGenerator;
    private final FrequencyControlService frequencyControl;
    private final PushMessagePublisher publisher;
    private final EngineConfig engineConfig;
    private final ExperimentRepository experimentRepository;
    private final ExperimentService experimentService;
    private final TaskRepository taskRepository;

    public ReminderScheduler(UserRepository userRepository,
                              PushTemplateRepository templateRepository,
                              NotificationService notificationService,
                              TimingDecisionService timingDecision,
                              AIContentGenerator aiContentGenerator,
                              FrequencyControlService frequencyControl,
                              PushMessagePublisher publisher,
                              EngineConfig engineConfig,
                              ExperimentRepository experimentRepository,
                              ExperimentService experimentService,
                              TaskRepository taskRepository) {
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
        this.notificationService = notificationService;
        this.timingDecision = timingDecision;
        this.aiContentGenerator = aiContentGenerator;
        this.frequencyControl = frequencyControl;
        this.publisher = publisher;
        this.engineConfig = engineConfig;
        this.experimentRepository = experimentRepository;
        this.experimentService = experimentService;
        this.taskRepository = taskRepository;
    }

    /**
     * 定时扫描：每 5 分钟检查一次待推送用户
     */
    @Scheduled(fixedDelayString = "${reminder.engine.scan-interval:300000}")
    public void scanAndPush() {
        log.debug("提醒引擎开始扫描...");

        // 获取所有启用了推送的用户
        List<UserEntity> users = userRepository.findAll();

        for (UserEntity user : users) {
            try {
                processUser(user);
            } catch (Exception e) {
                log.error("处理用户 {} 推送时出错: {}", user.getId(), e.getMessage());
            }
        }
    }

    private void processUser(UserEntity user) {
        // 1. 时机决策
        LocalDateTime bestTime = timingDecision.decideBestTime(user);
        if (bestTime == null) {
            return; // 当前不需要推送
        }

        // 只在计划时间 ±5 分钟内推送
        if (Math.abs(Duration.between(LocalDateTime.now(), bestTime).toMinutes()) > 5) {
            return;
        }

        // 2. 频次控制
        if (!frequencyControl.canSend(user)) {
            return;
        }

        // 3. 选择模板
        PushTemplateEntity template = selectTemplate(user);
        if (template == null) {
            return;
        }

        // 4. 查询真实任务数据
        LocalDate today = LocalDate.now();
        long todayTotal = taskRepository.countByUserIdAndTaskDate(user.getId(), today);
        long todayCompleted = taskRepository.countByUserIdAndStatusAndTaskDate(user.getId(), "COMPLETED", today);
        int incompleteCount = (int) Math.max(0, todayTotal - todayCompleted);
        int estimatedMinutes = incompleteCount * 15; // 每项任务约15分钟
        int rate = (int) (user.getWeeklyCompletionRate().doubleValue() * 100);
        int percentile = Math.min(95, (int) (user.getWeeklyCompletionRate().doubleValue() * 80 + 20));

        // 5. 生成内容（AI 或模板），传入真实数据
        ContentGenerator.PushContent content = aiContentGenerator.generate(
                user, incompleteCount, estimatedMinutes, percentile);

        // 6. 实验分流：将用户分配到运行中的实验分组
        Long experimentId = assignToRunningExperiments(user);

        // 7. 创建推送记录
        var notif = notificationService.createNotification(
                user.getId(), template.getId(), content.title(), content.body(), experimentId);

        // 8. 记录频控
        frequencyControl.recordPush(user);

        // 9. 发送到消息队列
        PushMessage message = new PushMessage();
        message.setNotificationId(notif.getId());
        message.setUserId(user.getId());
        message.setTemplateId(template.getId());
        message.setTitle(content.title());
        message.setBody(content.body());
        message.setUserType(user.getUserType());
        message.setScheduledAt(LocalDateTime.now());
        if (experimentId != null) {
            message.setExperimentId(experimentId);
        }

        publisher.publishPushRequest(message);

        log.info("已推送: userId={}, type={}, title={}", user.getId(), user.getUserType(), content.title());
    }

    /**
     * 将用户分配到运行中的实验，返回第一个匹配实验的 ID
     */
    private Long assignToRunningExperiments(UserEntity user) {
        List<ExperimentEntity> running = experimentRepository.findByStatus("RUNNING");
        for (ExperimentEntity exp : running) {
            String targetType = exp.getTargetUserType();
            if (targetType == null || targetType.isEmpty() || targetType.equals(user.getUserType())) {
                experimentService.assignUserToGroup(user.getId(), exp.getId());
                return exp.getId();
            }
        }
        return null;
    }

    private PushTemplateEntity selectTemplate(UserEntity user) {
        // 优先匹配用户分层的模板
        List<PushTemplateEntity> matched = templateRepository
                .findByTargetUserTypeAndIsActiveTrue(user.getUserType());
        if (!matched.isEmpty()) {
            return matched.get(0);
        }
        // 回退到通用模板
        List<PushTemplateEntity> general = templateRepository
                .findByTargetUserTypeIsNullAndIsActiveTrue();
        return general.isEmpty() ? null : general.get(0);
    }
}

