package com.reminder.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "reminder.engine")
public class EngineConfig {

    private long scanInterval = 300000;
    private String quietHoursStart = "21:30";
    private String quietHoursEnd = "07:00";
    private int minIntervalHours = 2;
    private String defaultSlot = "19:00-21:00";

    // ── 各类型每日限额 ──
    private Limits limits = new Limits();

    public long getScanInterval() { return scanInterval; }
    public void setScanInterval(long scanInterval) { this.scanInterval = scanInterval; }

    public String getQuietHoursStart() { return quietHoursStart; }
    public void setQuietHoursStart(String quietHoursStart) { this.quietHoursStart = quietHoursStart; }

    public String getQuietHoursEnd() { return quietHoursEnd; }
    public void setQuietHoursEnd(String quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }

    public int getMinIntervalHours() { return minIntervalHours; }
    public void setMinIntervalHours(int minIntervalHours) { this.minIntervalHours = minIntervalHours; }

    public String getDefaultSlot() { return defaultSlot; }
    public void setDefaultSlot(String defaultSlot) { this.defaultSlot = defaultSlot; }

    public Limits getLimits() { return limits; }
    public void setLimits(Limits limits) { this.limits = limits; }

    public static class Limits {
        private int selfDriven = 1;
        private int needReminder = 2;
        private int dropout = 3;

        public int getSelfDriven() { return selfDriven; }
        public void setSelfDriven(int selfDriven) { this.selfDriven = selfDriven; }

        public int getNeedReminder() { return needReminder; }
        public void setNeedReminder(int needReminder) { this.needReminder = needReminder; }

        public int getDropout() { return dropout; }
        public void setDropout(int dropout) { this.dropout = dropout; }

        public int getLimit(String userType) {
            return switch (userType) {
                case "SELF_DRIVEN" -> selfDriven;
                case "NEED_REMINDER" -> needReminder;
                case "DROPOUT" -> dropout;
                default -> needReminder;
            };
        }
    }
}
