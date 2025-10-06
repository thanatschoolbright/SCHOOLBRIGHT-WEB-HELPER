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
} from "antd";
import axios from "axios";
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
import { FiCreditCard, FiHome, FiUser, FiUserCheck } from "react-icons/fi";
import { toast } from "sonner";

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

//** คอมโพเนนต์ Select พร้อมไอคอนซ้ายเพื่อให้เว้นระยะได้สม่ำเสมอ
const FieldIconSelect = ({
  icon,
  className,
  style,
  ...props
}: IconSelectProps) => {
  const composedClassName = ["field-select", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="field-with-icon">
      <span className="field-icon">{icon}</span>
      <Select
        {...props}
        className={composedClassName}
        style={{ width: "100%", ...style }}
      />
      <style jsx>{`
        .field-with-icon {
          position: relative;
          width: 100%;
        }

        .field-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8c8c8c;
          pointer-events: none;
          font-size: 18px;
          z-index: 2;
        }

        .field-with-icon :global(.ant-select-selector) {
          padding-left: 36px !important;
        }
      `}</style>
    </div>
  );
};

const initialFormValues: CancelSalesState["draftValues"] = {
  SchoolID: "",
  sID: "",
  sID2: "",
  sSellID: "",
};

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm<CancelSalesState["draftValues"]>();

  const cancelSalesState = useAppSelector((state) => state.callCancelSales);
  const schoolListState = useAppSelector((state) => state.callSchoolList);

  const [userList, setUserList] = useState<DropdownOption[]>([]);
  const [lastCancellationLog, setLastCancellationLog] =
    useState<CancellationLog | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedCancellationInfo>(
    {}
  );
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
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

      toast.success("ขั้นตอนที่ 3/3: ยกเลิกรายการสำเร็จ", { id: toastId });
      matchedContextRef.current = null;
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

  //** สร้างรายการโรงเรียนจากสถานะที่ดึงมาล่าสุด
  //** ตั้งค่าเริ่มต้นให้ฟอร์มเมื่อเปิดหน้า
  useEffect(() => {
    form.setFieldsValue(initialFormValues);
  }, [form]);

  //** ดึงรายชื่อผู้ใช้ทุกครั้งที่เลือกโรงเรียนใหม่
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

  //** ส่งคำขอยกเลิกธุรกรรมไปยังระบบหลัก
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

  //** ล้างค่าในฟอร์มและรีเซ็ตสถานะผู้ใช้ที่เลือกไว้
  const handleResetForm = () => {
    form.setFieldsValue(initialFormValues);
    setUserList([]);
    cachedUsersRef.current = [];
    setExtractedInfo({});
    toast.success("ล้างข้อมูลฟอร์มแล้ว");
  };

  //** คัดลอกข้อมูลตอบกลับขึ้นคลิปบอร์ดเพื่อไปใช้งานต่อ
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

  return (
    <DashboardLayout>
      <div className="">
        <AiChatWidget
          title="AI Assistant สำหรับยกเลิกรายการ"
          placeholder="พิมพ์คำสั่ง เช่น ยกเลิกการขายให้โรงเรียน ... พร้อมข้อมูลที่จำเป็น"
          cancellationLog={lastCancellationLog as any}
          onCancellationInfo={handleCancellationInfo}
          onConfirmCancellation={handleChatConfirmCancellation}
        />

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card
            className="glass-card"
            title={
              <Typography.Title level={4} className="card-title">
                Cancel Sales เกิน 7 วัน
              </Typography.Title>
            }
            variant="borderless"
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
              >
                <Form.Item
                  name="SchoolID"
                  label="เลือกโรงเรียน"
                  rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
                >
                  <FieldIconSelect
                    icon={<FiHome />}
                    showSearch
                    allowClear
                    placeholder="เลือกโรงเรียน"
                    options={[
                      { label: "เลือกรายการ", value: "" },
                      ...schoolOptions,
                    ]}
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item
                  name="sID"
                  label="กรอกรหัส User ID (ของผู้ซื้อสินค้า)"
                  rules={[{ required: true, message: "กรุณาเลือกผู้ซื้อ" }]}
                >
                  <FieldIconSelect
                    icon={<FiUser />}
                    showSearch
                    allowClear
                    placeholder="กรอกรหัส User ID (ของผู้ซื้อสินค้า)"
                    options={[{ label: "เลือกรายการ", value: "" }, ...userList]}
                    optionFilterProp="label"
                    disabled={!selectedSchoolId}
                    loading={isFetchingUsers}
                  />
                </Form.Item>

                <Form.Item
                  name="sID2"
                  label="กรอกรหัส User ID (ของผู้ขายสินค้า)"
                  rules={[{ required: true, message: "กรุณาเลือกผู้ขาย" }]}
                >
                  <FieldIconSelect
                    icon={<FiUserCheck />}
                    showSearch
                    allowClear
                    placeholder="กรอกรหัส User ID (ของผู้ขายสินค้า)"
                    options={[{ label: "เลือกรายการ", value: "" }, ...userList]}
                    optionFilterProp="label"
                    disabled={!selectedSchoolId}
                    loading={isFetchingUsers}
                  />
                </Form.Item>

                <Form.Item
                  name="sSellID"
                  label="รหัส Transaction Id (sSellID)"
                  rules={[
                    { required: true, message: "กรุณากรอก Transaction ID" },
                  ]}
                >
                  <Input
                    placeholder="กรุณากรอกรหัส Transaction ID"
                    prefix={<FiCreditCard />}
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                    >
                      ยืนยัน
                    </Button>
                    <Button htmlType="button" danger onClick={handleResetForm}>
                      ล้างข้อมูล
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Skeleton>
          </Card>

          {responsePayload.data && (
            <Card
              className="glass-card"
              title={
                <Typography.Title level={5} className="card-title">
                  Response
                </Typography.Title>
              }
              variant="borderless"
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <pre className="response-block">
                  <code>{JSON.stringify(responsePayload.data, null, 2)}</code>
                </pre>

                <Space wrap>
                  <Button
                    type="primary"
                    onClick={() =>
                      handleCopyResponse(
                        JSON.stringify(responsePayload.data, null, 2),
                        "คัดลอก Response แล้ว"
                      )
                    }
                  >
                    Copy Response
                  </Button>

                  <Button
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
                </Space>
              </Space>
            </Card>
          )}

          <Card
            className="glass-card"
            title={
              <Typography.Title level={5} className="card-title">
                หมายเหตุ (1)
              </Typography.Title>
            }
            variant="borderless"
          >
            <Space direction="vertical">
              <Typography.Text type="danger">
                วิธีการใช้งาน Cancel Sales
              </Typography.Text>
              <Link
                href="https://drive.google.com/file/d/11JeMTt22jWK12BjsW07fFYteuZgDGjAe/view?usp=sharing"
                className="external-link"
              >
                คลิกที่นี่เพื่อดูคลิปสอนการใช้งานภายใน 2 นาที!
              </Link>
            </Space>
          </Card>
        </Space>
      </div>

      <style jsx>{`
        .cancel-sales-page {
          width: 100%;
          padding: 32px;
          background: linear-gradient(
            135deg,
            rgba(248, 250, 252, 0.9),
            rgba(255, 255, 255, 0.8)
          );
        }

        .glass-card {
          border-radius: 20px;
          border: none;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
        }

        .card-title {
          margin-bottom: 0 !important;
          font-weight: 600;
        }

        .response-block {
          padding: 16px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.05);
          font-size: 12px;
          max-height: 260px;
          overflow-y: auto;
          white-space: pre-wrap;
        }

        .external-link {
          color: #2563eb;
          text-decoration: underline;
        }

        .external-link:hover {
          color: #1d4ed8;
        }

        @media (prefers-color-scheme: dark) {
          .glass-card {
            background: rgba(15, 23, 42, 0.88);
            box-shadow: 0 20px 40px rgba(2, 6, 23, 0.6);
          }

          .response-block {
            background: rgba(148, 163, 184, 0.18);
            color: #e2e8f0;
          }

          .external-link {
            color: #93c5fd;
          }

          .external-link:hover {
            color: #bfdbfe;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
