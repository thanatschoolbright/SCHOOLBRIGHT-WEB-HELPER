"use client";
import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { CallAPI as GET_VERSION_CONTROL } from "@/stores/actions/health-check/version-control/action";
import { ResponseVersionControl } from "@/stores/type";
import Link from "next/link"; // ✅ Import Link for navigation

// Ant Design V5
import {
  Card,
  Tag,
  Button,
  Drawer,
  Space,
  Typography,
  Tooltip,
  theme,
  Avatar,
  Badge,
  Input,
  Row,
  Col,
  Timeline,
  Statistic,
  Empty,
  Divider,
} from "antd";
import {
  RocketOutlined,
  DeploymentUnitOutlined,
  BugOutlined,
  SyncOutlined,
  SearchOutlined,
  UserOutlined,
  HistoryOutlined,
  BranchesOutlined,
  GlobalOutlined,
  WarningOutlined,
  CodeOutlined,
  FileTextOutlined, // ✅ Import Icon for Release Note
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

// Setup Dayjs
dayjs.extend(relativeTime);
dayjs.locale("th");

// Types
type SystemGroup = {
  systemName: string;
  repo: string;
  production?: ResponseVersionControl["data"]["data"][number];
  beta?: ResponseVersionControl["data"]["data"][number];
  development?: ResponseVersionControl["data"]["data"][number];
  last_updated: string;
};

// --- Helper Functions ---

// เช็คว่าเป็นรายการใหม่ (น้อยกว่า 24 ชม.)
const isRecent = (dateStr: string) => {
  if (!dateStr) return false;
  return dayjs().diff(dayjs(dateStr), "hour") < 24;
};

// แปลงชื่อ Environment เป็นภาษาไทย
const getThaiEnvName = (env: string) => {
  switch (env.toLowerCase()) {
    case "production":
      return "เซิร์ฟเวอร์โปรดักชัน";
    case "beta":
      return "เซิร์ฟเวอร์เบต้า";
    case "development":
      return "เซิร์ฟเวอร์พัฒนา";
    default:
      return env.toUpperCase();
  }
};

export default function OperationsDashboardPage() {
  const { token } = theme.useToken();
  const dispatch = useDispatch<AppDispatch>();

  // Redux Selectors
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const GET_VERSION_CONTROL_STATE = useAppSelector(
    (state) => state.callVersionControlReducer
  );

  const isLoading = [
    SCHOOL_LIST_STATE.loading,
    GET_VERSION_CONTROL_STATE.loading,
  ].some(Boolean);

  // States
  const [rawData, setRawData] = useState<
    ResponseVersionControl["data"]["data"]
  >([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] =
    useState<ResponseVersionControl["data"]["data"][number]>();
  const [searchText, setSearchText] = useState("");

  // Fetch Data
  useEffect(() => {
    dispatch(GET_VERSION_CONTROL());
  }, [dispatch]);

  useEffect(() => {
    const response = GET_VERSION_CONTROL_STATE?.response?.data?.data ?? [];
    // Sort by updated_at desc (ล่าสุดอยู่บน)
    const sorted = [...response].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    setRawData(sorted);
  }, [GET_VERSION_CONTROL_STATE]);

  // Data Transformation
  const groupedSystems = useMemo(() => {
    const groups: Record<string, SystemGroup> = {};

    rawData.forEach((item) => {
      if (!groups[item.system]) {
        groups[item.system] = {
          systemName: item.system,
          repo: item.repo,
          last_updated: item.updated_at,
        };
      }

      if (item.environment === "production")
        groups[item.system].production = item;
      else if (item.environment === "beta") groups[item.system].beta = item;
      else if (item.environment === "development")
        groups[item.system].development = item;

      if (
        new Date(item.updated_at) > new Date(groups[item.system].last_updated)
      ) {
        groups[item.system].last_updated = item.updated_at;
      }
    });

    return Object.values(groups)
      .filter((g) =>
        g.systemName.toLowerCase().includes(searchText.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.last_updated).getTime() -
          new Date(a.last_updated).getTime()
      );
  }, [rawData, searchText]);

  const recentActivities = useMemo(() => {
    return rawData.slice(0, 10);
  }, [rawData]);

  const getEnvColor = (env: string) => {
    switch (env) {
      case "production":
        return token.colorSuccess;
      case "beta":
        return token.colorWarning;
      case "development":
        return token.colorPrimary;
      default:
        return token.colorTextSecondary;
    }
  };

  const handleOpenDetail = (
    item?: ResponseVersionControl["data"]["data"][number]
  ) => {
    if (item) {
      setSelectedItem(item);
      setDrawerOpen(true);
    }
  };

  return (
    <DashboardLayout>
      <HeaderBar
        title="ระบบตรวจสอบการทำงาน (Operations Monitor)"
        subTitle="ติดตามการ Deploy และตรวจสอบเวอร์ชันรายระบบ"
        icon={<GlobalOutlined />}
        color="none"
      />

      <div className="w-full space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4  p-4 rounded-xl shadow-sm  ">
          <Space>
            <Statistic
              title="ระบบทั้งหมด"
              value={groupedSystems.length}
              prefix={<DeploymentUnitOutlined />}
              valueStyle={{ fontSize: 18, fontWeight: 600 }}
            />
            <Divider type="vertical" className="h-8" />
            <Statistic
              title="การอัปเดต (24 ชม.)"
              value={rawData.filter((r) => isRecent(r.updated_at)).length}
              prefix={<HistoryOutlined />}
              valueStyle={{
                fontSize: 18,
                fontWeight: 600,
                color: token.colorWarning,
              }}
            />
          </Space>

          <Space>
            <Input
              placeholder="ค้นหาระบบ..."
              prefix={
                <SearchOutlined style={{ color: token.colorTextPlaceholder }} />
              }
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Button
              icon={<SyncOutlined spin={isLoading} />}
              onClick={() => {
                dispatch(GET_VERSION_CONTROL());
                toast.success("ดึงข้อมูลล่าสุดเรียบร้อย");
              }}
            >
              รีเฟรชข้อมูล
            </Button>

            {/* ✅ Added Release Note Button with Badge */}
            <Link href="/health-check/version-control/release-note">
              <Badge count="ใหม่" offset={[-5, 5]} color={token.colorSuccess}>
                <Button type="default" icon={<FileTextOutlined />}>
                  Release Note
                </Button>
              </Badge>
            </Link>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          {/* LEFT COLUMN: Main System Grid */}
          <Col xs={24} xl={16}>
            <Typography.Title level={5} className="mb-4 ">
              <BranchesOutlined /> ภาพรวมสถานะระบบ (System Status)
            </Typography.Title>

            <div className="grid grid-cols-1 gap-4">
              {groupedSystems.map((group) => (
                <Card
                  key={group.systemName}
                  hoverable
                  size="small"
                  className="overflow-hidden border-l-4"
                  style={{ borderLeftColor: token.colorPrimary }}
                >
                  <div className="p-4  border-b flex justify-between items-center">
                    <Space>
                      <Avatar
                        shape="square"
                        style={{
                          color: token.colorPrimary,
                        }}
                      >
                        {group.systemName.charAt(0)}
                      </Avatar>
                      <div>
                        <Typography.Text strong className="block text-base">
                          {group.systemName}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="text-xs">
                          {group.repo}
                        </Typography.Text>
                      </div>
                    </Space>
                    <Typography.Text type="secondary" className="text-xs">
                      อัปเดต {dayjs(group.last_updated).fromNow()}
                    </Typography.Text>
                  </div>

                  <div className="grid grid-cols-3 divide-x">
                    <EnvSlot
                      title="เซิร์ฟเวอร์พัฒนา"
                      data={group.development}
                      color="blue"
                      onClick={() => handleOpenDetail(group.development)}
                    />
                    <EnvSlot
                      title="เซิร์ฟเวอร์เบต้า"
                      data={group.beta}
                      color="orange"
                      onClick={() => handleOpenDetail(group.beta)}
                    />
                    <EnvSlot
                      title="เซิร์ฟเวอร์โปรดักชัน"
                      data={group.production}
                      color="green"
                      onClick={() => handleOpenDetail(group.production)}
                    />
                  </div>
                </Card>
              ))}

              {groupedSystems.length === 0 && (
                <Empty description="ไม่พบข้อมูลระบบ" />
              )}
            </div>
          </Col>

          {/* RIGHT COLUMN: Live Feed */}
          <Col xs={24} xl={8}>
            <div className="sticky top-4">
              <Card
                title={
                  <Space>
                    <HistoryOutlined />{" "}
                    <span className="text-red-500">Live Deploy Feed</span>
                  </Space>
                }
                className="shadow-sm"
                bodyStyle={{ padding: "0px 24px 24px 24px" }}
              >
                <div className="my-4 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-600 flex items-start gap-2">
                  <WarningOutlined />
                  <span>
                    Feed นี้แสดงรายการ Deploy ล่าสุดเรียงตามเวลา
                    ช่วยให้ตรวจสอบได้ว่าใคร Deploy อะไรเข้ามาบ้าง
                  </span>
                </div>

                <Timeline
                  className="mt-6"
                  items={recentActivities.map((item) => ({
                    color: getEnvColor(item.environment),
                    dot: isRecent(item.updated_at) ? (
                      <div className="animate-pulse w-3 h-3 rounded-full bg-red-500" />
                    ) : undefined,
                    children: (
                      <div
                        className="cursor-pointer p-2 -ml-2 rounded transition-colors group"
                        onClick={() => handleOpenDetail(item)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <Typography.Text
                            strong
                            style={{ fontSize: 13 }}
                            className="truncate"
                          >
                            {item.system}
                          </Typography.Text>

                          {/* ✅ แสดง วัน/เดือน/ปี และเวลา */}
                          <Tag
                            bordered={false}
                            className="mr-0 text-[10px]  whitespace-nowrap"
                          >
                            {dayjs(item.updated_at).format("DD/MM/YYYY HH:mm")}
                          </Tag>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {/* ✅ แสดงชื่อเซิร์ฟเวอร์เป็นภาษาไทยเต็มๆ */}
                          <Tag
                            color={getEnvColor(item.environment)}
                            className="mr-0 text-[10px] px-2"
                          >
                            {getThaiEnvName(item.environment)}
                          </Tag>

                          <span className="text-xs text-gray-400">
                            Build: {item.build.substring(0, 6)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <Avatar
                            size={16}
                            icon={<UserOutlined />}
                            className="bg-slate-300"
                          />
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 11 }}
                            className="group-hover:text-blue-500 transition-colors"
                          >
                            {item.deployed_by}
                          </Typography.Text>
                        </div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      <Drawer
        title="รายละเอียดการติดตั้ง (Deployment Details)"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={500}
      >
        {selectedItem && (
          <div className="flex flex-col gap-6">
            <div className="text-center py-6 rounded-lg border ">
              <Tag
                color={getEnvColor(selectedItem.environment)}
                className="mb-2 text-sm px-3 py-1"
              >
                {getThaiEnvName(selectedItem.environment)}
              </Tag>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {selectedItem.system}
              </Typography.Title>
              <Typography.Text type="secondary">
                {selectedItem.repo}
              </Typography.Text>
            </div>

            <div className="space-y-4">
              <DetailRow
                label="ผู้ดำเนินการ"
                value={selectedItem.deployed_by}
                icon={<UserOutlined />}
                highlight
              />
              <DetailRow
                label="เวอร์ชัน"
                value={selectedItem.version || "N/A"}
                icon={<RocketOutlined />}
              />
              <DetailRow
                label="รหัส Build"
                value={selectedItem.build}
                code
                icon={<CodeOutlined />}
              />
              <DetailRow
                label="Branch"
                value={selectedItem.branch}
                code
                icon={<BranchesOutlined />}
              />
              <DetailRow
                label="เวลาที่ติดตั้ง"
                value={`${dayjs(selectedItem.updated_at).format(
                  "DD/MM/YYYY HH:mm"
                )} (${dayjs(selectedItem.updated_at).fromNow()})`}
                icon={<HistoryOutlined />}
              />
            </div>

            <Divider orientation="left" style={{ margin: "12px 0" }}>
              ข้อความ / รายละเอียด
            </Divider>
            <div className=" text-green-400 p-4 rounded-md font-mono text-sm">
              {">"} {selectedItem.description}
            </div>
          </div>
        )}
      </Drawer>
    </DashboardLayout>
  );
}

// ✅ Sub-components
const EnvSlot = ({
  title,
  data,
  color,
  onClick,
}: {
  title: string;
  data?: any;
  color: string;
  onClick: () => void;
}) => {
  const isSuccess = !!data;

  return (
    <div
      className={`p-4 flex flex-col justify-center min-h-[100px] transition-all cursor-pointer hover:bg-${color}-50`}
      onClick={isSuccess ? onClick : undefined}
    >
      <div className="flex justify-between mb-2">
        <span
          className={`text-[10px] font-bold text-${color}-600 bg-${color}-50 px-2 py-0.5 rounded border border-${color}-100`}
        >
          {title}
        </span>
        {data && isRecent(data.updated_at) && (
          <Badge dot color="red" offset={[0, 0]}>
            <span className="text-[10px] text-red-400 ml-1">ใหม่</span>
          </Badge>
        )}
      </div>

      {data ? (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold ">
              {data.version || "v.?"}
            </span>
            <span className="text-xs font-mono">
              #{data.build.substring(0, 5)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 overflow-hidden">
            <UserOutlined style={{ fontSize: 10, color: "#94a3b8" }} />
            <span className="text-[11px]  truncate max-w-full">
              {data.deployed_by}
            </span>
          </div>
          <span className="text-[10px]  mt-1 block">
            {dayjs(data.updated_at).fromNow()}
          </span>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full opacity-30">
          <span className="text-2xl">-</span>
          <span className="text-xs">ไม่มีข้อมูล</span>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value, icon, code, highlight }: any) => (
  <div className="flex justify-between items-center pb-3 border-b  last:border-0">
    <Space className="">
      {icon}
      <span>{label}</span>
    </Space>
    {highlight ? (
      <Tag color="geekblue">{value}</Tag>
    ) : (
      <Typography.Text code={code} strong>
        {value}
      </Typography.Text>
    )}
  </div>
);