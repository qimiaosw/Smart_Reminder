package com.reminder.task;

import com.reminder.common.BusinessException;
import com.reminder.common.TaskStatus;
import com.reminder.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final RabbitTemplate rabbitTemplate;

    public TaskService(TaskRepository taskRepository, SubtaskRepository subtaskRepository,
                       RabbitTemplate rabbitTemplate) {
        this.taskRepository = taskRepository;
        this.subtaskRepository = subtaskRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    // ── 任务 ──

    public List<TaskEntity> getDailyTasks(String userId, LocalDate date) {
        return taskRepository.findByUserIdAndTaskDateOrderByCreatedAt(userId, date);
    }

    public TaskEntity getById(String id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new BusinessException("任务不存在"));
    }

    public TaskEntity create(String userId, LocalDate taskDate, String title, String description) {
        TaskEntity task = new TaskEntity();
        task.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        task.setUserId(userId);
        task.setTaskDate(taskDate);
        task.setTitle(title);
        task.setDescription(description);
        task.setStatus(TaskStatus.PENDING);
        return taskRepository.save(task);
    }

    public TaskEntity complete(String id) {
        TaskEntity task = getById(id);
        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());
        TaskEntity saved = taskRepository.save(task);

        // 发送任务完成事件到 RabbitMQ，触发画像更新 & 自律型推送
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_EVENT,
                RabbitMQConfig.RK_USER_BEHAVIOR,
                Map.of("userId", task.getUserId(),
                       "eventType", "complete_task",
                       "eventData", Map.of("taskId", task.getId(), "title", task.getTitle()),
                       "timestamp", LocalDateTime.now().toString()));

        return saved;
    }

    // ── 微任务 ──

    public List<SubtaskEntity> getSubtasks(String taskId) {
        return subtaskRepository.findByTaskIdOrderBySortOrder(taskId);
    }

    public SubtaskEntity createSubtask(String taskId, String title, int minutes, int sort) {
        SubtaskEntity sub = new SubtaskEntity();
        sub.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        sub.setTaskId(taskId);
        sub.setTitle(title);
        sub.setEstimatedMinutes(minutes);
        sub.setSortOrder(sort);
        sub.setCompleted(false);
        return subtaskRepository.save(sub);
    }

    public SubtaskEntity completeSubtask(String id) {
        SubtaskEntity sub = subtaskRepository.findById(id)
                .orElseThrow(() -> new BusinessException("微任务不存在"));
        sub.setCompleted(true);
        sub.setCompletedAt(LocalDateTime.now());
        SubtaskEntity saved = subtaskRepository.save(sub);

        // 发送微任务完成事件
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_EVENT,
                RabbitMQConfig.RK_USER_BEHAVIOR,
                Map.of("userId", getById(sub.getTaskId()).getUserId(),
                       "eventType", "complete_subtask",
                       "eventData", Map.of("subtaskId", sub.getId(), "title", sub.getTitle()),
                       "timestamp", LocalDateTime.now().toString()));

        // 检查是否所有微任务都完成了 → 自动完成父任务
        long completedCount = subtaskRepository.countByTaskIdAndCompletedTrue(sub.getTaskId());
        List<SubtaskEntity> all = subtaskRepository.findByTaskIdOrderBySortOrder(sub.getTaskId());
        if (completedCount == all.size()) {
            TaskEntity task = getById(sub.getTaskId());
            task.setStatus(TaskStatus.COMPLETED);
            task.setCompletedAt(LocalDateTime.now());
            taskRepository.save(task);

            // 父任务自动完成时也发送事件
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_EVENT,
                    RabbitMQConfig.RK_USER_BEHAVIOR,
                    Map.of("userId", task.getUserId(),
                           "eventType", "complete_task",
                           "eventData", Map.of("taskId", task.getId(), "title", task.getTitle(), "autoCompleted", true),
                           "timestamp", LocalDateTime.now().toString()));
        }
        return saved;
    }

    // ── 统计 ──

    public Map<String, Object> getStats(String userId) {
        Map<String, Object> stats = new HashMap<>();
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);

        long todayTotal = taskRepository.countByUserIdAndTaskDate(userId, today);
        long todayCompleted = taskRepository.countByUserIdAndStatusAndTaskDate(
                userId, TaskStatus.COMPLETED, today);

        long weekTotal = taskRepository.countTotalSince(userId, weekAgo);
        long weekCompleted = taskRepository.countCompletedSince(userId, weekAgo);

        stats.put("todayTotal", todayTotal);
        stats.put("todayCompleted", todayCompleted);
        stats.put("todayRate", todayTotal == 0 ? 0 : (int) (todayCompleted * 100.0 / todayTotal));
        stats.put("weekTotal", weekTotal);
        stats.put("weekCompleted", weekCompleted);
        stats.put("weekRate", weekTotal == 0 ? 0 : (int) (weekCompleted * 100.0 / weekTotal));

        return stats;
    }
}
