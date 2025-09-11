"use client";

import React, { useState } from "react";
import { Table, Button, Tag, Input, Space } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";

interface UserData {
  key: string;
  name: string;
  age: number;
  address: string;
  status: "active" | "inactive";
}

const initialData: UserData[] = [
  {
    key: "1",
    name: "Mike",
    age: 32,
    address: "10 Downing Street",
    status: "active",
  },
  {
    key: "2",
    name: "John",
    age: 42,
    address: "White House",
    status: "inactive",
  },
  {
    key: "3",
    name: "Sarah",
    age: 28,
    address: "Silicon Valley",
    status: "active",
  },
];

/* 🎯 Template Table พร้อม Filter + Sort + Action */
const Home: React.FC = () => {
  const [data, setData] = useState<UserData[]>(initialData);

  const handleDelete = (key: string) => {
    setData((prev) => prev.filter((item) => item.key !== key));
  };

  const columns: ColumnsType<UserData> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filterSearch: true,
      filters: [
        { text: "Mike", value: "Mike" },
        { text: "John", value: "John" },
        { text: "Sarah", value: "Sarah" },
      ],
      onFilter: (value, record) => record.name.includes(value as string),
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) =>
        status === "active" ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            icon={<EditOutlined />}
            size="small"
            onClick={() => alert(`Edit ${record.name}`)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.key)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">📊 User Management</h1>
        <Button type="primary">+ Add User</Button>
      </div>

      <Table<UserData>
        bordered
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 5 }}
        rowKey="key"
      />
    </div>
  );
};

export default Home;
