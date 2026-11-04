package com.reminder.engine;

import com.reminder.notification.PushTemplateEntity;
import com.reminder.user.UserEntity;
import org.springframework.stereotype.Service;

/**
 * 内容生成模块：基于模板生成个性化推送文案
 */
@Service
public class ContentGenerator {

    /**
     * 根据用户信息和实际任务数据生成推送内容
     */
    public PushContent generate(UserEntity user, PushTemplateEntity template,
                                int incompleteCount, int estimatedMinutes, int percentile) {
        int rate = (int) (user.getWeeklyCompletionRate().doubleValue() * 100);

        String title = template != null ? template.getTitleTemplate() : getDefaultTitle(user.getUserType(), incompleteCount, rate);
        String body = template != null ? template.getBodyTemplate() : "";

        title = fillTemplate(title, rate, incompleteCount, estimatedMinutes, percentile, "额外积分奖励");
        body = fillTemplate(body, rate, incompleteCount, estimatedMinutes, percentile, "额外积分奖励");

        return new PushContent(title, body);
    }

    private String fillTemplate(String template, int rate, int count, int minutes, int percentile, String reward) {
        if (template == null) return "";
        return template.replace("{rate}", String.valueOf(rate))
                .replace("{count}", String.valueOf(count))
                .replace("{minutes}", String.valueOf(minutes))
                .replace("{percentile}", String.valueOf(percentile))
                .replace("{reward}", reward);
    }

    private String getDefaultTitle(String userType, int count, int rate) {
        return switch (userType) {
            case "SELF_DRIVEN" -> "🏆 今日完成率 " + rate + "%，继续保持！";
            case "NEED_REMINDER" -> "📚 你还有 " + count + " 项任务未完成";
            case "DROPOUT" -> "🎁 连续学习 3 天可获「学霸徽章」奖励";
            default -> "📚 你还有 " + count + " 项任务等待完成";
        };
    }

    public record PushContent(String title, String body) {}
}
