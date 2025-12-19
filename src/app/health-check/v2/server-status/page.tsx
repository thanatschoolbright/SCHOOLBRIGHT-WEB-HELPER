"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import axios from "axios";
import { toast } from "sonner";
import {
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Tooltip,
  Modal,
  Space,
  Tabs,
  Input,
  Descriptions,
  Statistic,
  Progress,
  Segmented,
  Badge,
  Alert,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  NotificationOutlined,
  EyeOutlined,
  CopyOutlined,
  ApiOutlined,
  SearchOutlined,
  BugOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  DownloadOutlined,
  DownOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  ExportServerStatusService,
  ServerStatusData,
} from "@/services/backend/server-status/export-server-status.report.service";

interface ApiResponse {
  status: number;
  message_th: string;
  message_en: string;
  data: ServerStatusData[];
}

export default function ServerStatusPage() {
  const [data, setData] = useState<ServerStatusData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServerStatusData | null>(
    null
  );
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "ERROR">(
    "ALL"
  );

  const fetchServerStatus = useCallback(
    async (mode: "normal" | "discord" = "normal") => {
      const isDiscord = mode === "discord";
      if (isDiscord) setIsDiscordLoading(true);
      else setIsLoading(true);

      try {
        const response = await axios.post<ApiResponse>(
          "/api/v1/health-check/server/system",
          { mode },
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
          setLastUpdated(new Date());

          if (isDiscord) {
            toast.success("ส่งรายงานเข้า Discord เรียบร้อยแล้ว");
          } else {
            toast.success("อัปเดตสถานะล่าสุดเรียบร้อย");
          }
        }
      } catch (error: any) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาด", {
          description:
            error?.response?.data?.message_th ||
            "ไม่สามารถเชื่อมต่อกับ Server ได้",
        });
      } finally {
        if (isDiscord) setIsDiscordLoading(false);
        else setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchServerStatus("normal");
  }, [fetchServerStatus]);

  const handleExportExcel = async () => {
    if (data.length === 0) {
      toast.warning("ไม่พบข้อมูลสำหรับ Export");
      return;
    }

    try {
      setIsExporting(true);
      const buffer = await ExportServerStatusService.generateReport(data);

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Server_Status_Report_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("ดาวน์โหลดรายงานสำเร็จ");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const lowerSearch = searchText.toLowerCase();
      const matchesSearch =
        item.module.toLowerCase().includes(lowerSearch) ||
        item.service.toLowerCase().includes(lowerSearch) ||
        item.name_th.toLowerCase().includes(lowerSearch) ||
        item.name_en.toLowerCase().includes(lowerSearch);

      const isOnline = item.status === "200";

      if (statusFilter === "ONLINE") return matchesSearch && isOnline;
      if (statusFilter === "ERROR") return matchesSearch && !isOnline;
      return matchesSearch;
    });
  }, [data, searchText, statusFilter]);

  const stats = useMemo(() => {
    const total = data.length;
    const online = data.filter((i) => i.status === "200").length;
    const offline = total - online;
    const healthScore = total === 0 ? 0 : Math.round((online / total) * 100);
    return { total, online, offline, healthScore };
  }, [data]);

  const actionMenuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "discord",
        label: "ทดสอบแจ้งเตือน Discord",
        icon: <NotificationOutlined spin={isDiscordLoading} />,
        onClick: () => fetchServerStatus("discord"),
        disabled: isDiscordLoading,
      },
      {
        type: "divider",
      },
      {
        key: "export",
        label: "Export Excel Report",
        icon: <FileExcelOutlined spin={isExporting} />,
        onClick: handleExportExcel,
        disabled: isExporting || data.length === 0,
      },
    ],
    [
      fetchServerStatus,
      handleExportExcel,
      isDiscordLoading,
      isExporting,
      data.length,
    ]
  );

  const handleOpenDetail = (record: ServerStatusData) => {
    setSelectedItem(record);
    setModalOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกคำสั่ง cURL แล้ว");
  };

  const columns: ColumnsType<ServerStatusData> = [
    {
      title: "ลำดับ",
      key: "index",
      align: "center",
      width: 70,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Module Name",
      key: "name_th",
      render: (_, record) => (
        <div className="flex flex-col">
          <Typography.Text strong className="text-sm">
            {record.name_th}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {record.name_en}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Service / Endpoint",
      dataIndex: "service",
      key: "service",
      responsive: ["md"],
      render: (text, record) => (
        <div className="flex flex-col">
          <Typography.Text className="text-xs">{text}</Typography.Text>
          <Typography.Text
            type="secondary"
            className="text-[10px] truncate max-w-[200px]"
          >
            {record.request.url}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        const isOk = status === "200";
        return (
          <Badge
            status={isOk ? "success" : "error"}
            text={
              isOk ? (
                <Tag color="success" bordered={false}>
                  ใช้งานได้ปกติ
                </Tag>
              ) : (
                <Tag color="error" bordered={false}>
                  เกิดข้อผิดพลาด ({status})
                </Tag>
              )
            }
          />
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Tooltip title="ตรวจสอบข้อมูลเชิงลึก (Debug)">
          <Button
            type={record.status !== "200" ? "primary" : "default"}
            danger={record.status !== "200"}
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetail(record)}
          >
            ตรวจสอบ
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        {/* Header Section with Split Button Dropdown */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              System Health Monitor
            </Typography.Title>
            <Typography.Text type="secondary">
              <Space>
                <SyncOutlined spin={isLoading} />
                อัปเดตล่าสุด:{" "}
                {lastUpdated ? lastUpdated.toLocaleTimeString("th-TH") : "-"}
              </Space>
            </Typography.Text>
          </div>
          <Space>
            <Dropdown.Button
              type="primary"
              loading={isLoading}
              icon={<DownOutlined />}
              menu={{ items: actionMenuItems }}
              onClick={() => fetchServerStatus("normal")}
            >
              <Space>
                <ReloadOutlined />
                อัปเดตข้อมูลทันที
              </Space>
            </Dropdown.Button>
          </Space>
        </div>

        {/* Statistic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="borderless" className="shadow-sm">
            <div className="flex items-center justify-between">
              <Statistic
                title="ภาพรวมความสมบูรณ์ของระบบ"
                value={stats.healthScore}
                suffix="%"
                valueStyle={{
                  color: stats.healthScore === 100 ? "#3f8600" : "#cf1322",
                }}
              />
              <Progress
                type="circle"
                percent={stats.healthScore}
                size={50}
                status={stats.healthScore === 100 ? "success" : "exception"}
                showInfo={false}
              />
            </div>
          </Card>

          <Card variant="borderless" className="shadow-sm">
            <Statistic
              title="จำนวน Module ทั้งหมด"
              value={stats.total}
              prefix={<ApiOutlined />}
            />
          </Card>

          <Card variant="borderless" className="shadow-sm">
            <Statistic
              title="ทำงานปกติ"
              value={stats.online}
              valueStyle={{ color: "#3f8600" }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>

          <Card
            variant="borderless"
            className="shadow-sm"
            style={{
              border: stats.offline > 0 ? "1px solid #ffccc7" : undefined,
              background: stats.offline > 0 ? "#fff1f0" : undefined,
            }}
          >
            <Statistic
              title="พบปัญหา"
              value={stats.offline}
              valueStyle={{ color: "#cf1322" }}
              prefix={<BugOutlined />}
            />
          </Card>
        </div>

        {/* Alert Section */}
        {stats.offline > 0 && (
          <Alert
            message="พบความผิดปกติในระบบ"
            description={`มี ${stats.offline} รายการที่ไม่สามารถใช้งานได้ โปรดตรวจสอบและแจ้งทีม Developer ทันที`}
            type="error"
            showIcon
            banner
            className="rounded-md"
          />
        )}

        {/* Table & Filter Section */}
        <Card variant="borderless" className="shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="w-full md:w-auto">
              <Segmented
                options={[
                  { label: "ทั้งหมด", value: "ALL", icon: <ApiOutlined /> },
                  {
                    label: "ปกติ",
                    value: "ONLINE",
                    icon: <CheckCircleOutlined />,
                  },
                  {
                    label: `พบปัญหา (${stats.offline})`,
                    value: "ERROR",
                    icon: <CloseCircleOutlined />,
                  },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
              />
            </div>
            <div className="w-full md:w-1/3">
              <Input
                placeholder="ค้นหาชื่อระบบ, URL หรือ Domain..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </div>
          </div>

          <Table<ServerStatusData>
            columns={columns}
            dataSource={filteredData}
            loading={isLoading}
            rowKey={(record) => record.module}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `แสดงผล ${total} รายการ`,
            }}
            bordered
          />
        </Card>
      </div>

      {/* Modal Detail Section */}
      <Modal
        title={
          <Space>
            {/* ใช้ Ant Design Badge แทน div classname สี เพื่อให้เป็น Clean Code ตาม Theme */}
            <Badge
              status={selectedItem?.status === "200" ? "success" : "error"}
            />
            {`ตรวจสอบ: ${selectedItem?.name_th || ""}`}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setModalOpen(false)}>
            ปิดหน้าต่าง
          </Button>,
        ]}
        width={850}
        centered
      >
        {selectedItem && (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "สรุปข้อมูล (Summary)",
                children: (
                  <div className="flex flex-col gap-4 py-2">
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="ชื่อระบบ">
                        {selectedItem.name_th} ({selectedItem.name_en})
                      </Descriptions.Item>
                      <Descriptions.Item label="สถานะ (Status Code)">
                        {selectedItem.status === "200" ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>
                            200 OK (ปกติ)
                          </Tag>
                        ) : (
                          <Tag color="error" icon={<CloseCircleOutlined />}>
                            {selectedItem.status} (ผิดพลาด)
                          </Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Endpoint URL">
                        <Typography.Text copyable>
                          {selectedItem.request.url}
                        </Typography.Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Response Message">
                        <div className="max-h-20 overflow-auto">
                          {selectedItem.response?.message ||
                            selectedItem.response?.desc ||
                            JSON.stringify(selectedItem.response).slice(
                              0,
                              100
                            ) + "..."}
                        </div>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: "2",
                label: "Dev Tools (cURL)",
                children: (
                  <div className="flex flex-col gap-3">
                    <Alert
                      message="สำหรับ Developer / QA นำไปทดสอบซ้ำ (Retest)"
                      type="info"
                      showIcon
                    />
                    <div className="relative">
                      <Input.TextArea
                        value={selectedItem.curl}
                        autoSize={{ minRows: 4, maxRows: 8 }}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(selectedItem.curl)}
                        className="absolute top-2 right-2"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                ),
              },
              {
                key: "3",
                label: "Full Response (JSON)",
                children: (
                  <div className="max-h-[400px] overflow-auto rounded border p-4">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(selectedItem.response, null, 2)}
                    </pre>
                  </div>
                ),
              },
              {
                key: "4",
                label: "Request Headers/Body",
                children: (
                  <div className="max-h-[400px] overflow-auto rounded border p-4">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(selectedItem.request, null, 2)}
                    </pre>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
