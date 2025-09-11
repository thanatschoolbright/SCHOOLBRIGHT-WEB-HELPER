"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  FiPlus,
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiArrowRight,
} from "react-icons/fi";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Project, SubProject, SubProjectForm } from "@stores/type";

export default function Page() {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

  const { project_id } = useParams() as { project_id: string };

  const router = useRouter();
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<SubProjectForm & { confirmText?: string }>({
    name: "",
    by: AUTHENTICATION.response.data.user_data.admin_id,
    confirmText: "",
    project_id: Number(project_id),
  });
  const [antdForm] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<string>(""); // replaced modalOpen and deleteModalOpen
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailProject, setDetailProject] = useState<SubProject | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limit = 10;

  // Fetch project detail for projectName

  const fetchSubProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/sub-project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit,
          page: currentPage,
          project_id: Number(project_id),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      console.log("Fetched projects:", data);
      setSubProjects(data?.data?.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setSubProjects([]);
      toast.error("โหลดโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsById = async (project_id: string | number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 10,
          page: 1,
          id: Number(project_id),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data.data.items || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      toast.error("โหลดโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateProject = async (project: SubProjectForm) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/sub-project/insert/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      if (!res.ok) {
        throw new Error("Failed to create or update project");
      }
      toast.success("สร้าง/อัปเดตฟีเจอร์สำเร็จ", { duration: 5000 });
    } catch (error) {
      console.error("Error creating or updating project:", error);
      toast.error("สร้าง/อัปเดตโปรเจคล้มเหลว", { duration: 5000 });
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/sub-project/delete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          by: AUTHENTICATION.response.data.user_data.admin_id,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete project");
      }
      toast.success("ลบโปรเจคสำเร็จ", { duration: 5000 });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("ลบโปรเจคล้มเหลว", { duration: 5000 });
    }
  };

  useEffect(() => {
    fetchSubProjects();
  }, [currentPage]);

  useEffect(() => {
    fetchProjectsById(project_id);
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await createOrUpdateProject(form);
    setForm({
      name: "",
      project_id: Number(project_id),
      by: AUTHENTICATION.response.data.user_data.admin_id,
    });
    setModal("");
    setCurrentPage(1);
    await fetchSubProjects();
  };

  const openCreateModal = () => {
    setForm({
      name: "",
      project_id: Number(project_id),
      by: AUTHENTICATION.response.data.user_data.admin_id,
    });
    setModal("create");
  };

  const openEditModal = (project: SubProject) => {
    setForm({
      id: project.id,
      name: project.name,
      project_id: project.project_id,
      by: AUTHENTICATION.response.data.user_data.admin_id,
    });
    setModal("edit");
  };

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setModal("delete");
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    await deleteProject(deleteId);
    setModal("");
    setDeleteId(null);
    setCurrentPage(1);
    await fetchSubProjects();
  };

  const columns = [
    {
      title: "ลำดับ",
      dataIndex: "index",
      key: "index",
      align: "center" as const,
      width: 80,
      render: (_: any, __: any, idx: number) =>
        idx + 1 + (currentPage - 1) * limit,
    },
    {
      title: "ชื่อโปรเจค",
      dataIndex: "name",
      key: "name",
      align: "left" as const,
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center" as const,
      width: 200,
      render: (_: any, record: SubProject) => (
        <Space>
          <Button
            type="text"
            icon={<FiInfo className="w-5 h-5" />}
            onClick={() => {
              setDetailProject(record);
              setModal("detail");
            }}
            aria-label="View Details"
          />
          <Button
            type="text"
            icon={<FiEdit2 className="w-5 h-5" />}
            onClick={() => openEditModal(record)}
            aria-label="Edit Project"
          />
          <Button
            type="text"
            danger
            icon={<FiTrash2 className="w-5 h-5" />}
            onClick={() => openDeleteModal(record.id)}
            aria-label="Delete Project"
          />
          <Link
            href={`/timesheet/project/sub-project/${record.id}`}
            className="text-green-600 hover:text-green-800 flex items-center"
            aria-label="Go to Sub Project"
          >
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </Space>
      ),
    },
  ];

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, currentPage + 3);

    if (endPage - startPage < maxPagesToShow - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return (
      <nav className="flex justify-center mt-4" aria-label="Pagination">
        <ul className="inline-flex items-center -space-x-px text-sm font-medium">
          <li>
            <button
              className={`px-3 py-1 rounded-l-md border border-gray-300 bg-white hover:bg-gray-100 ${
                currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
              }`}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="ก่อนหน้า"
            >
              ก่อนหน้า
            </button>
          </li>
          {pages.map((page, idx) =>
            page === "..." ? (
              <li key={`ellipsis-${idx}`}>
                <span className="px-3 py-1 border border-gray-300 bg-white cursor-default">
                  ...
                </span>
              </li>
            ) : (
              <li key={page}>
                <button
                  className={`px-3 py-1 border border-gray-300 hover:bg-gray-100 ${
                    page === currentPage
                      ? "bg-blue-500 text-white cursor-default"
                      : "bg-white"
                  }`}
                  onClick={() =>
                    page !== currentPage && setCurrentPage(Number(page))
                  }
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              </li>
            )
          )}
          <li>
            <button
              className={`px-3 py-1 rounded-r-md border border-gray-300 bg-white hover:bg-gray-100 ${
                currentPage === totalPages
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
              onClick={() =>
                currentPage < totalPages && setCurrentPage(currentPage + 1)
              }
              disabled={currentPage === totalPages}
              aria-label="ถัดไป"
            >
              ถัดไป
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[200px]">
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <div className="w-full flex justify-start">
          <Button
            type="default"
            icon={<FiArrowRight className="w-5 h-5 rotate-180" />}
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center" }}
          >
            ย้อนกลับ
          </Button>
        </div>
        {/* Project Name Header */}
        <Card title="โครงการ" className="w-1/2 mb-2">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {projects[0]?.name}
          </Typography.Title>
        </Card>
        {/* Add Project Button */}
        <div className="w-full flex justify-end">
          <Button
            type="primary"
            icon={<FiPlus className="w-6 h-6" />}
            size="large"
            onClick={openCreateModal}
            style={{ display: "flex", alignItems: "center" }}
          >
            <span className="text-lg font-semibold">เพิ่มฟีเจอร์</span>
          </Button>
        </div>

        <Card title="รายการโครงการย่อย (Feature)" className="w-full">
          <Table
            columns={columns}
            dataSource={subProjects}
            rowKey="id"
            pagination={false}
          />
          {renderPagination()}
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          open={modal === "create" || modal === "edit"}
          onCancel={() => setModal("")}
          title={form.id ? "แก้ไขโปรเจค" : "เพิ่มฟีเจอร์"}
          footer={null}
          destroyOnClose
        >
          <Form
            form={antdForm}
            layout="vertical"
            initialValues={{ name: form.name }}
            onValuesChange={(_, allValues) =>
              setForm({ ...form, ...allValues })
            }
            onFinish={async () => {
              await handleSubmit();
              antdForm.resetFields();
            }}
          >
            <Form.Item
              label="ชื่อโปรเจค"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อโปรเจค" }]}
            >
              <Input placeholder="กรอกชื่อโปรเจค" />
            </Form.Item>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <Button onClick={() => setModal("")}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<FiCheckCircle className="w-5 h-5" />}
              >
                บันทึก
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={modal === "delete"}
          onCancel={() => setModal("")}
          title="ยืนยันการลบ"
          footer={null}
          destroyOnClose
        >
          <div className="space-y-4 mt-2">
            <Typography.Text type="danger" strong>
              คุณต้องการยืนยันที่จะลบโปรเจคนี้จริงหรือไม่
            </Typography.Text>
            <Typography.Text>
              โปรดพิมพ์{" "}
              <span style={{ fontWeight: "bold", color: "#f5222d" }}>
                Delete
              </span>{" "}
              เพื่อยืนยัน
            </Typography.Text>
            <Input
              placeholder="พิมพ์ Delete เพื่อยืนยัน"
              value={form.confirmText}
              onChange={(e) =>
                setForm({ ...form, confirmText: e.target.value })
              }
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button onClick={() => setModal("")}>ยกเลิก</Button>
            <Button
              type="primary"
              danger
              icon={<FiTrash2 className="w-5 h-5" />}
              onClick={confirmDelete}
              disabled={form.confirmText !== "Delete"}
            >
              ลบ
            </Button>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          open={modal === "detail" && !!detailProject}
          onCancel={() => {
            setModal("");
            setDetailProject(null);
          }}
          title="รายละเอียดโปรเจค"
          footer={[
            <Button
              key="close"
              onClick={() => {
                setModal("");
                setDetailProject(null);
              }}
            >
              ปิด
            </Button>,
          ]}
          destroyOnClose
        >
          {detailProject && (
            <div className="space-y-3 mt-2">
              <Typography.Text>
                <strong>ชื่อโปรเจค:</strong> {detailProject.name}
              </Typography.Text>
              <p>
                <strong>โปรเจ็คหลัก:</strong> {projects[0]?.name}
              </p>
              <p>
                <strong>สร้างโดย (id):</strong> {detailProject.createdBy}
              </p>
              <p>
                <strong>สร้างเมื่อ:</strong>{" "}
                {convertToThaiDateDDMMYYY(detailProject.createdAt)}
              </p>
              <p>
                <strong>แก้ไขล่าสุด:</strong>{" "}
                {convertToThaiDateDDMMYYY(detailProject.updatedAt)}
              </p>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
