"use client";

import { LockOutlined, RocketOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, Modal, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ApplicationTable } from "@/app/hardware/canteen/_components/application-table";
import { CheckUpdateModal } from "@/app/hardware/canteen/_components/check-update-modal";
import { SubmissionStatusModal } from "@/app/hardware/canteen/_components/submission-status-modal";
import { SummaryCards } from "@/app/hardware/canteen/_components/summary-cards";
import { VersionFormModal } from "@/app/hardware/canteen/_components/version-form-modal";
import { VersionHistoryModal } from "@/app/hardware/canteen/_components/version-history-modal";
import { useCanteenStore } from "@/app/hardware/canteen/_state/use-canteen-store";
import {
  createApplicationVersion,
  getExportApplicationHistory,
  updateApplicationVersion,
} from "@/app/hardware/canteen/_api/canteen.service";
import {
  buildSchoolOptions,
  validatePassword,
} from "@/app/hardware/canteen/canteen.helper";
import type { StatusModalType } from "@/components/modal/status-modal-component";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import type {
  ApplicationRecord,
  VersionFormValues,
  VersionRecord,
} from "@/types/canteen.type";
import DashboardLayout from "@components/layouts/backend-layout";

const ADMIN_ACCESS_PASSWORD = "SB_ADMIN";

interface AxiosLikeErrorData {
  message?: string;
}

// ✨ ดึง response.data จาก axios error object โดยไม่ใช้ type assertion
const getAxiosResponseData = (
  error: unknown,
): AxiosLikeErrorData | undefined => {
  if (error === null || typeof error !== "object") return undefined;
  if (!("response" in error)) return undefined;
  const { response } = error as { response: unknown };
  if (response === null || typeof response !== "object") return undefined;
  if (!("data" in response)) return undefined;
  const { data } = response as { data: unknown };
  if (data === null || typeof data !== "object") return undefined;
  return data as AxiosLikeErrorData;
};

type VersionFormMode = "add" | "edit";
type SubmissionStatus = "idle" | "loading" | "success" | "error";

interface StatusModalState {
  open: boolean;
  type: StatusModalType;
  title: string;
  message: string;
  errorDetails: unknown;
  onConfirm?: () => void;
  loading: boolean;
}

const DEFAULT_STATUS_MODAL: StatusModalState = {
  open: false,
  type: "success",
  title: "",
  message: "",
  errorDetails: undefined,
  onConfirm: undefined,
  loading: false,
};

// ✨ หน้าหลักสำหรับจัดการเวอร์ชันแอปพลิเคชัน Canteen — ทำหน้าที่เป็น Orchestrator เท่านั้น
export default function CanteenAppManager() {
  const {
    applicationList,
    isApplicationLoading,
    schoolList,
    selectedApplication,
    versionDataset,
    deleteTargetRecord,
    setSelectedApplication,
    setDeleteTargetRecord,
    fetchApplications,
    fetchSchools,
    fetchApplicationVersions,
    deleteVersion,
  } = useCanteenStore();

  // --- Password Protection State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | undefined>(
    undefined,
  );

  // --- Modal Visibility State ---
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionFormOpen, setVersionFormOpen] = useState(false);
  const [checkUpdateOpen, setCheckUpdateOpen] = useState(false);

  // --- Form State ---
  const [versionFormMode, setVersionFormMode] =
    useState<VersionFormMode>("add");
  const [currentFormStep, setCurrentFormStep] = useState(0);
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [debugData, setDebugData] = useState<unknown>(null);

  // --- Check Update State ---
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [checkUpdateResult, setCheckUpdateResult] = useState<unknown>(null);

  // --- Shared Status Modal ---
  const [statusModal, setStatusModal] =
    useState<StatusModalState>(DEFAULT_STATUS_MODAL);

  const [versionFormInstance] = Form.useForm<VersionFormValues>();
  const [checkFormInstance] = Form.useForm();

  const schoolOptions = useMemo(
    () => buildSchoolOptions(schoolList),
    [schoolList],
  );

  const availableVersionOptions = useMemo(() => {
    const versions = versionDataset.data.map((v) => v.version_name);
    const uniqueVersions = Array.from(new Set(versions)).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }),
    );
    return uniqueVersions.map((v) => ({ label: v, value: v }));
  }, [versionDataset.data]);

  useEffect(() => {
    void Promise.all([fetchApplications(), fetchSchools()]);
  }, [fetchApplications, fetchSchools]);

  // ✨ ขอสิทธิ์ก่อนทำ action — หากยังไม่ authenticated จะเปิด password modal
  const requestAccess = useCallback(
    (actionCallback: () => void): void => {
      if (isAuthenticated) {
        actionCallback();
      } else {
        setPendingAction(() => actionCallback);
        setPasswordModalVisible(true);
      }
    },
    [isAuthenticated],
  );

  // ✨ ยืนยันรหัสผ่าน Admin
  const handlePasswordSubmit = useCallback(() => {
    if (validatePassword(password, ADMIN_ACCESS_PASSWORD)) {
      setIsAuthenticated(true);
      setPasswordModalVisible(false);
      setPassword("");
      toast.success("ยืนยันตัวตนสำเร็จ");
      if (pendingAction) {
        pendingAction();
        setPendingAction(undefined);
      }
    } else {
      setPasswordError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
    }
  }, [password, pendingAction]);

  // ✨ เปิด modal ประวัติเวอร์ชันและโหลดข้อมูล
  const handleViewVersions = useCallback(
    (record: ApplicationRecord): void => {
      setSelectedApplication(record);
      setVersionHistoryOpen(true);
      void fetchApplicationVersions(record.app_id);
    },
    [setSelectedApplication, fetchApplicationVersions],
  );

  // ✨ เตรียม form สำหรับสร้างเวอร์ชันใหม่
  const handleAddVersion = useCallback((): void => {
    requestAccess(() => {
      setVersionFormMode("add");
      setCurrentFormStep(0);
      versionFormInstance.resetFields();
      const appIdStr = selectedApplication?.app_id
        ? String(selectedApplication.app_id)
        : "";
      versionFormInstance.setFieldsValue({
        appID: appIdStr !== "undefined" ? appIdStr : "",
        env: "Production",
        isLatestVersion: false,
        forceUpdate: false,
      });
      setVersionFormOpen(true);
    });
  }, [requestAccess, selectedApplication, versionFormInstance]);

  // ✨ เตรียม form สำหรับแก้ไขเวอร์ชันที่มีอยู่
  const handleEditVersion = useCallback(
    (record: VersionRecord): void => {
      requestAccess(() => {
        setVersionFormMode("edit");
        setCurrentFormStep(0);
        setVersionFormOpen(true);

        const url = record.url ?? "";
        const fileName = url ? url.substring(url.lastIndexOf("/") + 1) : "";
        const existingFile = url
          ? [{ uid: "-1", name: fileName, status: "done", url }]
          : [];

        const appIdStr = selectedApplication?.app_id
          ? String(selectedApplication.app_id)
          : "";
        const versionIdStr = record.version_id ? String(record.version_id) : "";

        versionFormInstance.setFieldsValue({
          appID: appIdStr !== "undefined" ? appIdStr : "",
          versionID: versionIdStr !== "undefined" ? versionIdStr : "",
          versionName: record.version_name ?? "",
          env: record.env ?? "Production",
          note: record.note ?? "",
          schoolID: record.school_id?.map((id) => String(id)),
          isLatestVersion: Boolean(record.is_lastest_version),
          forceUpdate: Boolean(record.force_update),
          file: existingFile,
        });
      });
    },
    [requestAccess, selectedApplication, versionFormInstance],
  );

  // ✨ เปิด confirm modal ก่อนลบเวอร์ชัน
  const handleDeleteVersion = useCallback(
    (record: VersionRecord): void => {
      requestAccess(() => setDeleteTargetRecord(record));
    },
    [requestAccess, setDeleteTargetRecord],
  );

  // ✨ ยืนยันการลบเวอร์ชัน
  const handleConfirmDelete = async () => {
    if (!deleteTargetRecord) return;
    setStatusModal((prev) => ({ ...prev, loading: true }));
    try {
      await deleteVersion(deleteTargetRecord.version_id);
      setStatusModal((prev) => ({
        ...prev,
        open: true,
        type: "success",
        title: "ลบสำเร็จ",
        message: "ลบข้อมูลเวอร์ชันเรียบร้อยแล้ว",
        loading: false,
      }));
      setDeleteTargetRecord(null);
    } catch (error: unknown) {
      setStatusModal((prev) => ({ ...prev, loading: false }));
      const message =
        error instanceof Error ? error.message : "ลบข้อมูลไม่สำเร็จ";
      setStatusModal({
        ...DEFAULT_STATUS_MODAL,
        open: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message,
        errorDetails: message,
      });
    }
  };

  // ✨ ส่งออกประวัติเวอร์ชันเป็น Excel
  const handleExportHistory = async () => {
    if (!selectedApplication) return;
    const toastId = toast.loading("กำลังเตรียมข้อมูลส่งออก...");
    try {
      const { app_id: appId, app_name: appName } = selectedApplication;
      const data = await getExportApplicationHistory(appId, appName);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Version_History_${appName.replace(/\s+/g, "_")}_${dayjs().format(
          "YYYYMMDD",
        )}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("ส่งออกข้อมูลสำเร็จ", { id: toastId });
    } catch {
      toast.dismiss(toastId);
      toast.error("ไม่สามารถส่งออกข้อมูลได้");
    }
  };

  // ✨ บันทึกข้อมูลเวอร์ชัน (สร้างหรือแก้ไข)
  const handleVersionFormSubmit = async () => {
    try {
      const formValues = await versionFormInstance.validateFields();
      setSubmissionStatus("loading");
      setDebugData(null);

      const submissionFormData = new FormData();

      // ✨ เพิ่มข้อมูลเข้า FormData อย่างปลอดภัย ป้องกันค่า null/undefined หลุดไป server
      const appendSafe = (key: string, value: unknown): void => {
        if (value === null || value === undefined) return;
        const strVal = String(value).trim();
        if (strVal === "" || strVal === "undefined" || strVal === "null")
          return;
        submissionFormData.append(key, strVal);
      };

      appendSafe("app_id", formValues.appID ?? selectedApplication?.app_id);
      appendSafe("version_id", formValues.versionID);
      appendSafe("version_name", formValues.versionName);
      appendSafe("env", formValues.env);
      if (formValues.schoolID) appendSafe("school_id", formValues.schoolID);
      submissionFormData.append("note", formValues.note ?? "");
      submissionFormData.append(
        "is_lastest_version",
        formValues.isLatestVersion ? "1" : "0",
      );
      submissionFormData.append(
        "force_update",
        formValues.forceUpdate ? "1" : "0",
      );

      if (formValues.file?.[0]?.originFileObj) {
        submissionFormData.append("file", formValues.file[0].originFileObj);
      }

      setVersionFormOpen(false);

      let apiResponse;
      if (versionFormMode === "add") {
        apiResponse = await createApplicationVersion(submissionFormData);
      } else {
        const versionId = formValues.versionID;
        if (!versionId)
          throw new Error("ไม่พบรหัสเวอร์ชัน (Version ID) สำหรับการแก้ไข");
        apiResponse = await updateApplicationVersion(
          submissionFormData,
          versionId,
        );
      }

      const isFailed =
        apiResponse?.status === "failed" ||
        apiResponse?.data?.status === "failed";

      if (isFailed) {
        setDebugData(apiResponse?.data ?? apiResponse);
        throw new Error(
          apiResponse?.message ??
            apiResponse?.data?.message ??
            "บันทึกข้อมูลไม่สำเร็จ",
        );
      }

      setSubmissionStatus("success");
      if (selectedApplication)
        void fetchApplicationVersions(selectedApplication.app_id);
    } catch (error: unknown) {
      setSubmissionStatus("error");
      const errorMessage =
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดระหว่างการบันทึกข้อมูล";
      // ตรวจสอบว่ามี response data จาก axios หรือไม่
      const responseData = getAxiosResponseData(error);
      if (responseData) {
        setDebugData(responseData);
        const apiMessage =
          typeof responseData.message === "string"
            ? responseData.message
            : errorMessage;
        setSubmissionMessage(apiMessage);
      } else {
        setSubmissionMessage(errorMessage);
      }
    }
  };

  return (
    <DashboardLayout>
      <HeaderBar
        icon={<RocketOutlined />}
        title="ระบบจัดการเวอร์ชันแอปพลิเคชัน"
        subTitle="Application Version Control Center"
      />

      <SummaryCards
        applications={applicationList}
        isLoading={isApplicationLoading}
      />

      <ApplicationTable
        applicationList={applicationList}
        isLoading={isApplicationLoading}
        onViewVersions={handleViewVersions}
      />

      {/* Admin Authentication Modal */}
      <Modal
        title={
          <Space>
            <LockOutlined style={{ color: "#faad14" }} />
            <span>ยืนยันสิทธิ์เข้าถึงระบบ</span>
          </Space>
        }
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          setPassword("");
          setPasswordError("");
        }}
        footer={null}
        width={400}
        centered
      >
        <div style={{ paddingTop: 16 }}>
          <Typography.Text type="secondary">
            กรุณายืนยันรหัสผ่านเพื่อดำเนินการที่สำคัญ
          </Typography.Text>
          <Input.Password
            placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={handlePasswordSubmit}
            status={passwordError ? "error" : ""}
            style={{ marginTop: 12 }}
            autoFocus
            prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
          />
          {passwordError && (
            <Typography.Text
              type="danger"
              style={{ display: "block", marginTop: 4 }}
            >
              {passwordError}
            </Typography.Text>
          )}
          <Flex justify="end" gap="small" style={{ marginTop: 20 }}>
            <Button
              onClick={() => {
                setPasswordModalVisible(false);
                setPassword("");
                setPasswordError("");
              }}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              onClick={handlePasswordSubmit}
              disabled={!password}
            >
              ยืนยันรหัสผ่าน
            </Button>
          </Flex>
        </div>
      </Modal>

      {/* Version History Modal */}
      <VersionHistoryModal
        open={versionHistoryOpen}
        selectedApplication={selectedApplication}
        versionData={versionDataset.data}
        versionLoading={versionDataset.loading}
        schoolOptions={schoolOptions}
        onClose={() => setVersionHistoryOpen(false)}
        onAddVersion={handleAddVersion}
        onEditVersion={handleEditVersion}
        onDeleteVersion={handleDeleteVersion}
        onExportHistory={handleExportHistory}
        onOpenCheckUpdate={() => {
          checkFormInstance.resetFields();
          setCheckUpdateResult(null);
          setCheckUpdateOpen(true);
        }}
      />

      {/* Version Form Modal */}
      <VersionFormModal
        open={versionFormOpen}
        mode={versionFormMode}
        currentStep={currentFormStep}
        selectedApplication={selectedApplication}
        schoolOptions={schoolOptions}
        formInstance={versionFormInstance}
        onClose={() => setVersionFormOpen(false)}
        onStepChange={setCurrentFormStep}
        onSubmit={handleVersionFormSubmit}
      />

      {/* Submission Status Modal */}
      <SubmissionStatusModal
        submissionStatus={submissionStatus}
        submissionMessage={submissionMessage}
        debugData={debugData}
        onClose={() => setSubmissionStatus("idle")}
      />

      {/* Check Update Simulator Modal */}
      <CheckUpdateModal
        open={checkUpdateOpen}
        isChecking={isCheckingUpdate}
        checkResult={checkUpdateResult}
        selectedApplication={selectedApplication}
        schoolOptions={schoolOptions}
        availableVersionOptions={availableVersionOptions}
        checkFormInstance={checkFormInstance}
        onClose={() => setCheckUpdateOpen(false)}
        onSetIsChecking={setIsCheckingUpdate}
        onSetCheckResult={setCheckUpdateResult}
      />

      {/* Deletion Confirmation Modal */}
      <StatusModalComponent
        open={!!deleteTargetRecord}
        type="delete"
        title="ยืนยันการลบข้อมูล"
        message={`คุณแน่ใจหรือไม่ที่จะลบเวอร์ชัน "${deleteTargetRecord?.version_name}" ออกจากระบบ?`}
        onClose={() => setDeleteTargetRecord(null)}
        onConfirm={() => void handleConfirmDelete()}
        loading={statusModal.loading}
      />

      {/* Shared Status Modal (Success, Error) */}
      <StatusModalComponent
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        errorDetails={statusModal.errorDetails}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
        onConfirm={statusModal.onConfirm}
        loading={statusModal.loading}
      />
    </DashboardLayout>
  );
}
