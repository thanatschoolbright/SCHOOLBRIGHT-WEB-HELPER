"use client";

import {
  DeliveryLoadingModal,
  overtimeSubmissionSteps,
} from "@/components/modal/delivery-loading-modal";
import { App, Badge, Button, Flex, Form, Space } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BellOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { toast } from "sonner";

import StatusModalComponent, {
  type StatusModalProps,
} from "@/components/modal/status-modal";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import ActionBarSection from "./_components/action-bar-section";
import AnalyticsModal from "./_components/analytics-modal";
import BatchStatusModal from "./_components/batch-status-modal";
import BulkDownloadTrackingModal from "./_components/bulk-download-tracking-modal";
import CreateModal from "./_components/create-modal";
import DetailModal from "./_components/detail-modal";
import ExportModal from "./_components/export-modal";
import FilterSection from "./_components/filter-section";
import PayCalculatorModal from "./_components/pay-calculator-modal";
import PersonalOtSummary from "./_components/personal-ot-summary";
import RejectReasonModal from "./_components/reject-reason-modal";
import RemindModal from "./_components/remind-modal";
import RulesModal from "./_components/rules-modal";
import SummarySection from "./_components/summary-section";
import TimelineModal from "./_components/timeline-modal";
import UserTable from "./_components/user-table";

import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@/stores/store";
import { getUserData } from "@helpers/local_storage/user.storage";
import type { SelectOption, UserProfile } from "@stores/type";

import { useOvertimeStore } from "./_state/overtime-store";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(buddhistEra);
dayjs.locale("th");

const BYPASS_USER_ID = "49"; // ID ของ User แทน admin_id: "117"

interface OvertimeDescription {
  id?: string | number;
  date?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  description?: string;
  assignee?: string;
}

interface OvertimeRecord {
  id: string | number;
  requester_id?: string;
  request_date?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  descriptions?: OvertimeDescription[];
  [key: string]: any;
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const OvertimeManagementPage = ({ hrEmail }: { hrEmail?: string }) => {
  // --- เครื่องมือพื้นฐาน (Hooks & Helpers) ---
  const navigationRouter = useRouter();
  const { t: translate } = useTranslation();

  App.useApp();
  useSession();
  const { user_id: parameterUserId } = useParams();

  // จัดการสถานะแบบฟอร์ม (Form Instances)
  const [overtimeForm] = Form.useForm();
  const authenticationState = useAppSelector((state) => state.callAdminLogin);

  // --- Zustund Store สำหรับจัดการสถานะ Overtime (Refactored) ---
  const {
    bulkDownloadProgress,
    isBulkTrackingModalVisible,
    bulkTrackingData,
    setIsBulkDownloading,
    setBulkDownloadProgress,
    setIsBulkTrackingModalVisible,
    setBulkTrackingData,
    setIsLoadingOvertimeData: setStoreIsLoadingOvertimeData,
    setOvertimeDataSource: setStoreOvertimeDataSource,
    setTotalRecords,
    overtimeDataSource: storeOvertimeDataSource,
  } = useOvertimeStore();

  // นับ pending requests สำหรับแสดง Badge ใน HeaderBar
  const pendingCount = React.useMemo(
    () => storeOvertimeDataSource.filter((r) => r.status === "pending").length,
    [storeOvertimeDataSource],
  );

  // ตรวจสอบว่า user ปัจจุบันคือ admin (bypass user) หรือไม่
  const currentUserIdForPersonal = String(
    authenticationState?.response?.data?.user_data?.id ?? "",
  );
  const isCurrentUserAdmin = currentUserIdForPersonal === BYPASS_USER_ID;

  // ฟังก์ชันดึงข้อมูล OT ส่วนตัว สำหรับ PersonalOtSummary
  const fetchPersonalOtData = useCallback(
    async (params: { from: string; to: string; request_id: string }) => {
      try {
        const response = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          {
            limit: 200,
            offset: 0,
            request_id: params.request_id,
            from: params.from,
            to: params.to,
          },
        );
        if (response?.data?.status === 200) {
          return Array.isArray(response.data.data) ? response.data.data : [];
        }
        return [];
      } catch {
        return [];
      }
    },
    [],
  );

  // --- สถานะการแสดงผล UI (Visibility State) ---
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isBatchStatusModalVisible, setIsBatchStatusModalVisible] =
    useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isAnalyticsModalVisible, setIsAnalyticsModalVisible] = useState(false);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState(false);
  const [isTimelineModalVisible, setIsTimelineModalVisible] = useState(false);
  const [isRemindModalVisible, setIsRemindModalVisible] = useState(false);
  const [rejectReasonModal, setRejectReasonModal] = useState<{
    open: boolean;
    overtimeId: string | number | null;
  }>({ open: false, overtimeId: null });
  const [isPayCalculatorVisible, setIsPayCalculatorVisible] = useState(false);

  // --- สถานะการส่งคำขอ OT (Submission Tracking) ---
  const [isSubmissionLoading, setIsSubmissionLoading] = useState(false);
  const [currentSubmissionStep, setCurrentSubmissionStep] = useState(0);

  // --- ข้อมูลและผลลัพธ์จาก API (Data State) ---
  const [isLoadingOvertimeData, setIsLoadingOvertimeData] = useState(false);
  const [overtimeDataSource, setOvertimeDataSource] = useState<
    OvertimeRecord[]
  >([]);
  const [selectedOvertimeDetail, setSelectedOvertimeDetail] =
    useState<OvertimeRecord | null>(null);
  const [userSelectionOptions, setUserSelectionOptions] = useState<
    SelectOption[]
  >([]);
  const [_descriptionSelectionOptions, setDescriptionSelectionOptions] =
    useState<SelectOption[]>([]);

  // --- สถานะการกรองและแบ่งหน้า (Pagination & Filters) ---
  const [paginationState, setPaginationState] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filterSelectedMonthValue, _setFilterSelectedMonthValue] =
    useState<dayjs.Dayjs | null>(null);

  // --- สถานะการทำงานแบบกลุ่ม (Batch Processing State) ---
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processedRecordItems, setProcessedRecordItems] = useState<
    Map<React.Key, "waiting" | "processing" | "completed" | "failed">
  >(new Map());
  const [selectedBatchStatus, setSelectedBatchStatus] =
    useState<string>("approved");

  // --- สถานะการส่งออกข้อมูล (Export State) ---
  const [exportStepCount, setExportStepCount] = useState(0);
  const [isExportOperationSuccess, setIsExportOperationSuccess] =
    useState(false);
  const [exportSelectedDateRange, setExportSelectedDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >([dayjs().startOf("month"), dayjs().endOf("month")]);

  // --- ส่วนควบคุม Modal แจ้งเตือนกลาง (Feedback Modal) ---
  const [modalState, setModalState] = useState<StatusModalProps>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  // ดึงข้อมูลรหัสผู้ดูแลระบบปัจจุบันจากสถานะการเข้าสู่ระบบหรือ Local Storage
  const requestCurrentLocalUserID = useCallback(async (): Promise<string> => {
    try {
      const userId = authenticationState?.response?.data?.user_data?.id;
      if (userId) return String(userId);

      const users = getUserData() as UserProfile[] | null;
      if (Array.isArray(users) && users.length > 0) {
        return String(users[0]?.id ?? "system");
      }
    } catch (error) {
      console.error(error);
    }
    return "system";
  }, [authenticationState]);

  // จัดการและแสดงข้อความแสดงข้อผิดพลาดของระบบผ่าน Modal
  const processAndDisplaySystemError = useCallback(
    (error: any, errorTitle: string = "ระบบขัดข้อง") => {
      console.error(error);
      setModalState({
        open: true,
        type: "error",
        title: errorTitle,
        message: error?.message || "ไม่สามารถดำเนินการได้ในขณะนี้",
      });
    },
    [],
  );

  // ดึงรายการผู้ใช้งานทั้งหมดสำหรับใช้ในตัวเลือก Select
  const requestUserSelectionListData = useCallback(async () => {
    try {
      const apiResponse = await callApiService.get(
        "/api/v1/timesheet/overtime/users",
      );

      const responseData = apiResponse?.data;
      if (!responseData || responseData.status !== 200) {
        setUserSelectionOptions([]);
        return;
      }

      const userList = Array.isArray(responseData.data)
        ? responseData.data
        : [];

      if (!userList || userList.length === 0) {
        setUserSelectionOptions([]);
        return;
      }

      const selectionOptions = userList.map((user: any) => {
        const nicknameValue = user.nickname ? `(${user.nickname})` : "";
        const employeeCodeValue = user.employee_code
          ? `(${user.employee_code})`
          : "";
        const firstName = user.firstname || user.firstname_th || "";
        const lastName = user.lastname || user.lastname_th || "";

        return {
          label:
            `${firstName} ${lastName} ${nicknameValue} ${employeeCodeValue}`.trim(),
          value: String(user.id),
        };
      });

      setUserSelectionOptions(selectionOptions);
    } catch (error) {
      console.error("Error fetching user selection list:", error);
      setUserSelectionOptions([]);
    }
  }, []);

  // ดึงรายการรายละเอียดงานล่าสุดเพื่อนำมาเป็นคำแนะนำในการกรอกข้อมูล
  const requestDescriptionSelectionListData = useCallback(async () => {
    try {
      const currentUserId = authenticationState?.response?.data?.user_data?.id;

      const requestParameters: any = {
        limit: 30,
        page: 1,
      };

      if (currentUserId) {
        requestParameters.user_id = Number(currentUserId);
      }

      const apiResponseResult = await callApiService.post(
        "/api/v1/timesheet/entry/read/",
        requestParameters,
      );
      const entryItems = apiResponseResult?.data?.data ?? [];

      const descriptionOptionsSource = entryItems.map((item: any) => ({
        label: item.description,
        value: item.description,
      }));

      const uniqueDescriptionOptionsMap = descriptionOptionsSource.reduce(
        (accumulator: SelectOption[], currentItem: SelectOption) => {
          if (
            !accumulator.find(
              (targetItem) => targetItem.value === currentItem.value,
            )
          ) {
            accumulator.push(currentItem);
          }
          return accumulator;
        },
        [],
      );

      setDescriptionSelectionOptions(uniqueDescriptionOptionsMap);
    } catch (error) {
      console.error(error);
    }
  }, [authenticationState]);

  // ดึงข้อมูลรายการคำขอ OT พร้อมรองรับการกรองและแบ่งหน้า
  const requestOvertimeRequestListData = useCallback(
    async (requestOptionsParameter?: {
      page?: number;
      pageSize?: number;
      filters?: any;
      overtimeId?: string | number;
      searchText?: string;
      monthValue?: dayjs.Dayjs | null;
      statusValue?: string | null;
    }) => {
      const currentPageIndex = requestOptionsParameter?.page ?? 1;
      const currentPageSizeValue =
        requestOptionsParameter?.pageSize ?? paginationState.pageSize;
      const requestFiltersDataValues = requestOptionsParameter?.filters ?? {};
      const targetOvertimeIdentifier = requestOptionsParameter?.overtimeId;
      const appliedSearchText = requestOptionsParameter?.searchText ?? "";
      const appliedMonthValue = requestOptionsParameter?.monthValue ?? null;
      const appliedStatusValue = requestOptionsParameter?.statusValue ?? null;

      try {
        setIsLoadingOvertimeData(true);

        const currentUserIdValue = await requestCurrentLocalUserID();

        const isBypassUser = currentUserIdValue === BYPASS_USER_ID;

        const effectiveRequestId = parameterUserId
          ? String(parameterUserId)
          : currentUserIdValue;

        const filterApiParams = {
          ...(appliedMonthValue
            ? {
                from: appliedMonthValue.startOf("month").toISOString(),
                to: appliedMonthValue.endOf("month").toISOString(),
              }
            : {}),
          ...(appliedStatusValue ? { status: appliedStatusValue } : {}),
          ...(appliedSearchText ? { search: appliedSearchText } : {}),
        };

        const apiRequestParametersBody = targetOvertimeIdentifier
          ? { id: String(targetOvertimeIdentifier) }
          : {
              limit: currentPageSizeValue,
              offset: (currentPageIndex - 1) * currentPageSizeValue,
              ...(!isBypassUser ? { request_id: effectiveRequestId } : {}),
              ...requestFiltersDataValues,
              ...filterApiParams,
            };

        const apiResponseFullPayload = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          apiRequestParametersBody,
        );
        const apiResponseDataContent = apiResponseFullPayload?.data;

        if (!apiResponseDataContent || apiResponseDataContent.status !== 200) {
          throw new Error(
            apiResponseDataContent?.message_th || "ไม่สามารถดึงข้อมูลโอทีได้",
          );
        }

        const overtimeRecordsListContent = Array.isArray(
          apiResponseDataContent.data,
        )
          ? apiResponseDataContent.data
          : [];

        if (targetOvertimeIdentifier) return overtimeRecordsListContent;

        setOvertimeDataSource(
          overtimeRecordsListContent.map((item: any) => ({
            key: item.id,
            ...item,
          })),
        );
        setStoreOvertimeDataSource(
          overtimeRecordsListContent.map((item: any) => ({
            key: item.id,
            ...item,
          })),
        );
        setPaginationState({
          current: apiResponseDataContent.pagination?.page ?? currentPageIndex,
          pageSize:
            apiResponseDataContent.pagination?.page_size ??
            currentPageSizeValue,
          total:
            apiResponseDataContent.pagination?.total ??
            overtimeRecordsListContent.length,
        });
        setTotalRecords(
          apiResponseDataContent.pagination?.total ??
            overtimeRecordsListContent.length,
        );

        return overtimeRecordsListContent;
      } catch (error) {
        processAndDisplaySystemError(error, "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        return null;
      } finally {
        setIsLoadingOvertimeData(false);
        setStoreIsLoadingOvertimeData(false);
      }
    },
    [
      paginationState.pageSize,
      parameterUserId,
      requestCurrentLocalUserID,
      processAndDisplaySystemError,
      setStoreIsLoadingOvertimeData,
      setStoreOvertimeDataSource,
      setTotalRecords,
    ],
  );

  // --- ฟังก์ชันช่วยเหลือสำหรับการประมวลผลข้อมูล (Utility Functions) ---

  /**
   * ตรวจสอบความถูกต้องของไฟล์รูปภาพ (ขนาดห้ามเกิน 2MB)
   * @param files รายการไฟล์ที่ต้องการตรวจสอบ
   * @returns boolean (true = ผ่าน, false = ไม่ผ่าน)
   */
  const validateImageFiles = useCallback((files: any[]): boolean => {
    const MAX_SIZE = 2 * 1024 * 1024;
    for (const file of files) {
      const rawFile = file.originFileObj || file;
      if (rawFile && rawFile.size > MAX_SIZE) {
        toast.error(`ไฟล์ "${rawFile.name}" ใหญ่เกินไป (จำกัด 2MB)`);
        return false;
      }
    }
    return true;
  }, []);

  /**
   * อัปโหลดไฟล์รูปภาพไปยัง Server
   * @param file ไฟล์ที่ต้องการอัปโหลด
   * @param descriptionId ID ของรายการงาน
   * @param key ชื่อ Key สำหรับเก็บรูปภาพ (เช่น image_1, signature_1)
   */
  const uploadBinaryImage = async (
    file: any,
    descriptionId: string | number,
    key: string,
  ) => {
    const rawFile = file.originFileObj || file;
    const formData = new FormData();
    formData.append("file", rawFile);
    formData.append("description_id", String(descriptionId));
    formData.append("image_key", key);
    formData.append("action", "upload");

    try {
      await callApiService.post(
        "/api/v1/timesheet/overtime/upload-images",
        formData,
      );
    } catch (error) {
      console.error(`Upload error [${key}]:`, error);
    }
  };

  // --- ฟังก์ชันจัดการธุรกรรมหลัก (Primary Request Handlers) ---

  // ส่งคำร้องขอสร้างรายการปฏิบัติงานล่วงเวลาใหม่ไปยังระบบ
  const requestCreateOvertimeSubmission = async (
    formSubmissionPayload: any,
  ) => {
    try {
      setIsSubmissionLoading(true);
      setCurrentSubmissionStep(0); // ขั้นตอนที่ 1: เตรียมข้อมูล
      const currentOperatingUserToken = await requestCurrentLocalUserID();

      // 1. ตรวจสอบความถูกต้องของไฟล์รูปภาพก่อนดำเนินธุรกรรม
      // แปลง UploadFile | null ให้เป็น array เพื่อให้ spread ได้ถูกต้อง
      const toFileArray = (f: any): any[] => (f ? [f] : []);
      const allFiles = [
        ...toFileArray(formSubmissionPayload.proof_checkin),
        ...toFileArray(formSubmissionPayload.proof_checkout),
        ...toFileArray(formSubmissionPayload.proof_work_1),
        ...toFileArray(formSubmissionPayload.proof_work_2),
        ...toFileArray(formSubmissionPayload.signature_file),
      ];
      if (!validateImageFiles(allFiles)) {
        setIsSubmissionLoading(false);
        return null;
      }

      // 2. เตรียมข้อมูล Payload สำหรับการสร้าง Record หลัก
      const baseDate = formSubmissionPayload.request_date
        ? dayjs(formSubmissionPayload.request_date).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

      const submissionBodyPayload = {
        ...formSubmissionPayload,
        request_date: baseDate,
        descriptions: (formSubmissionPayload.descriptions || []).map(
          (desc: any) => {
            const start = dayjs(desc.startDate);
            const end = dayjs(desc.endDate);
            const base = dayjs(baseDate);

            // คำนวณ startDate โดยใช้ base date
            const startIso = base
              .hour(start.hour())
              .minute(start.minute())
              .second(0)
              .toISOString();

            // ตรวจสอบว่า end_date ข้ามเที่ยงคืนหรือไม่
            // ถ้า end < start (เวลา) แสดงว่าข้ามวัน → ใช้ base + 1 วัน
            const startBaseTime = base
              .hour(start.hour())
              .minute(start.minute())
              .second(0);
            const endBaseTime = base
              .hour(end.hour())
              .minute(end.minute())
              .second(0);
            const isOvernight = endBaseTime.isBefore(startBaseTime);
            const endBase = isOvernight ? base.add(1, "day") : base;
            const endIso = endBase
              .hour(end.hour())
              .minute(end.minute())
              .second(0)
              .toISOString();

            return {
              ...desc,
              duration: Number(desc.duration || 0),
              startDate: startIso,
              endDate: endIso,
              assignee: String(formSubmissionPayload.assignee),
            };
          },
        ),
        created_by: Number(currentOperatingUserToken),
        requester_id: String(currentOperatingUserToken),
      };

      // ลบข้อมูลส่วนเกินที่ไม่ได้ใช้ใน JSON API
      [
        "assignee",
        "start_time",
        "end_time",
        "proof_checkin",
        "proof_checkout",
        "proof_work_1",
        "proof_work_2",
        "signature_file",
      ].forEach((key) => delete (submissionBodyPayload as any)[key]);

      setCurrentSubmissionStep(1); // ขั้นตอนที่ 2: บันทึกข้อมูลลงฐานข้อมูล

      // 3. ยิง API สร้างรายการหลัก
      let result;
      try {
        result = await callApiService.post(
          "/api/v1/timesheet/overtime/create",
          submissionBodyPayload,
        );
      } catch (axiosErr: any) {
        setIsSubmissionLoading(false);
        const errData = axiosErr?.response?.data;
        // 409 = เวลาซ้อนทับกับรายการ OT ที่มีอยู่
        if (axiosErr?.response?.status === 409 || errData?.status === 409) {
          const detail = errData?.error?.conflict_details ?? "";
          setModalState({
            open: true,
            type: "error",
            title: "ช่วงเวลา OT ซ้อนทับกับรายการที่มีอยู่",
            message: `ไม่สามารถสร้างคำขอ OT ได้ เนื่องจากช่วงเวลาที่เลือกซ้อนทับกับรายการ OT ที่มีอยู่แล้วของพนักงานคนนี้${
              detail ? `\n\n${detail}` : ""
            }`,
          });
          return null;
        }
        processAndDisplaySystemError(
          axiosErr,
          "เกิดข้อผิดพลาดในการสร้างรายการ",
        );
        return null;
      }
      const resData = result?.data;

      if (resData && (resData.status === 200 || resData.status === 201)) {
        setCurrentSubmissionStep(2); // ขั้นตอนที่ 3: ส่งอีเมลแจ้งเตือน
        const firstId = resData.data?.descriptions?.[0]?.id;

        if (firstId) {
          // 4. ทยอยอัปโหลดไฟล์รูปภาพหลักฐานและลายเซ็น (Global Context)
          // ทุก proof_* และ signature_file เป็น UploadFile | null (ไม่ใช่ array)
          const uploadJobs = [
            { key: "image_1", file: formSubmissionPayload.proof_checkin },
            { key: "image_2", file: formSubmissionPayload.proof_checkout },
            { key: "image_3", file: formSubmissionPayload.proof_work_1 },
            { key: "image_4", file: formSubmissionPayload.proof_work_2 },
            { key: "signature_1", file: formSubmissionPayload.signature_file },
          ];

          for (const job of uploadJobs) {
            if (job.file) {
              await uploadBinaryImage(job.file, firstId, job.key);
            }
          }

          // กรณีผู้ใช้เลือกใช้ลายเซ็นในระบบ (default) — ดึงรูปจาก URL แล้วอัปโหลดขึ้น server
          if (
            formSubmissionPayload.signature_mode === "default" &&
            formSubmissionPayload.signature_default_url &&
            !formSubmissionPayload.signature_file
          ) {
            try {
              const signatureUrl =
                formSubmissionPayload.signature_default_url as string;
              const fetchUrl = signatureUrl.startsWith("/")
                ? signatureUrl
                : `/api/v1/proxy/image?url=${encodeURIComponent(signatureUrl)}`;
              const res = await fetch(fetchUrl);
              const blob = await res.blob();
              const ext = blob.type.includes("png") ? "png" : "jpg";
              const file = new File([blob], `signature_default.${ext}`, {
                type: blob.type,
              });
              await uploadBinaryImage(
                { originFileObj: file },
                firstId,
                "signature_1",
              );
            } catch (err) {
              console.error("ไม่สามารถอัปโหลดลายเซ็น default ได้:", err);
            }
          }
        }

        setCurrentSubmissionStep(3); // ขั้นตอนที่ 4: เสร็จสมบูรณ์
        toast.success(resData.message_th ?? "สร้างรายการสำเร็จ");
        setTimeout(() => {
          setIsSubmissionLoading(false);
        }, 1000);
        return resData.data;
      }
      throw new Error(resData?.message_th ?? "ไม่สามารถสร้างรายการได้");
    } catch (error) {
      setIsSubmissionLoading(false);
      processAndDisplaySystemError(error, "เกิดข้อผิดพลาดในการสร้างรายการ");
      return null;
    }
  };

  // ส่งคำร้องขอเพื่อลบรายการปฏิบัติงานล่วงหน้าที่ระบุออกจากสถานทูตข้อมูล
  const requestDeleteOvertimeSubmission = async (
    overtimeSubmissionIdentifier?: string | number,
  ) => {
    if (!overtimeSubmissionIdentifier) return;
    try {
      setIsLoadingOvertimeData(true);
      const currentDeleterToken = await requestCurrentLocalUserID();
      const apiResponseResultObject = await callApiService.post(
        `/api/v1/timesheet/overtime/delete?id=${overtimeSubmissionIdentifier}`,
        { deleted_by: String(currentDeleterToken) },
      );
      if (apiResponseResultObject?.data?.status === 200) {
        toast.success(
          apiResponseResultObject.data.message_th ?? "ลบรายการสำเร็จ",
        );
        await requestOvertimeRequestListData({ page: paginationState.current });
        return apiResponseResultObject.data.data;
      }
      throw new Error(
        apiResponseResultObject?.data?.message_th ?? "ไม่สามารถลบรายการได้",
      );
    } catch (error) {
      processAndDisplaySystemError(error, "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setIsLoadingOvertimeData(false);
    }
  };

  // ปรับเปลี่ยนสถานะของคำขอ OT (เช่น อนุมัติ หรือ ปฏิเสธ) สำหรับรายการที่ระบุ
  const requestApproveOvertimeSubmission = async (
    overtimeSubmissionIdentifier?: string | number,
    targetStatusString: string = "approved",
    rejectNote?: string,
  ) => {
    if (!overtimeSubmissionIdentifier) return;
    try {
      setIsLoadingOvertimeData(true);
      const currentApproverToken = await requestCurrentLocalUserID();
      if (currentApproverToken !== BYPASS_USER_ID) {
        toast.error("คุณไม่มีสิทธิ์ปรับสถานะ");
        return;
      }
      const apiResponseResultObject = await callApiService.post(
        `/api/v1/timesheet/overtime/change-status?id=${overtimeSubmissionIdentifier}`,
        {
          status: targetStatusString,
          updated_by: Number(currentApproverToken),
          ...(rejectNote ? { note: rejectNote } : {}),
        },
      );
      if (apiResponseResultObject?.data?.status === 200) {
        toast.success(
          apiResponseResultObject.data.message_th ?? "อนุมัติเรียบร้อยแล้ว",
        );
        await requestOvertimeRequestListData({ page: paginationState.current });
        return apiResponseResultObject.data.data;
      }
      throw new Error(
        apiResponseResultObject?.data?.message_th ?? "ไม่สามารถอนุมัติได้",
      );
    } catch (error) {
      processAndDisplaySystemError(error, "เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setIsLoadingOvertimeData(false);
    }
  };

  // ส่งอีเมลแจ้งเตือนไปยังแผนกบุคคล (HR) เพื่อพิจารณาคำขอ OT ที่ระบุ
  const requestSendOvertimeMailToHR = async (
    overtimeSubmissionIdentifier?: string | number,
  ) => {
    if (!overtimeSubmissionIdentifier) return;
    try {
      setIsLoadingOvertimeData(true);
      const documentPreviewURL = `${window.location.origin}/timesheet/overtime/preview/${overtimeSubmissionIdentifier}`;
      const emailRequestPayloadBody = {
        id: String(overtimeSubmissionIdentifier),
        link: documentPreviewURL,
        to: hrEmail || "manager.hr@schoolbright.co",
      };

      const apiResponseResultObject = await callApiService.post(
        "/api/v1/timesheet/overtime/send-email",
        emailRequestPayloadBody,
      );
      if (
        apiResponseResultObject?.data?.status === 200 ||
        apiResponseResultObject?.data?.status === 201
      ) {
        toast.success(
          apiResponseResultObject.data.message_th ??
            "ส่งอีเมลไปยัง HR เรียบร้อยแล้ว",
        );
        return apiResponseResultObject.data.data;
      }
      throw new Error(
        apiResponseResultObject?.data?.message_th ?? "ไม่สามารถส่งอีเมลได้",
      );
    } catch (error) {
      processAndDisplaySystemError(error, "เกิดข้อผิดพลาดขณะส่งอีเมล");
    } finally {
      setIsLoadingOvertimeData(false);
    }
  };

  // อนุมัติสถานะคำขอ OT จำนวนมากพร้อมกันในครั้งเดียว (Batch Update)
  const requestBatchApproveOvertimeSubmissions = async (
    targetStatusString: string | null = "approved",
  ): Promise<void> => {
    if (selectedRowKeys.length === 0) {
      toast.error("กรุณาเลือกรายการ");
      return;
    }

    const currentUserTokenIdentifier = await requestCurrentLocalUserID();
    if (currentUserTokenIdentifier !== BYPASS_USER_ID) {
      toast.error("คุณไม่มีสิทธิ์ปรับสถานะ");
      return;
    }

    setIsBatchProcessing(true);
    // เริ่มต้นสถานะเป็น waiting สำหรับทุกรายการ
    const initialProgress = new Map();
    selectedRowKeys.forEach((key) =>
      initialProgress.set(key, "waiting" as const),
    );
    setProcessedRecordItems(initialProgress);

    let successfulOperationsCount = 0;
    let failedOperationsCount = 0;

    for (const recordIdentifier of selectedRowKeys) {
      try {
        // อัปเดตสถานะรายการที่กำลังประมวลผล
        setProcessedRecordItems((prev) =>
          new Map(prev).set(recordIdentifier, "processing"),
        );

        const operatingApproverToken = await requestCurrentLocalUserID();
        const apiResponseResultObject = await callApiService.post(
          `/api/v1/timesheet/overtime/change-status?id=${String(
            recordIdentifier,
          )}`,
          {
            status: targetStatusString ?? "approved",
            updated_by: Number(operatingApproverToken),
          },
        );

        if (apiResponseResultObject?.data?.status === 200) {
          successfulOperationsCount++;
          setProcessedRecordItems((prev) =>
            new Map(prev).set(recordIdentifier, "completed"),
          );
        } else {
          failedOperationsCount++;
          setProcessedRecordItems((prev) =>
            new Map(prev).set(recordIdentifier, "failed"),
          );
        }
      } catch (error) {
        failedOperationsCount++;
        setProcessedRecordItems((prev) =>
          new Map(prev).set(recordIdentifier, "failed"),
        );
      }
      // ดีเลย์เล็กน้อยเพื่อให้ UI แสดงผลทัน
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsBatchProcessing(false);
    if (successfulOperationsCount > 0) {
      toast.success(
        `สำเร็จ ${successfulOperationsCount} รายการ, ล้มเหลว ${failedOperationsCount} รายการ`,
      );
      await requestOvertimeRequestListData({ page: paginationState.current });
    }
    // ไม่เคลียร์ selectedRowKeys ทันทีเพื่อให้ผู้ใช้เห็นผลลัพธ์ในตาราง Modal
  };

  // ส่งอีเมลแจ้งเตือน HR สำหรับคำขอ OT หลายรายการพร้อมกัน (Batch Email)
  const requestBatchSendOvertimeMailToHR = async (): Promise<void> => {
    if (selectedRowKeys.length === 0) {
      toast.error("กรุณาเลือกรายการ");
      return;
    }

    const currentUserTokenIdentifier = await requestCurrentLocalUserID();
    if (currentUserTokenIdentifier !== BYPASS_USER_ID) {
      toast.error("คุณไม่มีสิทธิ์ส่งอีเมล");
      return;
    }

    setIsBatchProcessing(true);
    setProcessedRecordItems(new Map());
    let emailSentSuccessCount = 0;

    for (const recordIdentifier of selectedRowKeys) {
      try {
        const documentPreviewURL = `${
          window.location.origin
        }/timesheet/overtime/preview/${String(recordIdentifier)}`;
        const emailBodyPayload = {
          id: String(recordIdentifier),
          link: documentPreviewURL,
          to: hrEmail || "manager.hr@schoolbright.co",
        };
        const apiResponseResultObject = await callApiService.post(
          "/api/v1/timesheet/overtime/send-email",
          emailBodyPayload,
        );
        if (
          apiResponseResultObject?.data?.status === 200 ||
          apiResponseResultObject?.data?.status === 201
        ) {
          emailSentSuccessCount++;
          setProcessedRecordItems(
            (prev) =>
              new Map([...prev, [recordIdentifier, "completed" as const]]),
          );
        }
      } catch (error) {
        console.error(error);
      }
    }

    setIsBatchProcessing(false);
    if (emailSentSuccessCount > 0) {
      toast.success(`ส่งหัวข้อคำขอสำเร็จ ${emailSentSuccessCount} รายการ`);
    }
    setSelectedRowKeys([]);
    setProcessedRecordItems(new Map());
  };

  // ประมวลผลและดาวน์โหลดไฟล์รายงาน OT ในรูปแบบ Excel ตามเงื่อนไขที่ระบุ
  const requestExportOvertimeReportFile = async (
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs],
  ) => {
    try {
      setIsLoadingOvertimeData(true);
      setExportStepCount(1);
      setIsExportOperationSuccess(false);

      const currentAdminTokenIdentifier = await requestCurrentLocalUserID();
      const isBypassUserSettingEnabled =
        currentAdminTokenIdentifier === BYPASS_USER_ID;

      const exportRequestParameters: any = {
        requester_id: isBypassUserSettingEnabled
          ? undefined
          : currentAdminTokenIdentifier,
      };

      if (dateRange && dateRange[0] && dateRange[1]) {
        exportRequestParameters.from = dateRange[0].format("YYYY-MM-DD");
        exportRequestParameters.to = dateRange[1].format("YYYY-MM-DD");
      } else {
        const dateTimeToProcess = filterSelectedMonthValue ?? dayjs();
        exportRequestParameters.from = dateTimeToProcess
          .startOf("month")
          .format("YYYY-MM-DD");
        exportRequestParameters.to = dateTimeToProcess
          .endOf("month")
          .format("YYYY-MM-DD");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setExportStepCount(2);

      const apiResponsePayloadBlob = await callApiService.post(
        "/api/v1/timesheet/overtime/export",
        exportRequestParameters,
        { responseType: "blob" },
      );
      setExportStepCount(3);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const fileDownloadURLString = window.URL.createObjectURL(
        new Blob([apiResponsePayloadBlob.data]),
      );
      const fileDownloadAnchorElement = document.createElement("a");
      fileDownloadAnchorElement.href = fileDownloadURLString;

      const finalizedFromDate = dayjs(exportRequestParameters.from);
      const finalizedToDate = dayjs(exportRequestParameters.to);

      const finalResultFileName = `รายงานการทำงานล่วงเวลา_${finalizedFromDate.format(
        "DDMMBBBB",
      )}_ถึง_${finalizedToDate.format("DDMMBBBB")}.xlsx`;
      fileDownloadAnchorElement.setAttribute("download", finalResultFileName);
      document.body.appendChild(fileDownloadAnchorElement);
      fileDownloadAnchorElement.click();
      fileDownloadAnchorElement.remove();
      window.URL.revokeObjectURL(fileDownloadURLString);

      setExportStepCount(0);
      setIsExportOperationSuccess(true);
      return true;
    } catch (error) {
      processAndDisplaySystemError(error, "เกิดข้อผิดพลาดในการส่งออก");
      setExportStepCount(0);
      return false;
    } finally {
      setIsLoadingOvertimeData(false);
    }
  };

  // ดึงรายละเอียดข้อมูลคำขอ OT ฉบับเต็มตามรหัส ID ที่ระบุ

  // จัดการการส่งข้อมูลจากฟอร์มสร้างรายการคำขอ OT ใหม่และรีเซ็ตค่าสถานะ
  const requestHandleCreateOvertimeFormSubmission = async (
    formSubmissionValues: any,
  ): Promise<boolean> => {
    try {
      const responseContentData = await requestCreateOvertimeSubmission(
        formSubmissionValues,
      );
      if (responseContentData) {
        setIsCreateModalVisible(false);
        overtimeForm.resetFields();
        await requestOvertimeRequestListData();
        return true;
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  };

  /**
   * จัดการดาวน์โหลด PDF ทั้งหมดที่เลือกในรูปแบบไฟล์ ZIP
   * แยกโฟลเดอร์ตามรหัสพนักงาน
   */
  const handleBulkPdfDownloadZip = async () => {
    const { bulkPdfDownloadService } = await import(
      "@/helpers/bulk-pdf-download.helper"
    );
    const fetchImageAsBase64 = async (url: string): Promise<string> => {
      try {
        // local paths (public folder) ดึงตรง, external URLs ผ่าน proxy เพื่อแก้ CORS
        const fetchUrl = url.startsWith("/")
          ? url
          : `/api/v1/proxy/image?url=${encodeURIComponent(url)}`;
        const res = await fetch(fetchUrl);
        const blob = await res.blob();
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
      const d = dayjs(date);
      return `${d.format("DD")}${sep}${d.format("MM")}${sep}${d.year() + 543}`;
    };

    try {
      setIsBulkDownloading(true);
      setBulkDownloadProgress(0);
      const requesterId = (await requestCurrentLocalUserID()) || "system";

      // 1. ดึงข้อมูลดิบของทุกรายการที่เลือก
      const dataItems = [];
      for (const id of selectedRowKeys) {
        try {
          const response = await callApiService.post(
            "/api/v1/timesheet/overtime/read",
            { id: String(id), request_id: String(requesterId) },
          );
          if (response?.data?.status === 200 && response.data.data?.[0]) {
            dataItems.push(response.data.data[0]);
          }
        } catch (err) {
          console.error(`Failed to fetch OT ${String(id)}:`, err);
        }
      }

      if (dataItems.length === 0) {
        toast.error("ไม่พบข้อมูลที่จะดาวน์โหลด");
        setIsBulkDownloading(false);
        return;
      }

      // 2. สร้าง Container ชั่วคราวสำหรับการเรนเดอร์ (Hidden)
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.id = "bulk-pdf-render-container";
      document.body.appendChild(container);

      // สร้าง Style สำหรับการพิมพ์ที่ถอดแบบมาจาก preview/[id]/page.tsx
      const styleElement = document.createElement("style");
      styleElement.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
        .ot-print-temp {
          font-family: 'Sarabun', sans-serif;
          color: #1a1a1b;
          background: #fff;
          width: 210mm;
          padding: 24px 32px;
          box-sizing: border-box;
          line-height: 1.3;
        }
        .ot-header-temp {
          display: flex;
          align-items: center;
          border: 1px solid #fed7aa;
          padding: 10px;
          margin-bottom: 12px;
          border-radius: 8px;
          background: #fff7ed;
        }
        .ot-doc-title-temp {
          flex: 1;
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          color: #9a3412;
        }
        .ot-doc-meta-temp {
          font-size: 10px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          color: #c2410c;
          text-align: right;
        }
        .ot-info-temp {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 24px;
          margin-bottom: 12px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
        }
        .ot-label-temp { font-weight: 600; color: #475569; min-width: 80px; font-size: 11px; }
        .ot-value-temp { flex: 1; border-bottom: 1px solid #f1f5f9; padding-bottom: 1px; color: #1e293b; font-size: 11px; }
        .ot-table-temp { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
        .ot-table-temp th, .ot-table-temp td { padding: 6px 8px; vertical-align: middle; text-align: center; border: 1px solid #e2e8f0; }
        .ot-table-temp th { background-color: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 9px; }
        .ot-table-temp td { color: #334155; }
        .ot-section-header {
          margin-bottom: 8px;
          padding: 6px 10px;
          background: #f8fafc;
          border-left: 4px solid #475569;
          color: #1e293b;
          font-size: 11px;
          font-weight: 700;
        }
        .ot-summary-temp {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          font-weight: 600;
          font-size: 11px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #fcfcfc;
          border: 1px solid #f1f5f9;
          border-radius: 6px;
        }
        .ot-total-label { color: #64748b; }
        .ot-total-value { font-size: 14px; color: #1e293b; font-weight: 700; }
        .ot-sign-container-temp { display: flex; justify-content: space-between; margin-top: 12px; gap: 12px; }
        .ot-sign-box-temp { text-align: center; width: 48%; padding: 8px; border: 1px solid #f8fafc; border-radius: 6px; background: #fafafa; }
        .ot-sign-title-temp { font-weight: 700; margin-bottom: 4px; font-size: 11px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
        .ot-sign-line-temp { border-bottom: 1px solid #e2e8f0; margin: 4px auto 4px; width: 70%; }
        .ot-sub-form-temp { margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 12px; }
        .evidence-page-temp { padding: 24px 32px; }
        .evidence-grid-temp { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .evidence-item-temp { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; height: 500px; display: flex; flex-direction: column; align-items: center; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .evidence-label-temp { font-weight: 700; color: #1e293b; margin-bottom: 12px; text-align: center; font-size: 13px; }
        .evidence-img-wrapper-temp { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; border-radius: 8px; background: #f8fafc; padding: 8px; overflow: hidden; }
        .evidence-img-temp { max-width: 100%; max-height: 100%; object-fit: contain; }
      `;
      container.appendChild(styleElement);

      const itemsForZip = [];

      // 3. วนลูปเรนเดอร์และเตรียมข้อมูลสำหรับ ZIP
      for (const data of dataItems) {
        // ดึงข้อมูลจาก Payload ตามโครงสร้าง CURL (data.data[0])
        const empCode = data?.requester_employee_code || "UNKNOWN";
        const reqName = data?.requester_name || "-";
        const position = data?.requester_position || "-";
        const department = data?.department || "IT";

        // คํานวณเวลา Budget
        const totalBudgetHours =
          data.descriptions?.reduce((acc: number, item: any) => {
            if (!item?.start_date || !item?.end_date)
              return acc + (Number(item?.duration) || 0);
            const bStart = dayjs(item.start_date).startOf("hour");
            const bEnd = dayjs(item.end_date).add(1, "hour").startOf("hour");
            const diff = bEnd.diff(bStart, "hour");
            return acc + (diff > 0 ? diff : 0);
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
          data.descriptions?.reduce((acc: number, item: any) => {
            return (
              acc +
              calcActualMinutes(item.start_date ?? null, item.end_date ?? null)
            );
          }, 0) || 0;

        // ดึงข้อมูลหลักฐานจาก descriptions รายการแรก (มี id 87 ตามตัวอย่าง)
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

        // Pre-fetch รูปภาพทั้งหมดเป็น base64 ก่อนสร้าง HTML (แก้ปัญหา CORS กับ html2canvas)
        const [
          logoBase64,
          sig1Base64,
          thanatBase64,
          img1Base64,
          img2Base64,
          img3Base64,
          img4Base64,
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
        const evidenceBase64 = [img1Base64, img2Base64, img3Base64, img4Base64];

        const tempDiv = document.createElement("div");
        tempDiv.className = "ot-print-temp";
        tempDiv.innerHTML = `
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
            <div style="display:flex"><span class="ot-label-temp">ชื่อ - สกุล:</span><span class="ot-value-temp">${reqName}</span></div>
            <div style="display:flex"><span class="ot-label-temp">รหัสพนักงาน:</span><span class="ot-value-temp">${empCode}</span></div>
            <div style="display:flex"><span class="ot-label-temp">ตำแหน่ง:</span><span class="ot-value-temp">${position}</span></div>
            <div style="display:flex"><span class="ot-label-temp">ฝ่าย/แผนก:</span><span class="ot-value-temp">${department}</span></div>
          </div>

          <div class="ot-section-header">รายละเอียดการทำงานล่วงเวลา (ตามแผน)</div>
          <table class="ot-table-temp">
            <thead>
              <tr>
                <th style="width:5%">ลำดับ</th>
                <th style="width:12%">วันที่</th>
                <th>รายละเอียดงานที่ปฏิบัติจริง</th>
                <th style="width:12%">เวลาเริ่ม</th>
                <th style="width:12%">เวลาสิ้นสุด</th>
                <th style="width:10%">รวม (ชม.)</th>
                <th style="width:15%">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${(data.descriptions || [])
                .map((d: any, i: number) => {
                  const diffMinutes =
                    d.start_date && d.end_date
                      ? dayjs(d.end_date)
                          .add(1, "hour")
                          .startOf("hour")
                          .diff(dayjs(d.start_date).startOf("hour"), "minute")
                      : (Number(d.duration) || 0) * 60;

                  return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${d.date ? formatDateThai(d.date) : "-"}</td>
                    <td style="text-align:left">${d.description || "-"}</td>
                    <td>${
                      d.start_date ? dayjs(d.start_date).format("HH:00") : "-"
                    }</td>
                    <td>${
                      d.end_date
                        ? dayjs(d.end_date).add(1, "hour").format("HH:00")
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
            <div style="margin-right:auto; color: #64748b;">เหตุผลการขอ: <span style="color:#1e293b">${
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
                  sig1Base64
                    ? `<img src="${sig1Base64}" style="max-height:40px;">`
                    : ""
                }
              </div>
              <div class="ot-sign-line-temp"></div>
              <div style="font-size:11px; font-weight:600; color:#334155;">(${reqName
                .replace(/\s*\([^)]*\)/g, "")
                .trim()})</div>
              <div style="font-size:9px; color:#64748b; margin-top:1px;">${position}</div>
              <div style="font-size:9px; color:#94a3b8; margin-top:2px;">วันที่ ${formatDateThai(
                headerDate,
                " / ",
              )}</div>
            </div>
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ตรวจสอบ / รับทราบ</div>
              <div style="height:45px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:2px;">
                ${
                  thanatBase64
                    ? `<img src="${thanatBase64}" style="max-height:40px;">`
                    : ""
                }
              </div>
              <div class="ot-sign-line-temp"></div>
              <div style="font-size:11px; font-weight:600; color:#334155;">ธนัท พรหมพิริยา</div>
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
              <thead>
                <tr>
                  <th style="width:5%">ลำดับ</th>
                  <th style="width:12%">วันที่</th>
                  <th>รายละเอียดงานที่ปฏิบัติจริง</th>
                  <th style="width:12%">เวลาเริ่ม</th>
                  <th style="width:12%">เวลาสิ้นสุด</th>
                  <th style="width:10%">รวม (ชม.)</th>
                  <th style="width:15%">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                ${(data.descriptions || [])
                  .map((d: any, i: number) => {
                    // คำนวณจาก start_date/end_date จริง รองรับข้ามเที่ยงคืน
                    const diffM = calcActualMinutes(
                      d.start_date ?? null,
                      d.end_date ?? null,
                    );
                    return `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${d.date ? formatDateThai(d.date) : "-"}</td>
                      <td style="text-align:left">${d.description || "-"}</td>
                      <td>${
                        d.start_date ? dayjs(d.start_date).format("HH:mm") : "-"
                      }</td>
                      <td>${
                        d.end_date ? dayjs(d.end_date).format("HH:mm") : "-"
                      }</td>
                      <td style="font-weight:600">${formatDurationToDecimal(
                        diffM,
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
                    sig1Base64
                      ? `<img src="${sig1Base64}" style="max-height:40px;">`
                      : ""
                  }
                </div>
                <div class="ot-sign-line-temp"></div>
                <div style="font-size:11px; font-weight:600; color:#334155;">(${reqName
                  .replace(/\s*\([^)]*\)/g, "")
                  .trim()})</div>
                <div style="font-size:9px; color:#64748b; margin-top:1px;">${position}</div>
                <div style="font-size:9px; color:#94a3b8; margin-top:2px;">วันที่ ${formatDateThai(
                  headerDate,
                  " / ",
                )}</div>
              </div>
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้รับรองการทำงาน</div>
                <div style="height:45px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:2px;">
                  ${
                    thanatBase64
                      ? `<img src="${thanatBase64}" style="max-height:40px;">`
                      : ""
                  }
                </div>
                <div class="ot-sign-line-temp"></div>
                <div style="font-size:11px; font-weight:600; color:#334155;">ธนัท พรหมพิริยา</div>
                <div style="font-size:9px; color:#64748b; margin-top:1px;">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
                <div style="font-size:9px; color:#94a3b8; margin-top:2px;">วันที่ ${formatDateThai(
                  headerDate,
                  " / ",
                )}</div>
              </div>
            </div>
          </div>

        `;
        container.appendChild(tempDiv);

        // หน้าที่ 2: หลักฐานการทำงาน (แยก element เพื่อให้ jsPDF ขึ้นหน้าใหม่เสมอ)
        const evidenceDiv = document.createElement("div");
        evidenceDiv.className = "ot-print-temp";
        evidenceDiv.innerHTML = `
          <div class="evidence-page-temp">
            <div style="font-size:16px; font-weight:700; text-align:center; border:2px solid #000; padding:8px; border-radius:4px;">หลักฐานการทำงาน</div>
            <div class="evidence-grid-temp">
              ${[0, 1, 2, 3]
                .map(
                  (idx) => `
                <div class="evidence-item-temp">
                  <div class="evidence-label-temp">หลักฐาน #${idx + 1}</div>
                  <div class="evidence-img-wrapper-temp">
                    ${
                      evidenceBase64[idx]
                        ? `<img src="${evidenceBase64[idx]}" class="evidence-img-temp">`
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
        container.appendChild(evidenceDiv);

        itemsForZip.push({
          employeeCode: empCode,
          fileName: `OT_${empCode}_${reqName}_${dayjs(data.request_date).format(
            "DD-MM-YYYY",
          )}_${data.id}.pdf`,
          element: [tempDiv, evidenceDiv],
        });
      }

      // 4. สั่งดาวน์โหลด ZIP พร้อม Tracking
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
        (index, total, status, fileName) => {
          setBulkDownloadProgress(
            Math.round(
              ((index + (status === "completed" ? 1 : 0)) / total) * 100,
            ),
          );

          setBulkTrackingData((prev) => {
            const newData = [...prev];

            // ใช้ index จาก callback ร่วมกับ fileName เพื่อระบุแถวที่ถูกต้อง
            // โดยหาข้อมูลใน newData ที่ตำแหน่ง index นั้นๆ เลย (เพราะลำดับตรงกัน)
            if (
              newData[index] &&
              (newData[index].fileName === fileName || status === "zipping")
            ) {
              newData[index] = {
                ...newData[index],
                status: status,
              };
              return newData;
            }

            // Fallback เผื่อไว้
            const itemIndex = newData.findIndex((i) => i.fileName === fileName);

            if (status === "zipping") {
              // กรณีพิเศษสำหรับการรวมไฟล์ ZIP
              return prev.map((item) => ({
                ...item,
                status: item.status === "completed" ? "completed" : "failed",
              }));
            }

            if (itemIndex !== -1) {
              newData[itemIndex] = {
                ...newData[itemIndex],
                status: status,
              };
            }
            return newData;
          });
        },
      );

      // 5. Cleanup
      document.body.removeChild(container);
      toast.success("ดาวน์โหลดไฟล์ ZIP สำเร็จ");
      // สั่งปิด Modal Tracking หลังจากสำเร็จ 3 วินาที
      setTimeout(() => setIsBulkTrackingModalVisible(false), 3000);
    } catch (error) {
      console.error("Bulk Download Error:", error);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด กรุณาลองใหม่");
      setIsBulkTrackingModalVisible(false);
    } finally {
      setIsBulkDownloading(false);
      setBulkDownloadProgress(0);
    }
  };

  // จัดการการเปลี่ยนแปลงสถานะของตารางข้อมูล เช่น การเปลี่ยนหน้า หรือการกรองข้อมูลแบบเรียลไทม์
  const requestTablePaginationAndFilterDataChange = (
    paginationParametersSource: any,
    filtersDataValues?: any,
  ) => {
    requestOvertimeRequestListData({
      page: paginationParametersSource.current,
      pageSize: paginationParametersSource.pageSize,
      filters: filtersDataValues,
    });
  };

  useEffect(() => {
    document.title = translate("overtime_page.title");
    requestUserSelectionListData();
    requestDescriptionSelectionListData();
    requestOvertimeRequestListData({ page: 1 });

    // ตรวจสอบสถานะการปิด Modal กฎระเบียบประจำวัน
    const dismissedDate = localStorage.getItem("sb_ot_rules_dismissed_date");
    const today = dayjs().format("YYYY-MM-DD");
    if (dismissedDate !== today) {
      setIsRulesModalVisible(true);
    }
  }, [
    translate,
    requestUserSelectionListData,
    requestDescriptionSelectionListData,
    requestOvertimeRequestListData,
  ]);

  return (
    <DashboardLayout>
      {/* Modal แสดงความคืบหน้าการดาวน์โหลด Bulk (Delivery Tracking) */}
      <BulkDownloadTrackingModal
        visible={isBulkTrackingModalVisible}
        onClose={() => setIsBulkTrackingModalVisible(false)}
        bulkDownloadProgress={bulkDownloadProgress}
        bulkTrackingData={bulkTrackingData}
      />

      <Flex vertical gap={40} style={{ paddingBottom: 60 }}>
        {/* ส่วนหัวของหน้าจอ แสดงชื่อระบบและปุ่มหลักในการใช้งาน */}
        <HeaderBar
          icon={<TeamOutlined />}
          title="ระบบจัดการการทำงานล่วงเวลา (OT)"
          subTitle="บันทึก ติดตาม และอนุมัติการทำงานนอกเวลาอย่างมีประสิทธิภาพ"
          showBackButton={true}
          extra={
            <Space size="middle">
              <Badge count="ใหม่" color="red" offset={[-2, 4]}>
                <Button
                  icon={<CalculatorOutlined />}
                  size="large"
                  onClick={() => setIsPayCalculatorVisible(true)}
                >
                  คำนวณเงินที่ได้รับ
                </Button>
              </Badge>
              <Button
                icon={<FileTextOutlined />}
                size="large"
                onClick={() => setIsRulesModalVisible(true)}
              >
                ระเบียบการขอ OT
              </Button>
              <Badge count={pendingCount} color="red" offset={[-4, 4]}>
                <Button
                  icon={<BellOutlined />}
                  size="large"
                  onClick={() => setIsRemindModalVisible(true)}
                >
                  แจ้งเตือนซ้ำ
                </Button>
              </Badge>
              <Badge count={pendingCount} color="gold" offset={[-4, 4]}>
                <Button
                  icon={<CalendarOutlined />}
                  size="large"
                  onClick={() => setIsTimelineModalVisible(true)}
                >
                  Timeline
                </Button>
              </Badge>
              <Button
                type="primary"
                icon={<ClockCircleOutlined />}
                size="large"
                onClick={() => setIsCreateModalVisible(true)}
                style={{ fontWeight: 600 }}
              >
                สร้างคำขอ OT
              </Button>
            </Space>
          }
        />

        {/* ส่วนแสดงข้อมูลสรุปทางสถิติในรูปแบบ Card */}
        <SummarySection />

        {/* สรุป OT ส่วนตัว — แสดงเฉพาะ user ทั่วไป ซ่อนเมื่อเป็น admin */}
        {!isCurrentUserAdmin && (
          <PersonalOtSummary
            userId={currentUserIdForPersonal}
            isAdmin={false}
            fetchFn={fetchPersonalOtData}
          />
        )}

        {/* ส่วนของแถบเครื่องมือดักกรองข้อมูลและการค้นหา */}
        <FilterSection
          onSearch={requestOvertimeRequestListData}
          isLoading={isLoadingOvertimeData}
        />

        {/* ส่วนแสดงปุ่มดำเนินการกับรายการที่ถูกเลือกจำนวนมาก */}
        {selectedRowKeys.length > 0 && (
          <ActionBarSection
            selectedRowKeys={selectedRowKeys}
            setSelectedRowKeys={setSelectedRowKeys}
            setProcessedRecordItems={setProcessedRecordItems}
            isBatchProcessing={isBatchProcessing}
            setIsBatchStatusModalVisible={setIsBatchStatusModalVisible}
            requestBatchSendOvertimeMailToHR={requestBatchSendOvertimeMailToHR}
            handleBulkPdfDownloadZip={handleBulkPdfDownloadZip}
            navigationRouter={navigationRouter}
            setIsAnalyticsModalVisible={setIsAnalyticsModalVisible}
          />
        )}

        {/* ส่วนแสดงตารางข้อมูลรายการคำขอ OT ทั้งหมด */}
        <UserTable
          onTableChange={requestTablePaginationAndFilterDataChange}
          onViewDetail={(record) => {
            setSelectedOvertimeDetail(record);
            setIsDetailModalVisible(true);
          }}
          onEdit={(record) => {
            setSelectedOvertimeDetail(record);
            overtimeForm.setFieldsValue({
              ...record,
              request_date: record.request_date
                ? dayjs(record.request_date)
                : dayjs(),
              descriptions: (record.descriptions || []).map((desc: any) => ({
                ...desc,
                startDate: desc.startDate ? dayjs(desc.startDate) : undefined,
                endDate: desc.endDate ? dayjs(desc.endDate) : undefined,
              })),
            });
            setIsCreateModalVisible(true);
          }}
          onDelete={requestDeleteOvertimeSubmission}
          onApprove={requestApproveOvertimeSubmission}
          onReject={(id) =>
            setRejectReasonModal({ open: true, overtimeId: id })
          }
          onSendMail={requestSendOvertimeMailToHR}
          onShowAnalytics={() => setIsAnalyticsModalVisible(true)}
          onShowExport={() => {
            setIsExportOperationSuccess(false);
            setExportStepCount(0);
            setIsExportModalVisible(true);
          }}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          pagination={paginationState}
        />

        {/* หน้าต่าง Modal สำหรับสร้างรายการคำขอ OT ใหม่ */}
        <CreateModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          userOptions={userSelectionOptions}
          requestCreateOvertimeSubmission={
            requestHandleCreateOvertimeFormSubmission
          }
          loading={isLoadingOvertimeData}
          form={overtimeForm}
          currentUserId={authenticationState?.response?.data?.user_data?.id}
        />

        {/* หน้าต่าง Modal สำหรับเปลี่ยนสถานะรายการจำนวนมากพร้อมกัน */}
        <BatchStatusModal
          visible={isBatchStatusModalVisible}
          onClose={() => {
            setIsBatchStatusModalVisible(false);
            if (!isBatchProcessing) {
              setSelectedRowKeys([]);
              setProcessedRecordItems(new Map());
            }
          }}
          selectedRowKeys={selectedRowKeys}
          batchSelectedStatus={selectedBatchStatus}
          setBatchSelectedStatus={setSelectedBatchStatus}
          requestBatchApproveOvertimeSubmission={
            requestBatchApproveOvertimeSubmissions
          }
          batchProcessing={isBatchProcessing}
          processedRecordItems={processedRecordItems}
          overtimeDataSource={overtimeDataSource}
        />

        {/* หน้าต่าง Modal แสดงรายละเอียดข้อมูลของรายการที่เลือก */}
        <DetailModal
          visible={isDetailModalVisible}
          onClose={() => setIsDetailModalVisible(false)}
          selectedDetail={selectedOvertimeDetail}
        />

        {/* Modal ระบุเหตุผลการปฏิเสธ OT */}
        <RejectReasonModal
          open={rejectReasonModal.open}
          overtimeId={rejectReasonModal.overtimeId ?? undefined}
          loading={isLoadingOvertimeData}
          onClose={() =>
            setRejectReasonModal({ open: false, overtimeId: null })
          }
          onConfirm={async (reason) => {
            await requestApproveOvertimeSubmission(
              rejectReasonModal.overtimeId ?? undefined,
              "rejected",
              reason,
            );
            setRejectReasonModal({ open: false, overtimeId: null });
          }}
        />

        {/* หน้าต่าง Modal สำหรับแสดงกราฟวิเคราะห์ข้อมูลทางสถิติ */}
        <AnalyticsModal
          visible={isAnalyticsModalVisible}
          setVisible={setIsAnalyticsModalVisible}
          dataSource={overtimeDataSource}
        />

        {/* หน้าต่าง Modal แสดงกฎระเบียบและข้อบังคับในการปฏิบัติงาน OT */}
        <RulesModal
          visible={isRulesModalVisible}
          setVisible={setIsRulesModalVisible}
          onAccept={() => {
            localStorage.setItem(
              "sb_ot_rules_dismissed_date",
              dayjs().format("YYYY-MM-DD"),
            );
            setIsRulesModalVisible(false);
          }}
        />

        {/* หน้าต่าง Modal สำหรับการส่งออกข้อมูลรายงานในรูปแบบไฟล์ */}
        <ExportModal
          visible={isExportModalVisible}
          setVisible={setIsExportModalVisible}
          onExport={requestExportOvertimeReportFile}
          loading={isLoadingOvertimeData}
          exportStepCount={exportStepCount}
          setExportStepCount={setExportStepCount}
          isExportOperationSuccess={isExportOperationSuccess}
          setIsExportOperationSuccess={setIsExportOperationSuccess}
          exportSelectedDateRange={exportSelectedDateRange}
          setExportSelectedDateRange={setExportSelectedDateRange}
        />

        {/* Modal คำนวณเงินค่าล่วงเวลา (ไม่บันทึกข้อมูล) */}
        <PayCalculatorModal
          open={isPayCalculatorVisible}
          onClose={() => setIsPayCalculatorVisible(false)}
        />

        {/* Modal แจ้งเตือนสถานะการทำงาน (Success/Error) */}
        <StatusModalComponent
          {...modalState}
          onClose={() =>
            setModalState((prev: StatusModalProps) => ({
              ...prev,
              open: false,
            }))
          }
        />

        {/* Modal แสดงความคืบหน้าการส่งข้อมูล (Delivery Tracking) */}
        <DeliveryLoadingModal
          open={isSubmissionLoading}
          currentStep={currentSubmissionStep}
          steps={overtimeSubmissionSteps}
        />

        {/* Modal แสดง Timeline OT รายคนในรูปแบบ Gantt */}
        <TimelineModal
          visible={isTimelineModalVisible}
          onClose={() => setIsTimelineModalVisible(false)}
          dataSource={overtimeDataSource}
        />

        {/* Modal ส่ง Email แจ้งเตือนซ้ำสำหรับ OT รออนุมัตินาน */}
        <RemindModal
          hrEmail={hrEmail}
          visible={isRemindModalVisible}
          onClose={() => setIsRemindModalVisible(false)}
        />
      </Flex>
    </DashboardLayout>
  );
};

export { OvertimeManagementPage };
