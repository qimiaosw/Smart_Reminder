package com.reminder.notification;

import com.reminder.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/history/{userId}")
    public Result<List<NotificationLogEntity>> history(@PathVariable String userId) {
        return Result.success(notificationService.getHistory(userId));
    }

    @GetMapping("/unread/{userId}")
    public Result<Map<String, Long>> unread(@PathVariable String userId) {
        long count = notificationService.getUnreadCount(userId);
        return Result.success(Map.of("count", count));
    }

    @GetMapping("/stats/{userId}")
    public Result<Map<String, Object>> stats(@PathVariable String userId) {
        return Result.success(notificationService.getStats(userId));
    }

    // ── 推送回执回调（内部接口） ──

    @PostMapping("/callback/delivered")
    public Result<Void> callbackDelivered(@RequestBody Map<String, String> body) {
        notificationService.markDelivered(body.get("notificationId"));
        return Result.success(null);
    }

    @PostMapping("/callback/opened")
    public Result<Void> callbackOpened(@RequestBody Map<String, String> body) {
        notificationService.markOpened(body.get("notificationId"));
        return Result.success(null);
    }

    // ── 模板管理 ──

    @GetMapping("/templates")
    public Result<List<PushTemplateEntity>> templates() {
        return Result.success(notificationService.getActiveTemplates());
    }

    @PostMapping("/templates")
    public Result<PushTemplateEntity> createTemplate(@RequestBody PushTemplateEntity template) {
        return Result.success("创建成功", notificationService.createTemplate(template));
    }
}
