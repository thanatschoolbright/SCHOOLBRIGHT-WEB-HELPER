import React from "react";
import { Button, Card, Input, Select, DatePicker, Row, Col } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  ZoomInOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TimelineFilters } from "../types/timeline.types";

const { RangePicker } = DatePicker;

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

  return (
    <Card
      className="mb-6"
      styles={{
        body: { padding: 32 },
      }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={20}>
          <Card
            title={
              <div>
                <SearchOutlined /> ค้นหาและกรองข้อมูล
              </div>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div>
                  <div className="mb-2">
                    <SearchOutlined /> ค้นหาโครงการ
                  </div>
                  <Input
                    placeholder={t("timeline_page.filters.search_placeholder")}
                    prefix={<SearchOutlined />}
                    size="large"
                    allowClear
                    onChange={(e) =>
                      setFilters({ ...filters, keyword: e.target.value })
                    }
                  />
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div>
                  <div className="mb-2">
                    <CalendarOutlined /> ช่วงเวลา
                  </div>
                  <RangePicker
                    size="large"
                    value={filters.dateRange}
                    onChange={(dates) =>
                      setFilters({ ...filters, dateRange: dates })
                    }
                  />
                </div>
              </Col>

              <Col xs={12} sm={8}>
                <div>
                  <div className="mb-2">
                    <CheckCircleOutlined /> สถานะ
                  </div>
                  <Select
                    defaultValue="All"
                    size="large"
                    style={{ width: "100%" }}
                    onChange={(val) => setFilters({ ...filters, status: val })}
                    options={[
                      {
                        value: "All",
                        label: (
                          <>
                            <CheckCircleOutlined />{" "}
                            {t("timeline_page.filters.status_all")}
                          </>
                        ),
                      },
                      {
                        value: "open",
                        label: (
                          <>
                            <CheckCircleOutlined />{" "}
                            {t("timeline_page.filters.status_open")}
                          </>
                        ),
                      },
                      {
                        value: "close",
                        label: (
                          <>
                            <CheckCircleOutlined />{" "}
                            {t("timeline_page.filters.status_closed")}
                          </>
                        ),
                      },
                    ]}
                  />
                </div>
              </Col>

              <Col xs={12} sm={8}>
                <div>
                  <div className="mb-2">
                    <EyeOutlined /> มุมมอง
                  </div>
                  <Select
                    defaultValue="all"
                    size="large"
                    style={{ width: "100%" }}
                    onChange={(val) =>
                      setFilters({
                        ...filters,
                        viewType: val as "all" | "project",
                      })
                    }
                    options={[
                      {
                        value: "all",
                        label: (
                          <>
                            <EyeOutlined />{" "}
                            {t("timeline_page.filters.view_full")}
                          </>
                        ),
                      },
                      {
                        value: "project",
                        label: (
                          <>
                            <EyeOutlined />{" "}
                            {t("timeline_page.filters.view_project")}
                          </>
                        ),
                      },
                    ]}
                  />
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div>
                  <div className="mb-2">
                    <ZoomInOutlined /> ระดับซูม
                  </div>
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
                      {
                        value: "day",
                        label: (
                          <>
                            <CalendarOutlined />{" "}
                            {t("timeline_page.filters.zoom_day")}
                          </>
                        ),
                      },
                      {
                        value: "week",
                        label: (
                          <>
                            <CalendarOutlined />{" "}
                            {t("timeline_page.filters.zoom_week")}
                          </>
                        ),
                      },
                      {
                        value: "month",
                        label: (
                          <>
                            <CalendarOutlined />{" "}
                            {t("timeline_page.filters.zoom_month")}
                          </>
                        ),
                      },
                    ]}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={4}>
          <Card
            title={
              <div>
                <ClockCircleOutlined /> การจัดการด่วน
              </div>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  loading={loading}
                  size="large"
                  block
                  type="default"
                  style={{ height: 120 }}
                  title={t("timeline_page.filters.refresh")}
                >
                  <div>รีเฟรช</div>
                </Button>
              </Col>

              {onScrollToToday && (
                <Col xs={12}>
                  <Button
                    icon={<CalendarOutlined />}
                    onClick={onScrollToToday}
                    size="large"
                    block
                    type="primary"
                    danger
                    style={{ height: 120 }}
                    title="ไปที่วันนี้"
                  >
                    <div>
                      <CalendarOutlined style={{ fontSize: 32 }} />
                      <div>วันนี้</div>
                    </div>
                  </Button>
                </Col>
              )}
            </Row>
          </Card>
        </Col>

        <Col xs={20}>
          <Button
            type="primary"
            icon={<PlusOutlined style={{ fontSize: 20 }} />}
            size="large"
            block
            onClick={onCreateProject}
          >
            {t("timeline_page.filters.new_project")}
          </Button>
        </Col>
      </Row>
    </Card>
  );
};
