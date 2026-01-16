"use client";
import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { CallAPI as GET_VERSION_CONTROL } from "@/stores/actions/health-check/version-control/action";
import { ResponseVersionControl } from "@/stores/type";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

// Ant Design V5
import {
  Card,
  Tag,
  Button,
  Drawer,
  Space,
  Typography,
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
  Progress,
  Tooltip,
} from "antd";
import {
  RocketOutlined,
  ArrowLeftOutlined,
  DeploymentUnitOutlined,
  SyncOutlined,
  SearchOutlined,
  UserOutlined,
  HistoryOutlined,
  BranchesOutlined,
  GlobalOutlined,
  CodeOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  FireFilled,
} from "@ant-design/icons";

// Setup Dayjs
dayjs.extend(relativeTime);
dayjs.locale("th");

type SystemGroup = {
  systemName: string;
  repo: string;
  production?: ResponseVersionControl["data"]["data"][number];
  beta?: ResponseVersionControl["data"]["data"][number];
  development?: ResponseVersionControl["data"]["data"][number];
  last_updated: string;
};

// --- Helper Functions ---
const isRecent = (dateStr: string) => {
  if (!dateStr) return false;
  return dayjs().diff(dayjs(dateStr), "hour") < 24;
};

export default function VersionControlDashboard() {
  const { token } = theme.useToken();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Redux Selectors
  const GET_VERSION_CONTROL_STATE = useAppSelector(
    (state) => state.callVersionControlReducer
  );

  const isLoading = GET_VERSION_CONTROL_STATE.loading;

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
    const sorted = [...response].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    setRawData(sorted);
  }, [GET_VERSION_CONTROL_STATE]);

  // Transform Data
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

  const recentActivities = useMemo(() => rawData.slice(0, 15), [rawData]);

  const stats = useMemo(() => {
    const total = groupedSystems.length;
    const activeToday = rawData.filter((r) => isRecent(r.updated_at)).length;
    const stableProd = groupedSystems.filter((g) => g.production).length;
    const deployRate = total > 0 ? Math.round((stableProd / total) * 100) : 0;
    return { total, activeToday, deployRate };
  }, [groupedSystems, rawData]);

  const handleOpenDetail = (
    item?: ResponseVersionControl["data"]["data"][number]
  ) => {
    if (item) {
      setSelectedItem(item);
      setDrawerOpen(true);
    }
  };

  // --- Styled Components Logic ---
  const glassStyle = {
    background: token.colorBgContainer + "CC", // Add transparency
    backdropFilter: "blur(10px)",
    border: `1px solid ${token.colorBorderSecondary}`,
  };

  const gradientHeaderStyle = {
    background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
    color: "#fff",
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-10">
        {/* --- Hero / Header Section --- */}
        <div
          className="rounded-3xl p-8 mb-8 shadow-lg relative overflow-hidden"
          style={gradientHeaderStyle}
        >
          {/* Background decoration circles */}
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 pointer-events-none mix-blend-overlay"
            style={{ filter: "blur(40px)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-8 -mb-8 pointer-events-none mix-blend-overlay"
            style={{ filter: "blur(40px)" }}
          />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <Button
                type="text"
                icon={<ArrowLeftOutlined style={{ color: "white" }} />}
                onClick={() => router.back()}
                style={{
                  color: "white",
                  marginBottom: 8,
                  paddingLeft: 0,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                ย้อนกลับ
              </Button>
              <Typography.Title
                level={2}
                style={{ color: "#fff", marginBottom: 8, marginTop: 0 }}
              >
                <RocketOutlined className="mr-3" />
                ศูนย์ควบคุมเวอร์ชันระบบ
              </Typography.Title>
              <Typography.Text className="text-white/80 text-lg">
                ภาพรวมการ Deploy และสถานะเวอร์ชันของระบบทั้งหมด
              </Typography.Text>
            </div>
            <div className="flex gap-4">
              <Link href="/health-check/version-control/release-note">
                <Button
                  size="large"
                  type="default"
                  ghost
                  className="!border-white/40 !text-white hover:!bg-white/20 hover:!border-white"
                  icon={<FileTextOutlined />}
                >
                  บันทึกการอัปเดต
                </Button>
              </Link>
            </div>
          </div>

          {/* Review Stats Cards within Hero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <StatCard
              title="ระบบทั้งหมด"
              value={stats.total}
              icon={<DeploymentUnitOutlined />}
              bg="rgba(255,255,255,0.15)"
            />
            <StatCard
              title="อัปเดตวันนี้"
              value={stats.activeToday}
              icon={<FireFilled />} // Use FireFilled for "Hot" activity
              bg="rgba(255,255,255,0.15)"
              isTime
            />
            <StatCard
              title="ความพร้อมใช้งาน"
              value={`${stats.deployRate}%`}
              icon={<CheckCircleFilled />}
              bg="rgba(255,255,255,0.15)"
            />
            <div
              className="rounded-xl p-4 flex items-center justify-between text-white"
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(5px)",
              }}
            >
              <div>
                <div className="text-white/70 text-xs uppercase font-bold tracking-wider">
                  เวลาเซิร์ฟเวอร์
                </div>
                <div className="text-2xl font-bold mt-1 font-mono">
                  {dayjs().format("HH:mm")}
                </div>
              </div>
              <ClockCircleFilled className="text-3xl opacity-50" />
            </div>
          </div>
        </div>

        {/* --- Toolbar --- */}
        <div
          className="sticky top-4 z-20 rounded-2xl p-3 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm transition-all duration-300"
          style={glassStyle}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className="p-2 rounded-lg"
              style={{ background: token.colorFillTertiary }}
            >
              <BranchesOutlined
                style={{ fontSize: 18, color: token.colorText }}
              />
            </div>
            <Typography.Text strong style={{ fontSize: 16 }}>
              ท่อส่งงานระบบ (Pipelines)
            </Typography.Text>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Input
              prefix={
                <SearchOutlined style={{ color: token.colorTextDescription }} />
              }
              placeholder="ค้นหาชื่อระบบ..."
              allowClear
              className="hover:!border-primary"
              style={{
                borderRadius: 12,
                background: token.colorFillAlter,
                border: "none",
                width: 280,
              }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Tooltip title="รีเฟรชข้อมูล">
              <Button
                type="text"
                shape="circle"
                icon={<SyncOutlined spin={isLoading} />}
                onClick={() => {
                  dispatch(GET_VERSION_CONTROL());
                  toast.success("อัปเดตข้อมูลแล้ว!");
                }}
                style={{
                  background: token.colorFillAlter,
                  color: token.colorPrimary,
                }}
              />
            </Tooltip>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* --- Main Grid: Systems --- */}
          <Col xs={24} xl={16} xxl={17}>
            {groupedSystems.length > 0 ? (
              <div className="grid grid-cols-1 gap-5">
                {groupedSystems.map((group) => (
                  <SystemPipelineCard
                    key={group.systemName}
                    group={group}
                    token={token}
                    onClickDetail={handleOpenDetail}
                  />
                ))}
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="ไม่พบข้อมูลระบบ"
                className="mt-20"
              />
            )}
          </Col>

          {/* --- Right Sidebar: Live Feed --- */}
          <Col xs={24} xl={8} xxl={7}>
            <div className="sticky top-24">
              <div
                className="rounded-2xl p-5 shadow-sm border"
                style={{
                  background: token.colorBgContainer,
                  borderColor: token.colorBorderSecondary,
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      ความเคลื่อนไหวล่าสุด
                    </Typography.Title>
                  </div>
                  <Tag color="cyan" className="rounded-full px-3 border-0">
                    เรียลไทม์
                  </Tag>
                </div>

                <Timeline
                  items={recentActivities.map((item) => ({
                    dot: (
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                          isRecent(item.updated_at)
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    ),
                    children: (
                      <div
                        className="group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-3 -mt-2 -ml-2 rounded-xl transition-all"
                        onClick={() => handleOpenDetail(item)}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className="font-bold text-sm block mb-1 truncate w-40"
                            style={{ color: token.colorText }}
                          >
                            {item.system}
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ color: token.colorTextDescription }}
                          >
                            {dayjs(item.updated_at).fromNow(true)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <SmallEnvBadge env={item.environment} />
                          <span className="text-xs font-mono text-gray-500">
                            #{item.build.substring(0, 4)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Avatar
                            size={18}
                            icon={<UserOutlined />}
                            style={{ background: token.colorFillContent }}
                          />
                          <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">
                            {item.deployed_by}
                          </span>
                        </div>
                      </div>
                    ),
                  }))}
                />

                <div className="mt-4 pt-4 border-t text-center">
                  <Button type="link" size="small" className="text-gray-400">
                    ดูประวัติทั้งหมด
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Drawer
        title={
          <Space>
            <RocketOutlined style={{ color: token.colorPrimary }} />
            <span>รายละเอียดการติดตั้ง</span>
          </Space>
        }
        placement="right"
        width={500}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{
          header: { borderBottom: `1px solid ${token.colorBorderSecondary}` },
        }}
      >
        <DrawerContent item={selectedItem} token={token} />
      </Drawer>
    </DashboardLayout>
  );
}

// --- Sub Components ---

const StatCard = ({ title, value, icon, bg, isTime }: any) => (
  <div
    className="rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group"
    style={{ background: bg, backdropFilter: "blur(5px)" }}
  >
    <div className="flex justify-between items-start z-10">
      <div className="text-white/70 text-xs uppercase font-bold tracking-wider">
        {title}
      </div>
      <div className="text-white/50 text-xl group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-white mt-1 z-10 flex items-center gap-2">
      {value}
      {isTime && (
        <span className="text-xs font-normal text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
          Times
        </span>
      )}
    </div>
  </div>
);

const SystemPipelineCard = ({
  group,
  token,
  onClickDetail,
}: {
  group: SystemGroup;
  token: any;
  onClickDetail: (item: any) => void;
}) => {
  return (
    <div
      className="rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-300 group"
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Left: Info */}
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 mb-1">
            <Avatar
              shape="square"
              size={48}
              style={{
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                fontSize: 24,
                borderRadius: 12,
              }}
            >
              {group.systemName.charAt(0)}
            </Avatar>
            <div>
              <Typography.Title
                level={5}
                className="!mb-0 group-hover:text-primary transition-colors"
              >
                {group.systemName}
              </Typography.Title>
              <Typography.Text
                type="secondary"
                className="text-xs flex items-center gap-1"
              >
                <BranchesOutlined /> {group.repo}
              </Typography.Text>
            </div>
          </div>
        </div>

        {/* Center: Pipeline */}
        <div
          className="flex-1 w-full md:w-auto flex items-center gap-2 p-2 rounded-xl"
          style={{ background: token.colorFillQuaternary }}
        >
          <EnvPill
            env="DEV"
            data={group.development}
            color="blue"
            onClick={onClickDetail}
            token={token}
          />
          <div
            className="h-[2px] w-4 rounded-full"
            style={{ background: token.colorBorder }}
          />
          <EnvPill
            env="BETA"
            data={group.beta}
            color="orange"
            onClick={onClickDetail}
            token={token}
          />
          <div
            className="h-[2px] w-4 rounded-full"
            style={{ background: token.colorBorder }}
          />
          <EnvPill
            env="PROD"
            data={group.production}
            color="green"
            onClick={onClickDetail}
            token={token}
          />
        </div>

        {/* Right: Meta */}
        <div className="hidden md:flex flex-col items-end gap-1 min-w-[100px]">
          <Typography.Text type="secondary" className="text-xs">
            อัปเดตล่าสุด
          </Typography.Text>
          <Tag
            className="m-0 rounded-full border-0"
            style={{
              background: token.colorFillQuaternary,
              color: token.colorTextSecondary,
            }}
          >
            {dayjs(group.last_updated).fromNow()}
          </Tag>
        </div>
      </div>
    </div>
  );
};

const EnvPill = ({
  env,
  data,
  color,
  token,
  onClick,
}: {
  env: string;
  data: any;
  color: "blue" | "green" | "orange";
  token: any;
  onClick: (item: any) => void;
}) => {
  const active = !!data;
  const recent = active && isRecent(data.updated_at);

  let colorObj = { bg: "", text: "", border: "" };
  if (color === "blue") {
    colorObj = {
      bg: token.colorInfoBg,
      text: token.colorInfo,
      border: token.colorInfoBorder,
    };
  } else if (color === "orange") {
    colorObj = {
      bg: token.colorWarningBg,
      text: token.colorWarning,
      border: token.colorWarningBorder,
    };
  } else {
    colorObj = {
      bg: token.colorSuccessBg,
      text: token.colorSuccess,
      border: token.colorSuccessBorder,
    };
  }

  if (!active) {
    return (
      <div
        className="flex-1 min-h-[90px] rounded-lg border border-dashed flex flex-col items-center justify-center opacity-50"
        style={{
          background: token.colorFillQuaternary,
          borderColor: token.colorBorder,
        }}
      >
        <span
          className="text-[10px] font-bold"
          style={{ color: token.colorTextDisabled }}
        >
          {env}
        </span>
        <span
          className="text-[10px]"
          style={{ color: token.colorTextDisabled }}
        >
          -
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-[90px] rounded-lg cursor-pointer relative overflow-hidden transition-all hover:brightness-95 flex flex-col items-center justify-center border p-1"
      style={{
        background: colorObj.bg,
        borderColor: colorObj.border,
      }}
      onClick={() => onClick(data)}
    >
      {recent && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full shadow-sm m-1 animate-pulse" />
      )}

      <span
        className="text-[9px] font-bold opacity-70"
        style={{ color: colorObj.text }}
      >
        {env}
      </span>
      <div className="flex items-center gap-1 my-0.5">
        <span className="text-sm font-bold" style={{ color: token.colorText }}>
          v.{data.version || "?"}
        </span>
      </div>

      {/* Date */}
      <span
        className="text-[10px] font-mono leading-tight"
        style={{ color: token.colorTextSecondary }}
      >
        {dayjs(data.updated_at).format("DD/MM/YYYY HH:mm")}
      </span>

      {/* Build Number */}
      <span
        className="text-[9px] font-mono opacity-60 mt-0.5"
        style={{ color: token.colorText }}
      >
        #{data.build.substring(0, 5)}
      </span>
    </div>
  );
};

const SmallEnvBadge = ({ env }: { env: string }) => {
  let color = "gray";
  let sub = "UNK";
  if (env === "production") {
    color = "green";
    sub = "PROD";
  }
  if (env === "beta") {
    color = "orange";
    sub = "BETA";
  }
  if (env === "development") {
    color = "blue";
    sub = "DEV";
  }

  return (
    <Tag
      color={color}
      className="mr-0 text-[10px] px-1 py-[1px] leading-tight rounded border-0"
    >
      {sub}
    </Tag>
  );
};

const DrawerContent = ({ item, token }: { item: any; token: any }) => {
  if (!item) return null;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="p-4 rounded-xl text-center border"
        style={{
          background: token.colorFillQuaternary,
          borderColor: token.colorBorderSecondary,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          v.{item.version}
        </Typography.Title>
        <div className="flex justify-center gap-2 mt-2">
          <SmallEnvBadge env={item.environment} />
          <span
            className="font-mono"
            style={{ color: token.colorTextSecondary }}
          >
            #{item.build}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div
          className="flex justify-between border-b pb-2"
          style={{ borderColor: token.colorBorderSecondary }}
        >
          <span style={{ color: token.colorTextSecondary }}>ผู้ดำเนินการ</span>
          <span className="font-semibold flex items-center gap-2">
            <Avatar size="small" icon={<UserOutlined />} /> {item.deployed_by}
          </span>
        </div>
        <div
          className="flex justify-between border-b pb-2"
          style={{ borderColor: token.colorBorderSecondary }}
        >
          <span style={{ color: token.colorTextSecondary }}>
            เวลาที่ติดตั้ง
          </span>
          <span className="font-semibold">
            {dayjs(item.updated_at).format("DD MMM YYYY, HH:mm")}
          </span>
        </div>
        <div
          className="flex justify-between border-b pb-2"
          style={{ borderColor: token.colorBorderSecondary }}
        >
          <span style={{ color: token.colorTextSecondary }}>สาขา (Branch)</span>
          <span
            className="font-mono px-2 rounded text-xs"
            style={{
              background: token.colorFillQuaternary,
              color: token.colorText,
            }}
          >
            {item.branch}
          </span>
        </div>
      </div>

      <div className="mt-2">
        <Typography.Text strong className="mb-2 block">
          รายละเอียด / ข้อความ
        </Typography.Text>
        <div
          className="p-4 rounded-xl font-mono text-sm leading-relaxed"
          style={{ background: token.colorFillContent, color: token.colorText }}
        >
          {item.description}
        </div>
      </div>
    </div>
  );
};
