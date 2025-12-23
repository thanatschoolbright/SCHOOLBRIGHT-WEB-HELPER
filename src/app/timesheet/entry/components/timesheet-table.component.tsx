import React, { useMemo, useCallback, useRef } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Tooltip,
  Button,
  Avatar,
  Progress,
  theme,
  InputRef,
} from "antd";
import type { ColumnProps, ColumnType } from "antd/es/table";
import {
  EditOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  UserOutlined,
  SearchOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import {
  TimesheetEntry,
  SearchableColumnKey,
} from "../types/timesheet-entry.types";
import { TimesheetActions } from "@components/button/timesheet-actions";
import { TableSearch } from "@components/input-field/table-search";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import {
  DATE_FORMAT,
  DAILY_TARGET_HOURS,
  stringToColor,
  getStatusConfig,
} from "../utils/timesheet-entry.helpers";
import { TableProps } from "antd/lib";

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  selectedRowKeys: any[];
  actionLoading: boolean;
  onPageChange: (page: number, size?: number) => void;
  onRowSelect: (keys: any[]) => void;
  onRowClick: (record: TimesheetEntry) => void;
  onEdit: (record: TimesheetEntry) => void;
  onCopy: (record: TimesheetEntry) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onDelete: () => void;
}

export const TimesheetTable: React.FC<TimesheetTableProps> = ({
  entries,
  loading,
  currentPage,
  pageSize,
  totalItems,
  selectedRowKeys,
  actionLoading,
  onPageChange,
  onRowSelect,
  onRowClick,
  onEdit,
  onCopy,
  onRefresh,
  onAdd,
  onDelete,
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation("translate");
  const i18n = i18next;
  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const getColumnSearchProps = useCallback(
    (
      dataIndex: SearchableColumnKey,
      title: string
    ): Partial<ColumnType<TimesheetEntry>> => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => {
        const value = (selectedKeys[0] as string | undefined) ?? "";
        return (
          <TableSearch
            value={value}
            placeholder={`${t("timesheet_entry_page.search")} ${title}`}
            inputRef={
              searchInputRefs.current[dataIndex]
                ? { current: searchInputRefs.current[dataIndex] }
                : undefined
            }
            onChange={(inputValue) =>
              setSelectedKeys(inputValue ? [inputValue] : [])
            }
            onConfirm={() => confirm()}
            onReset={() => {
              clearFilters?.();
              confirm({ closeDropdown: true });
            }}
          />
        );
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined
          style={{ color: filtered ? token.colorPrimary : undefined }}
        />
      ),
      onFilter: (value: any, record: TimesheetEntry) => {
        const raw = record[dataIndex];
        if (raw === undefined || raw === null) return false;
        if (dataIndex === "date")
          return dayjs(raw).format(DATE_FORMAT).includes(String(value));
        return String(raw).toLowerCase().includes(String(value).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (visible: boolean) => {
          if (visible)
            setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
        },
      },
    }),
    [token.colorPrimary, t]
  );

  const columns = useMemo<any>(
    () => [
      {
        title: t("timesheet_entry_page.table_date"),
        dataIndex: "date",
        width: 100,
        align: "center",
        responsive: ["md"],
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1.2,
              padding: "4px 8px",
              borderRadius: token.borderRadiusSM,
              background: token.colorFillQuaternary, // Soft background
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Typography.Text
              strong
              style={{ fontSize: 18, color: token.colorPrimary }}
            >
              {dayjs(value).format("DD")}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 10, textTransform: "uppercase" }}
            >
              {dayjs(value).format("MMM YY")}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: t("timesheet_entry_page.table_project"),
        dataIndex: "project_name",
        width: 280,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          a.project_name.localeCompare(b.project_name),
        render: (value: string, record: TimesheetEntry) => {
          const avatarColor = stringToColor(value);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Animated Avatar */}
              <div className="relative group">
                <Avatar
                  shape="square"
                  size={42}
                  style={{
                    backgroundColor: `${avatarColor}20`,
                    color: avatarColor,
                    border: `1px solid ${avatarColor}40`,
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: "bold",
                    transition: "all 0.3s ease",
                  }}
                  className="group-hover:scale-110 group-hover:shadow-md"
                >
                  {value ? value.charAt(0).toUpperCase() : <UserOutlined />}
                </Avatar>
                {/* Status Dot (Optional - Example logic) */}
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                  style={{ background: token.colorSuccess }} // Mock status
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Typography.Text
                  strong
                  ellipsis
                  style={{
                    maxWidth: 200,
                    fontSize: 15,
                    color: token.colorTextHeading,
                  }}
                >
                  {value}
                </Typography.Text>
                {record.feature_name ? (
                  <Typography.Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    ellipsis
                  >
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: token.colorFillQuaternary,
                        fontSize: 10,
                      }}
                    >
                      FEATURE
                    </span>
                    {record.feature_name}
                  </Typography.Text>
                ) : (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    -
                  </Typography.Text>
                )}
              </div>
            </div>
          );
        },
        ...getColumnSearchProps(
          "project_name",
          t("timesheet_entry_page.table_project")
        ),
      },
      {
        title: t("timesheet_entry_page.table_status"),
        dataIndex: "status",
        width: 140,
        align: "center",
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          (a.status ?? "").localeCompare(b.status ?? ""),
        render: (value: string) => {
          const config = getStatusConfig(value);
          const option = STATUS_OPTIONS.find((item) => item.value === value);
          const label = option
            ? i18n.language === "th"
              ? option.label_th
              : option.label_en
            : config.text;
          return (
            <Tag
              color={config.color} // Use color from config or map to token if needed
              icon={config.icon}
              style={{
                borderRadius: 20,
                border: "none",
                fontWeight: 600,
                fontSize: 12,
                padding: "4px 12px",
                boxShadow: `0 2px 4px ${config.color}30`, // Add soft shadow based on tag color
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {label}
            </Tag>
          );
        },
      },
      {
        title: t("timesheet_entry_page.table_hours"),
        dataIndex: "hours",
        width: 180,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          Number(a.hours || 0) - Number(b.hours || 0),
        render: (value: number) => {
          const hours = Number(value) || 0;
          const percent = (hours / DAILY_TARGET_HOURS) * 100;
          const safePercent = isNaN(percent) ? 0 : Math.min(percent, 100);
          const statusColor =
            hours > DAILY_TARGET_HOURS
              ? token.colorWarning
              : hours >= DAILY_TARGET_HOURS
              ? token.colorSuccess
              : token.colorPrimary;

          return (
            <div style={{ paddingRight: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 4 }}
                >
                  <Typography.Text
                    strong
                    style={{
                      color: statusColor,
                      fontSize: 16,
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  >
                    {hours.toFixed(2)}
                  </Typography.Text>
                  <span
                    style={{ fontSize: 10, color: token.colorTextTertiary }}
                  >
                    HRS
                  </span>
                </div>

                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Target: {DAILY_TARGET_HOURS}
                </Typography.Text>
              </div>
              <Progress
                percent={safePercent}
                size={["100%", 6]}
                strokeColor={{
                  "0%": token.colorPrimary,
                  "100%": statusColor,
                }}
                showInfo={false}
                trailColor={token.colorFillSecondary}
                strokeLinecap="round"
              />
            </div>
          );
        },
      },

      {
        title: "",
        key: "actions",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_value: any, record: TimesheetEntry) => (
          <Space.Compact
            size="small"
            style={{ opacity: 0.8, transition: "opacity 0.2s" }}
            className="row-actions"
          >
            <Tooltip title={t("timesheet_entry_page.edit_tooltip")}>
              <Button
                type="text"
                size="small"
                icon={
                  <EditOutlined style={{ color: token.colorTextSecondary }} />
                }
                className="hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(record);
                }}
              />
            </Tooltip>
            <Tooltip title={t("timesheet_entry_page.copy_tooltip")}>
              <Button
                type="text"
                size="small"
                icon={
                  <CopyOutlined style={{ color: token.colorTextSecondary }} />
                }
                className="hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(record);
                }}
              />
            </Tooltip>
          </Space.Compact>
        ),
      },
    ],
    [getColumnSearchProps, onEdit, onCopy, i18n.language, token, t]
  );

  const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
    selectedRowKeys,
    onChange: onRowSelect,
    columnWidth: 48,
  };

  return (
    <>
      <style jsx global>{`
        .ant-table-wrapper .ant-table-tbody > tr > td {
          transition: background 0.3s ease;
        }
        .ant-table-wrapper .ant-table-tbody > tr:hover > td {
          background: ${token.colorFillQuaternary} !important;
        }
        .ant-table-wrapper .ant-table-tbody > tr:hover .row-actions {
          opacity: 1 !important;
        }
      `}</style>
      <Card
        variant="outlined"
        style={{
          borderRadius: 20, // More rounded
          boxShadow: token.boxShadowSecondary,
          overflow: "hidden",
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
        }}
        styles={{ body: { padding: 0 } }}
        title={
          <div className="px-2 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorFillQuaternary} 100%)`,
                }}
              >
                <ClockCircleOutlined
                  style={{ color: token.colorPrimary, fontSize: 24 }}
                />
              </div>
              <div>
                <Typography.Title
                  level={4}
                  style={{ margin: 0, fontWeight: 700 }}
                >
                  {t("timesheet_entry_page.table_title")}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {t("timesheet_entry_page.table_subtitle")}
                </Typography.Text>
              </div>
            </div>
            {/* You can add summary stats here if needed */}
          </div>
        }
        extra={
          <div style={{ padding: "0 24px" }}>
            <TimesheetActions
              selectedCount={selectedRowKeys?.length}
              loading={actionLoading}
              refreshLoading={loading}
              onRefresh={onRefresh}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          </div>
        }
      >
        <Table<TimesheetEntry>
          rowKey={(record) => String(record.id)}
          columns={columns}
          dataSource={entries}
          loading={loading}
          rowSelection={rowSelection}
          size="middle"
          pagination={{
            current: currentPage,
            pageSize,
            total: totalItems,
            onChange: (page, size) => onPageChange(page, size),
            showSizeChanger: true,
            size: "default",
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => (
              <span
                style={{
                  color: token.colorTextTertiary,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Showing {range[0]}-{range[1]} of {total} items
              </span>
            ),
            style: { padding: "16px 24px" },
          }}
          scroll={{ x: 900 }}
          onRow={(record) => ({
            onClick: () => onRowClick(record),
            style: { cursor: "pointer" },
            className: "group", // For tailwind hover selectors if used
          })}
        />
      </Card>
    </>
  );
};
