import {
  CheckCircleOutlined,
  CloseOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Space, Table, Tag, Typography, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { usePositionStore } from "../_state/position-store";
import { Position } from "../_types/position-types";

/**
 * ตารางแสดงรายการตำแหน่งงานทั้งหมด
 */
export const PositionTable = () => {
  const { token } = theme.useToken();
  const {
    positions,
    loading,
    setModalMode,
    setSelectedPos,
    setDeleteModalOpen,
    openAutoGen,
  } = usePositionStore();

  const columns: ColumnsType<Position> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (text) => <span className="text-gray-400">#{text}</span>,
    },
    {
      title: "ชื่อตำแหน่ง (TH)",
      dataIndex: "name_th",
      sorter: (a, b) => a.name_th.localeCompare(b.name_th),
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "ชื่อตำแหน่ง (EN)",
      dataIndex: "name_en",
      render: (text) => text || "-",
    },
    {
      title: "ผู้ใช้งาน",
      dataIndex: ["_count", "users"],
      align: "center",
      render: (count) => <Tag color="blue">{count} คน</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "is_active",
      align: "center",
      sorter: (a, b) =>
        a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1,
      render: (active) =>
        active ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            เปิดใช้งาน
          </Tag>
        ) : (
          <Tag color="default" icon={<CloseOutlined />}>
            ปิดใช้งาน
          </Tag>
        ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      render: (_, r) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined className="text-yellow-500" />}
            onClick={() => {
              setSelectedPos(r);
              setModalMode("edit");
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={r._count?.users ? r._count.users > 0 : false}
            onClick={() => {
              setSelectedPos(r);
              setDeleteModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 24 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Space align="center" size={12}>
          <UnorderedListOutlined
            style={{ fontSize: "1rem", color: token.colorPrimary }}
          />
          <Typography.Text strong style={{ fontSize: "1rem" }}>
            รายการตำแหน่งงานทั้งหมด
          </Typography.Text>
        </Space>
        <Space size={12}>
          <Button
            onClick={openAutoGen}
            icon={<CloudServerOutlined />}
            size="large"
            style={{
              backgroundColor: token.colorSuccessBg,
              color: token.colorSuccess,
              borderColor: token.colorSuccessBorder,
            }}
          >
            เทมเพลตตำแหน่งอัตโนมัติ
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setModalMode("create")}
          >
            เพิ่มตำแหน่ง
          </Button>
        </Space>
      </Flex>

      <Table
        columns={columns}
        dataSource={positions}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          style: { marginTop: 24 },
        }}
      />
    </Card>
  );
};
