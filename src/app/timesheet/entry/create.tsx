import {
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  FormInstance,
} from "antd";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";

interface CreateModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  form: FormInstance;
  projects: any[];
  subProject: any[];
  fetchSubProjects: (id: string) => void;
  i18n: any;
  disabled:boolean
}

export function CreateModalForm({
  open,
  onCancel,
  onSubmit,
  form,
  projects,
  subProject,
  fetchSubProjects,
  i18n,
  disabled
}: CreateModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      title="เพิ่มรายการลงเวลาทำงาน"
      footer={[
        <Button key="cancel" onClick={onCancel}>
          ยกเลิก
        </Button>,
        <Button key="submit" type="primary" onClick={onSubmit} disabled={disabled}>
          บันทึก
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="โครงการหลัก"
          name="project_id"
          rules={[{ required: true, message: "กรุณาเลือกโครงการหลัก" }]}
        >
          <Select
            showSearch
            placeholder="เลือกโครงการหลัก"
            onChange={(value) => {
              fetchSubProjects(String(value));
              form.setFieldsValue({ sub_project_id: "" });
            }}
            options={projects.map((p) => ({
              label: p.name + " (" + "รหัส" + +p.id + ")",
              value: String(p.id),
            }))}
          />
        </Form.Item>

        <Form.Item
          label="โครงการย่อย"
          name="sub_project_id"
          rules={[{ required: true, message: "กรุณาเลือกโครงการย่อย" }]}
        >
          <Select
            showSearch
            placeholder="เลือกโครงการย่อย"
            options={subProject.map((s) => ({
              label: s.name + " (" + "รหัส" + +s.id + ")",
              value: String(s.id),
            }))}
          />
        </Form.Item>

        <Form.Item
          label="วันที่"
          name="date"
          rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="ชั่วโมง"
          name="work_hour"
          rules={[{ required: true, message: "กรุณากรอกชั่วโมง" }]}
        >
          <Input type="number" min={0} placeholder="จำนวนชั่วโมง" />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <Input.TextArea rows={3} placeholder="คำอธิบาย" />
        </Form.Item>

        <Form.Item
          label="สถานะ"
          name="status"
          rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
        >
          <Select
            options={STATUS_OPTIONS.map((s) => ({
              label: i18n.language === "th" ? s.label_th : s.label_en,
              value: s.value,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
