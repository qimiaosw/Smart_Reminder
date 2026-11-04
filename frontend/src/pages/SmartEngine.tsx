import { useState, useEffect } from 'react'
import { Card, Select, Button, Steps, Tag, Descriptions, Typography, Divider, message, Row, Col, Alert, Spin } from 'antd'
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { userApi, engineApi } from '../api/endpoints'
import { userTypeLabels, userTypeColors, type UserType } from '../mock/data'

const { Text } = Typography

interface UserFromAPI {
  id: string
  realName: string
  userType: string
  activeTimeSlot: string | null
  weeklyCompletionRate: number
}

interface EngineResult {
  timing: {
    input: { userType: string; activeTimeSlot: string | null; incompleteCount: number; completionRate: number }
    output: string
    explanation: string
  }
  content: {
    input: { userType: string; incompleteCount: number; completionRate: number }
    templateMatched: string
    output: string
    bodyOutput: string
    explanation: string
  }
  frequency: {
    checks: { name: string; passed: boolean; detail: string }[]
    result: string
  }
}

export default function SmartEngine() {
  const [users, setUsers] = useState<UserFromAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserFromAPI | null>(null)
  const [result, setResult] = useState<EngineResult | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    userApi.list().then((res: any) => {
      if (!cancelled) {
        const list = res.data || []
        setUsers(list)
        if (list.length > 0) setSelectedUserId(list[0].id)
      }
    }).catch(() => {
      if (!cancelled) message.error('获取用户列表失败')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  // 选中用户变化时获取详情
  useEffect(() => {
    if (!selectedUserId) return
    let cancelled = false
    userApi.getById(selectedUserId).then((res: any) => {
      if (!cancelled) {
        setSelectedUser(res.data)
        setResult(null)
        setCurrentStep(0)
      }
    }).catch(() => {
      if (!cancelled) message.error('获取用户信息失败')
    })
    return () => { cancelled = true }
  }, [selectedUserId])

  const handleSimulate = async () => {
    if (!selectedUser || !selectedUserId) return
    setRunning(true)
    setCurrentStep(0)

    // 逐步展示三步决策过程
    for (let i = 0; i <= 3; i++) {
      await new Promise((r) => setTimeout(r, 600))
      setCurrentStep(i)
      if (i === 3) {
        try {
          const res: any = await engineApi.simulate(selectedUserId)
          setResult(res.data)
          message.success('引擎决策完成！')
        } catch {
          message.error('引擎模拟请求失败')
        }
      }
    }

    setRunning(false)
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  const color = selectedUser ? userTypeColors[selectedUser.userType as UserType] || '#d9d9d9' : '#d9d9d9'

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={8}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>选择测试用户</div>
            <Select
              value={selectedUserId}
              onChange={(id) => setSelectedUserId(id)}
              style={{ width: '100%' }}
              options={users.map((u) => ({
                value: u.id,
                label: `${u.realName}（${userTypeLabels[u.userType as UserType] || u.userType}）`,
              }))}
            />
          </Col>
          <Col span={8}>
            <Button
              type="primary" size="large" icon={<PlayCircleOutlined />}
              onClick={handleSimulate} loading={running}
              style={{ height: 44, width: '100%' }}
              disabled={!selectedUser}
            >
              {running ? '引擎运行中...' : '▶ 模拟推送决策'}
            </Button>
          </Col>
          <Col span={8}>
            {selectedUser && (
              <div style={{ textAlign: 'right' }}>
                <Tag color={color} style={{ fontSize: 14, padding: '2px 12px' }}>
                  {userTypeLabels[selectedUser.userType as UserType] || selectedUser.userType}
                </Tag>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {selectedUser.realName} · 完成率 {Math.round(selectedUser.weeklyCompletionRate * 100)}% · 活跃时段 {selectedUser.activeTimeSlot || '未确定'}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      <Card title={<span><ThunderboltOutlined /> 智能提醒引擎 — 三步决策流程</span>} style={{ marginBottom: 24 }}>
        <Steps current={currentStep} size="small"
          items={[
            { title: '时机决策', description: '最佳推送时间', icon: <ClockCircleOutlined /> },
            { title: '内容生成', description: '个性化文案匹配', icon: <FileTextOutlined /> },
            { title: '频次控制', description: '合规检查', icon: <SafetyCertificateOutlined /> },
          ]}
        />

        <Divider />

        {currentStep >= 1 && result && (
          <Card size="small" style={{ marginBottom: 16, borderLeft: '3px solid #1890ff' }}
            title={<span><ClockCircleOutlined style={{ color: '#1890ff' }} /> 第一步：时机决策模块</span>}>
            <Row gutter={24}>
              <Col span={12}>
                <Descriptions column={1} size="small" title="输入">
                  <Descriptions.Item label="用户类型">{userTypeLabels[result.timing.input.userType as UserType]}</Descriptions.Item>
                  <Descriptions.Item label="活跃时段">{result.timing.input.activeTimeSlot || '无数据'}</Descriptions.Item>
                  <Descriptions.Item label="未完成任务">{result.timing.input.incompleteCount} 项</Descriptions.Item>
                  <Descriptions.Item label="完成率">{Math.round(result.timing.input.completionRate * 100)}%</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} size="small" title="输出">
                  <Descriptions.Item label="最佳推送时间">
                    <Tag color="blue" style={{ fontSize: 14, padding: '2px 8px' }}>{result.timing.output}</Tag>
                  </Descriptions.Item>
                </Descriptions>
                <Alert type="info" showIcon message="决策依据" description={result.timing.explanation}
                  style={{ marginTop: 8, background: '#e6f7ff', border: 'none' }} />
              </Col>
            </Row>
          </Card>
        )}

        {currentStep >= 2 && result && (
          <Card size="small" style={{ marginBottom: 16, borderLeft: '3px solid #722ed1' }}
            title={<span><FileTextOutlined style={{ color: '#722ed1' }} /> 第二步：内容生成模块</span>}>
            <Row gutter={24}>
              <Col span={10}>
                <Descriptions column={1} size="small" title="输入">
                  <Descriptions.Item label="用户分层">{userTypeLabels[result.content.input.userType as UserType]}</Descriptions.Item>
                  <Descriptions.Item label="未完成任务">{result.content.input.incompleteCount} 项</Descriptions.Item>
                  <Descriptions.Item label="完成率">{Math.round(result.content.input.completionRate * 100)}%</Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>匹配模板：</Text>
                  <Tag>{result.content.templateMatched}</Tag>
                </div>
              </Col>
              <Col span={14}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>推送预览</div>
                  <div style={{ background: '#f6ffed', border: '2px solid #b7eb8f', borderRadius: 12, padding: '16px 20px', maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>智能提醒系统</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 4 }}>{result.content.output}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{result.content.bodyOutput}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{result.content.explanation}</div>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {currentStep >= 3 && result && (
          <Card size="small" style={{ borderLeft: '3px solid #52c41a' }}
            title={<span><SafetyCertificateOutlined style={{ color: '#52c41a' }} /> 第三步：频次控制模块</span>}>
            <Descriptions column={1} size="small" title="检查项">
              {result.frequency.checks.map((check, i) => (
                <Descriptions.Item label={check.name} key={i}>
                  {check.passed
                    ? <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    : <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
                  <span style={{ color: check.passed ? '#52c41a' : '#ff4d4f' }}>{check.detail}</span>
                </Descriptions.Item>
              ))}
            </Descriptions>
            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Tag color={result.frequency.result.includes('✅') ? 'success' : 'error'}
                style={{ fontSize: 16, padding: '6px 24px' }}>
                {result.frequency.result}
              </Tag>
              <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                {result.frequency.result.includes('✅')
                  ? '所有频控检查通过，推送请求已发送到消息队列'
                  : '频控检查未通过，推送请求被拦截'}
              </div>
            </div>
          </Card>
        )}

        {currentStep === 0 && !running && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <ThunderboltOutlined style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
            <Text type="secondary">选择一个用户，点击「模拟推送决策」查看智能引擎如何运作</Text>
          </div>
        )}
      </Card>

      <Card title="⚙️ 引擎架构说明">
        <Row gutter={24}>
          <Col span={8}>
            <Card size="small" style={{ background: '#f0f5ff', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                <div style={{ fontWeight: 600, margin: '8px 0' }}>时机决策模块</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  基于用户分层 + 活跃时段 + 历史打开行为，计算最佳推送时间
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ background: '#f9f0ff', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <FileTextOutlined style={{ fontSize: 28, color: '#722ed1' }} />
                <div style={{ fontWeight: 600, margin: '8px 0' }}>内容生成模块</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  按分层匹配模板 + 变量填充，预留 LLM 接口可扩展 AI 文案
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ background: '#f6ffed', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <SafetyCertificateOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                <div style={{ fontWeight: 600, margin: '8px 0' }}>频次控制模块</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  每日限额 / 最小间隔 / 免打扰 / 在线状态，全检查通过才发送
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
