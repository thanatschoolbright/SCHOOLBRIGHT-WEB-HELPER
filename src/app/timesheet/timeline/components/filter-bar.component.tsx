import React from "react";
import {
  Button,
  Card,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Collapse,
  Space,
  Typography,
  theme,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  ZoomInOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TimelineFilters } from "../types/timeline.types";

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Panel } = Collapse;

interface FilterBarProps {
  filters: TimelineFilters;
  setFilters: (filters: TimelineFilters) => void;
  onRefresh: () => void;
  onCreateProject: () => void;
  onScrollToToday?: () => void;
  loading?: boolean;
}

export const FilterBarComponent: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  onRefresh,
  onCreateProject,
  onScrollToToday,
  loading,
}) => {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();

  return (
    <div className="mb-6">
      <Collapse
        defaultActiveKey={["1"]}
        expandIcon={({ isActive }) => (
          <DownOutlined
            rotate={isActive ? 180 : 0}
            style={{ color: token.colorPrimary }}
          />
        )}
        style={{
          background: token.colorBgContainer,
          borderRadius: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <Panel
          header={
            <div className="flex items-center justify-between w-full pr-4">
              <Space size="middle">
                <div
                  style={{
                    backgroundColor: token.colorPrimaryBg,
                    padding: 8,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FilterOutlined
                    style={{ color: token.colorPrimary, fontSize: 18 }}
                  />
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  {t("timeline_page.filters.title") ||
                    "การค้นหาและตัวกรองข้อมูล"}
                </Text>
              </Space>

              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onCreateProject}
                  style={{ borderRadius: 8 }}
                >
                  {t("timeline_page.filters.new_project")}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  รีเฟรช
                </Button>
              </Space>
            </div>
          }
          key="1"
          style={{ border: "none" }}
        >
          <div className="p-2">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12} lg={8}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  <SearchOutlined className="mr-2" />
                  ค้นหาโครงการ
                </Text>
                <Input
                  placeholder={t("timeline_page.filters.search_placeholder")}
                  prefix={
                    <SearchOutlined
                      style={{ color: token.colorTextTertiary }}
                    />
                  }
                  size="large"
                  allowClear
                  style={{ borderRadius: 10 }}
                  value={filters.keyword}
                  onChange={(e) =>
                    setFilters({ ...filters, keyword: e.target.value })
                  }
                />
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  <CalendarOutlined className="mr-2" />
                  ช่วงเวลา
                </Text>
                <RangePicker
                  size="large"
                  style={{ width: "100%", borderRadius: 10 }}
                  value={filters.dateRange}
                  onChange={(dates) =>
                    setFilters({ ...filters, dateRange: dates })
                  }
                />
              </Col>

              <Col xs={24} lg={8}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      สถานะ
                    </Text>
                    <Select
                      defaultValue="All"
                      size="large"
                      style={{ width: "100%" }}
                      value={filters.status}
                      onChange={(val) =>
                        setFilters({ ...filters, status: val })
                      }
                      dropdownStyle={{ borderRadius: 8 }}
                      suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
                      options={[
                        {
                          value: "All",
                          label:
                            t("timeline_page.filters.status_all") || "ทั้งหมด",
                        },
                        {
                          value: "open",
                          label:
                            t("timeline_page.filters.status_open") ||
                            "กำลังเปิด",
                        },
                        {
                          value: "close",
                          label:
                            t("timeline_page.filters.status_closed") ||
                            "ปิดแล้ว",
                        },
                      ]}
                    />
                  </Col>
                  <Col span={8}>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      มุมมอง
                    </Text>
                    <Select
                      defaultValue="all"
                      size="large"
                      style={{ width: "100%" }}
                      value={filters.viewType}
                      onChange={(val) =>
                        setFilters({
                          ...filters,
                          viewType: val as "all" | "project",
                        })
                      }
                      options={[
                        { value: "all", label: "ทั้งหมด" },
                        { value: "project", label: "เฉพาะโครงการ" },
                      ]}
                    />
                  </Col>
                  <Col span={8}>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      ซูม
                    </Text>
                    <Select
                      defaultValue="day"
                      size="large"
                      style={{ width: "100%" }}
                      value={filters.zoomLevel}
                      onChange={(val) =>
                        setFilters({
                          ...filters,
                          zoomLevel: val as "day" | "week" | "month",
                        })
                      }
                      options={[
                        { value: "day", label: "วัน" },
                        { value: "week", label: "สัปดาห์" },
                        { value: "month", label: "เดือน" },
                      ]}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>

            {onScrollToToday && (
              <div className="mt-6 flex justify-end">
                <Button
                  icon={<CalendarOutlined />}
                  onClick={onScrollToToday}
                  size="middle"
                  type="link"
                  style={{ color: token.colorError }}
                >
                  เลื่อนไปที่วันนี้
                </Button>
              </div>
            )}
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};
