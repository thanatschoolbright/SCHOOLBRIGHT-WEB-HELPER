"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CallAPI as SearchNFCCardAction } from "@/stores/actions/form-card-nfc-action";
import { CallAPI as FetchSchoolListAction } from "@/stores/actions/call-school-list";
import { toast } from "sonner";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Alert,
  Spin,
  Tooltip,
  Divider,
  Tag,
  Empty,
  Typography,
  theme,
  Flex,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCardOutlined,
  SearchOutlined,
  ClearOutlined,
  CopyOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  ScanOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RocketOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { HeaderBar } from "@/components/typhography/header-bar-component";

// ==================== Interfaces ====================

interface NFCSearchFormValues {
  nfcCardId: string;
  schoolId: string;
}

interface SchoolDropdownOption {
  label: string;
  value: string;
}

// ==================== Constants ====================

const UI_TEXT = {
  TITLE: "ตรวจสอบข้อมูลบัตร NFC (Vimal System)",
  SUBTITLE: "เครื่องมือสำหรับทีม Support ตรวจสอบสถานะบัตรนักเรียนผ่าน API",
  LABEL_SCHOOL: "เลือกโรงเรียน",
  LABEL_NFC: "รหัสบัตร NFC (UID)",
  BTN_SUBMIT: "ค้นหาข้อมูล",
  BTN_RESET: "ล้างค่า",
  BTN_COPY_CURL: "Copy cURL",
  BTN_COPY_JSON: "Copy JSON",
  PLACEHOLDER_SCHOOL: "ค้นหาชื่อโรงเรียน...",
  PLACEHOLDER_NFC: "เช่น 1234567890",
  TOOLTIP_SCHOOL: "เลือกโรงเรียนที่ต้องการตรวจสอบข้อมูล",
  TOOLTIP_NFC: "ระบุ UID ของบัตรที่ต้องการตรวจสอบ (ตัวเลขหรือตัวอักษร)",
  TOOLTIP_CURL: "คัดลอกคำสั่ง cURL สำหรับส่งให้ Developer ตรวจสอบต่อ",
  TOOLTIP_JSON: "คัดลอกผลลัพธ์ทั้งหมด",
};

// ==================== Hooks ====================

const useSchoolListOptions = () => {
  const schoolListState = useAppSelector((state) => state.callSchoolList);

  return useMemo<SchoolDropdownOption[]>(() => {
    const responseData = schoolListState?.response?.data?.data;
    const draftData = schoolListState?.draftValues?.data;
    const schools = Array.isArray(responseData)
      ? responseData
      : Array.isArray(draftData)
      ? draftData
      : [];

    return schools.map((school: any) => ({
      label: `${school.SchoolName} (${school.SchoolID})`,
      value: String(school.SchoolID),
    }));
  }, [
    schoolListState?.response?.data?.data,
    schoolListState?.draftValues?.data,
  ]);
};

const useNFCSearchLogic = () => {
  const dispatch = useDispatch<AppDispatch>();
  const nfcSearchState = useAppSelector((state) => state.formCardNfc);
  const [searchForm] = Form.useForm();

  const handleSearchSubmit = useCallback(
    async (formValues: NFCSearchFormValues) => {
      try {
        const payload = {
          nfc_card: formValues.nfcCardId,
          school_id: formValues.schoolId,
        };

        await dispatch(SearchNFCCardAction({ draftValues: payload })).unwrap();
        toast.success("ดึงข้อมูลสำเร็จ");
      } catch (error: any) {
        toast.error("ไม่สามารถค้นหาข้อมูลได้", {
          description: error.message || "กรุณาตรวจสอบข้อมูลที่กรอก",
        });
      }
    },
    [dispatch]
  );

  const handleResetForm = useCallback(() => {
    searchForm.resetFields();
  }, [searchForm]);

  return {
    searchForm,
    isSearchLoading: nfcSearchState.loading,
    searchResultData: nfcSearchState.response.data,
    handleSearchSubmit,
    handleResetForm,
  };
};

const addAlpha = (color: string, alpha: number) => {
  if (!color) return "rgba(0,0,0,0)";
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

// ==================== Sub-Components ====================

const SearchCriteriaForm: React.FC<{
  formInstance: any;
  schoolOptions: SchoolDropdownOption[];
  isLoading: boolean;
  onFinish: (values: NFCSearchFormValues) => void;
  onReset: () => void;
}> = ({ formInstance, schoolOptions, isLoading, onFinish, onReset }) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  return (
    <div
      className="p-8 rounded-[32px] border border-solid"
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
        boxShadow: isDark ? "none" : "0 8px 32px -8px rgba(0,0,0,0.05)",
      }}
    >
      <Flex align="center" gap={16} className="mb-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
            color: "#fff",
          }}
        >
          <SearchOutlined />
        </div>
        <div>
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 800 }}>
            เงื่อนไขการค้นหา
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            ระบุโรงเรียนและรหัสบัตรที่ต้องการตรวจสอบข้อมูล
          </Typography.Text>
        </div>
      </Flex>

      <Form
        form={formInstance}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        size="large"
      >
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="schoolId"
              label={
                <Space style={{ fontWeight: 600 }}>
                  <HomeOutlined style={{ color: token.colorPrimary }} />
                  {UI_TEXT.LABEL_SCHOOL}
                </Space>
              }
              rules={[{ required: true, message: "กรุณาระบุโรงเรียน" }]}
              tooltip={UI_TEXT.TOOLTIP_SCHOOL}
            >
              <Select
                showSearch
                allowClear
                placeholder={UI_TEXT.PLACEHOLDER_SCHOOL}
                options={schoolOptions}
                optionFilterProp="label"
                style={{ borderRadius: 12 }}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="nfcCardId"
              label={
                <Space style={{ fontWeight: 600 }}>
                  <CreditCardOutlined style={{ color: token.colorInfo }} />
                  {UI_TEXT.LABEL_NFC}
                </Space>
              }
              rules={[{ required: true, message: "กรุณาระบุรหัสบัตร" }]}
              tooltip={UI_TEXT.TOOLTIP_NFC}
            >
              <Input
                placeholder={UI_TEXT.PLACEHOLDER_NFC}
                allowClear
                style={{ borderRadius: 12 }}
                prefix={<ScanOutlined style={{ color: token.colorInfo }} />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider className="my-6" />

        <div className="flex justify-end items-center gap-3">
          <Button
            size="large"
            icon={<ClearOutlined />}
            onClick={onReset}
            disabled={isLoading}
            style={{ borderRadius: 12, fontWeight: 600 }}
          >
            {UI_TEXT.BTN_RESET}
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<SearchOutlined />}
            loading={isLoading}
            style={{
              borderRadius: 12,
              fontWeight: 700,
              padding: "0 32px",
              height: 48,
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
              border: "none",
            }}
          >
            {UI_TEXT.BTN_SUBMIT}
          </Button>
        </div>
      </Form>
    </div>
  );
};

const SearchResultDisplay: React.FC<{
  resultData: any;
}> = ({ resultData }) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  const executeCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("คัดลอกลง Clipboard แล้ว");
    } catch {
      toast.error("คัดลอกล้มเหลว");
    }
  };

  if (!resultData) {
    return (
      <div
        className="p-16 rounded-[32px] border border-dashed text-center"
        style={{
          borderColor: token.colorBorder,
          background: isDark ? "transparent" : "rgba(0,0,0,0.01)",
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="flex flex-col gap-2">
              <Typography.Text strong style={{ fontSize: 16 }}>
                รอการค้นหาข้อมูล
              </Typography.Text>
              <Typography.Text type="secondary">
                กรุณากรอกข้อมูลด้านบนเพื่อเริ่มตรวจสอบสถานะบัตร NFC
              </Typography.Text>
            </div>
          }
        />
      </div>
    );
  }

  const isDataFound = resultData?.data?.status !== "not have number id";
  const jsonString = JSON.stringify(resultData?.data, null, 2);
  const curlString = resultData?.curl?.toString() || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-[32px] border border-solid"
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <Flex justify="space-between" align="center" className="mb-6" wrap="wrap">
        <Flex align="center" gap={12}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: addAlpha(token.colorInfo, 0.1),
              color: token.colorInfo,
            }}
          >
            <ApiOutlined />
          </div>
          <div>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              ผลลัพธ์จากระบบ (API Response)
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ข้อมูลดิบที่ได้รับจาก Vimal API
            </Typography.Text>
          </div>
        </Flex>

        <Space className="mt-4 md:mt-0">
          <Tooltip title={UI_TEXT.TOOLTIP_CURL}>
            <Button
              icon={<CodeOutlined />}
              onClick={() => executeCopyToClipboard(curlString)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              {UI_TEXT.BTN_COPY_CURL}
            </Button>
          </Tooltip>
          <Tooltip title={UI_TEXT.TOOLTIP_JSON}>
            <Button
              type="primary"
              ghost
              icon={<CopyOutlined />}
              onClick={() => executeCopyToClipboard(jsonString)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              {UI_TEXT.BTN_COPY_JSON}
            </Button>
          </Tooltip>
        </Space>
      </Flex>

      <div
        className="relative group p-4 rounded-2xl mb-6 overflow-hidden border border-solid"
        style={{
          background: "black",
          borderColor: token.colorBorderSecondary,
        }}
      >
        <Input.TextArea
          value={jsonString}
          readOnly
          autoSize={{ minRows: 10, maxRows: 30 }}
          style={{
            background: "black",
            border: "none",
            fontFamily: "'Fira Code', 'Monaco', 'Cascadia Code', monospace",
            fontSize: 13,
            color: isDark ? "#FFF" : "#312E81",
          }}
        />
      </div>

      <div
        className="p-4 rounded-2xl flex items-center justify-between"
        style={{
          background: isDataFound
            ? addAlpha(token.colorSuccess, 0.05)
            : addAlpha(token.colorWarning, 0.05),
          border: `1px solid ${
            isDataFound
              ? addAlpha(token.colorSuccess, 0.2)
              : addAlpha(token.colorWarning, 0.2)
          }`,
        }}
      >
        <Space>
          <InfoCircleOutlined
            style={{
              color: isDataFound ? token.colorSuccess : token.colorWarning,
            }}
          />
          <Typography.Text strong>ข้อมูลสถานะบัตร:</Typography.Text>
        </Space>

        {isDataFound ? (
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
            bordered={false}
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            พบข้อมูลในระบบ
          </Tag>
        ) : (
          <Tag
            color="warning"
            icon={<WarningOutlined />}
            bordered={false}
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            ไม่พบข้อมูลในระบบ
          </Tag>
        )}
      </div>
    </motion.div>
  );
};

const TroubleshootingGuide: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div className="mt-8">
      <Flex align="center" gap={12} className="mb-6 px-4">
        <InfoCircleOutlined
          style={{ color: token.colorTextQuaternary, fontSize: 18 }}
        />
        <Typography.Text
          strong
          style={{
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: token.colorTextQuaternary,
          }}
        >
          คำแนะนำการแก้ปัญหาเบื้องต้น
        </Typography.Text>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div
            className="p-6 rounded-2xl border border-solid h-full"
            style={{
              background: addAlpha(token.colorWarning, 0.02),
              borderColor: addAlpha(token.colorWarning, 0.2),
            }}
          >
            <Flex gap={12} className="mb-4">
              <QuestionCircleOutlined
                style={{ color: token.colorWarning, fontSize: 20 }}
              />
              <Typography.Text strong style={{ fontSize: 16 }}>
                กรณีค้นหาแล้วไม่พบข้อมูล
              </Typography.Text>
            </Flex>
            <ul className="space-y-2 opacity-80 text-sm pl-8">
              <li>
                ระบบจะคืนค่าสถานะเป็น <code>'not have number id'</code>
              </li>
              <li>
                ตรวจสอบว่าเลือก{" "}
                <Typography.Text strong>โรงเรียน</Typography.Text>{" "}
                ถูกต้องตามสังกัดหรือไม่
              </li>
              <li>
                ตรวจสอบเลข <Typography.Text strong>UID</Typography.Text>{" "}
                ของบัตรว่าถูกต้องครบถ้วน
              </li>
            </ul>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div
            className="p-6 rounded-2xl border border-solid h-full"
            style={{
              background: addAlpha(token.colorInfo, 0.02),
              borderColor: addAlpha(token.colorInfo, 0.2),
            }}
          >
            <Flex gap={12} className="mb-4">
              <RocketOutlined
                style={{ color: token.colorInfo, fontSize: 20 }}
              />
              <Typography.Text strong style={{ fontSize: 16 }}>
                กรณีข้อมูลไม่ตรงกับหน้าเว็บ Canteen
              </Typography.Text>
            </Flex>
            <ul className="space-y-2 opacity-80 text-sm pl-8">
              <li>หาก API เจอข้อมูล แต่หน้าเว็บ Canteen ไม่เจอ</li>
              <li>
                อาจเกิดจากปัญหา{" "}
                <Typography.Text strong>
                  Memory Sharing / Caching
                </Typography.Text>
              </li>
              <li>ให้แจ้งทีม Developer (Vimal) พร้อมแนบ cURL เพื่อตรวจสอบ</li>
            </ul>
          </div>
        </Col>
      </Row>
    </div>
  );
};

// ==================== Main Page Component ====================

const NFCCardSearchPage: React.FC = () => {
  const reduxDispatch = useDispatch<AppDispatch>();
  const formattedSchoolOptions = useSchoolListOptions();
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  const {
    searchForm,
    isSearchLoading,
    searchResultData,
    handleSearchSubmit,
    handleResetForm,
  } = useNFCSearchLogic();

  useEffect(() => {
    reduxDispatch(FetchSchoolListAction());
  }, [reduxDispatch]);

  return (
    <DashboardLayout>
      <Spin
        spinning={isSearchLoading}
        size="large"
        tip="กำลังเชื่อมต่อฐานข้อมูล..."
      >
        <div className="w-full max-w-6xl mx-auto py-4 space-y-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 rounded-[32px] border border-solid overflow-hidden relative"
            style={{
              background: isDark
                ? `linear-gradient(135deg, ${
                    token.colorBgContainer
                  } 0%, ${addAlpha(token.colorPrimary, 0.05)} 100%)`
                : `linear-gradient(135deg, #fff 0%, ${addAlpha(
                    token.colorPrimary,
                    0.03
                  )} 100%)`,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <div
              className="absolute -right-20 -top-20 opacity-[0.03] transition-opacity pointer-events-none"
              style={{ fontSize: "300px", color: token.colorPrimary }}
            >
              <ScanOutlined />
            </div>

            <Space size={24} align="center">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                  color: "#fff",
                }}
              >
                <CreditCardOutlined style={{ fontSize: 32 }} />
              </div>
              <div>
                <Typography.Title
                  level={2}
                  style={{
                    margin: 0,
                    fontWeight: 900,
                    letterSpacing: "-1px",
                    fontSize: 28,
                  }}
                >
                  {UI_TEXT.TITLE}
                </Typography.Title>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  {UI_TEXT.SUBTITLE}
                </Typography.Text>
              </div>
            </Space>

            <Tag
              color="blue"
              style={{
                borderRadius: 20,
                padding: "4px 16px",
                fontWeight: 600,
                border: "none",
                background: addAlpha(token.colorInfo, 0.1),
                color: token.colorInfo,
              }}
            >
              Vimal System Engine
            </Tag>
          </motion.div>

          {/* Form & Results Container */}
          <div className="space-y-6">
            <SearchCriteriaForm
              formInstance={searchForm}
              schoolOptions={formattedSchoolOptions}
              isLoading={isSearchLoading}
              onFinish={handleSearchSubmit}
              onReset={handleResetForm}
            />

            <AnimatePresence mode="wait">
              <SearchResultDisplay
                key={searchResultData ? "result" : "empty"}
                resultData={searchResultData}
              />
            </AnimatePresence>

            <TroubleshootingGuide />
          </div>
        </div>
      </Spin>
    </DashboardLayout>
  );
};

export default NFCCardSearchPage;
