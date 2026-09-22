import {
  Button,
  Card,
  Form,
  Grid,
  Input,
  Message,
  Select,
  Space,
  Typography,
} from '@arco-design/web-react'

const { Row, Col } = Grid
const { Title } = Typography

export function GroupFormPage() {
  const [form] = Form.useForm<Record<string, unknown>>()
  const submit = async () => {
    try {
      await form.validate()
      Message.success('参数提交成功')
    }
    catch {
      // Arco renders validation errors next to each field.
    }
  }

  return (
    <div className="group-form-page">
      <Form form={form} layout="vertical">
        <Card className="pro-card group-form-card">
          <Title heading={6}>视频参数</Title>
          <Row gutter={80}>
            <Col span={8}><Form.Item label="视频模式" field="video.mode" initialValue="custom" rules={[{ required: true }]}><Select options={[{ label: '自定义', value: 'custom' }, { label: '标准', value: 'standard' }, { label: '高清', value: 'hd' }]} /></Form.Item></Col>
            <Col span={8}><Form.Item label="采集分辨率" field="video.acquisition.resolution" rules={[{ required: true, message: '请选择采集分辨率' }]}><Select placeholder="请选择" options={['720p', '1080p', '2K', '4K']} /></Form.Item></Col>
            <Col span={8}><Form.Item label="采集帧率" field="video.acquisition.frameRate" rules={[{ required: true, message: '请输入采集帧率' }]}><Input placeholder="请输入" addAfter="fps" /></Form.Item></Col>
          </Row>
          <Row gutter={80}>
            <Col span={8}><Form.Item label="编码分辨率" field="video.encoding.resolution" rules={[{ required: true }]}><Select placeholder="请选择" options={['720p', '1080p', '2K']} /></Form.Item></Col>
            <Col span={8}><Form.Item label="最小码率" field="video.encoding.rate.min"><Input placeholder="请输入" addAfter="bps" /></Form.Item></Col>
            <Col span={8}><Form.Item label="最大码率" field="video.encoding.rate.max"><Input placeholder="请输入" addAfter="bps" /></Form.Item></Col>
          </Row>
          <Row gutter={80}>
            <Col span={8}><Form.Item label="默认码率" field="video.encoding.rate.default"><Input placeholder="请输入" addAfter="bps" /></Form.Item></Col>
            <Col span={8}><Form.Item label="编码帧率" field="video.encoding.frameRate"><Input placeholder="请输入" addAfter="fps" /></Form.Item></Col>
            <Col span={8}><Form.Item label="编码档位" field="video.encoding.profile"><Select placeholder="请选择" options={['Baseline', 'Main', 'High']} /></Form.Item></Col>
          </Row>
        </Card>

        <Card className="pro-card group-form-card">
          <Title heading={6}>音频参数</Title>
          <Row gutter={80}>
            <Col span={8}><Form.Item label="音频模式" field="audio.mode" initialValue="custom"><Select options={[{ label: '自定义', value: 'custom' }, { label: '标准', value: 'standard' }]} /></Form.Item></Col>
            <Col span={8}><Form.Item label="采集声道" field="audio.acquisition.channels"><Select placeholder="请选择" options={['1', '2', '3']} /></Form.Item></Col>
            <Col span={8}><Form.Item label="编码码率" field="audio.encoding.rate"><Input placeholder="请输入" addAfter="bps" /></Form.Item></Col>
          </Row>
          <Row gutter={80}>
            <Col span={8}><Form.Item label="编码规格" field="audio.encoding.profile"><Input placeholder="请输入" addAfter="fps" /></Form.Item></Col>
            <Col span={8}><Form.Item label="采样率" field="audio.sampleRate"><Select placeholder="请选择" options={['44.1 kHz', '48 kHz', '96 kHz']} /></Form.Item></Col>
          </Row>
        </Card>

        <Card className="pro-card group-form-card explanation-card">
          <Title heading={6}>参数说明</Title>
          <Form.Item label="说明内容" field="explanation"><Input.TextArea placeholder="请输入本次配置的补充说明" autoSize={{ minRows: 4, maxRows: 8 }} /></Form.Item>
        </Card>
      </Form>
      <div className="group-form-actions">
        <Space>
          <Button size="large" onClick={() => form.resetFields()}>重置</Button>
          <Button size="large" type="primary" onClick={submit}>提交</Button>
        </Space>
      </div>
    </div>
  )
}
