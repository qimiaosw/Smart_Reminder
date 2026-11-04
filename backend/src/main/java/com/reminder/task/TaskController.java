package com.reminder.task;

import com.reminder.common.Result;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/daily/{userId}")
    public Result<List<TaskEntity>> getDaily(@PathVariable String userId,
                                              @RequestParam(required = false) String date) {
        LocalDate d = date != null ? LocalDate.parse(date) : LocalDate.now();
        return Result.success(taskService.getDailyTasks(userId, d));
    }

    @GetMapping("/{id}")
    public Result<TaskEntity> getById(@PathVariable String id) {
        return Result.success(taskService.getById(id));
    }

    @PostMapping
    public Result<TaskEntity> create(@RequestBody Map<String, Object> body) {
        TaskEntity task = taskService.create(
                (String) body.get("userId"),
                LocalDate.parse((String) body.get("taskDate")),
                (String) body.get("title"),
                (String) body.get("description"));
        return Result.success("创建成功", task);
    }

    @PostMapping("/{id}/complete")
    public Result<TaskEntity> complete(@PathVariable String id) {
        return Result.success(taskService.complete(id));
    }

    // ── 微任务 ──

    @GetMapping("/{taskId}/subtasks")
    public Result<List<SubtaskEntity>> getSubtasks(@PathVariable String taskId) {
        return Result.success(taskService.getSubtasks(taskId));
    }

    @PostMapping("/{taskId}/subtasks")
    public Result<SubtaskEntity> createSubtask(@PathVariable String taskId,
                                                @RequestBody Map<String, Object> body) {
        SubtaskEntity sub = taskService.createSubtask(
                taskId,
                (String) body.get("title"),
                (int) body.getOrDefault("minutes", 5),
                (int) body.getOrDefault("sort", 0));
        return Result.success("创建成功", sub);
    }

    @PostMapping("/subtasks/{id}/complete")
    public Result<SubtaskEntity> completeSubtask(@PathVariable String id) {
        return Result.success(taskService.completeSubtask(id));
    }

    // ── 统计 ──

    @GetMapping("/stats/{userId}")
    public Result<Map<String, Object>> stats(@PathVariable String userId) {
        return Result.success(taskService.getStats(userId));
    }
}
