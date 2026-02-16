"use client";
import {
  CheckCircleFilled,
  DollarOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Image,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import BaseLoadingComponent from "@/components/loading/loading-component-1";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { CallAPI as POST_QRCODE_HEALTH_CHECK } from "@stores/actions/mobile/qrcode-health-check/action";
import { AppDispatch, useAppSelector } from "@stores/store";
import { RequestQRCodeGenerator } from "@stores/type";

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const qrState = useAppSelector((s) => s.callQRCodeHealthCheckReducer);

  const [form] = Form.useForm<RequestQRCodeGenerator["draftValues"]>();
  const [lastPayload, setLastPayload] = useState<
    RequestQRCodeGenerator["draftValues"] | null
  >(null);

  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [isSchoolLoading, setIsSchoolLoading] = useState(false);

  const fetchSchools = useCallback(async () => {
    setIsSchoolLoading(true);
    try {
      const response = await axios.get("/api/v1/school/get-detail");
      // response format: { data: { data: [...] }, curl: ... }
      setSchoolList(response.data?.data?.data ?? []);
    } catch (error) {
      console.error("Failed to fetch schools", error);
      toast.error("โหลดข้อมูลโรงเรียนไม่สำเร็จ");
    } finally {
      setIsSchoolLoading(false);
    }
  }, []);

  const schoolOptions = useMemo(() => {
    return (Array.isArray(schoolList) ? schoolList : []).map((school: any) => {
      const schoolId = school.school_id || school.SchoolID;
      const schoolName = school.SchoolName || school.company_name;
      const schoolNameEn = school.SchoolNameEN || "";

      return {
        label: `[${schoolId}] ${schoolName}${schoolNameEn ? ` (${schoolNameEn})` : ""}`,
        value: String(schoolId),
      };
    });
  }, [schoolList]);

  const handleSubmit = async (
    values: RequestQRCodeGenerator["draftValues"],
  ) => {
    try {
      const payload = {
        ...values,
        school_id: Number(values.school_id) || 0,
        shop_id: Number(values.shop_id) || 0,
        amount: Number(values.amount) || 0,
      };
      setLastPayload(payload);
      await dispatch(POST_QRCODE_HEALTH_CHECK(payload)).unwrap();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบ", {
        description: error?.message,
      });
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    if (qrState.success) {
      toast.success("ตรวจสอบสำเร็จ", {
        description: JSON.stringify(
          qrState.response?.data?.data ?? {},
          null,
          2,
        ),
      });
    }
    if (qrState.error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: JSON.stringify(
          qrState.error ?? qrState.response ?? {},
          null,
          2,
        ),
      });
    }
  }, [qrState.success, qrState.error]);

  const getStatusLabel = (status: string | null) => {
    if (status === "success") return "สำเร็จ";
    if (status === "failed") return "ล้มเหลว";
    return status || "-";
  };

  const renderResult = () => {
    if (qrState.loading) {
      return (
        <Space
          style={{
            width: "100%",
            height: 160,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin size="large" />
        </Space>
      );
    }

    const results = qrState?.response?.data?.data?.results;
    if (Array.isArray(results) && results.length > 0) {
      const result = results[0];
      return (
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="สถานะ">
            {getStatusLabel(result.status)}
          </Descriptions.Item>
          <Descriptions.Item label="จำนวนเงิน">
            {result.request_body?.txnAmount ?? lastPayload?.amount ?? 0} บาท
          </Descriptions.Item>
          <Descriptions.Item label="รหัสโรงเรียน">
            {result.request_body?.reference1 ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="รหัสร้านค้า">
            {result.request_body?.merchantId ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="ธนาคาร">
            {result.bank ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="ระยะเวลาในการตอบกลับ">
            {result.response_time ?? "-"} วินาที
          </Descriptions.Item>
        </Descriptions>
      );
    }

    if (qrState.error) {
      return (
        <Alert
          type="error"
          message="เกิดข้อผิดพลาด"
          description={
            qrState.response?.message || "ไม่สามารถแสดงข้อความข้อผิดพลาดได้"
          }
          showIcon
        />
      );
    }

    return (
      <Typography.Text type="secondary">ยังไม่มีผลการตรวจสอบ</Typography.Text>
    );
  };

  return (
    <DashboardLayout>
      <HeaderBar
        title="QR Code Health Check"
        subTitle="เครื่องมือสร้าง QR Code สำหรับการตรวจสุขภาพ"
        icon={<CheckCircleFilled />}
        color="none"
      />
      {isSchoolLoading && <BaseLoadingComponent />}

      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <Card title="ทดสอบระบบ QR Code">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ amount: 0, school_id: "", shop_id: 0 }}
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="เลือกโรงเรียน"
                  name="school_id"
                  rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
                >
                  <Select
                    showSearch
                    placeholder="เลือกโรงเรียน"
                    options={schoolOptions}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="รหัสร้านค้า"
                  name="shop_id"
                  tooltip="ระบบจะใช้รหัสที่ตั้งค่าจากหลังบ้าน"
                >
                  <InputNumber
                    disabled
                    min={0}
                    prefix={<ShopOutlined />}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={24}>
                <Form.Item
                  label="จำนวนเงิน (บาท)"
                  name="amount"
                  rules={[{ required: true, message: "กรุณากรอกจำนวนเงิน" }]}
                >
                  <InputNumber
                    min={0}
                    prefix={<DollarOutlined />}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col
                xs={24}
                sm={12}
                style={{ display: "flex", alignItems: "flex-end" }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<CheckCircleFilled />}
                >
                  ตรวจสอบระบบ QR Code
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {qrState?.response?.data?.data?.results?.length > 0 && (
          <Card title="QR Code จากธนาคาร">
            <Space style={{ width: "100%", justifyContent: "center" }}>
              <Image
                width={200}
                height={200}
                alt="QR Code"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  qrState.response.data.data.results[0].response_body.qrCode,
                )}`}
              />
            </Space>
          </Card>
        )}

        <Card title="ผลการตรวจสอบ">{renderResult()}</Card>
      </Space>
    </DashboardLayout>
  );
}
