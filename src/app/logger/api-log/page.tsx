"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Flex,
  Modal,
  Progress,
  Space,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAppSelector } from "@/stores/store";
import { useHasPermission } from "@/hooks/use-has-permission";
import {
  setLoading,
  setLogs,
  setPagination,
  setFilters,
  resetFilters,
  setSelectedLog,
  setModalVisible,
  setModalMode,
  addLog,
  updateLog,
  removeLog,
} from "@/stores/api-log.reducer";
import {
  DELETE_PURGE_LOGS,
  GET_API_LOGS,
  POST_CREATE_API_LOG,
  DELETE_API_LOG,
  PATCH_ARCHIVE_STATUS,
  PurgeMode,
} from "@/helpers/api-log.helper";
import {
  ApiLogFormData,
  ApiLogFilters,
  ApiLogItem,
} from "@/types/api-log.type";
import ApiLogFilter from "@/components/api-log/api-log-filter";
import ApiLogTable from "@/components/api-log/api-log-table";
import ApiLogModal from "@/components/api-log/api-log-modal";
import DashboardLayout from "@/components/layouts/backend-layout";

const { Text: AntText } = Typography;

const PURGE_LABELS: Record<PurgeMode, string> = {
  "30d": "ลบ Log เกิน 30 วัน",
  "90d": "ลบ Log เกิน 90 วัน",
  all: "ลบ Log ทั้งหมด",
};

const PURGE_DESCRIPTIONS: Record<PurgeMode, string> = {
  "30d": "ระบบจะลบ API Log ทุกรายการที่บันทึกมาเกิน 30 วัน การดำเนินการนี้ไม่สามารถย้อนกลับได้",
  "90d": "ระบบจะลบ API Log ทุกรายการที่บันทึกมาเกิน 90 วัน การดำเนินการนี้ไม่สามารถย้อนกลับได้",
  all: "ระบบจะลบ API Log ทั้งหมดในฐานข้อมูล การดำเนินการนี้ไม่สามารถย้อนกลับได้",
};

//** หน้าจัดการ API Logs */
export default function ApiLogPage() {
  const dispatch = useDispatch();
  const apiLogState = useAppSelector((state) => state.apiLog);
  const { isAdmin } = useHasPermission();

  // สถานะ Confirm Modal (ก่อนลบ)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; mode: PurgeMode | null }>({
    open: false,
    mode: null,
  });

  // สถานะ Progress Modal (ระหว่างลบ)
  const [progressModal, setProgressModal] = useState<{
    open: boolean;
    percent: number;
    deleted: number;
    total: number;
    isDone: boolean;
  }>({ open: false, percent: 0, deleted: 0, total: 0, isDone: false });

  //** โหลดข้อมูลเมื่อเริ่มต้น */
  useEffect(() => {
    handleLoadData();
  }, []);

  //** โหลดข้อมูล API Logs */
  const handleLoadData = async (filters?: ApiLogFilters) => {
    const loadingToast = toast.loading("กำลังโหลดข้อมูล API Logs...");

    try {
      dispatch(setLoading(true));
      const filtersToUse = filters || apiLogState.filters;

      const response = await GET_API_LOGS(filtersToUse);

      dispatch(setLogs(response.data.logs));
      dispatch(setPagination(response.data.pagination));

      toast.success("โหลดข้อมูลสำเร็จ", { id: loadingToast });
    } catch (error: any) {
      console.error("Error loading API logs:", error);
      toast.error(
        error?.response?.data?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        {
          id: loadingToast,
        }
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  //** จัดการการค้นหา */
  const handleSearch = (filters: ApiLogFilters) => {
    dispatch(setFilters(filters));
    handleLoadData(filters);
  };

  //** จัดการการรีเซ็ตฟิลเตอร์ */
  const handleResetFilters = () => {
    dispatch(resetFilters());
    handleLoadData({
      page: 1,
      limit: 10,
      sortBy: "request_time",
      sortOrder: "desc",
    });
  };

  //** จัดการการเปลี่ยนหน้าตาราง */
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const newFilters: ApiLogFilters = {
      ...apiLogState.filters,
      page: pagination.current,
      limit: pagination.pageSize,
    };

    // จัดการการเรียงลำดับ
    if (sorter && sorter.field) {
      let sortBy: ApiLogFilters["sortBy"] = "request_time";

      switch (sorter.field) {
        case "requestTime":
          sortBy = "request_time";
          break;
        case "statusCode":
          sortBy = "status_code";
          break;
        case "durationMs":
          sortBy = "duration_ms";
          break;
      }

      newFilters.sortBy = sortBy;
      newFilters.sortOrder = sorter.order === "ascend" ? "asc" : "desc";
    }

    handleSearch(newFilters);
  };

  //** เปิด modal สำหรับสร้างใหม่ */
  const handleCreate = () => {
    dispatch(setSelectedLog(null));
    dispatch(setModalMode("create"));
    dispatch(setModalVisible(true));
  };

  //** เปิด modal สำหรับดูรายละเอียด */
  const handleView = (record: ApiLogItem) => {
    dispatch(setSelectedLog(record));
    dispatch(setModalMode("view"));
    dispatch(setModalVisible(true));
  };

  //** เปิด modal สำหรับแก้ไข */
  const handleEdit = (record: ApiLogItem) => {
    dispatch(setSelectedLog(record));
    dispatch(setModalMode("edit"));
    dispatch(setModalVisible(true));
  };

  //** จัดการการส่งฟอร์ม modal */
  const handleModalSubmit = async (data: ApiLogFormData) => {
    const loadingToast = toast.loading(
      apiLogState.modalMode === "create"
        ? "กำลังสร้าง API Log..."
        : "กำลังอัปเดต API Log..."
    );

    try {
      if (apiLogState.modalMode === "create") {
        const response = await POST_CREATE_API_LOG(data);
        dispatch(addLog(response.data));
        toast.success("สร้าง API Log สำเร็จ", { id: loadingToast });
      } else if (apiLogState.modalMode === "edit" && apiLogState.selectedLog) {
        // สำหรับ edit ในที่นี้จะอัปเดตเฉพาะ archive status
        await PATCH_ARCHIVE_STATUS(
          apiLogState.selectedLog.id,
          data.isArchived || false
        );
        const updatedLog = {
          ...apiLogState.selectedLog,
          isArchived: data.isArchived || false,
        };
        dispatch(updateLog(updatedLog));
        toast.success("อัปเดต API Log สำเร็จ", { id: loadingToast });
      }

      dispatch(setModalVisible(false));
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(
        error?.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        {
          id: loadingToast,
        }
      );
    }
  };

  //** จัดการการลบ */
  const handleDelete = async (id: string) => {
    const loadingToast = toast.loading("กำลังลบ API Log...");

    try {
      await DELETE_API_LOG(id);
      dispatch(removeLog(id));
      toast.success("ลบ API Log สำเร็จ", { id: loadingToast });
    } catch (error: any) {
      console.error("Error deleting API log:", error);
      toast.error(
        error?.response?.data?.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
        {
          id: loadingToast,
        }
      );
    }
  };

  //** จัดการการ archive/unarchive */
  const handleArchive = async (id: string, isArchived: boolean) => {
    const loadingToast = toast.loading(
      isArchived ? "กำลัง Archive API Log..." : "กำลัง Unarchive API Log..."
    );

    try {
      await PATCH_ARCHIVE_STATUS(id, isArchived);

      const logToUpdate = apiLogState.logs.find((log) => log.id === id);
      if (logToUpdate) {
        const updatedLog = { ...logToUpdate, isArchived };
        dispatch(updateLog(updatedLog));
      }

      toast.success(
        isArchived ? "Archive API Log สำเร็จ" : "Unarchive API Log สำเร็จ",
        { id: loadingToast }
      );
    } catch (error: any) {
      console.error("Error updating archive status:", error);
      toast.error(
        error?.response?.data?.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
        {
          id: loadingToast,
        }
      );
    }
  };

  //** ปิด modal */
  const handleModalCancel = () => {
    dispatch(setModalVisible(false));
  };

  // ✨ เปิด Confirm Modal ก่อนลบ Bulk
  const handlePurge = (mode: PurgeMode) => {
    if (!isAdmin) {
      toast.error("เฉพาะ Admin เท่านั้นที่สามารถลบ Log ได้");
      return;
    }
    setConfirmModal({ open: true, mode });
  };

  // ✨ ยืนยันการลบ — เปิด Progress Modal แล้วเริ่ม SSE stream
  const handleConfirmPurge = async () => {
    const mode = confirmModal.mode;
    if (!mode) return;
    setConfirmModal({ open: false, mode: null });
    setProgressModal({ open: true, percent: 0, deleted: 0, total: 0, isDone: false });

    try {
      await DELETE_PURGE_LOGS(mode, (event) => {
        if (event.type === "start") {
          setProgressModal((prev) => ({ ...prev, total: event.total ?? 0, percent: 0 }));
        } else if (event.type === "progress") {
          setProgressModal((prev) => ({
            ...prev,
            deleted: event.deleted ?? prev.deleted,
            total: event.total ?? prev.total,
            percent: event.percent ?? prev.percent,
          }));
        } else if (event.type === "done") {
          setProgressModal((prev) => ({
            ...prev,
            deleted: event.deleted ?? prev.deleted,
            percent: 100,
            isDone: true,
          }));
          toast.success(`ลบ API Log สำเร็จ ${event.deleted?.toLocaleString() ?? 0} รายการ`);
          void handleLoadData();
        }
      });
    } catch (err: any) {
      setProgressModal((prev) => ({ ...prev, isDone: true }));
      toast.error(err?.message ?? "เกิดข้อผิดพลาดในการลบ Log");
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        {/* Header */}
        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
          <AntText strong style={{ fontSize: 22 }}>
            จัดการ API Log
          </AntText>
          <Space wrap>
            {/* ปุ่มลบ Bulk — แสดงเฉพาะ Admin */}
            {isAdmin && (
              <>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handlePurge("30d")}
                >
                  ลบ Log เกิน 30 วัน
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handlePurge("90d")}
                >
                  ลบ Log เกิน 90 วัน
                </Button>
                <Button
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={() => handlePurge("all")}
                >
                  ลบ Log ทั้งหมด
                </Button>
              </>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => handleLoadData()}
              loading={apiLogState.loading}
            >
              รีเฟรช
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              สร้าง Log
            </Button>
          </Space>
        </Flex>

        {/* Filter Card */}
        <Card title="ตัวกรอง" style={{ marginBottom: 24 }} size="small">
          <ApiLogFilter
            loading={apiLogState.loading}
            filters={apiLogState.filters}
            onSearch={handleSearch}
            onReset={handleResetFilters}
          />
        </Card>

        {/* Data Table */}
        <Card loading={apiLogState.loading}>
          <ApiLogTable
            data={apiLogState.logs}
            loading={apiLogState.loading}
            pagination={apiLogState.pagination}
            filters={apiLogState.filters}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onTableChange={handleTableChange}
          />
        </Card>

        {/* Modal สร้าง/แก้ไข Log */}
        <ApiLogModal
          visible={apiLogState.modalVisible}
          mode={apiLogState.modalMode}
          loading={apiLogState.loading}
          data={apiLogState.selectedLog || undefined}
          onCancel={handleModalCancel}
          onSubmit={handleModalSubmit}
        />

        {/* Confirm Modal ก่อนลบ Bulk */}
        <Modal
          open={confirmModal.open}
          title={
            <Flex align="center" gap={8}>
              <ExclamationCircleOutlined style={{ color: "#dc2626", fontSize: 18 }} />
              <AntText strong style={{ fontSize: 16 }}>
                {confirmModal.mode ? PURGE_LABELS[confirmModal.mode] : ""}
              </AntText>
            </Flex>
          }
          onCancel={() => setConfirmModal({ open: false, mode: null })}
          footer={
            <Flex justify="end" gap={8}>
              <Button onClick={() => setConfirmModal({ open: false, mode: null })}>
                ยกเลิก
              </Button>
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                onClick={handleConfirmPurge}
              >
                ยืนยันการลบ
              </Button>
            </Flex>
          }
          width={460}
        >
          <Flex vertical gap={12} style={{ padding: "8px 0" }}>
            <AntText style={{ fontSize: 14 }}>
              {confirmModal.mode ? PURGE_DESCRIPTIONS[confirmModal.mode] : ""}
            </AntText>
            <AntText type="danger" style={{ fontSize: 13 }}>
              ⚠ การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AntText>
          </Flex>
        </Modal>

        {/* Progress Modal ระหว่างลบ */}
        <Modal
          open={progressModal.open}
          title={
            <Flex align="center" gap={8}>
              <DeleteOutlined style={{ color: progressModal.isDone ? "#16a34a" : "#dc2626", fontSize: 16 }} />
              <AntText strong style={{ fontSize: 15 }}>
                {progressModal.isDone ? "ลบ Log สำเร็จ" : "กำลังลบ API Log..."}
              </AntText>
            </Flex>
          }
          closable={progressModal.isDone}
          maskClosable={false}
          onCancel={() => setProgressModal((prev) => ({ ...prev, open: false }))}
          footer={
            progressModal.isDone ? (
              <Flex justify="end">
                <Button
                  type="primary"
                  onClick={() => setProgressModal((prev) => ({ ...prev, open: false }))}
                >
                  ปิด
                </Button>
              </Flex>
            ) : null
          }
          width={440}
        >
          <Flex vertical gap={16} style={{ padding: "12px 0" }}>
            <Progress
              percent={progressModal.percent}
              status={progressModal.isDone ? "success" : "active"}
              strokeColor={progressModal.isDone ? "#16a34a" : { from: "#6366f1", to: "#2563eb" }}
              format={(pct) => `${pct}%`}
            />
            <Flex justify="space-between">
              <AntText type="secondary" style={{ fontSize: 13 }}>
                {progressModal.isDone ? "ลบเสร็จสิ้น" : "กำลังดำเนินการ..."}
              </AntText>
              <AntText style={{ fontSize: 13 }}>
                {progressModal.deleted.toLocaleString()} / {progressModal.total.toLocaleString()} รายการ
              </AntText>
            </Flex>
          </Flex>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
