import { useState, useEffect } from 'react'
import { Card, Row, Col, Progress, Spin, Statistic, Tag, Typography, Timeline, Empty, message } from 'antd'
import {
  CheckCircleOutlined,
  BellOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { userApi, abtestApi, dashboardApi } from '../api/endpoints'
import { userTypeLabels, userTypeColors, DASHBOARD_STATS, type UserType } from '../mock/data'

const { Text } = Typography

interface UserFromAPI {
  id: string
  username: string
  userType: string
  weeklyCompletionRate: number
  pushEnabled: boolean
}

interface StatsFromAPI {
  total: number
  byType: Record<string, number>
}

interface ExperimentGroup {
  groupName: string
  openRate: number
  completionRate: number
  trafficPercent: number
  userCount: number
}

interface TrendItem {
  day: string
  completionRate: number
  openRate: number
}

interface TimelineItem {
  time: string
  user: string
  type: string
  content: string
  status: string
  detail: string
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserFromAPI[]>([])
  const [stats, setStats] = useState<StatsFromAPI | null>(null)
  const [expGroups, setExpGroups] = useState<ExperimentGroup[]>([])
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      userApi.list().catch(() => ({ data: [] as UserFromAPI[] })),
      userApi.getStats().catch(() => ({ data: { total: 0, byType: {} } })),
      // 优先选已完成或运行中且有数据的实验：从旧的开始匹配（旧实验数据更全）
      abtestApi.listExperiments().then((res: any) => {
        const exps = (res.data || []) as any[]
        const matches = exps.filter((e: any) => e.status === 'RUNNING' || e.status === 'ANALYZING' || e.status === 'COMPLETED')
        if (matches.length === 0) return { data: { groups: [] } } as any
        // 异步挑出第一个两组都有用户的实验
        const tryFind = async (): Promise<any> => {
          for (const exp of matches) {
            try {
              const report: any = await abtestApi.getReport(exp.id)
              const gs = report?.data?.groups || []
              if (gs.length >= 2 && gs[0]?.userCount > 0 && gs[1]?.userCount > 0) {
                return report
              }
            } catch { /* skip failed report */ }
          }
          // 回退：没有两组都有数据的实验，取第一个
          try { return await abtestApi.getReport(matches[0].id) } catch { return { data: { groups: [] } } }
        }
        return tryFind()
      }).catch(() => ({ data: { groups: [] } } as any)),
      dashboardApi.getTrend().catch(() => ({ data: [] })),
      dashboardApi.getTimeline().catch(() => ({ data: [] })),
    ]).then(([usersRes, statsRes, expRes, trendRes, timelineRes]: any) => {
      if (cancelled) return
      setUsers(usersRes.data || [])
      setStats(statsRes.data || null)
      setExpGroups(expRes?.data?.groups || [])
      setTrend(trendRes.data || [])
      setTimeline(timelineRes.data || [])
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  const totalUsers = stats?.total || users.length
  const byType = stats?.byType || {}
  const totalWithType = Object.values(byType).reduce((a, b) => a + b, 0)

  // 计算当前完成率：从所有用户的 weeklyCompletionRate 取均值
  const avgCompletionRate = users.length > 0
    ? Math.round(users.reduce((s, u) => s + u.weeklyCompletionRate, 0) / users.length * 100)
    : 0

  const completionProgress = Math.round((avgCompletionRate / 75) * 100)

  // 从真实的 A/B 实验数据获取策略对比（按组名匹配，而非假设数组顺序）
  const controlGroup = expGroups.find((g: any) => g.groupName?.includes('control')) || expGroups[0]
  const variantGroup = expGroups.find((g: any) => g.groupName?.includes('variant')) || expGroups[1]
  const hasExpData = controlGroup?.openRate != null || variantGroup?.openRate != null

  // 计算分层占比
  const segmentation: Record<string, { count: number; percent: number }> = {}
  for (const [type, count] of Object.entries(byType)) {
    segmentation[type] = { count, percent: totalWithType > 0 ? Math.round((count / totalWithType) * 100) : 0 }
  }

  return (
    <div>
      {/* 目标达成进度 */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row gutter={48} align="middle">
          <Col span={12}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>🎯 核心目标达成进度</Text>
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: 4 }}>
                  <span>平均任务完成率</span>
                  <span>{avgCompletionRate}% / 75%</span>
                </div>
                <Progress percent={completionProgress} strokeColor="#52c41a" trailColor="rgba(255,255,255,0.3)" format={() => ''} />
              </div>
            </div>
          </Col>
          <Col span={12}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>+{Math.round((avgCompletionRate / 60 - 1) * 100)}%</div>
                  <div>完成率较之前提升</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>
                    {hasExpData && variantGroup ? `${variantGroup.openRate}%` : `${DASHBOARD_STATS.pushOpenRate}%`}
                  </div>
                  <div>推送打开率</div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 核心指标 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="平均完成率" value={avgCompletionRate} suffix="%" prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="总用户数" value={totalUsers} suffix="人" prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title={variantGroup ? variantGroup.groupName : 'A/B 实验打开率'}
              value={variantGroup?.openRate ?? '-'}
              suffix="%"
              prefix={<BellOutlined />}
              valueStyle={{ color: variantGroup?.openRate ? '#1890ff' : undefined }}
            />
            {controlGroup && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                对照组 {controlGroup.openRate}%
              </Text>
            )}
            {!hasExpData && <Text type="secondary" style={{ fontSize: 12 }}>暂无实验数据</Text>}
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="实验组完成率"
              value={variantGroup?.completionRate ?? '-'}
              suffix="%"
              valueStyle={{ color: variantGroup?.completionRate ? '#722ed1' : undefined }}
            />
            {controlGroup && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                对照组 {controlGroup.completionRate}%
              </Text>
            )}
            {!hasExpData && <Text type="secondary" style={{ fontSize: 12 }}>创建实验查看对比</Text>}
          </Card>
        </Col>
      </Row>

      {/* 分层分布 + 策略对比 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="👥 用户分层分布">
            {Object.keys(segmentation).length === 0 ? <Empty description="暂无数据" /> : (
              <div style={{ padding: '16px 0' }}>
                {Object.entries(segmentation).map(([type, data]) => (
                  <div key={type} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Tag color={userTypeColors[type as UserType] || '#d9d9d9'}>
                        {userTypeLabels[type as UserType] || type}
                      </Tag>
                      <span style={{ fontWeight: 600 }}>{data.percent}%（{data.count}人）</span>
                    </div>
                    <Progress percent={data.percent} strokeColor={userTypeColors[type as UserType] || '#d9d9d9'} trailColor="#f0f0f0" showInfo={false} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="📊 推送策略 A/B 对比">
            {!hasExpData ? <Empty description="暂无实验数据，去 A/B 实验页创建" /> : (
              <Row gutter={24}>
                <Col span={12}>
                  <Card size="small" style={{ background: '#fafafa' }}
                    actions={[<Text type="danger">打开率 {controlGroup.openRate}%</Text>]}>
                    <Statistic title="对照组" value={controlGroup.groupName} valueStyle={{ fontSize: 14 }} />
                    <Statistic title="任务完成率" value={controlGroup.completionRate} suffix="%" valueStyle={{ fontSize: 20, color: '#999' }} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}
                    actions={[<Text style={{ color: '#52c41a', fontWeight: 600 }}>打开率 {variantGroup.openRate}% ↑</Text>]}>
                    <Statistic title="实验组" value={variantGroup.groupName} valueStyle={{ fontSize: 14, color: '#52c41a' }} />
                    <Statistic title="任务完成率" value={variantGroup.completionRate} suffix="%" valueStyle={{ fontSize: 20, color: '#52c41a' }} />
                  </Card>
                </Col>
              </Row>
            )}
            {hasExpData && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                  打开率提升 {((variantGroup.openRate - controlGroup.openRate) / controlGroup.openRate * 100).toFixed(1)}%
                </Tag>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 本周趋势 + 今日时间线 */}
      <Row gutter={16}>
        <Col span={14}>
          <Card title="📈 本周完成率趋势">
            {trend.length === 0 ? <Empty description="暂无数据" /> : trend.map((day) => (
              <div key={day.day} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text style={{ width: 40, textAlign: 'right' }}>{day.day}</Text>
                <div style={{ flex: 1 }}>
                  <Progress percent={day.completionRate} size="small"
                    strokeColor={day.completionRate >= 75 ? '#52c41a' : day.completionRate >= 60 ? '#1890ff' : '#faad14'}
                    format={() => `${day.completionRate}%`} />
                </div>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="🕐 今日智能提醒时间线" styles={{ body: { padding: '16px 12px 16px 16px' } }}>
            {timeline.length === 0 ? <Empty description="暂无今日推送" /> : (
              <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
              <Timeline items={timeline.map((r) => ({
                color: r.status === '已读' || r.status === '已送达' ? 'green' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      <Tag color={userTypeColors[r.type as UserType]} style={{ fontSize: 10 }}>
                        {userTypeLabels[r.type as UserType] || r.type}
                      </Tag>
                      {r.time} {r.user} — {r.content}
                    </div>
                    <div style={{ color: '#666', fontSize: 13 }}>{r.detail}</div>
                    <Tag color={r.status === '已发送' || r.status === '已送达' || r.status === '已读' ? 'green' : 'processing'} style={{ marginTop: 2, fontSize: 10 }}>
                      {r.status}
                    </Tag>
                  </div>
                ),
              }))} />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
