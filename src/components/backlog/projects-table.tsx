"use client";
//** ตารางแสดง Projects จาก Backlog (ใช้ Skeleton ตอนโหลด)
import React from "react";
import { Card, Skeleton, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { BacklogProject } from "@components/backlog/types";

type Props = {
  loading: boolean;
  data: BacklogProject[];
};

export default function BacklogProjectsTable({ loading, data }: Props) {
  const columns: ColumnsType<BacklogProject> = [
    { title: "ID", dataIndex: "id", key: "id", width: 100 },
    { title: "Key", dataIndex: "projectKey", key: "projectKey", width: 140 },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Archived",
      dataIndex: "archived",
      key: "archived",
      width: 120,
      render: (v?: boolean) => (v ? <Tag color="default">Yes</Tag> : <Tag color="green">No</Tag>),
    },
  ];

  return (
    <Card size="small" title="Backlog Projects" styles={{ body: { padding: 0 } }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 16 }} />
      ) : (
        <Table<BacklogProject>
          columns={columns}
          dataSource={data}
          rowKey={(r) => String(r.id)}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      )}
    </Card>
  );
}

