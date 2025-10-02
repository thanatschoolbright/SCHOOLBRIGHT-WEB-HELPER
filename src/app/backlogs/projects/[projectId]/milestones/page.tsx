"use client";

import axios from "axios";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Layout,
  Row,
  Skeleton,
  Space,
  Switch,
  Typography,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

import MilestoneCard from "@components/backlog/milestones/milestone-card";
import type {
  Milestone,
  MilestoneFormValues,
} from "@components/backlog/issue-drawer/types";

const { Content, Sider } = Layout;

const DATE_FORMAT = "YYYY-MM-DD";

export default function MilestoneManagerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const space = searchParams?.get("space") ?? "";
  const projectIdParam = params?.projectId;
  const projectId = typeof projectIdParam === "string" ? Number(projectIdParam) : NaN;

  const [form] = Form.useForm<MilestoneFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const isValidProject = useMemo(() => Number.isFinite(projectId) && projectId > 0, [projectId]);

  //** ดึงรายการไมล์สโตนพร้อมสถานะโหลดผ่าน toast **
  const loadMilestones = useCallback(
    async (showToast = true) => {
      if (!isValidProject || !space) return;
      const toastId = showToast ? toast.loading("กำลังโหลดไมล์สโตน...") : undefined;
      setLoading(true);
      try {
        const response = await axios.get(`/api/v1/backlog/projects/${projectId}/milestones`, {
          params: { space },
        });
        setMilestones((response.data?.data as Milestone[]) ?? []);
        if (toastId !== undefined) {
          toast.success("โหลดไมล์สโตนสำเร็จ", { id: toastId });
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || error?.message || "โหลดรายการไมล์สโตนไม่สำเร็จ";
        if (toastId !== undefined) {
          toast.error(errorMessage, { id: toastId });
        } else {
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [isValidProject, projectId, space]
  );

  useEffect(() => {
    if (!isValidProject || !space) return;

    loadMilestones();
  }, [isValidProject, loadMilestones, space]);

  //** ปุ่มรีเฟรชเพื่อดึงข้อมูลไมล์สโตนล่าสุด **
  const handleRefresh = async () => {
    await loadMilestones();
  };

  useEffect(() => {
    form.setFieldsValue({ archived: false });
  }, [form]);

  //** รีเซ็ตฟอร์มให้พร้อมสร้างหรือแก้ไขใหม่ **
  const resetForm = () => {
    setEditingMilestone(null);
    form.resetFields();
    form.setFieldsValue({ archived: false });
  };

  //** เปิดฟอร์มแก้ไขไมล์สโตนที่เลือก **
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    form.setFieldsValue({
      name: milestone.name,
      description: milestone.description ?? "",
      startDate: milestone.startDate ? dayjs(milestone.startDate) : null,
      releaseDueDate: milestone.releaseDueDate ? dayjs(milestone.releaseDueDate) : null,
      archived: Boolean(milestone.archived),
    });
  };

  //** บันทึกการสร้าง/แก้ไขไมล์สโตนผ่าน API **
  const persistMilestone = async (values: MilestoneFormValues) => {
    if (!isValidProject || !space) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      archived: values.archived,
      description: values.description,
      name: values.name,
      releaseDueDate: values.releaseDueDate ? values.releaseDueDate.format(DATE_FORMAT) : null,
      startDate: values.startDate ? values.startDate.format(DATE_FORMAT) : null,
    };

    const toastId = toast.loading(
      editingMilestone ? "กำลังอัปเดตไมล์สโตน..." : "กำลังสร้างไมล์สโตน..."
    );

    try {
      if (editingMilestone) {
        await axios.patch(
          `/api/v1/backlog/projects/${projectId}/milestones/${editingMilestone.id}`,
          payload,
          { params: { space } }
        );
        toast.success("อัปเดตไมล์สโตนสำเร็จ", { id: toastId });
      } else {
        await axios.post(`/api/v1/backlog/projects/${projectId}/milestones`, payload, {
          params: { space },
        });
        toast.success("สร้างไมล์สโตนสำเร็จ", { id: toastId });
      }
      resetForm();
      await loadMilestones();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || "บันทึกไมล์สโตนไม่สำเร็จ";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  //** ลบไมล์สโตนพร้อมแจ้งสถานะผู้ใช้ **
  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!isValidProject || !space) return;
    setDeletingId(milestoneId);
    const toastId = toast.loading("กำลังลบไมล์สโตน...");
    try {
      await axios.delete(`/api/v1/backlog/projects/${projectId}/milestones/${milestoneId}`, {
        params: { space },
      });
      toast.success("ลบไมล์สโตนสำเร็จ", { id: toastId });
      if (editingMilestone?.id === milestoneId) {
        resetForm();
      }
      await loadMilestones();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || "ลบไมล์สโตนไม่สำเร็จ";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  const pageHeader = editingMilestone ? "แก้ไขไมล์สโตน" : "เพิ่มไมล์สโตนใหม่";

  return (
    <Layout style={{ minHeight: "100vh", background: "#f6f8fb" }}>
      <Sider
        width={360}
        style={{
          background: "#ffffff",
          borderRight: "1px solid #eef0f4",
          padding: 24,
        }}
      >
        <Typography.Title level={4} style={{ marginBottom: 16 }}>
          {pageHeader}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          กรอกข้อมูลไมล์สโตนเพื่อใช้งานร่วมกับ Backlog และการอัปเดตแบบกลุ่ม
        </Typography.Paragraph>
        <Form
          form={form}
          layout="vertical"
          onFinish={persistMilestone}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Form.Item
            label="ชื่อไมล์สโตน"
            name="name"
            rules={[{ required: true, message: "กรุณาระบุชื่อไมล์สโตน" }]}
          >
            <Input placeholder="เช่น Sprint 01" />
          </Form.Item>
          <Form.Item label="รายละเอียด" name="description">
            <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
          </Form.Item>
          <Row gutter={12} wrap>
            <Col span={12}>
              <Form.Item label="วันเริ่ม" name="startDate">
                <DatePicker
                  allowClear
                  format={DATE_FORMAT}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="วันกำหนดส่ง" name="releaseDueDate">
                <DatePicker
                  allowClear
                  format={DATE_FORMAT}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="สถานะ"
            name="archived"
            valuePropName="checked"
          >
            <Switch checkedChildren="ปิดใช้งาน" unCheckedChildren="ใช้งาน" />
          </Form.Item>
          <Space size={12}>
            <Button htmlType="submit" loading={saving} type="primary">
              {editingMilestone ? "บันทึกการแก้ไข" : "เพิ่มไมล์สโตน"}
            </Button>
            {editingMilestone && (
              <Button onClick={resetForm} disabled={saving}>
                ยกเลิกการแก้ไข
              </Button>
            )}
          </Space>
        </Form>
      </Sider>
      <Layout>
        <Content style={{ padding: 32 }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              size="large"
              type="text"
              style={{ alignSelf: "flex-start" }}
            >
              ย้อนกลับ
            </Button>
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              รายการไมล์สโตน
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              จัดเรียงรายการไมล์สโตนสำหรับโปรเจ็กต์และอัปเดตสถานะได้จากหน้านี้โดยตรง
            </Typography.Paragraph>

            <Card
              bodyStyle={{ padding: 24 }}
              style={{
                background: "#ffffff",
                border: "1px solid #eef0f4",
                borderRadius: 22,
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.05)",
              }}
              title="ไมล์สโตนทั้งหมด"
            >
              {loading ? (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={`milestone-skeleton-${index}`} active paragraph={{ rows: 2 }} />
                  ))}
                </Space>
              ) : milestones.length ? (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {milestones.map((item) => (
                    <MilestoneCard
                      key={item.id}
                      deleting={deletingId === item.id}
                      milestone={item}
                      onDelete={handleDeleteMilestone}
                      onEdit={handleEditMilestone}
                    />
                  ))}
                </Space>
              ) : (
                <Empty
                  description="ยังไม่มีไมล์สโตน"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: 24 }}
                />
              )}
              <Space
                direction="vertical"
                size={12}
                style={{ marginTop: 24, width: "100%" }}
              >
                <Typography.Text type="secondary">
                  อัปเดตการเปลี่ยนแปลงล่าสุดในไมล์สโตนได้ตลอดเวลาเพื่อให้ทีมรับทราบร่วมกัน
                </Typography.Text>
                <Button onClick={handleRefresh} type="default">
                  รีเฟรชรายการ
                </Button>
              </Space>
            </Card>
          </Space>
        </Content>
      </Layout>
    </Layout>
  );
}
