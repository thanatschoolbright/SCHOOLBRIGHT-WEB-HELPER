"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { InputRef } from "antd";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Result, // เพิ่ม Result สำหรับแสดงผลลัพธ์
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import {
  AndroidOutlined,
  AppleOutlined,
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
  LoadingOutlined, // เพิ่ม Icon Loading
} from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "sonner";

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

// ==================== Constants & Helpers ====================
const PASSWORD = "SB_ADMIN";
const PAGE_SIZE = 10;

const ENVIRONMENTS = [
  { label: "Production", value: "Production", color: "green" },
  { label: "Beta", value: "Beta", color: "orange" },
  { label: "Development", value: "Development", color: "blue" },
];

const FORM_STEPS = [
  { title: "ข้อมูลพื้นฐาน", description: "รายละเอียดแอป" },
  { title: "อัปโหลดไฟล์", description: "ไฟล์ .apk/.zip" },
  { title: "การตั้งค่า", description: "Config เพิ่มเติม" },
];

const getPlatformIcon = (type: string) => {
  const lower = type?.toLowerCase() || "";
  if (lower.includes("android"))
    return <AndroidOutlined style={{ color: "#3DDC84" }} />;
  if (lower.includes("ios") || lower.includes("apple"))
    return <AppleOutlined style={{ color: "#000000" }} />;
  if (lower.includes("windows"))
    return <WindowsOutlined style={{ color: "#0078D7" }} />;
  if (lower.includes("web"))
    return <GlobalOutlined style={{ color: "#1890ff" }} />;
  return <CodeOutlined />;
};

const getEnvColor = (env: string) => {
  return ENVIRONMENTS.find((e) => e.value === env)?.color || "default";
};

// ==================== Custom Hooks ====================
// (Keep original hooks: usePasswordProtection, useColumnSearch, useApplications, useVersions)
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
      setError("รหัสผ่านไม่ถูกต้อง");
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
        <span>ยืนยันสิทธิ์ผู้ดูแลระบบ</span>
      </Space>
    }
    open={props.modalVisible}
    onCancel={props.handleCancel}
    footer={null}
    width={400}
    centered
  >
    <Space
      direction="vertical"
      size="large"
      style={{ width: "100%", paddingTop: 16 }}
    >
      <div>
        <Typography.Text type="secondary">
          กรุณากรอกรหัสผ่านเพื่อดำเนินการต่อ
        </Typography.Text>
        <Input.Password
          placeholder="รหัสผ่าน"
          value={props.password}
          onChange={(e) => {
            props.setPassword(e.target.value);
            props.setError("");
          }}
          onPressEnter={props.handleSubmit}
          status={props.error ? "error" : ""}
          style={{ marginTop: 8 }}
          autoFocus
        />
        {props.error && (
          <Typography.Text type="danger" style={{ fontSize: 12 }}>
            {props.error}
          </Typography.Text>
        )}
      </div>
      <Flex justify="end" gap="small">
        <Button onClick={props.handleCancel}>ยกเลิก</Button>
        <Button
          type="primary"
          onClick={props.handleSubmit}
          disabled={!props.password}
        >
          ยืนยัน
        </Button>
      </Flex>
    </Space>
  </Modal>
);

// --- Component: Process Result Modal ---
// Modal นี้จะแสดงสถานะการทำงาน (Loading / Success / Error)
const ProcessResultModal: React.FC<{
  status: "idle" | "loading" | "success" | "error";
  onClose: () => void;
  message?: string;
}> = ({ status, onClose, message }) => {
  return (
    <Modal
      open={status !== "idle"}
      footer={null}
      closable={status !== "loading"}
      onCancel={status !== "loading" ? onClose : undefined}
      centered
      maskClosable={false}
    >
      {status === "loading" && (
        <Flex vertical align="center" gap="large" style={{ padding: 32 }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <Typography.Title level={4}>กำลังบันทึกข้อมูล...</Typography.Title>
          <Typography.Text type="secondary">
            กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้
          </Typography.Text>
        </Flex>
      )}

      {status === "success" && (
        <Result
          status="success"
          title="ดำเนินการสำเร็จ"
          subTitle={message || "ข้อมูลถูกบันทึกเรียบร้อยแล้ว"}
          extra={[
            <Button type="primary" key="console" onClick={onClose}>
              ตกลง
            </Button>,
          ]}
        />
      )}

      {status === "error" && (
        <Result
          status="error"
          title="เกิดข้อผิดพลาด"
          subTitle={message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"}
          extra={[
            <Button key="buy" onClick={onClose}>
              ปิด
            </Button>,
          ]}
        />
      )}
    </Modal>
  );
};

// --- Component: Version Form Steps (Modified to Preserve Values) ---
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
      style={{ marginBottom: 24 }}
    />

    <div style={{ minHeight: 300 }}>
      {/* ใช้ style={{ display: ... }} แทนการ && เพื่อไม่ให้ Component ถูก Unmount ค่าจึงไม่หาย */}
      <div style={{ display: currentStep === 0 ? "block" : "none" }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              message="ข้อมูลพื้นฐาน"
              description="ระบุข้อมูลเวอร์ชันและสภาพแวดล้อมให้ถูกต้อง"
              type="info"
              showIcon
            />
          </Col>
          <Col span={12}>
            <Form.Item label="โรงเรียน" name="schoolID">
              <Select
                allowClear
                placeholder="ทั้งหมด (หรือระบุโรงเรียน)"
                options={schoolOptions}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="แอปพลิเคชัน"
              name="appID"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                placeholder="เลือกแอป"
                disabled={mode === "edit"}
                options={applicationList.map((item) => ({
                  label: item.app_name,
                  value: String(item.app_id),
                }))}
              />
            </Form.Item>
          </Col>
          {mode === "edit" && (
            <Col span={12}>
              <Form.Item label="Version ID" name="versionID">
                <Input disabled />
              </Form.Item>
            </Col>
          )}
          <Col span={12}>
            <Form.Item
              label="ชื่อเวอร์ชัน"
              name="versionName"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input
                placeholder="เช่น 1.0.0"
                prefix={<Tag color="blue">v</Tag>}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="สภาพแวดล้อม"
              name="env"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="เลือก Env" options={ENVIRONMENTS} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="หมายเหตุ" name="note">
              <Input.TextArea
                rows={3}
                placeholder="Release notes หรือรายละเอียดเพิ่มเติม"
                showCount
                maxLength={255}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div style={{ display: currentStep === 1 ? "block" : "none" }}>
        <Form.Item
          name="file"
          valuePropName="fileList"
          getValueFromEvent={(e: any) => (Array.isArray(e) ? e : e?.fileList)}
          rules={[{ required: mode === "add", message: "กรุณาอัปโหลดไฟล์" }]}
        >
          <Upload.Dragger
            beforeUpload={() => false}
            maxCount={1}
            onChange={onFileChange}
            accept=".apk,.zip"
            height={250}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">คลิกหรือลากไฟล์มาที่นี่</p>
            <p className="ant-upload-hint">
              รองรับไฟล์ .apk หรือ .zip สำหรับติดตั้ง
            </p>
          </Upload.Dragger>
        </Form.Item>
      </div>

      <div style={{ display: currentStep === 2 ? "block" : "none" }}>
        <Flex vertical gap="middle">
          <Alert message="การตั้งค่าการอัปเดต" type="warning" showIcon />
          <Card size="small" hoverable>
            <Flex justify="space-between" align="center">
              <span>
                <Typography.Text strong>Set as Latest Version</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  ผู้ใช้จะเห็นเวอร์ชันนี้เป็นตัวล่าสุด
                </Typography.Text>
              </span>
              <Form.Item name="isLatestVersion" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </Flex>
          </Card>
          <Card size="small" hoverable>
            <Flex justify="space-between" align="center">
              <span>
                <Typography.Text strong>Force Update</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  บังคับให้ผู้ใช้อัปเดตทันทีที่เปิดแอป
                </Typography.Text>
              </span>
              <Form.Item name="forceUpdate" valuePropName="checked" noStyle>
                <Switch />
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
  const schoolState = useAppSelector((state) => state.callSchoolList);

  const auth = usePasswordProtection();
  const applications = useApplications();

  // States
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [versionFormVisible, setVersionFormVisible] = useState(false);
  const [versionFormMode, setVersionFormMode] = useState<"add" | "edit">("add");
  const [currentStep, setCurrentStep] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<VersionRecord | null>(null);

  // Status State สำหรับ Process Result Modal
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");

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

  // !!! จุดสำคัญ: แก้ไข Logic Submit เพื่อไม่ให้ค่าเป็น undefined !!!
  const handleFormSubmit = async () => {
    try {
      // 1. Validate Form
      const values = await versionForm.validateFields();

      // 2. Set Loading State
      setVersionFormVisible(false); // ปิด Form Modal ก่อน
      setSubmitStatus("loading");

      // 3. Manual FormData Construction (Fix undefined issue)
      const formData = new FormData();

      // Map Form Values to API Snake_Case
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

      // Handle File
      if (values.file && values.file.length > 0) {
        const fileOrigin = values.file[0].originFileObj;
        if (fileOrigin) {
          formData.append("file", fileOrigin);
        }
      }

      // 4. Call API
      const apiCall =
        versionFormMode === "add"
          ? POST_CREATE_APPLICATION_VERSION
          : POST_UPDATE_APPLICATION_VERSION;
      const response = await apiCall(formData);

      // 5. Success State
      setSubmitStatus("success");
      setSubmitMessage(response?.data?.message ?? "บันทึกข้อมูลสำเร็จ");

      if (applications.selected) versions.load(applications.selected.app_id);
    } catch (error: any) {
      // 6. Error State
      console.error(error);
      setSubmitStatus("error");
      setSubmitMessage(
        error?.response?.data?.message ?? "เกิดข้อผิดพลาดในการบันทึก"
      );
      // ถ้า Error อาจจะเปิด Form กลับมาเพื่อให้แก้
      // setVersionFormVisible(true);
    }
  };

  const handleProcessModalClose = () => {
    setSubmitStatus("idle");
    setSubmitMessage("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const toastId = toast.loading("กำลังลบ...");
    try {
      await DELETE_APPLICATION_VERSION(deleteTarget.version_id);
      toast.success("ลบเวอร์ชันสำเร็จ", { id: toastId });
      setDeleteTarget(null);
      if (applications.selected) versions.load(applications.selected.app_id);
    } catch (error: any) {
      toast.error("ลบไม่สำเร็จ", { id: toastId });
    }
  };

  // Columns Definitions
  const appColumns: ColumnsType<ApplicationRecord> = [
    {
      title: "App Name",
      dataIndex: "app_name",
      width: 250,
      render: (text, record) => (
        <Space>
          {getPlatformIcon(record.app_type)}
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
      sorter: (a, b) => a.app_name.localeCompare(b.app_name),
      ...getColumnSearchProps("app_name", "ชื่อแอป"),
    },
    {
      title: "App ID",
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
      title: "Platform",
      dataIndex: "app_type",
      width: 150,
      align: "center",
      render: (text) => <Tag icon={getPlatformIcon(text)}>{text}</Tag>,
      filters: applications.list
        .map((i) => ({ text: i.app_type, value: i.app_type }))
        .filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i),
      onFilter: (value, record) => record.app_type === value,
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openVersionDrawer(record)}
        >
          ดูเวอร์ชัน
        </Button>
      ),
    },
  ];

  const versionColumns: ColumnsType<VersionRecord> = [
    {
      title: "Version",
      dataIndex: "version_name",
      width: 120,
      fixed: "left",
      render: (text, record) => (
        <Badge
          dot
          status={record.is_lastest_version ? "success" : "default"}
          offset={[5, 0]}
        >
          <Typography.Text strong>{text}</Typography.Text>
        </Badge>
      ),
      sorter: (a, b) => a.version_name.localeCompare(b.version_name),
      ...getVersionColumnSearchProps("version_name", "เวอร์ชัน"),
    },
    {
      title: "Environment",
      dataIndex: "env",
      width: 120,
      render: (text) => <Tag color={getEnvColor(text)}>{text}</Tag>,
      filters: ENVIRONMENTS.map((e) => ({ text: e.label, value: e.value })),
      onFilter: (value, record) => record.env === value,
    },
    {
      title: "Updated",
      dataIndex: "updated_at",
      width: 160,
      render: (val) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {val ? dayjs(val).format("DD MMM YYYY HH:mm") : "-"}
        </Typography.Text>
      ),
      sorter: (a, b) =>
        dayjs(a.updated_at).valueOf() - dayjs(b.updated_at).valueOf(),
    },
    {
      title: "Note",
      dataIndex: "note",
      render: (text) => (
        <Typography.Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
          {text || "-"}
        </Typography.Text>
      ),
    },
    {
      title: "Tags",
      key: "tags",
      width: 180,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.is_lastest_version === 1 && (
            <Tag color="success" bordered={false}>
              Latest
            </Tag>
          )}
          {record.force_update === 1 && (
            <Tag color="red" bordered={false}>
              Force
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditVersionClick(record)}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
              danger
              size="small"
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
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <HeaderBar
          icon={<RocketOutlined />}
          title="App Version Control"
          subTitle="ตรวจสอบและจัดการเวอร์ชันของแอปพลิเคชัน Canteen"
        />

        <Card variant="borderless" className="shadow-sm">
          <Table<ApplicationRecord>
            dataSource={applications.list}
            columns={appColumns}
            loading={applications.loading}
            rowKey="app_id"
            pagination={{ pageSize: PAGE_SIZE }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Space>

      <PasswordModal {...auth} />

      {/* Process Result Modal: แสดงสถานะการทำงานแบบชัดเจน */}
      <ProcessResultModal
        status={submitStatus}
        message={submitMessage}
        onClose={handleProcessModalClose}
      />

      <Drawer
        title={
          <Space>
            {getPlatformIcon(applications.selected?.app_type || "")}
            <Typography.Title level={5} style={{ margin: 0 }}>
              {applications.selected?.app_name}
            </Typography.Title>
            <Tag>{applications.selected?.app_id}</Tag>
          </Space>
        }
        placement="right"
        width={850}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                if (versions.dataset.curl) {
                  copyToClipboard(versions.dataset.curl);
                  toast.success("คัดลอก cURL แล้ว");
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
            >
              เพิ่มเวอร์ชันใหม่
            </Button>
          </Space>
        }
      >
        {versions.dataset.loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : (
          <Table<VersionRecord>
            dataSource={versions.dataset.data}
            columns={versionColumns}
            rowKey="version_id"
            pagination={{ pageSize: 10 }}
            size="small"
            scroll={{ x: 800 }}
            locale={{
              emptyText: <Empty description="ยังไม่มีประวัติเวอร์ชัน" />,
            }}
          />
        )}
      </Drawer>

      <Modal
        title={
          versionFormMode === "add"
            ? "New Version Release"
            : "Edit Version Details"
        }
        open={versionFormVisible}
        onCancel={() => setVersionFormVisible(false)}
        width={700}
        footer={
          <Flex justify="space-between">
            <Button onClick={() => setVersionFormVisible(false)}>ยกเลิก</Button>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep((c) => c - 1)}>
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
                >
                  ถัดไป
                </Button>
              ) : (
                <Button type="primary" onClick={handleFormSubmit}>
                  บันทึกข้อมูล
                </Button>
              )}
            </Space>
          </Flex>
        }
      >
        <Form form={versionForm} layout="vertical">
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
            <ExclamationCircleOutlined style={{ color: "red" }} /> ยืนยันการลบ
          </Space>
        }
        open={!!deleteTarget}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        okText="ลบเวอร์ชัน"
        okButtonProps={{ danger: true }}
      >
        คุณแน่ใจหรือไม่ที่จะลบเวอร์ชัน <b>{deleteTarget?.version_name}</b>?
        <br />
        <Typography.Text type="secondary">
          การกระทำนี้ไม่สามารถกู้คืนได้
        </Typography.Text>
      </Modal>
    </DashboardLayout>
  );
}
