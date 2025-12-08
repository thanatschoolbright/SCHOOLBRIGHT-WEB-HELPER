import React from "react";
import { Button, Card, Input, Select, DatePicker, Space, Row, Col } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TimelineFilters } from "../types/timeline.types";

const { RangePicker } = DatePicker;

interface FilterBarProps {
  filters: TimelineFilters;
  setFilters: (filters: TimelineFilters) => void;
  onRefresh: () => void;
  onCreateProject: () => void;
  loading?: boolean;
}

export const FilterBarComponent: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  onRefresh,
  onCreateProject,
  loading,
}) => {
  const { t } = useTranslation("translate");

  return (
    <Card  className="shadow-sm">
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col xs={24} md={18}>
          <Space wrap>
            <Input
              placeholder={t("timeline_page.filters.search_placeholder")}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value })
              }
            />
            <Select
              defaultValue="All"
              style={{ width: 150 }}
              onChange={(val) => setFilters({ ...filters, status: val })}
              options={[
                { value: "All", label: t("timeline_page.filters.status_all") },
                {
                  value: "open",
                  label: t("timeline_page.filters.status_open"),
                },
                {
                  value: "close",
                  label: t("timeline_page.filters.status_closed"),
                },
              ]}
            />
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={(val) =>
                setFilters({ ...filters, viewType: val as "all" | "project" })
              }
              options={[
                { value: "all", label: t("timeline_page.filters.view_full") },
                {
                  value: "project",
                  label: t("timeline_page.filters.view_project"),
                },
              ]}
            />
            <Select
              defaultValue="day"
              style={{ width: 120 }}
              value={filters.zoomLevel}
              onChange={(val) =>
                setFilters({
                  ...filters,
                  zoomLevel: val as "day" | "week" | "month",
                })
              }
              options={[
                { value: "day", label: t("timeline_page.filters.zoom_day") },
                { value: "week", label: t("timeline_page.filters.zoom_week") },
                {
                  value: "month",
                  label: t("timeline_page.filters.zoom_month"),
                },
              ]}
            />
            <RangePicker
              style={{ width: 250 }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
              title={t("timeline_page.filters.refresh")}
            />
          </Space>
        </Col>
        <Col xs={24} md={6} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={onCreateProject}
          >
            {t("timeline_page.filters.new_project")}
          </Button>
        </Col>
      </Row>
    </Card>
  );
};
