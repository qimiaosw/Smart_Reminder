package com.reminder.dashboard;

import com.reminder.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/trend")
    public Result<List<Map<String, Object>>> getWeeklyTrend() {
        return Result.success(dashboardService.getWeeklyTrend());
    }

    @GetMapping("/timeline")
    public Result<List<Map<String, Object>>> getTodayTimeline() {
        return Result.success(dashboardService.getTodayTimeline());
    }
}
