import {
  Button,
  DatePicker,
  Select,
  Space,
  Tag,
  theme,
  Typography,
  Row,
  Col,
  Tooltip,
  Divider,
} from "antd";
import {
  InfoCircleOutlined,
  CalendarOutlined,
  TagOutlined,
  FlagOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type { OptionItem } from "./types";

export type BulkUpdatePanelProps = {
  autoCategoryEnabled: boolean;
  autoCategoryLoading: boolean;
  bulkCategoryIds: number[] | undefined;
  bulkDueDate: Dayjs | null | undefined;
  bulkMilestoneIds: number[] | undefined;
  bulkPriorityId: number | undefined;
  bulkStartDate: Dayjs | null | undefined;
  bulkStatusId: number | undefined;
  bulkUpdating: boolean;
  categoryOptions: OptionItem[];
  milestoneOptions: OptionItem[];
  onCategoryChange: (values: number[] | undefined) => void;
  onClear: () => void;
  onDueDateChange: (value: Dayjs | null | undefined) => void;
  onManageMilestone: () => void;
  onMilestoneChange: (values: number[] | undefined) => void;
  onPriorityChange: (value: number | undefined) => void;
  onStartDateChange: (value: Dayjs | null | undefined) => void;
  onStatusChange: (value: number | undefined) => void;
  onSubmit: () => void;
  priorityOptions: OptionItem[];
  selectedCount: number;
  statusOptions: OptionItem[];
  submitDisabled: boolean;
  autoAiDescriptionEnabled?: boolean;
};

export default function BulkUpdatePanel({
  autoCategoryEnabled,
  autoCategoryLoading,
  autoAiDescriptionEnabled = false,
  bulkCategoryIds,
  bulkDueDate,
  bulkMilestoneIds,
  bulkPriorityId,
  bulkStartDate,
  bulkStatusId,
  bulkUpdating,
  categoryOptions,
  milestoneOptions,
  onCategoryChange,
  onClear,
  onDueDateChange,
  onManageMilestone,
  onMilestoneChange,
  onPriorityChange,
  onStartDateChange,
  onStatusChange,
  onSubmit,
  priorityOptions,
  selectedCount,
  statusOptions,
  submitDisabled,
}: BulkUpdatePanelProps) {
  const { token } = theme.useToken();

  return (
    <div className="flex flex-col gap-8">
      {/* Top Section: Selection Summary & AI Indicators */}
      <div
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col>
            <Space size={16}>
              <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                รายการที่เลือกทั้งหมด:{" "}
                <Typography.Text
                  strong
                  style={{ fontSize: 18, color: token.colorPrimary }}
                >
                  {selectedCount}
                </Typography.Text>{" "}
                รายการ
              </Typography.Text>
              <Divider type="vertical" style={{ height: 24 }} />
              <Space size={8}>
                {autoCategoryEnabled && (
                  <Tag
                    color="green"
                    icon={<CheckCircleOutlined />}
                    className="px-3 py-1 rounded-lg"
                  >
                    หมวดหมู่โดย AI
                  </Tag>
                )}
                {autoAiDescriptionEnabled && (
                  <Tag
                    color="blue"
                    icon={<CheckCircleOutlined />}
                    className="px-3 py-1 rounded-lg"
                  >
                    สรุปรายละเอียดโดย AI
                  </Tag>
                )}
                {!autoCategoryEnabled && !autoAiDescriptionEnabled && (
                  <Typography.Text
                    type="secondary"
                    italic
                    style={{ fontSize: 12 }}
                  >
                    (ไม่ได้เปิดใช้งานระบบ AI สำหรับคำขอนี้)
                  </Typography.Text>
                )}
              </Space>
            </Space>
          </Col>
          <Col>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <InfoCircleOutlined className="mr-1" />{" "}
              ตรวจสอบข้อมูลก่อนกดปุ่มอัปเดตด้านล่าง
            </Typography.Text>
          </Col>
        </Row>
      </div>

      {/* Middle Section: Manual Input Fields */}
      <Row gutter={[32, 32]}>
        {/* Row 1: Status & Priority */}
        <Col xs={24} md={12}>
          <Space direction="vertical" size={6} className="w-full">
            <Typography.Text strong className="flex items-center gap-1">
              <CheckCircleOutlined style={{ color: token.colorPrimary }} />{" "}
              สถานะงาน
              <Tooltip title="เปลี่ยนสถานะของงานทั้งหมดที่เลือก เช่น จาก Open เป็น Closed">
                <InfoCircleOutlined className="text-gray-400 cursor-help" />
              </Tooltip>
            </Typography.Text>
            <Select
              allowClear
              options={statusOptions}
              placeholder="เลือกสถานะใหม่..."
              className="w-full"
              size="large"
              value={bulkStatusId}
              onChange={(value) => onStatusChange(value as number | undefined)}
            />
          </Space>
        </Col>

        <Col xs={24} md={12}>
          <Space direction="vertical" size={6} className="w-full">
            <Typography.Text strong className="flex items-center gap-1">
              <FlagOutlined style={{ color: "#fa8c16" }} /> ระดับความสำคัญ
              <Tooltip title="ปรับระดับความสำคัญของงาน เช่น High, Normal, Low">
                <InfoCircleOutlined className="text-gray-400 cursor-help" />
              </Tooltip>
            </Typography.Text>
            <Select
              allowClear
              options={priorityOptions}
              placeholder="เลือกระดับความสำคัญใหม่..."
              className="w-full"
              size="large"
              value={bulkPriorityId}
              onChange={(value) =>
                onPriorityChange(value as number | undefined)
              }
            />
          </Space>
        </Col>

        {/* Row 2: Milestone & Category */}
        <Col xs={24} md={12}>
          <Space direction="vertical" size={6} className="w-full">
            <div className="flex justify-between items-center">
              <Typography.Text strong className="flex items-center gap-1">
                <TagOutlined style={{ color: token.colorSuccess }} /> ไมล์สโตน
                <Tooltip title="ระบุไมล์สโตน (Milestone) หรือรอบการทำงาน">
                  <InfoCircleOutlined className="text-gray-400 cursor-help" />
                </Tooltip>
              </Typography.Text>
              <Button
                size="small"
                type="link"
                onClick={onManageMilestone}
                className="p-0 h-auto"
              >
                เพิ่ม/แก้ไขไมล์สโตน
              </Button>
            </div>
            <Select
              allowClear
              mode="multiple"
              maxTagCount="responsive"
              options={milestoneOptions}
              placeholder="เลือกไมล์สโตน..."
              className="w-full"
              size="large"
              value={bulkMilestoneIds}
              onChange={(values) => onMilestoneChange(values || [])}
            />
          </Space>
        </Col>

        <Col xs={24} md={12}>
          <Space direction="vertical" size={6} className="w-full">
            <Typography.Text strong className="flex items-center gap-1">
              <TagOutlined style={{ color: "#722ed1" }} /> หมวดหมู่
              <Tooltip
                title={
                  autoCategoryEnabled
                    ? "AI กำลังจัดการหมวดหมู่ให้อัตโนมัติ"
                    : "เลือกหมวดหมู่ที่เหมาะสมกับรายการงาน"
                }
              >
                <InfoCircleOutlined className="text-gray-400 cursor-help" />
              </Tooltip>
            </Typography.Text>
            <Select
              allowClear
              disabled={autoCategoryEnabled}
              mode="multiple"
              maxTagCount="responsive"
              options={categoryOptions}
              placeholder={
                autoCategoryEnabled
                  ? "AI กำลังเลือกหมวดหมู่ให้..."
                  : "เลือกหมวดหมู่..."
              }
              className="w-full"
              size="large"
              value={bulkCategoryIds}
              onChange={(values) => onCategoryChange(values || [])}
            />
          </Space>
        </Col>

        {/* Row 3: Dates */}
        <Col xs={24} md={12}>
          <Space direction="vertical" size={6} className="w-full">
            <Typography.Text strong className="flex items-center gap-1">
              <CalendarOutlined style={{ color: token.colorInfo }} />{" "}
              วันที่เริ่มต้น
              <Tooltip title="ตั้งวันเริ่มงานใหม่สำหรับทุกรายการ">
                <InfoCircleOutlined className="text-gray-400 cursor-help" />
              </Tooltip>
            </Typography.Text>
            <DatePicker
              className="w-full"
              size="large"
              placeholder="วันที่เริ่มงาน"
              value={bulkStartDate}
              onChange={(value) => onStartDateChange(value ?? null)}
            />
          </Space>
        </Col>

        <Col xs={24} md={12}>
          <Space direction="vertical" size={6} className="w-full">
            <Typography.Text strong className="flex items-center gap-1">
              <CalendarOutlined style={{ color: token.colorError }} />{" "}
              วันที่สิ้นสุด
              <Tooltip title="ตั้งกำหนดส่งงาน (Due Date) ใหม่">
                <InfoCircleOutlined className="text-gray-400 cursor-help" />
              </Tooltip>
            </Typography.Text>
            <DatePicker
              className="w-full"
              size="large"
              placeholder="วันที่ครบกำหนด"
              value={bulkDueDate}
              onChange={(value) => onDueDateChange(value ?? null)}
            />
          </Space>
        </Col>
      </Row>

      {/* Bottom Section: Action Buttons */}
      <div className="mt-4 pt-6 border-t border-gray-100">
        <Row gutter={16} justify="end">
          <Col>
            <Button
              icon={<ClearOutlined />}
              onClick={onClear}
              disabled={bulkUpdating}
              size="large"
              className="px-6 rounded-xl hover:bg-gray-50"
            >
              ล้างค่าทั้งหมด
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={bulkUpdating}
              disabled={
                submitDisabled ||
                (autoCategoryEnabled && !categoryOptions.length)
              }
              onClick={onSubmit}
              className="px-12 rounded-xl shadow-lg shadow-blue-100"
            >
              อัปเดตงานทั้งหมด
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
}
