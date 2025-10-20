"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
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
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { InputRef } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
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
import { AppDispatch, useAppSelector } from "@stores/store";
import type {
  ApplicationRecord,
  SearchableColumnKey,
  TableColumn,
  VersionDataset,
  VersionFormValues,
  VersionRecord,
} from "@/types/canteen.type";

const PASSWORD = "SB_ADMIN";
const PAGE_SIZE = 10;

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
          <div
            style={{ padding: 12 }}
            onKeyDown={(event) => event.stopPropagation()}
          >
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
              style={{ marginBottom: 8, display: "block" }}
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
          </div>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const raw = (record as any)[dataIndex];
        if (!raw) {
          return false;
        }
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

//** หน้าหลักจัดการแอปพลิเคชันและเวอร์ชันสำหรับระบบ Canteen
export default function Page() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>("");

  //** ดึงข้อมูลจาก Redux store
  const schoolState = useAppSelector((state) => state.callSchoolList);

  //** สถานะสำหรับจัดการข้อมูลแอปพลิเคชัน
  const [applicationList, setApplicationList] = useState<ApplicationRecord[]>(
    []
  );
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationRecord | null>(null);

  //** สถานะสำหรับจัดการข้อมูลเวอร์ชัน
  const [versionDataset, setVersionDataset] = useState<VersionDataset>({
    data: [],
    loading: false,
    curl: "",
  });

  //** สถานะสำหรับจัดการ UI
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [versionFormVisible, setVersionFormVisible] = useState(false);
  const [versionFormMode, setVersionFormMode] = useState<"add" | "edit">("add");
  const [versionForm] = Form.useForm<VersionFormValues>();
  const [deleteTarget, setDeleteTarget] = useState<VersionRecord | null>(null);

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});
  const getColumnSearchProps =
    useColumnSearch<ApplicationRecord>(searchInputRefs);
  const getVersionColumnSearchProps =
    useColumnSearch<VersionRecord>(searchInputRefs);

  //** โหลดรายการแอปพลิเคชันเมื่อเปิดหน้าครั้งแรก
  useEffect(() => {
    loadApplicationList();
  }, []);

  //** เลือกแอปพลิเคชันแรกเป็นค่าเริ่มต้น
  useEffect(() => {
    if (!selectedApplication && applicationList.length > 0) {
      setSelectedApplication(applicationList[0]);
    }
  }, [applicationList, selectedApplication]);

  //** โหลดข้อมูลเวอร์ชันเมื่อเปิด Modal
  useEffect(() => {
    if (!selectedApplication || !versionModalVisible) {
      return;
    }
    loadVersionList(selectedApplication.app_id);
  }, [selectedApplication, versionModalVisible]);

  //** โหลดรายการแอปพลิเคชันทั้งหมด
  const loadApplicationList = async () => {
    const toastId = toast.loading("กำลังโหลดรายการแอปพลิเคชัน...");
    setApplicationLoading(true);

    try {
      const response = await GET_APPLICATION_LIST();
      const applications = response?.data?.data ?? [];
      setApplicationList(applications);
      toast.success("โหลดรายการแอปพลิเคชันสำเร็จ", { id: toastId });
    } catch (error: any) {
      toast.error(error?.message ?? "ไม่สามารถโหลดรายการแอปพลิเคชันได้", {
        id: toastId,
      });
    } finally {
      setApplicationLoading(false);
    }
  };

  //** โหลดรายการเวอร์ชันตาม app_id
  const loadVersionList = async (appId: string | number) => {
    const toastId = toast.loading("กำลังโหลดเวอร์ชันแอป...");
    setVersionDataset((prev) => ({ ...prev, loading: true }));

    try {
      const response = await GET_APPLICATION_VERSION_BY_APPID(appId);
      const versions = response?.data?.data ?? [];
      setVersionDataset({
        data: versions,
        loading: false,
        curl: response?.curl ?? "",
      });
      toast.success("โหลดเวอร์ชันสำเร็จ", { id: toastId });
    } catch (error: any) {
      setVersionDataset((prev) => ({ ...prev, loading: false }));
      toast.error(error?.message ?? "ไม่สามารถโหลดเวอร์ชันได้", {
        id: toastId,
      });
    }
  };

  //** สร้าง options สำหรับ dropdown โรงเรียน
  const schoolOptions = useMemo(() => {
    return buildSchoolOptions(schoolState?.response?.data ?? []);
  }, [schoolState]);

  //** กำหนด columns สำหรับตารางรายการแอปพลิเคชัน
  const applicationColumns = useMemo<ColumnsType<ApplicationRecord>>(
    () => [
      {
        title: "รหัสแอปพลิเคชัน",
        dataIndex: "app_id",
        width: 400,
        sorter: (a, b) => String(a.app_id).localeCompare(String(b.app_id)),
        ...getColumnSearchProps("app_id", "รหัสแอปพลิเคชัน"),
      },
      {
        title: "ชื่อแอปพลิเคชัน",
        dataIndex: "app_name",
        width: 400,
        sorter: (a, b) => String(a.app_name).localeCompare(String(b.app_name)),
        ...getColumnSearchProps("app_name", "ชื่อแอปพลิเคชัน"),
      },
      {
        title: "แพลตฟอร์ม",
        dataIndex: "app_type",
        width: 200,
        sorter: (a, b) => String(a.app_type).localeCompare(String(b.app_type)),
        filters: Array.from(
          new Set(applicationList.map((item) => item.app_type))
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
              setSelectedApplication(record);
              setVersionModalVisible(true);
            }}
          >
            ดูเวอร์ชัน
          </Button>
        ),
      },
    ],
    [applicationList, getColumnSearchProps]
  );

  //** จัดการการเปลี่ยนแปลงไฟล์อัปโหลด
  const handleUploadChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === "removed") {
      versionForm.setFieldsValue({ file: [] });
    }
  };

  //** ตรวจสอบรหัสผ่าน
  const handlePasswordSubmit = () => {
    if (validatePassword(password, PASSWORD)) {
      setPasswordVisible(false);
      toast.success("เข้าสู่ระบบสำเร็จ");
    } else {
      setPasswordError("รหัสผ่านไม่ถูกต้อง");
    }
  };

  //** คัดลอก CURL command
  const handleCopyCurl = async () => {
    if (!versionDataset.curl) {
      toast.info("ไม่พบคำสั่ง CURL");
      return;
    }

    const success = await copyToClipboard(versionDataset.curl);
    if (success) {
      toast.success("คัดลอก CURL แล้ว");
    } else {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  const openVersionForm = (mode: "add" | "edit", version?: VersionRecord) => {
    setVersionFormMode(mode);
    if (mode === "add") {
      versionForm.resetFields();
      versionForm.setFieldsValue({
        appID: String(selectedApplication?.app_id ?? ""),
        isLatestVersion: false,
        forceUpdate: false,
        file: null,
      });
    } else if (version) {
      versionForm.setFieldsValue({
        appID: String(selectedApplication?.app_id ?? ""),
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
  };

  //** บันทึกข้อมูลเวอร์ชัน (เพิ่มใหม่หรือแก้ไข)
  const handleVersionSubmit = async () => {
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

      // รีเฟรชข้อมูลเวอร์ชัน
      if (selectedApplication) {
        await loadVersionList(selectedApplication.app_id);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? "ไม่สามารถบันทึกเวอร์ชันได้",
        {
          description: "กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
        }
      );
    }
  };

  //** ลบเวอร์ชันแอปพลิเคชัน
  const handleDeleteVersion = async (version: VersionRecord) => {
    const toastId = toast.loading("กำลังลบเวอร์ชัน...");

    try {
      const response = await DELETE_APPLICATION_VERSION(version.version_id);
      toast.success(response?.data?.message ?? "ลบเวอร์ชันสำเร็จ", {
        id: toastId,
      });

      // รีเฟรชข้อมูลเวอร์ชัน
      if (selectedApplication) {
        await loadVersionList(selectedApplication.app_id);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? "เกิดข้อผิดพลาดระหว่างลบเวอร์ชัน",
        {
          id: toastId,
        }
      );
    }
  };

  const versionColumns = useMemo<ColumnsType<VersionRecord>>(
    () => [
      {
        title: "เวอร์ชัน",
        dataIndex: "version_name",
        sorter: (a, b) =>
          String(a.version_name).localeCompare(String(b.version_name)),
        defaultSortOrder: "ascend",
        sortDirections: ["ascend", "descend"],
        ...getVersionColumnSearchProps("version_name", "เวอร์ชัน"),
      },
      {
        title: "สภาพแวดล้อม",
        dataIndex: "env",
        filters: Array.from(
          new Set((versionDataset.data ?? []).map((item) => item.env))
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
        title: "สถานะ",
        dataIndex: "is_lastest_version",
        render: (_value, record) => (
          <Space>
            {record.is_lastest_version === 1 && <Tag color="green">ล่าสุด</Tag>}
            {record.force_update === 1 && <Tag color="red">บังคับอัปเดต</Tag>}
          </Space>
        ),
      },
      {
        title: "การจัดการ",
        key: "actions",
        width: 200,
        render: (_, record) => (
          /* การทำงาน: แสดงชุดปุ่มคำสั่งพร้อมสีที่เหมาะกับบริบท (ดาวน์โหลด, แก้ไข, ลบ) */
          <Flex gap="small" justify="center" className="w-full">
            <Button
              block
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => toast.info("ฟีเจอร์ดาวน์โหลดอยู่ระหว่างพัฒนา")}
            />

            <Button
              block
              type="default"
              icon={<EditOutlined />}
              className="btn-warning"
              onClick={() => openVersionForm("edit", record)}
            />

            <Button
              block
              danger
              type="primary"
              icon={<DeleteOutlined />}
              onClick={() => setDeleteTarget(record)}
            />
          </Flex>
        ),
      },
    ],
    [getVersionColumnSearchProps, openVersionForm, versionDataset.data]
  );

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card
          title="รายการแอปพลิเคชัน"
          loading={applicationLoading}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (!selectedApplication) {
                  toast.info("กรุณาเลือกแอปพลิเคชันก่อน");
                  return;
                }
                openVersionForm("add");
              }}
            >
              เพิ่มเวอร์ชันใหม่
            </Button>
          }
        >
          <Table<ApplicationRecord>
            dataSource={applicationList}
            loading={applicationLoading}
            columns={applicationColumns}
            rowKey={(record) => String(record.app_id)}
            pagination={{ pageSize: PAGE_SIZE }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Space>

      <Modal
        title="กรุณาใส่รหัสผ่านก่อนเข้าใช้งาน"
        open={passwordVisible}
        closable={false}
        footer={null}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.Password
            placeholder="กรอกรหัสผ่าน"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
            }}
          />
          {passwordError && (
            <Typography.Text type="danger">{passwordError}</Typography.Text>
          )}

          <Alert
            type="warning"
            showIcon
            message={
              <Typography.Text
                style={{
                  fontSize: "0.85rem",
                }}
              >
                กรณีไม่ทราบรหัสผ่าน กรุณาติดต่อคุณไลท์ (Tech Lead)
              </Typography.Text>
            }
          />

          <Flex justify="end" gap="small" style={{ width: "100%" }}>
            <Button onClick={() => router.push("/backend")}>ยกเลิก</Button>
            <Button
              type="primary"
              onClick={handlePasswordSubmit}
              disabled={!password}
            >
              ตกลง
            </Button>
          </Flex>
        </Space>
      </Modal>

      <Modal
        title={`เวอร์ชันของ ${selectedApplication?.app_name ?? "-"}`}
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
        <Table<VersionRecord>
          dataSource={versionDataset.data}
          loading={versionDataset.loading}
          columns={versionColumns}
          rowKey={(record) => String(record.version_id)}
          pagination={false}
          locale={{
            emptyText: versionDataset.loading
              ? "กำลังโหลด..."
              : "ไม่พบเวอร์ชัน",
          }}
        />
      </Modal>

      <Modal
        title={
          versionFormMode === "add" ? "เพิ่มเวอร์ชันแอป" : "แก้ไขเวอร์ชันแอป"
        }
        open={versionFormVisible}
        onCancel={() => {
          setVersionFormVisible(false);
        }}
        width={760}
        footer={
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setVersionFormVisible(false);
              }}
            >
              ยกเลิก
            </Button>
            <Button type="primary" onClick={handleVersionSubmit}>
              บันทึกเวอร์ชัน
            </Button>
          </Space>
        }
      >
        <Form<VersionFormValues>
          layout="vertical"
          form={versionForm}
          initialValues={{
            appID: selectedApplication
              ? String(selectedApplication.app_id)
              : "",
            env: "",
            isLatestVersion: false,
            forceUpdate: false,
            file: null,
          }}
        >
          <Card
            size="small"
            loading={versionFormMode === "edit" && versionDataset.loading}
            title={
              <Space>
                <FileTextOutlined />
                <span>รายละเอียดเวอร์ชัน</span>
              </Space>
            }
          >
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
                    disabled={versionFormMode === "edit"}
                    options={applicationList.map((item) => ({
                      label: item.app_name,
                      value: String(item.app_id),
                    }))}
                  />
                </Form.Item>
              </Col>
              {versionFormMode === "edit" && (
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
                  <Select
                    placeholder="เลือกสภาพแวดล้อม"
                    options={[
                      { label: "Production", value: "Production" },
                      { label: "Beta", value: "Beta" },
                      { label: "Development", value: "Development" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="หมายเหตุ" name="note">
                  <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="อัปโหลดไฟล์"
                  name="file"
                  valuePropName="fileList"
                  getValueFromEvent={(info: UploadChangeParam<UploadFile>) =>
                    info.fileList
                  }
                  rules={[
                    {
                      required: versionFormMode === "add",
                      validator: (_, fileList) => {
                        if (!fileList || fileList.length === 0) {
                          return Promise.reject(
                            "กรุณาอัปโหลดไฟล์เวอร์ชัน (.apk หรือ .zip)"
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Upload
                    beforeUpload={() => false}
                    maxCount={1}
                    onChange={handleUploadChange}
                    accept=".apk,.zip"
                    listType="picture"
                  >
                    <Button icon={<CloudUploadOutlined />}>
                      เลือกไฟล์เวอร์ชัน
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Flex gap="large">
                  <Space>
                    <Form.Item name="isLatestVersion" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Typography.Text>เวอร์ชันล่าสุด</Typography.Text>
                  </Space>
                  <Space>
                    <Form.Item name="forceUpdate" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Typography.Text>บังคับอัปเดต</Typography.Text>
                  </Space>
                </Flex>
              </Col>
            </Row>
          </Card>
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
      >
        <Typography.Paragraph>
          ต้องการลบเวอร์ชัน {deleteTarget?.version_name ?? "-"} หรือไม่?
        </Typography.Paragraph>
      </Modal>
    </DashboardLayout>
  );
}
