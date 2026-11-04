import dayjs from 'dayjs'
import {
  MOCK_USERS,
  MOCK_TASKS,
  MOCK_TASK_STATS,
  MOCK_NOTIFICATIONS,
  MOCK_NOTIFICATION_STATS,
  MOCK_EXPERIMENTS,
  MOCK_EXPERIMENT_GROUPS,
  MOCK_USER_LIST,
  DASHBOARD_STATS,
  TODAY_REMINDER_TIMELINE,
  simulateEngine,
  MOCK_SYSTEM_STATS,
  type UserType,
} from './data'

type MockHandler = (url: string, params?: any, data?: any) => { data: any } | null

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export const mockHandlers: MockHandler[] = [
  // ========== Dashboard ==========
  (url) => {
    if (url === '/dashboard/stats') {
      return { data: DASHBOARD_STATS }
    }
    return null
  },
  (url) => {
    if (url === '/dashboard/timeline') {
      return { data: TODAY_REMINDER_TIMELINE }
    }
    return null
  },
  (url) => {
    if (url === '/dashboard/trend') {
      return { data: DASHBOARD_STATS.weeklyTrend }
    }
    return null
  },

  // ========== Users ==========
  (url, params) => {
    const match = url.match(/^\/users\/([^/]+)$/)
    if (match) {
      const user = MOCK_USERS[match[1]]
      return { data: user || null }
    }
    return null
  },
  (url) => {
    if (url === '/users') {
      // Return list, optionally filter by type
      return { data: MOCK_USER_LIST }
    }
    return null
  },
  (url) => {
    if (url === '/users/stats') {
      return { data: MOCK_SYSTEM_STATS }
    }
    return null
  },
  (url, params, body) => {
    const match = url.match(/^\/users\/([^/]+)\/settings$/)
    if (match && body) {
      // Update user settings (mock - just return success)
      const user = MOCK_USERS[match[1]]
      if (user) {
        Object.assign(user, body)
      }
      return { data: { success: true } }
    }
    return null
  },
  (url, params, body) => {
    const match = url.match(/^\/users\/([^/]+)\/type$/)
    if (match && body) {
      const user = MOCK_USERS[match[1]]
      if (user) {
        user.userType = (body as any).userType
      }
      return { data: { success: true } }
    }
    return null
  },
  (url, params, body) => {
    if (url === '/users/login' && body) {
      const { username, password } = body as any
      const user = Object.values(MOCK_USERS).find((u) => u.username === username)
      if (user) {
        return { data: { token: 'mock_token_' + user.id, userId: user.id, userType: user.userType } }
      }
      return { data: null }
    }
    return null
  },
  (url, params, body) => {
    if (url === '/users/register' && body) {
      const { username, realName } = body as any
      const newId = 'u_' + String(Object.keys(MOCK_USERS).length + 1).padStart(3, '0')
      return { data: { token: 'mock_token_' + newId, userId: newId, userType: 'COLD_START' as UserType } }
    }
    return null
  },

  // ========== Tasks ==========
  (url, params) => {
    const match = url.match(/^\/tasks\/daily\/([^/]+)$/)
    if (match) {
      const userId = match[1]
      return { data: MOCK_TASKS[userId] || [] }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/tasks\/([^/]+)$/)
    if (match) {
      // Find task by id across all users
      for (const tasks of Object.values(MOCK_TASKS)) {
        const task = (tasks as any[]).find((t) => t.id === match![1])
        if (task) return { data: task }
      }
      return { data: null }
    }
    return null
  },
  (url, params, body) => {
    const match = url.match(/^\/tasks\/([^/]+)\/complete$/)
    if (match) {
      for (const tasks of Object.values(MOCK_TASKS)) {
        const task = (tasks as any[]).find((t) => t.id === match![1])
        if (task) {
          task.status = 'COMPLETED'
          return { data: { success: true } }
        }
      }
      return { data: { success: false } }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/tasks\/([^/]+)\/subtasks$/)
    if (match) {
      for (const tasks of Object.values(MOCK_TASKS)) {
        const task = (tasks as any[]).find((t) => t.id === match![1])
        if (task) return { data: task.subtasks || [] }
      }
      return { data: [] }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/tasks\/subtasks\/([^/]+)\/complete$/)
    if (match) {
      for (const tasks of Object.values(MOCK_TASKS)) {
        for (const task of tasks as any[]) {
          const sub = (task.subtasks || []).find((s: any) => s.id === match![1])
          if (sub) {
            sub.completed = true
            return { data: { success: true } }
          }
        }
      }
      return { data: { success: false } }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/tasks\/stats\/([^/]+)$/)
    if (match) {
      return { data: MOCK_TASK_STATS[match[1]] || { todayTotal: 0, todayCompleted: 0, todayRate: 0, weekRate: 0, streakDays: 0, totalCompletedThisWeek: 0 } }
    }
    return null
  },

  // ========== Notifications ==========
  (url) => {
    const match = url.match(/^\/notifications\/history\/([^/]+)$/)
    if (match) {
      return { data: MOCK_NOTIFICATIONS[match[1]] || [] }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/notifications\/unread\/([^/]+)$/)
    if (match) {
      const notifs = MOCK_NOTIFICATIONS[match[1]] || []
      const unread = notifs.filter((n) => n.status !== 'opened' && n.status !== 'pending').length
      return { data: { count: unread } }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/notifications\/stats\/([^/]+)$/)
    if (match) {
      return { data: MOCK_NOTIFICATION_STATS[match[1]] || { total: 0, delivered: 0, opened: 0, openRate: 0 } }
    }
    return null
  },
  (url) => {
    if (url === '/notifications/templates') {
      return {
        data: [
          { id: 'self_driven_progress', name: '自律型-进度鼓励', titleTemplate: '🏆 今日完成率 {rate}%，已超过班上 {percentile}% 的同学', bodyTemplate: '继续保持，你是最棒的！', targetUserType: 'SELF_DRIVEN', isActive: true },
          { id: 'need_reminder_urgent', name: '需提醒型-紧迫感', titleTemplate: '📚 你还有 {count} 项任务未完成', bodyTemplate: '现在开始只需 {minutes} 分钟，加油！', targetUserType: 'NEED_REMINDER', isActive: true },
          { id: 'dropout_reward', name: '流失型-激励唤醒', titleTemplate: '🎁 连续学习 3 天可获 {reward} 奖励', bodyTemplate: '今天就开始你的学习之旅吧 👋', targetUserType: 'DROPOUT', isActive: true },
          { id: 'missed_care', name: '连续未完成-关怀', titleTemplate: '👋 学习不用着急，从一个小任务开始', bodyTemplate: '先做一道题试试？只要 3 分钟 ⏳', targetUserType: null, isActive: true },
        ],
      }
    }
    return null
  },

  // ========== Engine ==========
  (url) => {
    const match = url.match(/^\/engine\/simulate\/([^/]+)$/)
    if (match) {
      const userId = match[1]
      const user = MOCK_USERS[userId]
      if (!user) return { data: null }
      const tasks = MOCK_TASKS[userId] || []
      const incompleteCount = tasks.filter((t) => t.status !== 'COMPLETED').length
      const result = simulateEngine(
        user.userType,
        user.activeTimeSlot,
        incompleteCount,
        user.weeklyCompletionRate,
      )
      return { data: result }
    }
    return null
  },

  // ========== AB Test ==========
  (url) => {
    if (url === '/abtest/experiments') {
      return { data: MOCK_EXPERIMENTS }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/abtest\/experiments\/(\d+)$/)
    if (match) {
      const exp = MOCK_EXPERIMENTS.find((e) => e.id === Number(match[1]))
      return { data: exp || null }
    }
    return null
  },
  (url, params, body) => {
    const match = url.match(/^\/abtest\/experiments\/(\d+)\/status$/)
    if (match && body) {
      const exp = MOCK_EXPERIMENTS.find((e) => e.id === Number(match[1]))
      if (exp) {
        exp.status = (body as any).status
      }
      return { data: { success: true } }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/abtest\/experiments\/(\d+)\/groups$/)
    if (match) {
      return { data: MOCK_EXPERIMENT_GROUPS[Number(match[1])] || [] }
    }
    return null
  },
  (url) => {
    const match = url.match(/^\/abtest\/experiments\/(\d+)\/report$/)
    if (match) {
      const expId = Number(match[1])
      const groups = MOCK_EXPERIMENT_GROUPS[expId] || []
      const experiment = MOCK_EXPERIMENTS.find((e) => e.id === expId) || null
      return { data: { experiment, groups } }
    }
    return null
  },

  // ========== Events ==========
  (url, params, body) => {
    if (url === '/events' && body) {
      return { data: { success: true } }
    }
    return null
  },
]

export async function handleMockRequest(method: string, url: string, params?: any, data?: any): Promise<{ data: any } | null> {
  await delay(150 + Math.random() * 200)

  // Strip /api/v1 prefix
  const path = url.replace(/^\/api\/v1/, '')

  for (const handler of mockHandlers) {
    const result = handler(path, params, data)
    if (result !== null) {
      return result
    }
  }

  return null
}
