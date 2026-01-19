import { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Modal } from "antd";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useAppSelector } from "@/stores/store";
import { getUserData } from "@helpers/local_storage/user.storage";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import type { SelectOption, UserProfile } from "@stores/type";
import type { TimesheetEntry } from "@/types/timesheet-table.types";
import type { OvertimeRecord, PaginationState } from "../types/overtime.types";
import { handleError, getCurrentUserId } from "../utils/overtime.helpers";

const BYPASS_ADMIN_ID = "117";

export const useOvertimeData = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const authentication = useAppSelector((state) => state.callAdminLogin);

  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<OvertimeRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<OvertimeRecord[]>([]);
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  const [descriptionOptions, setDescriptionOptions] = useState<SelectOption[]>(
    [],
  );
  const [paginationState, setPaginationState] = useState<PaginationState>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [processedItems, setProcessedItems] = useState<Set<React.Key>>(
    new Set(),
  );
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  const [batchSelectedStatus, setBatchSelectedStatus] =
    useState<string>("approved");
  const [searchText, setSearchText] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);

  const stats = useMemo(() => {
    const total = paginationState.total;
    const pending = dataSource.filter(
      (item) => item.status === "pending",
    ).length;
    const approved = dataSource.filter(
      (item) => item.status === "approved",
    ).length;

    return { total, pending, approved };
  }, [dataSource, paginationState.total]);

  const fetchUserList = useCallback(async () => {
    try {
      const users = await getUserData();
      const options = users.map((user: UserProfile) => ({
        label: `${user.firstname} ${user.lastname}`,
        value: user.admin_id,
      }));
      setUserOptions(options);
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  }, []);

  const fetchDescriptionList = useCallback(async () => {
    try {
      const payload = {
        limit: 30,
        page: 1,
        user_id: authentication?.response?.data?.user_data?.admin_id || "0",
      };

      const response = await callApiService.post(
        "/api/v1/timesheet/entry/read/",
        payload,
      );
      const result = response?.data ?? {};
      const items = result?.data ?? [];

      const options = items.map((item: TimesheetEntry) => ({
        label: item.description,
        value: item.description,
      }));

      const uniqueOptions = options.reduce(
        (acc: SelectOption[], cur: SelectOption) => {
          if (!acc.find((item) => item.value === cur.value)) {
            acc.push(cur);
          }
          return acc;
        },
        [],
      );

      setDescriptionOptions(uniqueOptions);
    } catch (error) {
      console.error("Error fetching description list:", error);
    }
  }, [authentication]);

  const fetchOvertimeList = useCallback(
    async (options?: {
      page?: number;
      pageSize?: number;
      filters?: any;
      id?: string | number;
    }) => {
      const page = options?.page ?? 1;
      const pageSize = options?.pageSize ?? paginationState.pageSize;
      const filters = options?.filters ?? {};
      const id = options?.id;

      try {
        setLoading(true);

        const currentUserId = await getCurrentUserId(authentication);
        const isBypassUser = currentUserId === BYPASS_ADMIN_ID;

        const payload = id
          ? isBypassUser
            ? { id: String(id) }
            : { id: String(id), request_id: currentUserId }
          : isBypassUser
            ? {
                limit: pageSize,
                offset: (page - 1) * pageSize,
                ...filters,
              }
            : {
                limit: pageSize,
                offset: (page - 1) * pageSize,
                request_id: currentUserId,
                ...filters,
              };

        const response = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          payload,
        );
        const body = response?.data;

        if (!body || body.status !== 200) {
          throw new Error(body?.message_th || "ไม่สามารถดึงข้อมูลโอทีได้");
        }

        const items = Array.isArray(body.data) ? body.data : [];

        if (id) {
          return items;
        }

        // กรองข้อมูลตามเดือนที่เลือก (ฝั่ง frontend)
        let filteredItems = items;
        if (selectedMonth && !id) {
          const startOfMonth = selectedMonth.startOf("month");
          const endOfMonth = selectedMonth.endOf("month");

          filteredItems = items.filter((item: any) => {
            if (!item.request_date) return false;
            const requestDate = dayjs(item.request_date);
            return (
              requestDate.isSameOrAfter(startOfMonth, "day") &&
              requestDate.isSameOrBefore(endOfMonth, "day")
            );
          });
        }

        // กรองตาม searchText
        if (searchText && !id) {
          const lowerSearchText = searchText.toLowerCase();
          filteredItems = filteredItems.filter((item: any) => {
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

        setDataSource(
          filteredItems.map((item: any) => ({ key: item.id, ...item })),
        );
        setPaginationState({
          current: body.pagination?.page ?? page,
          pageSize: body.pagination?.page_size ?? pageSize,
          total: filteredItems.length, // ใช้จำนวนที่กรองแล้ว
        });

        return items;
      } catch (error) {
        handleError(error, "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authentication, paginationState.pageSize, selectedMonth, searchText],
  );

  const createOvertime = async (payload: any) => {
    try {
      setLoading(true);
      const adminId = await getCurrentUserId(authentication);
      const bodyPayload = {
        ...payload,
        created_by: String(adminId),
        requester_id: String(adminId),
      };

      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/create",
        bodyPayload,
      );
      const body = response?.data;

      if (body && (body.status === 200 || body.status === 201)) {
        toast.success(body.message_th ?? "สร้างรายการสำเร็จ");
        return body.data;
      }
      throw new Error(body?.message_th ?? "ไม่สามารถสร้างรายการได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการสร้างรายการ");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteOvertime = async (id?: string | number) => {
    if (!id) return;
    try {
      setLoading(true);
      const deleterId = await getCurrentUserId(authentication);
      const response = await callApiService.post(
        `/api/v1/timesheet/overtime/delete?id=${id}`,
        { deleted_by: String(deleterId) },
      );
      const body = response?.data;

      if (body && body.status === 200) {
        toast.success(body.message_th ?? "ลบรายการสำเร็จ");
        await fetchOvertimeList({ page: paginationState.current });
        return body.data;
      }
      throw new Error(body?.message_th ?? "ไม่สามารถลบรายการได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการลบข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const approveOvertime = async (
    id?: string | number,
    status: string = "approved",
  ) => {
    if (!id) return;
    try {
      setLoading(true);
      const approverId = await getCurrentUserId(authentication);
      const response = await callApiService.post(
        `/api/v1/timesheet/overtime/change-status?id=${id}`,
        { status, updated_by: Number(approverId) },
      );
      const body = response?.data;

      if (body && body.status === 200) {
        toast.success(body.message_th ?? "อนุมัติเรียบร้อยแล้ว");
        await fetchOvertimeList({ page: paginationState.current });
        return body.data;
      }
      throw new Error(body?.message_th ?? "ไม่สามารถอนุมัติได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setLoading(false);
    }
  };

  const sendEmailToHR = async (id?: string | number) => {
    if (!id) return;
    try {
      setLoading(true);
      const previewLink = `${window.location.origin}/timesheet/overtime/preview/${id}`;
      const payload = {
        id: String(id),
        link: previewLink,
        to: process.env.NEXT_PUBLIC_HR_EMAIL || "manager.hr@schoolbright.co",
      };

      const response = await callApiService.post(
        "/api/v1/timesheet/overtime/send-email",
        payload,
      );
      const body = response?.data;

      if (body && (body.status === 200 || body.status === 201)) {
        toast.success(body.message_th ?? "ส่งอีเมลไปยัง HR เรียบร้อยแล้ว");
        return body.data;
      }
      throw new Error(body?.message_th ?? "ไม่สามารถส่งอีเมลได้");
    } catch (error) {
      handleError(error, "เกิดข้อผิดพลาดขณะส่งอีเมล");
    } finally {
      setLoading(false);
    }
  };

  const batchApproveOvertime = async (status: string = "approved") => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserId = await getCurrentUserId(authentication);
    if (currentUserId !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ปรับสถานะ");

    setBatchProcessing(true);
    setProcessedItems(new Set());
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedRowKeys) {
      try {
        const approverId = await getCurrentUserId(authentication);
        const response = await callApiService.post(
          `/api/v1/timesheet/overtime/change-status?id=${id}`,
          { status, updated_by: Number(approverId) },
        );
        if (response?.data?.status === 200) {
          successCount++;
          setProcessedItems((prev) => new Set([...prev, id]));
        } else failCount++;
      } catch (e) {
        failCount++;
      }
    }

    setBatchProcessing(false);
    if (successCount > 0) {
      toast.success(
        `สำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`,
      );
      await fetchOvertimeList({ page: paginationState.current });
    }
    setSelectedRowKeys([]);
    setProcessedItems(new Set());
  };

  const batchSendEmail = async () => {
    if (selectedRowKeys.length === 0) return toast.error("กรุณาเลือกรายการ");

    const currentUserId = await getCurrentUserId(authentication);
    if (currentUserId !== BYPASS_ADMIN_ID)
      return toast.error("คุณไม่มีสิทธิ์ส่งอีเมล");

    setBatchProcessing(true);
    setProcessedItems(new Set());
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedRowKeys) {
      try {
        const previewLink = `${window.location.origin}/timesheet/overtime/preview/${id}`;
        const payload = {
          id: String(id),
          link: previewLink,
          to: process.env.NEXT_PUBLIC_HR_EMAIL || "manager.hr@schoolbright.co",
        };
        const response = await callApiService.post(
          "/api/v1/timesheet/overtime/send-email",
          payload,
        );

        if (response?.data?.status === 200 || response?.data?.status === 201) {
          successCount++;
          setProcessedItems((prev) => new Set([...prev, id]));
        } else failCount++;
      } catch (e) {
        failCount++;
      }
    }

    setBatchProcessing(false);
    if (successCount > 0) toast.success(`สำเร็จ ${successCount} รายการ`);
    setSelectedRowKeys([]);
    setProcessedItems(new Set());
  };

  const handleFormSubmit = async (values: any) => {
    const formattedValues = {
      ...values,
      submittedAt: new Date().toISOString(),
    };
    const created = await createOvertime(formattedValues);
    if (created) {
      setVisible(false);
      form.resetFields();
      await fetchOvertimeList({ page: paginationState.current });
    }
  };

  const handleTableChange = (pagination: any, filters: any) => {
    const { current, pageSize } = pagination;
    const payloadFilters: any = {};

    if (filters.status && filters.status.length > 0)
      payloadFilters.status = filters.status[0];

    // ไม่ต้องส่ง date filter ไปที่ backend เพราะกรองฝั่ง frontend แล้ว

    fetchOvertimeList({
      page: current || 1,
      pageSize,
      filters: payloadFilters,
    });
  };

  const fetchOvertimeDetail = async (id: string | number) => {
    const items = await fetchOvertimeList({ id });
    if (items && items.length > 0) {
      setSelectedDetail(items[0]);
      setDetailVisible(true);
    }
  };

  useEffect(() => {
    fetchUserList();
    fetchDescriptionList();
    fetchOvertimeList();
  }, [fetchUserList, fetchDescriptionList, fetchOvertimeList]);

  return {
    form,
    router,
    loading,
    dataSource,
    userOptions,
    descriptionOptions,
    paginationState,
    selectedRowKeys,
    setSelectedRowKeys,
    batchProcessing,
    processedItems,
    setProcessedItems,
    batchStatusModalVisible,
    setBatchStatusModalVisible,
    batchSelectedStatus,
    setBatchSelectedStatus,
    searchText,
    setSearchText,
    selectedMonth,
    setSelectedMonth,
    stats,
    visible,
    setVisible,
    detailVisible,
    setDetailVisible,
    selectedDetail,
    fetchOvertimeList,
    createOvertime,
    deleteOvertime,
    approveOvertime,
    sendEmailToHR,
    batchApproveOvertime,
    batchSendEmail,
    handleFormSubmit,
    handleTableChange,
    fetchOvertimeDetail,
  };
};
