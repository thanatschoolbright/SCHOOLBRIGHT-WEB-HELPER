"use client";

import React from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  DatePicker,
  Select,
  AutoComplete,
  Card,
  Button,
  Divider,
  Space,
  Typography,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { SelectOption } from "@stores/type";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface CreateModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  userOptions: SelectOption[];
  descriptionOptions: SelectOption[];
  handleFormSubmit: (values: any) => Promise<void>;
  loading: boolean;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  setVisible,
  userOptions,
  descriptionOptions,
  handleFormSubmit,
  loading,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleClose = () => {
    setVisible(false);
    form.resetFields();
  };

  const onFinish = async (values: any) => {
    const { request_date, descriptions, ...rest } = values;

    const formattedDescriptions = descriptions?.map((desc: any) => {
      const startDate = desc.timeRange?.[0]
        ? desc.timeRange[0].toISOString()
        : null;
      const endDate = desc.timeRange?.[1]
        ? desc.timeRange[1].toISOString()
        : null;

      let calculatedDuration = 0;
      if (startDate && endDate) {
        const diffInMs = dayjs(endDate).diff(dayjs(startDate));
        calculatedDuration = Number((diffInMs / (1000 * 60 * 60)).toFixed(2));
      }

      return {
        description: desc.description,
        startDate,
        endDate,
        date: startDate,
        duration: calculatedDuration,
        assignee: values.assignee,
      };
    });

    const payload = {
      ...rest,
      request_date: request_date
        ? request_date.toISOString()
        : new Date().toISOString(),
      descriptions: formattedDescriptions,
    };

    await handleFormSubmit(payload);
  };

  const handleTimeRangeChange = (fieldName: number, dates: any) => {
    if (dates && dates[0] && dates[1]) {
      const diffInMs = dates[1].diff(dates[0]);
      const hours = (diffInMs / (1000 * 60 * 60)).toFixed(2);

      const descriptions = form.getFieldValue("descriptions") || [];
      descriptions[fieldName] = {
        ...descriptions[fieldName],
        calculatedDuration: hours,
      };
      form.setFieldsValue({ descriptions });
    }
  };

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined className="text-blue-500" />
          {t("overtime_page.modal_create_title")}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={900}
      centered
      maskClosable={false}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="pt-4">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t("overtime_page.request_date_label")}
              name="request_date"
              rules={[
                {
                  required: true,
                  message: t("overtime_page.request_date_required"),
                },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t("overtime_page.overtime_type_label")}
              name="overtimeType"
              rules={[{ required: true }]}
            >
              <Select size="large" placeholder={t("overtime_page.select_type")}>
                <Select.Option value="normal">
                  {t("overtime_page.type_normal")}
                </Select.Option>
                <Select.Option value="holiday">
                  {t("overtime_page.type_holiday")}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label={t("overtime_page.assignee_label")}
              name="assignee"
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                placeholder={t("overtime_page.select_assignee")}
                showSearch
                optionFilterProp="label"
                options={userOptions}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">{t("overtime_page.work_details")}</Divider>

        <Form.List name="descriptions">
          {(fields, { add, remove }) => (
            <div className="space-y-4">
              {fields.map((field) => {
                const descriptions = form.getFieldValue("descriptions") || [];
                const currentDesc = descriptions[field.name] || {};
                const calculatedDuration =
                  currentDesc.calculatedDuration || "0.00";

                return (
                  <Card
                    key={field.key}
                    size="small"
                    className="bg-gray-50 border-gray-200"
                  >
                    <Row gutter={16} align="top">
                      <Col span={22}>
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              {...field}
                              label={t("overtime_page.time_range_label")}
                              name={[field.name, "timeRange"]}
                              rules={[
                                {
                                  required: true,
                                  message: t(
                                    "overtime_page.time_range_required"
                                  ),
                                },
                              ]}
                              style={{ marginBottom: 12 }}
                            >
                              <RangePicker
                                showTime={{ format: "HH:mm" }}
                                format="DD/MM/YYYY HH:mm"
                                style={{ width: "100%" }}
                                onChange={(dates) =>
                                  handleTimeRangeChange(field.name, dates)
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...field}
                              label={t("overtime_page.description_label")}
                              name={[field.name, "description"]}
                              rules={[
                                {
                                  required: true,
                                  message: t(
                                    "overtime_page.description_required"
                                  ),
                                },
                              ]}
                              style={{ marginBottom: 8 }}
                            >
                              <AutoComplete
                                options={descriptionOptions}
                                placeholder={t(
                                  "overtime_page.description_placeholder"
                                )}
                                filterOption={(inputValue, option) =>
                                  String(option?.value ?? "")
                                    .toLowerCase()
                                    .includes(String(inputValue).toLowerCase())
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <div className="flex items-center gap-2 pb-2">
                              <Text type="secondary" className="text-sm">
                                {t("overtime_page.auto_calculated_duration")}:
                              </Text>
                              <Text strong className="text-blue-600">
                                {calculatedDuration} {t("overtime_page.hours")}
                              </Text>
                            </div>
                          </Col>
                        </Row>
                      </Col>
                      <Col span={2} className="flex justify-end pt-8">
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  </Card>
                );
              })}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                size="large"
              >
                {t("overtime_page.add_work_detail")}
              </Button>
            </div>
          )}
        </Form.List>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={handleClose} size="large">
            {t("overtime_page.cancel")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
          >
            {t("overtime_page.save")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
