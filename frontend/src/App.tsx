import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Menu, Typography, Space, Switch, Tag, Button } from 'antd'
import {
  DashboardOutlined,
  CheckSquareOutlined,
  BellOutlined,
  SettingOutlined,
  ExperimentOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import UserSwitcher from './components/UserSwitcher'
import { useUserStore, type Role } from './store/userStore'
import { userApi } from './api/endpoints'
import { userTypeColors, userTypeLabels, type UserType } from './mock/data'
import Dashboard from './pages/Dashboard'
import TaskCenter from './pages/TaskCenter'
import NotificationPanel from './pages/NotificationPanel'
import Settings from './pages/Settings'
import ABTestDashboard from './pages/ABTestDashboard'
import UserProfile from './pages/UserProfile'
import SmartEngine from './pages/SmartEngine'
import LoginPage from './pages/LoginPage'

const { Header, Sider, Content } = Layout

const adminMenu = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据大盘' },
  { key: '/users', icon: <TeamOutlined />, label: '用户画像' },
  { key: '/engine', icon: <ThunderboltOutlined />, label: '智能引擎' },
  { key: '/abtest', icon: <ExperimentOutlined />, label: 'A/B 实验' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
]

const studentMenu = [
  { key: '/tasks', icon: <CheckSquareOutlined />, label: '我的任务' },
  { key: '/notifications', icon: <BellOutlined />, label: '我的提醒' },
  { key: '/settings', icon: <SettingOutlined />, label: '个人设置' },
]

const roleLabel: Record<Role, string> = { admin: '管理员', student: '学生' }

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, setRole, currentUserId, isLoggedIn, logout } = useUserStore()
  const [studentInfo, setStudentInfo] = useState<{ name: string; type: string } | null>(null)

  // 学生模式下，从后端获取当前用户身份
  useEffect(() => {
    if (role !== 'student') return
    let cancelled = false
    userApi.getById(currentUserId).then((res: any) => {
      if (cancelled || !res.data) return
      setStudentInfo({ name: res.data.realName, type: res.data.userType })
    }).catch(() => {
      if (!cancelled) setStudentInfo(null)
    })
    return () => { cancelled = true }
  }, [currentUserId, role])

  const menuItems = role === 'admin' ? adminMenu : studentMenu
  const currentItem = menuItems.find((m) => m.key === location.pathname)
  const currentLabel = currentItem?.label || '智能提醒系统'
  const defaultRoute = role === 'admin' ? '/dashboard' : '/tasks'

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" collapsible width={200}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ fontSize: 22, color: '#1890ff' }} />
          <Typography.Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            智能提醒
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Typography.Text style={{ fontSize: 16, fontWeight: 600 }}>
              {currentLabel}
            </Typography.Text>
            {role === 'student' && studentInfo && (
              <Tag color={userTypeColors[studentInfo.type as UserType] || 'green'} style={{ fontSize: 12, borderRadius: 8 }}>
                {studentInfo.name} · {userTypeLabels[studentInfo.type as UserType] || studentInfo.type}
              </Tag>
            )}
            <Tag
              color={role === 'admin' ? 'blue' : 'green'}
              style={{ fontSize: 11, borderRadius: 8 }}
            >
              {roleLabel[role]}
            </Tag>
          </Space>
          <Space>
            {role === 'admin' && <UserSwitcher />}
            <Switch
              checked={role === 'admin'}
              checkedChildren="管理"
              unCheckedChildren="学生"
              onChange={(checked) => {
                const newRole: Role = checked ? 'admin' : 'student'
                setRole(newRole)
                navigate(newRole === 'admin' ? '/dashboard' : '/tasks')
              }}
            />
            <Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login') }}>
              退出
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 360 }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskCenter />} />
            <Route path="/users" element={<UserProfile />} />
            <Route path="/engine" element={<SmartEngine />} />
            <Route path="/notifications" element={<NotificationPanel />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/abtest" element={<ABTestDashboard />} />
            <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}
