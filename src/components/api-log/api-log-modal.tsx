import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Switch, Row, Col, Space } from 'antd';
import { ApiLogItem, ApiLogFormData } from '@/types/api-log.type';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface ApiLogModalProps {
  visible: boolean;
  mode: 'create' | 'edit' | 'view';
  loading: boolean;
  data?: ApiLogItem;
  onCancel: () => void;
  onSubmit: (data: ApiLogFormData) => void;
}

//** คอมโพเนนต์ Modal สำหรับจัดการ API Log */
const ApiLogModal = ({ visible, mode, loading, data, onCancel, onSubmit }: ApiLogModalProps) => {
  const [form] = Form.useForm();
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  //** รีเซ็ตฟอร์มเมื่อเปิด modal */
  useEffect(() => {
    if (visible) {
      if (data && (isEditMode || isViewMode)) {
        // แปลงข้อมูลสำหรับฟอร์ม
        form.setFieldsValue({
          requestTime: dayjs(data.requestTime),
          responseTime: data.responseTime ? dayjs(data.responseTime) : undefined,
          durationMs: data.durationMs,
          method: data.method,
          statusCode: data.statusCode,
          url: data.url,
          endpoint: data.endpoint,
          serviceName: data.serviceName,
          requestHeader: data.requestHeader ? JSON.stringify(data.requestHeader, null, 2) : '',
          requestBody: data.requestBody ? JSON.stringify(data.requestBody, null, 2) : '',
          responseBody: data.responseBody ? JSON.stringify(data.responseBody, null, 2) : '',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          calledBy: data.calledBy,
          traceId: data.traceId,
          errorMessage: data.errorMessage,
          isSuccess: data.isSuccess,
          isArchived: data.isArchived,
        });
      } else if (isCreateMode) {
        // ตั้งค่าเริ่มต้นสำหรับสร้างใหม่
        form.setFieldsValue({
          requestTime: dayjs(),
          method: 'GET',
          statusCode: 200,
          isSuccess: true,
          isArchived: false,
        });
      }
    } else {
      form.resetFields();
    }
  }, [visible, data, mode, form, isEditMode, isViewMode, isCreateMode]);

  //** จัดการการส่งฟอร์ม */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: ApiLogFormData = {
        ...values,
        requestTime: values.requestTime.toISOString(),
        responseTime: values.responseTime ? values.responseTime.toISOString() : undefined,
      };
      onSubmit(formData);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  //** กำหนดชื่อ modal */
  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'สร้าง API Log ใหม่';
      case 'edit':
        return 'แก้ไข API Log';
      case 'view':
        return 'ดู API Log';
      default:
        return 'API Log';
    }
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={onCancel}
      onOk={isViewMode ? onCancel : handleSubmit}
      okText={isViewMode ? 'ปิด' : isEditMode ? 'บันทึก' : 'สร้าง'}
      cancelText="ยกเลิก"
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical" disabled={isViewMode}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Request Time"
              name="requestTime"
              rules={[{ required: true, message: 'กรุณาเลือกเวลา request' }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Response Time" name="responseTime">
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item label="Duration (ms)" name="durationMs">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item label="HTTP Method" name="method">
              <Select>
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="PATCH">PATCH</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item label="Status Code" name="statusCode">
              <InputNumber min={100} max={599} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="URL" name="url">
              <Input placeholder="https://example.com/api/..." />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Endpoint" name="endpoint">
              <Input placeholder="/api/v1/users" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Service Name" name="serviceName">
              <Input placeholder="users, auth, timesheet" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="IP Address" name="ipAddress">
              <Input placeholder="192.168.1.1" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Called By" name="calledBy">
              <Input placeholder="user-123, system" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Trace ID" name="traceId">
              <Input placeholder="trace_123456" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="User Agent" name="userAgent">
              <TextArea rows={2} placeholder="Mozilla/5.0..." />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Request Headers" name="requestHeader">
              <TextArea
                rows={4}
                placeholder='{"Authorization": "Bearer token"}'
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Request Body" name="requestBody">
              <TextArea
                rows={4}
                placeholder='{"name": "John", "email": "john@example.com"}'
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Response Body" name="responseBody">
              <TextArea
                rows={4}
                placeholder='{"data": {...}, "message": "Success"}'
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Error Message" name="errorMessage">
              <TextArea rows={3} placeholder="Error message (if any)" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Success" name="isSuccess" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Archived" name="isArchived" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ApiLogModal;