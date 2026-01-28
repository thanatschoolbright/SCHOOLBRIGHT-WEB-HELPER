"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popover,
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
  Statistic,
  Divider,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import {
  AndroidOutlined,
  AppleOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  GlobalOutlined,
  LockOutlined,
  PlusOutlined,
  RocketOutlined,
  SearchOutlined,
  TeamOutlined,
  WindowsOutlined,
  LoadingOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
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

// ✅ ใช้งาน Plugin สำหรับปี พ.ศ. (BBBB)
dayjs.extend(buddhistEra);
dayjs.locale("th");

// --- ป้องกัน Runtime Error: 'new' is required ---
const { Text: AntText, Title: AntTitle } = Typography;

const ADMIN_ACCESS_PASSWORD = "SB_ADMIN";
const TABLE_PAGE_SIZE = 10;
const ENVIRONMENT_OPTIONS = [
  { label: "ใช้งานจริง (Production)", value: "Production", color: "green" },
  { label: "ทดสอบเบต้า (Beta)", value: "Beta", color: "orange" },
  { label: "กำลังพัฒนา (Development)", value: "Development", color: "blue" },
];
const VERSION_FORM_STEPS = [
  { title: "ข้อมูลพื้นฐาน", description: "รายละเอียดเวอร์ชัน" },
  { title: "อัปโหลดไฟล์", description: "ไฟล์ .apk หรือ .zip" },
  { title: "การตั้งค่า", description: "กำหนดเงื่อนไขการอัปเดต" },
];

const getPlatformIcon = (platformType: string) => {
  const lowercaseType = platformType?.toLowerCase() || "";
  if (lowercaseType.includes("android"))
    return <AndroidOutlined style={{ color: "#3DDC84", fontSize: 18 }} />;
  if (lowercaseType.includes("ios") || lowercaseType.includes("apple"))
    return <AppleOutlined style={{ fontSize: 18 }} />; // เอาสีออกเพื่อให้ใช้สีตาม Text ของ Theme
  if (lowercaseType.includes("windows"))
    return <WindowsOutlined style={{ color: "#0078D7", fontSize: 18 }} />;
  if (lowercaseType.includes("web"))
    return <GlobalOutlined style={{ color: "#1890ff", fontSize: 18 }} />;
  return <CodeOutlined style={{ fontSize: 18 }} />;
};

const getEnvironmentTagColor = (environment: string) =>
  ENVIRONMENT_OPTIONS.find((option) => option.value === environment)?.color ||
  "default";

// ==========================================
// INTERNAL SUB-COMPONENTS (Summary Cards)
// ==========================================
const SummaryCards = ({
  applications,
  isLoading,
}: {
  applications: ApplicationRecord[];
  isLoading: boolean;
}) => {
  const { token } = theme.useToken();
  const summaryMetrics = [
    {
      label: "แอปพลิเคชันทั้งหมด",
      value: applications.length,
      color: token.colorPrimary,
      icon: <AppstoreOutlined />,
      description: "รายการโปรเจกต์ในระบบ",
    },
    {
      label: "Android Apps",
      value: applications.filter((app) =>
        app.app_type.toLowerCase().includes("android"),
      ).length,
      color: "#22c55e",
      icon: <AndroidOutlined />,
      description: "แพลตฟอร์ม Android",
    },
    {
      label: "iOS / Apple Apps",
      value: applications.filter(
        (app) =>
          app.app_type.toLowerCase().includes("ios") ||
          app.app_type.toLowerCase().includes("apple"),
      ).length,
      color: token.colorText, // เปลี่ยนจาก #000000 เป็นตัวแปรของ Theme
      icon: <AppleOutlined />,
      description: "แพลตฟอร์ม iOS",
    },
    {
      label: "Web / Others",
      value: applications.filter(
        (app) =>
          !app.app_type.toLowerCase().includes("android") &&
          !app.app_type.toLowerCase().includes("ios"),
      ).length,
      color: "#f59e0b",
      icon: <GlobalOutlined />,
      description: "แพลตฟอร์มอื่นๆ",
    },
  ];

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {summaryMetrics.map((metric, index) => (
        <Col xs={24} sm={12} md={6} key={index}>
          <Card
            variant="borderless"
            className="shadow-sm rounded-xl overflow-hidden relative h-full"
          >
            <div
              className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12"
              style={{ pointerEvents: "none" }}
            >
              <span style={{ fontSize: "5rem", color: metric.color }}>
                {metric.icon}
              </span>
            </div>
            <Flex align="center" gap={16}>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
                style={{
                  backgroundColor: token.colorFillSecondary, // ใช้ Token แทน Hex + Alpha
                  color: metric.color,
                }}
              >
                {metric.icon}
              </div>
              <div className="z-10">
                <AntText
                  type="secondary"
                  className="block text-xs uppercase font-bold tracking-wider"
                >
                  {metric.label}
                </AntText>
                <Statistic
                  value={isLoading ? 0 : metric.value}
                  valueStyle={{ fontWeight: 800, fontSize: 24 }}
                />
                <AntText type="secondary" className="text-xs">
                  {metric.description}
                </AntText>
              </div>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// --- Custom Hooks ---
const usePasswordProtection = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestAccess = useCallback(
    (actionCallback: () => void) => {
      if (isAuthenticated) actionCallback();
      else {
        setPendingAction(() => actionCallback);
        setModalVisible(true);
      }
    },
    [isAuthenticated],
  );

  const handlePasswordSubmit = useCallback(() => {
    if (validatePassword(password, ADMIN_ACCESS_PASSWORD)) {
      setIsAuthenticated(true);
      setModalVisible(false);
      setPassword("");
      toast.success("ยืนยันตัวตนสำเร็จ");
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setErrorMessage("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
    }
  }, [password, pendingAction]);

  return {
    isAuthenticated,
    modalVisible,
    password,
    errorMessage,
    setPassword,
    setErrorMessage,
    requestAccess,
    handlePasswordSubmit,
    handleCancel: () => {
      setModalVisible(false);
      setPassword("");
      setErrorMessage("");
    },
  };
};

const useColumnSearch = <RecordType,>(
  searchInputRefs: React.MutableRefObject<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >,
) =>
  useCallback(
    (
      dataIndex: SearchableColumnKey,
      columnTitle: string,
    ): TableColumn<RecordType> => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div
          style={{ padding: 8 }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Input
            ref={(node) => {
              searchInputRefs.current[dataIndex] = node;
            }}
            placeholder={`ค้นหา ${columnTitle}`}
            value={selectedKeys[0]}
            onChange={(event) =>
              setSelectedKeys(event.target.value ? [event.target.value] : [])
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
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (searchValue, record) =>
        String((record as any)[dataIndex] || "")
          .toLowerCase()
          .includes(String(searchValue).toLowerCase()),
    }),
    [searchInputRefs],
  );

export default function CanteenAppManager() {
  const { token } = theme.useToken();
  const schoolListData = useAppSelector((state) => state.callSchoolList);
  const passwordAuth = usePasswordProtection();

  // States
  const [applicationList, setApplicationList] = useState<ApplicationRecord[]>(
    [],
  );
  const [isApplicationLoading, setIsApplicationLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationRecord | null>(null);
  const [versionHistoryModalVisible, setVersionHistoryModalVisible] =
    useState(false);
  const [versionDataset, setVersionDataset] = useState<VersionDataset>({
    data: [],
    loading: false,
    curl: "",
  });
  const [versionFormModalVisible, setVersionFormModalVisible] = useState(false);
  const [versionFormMode, setVersionFormMode] = useState<"add" | "edit">("add");
  const [currentFormStep, setCurrentFormStep] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [debugData, setDebugData] = useState<any>(null);
  const [deleteTargetRecord, setDeleteTargetRecord] =
    useState<VersionRecord | null>(null);

  const [versionFormInstance] = Form.useForm<VersionFormValues>();
  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const getApplicationColumnSearchProps =
    useColumnSearch<ApplicationRecord>(searchInputRefs);
  const getVersionColumnSearchProps =
    useColumnSearch<VersionRecord>(searchInputRefs);

  const schoolOptions = useMemo(
    () => buildSchoolOptions(schoolListData?.response?.data ?? []),
    [schoolListData],
  );

  // Data Fetchers
  const fetchApplications = useCallback(async () => {
    setIsApplicationLoading(true);
    try {
      const apiResponse = await GET_APPLICATION_LIST();
      setApplicationList(apiResponse?.data?.data ?? []);
    } catch (error) {
      toast.error("โหลดรายการแอปพลิเคชันไม่สำเร็จ");
    } finally {
      setIsApplicationLoading(false);
    }
  }, []);

  const fetchApplicationVersions = useCallback(
    async (applicationId: string | number) => {
      setVersionDataset((previousState) => ({
        ...previousState,
        loading: true,
      }));
      try {
        const apiResponse =
          await GET_APPLICATION_VERSION_BY_APPID(applicationId);
        setVersionDataset({
          data: apiResponse?.data?.data ?? [],
          loading: false,
          curl: apiResponse?.curl ?? "",
        });
      } catch (error) {
        toast.error("โหลดข้อมูลเวอร์ชันไม่สำเร็จ");
        setVersionDataset((previousState) => ({
          ...previousState,
          loading: false,
        }));
      }
    },
    [],
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Event Handlers
  const handleVersionFormSubmit = async () => {
    try {
      const formValues = await versionFormInstance.validateFields();
      setSubmissionStatus("loading");
      setDebugData(null);

      const submissionFormData = new FormData();

      /**
       * ✅ Helper สำหรับการ append ข้อมูลเข้า FormData อย่างปลอดภัย
       * ป้องกันการส่งค่า null, undefined หรือ string "undefined" ไปยัง Server
       */
      const appendSafe = (key: string, value: any) => {
        if (value === null || value === undefined) return;
        const strVal = String(value).trim();
        if (strVal === "" || strVal === "undefined" || strVal === "null")
          return;
        submissionFormData.append(key, strVal);
      };

      // 1. จัดการ App ID และ Version ID
      const appId = formValues.appID || selectedApplication?.app_id;
      appendSafe("app_id", appId);
      appendSafe("version_id", formValues.versionID);

      // 2. ข้อมูลชื่อเวอร์ชันและสภาพแวดล้อม
      appendSafe("version_name", formValues.versionName);
      appendSafe("env", formValues.env);

      // 3. ข้อมูลโรงเรียน
      if (formValues.schoolID) {
        appendSafe("school_id", formValues.schoolID);
      }

      // 4. ข้อมูลอื่นๆ
      submissionFormData.append("note", formValues.note || "");
      submissionFormData.append(
        "is_lastest_version",
        formValues.isLatestVersion ? "1" : "0",
      );
      submissionFormData.append(
        "force_update",
        formValues.forceUpdate ? "1" : "0",
      );

      // 5. ไฟล์ติดตั้ง
      if (formValues.file?.[0]?.originFileObj) {
        submissionFormData.append("file", formValues.file[0].originFileObj);
      }

      // ปิด modal ฟอร์มก่อนเริ่มส่ง
      setVersionFormModalVisible(false);

      const submissionApi =
        versionFormMode === "add"
          ? POST_CREATE_APPLICATION_VERSION
          : POST_UPDATE_APPLICATION_VERSION;

      const apiResponse = await submissionApi(submissionFormData);

      // ✅ ตรวจสอบสถานะการทำงานภายใน response (บาง API ส่ง 200 แต่ status: failed)
      const isFailed =
        apiResponse?.status === "failed" ||
        apiResponse?.data?.status === "failed";

      if (isFailed) {
        setDebugData(apiResponse?.data || apiResponse);
        throw new Error(
          apiResponse?.message ||
            apiResponse?.data?.message ||
            "บันทึกข้อมูลไม่สำเร็จ",
        );
      }

      setSubmissionStatus("success");
      if (selectedApplication)
        fetchApplicationVersions(selectedApplication.app_id);
    } catch (error: any) {
      setSubmissionStatus("error");

      // ✅ ดึงข้อมูล Error ออกมาแสดงผลเพื่อการ Debug
      const apiErrorData = error.response?.data;
      if (apiErrorData) {
        setDebugData(apiErrorData);
        setSubmissionMessage(apiErrorData.message || error.message);
      } else {
        setSubmissionMessage(
          error.message || "เกิดข้อผิดพลาดระหว่างการบันทึกข้อมูล",
        );
      }
    }
  };

  const handleVersionDeletion = async () => {
    if (!deleteTargetRecord) return;
    try {
      const apiResponse = await DELETE_APPLICATION_VERSION(
        deleteTargetRecord.version_id,
      );
      if (apiResponse?.data?.status === "failed")
        throw new Error("ไม่สามารถลบข้อมูลได้");
      toast.success("ลบข้อมูลเวอร์ชันสำเร็จ");
      setDeleteTargetRecord(null);
      if (selectedApplication)
        fetchApplicationVersions(selectedApplication.app_id);
    } catch (error) {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    }
  };

  // Table Columns Definition
  const applicationTableColumns: ColumnsType<ApplicationRecord> = [
    {
      title: "ชื่อแอปพลิเคชัน",
      dataIndex: "app_name",
      render: (applicationName, record) => (
        <Space>
          <div
            style={{
              background: token.colorFillSecondary,
              padding: 8,
              borderRadius: 8,
            }}
          >
            {getPlatformIcon(record.app_type)}
          </div>
          <AntText strong>{applicationName}</AntText>
        </Space>
      ),
      ...getApplicationColumnSearchProps("app_name", "ชื่อแอปพลิเคชัน"),
    },
    {
      title: "App ID",
      dataIndex: "app_id",
      width: 360,
      render: (appId) => <AntText code>{appId}</AntText>,
    },
    {
      title: "แพลตฟอร์ม",
      dataIndex: "app_type",
      align: "center",
      render: (platformType) => <Tag>{platformType}</Tag>,
    },
    {
      title: "ดำเนินการ",
      align: "center",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedApplication(record);
            setVersionHistoryModalVisible(true);
            fetchApplicationVersions(record.app_id);
          }}
        >
          ดูประวัติเวอร์ชัน
        </Button>
      ),
    },
  ];

  const versionTableColumns: ColumnsType<VersionRecord> = [
    {
      title: "ชื่อเวอร์ชัน",
      dataIndex: "version_name",
      fixed: "left",
      width: 180,
      render: (versionName, record) => (
        <Flex vertical gap={4}>
          <AntText strong>{versionName}</AntText>
          <Space size={4} wrap>
            {(record.is_lastest_version === 1 ||
              record.is_lastest_version === true) && (
              <Tag color="green" bordered={false} style={{ fontSize: 10 }}>
                ล่าสุด
              </Tag>
            )}
            {(record.force_update === 1 || record.force_update === true) && (
              <Tag color="red" bordered={false} style={{ fontSize: 10 }}>
                บังคับอัปเดต
              </Tag>
            )}
          </Space>
        </Flex>
      ),
    },
    {
      title: "กลุ่มเป้าหมาย",
      dataIndex: "school_id",
      width: 150,
      render: (schoolIds: any[]) => {
        if (!schoolIds || schoolIds.length === 0) {
          return <Tag color="default">ทุกโรงเรียน</Tag>;
        }

        const schoolNames = schoolIds
          .map((id) => {
            const school = schoolOptions.find(
              (opt) => opt.value === String(id),
            );
            return school ? school.label : `ID: ${id}`;
          })
          .filter(Boolean);

        return (
          <Popover
            title="รายชื่อโรงเรียนที่ปล่อยให้อัปเดต"
            content={
              <ul
                style={{
                  maxHeight: 250,
                  overflowY: "auto",
                  paddingLeft: 20,
                  margin: 0,
                }}
              >
                {schoolNames.map((name, idx) => (
                  <li key={idx}>
                    <AntText style={{ fontSize: 12 }}>{name}</AntText>
                  </li>
                ))}
              </ul>
            }
          >
            <Button size="small" icon={<TeamOutlined />}>
              {schoolIds.length} โรงเรียน
            </Button>
          </Popover>
        );
      },
    },
    {
      title: "สภาพแวดล้อม",
      dataIndex: "env",
      width: 120,
      render: (environment) => (
        <Tag color={getEnvironmentTagColor(environment)}>{environment}</Tag>
      ),
    },
    {
      title: "วันที่อัปเดต",
      dataIndex: "updated_at",
      width: 160,
      render: (updatedDate) =>
        updatedDate ? dayjs(updatedDate).format("D MMM BBBB HH:mm") : "-",
    },
    {
      title: "จัดการ",
      align: "center",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => record.url && window.open(record.url, "_blank")}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() =>
              passwordAuth.requestAccess(() => {
                setVersionFormMode("edit");
                setCurrentFormStep(0);
                setVersionFormModalVisible(true);

                // ✅ ดึง URL และชื่อไฟล์ที่มีอยู่แล้วมาแสดงผล
                const url = record.url || "";
                const fileName = url
                  ? url.substring(url.lastIndexOf("/") + 1)
                  : "";
                const existingFile = url
                  ? [
                      {
                        uid: "-1",
                        name: fileName,
                        status: "done",
                        url: url,
                      },
                    ]
                  : [];

                // ✅ ป้องกันค่า undefined/null หลุดเข้าไปใน Form
                const appIdStr = selectedApplication?.app_id
                  ? String(selectedApplication.app_id)
                  : "";
                const versionIdStr = record.version_id
                  ? String(record.version_id)
                  : "";

                versionFormInstance.setFieldsValue({
                  appID: appIdStr !== "undefined" ? appIdStr : "",
                  versionID: versionIdStr !== "undefined" ? versionIdStr : "",
                  versionName: record.version_name || "",
                  env: record.env || "",
                  note: record.note || "",
                  schoolID: record.school_id?.map((id) => String(id)),
                  isLatestVersion: Boolean(record.is_lastest_version),
                  forceUpdate: Boolean(record.force_update),
                  file: existingFile,
                });
              })
            }
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              passwordAuth.requestAccess(() => setDeleteTargetRecord(record))
            }
          />
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <HeaderBar
        icon={<RocketOutlined />}
        title="ระบบจัดการเวอร์ชันแอปพลิเคชัน"
        subTitle="Application Version Control Center"
      />

      <SummaryCards
        applications={applicationList}
        isLoading={isApplicationLoading}
      />

      <Card
        variant="borderless"
        className="shadow-sm"
        style={{ borderRadius: 16 }}
      >
        <Table
          columns={applicationTableColumns}
          dataSource={applicationList}
          loading={isApplicationLoading}
          rowKey="app_id"
          pagination={{ pageSize: TABLE_PAGE_SIZE }}
        />
      </Card>

      {/* Admin Authentication Modal */}
      <Modal
        title={
          <Space>
            <LockOutlined style={{ color: "#faad14" }} />
            <span>ยืนยันสิทธิ์เข้าถึงระบบ</span>
          </Space>
        }
        open={passwordAuth.modalVisible}
        onCancel={passwordAuth.handleCancel}
        footer={null}
        width={400}
        centered
      >
        <div style={{ paddingTop: 16 }}>
          <AntText type="secondary">
            กรุณายืนยันรหัสผ่านเพื่อดำเนินการที่สำคัญ
          </AntText>
          <Input.Password
            placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
            value={passwordAuth.password}
            onChange={(event) => passwordAuth.setPassword(event.target.value)}
            onPressEnter={passwordAuth.handlePasswordSubmit}
            status={passwordAuth.errorMessage ? "error" : ""}
            style={{ marginTop: 12 }}
            autoFocus
            prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
          />
          {passwordAuth.errorMessage && (
            <AntText type="danger" style={{ display: "block", marginTop: 4 }}>
              {passwordAuth.errorMessage}
            </AntText>
          )}
          <Flex justify="end" gap="small" style={{ marginTop: 20 }}>
            <Button onClick={passwordAuth.handleCancel}>ยกเลิก</Button>
            <Button
              type="primary"
              onClick={passwordAuth.handlePasswordSubmit}
              disabled={!passwordAuth.password}
            >
              ยืนยันรหัสผ่าน
            </Button>
          </Flex>
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        title={
          <Space size="middle">
            <div
              style={{
                background: token.colorFillSecondary,
                padding: 8,
                borderRadius: 8,
              }}
            >
              {getPlatformIcon(selectedApplication?.app_type || "")}
            </div>
            <Flex vertical>
              <AntTitle level={5} style={{ margin: 0 }}>
                {selectedApplication?.app_name}
              </AntTitle>
              <AntText type="secondary" style={{ fontSize: 12 }}>
                ประวัติการปล่อยเวอร์ชัน
              </AntText>
            </Flex>
          </Space>
        }
        open={versionHistoryModalVisible}
        onCancel={() => setVersionHistoryModalVisible(false)}
        width={1200}
        footer={null}
      >
        <div style={{ marginBottom: 16, textAlign: "right" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              passwordAuth.requestAccess(() => {
                setVersionFormMode("add");
                setCurrentFormStep(0);
                versionFormInstance.resetFields();

                // ✅ ป้องกันค่า undefined หลุดเข้าไปใน Form
                const appIdStr = selectedApplication?.app_id
                  ? String(selectedApplication.app_id)
                  : "";

                versionFormInstance.setFieldsValue({
                  appID: appIdStr !== "undefined" ? appIdStr : "",
                  isLatestVersion: false,
                  forceUpdate: false,
                });
                setVersionFormModalVisible(true);
              })
            }
          >
            สร้างเวอร์ชันใหม่
          </Button>
        </div>
        <Table
          columns={versionTableColumns}
          dataSource={versionDataset.data}
          loading={versionDataset.loading}
          rowKey="version_id"
          size="small"
        />
      </Modal>

      {/* Version Form Steps Modal */}
      <Modal
        title={
          versionFormMode === "add"
            ? "ขั้นตอนการสร้างเวอร์ชันใหม่"
            : "แก้ไขรายละเอียดเวอร์ชัน"
        }
        open={versionFormModalVisible}
        onCancel={() => setVersionFormModalVisible(false)}
        width={900}
        footer={[
          <Button
            key="back"
            onClick={() => setCurrentFormStep((step) => step - 1)}
            disabled={currentFormStep === 0}
          >
            ย้อนกลับ
          </Button>,
          currentFormStep < 2 ? (
            <Button
              key="next"
              type="primary"
              onClick={async () => {
                try {
                  if (currentFormStep === 0)
                    await versionFormInstance.validateFields([
                      "versionName",
                      "env",
                    ]);
                  if (currentFormStep === 1 && versionFormMode === "add")
                    await versionFormInstance.validateFields(["file"]);
                  setCurrentFormStep((step) => step + 1);
                } catch (error) {}
              }}
            >
              ถัดไป
            </Button>
          ) : (
            <Button
              key="submit"
              type="primary"
              onClick={handleVersionFormSubmit}
            >
              บันทึกข้อมูลเวอร์ชัน
            </Button>
          ),
        ]}
      >
        <Steps
          current={currentFormStep}
          items={VERSION_FORM_STEPS}
          size="small"
          style={{ margin: "24px 0" }}
        />
        <Form form={versionFormInstance} layout="vertical" preserve={true}>
          <div style={{ display: currentFormStep === 0 ? "block" : "none" }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="appID" label="รหัสแอปพลิเคชัน (App ID)">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="versionName"
                  label="ชื่อเวอร์ชัน (เช่น 1.0.0)"
                  rules={[{ required: true, message: "กรุณาระบุชื่อเวอร์ชัน" }]}
                >
                  <Input placeholder="ระบุเวอร์ชัน" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="env"
                  label="สภาพแวดล้อมระบบ"
                  rules={[{ required: true, message: "กรุณาเลือกสภาพแวดล้อม" }]}
                >
                  <Select options={ENVIRONMENT_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="note" label="บันทึกรายละเอียด (Release Notes)">
                  <Input.TextArea
                    rows={4}
                    placeholder="ระบุรายละเอียดการเปลี่ยนแปลง..."
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={{ display: currentFormStep === 1 ? "block" : "none" }}>
            <Form.Item
              name="file"
              label="ไฟล์ติดตั้งแอปพลิเคชัน"
              valuePropName="fileList"
              getValueFromEvent={(event) =>
                Array.isArray(event) ? event : event?.fileList
              }
              rules={[
                {
                  required: versionFormMode === "add",
                  message: "กรุณาอัปโหลดไฟล์",
                },
              ]}
            >
              <Upload.Dragger
                beforeUpload={() => false}
                maxCount={1}
                accept=".apk,.zip"
              >
                <p>
                  <CloudUploadOutlined
                    style={{ fontSize: 40, color: "#1890ff" }}
                  />
                </p>
                <p style={{ fontSize: 16 }}>
                  คลิกหรือลากไฟล์ .apk หรือ .zip มาวางที่นี่เพื่ออัปโหลด
                </p>
                <p>แนะนำขนาดไฟล์ไม่ควรเกิน 200MB</p>
              </Upload.Dragger>
            </Form.Item>
          </div>

          <div style={{ display: currentFormStep === 2 ? "block" : "none" }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Card
                size="small"
                title={
                  <Space>
                    <InfoCircleOutlined />
                    <span>ตั้งค่าเป็นเวอร์ชันหลัก</span>
                  </Space>
                }
              >
                <Flex justify="space-between" align="center">
                  <AntText>กำหนดให้เป็นเวอร์ชันล่าสุดในระบบ</AntText>
                  <Form.Item
                    name="isLatestVersion"
                    valuePropName="checked"
                    noStyle
                  >
                    <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
                  </Form.Item>
                </Flex>
              </Card>
              <Card
                size="small"
                title={
                  <Space>
                    <TeamOutlined />
                    <span>กลุ่มโรงเรียนเป้าหมาย</span>
                  </Space>
                }
              >
                <div style={{ marginBottom: 12 }}>
                  <AntText type="secondary" style={{ fontSize: 13 }}>
                    เลือกโรงเรียนที่ต้องการให้ได้รับการเข้าถึงเวอร์ชันนี้
                    (หากไม่เลือกจะถือว่าปล่อยให้ "ทุกโรงเรียน")
                  </AntText>
                </div>
                <Form.Item name="schoolID" noStyle>
                  <Select
                    mode="multiple"
                    placeholder="ค้นหาหรือเลือกโรงเรียน..."
                    style={{ width: "100%" }}
                    options={schoolOptions}
                    maxTagCount="responsive"
                    filterOption={(input: string, option: any) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Card>

              <Card
                size="small"
                title={
                  <Space>
                    <WarningOutlined style={{ color: "#faad14" }} />
                    <span>นโยบายการบังคับอัปเดต</span>
                  </Space>
                }
              >
                <Flex justify="space-between" align="center">
                  <AntText>บังคับให้ผู้ใช้งานอัปเดตแอปพลิเคชันทันที</AntText>
                  <Form.Item name="forceUpdate" valuePropName="checked" noStyle>
                    <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
                  </Form.Item>
                </Flex>
              </Card>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Submission Status Feedback Modal */}
      <Modal
        open={submissionStatus !== "idle"}
        footer={null}
        onCancel={() => setSubmissionStatus("idle")}
        centered
        closable={submissionStatus !== "loading"}
        width={850}
      >
        {submissionStatus === "loading" && (
          <Flex vertical align="center" style={{ padding: "48px 0" }}>
            <Spin size="large" />
            <AntText style={{ marginTop: 24, fontSize: 16 }}>
              กำลังดำเนินการบันทึกข้อมูล กรุณารอสักครู่...
            </AntText>
          </Flex>
        )}
        {submissionStatus === "success" && (
          <Result
            status="success"
            title="บันทึกข้อมูลเวอร์ชันสำเร็จ"
            subTitle="ข้อมูลเวอร์ชันใหม่ถูกอัปเดตเข้าสู่ระบบเรียบร้อยแล้ว"
            extra={
              <Button
                type="primary"
                onClick={() => setSubmissionStatus("idle")}
              >
                ตกลง
              </Button>
            }
          />
        )}
        {submissionStatus === "error" && (
          <Result
            status="error"
            title="ไม่สามารถบันทึกข้อมูลได้"
            subTitle={submissionMessage}
            extra={[
              <Button
                type="primary"
                key="close"
                onClick={() => setSubmissionStatus("idle")}
              >
                ตกลง
              </Button>,
            ]}
          >
            {debugData && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  backgroundColor: token.colorFillAlter,
                  borderRadius: 8,
                }}
              >
                <Typography.Title level={5}>
                  <Space>
                    <ApiOutlined /> Debug Information
                  </Space>
                </Typography.Title>

                {debugData._curl && (
                  <div style={{ marginBottom: 12 }}>
                    <AntText
                      strong
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      CURL Command:
                    </AntText>
                    <Input.TextArea
                      rows={4}
                      readOnly
                      value={debugData._curl}
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        background: token.colorBgContainer,
                        color: token.colorInfoText,
                        border: `1px solid ${token.colorBorder}`,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                )}

                {debugData.debug && (
                  <Descriptions
                    column={1}
                    bordered
                    size="small"
                    layout="horizontal"
                    style={{ marginBottom: 12 }}
                  >
                    <Descriptions.Item label="API URL">
                      {debugData.debug.url}
                    </Descriptions.Item>
                    {debugData.debug.status && (
                      <Descriptions.Item label="HTTP Status">
                        {debugData.debug.status}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Error Type">
                      {debugData.debug.type}
                    </Descriptions.Item>
                  </Descriptions>
                )}

                {(debugData.raw || debugData.status === "failed") && (
                  <div>
                    <AntText strong>Server Response:</AntText>
                    <pre
                      style={{
                        margin: "8px 0 0",
                        padding: 12,
                        background: token.colorBgContainer,
                        border: `1px solid ${token.colorBorder}`,
                        borderRadius: 4,
                        maxHeight: 200,
                        overflow: "auto",
                        fontSize: 11,
                        color: token.colorText,
                      }}
                    >
                      {JSON.stringify(debugData.raw || debugData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Result>
        )}
      </Modal>

      {/* Deletion Confirmation Modal */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: "#ff4d4f" }} />
            <span>ยืนยันการลบข้อมูล</span>
          </Space>
        }
        open={!!deleteTargetRecord}
        onOk={handleVersionDeletion}
        onCancel={() => setDeleteTargetRecord(null)}
        okButtonProps={{ danger: true }}
        okText="ยืนยันการลบ"
        cancelText="ยกเลิก"
      >
        <AntText>
          คุณแน่ใจหรือไม่ที่จะลบเวอร์ชัน{" "}
          <AntText strong mark>
            {deleteTargetRecord?.version_name}
          </AntText>{" "}
          ออกจากระบบ?
        </AntText>
        <div style={{ marginTop: 8 }}>
          <AntText type="secondary" italic>
            * ข้อมูลที่ลบไปแล้วจะไม่สามารถกู้คืนกลับมาได้
          </AntText>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
