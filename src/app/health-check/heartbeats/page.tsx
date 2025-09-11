"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { ReloadOutlined } from "@ant-design/icons";

import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { FiRefreshCw } from "react-icons/fi";
import { ResponseHeartbeats } from "@/stores/type";
import { CallAPI as GET_HEARTBEATS } from "@/stores/actions/health-check/heartbeats/action";

// Ant Design
import { Table, Tag, Button, Modal, Space, Card, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

// Corrected the type definition to be the array of data objects
type ApiTableData = ResponseHeartbeats["data"]["data"][number];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();

  const HEARTBEAT_STATE = useAppSelector((state) => state.heartbeatReducer);

  const isLoading = [HEARTBEAT_STATE.loading].some(Boolean);

  // Corrected the type of the 'table' state to be a single array
  const [table, setTable] = useState<ApiTableData[]>([]);
  const [modal, setModal] = useState<boolean>(false);
  // Corrected the type of 'selectedRow' to be a valid object type
  const [selectedRow, setSelectedRow] = useState<ApiTableData | null>(null);

  const formatInterval = (minute: number) => {
    const seconds = minute * 60;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = "";
    if (hours > 0) result += `${hours} ชั่วโมง `;
    if (minutes > 0) result += `${minutes} นาที`;
    return result.trim() || "0 นาที";
  };

  useEffect(() => {
    dispatch(GET_HEARTBEATS());
  }, []);

  useEffect(() => {
    // Corrected this line: We need the 'data' array from the response object.
    const response = HEARTBEAT_STATE?.response?.data?.data ?? [];
    console.log("RESPONSE", response);
    // Added a check to ensure the response is an array before setting the state
    if (Array.isArray(response)) {
      setTable(response);
    }
  }, [HEARTBEAT_STATE]);

  const columns: ColumnsType<ApiTableData> = [
    {
      title: "ลำดับ",
      render: (_, __, index) => (
        <Typography.Text strong>{index + 1}</Typography.Text>
      ),
      width: 80,
      align: "center",
    },
    {
      title: "ชื่อของบอท",
      dataIndex: "JobName",
      key: "JobName",
      render: (text) => <Typography.Text copyable>{text}</Typography.Text>,
      sorter: (a, b) => a.JobName.localeCompare(b.JobName),
      width: 300
    },
     {
      title: "รายละเอียด",
      dataIndex: "Remarks",
      key: "Remarks",
      render: (text) => <Typography.Text >{text}</Typography.Text>,
      sorter: (a, b) => a.Remarks.localeCompare(b.Remarks),
      
    },
    {
      title: "ทำงานทุก (ชั่วโมง/นาที)",
      dataIndex: "Interval",
      key: "Interval",
      render: (interval) => (
        <Tag color="blue" icon={<ReloadOutlined />}>
          {formatInterval(interval)}
        </Tag>
      ),
      sorter: (a, b) => a.Interval - b.Interval,
      align: "center",
      width: 300,
    },
    {
      title: "สถานะ",
      dataIndex: "Status",
      key: "Status",
      render: (status: string) => {
        const isOnline = status === "Online";
        return (
          <Tag color={isOnline ? "green" : "red"}>
            {isOnline ? "✅ Online" : "🔴 Offline"}
          </Tag>
        );
      },
      filters: [
        { text: "Online", value: "Online" },
        { text: "Offline", value: "Offline" },
      ],
      onFilter: (value, record) => record.Status.indexOf(value as string) === 0,
    },
    {
      title: "บอททำงานล่าสุดเมื่อเวลา",
      dataIndex: "LastUpdatedTime",
      key: "LastUpdatedTime",
      render: (time: string) => {
        const date = new Date(time);
        return (
          <Typography.Text>
            {date.toLocaleString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </Typography.Text>
        );
      },
      sorter: (a, b) =>
        new Date(a.LastUpdatedTime).getTime() -
        new Date(b.LastUpdatedTime).getTime(),
    },
  ];

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      {/* Modal แสดงรายละเอียด */}
      <Modal
        title="รายละเอียดเซิร์ฟเวอร์"
        open={modal}
        onCancel={() => setModal(false)}
        footer={null}
      >
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(selectedRow, null, 2)}
        </pre>
      </Modal>

      <div className="w-full space-y-4">
        {/* ปุ่มรีเฟรช */}
        <Card title="ทดสอบสถานะเซิฟเวอร์อีกครั้ง">
          <Button
            color="primary"
            variant="outlined"
            icon={<FiRefreshCw />}
            onClick={() => {
              dispatch(GET_HEARTBEATS());
              toast.success("รีเฟรชสำเร็จ", {
                duration: 3000,
                position: "top-right",
              });
            }}
          >
            รีเฟรช
          </Button>
        </Card>

        {/* ตาราง AntD */}
        <Card title="เช็กเวอร์ชันทุกระบบ">
          <Table
            columns={columns}
            dataSource={table}
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            size="middle"
            rowKey={(record: ApiTableData) =>
              `${record.JobName}-${record.Interval}`
            }
            style={{
              background: "white",
              borderRadius: 14,
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
