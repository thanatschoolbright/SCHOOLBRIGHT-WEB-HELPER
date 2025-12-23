"use client";
import type { SelectProps } from "antd";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Typography,
  theme,
  Alert,
  Steps,
  Badge,
  Divider,
  Tooltip,
  Progress,
} from "antd";
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  QuestionCircleOutlined, // Added for tooltips
  InfoCircleOutlined, // Added for tooltips
} from "@ant-design/icons";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { motion } from "framer-motion";

import AiChatWidget, {
  type CancellationExtraction,
} from "@components/ai-chat-widget";
import DashboardLayout from "@components/layouts/backend-layout";
import { CallAPI } from "@/stores/actions/call-cancel-sales";
import { CallAPI as GET_SCHOOL_LIST } from "@/stores/actions/call-school-list";
import { AppDispatch, useAppSelector } from "@stores/store";
import {
  CancelSalesState,
  ResponseSchoolList,
  ResponseUserList,
} from "@stores/type";

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

interface ExtractedCancellationInfo
  extends Partial<
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
  const { token } = theme.useToken();

  const cancelSalesState = useAppSelector((state) => state.callCancelSales);
  const schoolListState = useAppSelector((state) => state.callSchoolList);

  const [userList, setUserList] = useState<DropdownOption[]>([]);
  const [lastCancellationLog, setLastCancellationLog] =
    useState<CancellationLog | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedCancellationInfo>(
    {}
  );
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const skipUserFetchRef = useRef(false);
  const cachedUsersRef = useRef<ResponseUserList["draftValues"][]>([]);
  const schoolListCacheRef = useRef<ResponseSchoolList["draftValues"] | null>(
    null
  );
  const matchedContextRef = useRef<CancellationLog["context"] | null>(null);

  const selectedSchoolId = Form.useWatch("SchoolID", form);

  const isResourceLoading = schoolListState.loading;
  const isSubmitting = cancelSalesState.loading;

  useEffect(() => {
    dispatch(GET_SCHOOL_LIST());
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
    const draft = schoolListState?.draftValues;
    const list: ResponseSchoolList["draftValues"] = Array.isArray(draft?.data)
      ? (draft?.data as ResponseSchoolList["draftValues"])
      : Array.isArray(draft)
      ? (draft as ResponseSchoolList["draftValues"])
      : [];

    return {
      schoolRecords: list,
      schoolOptions: list.map(
        (item: ResponseSchoolList["draftValues"][number]) => ({
          label: `${item.SchoolName} (${item.SchoolID})`,
          value: item.SchoolID,
        })
      ),
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

    const response = await axios.get("/api/v1/school");
    const records: ResponseSchoolList["draftValues"] =
      response.data?.data ?? [];
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
          `/api/v1/school/get-user?school_id=${schoolId}`
        );
        const rawUsers: ResponseUserList["draftValues"][] =
          response.data?.data ?? [];
        cachedUsersRef.current = rawUsers;
        setUserList(
          rawUsers.map((item) => ({
            label: `${item.Name} ${item.LastName} (ID: ${item.UserID} Username: ${item.username})`,
            value: item.UserID.toString(),
          }))
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
    []
  );

  const submitCancellationRequest = async (
    values: CancelSalesState["draftValues"]
  ) => {
    const toastId = toast.loading(
      "ขั้นตอนที่ 3/3: กำลังส่งคำขอยกเลิกรายการ..."
    );

    try {
      const response = await dispatch(
        CallAPI({
          draftValues: values,
          loading: false,
          error: "",
          success: "",
          response: undefined,
        })
      ).unwrap();

      setLastCancellationLog({
        endpoint: "/api/v1/support/cancle-sales",
        request: { ...values },
        response,
        context: matchedContextRef.current ?? undefined,
        timestamp: Date.now(),
      });

      // Check specific response status for success but with error message
      const responseData = response as any;
      if (
        responseData?.status &&
        typeof responseData.status === "string" &&
        responseData.status.includes("not have number id")
      ) {
        toast.warning(
          "ไม่พบข้อมูลรายการ หรือรายการเกินกำหนดเวลา (ตรวจสอบรายละเอียดด้านล่าง)",
          { id: toastId }
        );
      } else {
        toast.success("ขั้นตอนที่ 3/3: ยกเลิกรายการสำเร็จ", { id: toastId });
      }

      matchedContextRef.current = null;
      setCurrentStep(3);
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

      let records: ResponseSchoolList["draftValues"];
      try {
        records = await fetchSchoolRecords();
      } catch (error) {
        toast.error("ไม่สามารถดึงรายชื่อโรงเรียนได้", { id: stepToast });
        throw new Error("ไม่สามารถดึงรายชื่อโรงเรียนได้");
      }
      const schoolMatch = (() => {
        if (info.schoolId) {
          return records.find(
            (item) => String(item.SchoolID) === String(info.schoolId)
          );
        }

        if (info.schoolName) {
          const normalizedTarget = normalizeText(info.schoolName);
          const direct = records.find(
            (item) => normalizeText(item.SchoolName) === normalizedTarget
          );
          if (direct) return direct;
        }

        if (info.schoolNameEN) {
          const normalizedTarget = normalizeText(info.schoolNameEN);
          const direct = records.find(
            (item) => normalizeText(item.SchoolNameEN) === normalizedTarget
          );
          if (direct) return direct;
        }

        if (info.schoolName) {
          const normalizedTarget = normalizeText(info.schoolName);
          return records.find((item) =>
            normalizeText(item.SchoolName).includes(normalizedTarget)
          );
        }

        return undefined;
      })();

      if (!schoolMatch) {
        toast.error("ไม่พบโรงเรียนจากข้อมูลที่ให้มา", { id: stepToast });
        throw new Error("ไม่พบข้อมูลโรงเรียนจากการสนทนา");
      }

      updatedValues.SchoolID = String(schoolMatch.SchoolID);
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
          schoolMatch.SchoolName
        )}`,
        { id: stepToast }
      );
    } else {
      toast.message("ขั้นตอนที่ 1/3: ใช้ข้อมูลโรงเรียนจากแบบฟอร์ม");
      if (!matchedContextRef.current?.school && updatedValues.SchoolID) {
        const formSchoolLabel = schoolOptions.find(
          (option) => String(option.value) === String(updatedValues.SchoolID)
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
        "ขั้นตอนที่ 2/3: กำลังค้นหารายชื่อผู้ใช้..."
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
      identifier?: string
    ) => {
      if (userId) {
        const direct = users.find(
          (user) => String(user.UserID) === String(userId)
        );
        if (direct) return direct;
      }

      if (firstName && lastName) {
        const normalizedFirstName = normalizeText(firstName);
        const normalizedLastName = normalizeText(lastName);
        const direct = users.find(
          (user) =>
            normalizeText(user.Name) === normalizedFirstName &&
            normalizeText(user.LastName) === normalizedLastName
        );
        if (direct) return direct;

        return users.find((user) =>
          normalizeText(`${user.Name}${user.LastName}`).includes(
            normalizedFirstName + normalizedLastName
          )
        );
      }

      if (identifier) {
        const normalizedIdentifier = normalizeText(identifier);
        const directBarcode = users.find(
          (user) => normalizeText(user.BarCode) === normalizedIdentifier
        );
        if (directBarcode) return directBarcode;

        return users.find(
          (user) => normalizeText(user.username) === normalizedIdentifier
        );
      }

      return undefined;
    };

    if (!updatedValues.sID) {
      const buyerCandidate = matchUser(
        info.buyerUserId,
        info.buyerName,
        info.buyerLastName,
        info.buyerIdentifier
      );

      if (buyerCandidate) {
        updatedValues.sID = String(buyerCandidate.UserID);
        form.setFieldsValue({ ...updatedValues });
        toast.message(
          `ระบุผู้ซื้อ: ${buyerCandidate.Name} ${buyerCandidate.LastName}`
        );
        matchedContextRef.current = {
          ...(matchedContextRef.current ?? {}),
          buyer: `${buyerCandidate.Name} ${buyerCandidate.LastName} (${buyerCandidate.UserID})`,
        };
      }
    } else if (!matchedContextRef.current?.buyer && updatedValues.sID) {
      const existingBuyer = users.find(
        (user) => String(user.UserID) === String(updatedValues.sID)
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
        info.sellerIdentifier
      );

      if (sellerCandidate) {
        updatedValues.sID2 = String(sellerCandidate.UserID);
        form.setFieldsValue({ ...updatedValues });
        toast.message(
          `ระบุผู้ขาย: ${sellerCandidate.Name} ${sellerCandidate.LastName}`
        );
        matchedContextRef.current = {
          ...(matchedContextRef.current ?? {}),
          seller: `${sellerCandidate.Name} ${sellerCandidate.LastName} (${sellerCandidate.UserID})`,
        };
      }
    } else if (!matchedContextRef.current?.seller && updatedValues.sID2) {
      const existingSeller = users.find(
        (user) => String(user.UserID) === String(updatedValues.sID2)
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
        "ไม่พบข้อมูลผู้ซื้อหรือผู้ขายจากการสนทนา กรุณาเลือกจากแบบฟอร์ม"
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
          if (!value || /ไม่มี|not\s*required/i.test(value) || value === "—")
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
    [form]
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

  // Helper to determine alert status and message
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
              ระบบแจ้งว่า: <b>{statusString}</b> <br />
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          padding: "32px",
          background: `linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%)`,
          minHeight: "100vh",
        }}
      >
        <AiChatWidget
          title="AI Assistant สำหรับยกเลิกรายการ"
          placeholder="พิมพ์คำสั่ง เช่น ยกเลิกการขายให้โรงเรียน ... พร้อมข้อมูลที่จำเป็น"
          cancellationLog={lastCancellationLog as any}
          onCancellationInfo={handleCancellationInfo}
          onConfirmCancellation={handleChatConfirmCancellation}
        />

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              variant="borderless"
              style={{
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                borderRadius: 16,
                boxShadow: `0 8px 32px ${token.colorPrimary}30`,
              }}
              styles={{ body: { padding: "32px" } }}
            >
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <Space align="center">
                  <SafetyOutlined style={{ fontSize: 32, color: "white" }} />
                  <Typography.Title
                    level={2}
                    style={{ margin: 0, color: "white", fontWeight: 700 }}
                  >
                    ยกเลิกรายการขาย เกิน 7 วัน
                  </Typography.Title>
                </Space>
                <Typography.Text
                  style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}
                >
                  ระบบยกเลิกรายการขายที่เกินกำหนดเวลา พร้อม AI Assistant
                </Typography.Text>
              </Space>
            </Card>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              <Steps
                current={currentStep}
                items={[
                  {
                    title: "เลือกโรงเรียน",
                    icon: <HomeOutlined />,
                  },
                  {
                    title: "ระบุผู้ซื้อ/ผู้ขาย",
                    icon: <TeamOutlined />,
                  },
                  {
                    title: "กรอก Transaction ID",
                    icon: <CreditCardOutlined />,
                  },
                  {
                    title: "เสร็จสิ้น",
                    icon: <CheckCircleOutlined />,
                  },
                ]}
              />
              <Divider />
              <div>
                <Typography.Text type="secondary">
                  ความคืบหน้าการกรอกข้อมูล
                </Typography.Text>
                <Progress
                  percent={Math.round(getFormProgress())}
                  strokeColor={{
                    "0%": token.colorPrimary,
                    "100%": token.colorSuccess,
                  }}
                  size={8}
                />
              </div>
            </Card>
          </motion.div>

          {/* Main Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              variant="borderless"
              title={
                <Space>
                  <FileTextOutlined style={{ color: token.colorPrimary }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    แบบฟอร์มยกเลิกรายการ
                  </Typography.Title>
                </Space>
              }
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              <Skeleton
                active
                loading={isResourceLoading}
                paragraph={{ rows: 8 }}
                title={false}
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
                    if (values.sSellID) step = 2;
                    setCurrentStep(step);
                  }}
                >
                  <Form.Item
                    name="SchoolID"
                    label={
                      <Space>
                        <HomeOutlined style={{ color: token.colorPrimary }} />
                        <span style={{ fontWeight: 600 }}>เลือกโรงเรียน</span>
                        <Tooltip title="ค้นหาโรงเรียนที่ต้องการทำรายการ โดยพิมพ์ชื่อหรือรหัสโรงเรียน">
                          <QuestionCircleOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder="🏫 เลือกโรงเรียน"
                      size="large"
                      options={[
                        { label: "เลือกรายการ", value: "" },
                        ...schoolOptions,
                      ]}
                      optionFilterProp="label"
                      style={{
                        boxShadow: `0 2px 8px ${token.colorPrimary}10`,
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="sID"
                    label={
                      <Space>
                        <UserOutlined style={{ color: token.colorSuccess }} />
                        <span style={{ fontWeight: 600 }}>
                          กรอกรหัส User ID (ของผู้ซื้อสินค้า)
                        </span>
                        <Tooltip title="ระบุ User ID ของผู้ที่ทำรายการซื้อ (Buyer) สามารถค้นหาจากชื่อ หรือ ID">
                          <InfoCircleOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: "กรุณาเลือกผู้ซื้อ" }]}
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder="👤 เลือกผู้ซื้อสินค้า"
                      size="large"
                      options={[
                        { label: "เลือกรายการ", value: "" },
                        ...userList,
                      ]}
                      optionFilterProp="label"
                      disabled={!selectedSchoolId}
                      loading={isFetchingUsers}
                      style={{
                        boxShadow: `0 2px 8px ${token.colorSuccess}10`,
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="sID2"
                    label={
                      <Space>
                        <TeamOutlined style={{ color: token.colorWarning }} />
                        <span style={{ fontWeight: 600 }}>
                          กรอกรหัส User ID (ของผู้ขายสินค้า)
                        </span>
                        <Tooltip title="ระบุ User ID ของร้านค้าหรือผู้ขาย (Seller) ที่รับชำระเงิน">
                          <InfoCircleOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: "กรุณาเลือกผู้ขาย" }]}
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder="👥 เลือกผู้ขายสินค้า"
                      size="large"
                      options={[
                        { label: "เลือกรายการ", value: "" },
                        ...userList,
                      ]}
                      optionFilterProp="label"
                      disabled={!selectedSchoolId}
                      loading={isFetchingUsers}
                      style={{
                        boxShadow: `0 2px 8px ${token.colorWarning}10`,
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="sSellID"
                    label={
                      <Space>
                        <CreditCardOutlined
                          style={{ color: token.colorError }}
                        />
                        <span style={{ fontWeight: 600 }}>
                          รหัส Transaction Id (sSellID)
                        </span>
                        <Tooltip title="ใส่รหัส sSellID ของรายการที่ต้องการยกเลิก ตรวจสอบได้จากรายงานการขาย">
                          <QuestionCircleOutlined
                            style={{ color: token.colorTextSecondary }}
                          />
                        </Tooltip>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "กรุณากรอก Transaction ID" },
                    ]}
                  >
                    <Input
                      placeholder="💳 กรุณากรอกรหัส Transaction ID"
                      size="large"
                      prefix={<CreditCardOutlined />}
                      style={{
                        boxShadow: `0 2px 8px ${token.colorError}10`,
                      }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space size="middle">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        size="large"
                        icon={<ThunderboltOutlined />}
                        style={{
                          borderRadius: 8,
                          background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
                          border: "none",
                          boxShadow: `0 4px 16px ${token.colorPrimary}40`,
                          fontWeight: 600,
                        }}
                      >
                        ยืนยันยกเลิกรายการ
                      </Button>
                      <Button
                        htmlType="button"
                        danger
                        size="large"
                        icon={<ReloadOutlined />}
                        onClick={handleResetForm}
                        style={{
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        ล้างข้อมูล
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Skeleton>
            </Card>
          </motion.div>

          {/* Response Card */}
          {responsePayload.data && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined
                      style={{ color: token.colorSuccess, fontSize: 20 }}
                    />
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      ผลลัพธ์การดำเนินการ
                    </Typography.Title>
                  </Space>
                }
                style={{
                  borderRadius: 16,
                  boxShadow: `0 4px 16px ${token.colorSuccess}20`,
                  border: `2px solid ${token.colorSuccess}30`,
                }}
              >
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  {getResponseAlert(responsePayload.data)}

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: token.colorFillAlter,
                      maxHeight: 300,
                      overflow: "auto",
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: 12 }}>
                      <code>
                        {JSON.stringify(responsePayload.data, null, 2)}
                      </code>
                    </pre>
                  </div>

                  <Space wrap>
                    <Tooltip title="คัดลอก Response">
                      <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={() =>
                          handleCopyResponse(
                            JSON.stringify(responsePayload.data, null, 2),
                            "คัดลอก Response แล้ว"
                          )
                        }
                      >
                        Copy Response
                      </Button>
                    </Tooltip>

                    <Tooltip title="คัดลอก CURL Command">
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() =>
                          responsePayload.curl &&
                          handleCopyResponse(
                            responsePayload.curl.toString(),
                            "คัดลอก CURL แล้ว"
                          )
                        }
                        disabled={!responsePayload.curl}
                      >
                        Copy CURL
                      </Button>
                    </Tooltip>
                  </Space>
                </Space>
              </Card>
            </motion.div>
          )}

          {/* Help Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card
              style={{
                borderRadius: 16,
                background: `linear-gradient(135deg, ${token.colorInfoBg} 0%, ${token.colorBgContainer} 100%)`,
                border: `1px solid ${token.colorInfoBorder}`,
              }}
            >
              <Space direction="vertical" size="small">
                <Space>
                  <RocketOutlined
                    style={{ fontSize: 20, color: token.colorInfo }}
                  />
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    วิธีการใช้งาน Cancel Sales
                  </Typography.Text>
                </Space>
                <Link
                  href="https://drive.google.com/file/d/11JeMTt22jWK12BjsW07fFYteuZgDGjAe/view?usp=sharing"
                  target="_blank"
                  style={{
                    color: token.colorPrimary,
                    textDecoration: "underline",
                    fontSize: 15,
                  }}
                >
                  📺 คลิกที่นี่เพื่อดูคลิปสอนการใช้งานภายใน 2 นาที!
                </Link>
              </Space>
            </Card>
          </motion.div>
        </Space>
      </motion.div>
    </DashboardLayout>
  );
}
