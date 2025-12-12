import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  Button,
  Space,
  Typography,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import type {
  SubProject,
  SubProjectFormValues,
} from "../types/sub-project.types";
import { calculateWorkingHours } from "../utils/date-helpers";
import { ASSET_OPTIONS } from "../utils/constants";

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface SubProjectFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  data: SubProject | null;
  loading: boolean;
  onSubmit: (values: SubProjectFormValues) => Promise<boolean>;
  onCancel: () => void;
}

export const SubProjectFormModal: React.FC<SubProjectFormModalProps> = ({
  open,
  mode,
  data,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const watchedDateRange = Form.useWatch("dateRange", form);

  useEffect(() => {
    if (open) {
      if (mode === "create") {
        form.resetFields();
        form.setFieldsValue({ asset_capture_type: "CAPTUREABLE" });
      } else if (mode === "edit" && data) {
        const range =
          data.startDate && data.endDate
            ? [dayjs(data.startDate), dayjs(data.endDate)]
            : [];

        form.setFieldsValue({
          name: data.name,
          name_en: data.name_en,
          asset_capture_type: data.assetCaptureType,
          dateRange: range,
          estimate_time: calculateWorkingHours(
            data.startDate || "",
            data.endDate || ""
          ).text,
          backlogDescription: data.backlogDescription,
        });
      }
    }
  }, [open, mode, data, form]);

  useEffect(() => {
    if (watchedDateRange) {
      const { text } = calculateWorkingHours(
        watchedDateRange[0],
        watchedDateRange[1]
      );
      form.setFieldValue("estimate_time", text);
    }
  }, [watchedDateRange, form]);

  const handleFinish = async (values: SubProjectFormValues) => {
    const payload = {
      id: data?.id,
      name: values.name,
      name_en: values.name_en,
      assetCaptureType: values.asset_capture_type,
      startDate: values.dateRange?.[0]?.toISOString(),
      endDate: values.dateRange?.[1]?.toISOString(),
      backlogDescription: values.backlogDescription,
    };

    const success = await onSubmit(payload as any);
    if (success) {
      form.resetFields();
      onCancel();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <Space>
          {mode === "create" ? <PlusOutlined /> : <EditOutlined />}
          <Text strong>
            {mode === "create"
              ? t("sub_project_page.modal_create_title")
              : t("sub_project_page.modal_edit_title")}
          </Text>
        </Space>
      }
      width={720}
      footer={null}
      destroyOnClose
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="pt-4"
      >
        <Form.Item
          name="name"
          label={t("sub_project_page.form_name_th")}
          rules={[
            {
              required: true,
              message: t("sub_project_page.form_name_required"),
            },
          ]}
        >
          <Input
            placeholder={t("sub_project_page.form_name_placeholder")}
            size="large"
            prefix={<FileTextOutlined />}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="name_en"
              label={t("sub_project_page.form_name_en")}
            >
              <Input
                placeholder={t("sub_project_page.form_name_en_placeholder")}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="asset_capture_type"
              label={t("sub_project_page.form_asset_type")}
              rules={[{ required: true }]}
            >
              <Select options={ASSET_OPTIONS} size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dateRange"
              label={t("sub_project_page.form_date_range")}
              rules={[
                {
                  required: true,
                  message: t("sub_project_page.form_date_range_required"),
                },
              ]}
            >
              <RangePicker
                className="w-full"
                size="large"
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="estimate_time"
              label={t("sub_project_page.form_estimate_time")}
            >
              <Input readOnly prefix={<ClockCircleOutlined />} size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>
          {t("sub_project_page.form_additional_details")}
        </Divider>

        <Form.Item
          name={["backlogDescription", "note"]}
          label={t("sub_project_page.form_note")}
        >
          <Input.TextArea
            rows={3}
            placeholder={t("sub_project_page.form_note_placeholder")}
          />
        </Form.Item>

        <Form.List name={["backlogDescription", "backlogs"]}>
          {(fields, { add, remove }) => (
            <Card style={{ borderStyle: "dashed" }}>
              <div className="flex justify-between mb-3">
                <Text strong>
                  <LinkOutlined /> {t("sub_project_page.form_attachments")}
                </Text>
                <Button
                  type="dashed"
                  size="small"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                  {t("sub_project_page.form_add_link")}
                </Button>
              </div>
              {fields.map((field) => (
                <Row key={field.key} gutter={8} className="mb-2">
                  <Col span={10}>
                    <Form.Item
                      {...field}
                      name={[field.name, "title"]}
                      rules={[
                        {
                          required: true,
                          message: t(
                            "sub_project_page.form_link_title_required"
                          ),
                        },
                      ]}
                      noStyle
                    >
                      <Input
                        placeholder={t(
                          "sub_project_page.form_link_title_placeholder"
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, "link"]}
                      rules={[
                        {
                          required: true,
                          message: t("sub_project_page.form_link_url_required"),
                        },
                      ]}
                      noStyle
                    >
                      <Input
                        placeholder={t(
                          "sub_project_page.form_link_url_placeholder"
                        )}
                        prefix={<LinkOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  </Col>
                </Row>
              ))}
              {!fields.length && (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <Text type="secondary">
                    {t("sub_project_page.form_no_attachments")}
                  </Text>
                </div>
              )}
            </Card>
          )}
        </Form.List>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onCancel}>
            {t("sub_project_page.form_cancel")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<CheckCircleOutlined />}
          >
            {t("sub_project_page.form_save")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
