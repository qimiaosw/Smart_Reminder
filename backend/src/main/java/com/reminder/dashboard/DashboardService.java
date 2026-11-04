package com.reminder.dashboard;

import com.reminder.notification.NotificationLogEntity;
import com.reminder.notification.NotificationLogRepository;
import com.reminder.task.TaskEntity;
import com.reminder.task.TaskRepository;
import com.reminder.user.UserEntity;
import com.reminder.user.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final TaskRepository taskRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final UserRepository userRepository;

    public DashboardService(TaskRepository taskRepository,
                            NotificationLogRepository notificationLogRepository,
                            UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getWeeklyTrend() {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(6);
        String[] dayNames = {"周一", "周二", "周三", "周四", "周五", "周六", "周日"};

        List<TaskEntity> tasks = taskRepository.findByTaskDateBetweenOrderByTaskDateAsc(weekAgo, today);
        List<NotificationLogEntity> notifs = notificationLogRepository.findByCreatedAtBetweenOrderByCreatedAtAsc(
                weekAgo.atStartOfDay(), today.plusDays(1).atStartOfDay());

        Map<LocalDate, List<TaskEntity>> tasksByDate = tasks.stream()
                .collect(Collectors.groupingBy(TaskEntity::getTaskDate));
        Map<LocalDate, List<NotificationLogEntity>> notifsByDate = notifs.stream()
                .collect(Collectors.groupingBy(n -> n.getCreatedAt().toLocalDate()));

        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = weekAgo.plusDays(i);

            List<TaskEntity> dayTasks = tasksByDate.getOrDefault(date, Collections.emptyList());
            long total = dayTasks.size();
            long completed = dayTasks.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();
            int completionRate = total > 0 ? (int) (completed * 100 / total) : 0;

            List<NotificationLogEntity> dayNotifs = notifsByDate.getOrDefault(date, Collections.emptyList());
            long totalN = dayNotifs.size();
            long openedN = dayNotifs.stream().filter(n -> "opened".equals(n.getStatus())).count();
            int openRate = totalN > 0 ? (int) (openedN * 100 / totalN) : 0;

            Map<String, Object> day = new LinkedHashMap<>();
            day.put("day", dayNames[i]);
            day.put("completionRate", completionRate);
            day.put("openRate", openRate);
            trend.add(day);
        }

        return trend;
    }

    public List<Map<String, Object>> getTodayTimeline() {
        LocalDate today = LocalDate.now();
        List<NotificationLogEntity> notifs = notificationLogRepository.findByCreatedAtBetweenOrderByCreatedAtAsc(
                today.atStartOfDay(), today.plusDays(1).atStartOfDay());

        Map<String, UserEntity> userCache = new HashMap<>();

        List<Map<String, Object>> timeline = new ArrayList<>();
        for (NotificationLogEntity n : notifs) {
            UserEntity user = userCache.computeIfAbsent(n.getUserId(), id ->
                    userRepository.findById(id).orElse(null));
            if (user == null) continue;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("time", n.getSentAt() != null
                    ? n.getSentAt().format(DateTimeFormatter.ofPattern("HH:mm"))
                    : n.getScheduledAt() != null
                    ? n.getScheduledAt().format(DateTimeFormatter.ofPattern("HH:mm"))
                    : "--:--");
            entry.put("user", user.getRealName());
            entry.put("type", user.getUserType());
            entry.put("content", n.getTitle());
            String statusLabel = switch (n.getStatus()) {
                case "opened" -> "已读";
                case "delivered" -> "已送达";
                case "sent" -> "已发送";
                default -> "待发送";
            };
            entry.put("status", statusLabel);
            entry.put("detail", n.getBody());
            timeline.add(entry);
        }

        timeline.sort((a, b) -> ((String) a.get("time")).compareTo((String) b.get("time")));
        return timeline;
    }
}
