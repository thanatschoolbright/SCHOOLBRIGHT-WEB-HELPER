"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Space,
  Button,
  theme,
  Avatar,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Tooltip,
  Badge,
  Table,
  Row,
  Col,
  Divider,
  Card,
  Drawer,
  Typography,
  DatePicker,
  Steps,
  Result,
  ConfigProvider,
  Descriptions,
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  EditOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SmileOutlined,
  GlobalOutlined,
  SolutionOutlined,
  CloudSyncOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ClearOutlined,
  WarningOutlined,
  CalendarOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import dayjs from "dayjs";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import SummaryCard from "@/components/card/summary-card";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useAppSelector } from "@stores/store";
import { UserProfile } from "@stores/type";
import { SyncModal } from "./components/sync-modal";

// ==========================================
// 1. SERVICES & API CALLS (Logic)
// ==========================================

// TODO: Move to src/services/backend/user-management/user-profile.service.ts
const UserProfileService = {
  fetchUsers: async () => {
    return await axios.get("/api/v2/admin/user-management/read");
  },
  fetchConstants: async () => {
    // New Position API
    return await axios.get("/api/v2/admin/position-management/read?limit=1000"); // Limit 1000 to get all for dropdown
  },
  createUser: async (data: any) => {
    return await axios.post("/api/v2/admin/user-management/create", data);
  },
  updateUser: async (data: any) => {
    return await axios.post("/api/v2/admin/user-management/update", data);
  },
  deleteUser: async (data: any) => {
    return await axios.post("/api/v2/admin/user-management/delete", data);
  },
};

// ==========================================
// 2. TYPES
// ==========================================

interface FilterState {
  search: string;
  position?: number;
  department?: number;
  status?: string;
}

// ==========================================
// 3. COMPONENTS
// ==========================================

import { HuaweiBucketStorageService } from "@/services/huawei-bucket-storage.service";
import { Upload } from "antd";
import type { UploadProps } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const UserFormFields = ({
  isEdit = false,
  positions = [],
  departments = [],
  onCancel,
  form,
}: {
  isEdit?: boolean;
  positions?: any[];
  departments?: any[];
  onCancel: () => void;
  form: any;
}) => {
  // Watch phone for auto password generation
  const phone = Form.useWatch("tel", form);
  const employeeCode = Form.useWatch("employee_code", form); // Watch employee code for naming
  const currentImage = Form.useWatch("profile_image_path", form); // Watch current image

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEdit && phone) {
      // Auto set password if creating new user
      form.setFieldValue("password", phone);
    }
  }, [phone, isEdit, form]);

  // Handle Image Upload
  const handleUploadChange: UploadProps["onChange"] = async (info) => {
    if (info.file.status === "uploading") {
      setUploading(true);
      return;
    }

    // We handle the upload manually via customRequest or directly here
    // But since Antd Upload handles file list, let's use customRequest or beforeUpload
  };

  const customUploadRequest = async ({ file, onSuccess, onError }: any) => {
    setUploading(true);
    try {
      if (!employeeCode) {
        toast.error("กรุณาระบุรหัสพนักงานก่อนอัปโหลดรูปภาพ");
        setUploading(false);
        onError(new Error("Missing employee code"));
        return;
      }

      // Call Huawei Service
      const result =
        await HuaweiBucketStorageService.requestUploadUserProfileImage(
          file,
          employeeCode,
          currentImage, // Pass old image path for cleanup
        );

      if (result && result.url) {
        form.setFieldValue("profile_image_path", result.url);
        toast.success("อัปโหลดรูปภาพสำเร็จ");
        onSuccess(result.url);
      } else {
        throw new Error("Upload failed, no URL returned");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <>
      {/* Account Info */}
      <Divider orientation="left">ข้อมูลบัญชีผู้ใช้</Divider>
      <div className="grid grid-cols-2 gap-4">
        {/* ... (Account Info Fields) ... */}
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "กรุณาระบุ Username" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="username" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          extra={
            !isEdit && (
              <span className="text-xs text-gray-400">
                *ตั้งค่าเริ่มต้นอัตโนมัติจากเบอร์โทรศัพท์
              </span>
            )
          }
          rules={[
            isEdit
              ? { required: false }
              : { required: true, message: "กรุณาระบุ Password" }, // Password optional on edit? Usually yes.
            { min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="******" />
        </Form.Item>
      </div>

      {/* Personal Info */}
      <Divider orientation="left">ข้อมูลส่วนตัว</Divider>

      {/* Avatar Upload Section */}
      <div className="flex justify-center mb-6">
        <Form.Item name="profile_image_path" noStyle>
          <Input type="hidden" />
        </Form.Item>
        <Upload
          name="avatar"
          listType="picture-circle"
          className="avatar-uploader"
          showUploadList={false}
          customRequest={customUploadRequest}
          beforeUpload={(file) => {
            const isJpgOrPng =
              file.type === "image/jpeg" || file.type === "image/png";
            if (!isJpgOrPng) {
              toast.error("You can only upload JPG/PNG file!");
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
              toast.error("Image must smaller than 2MB!");
            }
            return isJpgOrPng && isLt2M;
          }}
        >
          {currentImage ? (
            <img
              src={currentImage}
              alt="avatar"
              style={{
                width: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                height: "100%",
              }}
            />
          ) : (
            uploadButton
          )}
        </Upload>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          name="name"
          label="ชื่อจริง (TH)"
          rules={[{ required: true, message: "กรุณาระบุชื่อจริง" }]}
        >
          <Input prefix={<EditOutlined />} />
        </Form.Item>
        {/* ... (Rest of Personal Info) */}
        <Form.Item
          name="lastname"
          label="นามสกุล (TH)"
          rules={[{ required: true, message: "กรุณาระบุนามสกุล" }]}
        >
          <Input prefix={<EditOutlined />} />
        </Form.Item>
        <Form.Item name="nickname" label="ชื่อเล่น">
          <Input prefix={<SmileOutlined />} />
        </Form.Item>
        <Form.Item
          name="employee_code"
          label="รหัสพนักงาน"
          rules={[{ required: true, message: "กรุณาระบุรหัสพนักงาน" }]} // Required for upload path
        >
          <Input
            prefix={<IdcardOutlined />}
            onChange={(e) =>
              form.setFieldValue("employee_code", e.target.value)
            }
          />
        </Form.Item>
      </div>

      {/* Work Info */}
      <Divider orientation="left">ข้อมูลการทำงาน</Divider>
      <div className="grid grid-cols-2 gap-4">
        {/* Updated Position Select */}
        <Form.Item name="position_id" label="ตำแหน่ง">
          <Select
            placeholder="เลือกตำแหน่ง"
            options={positions.map((p: any) => ({
              label: p.name_th,
              value: p.id,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="department_id" label="แผนก">
          <Select
            placeholder="เลือกแผนก"
            options={departments.map((d: any) => ({
              label: d.name_th,
              value: d.id,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name="role_id" label="บทบาท (Role)">
          <Select
            placeholder="เลือกบทบาท"
            options={[
              { label: "Admin", value: 1 },
              { label: "User", value: 2 },
            ]}
          />
        </Form.Item>
      </div>

      <Divider orientation="left">ไทม์ไลน์การจ้างงาน</Divider>
      <div className="grid grid-cols-2 gap-4">
        <Form.Item name="joined_date" label="วันที่เริ่มงาน">
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            placeholder="เลือกวันที่เริ่มงาน"
          />
        </Form.Item>
        <Form.Item name="resigned_date" label="วันที่ลาออก">
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            placeholder="เลือกวันที่ลาออก"
          />
        </Form.Item>
        <Form.Item name="employment_type" label="ประเภทการจ้างงาน">
          <Select placeholder="เลือกประเภทการจ้างงาน">
            <Select.Option value="FULL_TIME">
              Full-time (พนักงานประจำ)
            </Select.Option>
            <Select.Option value="PART_TIME">
              Part-time (พนักงานชั่วคราว)
            </Select.Option>
            <Select.Option value="CONTRACT">Contract (สัญญาจ้าง)</Select.Option>
            <Select.Option value="INTERN">Intern (ฝึกงาน)</Select.Option>
          </Select>
        </Form.Item>
      </div>

      {/* Contact Info */}
      <Divider orientation="left">ข้อมูลการติดต่อ</Divider>
      <div className="grid grid-cols-2 gap-4">
        <Form.Item name="tel" label="เบอร์โทรศัพท์">
          <Input prefix={<PhoneOutlined />} placeholder="08xxxxxxxx" />
        </Form.Item>
        <Form.Item name="email" label="อีเมล" rules={[{ type: "email" }]}>
          <Input prefix={<MailOutlined />} />
        </Form.Item>
        <Form.Item name="backlog_email" label="Backlog Email">
          <Input prefix={<GlobalOutlined />} />
        </Form.Item>
        {/* Redundant input for manual URL entry if needed, or remove since we have Upload */}
        <Form.Item
          name="profile_image_path_manual"
          label="Profile Image URL (Manual)"
          initialValue={currentImage}
        >
          <Input
            prefix={<GlobalOutlined />}
            placeholder="https://..."
            onChange={(e) =>
              form.setFieldValue("profile_image_path", e.target.value)
            }
          />
        </Form.Item>
      </div>

      {/* IPO Security Audit (Read Only) */}
      {isEdit && (
        <>
          <Divider orientation="left">
            <Space>
              <SafetyCertificateOutlined /> ความปลอดภัย (IPO Audit)
            </Space>
          </Divider>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <Form.Item name="last_login" label="เข้าสู่ระบบล่าสุด">
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="failed_login_attempts"
              label="login ล้มเหลว (ครั้ง)"
            >
              <Input disabled />
            </Form.Item>
          </div>
        </>
      )}

      <Divider />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>ยกเลิก</Button>
        <Button
          type="primary"
          htmlType="submit"
          icon={<CheckCircleOutlined />}
          loading={uploading}
        >
          บันทึกข้อมูล
        </Button>
      </div>
    </>
  );
};

// New component for step-by-step form
const UserStepForm = ({
  modalMode,
  form,
  positions,
  departments,
  onFinish,
  onCancel,
  adminId,
}: {
  modalMode: "create" | "edit" | null;
  form: any;
  positions: any[];
  departments: any[];
  onFinish: (values: any) => Promise<void>;
  onCancel: () => void;
  adminId: number | string;
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false); // For image upload in steps

  const steps = [
    {
      title: "ข้อมูลบัญชี",
      content: (
        <>
          <Divider orientation="left">ข้อมูลบัญชีผู้ใช้</Divider>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "กรุณาระบุ Username" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="username" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              extra={
                <span className="text-xs text-gray-400">
                  *ตั้งค่าเริ่มต้นอัตโนมัติจากเบอร์โทรศัพท์
                </span>
              }
              rules={[
                { required: true, message: "กรุณาระบุ Password" },
                { min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="******" />
            </Form.Item>
          </div>
        </>
      ),
      fields: ["username", "password"],
    },
    {
      title: "ข้อมูลส่วนตัว",
      content: (
        <>
          <Divider orientation="left">ข้อมูลส่วนตัว</Divider>
          <div className="flex justify-center mb-6">
            <Form.Item name="profile_image_path" noStyle>
              <Input type="hidden" />
            </Form.Item>
            <Upload
              name="avatar"
              listType="picture-circle"
              className="avatar-uploader"
              showUploadList={false}
              customRequest={async ({ file, onSuccess, onError }: any) => {
                setUploading(true);
                try {
                  const employeeCode = form.getFieldValue("employee_code");
                  if (!employeeCode) {
                    toast.error("กรุณาระบุรหัสพนักงานก่อนอัปโหลดรูปภาพ");
                    setUploading(false);
                    onError(new Error("Missing employee code"));
                    return;
                  }
                  const currentImage = form.getFieldValue("profile_image_path");
                  const result =
                    await HuaweiBucketStorageService.requestUploadUserProfileImage(
                      file,
                      employeeCode,
                      currentImage,
                    );
                  if (result && result.url) {
                    form.setFieldValue("profile_image_path", result.url);
                    toast.success("อัปโหลดรูปภาพสำเร็จ");
                    onSuccess(result.url);
                  } else {
                    throw new Error("Upload failed, no URL returned");
                  }
                } catch (error) {
                  console.error(error);
                  toast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
                  onError(error);
                } finally {
                  setUploading(false);
                }
              }}
              beforeUpload={(file) => {
                const isJpgOrPng =
                  file.type === "image/jpeg" || file.type === "image/png";
                if (!isJpgOrPng) {
                  toast.error("You can only upload JPG/PNG file!");
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  toast.error("Image must smaller than 2MB!");
                }
                return isJpgOrPng && isLt2M;
              }}
            >
              {form.getFieldValue("profile_image_path") ? (
                <img
                  src={form.getFieldValue("profile_image_path")}
                  alt="avatar"
                  style={{
                    width: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    height: "100%",
                  }}
                />
              ) : (
                <button style={{ border: 0, background: "none" }} type="button">
                  {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>Upload</div>
                </button>
              )}
            </Upload>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="ชื่อจริง (TH)"
              rules={[{ required: true, message: "กรุณาระบุชื่อจริง" }]}
            >
              <Input prefix={<EditOutlined />} />
            </Form.Item>
            <Form.Item
              name="lastname"
              label="นามสกุล (TH)"
              rules={[{ required: true, message: "กรุณาระบุนามสกุล" }]}
            >
              <Input prefix={<EditOutlined />} />
            </Form.Item>
            <Form.Item name="nickname" label="ชื่อเล่น">
              <Input prefix={<SmileOutlined />} />
            </Form.Item>
            <Form.Item
              name="employee_code"
              label="รหัสพนักงาน"
              rules={[{ required: true, message: "กรุณาระบุรหัสพนักงาน" }]}
            >
              <Input prefix={<IdcardOutlined />} />
            </Form.Item>
          </div>
        </>
      ),
      fields: ["name", "lastname", "employee_code"],
    },
    {
      title: "ข้อมูลการทำงานและติดต่อ",
      content: (
        <>
          <Divider orientation="left">ข้อมูลการทำงาน</Divider>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="position_id" label="ตำแหน่ง">
              <Select
                placeholder="เลือกตำแหน่ง"
                options={positions.map((p: any) => ({
                  label: p.name_th,
                  value: p.id,
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="department_id" label="แผนก">
              <Select
                placeholder="เลือกแผนก"
                options={departments.map((d: any) => ({
                  label: d.name_th,
                  value: d.id,
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="role_id" label="บทบาท (Role)">
              <Select
                placeholder="เลือกบทบาท"
                options={[
                  { label: "Admin", value: 1 },
                  { label: "User", value: 2 },
                ]}
              />
            </Form.Item>
          </div>

          <Divider orientation="left">ไทม์ไลน์การจ้างงาน</Divider>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="joined_date" label="วันที่เริ่มงาน">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="เลือกวันที่เริ่มงาน"
              />
            </Form.Item>
            <Form.Item name="resigned_date" label="วันที่ลาออก">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="เลือกวันที่ลาออก"
              />
            </Form.Item>
            <Form.Item name="employment_type" label="ประเภทการจ้างงาน">
              <Select placeholder="เลือกประเภทการจ้างงาน">
                <Select.Option value="FULL_TIME">
                  Full-time (พนักงานประจำ)
                </Select.Option>
                <Select.Option value="PART_TIME">
                  Part-time (พนักงานชั่วคราว)
                </Select.Option>
                <Select.Option value="CONTRACT">
                  Contract (สัญญาจ้าง)
                </Select.Option>
                <Select.Option value="INTERN">Intern (ฝึกงาน)</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Divider orientation="left">ข้อมูลการติดต่อ</Divider>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="tel" label="เบอร์โทรศัพท์">
              <Input prefix={<PhoneOutlined />} placeholder="08xxxxxxxx" />
            </Form.Item>
            <Form.Item name="email" label="อีเมล" rules={[{ type: "email" }]}>
              <Input prefix={<MailOutlined />} />
            </Form.Item>
            <Form.Item name="backlog_email" label="Backlog Email">
              <Input prefix={<GlobalOutlined />} />
            </Form.Item>
          </div>
        </>
      ),
      fields: ["position_id", "department_id", "role_id", "tel", "email"],
    },
    {
      title: "ตรวจสอบข้อมูล",
      content: (
        <>
          <Divider orientation="left">ตรวจสอบข้อมูล</Divider>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Username">
              {form.getFieldValue("username")}
            </Descriptions.Item>
            <Descriptions.Item label="ชื่อ-นามสกุล">
              {form.getFieldValue("name")} {form.getFieldValue("lastname")}
            </Descriptions.Item>
            <Descriptions.Item label="รหัสพนักงาน">
              {form.getFieldValue("employee_code")}
            </Descriptions.Item>
            <Descriptions.Item label="ตำแหน่ง">
              {
                positions.find(
                  (p) => p.id === form.getFieldValue("position_id"),
                )?.name_th
              }
            </Descriptions.Item>
            <Descriptions.Item label="แผนก">
              {
                departments.find(
                  (d) => d.id === form.getFieldValue("department_id"),
                )?.name_th
              }
            </Descriptions.Item>
            <Descriptions.Item label="เบอร์โทรศัพท์">
              {form.getFieldValue("tel")}
            </Descriptions.Item>
            <Descriptions.Item label="อีเมล">
              {form.getFieldValue("email")}
            </Descriptions.Item>
            <Descriptions.Item label="รูปโปรไฟล์">
              {form.getFieldValue("profile_image_path") ? (
                <Avatar
                  src={form.getFieldValue("profile_image_path")}
                  size="large"
                />
              ) : (
                "ไม่มีรูป"
              )}
            </Descriptions.Item>
          </Descriptions>
        </>
      ),
      fields: [], // No specific fields to validate for review
    },
  ];

  const next = async () => {
    try {
      // Validate current step's fields
      await form.validateFields(steps[currentStep].fields);
      setCurrentStep(currentStep + 1);
    } catch (errorInfo) {
      console.log("Failed:", errorInfo);
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง");
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        firstname_th: values.name,
        lastname_th: values.lastname,
        phone: values.tel,
        profile_image: values.profile_image_path,
        position_id: values.position_id,
        department_id: values.department_id,
        created_by: adminId,
        joined_date: values.joined_date
          ? values.joined_date.format("YYYY-MM-DD")
          : null,
        resigned_date: values.resigned_date
          ? values.resigned_date.format("YYYY-MM-DD")
          : null,
        employment_type: values.employment_type || "FULL_TIME",
      };

      // Auto password fallback logic
      if (!payload.password && payload.phone) {
        payload.password = payload.phone;
      }

      await onFinish(payload); // Call the parent's handleSubmit
      setSubmitStatus("success");
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitStatus("error");
      setSubmitError(
        err?.response?.data?.message_th || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      );
    }
  };

  // Watch phone for auto password generation in create mode
  const phone = Form.useWatch("tel", form);
  useEffect(() => {
    if (modalMode === "create" && phone) {
      form.setFieldValue("password", phone);
    }
  }, [phone, modalMode, form]);

  if (submitStatus === "success") {
    return (
      <Result
        status="success"
        title="เพิ่มพนักงานใหม่สำเร็จ!"
        subTitle="ข้อมูลพนักงานถูกบันทึกเข้าสู่ระบบเรียบร้อยแล้ว"
        extra={[
          <Button type="primary" key="console" onClick={onCancel}>
            ปิด
          </Button>,
          <Button
            key="buy"
            onClick={() => {
              form.resetFields();
              setCurrentStep(0);
              setSubmitStatus("idle");
            }}
          >
            เพิ่มพนักงานอีกคน
          </Button>,
        ]}
      />
    );
  }

  if (submitStatus === "error") {
    return (
      <Result
        status="error"
        title="เกิดข้อผิดพลาดในการเพิ่มพนักงาน"
        subTitle={
          submitError || "ไม่สามารถบันทึกข้อมูลพนักงานได้ กรุณาลองใหม่อีกครั้ง"
        }
        extra={[
          <Button
            type="primary"
            key="console"
            onClick={() => setSubmitStatus("idle")}
          >
            ลองอีกครั้ง
          </Button>,
          <Button key="buy" onClick={onCancel}>
            ปิด
          </Button>,
        ]}
      />
    );
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Steps: {
            colorPrimary: "#1890ff",
            // colorTextDescription: "#6b7280",
            // colorTextLabel: "#374151",
          },
        },
      }}
    >
      <Steps
        current={currentStep}
        items={steps.map((item) => ({ title: item.title }))}
      />
      <Form form={form} layout="vertical" className="mt-6">
        <div className="steps-content">{steps[currentStep].content}</div>
        <Divider />
        <div className="steps-action flex justify-end gap-2">
          {currentStep > 0 && (
            <Button style={{ margin: "0 8px" }} onClick={() => prev()}>
              ย้อนกลับ
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={() => next()}>
              ถัดไป
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              type="primary"
              onClick={handleFinalSubmit}
              icon={<CheckCircleOutlined />}
              loading={uploading}
            >
              บันทึกข้อมูล
            </Button>
          )}
          <Button onClick={onCancel}>ยกเลิก</Button>
        </div>
      </Form>
    </ConfigProvider>
  );
};

// ==========================================
// 4. MAIN PAGE
// ==========================================

export default function UserManagementPage() {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";
  const [form] = Form.useForm();
  const router = useRouter();

  // Auth State
  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = authState?.response?.data?.user_data?.admin_id;

  // Local State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({ search: "" });

  // Modals State
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false); // For Role Management

  // --- Logic: Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, posRes, deptRes] = await Promise.all([
        UserProfileService.fetchUsers(),
        UserProfileService.fetchConstants(),
        axios.get("/api/v2/admin/department-management/read?limit=1000"),
      ]);
      setUsers(userRes?.data?.data?.items || []);
      setPositions(posRes?.data?.data?.items || []);
      setDepartments(deptRes?.data?.data?.items || []);
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Logic: Submit ---
  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        firstname_th: values.name, // Map UI 'name' to DB 'firstname_th'
        lastname_th: values.lastname,
        phone: values.tel,
        profile_image: values.profile_image_path,
        position_id: values.position_id,
        department_id: values.department_id,
        // Audit
        created_by: modalMode === "create" ? adminId : undefined,
        updated_by: modalMode === "edit" ? adminId : undefined,
        id: modalMode === "edit" ? selectedUser?.id : undefined,
        // Timeline
        joined_date: values.joined_date
          ? values.joined_date.format("YYYY-MM-DD")
          : null,
        resigned_date: values.resigned_date
          ? values.resigned_date.format("YYYY-MM-DD")
          : null,
        employment_type: values.employment_type || "FULL_TIME",
      };

      if (modalMode === "create") {
        // Auto password fallback logic (already handled in form effect, but double check)
        if (!payload.password && payload.phone) {
          payload.password = payload.phone;
        }
        await UserProfileService.createUser(payload);
      } else {
        await UserProfileService.updateUser(payload);
      }

      toast.success(
        modalMode === "create" ? "เพิ่มพนักงานสำเร็จ" : "แก้ไขข้อมูลสำเร็จ",
      );
      setModalMode(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message_th || "เกิดข้อผิดพลาด");
      throw err; // Re-throw to be caught by UserStepForm's handleFinalSubmit
    }
  };

  // --- Logic: Delete ---
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await UserProfileService.deleteUser({
        id: selectedUser.id,
        deleted_by: adminId,
      });
      toast.success("ลบพนักงานสำเร็จ");
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // --- Filter Logic ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        u.firstname_th?.toLowerCase().includes(searchLower) ||
        u.lastname_th?.toLowerCase().includes(searchLower) ||
        u.employee_code?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower);

      // Assuming user object now has position_id or position object if loaded
      // If user.position is still just a string from old data, this might fail unless we assume mixed.
      // But typically we filter by ID if selected in filter.
      // Let's assume u.position_id or u.position_ref?.id
      // For now, let's try to match position_id if filter is number, else string match if filter is string (legacy)

      let matchesPosition = true;
      if (filters.position) {
        matchesPosition = u.position_id === filters.position;
      }

      const matchesStatus = filters.status ? u.status === filters.status : true;

      let matchesDepartment = true;
      if (filters.department) {
        matchesDepartment = (u as any).department_id === filters.department;
      }

      return (
        matchesSearch && matchesPosition && matchesStatus && matchesDepartment
      );
    });
  }, [users, filters, positions]);

  // --- Summary Card Logic (Raw Data) ---
  const summaryMetrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const inactive = users.filter((u) => u.status !== "ACTIVE").length;
    const admins = users.filter((u) => u.role?.id === 1).length; // Check Role ID = 1

    return [
      {
        title: "พนักงานทั้งหมด",
        value: total,
        icon: <TeamOutlined />,
        color: "#1890ff",
      },
      {
        title: "สถานะ Active",
        value: active,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
      },
      {
        title: "สถานะ Inactive",
        value: inactive,
        icon: <ExclamationCircleOutlined />,
        color: "#faad14",
      },
      {
        title: "จำนวน Admin",
        value: admins,
        icon: <SafetyCertificateOutlined />,
        color: "#722ed1",
      },
    ];
  }, [users]);

  // --- Columns ---
  const columns: ColumnsType<UserProfile> = [
    {
      title: "รหัสพนักงาน",
      key: "codes",
      width: 150,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>
            EMP: {r.employee_code || "-"}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            <LinkOutlined style={{ marginRight: 4 }} />
            ID: {r.admin_id || "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "ข้อมูลพนักงาน",
      key: "fullname",
      width: 300,
      sorter: (a, b) =>
        (a.firstname_th || "").localeCompare(b.firstname_th || ""),
      render: (_, r) => (
        <div className="flex items-start gap-3 py-1">
          <Avatar
            src={r.profile_image_path}
            icon={<UserOutlined />}
            size={48}
            className="border-2 border-white shadow-sm"
          />
          <div className="flex flex-col">
            <Space size={4} align="center">
              <span className="font-bold text-gray-800 text-sm">
                {r.firstname_th} {r.lastname_th}
              </span>
              {r.nickname && (
                <Tag
                  color="orange"
                  className="text-[10px] m-0 px-1 leading-4 h-4 border-none bg-orange-50 text-orange-600 rounded-full"
                >
                  {r.nickname}
                </Tag>
              )}
            </Space>
            <Typography.Text
              type="secondary"
              className="text-[11px] flex items-center gap-1 mt-0.5"
            >
              <MailOutlined style={{ fontSize: 10 }} />
              {r.email || "-"}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              className="text-[11px] flex items-center gap-1"
            >
              <PhoneOutlined style={{ fontSize: 10 }} />
              {r.phone || "-"}
            </Typography.Text>
            {!r.phone && (
              <div className="mt-1">
                <Badge
                  status="warning"
                  text={
                    <span className="text-[10px] text-orange-400">
                      ยังไม่ตั้งรหัสผ่าน
                    </span>
                  }
                />
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "การทำงาน",
      key: "work_info",
      width: 250,
      render: (_, record) => {
        const getEmpType = (type?: string) => {
          switch (type) {
            case "FULL_TIME":
              return { color: "green", label: "พนักงานประจำ" };
            case "PART_TIME":
              return { color: "cyan", label: "พาร์ทไทม์" };
            case "CONTRACT":
              return { color: "gold", label: "สัญญาจ้าง" };
            case "INTERN":
              return { color: "purple", label: "นักศึกษาฝึกงาน" };
            default:
              return { color: "gray", label: "ไม่ระบุ" };
          }
        };
        const emp = getEmpType(record.employment_type);

        return (
          <div className="flex flex-col gap-1">
            <Typography.Text strong className="text-sm">
              {record.position_ref?.name_th || "ไม่มีตำแหน่ง"}
            </Typography.Text>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <ApartmentOutlined />
              {record.department?.name_th || "ไม่มีแผนก"}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <Tag
                color={emp.color}
                className="text-[10px] m-0 border-none rounded-full h-5 leading-5"
              >
                {emp.label}
              </Tag>
              {record.joined_date && (
                <Tag
                  icon={<CalendarOutlined />}
                  className="text-[10px] m-0 border-none bg-gray-100 text-gray-500 rounded-full h-5 leading-5"
                >
                  เริ่ม {dayjs(record.joined_date).format("DD MMM YY")}
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "สถานะบัญชี",
      key: "account_status",
      width: 180,
      render: (_, r) => (
        <div className="flex flex-col gap-1">
          <Badge
            status={r.status === "ACTIVE" ? "success" : "default"}
            text={
              <span
                className={`text-xs font-medium ${r.status === "ACTIVE" ? "text-green-600" : "text-gray-400"}`}
              >
                {r.status === "ACTIVE" ? "ออนไลน์ / ปกติ" : "ระงับการใช้งาน"}
              </span>
            }
          />
          <div className="text-[10px] text-gray-400 mt-1">
            <Typography.Text type="secondary" className="text-[10px] block">
              สิทธิ์: {r.role?.role_name || "User"}
            </Typography.Text>
            {r.last_login && (
              <Typography.Text type="secondary" className="text-[10px]">
                ล่าสุด: {dayjs(r.last_login).format("DD/MM/YY HH:mm")}
              </Typography.Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      width: 150,
      render: (_, r) => (
        <Space size={0}>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined className="text-blue-500" />}
              onClick={() => {
                setSelectedUser(r);
                setDetailModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined className="text-yellow-500" />}
              onClick={() => {
                router.push(`/admin/user-profile/${r.id}`);
              }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedUser(r);
                setDeleteModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        {/* Sync Modal Component */}
        <SyncModal
          open={syncModalOpen}
          onCancel={() => setSyncModalOpen(false)}
          onSuccess={fetchData}
        />

        {/* 1. Header Bar */}
        <HeaderBar
          icon={<TeamOutlined />}
          title="จัดการผู้ใช้งาน (User Management)"
          subTitle="ระบบจัดการพนักงานและสิทธิ์การเข้าใช้งาน (RBAC)"
          extra={
            <Space>
              <Button onClick={fetchData} icon={<ReloadOutlined />}>
                รีเฟรช
              </Button>
              <Button
                type="primary"
                icon={<CloudSyncOutlined />}
                onClick={() => setSyncModalOpen(true)}
              >
                Sync Legacy Data
              </Button>
              <Button
                icon={<SolutionOutlined />}
                onClick={() => setRoleDrawerOpen(true)}
              >
                จัดการบทบาท (Role)
              </Button>
            </Space>
          }
        />

        {/* 2. Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryMetrics.map((m, i) => (
            <div key={i} className="h-full">
              <SummaryCard {...m} isLoading={loading} />
            </div>
          ))}
        </div>

        {/* 3. Filters & Content */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {/* Filter Section - 2 Cols */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} md={12} lg={18}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Typography.Text className="text-gray-500 text-xs mb-1 block">
                      ค้นหาข้อมูล
                    </Typography.Text>
                    <Input
                      prefix={<SearchOutlined className="text-gray-400" />}
                      placeholder="ค้นหาชื่อ, รหัสพนักงาน..."
                      allowClear
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Typography.Text className="text-gray-500 text-xs mb-1 block">
                      กรองตามตำแหน่ง
                    </Typography.Text>
                    <Select
                      placeholder="ตำแหน่งทั้งหมด"
                      className="w-full"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      value={filters.position}
                      onChange={(v) =>
                        setFilters((prev) => ({ ...prev, position: v }))
                      }
                      options={positions.map((p) => ({
                        label: p.name_th,
                        value: p.id,
                      }))}
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Typography.Text className="text-gray-500 text-xs mb-1 block">
                      กรองตามแผนก
                    </Typography.Text>
                    <Select
                      placeholder="แผนกทั้งหมด"
                      className="w-full"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      value={filters.department}
                      onChange={(v) =>
                        setFilters((prev) => ({ ...prev, department: v }))
                      }
                      options={departments.map((d) => ({
                        label: d.name_th,
                        value: d.id,
                      }))}
                    />
                  </Col>
                </Row>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <div className="flex justify-end gap-2">
                  <Button
                    icon={<ClearOutlined />}
                    onClick={() => setFilters({ search: "" })}
                  >
                    ล้างค่า
                  </Button>
                  <Button type="primary" icon={<SearchOutlined />}>
                    ค้นหา
                  </Button>
                </div>
              </Col>
            </Row>
          </div>

          {/* Table Header Action */}
          <div className="flex justify-between items-center mb-4">
            <Typography.Text strong className="text-lg">
              รายชื่อพนักงานทั้งหมด ({filteredUsers.length})
            </Typography.Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setModalMode("create");
                form.resetFields();
              }}
            >
              เพิ่มพนักงาน
            </Button>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* 4. User Modal (Create/Edit) */}
        <Modal
          open={!!modalMode}
          title={
            modalMode === "create"
              ? "เพิ่มพนักงานใหม่ (Step-by-Step)"
              : "แก้ไขข้อมูลพนักงาน"
          }
          onCancel={() => setModalMode(null)}
          width={modalMode === "create" ? 800 : 800}
          footer={null}
          centered
          destroyOnClose
        >
          {modalMode === "create" ? (
            <UserStepForm
              modalMode={modalMode}
              form={form}
              positions={positions}
              departments={departments}
              onFinish={handleSubmit}
              onCancel={() => setModalMode(null)}
              adminId={adminId}
            />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={
                modalMode === "edit" && selectedUser
                  ? {
                      ...selectedUser,
                      name: selectedUser.firstname_th,
                      lastname: selectedUser.lastname_th,
                      tel: selectedUser.phone,
                      profile_image_path: selectedUser.profile_image_path,
                      role_id: selectedUser.role?.id,
                      last_login: selectedUser.last_login
                        ? dayjs(selectedUser.last_login).format(
                            "DD/MM/YYYY HH:mm",
                          )
                        : "-",
                      failed_login_attempts:
                        selectedUser.failed_login_attempts ?? 0,
                      joined_date: selectedUser.joined_date
                        ? dayjs(selectedUser.joined_date)
                        : null,
                      resigned_date: selectedUser.resigned_date
                        ? dayjs(selectedUser.resigned_date)
                        : null,
                      employment_type:
                        selectedUser.employment_type || "FULL_TIME",
                    }
                  : {}
              }
            >
              <UserFormFields
                isEdit={modalMode === "edit"}
                positions={positions}
                departments={departments}
                onCancel={() => setModalMode(null)}
                form={form}
              />
            </Form>
          )}
        </Modal>

        {/* 5. Role Drawer (Stub for now) */}
        <Drawer
          title="จัดการบทบาทและสิทธิ์ (Role & Permission)"
          open={roleDrawerOpen}
          onClose={() => setRoleDrawerOpen(false)}
          width={600}
        >
          <div className="text-center p-10 text-gray-500">
            <SafetyCertificateOutlined className="text-4xl mb-4" />
            <p>ระบบจัดการ Role & Permission อยู่ระหว่างการพัฒนา</p>
            <p className="text-xs">
              สามารถจัดการได้ผ่าน Database Table: Role, RolePermission
            </p>
          </div>
        </Drawer>

        {/* 6. Delete Confirmation Modal */}
        <Modal
          title={
            <Space className="text-red-500">
              <ExclamationCircleOutlined /> ยืนยันการลบ
            </Space>
          }
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          onOk={handleDelete}
          okButtonProps={{ danger: true }}
        >
          <p>
            คุณแน่ใจหรือไม่ที่จะลบพนักงาน:{" "}
            <strong>
              {selectedUser?.firstname_th} {selectedUser?.lastname_th}
            </strong>
          </p>
          <p className="text-red-500 text-xs">
            *การลบนี้จะเป็นการ Soft Delete ข้อมูลยังคงอยู่ในระบบแต่จะไม่แสดงผล
          </p>
        </Modal>

        {/* 5. User Detail Modal */}
        <Modal
          open={detailModalOpen}
          title={
            <Space>
              <InfoCircleOutlined className="text-blue-500" />
              <span>รายละเอียดพนักงาน</span>
            </Space>
          }
          onCancel={() => setDetailModalOpen(false)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>
              ปิดหน้าต่าง
            </Button>,
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                router.push(`/admin/user-profile/${selectedUser?.id}`);
              }}
            >
              แก้ไขข้อมูล
            </Button>,
          ]}
          centered
        >
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-6 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <Avatar
                  size={100}
                  src={selectedUser.profile_image_path}
                  icon={<UserOutlined />}
                  className="border-4 border-white shadow-md"
                />
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {selectedUser.firstname_th} {selectedUser.lastname_th}
                  </Typography.Title>
                  <Typography.Text type="secondary" className="text-lg">
                    {selectedUser.nickname ? `(${selectedUser.nickname})` : ""}
                  </Typography.Text>
                  <div className="mt-2 flex gap-2">
                    <Tag color="blue" className="rounded-full">
                      EMP: {selectedUser.employee_code}
                    </Tag>
                    <Tag color="cyan" className="rounded-full">
                      ID: {selectedUser.admin_id}
                    </Tag>
                    <Tag
                      color={
                        selectedUser.status === "ACTIVE" ? "success" : "default"
                      }
                      className="rounded-full"
                    >
                      {selectedUser.status === "ACTIVE"
                        ? "คัดเลือก/ปกติ"
                        : "ระงับ"}
                    </Tag>
                  </div>
                </div>
              </div>

              <Descriptions
                title="ข้อมูลส่วนตัวและบัญชี"
                bordered
                column={2}
                className="mb-6"
              >
                <Descriptions.Item label="Username">
                  {selectedUser.username}
                </Descriptions.Item>
                <Descriptions.Item label="สิทธิ์การใช้งาน">
                  {selectedUser.role?.role_name || "User"}
                </Descriptions.Item>
                <Descriptions.Item label="อีเมล" span={2}>
                  {selectedUser.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="เบอร์โทรศัพท์">
                  {selectedUser.phone || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Backlog Email">
                  {(selectedUser as any).backlog_email || "-"}
                </Descriptions.Item>
              </Descriptions>

              <Descriptions
                title="ข้อมูลการทำงาน"
                bordered
                column={2}
                className="mb-6"
              >
                <Descriptions.Item label="ตำแหน่ง">
                  {selectedUser.position_ref?.name_th || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="แผนก">
                  {selectedUser.department?.name_th || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="ประเภทการจ้างงาน">
                  {selectedUser.employment_type === "FULL_TIME"
                    ? "พนักงานประจำ"
                    : selectedUser.employment_type === "PART_TIME"
                      ? "พาร์ทไทม์"
                      : selectedUser.employment_type === "CONTRACT"
                        ? "สัญญาจ้าง"
                        : selectedUser.employment_type === "INTERN"
                          ? "นักศึกษาฝึกงาน"
                          : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="วันที่เริ่มงาน">
                  {selectedUser.joined_date
                    ? dayjs(selectedUser.joined_date).format("DD MMMM YYYY")
                    : "-"}
                </Descriptions.Item>
              </Descriptions>

              <Descriptions title="ข้อมูลความปลอดภัย" bordered column={2}>
                <Descriptions.Item label="เข้าสู่ระบบล่าสุด">
                  {selectedUser.last_login
                    ? dayjs(selectedUser.last_login).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Logins ล้มเหลว">
                  {selectedUser.failed_login_attempts || 0} ครั้ง
                </Descriptions.Item>
                <Descriptions.Item label="สร้างเมื่อ" span={2}>
                  {dayjs(selectedUser.created_at).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
