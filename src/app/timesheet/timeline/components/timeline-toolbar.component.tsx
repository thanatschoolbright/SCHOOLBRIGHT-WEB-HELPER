import React from "react";
import { Space, Button, Radio, Input, Tag, theme } from "antd";
import type { RadioChangeEvent } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

// ViewMode is not exported from ../types/timeline.types, define locally:
type ViewMode = "month" | "quarter";

interface TimelineToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterDuration: number | null;
  onFilterDurationChange: (value: number | null) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  viewMode,
  onViewModeChange,
  filterDuration,
  onFilterDurationChange,
  searchTerm,
  onSearchChange,
  onRefresh,
  loading,
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation("translate");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <Space>
        <Button
          type={viewMode === "month" ? "primary" : "default"}
          onClick={() => onViewModeChange("month")}
        >
          {t("timeline_page.view_month")}
        </Button>
        <Button
          type={viewMode === "quarter" ? "primary" : "default"}
          onClick={() => onViewModeChange("quarter")}
        >
          {t("timeline_page.view_quarter")}
        </Button>
      </Space>

      <Space>
        <span style={{ fontWeight: 600 }}>
          {t("timeline_page.focus_label")}:
        </span>
        <Radio.Group
          value={filterDuration}
          onChange={(e: RadioChangeEvent) =>
            onFilterDurationChange(e.target.value)
          }
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value={null}>
            {t("timeline_page.filter_all")}
          </Radio.Button>
          <Radio.Button value={1}>
            {t("timeline_page.filter_1month")}
          </Radio.Button>
          <Radio.Button value={3}>
            {t("timeline_page.filter_3months")}
          </Radio.Button>
          <Radio.Button value={6}>
            {t("timeline_page.filter_6months")}
          </Radio.Button>
        </Radio.Group>
      </Space>

      <Space>
        <Input
          placeholder={t("timeline_page.search_placeholder")}
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Tag color="blue">{t("timeline_page.tag_project")}</Tag>
        <Tag color="orange">{t("timeline_page.tag_feature")}</Tag>
        <Tag color="green">{t("timeline_page.tag_today")}</Tag>
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={loading}
          type="text"
        />
      </Space>
    </div>
  );
};
