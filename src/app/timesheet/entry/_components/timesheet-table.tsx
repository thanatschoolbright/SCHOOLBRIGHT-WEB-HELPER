"use client";

import {
  ApartmentOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { TimesheetActions } from "@components/button/timesheet-actions";
import { TableSearch } from "@components/input-field/table-search";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import {
  Button,
  Card,
  Checkbox,
  Flex,
  InputRef,
  Popover,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { ColumnType } from "antd/lib/table";
import dayjs from "dayjs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  SearchableColumnKey,
  TimesheetEntry,
} from "../types/timesheet-entry.types";
import { DATE_FORMAT } from "../utils/timesheet-entry.helpers";

interface TimesheetTableProps {
  /** ข้อมูล Timesheet ทั้งหมด */
  entries: TimesheetEntry[];
  /** สถานะการโหลดข้อมูล */
  loading: boolean;
  /** หน้าปัจจุบัน */
  currentPage: number;
  /** จำนวนรายการต่อหน้า */
  pageSize: number;
  /** จำนวนรายการทั้งหมด */
  totalItems: number;
  /** สถานะการโหลดขณะทำ Action (Submit/Delete) */
  actionLoading: boolean;
  /** ฟังก์ชันเมื่อมีการเปลี่ยนหน้า */
  onPageChange: (page: number, size?: number) => void;
  /** ฟังก์ชันเมื่อคลิกที่แถว */
  onRowClick: (record: TimesheetEntry) => void;
  /** ฟังก์ชันเมื่อคลิกปุ่มแก้ไข */
  onEdit: (record: TimesheetEntry) => void;
  /** ฟังก์ชันเมื่อคลิกปุ่มคัดลอก */
  onCopy: (record: TimesheetEntry) => void;
  /** ฟังก์ชันเมื่อคลิกปุ่มลบ */
  onDeleteSingle: (record: TimesheetEntry) => void;
  /** ฟังก์ชันเมื่อคลิกปุ่ม Refresh */
  onRefresh: () => void;
  /** ฟังก์ชันเมื่อคลิกปุ่มเพิ่มรายการ */
  onAdd: () => void;
}

/**
 * Component ตารางแสดงรายการ Timesheet (Modular Version)
 */
export const TimesheetTable: React.FC<TimesheetTableProps> = ({
  entries,
  loading,
  currentPage,
  pageSize,
  totalItems,
  actionLoading,
  onPageChange,
  onRowClick,
  onEdit,
  onCopy,
  onDeleteSingle,
  onRefresh,
  onAdd,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  // กำหนดคอลัมน์ทั้งหมดที่สามารถแสดงผลได้
  const ALL_TIMESHEET_COLUMNS = useMemo(
    () => [
      { key: "date", label: t("timesheet_entry_page.table_date", "วันที่") },
      {
        key: "project_name",
        label: t("timesheet_entry_page.project_and_task", "โครงการ / งาน"),
      },
      { key: "status", label: t("timesheet_entry_page.table_status", "สถานะ") },
      {
        key: "description",
        label: t("timesheet_entry_page.table_description", "รายละเอียด"),
      },
      { key: "hours", label: t("timesheet_entry_page.table_hours", "เวลา") },
      {
        key: "actions",
        label: t("timesheet_entry_page.table_actions", "จัดการ"),
      },
    ],
    [t],
  );

  // การจัดการคอลัมน์ที่ต้องการแสดงผล (Persist ผ่าน localStorage)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timesheet-visible-columns");
      return saved
        ? JSON.parse(saved)
        : ["date", "project_name", "status", "description", "hours", "actions"];
    }
    return [
      "date",
      "project_name",
      "status",
      "description",
      "hours",
      "actions",
    ];
  });

  useEffect(() => {
    localStorage.setItem(
      "timesheet-visible-columns",
      JSON.stringify(visibleColumns),
    );
  }, [visibleColumns]);

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  // ฟังก์ชันช่วยสร้าง Props สำหรับการค้นหาในคอลัมน์
  const getColumnSearchProps = useCallback(
    (
      dataIndex: SearchableColumnKey,
      title: string,
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
            placeholder={
              t("timesheet_entry_page.search_placeholder", "ค้นหา") +
              ` ${title}`
            }
            inputRef={
              searchInputRefs.current[dataIndex]
                ? { current: searchInputRefs.current[dataIndex] }
                : undefined
            }
            onChange={(v) => setSelectedKeys(v ? [v] : [])}
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
    [token.colorPrimary, t],
  );

  // กำหนดรายละเอียดคอลัมน์หลัก
  const columns = useMemo<any>(
    () => [
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.table_date", "วันที่")}
          </Typography.Text>
        ),
        dataIndex: "date",
        width: 120,
        align: "center",
        responsive: ["md"],
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => (
          <Typography.Text style={{ fontSize: 13 }}>
            {dayjs(value).format("DD/MM/YYYY")}
          </Typography.Text>
        ),
      },
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.project_and_task", "โครงการ / งาน")}
          </Typography.Text>
        ),
        dataIndex: "project_name",
        width: 350,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          a.project_name.localeCompare(b.project_name),
        ...getColumnSearchProps(
          "project_name",
          t("timesheet_entry_page.table_project", "โครงการ"),
        ),
        render: (value: string, record: TimesheetEntry) => (
          <Flex vertical gap={4} style={{ padding: "4px 0" }}>
            <Flex align="center" gap={8} wrap="wrap">
              <Typography.Text strong style={{ fontSize: 15 }}>
                {value}
              </Typography.Text>
              {record.category_type && (
                <Tag
                  bordered={false}
                  color={
                    record.category_type === "EXTERNAL"
                      ? "success"
                      : "processing"
                  }
                  style={{ fontSize: 10, margin: 0, borderRadius: 4 }}
                >
                  {record.category_type}
                </Tag>
              )}
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <Space size={4}>
                <ApartmentOutlined />
                {record.feature_name || "General Task"}
              </Space>
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.table_status", "สถานะ")}
          </Typography.Text>
        ),
        dataIndex: "status",
        width: 150,
        align: "center",
        render: (value: string) => {
          const label =
            STATUS_OPTIONS.find((s) => s.value === value)?.label_th || value;

          const statusMap: Record<string, string> = {
            IN_PROGRESS: "processing",
            DONE: "success",
            APPROVED: "cyan",
            REJECTED: "error",
            DRAFT: "default",
          };

          return (
            <Tag
              bordered={false}
              color={statusMap[value] || "warning"}
              style={{
                borderRadius: 12,
                paddingInline: 12,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {label}
            </Tag>
          );
        },
      },
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.table_description", "รายละเอียด")}
          </Typography.Text>
        ),
        dataIndex: "description",
        width: 300,
        render: (value: string) => (
          <Tooltip title={value} placement="topLeft">
            <Typography.Text
              type="secondary"
              italic
              ellipsis
              style={{ fontSize: 13, display: "block", maxWidth: "100%" }}
            >
              {value ||
                t(
                  "timesheet_entry_page.no_description",
                  "ไม่มีรายละเอียดระบุไว้",
                )}
            </Typography.Text>
          </Tooltip>
        ),
      },
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.table_hours", "เวลา")}
          </Typography.Text>
        ),
        dataIndex: "hours",
        width: 120,
        align: "right",
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          Number(a.hours || 0) - Number(b.hours || 0),
        render: (value: number) => {
          const hours = Number(value) || 0;
          return (
            <Space align="baseline" size={4}>
              <Typography.Text
                strong
                style={{
                  fontSize: 20,
                  color:
                    hours >= 8 ? token.colorSuccess : token.colorTextHeading,
                }}
              >
                {hours.toFixed(1)}
              </Typography.Text>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {t("timesheet_entry_page.hrs", "ชม.")}
              </Typography.Text>
            </Space>
          );
        },
      },
      {
        key: "actions",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_text: string, r: TimesheetEntry) => {
          const entryDate = dayjs(r.date);
          const diffDays = dayjs().diff(entryDate, "day");
          const canEdit = diffDays <= 7;

          return (
            <Space>
              <Tooltip
                title={
                  canEdit
                    ? t("edit", "แก้ไข")
                    : t(
                        "cannot_edit_policy",
                        "ไม่สามารถแก้ไขได้เนื่องจากรายลงเวลา เกิน 7 วัน",
                      )
                }
              >
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  disabled={!canEdit}
                  icon={
                    <EditOutlined
                      style={{
                        color: canEdit
                          ? token.colorWarning
                          : token.colorTextDisabled,
                      }}
                    />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canEdit) onEdit(r);
                  }}
                />
              </Tooltip>
              <Tooltip title={t("copy", "คัดลอก")}>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(r);
                  }}
                />
              </Tooltip>
              <Tooltip
                title={
                  canEdit
                    ? t("delete", "ลบ")
                    : t(
                        "cannot_delete_policy",
                        "ไม่สามารถลบได้เนื่องจากรายลงเวลา เกิน 7 วัน",
                      )
                }
              >
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  disabled={!canEdit}
                  icon={
                    <DeleteOutlined
                      style={{
                        color: canEdit
                          ? token.colorError
                          : token.colorTextDisabled,
                      }}
                    />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canEdit) onDeleteSingle(r);
                  }}
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [onEdit, onCopy, onDeleteSingle, getColumnSearchProps, token, t],
  );

  const filteredColumns = useMemo(
    () =>
      columns.filter(
        (col: any) =>
          visibleColumns.includes(col.dataIndex as string) ||
          visibleColumns.includes(col.key as string),
      ),
    [columns, visibleColumns],
  );

  return (
    <Card
      title={
        <Flex align="center" gap={20} style={{ padding: "12px 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: token.colorPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 6px 16px ${token.colorPrimary}40`,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <Flex vertical gap={4}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {t("timesheet_entry_page.timesheet_log")}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {t("timesheet_entry_page.manage_and_check_timesheet")}
            </Typography.Text>
          </Flex>
        </Flex>
      }
      extra={
        <Space size={24}>
          <Popover
            content={
              <Flex vertical gap={12} style={{ minWidth: 200, padding: 4 }}>
                <Flex
                  justify="space-between"
                  align="center"
                  style={{
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    paddingBottom: 8,
                  }}
                >
                  <Typography.Text strong>
                    {t("columnSetting", "ตั้งค่าคอลัมน์")}
                  </Typography.Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined style={{ fontSize: 12 }} />}
                    onClick={() => {
                      setVisibleColumns(
                        ALL_TIMESHEET_COLUMNS.map((c) => c.key),
                      );
                    }}
                  />
                </Flex>
                <Checkbox.Group
                  value={visibleColumns}
                  onChange={(checkedValues) => {
                    setVisibleColumns(checkedValues as string[]);
                  }}
                  style={{ width: "100%" }}
                >
                  <Flex vertical gap={10}>
                    {ALL_TIMESHEET_COLUMNS.map((col) => (
                      <Checkbox key={col.key} value={col.key}>
                        <Typography.Text style={{ fontSize: 13 }}>
                          {col.label}
                        </Typography.Text>
                      </Checkbox>
                    ))}
                  </Flex>
                </Checkbox.Group>
              </Flex>
            }
            trigger="click"
            placement="bottomRight"
          >
            <Tooltip title={t("columnSetting", "ตั้งค่าคอลัมน์")}>
              <Button
                icon={<SettingOutlined />}
                size="large"
                style={{
                  borderRadius: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              />
            </Tooltip>
          </Popover>
          <TimesheetActions
            loading={actionLoading}
            refreshLoading={loading}
            onRefresh={onRefresh}
            onAdd={onAdd}
          />
        </Space>
      }
      style={{
        margin: "24px 0",
        borderRadius: 24,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        background: token.colorBgContainer,
      }}
    >
      <div style={{ padding: token.paddingLG }}>
        <Table<TimesheetEntry>
          rowKey={(r) => String(r.id)}
          columns={filteredColumns}
          dataSource={entries}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalItems,
            onChange: onPageChange,
            showSizeChanger: true,
            position: ["bottomCenter"],
          }}
          onRow={(r) => ({
            onClick: () => {
              onRowClick(r);
            },
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </Card>
  );
};
