package com.reminder.engine;

import com.reminder.abtest.ExperimentEntity;
import com.reminder.abtest.ExperimentRepository;
import com.reminder.abtest.ExperimentService;
import com.reminder.common.BusinessException;
import com.reminder.config.EngineConfig;
import com.reminder.notification.NotificationService;
import com.reminder.notification.PushTemplateEntity;
import com.reminder.notification.PushTemplateRepository;
import com.reminder.task.TaskRepository;
import com.reminder.user.UserEntity;
import com.reminder.user.UserRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EngineSimulationService {

    private static final String KEY_DAILY_COUNT = "push:daily:";
    private static final String KEY_LAST_PUSH = "push:last:";
    private static final String KEY_ONLINE = "user:online:";

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final PushTemplateRepository templateRepository;
    private final TimingDecisionService timingDecision;
    private final StringRedisTemplate redisTemplate;
    private final EngineConfig engineConfig;
    private final NotificationService notificationService;
    private final ExperimentRepository experimentRepository;
    private final ExperimentService experimentService;

    public EngineSimulationService(UserRepository userRepository,
                                   TaskRepository taskRepository,
                                   PushTemplateRepository templateRepository,
                                   TimingDecisionService timingDecision,
                                   StringRedisTemplate redisTemplate,
                                   EngineConfig engineConfig,
                                   NotificationService notificationService,
                                   ExperimentRepository experimentRepository,
                                   ExperimentService experimentService) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.templateRepository = templateRepository;
        this.timingDecision = timingDecision;
        this.redisTemplate = redisTemplate;
        this.engineConfig = engineConfig;
        this.notificationService = notificationService;
        this.experimentRepository = experimentRepository;
        this.experimentService = experimentService;
    }

    public Map<String, Object> simulate(String userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        // 计算今日未完成任务数
        LocalDate today = LocalDate.now();
        long todayTotal = taskRepository.countByUserIdAndTaskDate(userId, today);
        long todayCompleted = taskRepository.countByUserIdAndStatusAndTaskDate(userId, "COMPLETED", today);
        int incompleteCount = (int) Math.max(0, todayTotal - todayCompleted);
        double completionRate = user.getWeeklyCompletionRate().doubleValue();

        // 选择匹配模板
        PushTemplateEntity template = selectTemplate(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timing", buildTimingResult(user, incompleteCount, completionRate));
        result.put("content", buildContentResult(user, template, incompleteCount, completionRate));
        result.put("frequency", buildFrequencyResult(user));

        // 同时写入真实推送记录，以便实验报表能看到数据
        persistSimulatedNotification(user, template, result);

        return result;
    }

    private void persistSimulatedNotification(UserEntity user, PushTemplateEntity template, Map<String, Object> result) {
        // 1. 查运行中的实验，分流用户
        Long experimentId = null;
        List<ExperimentEntity> running = experimentRepository.findByStatus("RUNNING");
        for (ExperimentEntity exp : running) {
            String targetType = exp.getTargetUserType();
            if (targetType == null || targetType.isEmpty() || targetType.equals(user.getUserType())) {
                experimentService.assignUserToGroup(user.getId(), exp.getId());
                experimentId = exp.getId();
                break;
            }
        }

        // 2. 从结果中提取标题
        @SuppressWarnings("unchecked")
        Map<String, Object> content = (Map<String, Object>) result.get("content");
        String title = (String) content.get("output");
        String templateId = (String) content.get("templateMatched");

        // 3. 创建真实通知记录并标记为已读（便于报表立即看到数据）
        var notif = notificationService.createNotification(user.getId(), templateId, title, "", experimentId);
        notificationService.markOpened(notif.getId());
    }

    // ========== 时机决策 ==========

    private Map<String, Object> buildTimingResult(UserEntity user, int incompleteCount, double completionRate) {
        String type = user.getUserType();
        String slot = user.getActiveTimeSlot();

        Map<String, Object> input = new LinkedHashMap<>();
        input.put("userType", type);
        input.put("activeTimeSlot", slot);
        input.put("incompleteCount", incompleteCount);
        input.put("completionRate", completionRate);

        String output;
        String explanation;

        switch (type) {
            case "SELF_DRIVEN":
                output = slot != null ? slot.split("-")[0] + " - 完成任务后即时推送" : "完成任务后即时推送";
                explanation = slot != null
                        ? "活跃时段 " + slot + "，用户自律度高，选择在任务完成时发送鼓励"
                        : "冷启动用户，默认在完成任务后发送进度反馈";
                break;
            case "NEED_REMINDER":
                output = slot != null ? slot.split("-")[0] + " 前 30 分钟推送" : "18:00 推送";
                explanation = slot != null
                        ? "活跃时段 " + slot + "，前 30 分钟推送以提前唤起用户"
                        : "无活跃时段数据，默认在放学高峰前推送";
                break;
            case "DROPOUT":
                output = slot != null ? slot.split("-")[0] + " 前 30 分钟 + 次日 10:00" : "18:00 + 20:00 双次推送";
                explanation = "流失倾向型用户，需要多次触达。选择 18:00（放学高峰）和 20:00（晚饭后）两个关键时段";
                break;
            default: // COLD_START
                output = "18:00 推送";
                explanation = "冷启动用户，使用默认推送策略，7 天后根据行为数据重新分层";
                break;
        }

        Map<String, Object> timing = new LinkedHashMap<>();
        timing.put("input", input);
        timing.put("output", output);
        timing.put("explanation", explanation);
        return timing;
    }

    // ========== 内容生成 ==========

    private Map<String, Object> buildContentResult(UserEntity user, PushTemplateEntity template, int incompleteCount, double completionRate) {
        int rate = (int) (completionRate * 100);
        int minutes = incompleteCount * 15;
        int percentile = Math.min(95, (int) (completionRate * 0.8 + 20));
        String defaultReward = "额外积分奖励";

        String title;
        String body;
        String templateId;

        if (template != null) {
            templateId = template.getId();
            title = fillTemplate(template.getTitleTemplate(), rate, incompleteCount, minutes, percentile, defaultReward);
            body = fillTemplate(template.getBodyTemplate(), rate, incompleteCount, minutes, percentile, defaultReward);
        } else {
            templateId = "无";
            title = getDefaultTitle(user.getUserType(), incompleteCount, rate);
            body = "";
        }

        Map<String, Object> input = new LinkedHashMap<>();
        input.put("userType", user.getUserType());
        input.put("incompleteCount", incompleteCount);
        input.put("completionRate", completionRate);

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("input", input);
        content.put("templateMatched", templateId);
        content.put("output", title);
        content.put("bodyOutput", body);
        content.put("explanation", "匹配 " + user.getUserType() + " 模板 → 填充变量 {count=" + incompleteCount + "} {rate=" + rate + "} → \"" + title + "\"");

        return content;
    }

    private String fillTemplate(String tpl, int rate, int count, int minutes, int percentile, String reward) {
        if (tpl == null || tpl.isEmpty()) return "";
        return tpl.replace("{rate}", String.valueOf(rate))
                  .replace("{count}", String.valueOf(count))
                  .replace("{minutes}", String.valueOf(minutes))
                  .replace("{percentile}", String.valueOf(percentile))
                  .replace("{reward}", reward);
    }

    private String getDefaultTitle(String userType, int count, int rate) {
        return switch (userType) {
            case "SELF_DRIVEN" -> "🏆 今日完成率 " + rate + "%，继续保持！";
            case "NEED_REMINDER" -> "📚 你还有 " + count + " 项任务未完成";
            case "DROPOUT" -> "🎁 连续学习 3 天可获「学霸徽章」奖励";
            default -> "📚 你还有 " + count + " 项任务等待完成";
        };
    }

    private PushTemplateEntity selectTemplate(UserEntity user) {
        List<PushTemplateEntity> matched = templateRepository.findByTargetUserTypeAndIsActiveTrue(user.getUserType());
        if (!matched.isEmpty()) return matched.get(0);
        List<PushTemplateEntity> general = templateRepository.findByTargetUserTypeIsNullAndIsActiveTrue();
        return general.isEmpty() ? null : general.get(0);
    }

    // ========== 频次控制 ==========

    private Map<String, Object> buildFrequencyResult(UserEntity user) {
        String dailyKey = KEY_DAILY_COUNT + user.getId() + ":" + LocalDate.now();
        String dailyStr = redisTemplate.opsForValue().get(dailyKey);
        int dailyCount = dailyStr != null ? Integer.parseInt(dailyStr) : 0;
        int limit = engineConfig.getLimits().getLimit(user.getUserType());
        boolean limitOk = dailyCount < limit;

        boolean quietHours = timingDecision.isInQuietHours();
        boolean online = "online".equals(redisTemplate.opsForValue().get(KEY_ONLINE + user.getId()));

        String lastPushStr = redisTemplate.opsForValue().get(KEY_LAST_PUSH + user.getId());
        boolean intervalOk = true;
        String intervalDetail;
        if (lastPushStr != null) {
            LocalDateTime lastPush = LocalDateTime.parse(lastPushStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            long hoursSinceLast = Duration.between(lastPush, LocalDateTime.now()).toHours();
            intervalOk = hoursSinceLast >= engineConfig.getMinIntervalHours();
            intervalDetail = "最小间隔 " + engineConfig.getMinIntervalHours() + " 小时，上次推送在 " + hoursSinceLast + " 小时前";
        } else {
            intervalDetail = "最小间隔 " + engineConfig.getMinIntervalHours() + " 小时，无上次推送记录";
        }

        boolean allPassed = limitOk && intervalOk && !quietHours && !online;

        List<Map<String, Object>> checks = new ArrayList<>();
        checks.add(Map.of("name", "每日限额检查", "passed", limitOk,
                "detail", "每日上限 " + limit + " 条，当前已发 " + dailyCount + " 条"));
        checks.add(Map.of("name", "最小间隔检查", "passed", intervalOk, "detail", intervalDetail));
        checks.add(Map.of("name", "免打扰时段", "passed", !quietHours,
                "detail", quietHours
                        ? "当前处于 " + engineConfig.getQuietHoursStart() + "-" + engineConfig.getQuietHoursEnd() + " 免打扰时段内"
                        : "当前时间不在 " + engineConfig.getQuietHoursStart() + "-" + engineConfig.getQuietHoursEnd() + " 免打扰范围内"));
        checks.add(Map.of("name", "在线状态检查", "passed", !online,
                "detail", online ? "用户当前在线，跳过推送" : "用户当前不在线"));

        Map<String, Object> frequency = new LinkedHashMap<>();
        frequency.put("checks", checks);
        frequency.put("result", allPassed ? "✅ 允许发送" : "❌ 拒绝发送");
        return frequency;
    }
}
