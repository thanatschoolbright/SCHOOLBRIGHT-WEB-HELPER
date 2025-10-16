import React, { useMemo } from "react";
import { Button, Space, Table, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { ColumnsType, TableProps } from "antd/es/table";
import dayjs from "dayjs";

import { HoursBadge, StatusBadge } from "@components/badge";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import type {
  TimesheetEntry,
  TimesheetTableProps,
  TableFilters,
  PaginationData
} from "@/types/timesheet-table.types";
import type { Project, UserProfile } from "@/stores/type";

export interface EnhancedTimesheetTableProps extends TimesheetTableProps {
  /** รายการโปรเจ็กต์ทั้งหมด */
  projects: Project[];
  /** รายการผู้ใช้ทั้งหมด */
  users: UserProfile[];
  /** ภาษาที่ใช้แสดงผล */
  language: string;
  /** การแปลสถานะเป็นข้อความ */
  statusLabelMap: Record<string, string>;
  /** ตัวกรองปัจจุบัน */
  filteredInfo?: TableFilters;
}

/**
 * ตาราง Timesheet พร้อมฟีเจอร์ครบครัน
 * รวมการกรองข้อมูล, การเรียงลำดับ, และการจัดการ pagination
 */
export const TimesheetTable: React.FC<EnhancedTimesheetTableProps> = ({
  dataSource,
  loading = false,
  pagination,
  selectedRowKeys = [],
  onSelectionChange,
  onTableChange,
  onViewDetail,
  projects,
  users,
  language,
  statusLabelMap,
  filteredInfo = {},
}) => {
  //** ฟังก์ชันค้นหาข้อมูลผู้ใช้จาก ID */
  const getUserById = (id: string | number) =>
    users.find((user) => String(user.admin_id) === String(id));

  //** การตั้งค่า row selection สำหรับตาราง */
  const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
    selectedRowKeys,
    onChange: onSelectionChange,
    getCheckboxProps: (record) => ({
      disabled: !!(record as any).children
    }),
  };

  //** คอลัมน์ของตาราง */
  const columns = useMemo<ColumnsType<TimesheetEntry>>(
    () => [
      {
        title: "วันที่",
        dataIndex: "date",
        width: 120,
        sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
        filters: Array.from(new Set(dataSource.map((e) => e.date))).map(
          (date) => ({
            text: dayjs(date).format("DD/MM/YYYY"),
            value: date,
          })
        ),
        onFilter: (value, record) => record.date === value,
        filteredValue: filteredInfo.date || null,
        filterSearch: true,
      },
      {
        title: "ชื่อโปรเจ็ค",
        dataIndex: "project_name",
        width: 180,
        sorter: (a, b) =>
          String(a.project_name).localeCompare(String(b.project_name)),
        filters: projects.map((project) => ({
          text: project.name,
          value: project.name,
        })),
        onFilter: (value, record) => record.project_name === value,
        filteredValue: filteredInfo.project_name || null,
        filterSearch: true,
        ellipsis: {
          showTitle: false,
        },
        render: (text) => (
          <Tooltip title={text}>
            {text}
          </Tooltip>
        ),
      },
      {
        title: "ชื่อฟีเจอร์",
        dataIndex: "feature_name",
        width: 180,
        sorter: (a, b) =>
          String(a.feature_name || "").localeCompare(
            String(b.feature_name || "")
          ),
        filters: Array.from(
          new Set(dataSource.map((e) => e.feature_name).filter(Boolean))
        ).map((name) => ({
          text: name!,
          value: name!,
        })),
        onFilter: (value, record) => record.feature_name === value,
        filteredValue: filteredInfo.feature_name || null,
        filterSearch: true,
        ellipsis: {
          showTitle: false,
        },
        render: (text) => (
          <Tooltip title={text || "-"}>
            {text || "-"}
          </Tooltip>
        ),
      },
      {
        title: "ชื่อผู้จัดทำ",
        dataIndex: "created_by",
        width: 150,
        sorter: (a, b) =>
          String(a.created_by).localeCompare(String(b.created_by)),
        render: (value: string | number) => {
          const user = getUserById(value);
          const displayName = user
            ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim()
            : "-";
          return (
            <Tooltip title={displayName}>
              {displayName}
            </Tooltip>
          );
        },
        filters: users.map((user) => {
          const displayName = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();
          return {
            text: displayName || user.name || user.email || "-",
            value: user.admin_id,
          };
        }),
        onFilter: (value, record) => String(record.created_by) === String(value),
        filteredValue: filteredInfo.created_by || null,
        filterSearch: true,
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        width: 120,
        filters: STATUS_OPTIONS.map((option) => ({
          text: language === "th" ? option.label_th : option.label_en,
          value: option.value,
        })),
        onFilter: (value, record) => record.status === value,
        filteredValue: filteredInfo.status || null,
        sorter: (a, b) => String(a.status).localeCompare(String(b.status)),
        render: (status: string) => (
          <StatusBadge
            status={status}
            statusLabelMap={statusLabelMap}
          />
        ),
      },
      {
        title: "ชั่วโมง",
        dataIndex: "hours",
        width: 100,
        sorter: (a, b) => Number(a.hours) - Number(b.hours),
        render: (hours: number) => <HoursBadge hours={hours} />,
        filters: Array.from(new Set(dataSource.map((e) => e.hours))).map(
          (hour) => ({
            text: String(hour),
            value: hour,
          })
        ),
        onFilter: (value, record) => Number(record.hours) === Number(value),
        filteredValue: filteredInfo.hours || null,
        filterSearch: true,
      },
      {
        title: "คำอธิบาย",
        dataIndex: "description",
        width: 250,
        sorter: (a, b) =>
          String(a.description || "").localeCompare(
            String(b.description || "")
          ),
        ellipsis: {
          showTitle: false,
        },
        render: (text) => (
          <Tooltip title={text || "-"}>
            {text || "-"}
          </Tooltip>
        ),
      },
      {
        title: "จัดการ",
        key: "actions",
        width: 80,
        fixed: "right",
        render: (_value, record) => (
          <Space>
            {/* ปุ่มดูรายละเอียด */}
            <Tooltip title="ดูรายละเอียด">
              <Button
                size="small"
                type="text"
                icon={<InfoCircleOutlined />}
                onClick={() => onViewDetail?.(record)}
                style={{
                  color: "#1677ff",
                  backgroundColor: "rgba(22, 119, 255, 0.06)"
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [
      dataSource,
      projects,
      users,
      language,
      statusLabelMap,
      filteredInfo,
      onViewDetail,
    ]
  );

  //** การจัดการเหตุการณ์เปลี่ยนแปลงตาราง */
  const handleTableChange: TableProps<TimesheetEntry>["onChange"] = (
    paginationInfo,
    filters
  ) => {
    const newPagination: PaginationData = {
      current: paginationInfo.current || 1,
      pageSize: paginationInfo.pageSize || 10,
      total: paginationInfo.total || 0,
    };

    onTableChange?.(newPagination, filters as TableFilters);
  };

  return (
    <Table<TimesheetEntry>
      bordered
      dataSource={dataSource}
      loading={loading}
      columns={columns}
      rowSelection={rowSelection}
      rowKey={(record) => record.id ?? record.date}
      onChange={handleTableChange}
      pagination={
        pagination
          ? {
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100", "10000"],
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
            }
          : false
      }
      scroll={{ x: 1400, y: 600 }}
      size="middle"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      }}
    />
  );
};

export default TimesheetTable;
