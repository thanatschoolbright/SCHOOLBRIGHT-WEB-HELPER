"use client";

import { useState } from "react";
import { HeaderBar } from "@components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";
import { TeamOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Row,
  Col,
  message,
  Modal,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserData } from "@helpers/local_storage/user.storage";
import { SelectOption, UserProfile } from "@stores/type";
const { TextArea } = Input;

export type OvertimeFormValues = {
  firstname: string;
  lastname: string;
  employee_code: string;
  role: string;
  department: string;
  descriptions: OvertimeDescription[];
  type: string;
};

export type OvertimeDescription = {
  duration: number;
  description: string;
  assignee: string | number;
};

export default function Page() {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  const router = useRouter();

  const handleFormSubmit = async (values: any) => {
    console.log("Form submitted with values:", values);
    const formValues = {
      ...values,
      submittedAt: new Date().toISOString(),
    };

    try {
      // store data for preview/print page
      localStorage.setItem("ot_preview", JSON.stringify(formValues));
      // navigate to preview page
      router.push("/timesheet/overtime/preview");
    } catch (e) {
      console.error("Failed to store preview data", e);
    }
  };

  //** ดึงข้อมูลผู้มอบหมายงานจาก API มาแสดงใน Select **
  const GET_USER_LIST = async () => {
    try {
      const users = await getUserData();
      console.log("Fetched user list:", users);
      const formattedOption = users.map((user: UserProfile) => ({
        label: `${user.firstname} ${user.lastname}`,
        value: user.admin_id,
      }));
      setUserOptions(formattedOption);
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  };

  const validateTimeRange = (_: any, value: any) => {
    const start = form.getFieldValue("startTime");
    const end = form.getFieldValue("endTime");
    if (start && end) {
      if (dayjs(end).isBefore(dayjs(start))) {
        return Promise.reject(new Error("เวลา End ต้องมากกว่า Start"));
      }
    }
    return Promise.resolve();
  };

  // Live-calculate duration when start/end change

  useEffect(() => {
    GET_USER_LIST();
  }, []);

  return (
    <DashboardLayout>
      {/* หัวข้อ */}
      <HeaderBar
        icon={<TeamOutlined />}
        title="ระบบโอที"
        subTitle="จัดการบันทึกเวลาทำงานล่วงเวลา"
        color="none"
      />

      {/* เนื้อหา */}
      {/* ฟิลเตอร์ */}
      <Card title="ตารางแสดงข้อมูลโอที" style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          style={{ marginBottom: 16 }}
          onClick={() => setVisible(true)}
        >
          เพิ่มบันทึกโอที
        </Button>
      </Card>

      {/* Form : ขอโอที */}
      <Modal
        title="ฟอร์มขออนุมัติโอที"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        destroyOnHidden
        width={880}
        centered
        maskClosable={false}
        styles={{
          body: {
            maxHeight: "70vh",
            overflowY: "auto",
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{}}
          onValuesChange={(_, all) => setFormValues(all)}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="วันที่"
                name="date"
                rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
              >
                <DatePicker style={{ width: "100%" }} format={"DD/MM/YYYY"} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                label="ผู้มอบหมายงาน"
                name="assignee"
                rules={[{ required: true, message: "กรุณาเลือกผู้มอบหมายงาน" }]}
              >
                <Select
                  placeholder="เลือกผู้มอบหมายงาน"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={userOptions}
                />
              </Form.Item>
            </Col>

            {/* ประเภทกขอโอที */}
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                label="ประเภททำงานล่วงเวลา (โอที)"
                name="overtimeType"
                rules={[
                  { required: true, message: "กรุณาเลือกประเภททำงานล่วงเวลา" },
                ]}
              >
                <Select placeholder="เลือกประเภททำงานล่วงเวลา">
                  <Select.Option value="normal">วันทำงานปกติ </Select.Option>
                  <Select.Option value="holiday">วันหยุด</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            {/* รายการรายละเอียดเพิ่มเติม (สามารถเพิ่มได้สูงสุด 10 รายการ) */}
            <Col xs={24}>
              <Form.List name="descriptions">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, idx) => (
                      <Row
                        gutter={16}
                        key={field.key}
                        style={{ marginBottom: 8 }}
                      >
                        <Col xs={24} sm={8} md={6}>
                          <Form.Item
                            {...field}
                            label={`จำนวน (ชั่วโมง) #${idx + 1}`}
                            name={[field.name, "duration"]}
                            fieldKey={[field.fieldKey ?? field.key, "duration"]}
                            rules={[
                              {
                                required: true,
                                message: "กรุณากรอกจำนวนชั่วโมง",
                              },
                            ]}
                          >
                            <Input placeholder="เช่น 2.5" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={14} md={16}>
                          <Form.Item
                            {...field}
                            label={`รายละเอียด #${idx + 1}`}
                            name={[field.name, "description"]}
                            fieldKey={[
                              field.fieldKey ?? field.key,
                              "description",
                            ]}
                            rules={[
                              {
                                required: true,
                                message: "กรุณากรอกรายละเอียด",
                              },
                            ]}
                          >
                            <TextArea
                              placeholder="ระบุรายละเอียดการทำงาน"
                              rows={1}
                            />
                          </Form.Item>
                        </Col>

                        <Col
                          xs={24}
                          sm={2}
                          md={2}
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <MinusCircleOutlined
                            onClick={() => remove(field.name)}
                            style={{ fontSize: 20, color: "#ff4d4f" }}
                          />
                        </Col>
                      </Row>
                    ))}

                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        disabled={fields.length >= 10}
                        style={{ width: "100%" }}
                      >
                        เพิ่มรายละเอียดเพิ่มเติม
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Col>
          </Row>

          <Form.Item>
            <Row justify="end">
              <Col>
                <Button
                  style={{ marginRight: 8 }}
                  onClick={() => {
                    form.resetFields();
                    setVisible(false);
                  }}
                >
                  ยกเลิก
                </Button>
                <Button type="primary" htmlType="submit">
                  ส่งคำขอ
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      {/* ตารางข้อมูล */}
    </DashboardLayout>
  );
}
