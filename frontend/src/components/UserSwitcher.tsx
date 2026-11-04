import { useState, useEffect } from 'react'
import { Select, Badge, Spin } from 'antd'
import { useUserStore } from '../store/userStore'
import { userApi } from '../api/endpoints'
import { userTypeColors, userTypeLabels, type UserType } from '../mock/data'

interface UserItem {
  id: string
  realName: string
  userType: string
}

export default function UserSwitcher() {
  const { currentUserId, setCurrentUser } = useUserStore()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    userApi.list().then((res: any) => {
      if (!cancelled) setUsers(res.data || [])
    }).catch(() => {
      // ignore
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Spin size="small" />

  return (
    <Select
      value={currentUserId}
      onChange={(id) => {
        const u = users.find((u) => u.id === id)
        if (u) setCurrentUser(id, u.userType as UserType)
      }}
      style={{ width: 200 }}
      options={users.map((u) => ({
        value: u.id,
        label: (
          <span>
            <Badge color={userTypeColors[u.userType as UserType] || '#d9d9d9'} style={{ marginRight: 8 }} />
            {u.realName}（{userTypeLabels[u.userType as UserType] || u.userType}）
          </span>
        ),
      }))}
    />
  )
}
