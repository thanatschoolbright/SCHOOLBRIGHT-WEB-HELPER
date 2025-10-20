"use client";

import { useEffect } from "react";
import { Card, Button, Space, Typography, Breadcrumb } from "antd";
import { PlusOutlined, ReloadOutlined, HomeOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAppSelector } from "@/stores/store";
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
  GET_API_LOGS,
  POST_CREATE_API_LOG,
  DELETE_API_LOG,
  PATCH_ARCHIVE_STATUS,
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

const { Title } = Typography;

//** หน้าจัดการ API Logs */
export default function ApiLogPage() {
  const dispatch = useDispatch();
  const apiLogState = useAppSelector((state) => state.apiLog);

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

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            API Log Management
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => handleLoadData()}
              loading={apiLogState.loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Log
            </Button>
          </Space>
        </div>

        {/* Filter Card */}
        <Card title="Filters" style={{ marginBottom: "24px" }} size="small">
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

        {/* Modal */}
        <ApiLogModal
          visible={apiLogState.modalVisible}
          mode={apiLogState.modalMode}
          loading={apiLogState.loading}
          data={apiLogState.selectedLog || undefined}
          onCancel={handleModalCancel}
          onSubmit={handleModalSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
