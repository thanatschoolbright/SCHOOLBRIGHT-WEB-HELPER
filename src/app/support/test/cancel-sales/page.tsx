"use client";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  RocketOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import type { SelectProps } from "antd";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Layout,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Steps,
  Typography,
} from "antd";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { CallAPI } from "@/stores/actions/call-cancel-sales";
import { CallAPI as GET_SCHOOL_LIST } from "@/stores/actions/support/call-get-school-list-detail";
import AiChatWidget, {
  type CancellationExtraction,
} from "@components/ai-chat-widget";
import DashboardLayout from "@components/layouts/backend-layout";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CancelSalesState, ResponseUserList } from "@stores/type";
import { HeaderBar } from "@/components/typhography/header-bar-component";

interface CancellationLog {
  endpoint: string;
  request: CancelSalesState["draftValues"];
  response?: unknown;
  error?: {
    message: string;
    status?: number;
    data?: unknown;
  };
  context?: {
    school?: string;
    buyer?: string;
    seller?: string;
    sSellId?: string;
  };
  timestamp: number;
}

interface ExtractedCancellationInfo extends Partial<
  Pick<
    CancellationExtraction,
    | "schoolId"
    | "schoolName"
    | "schoolNameEN"
    | "buyerName"
    | "buyerLastName"
    | "buyerUserId"
    | "buyerIdentifier"
    | "sellerName"
    | "sellerLastName"
    | "sellerUserId"
    | "sellerIdentifier"
    | "sSellId"
  >
> {}

interface DropdownOption {
  label: string;
  value: string;
}

type IconSelectProps = SelectProps<string> & { icon: ReactNode };

const initialFormValues: CancelSalesState["draftValues"] = {
  SchoolID: "",
  sID: "",
  sID2: "",
  sSellID: "",
};

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm<CancelSalesState["draftValues"]>();
  const { Title, Text, Paragraph } = Typography;
  const { Content } = Layout;

  const cancelSalesState = useAppSelector((state) => state.callCancelSales);
  const schoolListState = useAppSelector(
    (state) => state.callGetSchoolListDetail,
  );

  const [userList, setUserList] = useState<DropdownOption[]>([]);
  const [lastCancellationLog, setLastCancellationLog] =
    useState<CancellationLog | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedCancellationInfo>(
    {},
  );
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const skipUserFetchRef = useRef(false);
  const cachedUsersRef = useRef<ResponseUserList["draftValues"][]>([]);
  const schoolListCacheRef = useRef<any[] | null>(null);
  const matchedContextRef = useRef<CancellationLog["context"] | null>(null);

  const selectedSchoolId = Form.useWatch("SchoolID", form);

  const isResourceLoading = schoolListState.loading;
  const isSubmitting = cancelSalesState.loading;

  useEffect(() => {
    const draft = schoolListState?.response?.data?.data;
    const hasData = Array.isArray(draft) && draft.length > 0;

    if (!hasData && !schoolListState.loading) {
      dispatch(GET_SCHOOL_LIST());
    }
  }, [dispatch]);

  const normalizeText = (value?: string | number | null) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/โรงเรียน/g, "")
      .trim();

  const cleanSchoolLabel = (value?: string) =>
    value?.replace(/\s+/g, " ").trim() ?? "";

  const { schoolOptions, schoolRecords } = useMemo(() => {
    const list: any[] = schoolListState?.response?.data?.data ?? [];

    return {
      schoolRecords: list,
      schoolOptions: list.map((item: any) => ({
        label: `${item.company_name} (${item.school_id})`,
        value: String(item.school_id),
      })),
    };
  }, [schoolListState?.draftValues]);

  useEffect(() => {
    if (schoolRecords.length) {
      schoolListCacheRef.current = schoolRecords;
    }
  }, [schoolRecords]);

  const fetchSchoolRecords = useCallback(async () => {
    if (schoolRecords.length > 0) {
      schoolListCacheRef.current = schoolRecords;
      return schoolRecords;
    }

    if (schoolListCacheRef.current && schoolListCacheRef.current.length > 0) {
      return schoolListCacheRef.current;
    }

    const response = await axios.get("/api/v1/school/get-detail");
    const records: any[] = response.data?.data?.data ?? [];
    schoolListCacheRef.current = records;
    return records;
  }, [schoolRecords]);

  const fetchUsersForSchool = useCallback(
    async (schoolId: string | number, showToast = false) => {
      let toastId: string | number | undefined;
      setIsFetchingUsers(true);
      if (showToast) {
        toastId = toast.loading("กำลังโหลดรายชื่อผู้ใช้...");
      }

      try {
        const response = await axios.get(
          `/api/v1/school/get-user?school_id=${schoolId}`,
        );
        const rawUsers: ResponseUserList["draftValues"][] =
          response.data?.data ?? [];
        cachedUsersRef.current = rawUsers;
        setUserList(
          rawUsers.map((item) => ({
            label: `${item.Name} ${item.LastName} (ID: ${item.UserID} Username: ${item.username})`,
            value: item.UserID.toString(),
          })),
        );
        if (showToast && toastId !== undefined) {
          toast.success("โหลดรายชื่อผู้ใช้สำเร็จ", { id: toastId });
        }
        return rawUsers;
      } catch (error: any) {
        if (showToast && toastId !== undefined) {
          toast.error(error?.message ?? "โหลดรายชื่อผู้ใช้ไม่สำเร็จ", {
            id: toastId,
          });
        }
        throw error;
      } finally {
        setIsFetchingUsers(false);
      }
    },
    [],
  );

  const submitCancellationRequest = async (
    values: CancelSalesState["draftValues"],
  ) => {
    const toastId = toast.loading(
      "ขั้นตอนที่ 3/3: กำลังส่งคำขอยกเลิกรายการ...",
    );

    try {
      const response = await dispatch(
        CallAPI({
          draftValues: values,
          loading: false,
          error: "",
          success: "",
          response: undefined,
        }),
      ).unwrap();

      setLastCancellationLog({
        endpoint: "/api/v1/support/cancle-sales",
        request: { ...values },
        response,
        context: matchedContextRef.current ?? undefined,
        timestamp: Date.now(),
      });

      const responseData = response as any;
      if (
        responseData?.status &&
        typeof responseData.status === "string" &&
        responseData.status.includes("not have number id")
      ) {
        toast.warning(
          "ไม่พบข้อมูลรายการ หรือรายการเกินกำหนดเวลา (ตรวจสอบรายละเอียดด้านล่าง)",
          { id: toastId },
        );
      } else {
        toast.success("ขั้นตอนที่ 3/3: ยกเลิกรายการสำเร็จ", { id: toastId });
      }

      matchedContextRef.current = null;
      setCurrentStep(4);
      return response;
    } catch (error: any) {
      const errorResponse = error?.response;
      const fallbackData = errorResponse?.data ?? error?.data ?? null;
      const statusCode = errorResponse?.status ?? error?.status;

      setLastCancellationLog({
        endpoint: "/api/v1/support/cancle-sales",
        request: { ...values },
        error: {
          message:
            error?.message ?? "ไม่สามารถยกเลิกรายการได้ กรุณาลองใหม่อีกครั้ง",
          status: statusCode,
          data: fallbackData,
        },
        context: matchedContextRef.current ?? undefined,
        timestamp: Date.now(),
      });

      toast.error(error?.message ?? "ไม่สามารถยกเลิกรายการได้", {
        id: toastId,
      });
      matchedContextRef.current = null;
      throw error;
    }
  };

  const ensureCancellationValues = useCallback(async () => {
    const currentValues = form.getFieldsValue();
    const updatedValues: CancelSalesState["draftValues"] = {
      ...currentValues,
    };

    const info = extractedInfo;
    matchedContextRef.current = matchedContextRef.current ?? {};

    if (!updatedValues.SchoolID) {
      const stepToast = toast.loading("ขั้นตอนที่ 1/3: กำลังค้นหาโรงเรียน...");

      let records: any[];
      try {
        records = await fetchSchoolRecords();
      } catch (error) {
        toast.error("ไม่สามารถดึงรายชื่อโรงเรียนได้", { id: stepToast });
        throw new Error("ไม่สามารถดึงรายชื่อโรงเรียนได้");
      }
      const schoolMatch = (() => {
        if (info.schoolId) {
          return records.find(
            (item: any) => String(item.school_id) === String(info.schoolId),
          );
        }

        if (info.schoolName) {
          const normalizedTarget = normalizeText(info.schoolName);
          const direct = records.find(
            (item: any) =>
              normalizeText(item.company_name) === normalizedTarget,
          );
          if (direct) return direct;
        }

        if (info.schoolNameEN) {
          const normalizedTarget = normalizeText(info.schoolNameEN);
          const direct = records.find(
            (item: any) =>
              normalizeText(item.SchoolNameEN) === normalizedTarget,
          );
          if (direct) return direct;
        }

        if (info.schoolName) {
          const normalizedTarget = normalizeText(info.schoolName);
          return records.find((item: any) =>
            normalizeText(item.company_name).includes(normalizedTarget),
          );
        }

        return undefined;
      })();

      if (!schoolMatch) {
        toast.error("ไม่พบโรงเรียนจากข้อมูลที่ให้มา", { id: stepToast });
        throw new Error("ไม่พบข้อมูลโรงเรียนจากการสนทนา");
      }

      updatedValues.SchoolID = String(schoolMatch.school_id);
      skipUserFetchRef.current = true;
      form.setFieldsValue({ ...updatedValues });
      matchedContextRef.current = {
        ...(matchedContextRef.current ?? {}),
        school: `${cleanSchoolLabel(schoolMatch.SchoolName)} (${
          schoolMatch.SchoolID
        })`,
      };

      toast.success(
        `ขั้นตอนที่ 1/3: พบโรงเรียน ${cleanSchoolLabel(
          schoolMatch.company_name,
        )}`,
        { id: stepToast },
      );
    } else {
      toast.message("ขั้นตอนที่ 1/3: ใช้ข้อมูลโรงเรียนจากแบบฟอร์ม");
      if (!matchedContextRef.current?.school && updatedValues.SchoolID) {
        const formSchoolLabel = schoolOptions.find(
          (option) => String(option.value) === String(updatedValues.SchoolID),
        )?.label;
        matchedContextRef.current = {
          ...(matchedContextRef.current ?? {}),
          school: formSchoolLabel
            ? `${cleanSchoolLabel(formSchoolLabel)} (${updatedValues.SchoolID})`
            : `ไม่ทราบ (${updatedValues.SchoolID})`,
        };
      }
    }

    let users = cachedUsersRef.current;
    let usedCachedUsers = true;
    if (
      !users.length ||
      String(users[0]?.SchoolID) !== String(updatedValues.SchoolID)
    ) {
      const step2Toast = toast.loading(
        "ขั้นตอนที่ 2/3: กำลังค้นหารายชื่อผู้ใช้...",
      );
      try {
        users = await fetchUsersForSchool(updatedValues.SchoolID, false);
        toast.success("ขั้นตอนที่ 2/3: ดึงรายชื่อผู้ใช้สำเร็จ", {
          id: step2Toast,
        });
        usedCachedUsers = false;
      } catch (error) {
        toast.error("ไม่สามารถดึงรายชื่อผู้ใช้ได้", { id: step2Toast });
        throw new Error("ไม่สามารถดึงรายชื่อผู้ใช้ได้");
      }
    }

    if (!users.length) {
      throw new Error("ไม่พบข้อมูลผู้ใช้ในโรงเรียนนี้");
    }

    if (usedCachedUsers) {
      toast.message("ขั้นตอนที่ 2/3: ใช้รายชื่อผู้ใช้ที่โหลดไว้แล้ว");
    }

    const matchUser = (
      userId?: string,
      firstName?: string,
      lastName?: string,
      identifier?: string,
    ) => {
      if (userId) {
        const direct = users.find(
          (user) => String(user.UserID) === String(userId),
        );
        if (direct) return direct;
      }

      if (firstName && lastName) {
        const normalizedFirstName = normalizeText(firstName);
        const normalizedLastName = normalizeText(lastName);
        const direct = users.find(
          (user) =>
            normalizeText(user.Name) === normalizedFirstName &&
            normalizeText(user.LastName) === normalizedLastName,
        );
        if (direct) return direct;

        return users.find((user) =>
          normalizeText(`${user.Name}${user.LastName}`).includes(
            normalizedFirstName + normalizedLastName,
          ),
        );
      }

      if (identifier) {
        const normalizedIdentifier = normalizeText(identifier);
        const directBarcode = users.find(
          (user) => normalizeText(user.BarCode) === normalizedIdentifier,
        );
        if (directBarcode) return directBarcode;

        return users.find(
          (user) => normalizeText(user.username) === normalizedIdentifier,
        );
      }

      return undefined;
    };

    if (!updatedValues.sID) {
      const buyerCandidate = matchUser(
        info.buyerUserId,
        info.buyerName,
        info.buyerLastName,
        info.buyerIdentifier,
      );

      if (buyerCandidate) {
        updatedValues.sID = String(buyerCandidate.UserID);
        form.setFieldsValue({ ...updatedValues });
        toast.message(
          `ระบุผู้ซื้อ: ${buyerCandidate.Name} ${buyerCandidate.LastName}`,
        );
        matchedContextRef.current = {
          ...(matchedContextRef.current ?? {}),
          buyer: `${buyerCandidate.Name} ${buyerCandidate.LastName} (${buyerCandidate.UserID})`,
        };
      }
    } else if (!matchedContextRef.current?.buyer && updatedValues.sID) {
      const existingBuyer = users.find(
        (user) => String(user.UserID) === String(updatedValues.sID),
      );
      matchedContextRef.current = {
        ...(matchedContextRef.current ?? {}),
        buyer: existingBuyer
          ? `${existingBuyer.Name} ${existingBuyer.LastName} (${existingBuyer.UserID})`
          : `ไม่ทราบ (${updatedValues.sID})`,
      };
    }

    if (!updatedValues.sID2) {
      const sellerCandidate = matchUser(
        info.sellerUserId,
        info.sellerName,
        info.sellerLastName,
        info.sellerIdentifier,
      );

      if (sellerCandidate) {
        updatedValues.sID2 = String(sellerCandidate.UserID);
        form.setFieldsValue({ ...updatedValues });
        toast.message(
          `ระบุผู้ขาย: ${sellerCandidate.Name} ${sellerCandidate.LastName}`,
        );
        matchedContextRef.current = {
          ...(matchedContextRef.current ?? {}),
          seller: `${sellerCandidate.Name} ${sellerCandidate.LastName} (${sellerCandidate.UserID})`,
        };
      }
    } else if (!matchedContextRef.current?.seller && updatedValues.sID2) {
      const existingSeller = users.find(
        (user) => String(user.UserID) === String(updatedValues.sID2),
      );
      matchedContextRef.current = {
        ...(matchedContextRef.current ?? {}),
        seller: existingSeller
          ? `${existingSeller.Name} ${existingSeller.LastName} (${existingSeller.UserID})`
          : `ไม่ทราบ (${updatedValues.sID2})`,
      };
    }

    if (!updatedValues.sID || !updatedValues.sID2) {
      throw new Error(
        "ไม่พบข้อมูลผู้ซื้อหรือผู้ขายจากการสนทนา กรุณาเลือกจากแบบฟอร์ม",
      );
    }

    if (!updatedValues.sSellID && info.sSellId) {
      updatedValues.sSellID = info.sSellId;
      form.setFieldsValue({ ...updatedValues });
      matchedContextRef.current = {
        ...(matchedContextRef.current ?? {}),
        sSellId: info.sSellId,
      };
    }

    if (!updatedValues.sSellID) {
      throw new Error("กรุณาระบุรหัสธุรกรรม (sSellID) ให้ครบถ้วน");
    } else if (!matchedContextRef.current?.sSellId) {
      matchedContextRef.current = {
        ...(matchedContextRef.current ?? {}),
        sSellId: updatedValues.sSellID,
      };
    }

    return updatedValues;
  }, [
    extractedInfo,
    fetchSchoolRecords,
    fetchUsersForSchool,
    form,
    normalizeText,
    cleanSchoolLabel,
    schoolOptions,
  ]);

  const handleCancellationInfo = useCallback(
    (info: Partial<CancellationExtraction>) => {
      if (!info) return;

      setExtractedInfo((previous) => {
        const next = { ...previous };
        Object.entries(info).forEach(([key, rawValue]) => {
          if (rawValue === undefined || rawValue === null) return;
          const value = String(rawValue).trim();
          if (!value || /ไม่มี|not\s*required/i.test(value) || value === "-")
            return;
          (next as any)[key] = value;
        });
        return next;
      });

      if (info.sSellId && !form.getFieldValue("sSellID")) {
        form.setFieldsValue({
          ...form.getFieldsValue(),
          sSellID: info.sSellId,
        });
      }

      matchedContextRef.current = {
        ...(matchedContextRef.current ?? {}),
        school:
          matchedContextRef.current?.school ||
          (info.schoolId || info.schoolName || info.schoolNameEN
            ? `${info.schoolName || info.schoolNameEN || "ไม่ทราบ"} (${
                info.schoolId || "ไม่ทราบ"
              })`
            : undefined),
        buyer:
          matchedContextRef.current?.buyer ||
          (info.buyerName || info.buyerLastName || info.buyerUserId
            ? `${
                [info.buyerName, info.buyerLastName]
                  .filter(Boolean)
                  .join(" ") || "ไม่ทราบ"
              } (${info.buyerUserId || info.buyerIdentifier || "ไม่ทราบ"})`
            : undefined),
        seller:
          matchedContextRef.current?.seller ||
          (info.sellerName || info.sellerLastName || info.sellerUserId
            ? `${
                [info.sellerName, info.sellerLastName]
                  .filter(Boolean)
                  .join(" ") || "ไม่ทราบ"
              } (${info.sellerUserId || info.sellerIdentifier || "ไม่ทราบ"})`
            : undefined),
        sSellId:
          matchedContextRef.current?.sSellId || info.sSellId || undefined,
      };
    },
    [form],
  );

  useEffect(() => {
    form.setFieldsValue(initialFormValues);
  }, [form]);

  useEffect(() => {
    if (!selectedSchoolId) {
      setUserList([]);
      cachedUsersRef.current = [];
      setIsFetchingUsers(false);
      return;
    }

    if (skipUserFetchRef.current) {
      skipUserFetchRef.current = false;
      return;
    }

    void fetchUsersForSchool(selectedSchoolId, true).catch(() => {
      setUserList([]);
      cachedUsersRef.current = [];
    });
  }, [fetchUsersForSchool, selectedSchoolId]);

  const handleSubmitForm = async (values: CancelSalesState["draftValues"]) => {
    await submitCancellationRequest(values);
  };

  const handleChatConfirmCancellation = async () => {
    try {
      const preparedValues = await ensureCancellationValues();
      await submitCancellationRequest(preparedValues);
    } catch (error: any) {
      if (
        error instanceof Error &&
        !(error && typeof error === "object" && "response" in error)
      ) {
        setLastCancellationLog({
          endpoint: "/api/v1/support/cancle-sales",
          request: { ...form.getFieldsValue() },
          error: {
            message: error.message,
            data: {
              note: "กระบวนการหยุดก่อนเรียก API ยกเลิก กรุณาตรวจสอบข้อมูลที่กรอก",
            },
          },
          timestamp: Date.now(),
        });
      }
      throw error;
    }
  };

  const handleResetForm = () => {
    form.setFieldsValue(initialFormValues);
    setUserList([]);
    cachedUsersRef.current = [];
    setExtractedInfo({});
    setCurrentStep(0);
    toast.success("ล้างข้อมูลฟอร์มแล้ว");
  };

  const handleCopyResponse = async (content: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(successText);
    } catch {
      toast.error("คัดลอกข้อมูลไม่สำเร็จ");
    }
  };

  const responsePayload =
    (cancelSalesState?.response?.data as {
      data?: any;
      curl?: string;
    }) ?? {};

  const getFormProgress = () => {
    const values = form.getFieldsValue();
    let filled = 0;
    if (values.SchoolID) filled++;
    if (values.sID) filled++;
    if (values.sID2) filled++;
    if (values.sSellID) filled++;
    return (filled / 4) * 100;
  };

  const getResponseAlert = (data: any) => {
    if (!data) return null;

    const statusString = String(data.status || "");

    if (
      statusString.includes("not have number id") ||
      statusString.includes("exceed 30 days")
    ) {
      return (
        <Alert
          message="ไม่สามารถยกเลิกรายการได้"
          description={
            <>
              ระบบแจ้งว่า: <Text strong>{statusString}</Text> <br />
              สาเหตุที่เป็นไปได้: <br />
              1. บัตรนี้เป็นบัตรชั่วคราว (Temp Card) ที่ไม่มีข้อมูลในระบบ <br />
              2. รายการนี้เกิดขึ้นเกิน 30 วันแล้ว (ข้อมูลถูกย้ายออกจาก Active
              Table) <br />
              3. รหัส sSellID ไม่ถูกต้อง
            </>
          }
          type="warning"
          showIcon
          icon={<CloseCircleOutlined />}
        />
      );
    }

    return (
      <Alert
        message="ยกเลิกรายการสำเร็จ"
        description="ระบบได้ดำเนินการยกเลิกรายการเรียบร้อยแล้ว"
        type="success"
        showIcon
      />
    );
  };

  return (
    <DashboardLayout>
      <Content>
        <Flex vertical gap="large">
          <AiChatWidget
            title="ระบบผู้ช่วย AI อัจฉริยะ (AI Sales Assistant)"
            placeholder="พิมพ์เพื่อยกเลิกรายการ เช่น 'ยกเลิกรายการขายที่หน้าร้าน...'"
            cancellationLog={lastCancellationLog as any}
            onCancellationInfo={handleCancellationInfo}
            onConfirmCancellation={handleChatConfirmCancellation}
          />

          <Row justify="center">
            <Col span={24} xl={20}>
              <Flex vertical gap="large">
                <Flex vertical gap="small">
                  <HeaderBar
                    icon={<FileTextOutlined />}
                    title={"ระบบจัดการรายการขายพิเศษ"}
                    subTitle={
                      "เครื่องมือช่วยเหลือสำหรับการยกเลิกรายการขายที่เกินกำหนด 7 วัน พร้อมระบบวิเคราะห์ข้อมูลอัตโนมัติ"
                    }
                  />
                </Flex>

                <Row gutter={[32, 32]}>
                  <Col xs={24} lg={16}>
                    <Flex vertical gap="large">
                      <Card>
                        <Title level={5}>
                          <FileTextOutlined /> รายละเอียดการขอทำรายการ
                          (Cancellation Details)
                        </Title>

                        <Skeleton
                          active
                          loading={isResourceLoading}
                          paragraph={{ rows: 10 }}
                        >
                          <Form
                            form={form}
                            layout="vertical"
                            initialValues={initialFormValues}
                            onFinish={handleSubmitForm}
                            onValuesChange={() => {
                              const values = form.getFieldsValue();
                              let step = 0;
                              if (values.SchoolID) step = 1;
                              if (values.sID && values.sID2) step = 2;
                              if (values.sSellID) step = 3;
                              setCurrentStep(step);
                            }}
                          >
                            <Row gutter={[24, 24]}>
                              <Col span={24}>
                                <Form.Item
                                  name="SchoolID"
                                  label={
                                    <Space>
                                      <HomeOutlined />
                                      <Text strong>
                                        สถานศึกษาที่ต้องการดำเนินการ
                                      </Text>
                                    </Space>
                                  }
                                  rules={[
                                    {
                                      required: true,
                                      message: "กรุณาระบุโรงเรียน",
                                    },
                                  ]}
                                >
                                  <Select
                                    showSearch
                                    placeholder="ค้นหาโรงเรียนโดยชื่อหรือรหัส..."
                                    size="large"
                                    options={schoolOptions}
                                    optionFilterProp="label"
                                  />
                                </Form.Item>
                              </Col>

                              <Col xs={24} md={12}>
                                <Form.Item
                                  name="sID"
                                  label={
                                    <Space>
                                      <UserOutlined />
                                      <Text strong>
                                        ผู้ซื้อสินค้า (User ID)
                                      </Text>
                                    </Space>
                                  }
                                  rules={[
                                    { required: true, message: "ระบุผู้ซื้อ" },
                                  ]}
                                >
                                  <Select
                                    showSearch
                                    placeholder="ระบุรหัสผู้ซื้อ"
                                    size="large"
                                    options={userList}
                                    disabled={!selectedSchoolId}
                                    loading={isFetchingUsers}
                                  />
                                </Form.Item>
                              </Col>

                              <Col xs={24} md={12}>
                                <Form.Item
                                  name="sID2"
                                  label={
                                    <Space>
                                      <TeamOutlined />
                                      <Text strong>
                                        ผู้ขาย/ร้านค้า (User ID)
                                      </Text>
                                    </Space>
                                  }
                                  rules={[
                                    { required: true, message: "ระบุผู้ขาย" },
                                  ]}
                                >
                                  <Select
                                    showSearch
                                    placeholder="ระบุรหัสผู้ขาย"
                                    size="large"
                                    options={userList}
                                    disabled={!selectedSchoolId}
                                    loading={isFetchingUsers}
                                  />
                                </Form.Item>
                              </Col>

                              <Col span={24}>
                                <Form.Item
                                  name="sSellID"
                                  label={
                                    <Space>
                                      <CreditCardOutlined />
                                      <Text strong>
                                        รหัสหมายเลขรายการ (Transaction /
                                        sSellID)
                                      </Text>
                                    </Space>
                                  }
                                  rules={[
                                    {
                                      required: true,
                                      message: "กรุณาระบุเลขที่รายการ",
                                    },
                                  ]}
                                >
                                  <Input
                                    placeholder="ตัวอย่าง: 12345678"
                                    size="large"
                                  />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Divider />

                            <Flex gap="middle">
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={isSubmitting}
                                size="large"
                                icon={<ThunderboltOutlined />}
                                block
                              >
                                เริ่มดำเนินการยกเลิกตอนนี้
                              </Button>
                              <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={handleResetForm}
                              />
                            </Flex>
                          </Form>
                        </Skeleton>
                      </Card>

                      {responsePayload.data && (
                        <Card
                          title={
                            <Space>
                              <CheckCircleOutlined />
                              <Title level={5}>
                                ผลลัพธ์การร้องขอ (Operation Result)
                              </Title>
                            </Space>
                          }
                        >
                          <Flex vertical gap="large">
                            {getResponseAlert(responsePayload.data)}

                            <Flex vertical gap="small">
                              <Paragraph code>
                                <pre>
                                  {JSON.stringify(
                                    responsePayload.data,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </Paragraph>
                              <Flex gap="small">
                                <Button
                                  icon={<CopyOutlined />}
                                  onClick={() =>
                                    handleCopyResponse(
                                      JSON.stringify(
                                        responsePayload.data,
                                        null,
                                        2,
                                      ),
                                      "คัดลอก JSON แล้ว",
                                    )
                                  }
                                >
                                  คัดลอกข้อมูล JSON
                                </Button>
                                <Button
                                  icon={<CodeOutlined />}
                                  disabled={!responsePayload.curl}
                                  onClick={() =>
                                    responsePayload.curl &&
                                    handleCopyResponse(
                                      responsePayload.curl.toString(),
                                      "คัดลอก cURL แล้ว",
                                    )
                                  }
                                >
                                  คัดลอก cURL
                                </Button>
                              </Flex>
                            </Flex>
                          </Flex>
                        </Card>
                      )}
                    </Flex>
                  </Col>

                  <Col xs={24} lg={8}>
                    <Flex vertical gap="large">
                      <Card>
                        <Title level={5}>
                          <RocketOutlined /> ความคืบหน้า (Progress)
                        </Title>
                        <Flex vertical gap="large">
                          <Steps
                            direction="vertical"
                            current={currentStep}
                            items={[
                              {
                                title: "ยืนยันสถานศึกษา",
                                icon: <HomeOutlined />,
                              },
                              {
                                title: "ระบุคู่ค้า (Buyer/Seller)",
                                icon: <TeamOutlined />,
                              },
                              {
                                title: "เลขที่รายการ (Transaction)",
                                icon: <CreditCardOutlined />,
                              },
                              {
                                title: "ดำเนินการสำเร็จ",
                                icon: <CheckCircleOutlined />,
                              },
                            ]}
                          />
                          <Flex vertical align="center">
                            <Progress
                              percent={Math.round(getFormProgress())}
                              status="active"
                            />
                            <Text type="secondary">
                              ความสมบูรณ์ของชุดข้อมูล:{" "}
                              {Math.round(getFormProgress())}%
                            </Text>
                          </Flex>
                        </Flex>
                      </Card>

                      <Card>
                        <Title level={5}>
                          <InfoCircleOutlined /> ศูนย์ช่วยเหลือ (Help Center)
                        </Title>
                        <Paragraph>
                          หากคุณไม่แน่ใจเกี่ยวกับขั้นตอนการใช้งาน
                          โปรดอ่านคู่มือหรือรับชมวิดีโอแนะนำสั้นๆ
                        </Paragraph>
                        <Link
                          href="https://drive.google.com/file/d/11JeMTt22jWK12BjsW07fFYteuZgDGjAe/view?usp=sharing"
                          target="_blank"
                        >
                          <Button type="link" block>
                            วิดีโอสอนการใช้งาน (2 นาที)
                          </Button>
                        </Link>
                        <Divider />
                        <Text type="secondary">
                          หมายเหตุ: รายการที่แสดงด้วยสีเหลืองในผลลัพธ์
                          อาจหมายถึงรายการไม่ถูกพบในระบบจริง
                        </Text>
                      </Card>
                    </Flex>
                  </Col>
                </Row>
              </Flex>
            </Col>
          </Row>
        </Flex>
      </Content>
    </DashboardLayout>
  );
}
