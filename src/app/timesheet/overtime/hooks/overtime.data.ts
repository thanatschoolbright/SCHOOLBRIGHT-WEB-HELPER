import { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Modal } from "antd";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { toast } from "sonner";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(buddhistEra);
import { useAppSelector } from "@/stores/store";
import { getUserData } from "@helpers/local_storage/user.storage";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import type { SelectOption, UserProfile } from "@stores/type";
import type { TimesheetEntry } from "@/types/timesheet-table.types";
import type { OvertimeRecord, PaginationState } from "../types/overtime.types";
import { handleError, getCurrentUserId } from "../utils/overtime.helpers";

const BYPASS_ADMIN_ID = "117";

export const useOvertimeData = () => {
  const [overtimeForm] = Form.useForm();
  const navigationRouter = useRouter();
  const authenticationState = useAppSelector((state) => state.callAdminLogin);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedOvertimeDetail, setSelectedOvertimeDetail] =
    useState<OvertimeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  const [exportStep, setExportStep] = useState(0); // 0: Idle, 1: Preparing, 2: Processing, 3: Success
  const [isExportSuccess, setIsExportSuccess] = useState(false);
  const [filterSearchText, setFilterSearchText] = useState("");
  const [filterSelectedMonth, setFilterSelectedMonth] =
    useState<dayjs.Dayjs | null>(null);

  const overtimeStatistics = useMemo(() => {
    const totalCount = paginationState.total;
    const pendingCount = overtimeDataSource.filter(
      (item) => item.status === "pending",
    ).length;
    const approvedCount = overtimeDataSource.filter(
      (item) => item.status === "approved",
    ).length;

    return {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
    };
  }, [overtimeDataSource, paginationState.total]);

  const fetchUserList = useCallback(async () => {
    try {
      const userList = await getUserData();
      const selectionOptions = userList.map((user: UserProfile) => {
        const nickname = user.nickname ? `(${user.nickname})` : "";
        const employeeCode = user.employee_code
          ? `(${user.employee_code})`
          : "";
        return {
          label:
            `${user.firstname} ${user.lastname} ${nickname} ${employeeCode}`.trim(),
          value: user.admin_id,
        };
      });
      setUserSelectionOptions(selectionOptions);
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  }, []);

  const fetchDescriptionList = useCallback(async () => {
    try {
      const requestPayload = {
        limit: 30,
        page: 1,
        user_id:
          authenticationState?.response?.data?.user_data?.admin_id || "0",
      };

      const apiResponse = await callApiService.post(
        "/api/v1/timesheet/entry/read/",
        requestPayload,
      );
      const responseBody = apiResponse?.data ?? {};
      const entryItems = responseBody?.data ?? [];

      const descriptionOptions = entryItems.map((item: TimesheetEntry) => ({
        label: item.description,
        value: item.description,
      }));

      const uniqueDescriptionOptions = descriptionOptions.reduce(
        (accumulatedOptions: SelectOption[], currentOption: SelectOption) => {
          if (
            !accumulatedOptions.find(
              (item) => item.value === currentOption.value,
            )
          ) {
            accumulatedOptions.push(currentOption);
          }
          return accumulatedOptions;
        },
        [],
      );

      setDescriptionSelectionOptions(uniqueDescriptionOptions);
    } catch (error) {
      console.error("Error fetching description list:", error);
    }
  }, [authenticationState]);

  const fetchOvertimeList = useCallback(
    async (requestOptions?: {
      page?: number;
      pageSize?: number;
      filters?: any;
      overtimeId?: string | number;
    }) => {
      const currentPage = requestOptions?.page ?? 1;
      const currentPageSize =
        requestOptions?.pageSize ?? paginationState.pageSize;
      const requestFilters = requestOptions?.filters ?? {};
      const overtimeId = requestOptions?.overtimeId;

      try {
        setIsLoading(true);

        const currentUserId = await getCurrentUserId(authenticationState);
        const isBypassUser = currentUserId === BYPASS_ADMIN_ID;

        const apiRequestPayload = overtimeId
          ? isBypassUser
            ? { id: String(overtimeId) }
            : { id: String(overtimeId), request_id: currentUserId }
          : isBypassUser
            ? {
                limit: currentPageSize,
                offset: (currentPage - 1) * currentPageSize,
                ...requestFilters,
              }
            : {
                limit: currentPageSize,
                offset: (currentPage - 1) * currentPageSize,
                request_id: currentUserId,
                ...requestFilters,
              };

        const apiResponse = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          apiRequestPayload,
        );
        const apiResponseBody = apiResponse?.data;

        if (!apiResponseBody || apiResponseBody.status !== 200) {
          throw new Error(
            apiResponseBody?.message_th || "ไม่สามารถดึงข้อมูลโอทีได้",
          );
        }

        const overtimeItems = Array.isArray(apiResponseBody.data)
          ? apiResponseBody.data
          : [];

        if (overtimeId) {
          return overtimeItems;
        }

        // กรองข้อมูลตามเดือนที่เลือก (ฝั่ง frontend)
        let filteredOvertimeItems = overtimeItems;
        if (filterSelectedMonth && !overtimeId) {
          const startOfMonth = filterSelectedMonth.startOf("month");
          const endOfMonth = filterSelectedMonth.endOf("month");

          filteredOvertimeItems = overtimeItems.filter((item: any) => {
            if (!item.request_date) return false;
            const requestDate = dayjs(item.request_date);
            return (
              requestDate.isSameOrAfter(startOfMonth, "day") &&
              requestDate.isSameOrBefore(endOfMonth, "day")
            );
          });
        }

        // กรองตาม searchText
        if (filterSearchText && !overtimeId) {
          const lowerSearchText = filterSearchText.toLowerCase();
          filteredOvertimeItems = filteredOvertimeItems.filter((item: any) => {
            const searchableFields = [
              item.id?.toString(),
              item.requester_id?.toString(),
              item.status,
              item.descriptions?.map((d: any) => d.description).join(" "),
            ].filter(Boolean);

            return searchableFields.some((field) =>
              field?.toLowerCase().includes(lowerSearchText),
            );
          });
        }

        setOvertimeDataSource(
          filteredOvertimeItems.map((item: any) => ({ key: item.id, ...item })),
        );
        setPaginationState({
          current: apiResponseBody.pagination?.page ?? currentPage,
          pageSize: apiResponseBody.pagination?.page_size ?? currentPageSize,
          total: filteredOvertimeItems.length, // ใช้จำนวนที่กรองแล้ว
        });

        return overtimeItems;
      } catch (error) {
        handleError(error, "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      authenticationState,
      paginationState.pageSize,
      filterSelectedMonth,
      filterSearchText,
    ],
  );

  const createOvertime = async (requestPayload: any) => {
    try {
      setIsLoading(true);
      const currentAdminId = await getCurrentUserId(authenticationState);
      const bodyPayload = {
        ...requestPayload,
        created_by: String(currentAdminId),
        requester_id: String(currentAdminId),
      };

      const apiResponse = await callApiService.post(
        "/api/v1/timesheet/overtime/create",
        bodyPayload,
      );
      const apiResponseBody = apiResponse?.data;

      if (
        apiResponseBody &&
        (apiResponseBody.status === 200 || apiResponseBody.status === 201)
      ) {
        toast.success(apiResponseBody.message_th ?? "สร้างรายการสำเร็จ");
        return apiResponseBody.data;
      }
      throw new Error(apiResponseBody?.message_th ?? "ไม่สามารถสร้างรายการได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการสร้างรายการ");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOvertime = async (overtimeRecordId?: string | number) => {
    if (!overtimeRecordId) return;
    try {
      setIsLoading(true);
      const deleterId = await getCurrentUserId(authenticationState);
      const apiResponse = await callApiService.post(
        `/api/v1/timesheet/overtime/delete?id=${overtimeRecordId}`,
        { deleted_by: String(deleterId) },
      );
      const apiResponseBody = apiResponse?.data;

      if (apiResponseBody && apiResponseBody.status === 200) {
        toast.success(apiResponseBody.message_th ?? "ลบรายการสำเร็จ");
        await fetchOvertimeList({ page: paginationState.current });
        return apiResponseBody.data;
      }
      throw new Error(apiResponseBody?.message_th ?? "ไม่สามารถลบรายการได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  const approveOvertime = async (
    overtimeRecordId?: string | number,
    selectedStatus: string = "approved",
  ) => {
    if (!overtimeRecordId) return;
    try {
      setIsLoading(true);
      const approverId = await getCurrentUserId(authenticationState);
      const apiResponse = await callApiService.post(
        `/api/v1/timesheet/overtime/change-status?id=${overtimeRecordId}`,
        { status: selectedStatus, updated_by: Number(approverId) },
      );
      const apiResponseBody = apiResponse?.data;

      if (apiResponseBody && apiResponseBody.status === 200) {
        toast.success(apiResponseBody.message_th ?? "อนุมัติเรียบร้อยแล้ว");
        await fetchOvertimeList({ page: paginationState.current });
        return apiResponseBody.data;
      }
      throw new Error(apiResponseBody?.message_th ?? "ไม่สามารถอนุมัติได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailToHR = async (overtimeRecordId?: string | number) => {
    if (!overtimeRecordId) return;
    try {
      setIsLoading(true);
      const previewLink = `${window.location.origin}/timesheet/overtime/preview/${overtimeRecordId}`;
      const apiRequestPayload = {
        id: String(overtimeRecordId),
        link: previewLink,
        to: process.env.NEXT_PUBLIC_HR_EMAIL || "manager.hr@schoolbright.co",
      };

      const apiResponse = await callApiService.post(
        "/api/v1/timesheet/overtime/send-email",
        apiRequestPayload,
      );
      const apiResponseBody = apiResponse?.data;

      if (
        apiResponseBody &&
        (apiResponseBody.status === 200 || apiResponseBody.status === 201)
      ) {
        toast.success(
          apiResponseBody.message_th ?? "ส่งอีเมลไปยัง HR เรียบร้อยแล้ว",
        );
        return apiResponseBody.data;
      }
      throw new Error(apiResponseBody?.message_th ?? "ไม่สามารถส่งอีเมลได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดขณะส่งอีเมล");
    } finally {
      setIsLoading(false);
    }
  };

  const batchApproveOvertime = async (selectedStatus: string = "approved") => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserId = await getCurrentUserId(authenticationState);
    if (currentUserId !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ปรับสถานะ");

    setIsBatchProcessing(true);
    setProcessedRecordItems(new Set());
    let successCount = 0;
    let failCount = 0;

    for (const overtimeRecordId of selectedRowKeys) {
      try {
        const approverId = await getCurrentUserId(authenticationState);
        const apiResponse = await callApiService.post(
          `/api/v1/timesheet/overtime/change-status?id=${overtimeRecordId}`,
          { status: selectedStatus, updated_by: Number(approverId) },
        );
        if (apiResponse?.data?.status === 200) {
          successCount++;
          setProcessedRecordItems(
            (prev) => new Set([...prev, overtimeRecordId]),
          );
        } else failCount++;
      } catch (error) {
        failCount++;
      }
    }

    setIsBatchProcessing(false);
    if (successCount > 0) {
      toast.success(
        `สำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`,
      );
      await fetchOvertimeList({ page: paginationState.current });
    }
    setSelectedRowKeys([]);
    setProcessedRecordItems(new Set());
  };

  const batchSendEmail = async () => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserId = await getCurrentUserId(authenticationState);
    if (currentUserId !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ส่งอีเมล");

    setIsBatchProcessing(true);
    setProcessedRecordItems(new Set());
    let successCount = 0;
    let failCount = 0;

    for (const overtimeRecordId of selectedRowKeys) {
      try {
        const previewLink = `${window.location.origin}/timesheet/overtime/preview/${overtimeRecordId}`;
        const apiRequestPayload = {
          id: String(overtimeRecordId),
          link: previewLink,
          to: process.env.NEXT_PUBLIC_HR_EMAIL || "manager.hr@schoolbright.co",
        };
        const apiResponse = await callApiService.post(
          "/api/v1/timesheet/overtime/send-email",
          apiRequestPayload,
        );

        if (
          apiResponse?.data?.status === 200 ||
          apiResponse?.data?.status === 201
        ) {
          successCount++;
          setProcessedRecordItems(
            (prev) => new Set([...prev, overtimeRecordId]),
          );
        } else failCount++;
      } catch (error) {
        failCount++;
      }
    }

    setIsBatchProcessing(false);
    if (successCount > 0) toast.success(`สำเร็จ ${successCount} รายการ`);
    setSelectedRowKeys([]);
    setProcessedRecordItems(new Set());
  };

  const exportOvertime = async (selectedDate?: dayjs.Dayjs) => {
    try {
      setIsLoading(true);
      setExportStep(1); // ขั้นตอนที่ 1: เตรียมข้อมูล
      setIsExportSuccess(false);

      const currentUserId = await getCurrentUserId(authenticationState);
      const isBypassUser = currentUserId === BYPASS_ADMIN_ID;

      const payload: any = {
        requester_id: isBypassUser ? undefined : currentUserId,
      };

      const dateToUse = selectedDate ?? filterSelectedMonth ?? dayjs();
      payload.from = dateToUse.startOf("month").format("YYYY-MM-DD");
      payload.to = dateToUse.endOf("month").format("YYYY-MM-DD");

      // จำลองสถานะเพื่อให้เห็น UI Tracking
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setExportStep(2); // ขั้นตอนที่ 2: ร้องขอไปยังเซิร์ฟเวอร์

      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/export",
        payload,
        { responseType: "blob" },
      );

      setExportStep(3); // ขั้นตอนที่ 3: กำลังประมวลผลไฟล์
      await new Promise((resolve) => setTimeout(resolve, 800));

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = `รายงานการทำงานล่วงเวลา ประจำเดือน ${dateToUse.locale("th").format("MMMM")} ปี ${dateToUse.locale("th").format("BBBB")}.xlsx`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setExportStep(4); // เสร็จสิ้น
      setIsExportSuccess(true);
      toast.success("ส่งออกข้อมูลสำเร็จ");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการส่งออกข้อมูล");
      setExportStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formValues: any) => {
    const formattedValues = {
      ...formValues,
      submittedAt: new Date().toISOString(),
    };
    const createdRecord = await createOvertime(formattedValues);
    if (createdRecord) {
      setIsCreateModalVisible(false);
      overtimeForm.resetFields();
      await fetchOvertimeList({ page: paginationState.current });
    }
  };

  const handleTableChange = (pagination: any, filters: any) => {
    const { current, pageSize } = pagination;
    const payloadFilters: any = {};

    if (filters.status && filters.status.length > 0)
      payloadFilters.status = filters.status[0];

    fetchOvertimeList({
      page: current || 1,
      pageSize,
      filters: payloadFilters,
    });
  };

  const fetchOvertimeDetail = async (overtimeRecordId: string | number) => {
    const items = await fetchOvertimeList({ overtimeId: overtimeRecordId });
    if (items && items.length > 0) {
      setSelectedOvertimeDetail(items[0]);
      setIsDetailModalVisible(true);
    }
  };

  useEffect(() => {
    fetchUserList();
    fetchDescriptionList();
    fetchOvertimeList();
  }, [fetchUserList, fetchDescriptionList, fetchOvertimeList]);

  return {
    form: overtimeForm,
    router: navigationRouter,
    loading: isLoading,
    dataSource: overtimeDataSource,
    userOptions: userSelectionOptions,
    descriptionOptions: descriptionSelectionOptions,
    paginationState,
    selectedRowKeys,
    setSelectedRowKeys,
    batchProcessing: isBatchProcessing,
    processedItems: processedRecordItems,
    setProcessedItems: setProcessedRecordItems,
    batchStatusModalVisible: isBatchStatusModalVisible,
    setBatchStatusModalVisible: setIsBatchStatusModalVisible,
    batchSelectedStatus: selectedBatchStatus,
    setBatchSelectedStatus: setSelectedBatchStatus,
    searchText: filterSearchText,
    setSearchText: setFilterSearchText,
    selectedMonth: filterSelectedMonth,
    setSelectedMonth: setFilterSelectedMonth,
    stats: overtimeStatistics,
    visible: isCreateModalVisible,
    setVisible: setIsCreateModalVisible,
    detailVisible: isDetailModalVisible,
    setDetailVisible: setIsDetailModalVisible,
    exportVisible: isExportModalVisible,
    setExportVisible: setIsExportModalVisible,
    exportStep,
    isExportSuccess,
    setIsExportSuccess,
    selectedDetail: selectedOvertimeDetail,
    fetchOvertimeList,
    createOvertime,
    deleteOvertime,
    approveOvertime,
    sendEmailToHR,
    batchApproveOvertime,
    batchSendEmail,
    exportOvertime,
    handleFormSubmit,
    handleTableChange,
    fetchOvertimeDetail,
  };
};
