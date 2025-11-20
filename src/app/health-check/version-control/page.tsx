"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
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
import {
  Table,
  Tag,
  Button,
  Modal,
  Space,
  Card,
  Typography,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CopyOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

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
      render: (system: string, record) => (
        <Tooltip title={record.repo || ""}>
          <Typography.Text strong>{system.toUpperCase()}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: "สภาพแวดล้อม",
      dataIndex: "environment",
      key: "environment",
      filters: [
        { text: "production", value: "production" },
        { text: "staging", value: "staging" },
        { text: "beta", value: "beta" },
        { text: "development", value: "development" },
      ],
      onFilter: (value: any, record: any) => record.environment === value,
      render: (env: string) => {
        let color: string = "blue";
        if (env === "production") color = "green";
        else if (env === "staging" || env === "beta") color = "orange";
        else if (env === "development") color = "blue";
        return <Tag color={color}>{env}</Tag>;
      },
    },
    {
      title: "สาขา (Branch)",
      dataIndex: "branch",
      key: "branch",
      render: (branch: string) => (
        <Typography.Text copyable={{ text: branch }} code>
          {branch}
        </Typography.Text>
      ),
    },
    {
      title: "เวอร์ชัน",
      dataIndex: "version",
      key: "version",
      render: (version: string | null) =>
        version ? (
          <Tag color="purple">{version}</Tag>
        ) : (
          <Tag color="default">No version</Tag>
        ),
    },
    {
      title: "Build",
      dataIndex: "build",
      key: "build",
      render: (build: string) => (
        <Tag color="geekblue" style={{ userSelect: "all" }}>
          <Typography.Text copyable={{ text: build }}>{build}</Typography.Text>
        </Tag>
      ),
    },
    {
      title: "อัปเดตล่าสุด",
      dataIndex: "updated_at",
      key: "updated_at",
      sorter: (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      render: (date: string) => (
        <Space>
          <ClockCircleOutlined />
          {dayjs(date).format("DD/MM/YYYY HH:mm")}
        </Space>
      ),
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => (
        <Tooltip title={desc}>
          <Typography.Text ellipsis style={{ maxWidth: 200 }}>
            {desc}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: "ผู้ปรับใช้",
      dataIndex: "deployed_by",
      key: "deployed_by",
      render: (deployed_by: string) => <Tag color="cyan">{deployed_by}</Tag>,
    },
    {
      title: "กระทำ",
      key: "action",
      render: (_, row) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setModal(true);
            setSelectedRow(row);
          }}
        >
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <HeaderBar title="Version Control" subTitle="สถานะเวอร์ชันของระบบ" icon={<CopyOutlined />} color="none" />
      {isLoading && <BaseLoadingComponent />}

      {/* Modal แสดงรายละเอียด */}
      <Modal
        title="รายละเอียด Deployment"
        open={modal}
        onCancel={() => setModal(false)}
        footer={null}
      >
        {selectedRow && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Title level={5}>ชื่อระบบ</Typography.Title>
            <Typography.Text>
              {selectedRow.system.toUpperCase()}
            </Typography.Text>

            <Typography.Title level={5}>Repository</Typography.Title>
            <Typography.Text>{selectedRow.repo || "-"}</Typography.Text>

            <Typography.Title level={5}>สภาพแวดล้อม</Typography.Title>
            <Tag
              color={
                selectedRow.environment === "production"
                  ? "green"
                  : selectedRow.environment === "staging" ||
                    selectedRow.environment === "beta" ||
                    selectedRow.environment === "development"
                  ? "orange"
                  : "blue"
              }
            >
              {selectedRow.environment}
            </Tag>

            <Typography.Title level={5}>สาขา (Branch)</Typography.Title>
            <Typography.Text code copyable={{ text: selectedRow.branch }}>
              {selectedRow.branch}
            </Typography.Text>

            <Typography.Title level={5}>เวอร์ชัน</Typography.Title>
            {selectedRow.version ? (
              <Tag color="purple">{selectedRow.version}</Tag>
            ) : (
              <Tag color="default">No version</Tag>
            )}

            <Typography.Title level={5}>Build</Typography.Title>
            <Tag color="geekblue">
              <Typography.Text copyable={{ text: selectedRow.build }}>
                {selectedRow.build}
              </Typography.Text>
            </Tag>

            <Typography.Title level={5}>อัปเดตล่าสุด</Typography.Title>
            <Space>
              <ClockCircleOutlined />
              <Typography.Text>
                {dayjs(selectedRow.updated_at).format("DD/MM/YYYY HH:mm")}
              </Typography.Text>
            </Space>

            <Typography.Title level={5}>คำอธิบาย</Typography.Title>
            <Typography.Text>{selectedRow.description}</Typography.Text>

            <Typography.Title level={5}>ผู้ปรับใช้</Typography.Title>
            <Tag color="cyan">{selectedRow.deployed_by}</Tag>
          </Space>
        )}
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
            pagination={{ pageSize: 100, showSizeChanger: true }}
            size="middle"
            rowKey={(record: any) => `${record.system}-${record.environment}`}
            bordered
            style={{
              borderRadius: 14,
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
