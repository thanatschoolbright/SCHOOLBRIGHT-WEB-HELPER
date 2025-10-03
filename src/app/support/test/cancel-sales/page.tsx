"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CallAPI } from "@/stores/actions/call-cancel-sales";
import {
  CancelSalesState,
  ResponseSchoolList,
  ResponseUserList,
} from "@stores/type";
import { CallAPI as GET_USER_BY_SCHOOLID } from "@/stores/actions/school/call-get-user";
import Link from "next/link";
import type { SelectProps } from "antd";
import { Button, Card, Form, Input, Select, Skeleton, Space, Typography } from "antd";
import { FiCreditCard, FiHome, FiUser, FiUserCheck } from "react-icons/fi";
import { toast } from "sonner";
interface DropdownOption {
  label: string;
  value: string;
}

type IconSelectProps = SelectProps<string> & { icon: ReactNode };

// Helper: render an Ant Design Select with a left-aligned icon and consistent padding.
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
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm<CancelSalesState["draftValues"]>();

  const cancelSalesState = useAppSelector((state) => state.callCancelSales);
  const schoolListState = useAppSelector((state) => state.callSchoolList);
  const userBySchoolState = useAppSelector(
    (state) => state.callGetuserBySchoolId
  );

  const [userList, setUserList] = useState<DropdownOption[]>([]);

  const selectedSchoolId = Form.useWatch("SchoolID", form);

  const isResourceLoading = schoolListState.loading;
  const isSubmitting = cancelSalesState.loading;

  // Derive school dropdown options whenever the school list state updates.
  const schoolOptions = useMemo<DropdownOption[]>(() => {
    const draft = schoolListState?.draftValues;
    const withDataField = Array.isArray(
      (draft as { data?: ResponseSchoolList["draftValues"] })?.data
    )
      ? (draft as { data: ResponseSchoolList["draftValues"] }).data ?? []
      : [];
    const fallback = Array.isArray(draft) ? draft : [];
    const list = withDataField.length ? withDataField : fallback;

    return list.map((item: ResponseSchoolList["draftValues"][number]) => ({
      label: `${item.SchoolName} (${item.SchoolID})`,
      value: item.SchoolID,
    }));
  }, [schoolListState?.draftValues]);

  useEffect(() => {
    form.setFieldsValue(initialFormValues);
  }, [form]);

  // Fetch user list every time the selected school changes.
  useEffect(() => {
    if (!selectedSchoolId) {
      setUserList([]);
      return;
    }

    const fetchUsers = async () => {
      const toastId = toast.loading("กำลังโหลดรายชื่อผู้ใช้...");

      try {
        const response = await dispatch(
          GET_USER_BY_SCHOOLID({ schoolId: selectedSchoolId })
        ).unwrap();

        const users: ResponseUserList["draftValues"][] = response?.data ?? [];
        setUserList(
          (users ?? []).map((item) => ({
            label: `${item.Name} ${item.LastName} (ID: ${item.UserID} Username: ${item.username})`,
            value: item.UserID.toString(),
          }))
        );

        toast.success("โหลดรายชื่อผู้ใช้สำเร็จ", { id: toastId });
      } catch (error) {
        setUserList([]);
        toast.error("โหลดรายชื่อผู้ใช้ไม่สำเร็จ", { id: toastId });
      }
    };

    fetchUsers();
  }, [dispatch, selectedSchoolId]);

  // Submit form data to cancel the selected sales transaction.
  const handleSubmitForm = async (values: CancelSalesState["draftValues"]) => {
    const toastId = toast.loading("กำลังส่งคำขอยกเลิก...");

    try {
      await dispatch(
        CallAPI({
          draftValues: values,
          loading: false,
          error: "",
          success: "",
          response: undefined,
        })
      ).unwrap();

      toast.success("ยกเลิกคำสั่งซื้อสำเร็จ", { id: toastId });
    } catch (error: any) {
      toast.error(error?.message ?? "ไม่สามารถยกเลิกคำสั่งซื้อได้", {
        id: toastId,
      });
    }
  };

  const handleResetForm = () => {
    form.setFieldsValue(initialFormValues);
    setUserList([]);
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

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="Cancel Sales เกิน 7 วัน">
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
                loading={userBySchoolState.loading}
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
                loading={userBySchoolState.loading}
              />
            </Form.Item>

            <Form.Item
              name="sSellID"
              label="รหัส Transaction Id (sSellID)"
              rules={[{ required: true, message: "กรุณากรอก Transaction ID" }]}
            >
              <Input
                placeholder="กรุณากรอกรหัส Transaction ID"
                prefix={<FiCreditCard />}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  ยืนยัน
                </Button>
                <Button htmlType="button" danger onClick={handleResetForm}>
                  ล้างข้อมูล
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {responsePayload.data && (
          <Card title="Response">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <pre className="whitespace-pre-wrap">
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

        <Card title="หมายเหตุ (1)">
          <Space direction="vertical">
            <Typography.Text type="danger">
              {t("วิธีการใช้งาน Cancel Sales")}
            </Typography.Text>
            <Link
              href="https://drive.google.com/file/d/11JeMTt22jWK12BjsW07fFYteuZgDGjAe/view?usp=sharing"
              className="underline text-blue-600 hover:text-blue-800"
            >
              คลิกที่นี่เพื่อดูคลิปสอนการใช้งานภายใน 2 นาที!
            </Link>
          </Space>
        </Card>
      </Space>
    </DashboardLayout>
  );
}
