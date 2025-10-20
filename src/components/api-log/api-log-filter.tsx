import { useState } from 'react';
import { Button, Form, Input, InputNumber, Select, Switch, Row, Col, Space, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { ApiLogFilters } from '@/types/api-log.type';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ApiLogFilterProps {
  loading: boolean;
  filters: ApiLogFilters;
  onSearch: (filters: ApiLogFilters) => void;
  onReset: () => void;
}

//** คอมโพเนนต์สำหรับกรอง API Logs */
const ApiLogFilter = ({ loading, filters, onSearch, onReset }: ApiLogFilterProps) => {
  const [form] = Form.useForm();
  const [localFilters, setLocalFilters] = useState<ApiLogFilters>(filters);

  //** จัดการการเปลี่ยนแปลงฟิลเตอร์ */
  const handleFilterChange = (field: keyof ApiLogFilters, value: any) => {
    const newFilters = { ...localFilters, [field]: value, page: 1 };
    setLocalFilters(newFilters);
  };

  //** จัดการการค้นหา */
  const handleSearch = () => {
    onSearch(localFilters);
  };

  //** จัดการการรีเซ็ต */
  const handleReset = () => {
    form.resetFields();
    setLocalFilters({
      page: 1,
      limit: 10,
      sortBy: 'request_time',
      sortOrder: 'desc',
    });
    onReset();
  };

  //** จัดการช่วงวันที่ */
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setLocalFilters({
        ...localFilters,
        dateFrom: dates[0].toISOString(),
        dateTo: dates[1].toISOString(),
        page: 1,
      });
    } else {
      setLocalFilters({
        ...localFilters,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
      });
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="Service Name">
            <Input
              placeholder="กรองตาม service name"
              value={localFilters.serviceName}
              onChange={(e) => handleFilterChange('serviceName', e.target.value || undefined)}
              allowClear
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="HTTP Method">
            <Select
              placeholder="เลือก HTTP method"
              value={localFilters.method}
              onChange={(value) => handleFilterChange('method', value)}
              allowClear
            >
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="PATCH">PATCH</Option>
              <Option value="DELETE">DELETE</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="Status Code">
            <InputNumber
              placeholder="เช่น 200, 404, 500"
              value={localFilters.statusCode}
              onChange={(value) => handleFilterChange('statusCode', value || undefined)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="Success Status">
            <Select
              placeholder="เลือกสถานะ"
              value={localFilters.isSuccess}
              onChange={(value) => handleFilterChange('isSuccess', value)}
              allowClear
            >
              <Option value={true}>Success</Option>
              <Option value={false}>Failed</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="Endpoint">
            <Input
              placeholder="กรองตาม endpoint"
              value={localFilters.endpoint}
              onChange={(e) => handleFilterChange('endpoint', e.target.value || undefined)}
              allowClear
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="Called By">
            <Input
              placeholder="กรองตาม called by"
              value={localFilters.calledBy}
              onChange={(e) => handleFilterChange('calledBy', e.target.value || undefined)}
              allowClear
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="Archive Status">
            <Select
              placeholder="เลือกสถานะ archive"
              value={localFilters.isArchived}
              onChange={(value) => handleFilterChange('isArchived', value)}
              allowClear
            >
              <Option value={false}>Active</Option>
              <Option value={true}>Archived</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="Sort By">
            <Select
              value={localFilters.sortBy}
              onChange={(value) => handleFilterChange('sortBy', value)}
            >
              <Option value="request_time">Request Time</Option>
              <Option value="response_time">Response Time</Option>
              <Option value="duration_ms">Duration</Option>
              <Option value="status_code">Status Code</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={16} lg={12}>
          <Form.Item label="Date Range">
            <RangePicker
              value={
                localFilters.dateFrom && localFilters.dateTo
                  ? [dayjs(localFilters.dateFrom), dayjs(localFilters.dateTo)]
                  : null
              }
              onChange={handleDateRangeChange}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item label="Sort Order">
            <Select
              value={localFilters.sortOrder}
              onChange={(value) => handleFilterChange('sortOrder', value)}
            >
              <Option value="desc">Descending</Option>
              <Option value="asc">Ascending</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row justify="end" gutter={[8, 8]}>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              Search
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
};

export default ApiLogFilter;