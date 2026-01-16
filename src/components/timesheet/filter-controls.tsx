"use client";

import {
  ClearOutlined,
  FilterOutlined,
  ProjectOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Select, Space, Tag } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

interface FilterControlsProps {
  viewMode: "all" | "by-person" | "by-project";
  onViewModeChange: (mode: "all" | "by-person" | "by-project") => void;
  selectedPersons: string[];
  onSelectedPersonsChange: (persons: string[]) => void;
  selectedProjects: string[];
  onSelectedProjectsChange: (projects: string[]) => void;
  personOptions: Array<{ label: string; value: string }>;
  projectOptions: Array<{ label: string; value: string }>;
  onClearFilters: () => void;
  loading?: boolean;
}

/**
 * Component สำหรับควบคุม Filter การวิเคราะห์ Timesheet
 * @param props - Properties ของ Filter Controls
 */
export const FilterControls: React.FC<FilterControlsProps> = ({
  viewMode,
  onViewModeChange,
  selectedPersons,
  onSelectedPersonsChange,
  selectedProjects,
  onSelectedProjectsChange,
  personOptions,
  projectOptions,
  onClearFilters,
  loading = false,
}) => {
  const { t } = useTranslation();
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* โหมดการดู */}
      <Space wrap>
        <span style={{ fontWeight: 500 }}>
          {t("timesheet_components.analysis_mode", "โหมดการวิเคราะห์")}:
        </span>
        <Button.Group>
          <Button
            type={viewMode === "all" ? "primary" : "default"}
            icon={<FilterOutlined />}
            onClick={() => onViewModeChange("all")}
            disabled={loading}
          >
            {t("timesheet_components.all", "ทั้งหมด")}
          </Button>
          <Button
            type={viewMode === "by-person" ? "primary" : "default"}
            icon={<TeamOutlined />}
            onClick={() => onViewModeChange("by-person")}
            disabled={loading}
          >
            {t("timesheet_components.by_person", "รายคน")}
          </Button>
          <Button
            type={viewMode === "by-project" ? "primary" : "default"}
            icon={<ProjectOutlined />}
            onClick={() => onViewModeChange("by-project")}
            disabled={loading}
          >
            {t("timesheet_components.by_project", "รายโปรเจ็ค")}
          </Button>
        </Button.Group>
        <Button
          icon={<ClearOutlined />}
          onClick={onClearFilters}
          disabled={loading}
        >
          {t("timesheet_components.clear_filters", "ล้างตัวกรอง")}
        </Button>
      </Space>

      {/* ตัวกรองรายคน */}
      {viewMode === "by-person" && (
        <Space align="start" wrap>
          <span style={{ fontWeight: 500 }}>
            {t("timesheet_components.select_person_label", "เลือกบุคคล")}:
          </span>
          <Select
            mode="multiple"
            style={{ minWidth: 300 }}
            placeholder={t(
              "timesheet_components.select_person_placeholder",
              "เลือกบุคคลที่ต้องการวิเคราะห์"
            )}
            value={selectedPersons}
            onChange={onSelectedPersonsChange}
            options={personOptions}
            allowClear
            showSearch
            loading={loading}
            disabled={loading}
            maxTagCount="responsive"
          />
          {selectedPersons.length > 0 && (
            <Tag color="blue">
              {t("timesheet_components.selected_persons_count", {
                count: selectedPersons.length,
                defaultValue: `เลือก ${selectedPersons.length} คน`,
              })}
            </Tag>
          )}
        </Space>
      )}

      {/* ตัวกรองรายโปรเจ็ค */}
      {viewMode === "by-project" && (
        <Space align="start" wrap>
          <span style={{ fontWeight: 500 }}>
            {t("timesheet_components.select_project_label", "เลือกโปรเจ็ค")}:
          </span>
          <Select
            mode="multiple"
            style={{ minWidth: 300 }}
            placeholder={t(
              "timesheet_components.select_project_analysis_placeholder",
              "เลือกโปรเจ็คที่ต้องการวิเคราะห์"
            )}
            value={selectedProjects}
            onChange={onSelectedProjectsChange}
            options={projectOptions}
            allowClear
            showSearch
            loading={loading}
            disabled={loading}
            maxTagCount="responsive"
          />
          {selectedProjects.length > 0 && (
            <Tag color="green">
              {t("timesheet_components.selected_projects_count", {
                count: selectedProjects.length,
                defaultValue: `เลือก ${selectedProjects.length} โปรเจ็ค`,
              })}
            </Tag>
          )}
        </Space>
      )}
    </Space>
  );
};
