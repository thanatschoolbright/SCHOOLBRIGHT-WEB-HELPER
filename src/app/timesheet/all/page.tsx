"use client";

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

const { Title, Text } = Typography;

// ==========================================
// INTERNAL SUB-COMPONENTS (Layout Style)
// ==========================================

const PageHeader = ({ metadata, onRefresh, loading }: any) => (
  <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl ">
    <Space size={16}>
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
        <ClockCircleOutlined style={{ fontSize: 24, color: "#fff" }} />
      </div>
      <div>
        <Title
          level={3}
          style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.5px" }}
        >
          จัดการบันทึกเวลา
        </Title>
        <Text type="secondary" className="text-sm">
          {metadata
            ? `ช่วงวันที่: ${metadata.range.label_th}`
            : "Timesheet Management System"}
        </Text>
      </div>
    </Space>
    <Button
      icon={<ReloadOutlined spin={loading} />}
      onClick={onRefresh}
      size="large"
      shape="round"
      className="shadow-sm"
    >
      รีเฟรชข้อมูล
    </Button>
  </div>
);

const CustomSummaryCards = ({ records, metadata, loading, t }: any) => {
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
      label: "โครงการที่มีส่วนร่วม",
      value: new Set(records?.map((r: any) => r.project_id)).size || 0,
      color: "#f59e0b",
      icon: <ProjectOutlined />,
      desc: "โครงการที่ active",
    },
    {
      label: "พนักงาน",
      value: new Set(records?.map((r: any) => r.admin_id)).size || 0,
      color: "#8b5cf6",
      icon: <TeamOutlined />,
      desc: "จำนวนผู้ส่งงาน",
    },
  ];

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {metrics.map((m, idx) => (
        <Col xs={24} sm={12} md={6} key={idx}>
          <Card className="shadow-sm border-0 rounded-xl overflow-hidden relative h-full">
            <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12">
              <span style={{ fontSize: "6rem", color: m.color }}>{m.icon}</span>
            </div>
            <Flex align="center" gap={16}>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
                style={{ backgroundColor: `${m.color}20`, color: m.color }}
              >
                {m.icon}
              </div>
              <div className="z-10">
                <Text
                  type="secondary"
                  className="block text-xs uppercase font-bold tracking-wider"
                >
                  {m.label}
                </Text>
                <div className="flex items-baseline gap-2">
                  <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                    {loading ? "..." : m.value}
                  </Title>
                </div>
                <Text type="secondary" className="text-xs">
                  {m.desc}
                </Text>
              </div>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

export default function TimesheetAllPage() {
  const { t } = useTranslation("translate");
  const dispatch = useDispatch();

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

  useEffect(() => {
    const allUsers = getUserData();
    if (allUsers) dispatch(setUsers(allUsers));
  }, [dispatch]);

  // Dropdown Menu Items
  const exportMenuItems: MenuProps["items"] = [
    {
      key: "1",
      label: "Export Template 1",
      icon: <FileExcelOutlined className="text-green-500" />,
      onClick: () => handleOpenModal("exportModal"),
    },
    {
      key: "2",
      label: "Export Template 2 (By Project)",
      icon: <FileExcelOutlined className="text-green-500" />,
      onClick: () => handleOpenModal("exportModal2"),
    },
    {
      key: "3",
      label: "Export Template 3",
      icon: <FileExcelOutlined className="text-green-500" />,
      onClick: () => handleOpenModal("exportModal3"),
    },
    {
      key: "4",
      label: "Export Template 4",
      icon: <FileExcelOutlined className="text-green-500" />,
      onClick: () => handleOpenModal("exportModal4"),
    },
    {
      type: "divider",
    },
    {
      key: "all",
      label: "Export All Records",
      icon: <FileTextOutlined className="text-blue-500" />,
      onClick: handleExportAll,
      disabled: exportLoading,
    },
  ];

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <div className="w-full p-4 md:p-6 space-y-6">
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
            t={t}
          />

          {/* 3. Filter & Export Bar */}
          <Card className="border-0 shadow-sm rounded-xl mb-6">
            <Flex vertical gap={20}>
              {/* Export Controls Integrated as Dropdown */}
              <Flex gap={12} wrap="wrap" align="center">
                <Text strong className="mr-2">
                  <ExportOutlined /> {"จัดการรายงาน"}
                </Text>

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
                    className="shadow-sm"
                  >
                    <Space>
                      ส่งออกข้อมูล (Excel)
                      <DownOutlined style={{ fontSize: "12px" }} />
                    </Space>
                  </Button>
                </Dropdown>
              </Flex>

              <Divider style={{ margin: 0, opacity: 0.1 }} />

              {/* Advanced Filter Component */}
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
          </Card>

          {/* 4. Table Card */}
          <Card
            className="shadow-sm rounded-xl border-0 overflow-hidden"
            title={
              <Space size={12}>
                <SolutionOutlined className="text-blue-500" />
                <span>ตารางบันทึกเวลา</span>
                {!loading && (
                  <Badge
                    count={filteredRecords.length}
                    overflowCount={9999}
                    style={{ backgroundColor: "#52c41a" }}
                  />
                )}
              </Space>
            }
          >
            {loading ? (
              <div className="p-10">
                <Skeleton active />
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
              <div className="mt-4 p-3 rounded-lg bg-gray-500 bg-opacity-5 border border-dashed border-gray-500 border-opacity-20">
                <Text type="secondary" className="text-xs italic">
                  <InfoCircleOutlined className="mr-1" />{" "}
                  {t("timesheet_page.notes_label")}: {metadata.notes}
                </Text>
              </div>
            )}
          </Card>
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
