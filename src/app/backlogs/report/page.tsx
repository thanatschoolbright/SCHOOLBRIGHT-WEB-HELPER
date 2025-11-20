"use client";
/**
 * 📦 หน้าแสดงรายการโปรเจ็กต์จาก Backlog (API Key Mode)
 * ใช้ Ant Design ทั้งหมด พร้อมโทนมินิมอล และรองรับ Dark Mode
 */

import React, { useEffect, useState } from "react";
import {
  Space,
  Row,
  Col,
  Card,
  Tag,
  Tooltip,
  Button,
  Empty,
  Pagination,
  Input,
} from "antd";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { FileTextOutlined } from "@ant-design/icons";
import ProjectsTable from "@components/backlog/projects-table";
import SpaceInputCard from "@components/backlog/space-input-card";
import type { BacklogProject } from "@components/backlog/types";
import type { TableProps } from "antd/es/table";

/**
 * 🎯 คอมโพเนนต์หลักของหน้า Backlog Report
 * - โหลดรายการโปรเจ็กต์จาก API ภายใน
 * - มีระบบกรองและจัดการโปรเจ็กต์
 * - ใช้ Toast แสดงสถานะ API และ Skeleton Loading
 */
export default function Page(): JSX.Element {
  const router = useRouter();

  //** 🌐 State สำหรับจัดการข้อมูลและสถานะ
  const [space, setSpace] = useState<string>("jabjai"); // Space ของ Backlog
  const [loading, setLoading] = useState<boolean>(false); // สถานะโหลดข้อมูล
  const [projects, setProjects] = useState<BacklogProject[]>([]); // โปรเจ็กต์ทั้งหมด
  const [filteredProjects, setFilteredProjects] = useState<BacklogProject[]>(
    []
  ); // โปรเจ็กต์ที่ผ่านการกรองแล้ว
  const [filteredStatus, setFilteredStatus] = useState<string[]>(["active"]); // สถานะที่กรองไว้

  /**
   * 🚀 โหลดโปรเจ็กต์จาก API ฝั่งเซิร์ฟเวอร์ (ใช้ API Key Mode)
   * ใช้ Toast แสดงสถานะการโหลด
   */
  const fetchProjects = async (): Promise<void> => {
    if (!space.trim()) {
      toast.warning("กรุณากรอก Space (โดเมนย่อย)");
      return;
    }

    const toastId = toast.loading("กำลังโหลดรายการโปรเจ็กต์จาก Backlog...");
    setLoading(true);

    try {
      const { data } = await axios.get<{ data: BacklogProject[] }>(
        "/api/v1/backlog/projects",
        { params: { space } }
      );

      const projectList = data?.data ?? [];
      setProjects(projectList);
      setFilteredProjects(projectList); // ตั้งค่าเริ่มต้นของตาราง
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

  //** ⚙️ โหลดอัตโนมัติเมื่อเข้าเพจ
  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * 🧩 จัดการเมื่อคลิกแถวหรือปุ่มจัดการ
   * นำทางไปหน้ารายละเอียด Issue
   */
  const handleRowClick = (record: BacklogProject) => {
    router.push(
      `/backlogs/projects/${record.id}/issues?space=${encodeURIComponent(
        space
      )}&name=${encodeURIComponent(record.name)}`
    );
  };

  /**
   * 📊 จัดการการเปลี่ยนแปลงในตาราง (กรองและจัดเรียง)
   */
  const onTableChange: TableProps<BacklogProject>["onChange"] = (
    _,
    filters
  ) => {
    let result = [...projects];

    // ✅ กรองตามชื่อโปรเจ็กต์
    if (filters.name && (filters.name as string[]).length > 0) {
      const names = filters.name as string[];
      result = result.filter((p) =>
        names.some((n) => p.name.toLowerCase().includes(n.toLowerCase()))
      );
    }

    // ✅ กรองตามสถานะ
    if (filters.archived && (filters.archived as string[]).length > 0) {
      const status = filters.archived as string[];
      result = result.filter((p) =>
        status.includes(p.archived ? "archived" : "active")
      );
      setFilteredStatus(status);
    }

    setFilteredProjects(result);
  };

  return (
    <DashboardLayout>
      <HeaderBar title="Backlogs Report" subTitle="รายงานโครงการและ Issues" icon={<FileTextOutlined />} color="none" />
      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", marginTop: 16 }}
      >
        {/* 🔸 การ์ดกรอก Space และโหลดข้อมูล */}
        <SpaceInputCard
          space={space}
          setSpace={setSpace}
          onLoad={fetchProjects}
          loading={loading}
        />

        {/* 🔹 การแสดงผลแบบ Card grid (4 คอลัมน์ บนหน้าจอใหญ่) */}
        <div>
          {/* ค้นหาชื่อ Project */}
          <Row style={{ marginBottom: 12 }}>
            <Col xs={24} sm={12}>
              <Card size="small">
                <Card.Meta
                  title="ค้นหาโปรเจ็กต์"
                  description={
                    <>
                      <Row>
                        <Col span={24}>
                          <Input.Search
                            placeholder="ค้นหาชื่อโปรเจ็กต์"
                            allowClear
                            onSearch={(q: string) => {
                              const value = String(q ?? "")
                                .trim()
                                .toLowerCase();
                              if (!value) {
                                setFilteredProjects(projects);
                                return;
                              }
                              setFilteredProjects(
                                projects.filter((p) =>
                                  p.name.toLowerCase().includes(value)
                                )
                              );
                            }}
                            onChange={(e) => {
                              if (!e.target.value)
                                setFilteredProjects(projects);
                            }}
                          />
                        </Col>
                      </Row>
                    </>
                  }
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            {loading ? (
              <Col span={24}>
                <Card loading variant="outlined" />
              </Col>
            ) : (
              (filteredProjects.length ? filteredProjects : projects).map(
                (p) => (
                  <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      onClick={() => handleRowClick(p)}
                      title={p.name}
                      size="small"
                      variant="outlined"
                      styles={{
                        body: {
                          padding: 12,
                        },
                        header: {
                          padding: "12px",
                        },
                      }}
                      actions={[
                        <Tooltip key="issues" title="ดู Issues">
                          <Button
                            type="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(p);
                            }}
                          >
                            Issues
                          </Button>
                        </Tooltip>,
                        <Tooltip key="external" title="เปิดใน Backlog">
                          <Button
                            type="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `https://${encodeURIComponent(
                                space
                              )}.backlog.com/projects/${p.projectKey}`;
                              window.open(url, "_blank");
                            }}
                          >
                            Open
                          </Button>
                        </Tooltip>,
                        <Tooltip key="copy" title="คัดลอกรหัสโปรเจ็กต์">
                          <Button
                            type="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(String(p.id));
                              toast.success("คัดลอกรหัสโปรเจ็กต์แล้ว");
                            }}
                          >
                            Copy
                          </Button>
                        </Tooltip>,
                      ]}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: 8 }}>
                            <strong>ID:</strong> {p.id}
                          </div>
                          <div>
                            <Tag color={p.archived ? "default" : "processing"}>
                              {p.archived ? "archived" : "active"}
                            </Tag>
                            <Tag color="blue">{p.projectKey}</Tag>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                )
              )
            )}
          </Row>

          {/* Pagination - แสดงเมื่อมีมากกว่า pageSize */}
          <div
            style={{ marginTop: 16, display: "flex", justifyContent: "center" }}
          >
            <Pagination
              defaultCurrent={1}
              total={
                filteredProjects.length
                  ? filteredProjects.length
                  : projects.length
              }
              pageSize={24}
              showSizeChanger={false}
              onChange={(page) => {
                // keep simple: scroll to top of list when page changes
                const el =
                  document.querySelector('[role="main"]') || document.body;
                el.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>

          {/* Empty state */}
          {!(filteredProjects.length || projects.length) && !loading && (
            <div style={{ padding: 24 }}>
              <Empty description="ไม่มีโปรเจ็กต์" />
            </div>
          )}
        </div>
      </Space>
    </DashboardLayout>
  );
}
