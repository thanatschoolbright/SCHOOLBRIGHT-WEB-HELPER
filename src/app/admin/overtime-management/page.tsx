"use client";

import AnalyticsModal from "@/app/timesheet/overtime/_components/analytics-modal";
import BulkDownloadTrackingModal from "@/app/timesheet/overtime/_components/bulk-download-tracking-modal";
import DetailModal from "@/app/timesheet/overtime/_components/detail-modal";
import RejectReasonModal from "@/app/timesheet/overtime/_components/reject-reason-modal";
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
import AdminOtFilter from "./_components/admin-ot-filter";
import AdminOtSummary from "./_components/admin-ot-summary";
import AdminOtTable from "./_components/admin-ot-table";
import ApprovalSlaDashboard from "./_components/approval-sla-dashboard";
import BulkActionBar from "./_components/bulk-action-bar";
import BulkEmailModal from "./_components/bulk-email-modal";
import DepartmentBreakdown from "./_components/department-breakdown";
import AdminExportModal from "./_components/export-modal";
import { FixDateModal } from "./_components/fix-date-modal";
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
  const currentUserId = String(authState?.response?.data?.user_data?.id ?? "");

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
  const [isBulkTrackingModalVisible, setIsBulkTrackingModalVisible] =
    useState(false);
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState(0);
  const [bulkTrackingData, setBulkTrackingData] = useState<any[]>([]);

  // --- Modal / Drawer States ---
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false);
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [isFixDateVisible, setIsFixDateVisible] = useState(false);
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
  const [isBulkEmailVisible, setIsBulkEmailVisible] = useState(false);

  // -----------------------------------------------------------------------
  // โหลดรายการผู้ใช้งานสำหรับ dropdown กรอง
  // -----------------------------------------------------------------------
  const loadUserOptions = useCallback(async () => {
    try {
      const res = await callApiService.get("/api/v1/timesheet/overtime/users");
      if (res?.data?.status === 200 && Array.isArray(res.data.data)) {
        const opts = res.data.data.map((u: any) => {
          const name = `${u.firstname_th || u.firstname || ""} ${
            u.lastname_th || u.lastname || ""
          }`.trim();
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
        if (params?.searchText) body.search = params.searchText;

        const res = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          body,
        );

        if (!res?.data || res.data.status !== 200) {
          throw new Error(res?.data?.message_th || "ไม่สามารถโหลดข้อมูลได้");
        }

        const records: any[] = Array.isArray(res.data.data)
          ? res.data.data
          : [];
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

    if (successCount > 0) toast.success(`อนุมัติสำเร็จ ${successCount} รายการ`);
    if (failCount > 0) toast.error(`ไม่สามารถอนุมัติได้ ${failCount} รายการ`);

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
    if (failCount > 0) toast.error(`ไม่สามารถดำเนินการได้ ${failCount} รายการ`);

    setSelectedKeys([]);
    setIsBulkLoading(false);
    loadOvertimeData({ page: currentPageRef.current });
  }, [selectedKeys, changeStatus, loadOvertimeData]);

  // ดาวน์โหลด PDF เป็น ZIP สำหรับรายการที่เลือกทั้งหมด
  const handleBulkPdfDownloadZip = useCallback(async () => {
    const { bulkPdfDownloadService } = await import(
      "@/helpers/bulk-pdf-download.helper"
    );

    const fetchImageAsBase64 = async (url: string): Promise<string> => {
      try {
        const fetchUrl = url.startsWith("/")
          ? url
          : `/api/v1/proxy/image?url=${encodeURIComponent(url)}`;
        const response = await fetch(fetchUrl);
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };

    const formatDateThai = (date: string | null | undefined, sep = "/") => {
      if (!date) return "-";
      const dateValue = dayjs(date);
      return `${dateValue.format("DD")}${sep}${dateValue.format("MM")}${sep}${
        dateValue.year() + 543
      }`;
    };

    try {
      setIsBulkLoading(true);
      setBulkDownloadProgress(0);

      const dataItems: any[] = [];
      for (const overtimeId of selectedKeys) {
        try {
          const response = await callApiService.post(
            "/api/v1/timesheet/overtime/read",
            { id: String(overtimeId) },
          );
          if (response?.data?.status === 200 && response.data.data?.[0]) {
            dataItems.push(response.data.data[0]);
          }
        } catch (error) {
          console.error(`Failed to fetch OT ${String(overtimeId)}:`, error);
        }
      }

      if (dataItems.length === 0) {
        toast.error("ไม่พบข้อมูลที่จะดาวน์โหลด");
        return;
      }

      const temporaryContainer = document.createElement("div");
      temporaryContainer.style.position = "fixed";
      temporaryContainer.style.left = "-9999px";
      temporaryContainer.style.top = "0";
      temporaryContainer.id = "bulk-pdf-render-container-admin";
      document.body.appendChild(temporaryContainer);

      const styleElement = document.createElement("style");
      styleElement.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        .ot-print-temp {
          font-family: 'Sarabun', sans-serif;
          color: #111;
          background: #fff;
          width: 210mm;
          padding: 20px 28px;
          box-sizing: border-box;
          line-height: 1.4;
        }
        .ot-header-temp {
          display: flex;
          align-items: center;
          border-bottom: 2px solid #111;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        .ot-doc-title-temp {
          flex: 1;
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: #111;
          letter-spacing: 0.02em;
        }
        .ot-doc-meta-temp {
          font-size: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          color: #444;
          text-align: right;
        }
        .ot-info-temp {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 24px;
          margin-bottom: 14px;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          background: #fafafa;
        }
        .ot-label-temp { font-weight: 600; color: #555; min-width: 80px; font-size: 10.5px; }
        .ot-value-temp { flex: 1; border-bottom: 1px solid #e5e7eb; padding-bottom: 1px; color: #111; font-size: 10.5px; }
        .ot-table-temp { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; table-layout: fixed; }
        .ot-table-temp th, .ot-table-temp td { padding: 5px 6px; vertical-align: middle; text-align: center; border: 1px solid #9ca3af; overflow: hidden; }
        .ot-table-temp th { background-color: #e5e7eb; color: #111; font-weight: 700; font-size: 9.5px; }
        .ot-table-temp td { color: #222; }
        .ot-table-temp td.desc-cell { text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal; max-width: 0; }
        .ot-section-header {
          margin-bottom: 6px;
          padding: 5px 8px;
          background: #f3f4f6;
          border-left: 3px solid #374151;
          color: #111;
          font-size: 10.5px;
          font-weight: 700;
        }
        .ot-summary-temp {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 10.5px;
          margin-bottom: 14px;
          padding: 6px 10px;
        }
        .ot-total-label { color: #555; }
        .ot-total-value { font-size: 13px; color: #111; font-weight: 700; }
        .ot-sign-container-temp { display: flex; justify-content: space-between; margin-top: 14px; gap: 16px; }
        .ot-sign-box-temp { text-align: center; width: 48%; padding: 8px; border: 1px solid #d1d5db; }
        .ot-sign-title-temp { font-weight: 700; margin-bottom: 4px; font-size: 10.5px; color: #111;  padding-bottom: 4px; }
        .ot-sign-line-temp { border-bottom: 1px solid #6b7280; margin: 4px auto 4px; width: 70%; }
        .ot-sub-form-temp { margin-top: 18px; border-top: 1px solid #d1d5db; padding-top: 14px; }
        .evidence-page-temp { padding: 20px 28px; }
        .evidence-grid-temp { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .evidence-item-temp { border: 1px solid #d1d5db; padding: 12px; height: 480px; display: flex; flex-direction: column; align-items: center; background: #fff; }
        .evidence-label-temp { font-weight: 700; color: #111; margin-bottom: 10px; text-align: center; font-size: 12px; }
        .evidence-img-wrapper-temp { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; background: #f9fafb; padding: 6px; overflow: hidden; }
        .evidence-img-temp { max-width: 100%; max-height: 100%; object-fit: contain; }
      `;
      temporaryContainer.appendChild(styleElement);

      const itemsForZip: Array<{
        employeeCode: string;
        fileName: string;
        element: HTMLElement[];
      }> = [];

      for (const data of dataItems) {
        const employeeCode = data?.requester_employee_code || "UNKNOWN";
        const requesterName = data?.requester_name || "-";
        const requesterPosition = data?.requester_position || "-";
        const requesterDepartment = data?.department || "IT";

        const totalBudgetHours =
          data.descriptions?.reduce((accumulator: number, item: any) => {
            if (!item?.start_date || !item?.end_date) {
              return accumulator + (Number(item?.duration) || 0);
            }
            const budgetStart = dayjs(item.start_date).startOf("hour");
            const budgetEnd = dayjs(item.end_date)
              .add(1, "hour")
              .startOf("hour");
            const hourDiff = budgetEnd.diff(budgetStart, "hour");
            return accumulator + (hourDiff > 0 ? hourDiff : 0);
          }, 0) || 0;

        // คำนวณเวลา Actual จาก start_date/end_date จริง รองรับข้ามเที่ยงคืน
        const calcActualMinutes = (
          startIso: string | null,
          endIso: string | null,
        ): number => {
          if (!startIso || !endIso) return 0;
          let diff = dayjs(endIso).diff(dayjs(startIso), "minute");
          // ถ้า diff ติดลบ แสดงว่าข้ามเที่ยงคืน → บวก 1 วัน
          if (diff < 0) diff += 24 * 60;
          return diff;
        };

        const totalActualMinutes =
          data.descriptions?.reduce((accumulator: number, item: any) => {
            return (
              accumulator +
              calcActualMinutes(item.start_date ?? null, item.end_date ?? null)
            );
          }, 0) || 0;

        const firstDescription = data.descriptions?.[0] || {};
        const proofData = firstDescription.proof || {};
        const headerDate = data.request_date || data.created_at;

        // แปลงนาทีเป็น "H ชม. MM นาที" สำหรับแสดงในเอกสาร
        const formatDurationToDecimal = (minutes: number) => {
          if (!minutes || minutes <= 0) return "0 ชม. 0 นาที";
          const totalMinutes = Math.round(minutes);
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          return `${h} ชม. ${m} นาที`;
        };

        const [
          logoBase64,
          signatureBase64,
          approverSignatureBase64,
          image1Base64,
          image2Base64,
          image3Base64,
          image4Base64,
        ] = await Promise.all([
          fetchImageAsBase64("/sb_logo.webp"),
          proofData.signature_1
            ? fetchImageAsBase64(proofData.signature_1)
            : Promise.resolve(""),
          fetchImageAsBase64("/signatures/THANAT.png"),
          proofData.image_1
            ? fetchImageAsBase64(proofData.image_1)
            : Promise.resolve(""),
          proofData.image_2
            ? fetchImageAsBase64(proofData.image_2)
            : Promise.resolve(""),
          proofData.image_3
            ? fetchImageAsBase64(proofData.image_3)
            : Promise.resolve(""),
          proofData.image_4
            ? fetchImageAsBase64(proofData.image_4)
            : Promise.resolve(""),
        ]);

        const evidenceBase64 = [
          image1Base64,
          image2Base64,
          image3Base64,
          image4Base64,
        ];

        const printableElement = document.createElement("div");
        printableElement.className = "ot-print-temp";
        printableElement.innerHTML = `
          <div class="ot-header-temp">
            <div class="ot-logo" style="width:140px">${
              logoBase64
                ? `<img src="${logoBase64}" style="max-height:45px">`
                : ""
            }</div>
            <div class="ot-doc-title-temp">แบบคำขอทำงานล่วงเวลา (OT)</div>
            <div class="ot-doc-meta-temp">
              <div><strong>ประจำเดือน:</strong> ${
                headerDate
                  ? `${dayjs(headerDate).format("MM")}/${
                      dayjs(headerDate).year() + 543
                    }`
                  : "-"
              }</div>
              <div><strong>วันที่พิมพ์:</strong> ${formatDateThai(
                headerDate,
              )}</div>
            </div>
          </div>

          <div class="ot-info-temp">
            <div style="display:flex"><span class="ot-label-temp">ชื่อ - สกุล:</span><span class="ot-value-temp">${requesterName}</span></div>
            <div style="display:flex"><span class="ot-label-temp">รหัสพนักงาน:</span><span class="ot-value-temp">${employeeCode}</span></div>
            <div style="display:flex"><span class="ot-label-temp">ตำแหน่ง:</span><span class="ot-value-temp">${requesterPosition}</span></div>
            <div style="display:flex"><span class="ot-label-temp">ฝ่าย/แผนก:</span><span class="ot-value-temp">${requesterDepartment}</span></div>
          </div>

          <div class="ot-section-header">รายละเอียดการทำงานล่วงเวลา (ตามแผน)</div>
          <table class="ot-table-temp">
            <colgroup>
              <col style="width:6%">
              <col style="width:13%">
              <col style="width:36%">
              <col style="width:12%">
              <col style="width:12%">
              <col style="width:11%">
              <col style="width:10%">
            </colgroup>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>วันที่</th>
                <th>รายละเอียดงานที่ปฏิบัติจริง</th>
                <th>เวลาเริ่ม</th>
                <th>เวลาสิ้นสุด</th>
                <th>รวม (ชม.)</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${(data.descriptions || [])
                .map((descriptionItem: any, itemIndex: number) => {
                  const diffMinutes =
                    descriptionItem.start_date && descriptionItem.end_date
                      ? dayjs(descriptionItem.end_date)
                          .add(1, "hour")
                          .startOf("hour")
                          .diff(
                            dayjs(descriptionItem.start_date).startOf("hour"),
                            "minute",
                          )
                      : (Number(descriptionItem.duration) || 0) * 60;

                  return `<tr>
                    <td>${itemIndex + 1}</td>
                    <td>${
                      descriptionItem.date
                        ? formatDateThai(descriptionItem.date)
                        : "-"
                    }</td>
                    <td class="desc-cell">${
                      descriptionItem.description || "-"
                    }</td>
                    <td>${
                      descriptionItem.start_date
                        ? dayjs(descriptionItem.start_date).format("HH:00")
                        : "-"
                    }</td>
                    <td>${
                      descriptionItem.end_date
                        ? dayjs(descriptionItem.end_date)
                            .add(1, "hour")
                            .format("HH:00")
                        : "-"
                    }</td>
                    <td style="font-weight:600">${formatDurationToDecimal(
                      diffMinutes,
                    )}</td>
                    <td>-</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>

          <div class="ot-summary-temp">
            <div style="margin-right:auto; color:#555;">เหตุผลการขอ: <span style="color:#111">${
              data.reason || "-"
            }</span></div>
            <div class="ot-total-label">รวมเวลาทั้งหมด (Plan):</div>
            <div class="ot-total-value">${formatDurationToDecimal(
              totalBudgetHours * 60,
            )}</div>
          </div>

          <div class="ot-sign-container-temp">
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ขออนุมัติ</div>
              <div style="height:45px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:2px;">
                ${
                  signatureBase64
                    ? `<img src="${signatureBase64}" style="max-height:40px;">`
                    : ""
                }
              </div>
              <div class="ot-sign-line-temp"></div>
              <div style="font-size:11px; font-weight:600; color:#334155;">(${requesterName
                .replace(/\s*\([^)]*\)/g, "")
                .trim()})</div>
              <div style="font-size:9px; color:#64748b; margin-top:1px;">${requesterPosition}</div>
              <div style="font-size:9px; color:#94a3b8; margin-top:2px;">วันที่ ${formatDateThai(
                headerDate,
                " / ",
              )}</div>
            </div>
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ตรวจสอบ / รับทราบ</div>
              <div style="height:45px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:2px;">
                ${
                  approverSignatureBase64
                    ? `<img src="${approverSignatureBase64}" style="max-height:40px;">`
                    : ""
                }
              </div>
              <div class="ot-sign-line-temp"></div>
              <div style="font-size:11px; font-weight:600; color:#334155;">(ธนัท พรหมพิริยา)</div>
              <div style="font-size:9px; color:#64748b; margin-top:1px;">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
              <div style="font-size:9px; color:#94a3b8; margin-top:2px;">วันที่ ${formatDateThai(
                headerDate,
                " / ",
              )}</div>
            </div>
          </div>

          <div class="ot-sub-form-temp">
            <div class="ot-section-header">ส่วนสำหรับบันทึกการปฏิบัติงานจริง (Actual)</div>
            <table class="ot-table-temp">
              <colgroup>
                <col style="width:6%">
                <col style="width:13%">
                <col style="width:36%">
                <col style="width:12%">
                <col style="width:12%">
                <col style="width:11%">
                <col style="width:10%">
              </colgroup>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>วันที่</th>
                  <th>รายละเอียดงานที่ปฏิบัติจริง</th>
                  <th>เวลาเริ่ม</th>
                  <th>เวลาสิ้นสุด</th>
                  <th>รวม (ชม.)</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                ${(data.descriptions || [])
                  .map((descriptionItem: any, itemIndex: number) => {
                    // คำนวณจาก start_date/end_date จริง รองรับข้ามเที่ยงคืน
                    const diffMinutes = calcActualMinutes(
                      descriptionItem.start_date ?? null,
                      descriptionItem.end_date ?? null,
                    );

                    return `<tr>
                      <td>${itemIndex + 1}</td>
                      <td>${
                        descriptionItem.date
                          ? formatDateThai(descriptionItem.date)
                          : "-"
                      }</td>
                      <td class="desc-cell">${
                        descriptionItem.description || "-"
                      }</td>
                      <td>${
                        descriptionItem.start_date
                          ? dayjs(descriptionItem.start_date).format("HH:mm")
                          : "-"
                      }</td>
                      <td>${
                        descriptionItem.end_date
                          ? dayjs(descriptionItem.end_date).format("HH:mm")
                          : "-"
                      }</td>
                      <td style="font-weight:600">${formatDurationToDecimal(
                        diffMinutes,
                      )}</td>
                      <td>-</td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
            <div class="ot-summary-temp">
              <div style="margin-left:auto" class="ot-total-label">รวมเวลาปฏิบัติงานจริง (Actual):</div>
              <div class="ot-total-value">${formatDurationToDecimal(
                totalActualMinutes,
              )} </div>
            </div>

            <div class="ot-sign-container-temp">
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้บันทึกการทำงาน</div>
                <div style="height:45px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:2px;">
                  ${
                    signatureBase64
                      ? `<img src="${signatureBase64}" style="max-height:40px;">`
                      : ""
                  }
                </div>
                <div class="ot-sign-line-temp"></div>
                <div style="font-size:11px; font-weight:600; color:#334155;">(${requesterName
                  .replace(/\s*\([^)]*\)/g, "")
                  .trim()})</div>
                <div style="font-size:9px; color:#64748b; margin-top:1px;">${requesterPosition}</div>
                <div style="font-size:9px; color:#94a3b8; margin-top:2px;">วันที่ ${formatDateThai(
                  headerDate,
                  " / ",
                )}</div>
              </div>
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้รับรองการทำงาน</div>
                <div style="height:45px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:2px;">
                  ${
                    approverSignatureBase64
                      ? `<img src="${approverSignatureBase64}" style="max-height:40px;">`
                      : ""
                  }
                </div>
                <div class="ot-sign-line-temp"></div>
                <div style="font-size:11px; font-weight:600; color:#334155;">(ธนัท พรหมพิริยา)</div>
                <div style="font-size:9px; color:#64748b; margin-top:1px;">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
                <div style="font-size:9px; color:#94a3b8; margin-top:2px;">วันที่ ${formatDateThai(
                  headerDate,
                  " / ",
                )}</div>
              </div>
            </div>
          </div>
        `;
        temporaryContainer.appendChild(printableElement);

        const evidenceElement = document.createElement("div");
        evidenceElement.className = "ot-print-temp";
        evidenceElement.innerHTML = `
          <div class="evidence-page-temp">
            <div style="font-size:16px; font-weight:700; text-align:center; border:2px solid #000; padding:8px; border-radius:4px;">หลักฐานการทำงาน</div>
            <div class="evidence-grid-temp">
              ${[0, 1, 2, 3]
                .map(
                  (index) => `
                <div class="evidence-item-temp">
                  <div class="evidence-label-temp">หลักฐาน #${index + 1}</div>
                  <div class="evidence-img-wrapper-temp">
                    ${
                      evidenceBase64[index]
                        ? `<img src="${evidenceBase64[index]}" class="evidence-img-temp">`
                        : `<div style="color:#999">ไม่มีรูปภาพ</div>`
                    }
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `;
        temporaryContainer.appendChild(evidenceElement);

        itemsForZip.push({
          employeeCode,
          fileName: `OT${data.id}_${employeeCode}_${requesterName}_${dayjs(
            data.request_date,
          ).format("DD-MM-YYYY")}.pdf`,
          element: [printableElement, evidenceElement],
        });
      }

      setBulkTrackingData(
        itemsForZip.map((item, index) => ({
          key: `${item.fileName}_${index}`,
          fileName: item.fileName,
          status: "waiting",
          progress: 0,
        })),
      );
      setIsBulkTrackingModalVisible(true);

      await bulkPdfDownloadService.generateZip(
        itemsForZip,
        `SB_OT_Bulk_${dayjs().format("YYYYMMDD_HHmm")}.zip`,
        (index: number, total: number, status: string, fileName: string) => {
          setBulkDownloadProgress(
            Math.round(
              ((index + (status === "completed" ? 1 : 0)) / total) * 100,
            ),
          );

          setBulkTrackingData((previousData) => {
            const nextData = [...previousData];
            if (
              nextData[index] &&
              (nextData[index].fileName === fileName || status === "zipping")
            ) {
              nextData[index] = {
                ...nextData[index],
                status,
              };
              return nextData;
            }

            const targetIndex = nextData.findIndex(
              (item) => item.fileName === fileName,
            );
            if (status === "zipping") {
              return previousData.map((item) => ({
                ...item,
                status: item.status === "completed" ? "completed" : "failed",
              }));
            }

            if (targetIndex !== -1) {
              nextData[targetIndex] = {
                ...nextData[targetIndex],
                status,
              };
            }
            return nextData;
          });
        },
      );

      document.body.removeChild(temporaryContainer);
      toast.success("ดาวน์โหลดไฟล์ ZIP สำเร็จ");
      setTimeout(() => setIsBulkTrackingModalVisible(false), 3000);
    } catch (error) {
      console.error("Bulk Download Error:", error);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด กรุณาลองใหม่");
      setIsBulkTrackingModalVisible(false);
    } finally {
      setIsBulkLoading(false);
      setBulkDownloadProgress(0);
    }
  }, [selectedKeys]);

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
              const ok = await changeStatus(
                key as string | number,
                "rejected",
                reason,
              );
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
    const overdueFrom = dayjs()
      .subtract(365, "day")
      .startOf("day")
      .toISOString();
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
          <BulkDownloadTrackingModal
            visible={isBulkTrackingModalVisible}
            onClose={() => setIsBulkTrackingModalVisible(false)}
            bulkDownloadProgress={bulkDownloadProgress}
            bulkTrackingData={bulkTrackingData}
          />

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
                  icon={<SolutionOutlined />}
                  size="large"
                  onClick={() => setIsFixDateVisible(true)}
                  danger
                >
                  แก้ไขวันที่ผิด
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
            onBulkPdfDownloadZip={handleBulkPdfDownloadZip}
            onBulkSendEmail={() => setIsBulkEmailVisible(true)}
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
                : rejectModal.overtimeId ?? undefined
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

          {/* Modal ส่ง OT PDF ทางอีเมลแบบ Bulk */}
          <BulkEmailModal
            open={isBulkEmailVisible}
            onClose={() => setIsBulkEmailVisible(false)}
            selectedKeys={selectedKeys}
            selectedRecords={dataSource.filter((r) =>
              selectedKeys.includes(r.id ?? r.key),
            )}
          />

          {/* Modal แก้ไขวันที่ผิดปกติ */}
          <FixDateModal
            open={isFixDateVisible}
            onClose={() => setIsFixDateVisible(false)}
            onFixed={() => loadOvertimeData({ page: currentPageRef.current })}
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
