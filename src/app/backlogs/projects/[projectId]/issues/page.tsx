"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Button,
  Layout,
  Space,
  Typography,
  Collapse,
  Input,
  Row,
  Col,
  Card,
  Divider,
} from "antd";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import BulkUpdateSection from "@components/backlog/bulk-update-section";
import IssueFilter from "@components/backlog/issue-filter";
import IssuesTable from "@components/backlog/issues-table";
import type {
  Issue,
  ProjectMetadata,
} from "@components/backlog/issue-drawer/types";
import DashboardLayout from "@/components/layouts/backend-layout";
import {
  resetFilters,
  setFilters,
  setIssues,
  setLoading,
  setOptions,
  setOptionsLoading,
  setSelectedRowKeys,
  setPagination,
} from "@stores/reducers/issues-slice";
import { AppDispatch, RootState, store } from "@stores/store";

const { Content } = Layout;

//** หน้าหลักสำหรับแสดงรายการงานในโปรเจ็กต์ **/
function ProjectIssuesPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  //** การจัดการ State ผ่าน Redux **/
  const {
    page,
    pageSize,
    filters,
    total,
    loading: storeLoading,
  } = useSelector((state: RootState) => state.issues);

  const projectIdParam = params?.projectId;
  const projectId =
    typeof projectIdParam === "string" ? Number(projectIdParam) : NaN;
  const space = searchParams?.get("space") ?? "";
  const projectName = searchParams?.get("name") ?? "";

  const projectReady =
    Number.isFinite(projectId) && projectId > 0 && Boolean(space);

  //** การทำงาน: โหลดรายการงานจาก Backlog API **/
  const LOAD_ISSUES_FUNCTION = useCallback(async () => {
    if (!projectReady) return;

    const toastId = toast.loading("กำลังโหลดงาน...");
    dispatch(setLoading(true));

    try {
      const { keyword, statusIds, priorityIds, issueTypeIds, dateRange } =
        filters;

      const apiParams: Record<string, unknown> = {
        space,
        projectId,
        page,
        count: pageSize,
        offset: Math.max(0, (page - 1) * pageSize),
      };

      if (keyword?.trim()) apiParams.q = keyword.trim();
      if (statusIds?.length) apiParams.statusId = statusIds;
      if (priorityIds?.length) apiParams.priorityId = priorityIds;
      if (issueTypeIds?.length) apiParams.issueTypeId = issueTypeIds;
      if (dateRange?.[0] && dateRange?.[1]) {
        apiParams.updatedSince = dateRange[0].toISOString();
        apiParams.updatedUntil = dateRange[1].toISOString();
      }

      const response = await axios.get("/api/v1/backlog/issues", {
        params: apiParams,
      });
      const items = (response.data?.data?.items as Issue[]) || [];
      const totalItems = Number(response.data?.data?.total) || 0;

      dispatch(setIssues({ issues: items, total: totalItems }));
      dispatch(setSelectedRowKeys([])); // Clear selection on new data load

      toast.success("โหลดงานสำเร็จ", { id: toastId });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "โหลดงานไม่สำเร็จ",
        { id: toastId }
      );
    } finally {
      dispatch(setLoading(false));
    }
  }, [projectReady, space, projectId, page, pageSize, filters, dispatch]);

  //** การทำงาน: โหลดข้อมูลตัวเลือกสำหรับ Filter **/
  const LOAD_OPTIONS_FUNCTION = useCallback(async () => {
    if (!projectReady) return;

    dispatch(setOptionsLoading(true));
    const toastId = toast.loading("กำลังเตรียมข้อมูลประกอบ...");

    try {
      const [statusesRes, prioritiesRes, issueTypesRes] = await Promise.all([
        axios.get("/api/v1/backlog/project-statuses", {
          params: { space, projectId },
        }),
        axios.get("/api/v1/backlog/priorities", { params: { space } }),
        axios.get("/api/v1/backlog/issue-types", {
          params: { space, projectId },
        }),
      ]);

      const statusOptions = (statusesRes?.data?.data || []).map((s: any) => ({
        label: s.name,
        value: s.id,
      }));
      const priorityOptions = (prioritiesRes?.data?.data || []).map(
        (p: any) => ({ label: p.name, value: p.id })
      );
      const issueTypeOptions = (issueTypesRes?.data?.data || []).map(
        (it: any) => ({
          label: it.name,
          value: it.id,
        })
      );

      dispatch(
        setOptions({ statusOptions, priorityOptions, issueTypeOptions })
      );
      const openStatusIds = (statusesRes?.data?.data || [])
        .filter((s: any) => !/closed/i.test(s?.name ?? ""))
        .map((s: any) => s.id);
      dispatch(
        setFilters({
          statusIds: openStatusIds,
          priorityIds: priorityOptions.map((p: { value: any }) => p.value),
          issueTypeIds: issueTypeOptions.map((it: { value: any }) => it.value),
        })
      );

      if (projectId) {
        const metadataRes = await axios.get(
          `/api/v1/backlog/projects/${projectId}/metadata`,
          { params: { space } }
        );
        const metadata = metadataRes?.data?.data as ProjectMetadata;
        const categoryOptions = (metadata.categories || []).map((c) => ({
          label: c.name,
          value: c.id,
        }));
        const milestoneOptions = (metadata.milestones || []).map((m) => ({
          label: m.name,
          value: m.id,
        }));
        dispatch(setOptions({ categoryOptions, milestoneOptions }));
      }

      toast.success("โหลดข้อมูลประกอบสำเร็จ", { id: toastId });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "โหลดข้อมูลประกอบไม่สำเร็จ",
        { id: toastId }
      );
    } finally {
      dispatch(setOptionsLoading(false));
    }
  }, [projectReady, space, projectId, dispatch]);

  useEffect(() => {
    LOAD_OPTIONS_FUNCTION();
  }, [LOAD_OPTIONS_FUNCTION]);

  useEffect(() => {
    LOAD_ISSUES_FUNCTION();
  }, [LOAD_ISSUES_FUNCTION]);

  useEffect(() => {
    dispatch(resetFilters());
  }, [projectId, space, dispatch]);

  if (!projectReady) {
    return (
      <Layout>
        <Content>
          <Space direction="vertical" size={12} align="center">
            <Typography.Title level={3}>
              ไม่พบข้อมูลโปรเจ็กต์หรือ space
            </Typography.Title>
            <Typography.Text type="secondary">
              โปรดกลับไปเลือกโปรเจ็กต์อีกครั้งจากหน้า Backlog
            </Typography.Text>
            <Button
              type="primary"
              onClick={() => router.push("/backlogs/report")}
            >
              กลับไปหน้า Backlog
            </Button>
          </Space>
        </Content>
      </Layout>
    );
  }

  return (
    <DashboardLayout>
      <Layout>
        <Content>
          <Space direction="vertical" size={16}>
            {/* ส่วนหัวของหน้า */}
            <Space align="center" size={12}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
              >
                ย้อนกลับ
              </Button>
              <div>
                <Typography.Title level={3}>
                  งาน • {projectName || projectId}
                </Typography.Title>
                <Typography.Text type="secondary">
                  Space: {space}
                </Typography.Text>
              </div>
            </Space>

            {/* Toolbar: search / actions (outlined card) */}
            <Card size="small" variant="outlined">
              <Row align="middle" justify="space-between">
                <Col>
                  <Space direction="vertical" size={4}>
                    <Typography.Text type="secondary">
                      รวมงานทั้งหมด
                    </Typography.Text>
                    <Typography.Title level={4}>{total ?? 0}</Typography.Title>
                  </Space>
                </Col>

                <Col>
                  <Space>
                    <Input.Search
                      placeholder="ค้นหาคำสำคัญในงาน"
                      allowClear
                      enterButton
                      onSearch={(value: string) => {
                        dispatch(setFilters({ keyword: value }));
                        dispatch(setPagination({ page: 1, pageSize }));
                        LOAD_ISSUES_FUNCTION();
                      }}
                    />
                    <Button
                      onClick={() => {
                        dispatch(resetFilters());
                        LOAD_ISSUES_FUNCTION();
                      }}
                      ghost
                    >
                      รีเซ็ต
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => LOAD_ISSUES_FUNCTION()}
                    >
                      รีเฟรช
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>

            <Divider />

            {/* Component: ตัวกรองข้อมูล (ซ่อน/แสดงได้เหมือน accordion) */}
            <Collapse
              accordion
              defaultActiveKey={["filters"]}
              items={[
                {
                  key: "filters",
                  label: "ตัวกรอง",
                  children: (
                    <IssueFilter
                      onSearch={LOAD_ISSUES_FUNCTION}
                      elevatedCardStyle={{}}
                    />
                  ),
                },
              ]}
            />

            {/* Component: การอัปเดตแบบกลุ่ม (ซ่อน/แสดงได้) */}
            <Collapse
              items={[
                {
                  key: "bulk-update",
                  label: "การอัปเดตแบบกลุ่ม",
                  children: (
                    <BulkUpdateSection
                      elevatedCardStyle={{}}
                      projectName={projectName}
                      projectId={projectId}
                      space={space}
                      onUpdateComplete={LOAD_ISSUES_FUNCTION}
                    />
                  ),
                },
              ]}
            />

            {/* Component: ตารางแสดงรายการงาน (ห่อด้วย Card เพื่อความสวยงาม) */}
            <Card bordered>
              <IssuesTable
                listCardStyle={{}}
                onReload={LOAD_ISSUES_FUNCTION}
                space={space}
              />
            </Card>
          </Space>
        </Content>
      </Layout>
    </DashboardLayout>
  );
}

//** การทำงาน: Provider สำหรับ Redux Store **/
export default function ProjectIssuesPage() {
  return <ProjectIssuesPageContent />;
}
