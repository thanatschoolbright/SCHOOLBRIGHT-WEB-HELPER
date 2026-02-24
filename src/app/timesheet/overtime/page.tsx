"use client";

import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Flex,
  Form,
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
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FilterOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SolutionOutlined,
  StarOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import SummaryCard from "@/components/card/summary-card";
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
  const navigationRouter = useRouter();
  const { t: translate } = useTranslation();
  const { token: themeToken } = theme.useToken();
  const { message: antMessage, modal: antModal } = App.useApp();
  const { data: userSession } = useSession();
  const { user_id: parameterUserId } = useParams();

  const [overtimeForm] = Form.useForm();
  const authenticationState = useAppSelector((state) => state.callAdminLogin);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedOvertimeDetail, setSelectedOvertimeDetail] =
    useState<OvertimeRecord | null>(null);
  const [isLoadingOvertimeData, setIsLoadingOvertimeData] = useState(false);
  const [overtimeDataSource, setOvertimeDataSource] = useState<
    OvertimeRecord[]
  >([]);
  const [userSelectionOptions, setUserSelectionOptions] = useState<
    SelectOption[]
  >([]);
  const [descriptionSelectionOptions, setDescriptionSelectionOptions] =
    useState<SelectOption[]>([]);
  const [paginationState, setPaginationState] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processedRecordItems, setProcessedRecordItems] = useState<
    Set<React.Key>
  >(new Set());
  const [isBatchStatusModalVisible, setIsBatchStatusModalVisible] =
    useState(false);
  const [selectedBatchStatus, setSelectedBatchStatus] =
    useState<string>("approved");
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [exportStepCount, setExportStepCount] = useState(0);
  const [isExportOperationSuccess, setIsExportOperationSuccess] =
    useState(false);
  const [filterSearchTextValue, setFilterSearchTextValue] = useState("");
  const [filterSelectedMonthValue, setFilterSelectedMonthValue] =
    useState<dayjs.Dayjs | null>(null);
  const [isAnalyticsModalVisible, setIsAnalyticsModalVisible] = useState(false);
  const [isRulesModalVisible, setIsRulesModalVisible] = useState(true);

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
    (error: any, errorTitle: string = "เกิดข้อผิดพลาด") => {
      console.error(error);
      antModal.error({
        title: (
          <Space>
            <WarningOutlined style={{ color: themeToken.colorError }} />{" "}
            {errorTitle}
          </Space>
        ),
        content: (
          <Flex vertical gap={8}>
            <Typography.Text>ระบบไม่สามารถดำเนินการได้ในขณะนี้</Typography.Text>
            <Typography.Paragraph type="danger" style={{ fontSize: 12 }}>
              {error?.message || JSON.stringify(error)}
            </Typography.Paragraph>
          </Flex>
        ),
        okText: "รับทราบ",
      });
    },
    [antModal, themeToken.colorError],
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

  // ส่งคำร้องขอสร้างรายการปฏิบัติงานล่วงเวลาใหม่ไปยังระบบ
  const requestCreateOvertimeSubmission = async (
    formSubmissionPayload: any,
  ) => {
    try {
      setIsLoadingOvertimeData(true);
      const currentOperatingUserToken = await requestCurrentLocalUserID();

      const baseDateString = formSubmissionPayload.request_date
        ? dayjs(formSubmissionPayload.request_date).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

      const submissionBodyPayload = {
        ...formSubmissionPayload,
        request_date: baseDateString,
        descriptions: formSubmissionPayload.descriptions?.map((desc: any) => {
          const start = dayjs(desc.startDate);
          const end = dayjs(desc.endDate);
          const base = dayjs(baseDateString);

          const fullStart = base
            .hour(start.hour())
            .minute(start.minute())
            .second(0);
          const fullEnd = base.hour(end.hour()).minute(end.minute()).second(0);

          return {
            ...desc,
            duration: Number(desc.duration || 0),
            startDate: fullStart.toISOString(),
            endDate: fullEnd.toISOString(),
            assignee: String(formSubmissionPayload.assignee),
          };
        }),
        created_by: Number(currentOperatingUserToken),
        requester_id: String(currentOperatingUserToken),
      };

      // Clean up top-level fields that are now in descriptions or incorrectly placed
      delete (submissionBodyPayload as any).assignee;
      delete (submissionBodyPayload as any).start_time;
      delete (submissionBodyPayload as any).end_time;

      const apiResponseResultObject = await callApiService.post(
        "/api/v1/timesheet/overtime/create",
        submissionBodyPayload,
      );
      const apiResponseContentData = apiResponseResultObject?.data;

      if (
        apiResponseContentData &&
        (apiResponseContentData.status === 200 ||
          apiResponseContentData.status === 201)
      ) {
        antMessage.success(
          apiResponseContentData.message_th ?? "สร้างรายการสำเร็จ",
        );
        return apiResponseContentData.data;
      }
      throw new Error(
        apiResponseContentData?.message_th ?? "ไม่สามารถสร้างรายการได้",
      );
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
        antMessage.success(
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
        antMessage.success(
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
        antMessage.success(
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
    if (selectedRowKeys.length === 0)
      return antMessage.error("กรุณาเลือกรายการ");

    const currentUserTokenIdentifier = await requestCurrentLocalUserID();
    if (currentUserTokenIdentifier !== BYPASS_ADMIN_ID)
      return antMessage.error("คุณไม่มีสิทธิ์ปรับสถานะ");

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
      antMessage.success(
        `สำเร็จ ${successfulOperationsCount} รายการ, ล้มเหลว ${failedOperationsCount} รายการ`,
      );
      await requestOvertimeRequestListData({ page: paginationState.current });
    }
    setSelectedRowKeys([]);
    setProcessedRecordItems(new Set());
  };

  // ส่งอีเมลแจ้งเตือน HR สำหรับคำขอ OT หลายรายการพร้อมกัน (Batch Email)
  const requestBatchSendOvertimeMailToHR = async () => {
    if (selectedRowKeys.length === 0)
      return antMessage.error("กรุณาเลือกรายการ");

    const currentUserTokenIdentifier = await requestCurrentLocalUserID();
    if (currentUserTokenIdentifier !== BYPASS_ADMIN_ID)
      return antMessage.error("คุณไม่มีสิทธิ์ส่งอีเมล");

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
      antMessage.success(`สำเร็จ ${emailSentSuccessCount} รายการ`);
    }
    setSelectedRowKeys([]);
    setProcessedRecordItems(new Set());
  };

  // ประมวลผลและดาวน์โหลดไฟล์รายงาน OT ในรูปแบบ Excel ตามเงื่อนไขที่ระบุ
  const requestExportOvertimeReportFile = async (
    selectedTargetDateTime?: dayjs.Dayjs,
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
      const dateTimeToProcess =
        selectedTargetDateTime ?? filterSelectedMonthValue ?? dayjs();
      exportRequestParameters.from = dateTimeToProcess
        .startOf("month")
        .format("YYYY-MM-DD");
      exportRequestParameters.to = dateTimeToProcess
        .endOf("month")
        .format("YYYY-MM-DD");

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
      const finalResultFileName = `รายงานการทำงานล่วงเวลา ประจำเดือน ${dateTimeToProcess.locale("th").format("MMMM")} ปี ${dateTimeToProcess.locale("th").format("BBBB")}.xlsx`;
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
          isExportOperationSuccess={isExportOperationSuccess}
          themeToken={themeToken}
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
    style={{ borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
  >
    {/* ส่วนการ์ดสำหรับกรองข้อมูลรายการ */}
    <Flex vertical gap={24}>
      <Space>
        <FilterOutlined
          style={{ color: themeToken.colorPrimary, fontSize: 18 }}
        />
        <Typography.Text strong style={{ fontSize: 16 }}>
          ค้นหาและกรองข้อมูลเชิงลึก
        </Typography.Text>
      </Space>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Flex vertical gap={10}>
            <Typography.Text strong type="secondary" style={{ fontSize: 13 }}>
              ระบุคำสำคัญในการค้นหา
            </Typography.Text>
            <Input
              placeholder="รหัสอ้างอิง, ชื่อผู้ขอ, รายละเอียดงาน..."
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
        <Col xs={24} md={8}>
          <Flex vertical gap={10}>
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
        <Col xs={24} md={8}>
          <Flex vertical gap={10}>
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

      <Flex justify="flex-end" gap={16} style={{ marginTop: 8 }}>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setFilterSelectedMonthValue(null);
            setFilterSearchTextValue("");
            requestOvertimeRequestListData({ page: 1 });
          }}
          style={{ borderRadius: 12, height: 48, paddingInline: 24 }}
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
            height: 48,
            paddingInline: 40,
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
  themeToken,
}: any) => {
  // การตั้งค่าคอลัมน์ของตารางรายการ OT
  const tableColumnsConfiguration = [
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
      styles={{ body: { padding: 0 } }}
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
          showTotal: (totalRecords) => `ผลลัพธ์การค้นหา ${totalRecords} รายการ`,
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
                      <Flex
                        justify="space-between"
                        align="center"
                        style={{
                          background: "#fff",
                          padding: "14px 20px",
                          borderRadius: 12,
                          border: `1px solid ${themeToken.colorBorderSecondary}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        }}
                      >
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

const CreateModalSection = ({
  visible,
  setVisible,
  userOptions,
  requestCreateOvertimeSubmission,
  loading,
  form,
  themeToken,
}: any) => {
  const handleSubmission = async (formValues: any) => {
    await requestCreateOvertimeSubmission(formValues);
    setVisible(false);
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
        onValuesChange={(changedValues, allValues) => {
          // คำนวณจำนวนชั่วโมงทำงานอัตโนมัติจากผลต่างของเวลาเริ่มต้นและสิ้นสุด
          if (changedValues.descriptions) {
            const updatedDescriptions = [...allValues.descriptions];
            let updated = false;

            changedValues.descriptions.forEach((val: any, index: number) => {
              if (val && (val.startDate || val.endDate)) {
                const start = updatedDescriptions[index].startDate;
                const end = updatedDescriptions[index].endDate;
                if (start && end) {
                  const diffHours = dayjs(end).diff(dayjs(start), "hour", true);
                  const calcDuration = Math.max(0, diffHours).toFixed(1);

                  if (updatedDescriptions[index].duration !== calcDuration) {
                    updatedDescriptions[index].duration = calcDuration;
                    updated = true;
                  }
                }
              }
            });

            if (updated) {
              form.setFieldsValue({ descriptions: updatedDescriptions });
            }
          }
        }}
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            {/* ระบุวันที่ปฏิบัติงานจริง */}
            <Form.Item
              name="request_date"
              label={<Typography.Text strong>วันที่ปฏิบัติงาน</Typography.Text>}
              initialValue={dayjs()}
              rules={[{ required: true, message: "โปรดระบุวันที่" }]}
            >
              <DatePicker
                style={{ width: "100%", height: 48, borderRadius: 12 }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            {/* เลือกพนักงานที่เป็นผู้มอบหมายงาน */}
            <Form.Item
              name="assignee"
              label={<Typography.Text strong>ผู้มอบหมายงาน</Typography.Text>}
              rules={[{ required: true, message: "โปรดเลือกผู้มอบหมายงาน" }]}
            >
              <Select
                options={userOptions}
                showSearch
                allowClear
                placeholder="ระบุชื่อผู้มอบหมายงาน..."
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                loading={loading}
                style={{ height: 48 }}
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
            >
              <Select
                options={[
                  { label: "OT วันทำงานปกติ (Weekday OT)", value: "weekday" },
                  { label: "OT วันหยุด (Holiday OT)", value: "holiday" },
                ]}
                style={{ height: 48 }}
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
                  <Card
                    key={key}
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
                            rules={[
                              { required: true, message: "ระบุเนื้องาน" },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              placeholder="เช่น ตรวจสอบความถูกต้องของฐานข้อมูลรายชื่อ..."
                              style={{ height: 44, borderRadius: 10 }}
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
                          {/* ช่วงวลาที่เริ่มทำภาระงาน */}
                          <Form.Item
                            {...fieldProps}
                            name={[fieldProps.name, "startDate"]}
                            label={
                              <Typography.Text style={{ fontSize: 12 }}>
                                เริ่มกี่โมง?
                              </Typography.Text>
                            }
                            rules={[
                              { required: true, message: "โปรดระบุเวลา" },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <TimePicker
                              format="HH:mm"
                              style={{
                                width: "100%",
                                height: 38,
                                borderRadius: 8,
                              }}
                              placeholder="เริ่ม"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          {/* ช่วงเวลาที่สิ้นสุดภาระงาน */}
                          <Form.Item
                            {...fieldProps}
                            name={[fieldProps.name, "endDate"]}
                            label={
                              <Typography.Text style={{ fontSize: 12 }}>
                                เสร็จกี่โมง?
                              </Typography.Text>
                            }
                            rules={[
                              { required: true, message: "โปรดระบุเวลา" },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <TimePicker
                              format="HH:mm"
                              style={{
                                width: "100%",
                                height: 38,
                                borderRadius: 8,
                              }}
                              placeholder="จบ"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                          {/* จำนวนชั่วโมงการทำงานรวม */}
                          <Form.Item
                            {...fieldProps}
                            name={[fieldProps.name, "duration"]}
                            label={
                              <Typography.Text style={{ fontSize: 12 }}>
                                ชม. รวม (อัตโนมัติ)
                              </Typography.Text>
                            }
                            rules={[{ required: true, message: "ระบุเวลา" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              type="number"
                              step="0.5"
                              suffix={
                                <Typography.Text
                                  type="secondary"
                                  style={{ fontSize: 11 }}
                                >
                                  ชม.
                                </Typography.Text>
                              }
                              placeholder="0.0"
                              style={{ height: 38, borderRadius: 8 }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Flex>
                  </Card>
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

  return (
    <Modal
      title={
        <Space>
          <FileSearchOutlined /> ข้อมูลบรรยายภาระงานโดยละเอียด
        </Space>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button
          key="close"
          onClick={() => setVisible(false)}
          style={{ borderRadius: 10, height: 40, paddingInline: 24 }}
        >
          ปิดหน้าต่าง
        </Button>,
      ]}
      width={840}
      centered
      style={{ borderRadius: 20, overflow: "hidden" }}
    >
      {/* หน้าต่าง Modal รายละเอียดภาระงานรายบุคคล */}
      {selectedDetail ? (
        <Flex vertical gap={32} style={{ paddingBlock: 24 }}>
          <Row gutter={24}>
            <Col span={12}>
              {/* รายละเอียดรหัสอ้างอิงและวันที่ยื่นคำขอ */}
              <Card
                title="ข้อมูลพื้นฐานการขอ"
                variant="borderless"
                style={{
                  background: themeToken.colorFillQuaternary,
                  borderRadius: 16,
                }}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="รหัสคำขอ">
                    <Typography.Text strong>
                      {selectedDetail.id}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="วันที่ปฏิบัติงาน">
                    {dayjs(selectedDetail.request_date).format("DD/MM/YYYY")}
                  </Descriptions.Item>
                  <Descriptions.Item label="วันที่ประมวลผล">
                    {dayjs(selectedDetail.created_at).format(
                      "DD/MM/YYYY HH:mm",
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={12}>
              {/* แสดงสถานะปัจจุบันของคำขอพร้อมระบุผู้ทำรายการ */}
              <Card
                title="สถานะปัจจุบัน"
                variant="borderless"
                style={{
                  background: themeToken.colorFillQuaternary,
                  borderRadius: 16,
                }}
              >
                <Flex vertical gap={12} align="center">
                  <Tag
                    color={
                      OT_STATUS.find(
                        (item) => item.value === selectedDetail.status,
                      )?.color
                    }
                    style={{
                      fontSize: 16,
                      padding: "4px 16px",
                      borderRadius: 8,
                      margin: 0,
                    }}
                  >
                    {
                      OT_STATUS.find(
                        (item) => item.value === selectedDetail.status,
                      )?.text
                    }
                  </Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    ประมวลผลโดย:{" "}
                    {(() => {
                      const u = (getUserById(selectedDetail.created_by) ||
                        selectedDetail.creator_user) as any;
                      if (!u) return selectedDetail.created_by || "-";

                      const thName =
                        `${u.firstname || u.firstname_th || ""} ${u.lastname || u.lastname_th || ""}`.trim();
                      const enName =
                        `${u.firstname_en || ""} ${u.lastname_en || ""}`.trim();
                      const nickname = u.nickname ? `(${u.nickname})` : "";

                      const primaryName =
                        thName || enName || u.username || String(u.admin_id);
                      return nickname
                        ? `${primaryName} ${nickname}`.trim()
                        : primaryName;
                    })()}
                  </Typography.Text>
                </Flex>
              </Card>
            </Col>
          </Row>

          {/* รายการเนื้องานแต่ละรายการพร้อมจำนวนชั่วโมงปลีกย่อย */}
          <Card
            title={
              <Flex justify="space-between" align="center">
                <Space>
                  <FileTextOutlined /> รายละเอียดเนื้องาน
                </Space>
                <Tag color="error" style={{ borderRadius: 6 }}>
                  รวม {totalDurationSummaryValue} ชั่วโมง
                </Tag>
              </Flex>
            }
            variant="borderless"
            style={{
              borderRadius: 16,
              border: `1px solid ${themeToken.colorBorderSecondary}`,
            }}
          >
            <Table
              dataSource={selectedDetail.descriptions}
              pagination={false}
              size="middle"
              rowKey="id"
              columns={[
                {
                  title: "รายละเอียดภาระงานที่ได้รับมอบหมาย",
                  dataIndex: "description",
                  key: "desc",
                  sorter: (a: any, b: any) =>
                    (a.description || "").localeCompare(b.description || ""),
                  render: (text) => <Typography.Text>{text}</Typography.Text>,
                },
                {
                  title: "เวลา (ชม.)",
                  dataIndex: "duration",
                  key: "dur",
                  align: "center",
                  width: 100,
                  sorter: (a: any, b: any) =>
                    Number(a.duration || 0) - Number(b.duration || 0),
                  render: (value) => (
                    <Typography.Text
                      strong
                      style={{ color: themeToken.colorPrimary }}
                    >
                      {value}
                    </Typography.Text>
                  ),
                },
              ]}
              style={{ background: "transparent" }}
            />
          </Card>
        </Flex>
      ) : (
        <Skeleton active paragraph={{ rows: 12 }} />
      )}
    </Modal>
  );
};

const FileSearchOutlined = () => <SearchOutlined />;

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
        onClick={() => window.open("/docs/rules", "_blank")}
        style={{ fontWeight: 600 }}
      >
        ดูระเบียบการบริษัทฉบับสมบูรณ์ (Intranet)
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
  isExportOperationSuccess,
  themeToken,
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
          <Button key="retry" type="link" onClick={() => onExport()}>
            ส่งออกรายงานชุดอื่น
          </Button>,
        ]}
      />
    ) : (
      <Flex vertical gap={40} style={{ paddingBlock: 32 }}>
        <Typography.Text strong style={{ fontSize: 15, textAlign: "center" }}>
          กรุณารอการประมวลผลข้อมูลจากคลาวด์เอ็นจิ้น
        </Typography.Text>

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
                onClick={() => onExport()}
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
