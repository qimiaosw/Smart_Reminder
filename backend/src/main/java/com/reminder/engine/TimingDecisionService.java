package com.reminder.engine;

import com.reminder.config.EngineConfig;
import com.reminder.user.UserEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * 时机决策模块：决定何时发送推送
 */
@Service
public class TimingDecisionService {

    private final EngineConfig engineConfig;

    public TimingDecisionService(EngineConfig engineConfig) {
        this.engineConfig = engineConfig;
    }

    /**
     * 计算用户的最佳推送时间
     * @return null = 当前不需要推送
     */
    public LocalDateTime decideBestTime(UserEntity user) {
        if (Boolean.FALSE.equals(user.getPushEnabled())) {
            return null; // 用户关了通知
        }

        String userType = user.getUserType();
        String slot = user.getActiveTimeSlot();

        // 有活跃时段 → 时段中点 - 30分钟
        if (slot != null && !slot.isBlank()) {
            return calculateSlotTime(slot);
        }

        // 冷启动 / 无活跃时段 → 按分层的默认策略
        return switch (userType) {
            case "SELF_DRIVEN" -> null; // 自律型不主动推送
            case "NEED_REMINDER" -> LocalDateTime.now().withHour(18).withMinute(0).withSecond(0);
            case "DROPOUT" -> LocalDateTime.now().withHour(18).withMinute(0).withSecond(0);
            default -> {
                String defaultSlot = engineConfig.getDefaultSlot();
                yield calculateSlotTime(defaultSlot);
            }
        };
    }

    private LocalDateTime calculateSlotTime(String slot) {
        try {
            String[] parts = slot.split("-");
            LocalTime start = LocalTime.parse(parts[0], DateTimeFormatter.ofPattern("HH:mm"));
            LocalTime end = LocalTime.parse(parts[1], DateTimeFormatter.ofPattern("HH:mm"));
            // 时段中点 - 30分钟
            long midpointSeconds = (start.toSecondOfDay() + end.toSecondOfDay()) / 2;
            LocalTime pushTime = LocalTime.ofSecondOfDay(midpointSeconds).minusMinutes(30);
            return LocalDateTime.now().with(pushTime);
        } catch (Exception e) {
            return LocalDateTime.now().withHour(18).withMinute(0);
        }
    }

    /**
     * 检查当前是否在免打扰时段
     */
    public boolean isInQuietHours() {
        LocalTime now = LocalTime.now();
        LocalTime start = LocalTime.parse(engineConfig.getQuietHoursStart(),
                DateTimeFormatter.ofPattern("HH:mm"));
        LocalTime end = LocalTime.parse(engineConfig.getQuietHoursEnd(),
                DateTimeFormatter.ofPattern("HH:mm"));

        if (start.isBefore(end)) {
            return now.isAfter(start) && now.isBefore(end);
        } else {
            // 跨天：21:30 - 07:00
            return now.isAfter(start) || now.isBefore(end);
        }
    }
}
