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
  Typography, // เพิ่ม Typography
} from "antd";
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

// ==================== Sub-Components ====================

const SearchCriteriaForm: React.FC<{
  formInstance: any;
  schoolOptions: SchoolDropdownOption[];
  isLoading: boolean;
  onFinish: (values: NFCSearchFormValues) => void;
  onReset: () => void;
}> = ({ formInstance, schoolOptions, isLoading, onFinish, onReset }) => (
  <Card
    className="shadow-sm rounded-lg"
    title={
      <Space>
        <SearchOutlined className="text-lg" />
        <span>เงื่อนไขการค้นหา</span>
      </Space>
    }
  >
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
                <HomeOutlined />
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
              <Space>
                <CreditCardOutlined />
                {UI_TEXT.LABEL_NFC}
              </Space>
            }
            rules={[{ required: true, message: "กรุณาระบุรหัสบัตร" }]}
            tooltip={UI_TEXT.TOOLTIP_NFC}
          >
            <Input
              placeholder={UI_TEXT.PLACEHOLDER_NFC}
              allowClear
              prefix={<ScanOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider className="my-4" />

      <Row justify="end">
        <Space>
          <Button
            icon={<ClearOutlined />}
            onClick={onReset}
            disabled={isLoading}
          >
            {UI_TEXT.BTN_RESET}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            loading={isLoading}
          >
            {UI_TEXT.BTN_SUBMIT}
          </Button>
        </Space>
      </Row>
    </Form>
  </Card>
);

const SearchResultDisplay: React.FC<{
  resultData: any;
}> = ({ resultData }) => {
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
      <Card className="shadow-sm rounded-lg">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="รอการค้นหาข้อมูล"
        >
          <div className="text-gray-400">
            กรุณากรอกข้อมูลด้านบนเพื่อเริ่มตรวจสอบ
          </div>
        </Empty>
      </Card>
    );
  }

  const isDataFound = resultData?.data?.status !== "not have number id";
  const jsonString = JSON.stringify(resultData?.data, null, 2);
  const curlString = resultData?.curl?.toString() || "";

  return (
    // ✅ 1. ลบ Badge.Ribbon ออก เพื่อแก้ปัญหาปุ่มทับกัน
    <Card
      className="shadow-sm rounded-lg"
      title={
        <Space>
          <ApiOutlined />
          <span>ผลลัพธ์จากระบบ (API Response)</span>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title={UI_TEXT.TOOLTIP_CURL}>
            <Button
              icon={<CodeOutlined />}
              size="small"
              onClick={() => executeCopyToClipboard(curlString)}
            >
              {UI_TEXT.BTN_COPY_CURL}
            </Button>
          </Tooltip>
          <Tooltip title={UI_TEXT.TOOLTIP_JSON}>
            <Button
              type="primary"
              ghost
              size="small"
              icon={<CopyOutlined />}
              onClick={() => executeCopyToClipboard(jsonString)}
            >
              {UI_TEXT.BTN_COPY_JSON}
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <div className="flex flex-col gap-4">
        <Input.TextArea
          value={jsonString}
          readOnly
          autoSize={{ minRows: 8, maxRows: 24 }}
          className="font-mono text-xs rounded-md"
        />

        {/* ✅ 2. ย้ายสถานะมาแสดงที่มุมขวาล่างแทน */}
        <div className="flex justify-end items-center">
          <Space>
            <Typography.Text type="secondary" className="text-xs">
              สถานะข้อมูล:
            </Typography.Text>
            {isDataFound ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                พบข้อมูล
              </Tag>
            ) : (
              <Tag color="warning" icon={<WarningOutlined />}>
                ไม่พบข้อมูล
              </Tag>
            )}
          </Space>
        </div>
      </div>
    </Card>
  );
};

const TroubleshootingGuide: React.FC = () => (
  <Card
    title={
      <Space>
        <InfoCircleOutlined />
        <span>คำแนะนำการแก้ปัญหาเบื้องต้น (Troubleshooting)</span>
      </Space>
    }
    bordered={false}
    className="shadow-none bg-transparent"
    size="small"
  >
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Alert
          message="กรณีค้นหาแล้วไม่พบข้อมูล"
          description={
            <ul className="list-disc pl-5 m-0">
              <li>
                ระบบจะคืนค่าสถานะเป็น <code>'not have number id'</code>
              </li>
              <li>
                ตรวจสอบว่าเลือก <b>โรงเรียน</b> ถูกต้องตามสังกัดหรือไม่
              </li>
              <li>
                ตรวจสอบเลข <b>UID</b> ของบัตรว่าถูกต้องครบถ้วน
              </li>
            </ul>
          }
          type="warning"
          showIcon
          icon={<QuestionCircleOutlined />}
          className="rounded-md"
        />
      </Col>
      <Col xs={24} md={12}>
        <Alert
          message="กรณีข้อมูลไม่ตรงกับหน้าเว็บ Canteen"
          description={
            <ul className="list-disc pl-5 m-0">
              <li>หาก API เจอข้อมูล แต่หน้าเว็บ Canteen ไม่เจอ</li>
              <li>
                อาจเกิดจากปัญหา <b>Memory Sharing / Caching</b>
              </li>
              <li>ให้แจ้งทีม Developer (Vimal) พร้อมแนบ cURL เพื่อตรวจสอบ</li>
            </ul>
          }
          type="info"
          showIcon
          icon={<RocketOutlined />}
          className="rounded-md"
        />
      </Col>
    </Row>
  </Card>
);

// ==================== Main Page Component ====================

const NFCCardSearchPage: React.FC = () => {
  const reduxDispatch = useDispatch<AppDispatch>();
  const formattedSchoolOptions = useSchoolListOptions();
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
        <Space direction="vertical" size="large" className="w-full">
          <HeaderBar
            title={UI_TEXT.TITLE}
            subTitle={UI_TEXT.SUBTITLE}
            icon={<FileTextOutlined />}
            color="none"
          />

          <SearchCriteriaForm
            formInstance={searchForm}
            schoolOptions={formattedSchoolOptions}
            isLoading={isSearchLoading}
            onFinish={handleSearchSubmit}
            onReset={handleResetForm}
          />

          <div className="animate-fade-in">
            <SearchResultDisplay resultData={searchResultData} />
          </div>

          <TroubleshootingGuide />
        </Space>
      </Spin>
    </DashboardLayout>
  );
};

export default NFCCardSearchPage;
