"use client";
//** ตารางแสดงรายการโปรเจ็กต์จาก Backlog พร้อมกรองและจัดการ
import { SettingOutlined } from "@ant-design/icons";
import type { BacklogProject } from "@components/backlog/types";
import { Button, Card, Skeleton, Table, Tag, theme } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";

type Props = {
  loading: boolean;
  data: BacklogProject[];
  filteredData: BacklogProject[];
  filteredStatus: string[];
  onRowClick: (record: BacklogProject) => void;
  onTableChange: TableProps<BacklogProject>["onChange"];
};

export default function ProjectsTable({
  loading,
  data,
  filteredData,
  filteredStatus,
  onRowClick,
  onTableChange,
}: Props) {
  const { token } = theme.useToken();

  //** กำหนดคอลัมน์ของตาราง
  const columns: ColumnsType<BacklogProject> = [
    {
      title: "คีย์โปรเจ็กต์",
      dataIndex: "projectKey",
      key: "projectKey",
      width: 140,
      sorter: (a, b) => a.projectKey.localeCompare(b.projectKey),
    },
    {
      title: "ชื่อโปรเจ็กต์",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filters:
        data.length > 0
          ? data.map((p) => ({ text: p.name, value: p.name }))
          : undefined,
      filterSearch: true,
      filteredValue: null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes((value as string).toLowerCase()),
    },
    {
      title: "สถานะ",
      dataIndex: "archived",
      key: "archived",
      width: 120,
      filters: [
        { text: "ใช้งาน", value: "active" },
        { text: "ปิดใช้งาน", value: "archived" },
      ],
      filteredValue: filteredStatus,
      onFilter: (value, record) =>
        value === "active" ? !record.archived : !!record.archived,
      render: (archived?: boolean) => {
        const color = archived
          ? token.colorTextDisabled
          : token.colorSuccessText;
        const label = archived ? "ปิดใช้งาน" : "ใช้งาน";
        return (
          <Tag
            style={{
              color,
              background: archived
                ? token.colorBgContainerDisabled
                : token.colorSuccessBg,
              fontWeight: 500,
            }}
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: "จัดการ",
      key: "manage",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<SettingOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(record);
          }}
        />
      ),
    },
  ];

  return (
    <Card size="small" title="รายการโปรเจ็กต์บน Backlog" loading={loading}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 16 }} />
      ) : (
        <Table<BacklogProject>
          columns={columns}
          dataSource={filteredData}
          rowKey={(r) => String(r.id)}
          pagination={{ pageSize: 50, showSizeChanger: true }}
          onRow={(record) => ({
            onClick: () => onRowClick(record),
          })}
          onChange={onTableChange}
          style={{ cursor: "pointer" }}
        />
      )}
    </Card>
  );
}
