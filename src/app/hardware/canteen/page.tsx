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
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  Skeleton,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
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
  buildFormData,
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

// ==================== Constants ====================
const PASSWORD = "SB_ADMIN";
const PAGE_SIZE = 10;

const ENVIRONMENTS = [
  { label: "Production", value: "Production" },
  { label: "Beta", value: "Beta" },
  { label: "Development", value: "Development" },
];

const FORM_STEPS = [
  {
    title: "ข้อมูลพื้นฐาน",
    description: "แอป และเวอร์ชัน",
  },
  {
    title: "อัปโหลดไฟล์",
    description: "ไฟล์เวอร์ชันใหม่",
  },
  {
    title: "การตั้งค่า",
    description: "ตัวเลือกเพิ่มเติม",
  },
];

// ==================== Custom Hooks ====================
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
          <Space direction="vertical">
            <Input
              ref={(node) => {
                searchInputRefs.current[dataIndex] = node as InputRef;
              }}
              placeholder={`ค้นหา ${title}`}
              value={value}
              onChange={(event) => {
                const { value: inputValue } = event.target;
                setSelectedKeys(inputValue ? [inputValue] : []);
              }}
              onPressEnter={() => confirm()}
            />
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="small"
                onClick={() => confirm()}
              >
                ค้นหา
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearFilters?.();
                  confirm({ closeDropdown: true });
                }}
              >
                รีเซ็ต
              </Button>
            </Space>
          </Space>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const raw = (record as any)[dataIndex];
        if (!raw) return false;
        return String(raw).toLowerCase().includes(String(value).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (visible) => {
          if (visible) {
            setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
          }
        },
      },
    }),
    [searchInputRefs]
  );

const usePasswordProtection = () => {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(() => {
    if (validatePassword(password, PASSWORD)) {
      setVisible(false);
      toast.success("เข้าสู่ระบบสำเร็จ");
    } else {
      setError("รหัสผ่านไม่ถูกต้อง");
    }
  }, [password]);

  const handleCancel = useCallback(() => {
    router.push("/backend");
  }, [router]);

  return {
    visible,
    password,
    error,
    setPassword,
    setError,
    handleSubmit,
    handleCancel,
  };
};

const useApplications = () => {
  const [list, setList] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);

  const load = useCallback(async () => {
    const toastId = toast.loading("กำลังโหลดรายการแอปพลิเคชัน...");
    setLoading(true);

    try {
      const response = await GET_APPLICATION_LIST();
      const applications = response?.data?.data ?? [];
      setList(applications);
      toast.success("โหลดรายการแอปพลิเคชันสำเร็จ", { id: toastId });
    } catch (error: any) {
      toast.error(error?.message ?? "ไม่สามารถโหลดรายการแอปพลิเคชันได้", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected && list.length > 0) {
      setSelected(list[0]);
    }
  }, [list, selected]);

  return { list, loading, selected, setSelected };
};

const useVersions = (appId?: string | number, shouldLoad?: boolean) => {
  const [dataset, setDataset] = useState<VersionDataset>({
    data: [],
    loading: false,
    curl: "",
  });

  const load = useCallback(async (id: string | number) => {
    const toastId = toast.loading("กำลังโหลดเวอร์ชันแอป...");
    setDataset((prev) => ({ ...prev, loading: true }));

    try {
      const response = await GET_APPLICATION_VERSION_BY_APPID(id);
      const versions = response?.data?.data ?? [];
      setDataset({
        data: versions,
        loading: false,
        curl: response?.curl ?? "",
      });
      toast.success("โหลดเวอร์ชันสำเร็จ", { id: toastId });
    } catch (error: any) {
      setDataset((prev) => ({ ...prev, loading: false }));
      toast.error(error?.message ?? "ไม่สามารถโหลดเวอร์ชันได้", {
        id: toastId,
      });
    }
  }, []);

  useEffect(() => {
    if (appId && shouldLoad) {
      load(appId);
    }
  }, [appId, shouldLoad, load]);

  return { dataset, load };
};

// ==================== Components ====================
const PasswordModal: React.FC<{
  visible: boolean;
  password: string;
  error: string;
  onPasswordChange: (value: string) => void;
  onErrorClear: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}> = ({
  visible,
  password,
  error,
  onPasswordChange,
  onErrorClear,
  onSubmit,
  onCancel,
}) => (
  <Modal
    title="กรุณาใส่รหัสผ่านก่อนเข้าใช้งาน"
    open={visible}
    closable={false}
    footer={null}
  >
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Input.Password
        placeholder="กรอกรหัสผ่าน"
        value={password}
        onChange={(e) => {
          onPasswordChange(e.target.value);
          onErrorClear();
        }}
      />
      {error && <Typography.Text type="danger">{error}</Typography.Text>}

      <Alert
        type="warning"
        showIcon
        message="กรณีไม่ทราบรหัสผ่าน กรุณาติดต่อคุณไลท์ (Tech Lead)"
      />

      <Flex justify="flex-end" gap="small">
        <Button onClick={onCancel}>ยกเลิก</Button>
        <Button type="primary" onClick={onSubmit} disabled={!password}>
          ตกลง
        </Button>
      </Flex>
    </Space>
  </Modal>
);

const VersionFormStep1: React.FC<{
  mode: "add" | "edit";
  schoolOptions: any[];
  applicationList: ApplicationRecord[];
}> = ({ mode, schoolOptions, applicationList }) => (
  <Card size="small" title="ข้อมูลพื้นฐาน" bordered={false}>
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Form.Item label="เลือกโรงเรียน" name="schoolID">
          <Select
            allowClear
            placeholder="เลือกโรงเรียน"
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
          label="เลือกแอปพลิเคชัน"
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
          rules={[{ required: true, message: "กรุณาระบุชื่อเวอร์ชัน" }]}
        >
          <Input placeholder="เช่น 1.0.0" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="สภาพแวดล้อม"
          name="env"
          rules={[{ required: true, message: "กรุณาเลือกสภาพแวดล้อม" }]}
        >
          <Select placeholder="เลือกสภาพแวดล้อม" options={ENVIRONMENTS} />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="หมายเหตุ" name="note">
          <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม" />
        </Form.Item>
      </Col>
    </Row>
  </Card>
);

const VersionFormStep2: React.FC<{
  mode: "add" | "edit";
  onChange: (info: UploadChangeParam<UploadFile>) => void;
}> = ({ mode, onChange }) => (
  <Card size="small" title="อัปโหลดไฟล์เวอร์ชัน" bordered={false}>
    <Form.Item
      label="เลือกไฟล์เวอร์ชัน"
      name="file"
      valuePropName="fileList"
      getValueFromEvent={(info: UploadChangeParam<UploadFile>) => info.fileList}
      rules={[
        {
          required: mode === "add",
          validator: (_, fileList) => {
            if (mode === "add" && (!fileList || fileList.length === 0)) {
              return Promise.reject(
                "กรุณาอัปโหลดไฟล์เวอร์ชัน (.apk หรือ .zip)"
              );
            }
            return Promise.resolve();
          },
        },
      ]}
    >
      <Upload.Dragger
        beforeUpload={() => false}
        maxCount={1}
        onChange={onChange}
        accept=".apk,.zip"
      >
        <Space direction="vertical" size="small">
          <CloudUploadOutlined style={{ fontSize: 48, color: "#1677ff" }} />
          <Typography.Text>คลิกหรือลากไฟล์มาที่นี่</Typography.Text>
          <Typography.Text type="secondary">
            รองรับไฟล์ .apk และ .zip เท่านั้น
          </Typography.Text>
        </Space>
      </Upload.Dragger>
    </Form.Item>
  </Card>
);

const VersionFormStep3: React.FC = () => (
  <Card size="small" title="การตั้งค่าเพิ่มเติม" bordered={false}>
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card size="small">
        <Flex justify="space-between" align="center">
          <Space direction="vertical" size={0}>
            <Typography.Text strong>เวอร์ชันล่าสุด</Typography.Text>
            <Typography.Text type="secondary">
              กำหนดให้เป็นเวอร์ชันล่าสุดของแอป
            </Typography.Text>
          </Space>
          <Form.Item name="isLatestVersion" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
      </Card>

      <Card size="small">
        <Flex justify="space-between" align="center">
          <Space direction="vertical" size={0}>
            <Typography.Text strong>บังคับอัปเดต</Typography.Text>
            <Typography.Text type="secondary">
              ผู้ใช้จะต้องอัปเดตก่อนใช้งาน
            </Typography.Text>
          </Space>
          <Form.Item name="forceUpdate" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
      </Card>
    </Space>
  </Card>
);

// ==================== Main Component ====================
export default function CanteenAppManager() {
  const router = useRouter();
  const schoolState = useAppSelector((state) => state.callSchoolList);

  const passwordProtection = usePasswordProtection();
  const applications = useApplications();
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const versions = useVersions(
    applications.selected?.app_id,
    versionModalVisible
  );

  const [versionFormVisible, setVersionFormVisible] = useState(false);
  const [versionFormMode, setVersionFormMode] = useState<"add" | "edit">("add");
  const [currentStep, setCurrentStep] = useState(0);
  const [versionForm] = Form.useForm<VersionFormValues>();
  const [deleteTarget, setDeleteTarget] = useState<VersionRecord | null>(null);

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});
  const getColumnSearchProps =
    useColumnSearch<ApplicationRecord>(searchInputRefs);
  const getVersionColumnSearchProps =
    useColumnSearch<VersionRecord>(searchInputRefs);

  const schoolOptions = useMemo(() => {
    return buildSchoolOptions(schoolState?.response?.data ?? []);
  }, [schoolState]);

  const openVersionForm = useCallback(
    (mode: "add" | "edit", version?: VersionRecord) => {
      setVersionFormMode(mode);
      setCurrentStep(0);
      if (mode === "add") {
        versionForm.resetFields();
        versionForm.setFieldsValue({
          appID: String(applications.selected?.app_id ?? ""),
          isLatestVersion: false,
          forceUpdate: false,
          file: null,
        });
      } else if (version) {
        versionForm.setFieldsValue({
          appID: String(applications.selected?.app_id ?? ""),
          versionID: String(version.version_id ?? ""),
          versionName: version.version_name ?? "",
          env: version.env ?? "",
          note: version.note ?? "",
          schoolID: "",
          isLatestVersion: version.is_lastest_version === 1,
          forceUpdate: version.force_update === 1,
          file: null,
        });
      }
      setVersionFormVisible(true);
    },
    [applications.selected?.app_id, versionForm]
  );

  const handleNext = useCallback(async () => {
    try {
      if (currentStep === 0) {
        await versionForm.validateFields(["appID", "versionName", "env"]);
      } else if (currentStep === 1 && versionFormMode === "add") {
        await versionForm.validateFields(["file"]);
      }
      setCurrentStep((prev) => prev + 1);
    } catch (error) {
      // Validation failed
    }
  }, [currentStep, versionForm, versionFormMode]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  const handleVersionSubmit = useCallback(async () => {
    try {
      const values = await versionForm.validateFields();
      const formData = buildFormData(values);
      const toastId = toast.loading(
        versionFormMode === "add"
          ? "กำลังสร้างเวอร์ชัน..."
          : "กำลังอัปเดตเวอร์ชัน..."
      );

      const response = await (versionFormMode === "add"
        ? POST_CREATE_APPLICATION_VERSION(formData)
        : POST_UPDATE_APPLICATION_VERSION(formData));

      toast.success("ดำเนินการสำเร็จ", {
        id: toastId,
        description: response?.data?.message ?? "บันทึกข้อมูลสำเร็จ",
      });

      setVersionFormVisible(false);
      setCurrentStep(0);

      if (applications.selected) {
        await versions.load(applications.selected.app_id);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? "ไม่สามารถบันทึกเวอร์ชันได้",
        {
          description: "กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
        }
      );
    }
  }, [versionForm, versionFormMode, applications.selected, versions]);

  const handleDeleteVersion = useCallback(
    async (version: VersionRecord) => {
      const toastId = toast.loading("กำลังลบเวอร์ชัน...");

      try {
        const response = await DELETE_APPLICATION_VERSION(version.version_id);
        toast.success(response?.data?.message ?? "ลบเวอร์ชันสำเร็จ", {
          id: toastId,
        });

        if (applications.selected) {
          await versions.load(applications.selected.app_id);
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ?? "เกิดข้อผิดพลาดระหว่างลบเวอร์ชัน",
          {
            id: toastId,
          }
        );
      }
    },
    [applications.selected, versions]
  );

  const handleCopyCurl = useCallback(async () => {
    if (!versions.dataset.curl) {
      toast.info("ไม่พบคำสั่ง CURL");
      return;
    }

    const success = await copyToClipboard(versions.dataset.curl);
    toast[success ? "success" : "error"](
      success ? "คัดลอก CURL แล้ว" : "ไม่สามารถคัดลอกได้"
    );
  }, [versions.dataset.curl]);

  const renderLatestVersionTag = useCallback((record: VersionRecord) => {
    const isLatest = Boolean(record.is_lastest_version);
    return (
      <Tag
        color={isLatest ? "success" : "default"}
        icon={isLatest ? <CheckCircleOutlined /> : undefined}
      >
        {isLatest ? "ล่าสุด" : "เวอร์ชันเก่า"}
      </Tag>
    );
  }, []);

  const renderForceUpdateTag = useCallback((record: VersionRecord) => {
    const isForced = Boolean(record.force_update);
    return (
      <Tag
        color={isForced ? "error" : "default"}
        icon={isForced ? <ExclamationCircleOutlined /> : undefined}
      >
        {isForced ? "บังคับอัปเดต" : "ไม่บังคับ"}
      </Tag>
    );
  }, []);

  const applicationColumns = useMemo<ColumnsType<ApplicationRecord>>(
    () => [
      {
        title: "ชื่อแอปพลิเคชัน",
        dataIndex: "app_name",
        width: 400,
        sorter: (a, b) => String(a.app_name).localeCompare(String(b.app_name)),
        ...getColumnSearchProps("app_name", "ชื่อแอปพลิเคชัน"),
      },
      {
        title: "รหัสแอปพลิเคชัน",
        dataIndex: "app_id",
        width: 400,
        sorter: (a, b) => String(a.app_id).localeCompare(String(b.app_id)),
        ...getColumnSearchProps("app_id", "รหัสแอปพลิเคชัน"),
      },
      {
        title: "แพลตฟอร์ม",
        dataIndex: "app_type",
        width: 200,
        sorter: (a, b) => String(a.app_type).localeCompare(String(b.app_type)),
        filters: Array.from(
          new Set(applications.list.map((item) => item.app_type))
        ).map((type) => ({ text: String(type), value: type })),
        onFilter: (value, record) => record.app_type === value,
        render: (value: string) => <Tag color="blue">{value}</Tag>,
        ...getColumnSearchProps("app_type", "แพลตฟอร์ม"),
      },
      {
        title: "การจัดการ",
        key: "actions",
        width: 150,
        render: (_, record) => (
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              applications.setSelected(record);
              setVersionModalVisible(true);
            }}
          >
            ดูเวอร์ชัน
          </Button>
        ),
      },
    ],
    [applications.list, applications.setSelected, getColumnSearchProps]
  );

  const versionColumns = useMemo<ColumnsType<VersionRecord>>(
    () => [
      {
        title: "เวอร์ชัน",
        dataIndex: "version_name",
        sorter: (a, b) =>
          String(a.version_name).localeCompare(String(b.version_name)),
        defaultSortOrder: "ascend",
        ...getVersionColumnSearchProps("version_name", "เวอร์ชัน"),
      },
      {
        title: "สภาพแวดล้อม",
        dataIndex: "env",
        filters: Array.from(
          new Set((versions.dataset.data ?? []).map((item) => item.env))
        ).map((env) => ({ text: env, value: env })),
        onFilter: (value, record) => record.env === value,
        sorter: (a, b) => String(a.env).localeCompare(String(b.env)),
        ...getVersionColumnSearchProps("env", "สภาพแวดล้อม"),
      },
      {
        title: "อัปเดตล่าสุด",
        dataIndex: "updated_at",
        sorter: (a, b) =>
          dayjs(a.updated_at).valueOf() - dayjs(b.updated_at).valueOf(),
        render: (value: string) =>
          value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
      },
      {
        title: "หมายเหตุ",
        dataIndex: "note",
        ellipsis: true,
      },
      {
        title: "เวอร์ชันล่าสุด",
        dataIndex: "is_lastest_version",
        align: "center",
        width: 120,
        filters: [
          { text: "เวอร์ชันล่าสุด", value: true },
          { text: "เวอร์ชันเก่า", value: false },
        ],
        onFilter: (value, record) => {
          const isLatest = Boolean(record.is_lastest_version);
          return value === true ? isLatest : !isLatest;
        },
        render: (_value, record) => renderLatestVersionTag(record),
      },
      {
        title: "บังคับอัปเดต",
        dataIndex: "force_update",
        align: "center",
        width: 130,
        filters: [
          { text: "บังคับอัปเดต", value: true },
          { text: "ไม่บังคับ", value: false },
        ],
        onFilter: (value, record) => {
          const isForced = Boolean(record.force_update);
          return value === true ? isForced : !isForced;
        },
        render: (_value, record) => renderForceUpdateTag(record),
      },
      {
        title: "การจัดการ",
        key: "actions",
        width: 200,
        render: (_, record) => (
          <Space size="small">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => toast.info("ฟีเจอร์ดาวน์โหลดอยู่ระหว่างพัฒนา")}
            />
            <Button
              icon={<EditOutlined />}
              onClick={() => openVersionForm("edit", record)}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleteTarget(record)}
            />
          </Space>
        ),
      },
    ],
    [
      getVersionColumnSearchProps,
      openVersionForm,
      versions.dataset.data,
      renderLatestVersionTag,
      renderForceUpdateTag,
    ]
  );

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <HeaderBar
          icon={<CloudUploadOutlined />}
          title="จัดการแอปพลิเคชัน Canteen"
          subTitle="เพิ่ม แก้ไข หรือลบเวอร์ชันของแอปพลิเคชัน Canteen"
          color={"none"}
        />

        <Card title="รายการแอปพลิเคชัน" variant={"outlined"}>
          <Table<ApplicationRecord>
            dataSource={applications.list}
            loading={applications.loading}
            columns={applicationColumns}
            rowKey={(record) => String(record.app_id)}
            pagination={{ pageSize: PAGE_SIZE }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Space>

      <PasswordModal
        visible={passwordProtection.visible}
        password={passwordProtection.password}
        error={passwordProtection.error}
        onPasswordChange={passwordProtection.setPassword}
        onErrorClear={() => passwordProtection.setError("")}
        onSubmit={passwordProtection.handleSubmit}
        onCancel={passwordProtection.handleCancel}
      />

      <Modal
        title={`เวอร์ชันของ ${applications.selected?.app_name ?? "-"}`}
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        width={1080}
        footer={
          <Space>
            <Button onClick={handleCopyCurl}>คัดลอก CURL</Button>
            <Button type="primary" onClick={() => openVersionForm("add")}>
              เพิ่มเวอร์ชัน
            </Button>
          </Space>
        }
      >
        {versions.dataset.loading ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Skeleton active paragraph={{ rows: 4 }} />
            <Skeleton active paragraph={{ rows: 4 }} />
            <Skeleton active paragraph={{ rows: 4 }} />
          </Space>
        ) : (
          <Table<VersionRecord>
            dataSource={versions.dataset.data}
            columns={versionColumns}
            rowKey={(record) => String(record.version_id)}
            pagination={false}
            scroll={{ x: 1000 }}
          />
        )}
      </Modal>

      <Modal
        title={
          versionFormMode === "add" ? "เพิ่มเวอร์ชันแอป" : "แก้ไขเวอร์ชันแอป"
        }
        open={versionFormVisible}
        onCancel={() => {
          setVersionFormVisible(false);
          setCurrentStep(0);
        }}
        width={800}
        footer={null}
      >
        <Form<VersionFormValues>
          layout="vertical"
          form={versionForm}
          initialValues={{
            appID: applications.selected
              ? String(applications.selected.app_id)
              : "",
            env: "",
            isLatestVersion: false,
            forceUpdate: false,
            file: null,
          }}
        >
          <Steps current={currentStep} items={FORM_STEPS} />

          <Space
            direction="vertical"
            size="large"
            style={{ width: "100%", marginTop: 24 }}
          >
            {currentStep === 0 && (
              <VersionFormStep1
                mode={versionFormMode}
                schoolOptions={schoolOptions}
                applicationList={applications.list}
              />
            )}

            {currentStep === 1 && (
              <VersionFormStep2
                mode={versionFormMode}
                onChange={(info) => {
                  if (info.file.status === "removed") {
                    versionForm.setFieldsValue({ file: [] });
                  }
                }}
              />
            )}

            {currentStep === 2 && <VersionFormStep3 />}
          </Space>

          <Flex
            justify="space-between"
            style={{ marginTop: 24, paddingTop: 16 }}
          >
            <Button
              onClick={() => {
                setVersionFormVisible(false);
                setCurrentStep(0);
              }}
            >
              ยกเลิก
            </Button>

            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrev}>ย้อนกลับ</Button>
              )}

              {currentStep < 2 ? (
                <Button type="primary" onClick={handleNext}>
                  ถัดไป
                </Button>
              ) : (
                <Button type="primary" onClick={handleVersionSubmit}>
                  บันทึกเวอร์ชัน
                </Button>
              )}
            </Space>
          </Flex>
        </Form>
      </Modal>

      <Modal
        title="ยืนยันการลบเวอร์ชัน"
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onOk={async () => {
          if (deleteTarget) {
            await handleDeleteVersion(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        okButtonProps={{ danger: true }}
        okText="ลบ"
        cancelText="ยกเลิก"
      >
        <Typography.Paragraph>
          ต้องการลบเวอร์ชัน {deleteTarget?.version_name ?? "-"} หรือไม่?
        </Typography.Paragraph>
      </Modal>
    </DashboardLayout>
  );
}
