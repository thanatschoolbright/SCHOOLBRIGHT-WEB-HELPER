import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  FlagOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  TagOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Flex,
  Row,
  Select,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
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
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* Top Section: Quick Summary */}
      <div
        style={{
          padding: "24px 32px",
          borderRadius: 20,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Flex align="center" gap={24}>
              <Typography.Text style={{ fontSize: 16 }}>
                เลือกงานไว้ทั้งหมด:{" "}
                <Typography.Text
                  strong
                  style={{ fontSize: 24, color: token.colorPrimary }}
                >
                  {selectedCount}
                </Typography.Text>{" "}
                รายการ
              </Typography.Text>
              <Divider type="vertical" style={{ height: 32 }} />
              <Space size={12}>
                {autoCategoryEnabled && (
                  <Tag
                    color="green"
                    icon={<CheckCircleOutlined />}
                    style={{ padding: "4px 12px", borderRadius: 8, margin: 0 }}
                  >
                    หมวดหมู่โดย AI
                  </Tag>
                )}
                {autoAiDescriptionEnabled && (
                  <Tag
                    color="blue"
                    icon={<CheckCircleOutlined />}
                    style={{ padding: "4px 12px", borderRadius: 8, margin: 0 }}
                  >
                    สรุปรายละเอียดโดย AI
                  </Tag>
                )}
                {!autoCategoryEnabled && !autoAiDescriptionEnabled && (
                  <Typography.Text
                    type="secondary"
                    italic
                    style={{ fontSize: 13 }}
                  >
                    (ไม่ได้เปิดใช้งานระบบ AI สำหรับคำขอนี้)
                  </Typography.Text>
                )}
              </Space>
            </Flex>
          </Col>
          <Col>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />{" "}
              ตรวจสอบข้อมูลก่อนกดปุ่มอัปเดตด้านล่าง
            </Typography.Text>
          </Col>
        </Row>
      </div>

      {/* Middle Section: Manual Input Fields */}
      <Row gutter={[40, 40]}>
        {/* Row 1: Status & Priority */}
        <Col xs={24} md={12}>
          <Space direction="vertical" size={12} className="w-full">
            <Typography.Text strong style={{ fontSize: 15 }}>
              <CheckCircleOutlined
                style={{ color: token.colorPrimary, marginRight: 8 }}
              />{" "}
              สถานะงาน
            </Typography.Text>
            <Select
              allowClear
              options={statusOptions}
              placeholder="เลือกสถานะเพื่อเปลี่ยนทั้งหมด..."
              className="w-full"
              size="large"
              style={{ borderRadius: 12 }}
              value={bulkStatusId}
              onChange={(value) => onStatusChange(value as number | undefined)}
            />
          </Space>
        </Col>

        <Col xs={24} md={12}>
          <Space direction="vertical" size={12} className="w-full">
            <Typography.Text strong style={{ fontSize: 15 }}>
              <FlagOutlined style={{ color: "#fa8c16", marginRight: 8 }} />{" "}
              ระดับความสำคัญ
            </Typography.Text>
            <Select
              allowClear
              options={priorityOptions}
              placeholder="เลือกระดับความสำคัญใหม่..."
              className="w-full"
              size="large"
              style={{ borderRadius: 12 }}
              value={bulkPriorityId}
              onChange={(value) =>
                onPriorityChange(value as number | undefined)
              }
            />
          </Space>
        </Col>

        {/* Row 2: Milestone & Category */}
        <Col xs={24} md={12}>
          <Space direction="vertical" size={12} className="w-full">
            <div className="flex justify-between items-center">
              <Typography.Text strong style={{ fontSize: 15 }}>
                <TagOutlined
                  style={{ color: token.colorSuccess, marginRight: 8 }}
                />{" "}
                ไมล์สโตน
              </Typography.Text>
              <Button
                size="small"
                type="link"
                onClick={onManageMilestone}
                className="p-0 h-auto"
              >
                + เพิ่ม/แก้ไข
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
              style={{ borderRadius: 12 }}
              value={bulkMilestoneIds}
              onChange={(values) => onMilestoneChange(values || [])}
            />
          </Space>
        </Col>

        <Col xs={24} md={12}>
          <Space direction="vertical" size={12} className="w-full">
            <Typography.Text strong style={{ fontSize: 15 }}>
              <TagOutlined style={{ color: "#722ed1", marginRight: 8 }} />{" "}
              หมวดหมู่
            </Typography.Text>
            <Select
              allowClear
              disabled={autoCategoryEnabled}
              mode="multiple"
              maxTagCount="responsive"
              options={categoryOptions}
              placeholder={
                autoCategoryEnabled
                  ? "AI กำลังจัดการให้ (ไม่สามารถเลือกเองได้)"
                  : "เลือกหมวดหมู่..."
              }
              className="w-full"
              size="large"
              style={{ borderRadius: 12 }}
              value={bulkCategoryIds}
              onChange={(values) => onCategoryChange(values || [])}
            />
          </Space>
        </Col>

        {/* Row 3: Dates */}
        <Col xs={24} md={12}>
          <Space direction="vertical" size={12} className="w-full">
            <Typography.Text strong style={{ fontSize: 15 }}>
              <CalendarOutlined
                style={{ color: token.colorInfo, marginRight: 8 }}
              />{" "}
              วันที่เริ่มต้น
            </Typography.Text>
            <DatePicker
              className="w-full"
              size="large"
              style={{ borderRadius: 12 }}
              placeholder="คลิกเพื่อเลือกวันเริ่มงาน"
              format="DD/MM/YYYY"
              value={bulkStartDate}
              onChange={(value) => onStartDateChange(value ?? null)}
            />
          </Space>
        </Col>

        <Col xs={24} md={12}>
          <Space direction="vertical" size={12} className="w-full">
            <Typography.Text strong style={{ fontSize: 15 }}>
              <CalendarOutlined
                style={{ color: token.colorError, marginRight: 8 }}
              />{" "}
              วันที่สิ้นสุด
            </Typography.Text>
            <DatePicker
              className="w-full"
              size="large"
              style={{ borderRadius: 12 }}
              placeholder="วันครบกำหนด (Due Date)"
              format="DD/MM/YYYY"
              value={bulkDueDate}
              onChange={(value) => onDueDateChange(value ?? null)}
            />
          </Space>
        </Col>
      </Row>

      {/* Bottom Section: Action Buttons */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 40,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Flex gap={20} justify="end">
          <Button
            icon={<ClearOutlined />}
            onClick={onClear}
            disabled={bulkUpdating}
            size="large"
            style={{ minWidth: 160, borderRadius: 12 }}
          >
            ล้างค่าที่กรอก
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={bulkUpdating}
            disabled={
              submitDisabled || (autoCategoryEnabled && !categoryOptions.length)
            }
            onClick={onSubmit}
            style={{
              minWidth: 220,
              borderRadius: 12,
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              boxShadow: "none",
            }}
          >
            อัปเดตงานทั้งหมด ({selectedCount} รายการ)
          </Button>
        </Flex>
      </div>
    </div>
  );
}
