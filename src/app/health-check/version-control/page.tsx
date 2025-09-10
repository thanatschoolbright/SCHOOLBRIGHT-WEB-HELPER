"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { FiRefreshCw } from "react-icons/fi";
import { ResponseVersionControl } from "@/stores/type";
import { CallAPI as GET_VERSION_CONTROL } from "@/stores/actions/health-check/version-control/action";
import { convertTimeZoneToThai } from "@/helpers/convert-time-zone-to-thai";

// Ant Design
import { Table, Tag, Button, Modal, Space, Card, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const GET_VERSION_CONTROL_STATE = useAppSelector(
    (state) => state.callVersionControlReducer
  );

  const isLoading = [
    SCHOOL_LIST_STATE.loading,
    GET_VERSION_CONTROL_STATE.loading,
  ].some(Boolean);

  const [table, setTable] = useState<ResponseVersionControl["data"]["data"]>(
    []
  );
  const [modal, setModal] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] =
    useState<ResponseVersionControl["data"]["data"][number]>();

  useEffect(() => {
    dispatch(GET_VERSION_CONTROL());
  }, []);

  useEffect(() => {
    const response = GET_VERSION_CONTROL_STATE?.response?.data?.data ?? [];
    setTable(response);
  }, [GET_VERSION_CONTROL_STATE]);

  // กำหนด Columns ของ AntD Table
  const columns: ColumnsType<ResponseVersionControl["data"]["data"][number]> = [
    {
      title: "ลำดับ",
      render: (_, __, index) => index + 1,
    },
    {
      title: "ชื่อระบบ",
      dataIndex: "system",
      key: "system",
      sorter: (a, b) => a.system.localeCompare(b.system),
      render: (data: string) => {
        return <Typography>{String(data.toUpperCase())}</Typography>;
      },
    },
    {
      title: "สภาพแวดล้อม",
      dataIndex: "environment",
      key: "environment",
      filters: [
        { text: "production", value: "production" },
        { text: "staging", value: "staging" },
        { text: "beta", value: "beta" },
      ],
      onFilter: (value: any, record: any) => record.environment === value,
      render: (env: string) => {
        let color: string = "blue";
        if (env === "production") color = "green";
        else if (env === "staging" || env === "beta") color = "orange";
        return <Tag color={color}>{env}</Tag>;
      },
    },
    {
      title: "เวอร์ชัน",
      dataIndex: "version",
      key: "version",
      render: (version: string | null) =>
        version ? (
          <Tag color="purple">{version}</Tag>
        ) : (
          <Tag color="default">no version</Tag>
        ),
    },
    {
      title: "อัปเดตล่าสุด",
      dataIndex: "updated_at",
      key: "updated_at",
      sorter: (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      render: (date: string) => convertTimeZoneToThai(new Date(date)),
    },
    {
      title: "กระทำ",
      key: "action",
      render: (_, row) => (
        <Space>
          <Button
            type="default"
            size="small"
            onClick={() => {
              setModal(true);
              setSelectedRow(row);
            }}
          >
            ดูรายละเอียด
          </Button>
        </Space>
      ),
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
              dispatch(GET_VERSION_CONTROL());
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
            rowKey={(record: any) => `${record.system}-${record.environment}`}
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
