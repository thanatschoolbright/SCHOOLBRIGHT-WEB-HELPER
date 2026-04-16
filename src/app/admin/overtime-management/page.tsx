"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import StatusModalComponent, {
  type StatusModalProps,
} from "@/components/modal/status-modal";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { PERMISSIONS } from "@/constants/permission.constant";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@/stores/store";
import {
  BarChartOutlined,
  ReloadOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { Button, Flex, Space } from "antd";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AnalyticsModal from "@/app/timesheet/overtime/_components/analytics-modal";
import DetailModal from "@/app/timesheet/overtime/_components/detail-modal";
import RejectReasonModal from "@/app/timesheet/overtime/_components/reject-reason-modal";
import AdminOtFilter from "./_components/admin-ot-filter";
import AdminOtSummary from "./_components/admin-ot-summary";
import AdminOtTable from "./_components/admin-ot-table";
import { useAdminOvertimeStore } from "./_state/admin-overtime-store";

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

/**
 * หน้าจัดการ OT สำหรับผู้ดูแลระบบ — แสดงทุกรายการพร้อมสิทธิ์เต็ม
 */
export default function AdminOvertimeManagementPage() {
  const authState = useAppSelector((state) => state.callAdminLogin);
  const currentUserId = String(
    authState?.response?.data?.user_data?.id ?? "",
  );

  const {
    setDataSource,
    setIsLoading,
    setTotalRecords,
  } = useAdminOvertimeStore();

  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [userOptions, setUserOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false);
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    overtimeId: string | number | null;
  }>({ open: false, overtimeId: null });
  const [modalState, setModalState] = useState<StatusModalProps>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  // สำหรับ AnalyticsModal ที่ต้องการ dataSource จาก store
  const { dataSource } = useAdminOvertimeStore();

  /**
   * โหลดรายการผู้ใช้งานสำหรับ dropdown กรอง
   */
  const loadUserOptions = useCallback(async () => {
    try {
      const res = await callApiService.get("/api/v1/timesheet/overtime/users");
      if (res?.data?.status === 200 && Array.isArray(res.data.data)) {
        const opts = res.data.data.map((u: any) => {
          const name =
            `${u.firstname_th || u.firstname || ""} ${u.lastname_th || u.lastname || ""}`.trim();
          const code = u.employee_code ? ` (${u.employee_code})` : "";
          return { label: `${name}${code}` || `User #${u.id}`, value: String(u.id) };
        });
        setUserOptions(opts);
      }
    } catch {
      // ไม่แสดง error เพราะ user options เป็นแค่ตัวช่วย
    }
  }, []);

  /**
   * โหลดข้อมูล OT ทั้งหมด (admin เห็นทุกคน)
   */
  const loadOvertimeData = useCallback(
    async (params?: {
      page?: number;
      pageSize?: number;
      searchText?: string;
      status?: string | null;
      userId?: string | null;
      dateRange?: [string, string] | null;
    }) => {
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? pagination.pageSize;

      setIsLoading(true);
      try {
        const body: any = {
          limit: pageSize,
          offset: (page - 1) * pageSize,
        };

        if (params?.status) body.status = params.status;
        if (params?.userId) body.request_id = params.userId;
        if (params?.dateRange) {
          body.from = params.dateRange[0];
          body.to = params.dateRange[1];
        }

        const res = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          body,
        );

        if (!res?.data || res.data.status !== 200) {
          throw new Error(
            res?.data?.message_th || "ไม่สามารถโหลดข้อมูลได้",
          );
        }

        let records: any[] = Array.isArray(res.data.data) ? res.data.data : [];

        // client-side text search
        if (params?.searchText) {
          const q = params.searchText.toLowerCase();
          records = records.filter((r) => {
            const fields = [
              r.id?.toString(),
              r.requester_id?.toString(),
              r.requester_name,
              r.requester_employee_code,
              r.requester_firstname_th,
              r.requester_lastname_th,
              r.status,
              ...(r.descriptions || []).map((d: any) => d.description),
            ].filter(Boolean);
            return fields.some((f) => f?.toLowerCase().includes(q));
          });
        }

        const mapped = records.map((r) => ({ key: r.id, ...r }));
        setDataSource(mapped);
        const total =
          res.data.pagination?.total ?? records.length;
        setTotalRecords(total);
        setPagination({
          current: res.data.pagination?.page ?? page,
          pageSize: res.data.pagination?.page_size ?? pageSize,
          total,
        });
      } catch (err: any) {
        setModalState({
          open: true,
          type: "error",
          title: "เกิดข้อผิดพลาด",
          message: err?.message || "ไม่สามารถโหลดข้อมูล OT ได้",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize, setDataSource, setIsLoading, setTotalRecords],
  );

  /**
   * อนุมัติคำขอ OT ที่เลือก
   */
  const handleApprove = useCallback(
    async (id: string | number) => {
      setIsActionLoading(true);
      try {
        const res = await callApiService.post(
          `/api/v1/timesheet/overtime/change-status?id=${id}`,
          { status: "approved", updated_by: Number(currentUserId) },
        );
        if (res?.data?.status === 200) {
          toast.success(`อนุมัติคำขอ OT #${id} เรียบร้อยแล้ว`);
          loadOvertimeData({ page: pagination.current });
        } else {
          toast.error(res?.data?.message_th || "ไม่สามารถอนุมัติได้");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการอนุมัติ OT");
      } finally {
        setIsActionLoading(false);
      }
    },
    [currentUserId, loadOvertimeData, pagination.current],
  );

  /**
   * ปฏิเสธคำขอ OT พร้อมเหตุผล
   */
  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      const id = rejectModal.overtimeId;
      if (!id) return;
      setIsActionLoading(true);
      try {
        const res = await callApiService.post(
          `/api/v1/timesheet/overtime/change-status?id=${id}`,
          {
            status: "rejected",
            updated_by: Number(currentUserId),
            note: reason,
          },
        );
        if (res?.data?.status === 200) {
          toast.success(`ปฏิเสธคำขอ OT #${id} เรียบร้อยแล้ว`);
          setRejectModal({ open: false, overtimeId: null });
          loadOvertimeData({ page: pagination.current });
        } else {
          toast.error(res?.data?.message_th || "ไม่สามารถปฏิเสธได้");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการปฏิเสธ OT");
      } finally {
        setIsActionLoading(false);
      }
    },
    [rejectModal.overtimeId, currentUserId, loadOvertimeData, pagination.current],
  );

  /**
   * ส่งอีเมลแจ้งเตือน HR
   */
  const handleSendMail = useCallback(async (record: any) => {
    try {
      const res = await callApiService.post(
        "/api/v1/timesheet/overtime/send-email",
        { overtime_id: record.id },
      );
      if (res?.data?.status === 200) {
        toast.success(`ส่งอีเมลแจ้งเตือน OT #${record.id} สำเร็จ`);
      } else {
        toast.error(res?.data?.message_th || "ไม่สามารถส่งอีเมลได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการส่งอีเมล");
    }
  }, []);

  /**
   * จัดการการเปลี่ยนหน้า/เรียงลำดับจากตาราง
   */
  const handleTableChange = useCallback(
    (pag: any, _filters: any, _sorter: any) => {
      loadOvertimeData({
        page: pag.current,
        pageSize: pag.pageSize,
      });
    },
    [loadOvertimeData],
  );

  // โหลดข้อมูลเมื่อเข้าหน้า
  useEffect(() => {
    loadOvertimeData();
    loadUserOptions();
  }, [loadOvertimeData, loadUserOptions]);

  return (
    <PermissionLayout
      permission={[
        PERMISSIONS.ADMIN_ACCESS,
        PERMISSIONS.MENU_OT_MANAGEMENT,
      ]}
    >
      <DashboardLayout>
        <Flex vertical gap={32} style={{ paddingBottom: 60 }}>
          {/* ส่วนหัว */}
          <HeaderBar
            icon={<SolutionOutlined />}
            title="จัดการการทำงานล่วงเวลา (ผู้ดูแลระบบ)"
            subTitle="อนุมัติ ปฏิเสธ และติดตามคำขอ OT ของพนักงานทุกคน"
            extra={
              <Space>
                <Button
                  icon={<BarChartOutlined />}
                  size="large"
                  onClick={() => setIsAnalyticsVisible(true)}
                >
                  วิเคราะห์สถิติ
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  size="large"
                  onClick={() => loadOvertimeData({ page: 1 })}
                >
                  รีเฟรช
                </Button>
              </Space>
            }
          />

          {/* การ์ดสรุปสถิติ */}
          <AdminOtSummary />

          {/* ส่วนกรองข้อมูล */}
          <AdminOtFilter
            userOptions={userOptions}
            onSearch={(params) =>
              loadOvertimeData({
                page: 1,
                searchText: params.searchText,
                status: params.status,
                userId: params.userId,
                dateRange: params.dateRange,
              })
            }
            isLoading={isActionLoading}
          />

          {/* ตารางข้อมูล OT */}
          <AdminOtTable
            onViewDetail={(record) => {
              setSelectedDetail(record);
              setIsDetailVisible(true);
            }}
            onApprove={handleApprove}
            onReject={(id) => setRejectModal({ open: true, overtimeId: id })}
            onSendMail={handleSendMail}
            pagination={pagination}
            onTableChange={handleTableChange}
          />

          {/* Modal ดูรายละเอียด */}
          <DetailModal
            visible={isDetailVisible}
            onClose={() => setIsDetailVisible(false)}
            selectedDetail={selectedDetail}
          />

          {/* Modal ระบุเหตุผลปฏิเสธ */}
          <RejectReasonModal
            open={rejectModal.open}
            overtimeId={rejectModal.overtimeId ?? undefined}
            loading={isActionLoading}
            onClose={() => setRejectModal({ open: false, overtimeId: null })}
            onConfirm={handleRejectConfirm}
          />

          {/* Modal วิเคราะห์สถิติ (ใช้ component เดิม) */}
          <AnalyticsModal
            visible={isAnalyticsVisible}
            setVisible={setIsAnalyticsVisible}
            dataSource={dataSource}
          />

          {/* Modal แจ้งเตือนสถานะ */}
          <StatusModalComponent
            {...modalState}
            onClose={() =>
              setModalState((prev) => ({ ...prev, open: false }))
            }
          />
        </Flex>
      </DashboardLayout>
    </PermissionLayout>
  );
}
