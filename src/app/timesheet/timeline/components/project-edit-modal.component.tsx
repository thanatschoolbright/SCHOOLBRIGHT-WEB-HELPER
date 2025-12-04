import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  message,
} from "antd";
import {
  ProjectOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { categoryType } from "@/data/timesheet.category.type";
import { ASSET_OPTIONS } from "../utils/timeline.helpers";
import { ModalState } from "../types/timeline.types";

const { RangePicker } = DatePicker;

interface ProjectEditModalProps {
  modal: ModalState;
  onCancel: () => void;
  onSuccess: () => void;
  currentAdminId: number;
}

export const ProjectEditModalComponent: React.FC<ProjectEditModalProps> = ({
  modal,
  onCancel,
  onSuccess,
  currentAdminId,
}) => {
  const { t } = useTranslation("translate");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { open, mode, type, initialValues, parentId } = modal;

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
        mode === "create"
          ? t("timeline_page.modal.success_create")
          : t("timeline_page.modal.success_update")
      );
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error(t("timeline_page.modal.error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialValues?.realId) return;
    Modal.confirm({
      title: t("timeline_page.modal.confirm_delete_title"),
      content: t("timeline_page.modal.confirm_delete_content"),
      okText: t("timeline_page.modal.delete"),
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
          message.success(t("timeline_page.modal.success_delete"));
          onSuccess();
        } catch (error) {
          message.error(t("timeline_page.modal.error_generic"));
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
          {mode === "create"
            ? t("timeline_page.modal.create")
            : t("timeline_page.modal.edit")}{" "}
          {type === "project"
            ? t("timeline_page.modal.project")
            : t("timeline_page.modal.sub_project")}
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
            {t("timeline_page.modal.delete")}
          </Button>
        ),
        <Button key="cancel" onClick={onCancel}>
          {t("timeline_page.modal.cancel")}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          icon={<CheckCircleOutlined />}
        >
          {t("timeline_page.modal.save")}
        </Button>,
      ]}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={
            type === "project"
              ? t("timeline_page.modal.project_name")
              : t("timeline_page.modal.feature_name")
          }
          rules={[{ required: true, message: "Please enter name" }]}
        >
          <Input placeholder="Enter name" />
        </Form.Item>

        {type === "project" && (
          <>
            <Form.Item
              name="description"
              label={t("timeline_page.modal.description")}
            >
              <Input.TextArea rows={3} placeholder="Description" />
            </Form.Item>
            <Form.Item
              name="categoryType"
              label={t("timeline_page.modal.category")}
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select category"
                options={categoryType.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </Form.Item>
          </>
        )}

        {type === "sub-project" && (
          <>
            <Form.Item
              name="dateRange"
              label={t("timeline_page.modal.duration")}
              rules={[{ required: true }]}
            >
              <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              name="assetCaptureType"
              label={t("timeline_page.modal.asset_capture")}
              rules={[{ required: true }]}
            >
              <Select options={ASSET_OPTIONS} />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="status"
          label={t("timeline_page.modal.status")}
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "open", label: t("timeline_page.filters.status_open") },
              {
                value: "close",
                label: t("timeline_page.filters.status_closed"),
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
