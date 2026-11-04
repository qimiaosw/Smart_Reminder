package com.reminder.engine;

import com.reminder.config.AIConfig;
import com.reminder.notification.PushTemplateEntity;
import com.reminder.notification.PushTemplateRepository;
import com.reminder.user.UserEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * AI 推送文案生成器 —— 调用本地 Ollama (qwen2.5:8b)
 * 当 reminder.ai.enabled=true 时生效，否则回退到模板生成
 */
@Service
public class AIContentGenerator {

    private static final Logger log = LoggerFactory.getLogger(AIContentGenerator.class);

    private final AIConfig aiConfig;
    private final RestTemplate restTemplate;
    private final ContentGenerator fallback;
    private final PushTemplateRepository templateRepository;

    public AIContentGenerator(AIConfig aiConfig, ContentGenerator fallback,
                              PushTemplateRepository templateRepository) {
        this.aiConfig = aiConfig;
        this.fallback = fallback;
        this.templateRepository = templateRepository;
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * 生成推送文案：AI 开启时走 AI，否则走模板
     */
    public ContentGenerator.PushContent generate(UserEntity user,
                                                  int incompleteCount, int estimatedMinutes, int percentile) {
        // 选择匹配的模板
        PushTemplateEntity template = selectTemplate(user);

        // 先用模板生成基础内容
        ContentGenerator.PushContent templateContent = fallback.generate(
                user, template, incompleteCount, estimatedMinutes, percentile);

        if (!aiConfig.isEnabled()) {
            return templateContent;
        }

        try {
            return generateWithAI(user);
        } catch (Exception e) {
            log.warn("AI 生成失败，回退到模板: {}", e.getMessage());
            return templateContent;
        }
    }

    private PushTemplateEntity selectTemplate(UserEntity user) {
        List<PushTemplateEntity> matched = templateRepository
                .findByTargetUserTypeAndIsActiveTrue(user.getUserType());
        if (!matched.isEmpty()) return matched.get(0);
        List<PushTemplateEntity> general = templateRepository
                .findByTargetUserTypeIsNullAndIsActiveTrue();
        return general.isEmpty() ? null : general.get(0);
    }

    private ContentGenerator.PushContent generateWithAI(UserEntity user) {
        String prompt = buildPrompt(user);

        Map<String, Object> request = Map.of(
                "model", aiConfig.getModel(),
                "prompt", prompt,
                "stream", false,
                "options", Map.of("temperature", aiConfig.getTemperature())
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(
                aiConfig.getEndpoint(), request, Map.class);

        if (response != null && response.containsKey("response")) {
            String text = (String) response.get("response");
            return parseResponse(text, user);
        }

        throw new RuntimeException("AI 返回为空");
    }

    private String buildPrompt(UserEntity user) {
        return String.format("""
            你是一个学习App的推送文案助手。请根据以下用户信息生成一条推送通知。
            要求：语气亲切，有激励感，不超过 50 个字，不要用 Markdown 格式。

            用户类型：%s
            真实姓名：%s
            今日任务完成率：%d%%
            连续未完成天数：%d

            请生成一条推送文案（标题 + 正文，用 | 分隔）：
            """,
                translateType(user.getUserType()),
                user.getRealName(),
                (int)(user.getWeeklyCompletionRate().doubleValue() * 100),
                user.getConsecutiveMissDays());
    }

    private ContentGenerator.PushContent parseResponse(String text, UserEntity user) {
        String[] parts = text.split("\\|");
        String title = parts.length > 0 ? parts[0].trim() : "你还有任务未完成";
        String body = parts.length > 1 ? parts[1].trim() : "现在开始吧";
        return new ContentGenerator.PushContent(title, body);
    }

    private String translateType(String type) {
        return switch (type) {
            case "SELF_DRIVEN" -> "自律型";
            case "NEED_REMINDER" -> "需提醒型";
            case "DROPOUT" -> "流失倾向型";
            default -> "新用户";
        };
    }
}
