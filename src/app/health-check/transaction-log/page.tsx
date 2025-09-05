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
import Swal from "sweetalert2";

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

  const limit = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

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

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit, page: currentPage }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
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
  }, [currentPage]);

  useEffect(() => {
    const role = AUTHENTICATION?.response?.data?.user_data?.position;

    if (!role) return; // ยังไม่มีข้อมูล ไม่ต้องเช็ก

    console.log("ROLE:", role);

    if (role.trim().toLowerCase() !== "Admin") {
      Swal.fire({
        icon: "warning",
        title: "ต้องการรหัสผ่าน",
        input: "text",
        inputLabel: "กรอกรหัสเพื่อเข้าถึง",
        inputPlaceholder: "พิมพ์รหัสที่นี่",
        confirmButtonText: "ยืนยัน",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: false,
      }).then((result) => {
        if (result.isConfirmed && result.value !== "NARIN") {
          window.location.href = "/";
        }
      });
    }
  }, [AUTHENTICATION]);

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
    index + 1 + (currentPage - 1) * limit,
    project.name,
    project.description,
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

  const getPaginationItems = (total: number, current: number) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l: number = 0;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
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
          {/* Pagination UI */}
          <div className="mt-4 flex justify-center items-center space-x-2">
            <button
              type="button"
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous Page"
            >
              ก่อนหน้า
            </button>
            {getPaginationItems(totalPages, currentPage).map((page, idx) =>
              page === "..." ? (
                <span key={`dots-${idx}`} className="px-2 select-none">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={`px-3 py-1 rounded ${
                    page === currentPage
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => setCurrentPage(page as number)}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              )
            )}
            <button
              type="button"
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() =>
                currentPage < totalPages && setCurrentPage(currentPage + 1)
              }
              disabled={currentPage === totalPages}
              aria-label="Next Page"
            >
              ถัดไป
            </button>
          </div>
        </ContentCard>

        {/* Create/Edit Modal */}
        <MinimalModal
          isOpen={modal === "create" || modal === "edit"}
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
              leftIcon={<FiInfo className="w-5 h-5 text-gray-400" />}
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
              leftIcon={<FiEdit2 className="w-5 h-5 text-gray-400" />}
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

        {/* Delete Confirmation Modal */}
        <MinimalModal
          isOpen={modal === "delete"}
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
