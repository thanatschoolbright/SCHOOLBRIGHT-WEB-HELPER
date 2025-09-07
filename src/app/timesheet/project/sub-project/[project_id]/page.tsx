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

  const headers = ["ลำดับ", "ชื่อโปรเจค", "จัดการ"];
  const rows = subProjects.map((project, index) => [
    index + 1 + (currentPage - 1) * limit,
    project.name,
    <div className="flex space-x-2 justify-center" key={project.id}>
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
          <div className="text-2xl font-bold text-gray-700">
            {projects[0]?.name}
          </div>
        </ContentCard>
        {/* Add Project Button */}
        <div className="w-full flex justify-end">
          <RoundedButton
            type="button"
            className="w-full sm:w-auto px-6 py-3 bg-green-500 hover:bg-green-600 text-white flex items-center space-x-3"
            onClick={openCreateModal}
            iconRight={<FiPlus className="w-6 h-6" />}
          >
            <span className="text-lg font-semibold">เพิ่มฟีเจอร์</span>
          </RoundedButton>
        </div>

        <ContentCard title="รายการโครงการย่อย (Feature)" className="w-full">
          <TableComponent
            headers={headers}
            rows={rows}
            alignments={["center", "left", "left", "center"]}
          />
          {renderPagination()}
        </ContentCard>

        {/* Create/Edit Modal */}
        {(modal === "create" || modal === "edit") && (
          <MinimalModal
            isOpen={true}
            onClose={() => setModal("")}
            title={form.id ? "แก้ไขโปรเจค" : "เพิ่มฟีเจอร์"}
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
                <strong>โปรเจ็คหลัก:</strong> {projects[0].name}
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
