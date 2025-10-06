"use client";
import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { FiRefreshCw } from "react-icons/fi";
import { unwrapResult } from "@reduxjs/toolkit";
import { ResponseGetServerStatusV2 } from "@/stores/type";
import { CallAPI as GET_SERVER_STATUS_V2 } from "@/stores/actions/server/call-get-server-status.v2";
import { Table, Card, Button, Modal, Skeleton, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const Page = () => {
  const dispatch = useDispatch<AppDispatch>();
  const GET_SERVER_STATUS_STATE_V2 = useAppSelector(
    (state) => state.callGetServerStatusV2
  );

  const [table, setTable] = useState<
    ResponseGetServerStatusV2["draftValues"]["Array"]
  >([]);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<ResponseGetServerStatusV2["draftValues"]["Array"][number]>();

  useEffect(() => {
    setIsLoading(true);
    dispatch(GET_SERVER_STATUS_V2()).finally(() => {
      setIsLoading(false);
    });
  }, [dispatch]);

  useEffect(() => {
    const response = GET_SERVER_STATUS_STATE_V2?.response?.data?.data;
    setTable(response || []);
  }, [GET_SERVER_STATUS_STATE_V2]);

  const renderResponseTime = useCallback((time: number) => {
    let color = time < 1 ? "green" : time < 2 ? "orange" : "red";
    return <Tag color={color}>{time.toFixed(3)} ms</Tag>;
  }, []);

  const columns: ColumnsType<
    ResponseGetServerStatusV2["draftValues"]["Array"][number]
  > = [
    {
      title: "เซิฟเวอร์",
      dataIndex: "server_name_th",
      key: "server_name_th",
      width: 280,
      sorter: (a, b) => a.server_name_th.localeCompare(b.server_name_th),
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      width: 280,
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: "สถานะเซิฟเวอร์",
      dataIndex: "status",
      key: "status",
      width: 140,
      filters: [
        { text: "Online", value: "Online" },
        { text: "Offline", value: "Offline" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) =>
        status === "Online" ? (
          <Tag color="green">Online</Tag>
        ) : (
          <Tag color="red">Offline</Tag>
        ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "ตรวจสอบล่าสุดเมื่อ",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      sorter: (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: "เวลาตอบสนอง (ms)",
      dataIndex: "response_time",
      key: "response_time",
      width: 160,
      sorter: (a, b) => a.response_time - b.response_time,
      render: renderResponseTime,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 240,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: "ENDPOINT",
      dataIndex: "endpoint",
      key: "endpoint",
      width: 120,
      render: (endpoint: string) => (
        <code
          style={{
            display: "inline-block",
            maxWidth: 100,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {endpoint}
        </code>
      ),
    },
    {
      title: "RESPONSE",
      key: "response",
      width: 120,
      render: (_text, record) => (
        <Button
          type="primary"
          onClick={() => {
            setSelectedRow(record);
            setModalVisible(true);
          }}
        >
          Response
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Card
        title="ทดสอบสถานะเซิฟเวอร์อีกครั้ง"
        className="mb-4"
        extra={
          <Button
            type="primary"
            icon={<FiRefreshCw />}
            onClick={() => {
              setIsLoading(true);
              dispatch(GET_SERVER_STATUS_V2()).finally(() => {
                setIsLoading(false);
              });
            }}
          >
            รีเฟรช
          </Button>
        }
      >
        <p className="text-sm text-red-500"></p>
      </Card>

      <Card title="ตารางรายงานการทำงานทุกระบบ" className="w-full">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={table}
            rowKey={(record) => record.server_name_th + record.timestamp}
            pagination={{
              pageSize: rowsPerPage,
              defaultPageSize: 20,
              showSizeChanger: true,
              onChange: setRowsPerPage,
            }}
          />
        )}
      </Card>

      <Modal
        title="รายละเอียดเซิร์ฟเวอร์"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            ปิด
          </Button>,
        ]}
        width={800}
        destroyOnHidden
      >
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm">
          {selectedRow ? JSON.stringify(selectedRow, null, 2) : ""}
        </pre>
      </Modal>
    </DashboardLayout>
  );
};

export default Page;
