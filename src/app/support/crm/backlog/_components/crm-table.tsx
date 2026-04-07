"use client";

import { StatusModalComponent } from "@/components/modal/status-modal-component";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Flex,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React from "react";
import type { CrmItem } from "../_api/crm-api";
import { useCrmStore } from "../_state/crm-store";

dayjs.extend(buddhistEra);
dayjs.locale("th");

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  OPEN: "gold",
  IN_PROGRESS: "blue",
  RESOLVED: "green",
  CLOSED: "default",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "รอดำเนินการ",
  IN_PROGRESS: "กำลังดำเนินการ",
  RESOLVED: "แก้ไขแล้ว",
  CLOSED: "ปิดเคส",
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "red",
  HIGH: "volcano",
  MEDIUM: "orange",
  LOW: "green",
};

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: "สูงมาก",
  HIGH: "สูง",
  MEDIUM: "ปานกลาง",
  LOW: "ต่ำ",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export const CrmTable: React.FC = () => {
  const { token } = theme.useToken();
  const {
    items,
    pagination,
    isLoading,
    isSubmitting,
    setPage,
    openDrawer,
    deleteCase,
    updateStatusInline,
  } = useCrmStore();

  const [deleteTarget, setDeleteTarget] = React.useState<CrmItem | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCase(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnsType<CrmItem> = [
    {
      title: "รหัส",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a, b) => a.id - b.id,
      render: (val: number) => (
        <Text style={{ fontWeight: 600, color: token.colorPrimary }}>
          #{val}
        </Text>
      ),
    },
    {
      title: "หัวข้อเคส",
      dataIndex: "subject",
      key: "subject",
      sorter: (a, b) => (a.subject ?? "").localeCompare(b.subject ?? ""),
      render: (val: string, record) => (
        <Flex vertical gap={2}>
          <Text style={{ fontWeight: 600 }}>{val}</Text>
          {record.ref_code && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              รหัสอ้างอิง: {record.ref_code}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: "ช่องทาง",
      dataIndex: "channel",
      key: "channel",
      width: 110,
      sorter: (a, b) => (a.channel ?? "").localeCompare(b.channel ?? ""),
      render: (val: string) => val ?? "-",
    },
    {
      title: "ระดับความสำคัญ",
      dataIndex: "priority",
      key: "priority",
      width: 130,
      sorter: (a, b) => (a.priority ?? "").localeCompare(b.priority ?? ""),
      render: (val: string) =>
        val ? (
          <Tag color={PRIORITY_COLOR[val] ?? "default"}>
            {PRIORITY_LABEL[val] ?? val}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 170,
      sorter: (a, b) => (a.status ?? "").localeCompare(b.status ?? ""),
      render: (val: string, record) => (
        <Select
          value={val}
          options={STATUS_OPTIONS}
          style={{ width: "100%" }}
          onChange={(newStatus) => updateStatusInline(record.id, newStatus)}
          variant="borderless"
          labelRender={({ value }) => (
            <Badge
              color={STATUS_COLOR[value as string] ?? "default"}
              text={STATUS_LABEL[value as string] ?? value}
            />
          )}
        />
      ),
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (val: string) =>
        val ? dayjs(val).locale("th").format("DD MMM BBBB") : "-",
    },
    {
      title: "วันครบกำหนด",
      dataIndex: "due_date",
      key: "due_date",
      width: 130,
      sorter: (a, b) =>
        dayjs(a.due_date ?? "").unix() - dayjs(b.due_date ?? "").unix(),
      render: (val: string) => {
        if (!val) return "-";
        const isOverdue = dayjs(val).isBefore(dayjs(), "day");
        return (
          <Text type={isOverdue ? "danger" : undefined}>
            {dayjs(val).locale("th").format("DD MMM BBBB")}
          </Text>
        );
      },
    },
    {
      title: "ผู้สร้าง",
      key: "creator",
      width: 120,
      render: (_: unknown, record) =>
        record.creator
          ? `${record.creator.firstname_th ?? ""} ${
              record.creator.lastname_th ?? ""
            }`.trim() || "-"
          : "-",
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 90,
      fixed: "right",
      render: (_: unknown, record) => (
        <Flex gap={4}>
          <Tooltip title="แก้ไข">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openDrawer(record)}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleteTarget(record)}
            />
          </Tooltip>
        </Flex>
      ),
    },
  ];

  return (
    <>
      <Card
        styles={{ body: { padding: 16 } }}
        style={{ border: `1px solid ${token.colorBorderSecondary}` }}
      >
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 16 }}
        >
          <Flex align="center" gap={8}>
            <UnorderedListOutlined style={{ fontSize: "1rem" }} />
            <Text style={{ fontWeight: 600, fontSize: "1rem" }}>
              รายการเคส CRM
            </Text>
          </Flex>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openDrawer()}
          >
            เพิ่มเคสใหม่
          </Button>
        </Flex>

        <Table<CrmItem>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={isLoading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.page_size,
            total: pagination.total,
            showSizeChanger: false,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            onChange: (page) => setPage(page),
          }}
        />
      </Card>

      <StatusModalComponent
        open={!!deleteTarget}
        type="delete"
        title="ยืนยันการลบเคส"
        message={`คุณต้องการลบเคส #${deleteTarget?.id} "${deleteTarget?.subject}" ใช่หรือไม่`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isSubmitting}
      />
    </>
  );
};
