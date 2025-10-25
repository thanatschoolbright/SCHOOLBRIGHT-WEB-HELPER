import React, { useCallback, useEffect, useMemo } from "react";
import { 
  Button, 
  DatePicker, 
  Form, 
  Modal, 
  Select, 
  Space,
  theme,
  Typography
} from "antd";
import type { FormInstance } from "antd";
import { 
  ProjectOutlined,
  UserOutlined,
  BarChartOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { Project, SubProject, UserProfile } from "@/stores/type";

const { Text } = Typography;

//** Interface สำหรับ Props ของ ExportModalByProject */
interface ExportModalByProjectProps {
  /** สถานะการแสดง Modal */
  visible: boolean;
  /** สถานะการส่งออก */
  loading: boolean;
  /** ฟังก์ชันปิด Modal */
  onClose: () => void;
  /** ฟังก์ชันส่งออกข้อมูล */
  onExport: (data: ProjectExportData) => Promise<void>;  
  /** รายการโปรเจ็กต์ */
  projects: Project[];
  /** รายการโปรเจ็กต์ย่อย */
  subProjects: SubProject[];
  /** รายการผู้ใช้ */
  users: UserProfile[];
}

//** Interface สำหรับข้อมูลการส่งออกแยกตามโปรเจ็ค */
export interface ProjectExportData {
  start_date: string;
  end_date: string;
  export_type: "project" | "sub_project";
}

//** Interface สำหรับ Form Values */
interface ProjectExportFormValues {
  date_range: [dayjs.Dayjs, dayjs.Dayjs];
  export_type: "project" | "sub_project";
}

//** Component Modal สำหรับส่งออกข้อมูล Timesheet แยกตามโปรเจ็ค */
const ExportModalByProject: React.FC<ExportModalByProjectProps> = ({
  visible,
  loading,
  onClose,
  onExport,
  projects,
  subProjects,
  users,
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm<ProjectExportFormValues>();



  //** จัดการการส่งข้อมูลฟอร์ม */
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      
      await onExport({
        start_date: values.date_range[0].format("YYYY-MM-DD"),
        end_date: values.date_range[1].format("YYYY-MM-DD"),
        export_type: values.export_type,
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
        export_type: "project",
      });
    }
  }, [visible, form]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <Space>
          <BarChartOutlined />
          <span>ส่งออกสรุป Timesheet แยกตามโปรเจ็ค</span>
        </Space>
      }
      footer={null}
      width={700}
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
      <div style={{ padding: `${token.paddingMD}px 0` }}>
        {/* คำอธิบาย */}
        <div 
          style={{ 
            background: token.colorInfoBg,
            border: `1px solid ${token.colorInfoBorder}`,
            borderRadius: token.borderRadius,
            padding: token.paddingMD,
            marginBottom: token.marginLG,
          }}
        >
          <Text type="secondary">
            <strong>รายงานนี้จะแสดง:</strong> สรุปจำนวนชั่วโมงรวมของทุกคนในแต่ละ Project/Sub Project
            เช่น Project A - 134 ชั่วโมง (รวมทุกคน), Project B - 994 ชั่วโมง (รวมทุกคน)
          </Text>
        </div>

        <Form 
          form={form} 
          layout="vertical"
          className="timesheet-form"
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
              placeholder={["วันที่เริ่มต้น", "วันที่สิ้นสุด"]}
            />
          </Form.Item>

          {/* ประเภทการส่งออก */}
          <Form.Item 
            label="ประเภทรายงาน" 
            name="export_type"
            rules={[{required: true, message: "กรุณาเลือกประเภทรายงาน"}]}
          >
            <Select
              placeholder="เลือกประเภทรายงาน"
              size="large"
              style={{
                width: "100%",
                borderRadius: token.borderRadius,
              }}
              suffixIcon={<BarChartOutlined/>}
              options={[
                {
                  label: "📊 สรุปตาม Project (โครงการหลัก)",
                  value: "project",
                },
                {
                  label: "📈 สรุปตาม Sub Project (โครงการย่อย/Feature)",
                  value: "sub_project",
                },
              ]}
            />
          </Form.Item>

          {/* คำแนะนำ */}
          <div style={{ 
            marginBottom: token.marginLG,
            padding: token.paddingSM,
            background: token.colorWarningBg,
            border: `1px solid ${token.colorWarningBorder}`,
            borderRadius: token.borderRadius,
          }}>
            <Text type="warning" style={{ fontSize: token.fontSizeSM }}>
              <strong>หมายเหตุ:</strong> ระบบจะรวมข้อมูลจากทุกคนและทุกโปรเจ็คในช่วงวันที่ที่เลือก
              • <strong>Project:</strong> แสดงผลรวมชั่วโมงตามโครงการหลัก
              • <strong>Sub Project:</strong> แสดงผลรวมชั่วโมงตามโครงการย่อย/Feature
            </Text>
          </div>

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
              icon={<BarChartOutlined />}
              style={{
                borderRadius: token.borderRadius,
              }}
            >
              สร้างรายงาน
            </Button>
          </Space>
        </Form>
      </div>
    </Modal>
  );
};

export default ExportModalByProject;