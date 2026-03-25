"use client";

import {
  DeliveryLoadingModal,
  overtimeSubmissionSteps,
} from "@/components/modal/delivery-loading-modal";
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Modal,
  Progress,
  Result,
  Row,
  Space,
  Steps,
  theme,
  Timeline,
  Typography,
} from "antd";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useTranslation } from "react-i18next";

import {
  BarChartOutlined,
  BookOutlined,
  BulbOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { toast } from "sonner";

import StatusModalComponent, {
  type StatusModalProps,
} from "@/components/modal/status-modal";
import { bulkPdfDownloadService } from "@/helpers/bulk-pdf-download.helper";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import BatchStatusModal from "./_components/batch-status-modal";
import BulkDownloadTrackingModal from "./_components/bulk-download-tracking-modal";
import CreateModal from "./_components/create-modal";
import DetailModal from "./_components/detail-modal";
import FilterSection from "./_components/filter-section";
import SummarySection from "./_components/summary-section";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

const OT_STATUS = [
  { text: "รออนุมัติ", value: "pending", color: "gold" },
  { text: "อนุมัติ", value: "approved", color: "green" },
  { text: "ปฏิเสธ", value: "rejected", color: "red" },
  { text: "จ่าย OT สำเร็จ", value: "paid", color: "cyan" },
  { text: "จ่าย OT ล้มเหลว", value: "payment_failed", color: "volcano" },
];

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

const OvertimeManagementPage = () => {
  // --- เครื่องมือพื้นฐาน (Hooks & Helpers) ---
  const navigationRouter = useRouter();
  const { t: translate } = useTranslation();
  const { token: themeToken } = theme.useToken();
  const { message: antMessage, modal: antModal } = App.useApp();
  const { data: userSession } = useSession();
  const { user_id: parameterUserId } = useParams();

  // จัดการสถานะแบบฟอร์ม (Form Instances)
  const [overtimeForm] = Form.useForm();
  const authenticationState = useAppSelector((state) => state.callAdminLogin);

  // --- Zustund Store สำหรับจัดการสถานะ Overtime (Refactored) ---
  const {
    isBulkDownloading,
    bulkDownloadProgress,
    isBulkTrackingModalVisible,
    bulkTrackingData,
    setIsBulkDownloading,
    setBulkDownloadProgress,
    setIsBulkTrackingModalVisible,
    setBulkTrackingData,
    fetchOvertimeDataForBulk,
    setIsLoadingOvertimeData: setStoreIsLoadingOvertimeData,
    setOvertimeDataSource: setStoreOvertimeDataSource,
    setTotalRecords,
  } = useOvertimeStore();

  // --- สถานะการแสดงผล UI (Visibility State) ---
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isBatchStatusModalVisible, setIsBatchStatusModalVisible] =
    useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isAnalyticsModalVisible, setIsAnalyticsModalVisible] = useState(false);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState(false);

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
  const [descriptionSelectionOptions, setDescriptionSelectionOptions] =
    useState<SelectOption[]>([]);

  // --- สถานะการกรองและแบ่งหน้า (Pagination & Filters) ---
  const [paginationState, setPaginationState] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filterSearchTextValue, setFilterSearchTextValue] = useState("");
  const [filterSelectedMonthValue, setFilterSelectedMonthValue] =
    useState<dayjs.Dayjs | null>(null);
  const [filterStatusValue, setFilterStatusValue] = useState<string | null>(
    null,
  );

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

      const users = (await getUserData()) as UserProfile[] | null;
      if (Array.isArray(users) && users.length > 0) {
        return String(users[0].id ?? "system");
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

  const overtimeStatistics = useMemo(() => {
    const totalCountValue = paginationState.total;
    const pendingCountValue = overtimeDataSource.filter(
      (item) => item.status === "pending",
    ).length;
    const approvedCountValue = overtimeDataSource.filter((item) =>
      ["approved", "paid", "payment_failed"].includes(item.status || ""),
    ).length;

    return {
      total: totalCountValue,
      pending: pendingCountValue,
      approved: approvedCountValue,
    };
  }, [overtimeDataSource, paginationState.total]);

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

        // text search คงทำ client-side เพราะ API ไม่รองรับค้นหาด้วยชื่อ
        let filteredOvertimeItemsResultList = overtimeRecordsListContent;
        if (appliedSearchText) {
          const lowerCaseSearchTextString = appliedSearchText.toLowerCase();
          filteredOvertimeItemsResultList = overtimeRecordsListContent.filter(
            (item: any) => {
              const searchFieldValues = [
                item.id?.toString(),
                item.requester_id?.toString(),
                item.requester_name,
                item.requester_employee_code,
                item.status,
                item.reason,
                item.descriptions
                  ?.map((desc: any) => desc.description)
                  .join(" "),
              ].filter(Boolean);
              return searchFieldValues.some((field) =>
                field?.toLowerCase().includes(lowerCaseSearchTextString),
              );
            },
          );
        }

        setOvertimeDataSource(
          filteredOvertimeItemsResultList.map((item: any) => ({
            key: item.id,
            ...item,
          })),
        );
        setStoreOvertimeDataSource(
          filteredOvertimeItemsResultList.map((item: any) => ({
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
            filteredOvertimeItemsResultList.length,
        });
        setTotalRecords(
          apiResponseDataContent.pagination?.total ??
            filteredOvertimeItemsResultList.length,
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
      authenticationState,
      paginationState.pageSize,
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
      const allFiles = [
        ...(formSubmissionPayload.proof_checkin || []),
        ...(formSubmissionPayload.proof_checkout || []),
        ...(formSubmissionPayload.proof_work_1 || []),
        ...(formSubmissionPayload.proof_work_2 || []),
        ...(formSubmissionPayload.signature_file || []),
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

            return {
              ...desc,
              duration: Number(desc.duration || 0),
              startDate: base
                .hour(start.hour())
                .minute(start.minute())
                .second(0)
                .toISOString(),
              endDate: base
                .hour(end.hour())
                .minute(end.minute())
                .second(0)
                .toISOString(),
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
      const result = await callApiService.post(
        "/api/v1/timesheet/overtime/create",
        submissionBodyPayload,
      );
      const resData = result?.data;

      if (resData && (resData.status === 200 || resData.status === 201)) {
        setCurrentSubmissionStep(2); // ขั้นตอนที่ 3: ส่งอีเมลแจ้งเตือน
        const firstId = resData.data?.descriptions?.[0]?.id;

        if (firstId) {
          // 4. ทยอยอัปโหลดไฟล์รูปภาพหลักฐานและลายเซ็น (Global Context)
          const uploadJobs = [
            { key: "image_1", files: formSubmissionPayload.proof_checkin },
            { key: "image_2", files: formSubmissionPayload.proof_checkout },
            { key: "image_3", files: formSubmissionPayload.proof_work_1 },
            { key: "image_4", files: formSubmissionPayload.proof_work_2 },
            { key: "signature_1", files: formSubmissionPayload.signature_file },
          ];

          for (const job of uploadJobs) {
            if (job.files?.[0]) {
              await uploadBinaryImage(job.files[0], firstId, job.key);
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
  ) => {
    if (!overtimeSubmissionIdentifier) return;
    try {
      setIsLoadingOvertimeData(true);
      const currentApproverToken = await requestCurrentLocalUserID();
      const apiResponseResultObject = await callApiService.post(
        `/api/v1/timesheet/overtime/change-status?id=${overtimeSubmissionIdentifier}`,
        {
          status: targetStatusString,
          updated_by: Number(currentApproverToken),
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
        to: process.env.NEXT_PUBLIC_HR_EMAIL || "manager.hr@schoolbright.co",
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
    targetStatusString: string = "approved",
  ) => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserTokenIdentifier = await requestCurrentLocalUserID();
    if (currentUserTokenIdentifier !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ปรับสถานะ");

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
          `/api/v1/timesheet/overtime/change-status?id=${recordIdentifier}`,
          {
            status: targetStatusString,
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
  const requestBatchSendOvertimeMailToHR = async () => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserTokenIdentifier = await requestCurrentLocalUserID();
    if (currentUserTokenIdentifier !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ส่งอีเมล");

    setIsBatchProcessing(true);
    setProcessedRecordItems(new Map());
    let emailSentSuccessCount = 0;

    for (const recordIdentifier of selectedRowKeys) {
      try {
        const documentPreviewURL = `${window.location.origin}/timesheet/overtime/preview/${recordIdentifier}`;
        const emailBodyPayload = {
          id: String(recordIdentifier),
          link: documentPreviewURL,
          to: process.env.NEXT_PUBLIC_HR_EMAIL || "manager.hr@schoolbright.co",
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
        currentAdminTokenIdentifier === BYPASS_ADMIN_ID;

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

      const finalResultFileName = `รายงานการทำงานล่วงเวลา_${finalizedFromDate.format("DDMMBBBB")}_ถึง_${finalizedToDate.format("DDMMBBBB")}.xlsx`;
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
  const requestDetailedOvertimeContentByID = async (
    overtimeSubmissionIdentifier: string | number,
  ) => {
    try {
      setIsLoadingOvertimeData(true);
      const apiResponseItemsListResult = await requestOvertimeRequestListData({
        overtimeId: overtimeSubmissionIdentifier,
      });
      if (apiResponseItemsListResult && apiResponseItemsListResult.length > 0) {
        setSelectedOvertimeDetail(apiResponseItemsListResult[0]);
        setIsDetailModalVisible(true);
      }
    } catch (error) {
      processAndDisplaySystemError(error, "ไม่สามารถดึงข้อมูลรายละเอียดได้");
    } finally {
      setIsLoadingOvertimeData(false);
    }
  };

  // จัดการการส่งข้อมูลจากฟอร์มสร้างรายการคำขอ OT ใหม่และรีเซ็ตค่าสถานะ
  const requestHandleCreateOvertimeFormSubmission = async (
    formSubmissionValues: any,
  ) => {
    try {
      const responseContentData =
        await requestCreateOvertimeSubmission(formSubmissionValues);
      if (responseContentData) {
        setIsCreateModalVisible(false);
        overtimeForm.resetFields();
        await requestOvertimeRequestListData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * จัดการดาวน์โหลด PDF ทั้งหมดที่เลือกในรูปแบบไฟล์ ZIP
   * แยกโฟลเดอร์ตามรหัสพนักงาน
   */
  const handleBulkPdfDownloadZip = async () => {
    if (selectedRowKeys.length === 0) {
      toast.error("โปรดเลือกรายการที่ต้องการดาวน์โหลด");
      return;
    }

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
          console.error(`Failed to fetch OT ${id}:`, err);
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
          color: #000;
          background: #fff;
          width: 210mm;
          padding: 24px 32px;
          box-sizing: border-box;
          line-height: 1.3;
        }
        .ot-header-temp {
          display: flex;
          align-items: center;
          border: 1px solid #000;
          padding: 10px;
          margin-bottom: 16px;
          border-radius: 4px;
        }
        .ot-doc-title-temp { flex: 1; text-align: center; font-size: 16px; font-weight: 700; }
        .ot-doc-meta-temp { font-size: 12px; display: flex; gap: 16px; }
        .ot-info-temp {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 24px;
          margin-bottom: 16px;
          padding: 12px;
          border: 1px solid #000;
          border-radius: 4px;
        }
        .ot-label-temp { font-weight: 600; margin-right: 8px; min-width: 90px; }
        .ot-value-temp { flex: 1; border-bottom: 1px dotted #000; padding-bottom: 2px; }
        .ot-table-temp { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
        .ot-table-temp th, .ot-table-temp td { border: 1px solid #000; padding: 6px 8px; vertical-align: middle; text-align: center; }
        .ot-table-temp th { background-color: #fff; font-weight: 600; }
        .ot-summary-temp { display: flex; justify-content: flex-end; gap: 24px; font-weight: 600; font-size: 12px; margin-bottom: 16px; padding: 8px 12px; border: 1px solid #000; }
        .ot-sign-container-temp { display: flex; justify-content: space-between; margin-top: 20px; }
        .ot-sign-box-temp { text-align: center; width: 45%; }
        .ot-sign-title-temp { font-weight: 600; margin-bottom: 8px; font-size: 12px; }
        .ot-sign-line-temp { border-bottom: 1px dotted #000; margin: 40px auto 4px; width: 85%; }
        .ot-sub-form-temp { margin-top: 20px; border-top: 2px solid #000; padding-top: 16px; }
        .evidence-page-temp { padding: 24px 32px; }
        .evidence-grid-temp { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; }
        .evidence-item-temp { border: 2px dashed #ccc; border-radius: 8px; padding: 10px; height: 480px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
        .evidence-label-temp { font-weight: 600; margin-top: 1rem; margin-bottom: 8px; text-align: center; flex-shrink: 0; }
        .evidence-img-wrapper-temp { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; padding: 8px; box-sizing: border-box; overflow: hidden; min-height: 0; }
        .evidence-img-temp { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }
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

        // คำนวณเวลา Actual
        const totalActualMinutes =
          data.descriptions?.reduce((acc: number, item: any) => {
            if (!item?.start_date || !item?.end_date) return acc;
            const diff = dayjs(item.end_date).diff(
              dayjs(item.start_date),
              "minute",
            );
            return acc + (diff > 0 ? diff : 0);
          }, 0) || 0;
        const h = Math.floor(totalActualMinutes / 60);
        const m = totalActualMinutes % 60;
        const actualDisplay =
          totalActualMinutes > 0
            ? `${h}:${m.toString().padStart(2, "0")}`
            : "-";

        // ดึงข้อมูลหลักฐานจาก descriptions รายการแรก (มี id 87 ตามตัวอย่าง)
        const firstDescription = data.descriptions?.[0] || {};
        const proofData = firstDescription.proof || {};
        const headerDate = data.request_date || data.created_at;

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
            <div class="ot-logo" style="width:140px">${logoBase64 ? `<img src="${logoBase64}" style="max-height:40px">` : ""}</div>
            <div class="ot-doc-title-temp">แบบคำขอทำงานล่วงเวลา (OT)</div>
            <div class="ot-doc-meta-temp">
              <div>ประจำเดือน: ${headerDate ? `${dayjs(headerDate).format("MM")}/${dayjs(headerDate).year() + 543}` : "-"}</div>
              <div>วันที่: ${formatDateThai(headerDate)}</div>
            </div>
          </div>

          <div class="ot-info-temp">
            <div style="display:flex"><span class="ot-label-temp">ชื่อ - สกุล:</span><span class="ot-value-temp">${reqName}</span></div>
            <div style="display:flex"><span class="ot-label-temp">รหัสพนักงาน:</span><span class="ot-value-temp">${empCode}</span></div>
            <div style="display:flex"><span class="ot-label-temp">ตำแหน่ง:</span><span class="ot-value-temp">${position}</span></div>
            <div style="display:flex"><span class="ot-label-temp">ฝ่าย/แผนก:</span><span class="ot-value-temp">${department}</span></div>
          </div>

          <div style="margin-bottom:12px; padding:8px; border:1px solid #000; border-left:4px solid #000;"><strong>รายละเอียดการทำงานล่วงเวลา</strong></div>
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
                  const bS = d.start_date
                    ? dayjs(d.start_date).format("HH:00")
                    : "-";
                  const bE = d.end_date
                    ? dayjs(d.end_date).add(1, "hour").format("HH:00")
                    : "-";
                  const bDuration =
                    d.start_date && d.end_date
                      ? dayjs(d.end_date)
                          .add(1, "hour")
                          .startOf("hour")
                          .diff(dayjs(d.start_date).startOf("hour"), "hour")
                      : d.duration || "-";
                  return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${d.date ? formatDateThai(d.date) : "-"}</td>
                    <td style="text-align:left">${d.description || "-"}</td>
                    <td>${bS}</td>
                    <td>${bE}</td>
                    <td>${bDuration}</td>
                    <td>-</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>

          <div class="ot-summary-temp">
            <div style="margin-right:auto">เหตุผลการขอ: ${data.reason || "-"}</div>
            <div>รวมเวลาทั้งหมด: <span style="font-size:16px">${totalBudgetHours}:00</span> ชั่วโมง</div>
          </div>

          <div class="ot-sign-container-temp">
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ขออนุมัติ</div>
              <div style="height:55px; display:flex; align-items:flex-end; justify-content:center;">
                ${sig1Base64 ? `<img src="${sig1Base64}" style="max-height:50px;">` : ""}
              </div>
              <div class="ot-sign-line-temp" style="margin-top:4px;"></div>
              <div style="font-size:12px">(${reqName.replace(/\s*\([^)]*\)/g, "").trim()})</div>
              <div style="font-size:11px">${position}</div>
              <div style="font-size:11px">วันที่ ${formatDateThai(headerDate, " / ")}</div>
            </div>
            <div class="ot-sign-box-temp">
              <div class="ot-sign-title-temp">ผู้ตรวจสอบ / รับทราบ</div>
              <div style="height:55px; display:flex; align-items:flex-end; justify-content:center;">
                ${thanatBase64 ? `<img src="${thanatBase64}" style="max-height:50px;">` : ""}
              </div>
              <div class="ot-sign-line-temp" style="margin-top:4px;"></div>
              <div style="font-size:12px">ธนัท พรหมพิริยา</div>
              <div style="font-size:11px">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
              <div style="font-size:11px">วันที่ ${formatDateThai(headerDate, " / ")}</div>
            </div>
          </div>

          <div class="ot-sub-form-temp">
            <div style="margin-bottom:12px; padding:8px; border:1px solid #000; border-left:4px solid #000;"><strong>ส่วนสำหรับบันทึกการปฏิบัติงานจริง</strong></div>
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
                    const diffM =
                      d.start_date && d.end_date
                        ? dayjs(d.end_date).diff(dayjs(d.start_date), "minute")
                        : 0;
                    const durText =
                      diffM > 0
                        ? `${Math.floor(diffM / 60)}:${(diffM % 60).toString().padStart(2, "0")}`
                        : "-";
                    return `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${d.date ? formatDateThai(d.date) : "-"}</td>
                      <td style="text-align:left">${d.description || "-"}</td>
                      <td>${d.start_date ? dayjs(d.start_date).format("HH:mm") : "-"}</td>
                      <td>${d.end_date ? dayjs(d.end_date).format("HH:mm") : "-"}</td>
                      <td>${durText}</td>
                      <td>-</td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
            <div class="ot-summary-temp">
              <div style="margin-left:auto">รวมเวลาปฏิบัติงานจริง: <span style="font-size:16px">${actualDisplay}</span> ชั่วโมง</div>
            </div>

            <div class="ot-sign-container-temp">
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้ขออนุมัติ</div>
                <div style="height:55px; display:flex; align-items:flex-end; justify-content:center;">
                  ${sig1Base64 ? `<img src="${sig1Base64}" style="max-height:50px;">` : ""}
                </div>
                <div class="ot-sign-line-temp" style="margin-top:4px;"></div>
                <div style="font-size:12px">(${reqName.replace(/\s*\([^)]*\)/g, "").trim()})</div>
                <div style="font-size:11px">${position}</div>
                <div style="font-size:11px">วันที่ ${formatDateThai(headerDate, " / ")}</div>
              </div>
              <div class="ot-sign-box-temp">
                <div class="ot-sign-title-temp">ผู้ตรวจสอบ / รับทราบ</div>
                <div style="height:55px; display:flex; align-items:flex-end; justify-content:center;">
                  ${thanatBase64 ? `<img src="${thanatBase64}" style="max-height:50px;">` : ""}
                </div>
                <div class="ot-sign-line-temp" style="margin-top:4px;"></div>
                <div style="font-size:12px">ธนัท พรหมพิริยา</div>
                <div style="font-size:11px">หัวหน้าฝ่ายเทคโนโลยีสารสนเทศ</div>
                <div style="font-size:11px">วันที่ ${formatDateThai(headerDate, " / ")}</div>
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
                    ${evidenceBase64[idx] ? `<img src="${evidenceBase64[idx]}" class="evidence-img-temp">` : `<div style="color:#999">ไม่มีรูปภาพ</div>`}
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
          fileName: `OT_${empCode}_${reqName}_${dayjs(data.request_date).format("DD-MM-YYYY")}_${data.id}.pdf`,
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
              <Button
                icon={<FileTextOutlined />}
                onClick={() => setIsRulesModalVisible(true)}
                style={{ borderRadius: 10, height: 44, paddingInline: 20 }}
              >
                ระเบียบการขอ OT
              </Button>
              <Button
                type="primary"
                icon={<ClockCircleOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
                style={{
                  borderRadius: 10,
                  height: 44,
                  paddingInline: 24,
                  fontWeight: 600,
                }}
              >
                สร้างคำขอ OT
              </Button>
            </Space>
          }
        />

        {/* ส่วนแสดงข้อมูลสรุปทางสถิติในรูปแบบ Card */}
        <SummarySection />

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
            themeToken={themeToken}
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
              date: dayjs(record.request_date),
            });
            setIsCreateModalVisible(true);
          }}
          onDelete={requestDeleteOvertimeSubmission}
          onApprove={requestApproveOvertimeSubmission}
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

        {/* หน้าต่าง Modal สำหรับแสดงกราฟวิเคราะห์ข้อมูลทางสถิติ */}
        <AnalyticsModalSection
          visible={isAnalyticsModalVisible}
          setVisible={setIsAnalyticsModalVisible}
          dataSource={overtimeDataSource}
          themeToken={themeToken}
        />

        {/* หน้าต่าง Modal แสดงกฎระเบียบและข้อบังคับในการปฏิบัติงาน OT */}
        <RulesModalSection
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
        <ExportModalSection
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
      </Flex>
    </DashboardLayout>
  );
};

const AnalyticsModalSection = ({
  visible,
  setVisible,
  dataSource,
  themeToken,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  dataSource: OvertimeRecord[];
  themeToken: any;
}) => {
  // จัดเรียงข้อมูลเพื่อนำเสนอในรูปแบบกราฟวิเคราะห์ เพื่อดูแนวโน้มการทำ OT รายเดือน
  const chartConfigurationData = useMemo(() => {
    const hourlyDistribution: Record<string, number> = {};
    dataSource.forEach((record: OvertimeRecord) => {
      const monthIdentifier = dayjs(record.request_date).format("MMM BB");
      const durationValue =
        record.descriptions?.reduce(
          (sum: number, d: any) => sum + Number(d.duration || 0),
          0,
        ) || 0;
      hourlyDistribution[monthIdentifier] =
        (hourlyDistribution[monthIdentifier] || 0) + durationValue;
    });

    const monthLabels = Object.keys(hourlyDistribution).sort(
      (a, b) => dayjs(a, "MMM BB").unix() - dayjs(b, "MMM BB").unix(),
    );

    return {
      labels: monthLabels,
      datasets: [
        {
          label: "จำนวนชั่วโมง OT รวม",
          data: monthLabels.map((label) => hourlyDistribution[label]),
          backgroundColor: themeToken.colorPrimary + "90",
          borderRadius: 8,
          barThickness: 32,
        },
      ],
    };
  }, [dataSource, themeToken.colorPrimary]);

  // จัดสรุปสถานะรายการทั้งหมดในรูปแบบร้อยละและจำนวนจริง เพื่อแสดงในกราฟวงกลม
  const pieChartConfiguration = useMemo(() => {
    const statusCounts: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    dataSource.forEach((record: OvertimeRecord) => {
      if (record.status && statusCounts[record.status] !== undefined)
        statusCounts[record.status]++;
      else statusCounts["rejected"]++;
    });

    return {
      labels: ["รอการอนุมัติ", "อนุมัติแล้ว", "ปฏิเสธ/อื่นๆ"],
      datasets: [
        {
          data: [
            statusCounts.pending,
            statusCounts.approved,
            statusCounts.rejected,
          ],
          backgroundColor: ["#faad14", "#52c41a", "#ff4d4f"],
          hoverOffset: 12,
          borderWidth: 0,
        },
      ],
    };
  }, [dataSource]);

  return (
    <Modal
      title={
        <Space>
          <BarChartOutlined /> แดชบอร์ดวิเคราะห์สถิติการทำงานล่วงเวลา
        </Space>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={1200}
      centered
      style={{ borderRadius: 24, overflow: "hidden" }}
    >
      <Flex vertical gap={32} style={{ paddingBlock: 32 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title="ภาพรวมแนวโน้มภาระงานรายเดือน (ชั่วโมงสะสม)"
              variant="borderless"
              style={{
                background: themeToken.colorFillQuaternary,
                borderRadius: 20,
              }}
            >
              <Flex vertical style={{ height: 450 }}>
                <Bar
                  data={chartConfigurationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: themeToken.colorBorderSecondary,
                          borderDash: [4, 4],
                        } as any,
                      },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </Flex>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title="สัดส่วนสถานะคำขอในระบบ"
              variant="borderless"
              style={{
                background: themeToken.colorFillQuaternary,
                borderRadius: 20,
              }}
            >
              <Flex
                vertical
                style={{
                  height: 450,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Doughnut
                  data={pieChartConfiguration}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { padding: 20, usePointStyle: true },
                      },
                    },
                    cutout: "65%",
                  }}
                />
              </Flex>
            </Card>
          </Col>
        </Row>
      </Flex>
    </Modal>
  );
};

const RulesModalSection = ({
  visible,
  setVisible,
  onAccept,
}: {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onAccept: () => void;
}) => {
  const { token } = theme.useToken();

  return (
    <Modal
      title={
        <Space>
          <BookOutlined /> คู่มือและระเบียบการเบิกจ่ายค่าล่วงเวลา
        </Space>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button
          key="confirm"
          type="primary"
          size="large"
          onClick={onAccept}
          style={{ fontWeight: 600 }}
        >
          ยอมรับและปฏิบัติตามระเบียบ
        </Button>,
      ]}
      centered
      width={680}
    >
      <Flex vertical align="center" gap={40} style={{ paddingBlock: 48 }}>
        {/* ไอคอนประกอบหัว Modal */}
        <div style={{ position: "relative" }}>
          <Flex
            justify="center"
            align="center"
            style={{
              width: 120,
              height: 120,
              borderRadius: 40,
              background: token.colorPrimaryBg,
              transform: "rotate(10deg)",
            }}
          >
            <BulbOutlined
              style={{
                fontSize: 56,
                color: token.colorPrimary,
                transform: "rotate(-10deg)",
              }}
            />
          </Flex>
          <Flex
            justify="center"
            align="center"
            style={{
              position: "absolute",
              bottom: -5,
              right: -5,
              width: 32,
              height: 32,
              background: token.colorSuccess,
              borderRadius: "50%",
              border: `4px solid ${token.colorBgContainer}`,
            }}
          >
            <CheckOutlined style={{ color: token.colorWhite, fontSize: 14 }} />
          </Flex>
        </div>

        {/* หัวข้อและคำอธิบาย */}
        <Flex vertical align="center" gap={8}>
          <Typography.Title level={3} style={{ margin: 0, fontWeight: 600 }}>
            โปรดศึกษาระเบียบการ
          </Typography.Title>
          <Typography.Text
            type="secondary"
            style={{ textAlign: "center", maxWidth: 460 }}
          >
            พนักงานทุกท่านต้องปฏิบัติตามแนวทางที่บริษัทกำหนด
            เพื่อความถูกต้องรวดเร็วในการเบิกจ่ายผลตอบแทน
          </Typography.Text>
        </Flex>

        {/* ขั้นตอนการขอ OT */}
        <Flex style={{ width: "100%", paddingInline: 40 }}>
          <Timeline
            mode="left"
            items={[
              {
                label: "ขั้นตอนที่ 1",
                color: "blue",
                children: "ได้รับมอบหมายภารกิจจากหัวหน้าทีมงานโดยตรง",
              },
              {
                label: "ขั้นตอนที่ 2",
                color: "green",
                children:
                  "ลงบันทึกเวลาปฏิบัติงานในระบบ SB Helper ทันทีหลังจบงาน",
              },
              {
                label: "ขั้นตอนที่ 3",
                color: "orange",
                children: "ตรวจสอบยอดชั่วโมงงานให้ตรงกับหน้างานจริง",
              },
              {
                label: "ขั้นตอนที่ 4",
                color: "cyan",
                children: "ฝ่ายบุคคล (HR) ตรวจสอบและอนุมัติจ่ายในงวดถัดไป",
              },
            ]}
          />
        </Flex>

        <Button
          type="link"
          size="large"
          onClick={() =>
            window.open(
              "https://docs.google.com/document/d/12eEuCzFtCxE3C_CfhkGZ9J8yo3jiKVD2uANYBMXXnUE/edit?tab=t.0",
              "_blank",
            )
          }
          style={{ fontWeight: 600 }}
        >
          ดูระเบียบการบริษัทฉบับสมบูรณ์
        </Button>
      </Flex>
    </Modal>
  );
};

const ExportModalSection = ({
  visible,
  setVisible,
  onExport,
  loading,
  exportStepCount,
  setExportStepCount,
  isExportOperationSuccess,
  setIsExportOperationSuccess,
  exportSelectedDateRange,
  setExportSelectedDateRange,
}: {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onExport: (dateRange?: [dayjs.Dayjs, dayjs.Dayjs]) => Promise<boolean>;
  loading: boolean;
  exportStepCount: number;
  setExportStepCount: (v: number) => void;
  isExportOperationSuccess: boolean;
  setIsExportOperationSuccess: (v: boolean) => void;
  exportSelectedDateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  setExportSelectedDateRange: (v: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
}) => {
  const { token } = theme.useToken();

  return (
    <Modal
      title={
        <Space>
          <CloudDownloadOutlined /> ศูนย์บริการการนำออกข้อมูลรายงาน
        </Space>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={560}
      centered
    >
      {isExportOperationSuccess ? (
        // แสดงผลลัพธ์หลังส่งออกสำเร็จ
        <Result
          status="success"
          title="ระบบปฏิบัติการประมวลผลสำเร็จ"
          subTitle="ข้อมูลรายงาน OT ถูกส่งมอบไปยังเบราว์เซอร์ของท่านแล้ว โปรดตรวจสอบที่ไฟล์ดาวน์โหลด"
          extra={[
            <Button key="close" size="large" onClick={() => setVisible(false)}>
              ปิดการทำงาน
            </Button>,
            <Button
              key="retry"
              type="link"
              onClick={() => {
                setIsExportOperationSuccess(false);
                setExportStepCount(0);
              }}
            >
              ส่งออกรายงานชุดอื่น
            </Button>,
          ]}
        />
      ) : (
        <Flex vertical gap={40} style={{ paddingBlock: 32 }}>
          {/* ส่วนเลือกช่วงวันที่ */}
          <Flex vertical gap={12} align="center">
            <Typography.Text strong>
              กำหนดช่วงเวลาในการส่งออก (Start - End Date)
            </Typography.Text>
            <DatePicker.RangePicker
              size="large"
              allowClear={false}
              value={exportSelectedDateRange}
              onChange={(dates) =>
                setExportSelectedDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
              }
              style={{ width: "100%" }}
              format="DD / MM / BBBB"
            />
            <Typography.Text type="secondary">
              ระบบจะประมวลผลตามช่วงวันที่ระบุ รวมถึงสรุปยอดสะสม (Payroll)
            </Typography.Text>
          </Flex>

          {/* แสดงขั้นตอนการส่งออก */}
          <Flex
            vertical
            gap={16}
            style={{
              background: token.colorFillQuaternary,
              padding: 32,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <Steps
              direction="vertical"
              size="small"
              current={exportStepCount > 0 ? exportStepCount - 1 : undefined}
              status={loading ? "process" : "wait"}
              items={[
                {
                  title: "ขั้นตอนตรวจสอบสิทธิ์และข้อมูล",
                  description: "ระบบกำลัง Mapping โครงสร้างข้อมูลสมาชิก",
                },
                {
                  title: "ขั้นตอนประมวลผลสูตรคำนวณ",
                  description: "กำลังคำนวณชั่วโมงงานล่วงเวลาทั้งหมดในงวด",
                },
                {
                  title: "ขั้นตอนเข้ารหัสและจัดส่งไฟล์",
                  description: "กำลัง Generate ไฟล์รูปแบบ .xlsx และส่งมอบ",
                },
              ]}
            />
          </Flex>

          {/* ปุ่มส่งออก */}
          {exportStepCount === 0 && (
            <Row gutter={20}>
              <Col span={12}>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  loading={loading}
                  onClick={() => onExport(exportSelectedDateRange ?? undefined)}
                  block
                  style={{ height: 80, fontWeight: 600 }}
                >
                  Export Excel
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  disabled
                  icon={<FilePdfOutlined />}
                  block
                  style={{ height: 80, fontWeight: 600 }}
                >
                  Export PDF
                </Button>
              </Col>
            </Row>
          )}

          {/* แสดงความคืบหน้าขณะประมวลผล */}
          {loading && (
            <Flex vertical align="center" gap={16}>
              <Progress
                percent={
                  exportStepCount === 1 ? 33 : exportStepCount === 2 ? 66 : 100
                }
                status="active"
                strokeColor={{
                  "0%": token.colorPrimary,
                  "100%": token.colorSuccess,
                }}
                style={{ width: "80%" }}
              />
              <Typography.Text type="secondary" italic>
                ระบบกำลังเชื่อมต่อกับ Cloud Infrastructure...
              </Typography.Text>
            </Flex>
          )}
        </Flex>
      )}
    </Modal>
  );
};

export default OvertimeManagementPage;
