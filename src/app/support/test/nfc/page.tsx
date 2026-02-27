"use client";

import React, { useEffect, useCallback, useMemo, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CallAPI as SearchNFCCardAction } from "@/stores/actions/form-card-nfc-action";
import { CallAPI as FetchSchoolListAction } from "@/stores/actions/call-school-list";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Empty,
  Typography,
  theme,
  Flex,
  Tag,
} from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  CopyOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RocketOutlined,
  QuestionCircleOutlined,
  CreditCardOutlined,
  HomeOutlined,
  ScanOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  StatusModalComponent,
  StatusModalType,
} from "@/components/modal/status-modal-component";

const { Text, Title } = Typography;

/**
 * Interface definition for NFC Search Form values
 */
interface NFCSearchFormValues {
  nfcCardId: string;
  schoolId: string;
}

/**
 * Interface definition for School Dropdown options
 */
interface SchoolDropdownOption {
  label: string;
  value: string;
}

/**
 * UI Text constants in 100% Thai as per standard
 */
const UI_TEXT = {
  TITLE: "ตรวจสอบข้อมูลบัตรเอ็นเอฟซี",
  SUBTITLE:
    "เครื่องมือสำหรับเจ้าหน้าที่ในการตรวจสอบสถานะบัตรนักเรียนผ่านระบบส่วนกลาง",
  LABEL_SCHOOL: "โรงเรียนที่ต้องการตรวจสอบ",
  LABEL_NFC: "รหัสบัตรประจำตัว",
  BTN_SUBMIT: "ค้นหาข้อมูล",
  BTN_RESET: "ล้างการค้นหา",
  BTN_COPY_CURL: "คัดลอกคำสั่งระบบ",
  BTN_COPY_JSON: "คัดลอกข้อมูลดิบ",
  PLACEHOLDER_SCHOOL: "เลือกโรงเรียน...",
  PLACEHOLDER_NFC: "ระบุรหัสบัตรที่ต้องการตรวจสอบ",
  DATA_FOUND: "พบข้อมูลในระบบ",
  DATA_NOT_FOUND: "ไม่พบข้อมูลในระบบ",
  TROUBLESHOOTING_TITLE: "คำแนะนำการแก้ปัญหาเบื้องต้น",
  TROUBLE_NOT_FOUND_TITLE: "กรณีไม่พบข้อมูล",
  TROUBLE_NOT_FOUND_DESC_1: "ระบบจะแจ้งสถานะว่าไม่พบเลขรหัสในฐานข้อมูล",
  TROUBLE_NOT_FOUND_DESC_2: "ตรวจสอบการเลือกโรงเรียนให้ถูกต้องตามสังกัด",
  TROUBLE_SYNC_TITLE: "กรณีข้อมูลไม่ตรงกับหน้าเว็บบริหารจัดการ",
  TROUBLE_SYNC_DESC_1: "หากระบบหลักพบข้อมูลแต่หน้าเว็บไม่แสดงผล",
  TROUBLE_SYNC_DESC_2: "อาจเกิดจากปัญหาการหน่วงของหน่วยความจำชั่วคราว",
  TROUBLE_SYNC_DESC_3: "โปรดแจ้งเจ้าหน้าที่ฝ่ายพัฒนาพร้อมแนบชุดค่าสั่งนี้",
};

/**
 * Custom hook for modern status modal management
 */
const useStatusModal = () => {
  const [modalState, setModalState] = useState<{
    open: boolean;
    type: StatusModalType;
    title: string;
    message: string;
    errorDetails?: any;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const showSuccess = (title: string, message: string) => {
    setModalState({ open: true, type: "success", title, message });
  };

  const showError = (title: string, message: string, errorDetails?: any) => {
    setModalState({ open: true, type: "error", title, message, errorDetails });
  };

  const closePortal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
  };

  return { modalState, showSuccess, showError, closePortal };
};

/**
 * Custom hook to get and format school list from Redux
 */
const useSchoolOptions = () => {
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

/**
 * Custom hook for NFC search business logic
 */
const useSearchHandler = (
  onSuccess: (t: string, m: string) => void,
  onError: (t: string, m: string, e?: any) => void,
) => {
  const dispatch = useDispatch<AppDispatch>();
  const nfcSearchState = useAppSelector((state) => state.formCardNfc);
  const [searchForm] = Form.useForm();

  const handleSearch = useCallback(
    async (formValues: NFCSearchFormValues) => {
      try {
        const payload = {
          nfc_card: formValues.nfcCardId,
          school_id: formValues.schoolId,
        };

        await dispatch(SearchNFCCardAction({ draftValues: payload })).unwrap();
        onSuccess("ดึงข้อมูลสำเร็จ", "ระบบตรวจสอบข้อมูลและแสดงผลเรียบร้อยแล้ว");
      } catch (error: any) {
        onError(
          "การสืบค้นล้มเหลว",
          "ไม่สามารถดึงข้อมูลจากระบบ Vimal ได้ โปรดลองใหม่อีกครั้ง",
          error,
        );
      }
    },
    [dispatch, onSuccess, onError],
  );

  const resetSearch = useCallback(() => {
    searchForm.resetFields();
  }, [searchForm]);

  return {
    searchForm,
    isLoading: nfcSearchState.loading,
    searchResult: nfcSearchState.response.data,
    handleSearch,
    resetSearch,
  };
};

/**
 * Sub-component for the Search Criteria Form
 */
const SearchCriteriaSection: React.FC<{
  formInstance: any;
  schoolOptions: SchoolDropdownOption[];
  isLoading: boolean;
  onFinish: (values: NFCSearchFormValues) => void;
  onReset: () => void;
}> = ({ formInstance, schoolOptions, isLoading, onFinish, onReset }) => {
  const { token } = theme.useToken();

  return (
    <Card styles={{ body: { padding: token.paddingLG } }}>
      <Flex vertical gap="large">
        <Flex align="center" gap="middle">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 48,
              height: 48,
              borderRadius: token.borderRadiusLG,
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
              color: token.colorWhite,
              fontSize: 20,
            }}
          >
            <SearchOutlined />
          </Flex>
          <Flex vertical>
            <Title level={4} style={{ margin: 0 }}>
              ระบุสถานะข้อมูลที่ต้องการตรวจสอบ
            </Title>
            <Text type="secondary">
              กรอกข้อมูลเพื่อเชื่อมต่อและตรวจสอบสถานะบัตรจากฐานข้อมูลส่วนกลาง
            </Text>
          </Flex>
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
                  <Space>
                    <HomeOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>{UI_TEXT.LABEL_SCHOOL}</Text>
                  </Space>
                }
                rules={[{ required: true, message: "โปรดเลือกโรงเรียน" }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder={UI_TEXT.PLACEHOLDER_SCHOOL}
                  options={schoolOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="nfcCardId"
                label={
                  <Space>
                    <CreditCardOutlined style={{ color: token.colorInfo }} />
                    <Text strong>{UI_TEXT.LABEL_NFC}</Text>
                  </Space>
                }
                rules={[
                  { required: true, message: "โปรดระบุรหัสบัตรประจำตัว" },
                ]}
              >
                <Input
                  placeholder={UI_TEXT.PLACEHOLDER_NFC}
                  allowClear
                  prefix={<ScanOutlined style={{ color: token.colorInfo }} />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Flex justify="flex-end" gap="middle">
            <Button
              size="large"
              icon={<ClearOutlined />}
              onClick={onReset}
              disabled={isLoading}
            >
              {UI_TEXT.BTN_RESET}
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              icon={<SearchOutlined />}
              loading={isLoading}
            >
              {UI_TEXT.BTN_SUBMIT}
            </Button>
          </Flex>
        </Form>
      </Flex>
    </Card>
  );
};

/**
 * Sub-component for result display
 */
const SearchResultSection: React.FC<{
  resultData: any;
}> = ({ resultData }) => {
  const { token } = theme.useToken();

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Silently fail if clipboard fails, as per standard keep logic clean
    }
  };

  if (!resultData) {
    return (
      <Card
        styles={{ body: { padding: 48 } }}
        style={{
          border: `1px dashed ${token.colorBorder}`,
          background: token.colorFillAlter,
          textAlign: "center",
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Flex vertical gap="small">
              <Text strong style={{ fontSize: 16 }}>
                ยังไม่มีข้อมูลการสืบค้น
              </Text>
              <Text type="secondary">
                โปรดเลือกโรงเรียนและระบุรหัสประจำตัวเพื่อเริ่มต้นการตรวจสอบ
              </Text>
            </Flex>
          }
        />
      </Card>
    );
  }

  const isDataFound = resultData?.data?.status !== "not have number id";
  const jsonOutput = JSON.stringify(resultData?.data, null, 2);
  const curlOutput = resultData?.curl?.toString() || "";

  return (
    <Card styles={{ body: { padding: token.paddingLG } }}>
      <Flex vertical gap="large">
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <Flex align="center" gap="middle">
            <Flex
              align="center"
              justify="center"
              style={{
                width: 40,
                height: 40,
                borderRadius: token.borderRadius,
                background: `${token.colorInfo}15`,
                color: token.colorInfo,
                fontSize: 20,
              }}
            >
              <CreditCardOutlined />
            </Flex>
            <Flex vertical>
              <Title level={4} style={{ margin: 0 }}>
                ข้อมูลผลลัพธ์จากการสืบค้น
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ชุดข้อมูลรายละเอียดสถานะปัจจุบันจากฐานข้อมูลระบบ
              </Text>
            </Flex>
          </Flex>

          <Space size="middle">
            <Button
              icon={<CodeOutlined />}
              onClick={() => handleCopy(curlOutput)}
            >
              {UI_TEXT.BTN_COPY_CURL}
            </Button>
            <Button
              type="primary"
              ghost
              icon={<CopyOutlined />}
              onClick={() => handleCopy(jsonOutput)}
            >
              {UI_TEXT.BTN_COPY_JSON}
            </Button>
          </Space>
        </Flex>

        <Card
          size="small"
          style={{
            background: token.colorBgBase,
            borderRadius: token.borderRadius,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
          styles={{ body: { padding: 12 } }}
        >
          <Input.TextArea
            value={jsonOutput}
            readOnly
            autoSize={{ minRows: 8, maxRows: 24 }}
            style={{
              background: "transparent",
              border: "none",
              fontFamily: "monospace",
              fontSize: 13,
              color: token.colorText,
              padding: 0,
            }}
          />
        </Card>

        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: token.padding,
            borderRadius: token.borderRadiusLG,
            background: isDataFound
              ? `${token.colorSuccess}10`
              : `${token.colorWarning}10`,
            border: `1px solid ${isDataFound ? token.colorSuccess : token.colorWarning}30`,
          }}
        >
          <Space>
            <InfoCircleOutlined
              style={{
                color: isDataFound ? token.colorSuccess : token.colorWarning,
              }}
            />
            <Text strong>สถานะบัตร:</Text>
          </Space>

          <Tag
            color={isDataFound ? "success" : "warning"}
            icon={isDataFound ? <CheckCircleOutlined /> : <WarningOutlined />}
            bordered={false}
            style={{
              paddingInline: 16,
              paddingBlock: 4,
              borderRadius: token.borderRadius,
              fontWeight: 600,
            }}
          >
            {isDataFound ? UI_TEXT.DATA_FOUND : UI_TEXT.DATA_NOT_FOUND}
          </Tag>
        </Flex>
      </Flex>
    </Card>
  );
};

/**
 * Sub-component for Troubleshooting Guide
 */
const TroubleshootingSection: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <Card
      styles={{ body: { padding: token.paddingLG } }}
      style={{
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex vertical gap="middle">
        <Flex align="center" gap="small">
          <InfoCircleOutlined style={{ color: token.colorTextQuaternary }} />
          <Text
            strong
            style={{
              fontSize: 12,
              letterSpacing: "1px",
              color: token.colorTextQuaternary,
            }}
          >
            {UI_TEXT.TROUBLESHOOTING_TITLE.toUpperCase()}
          </Text>
        </Flex>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              styles={{ body: { padding: 16 } }}
              style={{
                background: `${token.colorWarning}08`,
                border: `1px solid ${token.colorWarning}20`,
                height: "100%",
              }}
            >
              <Flex vertical gap="small">
                <Space>
                  <QuestionCircleOutlined
                    style={{ color: token.colorWarning }}
                  />
                  <Text strong>{UI_TEXT.TROUBLE_NOT_FOUND_TITLE}</Text>
                </Space>
                <Flex
                  vertical
                  gap="x-small"
                  style={{ marginLeft: 24, opacity: 0.8, fontSize: 13 }}
                >
                  <Text>• {UI_TEXT.TROUBLE_NOT_FOUND_DESC_1}</Text>
                  <Text>• {UI_TEXT.TROUBLE_NOT_FOUND_DESC_2}</Text>
                </Flex>
              </Flex>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              size="small"
              styles={{ body: { padding: 16 } }}
              style={{
                background: `${token.colorInfo}08`,
                border: `1px solid ${token.colorInfo}20`,
                height: "100%",
              }}
            >
              <Flex vertical gap="small">
                <Space>
                  <RocketOutlined style={{ color: token.colorInfo }} />
                  <Text strong>{UI_TEXT.TROUBLE_SYNC_TITLE}</Text>
                </Space>
                <Flex
                  vertical
                  gap="x-small"
                  style={{ marginLeft: 24, opacity: 0.8, fontSize: 13 }}
                >
                  <Text>• {UI_TEXT.TROUBLE_SYNC_DESC_1}</Text>
                  <Text>• {UI_TEXT.TROUBLE_SYNC_DESC_2}</Text>
                  <Text>• {UI_TEXT.TROUBLE_SYNC_DESC_3}</Text>
                </Flex>
              </Flex>
            </Card>
          </Col>
        </Row>
      </Flex>
    </Card>
  );
};

/**
 * NFC Card Search Page Component
 */
export default function NFCCardSearchPage() {
  const dispatch = useDispatch<AppDispatch>();
  const schoolOptions = useSchoolOptions();
  const { modalState, showSuccess, showError, closePortal } = useStatusModal();

  const { searchForm, isLoading, searchResult, handleSearch, resetSearch } =
    useSearchHandler(showSuccess, showError);

  useEffect(() => {
    dispatch(FetchSchoolListAction());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <Flex
        vertical
        gap="large"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          paddingBottom: 48,
        }}
      >
        <HeaderBar
          icon={<ScanOutlined />}
          title={UI_TEXT.TITLE}
          subTitle={UI_TEXT.SUBTITLE}
        />

        <Flex vertical gap="large">
          <SearchCriteriaSection
            formInstance={searchForm}
            schoolOptions={schoolOptions}
            isLoading={isLoading}
            onFinish={handleSearch}
            onReset={resetSearch}
          />

          <SearchResultSection resultData={searchResult} />

          <TroubleshootingSection />
        </Flex>
      </Flex>

      <StatusModalComponent
        open={modalState.open}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={closePortal}
        errorDetails={modalState.errorDetails}
      />
    </DashboardLayout>
  );
}
