# 智能学习提醒系统 Smart Reminder

> **基于用户分层的智能推送引擎** — 在对的时间、用对的方式、推给对的人。
>
> Spring Boot 3.2 + React 18 + MySQL 8.0 + Redis + RabbitMQ + A/B 实验框架

---

## 项目简介

本项目是一套面向学生群体的智能学习任务提醒系统，核心创新在于**摒弃一刀切的推送策略**，基于用户行为数据将用户分为四层（自律型 / 需提醒型 / 流失倾向型 / 冷启动），每层采用差异化的推送时机、文案内容和频次控制策略。通过**自建 A/B 实验框架**验证策略效果，并预留 **本地 LLM（Ollama）** 扩展点实现 AI 文案生成。

**演示数据结论**: 智能策略组（实验组）相比固定策略组（对照组），推送打开率从 **8.1% 提升至 14.3%**，任务完成率从 **60.8% 提升至 71.4%**。

---

## 技术栈

| 层 | 技术 | 版本 |
|------|------|:---:|
| 前端框架 | React + TypeScript | 18 |
| UI 组件库 | Ant Design | 5 |
| 状态管理 | Zustand | — |
| 构建工具 | Vite | — |
| 后端框架 | Spring Boot | 3.2 |
| ORM | Spring Data JPA | — |
| 数据库 | MySQL | 8.0 |
| 缓存 | Redis | 7 |
| 消息队列 | RabbitMQ | 3.13 |
| 密码加密 | BCrypt (spring-security-crypto) | — |
| AI 文案 | Ollama + qwen2.5:8b（可选，默认关闭） | — |

---

## 快速启动

### 方式一：Docker Compose（推荐）

```bash
cd 智能提醒
docker-compose up -d   # 启动 MySQL + Redis + RabbitMQ
```

然后手动执行 `sql/init.sql`（Navicat 或其他工具）。

### 方式二：手动启动中间件

确保本机已安装并运行：
- **MySQL 8.0** — 端口 3306，root / 200565
- **Redis 7** — 端口 6379
- **RabbitMQ 3.x** — 端口 5672（管理面板 15672，admin / admin123）

### 初始化数据库

用 Navicat 连接 MySQL，执行 `sql/init.sql`（包含建表 + 12个用户 + 7天演示数据 + A/B 实验数据）。

### 启动后端

```bash
cd backend
mvn spring-boot:run
# 后端运行在 http://localhost:8080
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
# 前端运行在 http://localhost:3000，自动代理 /api → 8080
```

---

## 演示账号

| 用户名 | 密码 | 分层 | 特点 |
|--------|------|------|------|
| zhangsan | password123 | 自律型 | 完成率 92%，几乎不需要提醒 |
| lisi | password123 | 需提醒型 | 完成率 55%，需要推动 |
| wangwu | password123 | 流失倾向型 | 完成率 20%，连续 5 天未完成 |
| zhaoliu | password123 | 冷启动 | 新用户，无历史数据 |

（更多账号见 `sql/init.sql` 中的 users 表，共 12 个用户）

---

## 核心功能

### 1. 用户四层分层体系（RFM 变体）

| 分层 | 判定规则 | 每日上限 | 推送时机 | 文案策略 |
|------|------|:---:|------|------|
| **自律型** SELF_DRIVEN | 完成率 ≥ 80% | 1 条 | 任务完成时即时推送 | 进度鼓励 + 排行榜 |
| **需提醒型** NEED_REMINDER | 完成率 40%–80% | 2 条 | 活跃时段前 30 分钟 | 紧迫感 + 任务清单 |
| **流失倾向型** DROPOUT | 完成率 < 40% 或连续 ≥ 3 天未完成 | 3 条 | 18:00 + 20:00 双次 | 激励唤醒 + 关怀 |
| **冷启动** COLD_START | 注册 < 7 天 | 2 条 | 18:00 默认 | 通用欢迎模板 |

分层由 `UserService.recalculateAllSegments()` 每天凌晨 3:00 自动重算。

### 2. 智能推送引擎 — 三步流水线

```
用户请求 → ① 时机决策 → ② 内容生成 → ③ 频次控制 → RabbitMQ → 推送
```

- **时机决策** (`TimingDecisionService`): 活跃时段中点 − 30 分钟，±5 分钟窗口触发
- **内容生成** (`ContentGenerator` + `AIContentGenerator`): 按分层匹配模板 → 填充变量 → 可选 LLM 增强
- **频次控制** (`FrequencyControlService`): 每日限额 / 最小间隔 2h / 免打扰 21:30-07:00 / 在线状态，全部 Redis 实时计数

可视化页面：**SmartEngine 页** — 选择用户 → 点击"模拟推送决策" → 逐步展示三步决策的输入/输出/决策依据。

### 3. A/B 实验框架

完整的实验生命周期管理：

```
创建实验 → 配置分组（对照组/实验组） → 启动（自动分流） → 推送关联实验 → 实时报表
```

- **分流算法**: `hash(userId × 31 + experimentId) % 100`，首次分配后写表固化，不会漂移
- **报表指标**: 各组推送打开率 + 任务完成率 + 用户数，自动计算提升百分比
- **预置数据**: 实验 1 "推送时机优化 V1" 已运行，12 人均匀分配，7 天数据可直接看到效果

### 4. 事件驱动推送

RabbitMQ 消费用户行为事件，实现"自律型用户全部完成任务 → 即时鼓励推送"的自动化链路：

```
open_app / complete_task / click_notification 事件
  → user.behavior.event 队列
  → BehaviorEventConsumer → 更新用户画像 → 按需触发推送
```

### 5. 数据看板（Dashboard）

6 个聚合模块：
- 核心目标达成进度（平均完成率 vs 75% 目标）
- 用户分层占比分布
- A/B 实验策略对比（对照组 vs 实验组卡片）
- 本周完成率趋势（7 天柱状图）
- 今日推送时间线（可滚动）
- 系统运行统计

### 6. 其他功能

- **任务管理**: 任务 CRUD + 微任务拆分（大任务拆小步骤，降低开始门槛）
- **推送面板**: 推送历史时间线 + 打开率/送达率统计
- **用户画像**: 分层标签 + 推送策略卡片 + 本周完成模拟
- **模板管理**: 9 套预置模板，按分层 + 优先级匹配
- **用户切换器**: 顶部下拉快速切换用户，方便演示

---

## 项目结构

```
智能提醒/
├── docker-compose.yml               # MySQL + Redis + RabbitMQ
├── sql/
│   └── init.sql                      # 建表 + 预置数据（12 用户 × 7 天）
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/reminder/
│       ├── ReminderApplication.java
│       ├── common/                   # Result / BusinessException / 枚举
│       ├── config/                   # EngineConfig / AIConfig / RabbitMQ / Redis
│       ├── user/                     # 注册登录 / 分层计算 / 画像
│       ├── task/                     # 任务 CRUD / 微任务 / 统计
│       ├── notification/             # 推送日志 / 模板管理
│       ├── engine/                   # ★ 核心引擎（调度器/时机/内容/频控）
│       ├── abtest/                   # ★ A/B 实验（分流/分组/报表）
│       ├── dashboard/                # 看板聚合查询
│       └── event/                    # 行为事件采集与消费
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx          # 数据看板
│       │   ├── SmartEngine.tsx        # ★ 引擎三步决策可视化
│       │   ├── ABTestDashboard.tsx    # ★ A/B 实验管理
│       │   ├── TaskCenter.tsx         # 任务中心
│       │   ├── NotificationPanel.tsx  # 推送面板
│       │   ├── UserProfile.tsx        # 用户画像
│       │   ├── Settings.tsx           # 用户设置
│       │   └── LoginPage.tsx          # 登录注册
│       ├── api/
│       │   ├── index.ts              # axios 封装
│       │   └── endpoints.ts          # 各模块 API
│       ├── store/userStore.ts        # Zustand 全局状态
│       ├── components/
│       │   └── UserSwitcher.tsx       # 用户快速切换
│       └── mock/data.ts              # 常量映射（分层标签/颜色）
└── docs/                             # 架构文档 / 面试分析 / PRD
```

---

## 消息队列拓扑

```
Exchange: reminder.push (Direct)
├── push.request    → 推送请求队列
└── push.callback   → 厂商回执队列

Exchange: reminder.event (Direct)
└── user.behavior.event → 行为事件队列
    └── BehaviorEventConsumer
        ├── handleOpenApp()          更新活跃时间
        ├── handleTaskComplete()     重算完成率 + 触发自律型推送
        └── handleClickNotification() 标记已读
```

---

## Redis Key 设计

| Key 模式 | 类型 | TTL | 用途 |
|------|------|:--:|------|
| `push:daily:{userId}:{date}` | 计数器 | 当天结束 | 每日推送限额 |
| `push:last:{userId}` | 时间戳 | 无 | 最小推送间隔（2h） |
| `user:online:{userId}` | 标记 | 5 min | 在线状态（心跳维持） |

---

## AI 文案配置（可选）

默认关闭，使用模板匹配。如需启用 AI 生成：

1. 安装 [Ollama](https://ollama.com) 并拉取模型：
   ```bash
   ollama pull qwen2.5:8b
   ```

2. 修改 `backend/src/main/resources/application.yml`：
   ```yaml
   reminder:
     ai:
       enabled: true
   ```

3. 重启后端。AI 生成失败时自动回退到模板文案（`AIContentGenerator.generateWithAI()` 异常捕获）。

---

## A/B 实验数据说明

`init.sql` 预置实验 1 "推送时机优化 V1" 含 7 天数据（2026-05-20 ~ 2026-05-26）：

| 指标 | 对照组（固定 18:00） | 实验组（智能时段） | 提升 |
|------|:---:|:---:|:---:|
| 推送打开率 | 8.1% | 14.3% | +76.5% |
| 任务完成率 | 60.8% | 71.4% | +17.4% |
| 用户数 | 6 | 6 | — |

点击 A/B 实验页面的实验 → "查看" → 可看到实时报表。

---

## 注意事项

- 点击 SmartEngine 页的"模拟推送决策"会**真实写入** `notification_logs` 和更新 A/B 实验报表数据
- 如需重置数据，重新执行 `sql/init.sql`（文件开头有 DELETE 语句清空所有表）
- `frontend/.env` 中的 `VITE_USE_MOCK=false` 表示使用真实后端 API，非 Mock 模式
