"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Modal,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  Typography,
  Descriptions,
  Space,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useAppSelector } from "@stores/store";
import { getUserById } from "@helpers/local_storage/user.storage";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { categoryType } from "@data/timesheet.category.type";

import { StatsCards } from "./components/stats-cards.component";
import { ActionBar } from "./components/action-bar.component";
import { ProjectTable } from "./components/project-table.component";
import { useProjectData } from "./hooks/use-project-data";
import type { ModalState, FormValues, Project } from "./types/project.types";

const PASSCODE = "LIGHT";

export default function ProjectManagementPage() {
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();

  const userAuth = useAppSelector((state) => state.callAdminLogin);
  const adminId = userAuth?.response?.data?.user_data?.admin_id || 0;
  const userRole = userAuth?.response?.data?.user_data?.position;

  const {
    loading,
    projects,
    pagination,
    setPagination,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  } = useProjectData(adminId);

  const [modalState, setModalState] = useState<ModalState>({
    type: "",
    data: null,
  });
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "open").length;
    const closed = projects.filter((p) => p.status === "close").length;
    const totalSubProjects = projects.reduce(
      (sum, p) => sum + (p.features?.filter((f) => !f.is_deleted).length || 0),
      0
    );
    return { total, active, closed, totalSubProjects };
  }, [projects]);

  const getCategoryName = (categoryId: string) => {
    return (
      categoryType.find((c) => String(c.id) === String(categoryId))?.name ||
      categoryId
    );
  };

  const closeModal = () => {
    setModalState({ type: "", data: null });
    setConfirmDeleteText("");
    form.resetFields();
  };

  const openCreateModal = () => {
    form.setFieldsValue({
      status: "open",
      start_date: dayjs(),
      end_date: dayjs(),
    });
    setModalState({ type: "create" });
  };

  const openEditModal = (record: Project) => {
    form.setFieldsValue({
      name: record.name,
      name_en: record.name_en,
      description: record.description,
      categoryType: record.categoryType,
      status: record.status,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    });
    setModalState({ type: "edit", data: record });
  };

  const handleSubmitForm = async (values: FormValues) => {
    setActionLoading(true);
    try {
      const payload = {
        name: values.name || "",
        name_en: values.name_en || "",
        description: values.description || "",
        categoryType: values.categoryType || "",
        status: values.status || "",
        start_date: values.start_date?.toISOString() || "",
        end_date: values.end_date?.toISOString() || "",
      };

      const success = modalState.data?.id
        ? await updateProject(modalState.data.id, payload)
        : await createProject(payload);

      if (success) {
        closeModal();
        fetchProjects();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalState.data?.id) return;

    const success = await deleteProject(modalState.data.id);
    if (success) {
      closeModal();
      fetchProjects();
    }
  };

  const handlePaginationChange = (page: number, size: number) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: size,
    });
  };

  useEffect(() => {
    if (userRole && userRole.trim().toLowerCase() !== "admin") {
      Swal.fire({
        icon: "warning",
        title: "Restricted Access",
        text: "Please enter passcode",
        input: "password",
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value !== PASSCODE) window.location.href = "/";
      });
    }
  }, [userRole]);

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", padding: "24px" }}
        >
          <ActionBar
            onCreateProject={openCreateModal}
            onViewTimeline={() => router.push("/timesheet/timeline")}
          />

          <StatsCards
            totalProjects={stats.total}
            activeProjects={stats.active}
            closedProjects={stats.closed}
            totalSubProjects={stats.totalSubProjects}
            loading={loading}
          />

          <ProjectTable
            projects={projects}
            loading={loading}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            onEdit={openEditModal}
            onDelete={(record) =>
              setModalState({ type: "delete", data: record })
            }
            onViewDetail={(record) =>
              setModalState({ type: "detail", data: record })
            }
            getCategoryName={getCategoryName}
          />
        </Space>

        {/* Create/Edit Modal */}
        <Modal
          open={modalState.type === "create" || modalState.type === "edit"}
          title={
            modalState.type === "edit" ? "แก้ไขโครงการ" : "เพิ่มโครงการใหม่"
          }
          onCancel={closeModal}
          footer={null}
          width={800}
          centered
        >
          <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="ชื่อโครงการ (TH)"
                  rules={[{ required: true, message: "กรุณากรอกชื่อโครงการ" }]}
                >
                  <Input placeholder="ระบุชื่อโครงการ" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name_en"
                  label="ชื่อโครงการ (EN)"
                  rules={[
                    { required: true, message: "กรุณากรอกชื่อภาษาอังกฤษ" },
                  ]}
                >
                  <Input placeholder="English Name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="categoryType"
                  label="ประเภท"
                  rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
                >
                  <Select
                    placeholder="เลือกประเภท"
                    options={categoryType.map((c) => ({
                      label: c.name,
                      value: String(c.id),
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="สถานะ"
                  rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
                >
                  <Select
                    options={[
                      { label: "เปิดโครงการ", value: "open" },
                      { label: "ปิดโครงการ", value: "close" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="start_date" label="วันเริ่มโครงการ">
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="end_date" label="วันสิ้นสุดโครงการ">
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="คำอธิบาย">
              <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม..." />
            </Form.Item>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 16,
              }}
            >
              <Button onClick={closeModal}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={actionLoading}
                icon={<CheckCircleOutlined />}
              >
                บันทึกข้อมูล
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="ยืนยันการลบโครงการ"
          open={modalState.type === "delete"}
          onCancel={closeModal}
          onOk={handleDelete}
          okButtonProps={{
            danger: true,
            disabled: confirmDeleteText !== "Delete",
          }}
          okText="ยืนยันลบ"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Typography.Text type="danger">
              การกระทำนี้ไม่สามารถย้อนกลับได้ กรุณาพิมพ์ <b>Delete</b>{" "}
              เพื่อยืนยัน
            </Typography.Text>
            <Input
              placeholder="Type 'Delete' to confirm"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
            />
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title="รายละเอียดโครงการ"
          open={modalState.type === "detail"}
          onCancel={closeModal}
          footer={[
            <Button key="close" onClick={closeModal}>
              ปิด
            </Button>,
          ]}
        >
          {modalState.data && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ชื่อโครงการ">
                {modalState.data.name}
              </Descriptions.Item>
              <Descriptions.Item label="English Name">
                {modalState.data.name_en || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="รายละเอียด">
                {modalState.data.description || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="สร้างเมื่อ">
                {convertToThaiDateDDMMYYY(modalState.data.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="โดย">
                {getUserById(modalState.data.createdBy)?.firstname ?? "Unknown"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
