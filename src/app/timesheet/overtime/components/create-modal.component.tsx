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
  theme,
  Input,
  Badge,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { SelectOption } from "@stores/type";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { TextArea } = Input;

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
  const { token } = theme.useToken();
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
        <div
          className="flex items-center gap-3 p-4 rounded-t-2xl"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            margin: "-20px -24px 0",
            padding: "24px",
          }}
        >
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl animate-pulse">
            <PlusOutlined style={{ color: "#fff", fontSize: "24px" }} />
          </div>
          <div>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
              เพิ่มรายการโอทีใหม่
            </span>
            <div style={{ fontSize: "13px", color: "#fff", opacity: 0.9, marginTop: 4 }}>
              สร้างคำขอทำงานล่วงเวลา
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={950}
      centered
      maskClosable={false}
      closeIcon={<span style={{ color: "#fff", fontSize: "20px" }}>✕</span>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="pt-6">
        {/* Basic Information Card */}
        <Card
          className="mb-6"
          style={{
            background: "linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)",
            borderRadius: 16,
            border: "2px solid #667eea30",
          }}
          title={
            <Space>
              <CalendarOutlined style={{ color: "#667eea", fontSize: 18 }} />
              <Text strong style={{ fontSize: 16, color: "#667eea" }}>
                ข้อมูลพื้นฐาน
              </Text>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#667eea" }} />
                    <Text strong>วันที่ยื่นคำขอ</Text>
                  </Space>
                }
                name="request_date"
                rules={[
                  {
                    required: true,
                    message: "กรุณาเลือกวันที่ยื่นคำขอ",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  size="large"
                  placeholder="เลือกวันที่"
                  className="hover:border-purple-400 transition-all"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <Space>
                    <ThunderboltOutlined style={{ color: "#ff6b6b" }} />
                    <Text strong>ประเภทการทำโอที</Text>
                  </Space>
                }
                name="overtimeType"
                rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
              >
                <Select
                  size="large"
                  placeholder="เลือกประเภท"
                  className="hov, idx) => {
                const descriptions = form.getFieldValue("descriptions") || [];
                const currentDesc = descriptions[field.name] || {};
                const calculatedDuration =
                  currentDesc.calculatedDuration || "0.00";

                return (
                  <Card
                    key={field.key}
                    className="shadow-sm hover:shadow-lg transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
                      borderRadius: 16,
                      border: "2px solid #667eea20",
                    }}
                    title={
                      <div className="flex items-center justify-between">
                        <Space>
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            }}
                          >
                            <FileTextOutlined style={{ color: "#fff", fontSize: 16 }} />
                          </div>
                          <Text strong style={{ fontSize: 15, color: "#667eea" }}>
                            งานที่ {idx + 1}
                          </Text>
                        </Space>
                        <Tooltip title="ลบรายการนี้">
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined style={{ fontSize: 18 }} />}
                            onClick={() => remove(field.name)}
                            className="hover:scale-110 transition-transform"
                          />
                        </Tooltip>
                      </div>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Form.Item
                          {...field}
                          label={
                            <Space>
                              <ClockCircleOutlined style={{ color: "#52c41a" }} />
                              <Text strong>ช่วงเวลาทำงาน</Text>
                            </Space>
                          }
                          name={[field.name, "timeRange"]}
                          rules={[
                            {
                              required: true,
                              message: "กรุณาเลือกช่วงเวลา",
                            },
                          ]}
                          style={{ marginBottom: 12 }}
                          tooltip="เลือกวันเวลาเริ่มต้นและสิ้นสุดการทำงานล่วงเวลา"
                        >
                          <RangePicker
                            showTime={{ format: "HH:mm" }}
                            format="DD/MM/YYYY HH:mm"
                            style={{ width: "100%" }}
                            size="large"
                            placeholder={["เริ่มต้น", "สิ้นสุด"]}
                            onChange={(dates) =>
                              handleTimeRangeChange(field.name, dates)
                            }
                            className="hover:border-green-400 transition-all"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          {...field}
                          label={
                            <Space>
                              <FileTextOutlined style={{ color: "#1890ff" }} />
                              <Text strong>รายละเอียดงาน</Text>
                            </Space>
                          }
                          name={[field.name, "description"]}
                          rules={[
                            {
                              required: true,
                              message: "กรุณาระบุรายละเอียดงาน",
                            },
                          ]}
                          style={{ marginBottom: 12 }}
                          tooltip="อธิบายงานที่ทำล่วงเวลา หรือเลือกจากรายการ"
                        >
                          <TextArea
                            rows={3}
                            placeholder="พิมพ์รายละเอียดงานที่ทำล่วงเวลา... หรือเลือกจากรายการด้านล่าง"
                            size="large"
                            showCount
                            maxLength={500}
                            className="hover:border-blue-400 transition-all"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <div
                          className="p-4 rounded-xl flex items-center justify-between"
                          style={{
                            background: "linear-gradient(135deg, #52c41a10 0%, #73d13d10 100%)",
                            border: "2px solid #52c41a30",
                          }}
                        >
                          <Space>
                            <ClockCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
                            <Text type="secondary" strong style={{ fontSize: 14 }}>
                              ระยะเวลาคำนวณอัตโนมัติ:
                            </Text>
                          </Space>
                          <Badge
                            count={`${calculatedDuration} ชั่วโมง`}
                            style={{
                              background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
                              fontSize: 16,
                              padding: "6px 16px",
                              height: "auto",
                              fontWeight: 700,
                            }}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                size="large"
                icon={<PlusOutlined />}
                className="hover:border-purple-400 hover:text-purple-600 transition-all"
                style={{
                  height: 60,
                  fontSize: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                }}
              >
                <Text strong>เพิ่มรายการงาน</Text>
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
                              />3 mt-8">
          <Button
            onClick={handleClose}
            size="large"
            icon={<CloseOutlined />}
            style={{
              height: 48,
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              borderWidth: 2,
            }}
            className="hover:border-red-400 hover:text-red-500 transition-all"
          >
            ยกเลิก
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<SaveOutlined />}
            style={{
              height: 48,
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              background: loading
                ? undefined
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            }}
            className="hover:scale-105 transition-all duration-300"
          >
            บันทึกรายการ={{ color: token.colorPrimary }}
                              >
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
