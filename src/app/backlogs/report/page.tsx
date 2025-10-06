"use client";
//** หน้าแบ็กล็อกรีพอร์ตรูปแบบคีย์ API: ใส่ Space แล้วโหลดโปรเจ็กต์ด้วย Ant Design โทนมินิมอล **
import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  Button,
  Card,
  Input,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SettingOutlined } from "@ant-design/icons";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Project = {
  id: number;
  projectKey: string;
  name: string;
  archived?: boolean;
};

export default function Page() {
  const router = useRouter();
  const [space, setSpace] = useState("jabjai");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  //** โหมดคีย์ API: ไม่ต้องทำ OAuth — กดโหลดเพื่อดึงโปรเจ็กต์ได้ทันที **
  const startAuthorize = () => fetchProjects();

  //** โหลดโปรเจ็กต์จาก API ภายใน (ใช้คีย์ API ฝั่งเซิร์ฟเวอร์) **
  const fetchProjects = async () => {
    if (!space) {
      toast.warning("กรุณากรอก Space (โดเมนย่อย)");
      return;
    }
    const toastId = toast.loading("กำลังโหลดรายการโปรเจ็กต์จาก Backlog...");
    setLoading(true);
    try {
      const { data } = await axios.get("/api/v1/backlog/projects", {
        params: { space },
      });
      setProjects((data?.data as Project[]) || []);
      toast.success("โหลดรายการโปรเจ็กต์สำเร็จ", { id: toastId });
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e.message ||
          "โหลดรายการโปรเจ็กต์ไม่สำเร็จ",
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
      { title: "รหัส", dataIndex: "id", key: "id", width: 100 },
      {
        title: "คีย์โปรเจ็กต์",
        dataIndex: "projectKey",
        key: "projectKey",
        width: 140,
      },
      { title: "ชื่อโปรเจ็กต์", dataIndex: "name", key: "name" },
      {
        title: "สถานะ",
        dataIndex: "archived",
        key: "archived",
        width: 120,
        render: (v?: boolean) =>
          v ? (
            <Tag color="default">ปิดใช้งาน</Tag>
          ) : (
            <Tag color="green">ใช้งาน</Tag>
          ),
      },
      {
        title: "จัดการ",
        key: "manage",
        width: 100,
        render: (_, record) => (
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/backlogs/projects/${
                  record.id
                }/issues?space=${encodeURIComponent(
                  space
                )}&name=${encodeURIComponent(record.name)}`
              );
            }}
          />
        ),
      },
    ],
    [router, space]
  );

  return (
    <DashboardLayout>
      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", marginTop: 16 }}
      >
        <Card size="small" styles={{ body: { padding: 16 } }}>
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <Typography.Text strong>แบ็กล็อก (คีย์ API)</Typography.Text>
            <Typography.Text type="secondary">
              กรอก Space (subdomain) เช่น schoolbright (ค่าเริ่มต้น: jabjai)
              แล้วกดปุ่มเพื่อโหลดรายการโปรเจ็กต์
            </Typography.Text>
            <Space>
              <Input
                placeholder="เช่น jabjai"
                value={space}
                onChange={(e) => setSpace(e.target.value.trim())}
                style={{ width: 260 }}
              />
              <Button type="primary" onClick={startAuthorize} loading={loading}>
                โหลดโปรเจ็กต์
              </Button>
              <Button onClick={fetchProjects}>รีเฟรชโปรเจ็กต์</Button>
            </Space>
          </Space>
        </Card>

        <Card size="small" title="รายการโปรเจ็กต์บน Backlog" loading={loading}>
          <Table<Project>
            style={{ cursor: "pointer" }}
            columns={columns}
            dataSource={projects}
            rowKey={(r) => String(r.id)}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            onRow={(record) => ({
              onClick: () => {
                router.push(
                  `/backlogs/projects/${
                    record.id
                  }/issues?space=${encodeURIComponent(
                    space
                  )}&name=${encodeURIComponent(record.name)}`
                );
              },
            })}
          />
        </Card>
      </Space>
    </DashboardLayout>
  );
}
