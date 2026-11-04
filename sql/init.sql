-- ============================================================
-- 智能提醒系统 - 数据库初始化脚本（增强版数据）
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_reminder
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE smart_reminder;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY COMMENT '用户 ID',
    username VARCHAR(100) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(BCrypt)',
    real_name VARCHAR(100) COMMENT '真实姓名',
    user_type VARCHAR(20) NOT NULL DEFAULT 'COLD_START' COMMENT '用户分层: SELF_DRIVEN / NEED_REMINDER / DROPOUT / COLD_START',
    push_enabled TINYINT(1) DEFAULT 1 COMMENT '是否开启推送',
    push_token VARCHAR(255) COMMENT '厂商推送 Token',
    active_time_slot VARCHAR(20) COMMENT '活跃时段, 如 19:00-21:00',
    consecutive_miss_days INT DEFAULT 0 COMMENT '连续未完成任务天数',
    weekly_completion_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '近7天完成率',
    last_active_at DATETIME COMMENT '最后活跃时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL COMMENT '软删时间',
    version INT DEFAULT 0 COMMENT '乐观锁',
    INDEX idx_user_type (user_type),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 清空旧数据
DELETE FROM ab_test_assignments;
DELETE FROM ab_test_groups;
DELETE FROM ab_test_experiments;
DELETE FROM user_behavior_events;
DELETE FROM push_templates;
DELETE FROM notification_logs;
DELETE FROM subtasks;
DELETE FROM daily_tasks;
DELETE FROM users;

INSERT INTO users (id, username, password, real_name, user_type, push_enabled, active_time_slot, consecutive_miss_days, weekly_completion_rate, last_active_at) VALUES
-- 自律型（4人）：高完成率，规律活跃
('u_001', 'zhangsan',  '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '张三', 'SELF_DRIVEN',  1, '19:00-21:00', 0, 0.92, '2026-05-26 20:30:00'),
('u_005', 'zhaoyi',    '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '赵一', 'SELF_DRIVEN',  1, '20:00-22:00', 0, 0.88, '2026-05-26 21:15:00'),
('u_006', 'qianer',    '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '钱二', 'SELF_DRIVEN',  1, '16:00-18:00', 0, 0.95, '2026-05-26 17:45:00'),
('u_007', 'sunsi',     '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '孙四', 'SELF_DRIVEN',  1, '19:00-21:00', 0, 0.82, '2026-05-26 20:10:00'),

-- 需提醒型（4人）：中等完成率，需要推动
('u_002', 'lisi',      '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '李四', 'NEED_REMINDER', 1, '16:00-18:00', 2, 0.55, '2026-05-24 17:30:00'),
('u_008', 'zhouwu',    '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '周五', 'NEED_REMINDER', 1, '20:00-22:00', 1, 0.62, '2026-05-26 21:00:00'),
('u_009', 'wuliu',     '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '吴六', 'NEED_REMINDER', 1, '16:00-18:00', 3, 0.48, '2026-05-23 16:20:00'),
('u_010', 'zhengqi',   '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '郑七', 'NEED_REMINDER', 0, '19:00-21:00', 1, 0.58, '2026-05-26 19:30:00'),

-- 流失倾向型（3人）：很低完成率，连续多天未完成
('u_003', 'wangwu',    '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '王五', 'DROPOUT', 0, NULL,              5, 0.20, '2026-05-20 18:00:00'),
('u_011', 'chenba',    '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '陈八', 'DROPOUT', 0, '20:00-22:00',      6, 0.15, '2026-05-19 22:10:00'),
('u_012', 'yangjiu',   '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '杨九', 'DROPOUT', 0, NULL,              8, 0.10, '2026-05-17 14:00:00'),

-- 冷启动（1人）：新注册用户
('u_004', 'zhaoliu',   '$2a$10$P7M0lEIFHS2Y34CCa2Re8.LQqHfS.6XvBwirA8IwwQnId9yLVSSPe', '赵六', 'COLD_START', 1, NULL,              0, 0.00, '2026-05-26 12:00:00');

-- ============================================================
CREATE TABLE IF NOT EXISTS daily_tasks (
    id VARCHAR(32) PRIMARY KEY COMMENT '任务 ID',
    user_id VARCHAR(32) NOT NULL COMMENT '用户 ID',
    task_date DATE NOT NULL COMMENT '任务日期',
    title VARCHAR(200) NOT NULL COMMENT '任务标题',
    description TEXT COMMENT '任务描述',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态: PENDING / COMPLETED / EXPIRED',
    completed_at DATETIME COMMENT '完成时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    version INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_user_date_title (user_id, task_date, title(100)),
    INDEX idx_status (status),
    INDEX idx_task_date (task_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日任务表';

-- 2. 每日任务表 (7天: 2026-05-20 ~ 2026-05-26)
-- 对照组总完成率 ~60% | 实验组总完成率 ~72%
-- ============================================================

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_100', 'u_001', '2026-05-20', '生物练习题', '完成生物章节练习题', 'COMPLETED', '2026-05-20 16:01:00'),
  ('t_101', 'u_001', '2026-05-20', '历史作业', '历史课后作业', 'COMPLETED', '2026-05-20 16:13:00'),
  ('t_102', 'u_001', '2026-05-21', '历史复习', '复习历史重点知识', 'COMPLETED', '2026-05-21 17:32:00'),
  ('t_103', 'u_001', '2026-05-21', '数学试卷', '完成数学模拟试卷', 'COMPLETED', '2026-05-21 20:01:00'),
  ('t_104', 'u_001', '2026-05-22', '数学笔记整理', '整理数学课堂笔记', 'COMPLETED', '2026-05-22 20:12:00'),
  ('t_105', 'u_001', '2026-05-22', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-22 21:41:00'),
  ('t_106', 'u_001', '2026-05-23', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-23 21:34:00'),
  ('t_107', 'u_001', '2026-05-23', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-23 19:14:00'),
  ('t_108', 'u_001', '2026-05-24', '语文古诗词', '背诵并默写古诗词', 'COMPLETED', '2026-05-24 19:37:00'),
  ('t_109', 'u_001', '2026-05-24', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-24 18:51:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_110', 'u_001', '2026-05-25', '语文练习题', '完成语文章节练习题', 'PENDING', NULL),
  ('t_111', 'u_001', '2026-05-25', '英语作业', '英语课后作业', 'COMPLETED', '2026-05-25 22:00:00'),
  ('t_112', 'u_001', '2026-05-26', '英语复习', '复习英语重点知识', 'COMPLETED', '2026-05-26 08:44:00'),
  ('t_113', 'u_001', '2026-05-26', '生物试卷', '完成生物模拟试卷', 'COMPLETED', '2026-05-26 10:21:00'),
  ('t_114', 'u_005', '2026-05-20', '语文笔记整理', '整理语文课堂笔记', 'COMPLETED', '2026-05-20 20:07:00'),
  ('t_115', 'u_005', '2026-05-20', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-20 19:05:00'),
  ('t_116', 'u_005', '2026-05-21', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-21 20:18:00'),
  ('t_117', 'u_005', '2026-05-21', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-21 22:40:00'),
  ('t_118', 'u_005', '2026-05-22', '语文古诗词', '背诵并默写古诗词', 'PENDING', NULL),
  ('t_119', 'u_005', '2026-05-22', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-22 20:56:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_120', 'u_005', '2026-05-23', '历史练习题', '完成历史章节练习题', 'COMPLETED', '2026-05-23 22:23:00'),
  ('t_121', 'u_005', '2026-05-23', '数学作业', '数学课后作业', 'COMPLETED', '2026-05-23 20:12:00'),
  ('t_122', 'u_005', '2026-05-24', '数学复习', '复习数学重点知识', 'COMPLETED', '2026-05-24 21:04:00'),
  ('t_123', 'u_005', '2026-05-24', '物理试卷', '完成物理模拟试卷', 'COMPLETED', '2026-05-24 16:42:00'),
  ('t_124', 'u_005', '2026-05-25', '物理笔记整理', '整理物理课堂笔记', 'COMPLETED', '2026-05-25 17:49:00'),
  ('t_125', 'u_005', '2026-05-25', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-25 18:05:00'),
  ('t_126', 'u_005', '2026-05-26', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-26 08:55:00'),
  ('t_127', 'u_005', '2026-05-26', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-26 07:24:00'),
  ('t_128', 'u_006', '2026-05-20', '物理笔记整理', '整理物理课堂笔记', 'COMPLETED', '2026-05-20 20:46:00'),
  ('t_129', 'u_006', '2026-05-20', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-20 17:10:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_130', 'u_006', '2026-05-21', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-21 19:24:00'),
  ('t_131', 'u_006', '2026-05-21', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-21 18:59:00'),
  ('t_132', 'u_006', '2026-05-22', '语文古诗词', '背诵并默写古诗词', 'PENDING', NULL),
  ('t_133', 'u_006', '2026-05-22', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-22 21:44:00'),
  ('t_134', 'u_006', '2026-05-23', '英语练习题', '完成英语章节练习题', 'COMPLETED', '2026-05-23 20:14:00'),
  ('t_135', 'u_006', '2026-05-23', '生物作业', '生物课后作业', 'PENDING', NULL),
  ('t_136', 'u_006', '2026-05-24', '生物复习', '复习生物重点知识', 'COMPLETED', '2026-05-24 21:20:00'),
  ('t_137', 'u_006', '2026-05-24', '历史试卷', '完成历史模拟试卷', 'COMPLETED', '2026-05-24 22:49:00'),
  ('t_138', 'u_006', '2026-05-25', '历史笔记整理', '整理历史课堂笔记', 'COMPLETED', '2026-05-25 22:03:00'),
  ('t_139', 'u_006', '2026-05-25', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-25 17:52:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_140', 'u_006', '2026-05-26', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-26 07:51:00'),
  ('t_141', 'u_006', '2026-05-26', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-26 09:25:00'),
  ('t_142', 'u_007', '2026-05-20', '生物试卷', '完成生物模拟试卷', 'COMPLETED', '2026-05-20 17:47:00'),
  ('t_143', 'u_007', '2026-05-20', '历史笔记整理', '整理历史课堂笔记', 'COMPLETED', '2026-05-20 20:34:00'),
  ('t_144', 'u_007', '2026-05-21', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-21 18:47:00'),
  ('t_145', 'u_007', '2026-05-21', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-21 20:27:00'),
  ('t_146', 'u_007', '2026-05-22', '英语听力训练', '完成听力练习Section A-C', 'PENDING', NULL),
  ('t_147', 'u_007', '2026-05-22', '语文古诗词', '背诵并默写古诗词', 'COMPLETED', '2026-05-22 20:25:00'),
  ('t_148', 'u_007', '2026-05-23', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-23 18:14:00'),
  ('t_149', 'u_007', '2026-05-23', '化学练习题', '完成化学章节练习题', 'COMPLETED', '2026-05-23 17:32:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_150', 'u_007', '2026-05-24', '化学作业', '化学课后作业', 'COMPLETED', '2026-05-24 19:05:00'),
  ('t_151', 'u_007', '2026-05-24', '语文复习', '复习语文重点知识', 'COMPLETED', '2026-05-24 22:03:00'),
  ('t_152', 'u_007', '2026-05-25', '语文试卷', '完成语文模拟试卷', 'COMPLETED', '2026-05-25 22:07:00'),
  ('t_153', 'u_007', '2026-05-25', '英语笔记整理', '整理英语课堂笔记', 'COMPLETED', '2026-05-25 17:40:00'),
  ('t_154', 'u_007', '2026-05-26', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-26 08:50:00'),
  ('t_155', 'u_007', '2026-05-26', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-26 12:27:00'),
  ('t_156', 'u_002', '2026-05-20', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-20 16:18:00'),
  ('t_157', 'u_002', '2026-05-20', '生物练习题', '完成生物章节练习题', 'PENDING', NULL),
  ('t_158', 'u_002', '2026-05-21', '生物作业', '生物课后作业', 'COMPLETED', '2026-05-21 19:10:00'),
  ('t_159', 'u_002', '2026-05-21', '历史复习', '复习历史重点知识', 'COMPLETED', '2026-05-21 19:00:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_160', 'u_002', '2026-05-22', '历史试卷', '完成历史模拟试卷', 'PENDING', NULL),
  ('t_161', 'u_002', '2026-05-22', '数学笔记整理', '整理数学课堂笔记', 'COMPLETED', '2026-05-22 21:56:00'),
  ('t_162', 'u_002', '2026-05-23', '英语单词打卡', '今日20个新单词+复习30个旧词', 'PENDING', NULL),
  ('t_163', 'u_002', '2026-05-23', '英语阅读理解', '完成2篇阅读理解', 'PENDING', NULL),
  ('t_164', 'u_002', '2026-05-24', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-24 21:16:00'),
  ('t_165', 'u_002', '2026-05-24', '语文古诗词', '背诵并默写古诗词', 'PENDING', NULL),
  ('t_166', 'u_002', '2026-05-25', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-25 20:48:00'),
  ('t_167', 'u_002', '2026-05-25', '语文练习题', '完成语文章节练习题', 'PENDING', NULL),
  ('t_168', 'u_002', '2026-05-26', '语文作业', '语文课后作业', 'COMPLETED', '2026-05-26 08:32:00'),
  ('t_169', 'u_002', '2026-05-26', '英语复习', '复习英语重点知识', 'PENDING', NULL);

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_170', 'u_008', '2026-05-20', '历史练习题', '完成历史章节练习题', 'COMPLETED', '2026-05-20 19:01:00'),
  ('t_171', 'u_008', '2026-05-20', '数学作业', '数学课后作业', 'PENDING', NULL),
  ('t_172', 'u_008', '2026-05-21', '数学复习', '复习数学重点知识', 'COMPLETED', '2026-05-21 16:59:00'),
  ('t_173', 'u_008', '2026-05-21', '物理试卷', '完成物理模拟试卷', 'COMPLETED', '2026-05-21 18:56:00'),
  ('t_174', 'u_008', '2026-05-22', '物理笔记整理', '整理物理课堂笔记', 'PENDING', NULL),
  ('t_175', 'u_008', '2026-05-22', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-22 22:51:00'),
  ('t_176', 'u_008', '2026-05-23', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-23 18:15:00'),
  ('t_177', 'u_008', '2026-05-23', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-23 16:15:00'),
  ('t_178', 'u_008', '2026-05-24', '语文古诗词', '背诵并默写古诗词', 'COMPLETED', '2026-05-24 20:05:00'),
  ('t_179', 'u_008', '2026-05-24', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-24 16:46:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_180', 'u_008', '2026-05-25', '英语练习题', '完成英语章节练习题', 'PENDING', NULL),
  ('t_181', 'u_008', '2026-05-25', '生物作业', '生物课后作业', 'COMPLETED', '2026-05-25 19:52:00'),
  ('t_182', 'u_008', '2026-05-26', '生物复习', '复习生物重点知识', 'COMPLETED', '2026-05-26 07:48:00'),
  ('t_183', 'u_008', '2026-05-26', '历史试卷', '完成历史模拟试卷', 'COMPLETED', '2026-05-26 11:49:00'),
  ('t_184', 'u_009', '2026-05-20', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-20 21:19:00'),
  ('t_185', 'u_009', '2026-05-20', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-20 19:42:00'),
  ('t_186', 'u_009', '2026-05-21', '语文古诗词', '背诵并默写古诗词', 'PENDING', NULL),
  ('t_187', 'u_009', '2026-05-21', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-21 21:23:00'),
  ('t_188', 'u_009', '2026-05-22', '物理练习题', '完成物理章节练习题', 'PENDING', NULL),
  ('t_189', 'u_009', '2026-05-22', '化学作业', '化学课后作业', 'COMPLETED', '2026-05-22 19:57:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_190', 'u_009', '2026-05-23', '化学复习', '复习化学重点知识', 'COMPLETED', '2026-05-23 20:28:00'),
  ('t_191', 'u_009', '2026-05-23', '语文试卷', '完成语文模拟试卷', 'PENDING', NULL),
  ('t_192', 'u_009', '2026-05-24', '语文笔记整理', '整理语文课堂笔记', 'PENDING', NULL),
  ('t_193', 'u_009', '2026-05-24', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-24 16:15:00'),
  ('t_194', 'u_009', '2026-05-25', '英语阅读理解', '完成2篇阅读理解', 'PENDING', NULL),
  ('t_195', 'u_009', '2026-05-25', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-25 17:04:00'),
  ('t_196', 'u_009', '2026-05-26', '语文古诗词', '背诵并默写古诗词', 'PENDING', NULL),
  ('t_197', 'u_009', '2026-05-26', '每日复盘', '总结今日学习内容', 'PENDING', NULL),
  ('t_198', 'u_010', '2026-05-20', '历史笔记整理', '整理历史课堂笔记', 'PENDING', NULL),
  ('t_199', 'u_010', '2026-05-20', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-20 22:21:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_200', 'u_010', '2026-05-21', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-21 16:32:00'),
  ('t_201', 'u_010', '2026-05-21', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-21 17:17:00'),
  ('t_202', 'u_010', '2026-05-22', '语文古诗词', '背诵并默写古诗词', 'COMPLETED', '2026-05-22 21:31:00'),
  ('t_203', 'u_010', '2026-05-22', '每日复盘', '总结今日学习内容', 'PENDING', NULL),
  ('t_204', 'u_010', '2026-05-23', '化学练习题', '完成化学章节练习题', 'COMPLETED', '2026-05-23 17:34:00'),
  ('t_205', 'u_010', '2026-05-23', '语文作业', '语文课后作业', 'COMPLETED', '2026-05-23 17:46:00'),
  ('t_206', 'u_010', '2026-05-24', '语文复习', '复习语文重点知识', 'PENDING', NULL),
  ('t_207', 'u_010', '2026-05-24', '英语试卷', '完成英语模拟试卷', 'PENDING', NULL),
  ('t_208', 'u_010', '2026-05-25', '英语笔记整理', '整理英语课堂笔记', 'COMPLETED', '2026-05-25 20:36:00'),
  ('t_209', 'u_010', '2026-05-25', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-25 19:15:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_210', 'u_010', '2026-05-26', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-26 10:51:00'),
  ('t_211', 'u_010', '2026-05-26', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-26 10:12:00'),
  ('t_212', 'u_003', '2026-05-20', '生物笔记整理', '整理生物课堂笔记', 'COMPLETED', '2026-05-20 21:21:00'),
  ('t_213', 'u_003', '2026-05-20', '英语单词打卡', '今日20个新单词+复习30个旧词', 'PENDING', NULL),
  ('t_214', 'u_003', '2026-05-21', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-21 22:55:00'),
  ('t_215', 'u_003', '2026-05-21', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-21 16:15:00'),
  ('t_216', 'u_003', '2026-05-22', '语文古诗词', '背诵并默写古诗词', 'COMPLETED', '2026-05-22 17:12:00'),
  ('t_217', 'u_003', '2026-05-22', '每日复盘', '总结今日学习内容', 'PENDING', NULL),
  ('t_218', 'u_003', '2026-05-23', '物理练习题', '完成物理章节练习题', 'PENDING', NULL),
  ('t_219', 'u_003', '2026-05-23', '化学作业', '化学课后作业', 'COMPLETED', '2026-05-23 20:28:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_220', 'u_003', '2026-05-24', '化学复习', '复习化学重点知识', 'PENDING', NULL),
  ('t_221', 'u_003', '2026-05-24', '语文试卷', '完成语文模拟试卷', 'COMPLETED', '2026-05-24 17:27:00'),
  ('t_222', 'u_003', '2026-05-25', '语文笔记整理', '整理语文课堂笔记', 'PENDING', NULL),
  ('t_223', 'u_003', '2026-05-25', '英语单词打卡', '今日20个新单词+复习30个旧词', 'PENDING', NULL),
  ('t_224', 'u_003', '2026-05-26', '英语阅读理解', '完成2篇阅读理解', 'COMPLETED', '2026-05-26 08:17:00'),
  ('t_225', 'u_003', '2026-05-26', '英语听力训练', '完成听力练习Section A-C', 'PENDING', NULL),
  ('t_226', 'u_011', '2026-05-20', '语文古诗词', '背诵并默写古诗词', 'PENDING', NULL),
  ('t_227', 'u_011', '2026-05-20', '每日复盘', '总结今日学习内容', 'PENDING', NULL),
  ('t_228', 'u_011', '2026-05-21', '物理练习题', '完成物理章节练习题', 'COMPLETED', '2026-05-21 19:31:00'),
  ('t_229', 'u_011', '2026-05-21', '化学作业', '化学课后作业', 'PENDING', NULL);

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_230', 'u_011', '2026-05-22', '化学复习', '复习化学重点知识', 'PENDING', NULL),
  ('t_231', 'u_011', '2026-05-22', '语文试卷', '完成语文模拟试卷', 'PENDING', NULL),
  ('t_232', 'u_011', '2026-05-23', '语文笔记整理', '整理语文课堂笔记', 'PENDING', NULL),
  ('t_233', 'u_011', '2026-05-23', '英语单词打卡', '今日20个新单词+复习30个旧词', 'PENDING', NULL),
  ('t_234', 'u_011', '2026-05-24', '英语阅读理解', '完成2篇阅读理解', 'PENDING', NULL),
  ('t_235', 'u_011', '2026-05-24', '英语听力训练', '完成听力练习Section A-C', 'COMPLETED', '2026-05-24 19:13:00'),
  ('t_236', 'u_011', '2026-05-25', '语文古诗词', '背诵并默写古诗词', 'PENDING', NULL),
  ('t_237', 'u_011', '2026-05-25', '每日复盘', '总结今日学习内容', 'PENDING', NULL),
  ('t_238', 'u_011', '2026-05-26', '历史练习题', '完成历史章节练习题', 'COMPLETED', '2026-05-26 10:57:00'),
  ('t_239', 'u_011', '2026-05-26', '数学作业', '数学课后作业', 'PENDING', NULL);

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_240', 'u_012', '2026-05-20', '英语练习题', '完成英语章节练习题', 'PENDING', NULL),
  ('t_241', 'u_012', '2026-05-20', '生物作业', '生物课后作业', 'COMPLETED', '2026-05-20 18:13:00'),
  ('t_242', 'u_012', '2026-05-21', '生物复习', '复习生物重点知识', 'PENDING', NULL),
  ('t_243', 'u_012', '2026-05-21', '历史试卷', '完成历史模拟试卷', 'COMPLETED', '2026-05-21 16:37:00'),
  ('t_244', 'u_012', '2026-05-22', '历史笔记整理', '整理历史课堂笔记', 'PENDING', NULL),
  ('t_245', 'u_012', '2026-05-22', '英语单词打卡', '今日20个新单词+复习30个旧词', 'COMPLETED', '2026-05-22 21:34:00'),
  ('t_246', 'u_012', '2026-05-23', '英语阅读理解', '完成2篇阅读理解', 'PENDING', NULL),
  ('t_247', 'u_012', '2026-05-23', '英语听力训练', '完成听力练习Section A-C', 'PENDING', NULL),
  ('t_248', 'u_012', '2026-05-24', '语文古诗词', '背诵并默写古诗词', 'COMPLETED', '2026-05-24 16:47:00'),
  ('t_249', 'u_012', '2026-05-24', '每日复盘', '总结今日学习内容', 'COMPLETED', '2026-05-24 18:03:00');

INSERT INTO daily_tasks (id, user_id, task_date, title, description, status, completed_at) VALUES
  ('t_250', 'u_012', '2026-05-25', '化学练习题', '完成化学章节练习题', 'COMPLETED', '2026-05-25 16:37:00'),
  ('t_251', 'u_012', '2026-05-25', '语文作业', '语文课后作业', 'PENDING', NULL),
  ('t_252', 'u_012', '2026-05-26', '语文复习', '复习语文重点知识', 'PENDING', NULL),
  ('t_253', 'u_012', '2026-05-26', '英语试卷', '完成英语模拟试卷', 'PENDING', NULL),
  ('t_254', 'u_004', '2026-05-25', '化学复习', '复习化学重点知识', 'COMPLETED', '2026-05-25 16:32:00'),
  ('t_255', 'u_004', '2026-05-25', '语文试卷', '完成语文模拟试卷', 'COMPLETED', '2026-05-25 16:54:00'),
  ('t_256', 'u_004', '2026-05-26', '语文笔记整理', '整理语文课堂笔记', 'COMPLETED', '2026-05-26 08:04:00'),
  ('t_257', 'u_004', '2026-05-26', '英语单词打卡', '今日20个新单词+复习30个旧词', 'PENDING', NULL);

-- ============================================================
-- ============================================================
CREATE TABLE IF NOT EXISTS subtasks (
    id VARCHAR(32) PRIMARY KEY COMMENT '微任务 ID',
    task_id VARCHAR(32) NOT NULL COMMENT '所属任务 ID',
    title VARCHAR(200) NOT NULL COMMENT '微任务标题',
    estimated_minutes INT DEFAULT 5 COMMENT '预计用时(分钟)',
    sort_order INT DEFAULT 0 COMMENT '排序',
    completed TINYINT(1) DEFAULT 0 COMMENT '是否完成',
    completed_at DATETIME COMMENT '完成时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES daily_tasks(id),
    INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微任务表';

-- Today's subtasks (auto-generated to match new task IDs)
INSERT INTO subtasks (id, task_id, title, estimated_minutes, sort_order, completed, completed_at) VALUES
  ('st_200', 't_113', '整理笔记', 8, 1, 1, '2026-05-26 09:15:00'),
  ('st_201', 't_113', '做练习题 1-3', 8, 2, 1, '2026-05-26 12:06:00'),
  ('st_202', 't_169', '检查答案', 5, 1, 0, NULL),
  ('st_203', 't_169', '整理笔记', 8, 2, 1, '2026-05-26 07:13:00'),
  ('st_204', 't_196', '整理笔记', 8, 1, 0, NULL);

INSERT INTO subtasks (id, task_id, title, estimated_minutes, sort_order, completed, completed_at) VALUES
  ('st_205', 't_196', '做练习题 1-3', 8, 2, 1, '2026-05-26 08:45:00'),
  ('st_206', 't_197', '整理笔记', 8, 1, 1, '2026-05-26 11:17:00'),
  ('st_207', 't_197', '做练习题 1-3', 8, 2, 0, NULL),
  ('st_208', 't_197', '做练习题 4-6', 10, 3, 1, '2026-05-26 08:44:00'),
  ('st_209', 't_225', '背诵关键知识点', 10, 1, 0, NULL);

INSERT INTO subtasks (id, task_id, title, estimated_minutes, sort_order, completed, completed_at) VALUES
  ('st_210', 't_225', '默写并自检', 8, 2, 1, '2026-05-26 09:06:00'),
  ('st_211', 't_225', '总结错题', 5, 3, 1, '2026-05-26 07:22:00'),
  ('st_212', 't_239', '整理笔记', 8, 1, 0, NULL),
  ('st_213', 't_239', '做练习题 1-3', 8, 2, 0, NULL),
  ('st_214', 't_239', '做练习题 4-6', 10, 3, 0, NULL);

INSERT INTO subtasks (id, task_id, title, estimated_minutes, sort_order, completed, completed_at) VALUES
  ('st_215', 't_252', '做练习题 4-6', 10, 1, 0, NULL),
  ('st_216', 't_252', '背诵关键知识点', 10, 2, 0, NULL),
  ('st_217', 't_253', '做练习题 4-6', 10, 1, 0, NULL),
  ('st_218', 't_253', '背诵关键知识点', 10, 2, 0, NULL),
  ('st_219', 't_253', '默写并自检', 8, 3, 0, NULL);

INSERT INTO subtasks (id, task_id, title, estimated_minutes, sort_order, completed, completed_at) VALUES
  ('st_220', 't_257', '总结错题', 5, 1, 0, NULL),
  ('st_221', 't_257', '阅读题目要求', 3, 2, 1, '2026-05-26 08:49:00'),
  ('st_222', 't_112', '检查答案', 5, 1, 1, '2026-05-26 09:05:00'),
  ('st_223', 't_112', '整理笔记', 8, 2, 1, '2026-05-26 08:55:00'),
  ('st_224', 't_126', '背诵关键知识点', 10, 1, 1, '2026-05-26 07:24:00');

INSERT INTO subtasks (id, task_id, title, estimated_minutes, sort_order, completed, completed_at) VALUES
  ('st_225', 't_126', '默写并自检', 8, 2, 1, '2026-05-26 09:29:00');


CREATE TABLE IF NOT EXISTS notification_logs (
    id VARCHAR(32) PRIMARY KEY COMMENT '通知 ID',
    user_id VARCHAR(32) NOT NULL COMMENT '用户 ID',
    experiment_id BIGINT COMMENT '所属 A/B 实验 ID',
    template_id VARCHAR(50) COMMENT '模板 ID',
    title VARCHAR(200) COMMENT '推送标题',
    body TEXT COMMENT '推送正文',
    channel VARCHAR(20) DEFAULT 'push' COMMENT '渠道: push / sms / in-app',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending / sent / delivered / opened',
    scheduled_at DATETIME COMMENT '计划发送时间',
    sent_at DATETIME COMMENT '实际发送时间',
    delivered_at DATETIME COMMENT '送达时间',
    opened_at DATETIME COMMENT '打开时间',
    extra_data JSON COMMENT '扩展数据',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_experiment (experiment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推送日志表';

-- 4. 推送日志表 (7天: 2026-05-20 ~ 2026-05-26)
-- 对照组 ~8% 打开率 | 实验组 ~15% 打开率
-- ============================================================

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_100', 'u_001', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-20 18:00:00', '2026-05-20 18:00:29', '2026-05-20 18:00:39', NULL, '2026-05-20 18:00:00'),
('n_101', 'u_001', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-21 18:00:00', '2026-05-21 18:00:20', '2026-05-21 18:00:22', NULL, '2026-05-21 18:00:00'),
('n_102', 'u_001', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'opened', '2026-05-22 18:00:00', '2026-05-22 18:00:14', '2026-05-22 18:00:24', '2026-05-22 18:01:41', '2026-05-22 18:00:00'),
('n_103', 'u_001', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-23 18:00:00', '2026-05-23 18:00:17', '2026-05-23 18:00:22', NULL, '2026-05-23 18:00:00'),
('n_104', 'u_001', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-24 18:00:00', '2026-05-24 18:00:07', '2026-05-24 18:00:13', NULL, '2026-05-24 18:00:00'),
('n_105', 'u_001', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-25 18:00:00', '2026-05-25 18:00:08', '2026-05-25 18:00:11', NULL, '2026-05-25 18:00:00'),
('n_106', 'u_001', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'pending', '2026-05-26 18:00:00', NULL, NULL, NULL, '2026-05-26 18:00:00'),
  ('n_107', 'u_005', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'opened', '2026-05-20 19:30:00', '2026-05-20 19:30:01', '2026-05-20 19:30:09', '2026-05-20 19:31:33', '2026-05-20 19:30:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_108', 'u_005', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'sent', '2026-05-21 19:30:00', '2026-05-21 19:30:19', NULL, NULL, '2026-05-21 19:30:00'),
('n_109', 'u_005', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-22 19:30:00', '2026-05-22 19:30:03', '2026-05-22 19:30:12', NULL, '2026-05-22 19:30:00'),
('n_110', 'u_005', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-23 19:30:00', '2026-05-23 19:30:09', '2026-05-23 19:30:15', NULL, '2026-05-23 19:30:00'),
('n_111', 'u_005', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'opened', '2026-05-24 19:30:00', '2026-05-24 19:30:29', '2026-05-24 19:30:31', '2026-05-24 19:32:28', '2026-05-24 19:30:00'),
('n_112', 'u_005', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-25 19:30:00', '2026-05-25 19:30:08', '2026-05-25 19:30:11', NULL, '2026-05-25 19:30:00'),
('n_113', 'u_005', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'pending', '2026-05-26 19:30:00', NULL, NULL, NULL, '2026-05-26 19:30:00'),
('n_114', 'u_006', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-20 18:00:00', '2026-05-20 18:00:30', '2026-05-20 18:00:33', NULL, '2026-05-20 18:00:00'),
  ('n_115', 'u_006', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-21 18:00:00', '2026-05-21 18:00:09', '2026-05-21 18:00:11', NULL, '2026-05-21 18:00:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_116', 'u_006', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-22 18:00:00', '2026-05-22 18:00:24', '2026-05-22 18:00:29', NULL, '2026-05-22 18:00:00'),
('n_117', 'u_006', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-23 18:00:00', '2026-05-23 18:00:10', '2026-05-23 18:00:16', NULL, '2026-05-23 18:00:00'),
('n_118', 'u_006', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-24 18:00:00', '2026-05-24 18:00:07', '2026-05-24 18:00:12', NULL, '2026-05-24 18:00:00'),
('n_119', 'u_006', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-25 18:00:00', '2026-05-25 18:00:17', '2026-05-25 18:00:18', NULL, '2026-05-25 18:00:00'),
('n_120', 'u_006', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'pending', '2026-05-26 18:00:00', NULL, NULL, NULL, '2026-05-26 18:00:00'),
('n_121', 'u_007', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'sent', '2026-05-20 18:30:00', '2026-05-20 18:30:11', NULL, NULL, '2026-05-20 18:30:00'),
('n_122', 'u_007', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'opened', '2026-05-21 18:30:00', '2026-05-21 18:30:21', '2026-05-21 18:30:26', '2026-05-21 18:30:51', '2026-05-21 18:30:00'),
  ('n_123', 'u_007', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-22 18:30:00', '2026-05-22 18:30:24', '2026-05-22 18:30:31', NULL, '2026-05-22 18:30:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_124', 'u_007', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-23 18:30:00', '2026-05-23 18:30:18', '2026-05-23 18:30:20', NULL, '2026-05-23 18:30:00'),
('n_125', 'u_007', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-24 18:30:00', '2026-05-24 18:30:29', '2026-05-24 18:30:32', NULL, '2026-05-24 18:30:00'),
('n_126', 'u_007', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'delivered', '2026-05-25 18:30:00', '2026-05-25 18:30:18', '2026-05-25 18:30:24', NULL, '2026-05-25 18:30:00'),
('n_127', 'u_007', 1, 'self_driven_progress', '学习进度更新', '查看今日学习报告，继续保持！', 'push', 'pending', '2026-05-26 18:30:00', NULL, NULL, NULL, '2026-05-26 18:30:00'),
('n_128', 'u_002', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-20 18:00:00', '2026-05-20 18:00:10', '2026-05-20 18:00:11', NULL, '2026-05-20 18:00:00'),
('n_129', 'u_002', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-21 18:00:00', '2026-05-21 18:00:29', '2026-05-21 18:00:33', NULL, '2026-05-21 18:00:00'),
('n_130', 'u_002', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-22 18:00:00', '2026-05-22 18:00:22', '2026-05-22 18:00:31', NULL, '2026-05-22 18:00:00'),
  ('n_131', 'u_002', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'sent', '2026-05-23 18:00:00', '2026-05-23 18:00:29', NULL, NULL, '2026-05-23 18:00:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_132', 'u_002', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'sent', '2026-05-24 18:00:00', '2026-05-24 18:00:20', NULL, NULL, '2026-05-24 18:00:00'),
('n_133', 'u_002', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'opened', '2026-05-25 18:00:00', '2026-05-25 18:00:30', '2026-05-25 18:00:34', '2026-05-25 18:02:29', '2026-05-25 18:00:00'),
('n_134', 'u_002', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'pending', '2026-05-26 18:00:00', NULL, NULL, NULL, '2026-05-26 18:00:00'),
('n_135', 'u_008', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'sent', '2026-05-20 19:30:00', '2026-05-20 19:30:26', NULL, NULL, '2026-05-20 19:30:00'),
('n_136', 'u_008', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-21 19:30:00', '2026-05-21 19:30:26', '2026-05-21 19:30:30', NULL, '2026-05-21 19:30:00'),
('n_137', 'u_008', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'opened', '2026-05-22 19:30:00', '2026-05-22 19:30:09', '2026-05-22 19:30:12', '2026-05-22 19:31:57', '2026-05-22 19:30:00'),
('n_138', 'u_008', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-23 19:30:00', '2026-05-23 19:30:23', '2026-05-23 19:30:24', NULL, '2026-05-23 19:30:00'),
  ('n_139', 'u_008', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-24 19:30:00', '2026-05-24 19:30:28', '2026-05-24 19:30:32', NULL, '2026-05-24 19:30:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_140', 'u_008', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'sent', '2026-05-25 19:30:00', '2026-05-25 19:30:27', NULL, NULL, '2026-05-25 19:30:00'),
('n_141', 'u_008', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'pending', '2026-05-26 19:30:00', NULL, NULL, NULL, '2026-05-26 19:30:00'),
('n_142', 'u_009', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-20 18:00:00', '2026-05-20 18:00:13', '2026-05-20 18:00:15', NULL, '2026-05-20 18:00:00'),
('n_143', 'u_009', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-21 18:00:00', '2026-05-21 18:00:25', '2026-05-21 18:00:34', NULL, '2026-05-21 18:00:00'),
('n_144', 'u_009', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-22 18:00:00', '2026-05-22 18:00:13', '2026-05-22 18:00:22', NULL, '2026-05-22 18:00:00'),
('n_145', 'u_009', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'sent', '2026-05-23 18:00:00', '2026-05-23 18:00:11', NULL, NULL, '2026-05-23 18:00:00'),
('n_146', 'u_009', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'sent', '2026-05-24 18:00:00', '2026-05-24 18:00:04', NULL, NULL, '2026-05-24 18:00:00'),
  ('n_147', 'u_009', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-25 18:00:00', '2026-05-25 18:00:09', '2026-05-25 18:00:14', NULL, '2026-05-25 18:00:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_148', 'u_009', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'pending', '2026-05-26 18:00:00', NULL, NULL, NULL, '2026-05-26 18:00:00'),
('n_149', 'u_010', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-20 18:30:00', '2026-05-20 18:30:14', '2026-05-20 18:30:23', NULL, '2026-05-20 18:30:00'),
('n_150', 'u_010', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-21 18:30:00', '2026-05-21 18:30:04', '2026-05-21 18:30:14', NULL, '2026-05-21 18:30:00'),
('n_151', 'u_010', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-22 18:30:00', '2026-05-22 18:30:07', '2026-05-22 18:30:14', NULL, '2026-05-22 18:30:00'),
('n_152', 'u_010', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'delivered', '2026-05-23 18:30:00', '2026-05-23 18:30:01', '2026-05-23 18:30:10', NULL, '2026-05-23 18:30:00'),
('n_153', 'u_010', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'sent', '2026-05-24 18:30:00', '2026-05-24 18:30:22', NULL, NULL, '2026-05-24 18:30:00'),
('n_154', 'u_010', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'opened', '2026-05-25 18:30:00', '2026-05-25 18:30:24', '2026-05-25 18:30:28', '2026-05-25 18:31:19', '2026-05-25 18:30:00'),
  ('n_155', 'u_010', 1, 'need_reminder_urgent', '你还有任务未完成', '现在开始只需几分钟，加油！', 'push', 'pending', '2026-05-26 18:30:00', NULL, NULL, NULL, '2026-05-26 18:30:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_156', 'u_003', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'sent', '2026-05-20 18:00:00', '2026-05-20 18:00:24', NULL, NULL, '2026-05-20 18:00:00'),
('n_157', 'u_003', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'opened', '2026-05-21 18:00:00', '2026-05-21 18:00:17', '2026-05-21 18:00:22', '2026-05-21 18:01:52', '2026-05-21 18:00:00'),
('n_158', 'u_003', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-22 18:00:00', '2026-05-22 18:00:14', '2026-05-22 18:00:19', NULL, '2026-05-22 18:00:00'),
('n_159', 'u_003', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-23 18:00:00', '2026-05-23 18:00:18', '2026-05-23 18:00:25', NULL, '2026-05-23 18:00:00'),
('n_160', 'u_003', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'sent', '2026-05-24 18:00:00', '2026-05-24 18:00:22', NULL, NULL, '2026-05-24 18:00:00'),
('n_161', 'u_003', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'sent', '2026-05-25 18:00:00', '2026-05-25 18:00:22', NULL, NULL, '2026-05-25 18:00:00'),
('n_162', 'u_003', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'pending', '2026-05-26 18:00:00', NULL, NULL, NULL, '2026-05-26 18:00:00'),
  ('n_163', 'u_011', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-20 18:00:00', '2026-05-20 18:00:10', '2026-05-20 18:00:17', NULL, '2026-05-20 18:00:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_164', 'u_011', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-21 18:00:00', '2026-05-21 18:00:26', '2026-05-21 18:00:32', NULL, '2026-05-21 18:00:00'),
('n_165', 'u_011', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-22 18:00:00', '2026-05-22 18:00:15', '2026-05-22 18:00:19', NULL, '2026-05-22 18:00:00'),
('n_166', 'u_011', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-23 18:00:00', '2026-05-23 18:00:17', '2026-05-23 18:00:20', NULL, '2026-05-23 18:00:00'),
('n_167', 'u_011', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-24 18:00:00', '2026-05-24 18:00:22', '2026-05-24 18:00:31', NULL, '2026-05-24 18:00:00'),
('n_168', 'u_011', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-25 18:00:00', '2026-05-25 18:00:22', '2026-05-25 18:00:28', NULL, '2026-05-25 18:00:00'),
('n_169', 'u_011', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'pending', '2026-05-26 18:00:00', NULL, NULL, NULL, '2026-05-26 18:00:00'),
('n_170', 'u_012', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-20 18:00:00', '2026-05-20 18:00:01', '2026-05-20 18:00:09', NULL, '2026-05-20 18:00:00'),
  ('n_171', 'u_012', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'sent', '2026-05-21 18:00:00', '2026-05-21 18:00:20', NULL, NULL, '2026-05-21 18:00:00');

INSERT INTO notification_logs (id, user_id, experiment_id, template_id, title, body, channel, status, scheduled_at, sent_at, delivered_at, opened_at, created_at) VALUES
('n_172', 'u_012', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-22 18:00:00', '2026-05-22 18:00:03', '2026-05-22 18:00:13', NULL, '2026-05-22 18:00:00'),
('n_173', 'u_012', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'sent', '2026-05-23 18:00:00', '2026-05-23 18:00:07', NULL, NULL, '2026-05-23 18:00:00'),
('n_174', 'u_012', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-24 18:00:00', '2026-05-24 18:00:13', '2026-05-24 18:00:17', NULL, '2026-05-24 18:00:00'),
('n_175', 'u_012', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'delivered', '2026-05-25 18:00:00', '2026-05-25 18:00:05', '2026-05-25 18:00:06', NULL, '2026-05-25 18:00:00'),
('n_176', 'u_012', 1, 'dropout_reward', '专属学习奖励等你领取', '今天就开始你的学习之旅吧', 'push', 'pending', '2026-05-26 18:00:00', NULL, NULL, NULL, '2026-05-26 18:00:00'),
('n_177', 'u_004', 1, 'cold_start_welcome', '欢迎加入学习大家庭！', '来看看今天的学习推荐', 'push', 'opened', '2026-05-25 18:00:00', '2026-05-25 18:00:25', '2026-05-25 18:00:27', '2026-05-25 18:02:11', '2026-05-25 18:00:00'),
  ('n_178', 'u_004', 1, 'cold_start_welcome', '欢迎加入学习大家庭！', '来看看今天的学习推荐', 'push', 'pending', '2026-05-26 18:00:00', NULL, NULL, NULL, '2026-05-26 18:00:00');


-- 5. 推送模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS push_templates (
    id VARCHAR(50) PRIMARY KEY COMMENT '模板 ID',
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    title_template VARCHAR(200) NOT NULL COMMENT '标题模板, 支持 {count} {minutes} 等变量',
    body_template TEXT COMMENT '正文模板',
    target_user_type VARCHAR(20) COMMENT '适配的用户分层, NULL 为通用',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推送模板表';

DELETE FROM push_templates;

INSERT INTO push_templates (id, name, title_template, body_template, target_user_type) VALUES
('self_driven_progress', '自律型-进度鼓励', '🏆 今日完成率 {rate}%，已超过班上 {percentile}% 的同学', '继续保持，你是最棒的！', 'SELF_DRIVEN'),
('self_driven_weekly',  '自律型-周报',     '📊 本周学习报告：完成 {weeklyCount} 项任务，超过 {percentile}% 的同学', '新的一周继续加油 💪', 'SELF_DRIVEN'),
('need_reminder_urgent', '需提醒型-紧迫感', '📚 你还有 {count} 项任务未完成', '现在开始只需 {minutes} 分钟，加油！', 'NEED_REMINDER'),
('need_reminder_almost', '需提醒型-接近完成', '⏰ 还有 {count} 项任务未完成', '今天的学习目标就要达成了，再坚持一下！', 'NEED_REMINDER'),
('dropout_reward',       '流失型-激励唤醒', '🎁 连续学习 3 天可获 {reward} 奖励', '今天就开始你的学习之旅吧 👋', 'DROPOUT'),
('dropout_double_points','流失型-双倍积分', '🔥 你已经连续 {days} 天未学习，今天回来可获双倍积分', '学习就像存钱，每天一点点 💰', 'DROPOUT'),
('missed_care',          '通用-关怀',       '👋 学习不用着急，从一个小任务开始', '先做一道题试试？只要 3 分钟 ⏳', NULL),
('cold_start_welcome',   '冷启动-欢迎',     '👋 欢迎加入学习大家庭！', '今天先完成入学测试，看看你的水平吧', 'COLD_START'),
('cold_start_guide',     '冷启动-引导',     '📖 你的专属学习计划已生成', '来看看今天的学习推荐', 'COLD_START');

-- ============================================================
-- 6. 用户行为事件表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_behavior_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '事件 ID',
    user_id VARCHAR(32) NOT NULL COMMENT '用户 ID',
    event_type VARCHAR(50) NOT NULL COMMENT '事件类型: open_app / complete_task / click_notification / leave_app / close_push',
    event_data JSON COMMENT '事件数据',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_event (user_id, event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户行为事件表';

INSERT INTO user_behavior_events (user_id, event_type, event_data, created_at) VALUES
-- 张三（自律型）的行为
('u_001', 'open_app',           '{"source":"direct"}', '2026-05-25 08:00:00'),
('u_001', 'complete_task',      '{"taskId":"t_002","title":"英语单词打卡"}', '2026-05-25 08:15:00'),
('u_001', 'click_notification', '{"notificationId":"n_001"}', '2026-05-25 08:16:30'),
('u_001', 'leave_app',          '{"duration":600}', '2026-05-25 08:20:00'),
('u_001', 'open_app',           '{"source":"direct"}', '2026-05-25 19:30:00'),
('u_001', 'complete_subtask',   '{"subtaskId":"st_001","title":"做完第 1 题"}', '2026-05-25 19:30:00'),
('u_001', 'leave_app',          '{"duration":1200}', '2026-05-25 20:30:00'),

-- 李四（需提醒型）的行为
('u_002', 'open_app',           '{"source":"direct"}', '2026-05-25 07:45:00'),
('u_002', 'complete_task',      '{"taskId":"t_005","title":"化学方程式练习"}', '2026-05-25 07:50:00'),
('u_002', 'leave_app',          '{"duration":300}', '2026-05-25 07:55:00'),
('u_002', 'click_notification', '{"notificationId":"n_002"}', '2026-05-25 15:31:00'),
('u_002', 'open_app',           '{"source":"push","notificationId":"n_002"}', '2026-05-25 15:31:00'),
('u_002', 'leave_app',          '{"duration":120}', '2026-05-25 15:33:00'),
('u_002', 'close_push',         '{"notificationId":"n_003"}', '2026-05-25 17:30:05'),

-- 王五（流失型）的行为 - 很少打开
('u_003', 'click_notification', '{"notificationId":"n_004"}', '2026-05-25 12:01:00'),
('u_003', 'open_app',           '{"source":"push","notificationId":"n_004"}', '2026-05-25 12:01:00'),
('u_003', 'complete_subtask',   '{"subtaskId":"st_017","title":"Section A 听力"}', '2026-05-25 18:00:00'),
('u_003', 'leave_app',          '{"duration":180}', '2026-05-25 18:03:00'),

-- 赵六（冷启动）的行为
('u_004', 'open_app',           '{"source":"direct"}', '2026-05-25 12:00:00'),
('u_004', 'complete_task',      '{"taskId":"t_033","title":"学习计划设定"}', '2026-05-25 12:30:00'),
('u_004', 'click_notification', '{"notificationId":"n_020"}', '2026-05-25 12:05:30'),
('u_004', 'leave_app',          '{"duration":480}', '2026-05-25 12:35:00'),

-- 周五的行为
('u_008', 'click_notification', '{"notificationId":"n_012"}', '2026-05-25 19:31:00'),
('u_008', 'open_app',           '{"source":"push","notificationId":"n_012"}', '2026-05-25 19:31:00'),
('u_008', 'complete_task',      '{"taskId":"t_026","title":"数学概率统计"}', '2026-05-25 20:30:00'),
('u_008', 'leave_app',          '{"duration":700}', '2026-05-25 21:00:00');

-- ============================================================
-- 7. A/B 实验表
-- ============================================================
CREATE TABLE IF NOT EXISTS ab_test_experiments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '实验 ID',
    name VARCHAR(100) NOT NULL COMMENT '实验名称',
    description TEXT COMMENT '实验描述',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '状态: DRAFT / RUNNING / ANALYZING / COMPLETED',
    target_user_type VARCHAR(20) COMMENT '目标用户分层, NULL 为全部',
    started_at DATETIME COMMENT '开始时间',
    ended_at DATETIME COMMENT '结束时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='A/B 实验表';

DELETE FROM ab_test_experiments;

INSERT INTO ab_test_experiments (id, name, description, status, target_user_type, started_at, ended_at) VALUES
(1, '推送时机优化 V1', '固定 18:00 vs 智能时段推送（活跃时段前 30 分钟）', 'RUNNING', NULL, '2026-05-19 00:00:00', NULL),
(2, '文案个性化 V2', '固定通用文案 vs 按分层匹配不同推送模板', 'ANALYZING', 'NEED_REMINDER', '2026-05-04 00:00:00', '2026-05-19 00:00:00'),
(3, '频次优化 V3', '每天 1 次 vs 按分层动态频次（自律 1 条/需提醒 2 条/流失 3 条）', 'DRAFT', NULL, NULL, NULL);

-- ============================================================
-- 8. A/B 实验分组表
-- ============================================================
CREATE TABLE IF NOT EXISTS ab_test_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分组 ID',
    experiment_id BIGINT NOT NULL COMMENT '所属实验 ID',
    group_name VARCHAR(50) NOT NULL COMMENT '分组名: control / variant_a / variant_b',
    config_json JSON COMMENT '分组策略配置',
    traffic_percent INT DEFAULT 0 COMMENT '流量占比(0-100)',
    user_count INT DEFAULT 0 COMMENT '当前用户数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (experiment_id) REFERENCES ab_test_experiments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='A/B 实验分组表';

DELETE FROM ab_test_groups;

-- 实验 1：推送时机优化（进行中）
INSERT INTO ab_test_groups (id, experiment_id, group_name, config_json, traffic_percent, user_count) VALUES
(1, 1, 'control（固定 18:00）',  '{"time":"18:00","strategy":"fixed"}', 50, 6),
(2, 1, 'variant_a（智能时段）',  '{"time":"smart","strategy":"active_time_based"}', 50, 6);

-- 实验 2：文案个性化（分析中）
INSERT INTO ab_test_groups (id, experiment_id, group_name, config_json, traffic_percent, user_count) VALUES
(3, 2, 'control（固定文案）',    '{"template":"fixed","content":"你还有学习任务未完成"}', 50, 52500),
(4, 2, 'variant_a（分层模板）',  '{"template":"segmented","content":"按用户分层匹配模板"}', 50, 52500);

-- 实验 3：频次优化（草稿）
INSERT INTO ab_test_groups (id, experiment_id, group_name, config_json, traffic_percent, user_count) VALUES
(5, 3, 'control（每天 1 次）',  '{"maxDaily":1}', 50, 0),
(6, 3, 'variant_a（动态频次）', '{"maxDaily":"by_type"}', 50, 0);

-- ============================================================
-- 9. A/B 用户分配表
-- ============================================================
CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL COMMENT '用户 ID',
    experiment_id BIGINT NOT NULL COMMENT '实验 ID',
    group_name VARCHAR(50) NOT NULL COMMENT '分配到的分组',
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (experiment_id) REFERENCES ab_test_experiments(id),
    UNIQUE KEY uk_user_experiment (user_id, experiment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='A/B 用户分配表';

DELETE FROM ab_test_assignments;

-- 实验 1 的分组分配（模拟 12 个用户的分流）
INSERT INTO ab_test_assignments (user_id, experiment_id, group_name) VALUES
('u_001', 1, 'control（固定 18:00）'),
('u_002', 1, 'control（固定 18:00）'),
('u_003', 1, 'variant_a（智能时段）'),
('u_004', 1, 'control（固定 18:00）'),
('u_005', 1, 'variant_a（智能时段）'),
('u_006', 1, 'control（固定 18:00）'),
('u_007', 1, 'variant_a（智能时段）'),
('u_008', 1, 'variant_a（智能时段）'),
('u_009', 1, 'control（固定 18:00）'),
('u_010', 1, 'variant_a（智能时段）'),
('u_011', 1, 'control（固定 18:00）'),
('u_012', 1, 'variant_a（智能时段）');

-- 实验 2 的分组分配（仅需提醒型参与）
INSERT INTO ab_test_assignments (user_id, experiment_id, group_name) VALUES
('u_002', 2, 'variant_a（分层模板）'),
('u_008', 2, 'control（固定文案）'),
('u_009', 2, 'variant_a（分层模板）'),
('u_010', 2, 'control（固定文案）');
