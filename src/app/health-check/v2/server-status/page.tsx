"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Skeleton,
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
  ArrowLeftOutlined,
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
  const router = useRouter();
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
      toast.warning("ไม่พบข้อมูลสำหรับสร้างรายงาน");
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
      link.download = `รายงานสถานะเซิร์ฟเวอร์_${new Date().getTime()}.xlsx`;
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

  // เมนูคำสั่งสำหรับปุ่ม Dropdown
  const actionMenuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "discord",
        label: "ทดสอบแจ้งเตือนทาง Discord",
        icon: <NotificationOutlined />,
        onClick: () => fetchServerStatus("discord"),
        disabled: isDiscordLoading,
      },
      {
        type: "divider",
      },
      {
        key: "export",
        label: "ดาวน์โหลดรายงาน Excel",
        icon: <FileExcelOutlined />,
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
    toast.success("คัดลอกคำสั่งเรียบร้อย");
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
      title: "ชื่อระบบ (Module)",
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
      title: "จุดเชื่อมต่อ (Service Endpoint)",
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
      title: "สถานะการทำงาน",
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
      title: "การจัดการ",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Tooltip title="กดเพื่อดูรายละเอียดเชิงลึก">
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <Button
              shape="circle"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              size="large"
              aria-label="ย้อนกลับ"
            />
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                ระบบตรวจสอบสุขภาพเซิร์ฟเวอร์ (System Health)
              </Typography.Title>
              <Typography.Text type="secondary">
                <Space>
                  {isLoading ? (
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: 100 }}
                    />
                  ) : (
                    <>
                      <SyncOutlined />
                      ข้อมูลล่าสุดเมื่อ:{" "}
                      {lastUpdated
                        ? lastUpdated.toLocaleTimeString("th-TH")
                        : "-"}
                    </>
                  )}
                </Space>
              </Typography.Text>
            </div>
          </div>

          <Space>
            {isLoading || isExporting || isDiscordLoading ? (
              <Skeleton.Button active shape="default" style={{ width: 150 }} />
            ) : (
              <Dropdown.Button
                type="primary"
                icon={<DownOutlined />}
                menu={{ items: actionMenuItems }}
                onClick={() => fetchServerStatus("normal")}
              >
                <Space>
                  <ReloadOutlined />
                  ตรวจสอบสถานะทันที
                </Space>
              </Dropdown.Button>
            )}
          </Space>
        </div>

        {/* Statistic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="borderless" className="shadow-sm">
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : (
                <>
                  <Statistic
                    title="ความสมบูรณ์ของระบบโดยรวม"
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
                </>
              )}
            </div>
          </Card>

          <Card variant="borderless" className="shadow-sm">
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title="จำนวนระบบทั้งหมด"
                value={stats.total}
                prefix={<ApiOutlined />}
                suffix="รายการ"
              />
            )}
          </Card>

          <Card variant="borderless" className="shadow-sm">
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title="ทำงานปกติ"
                value={stats.online}
                valueStyle={{ color: "#3f8600" }}
                prefix={<SafetyCertificateOutlined />}
                suffix="รายการ"
              />
            )}
          </Card>

          <Card
            variant="borderless"
            className="shadow-sm"
            style={{
              border:
                !isLoading && stats.offline > 0
                  ? "1px solid #ffccc7"
                  : undefined,
              background:
                !isLoading && stats.offline > 0 ? "#fff1f0" : undefined,
            }}
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Statistic
                title="พบปัญหา"
                value={stats.offline}
                valueStyle={{ color: "#cf1322" }}
                prefix={<BugOutlined />}
                suffix="รายการ"
              />
            )}
          </Card>
        </div>

        {/* Alert Section */}
        {!isLoading && stats.offline > 0 && (
          <Alert
            message="พบความผิดปกติในระบบ"
            description={`ตรวจพบปัญหาจำนวน ${stats.offline} รายการที่ไม่สามารถใช้งานได้ กรุณาแจ้งทีม Developer หรือตรวจสอบรายละเอียดด้านล่าง`}
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
                disabled={isLoading}
              />
            </div>
            <div className="w-full md:w-1/3">
              <Input
                placeholder="ค้นหาจากชื่อระบบ, URL หรือ Domain..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                disabled={isLoading}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: "20px" }}>
              <Skeleton active paragraph={{ rows: 10 }} />
            </div>
          ) : (
            <Table<ServerStatusData>
              columns={columns}
              dataSource={filteredData}
              loading={false}
              rowKey={(record) => record.module}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `แสดงทั้งหมด ${total} รายการ`,
              }}
              bordered
              locale={{ emptyText: "ไม่พบข้อมูลที่ค้นหา" }}
            />
          )}
        </Card>
      </div>

      {/* Modal Detail Section */}
      <Modal
        title={
          <Space>
            <Badge
              status={selectedItem?.status === "200" ? "success" : "error"}
            />
            {`รายละเอียดระบบ: ${selectedItem?.name_th || ""}`}
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
                label: "สรุปข้อมูลทั่วไป",
                children: (
                  <div className="flex flex-col gap-4 py-2">
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="ชื่อระบบ">
                        {selectedItem.name_th} ({selectedItem.name_en})
                      </Descriptions.Item>
                      <Descriptions.Item label="สถานะการตอบกลับ (Status Code)">
                        {selectedItem.status === "200" ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>
                            200 OK (ปกติ)
                          </Tag>
                        ) : (
                          <Tag color="error" icon={<CloseCircleOutlined />}>
                            {selectedItem.status} (เกิดข้อผิดพลาด)
                          </Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="ลิงก์ตรวจสอบ (URL)">
                        <Typography.Text copyable>
                          {selectedItem.request.url}
                        </Typography.Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="ข้อความตอบกลับ (Response)">
                        <div className="max-h-20 overflow-auto text-gray-600">
                          {selectedItem.response?.message ||
                            selectedItem.response?.desc ||
                            JSON.stringify(selectedItem.response).slice(
                              0,
                              150
                            ) + "..."}
                        </div>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: "2",
                label: "สำหรับนักพัฒนา (Dev Tools)",
                children: (
                  <div className="flex flex-col gap-3">
                    <Alert
                      message="ส่วนนี้สำหรับ Developer หรือ QA ใช้ตรวจสอบเชิงลึก (cURL Command)"
                      type="info"
                      showIcon
                    />
                    <div className="relative">
                      <Input.TextArea
                        value={selectedItem.curl}
                        autoSize={{ minRows: 4, maxRows: 8 }}
                        readOnly
                        className="font-mono text-xs bg-gray-50"
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(selectedItem.curl)}
                        className="absolute top-2 right-2"
                      >
                        คัดลอกคำสั่ง
                      </Button>
                    </div>
                  </div>
                ),
              },
              {
                key: "3",
                label: "ผลลัพธ์ฉบับเต็ม (JSON Response)",
                children: (
                  <div className="max-h-[400px] overflow-auto rounded border p-4 bg-gray-50">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(selectedItem.response, null, 2)}
                    </pre>
                  </div>
                ),
              },
              {
                key: "4",
                label: "ข้อมูลที่ส่งไป (Request Header/Body)",
                children: (
                  <div className="max-h-[400px] overflow-auto rounded border p-4 bg-gray-50">
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
