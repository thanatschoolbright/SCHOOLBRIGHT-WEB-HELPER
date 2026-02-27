"use client";

/**
 * หน้าแสดงรายการโปรเจ็กต์ทั้งหมดจาก Backlog
 * ใช้ Ant Design สำหรับ UI minimal โทนขาวคล้าย Apple Web, รองรับ Dark Mode
 */

import { Button, Card, Input, Space, Table, Tag, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";

/**
 * Interface สำหรับข้อมูลโปรเจ็กต์
 */
interface Project {
  id: number;
  projectKey: string;
  name: string;
  archived: boolean;
}

/**
 * ProjectsListPage: Component หลักสำหรับแสดงรายการโปรเจ็กต์
 * - โหลดข้อมูลโปรเจ็กต์จาก API
 * - มีการกรองและค้นหา
 * - ใช้ Skeleton Loading และ Toast สำหรับสถานะ API
 */
export default function ProjectsListPage(): JSX.Element {
  const router = useRouter();
  const { token } = theme.useToken();

  // State สำหรับจัดการข้อมูลและสถานะ
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");

  /**
   * โหลดข้อมูลโปรเจ็กต์จาก API
   * ใช้ Toast แสดงสถานะการโหลด
   */
  const fetchProjects = async (): Promise<void> => {
    const toastId = toast.loading("กำลังโหลดรายการโปรเจ็กต์...");
    setLoading(true);

    try {
      const { data } = await axios.get<{ data: Project[] }>(
        "/api/v1/backlog/projects",
      );
      const projectList = data?.data ?? [];
      setProjects(projectList);
      setFilteredProjects(projectList);
      toast.success("โหลดรายการโปรเจ็กต์สำเร็จ", { id: toastId });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message ?? "โหลดโปรเจ็กต์ไม่สำเร็จ", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  // โหลดอัตโนมัติเมื่อเข้าเพจ
  useEffect(() => {
    fetchProjects();
  }, []);

  // กรองโปรเจ็กต์ตาม search text
  useEffect(() => {
    if (searchText.trim()) {
      const filtered = projects.filter(
        (project) =>
          project.projectKey.toLowerCase().includes(searchText.toLowerCase()) ||
          project.name.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchText, projects]);

  /**
   * จัดการเมื่อคลิกแถวหรือปุ่มจัดการ
   * นำทางไปหน้ารายละเอียดโปรเจ็กต์
   */
  const handleRowClick = (record: Project) => {
    router.push(
      `/backlogs/projects/${record.id}?space=jabjai&name=${encodeURIComponent(record.name)}`,
    );
  };

  // กำหนดคอลัมน์ของตาราง
  const columns: ColumnsType<Project> = [
    {
      title: "Project Key",
      dataIndex: "projectKey",
      key: "projectKey",
      width: 140,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "ชื่อโปรเจ็กต์",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "สถานะ",
      dataIndex: "archived",
      key: "archived",
      width: 120,
      render: (archived) => {
        const color = archived
          ? token.colorTextDisabled
          : token.colorSuccessText;
        const label = archived ? "ปิดใช้งาน" : "ใช้งาน";
        return (
          <Tag
            style={{
              color,
              background: archived
                ? token.colorBgContainerDisabled
                : token.colorSuccessBg,
              fontWeight: 500,
            }}
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: "จัดการ",
      key: "manage",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(record);
          }}
        >
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", marginTop: 16 }}
      >
        {/* Header */}
        <Card size="small" style={{ padding: 16 }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <div>
              <h2 style={{ margin: 0, color: token.colorPrimary }}>
                รายการโปรเจ็กต์ทั้งหมด
              </h2>
              <p style={{ margin: 0, color: token.colorTextSecondary }}>
                คลิกที่แถวเพื่อดูรายละเอียดหรือจัดการ Issues
              </p>
            </div>
            <Space>
              <Input
                placeholder="ค้นหาโปรเจ็กต์..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Button onClick={fetchProjects} loading={loading}>
                รีโหลด
              </Button>
            </Space>
          </Space>
        </Card>

        {/* ตารางโปรเจ็กต์ */}
        <Card size="small" title="รายการโปรเจ็กต์" loading={loading}>
          <Table<Project>
            columns={columns}
            dataSource={filteredProjects}
            rowKey={(r) => String(r.id)}
            pagination={{ pageSize: 50, showSizeChanger: true }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
            })}
            style={{ cursor: "pointer" }}
          />
        </Card>
      </Space>
    </DashboardLayout>
  );
}
