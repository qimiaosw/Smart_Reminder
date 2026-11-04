package com.reminder.engine;

import com.reminder.config.EngineConfig;
import com.reminder.user.UserEntity;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

/**
 * 频次控制模块：检查推送是否超出限额/间隔/免打扰
 */
@Service
public class FrequencyControlService {

    private final StringRedisTemplate redisTemplate;
    private final EngineConfig engineConfig;
    private final TimingDecisionService timingDecision;

    // Redis key 前缀
    private static final String KEY_DAILY_COUNT = "push:daily:";
    private static final String KEY_LAST_PUSH = "push:last:";
    private static final String KEY_ONLINE = "user:online:";

    public FrequencyControlService(StringRedisTemplate redisTemplate,
                                    EngineConfig engineConfig,
                                    TimingDecisionService timingDecision) {
        this.redisTemplate = redisTemplate;
        this.engineConfig = engineConfig;
        this.timingDecision = timingDecision;
    }

    /**
     * 检查是否允许发送推送 —— 所有检查一次性完成
     * @return true = 可以发送
     */
    public boolean canSend(UserEntity user) {
        if (Boolean.FALSE.equals(user.getPushEnabled())) {
            return false;
        }

        // 1. 免打扰时段检查
        if (timingDecision.isInQuietHours()) {
            return false;
        }

        // 2. 用户在线检查
        String online = redisTemplate.opsForValue().get(KEY_ONLINE + user.getId());
        if ("online".equals(online)) {
            return false; // 在线不推送
        }

        // 3. 每日限额检查
        String dailyKey = KEY_DAILY_COUNT + user.getId() + ":" + LocalDate.now();
        String dailyStr = redisTemplate.opsForValue().get(dailyKey);
        int dailyCount = dailyStr != null ? Integer.parseInt(dailyStr) : 0;
        int limit = engineConfig.getLimits().getLimit(user.getUserType());
        if (dailyCount >= limit) {
            return false;
        }

        // 4. 最小间隔检查
        String lastPushStr = redisTemplate.opsForValue().get(KEY_LAST_PUSH + user.getId());
        if (lastPushStr != null) {
            LocalDateTime lastPush = LocalDateTime.parse(lastPushStr,
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            if (Duration.between(lastPush, LocalDateTime.now()).toHours()
                    < engineConfig.getMinIntervalHours()) {
                return false;
            }
        }

        return true;
    }

    /**
     * 推送发送后记录频控数据
     */
    public void recordPush(UserEntity user) {
        String dailyKey = KEY_DAILY_COUNT + user.getId() + ":" + LocalDate.now();
        redisTemplate.opsForValue().increment(dailyKey);
        // TTL 到当天结束
        long secondsUntilEnd = Duration.between(LocalDateTime.now(),
                LocalDateTime.of(LocalDate.now(), LocalTime.MAX)).getSeconds();
        redisTemplate.expire(dailyKey, secondsUntilEnd, TimeUnit.SECONDS);

        String lastKey = KEY_LAST_PUSH + user.getId();
        redisTemplate.opsForValue().set(lastKey,
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
    }

    /**
     * 更新用户在线状态（由前端心跳调用）
     */
    public void updateOnlineStatus(String userId, boolean online) {
        String key = KEY_ONLINE + userId;
        if (online) {
            redisTemplate.opsForValue().set(key, "online", 5, TimeUnit.MINUTES);
        } else {
            redisTemplate.delete(key);
        }
    }
}
