package com.reminder.notification;

import com.reminder.common.BusinessException;
import com.reminder.common.NotificationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class NotificationService {

    private final NotificationLogRepository logRepository;
    private final PushTemplateRepository templateRepository;

    public NotificationService(NotificationLogRepository logRepository,
                                PushTemplateRepository templateRepository) {
        this.logRepository = logRepository;
        this.templateRepository = templateRepository;
    }

    // ── 推送模板 ──

    public List<PushTemplateEntity> getActiveTemplates() {
        return templateRepository.findByIsActiveTrue();
    }

    public PushTemplateEntity getTemplateById(String id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("模板不存在"));
    }

    public PushTemplateEntity createTemplate(PushTemplateEntity template) {
        return templateRepository.save(template);
    }

    // ── 推送日志 ──

    public List<NotificationLogEntity> getHistory(String userId) {
        return logRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return logRepository.countByUserIdAndStatus(userId, NotificationStatus.SENT);
    }

    public NotificationLogEntity createNotification(String userId, String templateId,
                                                      String title, String body,
                                                      Long experimentId) {
        NotificationLogEntity log = new NotificationLogEntity();
        log.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        log.setUserId(userId);
        log.setTemplateId(templateId);
        log.setTitle(title);
        log.setBody(body);
        log.setExperimentId(experimentId);
        log.setChannel("push");
        log.setStatus(NotificationStatus.PENDING);
        log.setScheduledAt(LocalDateTime.now());
        return logRepository.save(log);
    }

    public void markSent(String id) {
        logRepository.findById(id).ifPresent(log -> {
            log.setStatus(NotificationStatus.SENT);
            log.setSentAt(LocalDateTime.now());
            logRepository.save(log);
        });
    }

    public void markDelivered(String id) {
        logRepository.findById(id).ifPresent(log -> {
            log.setStatus(NotificationStatus.DELIVERED);
            log.setDeliveredAt(LocalDateTime.now());
            logRepository.save(log);
        });
    }

    public void markOpened(String id) {
        logRepository.findById(id).ifPresent(log -> {
            log.setStatus(NotificationStatus.OPENED);
            log.setOpenedAt(LocalDateTime.now());
            logRepository.save(log);
        });
    }

    // ── 统计 ──

    public Map<String, Object> getStats(String userId) {
        List<NotificationLogEntity> logs = logRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long total = logs.size();
        long opened = logs.stream().filter(l -> NotificationStatus.OPENED.equals(l.getStatus())).count();
        long delivered = logs.stream().filter(l ->
                NotificationStatus.DELIVERED.equals(l.getStatus())
                || NotificationStatus.OPENED.equals(l.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("delivered", delivered);
        stats.put("opened", opened);
        stats.put("openRate", total == 0 ? 0 : (int) (opened * 100.0 / total));
        stats.put("deliverRate", total == 0 ? 0 : (int) (delivered * 100.0 / total));
        return stats;
    }
}
