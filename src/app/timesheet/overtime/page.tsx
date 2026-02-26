"use client";

import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  Modal,
  Progress,
  Result,
  Row,
  Select,
  Skeleton,
  Space,
  Steps,
  Table,
  Tag,
  theme,
  Timeline,
  TimePicker,
  Tooltip,
  Typography,
  Upload,
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
  CalendarOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FilterOutlined,
  HistoryOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SolutionOutlined,
  StarOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { toast } from "sonner";

import SummaryCard from "@/components/card/summary-card";
import StatusModalComponent, {
  type StatusModalProps,
} from "@/components/modal/status-modal";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";

import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@/stores/store";
import { getUserById, getUserData } from "@helpers/local_storage/user.storage";
import type { SelectOption, UserProfile } from "@stores/type";

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

const BYPASS_ADMIN_ID = "117";

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

const OT_STATUS = [
  { text: "รออนุมัติ", value: "pending", color: "gold" },
  { text: "อนุมัติ", value: "approved", color: "green" },
  { text: "ปฏิเสธ", value: "rejected", color: "red" },
  { text: "จ่าย OT สำเร็จ", value: "paid", color: "cyan" },
  { text: "จ่าย OT ล้มเหลว", value: "payment_failed", color: "volcano" },
];

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

  // --- สถานะการแสดงผล UI (Visibility State) ---
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isBatchStatusModalVisible, setIsBatchStatusModalVisible] =
    useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isAnalyticsModalVisible, setIsAnalyticsModalVisible] = useState(false);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState(true);

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

  // --- สถานะการทำงานแบบกลุ่ม (Batch Processing State) ---
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processedRecordItems, setProcessedRecordItems] = useState<
    Set<React.Key>
  >(new Set());
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
    visible: false,
    type: "success",
    title: "",
    subtitle: "",
  });

  // ดึงข้อมูลรหัสผู้ดูแลระบบปัจจุบันจากสถานะการเข้าสู่ระบบหรือ Local Storage
  const requestCurrentLocalUserID = useCallback(async (): Promise<string> => {
    try {
      const authenticationId =
        authenticationState?.response?.data?.user_data?.admin_id;
      if (authenticationId) return String(authenticationId);

      const users = (await getUserData()) as UserProfile[] | null;
      if (Array.isArray(users) && users.length > 0) {
        return String(users[0].admin_id ?? users[0].id ?? "system");
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
        visible: true,
        type: "error",
        title: errorTitle,
        subtitle: error?.message || "ไม่สามารถดำเนินการได้ในขณะนี้",
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
          value: String(user.admin_id),
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
      const requestParameters = {
        limit: 30,
        page: 1,
        user_id:
          authenticationState?.response?.data?.user_data?.admin_id || "0",
      };

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
    }) => {
      const currentPageIndex = requestOptionsParameter?.page ?? 1;
      const currentPageSizeValue =
        requestOptionsParameter?.pageSize ?? paginationState.pageSize;
      const requestFiltersDataValues = requestOptionsParameter?.filters ?? {};
      const targetOvertimeIdentifier = requestOptionsParameter?.overtimeId;

      try {
        setIsLoadingOvertimeData(true);

        const currentAdminIdValue = await requestCurrentLocalUserID();
        const isBypassUserSettingValue =
          currentAdminIdValue === BYPASS_ADMIN_ID;

        const effectiveRequestId =
          isBypassUserSettingValue && parameterUserId
            ? String(parameterUserId)
            : currentAdminIdValue;

        const apiRequestParametersBody = targetOvertimeIdentifier
          ? isBypassUserSettingValue
            ? { id: String(targetOvertimeIdentifier) }
            : {
                id: String(targetOvertimeIdentifier),
                request_id: effectiveRequestId,
              }
          : isBypassUserSettingValue
            ? {
                limit: currentPageSizeValue,
                offset: (currentPageIndex - 1) * currentPageSizeValue,
                ...requestFiltersDataValues,
                ...(parameterUserId
                  ? { request_id: String(parameterUserId) }
                  : {}),
              }
            : {
                limit: currentPageSizeValue,
                offset: (currentPageIndex - 1) * currentPageSizeValue,
                request_id: effectiveRequestId,
                ...requestFiltersDataValues,
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

        let filteredOvertimeItemsResultList = overtimeRecordsListContent;
        if (filterSelectedMonthValue) {
          const startOfOperatingMonth =
            filterSelectedMonthValue.startOf("month");
          const endOfOperatingMonth = filterSelectedMonthValue.endOf("month");

          filteredOvertimeItemsResultList = overtimeRecordsListContent.filter(
            (item: any) => {
              if (!item.request_date) return false;
              const requestDateObject = dayjs(item.request_date);
              return (
                requestDateObject.isSameOrAfter(startOfOperatingMonth, "day") &&
                requestDateObject.isSameOrBefore(endOfOperatingMonth, "day")
              );
            },
          );
        }

        if (filterSearchTextValue) {
          const lowerCaseSearchTextString = filterSearchTextValue.toLowerCase();
          filteredOvertimeItemsResultList =
            filteredOvertimeItemsResultList.filter((item: any) => {
              const searchFieldValues = [
                item.id?.toString(),
                item.requester_id?.toString(),
                item.status,
                item.descriptions
                  ?.map((desc: any) => desc.description)
                  .join(" "),
              ].filter(Boolean);
              return searchFieldValues.some((field) =>
                field?.toLowerCase().includes(lowerCaseSearchTextString),
              );
            });
        }

        setOvertimeDataSource(
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

        return overtimeRecordsListContent;
      } catch (error) {
        processAndDisplaySystemError(error, "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        return null;
      } finally {
        setIsLoadingOvertimeData(false);
      }
    },
    [
      authenticationState,
      paginationState.pageSize,
      filterSelectedMonthValue,
      filterSearchTextValue,
      requestCurrentLocalUserID,
      processAndDisplaySystemError,
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
      setIsLoadingOvertimeData(true);
      const currentOperatingUserToken = await requestCurrentLocalUserID();

      // 1. ตรวจสอบความถูกต้องของไฟล์รูปภาพก่อนดำเนินธุรกรรม
      const allFiles = [
        ...(formSubmissionPayload.proof_checkin || []),
        ...(formSubmissionPayload.proof_checkout || []),
        ...(formSubmissionPayload.proof_work_1 || []),
        ...(formSubmissionPayload.proof_work_2 || []),
        ...(formSubmissionPayload.signature_file || []),
      ];
      if (!validateImageFiles(allFiles)) return null;

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

      // 3. ยิง API สร้างรายการหลัก
      const result = await callApiService.post(
        "/api/v1/timesheet/overtime/create",
        submissionBodyPayload,
      );
      const resData = result?.data;

      if (resData && (resData.status === 200 || resData.status === 201)) {
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

        toast.success(resData.message_th ?? "สร้างรายการสำเร็จ");
        return resData.data;
      }
      throw new Error(resData?.message_th ?? "ไม่สามารถสร้างรายการได้");
    } catch (error) {
      processAndDisplaySystemError(error, "เกิดข้อผิดพลาดในการสร้างรายการ");
      return null;
    } finally {
      setIsLoadingOvertimeData(false);
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
    setProcessedRecordItems(new Set());
    let successfulOperationsCount = 0;
    let failedOperationsCount = 0;

    for (const recordIdentifier of selectedRowKeys) {
      try {
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
          setProcessedRecordItems(
            (previousItemsSet) =>
              new Set([...previousItemsSet, recordIdentifier]),
          );
        } else {
          failedOperationsCount++;
        }
      } catch (error) {
        failedOperationsCount++;
      }
    }

    setIsBatchProcessing(false);
    if (successfulOperationsCount > 0) {
      toast.success(
        `สำเร็จ ${successfulOperationsCount} รายการ, ล้มเหลว ${failedOperationsCount} รายการ`,
      );
      await requestOvertimeRequestListData({ page: paginationState.current });
    }
    setSelectedRowKeys([]);
    setProcessedRecordItems(new Set());
  };

  // ส่งอีเมลแจ้งเตือน HR สำหรับคำขอ OT หลายรายการพร้อมกัน (Batch Email)
  const requestBatchSendOvertimeMailToHR = async () => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserTokenIdentifier = await requestCurrentLocalUserID();
    if (currentUserTokenIdentifier !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ส่งอีเมล");

    setIsBatchProcessing(true);
    setProcessedRecordItems(new Set());
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
            (previousItemsSet) =>
              new Set([...previousItemsSet, recordIdentifier]),
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
    setProcessedRecordItems(new Set());
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
  }, [
    translate,
    requestUserSelectionListData,
    requestDescriptionSelectionListData,
    requestOvertimeRequestListData,
  ]);

  return (
    <DashboardLayout>
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
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="คำขอทั้งหมด"
              value={overtimeStatistics.total}
              subtitle="ยอดรวมคำขอทั้งหมดในระบบ"
              icon={<FileTextOutlined />}
              suffix="รายการ"
              color={themeToken.colorPrimary}
              percent={100}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="รอการพิจารณา"
              value={overtimeStatistics.pending}
              subtitle="รอหัวหน้างานตรวจสอบ"
              icon={<ClockCircleOutlined />}
              color={themeToken.colorWarning}
              iconBg={themeToken.colorWarningBg}
              percent={
                overtimeStatistics.total > 0
                  ? (overtimeStatistics.pending / overtimeStatistics.total) *
                    100
                  : 0
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="อนุมัติแล้ว"
              value={overtimeStatistics.approved}
              subtitle="ผ่านการพิจารณาแล้ว"
              icon={<CheckCircleOutlined />}
              color={themeToken.colorSuccess}
              iconBg={themeToken.colorSuccessBg}
              percent={
                overtimeStatistics.total > 0
                  ? (overtimeStatistics.approved / overtimeStatistics.total) *
                    100
                  : 0
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="อัตราการอนุมัติ"
              value={
                overtimeStatistics.total > 0
                  ? Number(
                      (
                        (overtimeStatistics.approved /
                          overtimeStatistics.total) *
                        100
                      ).toFixed(1),
                    )
                  : 0
              }
              subtitle="เปอร์เซ็นต์การอนุมัติ"
              icon={<CheckCircleOutlined />}
              suffix="%"
              color={themeToken.colorInfo}
              percent={
                overtimeStatistics.total > 0
                  ? (overtimeStatistics.approved / overtimeStatistics.total) *
                    100
                  : 0
              }
            />
          </Col>
        </Row>

        {/* ส่วนของแถบเครื่องมือดักกรองข้อมูลและการค้นหา */}
        <FilterBarSection
          filterSearchTextValue={filterSearchTextValue}
          setFilterSearchTextValue={setFilterSearchTextValue}
          filterSelectedMonthValue={filterSelectedMonthValue}
          setFilterSelectedMonthValue={setFilterSelectedMonthValue}
          isLoadingOvertimeData={isLoadingOvertimeData}
          paginationState={paginationState}
          onTableChange={requestTablePaginationAndFilterDataChange}
          requestOvertimeRequestListData={requestOvertimeRequestListData}
          themeToken={themeToken}
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
            navigationRouter={navigationRouter}
            setIsAnalyticsModalVisible={setIsAnalyticsModalVisible}
            themeToken={themeToken}
          />
        )}

        {/* ส่วนแสดงตารางข้อมูลรายการคำขอ OT ทั้งหมด */}
        <OvertimeTableSection
          dataSource={overtimeDataSource}
          isLoadingOvertimeData={isLoadingOvertimeData}
          paginationState={paginationState}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onTableChange={requestTablePaginationAndFilterDataChange}
          requestDeleteOvertimeSubmission={requestDeleteOvertimeSubmission}
          requestApproveOvertimeSubmission={requestApproveOvertimeSubmission}
          requestSendOvertimeMailToHR={requestSendOvertimeMailToHR}
          requestDetailedOvertimeContentByID={
            requestDetailedOvertimeContentByID
          }
          navigationRouter={navigationRouter}
          setIsAnalyticsModalVisible={setIsAnalyticsModalVisible}
          setIsExportModalVisible={() => {
            setIsExportOperationSuccess(false);
            setExportStepCount(0);
            setIsExportModalVisible(true);
          }}
          themeToken={themeToken}
        />

        {/* หน้าต่าง Modal สำหรับสร้างรายการคำขอ OT ใหม่ */}
        <CreateModalSection
          visible={isCreateModalVisible}
          setVisible={setIsCreateModalVisible}
          userOptions={userSelectionOptions}
          requestCreateOvertimeSubmission={
            requestHandleCreateOvertimeFormSubmission
          }
          loading={isLoadingOvertimeData}
          form={overtimeForm}
          themeToken={themeToken}
        />

        {/* หน้าต่าง Modal สำหรับเปลี่ยนสถานะรายการจำนวนมากพร้อมกัน */}
        <BatchStatusModalSection
          visible={isBatchStatusModalVisible}
          setVisible={setIsBatchStatusModalVisible}
          selectedRowKeys={selectedRowKeys}
          batchSelectedStatus={selectedBatchStatus}
          setBatchSelectedStatus={setSelectedBatchStatus}
          requestBatchApproveOvertimeSubmission={
            requestBatchApproveOvertimeSubmissions
          }
          batchProcessing={isBatchProcessing}
          themeToken={themeToken}
        />

        {/* หน้าต่าง Modal แสดงรายละเอียดข้อมูลของรายการที่เลือก */}
        <DetailModalSection
          visible={isDetailModalVisible}
          setVisible={setIsDetailModalVisible}
          selectedDetail={selectedOvertimeDetail}
          themeToken={themeToken}
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
          themeToken={themeToken}
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
          themeToken={themeToken}
          exportSelectedDateRange={exportSelectedDateRange}
          setExportSelectedDateRange={setExportSelectedDateRange}
        />

        {/* Modal แจ้งเตือนสถานะการทำงาน (Success/Error) */}
        <StatusModalComponent
          {...modalState}
          onClose={() => setModalState((prev) => ({ ...prev, visible: false }))}
        />
      </Flex>
    </DashboardLayout>
  );
};

const FilterBarSection = ({
  filterSearchTextValue,
  setFilterSearchTextValue,
  filterSelectedMonthValue,
  setFilterSelectedMonthValue,
  paginationState,
  onTableChange,
  requestOvertimeRequestListData,
  isLoadingOvertimeData,
  themeToken,
}: any) => (
  <Card
    variant="borderless"
    style={{
      borderRadius: 20,
      boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      marginBottom: 32,
    }}
  >
    {/* ส่วนของการกรองและค้นหาข้อมูล (Advanced Search Section) */}
    <Flex vertical gap={24}>
      <Space>
        <FilterOutlined style={{ color: themeToken.colorPrimary }} />
        <Typography.Text strong style={{ fontSize: 16 }}>
          ค้นหาและกรองข้อมูลเชิงลึก
        </Typography.Text>
      </Space>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Flex vertical gap={8}>
            <Typography.Text strong type="secondary" style={{ fontSize: 13 }}>
              ระบุคำสำคัญในการค้นหา
            </Typography.Text>
            <Input
              placeholder="ค้นหาด้วยรหัสคำขอ หรือชื่อพนักงาน..."
              prefix={
                <SearchOutlined
                  style={{ color: themeToken.colorTextDescription }}
                />
              }
              value={filterSearchTextValue}
              onChange={(event) => setFilterSearchTextValue(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Enter" &&
                requestOvertimeRequestListData({ page: 1 })
              }
              style={{ height: 48, borderRadius: 12 }}
              allowClear
            />
          </Flex>
        </Col>

        <Col xs={24} md={12}>
          <Flex vertical gap={8}>
            <Typography.Text strong type="secondary" style={{ fontSize: 13 }}>
              เลือกช่วงเวลาประจำเดือน
            </Typography.Text>
            <DatePicker
              picker="month"
              style={{ width: "100%", height: 48, borderRadius: 12 }}
              value={filterSelectedMonthValue}
              onChange={setFilterSelectedMonthValue}
              format="MMMM YYYY"
              suffixIcon={
                <CalendarOutlined style={{ color: themeToken.colorInfo }} />
              }
            />
          </Flex>
        </Col>

        <Col xs={24} md={12}>
          <Flex vertical gap={8}>
            <Typography.Text strong type="secondary" style={{ fontSize: 13 }}>
              สถานะการดำเนินการ
            </Typography.Text>
            <Select
              placeholder="ทั้งหมดที่แสดงผล..."
              style={{ width: "100%", height: 48 }}
              allowClear
              options={OT_STATUS.map((status) => ({
                label: status.text,
                value: status.value,
              }))}
              onChange={(valueValues) =>
                onTableChange(
                  { current: 1, pageSize: paginationState.pageSize },
                  { status: valueValues ? [valueValues] : [] },
                )
              }
            />
          </Flex>
        </Col>
      </Row>

      <Flex justify="flex-end" gap={12}>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setFilterSelectedMonthValue(null);
            setFilterSearchTextValue("");
            requestOvertimeRequestListData({ page: 1 });
          }}
          style={{ borderRadius: 12, height: 45, paddingInline: 24 }}
        >
          ล้างเงื่อนไข
        </Button>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          loading={isLoadingOvertimeData}
          onClick={() => requestOvertimeRequestListData({ page: 1 })}
          style={{
            borderRadius: 12,
            height: 45,
            paddingInline: 32,
            fontWeight: 600,
          }}
        >
          ค้นหาข้อมูล
        </Button>
      </Flex>
    </Flex>
  </Card>
);

const ActionBarSection = ({
  selectedRowKeys,
  setSelectedRowKeys,
  setProcessedRecordItems,
  isBatchProcessing,
  setIsBatchStatusModalVisible,
  requestBatchSendOvertimeMailToHR,
  navigationRouter,
  setIsAnalyticsModalVisible,
  themeToken,
}: any) => (
  <Card
    style={{
      borderRadius: 20,
      background: `linear-gradient(135deg, ${themeToken.colorPrimary}08 0%, ${themeToken.colorInfo}08 100%)`,
      border: `1px dashed ${themeToken.colorPrimary}40`,
      boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
    }}
  >
    {/* ส่วนดำเนินการกับหลายรายการพร้อมกัน (Batch Action Bar) */}
    <Row gutter={[16, 24]} align="middle">
      <Col xs={24} lg={16}>
        <Space wrap size="large">
          <Badge
            count={selectedRowKeys.length}
            style={{
              backgroundColor: themeToken.colorError,
              boxShadow: "0 0 0 2px #fff",
            }}
          >
            <Flex
              align="center"
              gap={10}
              style={{
                background: "#fff",
                padding: "10px 20px",
                borderRadius: 12,
                border: `1px solid ${themeToken.colorBorderSecondary}`,
              }}
            >
              <StarOutlined
                style={{ color: themeToken.colorWarning, fontSize: 18 }}
              />
              <Typography.Text strong>เลือกรายการไว้</Typography.Text>
            </Flex>
          </Badge>

          <Button
            type="primary"
            ghost
            icon={<FilePdfOutlined />}
            onClick={() =>
              navigationRouter.push(
                `/timesheet/overtime/preview/bulk?ids=${selectedRowKeys.join(",")}`,
              )
            }
            style={{ borderRadius: 12, height: 44 }}
          >
            ดูรายงาน PDF รวม
          </Button>

          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={isBatchProcessing}
            onClick={() => setIsBatchStatusModalVisible(true)}
            style={{
              borderRadius: 12,
              height: 44,
              background: themeToken.colorSuccess,
              border: "none",
            }}
          >
            จัดการสถานะกลุ่ม
          </Button>

          <Button
            danger
            icon={<MailOutlined />}
            loading={isBatchProcessing}
            onClick={requestBatchSendOvertimeMailToHR}
            style={{ borderRadius: 12, height: 44, background: "#fff" }}
          >
            ส่งอีเมลเข้า HR
          </Button>

          <Button
            type="text"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setSelectedRowKeys([]);
              setProcessedRecordItems(new Set());
            }}
            style={{ fontWeight: 600 }}
          >
            ยกเลิกการเลือก
          </Button>
        </Space>
      </Col>

      <Col xs={24} lg={8}>
        <Flex justify="flex-end" gap={16}>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => setIsAnalyticsModalVisible(true)}
            style={{
              borderRadius: 12,
              height: 44,
              color: themeToken.colorPrimary,
              borderColor: themeToken.colorPrimary,
              fontWeight: 600,
            }}
          >
            สถิติและวิเคราะห์
          </Button>
        </Flex>
      </Col>
    </Row>
  </Card>
);

const OvertimeTableSection = ({
  dataSource,
  isLoadingOvertimeData,
  paginationState,
  selectedRowKeys,
  setSelectedRowKeys,
  onTableChange,
  requestDeleteOvertimeSubmission,
  requestApproveOvertimeSubmission,
  requestSendOvertimeMailToHR,
  requestDetailedOvertimeContentByID,
  navigationRouter,
  setIsAnalyticsModalVisible,
  setIsExportModalVisible,
  themeToken,
}: any) => {
  /**
   * ระบบตรวจสอบความสมบูรณ์ของข้อมูลเบื้องต้น (Preliminary Validation)
   * เพื่อแจ้งเตือนผู้อนุมัติหากข้อมูลที่พนักงานส่งมาไม่ครบถ้วนตามเกณฑ์
   */
  const validateOvertimeRecordCompleteness = (record: any) => {
    const firstDescription = record.descriptions?.[0];
    const proofData = firstDescription?.proof || {};
    const missingItems = [];

    // 1. ตรวจสอบลายเซ็นรับรอง
    if (!proofData.signature_1) {
      missingItems.push("ลายเซ็นรับรอง");
    }

    // 2. ตรวจสอบรูปภาพมัดจำงาน 1, 2, 3, 4
    const requiredImageKeys = ["image_1", "image_2", "image_3", "image_4"];
    const missingImages = requiredImageKeys.filter((key) => !proofData[key]);
    if (missingImages.length > 0) {
      const displayIndices = missingImages.map((k) => k.split("_")[1]);
      missingItems.push(`รูปภาพหลักฐานชุดที่ ${displayIndices.join(", ")}`);
    }

    // 3. ตรวจสอบรายละเอียดงาน (ต้องมีข้อมูลครบทุกรายการ)
    const hasEmptyDescription =
      !record.descriptions ||
      record.descriptions.length === 0 ||
      record.descriptions.some((d: any) => !d.description?.trim());
    if (hasEmptyDescription) {
      missingItems.push("รายละเอียดภาระงาน");
    }

    return missingItems;
  };

  // การตั้งค่าคอลัมน์ของตารางรายการ OT
  const tableColumnsConfiguration = [
    {
      title: "",
      key: "completeness_alert",
      width: 50,
      render: (recordContentData: any) => {
        const errors = validateOvertimeRecordCompleteness(recordContentData);
        if (errors.length === 0) return null;

        return (
          <Tooltip
            title={
              <Flex vertical gap={4} style={{ padding: "4px 8px" }}>
                <Typography.Text
                  strong
                  style={{ color: "rgba(255,255,255,0.9)", fontSize: 13 }}
                >
                  <WarningOutlined style={{ marginRight: 8 }} />
                  ข้อมูลไม่ครบถ้วน
                </Typography.Text>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {errors.map((err, i) => (
                    <div key={i}>- {err}</div>
                  ))}
                </div>
              </Flex>
            }
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Badge dot status="warning" offset={[-2, 2]}>
                <WarningOutlined
                  style={{ color: themeToken.colorWarning, fontSize: 18 }}
                />
              </Badge>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "รหัสอ้างอิง",
      dataIndex: "id",
      key: "id",
      width: 120,
      sorter: (a: any, b: any) => Number(a.id) - Number(b.id),
      render: (textValue: string) => (
        <Typography.Text strong style={{ color: themeToken.colorPrimary }}>
          #{textValue}
        </Typography.Text>
      ),
    },
    {
      title: "พนักงานผู้ยื่นคำขอ",
      key: "requester_data_source",
      width: 280,
      sorter: (a: any, b: any) => {
        const getName = (record: any) => {
          const localUser = getUserById(record.requester_id);
          const backendUser = record.requester_user;
          const userObj = localUser || backendUser;
          if (!userObj)
            return String(
              record.requester_name || record.requester_id || "",
            ).toLowerCase();
          return `${userObj.firstname || userObj.firstname_th || ""} ${userObj.lastname || userObj.lastname_th || ""}`
            .trim()
            .toLowerCase();
        };
        return getName(a).localeCompare(getName(b));
      },
      render: (recordContentData: any) => {
        // Priority: local storage -> backend user -> direct name
        const localUser = getUserById(recordContentData.requester_id);
        const backendUser = recordContentData.requester_user;

        const userObj = localUser || backendUser;

        const name = (() => {
          if (!userObj)
            return (
              recordContentData.requester_name || recordContentData.requester_id
            );

          const thName =
            `${userObj.firstname || userObj.firstname_th || ""} ${userObj.lastname || userObj.lastname_th || ""}`.trim();
          const enName =
            `${userObj.firstname_en || ""} ${userObj.lastname_en || ""}`.trim();
          const nickname = userObj.nickname ? `(${userObj.nickname})` : "";

          const primaryName =
            thName || enName || userObj.username || String(userObj.admin_id);
          return nickname ? `${primaryName} ${nickname}`.trim() : primaryName;
        })();

        const avatarSrc =
          userObj?.profile_image ||
          userObj?.profile_image_path ||
          userObj?.image_profile;

        return (
          <Flex align="center" gap={12}>
            <Avatar
              size={44}
              src={avatarSrc}
              icon={<UserOutlined />}
              style={{ border: `2px solid ${themeToken.colorBorderSecondary}` }}
            >
              {!avatarSrc && name ? name[0] : "?"}
            </Avatar>
            <Flex vertical>
              <Typography.Text strong style={{ fontSize: 14 }}>
                {name}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {userObj?.employee_code ||
                  recordContentData.requester_employee_code ||
                  `ID: ${recordContentData.requester_id || "-"}`}
              </Typography.Text>
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: "วันที่และเวลาทำงาน",
      dataIndex: "request_date",
      key: "request_date_display",
      sorter: (a: any, b: any) =>
        dayjs(a.request_date).unix() - dayjs(b.request_date).unix(),
      render: (dateStringValue: string, recordContentData: any) => {
        const totalDurationValue =
          recordContentData.descriptions?.reduce(
            (sumValue: number, itemSource: any) =>
              sumValue + Number(itemSource.duration || 0),
            0,
          ) || 0;
        return (
          <Flex vertical gap={4}>
            <Space>
              <CalendarOutlined style={{ color: themeToken.colorPrimary }} />
              <Typography.Text>
                {dayjs(dateStringValue).format("DD/MM/YYYY")}
              </Typography.Text>
            </Space>
            <Tag
              color="processing"
              style={{ width: "fit-content", borderRadius: 4 }}
            >
              รวม {totalDurationValue} ชั่วโมง
            </Tag>
          </Flex>
        );
      },
    },
    {
      title: "สถานะปัจจุบัน",
      dataIndex: "status",
      key: "status_badge",
      sorter: (a: any, b: any) =>
        (a.status || "").localeCompare(b.status || ""),
      render: (statusValueString: string) => {
        const statusConfigData = OT_STATUS.find(
          (item) => item.value === statusValueString,
        );
        return (
          <Flex align="center" gap={8}>
            <Badge status={statusConfigData?.color as any} />
            <Typography.Text
              strong
              style={{
                color:
                  statusConfigData?.color === "gold" ? "#d48806" : undefined,
              }}
            >
              {statusConfigData?.text || statusValueString}
            </Typography.Text>
          </Flex>
        );
      },
    },
    {
      title: "จัดการรายการ",
      key: "action_menu",
      align: "center" as const,
      width: 220,
      render: (recordContentData: any) => (
        <Space size="middle">
          <Tooltip title="ดูรายละเอียดภาระงาน">
            <Button
              shape="default"
              icon={<SearchOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                requestDetailedOvertimeContentByID(recordContentData.id);
              }}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
          <Tooltip title="พิมพ์รายงาน PDF">
            <Button
              shape="default"
              icon={<FilePdfOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigationRouter.push(
                  `/timesheet/overtime/preview/${recordContentData.id}`,
                );
              }}
              style={{ borderRadius: 8, color: themeToken.colorError }}
            />
          </Tooltip>
          <Tooltip title="อนุมัติผ่านระบบ">
            <Button
              shape="default"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                requestApproveOvertimeSubmission(recordContentData.id);
              }}
              style={{
                background: themeToken.colorSuccess,
                borderColor: themeToken.colorSuccess,
                borderRadius: 8,
              }}
            />
          </Tooltip>
          <Tooltip title="ส่งอีเมลแจ้ง HR">
            <Button
              shape="default"
              icon={<MailOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                requestSendOvertimeMailToHR(recordContentData.id);
              }}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
          <Tooltip title="ลบข้อมูลถาวร">
            <Button
              shape="default"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                requestDeleteOvertimeSubmission(recordContentData.id);
              }}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
      title={
        <Space>
          <UnorderedListOutlined style={{ color: themeToken.colorPrimary }} />
          <Typography.Text strong style={{ fontSize: 16 }}>
            รายการคำขอ OT ทั้งหมดในระบบ
          </Typography.Text>
        </Space>
      }
      extra={
        <Space size="middle">
          <Button
            icon={<BarChartOutlined />}
            onClick={() => setIsAnalyticsModalVisible(true)}
            style={{ borderRadius: 10, height: 40 }}
          >
            สถิติเชิงลึก
          </Button>
          <Button
            type="primary"
            ghost
            icon={<CloudDownloadOutlined />}
            onClick={() => setIsExportModalVisible(true)}
            style={{ borderRadius: 10, height: 40 }}
          >
            ดาวน์โหลดรายงาน Excel
          </Button>
        </Space>
      }
      styles={{ body: { padding: "8px 24px 24px" } }}
    >
      {/* ตารางแสดงผลรายการคำขอ OT พร้อมฟังก์ชันขยายแถว */}
      <Table
        loading={isLoadingOvertimeData}
        dataSource={dataSource}
        columns={tableColumnsConfiguration}
        rowSelection={{
          selectedRowKeys,
          onChange: (newRowKeys) => setSelectedRowKeys(newRowKeys),
        }}
        pagination={{
          ...paginationState,
          showSizeChanger: true,
          showTotal: (totalRecords) => `แสดงผลทั้งหมด ${totalRecords} รายการ`,
          style: { padding: "20px 24px" },
        }}
        onChange={onTableChange}
        expandable={{
          expandedRowRender: (recordContentData) => (
            <Flex
              vertical
              gap={16}
              style={{
                padding: "20px 32px",
                background: themeToken.colorFillQuaternary,
                borderRadius: "0 0 12px 12px",
              }}
            >
              <Typography.Text
                strong
                style={{ fontSize: 13, color: themeToken.colorTextSecondary }}
              >
                <SolutionOutlined style={{ marginRight: 8 }} />
                รายการภาระงานและเวลาปฏิบัติงานจริง
              </Typography.Text>
              <Row gutter={[12, 12]}>
                {recordContentData.descriptions?.map(
                  (descriptionItem: any, indexValue: number) => (
                    <Col span={24} key={indexValue}>
                      <Flex justify="space-between" align="center">
                        <Typography.Text style={{ fontSize: 14 }}>
                          {descriptionItem.description}
                        </Typography.Text>
                        <Tag
                          color="geekblue"
                          style={{
                            borderRadius: 6,
                            paddingInline: 12,
                            fontWeight: 600,
                          }}
                        >
                          {descriptionItem.duration} ชม.
                        </Tag>
                      </Flex>
                    </Col>
                  ),
                )}
              </Row>
            </Flex>
          ),
          expandRowByClick: true,
        }}
        onRow={(record) => ({
          onClick: () => requestDetailedOvertimeContentByID(record.id),
        })}
        style={{ cursor: "pointer" }}
      />
    </Card>
  );
};

// --- ส่วนประกอบ UI ย่อย (Sub-components) สำหรับแสดงผลในแต่ละหน้าส่วน ---

/**
 * ส่วนแสดงผลรูปภาพอัปโหลด สำหรับหน้าสร้างรายการคำขอ
 * ช่วยลดการเขียน Code ซ้ำซ้อนและทำให้อ่านง่ายขึ้น
 */
const UploadFieldItem = ({
  name,
  label,
  required = false,
  form,
}: {
  name: string;
  label: string;
  required?: boolean;
  form: any;
}) => (
  <Form.Item
    name={name}
    label={
      <Typography.Text style={{ fontSize: 13 }}>
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </Typography.Text>
    }
    valuePropName="fileList"
    getValueFromEvent={(e: any) => (Array.isArray(e) ? e : e?.fileList)}
    rules={required ? [{ required: true, message: `โปรดอัปโหลด${label}` }] : []}
    style={{ marginBottom: 20 }}
  >
    <Upload
      listType="picture-card"
      maxCount={1}
      multiple={false}
      style={{ marginBottom: 8 }}
      beforeUpload={(file) => {
        const isLt2M = file.size < 2 * 1024 * 1024;
        if (!isLt2M) {
          toast.error(`ไฟล์ "${file.name}" ใหญ่เกินไป (จำกัด 2MB)`);
          return Upload.LIST_IGNORE;
        }
        return false;
      }}
    >
      <Form.Item noStyle dependencies={[name]}>
        {() => (
          <div
            style={{
              display: form.getFieldValue(name)?.length >= 1 ? "none" : "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <PlusOutlined />
            <div style={{ fontSize: 10 }}>อัปโหลด</div>
          </div>
        )}
      </Form.Item>
    </Upload>
  </Form.Item>
);

/**
 * การ์ดแสดงข้อมูลรายงานภาระงานรายข้อ สำหรับหน้าสร้างคำขอ
 */
const TaskDescriptionCard = ({
  fieldProps,
  remove,
  themeToken,
}: {
  fieldProps: any;
  remove: (index: number) => void;
  themeToken: any;
}) => (
  <Card
    size="small"
    variant="borderless"
    style={{
      background: themeToken.colorFillQuaternary,
      borderRadius: 12,
    }}
  >
    <Flex vertical gap={12}>
      <Row gutter={12}>
        <Col flex="auto">
          {/* บรรยายรายละเอียดเนื้องาน */}
          <Form.Item
            {...fieldProps}
            name={[fieldProps.name, "description"]}
            label={
              <Typography.Text strong style={{ fontSize: 12 }}>
                รายละเอียดภาระงาน
              </Typography.Text>
            }
            rules={[{ required: true, message: "ระบุเนื้องาน" }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              placeholder="เช่น ตรวจสอบความถูกต้องของฐานข้อมูลรายชื่อ..."
              style={{ height: 44, borderRadius: 10, marginBottom: 4 }}
            />
          </Form.Item>
        </Col>
        <Col flex="none">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => remove(fieldProps.name)}
            style={{ marginTop: 28 }}
          />
        </Col>
      </Row>
      <Row gutter={12}>
        <Col xs={24} md={8}>
          <Form.Item
            {...fieldProps}
            name={[fieldProps.name, "startDate"]}
            label={
              <Typography.Text style={{ fontSize: 12 }}>
                เริ่มกี่โมง?
              </Typography.Text>
            }
            rules={[{ required: true, message: "โปรดระบุเวลา" }]}
            style={{ marginBottom: 16 }}
          >
            <TimePicker
              format="HH:mm"
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                marginBottom: 4,
              }}
              placeholder="เริ่ม"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            {...fieldProps}
            name={[fieldProps.name, "endDate"]}
            label={
              <Typography.Text style={{ fontSize: 12 }}>
                เสร็จกี่โมง?
              </Typography.Text>
            }
            rules={[{ required: true, message: "โปรดระบุเวลา" }]}
            style={{ marginBottom: 16 }}
          >
            <TimePicker
              format="HH:mm"
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                marginBottom: 4,
              }}
              placeholder="จบ"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            {...fieldProps}
            name={[fieldProps.name, "duration"]}
            label={
              <Typography.Text style={{ fontSize: 12 }}>
                ชม. รวม (อัตโนมัติ)
              </Typography.Text>
            }
            rules={[{ required: true, message: "ระบุเวลา" }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              type="number"
              step="0.5"
              suffix={
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  ชม.
                </Typography.Text>
              }
              placeholder="0.0"
              style={{ height: 38, borderRadius: 8, marginBottom: 4 }}
            />
          </Form.Item>
        </Col>
      </Row>
    </Flex>
  </Card>
);

const CreateModalSection = ({
  visible,
  setVisible,
  userOptions,
  requestCreateOvertimeSubmission,
  loading,
  form,
  themeToken,
}: any) => {
  // ฟังก์ชันย่อยสำหรับประมวลผลการคำนวณชั่วโมงทำงานอัตโนมัติ
  const calculateAutoDuration = (changedValues: any, allValues: any) => {
    if (!changedValues.descriptions) return;

    const updatedDescriptions = [...(allValues.descriptions || [])];
    let isChanged = false;

    Object.entries(changedValues.descriptions).forEach(
      ([indexStr, value]: [string, any]) => {
        const idx = parseInt(indexStr, 10);
        if (value && (value.startDate || value.endDate)) {
          const start = updatedDescriptions[idx].startDate;
          const end = updatedDescriptions[idx].endDate;

          if (start && end) {
            const diff = dayjs(end).diff(dayjs(start), "hour", true);
            const duration = Math.max(0, diff).toFixed(1);

            if (updatedDescriptions[idx].duration !== duration) {
              updatedDescriptions[idx].duration = duration;
              isChanged = true;
            }
          }
        }
      },
    );

    if (isChanged) form.setFieldsValue({ descriptions: updatedDescriptions });
  };

  const handleSubmission = async (formValues: any) => {
    const success = await requestCreateOvertimeSubmission(formValues);
    if (success) setVisible(false);
  };

  return (
    <Modal
      title={
        <Flex
          align="center"
          gap={12}
          style={{
            background: `linear-gradient(90deg, ${themeToken.colorPrimary}, ${themeToken.colorInfo})`,
            padding: "24px",
            margin: "-20px -24px 0",
            borderRadius: "20px 20px 0 0",
          }}
        >
          {/* หน้าต่าง Modal สำหรับขั้นตอนการสร้างรายการคำขอ OT ใหม่ */}
          <Flex
            align="center"
            justify="center"
            style={{
              background: "rgba(255,255,255,0.2)",
              width: 40,
              height: 40,
              borderRadius: 12,
            }}
          >
            <PlusOutlined style={{ color: "#fff", fontSize: 20 }} />
          </Flex>
          <Flex vertical>
            <Typography.Text
              strong
              style={{ color: "#fff", fontSize: 18, lineHeight: 1.2 }}
            >
              เพิ่มรายการคำขอ OT ใหม่
            </Typography.Text>
            <Typography.Text
              style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}
            >
              กรุณาระบุข้อมูลการทำงานให้ครบถ้วนเพื่อการพิจารณา
            </Typography.Text>
          </Flex>
        </Flex>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={760}
      centered
      style={{ borderRadius: 20, overflow: "hidden" }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmission}
        style={{ paddingTop: 32 }}
        onValuesChange={calculateAutoDuration}
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            {/* ระบุวันที่ปฏิบัติงานจริง */}
            <Form.Item
              name="request_date"
              label={<Typography.Text strong>วันที่ปฏิบัติงาน</Typography.Text>}
              initialValue={dayjs()}
              rules={[{ required: true, message: "โปรดระบุวันที่" }]}
              style={{ marginBottom: 24 }}
            >
              <DatePicker
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  marginBottom: 4,
                }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            {/* เลือกพนักงานที่เป็นผู้มอบหมายงาน - ล็อกไว้ที่ Admin SB Helper */}
            <Form.Item
              name="assignee"
              label={<Typography.Text strong>ผู้มอบหมายงาน</Typography.Text>}
              initialValue={BYPASS_ADMIN_ID}
              rules={[{ required: true, message: "โปรดเลือกผู้มอบหมายงาน" }]}
              style={{ marginBottom: 24 }}
            >
              <Select
                options={userOptions}
                disabled
                showSearch
                placeholder="ระบุชื่อผู้มอบหมายงาน..."
                optionFilterProp="label"
                loading={loading}
                style={{ height: 48, marginBottom: 4 }}
                styles={{ popup: { root: { borderRadius: 12 } } }}
                notFoundContent={
                  loading ? (
                    <Typography.Text type="secondary">
                      กำลังโหลดข้อมูลพนักงาน...
                    </Typography.Text>
                  ) : (
                    <Typography.Text type="secondary">
                      ไม่พบพนักงาน
                    </Typography.Text>
                  )
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            {/* เลือกประเภทการทำ OT (วันปกติ หรือ วันหยุด) */}
            <Form.Item
              name="overtime_type"
              label={
                <Typography.Text strong>ประเภทการทำงาน (OT)</Typography.Text>
              }
              rules={[{ required: true, message: "โปรดเลือกประเภท OT" }]}
              initialValue="weekday"
              style={{ marginBottom: 24 }}
            >
              <Select
                options={[
                  { label: "OT วันทำงานปกติ (Weekday OT)", value: "weekday" },
                  { label: "OT วันหยุด (Holiday OT)", value: "holiday" },
                ]}
                style={{ height: 48, marginBottom: 4 }}
                styles={{ popup: { root: { borderRadius: 12 } } }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ marginBlock: 32 }}>
          <Space>
            <FileTextOutlined />{" "}
            <Typography.Text strong>
              รายละเอียดงานที่ได้รับมอบหมาย
            </Typography.Text>
          </Space>
        </Divider>

        {/* ส่วนจัดการรายการภาระงานที่ทำในคำขอนี้ */}
        <Form.List
          name="descriptions"
          initialValue={[
            {
              description: "",
              duration: "1.0",
              startDate: dayjs().hour(18).minute(0),
              endDate: dayjs().hour(19).minute(0),
            },
          ]}
        >
          {(fields, { add, remove }) => {
            const descriptions = form.getFieldValue("descriptions") || [];
            const totalHours = descriptions.reduce(
              (sumValue: number, currentItem: any) =>
                sumValue + Number(currentItem?.duration || 0),
              0,
            );

            return (
              <Flex vertical gap={20}>
                {fields.map(({ key, ...fieldProps }) => (
                  <TaskDescriptionCard
                    key={key}
                    fieldProps={fieldProps}
                    remove={remove}
                    themeToken={themeToken}
                  />
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      description: "",
                      duration: "1.0",
                      startDate: dayjs().hour(18).minute(0),
                      endDate: dayjs().hour(19).minute(0),
                    })
                  }
                  icon={<PlusOutlined />}
                  block
                  style={{
                    height: 48,
                    borderRadius: 12,
                    borderStyle: "dashed",
                    borderWidth: 2,
                  }}
                >
                  เพิ่มรายการภาระงานถัดไป
                </Button>

                <Flex
                  justify="flex-end"
                  align="center"
                  gap={12}
                  style={{
                    padding: "16px 20px",
                    background: themeToken.colorInfoBg,
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                >
                  <Typography.Text strong type="secondary">
                    รวมชั่วโมง OT ทั้งหมดในคำขอนี้:
                  </Typography.Text>
                  <Tag
                    color="blue"
                    style={{
                      fontSize: 16,
                      paddingInline: 16,
                      paddingBlock: 4,
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  >
                    {totalHours.toFixed(1)} ชั่วโมง
                  </Tag>
                </Flex>
              </Flex>
            );
          }}
        </Form.List>

        {/* --- ส่วนที่ 1: หลักฐานการทำงาน (Work Evidence Section) --- */}
        <div style={{ marginTop: 24 }}>
          <Divider orientation="left" style={{ marginBlock: 16 }}>
            <Space>
              <CameraOutlined style={{ color: themeToken.colorWarning }} />
              <Typography.Text strong>หลักฐานการทำงาน</Typography.Text>
            </Space>
          </Divider>
          <Card
            size="small"
            style={{
              borderRadius: 16,
              background: themeToken.colorFillAlter,
            }}
          >
            <Row gutter={[16, 24]}>
              <Col xs={24} sm={12}>
                <UploadFieldItem
                  name="proof_checkin"
                  label="1. หลักฐานการเข้าทำงาน (Line Group)"
                  required
                  form={form}
                />
              </Col>
              <Col xs={24} sm={12}>
                <UploadFieldItem
                  name="proof_checkout"
                  label="2. หลักฐานการออกทำงาน (Line Group)"
                  required
                  form={form}
                />
              </Col>
              <Col xs={24} sm={12}>
                <UploadFieldItem
                  name="proof_work_1"
                  label="3. หลักฐานการทำงานจริง #1"
                  required
                  form={form}
                />
              </Col>
              <Col xs={24} sm={12}>
                <UploadFieldItem
                  name="proof_work_2"
                  label="4. หลักฐานการทำงานจริง #2"
                  required
                  form={form}
                />
              </Col>
            </Row>
          </Card>
        </div>

        {/* --- ส่วนที่ 2: ลายเซ็นการทำงาน (Work Signature Section) --- */}
        <div style={{ marginTop: 16 }}>
          <Divider orientation="left" style={{ marginBlock: 16 }}>
            <Space>
              <EditOutlined style={{ color: themeToken.colorSuccess }} />
              <Typography.Text strong>ลายเซ็นผู้ปฏิบัติงาน</Typography.Text>
            </Space>
          </Divider>
          <Card
            size="small"
            style={{
              borderRadius: 16,
              background: themeToken.colorFillAlter,
            }}
          >
            <UploadFieldItem
              name="signature_file"
              label="อัปโหลดรูปภาพลายเซ็นรับรอง (1 รูป)"
              required
              form={form}
            />
          </Card>
        </div>

        <Flex justify="flex-end" gap={16} style={{ marginTop: 48 }}>
          <Button
            onClick={() => setVisible(false)}
            style={{ borderRadius: 12, height: 48, paddingInline: 32 }}
          >
            ยกเลิกคำขอ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              borderRadius: 12,
              height: 48,
              paddingInline: 48,
              fontWeight: 600,
            }}
          >
            ส่งคำขออนุมัติ
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

const BatchStatusModalSection = ({
  visible,
  setVisible,
  selectedRowKeys,
  batchSelectedStatus,
  setBatchSelectedStatus,
  requestBatchApproveOvertimeSubmission,
  batchProcessing,
  themeToken,
}: any) => (
  <Modal
    title={
      <Space>
        <ThunderboltOutlined style={{ color: themeToken.colorWarning }} />{" "}
        เปลี่ยนสถานะรายการที่เลือกพร้อมกัน
      </Space>
    }
    open={visible}
    onCancel={() => setVisible(false)}
    onOk={async () => {
      await requestBatchApproveOvertimeSubmission(batchSelectedStatus);
      setVisible(false);
    }}
    confirmLoading={batchProcessing}
    okText="ยืนยันการเปลี่ยนสถานะ"
    cancelText="ยกเลิก"
    centered
    width={500}
    style={{ borderRadius: 20, overflow: "hidden" }}
  >
    {/* Modal สำหรับการเปลี่ยนสถานะแบบกลุ่มพร้อมกันหลายรายการ */}
    <Flex vertical gap={20} style={{ paddingBlock: 24 }}>
      <Flex
        style={{
          padding: "16px 20px",
          background: themeToken.colorInfoBg,
          borderRadius: 12,
          border: `1px solid ${themeToken.colorInfoBorder}`,
        }}
      >
        <Typography.Text>
          ท่านกำลังดำเนินการกับคำขอจำนวน{" "}
          <Typography.Text strong color="primary">
            {selectedRowKeys.length}
          </Typography.Text>{" "}
          รายการที่เลือกไว้
        </Typography.Text>
      </Flex>

      <Flex vertical gap={10}>
        <Typography.Text strong>
          เลือกสถานะที่ต้องการปรับปรุงให้เหมือนกัน:
        </Typography.Text>
        <Select
          value={batchSelectedStatus}
          onChange={setBatchSelectedStatus}
          options={OT_STATUS.map((item) => ({
            label: item.text,
            value: item.value,
          }))}
          style={{ width: "100%", height: 48 }}
          styles={{ popup: { root: { borderRadius: 12 } } }}
        />
      </Flex>

      <Flex
        align="center"
        gap={10}
        style={{
          padding: "12px 16px",
          background: "#fffbe6",
          borderRadius: 12,
          border: "1px solid #ffe58f",
        }}
      >
        <WarningOutlined style={{ color: "#faad14" }} />
        <Typography.Text style={{ fontSize: 13 }}>
          การดำเนินการนี้จะส่งผลต่อข้อมูลดิบในฐานข้อมูลทันที
          โปรงานตรวจสอบให้รอบคอบ
        </Typography.Text>
      </Flex>
    </Flex>
  </Modal>
);

const DetailModalSection = ({
  visible,
  setVisible,
  selectedDetail,
  themeToken,
}: any) => {
  // คำนวณสรุปจำนวนชั่วโมงทำงานโดยรวมในคำขอที่ถูกเลือก
  const totalDurationSummaryValue = useMemo(() => {
    return (
      selectedDetail?.descriptions?.reduce(
        (sum: number, item: any) => sum + Number(item.duration || 0),
        0,
      ) || 0
    );
  }, [selectedDetail]);

  // รวบรวมรูปภาพหลักฐานทั้งหมดจากทุกรายการภาระงาน (ปกติจะอยู่ที่รายการแรก)
  const proofImages = useMemo(() => {
    if (!selectedDetail?.descriptions) return {};
    return selectedDetail.descriptions.reduce(
      (acc: any, item: any) => ({
        ...acc,
        ...(item.proof || {}),
      }),
      {},
    );
  }, [selectedDetail]);

  const hasAnyProof = Object.keys(proofImages).length > 0;

  return (
    <Modal
      title={
        <Flex align="center" gap={12}>
          <div
            style={{
              background: themeToken.colorPrimaryBg,
              padding: 8,
              borderRadius: 10,
              display: "flex",
            }}
          >
            <FileSearchOutlined style={{ color: themeToken.colorPrimary }} />
          </div>
          <Typography.Text strong style={{ fontSize: 16 }}>
            รายละเอียดคำขอ OT #{selectedDetail?.id}
          </Typography.Text>
        </Flex>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button
          key="close"
          type="primary"
          onClick={() => setVisible(false)}
          style={{ borderRadius: 10, height: 40, paddingInline: 32 }}
        >
          ตกลง
        </Button>,
      ]}
      width={900}
      centered
      style={{ borderRadius: 20, overflow: "hidden" }}
    >
      {selectedDetail ? (
        <Flex vertical gap={24} style={{ paddingBlock: 16 }}>
          {/* ส่วนที่ 1: ข้อมูลพนักงานและสถานะ */}
          <Card
            variant="borderless"
            style={{
              background: themeToken.colorFillQuaternary,
              borderRadius: 16,
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={14}>
                <Flex gap={16} align="center">
                  <Avatar
                    size={64}
                    src={
                      selectedDetail.requester_user?.profile_image ||
                      getUserById(selectedDetail.requester_id)?.profile_image
                    }
                    icon={<UserOutlined />}
                    style={{
                      border: `2px solid #fff`,
                      boxShadow: themeToken.boxShadowTertiary,
                    }}
                  />
                  <Flex vertical>
                    <Typography.Text strong style={{ fontSize: 18 }}>
                      {selectedDetail.requester_name ||
                        `${selectedDetail.requester_user?.firstname_th} ${selectedDetail.requester_user?.lastname_th}`}
                      {selectedDetail.requester_user?.nickname && (
                        <span
                          style={{
                            marginLeft: 4,
                            color: themeToken.colorTextSecondary,
                            fontWeight: 400,
                          }}
                        >
                          ({selectedDetail.requester_user.nickname})
                        </span>
                      )}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {selectedDetail.requester_position ||
                        selectedDetail.requester_user?.position_th}{" "}
                      •{" "}
                      {selectedDetail.requester_employee_code ||
                        selectedDetail.requester_user?.employee_code}
                    </Typography.Text>
                  </Flex>
                </Flex>
              </Col>
              <Col xs={24} md={10}>
                <Flex vertical align="flex-end" gap={8}>
                  <Tag
                    color={
                      OT_STATUS.find(
                        (item) => item.value === selectedDetail.status,
                      )?.color
                    }
                    style={{
                      fontSize: 14,
                      padding: "4px 16px",
                      borderRadius: 8,
                      margin: 0,
                      fontWeight: 600,
                    }}
                  >
                    {OT_STATUS.find(
                      (item) => item.value === selectedDetail.status,
                    )?.text || selectedDetail.status}
                  </Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    วันที่ปฏิบัติงาน:{" "}
                    {dayjs(selectedDetail.request_date).format("DD/MM/YYYY")}
                  </Typography.Text>
                </Flex>
              </Col>
            </Row>
          </Card>

          {/* ส่วนที่ 2: รายละเอียดเนื้องาน */}
          <Flex vertical gap={12}>
            <Divider orientation="left" style={{ margin: "8px 0" }}>
              <Space>
                <FileTextOutlined style={{ color: themeToken.colorInfo }} />
                <Typography.Text strong>
                  รายการภาระงานที่ปฏิบัติ
                </Typography.Text>
              </Space>
            </Divider>
            <Table
              dataSource={selectedDetail.descriptions}
              pagination={false}
              rowKey="id"
              size="middle"
              columns={[
                {
                  title: "รายละเอียดเนื้องาน",
                  dataIndex: "description",
                  key: "desc",
                  render: (text) => (
                    <Typography.Text style={{ fontSize: 14 }}>
                      {text}
                    </Typography.Text>
                  ),
                },
                {
                  title: "เวลาปฏิบัติงาน",
                  key: "time",
                  width: 220,
                  render: (record) => (
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {record.start_date
                        ? dayjs(record.start_date).format("HH:mm")
                        : "-"}{" "}
                      -{" "}
                      {record.end_date
                        ? dayjs(record.end_date).format("HH:mm")
                        : "-"}{" "}
                      น.
                    </Typography.Text>
                  ),
                },
                {
                  title: "จำนวน (ชม.)",
                  dataIndex: "duration",
                  key: "dur",
                  align: "center",
                  width: 120,
                  render: (value) => (
                    <Tag
                      color="blue"
                      style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}
                    >
                      {value} ชม.
                    </Tag>
                  ),
                },
              ]}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Typography.Text strong>
                        รวมจำนวนชั่วโมงทั้งหมด
                      </Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <Typography.Text
                        strong
                        style={{ color: themeToken.colorError, fontSize: 16 }}
                      >
                        {totalDurationSummaryValue}
                      </Typography.Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
              style={{
                border: `1px solid ${themeToken.colorBorderSecondary}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            />
          </Flex>

          {/* ส่วนที่ 3: หลักฐานรูปภาพและลายเซ็น */}
          <Flex vertical gap={16}>
            <Divider orientation="left" style={{ margin: "8px 0" }}>
              <Space>
                <CameraOutlined style={{ color: themeToken.colorWarning }} />
                <Typography.Text strong>หลักฐานการทำงาน</Typography.Text>
              </Space>
            </Divider>

            {hasAnyProof ? (
              <Card
                variant="borderless"
                style={{
                  background: themeToken.colorFillQuaternary,
                  borderRadius: 16,
                }}
              >
                <Image.PreviewGroup>
                  <Row gutter={[16, 24]}>
                    {[
                      { key: "image_1", label: "1. หลักฐานเข้าทำงาน" },
                      { key: "image_2", label: "2. หลักฐานออกทำงาน" },
                      { key: "image_3", label: "3. หลักฐานงานจริง #1" },
                      { key: "image_4", label: "4. หลักฐานงานจริง #2" },
                    ].map(
                      (item) =>
                        proofImages[item.key] && (
                          <Col xs={12} sm={6} md={4} key={item.key}>
                            <Flex vertical gap={8} align="flex-start">
                              <Image
                                src={proofImages[item.key]}
                                alt={item.label}
                                style={{
                                  borderRadius: 12,
                                  objectFit: "cover",
                                  height: 100,
                                  width: "100%",
                                  cursor: "pointer",
                                }}
                                fallback="/photo/no-image.png"
                              />
                              <Typography.Text
                                type="secondary"
                                style={{ fontSize: 11, textAlign: "left" }}
                              >
                                {item.label}
                              </Typography.Text>
                            </Flex>
                          </Col>
                        ),
                    )}

                    {/* ช่องแสดงลายเซ็นแยกต่างหาก */}
                    {proofImages.signature_1 && (
                      <Col span={24}>
                        <Divider dashed style={{ margin: "16px 0" }} />
                        <Flex align="flex-start" vertical gap={12}>
                          <Typography.Text strong style={{ fontSize: 13 }}>
                            ลายเซ็นรับรองผู้ปฏิบัติงาน
                          </Typography.Text>
                          <div
                            style={{
                              padding: "16px 24px",
                              background: "#fff",
                              borderRadius: 12,
                              border: `1px solid ${themeToken.colorBorderSecondary}`,
                              display: "inline-flex",
                            }}
                          >
                            <Image
                              src={proofImages.signature_1}
                              width={180}
                              style={{ maxHeight: 80, objectFit: "contain" }}
                              alt="Signature"
                            />
                          </div>
                        </Flex>
                      </Col>
                    )}
                  </Row>
                </Image.PreviewGroup>
              </Card>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="ไม่พบไฟล์ยอดหลักฐานรูปภาพในคำขอนี้"
                style={{ marginBlock: 20 }}
              />
            )}
          </Flex>

          {/* ส่วนท้าย: ข้อมูลการประมวลผล */}
          <Flex justify="space-between" align="center" style={{ marginTop: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <HistoryOutlined style={{ marginRight: 4 }} />
              ยื่นคำขอเมื่อ:{" "}
              {dayjs(selectedDetail.created_at).format("DD/MM/YYYY HH:mm")}
            </Typography.Text>
            {selectedDetail.updated_by && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                อัปเดตล่าสุดโดย: {selectedDetail.updater_name} (
                {dayjs(selectedDetail.updated_at).format("DD/MM/YYYY HH:mm")})
              </Typography.Text>
            )}
          </Flex>
        </Flex>
      ) : (
        <div style={{ padding: 40, textAlign: "center" }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      )}
    </Modal>
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
      {/* หน้าต่าง Dashboard สำหรับการแสดงผลเชิงสถิติ (Data Visualization) */}
      <Flex vertical gap={32} style={{ paddingBlock: 32 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {/* ส่วนแสดงแนวโน้มชั่วโมงงานสะสมผ่านกราฟแท่ง */}
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
            {/* ส่วนแสดงสัดส่วนสถานะงานผ่าน Doughnut Chart */}
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

const RulesModalSection = ({ visible, setVisible, themeToken }: any) => (
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
        onClick={() => setVisible(false)}
        style={{
          borderRadius: 12,
          height: 52,
          paddingInline: 40,
          fontWeight: 600,
        }}
      >
        ยอมรับและปฏิบัติตามระเบียบ
      </Button>,
    ]}
    centered
    width={680}
    style={{ borderRadius: 24, overflow: "hidden" }}
  >
    {/* Modal คู่มือและระเบียบการเบิกจ่ายค่าล่วงเวลา */}
    <Flex vertical align="center" gap={40} style={{ paddingBlock: 48 }}>
      <Flex style={{ position: "relative" }}>
        <Flex
          justify="center"
          align="center"
          style={{
            width: 120,
            height: 120,
            borderRadius: 40,
            background: themeToken.colorPrimaryBg,
            transform: "rotate(10deg)",
          }}
        >
          <BulbOutlined
            style={{
              fontSize: 56,
              color: themeToken.colorPrimary,
              transform: "rotate(-10deg)",
            }}
          />
        </Flex>
        <Flex
          style={{
            position: "absolute",
            bottom: -5,
            right: -5,
            width: 32,
            height: 32,
            background: themeToken.colorSuccess,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "4px solid #fff",
          }}
        >
          <CheckOutlined style={{ color: "#fff", fontSize: 14 }} />
        </Flex>
      </Flex>

      <Flex vertical align="center" gap={8}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          โปรดศึกษาระเบียบการ
        </Typography.Title>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 16, textAlign: "center", maxWidth: 460 }}
        >
          พนักงานทุกท่านต้องปฏิบัติตามแนวทางที่บริษัทกำหนด
          เพื่อความถูกต้องรวดเร็วในการเบิกจ่ายผลตอบแทน
        </Typography.Text>
      </Flex>

      <Flex style={{ width: "100%", paddingInline: 40 }}>
        {/* แสดงขั้นตอนสำคัญในการขอ OT */}
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
              children: "ลงบันทึกเวลาปฏิบัติงานในระบบ SB Helper ทันทีหลังจบงาน",
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

const ExportModalSection = ({
  visible,
  setVisible,
  onExport,
  loading,
  exportStepCount,
  setExportStepCount,
  isExportOperationSuccess,
  setIsExportOperationSuccess,
  themeToken,
  exportSelectedDateRange,
  setExportSelectedDateRange,
}: any) => (
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
    style={{ borderRadius: 24, overflow: "hidden" }}
  >
    {/* หน้าต่าง Modal จัดการการดาวน์โหลดและส่งออกไฟล์รายงาน */}
    {isExportOperationSuccess ? (
      <Result
        status="success"
        title="ระบบปฏิบัติการประมวลผลสำเร็จ"
        subTitle="ข้อมูลรายงาน OT ถูกส่งมอบไปยังเบราว์เซอร์ของท่านแล้ว โปรดตรวจสอบที่ไฟล์ดาวน์โหลด"
        extra={[
          <Button
            key="close"
            size="large"
            onClick={() => setVisible(false)}
            style={{ borderRadius: 12, height: 50, paddingInline: 32 }}
          >
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
        <Flex vertical gap={12} align="center">
          <Typography.Text strong style={{ fontSize: 16 }}>
            กำหนดช่วงเวลาในการส่งออก (Start - End Date)
          </Typography.Text>
          <DatePicker.RangePicker
            size="large"
            allowClear={false}
            value={exportSelectedDateRange}
            onChange={(dates) =>
              setExportSelectedDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
            }
            style={{ width: "100%", borderRadius: 12 }}
            format="DD / MM / BBBB"
          />
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            ระบบจะประมวลผลตามช่วงวันที่ระบุ รวมถึงสรุปยอดสะสม (Payroll)
          </Typography.Text>
        </Flex>

        <Flex
          vertical
          gap={16}
          style={{
            background: themeToken.colorFillQuaternary,
            padding: 32,
            borderRadius: 20,
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

        {exportStepCount === 0 && (
          <Row gutter={20}>
            <Col span={12}>
              <Button
                type="primary"
                icon={
                  <FileExcelOutlined
                    style={{ fontSize: 24, marginBottom: 8 }}
                  />
                }
                loading={loading}
                onClick={() => onExport(exportSelectedDateRange)}
                block
                style={{
                  height: 100,
                  borderRadius: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontWeight: 600 }}>Export Excel</span>
              </Button>
            </Col>
            <Col span={12}>
              <Button
                disabled
                icon={
                  <FilePdfOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                }
                block
                style={{
                  height: 100,
                  borderRadius: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontWeight: 600 }}>Export PDF</span>
              </Button>
            </Col>
          </Row>
        )}

        {loading && (
          <Flex vertical align="center" gap={16}>
            <Progress
              percent={
                exportStepCount === 1 ? 33 : exportStepCount === 2 ? 66 : 100
              }
              status="active"
              strokeColor={{
                "0%": themeToken.colorPrimary,
                "100%": themeToken.colorSuccess,
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

export default OvertimeManagementPage;
