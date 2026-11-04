package com.reminder.abtest;

import com.reminder.common.BusinessException;
import com.reminder.notification.NotificationLogRepository;
import com.reminder.task.TaskRepository;
import com.reminder.user.UserEntity;
import com.reminder.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class ExperimentService {

    private final ExperimentRepository experimentRepository;
    private final ExperimentGroupRepository groupRepository;
    private final AssignmentRepository assignmentRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public ExperimentService(ExperimentRepository experimentRepository,
                              ExperimentGroupRepository groupRepository,
                              AssignmentRepository assignmentRepository,
                              NotificationLogRepository notificationLogRepository,
                              TaskRepository taskRepository,
                              UserRepository userRepository) {
        this.experimentRepository = experimentRepository;
        this.groupRepository = groupRepository;
        this.assignmentRepository = assignmentRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    // ── 实验管理 ──

    public List<ExperimentEntity> listExperiments() {
        return experimentRepository.findByOrderByCreatedAtDesc();
    }

    public ExperimentEntity getExperiment(Long id) {
        return experimentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("实验不存在"));
    }

    public ExperimentEntity createExperiment(String name, String description, String targetUserType) {
        ExperimentEntity exp = new ExperimentEntity();
        exp.setName(name);
        exp.setDescription(description);
        exp.setTargetUserType(targetUserType);
        exp.setStatus("DRAFT");
        return experimentRepository.save(exp);
    }

    public ExperimentEntity updateStatus(Long id, String status) {
        ExperimentEntity exp = getExperiment(id);
        exp.setStatus(status);
        if ("RUNNING".equals(status)) {
            exp.setStartedAt(java.time.LocalDateTime.now());
            // 启动时自动分流所有匹配用户
            assignAllUsers(exp);
        } else if ("COMPLETED".equals(status)) {
            exp.setEndedAt(java.time.LocalDateTime.now());
        }
        return experimentRepository.save(exp);
    }

    private void assignAllUsers(ExperimentEntity exp) {
        List<UserEntity> users;
        String targetType = exp.getTargetUserType();
        if (targetType != null && !targetType.isEmpty()) {
            users = userRepository.findByUserType(targetType);
        } else {
            users = userRepository.findAll();
        }
        for (UserEntity user : users) {
            try {
                assignUserToGroup(user.getId(), exp.getId());
            } catch (Exception ignored) {
                // 单个用户分配失败不影响其他用户
            }
        }
    }

    // ── 分组管理 ──

    public List<ExperimentGroupEntity> getGroups(Long experimentId) {
        return groupRepository.findByExperimentId(experimentId);
    }

    public ExperimentGroupEntity createGroup(Long experimentId, String groupName,
                                               String configJson, int trafficPercent) {
        ExperimentGroupEntity group = new ExperimentGroupEntity();
        group.setExperimentId(experimentId);
        group.setGroupName(groupName);
        group.setConfigJson(configJson);
        group.setTrafficPercent(trafficPercent);
        group.setUserCount(0);
        return groupRepository.save(group);
    }

    // ── 用户分流 ──

    public String assignUserToGroup(String userId, Long experimentId) {
        // 已分配则直接返回
        Optional<AssignmentEntity> existing = assignmentRepository
                .findByUserIdAndExperimentId(userId, experimentId);
        if (existing.isPresent()) {
            return existing.get().getGroupName();
        }

        // hash 分流
        ExperimentEntity exp = getExperiment(experimentId);
        List<ExperimentGroupEntity> groups = groupRepository.findByExperimentId(experimentId);
        if (groups.isEmpty()) {
            throw new BusinessException("实验无分组");
        }

        // hash 分流：乘素数 31 + 实验 ID 打破连续 userId 的线性相关性
        int hash = Math.abs(userId.hashCode() * 31 + experimentId.intValue()) % 100;
        int cumulative = 0;
        String assignedGroup = groups.get(0).getGroupName();

        for (ExperimentGroupEntity group : groups) {
            cumulative += group.getTrafficPercent();
            if (hash < cumulative) {
                assignedGroup = group.getGroupName();
                break;
            }
        }

        final String finalGroup = assignedGroup;

        // 记录分配
        AssignmentEntity assignment = new AssignmentEntity();
        assignment.setUserId(userId);
        assignment.setExperimentId(experimentId);
        assignment.setGroupName(finalGroup);
        assignmentRepository.save(assignment);

        // 更新计数
        groupRepository.findByExperimentIdAndGroupName(experimentId, finalGroup)
                .ifPresent(g -> {
                    g.setUserCount((int) assignmentRepository
                            .countByExperimentIdAndGroupName(experimentId, finalGroup));
                    groupRepository.save(g);
                });

        return assignedGroup;
    }

    public void deleteExperiment(Long id) {
        ExperimentEntity exp = getExperiment(id);
        // 级联删除分组和分配记录
        groupRepository.findByExperimentId(id).forEach(g ->
                groupRepository.delete(g));
        assignmentRepository.findByExperimentId(id).forEach(a ->
                assignmentRepository.delete(a));
        experimentRepository.delete(exp);
    }

    // ── 统计 ──

    public Map<String, Object> getExperimentReport(Long experimentId) {
        ExperimentEntity exp = getExperiment(experimentId);
        List<ExperimentGroupEntity> groups = groupRepository.findByExperimentId(experimentId);
        LocalDate weekAgo = LocalDate.now().minusDays(7);

        List<Map<String, Object>> groupReports = new ArrayList<>();
        for (ExperimentGroupEntity group : groups) {
            List<String> userIds = assignmentRepository.findUserIdsByExperimentIdAndGroupName(experimentId, group.getGroupName());

            double openRate = 0;
            double completionRate = 0;

            if (!userIds.isEmpty()) {
                long totalNotifs = notificationLogRepository.countByUserIds(userIds);
                long openedNotifs = notificationLogRepository.countByUserIdsAndStatus(userIds, "opened");
                openRate = totalNotifs > 0 ? Math.round(openedNotifs * 1000.0 / totalNotifs) / 10.0 : 0;

                long totalTasks = taskRepository.countTotalSinceForUsers(userIds, weekAgo);
                long completedTasks = taskRepository.countCompletedSinceForUsers(userIds, weekAgo);
                completionRate = totalTasks > 0 ? Math.round(completedTasks * 1000.0 / totalTasks) / 10.0 : 0;
            }

            Map<String, Object> g = new LinkedHashMap<>();
            g.put("groupName", group.getGroupName());
            g.put("trafficPercent", group.getTrafficPercent());
            g.put("userCount", userIds.size());
            g.put("openRate", openRate);
            g.put("completionRate", completionRate);
            groupReports.add(g);
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("experiment", exp);
        report.put("groups", groupReports);
        return report;
    }
}
