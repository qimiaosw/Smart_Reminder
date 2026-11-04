package com.reminder.engine;

import com.reminder.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/engine")
public class EngineController {

    private final EngineSimulationService engineSimulationService;

    public EngineController(EngineSimulationService engineSimulationService) {
        this.engineSimulationService = engineSimulationService;
    }

    @PostMapping("/simulate/{userId}")
    public Result<Map<String, Object>> simulate(@PathVariable String userId) {
        return Result.success(engineSimulationService.simulate(userId));
    }
}
