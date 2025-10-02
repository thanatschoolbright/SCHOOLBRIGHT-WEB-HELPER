"use client";
//** หน้า Backlog Report (API Key): ใส่ Space แล้วโหลด Projects ด้วย Ant Design (Minimal)
import React, { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  Card,
  Space,
  Typography,
  Input,
  Button,
  Table,
  Tag,
  Skeleton,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { toast } from "sonner";
import IssueDrawer from "@components/backlog/issue-drawer";

type Project = {
  id: number;
  projectKey: string;
  name: string;
  archived?: boolean;
};

export default function Page() {
  const { token } = theme.useToken();
  const [space, setSpace] = useState("jabjai");
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [openIssue, setOpenIssue] = useState(false);
  const [activeProject, setActiveProject] = useState<{
    id: number;
    name: string;
  } | null>(null);

  //** โหมด API Key: ไม่ต้อง OAuth — กด Connect = โหลด Projects ทันที
  const startAuthorize = () => fetchProjects();

  //** โหลด Projects จาก API ภายใน (ใช้ API Key ฝั่งเซิร์ฟเวอร์)
  const fetchProjects = async () => {
    if (!space) {
      toast.warning("กรุณากรอก Space (subdomain)");
      return;
    }
    const toastId = toast.loading("กำลังโหลด Projects จาก Backlog...");
    setLoading(true);
    try {
      const { data } = await axios.get("/api/v1/backlog/projects", {
        params: { space },
      });
      setProjects((data?.data as Project[]) || []);
      toast.success("โหลด Projects สำเร็จ", { id: toastId });
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e.message || "โหลด Projects ไม่สำเร็จ",
        {
          id: toastId,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // เมื่อกลับมาจาก OAuth callback ให้ลองโหลด projects เลย
    fetchProjects();
  }, []);

  const columns: ColumnsType<Project> = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id", width: 100 },
      { title: "Key", dataIndex: "projectKey", key: "projectKey", width: 140 },
      { title: "Name", dataIndex: "name", key: "name" },
      {
        title: "Archived",
        dataIndex: "archived",
        key: "archived",
        width: 120,
        render: (v?: boolean) =>
          v ? <Tag color="default">Yes</Tag> : <Tag color="green">No</Tag>,
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", marginTop: 16 }}
      >
        {/* 1) แผงกรอก Space และโหลดข้อมูล (API Key) */}
        <Card size="small" styles={{ body: { padding: 16 } }}>
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <Typography.Text strong>Backlog (API Key)</Typography.Text>
            <Typography.Text type="secondary">
              กรอก Space (subdomain) เช่น schoolbright (ตั้งค่าเริ่มต้น: jabjai)
              แล้วกด Load เพื่อดึง Projects
            </Typography.Text>
            <Space>
              {/* 1.1 ช่องกรอก Space */}
              <Input
                placeholder="เช่น jabjai"
                value={space}
                onChange={(e) => setSpace(e.target.value.trim())}
                style={{ width: 260 }}
              />
              {/* 1.2 ปุ่ม Load (แทน Connect) */}
              <Button
                type="primary"
                onClick={startAuthorize}
                loading={connecting}
              >
                Load Projects
              </Button>
              {/* 1.3 ปุ่ม Refresh Projects */}
              <Button onClick={fetchProjects}>Refresh Projects</Button>
            </Space>
          </Space>
        </Card>

        {/* 2) ตาราง Projects */}
        <Card
          size="small"
          title="Backlog Projects"
          styles={{ body: { padding: 0 } }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 16 }} />
          ) : (
            <Table<Project>
              bordered
              columns={columns}
              dataSource={projects}
              rowKey={(r) => String(r.id)}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              onRow={(record) => ({
                onClick: () => {
                  setActiveProject({ id: record.id, name: record.name });
                  setOpenIssue(true);
                },
              })}
            />
          )}
        </Card>

        {/* Drawer แสดง Issues ของโปรเจ็กต์ */}
        <IssueDrawer
          open={openIssue}
          onClose={() => setOpenIssue(false)}
          space={space}
          projectId={activeProject?.id ?? null}
          projectName={activeProject?.name}
        />
      </Space>
    </DashboardLayout>
  );
}
