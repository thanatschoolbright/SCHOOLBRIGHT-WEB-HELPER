"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, message, Tag, Tooltip, Modal } from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  SendOutlined,
  UserDeleteOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  DiscordOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { useRouter } from "next/navigation";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";

// ** Interface Definitions **
interface NotEntryUser {
  admin_id: number;
  employee_code: string;
  firstname: string;
  lastname: string;
  nickname: string;
  position: string;
  email: string;
  tel: string;
  status: "ไม่ได้กรอกเลย" | "กรอกไม่ครบ";
  total_hours: number;
}

export default function NotEntryReportPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // ** State **
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [data, setData] = useState<NotEntryUser[]>([]);

  // ** Actions **

  // 1. Fetch Report Data (Mode: report)
  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/v1/timesheet/report/not-entry/today",
        { mode: "report" }
      );

      if (response.data.status === 200) {
        setData(response.data.data);
        messageApi.success("Updated data successfully");
      }
    } catch (error: any) {
      console.error(error);
      messageApi.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // 2. Trigger Discord Notification (Mode: discord)
  const handleSendDiscord = () => {
    Modal.confirm({
      title: "Confirm Discord Notification",
      icon: <DiscordOutlined className="text-indigo-500" />,
      content: `Are you sure you want to send notifications to ${data.length} users?`,
      okText: "Send Notification",
      okButtonProps: { className: "bg-indigo-500 hover:!bg-indigo-600" },
      cancelText: "Cancel",
      onOk: async () => {
        setDiscordLoading(true);
        try {
          const response = await axios.post(
            "/api/v1/timesheet/report/not-entry/today",
            { mode: "discord" }
          );

          if (response.data.status === 200) {
            messageApi.success("Discord notifications sent successfully!");
          }
        } catch (error: any) {
          console.error(error);
          messageApi.error("Failed to send Discord notifications");
        } finally {
          setDiscordLoading(false);
        }
      },
    });
  };

  // Initial Fetch
  useEffect(() => {
    fetchReport();
  }, []);

  // ** Statistics Calculation **
  const missingCount = data.filter((u) => u.status === "ไม่ได้กรอกเลย").length;
  const incompleteCount = data.filter((u) => u.status === "กรอกไม่ครบ").length;

  // ** Table Columns **
  const columns: ColumnsType<NotEntryUser> = [
    {
      title: "#",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => (
        <span className="text-slate-400">{index + 1}</span>
      ),
    },
    {
      title: "Employee",
      key: "employee",
      width: 250,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-700">
            {record.firstname} {record.lastname} ({record.nickname})
          </span>
          <span className="text-xs text-slate-400">{record.employee_code}</span>
        </div>
      ),
    },
    {
      title: "Position",
      dataIndex: "position",
      key: "position",
      width: 150,
      render: (text) => (
        <Tag className="border-none bg-slate-100 text-slate-600 rounded-md px-2">
          {text}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        const isMissing = status === "ไม่ได้กรอกเลย";
        return (
          <Tag
            icon={isMissing ? <UserDeleteOutlined /> : <WarningOutlined />}
            className={`border-none px-3 py-1 rounded-full flex w-fit items-center gap-1 ${
              isMissing
                ? "bg-red-50 text-red-600"
                : "bg-orange-50 text-orange-600"
            }`}
          >
            {isMissing ? "Missing Entry" : "Incomplete"}
          </Tag>
        );
      },
    },
    {
      title: "Hours",
      dataIndex: "total_hours",
      key: "total_hours",
      width: 100,
      align: "center",
      render: (hours) => (
        <span
          className={`font-bold ${
            hours === 0 ? "text-red-500" : "text-orange-500"
          }`}
        >
          {hours.toFixed(2)} h
        </span>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <MailOutlined /> {record.email}
          </div>
          <div className="flex items-center gap-2">
            <PhoneOutlined /> {record.tel}
          </div>
        </div>
      ),
    },
  ];

  return (
    <PermissionLayout role={["ALL"]}>
      {contextHolder}
      <DashboardLayout>
        <div className="min-h-screen p-6 md:p-8 font-sans">
          <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.back()}
                  className="hover:bg-slate-200 h-10 w-10 flex items-center justify-center rounded-lg text-slate-500"
                />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 m-0">
                    Daily Missing Timesheet
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    List of users who haven't submitted or completed their
                    timesheet today.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchReport}
                  loading={loading}
                  className="border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300"
                >
                  Refresh Data
                </Button>

                {/* Discord Button */}
                <Button
                  type="primary"
                  icon={<DiscordOutlined />}
                  onClick={handleSendDiscord}
                  loading={discordLoading}
                  disabled={data.length === 0}
                  className="bg-[#5865F2] hover:!bg-[#4752C4] shadow-md shadow-indigo-200 border-none h-9 px-5"
                >
                  Notify Discord
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    Total Issues
                  </p>
                  <h3 className="text-3xl font-bold text-slate-800 m-0">
                    {data.length}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <UserDeleteOutlined className="text-xl" />
                </div>
              </div>

              {/* Missing Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    Missing Entry
                  </p>
                  <h3 className="text-3xl font-bold text-red-500 m-0">
                    {missingCount}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <ClockCircleOutlined className="text-xl" />
                </div>
              </div>

              {/* Incomplete Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    Incomplete Hours
                  </p>
                  <h3 className="text-3xl font-bold text-orange-500 m-0">
                    {incompleteCount}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                  <WarningOutlined className="text-xl" />
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Table
                columns={columns}
                dataSource={data}
                rowKey="admin_id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showTotal: (total) => (
                    <span className="text-slate-400 text-xs">
                      Total {total} users
                    </span>
                  ),
                  className: "px-6 py-4",
                }}
                className="
                  [&_.ant-table-thead_th]:!bg-slate-50
                  [&_.ant-table-thead_th]:!text-slate-500
                  [&_.ant-table-thead_th]:!font-semibold
                  [&_.ant-table-tbody_tr:hover_td]:!bg-slate-50/50
                "
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
