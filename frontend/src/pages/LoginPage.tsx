import { useState } from 'react'
import { Card, Form, Input, Button, Tabs, message, Typography } from 'antd'
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { userApi } from '../api/endpoints'
import { userTypeLabels, type UserType } from '../mock/data'

const { Title, Text } = Typography

interface LoginValues {
  username: string
  password: string
}

interface RegisterValues {
  username: string
  password: string
  confirmPassword: string
  realName: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm] = Form.useForm<LoginValues>()
  const [registerForm] = Form.useForm<RegisterValues>()

  const handleLogin = async (values: LoginValues) => {
    setLoading(true)
    try {
      const res: any = await userApi.login(values.username, values.password)
      if (res.data && res.data.token) {
        login(res.data.userId, (res.data.userType || 'SELF_DRIVEN') as UserType, res.data.token)
        message.success('登录成功')
        navigate('/tasks', { replace: true })
      } else {
        message.error('用户名或密码错误')
      }
    } catch {
      message.error('登录失败，请稍后再试')
    }
    setLoading(false)
  }

  const handleRegister = async (values: RegisterValues) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      const res: any = await userApi.register(values.username, values.password, values.realName)
      if (res.data && res.data.token) {
        login(res.data.userId, (res.data.userType || 'COLD_START') as UserType, res.data.token)
        message.success('注册成功！')
        navigate('/tasks', { replace: true })
      } else {
        message.error('注册失败')
      }
    } catch {
      message.error('注册失败，请稍后再试')
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
        styles={{ body: { padding: '32px 40px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            智能提醒系统
          </Title>
          <Text type="secondary">AI 驱动的学习任务提醒平台</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form form={loginForm} onFinish={handleLogin} size="large">
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                      登录
                    </Button>
                  </Form.Item>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      测试账号：zhangsan / lisi / wangwu（密码 password123）
                    </Text>
                  </div>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form form={registerForm} onFinish={handleRegister} size="large">
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                  </Form.Item>
                  <Form.Item name="realName" rules={[{ required: true, message: '请输入真实姓名' }]}>
                    <Input prefix={<IdcardOutlined />} placeholder="真实姓名" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) return Promise.resolve()
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
