package com.reminder.event;

import com.reminder.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/events")
public class BehaviorEventController {

    private final BehaviorEventService eventService;

    public BehaviorEventController(BehaviorEventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public Result<BehaviorEventEntity> record(@RequestBody Map<String, Object> body) {
        String userId = (String) body.get("userId");
        String eventType = (String) body.get("eventType");
        @SuppressWarnings("unchecked")
        Map<String, Object> eventData = (Map<String, Object>) body.get("eventData");
        return Result.success(eventService.recordEvent(userId, eventType, eventData));
    }
}
