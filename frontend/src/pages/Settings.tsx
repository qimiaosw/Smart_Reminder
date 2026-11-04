import { useState, useEffect } from 'react'
import { Card, Form, Switch, Select, Button, message, Spin, Divider, Descriptions, Tag, Typography, Row, Col, Progress, Alert } from 'antd'
import {
  BellOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../store/userStore'
import { userApi } from '../api/endpoints'
import { userTypeLabels, userTypeColors, type UserType } from '../mock/data'

const { Text } = Typography

const userTypeOptions = [
  { value: 'SELF_DRIVEN', label: '自律型 🟢' },
  { value: 'NEED_REMINDER', label: '需提醒型 🟡' },
  { value: 'DROPOUT', label: '流失倾向型 🔴' },
  { value: 'COLD_START', label: '冷启动 ⚪' },
]

export default function Settings() {
  const { currentUserId, role } = useUserStore()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchUser = async () => {
    setLoading(true)
    try {
      const res: any = await userApi.getById(currentUserId)
      setUser(res.data)
      form.setFieldsValue({
        pushEnabled: res.data.pushEnabled,
        activeTimeSlot: res.data.activeTimeSlot || '19:00-21:00',
        userType: res.data.userType,
      })
    } catch {
      message.error('获取用户信息失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchUser() }, [currentUserId])

  const handleSave = async (values: any) => {
    try {
      await userApi.updateSettings(currentUserId, values)
      if (values.userType && values.userType !== user?.userType) {
        await userApi.updateType(currentUserId, values.userType)
      }
      message.success('设置已保存')
      fetchUser()
    } catch {
      message.error('保存失败')
    }
  }

  const color = userTypeColors[user?.userType as UserType] || '#d9d9d9'

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  return (
    <div style={{ maxWidth: 700 }}>
      {/* 用户信息卡片 */}
      <Card
        style={{ marginBottom: 24, borderLeft: `4px solid ${color}` }}
        title={<span><BellOutlined /> 用户信息</span>}
      >
        <Descriptions column={2} size="small">
          {role === 'admin' && (
            <>
              <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
              <Descriptions.Item label="姓名">{user?.realName}</Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="当前分层">
            <Tag color={color} style={{ fontSize: 12 }}>
              {userTypeLabels[user?.userType as UserType] || user?.userType}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="推送权限">
            {user?.pushEnabled ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>已开启</Tag>
            ) : (
              <Tag color="red" icon={<ExclamationCircleOutlined />}>已关闭</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="近 7 天完成率">
            <Progress
              percent={Math.round((user?.weeklyCompletionRate || 0) * 100)}
              size="small"
              strokeColor={userTypeColors[user?.userType as UserType]}
              format={(p) => `${p}%`}
              style={{ width: 160 }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="连续未完成">
            {user?.consecutiveMissDays || 0} 天
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 通知设置 */}
      <Card title={<span><SafetyCertificateOutlined /> 通知偏好设置</span>} style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ pushEnabled: true, activeTimeSlot: '19:00-21:00', userType: user?.userType }}
        >
          <Form.Item name="pushEnabled" label="允许推送通知" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item name="activeTimeSlot" label="活跃时段">
            <Select>
              <Select.Option value="16:00-18:00">放学后 16:00–18:00</Select.Option>
              <Select.Option value="19:00-21:00">晚饭后 19:00–21:00</Select.Option>
              <Select.Option value="20:00-22:00">睡前 20:00–22:00</Select.Option>
              <Select.Option value="07:00-08:00">早起 07:00–08:00</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="userType" label="模拟用户分层（测试用）">
            <Select>
              {userTypeOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 推送策略说明 */}
      <Card title={<span><ThunderboltOutlined /> 推送策略规则说明</span>} style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card
              size="small"
              style={{ borderTop: '3px solid #52c41a', background: '#f6ffed', height: '100%' }}
              title={<Tag color="green">自律型</Tag>}
            >
              <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                • 每日上限：<strong>1 条</strong><br />
                • 时间：任务完成时<br />
                • 内容：进度鼓励
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              size="small"
              style={{ borderTop: '3px solid #faad14', background: '#fffbe6', height: '100%' }}
              title={<Tag color="gold">需提醒型</Tag>}
            >
              <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                • 每日上限：<strong>2 条</strong><br />
                • 时间：活跃时段前 30min<br />
                • 内容：紧迫感提醒
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              size="small"
              style={{ borderTop: '3px solid #ff4d4f', background: '#fff2f0', height: '100%' }}
              title={<Tag color="red">流失倾向型</Tag>}
            >
              <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                • 每日上限：<strong>3 条</strong><br />
                • 时间：18:00 + 20:00<br />
                • 内容：激励唤醒
              </div>
            </Card>
          </Col>
        </Row>
        <Divider />
        <Descriptions column={1} size="small">
          <Descriptions.Item label="🕐 免打扰时段">21:30 – 07:00 不推送任何通知</Descriptions.Item>
          <Descriptions.Item label="🟢 在线时不推送">用户正在使用 App 时跳过推送，避免打扰</Descriptions.Item>
          <Descriptions.Item label="⏱ 最小间隔">两次推送之间至少间隔 2 小时</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
