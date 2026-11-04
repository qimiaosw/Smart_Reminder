import dayjs from 'dayjs'

// ========== 用户数据 ==========
export interface User {
  id: string
  username: string
  realName: string
  userType: UserType
  pushEnabled: boolean
  pushToken?: string
  activeTimeSlot: string | null
  consecutiveMissDays: number
  weeklyCompletionRate: number
  lastActiveAt: string | null
}

export type UserType = 'SELF_DRIVEN' | 'NEED_REMINDER' | 'DROPOUT' | 'COLD_START'

export const userTypeLabels: Record<UserType, string> = {
  SELF_DRIVEN: '自律型',
  NEED_REMINDER: '需提醒型',
  DROPOUT: '流失倾向型',
  COLD_START: '冷启动',
}

export const userTypeColors: Record<UserType, string> = {
  SELF_DRIVEN: '#52c41a',
  NEED_REMINDER: '#faad14',
  DROPOUT: '#ff4d4f',
  COLD_START: '#d9d9d9',
}

export const MOCK_USERS: Record<string, User> = {
  u_001: {
    id: 'u_001',
    username: 'zhangsan',
    realName: '张三',
    userType: 'SELF_DRIVEN',
    pushEnabled: true,
    activeTimeSlot: '19:00-21:00',
    consecutiveMissDays: 0,
    weeklyCompletionRate: 0.85,
    lastActiveAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  u_002: {
    id: 'u_002',
    username: 'lisi',
    realName: '李四',
    userType: 'NEED_REMINDER',
    pushEnabled: true,
    activeTimeSlot: '16:00-18:00',
    consecutiveMissDays: 1,
    weeklyCompletionRate: 0.55,
    lastActiveAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  u_003: {
    id: 'u_003',
    username: 'wangwu',
    realName: '王五',
    userType: 'DROPOUT',
    pushEnabled: false,
    activeTimeSlot: null,
    consecutiveMissDays: 5,
    weeklyCompletionRate: 0.20,
    lastActiveAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  u_004: {
    id: 'u_004',
    username: 'zhaoliu',
    realName: '赵六',
    userType: 'COLD_START',
    pushEnabled: true,
    activeTimeSlot: null,
    consecutiveMissDays: 2,
    weeklyCompletionRate: 0.0,
    lastActiveAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  u_005: {
    id: 'u_005',
    username: 'sunqi',
    realName: '孙七',
    userType: 'SELF_DRIVEN',
    pushEnabled: true,
    activeTimeSlot: '20:00-22:00',
    consecutiveMissDays: 0,
    weeklyCompletionRate: 0.92,
    lastActiveAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  u_006: {
    id: 'u_006',
    username: 'zhouba',
    realName: '周八',
    userType: 'SELF_DRIVEN',
    pushEnabled: true,
    activeTimeSlot: '18:00-20:00',
    consecutiveMissDays: 0,
    weeklyCompletionRate: 0.88,
    lastActiveAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  u_007: {
    id: 'u_007',
    username: 'wujiu',
    realName: '吴九',
    userType: 'SELF_DRIVEN',
    pushEnabled: true,
    activeTimeSlot: '19:30-21:30',
    consecutiveMissDays: 0,
    weeklyCompletionRate: 0.82,
    lastActiveAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  u_008: {
    id: 'u_008',
    username: 'zhengshi',
    realName: '郑十',
    userType: 'NEED_REMINDER',
    pushEnabled: true,
    activeTimeSlot: '15:00-17:00',
    consecutiveMissDays: 2,
    weeklyCompletionRate: 0.48,
    lastActiveAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  u_009: {
    id: 'u_009',
    username: 'fengyi',
    realName: '冯十一',
    userType: 'NEED_REMINDER',
    pushEnabled: true,
    activeTimeSlot: '17:00-19:00',
    consecutiveMissDays: 1,
    weeklyCompletionRate: 0.52,
    lastActiveAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  u_010: {
    id: 'u_010',
    username: 'chener',
    realName: '陈十二',
    userType: 'NEED_REMINDER',
    pushEnabled: false,
    activeTimeSlot: '16:30-18:30',
    consecutiveMissDays: 3,
    weeklyCompletionRate: 0.42,
    lastActiveAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  u_011: {
    id: 'u_011',
    username: 'chusan',
    realName: '褚十三',
    userType: 'DROPOUT',
    pushEnabled: true,
    activeTimeSlot: null,
    consecutiveMissDays: 6,
    weeklyCompletionRate: 0.15,
    lastActiveAt: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  u_012: {
    id: 'u_012',
    username: 'weisi',
    realName: '卫十四',
    userType: 'DROPOUT',
    pushEnabled: false,
    activeTimeSlot: null,
    consecutiveMissDays: 8,
    weeklyCompletionRate: 0.10,
    lastActiveAt: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
}

// ========== 任务数据 ==========
export interface Subtask {
  id: string
  title: string
  completed: boolean
  estimatedMinutes: number
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED'
  taskDate: string
  subtasks: Subtask[]
  totalMinutes: number
}

export const MOCK_TASKS: Record<string, Task[]> = {
  u_001: [
    {
      id: 't_001', title: '数学作业第 3 章', description: '完成第三章全部练习题', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 20,
      subtasks: [
        { id: 'st_001', title: '做完第 1 题（选择题）', completed: true, estimatedMinutes: 5 },
        { id: 'st_002', title: '做完第 2 题（填空题）', completed: false, estimatedMinutes: 5 },
        { id: 'st_003', title: '做完第 3 题（解答题）', completed: false, estimatedMinutes: 10 },
      ],
    },
    {
      id: 't_002', title: '英语单词打卡', description: '今日 20 个新单词', status: 'COMPLETED',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 15,
      subtasks: [
        { id: 'st_004', title: '跟读新单词 ×10', completed: true, estimatedMinutes: 5 },
        { id: 'st_005', title: '拼写练习 ×10', completed: true, estimatedMinutes: 5 },
        { id: 'st_006', title: '例句朗读 ×5', completed: true, estimatedMinutes: 5 },
      ],
    },
  ],
  u_002: [
    {
      id: 't_003', title: '物理实验报告', description: '完成力学实验数据分析', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 30,
      subtasks: [
        { id: 'st_007', title: '记录实验数据', completed: false, estimatedMinutes: 5 },
        { id: 'st_008', title: '绘制数据图表', completed: false, estimatedMinutes: 10 },
        { id: 'st_009', title: '撰写实验结论', completed: false, estimatedMinutes: 15 },
      ],
    },
    {
      id: 't_004', title: '语文阅读理解', description: '完成 2 篇文言文阅读', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 20,
      subtasks: [
        { id: 'st_010', title: '阅读第一篇并答题', completed: false, estimatedMinutes: 10 },
        { id: 'st_011', title: '阅读第二篇并答题', completed: false, estimatedMinutes: 10 },
      ],
    },
    {
      id: 't_005', title: '化学方程式练习', description: '默写 10 个化学方程式', status: 'COMPLETED',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 10,
      subtasks: [
        { id: 'st_012', title: '前 5 个方程式', completed: true, estimatedMinutes: 5 },
        { id: 'st_013', title: '后 5 个方程式', completed: true, estimatedMinutes: 5 },
      ],
    },
  ],
  u_003: [
    {
      id: 't_006', title: '数学作业第 4 章', description: '完成第四章练习题', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 25,
      subtasks: [
        { id: 'st_014', title: '做完第 1 题', completed: false, estimatedMinutes: 5 },
        { id: 'st_015', title: '做完第 2 题', completed: false, estimatedMinutes: 10 },
        { id: 'st_016', title: '做完第 3 题', completed: false, estimatedMinutes: 10 },
      ],
    },
    {
      id: 't_007', title: '英语听力训练', description: '完成 Unit 4 听力练习', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 15,
      subtasks: [
        { id: 'st_017', title: 'Section A 听力', completed: false, estimatedMinutes: 5 },
        { id: 'st_018', title: 'Section B 听力', completed: false, estimatedMinutes: 5 },
        { id: 'st_019', title: '听力填空', completed: false, estimatedMinutes: 5 },
      ],
    },
  ],
  u_004: [],
  u_005: [
    {
      id: 't_008', title: '英语阅读理解训练', description: '完成 2 篇考研英语阅读', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 30,
      subtasks: [
        { id: 'st_020', title: '第一篇阅读 + 答题', completed: true, estimatedMinutes: 15 },
        { id: 'st_021', title: '第二篇阅读 + 答题', completed: false, estimatedMinutes: 15 },
      ],
    },
    {
      id: 't_009', title: '高等数学复习', description: '复习矩阵运算章节', status: 'COMPLETED',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 25,
      subtasks: [
        { id: 'st_022', title: '矩阵乘法练习', completed: true, estimatedMinutes: 10 },
        { id: 'st_023', title: '特征值计算', completed: true, estimatedMinutes: 15 },
      ],
    },
  ],
  u_006: [
    {
      id: 't_010', title: '政治理论背诵', description: '背诵中国特色社会主义理论', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 20,
      subtasks: [
        { id: 'st_024', title: '第一章要点', completed: true, estimatedMinutes: 10 },
        { id: 'st_025', title: '第二章要点', completed: false, estimatedMinutes: 10 },
      ],
    },
  ],
  u_007: [
    {
      id: 't_011', title: '计算机组成原理', description: '理解 CPU 流水线设计', status: 'COMPLETED',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 35,
      subtasks: [
        { id: 'st_026', title: '五级流水线图解', completed: true, estimatedMinutes: 15 },
        { id: 'st_027', title: '数据冒险处理', completed: true, estimatedMinutes: 10 },
        { id: 'st_028', title: '控制冒险处理', completed: true, estimatedMinutes: 10 },
      ],
    },
  ],
  u_008: [
    {
      id: 't_012', title: '软件工程导论作业', description: '完成需求分析文档', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 40,
      subtasks: [
        { id: 'st_029', title: '功能需求梳理', completed: false, estimatedMinutes: 15 },
        { id: 'st_030', title: '用例图绘制', completed: false, estimatedMinutes: 10 },
        { id: 'st_031', title: '非功能需求', completed: false, estimatedMinutes: 15 },
      ],
    },
    {
      id: 't_013', title: '数据库设计实验', description: '完成 ER 图设计', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 20,
      subtasks: [
        { id: 'st_032', title: '实体识别', completed: true, estimatedMinutes: 5 },
        { id: 'st_033', title: '关系建模', completed: false, estimatedMinutes: 15 },
      ],
    },
  ],
  u_009: [
    {
      id: 't_014', title: '操作系统实验', description: '完成进程调度模拟', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 30,
      subtasks: [
        { id: 'st_034', title: 'FCFS 算法实现', completed: true, estimatedMinutes: 10 },
        { id: 'st_035', title: 'RR 算法实现', completed: false, estimatedMinutes: 20 },
      ],
    },
  ],
  u_010: [
    {
      id: 't_015', title: '编译原理大作业', description: '实现简单的词法分析器', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 45,
      subtasks: [
        { id: 'st_036', title: '正则表达式设计', completed: false, estimatedMinutes: 15 },
        { id: 'st_037', title: 'DFA 状态机', completed: false, estimatedMinutes: 15 },
        { id: 'st_038', title: '测试用例', completed: false, estimatedMinutes: 15 },
      ],
    },
  ],
  u_011: [
    {
      id: 't_016', title: '计算机网络复习', description: 'TCP/IP 协议栈复习', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 25,
      subtasks: [
        { id: 'st_039', title: 'TCP 三次握手', completed: false, estimatedMinutes: 10 },
        { id: 'st_040', title: '拥塞控制算法', completed: false, estimatedMinutes: 15 },
      ],
    },
  ],
  u_012: [
    {
      id: 't_017', title: '毕业设计开题报告', description: '完成开题报告初稿', status: 'PENDING',
      taskDate: dayjs().format('YYYY-MM-DD'), totalMinutes: 60,
      subtasks: [
        { id: 'st_041', title: '选题背景', completed: false, estimatedMinutes: 20 },
        { id: 'st_042', title: '技术方案', completed: false, estimatedMinutes: 20 },
        { id: 'st_043', title: '预期成果', completed: false, estimatedMinutes: 20 },
      ],
    },
  ],
}

// ========== 统计数据 ==========
export const MOCK_TASK_STATS: Record<string, any> = {
  u_001: { todayTotal: 2, todayCompleted: 1, todayRate: 50, weekRate: 85, streakDays: 7, totalCompletedThisWeek: 12 },
  u_002: { todayTotal: 3, todayCompleted: 1, todayRate: 33, weekRate: 55, streakDays: 1, totalCompletedThisWeek: 8 },
  u_003: { todayTotal: 2, todayCompleted: 0, todayRate: 0, weekRate: 20, streakDays: 0, totalCompletedThisWeek: 2 },
  u_004: { todayTotal: 0, todayCompleted: 0, todayRate: 0, weekRate: 0, streakDays: 0, totalCompletedThisWeek: 0 },
  u_005: { todayTotal: 2, todayCompleted: 1, todayRate: 50, weekRate: 92, streakDays: 5, totalCompletedThisWeek: 14 },
  u_006: { todayTotal: 1, todayCompleted: 0, todayRate: 0, weekRate: 88, streakDays: 3, totalCompletedThisWeek: 10 },
  u_007: { todayTotal: 1, todayCompleted: 1, todayRate: 100, weekRate: 82, streakDays: 2, totalCompletedThisWeek: 11 },
  u_008: { todayTotal: 2, todayCompleted: 0, todayRate: 0, weekRate: 48, streakDays: 0, totalCompletedThisWeek: 6 },
  u_009: { todayTotal: 1, todayCompleted: 0, todayRate: 0, weekRate: 52, streakDays: 1, totalCompletedThisWeek: 7 },
  u_010: { todayTotal: 1, todayCompleted: 0, todayRate: 0, weekRate: 42, streakDays: 0, totalCompletedThisWeek: 5 },
  u_011: { todayTotal: 1, todayCompleted: 0, todayRate: 0, weekRate: 15, streakDays: 0, totalCompletedThisWeek: 2 },
  u_012: { todayTotal: 1, todayCompleted: 0, todayRate: 0, weekRate: 10, streakDays: 0, totalCompletedThisWeek: 1 },
}

// ========== 通知/推送数据 ==========
export interface Notification {
  id: string
  title: string
  body: string
  status: 'pending' | 'sent' | 'delivered' | 'opened'
  sentAt: string
  openedAt: string | null
}

const now = dayjs()

export const MOCK_NOTIFICATIONS: Record<string, Notification[]> = {
  u_001: [
    { id: 'n_001', title: '🏆 今日完成率 50%，已超过班上 65% 的同学', body: '继续保持，你是最棒的！', status: 'opened', sentAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  ],
  u_002: [
    { id: 'n_002', title: '📚 你还有 2 项任务未完成', body: '现在开始只需 25 分钟，加油！', status: 'opened', sentAt: now.subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { id: 'n_003', title: '⏰ 还有 1 项任务未完成', body: '今天的学习目标就要达成了，再坚持一下！', status: 'delivered', sentAt: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: null },
  ],
  u_003: [
    { id: 'n_004', title: '🎁 连续学习 3 天可获「学霸徽章」奖励', body: '今天就开始你的学习之旅吧 👋', status: 'opened', sentAt: now.subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: now.subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { id: 'n_005', title: '👋 学习不用着急，从一个小任务开始', body: '先做一道题试试？只要 3 分钟 ⏳', status: 'sent', sentAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: null },
  ],
  u_004: [],
  u_005: [
    { id: 'n_006', title: '🏆 今日完成率 50%，已超过班上 70% 的同学', body: '继续保持，你是最棒的！', status: 'opened', sentAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  ],
  u_006: [
    { id: 'n_007', title: '🏆 今日还有 1 项任务未完成', body: '就差一点了，加油完成吧！', status: 'delivered', sentAt: now.subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: null },
  ],
  u_007: [
    { id: 'n_008', title: '🎉 今日任务全部完成！', body: '太棒了！明天的你一定会感谢今天努力的自己', status: 'opened', sentAt: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: now.subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
  ],
  u_008: [
    { id: 'n_009', title: '📚 你还有 2 项任务未完成', body: '现在开始只需 40 分钟，加油！', status: 'sent', sentAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: null },
  ],
  u_009: [
    { id: 'n_010', title: '📚 你还有 1 项任务未完成', body: '今天的学习目标就要达成了，再坚持一下！', status: 'opened', sentAt: now.subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: now.subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss') },
  ],
  u_010: [
    { id: 'n_011', title: '⏰ 你还有 1 项大作业未完成', body: '编译原理大作业需要 45 分钟，现在开始吧！', status: 'delivered', sentAt: now.subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: null },
  ],
  u_011: [
    { id: 'n_012', title: '👋 学习不用着急，从一个小任务开始', body: '先做一道题试试？只要 10 分钟 ⏳', status: 'sent', sentAt: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: null },
  ],
  u_012: [
    { id: 'n_013', title: '🎁 重新开始学习可获「回归徽章」奖励', body: '今天就开始你的学习之旅吧 👋', status: 'sent', sentAt: now.subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'), openedAt: null },
  ],
}

export const MOCK_NOTIFICATION_STATS: Record<string, any> = {
  u_001: { total: 1, delivered: 1, opened: 1, openRate: 100 },
  u_002: { total: 2, delivered: 2, opened: 1, openRate: 50 },
  u_003: { total: 2, delivered: 2, opened: 1, openRate: 50 },
  u_004: { total: 0, delivered: 0, opened: 0, openRate: 0 },
  u_005: { total: 1, delivered: 1, opened: 1, openRate: 100 },
  u_006: { total: 1, delivered: 1, opened: 0, openRate: 0 },
  u_007: { total: 1, delivered: 1, opened: 1, openRate: 100 },
  u_008: { total: 1, delivered: 1, opened: 0, openRate: 0 },
  u_009: { total: 1, delivered: 1, opened: 1, openRate: 100 },
  u_010: { total: 1, delivered: 1, opened: 0, openRate: 0 },
  u_011: { total: 1, delivered: 1, opened: 0, openRate: 0 },
  u_012: { total: 1, delivered: 1, opened: 0, openRate: 0 },
}

// ========== 大盘统计数据 ==========
export const DASHBOARD_STATS = {
  todayCompletionRate: 63.5,
  pushOpenRate: 11.2,
  retention7Day: 72.3,
  pendingReminderUsers: 124000,
  targetCompletionRate: 75,
  targetOpenRate: 15,
  userSegmentation: {
    SELF_DRIVEN: 40,
    NEED_REMINDER: 35,
    DROPOUT: 25,
  },
  pushStrategyComparison: {
    fixed: { openRate: 8.0, completionRate: 60.0 },
    smart: { openRate: 14.8, completionRate: 71.2 },
  },
  weeklyTrend: [
    { day: '周一', completionRate: 58, openRate: 7 },
    { day: '周二', completionRate: 62, openRate: 9 },
    { day: '周三', completionRate: 60, openRate: 8 },
    { day: '周四', completionRate: 65, openRate: 10 },
    { day: '周五', completionRate: 63, openRate: 11 },
    { day: '周六', completionRate: 68, openRate: 12 },
    { day: '周日', completionRate: 64, openRate: 10 },
  ],
}

// ========== 今日提醒时间线 ==========
export const TODAY_REMINDER_TIMELINE = [
  { time: '08:00', user: '张三', type: 'SELF_DRIVEN' as UserType, content: '🏆 进度鼓励', status: '已发送', detail: '今日完成率 50%，已超过班上 65% 的同学' },
  { time: '17:30', user: '李四', type: 'NEED_REMINDER' as UserType, content: '📚 紧迫感提醒', status: '待发送', detail: '你还有 2 项任务未完成，现在开始只需 25 分钟' },
  { time: '18:00', user: '王五', type: 'DROPOUT' as UserType, content: '🎁 激励唤醒', status: '已发送', detail: '连续学习 3 天可获「学霸徽章」奖励' },
  { time: '20:00', user: '王五', type: 'DROPOUT' as UserType, content: '👋 关怀提醒', status: '待发送', detail: '学习不用着急，从一个小任务开始' },
  { time: '19:30', user: '赵六', type: 'COLD_START' as UserType, content: '📚 默认提醒', status: '待发送', detail: '你还有今日任务待完成' },
]

// ========== 智能引擎模拟 ==========
export function simulateEngine(userType: UserType, activeTimeSlot: string | null, incompleteCount: number, completionRate: number): {
  timing: {
    input: any
    output: string
    explanation: string
  }
  content: {
    input: any
    templateMatched: string
    output: string
    bodyOutput: string
    explanation: string
  }
  frequency: {
    checks: { name: string, passed: boolean, detail: string }[]
    result: '✅ 允许发送' | '❌ 拒绝发送'
  }
} {
  const configs: Record<string, { timingOutput: string, timingExplain: string, template: string, title: string, body: string, maxDaily: number, minInterval: number }> = {
    SELF_DRIVEN: {
      timingOutput: activeTimeSlot ? `${activeTimeSlot.split('-')[0]} - 完成任务后即时推送` : '完成任务后即时推送',
      timingExplain: activeTimeSlot ? `活跃时段 ${activeTimeSlot}，用户自律度高，选择在任务完成时发送鼓励` : '冷启动用户，默认在完成任务后发送进度反馈',
      template: 'self_driven_progress',
      title: `🏆 今日完成率 ${completionRate}%，已超过班上 ${Math.min(95, Math.round(completionRate * 0.8 + 20))}% 的同学`,
      body: '继续保持，你是最棒的！',
      maxDaily: 1,
      minInterval: 0,
    },
    NEED_REMINDER: {
      timingOutput: activeTimeSlot ? `${activeTimeSlot.split('-')[0]} 前 30 分钟推送` : '18:00 推送',
      timingExplain: activeTimeSlot ? `活跃时段 ${activeTimeSlot}，前 30 分钟推送以提前唤起用户` : '无活跃时段数据，默认在放学高峰前推送',
      template: 'need_reminder_urgent',
      title: `📚 你还有 ${incompleteCount} 项任务未完成`,
      body: `现在开始只需 ${incompleteCount * 15} 分钟，加油！`,
      maxDaily: 2,
      minInterval: 2,
    },
    DROPOUT: {
      timingOutput: activeTimeSlot ? `${activeTimeSlot.split('-')[0]} 前 30 分钟 + 次日 10:00` : '18:00 + 20:00 双次推送',
      timingExplain: '流失倾向型用户，需要多次触达。选择 18:00（放学高峰）和 20:00（晚饭后）两个关键时段',
      template: 'dropout_reward',
      title: '🎁 连续学习 3 天可获「学霸徽章」奖励',
      body: '今天就开始你的学习之旅吧 👋',
      maxDaily: 3,
      minInterval: 2,
    },
    COLD_START: {
      timingOutput: '18:00 推送',
      timingExplain: '冷启动用户，使用默认推送策略，7 天后根据行为数据重新分层',
      template: 'cold_start_default',
      title: `📚 你还有 ${Math.max(1, incompleteCount)} 项任务等待完成`,
      body: '开始你的学习之旅吧！',
      maxDaily: 2,
      minInterval: 2,
    },
  }

  const cfg = configs[userType]

  return {
    timing: {
      input: { userType, activeTimeSlot, incompleteCount, completionRate },
      output: cfg.timingOutput,
      explanation: cfg.timingExplain,
    },
    content: {
      input: { userType, incompleteCount, completionRate },
      templateMatched: cfg.template,
      output: cfg.title,
      bodyOutput: cfg.body,
      explanation: `匹配 ${userType} 模板 → 填充变量 {count=${incompleteCount}} {rate=${completionRate}} → "${cfg.title}"`,
    },
    frequency: {
      checks: [
        { name: '每日限额检查', passed: true, detail: `每日上限 ${cfg.maxDaily} 条，当前已发 0 条` },
        { name: '最小间隔检查', passed: true, detail: `最小间隔 ${cfg.minInterval} 小时，上次推送在 3 小时前` },
        { name: '免打扰时段', passed: true, detail: '当前时间不在 21:30-07:00 免打扰范围内' },
        { name: '在线状态检查', passed: true, detail: '用户当前不在线' },
      ],
      result: '✅ 允许发送',
    },
  }
}

// ========== A/B 实验数据 ==========
export const MOCK_EXPERIMENTS = [
  { id: 1, name: '推送时机优化 V1', description: '固定 18:00 vs 智能时段推送', status: 'RUNNING', targetUserType: null, startedAt: '2026-05-18', endedAt: null },
  { id: 2, name: '文案个性化 V2', description: '固定文案 vs 分层模板', status: 'ANALYZING', targetUserType: 'NEED_REMINDER', startedAt: '2026-05-04', endedAt: '2026-05-18' },
  { id: 3, name: '频次优化 V3', description: '每天 1 次 vs 分层动态频次', status: 'DRAFT', targetUserType: null, startedAt: null, endedAt: null },
]

export const MOCK_EXPERIMENT_GROUPS: Record<number, any[]> = {
  1: [
    { id: 1, groupName: 'control（固定 18:00）', trafficPercent: 50, userCount: 150000, configJson: '{"time":"18:00"}', openRate: 8.0, completionRate: 60.0 },
    { id: 2, groupName: 'variant_a（智能时段）', trafficPercent: 50, userCount: 150000, configJson: '{"time":"smart"}', openRate: 14.8, completionRate: 71.2 },
  ],
  2: [
    { id: 3, groupName: 'control（固定文案）', trafficPercent: 50, userCount: 52500, configJson: '{"template":"fixed"}', openRate: 9.2, completionRate: 62.0 },
    { id: 4, groupName: 'variant_a（分层模板）', trafficPercent: 50, userCount: 52500, configJson: '{"template":"segmented"}', openRate: 15.1, completionRate: 73.5 },
  ],
  3: [],
}

// ========== 用户列表 ==========
export const MOCK_USER_LIST = [
  { id: 'u_001', username: 'zhangsan', realName: '张三', userType: 'SELF_DRIVEN' as UserType, pushEnabled: true, weeklyCompletionRate: 0.85, consecutiveMissDays: 0 },
  { id: 'u_002', username: 'lisi', realName: '李四', userType: 'NEED_REMINDER' as UserType, pushEnabled: true, weeklyCompletionRate: 0.55, consecutiveMissDays: 1 },
  { id: 'u_003', username: 'wangwu', realName: '王五', userType: 'DROPOUT' as UserType, pushEnabled: false, weeklyCompletionRate: 0.20, consecutiveMissDays: 5 },
  { id: 'u_004', username: 'zhaoliu', realName: '赵六', userType: 'COLD_START' as UserType, pushEnabled: true, weeklyCompletionRate: 0.0, consecutiveMissDays: 2 },
  { id: 'u_005', username: 'sunqi', realName: '孙七', userType: 'SELF_DRIVEN' as UserType, pushEnabled: true, weeklyCompletionRate: 0.92, consecutiveMissDays: 0 },
  { id: 'u_006', username: 'zhouba', realName: '周八', userType: 'SELF_DRIVEN' as UserType, pushEnabled: true, weeklyCompletionRate: 0.88, consecutiveMissDays: 0 },
  { id: 'u_007', username: 'wujiu', realName: '吴九', userType: 'SELF_DRIVEN' as UserType, pushEnabled: true, weeklyCompletionRate: 0.82, consecutiveMissDays: 0 },
  { id: 'u_008', username: 'zhengshi', realName: '郑十', userType: 'NEED_REMINDER' as UserType, pushEnabled: true, weeklyCompletionRate: 0.48, consecutiveMissDays: 2 },
  { id: 'u_009', username: 'fengyi', realName: '冯十一', userType: 'NEED_REMINDER' as UserType, pushEnabled: true, weeklyCompletionRate: 0.52, consecutiveMissDays: 1 },
  { id: 'u_010', username: 'chener', realName: '陈十二', userType: 'NEED_REMINDER' as UserType, pushEnabled: false, weeklyCompletionRate: 0.42, consecutiveMissDays: 3 },
  { id: 'u_011', username: 'chusan', realName: '褚十三', userType: 'DROPOUT' as UserType, pushEnabled: true, weeklyCompletionRate: 0.15, consecutiveMissDays: 6 },
  { id: 'u_012', username: 'weisi', realName: '卫十四', userType: 'DROPOUT' as UserType, pushEnabled: false, weeklyCompletionRate: 0.10, consecutiveMissDays: 8 },
]

// ========== 系统统计数据 ==========
export const MOCK_SYSTEM_STATS = {
  totalUsers: 500000,
  paidUsers: 300000,
  dau: 500000,
  usersByType: { SELF_DRIVEN: 200000, NEED_REMINDER: 175000, DROPOUT: 125000 },
}
