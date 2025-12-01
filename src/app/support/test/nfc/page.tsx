"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CallAPI } from "@/stores/actions/form-card-nfc-action";
import { toast } from "sonner";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Spin,
  Divider,
  Flex,
} from "antd";
import {
  CreditCardOutlined,
  SearchOutlined,
  ClearOutlined,
  CopyOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { FiHome } from "react-icons/fi";
import { CallAPI as GetSchoolList } from "@/stores/actions/call-school-list";

// ==================== Types ====================
type NFCFormData = {
  nfc_card: string;
  school_id: string;
};

type SchoolOption = {
  label: string;
  value: string;
};

// ==================== Constants ====================
const FORM_LABELS = {
  SCHOOL: "เลือกโรงเรียน",
  NFC_CARD: "กรอกรหัส NFC Card",
  SUBMIT: "ค้นหา",
  CANCEL: "ล้างข้อมูล",
  COPY_RESPONSE: "คัดลอก Response",
  COPY_CURL: "คัดลอก CURL",
} as const;

const TOAST_MESSAGES = {
  VALIDATION_ERROR: "กรุณากรอกข้อมูลให้ครบถ้วน",
  SUCCESS: "ค้นหาข้อมูลสำเร็จ",
  ERROR: "เกิดข้อผิดพลาด",
  COPY_SUCCESS: "คัดลอกข้อมูลสำเร็จ",
  COPY_ERROR: "คัดลอกข้อมูลล้มเหลว",
} as const;

const NOTES = [
  {
    title: "หมายเหตุ (1)",
    content:
      "กรณีที่บัตร NFC ไม่ถูกต้อง หรือไม่พบข้อมูลในระบบ จะมีการแสดงผลลัพธ์เป็น JSON ที่มี status เป็น 'not have number id'",
  },
  {
    title: "หมายเหตุ (2)",
    content:
      "กรณีที่ไม่พบข้อมูลใน https://www.canteen.schoolbright.co แต่พบข้อมูลที่นี่ แปลว่าเป็นปัญหาที่ Memory Sharing ของระบบ Canteen Web ให้แจ้ง Vimal",
  },
] as const;

//** คอมโพเนนต์ Select พร้อมไอคอนซ้ายเพื่อให้เว้นระยะได้สม่ำเสมอ
const FieldIconSelect = ({ icon, className, style, ...props }: any) => {
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

// ==================== Utility Functions ====================
const formatSchoolOption = (school: any): SchoolOption => ({
  label: `${school.SchoolName} (${school.SchoolID})`,
  value: String(school.SchoolID),
});

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const formatJSON = (data: any): string => JSON.stringify(data, null, 2);

// ==================== Custom Hooks ====================
const useSchoolOptions = () => {
  const schoolState = useAppSelector((state) => state.callSchoolList);

  return useMemo<SchoolOption[]>(() => {
    const schoolsFromResponse = schoolState?.response?.data?.data;
    const schoolsFromDraft = schoolState?.draftValues?.data;
    const schools = Array.isArray(schoolsFromResponse)
      ? schoolsFromResponse
      : Array.isArray(schoolsFromDraft)
      ? schoolsFromDraft
      : [];

    return schools.map(formatSchoolOption);
  }, [schoolState?.response?.data?.data, schoolState?.draftValues?.data]);
};

const useNFCForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const nfcState = useAppSelector((state) => state.formCardNfc);
  const [form] = Form.useForm<NFCFormData>();

  const handleSubmit = useCallback(
    async (values: NFCFormData) => {
      try {
        await dispatch(CallAPI({ draftValues: values })).unwrap();
        toast.success(TOAST_MESSAGES.SUCCESS);
      } catch (error: any) {
        toast.error(TOAST_MESSAGES.ERROR, {
          description: error.message || "ไม่สามารถดำเนินการได้",
        });
      }
    },
    [dispatch]
  );

  const handleReset = useCallback(() => {
    form.resetFields();
  }, [form]);

  

  return {
    form,
    nfcState,
    isLoading: nfcState.loading,
    response: nfcState.response.data,
    handleSubmit,
    handleReset,
  };
};

// ==================== Components ====================
const PageHeader: React.FC = () => (
  <HeaderBar
    title="ทดสอบค้นหาบัตร NFC (Vimal)"
    subTitle="ทดสอบค้นหาข้อมูลบัตร NFC ผ่านระบบ Vimal"
    icon={<CreditCardOutlined />}
    color="none"
  />
);

const SearchForm: React.FC<{
  form: any;
  schoolOptions: SchoolOption[];
  isLoading: boolean;
  onSubmit: (values: NFCFormData) => void;
  onReset: () => void;
}> = ({ form, schoolOptions, isLoading, onSubmit, onReset }) => (
  <Card title="ค้นหาบัตร NFC" variant="outlined">
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      autoComplete="off"
      requiredMark="optional"
    >
      <Form.Item
        name="school_id"
        label="เลือกโรงเรียน"
        rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
      >
        <FieldIconSelect
          icon={<FiHome />}
          showSearch
          allowClear
          placeholder="เลือกโรงเรียน"
          options={[{ label: "เลือกรายการ", value: "" }, ...schoolOptions]}
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item
        name="nfc_card"
        label={FORM_LABELS.NFC_CARD}
        rules={[{ required: true, message: "กรุณากรอกรหัส NFC Card" }]}
      >
        <Input
          prefix={<CreditCardOutlined />}
          placeholder="กรุณากรอกรหัส NFC Card"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            loading={isLoading}
            size="large"
          >
            {FORM_LABELS.SUBMIT}
          </Button>
          <Button
            htmlType="button"
            icon={<ClearOutlined />}
            onClick={onReset}
            size="large"
          >
            {FORM_LABELS.CANCEL}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Card>
);

const ResponseCard: React.FC<{
  response: any;
}> = ({ response }) => {
  const handleCopyResponse = async () => {
    const success = await copyToClipboard(formatJSON(response?.data));
    toast[success ? "success" : "error"](
      success ? TOAST_MESSAGES.COPY_SUCCESS : TOAST_MESSAGES.COPY_ERROR
    );
  };

  const handleCopyCURL = async () => {
    const curlCommand = response?.curl?.toString() || "";
    const success = await copyToClipboard(curlCommand);
    toast[success ? "success" : "error"](
      success ? TOAST_MESSAGES.COPY_SUCCESS : TOAST_MESSAGES.COPY_ERROR
    );
  };

  if (!response) return null;

  return (
    <Card title="Response" bordered={false}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Input.TextArea
          value={formatJSON(response?.data)}
          readOnly
          autoSize={{ minRows: 10, maxRows: 20 }}
          style={{ fontFamily: "monospace" }}
        />

        <Space wrap>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopyResponse}
            type="primary"
          >
            {FORM_LABELS.COPY_RESPONSE}
          </Button>
          <Button
            icon={<CodeOutlined />}
            onClick={handleCopyCURL}
            type="default"
          >
            {FORM_LABELS.COPY_CURL}
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

const NotesSection: React.FC = () => {
  const { t } = useTranslation("mock");

  return (
    <Row gutter={[16, 16]}>
      {NOTES.map((note, index) => (
        <Col key={index} xs={24} md={12}>
          <Alert
            message={note.title}
            description={t(note.content)}
            type="warning"
            showIcon
          />
        </Col>
      ))}
    </Row>
  );
};

// ==================== Main Component ====================
const NFCCardSearchPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const schoolOptions = useSchoolOptions();
  const { form, isLoading, response, handleSubmit, handleReset } = useNFCForm();

  useEffect(() => {
    dispatch(GetSchoolList());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <Spin spinning={isLoading} size="large" tip="กำลังโหลด...">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <PageHeader />

          <SearchForm
            form={form}
            schoolOptions={schoolOptions}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onReset={handleReset}
          />

          <ResponseCard response={response} />

          <NotesSection />
        </Space>
      </Spin>
    </DashboardLayout>
  );
};

export default NFCCardSearchPage;
