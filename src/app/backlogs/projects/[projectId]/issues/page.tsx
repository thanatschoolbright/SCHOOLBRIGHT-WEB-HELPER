"use client";

import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  BarChartOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  RobotOutlined,
  RocketOutlined,
  TrophyOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Layout,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import type { HookAPI } from "antd/es/modal/useModal";
import dayjs from "dayjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

// * Redux Actions & State
import {
  resetFilters,
  setFilters,
  setIssues,
  setLoading,
  setOptions,
  setOptionsLoading,
  setPagination,
  setSelectedRowKeys,
} from "@stores/reducers/issues-slice";
import { AppDispatch, RootState } from "@stores/store";

// * Internal Components
import SharedBulkUpdateSection from "@/components/backlog/bulk-update-section";
import type { Issue } from "@/components/backlog/issue-drawer/types";
import IssueFilter from "@/components/backlog/issue-filter";
import IssuesTable from "@/components/backlog/issues-table";
import DashboardLayout from "@/components/layouts/backend-layout";

const { Content } = Layout;

// ==========================================
// * Types Definition
// ==========================================

// ? ข้อมูล Metadata ของโปรเจกต์
type ProjectMetadataResponse = {
  data?: {
    categories?: { id: number | string; name: string }[];
    milestones?: { id: number | string; name: string }[];
  };
};

// ? พารามิเตอร์สำหรับ Hook Data
type IssuesPageParams = {
  projectId: number;
  space: string;
  projectReady: boolean;
  modalApi?: HookAPI;
};

// ==========================================
// * Utilities
// ==========================================

// ! แปลง Error ให้เป็นข้อความที่อ่านง่าย
const buildErrorDetails = (
  error: unknown,
): { message: string; details: string } => {
  if (!error)
    return { message: "ไม่ทราบสาเหตุ", details: "ไม่มีรายละเอียดเพิ่มเติม" };
  if (error instanceof Error)
    return { message: error.message, details: error.stack || error.message };
  if (typeof error === "string") return { message: error, details: error };
  try {
    const json = JSON.stringify(error, null, 2);
    return { message: json, details: json };
  } catch {
    return { message: "เกิดข้อผิดพลาดที่ไม่คาดคิด", details: String(error) };
  }
};

// ==========================================
// * Custom Hooks (Data Logic)
// ==========================================

const useIssuesPageData = ({
  projectId,
  space,
  projectReady,
  modalApi,
}: IssuesPageParams) => {
  const dispatch = useDispatch<AppDispatch>();
  const { page, pageSize, filters, total, loading, issues } = useSelector(
    (state: RootState) => state.issues,
  );

  // * รวมข้อมูล State ที่จำเป็นส่งออกไปใช้งาน
  const state = useMemo(
    () => ({ page, pageSize, filters, total, loading, issues }),
    [filters, loading, page, pageSize, total, issues],
  );

  // ! ฟังก์ชันแสดง Error Modal
  const showErrorModal = useCallback(
    (title: string, error: unknown) => {
      const { message, details } = buildErrorDetails(error);
      const contentNode = (
        <div className="flex flex-col gap-2">
          <span>{message}</span>
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">ดูรายละเอียดทางเทคนิค</summary>
            <pre className="whitespace-pre-wrap text-gray-500 mt-2">
              {details}
            </pre>
          </details>
        </div>
      );
      (modalApi ?? Modal).error({ title, content: contentNode });
    },
    [modalApi],
  );

  // * ฟังก์ชันโหลดรายการ Issues
  const loadIssues = useCallback(async () => {
    if (!projectReady) return;

    const toastId = toast.loading("กำลังโหลดรายการงาน...");
    dispatch(setLoading(true));

    try {
      const {
        keyword,
        statusIds,
        priorityIds,
        issueTypeIds,
        assigneeIds,
        dateRange,
        aiSummaryFilter,
      } = filters;

      // ? เตรียม Params ส่ง API
      const apiParams: Record<string, unknown> = {
        space,
        projectId,
        page,
        count: pageSize,
        offset: Math.max(0, (page - 1) * pageSize),
        q: keyword?.trim(),
        statusId: statusIds?.length ? statusIds : undefined,
        priorityId: priorityIds?.length ? priorityIds : undefined,
        issueTypeId: issueTypeIds?.length ? issueTypeIds : undefined,
        assigneeId: assigneeIds?.length ? assigneeIds : undefined,
        updatedSince: dateRange?.[0]?.toISOString(),
        updatedUntil: dateRange?.[1]?.toISOString(),
      };

      const response = await axios.get("/api/v1/backlog/issues", {
        params: apiParams,
      });
      let items = response.data?.data?.items || [];
      const totalItems = Number(response.data?.data?.total) || 0;

      // * Client-side Filtering สำหรับ AI Summary
      if (aiSummaryFilter === "with_ai") {
        items = items.filter(
          (issue: any) =>
            issue.summary?.includes("AI") || issue.description?.includes("AI"),
        );
      } else if (aiSummaryFilter === "without_ai") {
        items = items.filter(
          (issue: any) =>
            !issue.summary?.includes("AI") &&
            !issue.description?.includes("AI"),
        );
      }

      dispatch(setIssues({ issues: items, total: totalItems }));
      dispatch(setSelectedRowKeys([]));
      toast.success("โหลดข้อมูลสำเร็จ", { id: toastId });
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล", { id: toastId });
      showErrorModal("ไม่สามารถโหลดรายการงานได้", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [
    dispatch,
    filters,
    page,
    pageSize,
    projectId,
    projectReady,
    space,
    showErrorModal,
  ]);

  // * ฟังก์ชันโหลด Options (สถานะ, ผู้รับผิดชอบ ฯลฯ)
  const loadOptions = useCallback(async () => {
    if (!projectReady) return;

    dispatch(setOptionsLoading(true));
    const toastId = toast.loading("กำลังเตรียมข้อมูลเริ่มต้น...");

    try {
      // ? ยิง API พร้อมกันเพื่อความเร็ว
      const [statusesRes, prioritiesRes, issueTypesRes, usersRes] =
        await Promise.all([
          axios.get("/api/v1/backlog/project-statuses", {
            params: { space, projectId },
          }),
          axios.get("/api/v1/backlog/priorities", { params: { space } }),
          axios.get("/api/v1/backlog/issue-types", {
            params: { space, projectId },
          }),
          axios.get("/api/v1/backlog/users", { params: { space, projectId } }),
        ]);

      const mapOption = (list: any[]) =>
        list?.map((item: any) => ({ label: item.name, value: item.id })) || [];

      // ? Setup ตัวเลือกต่าง ๆ เข้า Redux
      const statusOptions = mapOption(statusesRes?.data?.data);
      const priorityOptions = mapOption(prioritiesRes?.data?.data);
      const issueTypeOptions = mapOption(issueTypesRes?.data?.data);
      const assigneeOptions = mapOption(usersRes?.data?.data);

      dispatch(
        setOptions({
          statusOptions,
          priorityOptions,
          issueTypeOptions,
          assigneeOptions,
        }),
      );

      // ? ตั้งค่า Filter เริ่มต้น (เลือกสถานะที่ไม่ใช่ Closed)
      const openStatusIds = (statusesRes?.data?.data || [])
        .filter((s: any) => !/closed/i.test(s?.name ?? ""))
        .map((s: any) => s.id);

      dispatch(
        setFilters({
          statusIds: openStatusIds,
          priorityIds: priorityOptions
            .map((p: any) => Number(p.value))
            .filter((v: number) => !isNaN(v)),
          issueTypeIds: issueTypeOptions
            .map((it: any) => Number(it.value))
            .filter((v: number) => !isNaN(v)),
        }),
      );

      // ? โหลด Metadata เพิ่มเติมถ้ามี ProjectId
      if (projectId) {
        const metadataRes = await axios.get<ProjectMetadataResponse>(
          `/api/v1/backlog/projects/${projectId}/metadata`,
          { params: { space } },
        );
        const metadata = metadataRes?.data?.data;
        dispatch(
          setOptions({
            categoryOptions: mapOption(metadata?.categories || []),
            milestoneOptions: mapOption(metadata?.milestones || []),
          }),
        );
      }

      toast.success("เตรียมข้อมูลสำเร็จ", { id: toastId });
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลเริ่มต้นได้", { id: toastId });
      showErrorModal("เกิดข้อผิดพลาดในการเตรียมข้อมูล", error);
    } finally {
      dispatch(setOptionsLoading(false));
    }
  }, [dispatch, projectReady, projectId, space, showErrorModal]);

  const handleSearchKeyword = useCallback(
    (value: string) => {
      dispatch(setFilters({ keyword: value }));
      dispatch(setPagination({ page: 1, pageSize }));
    },
    [dispatch, pageSize],
  );

  return {
    state,
    loadIssues,
    loadOptions,
    handleSearchKeyword,
    resetAction: () => dispatch(resetFilters()),
  };
};

// ==========================================
// * Sub-Components (UI Views)
// ==========================================

// ? ส่วนหัวของหน้า (Header)
function HeaderSection({
  title,
  subtitle,
  onBack,
  onClickSummary,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  onClickSummary: () => void;
}) {
  return (
    <div className="flex justify-between items-center w-full mb-4">
      <Space align="center" size={16}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          size="large"
          shape="circle"
          className="shadow-sm border-0"
        />
        <div className="flex flex-col">
          <Typography.Title
            level={3}
            style={{ margin: 0, fontWeight: 700 }}
            className="flex items-center gap-2"
          >
            <RocketOutlined className="text-blue-600" /> {title}
          </Typography.Title>
          <Typography.Text type="secondary" className="flex items-center gap-1">
            <AppstoreOutlined /> {subtitle}
          </Typography.Text>
        </div>
      </Space>
      <Button
        icon={<BarChartOutlined />}
        onClick={onClickSummary}
        size="large"
        type="primary"
        className="bg-gradient-to-r from-blue-600 to-cyan-500 border-0 shadow-lg hover:shadow-xl transition-all"
      >
        รายงานสรุปผลงาน
      </Button>
    </div>
  );
}

// ? การ์ดแสดงสถิติเบื้องต้น (Summary Cards)
function SummaryCards({
  total,
  space,
  projectName,
}: {
  total: number;
  space: string;
  projectName: string;
}) {
  const { token } = theme.useToken();
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          bordered={false}
          style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
            boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
          }}
          className="hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="flex items-center justify-between p-4 text-white">
            <div>
              <Typography.Text className="text-white/90 font-medium block mb-1">
                จำนวนงานทั้งหมด
              </Typography.Text>
              <Typography.Title
                level={2}
                style={{ margin: 0, color: "white", fontWeight: 800 }}
              >
                {total?.toLocaleString() ?? 0}
              </Typography.Title>
              <div className="mt-2 text-xs text-white/80 bg-white/20 px-2 py-1 rounded inline-block">
                รายการที่พบในระบบ
              </div>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <FileTextOutlined style={{ fontSize: 32, color: "white" }} />
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          bordered={false}
          style={{
            borderRadius: 20,
            boxShadow: token.boxShadowTertiary as string,
          }}
          className="hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="flex items-center justify-between p-4">
            <Space direction="vertical" size={2}>
              <Typography.Text type="secondary" className="font-medium">
                รหัสพื้นที่ทำงาน
              </Typography.Text>
              <Typography.Title
                level={4}
                style={{ margin: 0, fontWeight: 700 }}
              >
                {space || "-"}
              </Typography.Title>
              <Tag color="geekblue" className="mt-1 border-0">
                พื้นที่จัดเก็บ
              </Tag>
            </Space>
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-500">
              <AppstoreOutlined style={{ fontSize: 24 }} />
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          bordered={false}
          style={{
            borderRadius: 20,
            boxShadow: token.boxShadowTertiary as string,
          }}
          className="hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="flex items-center justify-between p-4">
            <Space direction="vertical" size={2}>
              <Typography.Text type="secondary" className="font-medium">
                ชื่อโปรเจกต์
              </Typography.Text>
              <Typography.Title
                level={4}
                style={{ margin: 0, fontWeight: 700 }}
              >
                {projectName || "-"}
              </Typography.Title>
              <Tag color="cyan" className="mt-1 border-0">
                โปรเจกต์ที่ใช้งานอยู่
              </Tag>
            </Space>
            <div className="bg-cyan-50 p-4 rounded-2xl text-cyan-500">
              <ProjectOutlined style={{ fontSize: 24 }} />
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}

// ? แถบเครื่องมือ Actions (Filter / Bulk Update)
function ActionToolbar({
  onOpenFilter,
  onOpenBulk,
  activeFilterCount,
}: {
  onOpenFilter: () => void;
  onOpenBulk: () => void;
  activeFilterCount: number;
}) {
  return (
    <Card
      size="small"
      style={{ borderRadius: 16 }}
      bodyStyle={{ padding: "12px 16px" }}
      className="shadow-sm"
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col>
          <Space>
            {/* Filter Button */}
            <Tooltip
              title={
                <Space direction="vertical" size={0}>
                  <span>คลิกเพื่อเปิด "ตัวกรองขั้นสูง"</span>
                  <span className="text-xs text-gray-300">
                    ค้นหาตามสถานะ, ผู้รับผิดชอบ ฯลฯ
                  </span>
                </Space>
              }
            >
              <Button
                type={activeFilterCount > 0 ? "primary" : "default"}
                icon={<FilterOutlined />}
                onClick={onOpenFilter}
                size="middle"
                className="flex items-center gap-1"
              >
                ตัวกรองข้อมูล
                {activeFilterCount > 0 && (
                  <Badge
                    count={activeFilterCount}
                    style={{ backgroundColor: "#52c41a", marginLeft: 4 }}
                  />
                )}
              </Button>
            </Tooltip>

            {/* Help / Info */}
            <Tooltip title="ระบบจะแสดงรายการงานล่าสุดตามเงื่อนไขที่เลือก">
              <Button
                type="text"
                icon={<InfoCircleOutlined className="text-gray-400" />}
              />
            </Tooltip>
          </Space>
        </Col>

        <Col>
          {/* Bulk Update Button */}
          <Tooltip
            title={
              <Space direction="vertical" size={0}>
                <span>คลิกเพื่อเปิด "อัปเดตหลายรายการ"</span>
                <span className="text-xs text-gray-300">
                  จัดการงานทีละหลายรายการพร้อมกัน
                </span>
              </Space>
            }
          >
            <Button
              type="dashed"
              icon={<AppstoreAddOutlined />}
              onClick={onOpenBulk}
              className="text-blue-600 border-blue-300 hover:border-blue-500 hover:text-blue-700"
            >
              จัดการข้อมูลหลายรายการ (Bulk Action)
            </Button>
          </Tooltip>
        </Col>
      </Row>
    </Card>
  );
}

// ? Modal สำหรับตัวกรอง
function FilterModal({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}) {
  return (
    <Modal
      title={
        <span className="text-lg font-bold">
          <FilterOutlined /> ตัวกรองข้อมูล (Filters)
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          ปิดหน้าต่าง
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={() => {
            onSearch();
            onClose();
          }}
        >
          ค้นหาเลย
        </Button>,
      ]}
      width={1000}
      centered
      destroyOnHidden
    >
      <div className="pt-4">
        <IssueFilter
          onSearch={onSearch}
          elevatedCardStyle={{
            boxShadow: "none",
            border: "1px solid #f0f0f0",
            borderRadius: 12,
          }}
        />
      </div>
    </Modal>
  );
}

// ? Modal สำหรับ Bulk Update
function BulkUpdateModal({
  open,
  onClose,
  projectName,
  projectId,
  space,
  onUpdateComplete,
  minimized,
  onRequestMinimize,
  onProgress,
}: {
  open: boolean;
  onClose: () => void;
  projectName: string;
  projectId: number;
  space: string;
  onUpdateComplete: () => void;
  minimized: boolean;
  onRequestMinimize: () => void;
  onProgress: (p: any) => void;
}) {
  return (
    <Modal
      title={null}
      // If minimized, we keep 'open' true but hide via CSS to keep state alive
      open={open}
      // Mask false when minimized to allow interacting with page
      mask={!minimized}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      destroyOnHidden={false} // ! Keep mounted
      maskClosable={!minimized}
      wrapClassName={minimized ? "hidden" : ""}
      style={{ display: minimized ? "none" : undefined }}
    >
      {/* Use a wrapper div to ensure content persists */}
      <div className="pt-2">
        <SharedBulkUpdateSection
          elevatedCardStyle={{
            boxShadow: "none",
            border: "1px solid #f0f0f0",
            borderRadius: 8,
          }}
          projectName={projectName}
          projectId={projectId}
          space={space}
          onUpdateComplete={() => {
            onUpdateComplete();
            onClose();
          }}
          onRequestMinimize={onRequestMinimize}
          onProgressUpdate={onProgress}
          minimized={minimized}
        />
      </div>
    </Modal>
  );
}

// ? หน้าจอ Error
function FallbackError({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex h-[80vh] items-center justify-center bg-gray-50/50">
      <Card
        bordered={false}
        className="shadow-2xl text-center p-12"
        style={{ borderRadius: 32, width: 500 }}
      >
        <Space
          direction="vertical"
          size={32}
          align="center"
          style={{ width: "100%" }}
        >
          <div className="bg-red-50 p-8 rounded-full">
            <WarningOutlined style={{ fontSize: 64, color: "#ff4d4f" }} />
          </div>
          <div>
            <Typography.Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              ข้อมูลไม่ครบถ้วน
            </Typography.Title>
            <Typography.Text
              type="secondary"
              className="block mt-4 text-gray-500 text-lg"
            >
              ไม่พบรหัสโครงการ (Project ID) หรือ Space Key <br />
              กรุณาเข้าใช้งานใหม่ผ่านหน้าหลัก
            </Typography.Text>
          </div>
          <Button
            type="primary"
            size="large"
            onClick={onAction}
            icon={<ArrowLeftOutlined />}
            style={{ height: 48, borderRadius: 24 }}
          >
            กลับไปหน้าหลัก
          </Button>
        </Space>
      </Card>
    </div>
  );
}

// ? Modal รายงานสรุป
function IssueSummaryModal({
  open,
  onClose,
  issues,
  total,
}: {
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  total: number;
}) {
  const { assigneeStats, overallStats } = useMemo(() => {
    const stats: Record<string, any> = {};
    let totalOverdue = 0,
      totalClosed = 0;

    issues.forEach((issue) => {
      const assigneeName = issue.assignee?.name || "Unassigned";
      if (!stats[assigneeName])
        stats[assigneeName] = {
          name: assigneeName,
          total: 0,
          closed: 0,
          open: 0,
          overdue: 0,
          issueTypes: {},
          score: 0,
        };
      const s = stats[assigneeName];
      s.total++;
      const isClosed = ["closed", "done", "completed", "finish"].some((st) =>
        issue.status?.name?.toLowerCase().includes(st),
      );
      if (isClosed) {
        s.closed++;
        totalClosed++;
      } else {
        s.open++;
      }
      if (
        !isClosed &&
        issue.dueDate &&
        dayjs(issue.dueDate).isBefore(dayjs(), "day")
      ) {
        s.overdue++;
        totalOverdue++;
      }
      const typeName = issue.issueType?.name || "Other";
      s.issueTypes[typeName] = (s.issueTypes[typeName] || 0) + 1;
    });

    const computedStats = Object.values(stats).map((s: any) => {
      const completionRate = s.total > 0 ? (s.closed / s.total) * 100 : 0;
      let score = completionRate - s.overdue * 5;
      if (s.total >= 5 && s.overdue === 0) score += 10;
      return { ...s, score: Math.max(0, Math.min(100, Math.round(score))) };
    });

    return {
      assigneeStats: computedStats.sort((a: any, b: any) => b.score - a.score),
      overallStats: {
        totalLoaded: issues.length,
        totalClosed,
        totalOverdue,
        completionRate:
          issues.length > 0
            ? Math.round((totalClosed / issues.length) * 100)
            : 0,
      },
    };
  }, [issues]);

  const topPerformer = assigneeStats[0];
  const getScoreColor = (score: number) =>
    score >= 80 ? "#52c41a" : score >= 50 ? "#1890ff" : "#ff4d4f";
  const getIssueTypeIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("bug")) return <BugOutlined />;
    if (lower.includes("task")) return <CheckCircleOutlined />;
    return <FileTextOutlined />;
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 py-2">
          <div className="bg-yellow-100 p-2 rounded-lg">
            <TrophyOutlined style={{ color: "#faad14", fontSize: 24 }} />
          </div>
          <div>
            <Typography.Text strong style={{ fontSize: 18, display: "block" }}>
              รายงานสรุปผลงานทีม
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Team Performance Report
            </Typography.Text>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      footer={null}
      destroyOnHidden
      style={{ top: 20 }}
      centered
    >
      <Space direction="vertical" size="large" className="w-full mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card variant="borderless" className="shadow-sm bg-blue-50/50">
            <Statistic
              title={
                <span className="font-semibold text-blue-800">งานทั้งหมด</span>
              }
              value={overallStats.totalLoaded}
              suffix={`/ ${total}`}
              prefix={
                <ClockCircleOutlined className="text-blue-500 text-2xl mr-2" />
              }
              valueStyle={{ color: "#1890ff", fontWeight: 700 }}
            />
          </Card>
          <Card variant="borderless" className="shadow-sm bg-green-50/50">
            <Statistic
              title={
                <span className="font-semibold text-green-800">สำเร็จ</span>
              }
              value={overallStats.completionRate}
              suffix="%"
              prefix={
                <CheckCircleOutlined className="text-green-500 text-2xl mr-2" />
              }
              valueStyle={{ color: "#52c41a", fontWeight: 700 }}
            />
            <Progress
              percent={overallStats.completionRate}
              showInfo={false}
              strokeColor="#52c41a"
              size="small"
              className="mt-2"
            />
          </Card>
          <Card variant="borderless" className="shadow-sm bg-red-50/50">
            <Statistic
              title={<span className="font-semibold text-red-800">ล่าช้า</span>}
              value={overallStats.totalOverdue}
              prefix={
                <WarningOutlined className="text-red-500 text-2xl mr-2" />
              }
              valueStyle={{ color: "#ff4d4f", fontWeight: 700 }}
            />
          </Card>
          <Card variant="borderless" className="shadow-sm bg-amber-50/50">
            <Statistic
              title={
                <span className="font-semibold text-amber-800">
                  Top Performer
                </span>
              }
              value={topPerformer?.name || "-"}
              prefix={
                <TrophyOutlined className="text-amber-500 text-2xl mr-2" />
              }
              valueStyle={{ color: "#d48806", fontWeight: 700, fontSize: 18 }}
            />
            {topPerformer && (
              <Tag color="gold" className="mt-2 font-bold">
                Score: {topPerformer.score}
              </Tag>
            )}
          </Card>
        </div>
        <Card
          title="ประสิทธิภาพรายบุคคล (Individual Performance)"
          className="shadow-sm rounded-xl"
        >
          <Table
            dataSource={assigneeStats}
            rowKey="name"
            pagination={{ pageSize: 5 }}
            size="middle"
            columns={[
              {
                title: "อันดับ",
                key: "rank",
                width: 80,
                align: "center",
                render: (_, __, i) =>
                  i < 3 ? (
                    <TrophyOutlined
                      style={{
                        color: ["#FFD700", "#C0C0C0", "#CD7F32"][i],
                        fontSize: 24,
                      }}
                    />
                  ) : (
                    <span className="text-gray-400 font-bold text-lg">
                      {i + 1}
                    </span>
                  ),
              },
              {
                title: "ชื่อ",
                dataIndex: "name",
                key: "name",
                render: (text) => (
                  <Space>
                    <Avatar
                      style={{ backgroundColor: "#1890ff" }}
                      icon={<UserOutlined />}
                      size="default"
                    />
                    <Typography.Text strong>{text}</Typography.Text>
                  </Space>
                ),
              },
              {
                title: "คะแนน",
                dataIndex: "score",
                key: "score",
                align: "center",
                render: (score) => (
                  <div className="text-center bg-gray-50 rounded-lg p-1">
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color: getScoreColor(score),
                      }}
                    >
                      {score}
                    </span>
                  </div>
                ),
              },
              {
                title: "จำนวนงาน",
                dataIndex: "total",
                align: "center",
                render: (val) => <Tag>{val}</Tag>,
              },
              {
                title: "ล่าช้า",
                dataIndex: "overdue",
                align: "center",
                render: (val) =>
                  val > 0 ? (
                    <Tag color="error">{val}</Tag>
                  ) : (
                    <CheckCircleOutlined className="text-green-500" />
                  ),
              },
            ]}
          />
        </Card>
      </Space>
    </Modal>
  );
}

// ==========================================
// * Main Page Component
// ==========================================

function ProjectIssuesPageContent(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [modalApi, contextHolder] = Modal.useModal();
  const [showSummary, setShowSummary] = useState(false);

  // * State สำหรับ Modal ของ Filter และ Bulk Update
  const [showFilter, setShowFilter] = useState(false);

  // * State for Bulk Update (Minimize Logic)
  const [showBulk, setShowBulk] = useState(false);
  const [isBulkMinimized, setIsBulkMinimized] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    percent: number;
    status: string;
    success: number;
    total: number;
  }>({
    percent: 0,
    status: "idle",
    success: 0,
    total: 0,
  });

  // * Extract Parameters
  const projectId = Number(params?.projectId);
  const space = searchParams?.get("space") ?? "";
  const projectName = searchParams?.get("name") ?? "";
  const projectReady = !isNaN(projectId) && projectId > 0 && !!space;

  // * Use Custom Hook logic
  const { state, loadIssues, loadOptions, resetAction } = useIssuesPageData({
    projectId,
    space,
    projectReady,
    modalApi,
  });

  // ? Initial Data Load
  useEffect(() => {
    if (!projectReady) return;
    loadOptions().then(() => loadIssues());
    return () => {
      resetAction();
    };
  }, [projectReady, projectId, space]);

  if (!projectReady)
    return <FallbackError onAction={() => router.push("/backlogs/report")} />;

  // คำนวณจำนวน Filter ที่ใช้อยู่เพื่อแสดง Badge
  const activeFilterCount = Object.values(state.filters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : !!v,
  ).length;

  return (
    <DashboardLayout>
      {contextHolder}
      <Layout className="bg-transparent">
        <Content>
          <Space direction="vertical" size={20} className="w-full">
            {/* 1. ส่วนหัว */}
            <HeaderSection
              title={projectName || `Project ${projectId}`}
              subtitle={`Space: ${space}`}
              onBack={() => router.back()}
              onClickSummary={() => setShowSummary(true)}
            />

            {/* 2. การ์ดสรุปข้อมูล */}
            <SummaryCards
              total={state.total}
              space={space}
              projectName={projectName}
            />

            {/* 3. Action Toolbar (Minimal) */}
            <ActionToolbar
              onOpenFilter={() => setShowFilter(true)}
              onOpenBulk={() => {
                setShowBulk(true);
                setIsBulkMinimized(false);
              }}
              activeFilterCount={activeFilterCount}
            />

            {/* 4. ตารางแสดงข้อมูล */}
            <Card
              variant="outlined"
              title={
                <span className="font-bold text-lg">
                  <FileTextOutlined className="text-blue-500 mr-2" /> รายการงาน
                  (Issues List)
                </span>
              }
              style={{ borderRadius: 16 }}
              className="shadow-sm"
              extra={
                <Tag
                  color={state.loading ? "processing" : "success"}
                  icon={
                    state.loading ? (
                      <Spin indicator={<ClockCircleOutlined spin />} />
                    ) : (
                      <CheckCircleOutlined />
                    )
                  }
                >
                  {state.loading ? "กำลังโหลดข้อมูล..." : "ข้อมูลล่าสุด"}
                </Tag>
              }
            >
              <IssuesTable
                listCardStyle={{}}
                onReload={loadIssues}
                space={space}
              />
            </Card>
          </Space>
        </Content>
      </Layout>

      {/* Modals Popup (Filtered & Bulk) */}
      <IssueSummaryModal
        open={showSummary}
        onClose={() => setShowSummary(false)}
        issues={state.issues || []}
        total={state.total}
      />
      <FilterModal
        open={showFilter}
        onClose={() => setShowFilter(false)}
        onSearch={loadIssues}
      />

      {/* Bulk Update Modal with Minimize capability */}
      <BulkUpdateModal
        open={showBulk} // Keep open true even if minimized (we hide via CSS)
        onClose={() => {
          setShowBulk(false);
          setIsBulkMinimized(false);
        }}
        projectName={projectName}
        projectId={projectId}
        space={space}
        onUpdateComplete={loadIssues}
        minimized={isBulkMinimized}
        onRequestMinimize={() => setIsBulkMinimized(true)}
        onProgress={setBulkProgress}
      />

      {/* Floating Animated AI Widget */}
      {isBulkMinimized && showBulk && (
        <>
          <style jsx global>{`
            @keyframes ai-glow {
              0% {
                box-shadow:
                  0 0 10px rgba(24, 144, 255, 0.5),
                  0 0 20px rgba(139, 92, 246, 0.3);
                transform: scale(1);
              }
              50% {
                box-shadow:
                  0 0 25px rgba(24, 144, 255, 0.8),
                  0 0 40px rgba(139, 92, 246, 0.6);
                transform: scale(1.02);
              }
              100% {
                box-shadow:
                  0 0 10px rgba(24, 144, 255, 0.5),
                  0 0 20px rgba(139, 92, 246, 0.3);
                transform: scale(1);
              }
            }
            @keyframes ai-spin-slow {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
            .ai-widget-container {
              position: fixed;
              bottom: 40px;
              right: 40px;
              z-index: 1000;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .ai-widget-glass {
              background: rgba(255, 255, 255, 0.85);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.5);
              border-radius: 24px;
              padding: 12px 20px 12px 16px;
              display: flex;
              align-items: center;
              gap: 12px;
              box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
              animation: ai-glow 3s infinite ease-in-out;
            }
            .ai-icon-wrapper {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            .ai-icon-ring {
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              border: 2px solid transparent;
              border-top-color: #fff;
              border-left-color: rgba(255, 255, 255, 0.5);
              animation: ai-spin-slow 2s linear infinite;
            }
          `}</style>

          <div
            className="ai-widget-container"
            onClick={() => setIsBulkMinimized(false)}
          >
            <div className="ai-widget-glass">
              {/* Icon Section */}
              <div className="ai-icon-wrapper">
                {bulkProgress.status === "completed" ? (
                  <CheckCircleOutlined
                    style={{ color: "white", fontSize: 24 }}
                  />
                ) : bulkProgress.status === "error" ? (
                  <WarningOutlined style={{ color: "white", fontSize: 24 }} />
                ) : (
                  <>
                    <div className="ai-icon-ring" />
                    <RobotOutlined style={{ color: "white", fontSize: 22 }} />
                  </>
                )}
              </div>

              {/* Text Section */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontWeight: 700,
                      background: "linear-gradient(90deg, #2563eb, #7c3aed)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      fontSize: 16,
                    }}
                  >
                    {bulkProgress.status === "completed"
                      ? "ประมวลผลเสร็จสิ้น"
                      : bulkProgress.status === "error"
                        ? "เกิดข้อผิดพลาด"
                        : "Gemini AI Processing"}
                  </span>
                  {bulkProgress.status === "processing" && (
                    <Tag
                      color="processing"
                      className="m-0 border-0 bg-blue-100 text-blue-600 font-bold rounded-full px-2 text-xs"
                    >
                      {bulkProgress.percent}%
                    </Tag>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {bulkProgress.status === "completed"
                    ? "คลิกเพื่อดูผลลัพธ์"
                    : bulkProgress.status === "error"
                      ? "คลิกเพื่อตรวจสอบ"
                      : `กำลังวิเคราะห์ข้อมูล ${bulkProgress.success}/${bulkProgress.total}`}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

// * Entry Point
export default function ProjectIssuesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <Card
            style={{ borderRadius: 24, padding: 32 }}
            className="shadow-lg text-center"
          >
            <Space direction="vertical" size="large">
              <Spin size="large" />
              <Typography.Text className="text-gray-500">
                กำลังเตรียมข้อมูล...
              </Typography.Text>
            </Space>
          </Card>
        </div>
      }
    >
      <ProjectIssuesPageContent />
    </Suspense>
  );
}
