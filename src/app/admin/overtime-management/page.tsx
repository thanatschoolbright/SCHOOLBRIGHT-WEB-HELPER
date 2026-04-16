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
  DollarOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { Button, Flex, Space } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AnalyticsModal from "@/app/timesheet/overtime/_components/analytics-modal";
import DetailModal from "@/app/timesheet/overtime/_components/detail-modal";
import RejectReasonModal from "@/app/timesheet/overtime/_components/reject-reason-modal";
import AdminExportModal from "./_components/export-modal";
import AdminOtFilter from "./_components/admin-ot-filter";
import AdminOtSummary from "./_components/admin-ot-summary";
import AdminOtTable from "./_components/admin-ot-table";
import BulkActionBar from "./_components/bulk-action-bar";
import ApprovalSlaDashboard from "./_components/approval-sla-dashboard";
import DepartmentBreakdown from "./_components/department-breakdown";
import MarkPaidModal from "./_components/mark-paid-modal";
import MonthlyCostReport from "./_components/monthly-cost-report";
import OverdueAlert from "./_components/overdue-alert";
import StatusLogDrawer from "./_components/status-log-drawer";
import { useAdminOvertimeStore } from "./_state/admin-overtime-store";

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

/**
 * หน้าจัดการ OT สำหรับผู้ดูแลระบบ — แสดงทุกรายการพร้อมสิทธิ์เต็ม
 * รองรับ: Bulk Approve/Reject/Paid, Export Excel, Audit Trail
 */
export default function AdminOvertimeManagementPage() {
  const authState = useAppSelector((state) => state.callAdminLogin);
  const currentUserId = String(
    authState?.response?.data?.user_data?.id ?? "",
  );

  const { setDataSource, setIsLoading, setTotalRecords, dataSource } =
    useAdminOvertimeStore();

  // --- Pagination ---
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const currentPageRef = useRef(1);

  // --- Dropdown Options ---
  const [userOptions, setUserOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // --- Row Selection (A1: Bulk Actions) ---
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // --- Modal / Drawer States ---
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false);
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [isMarkPaidVisible, setIsMarkPaidVisible] = useState(false);
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    overtimeId: string | number | null;
    isBulk: boolean;
  }>({ open: false, overtimeId: null, isBulk: false });
  const [logDrawer, setLogDrawer] = useState<{
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

  // -----------------------------------------------------------------------
  // โหลดรายการผู้ใช้งานสำหรับ dropdown กรอง
  // -----------------------------------------------------------------------
  const loadUserOptions = useCallback(async () => {
    try {
      const res = await callApiService.get("/api/v1/timesheet/overtime/users");
      if (res?.data?.status === 200 && Array.isArray(res.data.data)) {
        const opts = res.data.data.map((u: any) => {
          const name =
            `${u.firstname_th || u.firstname || ""} ${u.lastname_th || u.lastname || ""}`.trim();
          const code = u.employee_code ? ` (${u.employee_code})` : "";
          return {
            label: `${name}${code}` || `User #${u.id}`,
            value: String(u.id),
          };
        });
        setUserOptions(opts);
      }
    } catch {
      // user options เป็นตัวช่วย — ไม่แสดง error
    }
  }, []);

  // -----------------------------------------------------------------------
  // โหลดข้อมูล OT ทั้งหมด (admin เห็นทุกคน)
  // -----------------------------------------------------------------------
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
          throw new Error(res?.data?.message_th || "ไม่สามารถโหลดข้อมูลได้");
        }

        let records: any[] = Array.isArray(res.data.data) ? res.data.data : [];

        // client-side text search (API ไม่รองรับค้นหาด้วยชื่อ)
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
        const total = res.data.pagination?.total ?? records.length;
        const newPage = res.data.pagination?.page ?? page;
        setTotalRecords(total);
        currentPageRef.current = newPage;
        setPagination({
          current: newPage,
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

  // -----------------------------------------------------------------------
  // A1 — เปลี่ยนสถานะรายการเดี่ยว
  // -----------------------------------------------------------------------
  const changeStatus = useCallback(
    async (
      id: string | number,
      status: string,
      note?: string,
    ): Promise<boolean> => {
      const res = await callApiService.post(
        `/api/v1/timesheet/overtime/change-status?id=${id}`,
        {
          status,
          updated_by: Number(currentUserId),
          ...(note ? { note } : {}),
        },
      );
      return res?.data?.status === 200;
    },
    [currentUserId],
  );

  // อนุมัติคำขอ OT รายการเดียว
  const handleApprove = useCallback(
    async (id: string | number) => {
      setIsActionLoading(true);
      try {
        const ok = await changeStatus(id, "approved");
        if (ok) {
          toast.success(`อนุมัติคำขอ OT #${id} เรียบร้อยแล้ว`);
          loadOvertimeData({ page: currentPageRef.current });
        } else {
          toast.error("ไม่สามารถอนุมัติได้");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการอนุมัติ OT");
      } finally {
        setIsActionLoading(false);
      }
    },
    [changeStatus, loadOvertimeData],
  );

  // -----------------------------------------------------------------------
  // A1 — Bulk Actions
  // -----------------------------------------------------------------------

  // อนุมัติทุกรายการที่เลือก
  const handleBulkApprove = useCallback(async () => {
    setIsBulkLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const key of selectedKeys) {
      try {
        const ok = await changeStatus(key as string | number, "approved");
        if (ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0)
      toast.success(`อนุมัติสำเร็จ ${successCount} รายการ`);
    if (failCount > 0)
      toast.error(`ไม่สามารถอนุมัติได้ ${failCount} รายการ`);

    setSelectedKeys([]);
    setIsBulkLoading(false);
    loadOvertimeData({ page: currentPageRef.current });
  }, [selectedKeys, changeStatus, loadOvertimeData]);

  // เปิด modal ระบุเหตุผล เพื่อปฏิเสธทุกรายการที่เลือก
  const handleBulkRejectOpen = useCallback(() => {
    setRejectModal({ open: true, overtimeId: null, isBulk: true });
  }, []);

  // เปลี่ยนสถานะเป็น paid ทุกรายการที่เลือก
  const handleBulkMarkPaid = useCallback(async () => {
    setIsBulkLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const key of selectedKeys) {
      try {
        const ok = await changeStatus(key as string | number, "paid");
        if (ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0)
      toast.success(`ทำเครื่องหมายจ่ายเงินแล้ว ${successCount} รายการ`);
    if (failCount > 0)
      toast.error(`ไม่สามารถดำเนินการได้ ${failCount} รายการ`);

    setSelectedKeys([]);
    setIsBulkLoading(false);
    loadOvertimeData({ page: currentPageRef.current });
  }, [selectedKeys, changeStatus, loadOvertimeData]);

  // -----------------------------------------------------------------------
  // ปฏิเสธ — รองรับทั้งรายการเดียวและ bulk
  // -----------------------------------------------------------------------
  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      setIsActionLoading(true);
      try {
        if (rejectModal.isBulk) {
          // bulk reject
          setIsBulkLoading(true);
          let successCount = 0;
          let failCount = 0;

          for (const key of selectedKeys) {
            try {
              const ok = await changeStatus(key as string | number, "rejected", reason);
              if (ok) successCount++;
              else failCount++;
            } catch {
              failCount++;
            }
          }

          if (successCount > 0)
            toast.success(`ปฏิเสธสำเร็จ ${successCount} รายการ`);
          if (failCount > 0)
            toast.error(`ไม่สามารถปฏิเสธได้ ${failCount} รายการ`);

          setSelectedKeys([]);
          setIsBulkLoading(false);
        } else {
          // รายการเดียว
          const id = rejectModal.overtimeId;
          if (!id) return;
          const ok = await changeStatus(id, "rejected", reason);
          if (ok) {
            toast.success(`ปฏิเสธคำขอ OT #${id} เรียบร้อยแล้ว`);
          } else {
            toast.error("ไม่สามารถปฏิเสธได้");
          }
        }

        setRejectModal({ open: false, overtimeId: null, isBulk: false });
        loadOvertimeData({ page: currentPageRef.current });
      } catch {
        toast.error("เกิดข้อผิดพลาดในการปฏิเสธ OT");
      } finally {
        setIsActionLoading(false);
      }
    },
    [rejectModal, selectedKeys, changeStatus, loadOvertimeData],
  );

  // -----------------------------------------------------------------------
  // ส่งอีเมลแจ้งเตือน HR
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // จัดการ pagination / sorting จากตาราง
  // -----------------------------------------------------------------------
  const handleTableChange = useCallback(
    (pag: any, _filters: any, _sorter: any) => {
      loadOvertimeData({ page: pag.current, pageSize: pag.pageSize });
    },
    [loadOvertimeData],
  );

  // B1 — กรองดูเฉพาะรายการ pending เกินกำหนด (> 3 วัน) ด้วยช่วงวันที่
  const { setFilterStatus, setFilterDateRange } = useAdminOvertimeStore();
  const handleFilterOverdue = useCallback(() => {
    const overdueFrom = dayjs().subtract(365, "day").startOf("day").toISOString();
    const overdueTo = dayjs().subtract(3, "day").endOf("day").toISOString();
    setFilterStatus("pending");
    setFilterDateRange([overdueFrom, overdueTo]);
    loadOvertimeData({
      page: 1,
      status: "pending",
      dateRange: [overdueFrom, overdueTo],
    });
  }, [loadOvertimeData, setFilterStatus, setFilterDateRange]);

  // โหลดข้อมูลเมื่อเข้าหน้า
  useEffect(() => {
    loadOvertimeData();
    loadUserOptions();
  }, [loadOvertimeData, loadUserOptions]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <PermissionLayout
      permission={[PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.MENU_OT_MANAGEMENT]}
    >
      <DashboardLayout>
        <Flex vertical gap={24} style={{ paddingBottom: 60 }}>
          {/* ส่วนหัว */}
          <HeaderBar
            icon={<SolutionOutlined />}
            title="จัดการการทำงานล่วงเวลา (ผู้ดูแลระบบ)"
            subTitle="อนุมัติ ปฏิเสธ และติดตามคำขอ OT ของพนักงานทุกคน"
            extra={
              <Space>
                <Button
                  icon={<DollarOutlined />}
                  size="large"
                  onClick={() => setIsMarkPaidVisible(true)}
                >
                  ทำเครื่องหมายจ่ายแล้ว
                </Button>
                <Button
                  icon={<FileExcelOutlined />}
                  size="large"
                  onClick={() => setIsExportVisible(true)}
                >
                  Export Excel
                </Button>
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

          {/* B1 — Banner แจ้งเตือน OT รออนุมัติเกินกำหนด */}
          <OverdueAlert onFilterOverdue={handleFilterOverdue} />

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

          {/* A1 — แถบ Bulk Actions (แสดงเมื่อเลือกรายการ) */}
          <BulkActionBar
            selectedKeys={selectedKeys}
            onClearSelection={() => setSelectedKeys([])}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkRejectOpen}
            onBulkMarkPaid={handleBulkMarkPaid}
            isLoading={isBulkLoading}
          />

          {/* ตารางข้อมูล OT พร้อม row selection */}
          <AdminOtTable
            onViewDetail={(record) => {
              setSelectedDetail(record);
              setIsDetailVisible(true);
            }}
            onApprove={handleApprove}
            onReject={(id) =>
              setRejectModal({ open: true, overtimeId: id, isBulk: false })
            }
            onSendMail={handleSendMail}
            onViewLog={(id) => setLogDrawer({ open: true, overtimeId: id })}
            pagination={pagination}
            onTableChange={handleTableChange}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
          />

          {/* B3 — Department Breakdown */}
          <DepartmentBreakdown />

          {/* C1 — Monthly OT Cost Report */}
          <MonthlyCostReport />

          {/* C2 — Approval SLA Dashboard */}
          <ApprovalSlaDashboard />

          {/* Modal ดูรายละเอียด */}
          <DetailModal
            visible={isDetailVisible}
            onClose={() => setIsDetailVisible(false)}
            selectedDetail={selectedDetail}
          />

          {/* Modal ระบุเหตุผลปฏิเสธ (รองรับทั้งรายการเดียวและ bulk) */}
          <RejectReasonModal
            open={rejectModal.open}
            overtimeId={
              rejectModal.isBulk
                ? undefined
                : (rejectModal.overtimeId ?? undefined)
            }
            loading={isActionLoading || isBulkLoading}
            onClose={() =>
              setRejectModal({ open: false, overtimeId: null, isBulk: false })
            }
            onConfirm={handleRejectConfirm}
          />

          {/* A3 — Drawer ประวัติการเปลี่ยนสถานะ (Audit Trail) */}
          <StatusLogDrawer
            open={logDrawer.open}
            overtimeId={logDrawer.overtimeId}
            onClose={() => setLogDrawer({ open: false, overtimeId: null })}
          />

          {/* B2 — Modal Mark as Paid Batch */}
          <MarkPaidModal
            open={isMarkPaidVisible}
            onClose={() => setIsMarkPaidVisible(false)}
            currentUserId={currentUserId}
            onSuccess={() => loadOvertimeData({ page: currentPageRef.current })}
          />

          {/* A2 — Modal Export Excel */}
          <AdminExportModal
            open={isExportVisible}
            onClose={() => setIsExportVisible(false)}
            userOptions={userOptions}
          />

          {/* Modal วิเคราะห์สถิติ */}
          <AnalyticsModal
            visible={isAnalyticsVisible}
            setVisible={setIsAnalyticsVisible}
            dataSource={dataSource}
          />

          {/* Modal แจ้งเตือนสถานะ */}
          <StatusModalComponent
            {...modalState}
            onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
          />
        </Flex>
      </DashboardLayout>
    </PermissionLayout>
  );
}
