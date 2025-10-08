"use client";

import {ClearOutlined, FilterOutlined, ProjectOutlined, TeamOutlined} from "@ant-design/icons";
import {Button, Select, Space, Tag} from "antd";
import React from "react";

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
    return (
        <Space direction="vertical" size="middle" style={{width: "100%"}}>
            {/* โหมดการดู */}
            <Space wrap>
                <span style={{fontWeight: 500}}>โหมดการวิเคราะห์:</span>
                <Button.Group>
                    <Button
                        type={viewMode === "all" ? "primary" : "default"}
                        icon={<FilterOutlined/>}
                        onClick={() => onViewModeChange("all")}
                        disabled={loading}
                    >
                        ทั้งหมด
                    </Button>
                    <Button
                        type={viewMode === "by-person" ? "primary" : "default"}
                        icon={<TeamOutlined/>}
                        onClick={() => onViewModeChange("by-person")}
                        disabled={loading}
                    >
                        รายคน
                    </Button>
                    <Button
                        type={viewMode === "by-project" ? "primary" : "default"}
                        icon={<ProjectOutlined/>}
                        onClick={() => onViewModeChange("by-project")}
                        disabled={loading}
                    >
                        รายโปรเจ็ค
                    </Button>
                </Button.Group>
                <Button
                    icon={<ClearOutlined/>}
                    onClick={onClearFilters}
                    disabled={loading}
                >
                    ล้างตัวกรอง
                </Button>
            </Space>

            {/* ตัวกรองรายคน */}
            {viewMode === "by-person" && (
                <Space align="start" wrap>
                    <span style={{fontWeight: 500}}>เลือกบุคคล:</span>
                    <Select
                        mode="multiple"
                        style={{minWidth: 300}}
                        placeholder="เลือกบุคคลที่ต้องการวิเคราะห์"
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
                            เลือก {selectedPersons.length} คน
                        </Tag>
                    )}
                </Space>
            )}

            {/* ตัวกรองรายโปรเจ็ค */}
            {viewMode === "by-project" && (
                <Space align="start" wrap>
                    <span style={{fontWeight: 500}}>เลือกโปรเจ็ค:</span>
                    <Select
                        mode="multiple"
                        style={{minWidth: 300}}
                        placeholder="เลือกโปรเจ็คที่ต้องการวิเคราะห์"
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
                            เลือก {selectedProjects.length} โปรเจ็ค
                        </Tag>
                    )}
                </Space>
            )}
        </Space>
    );
};
