package com.reminder.abtest;

import com.reminder.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/abtest")
public class ExperimentController {

    private final ExperimentService experimentService;

    public ExperimentController(ExperimentService experimentService) {
        this.experimentService = experimentService;
    }

    @GetMapping("/experiments")
    public Result<List<ExperimentEntity>> listExperiments() {
        return Result.success(experimentService.listExperiments());
    }

    @GetMapping("/experiments/{id}")
    public Result<ExperimentEntity> getExperiment(@PathVariable Long id) {
        return Result.success(experimentService.getExperiment(id));
    }

    @PostMapping("/experiments")
    public Result<ExperimentEntity> createExperiment(@RequestBody Map<String, String> body) {
        return Result.success("创建成功", experimentService.createExperiment(
                body.get("name"), body.get("description"), body.get("targetUserType")));
    }

    @PutMapping("/experiments/{id}/status")
    public Result<ExperimentEntity> updateStatus(@PathVariable Long id,
                                                  @RequestBody Map<String, String> body) {
        return Result.success(experimentService.updateStatus(id, body.get("status")));
    }

    @GetMapping("/experiments/{id}/groups")
    public Result<List<ExperimentGroupEntity>> getGroups(@PathVariable Long id) {
        return Result.success(experimentService.getGroups(id));
    }

    @PostMapping("/experiments/{id}/groups")
    public Result<ExperimentGroupEntity> createGroup(@PathVariable Long id,
                                                      @RequestBody Map<String, Object> body) {
        return Result.success("创建成功", experimentService.createGroup(
                id,
                (String) body.get("groupName"),
                (String) body.get("configJson"),
                (int) body.getOrDefault("trafficPercent", 0)));
    }

    @PostMapping("/assign")
    public Result<Map<String, String>> assign(@RequestBody Map<String, String> body) {
        String group = experimentService.assignUserToGroup(
                body.get("userId"), Long.valueOf(body.get("experimentId")));
        return Result.success(Map.of("group", group));
    }

    @GetMapping("/experiments/{id}/report")
    public Result<Map<String, Object>> report(@PathVariable Long id) {
        return Result.success(experimentService.getExperimentReport(id));
    }

    @DeleteMapping("/experiments/{id}")
    public Result<Void> deleteExperiment(@PathVariable Long id) {
        experimentService.deleteExperiment(id);
        return Result.success(null);
    }
}
