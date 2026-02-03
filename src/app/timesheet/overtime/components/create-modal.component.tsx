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
  FileTextOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
  form: any;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  setVisible,
  userOptions, // NOTE: Use this for Assignee or OT Type as needed
  descriptionOptions,
  handleFormSubmit,
  loading,
  form,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  // Set default assignee to user named "ธนัท" when userOptions change
  React.useEffect(() => {
    if (userOptions && userOptions.length > 0) {
      const thanatUser = userOptions.find((option) => {
        const label = String(option.label || "");
        return label.includes("ธนัท");
      });

      if (thanatUser) {
        form.setFieldValue("assignee", thanatUser.value);
      }
    }
  }, [userOptions, form]);

  const handleClose = () => {
    setVisible(false);
    form.resetFields();
  };

  const onFinish = async (values: any) => {
    console.log("Form submitted with values:", values); // Debug log

    const { request_date, descriptions, overtimeType, assignee, ...rest } =
      values;

    // Validate assignee
    if (!assignee) {
      toast.error("กรุณาเลือกผู้มอบหมายงาน");
      return;
    }

    // Validate descriptions
    if (!descriptions || descriptions.length === 0) {
      toast.error("กรุณาเพิ่มรายการงานอย่างน้อย 1 รายการ");
      return;
    }

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
        assignee: String(assignee), // ผู้มอบหมายงาน
      };
    });

    const payload = {
      ...rest,
      overtimeType: overtimeType || "Normal",
      request_date: request_date
        ? request_date.toISOString()
        : new Date().toISOString(),
      descriptions: formattedDescriptions,
    };

    console.log("Submitting payload:", payload); // Debug log
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
            <div
              style={{
                fontSize: "13px",
                color: "#fff",
                opacity: 0.9,
                marginTop: 4,
              }}
            >
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
      closeIcon={<CloseOutlined style={{ color: "#fff", fontSize: "20px" }} />}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="pt-6">
        {/* Basic Information Card */}
        <Card
          className="mb-6"
          style={{
            background: token.colorBgContainer,
            borderRadius: 16,
            border: `2px solid ${token.colorBorderSecondary}`,
          }}
          styles={{
            body: {},
          }}
          title={
            <Space>
              <CalendarOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
              <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
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
                    <CalendarOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>วันที่ยื่นคำขอ</Text>
                  </Space>
                }
                name="request_date"
                initialValue={dayjs()}
                rules={[
                  {
                    required: true,
                    message: "กรุณาเลือกวันที่ยื่นคำขอ",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%", height: 48, borderRadius: 10 }}
                  format="DD/MM/YYYY"
                  size="large"
                  placeholder="เลือกวันที่"
                  className="hover:border-purple-400 transition-all shadow-sm"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <Space>
                    <ThunderboltOutlined style={{ color: token.colorError }} />
                    <Text strong>ประเภทการทำโอที</Text>
                  </Space>
                }
                name="overtimeType"
                initialValue="Normal"
                rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
              >
                <Select
                  size="large"
                  style={{ height: 48 }}
                  placeholder="เลือกประเภท"
                  className="hover:border-purple-400 transition-all shadow-sm"
                  options={[
                    { value: "Normal", label: "Normal OT" },
                    { value: "Holiday", label: "Holiday OT" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: token.colorSuccess }} />
                    <Text strong>ผู้มอบหมายงาน (Assignee)</Text>
                  </Space>
                }
                name="assignee"
                rules={[{ required: true, message: "กรุณาเลือกผู้มอบหมายงาน" }]}
                tooltip="เลือกพนักงานที่จะเป็นผู้รับมอบหมายงานโอที"
              >
                <Select
                  size="large"
                  style={{ height: 48 }}
                  placeholder="เลือกผู้มอบหมายงาน"
                  className="hover:border-green-400 transition-all shadow-sm"
                  options={userOptions}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Dynamic Form List */}
        <Form.List name="descriptions">
          {(fields, { add, remove }) => (
            <div className="flex flex-col gap-4">
              {fields.map((field, idx) => {
                const descriptions = form.getFieldValue("descriptions") || [];
                const currentDesc = descriptions[field.name] || {};
                const calculatedDuration =
                  currentDesc.calculatedDuration || "0.00";

                return (
                  <Card
                    key={field.key}
                    className="shadow-sm hover:shadow-lg transition-all duration-300"
                    style={{
                      background: token.colorBgContainer,
                      borderRadius: 16,
                      border: `2px solid ${token.colorBorderSecondary}`,
                    }}
                    styles={{
                      body: {},
                    }}
                    title={
                      <div className="flex items-center justify-between">
                        <Space>
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            }}
                          >
                            <FileTextOutlined
                              style={{ color: "#fff", fontSize: 16 }}
                            />
                          </div>
                          <Text
                            strong
                            style={{ fontSize: 15, color: token.colorPrimary }}
                          >
                            งานที่ {idx + 1}
                          </Text>
                        </Space>
                        <Tooltip title="ลบรายการนี้" styles={{ root: {} }}>
                          <Button
                            type="text"
                            danger
                            icon={
                              <MinusCircleOutlined style={{ fontSize: 18 }} />
                            }
                            onClick={() => remove(field.name)}
                            className="hover:scale-110 transition-transform"
                          />
                        </Tooltip>
                      </div>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      {/* Time Selection Group */}
                      <Col span={24}>
                        <div
                          className="p-5 rounded-2xl border-2 border-dashed transition-all"
                          style={{
                            background: token.colorFillAlter,
                            borderColor: token.colorBorderSecondary,
                          }}
                        >
                          <Row gutter={[20, 20]} align="bottom">
                            <Col xs={24} lg={17}>
                              <Form.Item
                                name={[field.name, "timeRange"]}
                                label={
                                  <Space>
                                    <ClockCircleOutlined
                                      style={{ color: token.colorSuccess }}
                                    />
                                    <Text strong>
                                      ช่วงเวลาทำงาน (Start - End)
                                    </Text>
                                  </Space>
                                }
                                rules={[
                                  {
                                    required: true,
                                    message: "กรุณาเลือกช่วงเวลา",
                                  },
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <RangePicker
                                  showTime={{ format: "HH:mm" }}
                                  format="DD/MM/YYYY HH:mm"
                                  style={{
                                    width: "100%",
                                    borderRadius: 10,
                                    height: 48,
                                  }}
                                  size="large"
                                  placeholder={[
                                    "เริ่มต้นการทำงาน",
                                    "สิ้นสุดการทำงาน",
                                  ]}
                                  onChange={(dates) =>
                                    handleTimeRangeChange(field.name, dates)
                                  }
                                  className="hover:border-green-400 transition-all shadow-sm"
                                />
                              </Form.Item>
                            </Col>

                            <Col xs={24} lg={7}>
                              <div
                                className="flex flex-col items-center justify-center rounded-xl p-2 relative overflow-hidden group shadow-sm"
                                style={{
                                  background: `linear-gradient(135deg, ${token.colorSuccess} 0%, ${token.colorSuccessActive} 100%)`,
                                  height: 48,
                                  border: "none",
                                }}
                              >
                                {/* Decorative background element */}
                                <div className="absolute -right-2 -bottom-2 opacity-20 rotate-12 transition-transform group-hover:scale-110">
                                  <ClockCircleOutlined
                                    style={{ fontSize: 40, color: "#fff" }}
                                  />
                                </div>

                                <Text
                                  style={{
                                    color: "rgba(255,255,255,0.8)",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                  }}
                                >
                                  ระยะเวลาปฏิบัติงาน
                                </Text>
                                <div className="flex items-baseline gap-1">
                                  <Text
                                    style={{
                                      color: "#fff",
                                      fontSize: 20,
                                      fontWeight: 800,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {calculatedDuration}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "#fff",
                                      fontSize: 12,
                                      fontWeight: 400,
                                    }}
                                  >
                                    ชม.
                                  </Text>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Col>

                      {/* Description */}
                      <Col span={24}>
                        <Form.Item
                          key={`${field.key}-desc`}
                          name={[field.name, "description"]}
                          label={
                            <Space>
                              <FileTextOutlined
                                style={{ color: token.colorInfo }}
                              />
                              <Text strong>รายละเอียดงาน (Description)</Text>
                            </Space>
                          }
                          rules={[
                            {
                              required: true,
                              message: "กรุณาระบุรายละเอียดงาน",
                            },
                          ]}
                          style={{ marginBottom: 0 }}
                          tooltip="อธิบายงานที่ทำล่วงเวลา หรือเลือกจากรายการที่พบบ่อย"
                        >
                          <AutoComplete
                            options={descriptionOptions}
                            placeholder="พิมพ์รายละเอียดงาน... หรือเลือกจากรายการ"
                            filterOption={(inputValue, option) =>
                              String(option?.value ?? "")
                                .toLowerCase()
                                .includes(String(inputValue).toLowerCase())
                            }
                            className="hover:border-blue-400 transition-all shadow-sm"
                            size="large"
                          >
                            <Input
                              style={{
                                fontSize: 15,
                                borderRadius: 10,
                                height: 48,
                                paddingLeft: 16,
                              }}
                              placeholder="เช่น ตรวจสอบ Error ในระบบ Log"
                            />
                          </AutoComplete>
                        </Form.Item>
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
              </Button>
            </div>
          )}
        </Form.List>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-8">
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
            บันทึกรายการ
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
