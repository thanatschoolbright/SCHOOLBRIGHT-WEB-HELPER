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
} from "antd";
import type { ColumnsType as AntColumnsType, TableProps, InputRef } from "antd";
import type { ColumnType } from "antd/es/table";
import {
  EditOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  UserOutlined,
  SearchOutlined,
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

  const columns = useMemo<AntColumnsType<TimesheetEntry>>(
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
            }}
          >
            <Typography.Text strong style={{ fontSize: 16 }}>
              {dayjs(value).format("DD")}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar
                shape="square"
                size={38}
                style={{
                  backgroundColor: `${avatarColor}20`,
                  color: avatarColor,
                  border: `1px solid ${avatarColor}40`,
                  borderRadius: 8,
                }}
              >
                {value ? value.charAt(0).toUpperCase() : <UserOutlined />}
              </Avatar>
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
                  style={{ maxWidth: 200, fontSize: 14 }}
                >
                  {value}
                </Typography.Text>
                {record.feature_name ? (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                    ellipsis
                  >
                    <ProjectOutlined style={{ fontSize: 10, marginRight: 4 }} />
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
        width: 130,
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
              color={config.color}
              icon={config.icon}
              style={{
                borderRadius: 12,
                border: "none",
                fontWeight: 600,
                fontSize: 11,
                padding: "2px 8px",
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
        width: 160,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          Number(a.hours) - Number(b.hours),
        render: (value: number) => {
          const percent = (value / DAILY_TARGET_HOURS) * 100;
          const statusColor =
            value > DAILY_TARGET_HOURS
              ? token.colorWarning
              : value >= DAILY_TARGET_HOURS
              ? token.colorSuccess
              : token.colorPrimary;
          return (
            <div style={{ paddingRight: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Typography.Text
                  strong
                  style={{ color: statusColor, fontSize: 13 }}
                >
                  {Number(value).toFixed(2)}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  / {DAILY_TARGET_HOURS} {t("timesheet_entry_page.hours_unit")}
                </Typography.Text>
              </div>
              <Progress
                percent={percent > 100 ? 100 : percent}
                steps={8}
                size={["100%", 4]}
                strokeColor={statusColor}
                showInfo={false}
                trailColor={token.colorFillSecondary}
              />
            </div>
          );
        },
      },
      {
        title: t("timesheet_entry_page.table_description"),
        dataIndex: "description",
        ellipsis: true,
        responsive: ["lg"],
        render: (value: string | null) => (
          <Typography.Text
            type="secondary"
            ellipsis
            style={{ maxWidth: 200, fontSize: 13 }}
          >
            {value || "-"}
          </Typography.Text>
        ),
      },
      {
        title: "",
        key: "actions",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_value: any, record: TimesheetEntry) => (
          <Space.Compact size="small">
            <Tooltip title={t("timesheet_entry_page.edit_tooltip")}>
              <Button
                type="text"
                size="small"
                icon={
                  <EditOutlined style={{ color: token.colorTextSecondary }} />
                }
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
    columnWidth: 40,
  };

  return (
    <Card
      variant="outlined"
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      styles={{ body: { padding: 0 } }}
      title={
        <div className="p-4 flex items-center my-3">
          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mb-2">
            <ClockCircleOutlined
              style={{ color: token.colorPrimary, fontSize: 18 }}
            />
          </div>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t("timesheet_entry_page.table_title")}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("timesheet_entry_page.table_subtitle")}
            </Typography.Text>
          </div>
        </div>
      }
      extra={
        <div style={{ padding: "20px 24px 0" }}>
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
      <div className="p-6">
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
            size: "small",
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => (
              <span style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                {range[0]}-{range[1]} / {total}
              </span>
            ),
            style: { padding: "12px 24px" },
          }}
          scroll={{ x: 800 }}
          onRow={(record) => ({
            onClick: () => onRowClick(record),
            style: { cursor: "pointer" },
          })}
          style={{ marginTop: 8 }}
        />
      </div>
    </Card>
  );
};
