import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Modal, Form, Input, InputNumber, Select, message, Spin, Statistic, Row, Col, Empty, Descriptions, Typography, Space, Popconfirm } from 'antd'
import { PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import { abtestApi } from '../api/endpoints'

const { Text } = Typography

interface Experiment {
  id: number
  name: string
  description: string
  status: string
  targetUserType: string
  startedAt: string
  endedAt: string
}

interface Group {
  id: number
  groupName: string
  trafficPercent: number
  userCount: number
  configJson: string
  openRate?: number
  completionRate?: number
}

interface ExperimentReport {
  experiment: Experiment
  groups: Group[]
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  RUNNING: 'processing',
  ANALYZING: 'warning',
  COMPLETED: 'success',
}

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  RUNNING: '运行中',
  ANALYZING: '分析中',
  COMPLETED: '已完成',
}

export default function ABTestDashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [createModal, setCreateModal] = useState(false)
  const [groupModal, setGroupModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [groupForm] = Form.useForm()

  const fetchExperiments = async () => {
    setLoading(true)
    try {
      const res: any = await abtestApi.listExperiments()
      setExperiments(res.data || [])
    } catch { message.error('获取实验列表失败') }
    setLoading(false)
  }

  useEffect(() => { fetchExperiments() }, [])

  const refreshReport = async (expId: number) => {
    try {
      const res: any = await abtestApi.getReport(expId)
      const report: ExperimentReport = res.data
      setGroups(report?.groups || [])
    } catch { setGroups([]) }
  }

  const handleSelect = async (exp: Experiment) => {
    setSelectedExp(exp)
    await refreshReport(exp.id)
  }

  const handleAddGroup = async () => {
    if (!selectedExp) return
    const values = await groupForm.validateFields()
    try {
      await abtestApi.createGroup(selectedExp.id, {
        groupName: values.groupName,
        trafficPercent: values.trafficPercent,
        configJson: values.configJson || '{}',
      })
      message.success('分组添加成功')
      setGroupModal(false)
      groupForm.resetFields()
      await refreshReport(selectedExp.id)
    } catch { message.error('添加分组失败') }
  }

  const handleCreate = async () => {
    const values = await form.validateFields()
    try {
      await abtestApi.createExperiment(values)
      message.success('实验创建成功')
      setCreateModal(false)
      form.resetFields()
      fetchExperiments()
    } catch { message.error('创建失败') }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await abtestApi.updateStatus(id, status)
      message.success('状态已更新')
      fetchExperiments()
    } catch { message.error('操作失败') }
  }

  const handleDelete = async (id: number) => {
    try {
      await abtestApi.deleteExperiment(id)
      message.success('实验已删除')
      if (selectedExp?.id === id) setSelectedExp(null)
      fetchExperiments()
    } catch { message.error('删除失败') }
  }

  const expColumns = [
    { title: '实验名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>,
    },
    {
      title: '目标用户', dataIndex: 'targetUserType', key: 'targetUserType',
      render: (t: string) => t || '全部',
    },
    {
      title: '操作', key: 'actions',
      render: (_: any, record: Experiment) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleSelect(record)}>查看</Button>
          {record.status === 'DRAFT' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />}
              onClick={() => handleStatusChange(record.id, 'RUNNING')}>启动</Button>
          )}
          {record.status === 'RUNNING' && (
            <Button type="link" size="small" icon={<PauseCircleOutlined />}
              onClick={() => handleStatusChange(record.id, 'COMPLETED')}>结束</Button>
          )}
          <Popconfirm title="确定删除此实验？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>实验列表</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          创建实验
        </Button>
      </div>

      <Table
        dataSource={experiments}
        columns={expColumns}
        rowKey="id"
        pagination={false}
        style={{ marginBottom: 24 }}
      />

      {selectedExp && (
        <Card title={`实验详情: ${selectedExp.name}`} extra={
          <Space>
            {selectedExp.status === 'DRAFT' && (
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setGroupModal(true)}>
                添加分组
              </Button>
            )}
            <Button size="small" onClick={() => setSelectedExp(null)}>关闭</Button>
          </Space>
        }>
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="描述">{selectedExp.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="目标用户">{selectedExp.targetUserType || '全部'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[selectedExp.status]}>{statusLabels[selectedExp.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">{selectedExp.startedAt || '-'}</Descriptions.Item>
          </Descriptions>

          <h4>分组配置</h4>
          {groups.length === 0 ? <Empty description="暂无分组，请添加至少两个分组（对照组 + 实验组）" /> : (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                {(() => {
                  const control = groups.find((g: Group) => g.groupName?.includes('control')) || groups[0]
                  const variant = groups.find((g: Group) => g.groupName?.includes('variant')) || groups[1]
                  const ordered = [control, variant].filter(Boolean) as Group[]
                  return ordered.map((g) => {
                    const isControl = g.groupName?.includes('control')
                    return (
                    <Col span={24 / ordered.length} key={g.groupName}>
                      <Card
                        size="small"
                        style={{
                          borderTop: `3px solid ${isControl ? '#d9d9d9' : '#52c41a'}`,
                          background: isControl ? '#fafafa' : '#f6ffed',
                          height: '100%',
                        }}
                        title={<Text strong>{isControl ? '对照组' : '实验组'}</Text>}
                      >
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{g.groupName}</div>
                        <Statistic title="流量占比" value={g.trafficPercent} suffix="%" style={{ marginBottom: 8 }} />
                        <Statistic title="用户数" value={g.userCount} style={{ marginBottom: 8 }} />
                        <Statistic
                          title="打开率"
                          value={g.openRate ?? '-'}
                          suffix="%"
                          valueStyle={{ color: g.openRate != null && g.openRate > 10 ? '#52c41a' : '#faad14', fontWeight: 600 }}
                          style={{ marginBottom: 8 }}
                        />
                        <Statistic
                          title="任务完成率"
                          value={g.completionRate ?? '-'}
                          suffix="%"
                          valueStyle={{ color: g.completionRate != null && g.completionRate > 70 ? '#52c41a' : '#faad14', fontWeight: 600 }}
                        />
                      </Card>
                    </Col>
                  )})
                })()}
              </Row>
              {groups.length >= 2 && (() => {
                const control = groups.find((g: Group) => g.groupName?.includes('control'))
                const variant = groups.find((g: Group) => g.groupName?.includes('variant'))
                if (!control?.openRate || !variant?.openRate) return null
                return (
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <Tag color="green" style={{ fontSize: 14, padding: '4px 16px' }}>
                    实验组打开率提升 {((variant.openRate! - control.openRate!) / control.openRate! * 100).toFixed(1)}%
                  </Tag>
                  {' '}
                  {control.completionRate != null && variant.completionRate != null && (
                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 16px' }}>
                      完成率提升 {((variant.completionRate! - control.completionRate!) / control.completionRate! * 100).toFixed(1)}%
                    </Tag>
                  )}
                </div>
              )})()}
            </>
          )}
        </Card>
      )}

      {/* 添加分组 */}
      <Modal
        title="添加分组"
        open={groupModal}
        onOk={handleAddGroup}
        onCancel={() => { setGroupModal(false); groupForm.resetFields() }}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item name="groupName" label="分组名称" rules={[{ required: true }]}>
            <Input placeholder="如「对照组（固定 18:00）」" />
          </Form.Item>
          <Form.Item name="trafficPercent" label="流量占比 (%)" rules={[{ required: true }]}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="如 50" />
          </Form.Item>
          <Form.Item name="configJson" label="配置 (JSON)">
            <Input.TextArea rows={2} placeholder='{"time":"18:00"}' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建实验"
        open={createModal}
        onOk={handleCreate}
        onCancel={() => setCreateModal(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="实验名称" rules={[{ required: true }]}>
            <Input placeholder="如「推送时机优化 V1」" />
          </Form.Item>
          <Form.Item name="description" label="实验描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="targetUserType" label="目标用户分层">
            <Select allowClear placeholder="全部用户">
              <Select.Option value="SELF_DRIVEN">自律型</Select.Option>
              <Select.Option value="NEED_REMINDER">需提醒型</Select.Option>
              <Select.Option value="DROPOUT">流失倾向型</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
