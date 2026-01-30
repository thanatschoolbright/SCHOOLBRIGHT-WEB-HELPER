"use client";

import { useRouter } from "next/navigation";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Space,
  Typography,
  Row,
  Col,
  Button,
  Flex,
  Badge,
  Dropdown,
  MenuProps,
  theme,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  FileExcelOutlined,
  CalendarOutlined,
  TeamOutlined,
  ProjectOutlined,
  SolutionOutlined,
  DownOutlined,
  FileTextOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
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
import { HeaderBar } from "@/components/typhography/header-bar-component";
import SummaryCard from "@/components/card/summary-card";

const { Text } = Typography;

/**
 * หน้าจอหลักสำหรับจัดการและดูรายงานความคืบหน้าการบันทึกเวลาทำงานของพนักงานทั้งหมด
 */
export default function TimesheetAllPage() {
  const { t } = useTranslation("translate");
  const dispatch = useDispatch();
  const router = useRouter();
  const { token } = theme.useToken();

  // --- States ---
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState(buildDefaultRange());
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [modalStates, setModalStates] = useState({
    exportModal: false,
    exportModal2: false,
    exportModal3: false,
    exportModal4: false,
    autoFillModal: false,
  });

  // --- Data & Handlers ---
  const { records, metadata, loading, refetch } = useTimesheetData(
    dateRange,
    departmentId,
  );
  const { users, exportLoading } = useAppSelector(
    (state) => state.timesheetAll,
  );

  const {
    projects,
    subProjects,
    requestExportTemplate,
    requestExportTemplate2,
    requestExportTemplate3,
    requestExportTemplate4,
    requestExportAll,
  } = useExportHandlers();

  /**
   * กรองข้อมูลพนักงานตามคำค้นหา (Keyword)
   */
  const filteredRecords = useMemo(
    () => filterRecords(records, keyword),
    [records, keyword],
  );

  /**
   * เปิด Modal สำหรับการเติมข้อมูลอัตโนมัติ
   */
  const requestOpenAutoFillModal = useCallback(() => {
    setModalStates((prev) => ({ ...prev, autoFillModal: true }));
  }, []);

  /**
   * เปิด Modal สำหรับการส่งออกข้อมูลตามประเภทที่ระบุ
   */
  const requestOpenExportModal = useCallback(
    (modalType: keyof typeof modalStates) => {
      setModalStates((prev) => ({ ...prev, [modalType]: true }));
    },
    [],
  );

  /**
   * ปิด Modal ต่างๆ ในหน้าจอ
   */
  const responseCloseModal = useCallback(
    (modalType: keyof typeof modalStates) => {
      setModalStates((prev) => ({ ...prev, [modalType]: false }));
    },
    [],
  );

  /**
   * คัดลอกสรุปรายงานไปยัง Clipboard เพื่อใช้ใน Discord
   */
  const requestCopyReportToDiscord = useCallback(() => {
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

  // --- Effects ---
  useEffect(() => {
    const allUsers = getUserData();
    if (allUsers) dispatch(setUsers(allUsers));
  }, [dispatch]);

  // --- Menu Items ---
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

  const exportMenuItems: MenuProps["items"] = [
    {
      key: "1",
      label: "Export Template 1",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => requestOpenExportModal("exportModal"),
    },
    {
      key: "2",
      label: "Export Template 2 (By Project)",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => requestOpenExportModal("exportModal2"),
    },
    {
      key: "3",
      label: "Export Template 3",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => requestOpenExportModal("exportModal3"),
    },
    {
      key: "4",
      label: "Export Template 4",
      icon: <FileExcelOutlined style={{ color: token.colorSuccess }} />,
      onClick: () => requestOpenExportModal("exportModal4"),
    },
    { type: "divider" },
    {
      key: "all",
      label: "Export All Records",
      icon: <FileTextOutlined style={{ color: token.colorInfo }} />,
      onClick: requestExportAll,
      disabled: exportLoading,
    },
  ];

  const metrics = [
    {
      title: "รายการทั้งหมด",
      value: records?.length || 0,
      icon: <AppstoreOutlined />,
      color: token.colorPrimary,
      iconBg: token.colorPrimaryBg,
      subtitle: "รายการที่ถูกบันทึกในหน้าเว็บช่วยสอน (SB Web Helper)",
      suffix: "รายการ",
    },
    {
      title: "วันทำงานจริง",
      value: metadata?.working_days || 0,
      icon: <CalendarOutlined />,
      color: token.colorSuccess,
      iconBg: token.colorSuccessBg,
      subtitle:
        "จำนวนวันทำงานทั้งหมดในช่วงวันที่เลือก (ไม่รวมวันเสาร์-อาทิตย์)",
      suffix: "วัน",
    },
    {
      title: "โครงการ",
      value: new Set(records?.map((r: any) => r.project_id)).size || 0,
      icon: <ProjectOutlined />,
      color: token.colorWarning,
      iconBg: token.colorWarningBg,
      subtitle: "จำนวนโครงการที่พนักงานเข้าไปกรอกเวลาทำงาน",
      suffix: "โครงการ",
    },
    {
      title: "พนักงาน",
      value: new Set(records?.map((r: any) => r.admin_id)).size || 0,
      icon: <TeamOutlined />,
      color: token.colorInfo,
      iconBg: token.colorInfoBg,
      subtitle: "จำนวนพนักงานทั้งหมดที่มีข้อมูลในรายงานนี้",
      suffix: "คน",
    },
  ];

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <Flex vertical gap={24} style={{ padding: 24 }}>
          {/* ส่วนที่ 1 : Header ของหน้า */}
          <HeaderBar
            icon={<ClockCircleOutlined />}
            title="จัดการบันทึกเวลา"
            subTitle={
              metadata
                ? `ช่วงวันที่: ${metadata.range.label_th}`
                : "ระบบบริหารจัดการข้อมูลการลงเวลาทำงาน"
            }
            extra={
              <Button
                icon={<ClockCircleOutlined />}
                onClick={refetch}
                loading={loading}
                shape="round"
                size="large"
              >
                รีเฟรชข้อมูล
              </Button>
            }
          />

          {/* ส่วนที่ 2 : บัตรสรุปข้อมูล (Summary Cards) */}
          <Row gutter={[16, 16]}>
            {metrics.map((metric, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <SummaryCard
                  title={metric.title}
                  value={metric.value}
                  subtitle={metric.subtitle}
                  icon={metric.icon}
                  color={metric.color}
                  iconBg={metric.iconBg}
                  suffix={metric.suffix}
                  isLoading={loading}
                />
              </Col>
            ))}
          </Row>

          {/* ส่วนที่ 3 : ฟิลเตอร์ข้อมูล (Filter) */}
          <TimesheetFilters
            keyword={keyword}
            onKeywordChange={setKeyword}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            departmentId={departmentId}
            onDepartmentChange={setDepartmentId}
            onRefresh={refetch}
            onClearFilters={() => {
              setKeyword("");
              setDateRange(buildDefaultRange());
              setDepartmentId(null);
            }}
            loading={loading}
          />

          {/* ส่วนที่ 4 : ตารางข้อมูล (Table Content) */}
          <div
            style={{
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorderSecondary}`,
              overflow: "hidden",
            }}
          >
            {/* Table Header with Actions on the right */}
            <Flex
              justify="space-between"
              align="center"
              style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Space size={12}>
                <SolutionOutlined
                  style={{ fontSize: 20, color: token.colorPrimary }}
                />
                <Typography.Title
                  level={5}
                  style={{ margin: 0, fontWeight: 600 }}
                >
                  ตารางสรุปบันทึกเวลาทำงาน
                </Typography.Title>
                {!loading && (
                  <Badge
                    count={filteredRecords.length}
                    style={{ backgroundColor: token.colorInfo }}
                  />
                )}
              </Space>

              <Flex gap={12}>
                <Button
                  icon={<CopyOutlined />}
                  onClick={requestCopyReportToDiscord}
                  shape="round"
                >
                  คัดลอก (Discord)
                </Button>
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={requestOpenAutoFillModal}
                  shape="round"
                >
                  Auto-fill
                </Button>
                <Dropdown menu={{ items: reportMenuItems }}>
                  <Button icon={<FileTextOutlined />} shape="round">
                    รายงานตรวจสอบ <DownOutlined style={{ fontSize: 10 }} />
                  </Button>
                </Dropdown>

                <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]}>
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    loading={exportLoading}
                    shape="round"
                  >
                    ส่งออก Excel <DownOutlined style={{ fontSize: 10 }} />
                  </Button>
                </Dropdown>
              </Flex>
            </Flex>

            {/* Table Area */}
            <div style={{ padding: "0" }}>
              <TimesheetTable
                records={filteredRecords}
                loading={loading}
                metadata={metadata}
                onRefetch={refetch}
                autoFillOpen={modalStates.autoFillModal}
                onAutoFillClose={() => responseCloseModal("autoFillModal")}
              />
            </div>

            {/* Footer Notes */}
            {metadata?.notes && (
              <Flex
                gap={8}
                style={{
                  padding: "16px 24px",
                  background: token.colorFillAlter,
                }}
              >
                <InfoCircleOutlined
                  style={{ color: token.colorInfo, marginTop: 4 }}
                />
                <Text type="secondary" italic style={{ fontSize: 13 }}>
                  {t("timesheet_page.notes_label")}: {metadata.notes}
                </Text>
              </Flex>
            )}
          </div>
        </Flex>

        {/* Modals สำหรับการส่งออกข้อมูล */}
        <ExportModal
          visible={modalStates.exportModal}
          loading={exportLoading}
          onClose={() => responseCloseModal("exportModal")}
          onExport={requestExportTemplate}
          projects={projects}
          subProjects={subProjects}
          users={users}
        />
        <ExportModalByProject
          visible={modalStates.exportModal2}
          loading={exportLoading}
          onClose={() => responseCloseModal("exportModal2")}
          onExport={requestExportTemplate2}
          projects={projects}
          subProjects={subProjects}
          users={users}
        />
        <ExportModalTemplate3
          visible={modalStates.exportModal3}
          loading={exportLoading}
          onClose={() => responseCloseModal("exportModal3")}
          onExport={requestExportTemplate3}
        />
        <ExportModalTemplate4
          visible={modalStates.exportModal4}
          loading={exportLoading}
          onClose={() => responseCloseModal("exportModal4")}
          onExport={requestExportTemplate4}
        />
      </DashboardLayout>
    </PermissionLayout>
  );
}
