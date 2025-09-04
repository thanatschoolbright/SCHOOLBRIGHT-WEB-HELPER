"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import {
  FiPlus,
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiArrowRight,
} from "react-icons/fi";
import RoundedButton from "@components/button/rounded-button-component";
import InputComponent from "@components/input-field/input-component";
import TableComponent from "@components/table/base-table-component";
import { useAppSelector } from "@stores/store";
import MinimalModal from "@components/modal/minimal-modal-component";
import { toast } from "sonner";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  by: number;
  createdBy: number;
}

interface ProjectForm {
  id?: number;
  name: string;
  description: string;
  by: number;
}

export default function Page() {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

  const { project_id } = useParams() as { project_id: string };
  const router = useRouter();
  const [projectName, setProjectName] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectForm & { confirmText?: string }>({
    name: "",
    description: "",
    by: AUTHENTICATION.response.data.user_data.admin_id,
    confirmText: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<string>(""); // replaced modalOpen and deleteModalOpen
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  // Fetch project detail for projectName
  useEffect(() => {
    const fetchProjectDetail = async () => {
      if (!project_id) return;
      try {
        const res = await fetch("/api/v1/timesheet/project/read/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(project_id) }),
        });
        if (!res.ok) throw new Error("Failed to fetch project detail");
        const data = await res.json();
        // If API returns single project as array or object
        const project =
          Array.isArray(data.data) && data.data.length > 0
            ? data.data[0]
            : data.data || {};
        setProjectName(project.name || "");
      } catch (error) {
        setProjectName("");
      }
    };
    fetchProjectDetail();
  }, [project_id]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 10, page: 1 }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data.data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      toast.error("โหลดโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateProject = async (project: ProjectForm) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/insert/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      if (!res.ok) {
        throw new Error("Failed to create or update project");
      }
      toast.success("สร้าง/อัปเดตโปรเจคสำเร็จ", { duration: 5000 });
    } catch (error) {
      console.error("Error creating or updating project:", error);
      toast.error("สร้าง/อัปเดตโปรเจคล้มเหลว", { duration: 5000 });
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/delete/`, {
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
    fetchProjects();
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await createOrUpdateProject(form);
    setForm({
      name: "",
      description: "",
      by: AUTHENTICATION.response.data.user_data.admin_id,
    });
    setModal("");
    await fetchProjects();
  };

  const openCreateModal = () => {
    setForm({
      name: "",
      description: "",
      by: AUTHENTICATION.response.data.user_data.admin_id,
    });
    setModal("create");
  };

  const openEditModal = (project: Project) => {
    setForm({
      id: project.id,
      name: project.name,
      description: project.description,
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
    await fetchProjects();
  };

  const headers = ["ลำดับ", "ชื่อโปรเจค", "คำอธิบาย", "จัดการ"];
  const rows = projects.map((project, index) => [
    index + 1,
    project.name,
    project.description,
    <div className="flex space-x-2 justify-center">
      <button
        onClick={() => {
          setDetailProject(project);
          setModal("detail");
        }}
        className="text-gray-600 hover:text-gray-800"
        aria-label="View Details"
        type="button"
      >
        <FiInfo className="w-5 h-5" />
      </button>
      <button
        onClick={() => openEditModal(project)}
        className="text-blue-600 hover:text-blue-800"
        aria-label="Edit Project"
        type="button"
      >
        <FiEdit2 className="w-5 h-5" />
      </button>
      <button
        onClick={() => openDeleteModal(project.id)}
        className="text-red-600 hover:text-red-800"
        aria-label="Delete Project"
        type="button"
      >
        <FiTrash2 className="w-5 h-5" />
      </button>
      <Link
        href={`/timesheet/project/sub-project/${project.id}`}
        className="text-green-600 hover:text-green-800 flex items-center"
        aria-label="Go to Sub Project"
      >
        <FiArrowRight className="w-5 h-5" />
      </Link>
    </div>,
  ]);

  if (loading) {
    return (
      <DashboardLayout>
        <BaseLoadingComponent />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <div className="w-full flex justify-start">
          <RoundedButton
            type="button"
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 flex items-center space-x-2"
            onClick={() => router.back()}
            iconLeft={<FiArrowRight className="w-5 h-5 rotate-180" />}
          >
            <span>ย้อนกลับ</span>
          </RoundedButton>
        </div>
        {/* Project Name Header */}
        <ContentCard title="โครงการ" className="w-1/2 mb-2">
          <div className="text-2xl font-bold text-gray-700">{projectName}</div>
        </ContentCard>
        {/* Add Project Button */}
        <div className="w-full flex justify-end">
          <RoundedButton
            type="button"
            className="w-full sm:w-auto px-6 py-3 bg-green-500 hover:bg-green-600 text-white flex items-center space-x-3"
            onClick={openCreateModal}
            iconRight={<FiPlus className="w-6 h-6" />}
          >
            <span className="text-lg font-semibold">เพิ่มโปรเจค</span>
          </RoundedButton>
        </div>

        <ContentCard title="รายการโปรเจค" className="w-full">
          <TableComponent
            headers={headers}
            rows={rows}
            alignments={["center", "left", "left", "center"]}
          />
        </ContentCard>

        {/* Create/Edit Modal */}
        {(modal === "create" || modal === "edit") && (
          <MinimalModal
            isOpen={true}
            onClose={() => setModal("")}
            title={form.id ? "แก้ไขโปรเจค" : "เพิ่มโปรเจคใหม่"}
          >
            <div className="space-y-4 mt-5">
              <InputComponent
                label="ชื่อโปรเจค"
                id="name"
                name="name"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, name: e.target.value })
                }
                type="text"
                placeholder="กรอกชื่อโปรเจค"
              />
              <InputComponent
                label="คำอธิบายโปรเจค"
                id="description"
                name="description"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, description: e.target.value })
                }
                type="text"
                placeholder="กรอกคำอธิบายโปรเจค"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <RoundedButton
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => setModal("")}
              >
                ยกเลิก
              </RoundedButton>
              <RoundedButton
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded bg-green-500 hover:bg-green-600 text-white flex items-center space-x-2"
                onClick={handleSubmit}
                iconRight={<FiCheckCircle className="w-5 h-5" />}
              >
                <span>บันทึก</span>
              </RoundedButton>
            </div>
          </MinimalModal>
        )}

        {/* Delete Confirmation Modal */}
        {modal === "delete" && (
          <MinimalModal
            isOpen={true}
            onClose={() => setModal("")}
            title="ยืนยันการลบ"
          >
            <div className="space-y-4 mt-4">
              <p className="text-red-600 font-semibold">
                คุณต้องการยืนยันที่จะลบโปรเจคนี้จริงหรือไม่
              </p>
              <p className="text-gray-700">
                โปรดพิมพ์ <span className="font-bold text-red-600">Delete</span>{" "}
                เพื่อยืนยัน
              </p>
              <input
                type="text"
                placeholder="พิมพ์ Delete เพื่อยืนยัน"
                className="w-full border px-3 py-2 rounded"
                onChange={(e) =>
                  setForm({ ...form, confirmText: e.target.value })
                }
              />
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <RoundedButton
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => setModal("")}
                iconRight={<FiCheckCircle className="w-5 h-5" />}
              >
                ยกเลิก
              </RoundedButton>
              <RoundedButton
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
                disabled={form.confirmText !== "Delete"}
                iconRight={<FiTrash2 className="w-5 h-5" />}
              >
                ลบ
              </RoundedButton>
            </div>
          </MinimalModal>
        )}

        {/* Detail Modal */}
        {modal === "detail" && detailProject && (
          <MinimalModal
            isOpen={modal === "detail"}
            onClose={() => {
              setModal("");
              setDetailProject(null);
            }}
            title="รายละเอียดโปรเจค"
          >
            <div className="space-y-3 mt-5">
              <p>
                <strong>ชื่อโปรเจค:</strong> {detailProject.name}
              </p>
              <p>
                <strong>คำอธิบาย:</strong> {detailProject.description}
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
            <div className="mt-6 flex justify-end">
              <RoundedButton
                type="button"
                className="w-full sm:w-auto px-6 py-3 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => {
                  setModal("");
                  setDetailProject(null);
                }}
              >
                ปิด
              </RoundedButton>
            </div>
          </MinimalModal>
        )}
      </div>
    </DashboardLayout>
  );
}
