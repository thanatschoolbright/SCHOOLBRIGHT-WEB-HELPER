"use client";

import { useRouter } from "next/navigation";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Space,
  Typography,
  Card,
  Row,
  Col,
  Button,
  Flex,
  Divider,
  Tooltip,
  Skeleton,
  Badge,
  Dropdown,
  MenuProps,
  theme,
} from "antd";
import {
  ClockCircleOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  CalendarOutlined,
  TeamOutlined,
  ProjectOutlined,
  SolutionOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  DownOutlined,
  FileTextOutlined,
  CopyOutlined,
} from "@ant-design/icons";

import PermissionLayout from "@/components/layouts/permission-layout";
import DashboardLayout from "@components/layouts/backend-layout";
import { TimesheetFilters } from "./components/timesheet-filters.component";
import { TimesheetTable } from "./components/timesheet-table.component";
import { useTimesheetData } from "./hooks/use-timesheet.data";
import { useExportHandlers } from "./hooks/use-export-handlers.data";
import { buildDefaultRange, filterRecords } from "./utils/timesheet.helpers";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@stores/store";
import { getUserData } from "@helpers/local_storage/user.storage";
import { useDispatch } from "react-redux";
import { setUsers } from "@stores/reducers/timesheet.reducer";

import ExportModal from "@components/modal/timesheet-export-modal";
import ExportModalByProject from "@components/modal/timesheet-export-modal-by-project";
import ExportModalTemplate3 from "@components/modal/timesheet-export-modal-template3";
import ExportModalTemplate4 from "@components/modal/timesheet-export-modal-template4";
import { toast } from "sonner";

const { Title, Text } = Typography;

// ==========================================
// INTERNAL SUB-COMPONENTS (Layout Style)
// ==========================================

// ==========================================
// INTERNAL SUB-COMPONENTS (Layout Style)
// ==========================================

const PageHeader = ({ metadata, onRefresh, loading }: any) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  return (
    <div
      className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 rounded-3xl border border-solid"
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${addAlpha(
              token.colorPrimary,
              0.05
            )} 100%)`
          : `linear-gradient(135deg, #fff 0%, ${addAlpha(
              token.colorPrimary,
              0.03
            )} 100%)`,
        borderColor: addAlpha(token.colorBorder, 0.6),
      }}
    >
      <Space size={20}>
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
          }}
        >
          <ClockCircleOutlined style={{ fontSize: 28, color: "#fff" }} />
        </div>
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              fontWeight: 800,
              letterSpcing: "-1px",
              color: token.colorTextHeading,
            }}
          >
            จัดการบันทึกเวลา
          </Title>
          <Flex align="center" gap={8} className="mt-1">
            <CalendarOutlined
              style={{ color: token.colorTextSecondary, fontSize: 14 }}
            />
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
              {metadata
                ? `ช่วงวันที่: ${metadata.range.label_th}`
                : "ระบบบริหารจัดการข้อมูลการลงเวลาทำงาน"}
            </Text>
          </Flex>
        </div>
      </Space>
      <Button
        icon={<ReloadOutlined spin={loading} />}
        onClick={onRefresh}
        size="large"
        shape="round"
        style={{
          height: 48,
          padding: "0 24px",
          fontWeight: 600,
          border: `1px solid ${token.colorBorder}`,
          background: token.colorBgContainer,
        }}
      >
        รีเฟรชข้อมูล
      </Button>
    </div>
  );
};

const CustomSummaryCards = ({ records, metadata, loading }: any) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  const metrics = [
    {
      label: "รายการทั้งหมด",
      value: records?.length || 0,
      color: "#3b82f6",
      icon: <SolutionOutlined />,
      desc: "รายการที่ถูกบันทึก",
    },
    {
      label: "วันทำงานจริง",
      value: metadata?.working_days || 0,
      color: "#22c55e",
      icon: <CalendarOutlined />,
      desc: "ไม่รวมวันหยุด",
    },
    {
      label: "โครงการที่รับผิดชอบ",
      value: new Set(records?.map((r: any) => r.project_id)).size || 0,
      color: "#f59e0b",
      icon: <ProjectOutlined />,
      desc: "โครงการที่มีส่วนร่วม",
    },
    {
      label: "พนักงานทั้งหมด",
      value: new Set(records?.map((r: any) => r.admin_id)).size || 0,
      color: "#8b5cf6",
      icon: <TeamOutlined />,
      desc: "จำนวนผู้ส่งงาน",
    },
  ];

  return (
    <Row gutter={[20, 20]} className="mb-8">
      {metrics.map((m, idx) => (
        <Col xs={24} sm={12} md={6} key={idx}>
          <div
            className="p-6 rounded-2xl border border-solid h-full transition-all group overflow-hidden relative"
            style={{
              background: token.colorBgContainer,
              borderColor: addAlpha(m.color, 0.2),
            }}
          >
            <div
              className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"
              style={{ fontSize: "100px", color: m.color }}
            >
              {m.icon}
            </div>

            <Flex vertical gap={12} className="relative z-10">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl"
                style={{
                  backgroundColor: addAlpha(m.color, isDark ? 0.2 : 0.1),
                  color: m.color,
                }}
              >
                {m.icon}
              </div>

              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: addAlpha(token.colorTextSecondary, 0.8),
                  }}
                >
                  {m.label}
                </Text>
                <div className="flex items-baseline gap-2 mt-1">
                  <Title
                    level={2}
                    style={{ margin: 0, fontWeight: 900, fontSize: 32 }}
                  >
                    {loading ? "..." : m.value.toLocaleString()}
                  </Title>
                </div>
                <Text type="secondary" style={{ fontSize: 12, opacity: 0.7 }}>
                  {m.desc}
                </Text>
              </div>
            </Flex>
          </div>
        </Col>
      ))}
    </Row>
  );
};

// --- Helper for color alpha ---
const addAlpha = (color: string, alpha: number) => {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

// ==========================================
// MAIN PAGE
// ==========================================

export default function TimesheetAllPage() {
  const { t } = useTranslation("translate");
  const dispatch = useDispatch();
  const router = useRouter();
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  // Report Dropdown Items
  const reportMenuItems: MenuProps["items"] = [
    {
      key: "capturable",
      label: (
        <Space>
          รายงานแคปทรัพย์สิน
          <Badge
            count="ใหม่"
            style={{ backgroundColor: token.colorSuccess, fontSize: 10 }}
          />
        </Space>
      ),
      icon: <ProjectOutlined />,
      onClick: () => router.push("/timesheet/all/report/capturable"),
    },
    {
      key: "not-entry-today",
      label: "รายงานผู้ไม่กรอกไทม์ชีทวันนี้",
      icon: <TeamOutlined />,
      onClick: () => router.push("/timesheet/all/report/not-entry/today"),
    },
  ];

  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState(buildDefaultRange());

  const { records, metadata, loading, refetch } = useTimesheetData(dateRange);
  const timesheetState = useAppSelector((state) => state.timesheetAll);
  const { users, exportLoading } = timesheetState;

  const [modalStates, setModalStates] = useState({
    exportModal: false,
    exportModal2: false,
    exportModal3: false,
    exportModal4: false,
  });

  const {
    projects,
    subProjects,
    handleExportTemplate,
    handleExportTemplate2,
    handleExportTemplate3,
    handleExportTemplate4,
    handleExportAll,
  } = useExportHandlers();

  const filteredRecords = useMemo(
    () => filterRecords(records, keyword),
    [records, keyword]
  );

  const handleOpenModal = useCallback((modalType: keyof typeof modalStates) => {
    setModalStates((prev) => ({ ...prev, [modalType]: true }));
  }, []);

  const handleCloseModal = useCallback(
    (modalType: keyof typeof modalStates) => {
      setModalStates((prev) => ({ ...prev, [modalType]: false }));
    },
    []
  );

  const handleCopyDiscord = useCallback(() => {
    if (filteredRecords.length === 0) {
      toast.error("ไม่มีข้อมูลในตาราง");
      return;
    }

    const title = `📊 รายงานไทม์ชีท ${
      metadata?.range?.label_th ? `ประจำ${metadata.range.label_th}` : ""
    }`;
    const body = filteredRecords
      .map((rec, index) => {
        const gapText =
          rec.hours_gap > 0 ? ` ⚠️ ขาด ${rec.hours_gap} ชม.` : " ✅ ครบ";
        return `${index + 1}. ${rec.full_name} (${rec.nickname || "-"}) | ${
          rec.total_hours
        }/${rec.required_hours} ชม.${gapText}`;
      })
      .join("\n");

    const fullText = `${title}\n${"=".repeat(30)}\n${body}`;

    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        toast.success("คัดลอกรายงานลง Clipboard สำเร็จ");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        toast.error("ไม่สามารถคัดลอกข้อมูลได้");
      });
  }, [filteredRecords, metadata]);

  useEffect(() => {
    const allUsers = getUserData();
    if (allUsers) dispatch(setUsers(allUsers));
  }, [dispatch]);

  // Dropdown Menu Items
  const exportMenuItems: MenuProps["items"] = [
    {
      key: "1",
      label: "Export Template 1",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => handleOpenModal("exportModal"),
    },
    {
      key: "2",
      label: "Export Template 2 (By Project)",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => handleOpenModal("exportModal2"),
    },
    {
      key: "3",
      label: "Export Template 3",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => handleOpenModal("exportModal3"),
    },
    {
      key: "4",
      label: "Export Template 4",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => handleOpenModal("exportModal4"),
    },
    { type: "divider" },
    {
      key: "all",
      label: "Export All Records",
      icon: <FileTextOutlined style={{ color: token.colorInfo }} />,
      onClick: handleExportAll,
      disabled: exportLoading,
    },
  ];

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <div
          className="w-full p-4 md:p-8 space-y-8"
          style={{ background: token.colorBgLayout, minHeight: "100vh" }}
        >
          {/* 1. Header Section */}
          <PageHeader
            metadata={metadata}
            loading={loading}
            onRefresh={refetch}
          />

          {/* 2. Summary Metrics */}
          <CustomSummaryCards
            records={records}
            metadata={metadata}
            loading={loading}
          />

          {/* 3. Filter & Export Bar */}
          <div
            className="p-6 rounded-3xl border border-solid overflow-hidden"
            style={{
              background: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <Flex vertical gap={24}>
              <Flex gap={16} wrap="wrap" align="center">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginRight: 8,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: addAlpha(token.colorPrimary, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: token.colorPrimary,
                    }}
                  >
                    <ExportOutlined />
                  </div>
                  <Text strong style={{ fontSize: 16 }}>
                    จัดการรายงาน
                  </Text>
                </div>

                <Dropdown
                  menu={{ items: exportMenuItems }}
                  trigger={["click"]}
                  placement="bottomLeft"
                >
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    loading={exportLoading}
                    shape="round"
                    size="large"
                    style={{
                      padding: "0 24px",
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                      border: "none",
                    }}
                  >
                    <Space>
                      ส่งออก Excel
                      <DownOutlined style={{ fontSize: "12px" }} />
                    </Space>
                  </Button>
                </Dropdown>

                <Dropdown
                  menu={{ items: reportMenuItems }}
                  trigger={["click"]}
                  placement="bottomLeft"
                >
                  <Button
                    icon={<FileTextOutlined />}
                    shape="round"
                    size="large"
                    style={{
                      padding: "0 24px",
                      fontWeight: 600,
                      background: token.colorBgContainer,
                    }}
                  >
                    <Space>
                      รายงานตรวจสอบ
                      <DownOutlined style={{ fontSize: "12px" }} />
                    </Space>
                  </Button>
                </Dropdown>

                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopyDiscord}
                  shape="round"
                  size="large"
                  style={{
                    padding: "0 24px",
                    fontWeight: 600,
                    background: `linear-gradient(135deg, #a855f7 0%, #6366f1 100%)`,
                    color: "#fff",
                    border: "none",
                  }}
                >
                  คัดลอก (Discord)
                </Button>
              </Flex>

              <div
                style={{
                  height: 1,
                  background: token.colorBorderSecondary,
                  opacity: 0.5,
                }}
              />

              <TimesheetFilters
                keyword={keyword}
                onKeywordChange={setKeyword}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onRefresh={refetch}
                onClearFilters={() => {
                  setKeyword("");
                  setDateRange(buildDefaultRange());
                }}
                loading={loading}
              />
            </Flex>
          </div>

          {/* 4. Table Card */}
          <div
            className="rounded-3xl border border-solid overflow-hidden"
            style={{
              background: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <div
              className="p-6 border-b border-solid"
              style={{ borderColor: token.colorBorderSecondary }}
            >
              <Flex justify="space-between" align="center">
                <Space size={12}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: addAlpha(token.colorInfo, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: token.colorInfo,
                    }}
                  >
                    <SolutionOutlined />
                  </div>
                  <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    ตารางบันทึกเวลา
                  </Title>
                  {!loading && (
                    <Badge
                      count={filteredRecords.length}
                      overflowCount={999}
                      showZero
                      style={{
                        backgroundColor: token.colorSuccess,
                        fontWeight: 700,
                        border: "none",
                      }}
                    />
                  )}
                </Space>
              </Flex>
            </div>

            {loading ? (
              <div className="p-10">
                <Skeleton active paragraph={{ rows: 10 }} />
              </div>
            ) : (
              <TimesheetTable
                records={filteredRecords}
                loading={loading}
                metadata={metadata}
                onRefetch={refetch}
              />
            )}

            {metadata?.notes && (
              <div
                className="m-6 p-4 rounded-xl border border-dashed flex items-start gap-3"
                style={{
                  backgroundColor: addAlpha(token.colorInfo, 0.03),
                  borderColor: addAlpha(token.colorInfo, 0.2),
                }}
              >
                <InfoCircleOutlined
                  style={{ color: token.colorInfo, marginTop: 4 }}
                />
                <Text
                  type="secondary"
                  style={{ fontSize: 13, fontStyle: "italic" }}
                >
                  {t("timesheet_page.notes_label")}: {metadata.notes}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Modals Section */}
        <ExportModal
          visible={modalStates.exportModal}
          loading={exportLoading}
          onClose={() => handleCloseModal("exportModal")}
          onExport={handleExportTemplate}
          projects={projects}
          subProjects={subProjects}
          users={users}
        />
        <ExportModalByProject
          visible={modalStates.exportModal2}
          loading={exportLoading}
          onClose={() => handleCloseModal("exportModal2")}
          onExport={handleExportTemplate2}
          projects={projects}
          subProjects={subProjects}
          users={users}
        />
        <ExportModalTemplate3
          visible={modalStates.exportModal3}
          loading={exportLoading}
          onClose={() => handleCloseModal("exportModal3")}
          onExport={handleExportTemplate3}
        />
        <ExportModalTemplate4
          visible={modalStates.exportModal4}
          loading={exportLoading}
          onClose={() => handleCloseModal("exportModal4")}
          onExport={handleExportTemplate4}
        />
      </DashboardLayout>
    </PermissionLayout>
  );
}
