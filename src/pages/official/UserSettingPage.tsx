import {
  Avatar,
  Badge,
  Button,
  Card,
  Cascader,
  Descriptions,
  Form,
  Input,
  Link,
  Message,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from '@arco-design/web-react'
import { IconCamera } from '@arco-design/web-react/icon'
import { useState } from 'react'

import { useAuth } from '@/app/auth'

const { Title } = Typography

const securityItems = [
  { title: '登录密码', value: '已设置。密码必须包含数字、大小写字母及特殊字符。' },
  { title: '密保问题', placeholder: '未设置密保问题' },
  { title: '安全手机', value: '已绑定手机：177******28' },
  { title: '备用邮箱', placeholder: '未设置备用邮箱' },
]

const authRecords = [
  { id: 1, authType: '企业认证', authContent: 'Arco Enterprise Technology Co., Ltd.', authStatus: true, createdTime: '2026-06-18' },
  { id: 2, authType: '运营人认证', authContent: '林晓 / 身份认证', authStatus: false, createdTime: '2026-09-01' },
]

export function UserSettingPage() {
  const user = useAuth()
  const [activeTab, setActiveTab] = useState('basic')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()

  return (
    <div className="user-setting-page">
      <Card className="pro-card setting-header-card">
        <div className="setting-header">
          <Upload showUploadList={false} onChange={(_, file) => setAvatarUrl(file.originFile ? URL.createObjectURL(file.originFile) : undefined)}>
            <Avatar size={100} triggerIcon={<IconCamera />}>{avatarUrl ? <img src={avatarUrl} alt="用户头像" /> : user.displayName.slice(0, 1)}</Avatar>
          </Upload>
          <Descriptions
            column={2}
            colon="："
            labelStyle={{ textAlign: 'right' }}
            data={[{ label: '用户名', value: user.displayName }, { label: '实名认证', value: (
              <span>
                <Tag color="green">已认证</Tag>
                <Link className="setting-edit-link">修改</Link>
              </span>
            ) }, { label: '账号 ID', value: user.id.slice(0, 18) }, { label: '手机号码', value: (
              <span>
                177******28
                <Link className="setting-edit-link">修改</Link>
              </span>
            ) }, { label: '注册时间', value: '2024-06-18 10:24' }]}
          />
        </div>
      </Card>
      <Card className="pro-card setting-content-card">
        <Tabs activeTab={activeTab} onChange={setActiveTab} type="rounded">
          <Tabs.TabPane key="basic" title="基本信息"><BasicSettingForm userName={user.displayName} email={user.email} /></Tabs.TabPane>
          <Tabs.TabPane key="security" title="安全设置"><SecuritySettings /></Tabs.TabPane>
          <Tabs.TabPane key="verified" title="实名认证"><VerifiedSettings /></Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

function BasicSettingForm({ userName, email }: { userName: string, email: string }) {
  const [form] = Form.useForm()
  return (
    <Form className="setting-form" form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 17 }} initialValues={{ email, nickname: userName, country: '中国', location: ['beijing', 'beijing', 'haidian'], address: '北京市海淀区', profile: '专注企业管理产品与前端工程。' }}>
      <Form.Item label="邮箱" field="email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
      <Form.Item label="昵称" field="nickname" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="国家/地区" field="country"><Select options={['中国']} /></Form.Item>
      <Form.Item label="所在区域" field="location"><Cascader options={[{ label: '北京市', value: 'beijing', children: [{ label: '北京市', value: 'beijing', children: [{ label: '海淀区', value: 'haidian' }, { label: '朝阳区', value: 'chaoyang' }] }] }]} /></Form.Item>
      <Form.Item label="详细地址" field="address"><Input /></Form.Item>
      <Form.Item label="个人简介" field="profile"><Input.TextArea autoSize={{ minRows: 3 }} /></Form.Item>
      <Form.Item label=" ">
        <Space>
          <Button type="primary" onClick={() => Message.success('保存成功')}>保存</Button>
          <Button onClick={() => form.resetFields()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

function SecuritySettings() {
  return (
    <div className="security-settings">
      {securityItems.map(item => (
        <div className="security-item" key={item.title}>
          <span className="security-title">{item.title}</span>
          <div>
            <span className={item.value ? '' : 'security-placeholder'}>{item.value || item.placeholder}</span>
            <Button type="text">{item.value ? '修改' : '设置'}</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function VerifiedSettings() {
  const columns = [
    { title: '认证类型', dataIndex: 'authType' },
    { title: '认证内容', dataIndex: 'authContent' },
    { title: '认证状态', dataIndex: 'authStatus', render: (value: boolean) => <Badge status={value ? 'success' : 'processing'} text={value ? '认证成功' : '认证中'} /> },
    { title: '创建时间', dataIndex: 'createdTime' },
    { title: '操作', render: (_: unknown, record: { authStatus: boolean }) => (
      <Space>
        <Button type="text">查看</Button>
        {!record.authStatus && <Button type="text">撤销</Button>}
      </Space>
    ) },
  ]
  return (
    <div className="verified-settings">
      <Title heading={6}>企业认证</Title>
      <Descriptions className="verified-enterprise" layout="inline-horizontal" colon="：" column={3} data={[{ label: '账号类型', value: '企业账号' }, { label: '认证状态', value: <Tag color="green">已认证</Tag> }, { label: '认证时间', value: '2026-06-18' }, { label: '法人姓名', value: '林晓' }, { label: '证件类型', value: '统一社会信用代码' }, { label: '企业名称', value: 'Arco Enterprise Technology Co., Ltd.' }]} />
      <Title heading={6}>认证记录</Title>
      <Table rowKey="id" columns={columns} data={authRecords} pagination={false} />
    </div>
  )
}
