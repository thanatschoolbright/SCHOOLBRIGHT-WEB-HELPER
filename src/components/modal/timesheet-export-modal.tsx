import React, { useCallback, useEffect, useMemo } from "react";
import { 
  Button, 
  DatePicker, 
  Form, 
  InputNumber, 
  Modal, 
  Select, 
  Space,
  theme
} from "antd";
import type { FormInstance } from "antd";
import { 
  ApartmentOutlined,
  ProjectOutlined,
  UserOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { Project, SubProject, UserProfile } from "@/stores/type";
import type { TimesheetExportData } from "@/types/timesheet-table.types";

//** Interface สำหรับ Props ของ ExportModal */
interface ExportModalProps {
  /** สถานะการแสดง Modal */
  visible: boolean;
  /** สถานะการส่งออก */
  loading: boolean;
  /** ฟังก์ชันปิด Modal */
  onClose: () => void;
  /** ฟังก์ชันส่งออกข้อมูล */
  onExport: (data: TimesheetExportData) => Promise<void>;  
  /** รายการโปรเจ็กต์ */
  projects: Project[];
  /** รายการโปรเจ็กต์ย่อย */
  subProjects: SubProject[];
  /** รายการผู้ใช้ */
  users: UserProfile[];
}

//** Interface สำหรับ Form Values */
interface ExportFormValues {
  date_range: [dayjs.Dayjs, dayjs.Dayjs];
  investment: number;
  project_id?: string | number;
  sub_project_id?: string | number;
  created_by?: string | number;
}

//** Component Modal สำหรับส่งออกข้อมูล Timesheet */
const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  loading,
  onClose,
  onExport,
  projects,
  subProjects,
  users,
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm<ExportFormValues>();
  
  //** ดูค่าที่เลือกใน project_id */
  const selectedProjectId = Form.useWatch("project_id", form);

  //** สร้าง Options สำหรับ Project Dropdown */
  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        label: `${project.name ?? "ไม่ระบุ"} (รหัส ${project.id})`,
        value: project.id,
      })),
    [projects]
  );

  //** สร้าง Options สำหรับ Sub Project Dropdown */
  const subProjectOptions = useMemo(() => {
    const targetProjectId = selectedProjectId
      ? Number(selectedProjectId)
      : undefined;
    const scopedSubProjects = targetProjectId
      ? subProjects.filter(
          (item) => Number(item.project_id) === Number(targetProjectId)
        )
      : subProjects;

    return scopedSubProjects.map((subProject) => ({
      label: `${subProject.name ?? "ไม่ระบุ"} (รหัส ${subProject.id})`,
      value: String(subProject.id),
    }));
  }, [selectedProjectId, subProjects]);

  //** สร้าง Options สำหรับ User Dropdown */
  const userOptions = useMemo(
    () =>
      users.map((user) => {
        const fullname = `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim();
        const displayName = fullname || user.name || user.email;
        const code = user.employee_code ? ` • รหัส ${user.employee_code}` : "";
        return {
          label: `${displayName}${code}`,
          value: String(user.admin_id ?? user.id ?? ""),
        };
      }),
    [users]
  );

  //** จัดการการส่งข้อมูลฟอร์ม */
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const investmentValue = Number(values.investment);
      
      if (!Number.isFinite(investmentValue) || investmentValue <= 0) {
        throw new Error("งบการลงทุนต้องเป็นตัวเลขมากกว่า 0");
      }

      await onExport({
        start_date: values.date_range[0].format("YYYY-MM-DD"),
        end_date: values.date_range[1].format("YYYY-MM-DD"),
        project_id: values.project_id || "",
        sub_project_id: values.sub_project_id || "",
        created_by: values.created_by || "",
        investment: investmentValue,
      });
      
      //** ปิด Modal และรีเซ็ตฟอร์มหลังส่งออกสำเร็จ */
      onClose();
      form.resetFields();
    } catch (error) {
      // Error จะถูกจัดการใน onExport function
      console.error("Export error:", error);
    }
  }, [form, onExport, onClose]);

  //** รีเซ็ตฟอร์มเมื่อเปิด Modal */
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        date_range: [dayjs().startOf("month"), dayjs()],
        project_id: undefined,
        sub_project_id: undefined,
        created_by: undefined,
        investment: undefined,
      });
    }
  }, [visible, form]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title="ส่งออก Timesheet (Template)"
      footer={null}
      width={600}
      centered
      className="timesheet-modal"
      styles={{
        content: {
          borderRadius: token.borderRadiusLG,
        },
        header: {
          borderBottom: `1px solid ${token.colorBorder}`,
        },
      }}
    >
      <Form 
        form={form} 
        layout="vertical"
        className="timesheet-form"
        style={{
          padding: `${token.paddingMD}px 0`,
        }}
      >
        {/* ช่วงวันที่ */}
        <Form.Item
          label="ช่วงวันที่"
          name="date_range"
          rules={[{required: true, message: "กรุณาเลือกช่วงวันที่"}]}
        >
          <DatePicker.RangePicker
            style={{
              width: "100%",
              borderRadius: token.borderRadius,
            }}
            format="DD/MM/YYYY"
            size="large"
          />
        </Form.Item>

        {/* งบการลงทุน */}
        <Form.Item
          label="งบการลงทุนรวม (บาท)"
          name="investment"
          rules={[
            {required: true, message: "กรุณาระบุงบการลงทุน"},
            {
              validator: (_rule, value) => {
                if (value === undefined || value === null) {
                  return Promise.reject("กรุณาระบุงบการลงทุน");
                }
                if (value <= 0) {
                  return Promise.reject("งบการลงทุนต้องมากกว่า 0");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            style={{
              width: "100%",
              borderRadius: token.borderRadius,
            }}
            size="large"
            min={0.01}
            step={0.01}
            precision={2}
            placeholder="ระบุจำนวนเงินรวมที่ต้องการจัดสรร"
          />
        </Form.Item>

        {/* โครงการหลัก */}
        <Form.Item label="โครงการหลัก" name="project_id">
          <Select
            allowClear
            showSearch
            placeholder="เลือกโครงการหลัก (ไม่บังคับ)"
            options={projectOptions}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onChange={() =>
              form.setFieldsValue({sub_project_id: undefined})
            }
            suffixIcon={<ProjectOutlined/>}
            style={{
              width: "100%",
              borderRadius: token.borderRadius,
            }}
            size="large"
          />
        </Form.Item>

        {/* โครงการย่อย */}
        <Form.Item label="โครงการย่อย" name="sub_project_id">
          <Select
            allowClear
            showSearch
            placeholder="เลือกโครงการย่อย (ไม่บังคับ)"
            options={subProjectOptions}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            suffixIcon={<ApartmentOutlined/>}
            style={{
              width: "100%",
              borderRadius: token.borderRadius,
            }}
            size="large"
          />
        </Form.Item>

        {/* ผู้จัดทำ */}
        <Form.Item label="ผู้จัดทำ" name="created_by">
          <Select
            allowClear
            showSearch
            placeholder="เลือกผู้จัดทำ (ไม่บังคับ)"
            options={userOptions}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            suffixIcon={<UserOutlined/>}
            style={{
              width: "100%",
              borderRadius: token.borderRadius,
            }}
            size="large"
          />
        </Form.Item>

        {/* ปุ่มจัดการ */}
        <Space 
          style={{
            width: "100%", 
            justifyContent: "flex-end",
            marginTop: token.marginLG
          }}
        >
          <Button 
            onClick={onClose}
            size="large"
            style={{
              borderRadius: token.borderRadius,
            }}
          >
            ยกเลิก
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            size="large"
            style={{
              borderRadius: token.borderRadius,
            }}
          >
            ส่งออก
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

export default ExportModal;