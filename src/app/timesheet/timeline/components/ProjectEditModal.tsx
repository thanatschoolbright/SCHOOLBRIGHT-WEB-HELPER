import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Divider,
  message,
} from "antd";
import {
  ProjectOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { categoryType } from "@/data/timesheet.category.type";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ProjectEditModalProps {
  open: boolean;
  mode: "create" | "edit";
  type: "project" | "sub-project";
  initialValues?: any;
  parentId?: number; // For creating sub-project
  onCancel: () => void;
  onSuccess: () => void;
  currentAdminId: number;
}

const ASSET_OPTIONS = [
  { value: "CAPTUREABLE", label: "สามารถแคปทรัพย์สินได้" },
  { value: "UN_CAPTUREABLE", label: "ไม่สามารถแคปทรัพย์สินได้" },
];

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  open,
  mode,
  type,
  initialValues,
  parentId,
  onCancel,
  onSuccess,
  currentAdminId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (mode === "edit" && initialValues) {
        const values = { ...initialValues };
        if (values.start && values.end) {
          values.dateRange = [dayjs(values.start), dayjs(values.end)];
        }
        form.setFieldsValue(values);
      } else if (mode === "create") {
        form.setFieldsValue({
          status: "open",
          assetCaptureType: "CAPTUREABLE",
        });
      }
    }
  }, [open, mode, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: any = {
        type,
        data: {
          ...values,
          by: currentAdminId,
        },
      };

      if (type === "sub-project") {
        if (values.dateRange) {
          payload.data.startDate = values.dateRange[0].toISOString();
          payload.data.endDate = values.dateRange[1].toISOString();
        }
        if (mode === "create" && parentId) {
          payload.data.project_id = parentId;
        }
      }

      if (mode === "edit") {
        payload.id = initialValues.realId;
      }

      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch("/api/v1/timesheet/project/timeline", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Operation failed");

      message.success(
        `${mode === "create" ? "Created" : "Updated"} successfully`
      );
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialValues?.realId) return;
    Modal.confirm({
      title: "Are you sure you want to delete this?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/v1/timesheet/project/timeline", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              id: initialValues.realId,
              by: currentAdminId,
            }),
          });
          if (!res.ok) throw new Error("Delete failed");
          message.success("Deleted successfully");
          onSuccess();
        } catch (error) {
          message.error("Delete failed");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <Modal
      open={open}
      title={
        <Space>
          {type === "project" ? <ProjectOutlined /> : <FileTextOutlined />}
          {mode === "create" ? "Create" : "Edit"}{" "}
          {type === "project" ? "Project" : "Sub-Project"}
        </Space>
      }
      onCancel={onCancel}
      footer={[
        mode === "edit" && (
          <Button
            key="delete"
            danger
            onClick={handleDelete}
            style={{ float: "left" }}
          >
            Delete
          </Button>
        ),
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          icon={<CheckCircleOutlined />}
        >
          Save
        </Button>,
      ]}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={type === "project" ? "Project Name" : "Feature Name"}
          rules={[{ required: true, message: "Please enter name" }]}
        >
          <Input placeholder="Enter name" />
        </Form.Item>

        {type === "project" && (
          <>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Description" />
            </Form.Item>
            <Form.Item
              name="categoryType"
              label="Category"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select category">
                {categoryType.map((c) => (
                  <Option key={c.id} value={String(c.id)}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}

        {type === "sub-project" && (
          <>
            <Form.Item
              name="dateRange"
              label="Duration"
              rules={[{ required: true }]}
            >
              <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              name="assetCaptureType"
              label="Asset Capture"
              rules={[{ required: true }]}
            >
              <Select options={ASSET_OPTIONS} />
            </Form.Item>
          </>
        )}

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select>
            <Option value="open">Open / In Progress</Option>
            <Option value="close">Closed / Completed</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
