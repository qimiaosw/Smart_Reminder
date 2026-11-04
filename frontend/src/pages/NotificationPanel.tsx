import { useState, useEffect } from 'react'
import { Card, List, Tag, Statistic, Row, Col, Spin, Empty, message, Timeline, Typography, Divider, Badge, Progress } from 'antd'
import {
  BellOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../store/userStore'
import { notificationApi, userApi } from '../api/endpoints'
import { userTypeLabels, userTypeColors, type UserType } from '../mock/data'
import dayjs from 'dayjs'

const { Text } = Typography

interface Notification {
  id: string
  title: string
  body: string
  status: string
  sentAt: string
  openedAt: string | null
}

export default function NotificationPanel() {
  const { currentUserId } = useUserStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [userInfo, setUserInfo] = useState<{ userType: string; pushEnabled: boolean; activeTimeSlot: string | null } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [historyRes, statsRes, userRes]: any = await Promise.all([
        notificationApi.getHistory(currentUserId),
        notificationApi.getStats(currentUserId),
        userApi.getById(currentUserId),
      ])
      setNotifications(historyRes.data || [])
      setStats(statsRes.data || {})
      if (userRes.data) setUserInfo({ userType: userRes.data.userType, pushEnabled: userRes.data.pushEnabled, activeTimeSlot: userRes.data.activeTimeSlot })
    } catch {
      message.error('获取数据失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [currentUserId])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  const openRate = stats.total > 0 ? ((stats.opened || 0) / stats.total) * 100 : 0

  return (
    <div>
      {/* 用户信息摘要 */}
      {userInfo && (
          <Card
            size="small"
            style={{
              marginBottom: 16,
              borderLeft: `4px solid ${userTypeColors[userInfo.userType as UserType]}`,
            }}
          >
            <Row align="middle" gutter={16}>
              <Col>
                <Tag color={userTypeColors[userInfo.userType as UserType]}>
                  {userTypeLabels[userInfo.userType as UserType]}
                </Tag>
              </Col>
              <Col>
                <BellOutlined /> 推送 {userInfo.pushEnabled ? '已开启' : '已关闭'}
              </Col>
              <Col>
                <ClockCircleOutlined /> 活跃时段 {userInfo.activeTimeSlot || '未设置'}
              </Col>
            </Row>
          </Card>
        )}

      {/* 推送统计数据 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="总推送数" value={stats.total || 0} prefix={<SendOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="送达数"
              value={stats.delivered || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="打开数"
              value={stats.opened || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="打开率"
              value={stats.openRate || openRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: openRate >= 15 ? '#52c41a' : openRate >= 8 ? '#faad14' : '#ff4d4f' }}
              prefix={<RiseOutlined />}
            />
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>目标 15%</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 推送历史时间线 */}
      {notifications.length === 0 ? (
        <Empty description="暂无推送记录" />
      ) : (
        (() => {
          const items = notifications.map((n) => ({
            color: n.status === 'opened' ? 'green' : n.status === 'delivered' ? 'blue' : n.status === 'sent' ? 'orange' : 'gray',
            dot: n.status === 'opened' ? <CheckCircleOutlined /> : <BellOutlined />,
            children: (
              <Card size="small" style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 500 }}>{n.title}</div>
                {n.body && <div style={{ color: '#666', fontSize: 13 }}>{n.body}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(n.sentAt).format('MM-DD HH:mm')}
                  </Text>
                  {n.openedAt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      · 已读 {dayjs(n.openedAt).format('HH:mm')}
                    </Text>
                  )}
                  <Tag
                    color={n.status === 'opened' ? 'green' : n.status === 'delivered' ? 'blue' : n.status === 'sent' ? 'orange' : 'default'}
                    style={{ fontSize: 10 }}
                  >
                    {n.status === 'opened' ? '已读' : n.status === 'delivered' ? '已送达' : n.status === 'sent' ? '已发送' : '待发送'}
                  </Tag>
                </div>
              </Card>
            ),
          }))
          return <Timeline items={items} />
        })()
      )}

      <Divider />

      {/* 各分层推送策略对比 */}
      <Card title={<span><ThunderboltOutlined /> 各分层推送策略对比</span>}>
        <Row gutter={16}>
          <Col span={8}>
            <Card
              size="small"
              style={{ borderTop: '3px solid #52c41a', background: '#fafafa', height: '100%' }}
              title={<Tag color="green">自律型</Tag>}
            >
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                • 每日最多 <strong>1</strong> 条推送<br />
                • 推送时机：完成任务后即时发送<br />
                • 文案：进度鼓励 + 排行榜对比<br />
                • 免打扰时段：21:30–07:00<br />
                • 不二次推送
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              size="small"
              style={{ borderTop: '3px solid #faad14', background: '#fafafa', height: '100%' }}
              title={<Tag color="gold">需提醒型</Tag>}
            >
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                • 每日最多 <strong>2</strong> 条推送<br />
                • 推送时机：活跃时段前 30 分钟<br />
                • 文案：紧迫感 + 任务清单<br />
                • 最小间隔：≥ 2 小时<br />
                • 1 小时未完成补一次
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              size="small"
              style={{ borderTop: '3px solid #ff4d4f', background: '#fafafa', height: '100%' }}
              title={<Tag color="red">流失倾向型</Tag>}
            >
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                • 每日最多 <strong>3</strong> 条推送<br />
                • 推送时机：18:00 + 20:00 双次<br />
                • 文案：激励唤醒 + 关怀<br />
                • 最小间隔：≥ 2 小时<br />
                • 次日 10:00 再加一次
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
