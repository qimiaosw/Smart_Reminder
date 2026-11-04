import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Progress, Descriptions, Divider, Typography, Spin, Empty, message } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { userApi } from '../api/endpoints'
import { userTypeLabels, userTypeColors, type UserType } from '../mock/data'

const { Text } = Typography

const strategies: Record<string, { maxDaily: number; timing: string; content: string }> = {
  SELF_DRIVEN: { maxDaily: 1, timing: '任务完成时即时推送', content: '进度鼓励 + 排行榜对比' },
  NEED_REMINDER: { maxDaily: 2, timing: '活跃时段前 30 分钟', content: '紧迫感 + 任务清单' },
  DROPOUT: { maxDaily: 3, timing: '18:00 + 20:00 双次', content: '激励唤醒 + 关怀提醒' },
  COLD_START: { maxDaily: 2, timing: '18:00 默认推送', content: '通用模板' },
}

interface UserFromAPI {
  id: string
  username: string
  realName: string
  userType: string
  pushEnabled: boolean
  activeTimeSlot: string | null
  consecutiveMissDays: number
  weeklyCompletionRate: number
}

export default function UserProfile() {
  const [users, setUsers] = useState<UserFromAPI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    userApi.list().then((res: any) => {
      if (!cancelled) setUsers(res.data || [])
    }).catch(() => {
      if (!cancelled) message.error('获取用户列表失败')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
  if (users.length === 0) return <Empty description="暂无用户数据" />

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {users.map((user) => {
          const strategy = strategies[user.userType] || strategies.COLD_START
          const color = userTypeColors[user.userType as UserType] || '#d9d9d9'
          return (
            <Col span={12} key={user.id} style={{ marginBottom: 16 }}>
              <Card
                hoverable
                style={{ borderLeft: `4px solid ${color}`, height: '100%' }}
                title={
                  <span>
                    <Tag color={color} style={{ fontSize: 12 }}>
                      {userTypeLabels[user.userType as UserType] || user.userType}
                    </Tag>
                    {user.realName}
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>@{user.username}</Text>
                  </span>
                }
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <Progress
                        type="dashboard"
                        percent={Math.round(user.weeklyCompletionRate * 100)}
                        size={80}
                        strokeColor={color}
                        format={(p) => `${p}%`}
                      />
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>近 7 天完成率</div>
                    </div>
                  </Col>
                  <Col span={16}>
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="连续完成" span={2}>
                        {user.consecutiveMissDays > 0 ? (
                          <span><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 中断 {user.consecutiveMissDays} 天</span>
                        ) : (
                          <span><FireOutlined style={{ color: '#ff4d4f' }} /> 连续完成中 🔥</span>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="活跃时段">
                        {user.activeTimeSlot || '未确定'}
                      </Descriptions.Item>
                      <Descriptions.Item label="推送开关">
                        {user.pushEnabled ? (
                          <Tag color="green" icon={<CheckCircleOutlined />}>开启</Tag>
                        ) : (
                          <Tag color="red" icon={<CloseCircleOutlined />}>关闭</Tag>
                        )}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  <ThunderboltOutlined /> 智能推送策略
                </Text>
                <Row gutter={8}>
                  <Col span={8}>
                    <Card size="small" style={{ background: '#fafafa' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>每日上限</Text>
                      <div style={{ fontSize: 18, fontWeight: 600, color }}>{strategy.maxDaily} 条</div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" style={{ background: '#fafafa' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>推送时机</Text>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{strategy.timing}</div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" style={{ background: '#fafafa' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>文案策略</Text>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{strategy.content}</div>
                    </Card>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  <ClockCircleOutlined /> 本周完成模拟
                </Text>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => {
                    const baseRate = user.weeklyCompletionRate
                    // Use deterministic variance based on username + day index to prevent jitter
                    const seed = (user.username || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0)
                    const variance = ((Math.sin(seed * (i + 1) * 0.7) + 1) / 2 - 0.3) * 0.3
                    const dayRate = Math.max(0, Math.min(1, baseRate + variance))
                    const completed = dayRate > 0.3
                    return (
                      <div key={d} style={{ flex: 1, textAlign: 'center' }}>
                        <div
                          style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: completed ? color : '#f0f0f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 2px',
                          }}
                        >
                          {completed
                            ? <CheckCircleOutlined style={{ color: '#fff', fontSize: 14 }} />
                            : <CloseCircleOutlined style={{ color: '#ccc', fontSize: 14 }} />}
                        </div>
                        <div style={{ fontSize: 10, color: '#999' }}>{d}</div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      <Card title="📋 各分层推送策略总览">
        <Row gutter={16}>
          {Object.entries(strategies).map(([type, s]) => (
            <Col span={6} key={type}>
              <Card
                size="small"
                style={{ borderTop: `3px solid ${userTypeColors[type as UserType] || '#d9d9d9'}`, background: '#fafafa', height: '100%' }}
                title={<Tag color={userTypeColors[type as UserType]} style={{ fontSize: 11 }}>{userTypeLabels[type as UserType] || type}</Tag>}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="每日上限">{s.maxDaily} 条</Descriptions.Item>
                  <Descriptions.Item label="推送时机">{s.timing}</Descriptions.Item>
                  <Descriptions.Item label="文案策略">{s.content}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
