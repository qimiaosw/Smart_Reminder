package com.reminder.user;

import com.reminder.common.BusinessException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserEntity register(String username, String password, String realName) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new BusinessException("用户名已存在");
        }
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRealName(realName);
        user.setUserType("COLD_START");
        user.setPushEnabled(true);
        user.setConsecutiveMissDays(0);
        user.setWeeklyCompletionRate(BigDecimal.ZERO);
        return userRepository.save(user);
    }

    public UserEntity login(String username, String password) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户名或密码错误"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }
        user.setLastActiveAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public UserEntity getById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    public List<UserEntity> getAll() {
        return userRepository.findAll();
    }

    public List<UserEntity> getByType(String userType) {
        return userRepository.findByUserType(userType);
    }

    public UserEntity updateType(String id, String userType) {
        UserEntity user = getById(id);
        user.setUserType(userType);
        return userRepository.save(user);
    }

    public UserEntity updateSettings(String id, Boolean pushEnabled, String activeTimeSlot) {
        UserEntity user = getById(id);
        if (pushEnabled != null) user.setPushEnabled(pushEnabled);
        if (activeTimeSlot != null) user.setActiveTimeSlot(activeTimeSlot);
        return userRepository.save(user);
    }

    public void recordActivity(String id) {
        userRepository.findById(id).ifPresent(user -> {
            user.setLastActiveAt(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    /**
     * 重新计算所有用户的分层标签（每天凌晨 3 点定时任务调用）
     *
     * 规则（按优先级）：
     *   1. 注册 < 7 天 → COLD_START（数据不足，不判定）
     *   2. 近 7 天完成率 ≥ 80% → SELF_DRIVEN
     *   3. 近 7 天完成率 40%–80% → NEED_REMINDER
     *   4. 近 7 天完成率 < 40% 或 连续 ≥ 3 天未完成 → DROPOUT
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 3 * * ?")
    public void recalculateAllSegments() {
        List<UserEntity> all = userRepository.findAll();
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);
        LocalDate today = LocalDate.now();

        for (UserEntity user : all) {
            // 注册不足 7 天 → 保持 COLD_START
            if (user.getCreatedAt() != null
                    && user.getCreatedAt().toLocalDate().isAfter(sevenDaysAgo)) {
                user.setUserType("COLD_START");
                continue;
            }

            BigDecimal rate = user.getWeeklyCompletionRate();
            int missDays = user.getConsecutiveMissDays() != null ? user.getConsecutiveMissDays() : 0;

            if (rate != null && rate.compareTo(new BigDecimal("0.8")) >= 0) {
                user.setUserType("SELF_DRIVEN");
            } else if (rate != null && rate.compareTo(new BigDecimal("0.4")) >= 0) {
                user.setUserType("NEED_REMINDER");
            } else {
                user.setUserType("DROPOUT");
            }
        }
        userRepository.saveAll(all);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        List<Object[]> counts = userRepository.countGroupByType();
        Map<String, Long> typeMap = new HashMap<>();
        for (Object[] row : counts) {
            typeMap.put((String) row[0], (Long) row[1]);
        }
        stats.put("total", userRepository.count());
        stats.put("byType", typeMap);
        return stats;
    }
}
