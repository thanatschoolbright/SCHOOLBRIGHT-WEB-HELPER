"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// import { useRouter } from "next/navigation"; // Uncomment if needed
import type { InputRef } from "antd";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Result,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  Skeleton,
  Spin,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import {
  AndroidOutlined,
  AppleOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  GlobalOutlined,
  LockOutlined,
  PlusOutlined,
  RocketOutlined,
  SearchOutlined,
  WindowsOutlined,
  LoadingOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "sonner";
import "dayjs/locale/th";

import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  DELETE_APPLICATION_VERSION,
  GET_APPLICATION_LIST,
  GET_APPLICATION_VERSION_BY_APPID,
  POST_CREATE_APPLICATION_VERSION,
  POST_UPDATE_APPLICATION_VERSION,
} from "@/app/hardware/canteen/canteen-api.helper";
import {
  buildSchoolOptions,
  copyToClipboard,
  validatePassword,
} from "@/app/hardware/canteen/canteen.helper";
import { useAppSelector } from "@stores/store";
import type {
  ApplicationRecord,
  SearchableColumnKey,
  TableColumn,
  VersionDataset,
  VersionFormValues,
  VersionRecord,
} from "@/types/canteen.type";

dayjs.locale("th"); // ตั้งค่าให้ dayjs ใช้ภาษาไทย

// ==================== Constants & Helpers ====================
const PASSWORD = "SB_ADMIN";
const PAGE_SIZE = 10;

const ENVIRONMENTS = [
  { label: "ใช้งานจริง (Production)", value: "Production", color: "green" },
  { label: "ทดสอบเบต้า (Beta)", value: "Beta", color: "orange" },
  { label: "กำลังพัฒนา (Development)", value: "Development", color: "blue" },
];

const FORM_STEPS = [
  { title: "ข้อมูลพื้นฐาน", description: "รายละเอียดเวอร์ชัน" },
  { title: "อัปโหลดไฟล์", description: "ไฟล์ .apk หรือ .zip" },
  { title: "การตั้งค่า", description: "กำหนดเงื่อนไขการอัปเดต" },
];

const getPlatformIcon = (type: string) => {
  const lower = type?.toLowerCase() || "";
  if (lower.includes("android"))
    return <AndroidOutlined style={{ color: "#3DDC84", fontSize: 18 }} />;
  if (lower.includes("ios") || lower.includes("apple"))
    return <AppleOutlined style={{ color: "#000000", fontSize: 18 }} />;
  if (lower.includes("windows"))
    return <WindowsOutlined style={{ color: "#0078D7", fontSize: 18 }} />;
  if (lower.includes("web"))
    return <GlobalOutlined style={{ color: "#1890ff", fontSize: 18 }} />;
  return <CodeOutlined style={{ fontSize: 18 }} />;
};

const getEnvColor = (env: string) => {
  return ENVIRONMENTS.find((e) => e.value === env)?.color || "default";
};

// ==================== Custom Hooks ====================

const usePasswordProtection = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestAccess = useCallback(
    (callback: () => void) => {
      if (isAuthenticated) {
        callback();
      } else {
        setPendingAction(() => callback);
        setModalVisible(true);
      }
    },
    [isAuthenticated]
  );

  const handleSubmit = useCallback(() => {
    if (validatePassword(password, PASSWORD)) {
      setIsAuthenticated(true);
      setModalVisible(false);
      setPassword("");
      toast.success("ยืนยันตัวตนสำเร็จ");
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
    }
  }, [password, pendingAction]);

  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setPassword("");
    setError("");
    setPendingAction(null);
  }, []);

  return {
    isAuthenticated,
    modalVisible,
    password,
    error,
    setPassword,
    setError,
    requestAccess,
    handleSubmit,
    handleCancel,
  };
};

const useColumnSearch = <T,>(
  searchInputRefs: React.MutableRefObject<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >
) =>
  useCallback(
    (dataIndex: SearchableColumnKey, title: string): TableColumn<T> => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        const value = (selectedKeys[0] as string | undefined) ?? "";
        return (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              ref={(node) => {
                searchInputRefs.current[dataIndex] = node as InputRef;
              }}
              placeholder={`ค้นหา ${title}`}
              value={value}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                ค้นหา
              </Button>
              <Button
                onClick={() => {
                  clearFilters?.();
                  confirm({ closeDropdown: true });
                }}
                size="small"
                style={{ width: 90 }}
              >
                รีเซ็ต
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const raw = (record as any)[dataIndex];
        return raw
          ? String(raw).toLowerCase().includes(String(value).toLowerCase())
          : false;
      },
    }),
    [searchInputRefs]
  );

const useApplications = () => {
  const [list, setList] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GET_APPLICATION_LIST();
      setList(response?.data?.data ?? []);
    } catch (error: any) {
      toast.error(error?.message ?? "โหลดรายการแอปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { list, loading, selected, setSelected };
};

const useVersions = (appId?: string | number, shouldLoad?: boolean) => {
  const [dataset, setDataset] = useState<VersionDataset>({
    data: [],
    loading: false,
    curl: "",
  });
  const load = useCallback(async (id: string | number) => {
    setDataset((prev) => ({ ...prev, loading: true }));
    try {
      const response = await GET_APPLICATION_VERSION_BY_APPID(id);
      setDataset({
        data: response?.data?.data ?? [],
        loading: false,
        curl: response?.curl ?? "",
      });
    } catch (error: any) {
      setDataset((prev) => ({ ...prev, loading: false }));
      toast.error("โหลดเวอร์ชันไม่สำเร็จ");
    }
  }, []);
  useEffect(() => {
    if (appId && shouldLoad) load(appId);
  }, [appId, shouldLoad, load]);
  return { dataset, load };
};

// ==================== Sub-Components ====================

const PasswordModal: React.FC<ReturnType<typeof usePasswordProtection>> = (
  props
) => (
  <Modal
    title={
      <Space>
        <LockOutlined style={{ color: "#faad14" }} />
        <span style={{ fontWeight: 600 }}>ยืนยันสิทธิ์ผู้ดูแลระบบ</span>
      </Space>
    }
    open={props.modalVisible}
    onCancel={props.handleCancel}
    footer={null}
    width={400}
    centered
    styles={{ body: { paddingBottom: 8 } }}
  >
    <Space
      direction="vertical"
      size="large"
      style={{ width: "100%", paddingTop: 24 }}
    >
      <div>
        <Typography.Text type="secondary">
          ระบบต้องการการยืนยันตัวตนเพื่อดำเนินการต่อ
        </Typography.Text>
        <Input.Password
          placeholder="กรุณากรอกรหัสผ่าน"
          value={props.password}
          onChange={(e) => {
            props.setPassword(e.target.value);
            props.setError("");
          }}
          onPressEnter={props.handleSubmit}
          status={props.error ? "error" : ""}
          style={{ marginTop: 12 }}
          autoFocus
          size="large"
          prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
        />
        {props.error && (
          <Typography.Text
            type="danger"
            style={{ fontSize: 13, marginTop: 4, display: "block" }}
          >
            {props.error}
          </Typography.Text>
        )}
      </div>
      <Flex justify="end" gap="small" style={{ marginTop: 8 }}>
        <Button onClick={props.handleCancel} size="large">
          ยกเลิก
        </Button>
        <Button
          type="primary"
          onClick={props.handleSubmit}
          disabled={!props.password}
          size="large"
        >
          ยืนยัน
        </Button>
      </Flex>
    </Space>
  </Modal>
);

// --- Component: Process Result Modal ---
interface ProcessResultModalProps {
  status: "idle" | "loading" | "success" | "error";
  onClose: () => void;
  message?: string;
  data?: any; // API Response Data
}

const ProcessResultModal: React.FC<ProcessResultModalProps> = ({
  status,
  onClose,
  message,
  data,
}) => {
  const versionData = data?.data?.data?.[0] || null;
  const curlCommand = data?.curl || "";

  return (
    <Modal
      open={status !== "idle"}
      footer={null}
      closable={status !== "loading"}
      onCancel={status !== "loading" ? onClose : undefined}
      centered
      maskClosable={false}
      width={600}
    >
      {status === "loading" && (
        <Flex vertical align="center" gap="large" style={{ padding: 48 }}>
          <Spin
            indicator={
              <LoadingOutlined
                style={{ fontSize: 54, color: "#1890ff" }}
                spin
              />
            }
          />
          <Typography.Title level={4} style={{ margin: 0 }}>
            กำลังบันทึกข้อมูล...
          </Typography.Title>
          <Typography.Text type="secondary">
            กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้จนกว่าจะเสร็จสิ้น
          </Typography.Text>
        </Flex>
      )}

      {status === "success" && (
        <Result
          status="success"
          title="ดำเนินการสำเร็จ"
          subTitle={message || "ข้อมูลถูกบันทึกเรียบร้อยแล้ว"}
          extra={[
            <Button type="primary" key="console" onClick={onClose} size="large">
              ตกลง, รับทราบ
            </Button>,
          ]}
          style={{ padding: "24px 0 0 0" }}
        >
          {versionData && (
            <div
              style={{
                marginTop: 24,
                textAlign: "left",
                background: "#f8fafc",
                padding: 20,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              <Descriptions
                title={
                  <Typography.Text strong>สรุปข้อมูลเวอร์ชัน</Typography.Text>
                }
                bordered
                column={1}
                size="small"
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <Descriptions.Item label="ชื่อเวอร์ชัน">
                  <Typography.Text strong style={{ color: "#1890ff" }}>
                    {versionData.version_name}
                  </Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="สภาพแวดล้อม">
                  <Tag color={getEnvColor(versionData.env)}>
                    {versionData.env}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="สถานะ">
                  <Space>
                    {versionData.is_lastest_version && (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        ล่าสุด (Latest)
                      </Tag>
                    )}
                    {versionData.force_update && (
                      <Tag color="red" icon={<ExclamationCircleOutlined />}>
                        บังคับอัปเดต (Force)
                      </Tag>
                    )}
                    {!versionData.is_lastest_version &&
                      !versionData.force_update &&
                      "อัปเดตทั่วไป"}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="ลิงก์ดาวน์โหลด">
                  <Typography.Paragraph
                    copyable={{ text: versionData.url }}
                    style={{ marginBottom: 0, fontSize: 13, color: "#64748b" }}
                    ellipsis={{
                      rows: 1,
                      expandable: true,
                      symbol: "ดูเพิ่มเติม",
                    }}
                  >
                    {versionData.url}
                  </Typography.Paragraph>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Result>
      )}

      {status === "error" && (
        <Result
          status="error"
          title="เกิดข้อผิดพลาด"
          subTitle={message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"}
          extra={[
            <Button key="buy" onClick={onClose} size="large">
              ปิดหน้าต่าง
            </Button>,
          ]}
        />
      )}
    </Modal>
  );
};

// --- Component: Version Form Steps ---
const VersionFormSteps: React.FC<{
  currentStep: number;
  mode: "add" | "edit";
  schoolOptions: any[];
  applicationList: ApplicationRecord[];
  onFileChange: (info: UploadChangeParam<UploadFile>) => void;
}> = ({ currentStep, mode, schoolOptions, applicationList, onFileChange }) => (
  <>
    <Steps
      current={currentStep}
      items={FORM_STEPS}
      style={{ marginBottom: 32, padding: "0 24px" }}
      size="small"
    />

    <div style={{ minHeight: 320, padding: "0 12px" }}>
      {/* Step 0: Basic Info */}
      <div style={{ display: currentStep === 0 ? "block" : "none" }}>
        <Row gutter={[24, 8]}>
          <Col span={24} style={{ marginBottom: 16 }}>
            <Alert
              message="คำแนะนำ"
              description="กรุณาระบุข้อมูลเวอร์ชันให้ครบถ้วน เพื่อความถูกต้องในการใช้งาน"
              type="info"
              showIcon
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col span={24} md={12}>
            <Form.Item label="โรงเรียนเป้าหมาย" name="schoolID">
              <Select
                allowClear
                placeholder="เลือกโรงเรียน (ว่างไว้หากใช้กับทุกโรงเรียน)"
                options={schoolOptions}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={24} md={12}>
            <Form.Item
              label="แอปพลิเคชัน"
              name="appID"
              rules={[{ required: true, message: "กรุณาเลือกแอปพลิเคชัน" }]}
            >
              <Select
                placeholder="เลือกแอปพลิเคชัน"
                disabled={mode === "edit"}
                options={applicationList.map((item) => ({
                  label: item.app_name,
                  value: String(item.app_id),
                }))}
                size="large"
              />
            </Form.Item>
          </Col>
          {mode === "edit" && (
            <Col span={24} md={12}>
              <Form.Item label="รหัสเวอร์ชัน (Version ID)" name="versionID">
                <Input disabled size="large" />
              </Form.Item>
            </Col>
          )}
          <Col span={24} md={12}>
            <Form.Item
              label="ชื่อเวอร์ชัน (Version Name)"
              name="versionName"
              rules={[{ required: true, message: "กรุณาระบุชื่อเวอร์ชัน" }]}
            >
              <Input
                placeholder="เช่น 1.0.0"
                prefix={
                  <Tag color="blue" style={{ marginRight: 8 }}>
                    v
                  </Tag>
                }
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={24} md={12}>
            <Form.Item
              label="สภาพแวดล้อม (Environment)"
              name="env"
              rules={[{ required: true, message: "กรุณาเลือกสภาพแวดล้อม" }]}
            >
              <Select
                placeholder="เลือกสภาพแวดล้อม"
                options={ENVIRONMENTS}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="หมายเหตุ (Note)" name="note">
              <Input.TextArea
                rows={4}
                placeholder="รายละเอียดเพิ่มเติม หรือ Release Notes..."
                showCount
                maxLength={255}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Step 1: File Upload */}
      <div style={{ display: currentStep === 1 ? "block" : "none" }}>
        <Form.Item
          name="file"
          valuePropName="fileList"
          getValueFromEvent={(e: any) => (Array.isArray(e) ? e : e?.fileList)}
          rules={[
            { required: mode === "add", message: "กรุณาอัปโหลดไฟล์ติดตั้ง" },
          ]}
        >
          <Upload.Dragger
            beforeUpload={() => false}
            maxCount={1}
            onChange={onFileChange}
            accept=".apk,.zip"
            height={280}
            style={{ borderRadius: 12, border: "2px dashed #d9d9d9" }}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ color: "#1890ff" }} />
            </p>
            <p
              className="ant-upload-text"
              style={{ fontSize: 16, fontWeight: 500 }}
            >
              คลิกหรือลากไฟล์มาวางที่นี่เพื่ออัปโหลด
            </p>
            <p className="ant-upload-hint" style={{ color: "#94a3b8" }}>
              รองรับไฟล์นามสกุล <b>.apk</b> หรือ <b>.zip</b> เท่านั้น
            </p>
          </Upload.Dragger>
        </Form.Item>
      </div>

      {/* Step 2: Config */}
      <div style={{ display: currentStep === 2 ? "block" : "none" }}>
        <Flex vertical gap="middle">
          <Alert
            message="ตรวจสอบการตั้งค่า"
            description="การตั้งค่าเหล่านี้จะมีผลต่อผู้ใช้งานทันทีที่บันทึก"
            type="warning"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />

          <Card
            size="small"
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              cursor: "default",
            }}
          >
            <Flex justify="space-between" align="center">
              <span>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  ตั้งเป็นเวอร์ชันล่าสุด (Latest Version)
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  ผู้ใช้งานจะเห็นเวอร์ชันนี้เป็นตัวล่าสุดในระบบ
                </Typography.Text>
              </span>
              <Form.Item name="isLatestVersion" valuePropName="checked" noStyle>
                <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
              </Form.Item>
            </Flex>
          </Card>

          <Card
            size="small"
            hoverable
            style={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              cursor: "default",
            }}
          >
            <Flex justify="space-between" align="center">
              <span>
                <Typography.Text
                  strong
                  style={{ fontSize: 16, color: "#cf1322" }}
                >
                  บังคับอัปเดต (Force Update)
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  บังคับให้ผู้ใช้งานต้องอัปเดตแอปทันทีจึงจะใช้งานต่อได้
                </Typography.Text>
              </span>
              <Form.Item name="forceUpdate" valuePropName="checked" noStyle>
                <Switch
                  checkedChildren="บังคับ"
                  unCheckedChildren="ไม่บังคับ"
                  style={{ background: "#ff4d4f" }}
                />
              </Form.Item>
            </Flex>
          </Card>
        </Flex>
      </div>
    </div>
  </>
);

// ==================== Main Page Component ====================

export default function CanteenAppManager() {
  const { token } = theme.useToken();
  const schoolState = useAppSelector((state) => state.callSchoolList);

  const auth = usePasswordProtection();
  const applications = useApplications();

  // States
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [versionFormVisible, setVersionFormVisible] = useState(false);
  const [versionFormMode, setVersionFormMode] = useState<"add" | "edit">("add");
  const [currentStep, setCurrentStep] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<VersionRecord | null>(null);

  // Submit Result Logic
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitResultData, setSubmitResultData] = useState<any>(null);

  const versions = useVersions(applications.selected?.app_id, drawerVisible);
  const [versionForm] = Form.useForm<VersionFormValues>();
  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  // Helpers
  const getColumnSearchProps =
    useColumnSearch<ApplicationRecord>(searchInputRefs);
  const getVersionColumnSearchProps =
    useColumnSearch<VersionRecord>(searchInputRefs);
  const schoolOptions = useMemo(
    () => buildSchoolOptions(schoolState?.response?.data ?? []),
    [schoolState]
  );

  // Actions
  const openVersionDrawer = (record: ApplicationRecord) => {
    applications.setSelected(record);
    setDrawerVisible(true);
  };

  const handleAddVersionClick = () => {
    auth.requestAccess(() => {
      openVersionForm("add");
    });
  };

  const handleEditVersionClick = (record: VersionRecord) => {
    auth.requestAccess(() => {
      openVersionForm("edit", record);
    });
  };

  const handleDeleteVersionClick = (record: VersionRecord) => {
    auth.requestAccess(() => {
      setDeleteTarget(record);
    });
  };

  const openVersionForm = (mode: "add" | "edit", version?: VersionRecord) => {
    setVersionFormMode(mode);
    setCurrentStep(0);
    versionForm.resetFields();

    const baseValues = {
      appID: String(applications.selected?.app_id ?? ""),
      isLatestVersion: false,
      forceUpdate: false,
      file: null,
      schoolID: undefined,
    };

    if (mode === "edit" && version) {
      versionForm.setFieldsValue({
        ...baseValues,
        versionID: String(version.version_id),
        versionName: version.version_name,
        env: version.env,
        note: version.note,
        isLatestVersion: version.is_lastest_version === 1,
        forceUpdate: version.force_update === 1,
      });
    } else {
      versionForm.setFieldsValue(baseValues);
    }
    setVersionFormVisible(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await versionForm.validateFields();

      setVersionFormVisible(false);
      setSubmitStatus("loading");
      setSubmitResultData(null);

      const formData = new FormData();
      if (values.schoolID)
        formData.append("school_id", String(values.schoolID));
      formData.append("app_id", String(values.appID));
      if (values.versionID)
        formData.append("version_id", String(values.versionID));
      formData.append("version_name", String(values.versionName));
      formData.append("env", String(values.env));
      formData.append("note", values.note || "");
      formData.append("is_lastest_version", values.isLatestVersion ? "1" : "0");
      formData.append("force_update", values.forceUpdate ? "1" : "0");

      if (values.file && values.file.length > 0) {
        const fileOrigin = values.file[0].originFileObj;
        if (fileOrigin) {
          formData.append("file", fileOrigin);
        }
      }

      const apiCall =
        versionFormMode === "add"
          ? POST_CREATE_APPLICATION_VERSION
          : POST_UPDATE_APPLICATION_VERSION;
      const response = await apiCall(formData);

      const statusCheck =
        response?.data?.data?.status || response?.data?.status;

      if (statusCheck === "failed") {
        setSubmitResultData(response.data);
        throw new Error(
          response.data.message ||
            response.data.data?.message ||
            "การดำเนินการล้มเหลว (Status: Failed)"
        );
      }

      setSubmitResultData(response.data);
      setSubmitStatus("success");
      setSubmitMessage(response?.data?.message ?? "บันทึกข้อมูลสำเร็จ");

      if (applications.selected) versions.load(applications.selected.app_id);
    } catch (error: any) {
      console.error("Submit Error:", error);
      setSubmitStatus("error");
      const errorMsg =
        error.message ||
        error?.response?.data?.message ||
        "เกิดข้อผิดพลาดในการบันทึก";
      setSubmitMessage(errorMsg);

      if (error?.response?.data) {
        setSubmitResultData(error.response.data);
      }
    }
  };

  const handleProcessModalClose = () => {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setSubmitResultData(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading("กำลังลบข้อมูล...");
    try {
      const response = await DELETE_APPLICATION_VERSION(
        deleteTarget.version_id
      );

      const statusCheck =
        response?.data?.data?.status || response?.data?.status;
      if (statusCheck === "failed") {
        throw new Error(response.data.message || "ลบไม่สำเร็จ");
      }

      toast.success("ลบเวอร์ชันเรียบร้อยแล้ว", { id: toastId });
      setDeleteTarget(null);
      if (applications.selected) versions.load(applications.selected.app_id);
    } catch (error: any) {
      toast.error(
        error.message || error?.response?.data?.message || "ลบไม่สำเร็จ",
        { id: toastId }
      );
    }
  };

  // Table Columns
  const appColumns: ColumnsType<ApplicationRecord> = [
    {
      title: "ชื่อแอปพลิเคชัน (App Name)",
      dataIndex: "app_name",
      width: 250,
      render: (text, record) => (
        <Space align="center">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: token.colorFillSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getPlatformIcon(record.app_type)}
          </div>
          <Typography.Text strong style={{ fontSize: 15 }}>
            {text}
          </Typography.Text>
        </Space>
      ),
      sorter: (a, b) => a.app_name.localeCompare(b.app_name),
      ...getColumnSearchProps("app_name", "ชื่อแอป"),
    },
    {
      title: "รหัสแอป (App ID)",
      dataIndex: "app_id",
      width: 150,
      render: (text) => (
        <Typography.Text type="secondary" code>
          {text}
        </Typography.Text>
      ),
      ...getColumnSearchProps("app_id", "ID"),
    },
    {
      title: "แพลตฟอร์ม (Platform)",
      dataIndex: "app_type",
      width: 150,
      align: "center",
      render: (text) => <Tag>{text}</Tag>,
      filters: applications.list
        .map((i) => ({ text: i.app_type, value: i.app_type }))
        .filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i),
      onFilter: (value, record) => record.app_type === value,
    },
    {
      title: "ดำเนินการ",
      key: "action",
      align: "center",
      width: 140,
      render: (_, record) => (
        <Button
          type="default"
          size="middle"
          icon={<EyeOutlined />}
          onClick={() => openVersionDrawer(record)}
          style={{ borderRadius: 6 }}
        >
          ดูประวัติเวอร์ชัน
        </Button>
      ),
    },
  ];

  const versionColumns: ColumnsType<VersionRecord> = [
    {
      title: "เวอร์ชัน",
      dataIndex: "version_name",
      width: 140,
      fixed: "left",
      render: (text, record) => (
        <Space>
          <AppstoreOutlined style={{ color: token.colorTextTertiary }} />
          <Badge
            dot
            status={record.is_lastest_version ? "success" : "default"}
            offset={[5, -2]}
          >
            <Typography.Text strong>{text}</Typography.Text>
          </Badge>
        </Space>
      ),
      sorter: (a, b) => a.version_name.localeCompare(b.version_name),
      ...getVersionColumnSearchProps("version_name", "เวอร์ชัน"),
    },
    {
      title: "สภาพแวดล้อม",
      dataIndex: "env",
      width: 130,
      render: (text) => (
        <Tag color={getEnvColor(text)} style={{ borderRadius: 12 }}>
          {text}
        </Tag>
      ),
      filters: ENVIRONMENTS.map((e) => ({ text: e.label, value: e.value })),
      onFilter: (value, record) => record.env === value,
    },
    {
      title: "วันที่อัปเดต",
      dataIndex: "updated_at",
      width: 180,
      render: (val) => (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {val ? dayjs(val).format("D MMM BBBB HH:mm") : "-"}
        </Typography.Text>
      ),
      sorter: (a, b) =>
        dayjs(a.updated_at).valueOf() - dayjs(b.updated_at).valueOf(),
    },
    {
      title: "หมายเหตุ",
      dataIndex: "note",
      render: (text) => (
        <Tooltip title={text}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <FileTextOutlined style={{ color: token.colorTextQuaternary }} />
            <Typography.Text
              type="secondary"
              ellipsis
              style={{ maxWidth: 200 }}
            >
              {text || "-"}
            </Typography.Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "สถานะ",
      key: "tags",
      width: 180,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.is_lastest_version === 1 && (
            <Tag
              color="success"
              bordered={false}
              icon={<CheckCircleOutlined />}
            >
              Latest
            </Tag>
          )}
          {record.force_update === 1 && (
            <Tag
              color="red"
              bordered={false}
              icon={<ExclamationCircleOutlined />}
            >
              Force
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      width: 140,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="ดาวน์โหลดไฟล์">
            <Button
              type="text"
              shape="circle"
              icon={<DownloadOutlined style={{ color: "#1890ff" }} />}
              onClick={() => {
                if (record.url) {
                  window.open(record.url, "_blank");
                } else {
                  toast.error("ไม่พบลิงก์ดาวน์โหลด");
                }
              }}
            />
          </Tooltip>
          <Tooltip title="แก้ไขข้อมูล">
            <Button
              type="text"
              shape="circle"
              icon={
                <EditOutlined style={{ color: token.colorTextSecondary }} />
              }
              onClick={() => handleEditVersionClick(record)}
            />
          </Tooltip>
          <Tooltip title="ลบเวอร์ชัน">
            <Button
              type="text"
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteVersionClick(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%", paddingBottom: 40 }}
      >
        <HeaderBar
          icon={<RocketOutlined />}
          title="ระบบจัดการเวอร์ชันแอปพลิเคชัน (App Version Control)"
          subTitle="ตรวจสอบและควบคุมการปล่อยอัปเดตเวอร์ชันของแอป Canteen และอื่นๆ"
        />

        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          <Table<ApplicationRecord>
            dataSource={applications.list}
            columns={appColumns}
            loading={applications.loading}
            rowKey="app_id"
            pagination={{
              pageSize: PAGE_SIZE,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              style: { padding: "16px 24px" },
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        </Card>
      </Space>

      <PasswordModal {...auth} />

      <ProcessResultModal
        status={submitStatus}
        message={submitMessage}
        data={submitResultData}
        onClose={handleProcessModalClose}
      />

      <Drawer
        title={
          <Space align="center">
            {getPlatformIcon(applications.selected?.app_type || "")}
            <Flex vertical gap={2}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {applications.selected?.app_name}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                App ID: {applications.selected?.app_id}
              </Typography.Text>
            </Flex>
          </Space>
        }
        placement="right"
        width={900}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                if (versions.dataset.curl) {
                  copyToClipboard(versions.dataset.curl);
                  toast.success("คัดลอกคำสั่ง cURL แล้ว");
                } else {
                  toast.info("ไม่พบข้อมูล cURL");
                }
              }}
            >
              cURL
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddVersionClick}
              style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.045)" }}
            >
              เพิ่มเวอร์ชันใหม่
            </Button>
          </Space>
        }
      >
        {versions.dataset.loading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <Table<VersionRecord>
            dataSource={versions.dataset.data}
            columns={versionColumns}
            rowKey="version_id"
            pagination={{ pageSize: 10 }}
            size="small"
            scroll={{ x: 900 }}
            locale={{
              emptyText: (
                <Empty
                  description="ยังไม่มีประวัติเวอร์ชัน"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </Drawer>

      <Modal
        title={
          versionFormMode === "add"
            ? "เพิ่มเวอร์ชันใหม่ (New Release)"
            : "แก้ไขข้อมูลเวอร์ชัน (Edit Version)"
        }
        open={versionFormVisible}
        onCancel={() => setVersionFormVisible(false)}
        width={750}
        centered
        footer={
          <Flex justify="space-between" style={{ padding: "0 8px" }}>
            <Button onClick={() => setVersionFormVisible(false)} size="large">
              ยกเลิก
            </Button>
            <Space>
              {currentStep > 0 && (
                <Button
                  onClick={() => setCurrentStep((c) => c - 1)}
                  size="large"
                >
                  ย้อนกลับ
                </Button>
              )}
              {currentStep < 2 ? (
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      if (currentStep === 0)
                        await versionForm.validateFields([
                          "appID",
                          "versionName",
                          "env",
                        ]);
                      if (currentStep === 1 && versionFormMode === "add")
                        await versionForm.validateFields(["file"]);
                      setCurrentStep((c) => c + 1);
                    } catch {}
                  }}
                  size="large"
                >
                  ถัดไป
                </Button>
              ) : (
                <Button type="primary" onClick={handleFormSubmit} size="large">
                  บันทึกข้อมูล
                </Button>
              )}
            </Space>
          </Flex>
        }
      >
        <Form form={versionForm} layout="vertical" style={{ paddingTop: 24 }}>
          <VersionFormSteps
            currentStep={currentStep}
            mode={versionFormMode}
            schoolOptions={schoolOptions}
            applicationList={applications.list}
            onFileChange={(info) => {
              if (info.file.status === "removed")
                versionForm.setFieldsValue({ file: [] });
            }}
          />
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined
              style={{ color: "#ff4d4f", fontSize: 22 }}
            />
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              ยืนยันการลบข้อมูล
            </span>
          </Space>
        }
        open={!!deleteTarget}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        okText="ยืนยันลบ"
        cancelText="ยกเลิก"
        okButtonProps={{ danger: true, size: "large" }}
        cancelButtonProps={{ size: "large" }}
        centered
      >
        <div style={{ padding: "16px 0 8px" }}>
          <Typography.Text style={{ fontSize: 16 }}>
            คุณแน่ใจหรือไม่ที่จะลบเวอร์ชัน{" "}
            <Typography.Text strong mark>
              {deleteTarget?.version_name}
            </Typography.Text>{" "}
            ?
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            การกระทำนี้จะไม่สามารถกู้คืนข้อมูลได้ โปรดตรวจสอบให้แน่ใจ
          </Typography.Text>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
