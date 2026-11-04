package com.reminder.user;

import com.reminder.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public Result<LoginResponse> register(@RequestBody Map<String, String> body) {
        UserEntity user = userService.register(
                body.get("username"), body.get("password"), body.get("realName"));
        String token = java.util.Base64.getEncoder()
                .encodeToString((user.getId() + ":" + System.currentTimeMillis()).getBytes());
        return Result.success("注册成功", new LoginResponse(token, user.getId(), user.getUserType()));
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody Map<String, String> body) {
        UserEntity user = userService.login(body.get("username"), body.get("password"));
        String token = java.util.Base64.getEncoder()
                .encodeToString((user.getId() + ":" + System.currentTimeMillis()).getBytes());
        return Result.success("登录成功", new LoginResponse(token, user.getId(), user.getUserType()));
    }

    @GetMapping("/{id}")
    public Result<UserEntity> getById(@PathVariable String id) {
        return Result.success(userService.getById(id));
    }

    @GetMapping
    public Result<java.util.List<UserEntity>> list(@RequestParam(required = false) String type) {
        if (type != null) {
            return Result.success(userService.getByType(type));
        }
        return Result.success(userService.getAll());
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        return Result.success(userService.getStats());
    }

    @PutMapping("/{id}/type")
    public Result<UserEntity> updateType(@PathVariable String id, @RequestBody Map<String, String> body) {
        return Result.success(userService.updateType(id, body.get("userType")));
    }

    @PutMapping("/{id}/settings")
    public Result<UserEntity> updateSettings(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Boolean pushEnabled = body.containsKey("pushEnabled") ? (Boolean) body.get("pushEnabled") : null;
        String slot = (String) body.get("activeTimeSlot");
        return Result.success(userService.updateSettings(id, pushEnabled, slot));
    }

    @PostMapping("/{id}/activity")
    public Result<Void> recordActivity(@PathVariable String id) {
        userService.recordActivity(id);
        return Result.success(null);
    }
}
