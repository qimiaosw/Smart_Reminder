import { useState, useEffect } from 'react'
import { Card, List, Tag, Button, Progress, message, Spin, Statistic, Row, Col, Empty, Typography, Tooltip } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../store/userStore'
import { taskApi, userApi } from '../api/endpoints'
import { userTypeLabels, userTypeColors, type UserType } from '../mock/data'

const { Text } = Typography

interface Task {
  id: string
  title: string
  description: string
  status: string
  taskDate: string
  totalMinutes: number
  subtasks?: Subtask[]
}

interface Subtask {
  id: string
  title: string
  completed: boolean
  estimatedMinutes: number
}

export default function TaskCenter() {
  const { currentUserId } = useUserStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [userInfo, setUserInfo] = useState<{ userType: string; pushEnabled: boolean; consecutiveMissDays: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, statsRes, userRes]: any = await Promise.all([
        taskApi.getDaily(currentUserId),
        taskApi.getStats(currentUserId),
        userApi.getById(currentUserId),
      ])
      const tasksData: Task[] = tasksRes.data || []
      // 为每个未完成的任务获取子任务
      const tasksWithSubtasks = await Promise.all(
        tasksData.map(async (task) => {
          try {
            const subRes: any = await taskApi.getSubtasks(task.id)
            return { ...task, subtasks: subRes.data || [] }
          } catch {
            return { ...task, subtasks: [] }
          }
        })
      )
      setTasks(tasksWithSubtasks)
      setStats(statsRes.data || {})
      if (userRes.data) setUserInfo({ userType: userRes.data.userType, pushEnabled: userRes.data.pushEnabled, consecutiveMissDays: userRes.data.consecutiveMissDays || 0 })
    } catch {
      message.error('获取数据失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [currentUserId])

  const handleComplete = async (id: string) => {
    setCompletingId(id)
    try {
      await taskApi.complete(id)
      message.success({ content: '🎉 任务已完成！太棒了！', duration: 2 })
      fetchData()
    } catch {
      message.error('操作失败')
    }
    setCompletingId(null)
  }

  const handleSubtaskComplete = async (id: string) => {
    try {
      await taskApi.completeSubtask(id)
      message.success({ content: '✅ 微任务完成！继续加油！', duration: 1.5 })
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  const completedCount = stats.todayCompleted || 0
  const totalCount = stats.todayTotal || 0
  const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const consecutiveMissDays = userInfo?.consecutiveMissDays ?? 0
  const userType = userInfo?.userType as UserType | undefined

  return (
    <div>
      {/* 用户状态横幅 */}
      {userType && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            background: userTypeColors[userType] + '15',
            borderLeft: `4px solid ${userTypeColors[userType]}`,
          }}
        >
          <Row align="middle" gutter={16}>
            <Col>
              <Tag color={userTypeColors[userType]} style={{ fontSize: 12 }}>
                {userTypeLabels[userType]}
              </Tag>
            </Col>
            <Col>
              <Text>
                {consecutiveMissDays === 0 ? (
                  <span>
                    <FireOutlined style={{ color: '#ff4d4f' }} /> 昨天已完成全部任务，继续保持！
                  </span>
                ) : (
                  <span>
                    <ClockCircleOutlined style={{ color: '#faad14' }} /> 已连续 {consecutiveMissDays} 天未完成全部任务
                  </span>
                )}
              </Text>
            </Col>
            <Col>
              {userInfo?.pushEnabled === false && (
                <Tag color="orange" icon={<ClockCircleOutlined />}>推送已关闭</Tag>
              )}
            </Col>
          </Row>
        </Card>
      )}

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="今日任务" value={totalCount} suffix="项" />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="已完成"
              value={completedCount}
              suffix={`/ ${totalCount}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={rate}
                size={60}
                strokeColor={rate >= 80 ? '#52c41a' : rate >= 50 ? '#1890ff' : '#faad14'}
              />
              <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>完成率</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="本周完成"
              value={stats.totalCompletedThisWeek || 0}
              suffix="项"
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            />
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                本周完成率 {stats.weekRate || 0}%
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 任务列表 */}
      {tasks.length === 0 ? (
        <Empty
          description="今天没有任务，去休息一下吧！"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>自律的你真棒 🎉</Text>
        </Empty>
      ) : (
        <List
          dataSource={tasks}
          renderItem={(task) => {
            const subtaskTotal = task.subtasks?.length || 0
            const subtaskDone = task.subtasks?.filter((s) => s.completed).length || 0
            const subtaskRate = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0
            return (
              <Card
                style={{
                  marginBottom: 16,
                  borderLeft: `4px solid ${task.status === 'COMPLETED' ? '#52c41a' : '#faad14'}`,
                  opacity: task.status === 'COMPLETED' ? 0.8 : 1,
                }}
                title={
                  <span>
                    {task.status === 'COMPLETED' ? (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    ) : (
                      <ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    )}
                    {task.title}
                    <Tag color={task.status === 'COMPLETED' ? 'green' : 'orange'} style={{ marginLeft: 12 }}>
                      {task.status === 'COMPLETED' ? '已完成' : '待完成'}
                    </Tag>
                    {task.totalMinutes && (
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        ~{task.totalMinutes} 分钟
                      </Text>
                    )}
                  </span>
                }
                extra={
                  task.status !== 'COMPLETED' && (
                    <Tooltip title="点击完成任务">
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleComplete(task.id)}
                        loading={completingId === task.id}
                      >
                        完成任务
                      </Button>
                    </Tooltip>
                  )
                }
              >
                {task.description && (
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
                    {task.description}
                  </div>
                )}

                {/* 微任务进度 */}
                {subtaskTotal > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 4 }}>
                      <span>微任务进度</span>
                      <span>{subtaskDone}/{subtaskTotal}</span>
                    </div>
                    <Progress
                      percent={subtaskRate}
                      size="small"
                      strokeColor={subtaskRate >= 80 ? '#52c41a' : subtaskRate >= 50 ? '#1890ff' : '#faad14'}
                      showInfo={false}
                    />
                  </div>
                )}

                <List
                  dataSource={task.subtasks || []}
                  renderItem={(sub) => (
                    <List.Item
                      actions={[
                        !sub.completed && (
                          <Button
                            type="link"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleSubtaskComplete(sub.id)}
                          >
                            完成
                          </Button>
                        ),
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          sub.completed
                            ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                            : <ClockCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
                        }
                        title={
                          <span style={{ textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? '#999' : '#333' }}>
                            {sub.title}
                          </span>
                        }
                        description={`约 ${sub.estimatedMinutes} 分钟`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )
          }}
        />
      )}

      {/* 微任务设计说明 */}
      <Card size="small" style={{ background: '#fafafa' }} title={<span><ThunderboltOutlined /> 微任务设计说明</span>}>
        <Text type="secondary">
          每个大任务拆分为 3–5 个微任务（每个 3–5 分钟）。完成一个微任务即触发即时正反馈，
          利用 Zeigarnik 效应（一旦开始就更容易继续）降低启动门槛。
        </Text>
      </Card>
    </div>
  )
}
