"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Tag,
  Tooltip,
  Modal,
  Input,
  Select,
  Space,
  Card,
  Typography,
  theme,
  Empty,
  Row,
  Col,
} from "antd";
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
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { useRouter } from "next/navigation";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { toast } from "sonner";

const { Title, Text } = Typography;
const { Option } = Select;

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
  const { token } = theme.useToken();

  // ** State **
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [data, setData] = useState<NotEntryUser[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ** Actions **

  // 1. Fetch Report Data (Mode: report)
  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/v1/timesheet/report/not-entry/today",
        { mode: "report" },
      );

      if (response.data.status === 200) {
        setData(response.data.data);
        toast.success("อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("ไม่สามารถดึงข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  // 2. Trigger Discord Notification (Mode: discord)
  const handleSendDiscord = () => {
    Modal.confirm({
      title: "ยืนยันการแจ้งเตือนทาง Discord",
      icon: <DiscordOutlined style={{ color: "#5865F2" }} />,
      content: `คุณแน่ใจหรือไม่ว่าต้องการส่งการแจ้งเตือนไปยังพนักงานทั้งหมด ${filteredData.length} ราย?`,
      okText: "ส่งการแจ้งเตือน",
      okButtonProps: {
        style: { backgroundColor: "#5865F2" },
        className: "hover:!bg-[#4752C4]",
      },
      cancelText: "ยกเลิก",
      onOk: async () => {
        setDiscordLoading(true);
        try {
          const response = await axios.post(
            "/api/v1/timesheet/report/not-entry/today",
            { mode: "discord" },
          );

          if (response.data.status === 200) {
            toast.success("ส่งการแจ้งเตือนทาง Discord เรียบร้อยแล้ว!");
          }
        } catch (error: any) {
          console.error(error);
          toast.error("ไม่สามารถส่งการแจ้งเตือนได้");
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

  // ** Filtering Logic **
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        `${item.firstname} ${item.lastname} ${item.nickname} ${item.employee_code}`
          .toLowerCase()
          .includes(searchText.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchText, statusFilter]);

  // ** Statistics Calculation **
  const stats = useMemo(() => {
    const total = data.length;
    const zeroEntry = data.filter((u) => u.status === "ไม่ได้กรอกเลย").length;
    const partialEntry = data.filter((u) => u.status === "กรอกไม่ครบ").length;
    const totalLoggedHours = data.reduce(
      (acc, curr) => acc + curr.total_hours,
      0,
    );
    const avgHours = total > 0 ? totalLoggedHours / total : 0;

    return { total, zeroEntry, partialEntry, totalLoggedHours, avgHours };
  }, [data]);

  // ** Table Columns **
  const columns: ColumnsType<NotEntryUser> = [
    {
      title: "#",
      key: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => (
        <span style={{ color: token.colorTextTertiary }}>{index + 1}</span>
      ),
    },
    {
      title: "พนักงาน",
      key: "employee",
      width: 300,
      render: (_, record) => (
        <div className="flex flex-col">
          <Text strong style={{ fontSize: 15 }}>
            {record.firstname} {record.lastname} ({record.nickname})
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <TeamOutlined className="mr-1" />
            {record.employee_code}
          </Text>
        </div>
      ),
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "position",
      key: "position",
      width: 180,
      render: (text) => (
        <Tag
          color="blue"
          style={{
            borderRadius: 6,
            padding: "2px 8px",
            border: "none",
            backgroundColor: token.colorFillAlter,
          }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "สถานะการลงเวลา",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (status) => {
        const isMissing = status === "ไม่ได้กรอกเลย";
        return (
          <Tag
            icon={isMissing ? <UserDeleteOutlined /> : <WarningOutlined />}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              backgroundColor: isMissing
                ? token.colorErrorBg
                : token.colorWarningBg,
              color: isMissing ? token.colorError : token.colorWarning,
            }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "ชั่วโมงสะสม",
      dataIndex: "total_hours",
      key: "total_hours",
      width: 120,
      align: "center",
      render: (hours) => (
        <div className="flex flex-col items-center">
          <span
            style={{
              fontWeight: "bold",
              fontSize: 16,
              color: hours === 0 ? token.colorError : token.colorWarning,
            }}
          >
            {hours.toFixed(2)}
          </span>
          <Text type="secondary" style={{ fontSize: 10 }}>
            ชั่วโมง
          </Text>
        </div>
      ),
    },
    {
      title: "ข้อมูลการติดต่อ",
      key: "contact",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <MailOutlined className="mr-2" />
            {record.email}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined className="mr-2" />
            {record.tel}
          </Text>
        </Space>
      ),
    },
  ];

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <div
          className="min-h-screen p-4 md:p-8"
          style={{ backgroundColor: token.colorBgLayout }}
        >
          <div className="flex flex-col gap-6 w-full mx-auto">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.back()}
                  style={{
                    height: 44,
                    width: 44,
                    borderRadius: 12,
                    backgroundColor: token.colorBgContainer,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                  className="flex items-center justify-center"
                />
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                    รายงานผู้ยังไม่ได้ส่งเวลาประจำวัน
                  </Title>
                  <Text type="secondary">
                    รายชื่อพนักงานที่ยังไม่ได้บันทึกเวลาทำงาน
                    หรือบันทึกไม่ครบตามกำหนดของวันนี้
                  </Text>
                </div>
              </div>

              <Space size="middle">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchReport}
                  loading={loading}
                  style={{ height: 40, borderRadius: 8 }}
                >
                  รีเฟรชข้อมูล
                </Button>

                <Button
                  type="primary"
                  icon={<DiscordOutlined />}
                  onClick={handleSendDiscord}
                  loading={discordLoading}
                  disabled={data.length === 0}
                  style={{
                    backgroundColor: "#5865F2",
                    height: 40,
                    borderRadius: 8,
                    padding: "0 24px",
                    border: "none",
                    boxShadow: "0 4px 14px 0 rgba(88, 101, 242, 0.39)",
                  }}
                >
                  แจ้งเตือนเข้า Discord
                </Button>
              </Space>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Total Card */}
              <Card
                variant="borderless"
                className="shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                style={{
                  borderRadius: 16,
                  borderLeft: `4px solid ${token.colorPrimary}`,
                  background: token.colorBgContainer,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Text
                      type="secondary"
                      strong
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      พนักงานที่มีปัญหา
                    </Text>
                    <div className="flex items-baseline gap-2 mt-1">
                      <Title level={2} style={{ margin: 0, fontSize: 28 }}>
                        {stats.total}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        ราย
                      </Text>
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: token.colorPrimaryBg,
                      padding: 12,
                      borderRadius: 12,
                    }}
                  >
                    <TeamOutlined
                      style={{ fontSize: 24, color: token.colorPrimary }}
                    />
                  </div>
                </div>
              </Card>

              {/* Critical Card */}
              <Card
                variant="borderless"
                className="shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                style={{
                  borderRadius: 16,
                  borderLeft: `4px solid ${token.colorError}`,
                  background: token.colorBgContainer,
                }}
              >
                <Tooltip title="พนักงานที่ยังไม่ได้เริ่มบันทึกเวลาเลยแม้แต่นาทีเดียว">
                  <div className="flex items-center justify-between cursor-help">
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          color: token.colorError,
                          letterSpacing: 0.5,
                        }}
                      >
                        วิกฤต: ไม่ระบุเวลา
                      </Text>
                      <div className="flex items-baseline gap-2 mt-1">
                        <Title
                          level={2}
                          style={{
                            margin: 0,
                            color: token.colorError,
                            fontSize: 28,
                          }}
                        >
                          {stats.zeroEntry}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          ราย
                        </Text>
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: token.colorErrorBg,
                        padding: 12,
                        borderRadius: 12,
                      }}
                    >
                      <UserDeleteOutlined
                        style={{ fontSize: 24, color: token.colorError }}
                      />
                    </div>
                  </div>
                </Tooltip>
              </Card>

              {/* Warning Card */}
              <Card
                variant="borderless"
                className="shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                style={{
                  borderRadius: 16,
                  borderLeft: `4px solid ${token.colorWarning}`,
                  background: token.colorBgContainer,
                }}
              >
                <Tooltip title="พนักงานที่มีการบันทึกเวลาแล้วบางส่วน แต่ยังไม่ครบตามกำหนด">
                  <div className="flex items-center justify-between cursor-help">
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          color: token.colorWarning,
                          letterSpacing: 0.5,
                        }}
                      >
                        ต้องติดตาม: ไม่ครบ
                      </Text>
                      <div className="flex items-baseline gap-2 mt-1">
                        <Title
                          level={2}
                          style={{
                            margin: 0,
                            color: token.colorWarning,
                            fontSize: 28,
                          }}
                        >
                          {stats.partialEntry}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          ราย
                        </Text>
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: token.colorWarningBg,
                        padding: 12,
                        borderRadius: 12,
                      }}
                    >
                      <WarningOutlined
                        style={{ fontSize: 24, color: token.colorWarning }}
                      />
                    </div>
                  </div>
                </Tooltip>
              </Card>

              {/* Total Hours Card */}
              <Card
                variant="borderless"
                className="shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                style={{
                  borderRadius: 16,
                  borderLeft: `4px solid ${token.colorSuccess}`,
                  background: token.colorBgContainer,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Text
                      strong
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        color: token.colorSuccess,
                        letterSpacing: 0.5,
                      }}
                    >
                      รวมชั่วโมงที่ลงแล้ว
                    </Text>
                    <div className="flex items-baseline gap-2 mt-1">
                      <Title
                        level={2}
                        style={{
                          margin: 0,
                          color: token.colorSuccess,
                          fontSize: 28,
                        }}
                      >
                        {stats.totalLoggedHours.toFixed(1)}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        ชม.
                      </Text>
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: token.colorSuccessBg,
                      padding: 12,
                      borderRadius: 12,
                    }}
                  >
                    <ClockCircleOutlined
                      style={{ fontSize: 24, color: token.colorSuccess }}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Filter Section */}
            <Card
              style={{
                borderRadius: 16,
                backgroundColor: token.colorBgContainer,
              }}
              variant="borderless"
              className="shadow-sm"
              styles={{ body: { padding: "20px 24px" } }}
            >
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12} lg={8}>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    ค้นหาพนักงาน
                  </Text>
                  <Input
                    prefix={
                      <SearchOutlined
                        style={{ color: token.colorTextTertiary }}
                      />
                    }
                    placeholder="ค้นหาด้วยชื่อ, นามสกุล, ชื่อเล่น หรือรหัสพนักงาน"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    style={{ borderRadius: 8, height: 40 }}
                  />
                </Col>
                <Col xs={24} md={12} lg={6}>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    กรองตามสถานะ
                  </Text>
                  <Select
                    style={{ width: "100%", height: 40 }}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="เลือกสถานะ"
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="all">ทั้งหมด</Option>
                    <Option value="ไม่ได้กรอกเลย">ไม่ได้กรอกเลย</Option>
                    <Option value="กรอกไม่ครบ">กรอกไม่ครบ</Option>
                  </Select>
                </Col>
                <Col
                  xs={24}
                  lg={10}
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                  }}
                >
                  <Text type="secondary">
                    พบทั้งหมด <Text strong>{filteredData.length}</Text>{" "}
                    รายการจากเงื่อนไขปัจจุบัน
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* Table Section */}
            <Card
              style={{ borderRadius: 16, overflow: "hidden" }}
              variant="borderless"
              className="shadow-sm"
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="admin_id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showTotal: (total) => (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      แสดงพนักงานทั้งหมด {total} ราย
                    </Text>
                  ),
                  className: "px-6 py-4",
                }}
                locale={{
                  emptyText: (
                    <Empty
                      description="ไม่พบข้อมูลที่ค้นหา"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
                className="custom-table"
              />
            </Card>
          </div>
        </div>

        <style jsx global>{`
          .custom-table .ant-table-thead > tr > th {
            background-color: ${token.colorFillAlter} !important;
            color: ${token.colorTextDescription} !important;
            font-weight: 700 !important;
            font-size: 13px;
            padding: 16px;
            border-bottom: 1px solid ${token.colorBorderSecondary};
          }
          .custom-table .ant-table-tbody > tr > td {
            padding: 16px;
          }
          .custom-table .ant-table-tbody > tr:hover > td {
            background-color: ${token.colorFillSecondary} !important;
          }
          .ant-card {
            background-color: ${token.colorBgContainer};
          }
        `}</style>
      </DashboardLayout>
    </PermissionLayout>
  );
}
