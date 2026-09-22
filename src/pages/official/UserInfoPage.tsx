import {
  Avatar,
  Card,
  Grid,
  Link,
  List,
  Result,
  Space,
  Typography,
} from '@arco-design/web-react'
import {
  IconCamera,
  IconHome,
  IconLocation,
  IconUser,
} from '@arco-design/web-react/icon'

import { useAuth } from '@/app/auth'
import userHeaderBanner from '@/assets/user-header-banner.png'

const { Row, Col } = Grid
const { Title, Text, Paragraph } = Typography

const projects = [
  { title: '内容运营平台', enTitle: 'Content Operations', people: 26, color: '#165dff' },
  { title: '数据分析中心', enTitle: 'Data Intelligence', people: 18, color: '#14c9c9' },
  { title: '客户成功系统', enTitle: 'Customer Success', people: 12, color: '#722ed1' },
  { title: '审批流程中心', enTitle: 'Workflow Center', people: 32, color: '#ff7d00' },
  { title: '企业权限平台', enTitle: 'Access Control', people: 15, color: '#00b42a' },
  { title: '营销活动平台', enTitle: 'Campaign Center', people: 21, color: '#f53f3f' },
]

const teams = [
  { name: '产品与运营部', members: 48, color: '#165dff' },
  { name: '技术平台部', members: 36, color: '#14c9c9' },
  { name: '客户成功部', members: 24, color: '#722ed1' },
  { name: '市场增长部', members: 19, color: '#ff7d00' },
]

const news = [
  { title: '周明 更新了数据分析中心', description: '新增渠道转化漏斗和地域分布两个看板模块。', color: '#165dff' },
  { title: '王璐 完成了季度预算审批', description: 'Q4 市场活动预算已经通过负责人审核。', color: '#00b42a' },
  { title: '陈思远 加入了内容运营平台', description: '被添加为内容审核员并获得发布权限。', color: '#722ed1' },
  { title: '系统 发布了版本更新', description: '权限中心新增操作审计和访问风险提醒。', color: '#ff7d00' },
]

export function UserInfoPage() {
  const user = useAuth()
  return (
    <div className="user-info-page">
      <section className="user-profile-header" style={{ backgroundImage: `url(${userHeaderBanner})` }}>
        <Space size={8} direction="vertical" align="center">
          <Avatar size={64} triggerIcon={<IconCamera />}>{user.displayName.slice(0, 1)}</Avatar>
          <div className="profile-name">{user.displayName}</div>
          <Space size={18} className="profile-meta">
            <span>
              <IconUser />
              {' '}
              前端开发工程师
            </span>
            <span>
              <IconHome />
              {' '}
              产品与运营部
            </span>
            <span>
              <IconLocation />
              {' '}
              北京
            </span>
          </Space>
        </Space>
      </section>
      <Row gutter={16}>
        <Col span={16}>
          <Card className="pro-card user-section-card">
            <div className="user-section-heading">
              <Title heading={6}>我的项目</Title>
              <Link>查看更多</Link>
            </div>
            <Row gutter={[12, 16]}>
              {projects.map(project => (
                <Col span={8} key={project.title}>
                  <Card bordered className="project-card" size="small">
                    <Title heading={6}>{project.title}</Title>
                    <Text type="secondary" ellipsis>{project.enTitle}</Text>
                    <div className="project-members">
                      <Avatar.Group size={24}>{[0, 1, 2].map(index => <Avatar key={index} style={{ background: project.color }}>{String.fromCharCode(65 + index)}</Avatar>)}</Avatar.Group>
                      <Text type="secondary">
                        等
                        {project.people}
                        {' '}
                        人
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="pro-card user-section-card">
            <div className="user-section-heading"><Title heading={6}>我的团队</Title></div>
            <List
              dataSource={teams}
              render={(team, index) => (
                <List.Item key={index}>
                  <List.Item.Meta
                    avatar={<Avatar size={44} style={{ background: team.color }}>{team.name.slice(0, 1)}</Avatar>}
                    title={team.name}
                    description={(
                      <Text type="secondary">
                        共
                        {team.members}
                        {' '}
                        人
                      </Text>
                    )}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={16}>
          <Card className="pro-card user-section-card">
            <div className="user-section-heading">
              <Title heading={6}>最新动态</Title>
              <Link>查看全部</Link>
            </div>
            <List dataSource={news} render={(item, index) => <List.Item key={index}><List.Item.Meta avatar={<Avatar size={46} style={{ background: item.color }}>{item.title.slice(0, 1)}</Avatar>} title={item.title} description={<Paragraph ellipsis={{ rows: 1 }} type="secondary">{item.description}</Paragraph>} /></List.Item>} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="pro-card user-section-card notice-empty-card">
            <div className="user-section-heading"><Title heading={6}>通知</Title></div>
            <Result status="404" subTitle="暂无通知" />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
