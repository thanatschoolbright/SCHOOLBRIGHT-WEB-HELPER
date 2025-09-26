import {
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  FormInstance,
  Space,
  InputNumber,
} from "antd";
import {
  ProjectOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  TagsOutlined,
} from "@ant-design/icons";
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
  disabled: boolean;
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
  disabled,
}: CreateModalProps) {
  return (
    <Modal
      open={open}
      title="เพิ่มรายการลงเวลาทำงาน"
      footer={null}
      onCancel={onCancel}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
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
              value: Number(p.id),
            }))}
            size="large"
            style={{ width: "100%" }}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            suffixIcon={<ProjectOutlined />}
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
            size="large"
            style={{ width: "100%" }}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            suffixIcon={<ApartmentOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="วันที่"
          name="date"
          rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            size="large"
            suffixIcon={<CalendarOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="ชั่วโมง"
          name="work_hour"
          rules={[
            { required: true, message: "กรุณากรอกชั่วโมง" },
            { type: "number", min: 0, message: "ชั่วโมงต้องมากกว่า 0" },
          ]}
        >
          <InputNumber
            type="number"
            min={0}
            placeholder="จำนวนชั่วโมง"
            size="large"
            style={{ width: "100%" }}
            addonAfter={<FieldTimeOutlined />}
          />
        </Form.Item>

        <Form.Item label="คำอธิบาย" name="description">
          <Input.TextArea
            rows={3}
            placeholder="คำอธิบาย"
            size="large"
            style={{ padding: "8px" }}
          />
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
            size="large"
            style={{ width: "100%" }}
            suffixIcon={<TagsOutlined />}
          />
        </Form.Item>
        <Form.Item>
          <Space
            style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
          >
            <Button onClick={onCancel} size="large">
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={disabled}
              disabled={disabled}
            >
              บันทึก
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
