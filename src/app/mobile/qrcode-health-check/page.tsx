"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Form,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  CheckCircleFilled,
  ShopOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { AppDispatch, useAppSelector } from "@stores/store";
import { RequestQRCodeGenerator } from "@stores/type";

// Call API
import { CallAPI as POST_QRCODE_HEALTH_CHECK } from "@stores/actions/mobile/qrcode-health-check/action";
import BaseLoadingComponent from "@/components/loading/loading-component-1";

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const QR_CODE_HEALTH_CHECK_STATE = useAppSelector(
    (state) => state.callQRCodeHealthCheckReducer
  );

  const [form] = Form.useForm<RequestQRCodeGenerator["draftValues"]>();
  const [lastPayload, setLastPayload] = useState<
    RequestQRCodeGenerator["draftValues"] | null
  >(null);

  const isLoading = [SCHOOL_LIST_STATE.loading].some(Boolean);

  const schoolOptions = useMemo(() => {
    const data = SCHOOL_LIST_STATE?.draftValues?.data ?? [];
    console.info("SCHOOL_LIST_STATE", SCHOOL_LIST_STATE);
    return (Array.isArray(data) ? data : []).map((school: any) => ({
      label: `${school.SchoolName} (${school.SchoolID})`,
      value: String(school.SchoolID),
    }));
  }, [SCHOOL_LIST_STATE]);

  const handleSubmit = async (
    values: RequestQRCodeGenerator["draftValues"]
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
      console.error("ERROR CATCHING : ", error.message);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบ", { description: error.message });
    }
  };

  useEffect(() => {
    if (QR_CODE_HEALTH_CHECK_STATE.success) {
      toast.success("ตรวจสอบสำเร็จ", {
        description: JSON.stringify(
          QR_CODE_HEALTH_CHECK_STATE.response?.data?.data,
          null,
          2
        ),
      });
    }
    if (QR_CODE_HEALTH_CHECK_STATE.error) {
      toast.error("เกิดข้อผิดพลาด", {
        description: JSON.stringify(QR_CODE_HEALTH_CHECK_STATE.error, null, 2),
      });
    }
  }, [QR_CODE_HEALTH_CHECK_STATE.success, QR_CODE_HEALTH_CHECK_STATE.error]);

  const getStatusLabel = (status: string | null) => {
    if (status === "success") return "สำเร็จ";
    if (status === "failed") return "ล้มเหลว";
    return status || "-";
  };

  const renderResultContent = () => {
    if (QR_CODE_HEALTH_CHECK_STATE.loading) {
      return (
        <Space className="w-full h-40" align="center">
          <Spin size="large" />
        </Space>
      );
    }
    if (QR_CODE_HEALTH_CHECK_STATE?.response?.data?.data?.results?.length > 0) {
      const result = QR_CODE_HEALTH_CHECK_STATE.response.data.data.results[0];
      return (
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="สถานะ">
            {getStatusLabel(result.status)}
          </Descriptions.Item>
          <Descriptions.Item label="จำนวนเงิน">
            {result.request_body.txnAmount || lastPayload?.amount || 0} บาท
          </Descriptions.Item>
          <Descriptions.Item label="รหัสโรงเรียน">
            {result.request_body.reference1}
          </Descriptions.Item>
          <Descriptions.Item label="รหัสร้านค้า">
            {result.request_body.merchantId}
          </Descriptions.Item>
          <Descriptions.Item label="ธนาคาร">{result.bank}</Descriptions.Item>
          <Descriptions.Item label="ระยะเวลาในการตอบกลับ">
            {result.response_time} วินาที
          </Descriptions.Item>
        </Descriptions>
      );
    }
    if (QR_CODE_HEALTH_CHECK_STATE.error) {
      return (
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="สถานะ">เกิดข้อผิดพลาด</Descriptions.Item>
          <Descriptions.Item label="ข้อความ">
            {QR_CODE_HEALTH_CHECK_STATE.response?.message ||
              (typeof QR_CODE_HEALTH_CHECK_STATE.error === "string"
                ? QR_CODE_HEALTH_CHECK_STATE.error
                : "ไม่สามารถแสดงข้อความข้อผิดพลาดได้")}
          </Descriptions.Item>
          <Descriptions.Item label="รายละเอียด">
            {QR_CODE_HEALTH_CHECK_STATE.response?.raw?.ExceptionMessage ||
              "ทางโรงเรียนยังไม่ได้เปิดใช้งานระบบธนาคาร"}
          </Descriptions.Item>
          <Descriptions.Item label="ประเภท">
            {QR_CODE_HEALTH_CHECK_STATE.response?.raw?.ExceptionType ||
              "ไม่ระบุประเภทข้อผิดพลาด"}
          </Descriptions.Item>
        </Descriptions>
      );
    }
    return <p className="text-center text-gray-500">ยังไม่มีผลการตรวจสอบ</p>;
  };

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* Input Field */}
        <ContentCard title="ทดสอบระบบ QR Code" className="xl:col-span-4 w-full">
          {/* Input section */}
          <Form
            form={form}
            layout="vertical"
            initialValues={{ amount: 0, school_id: "", shop_id: 0 }}
            onFinish={handleSubmit}
          >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
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

              <Form.Item
                label="รหัสร้านค้า"
                name="shop_id"
                tooltip="ระบบจะใช้รหัสที่ตั้งค่าจากหลังบ้าน"
              >
                <InputNumber
                  disabled
                  addonBefore={<ShopOutlined />}
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>

              <Form.Item
                label="จำนวนเงิน (บาท)"
                name="amount"
                rules={[{ required: true, message: "กรุณากรอกจำนวนเงิน" }]}
              >
                <InputNumber
                  min={0}
                  addonBefore={<DollarOutlined />}
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckCircleFilled />}
              >
                ตรวจสอบระบบ QR Code
              </Button>
            </Space>
          </Form>
        </ContentCard>

        {QR_CODE_HEALTH_CHECK_STATE?.response?.data?.data?.results?.length >
          0 &&
          (() => {
            const result =
              QR_CODE_HEALTH_CHECK_STATE.response.data.data.results[0];
            return (
              <ContentCard
                title="QR Code จากธนาคาร"
                className="w-1/2 justify-center mx-auto"
              >
                <div className="flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      result.response_body.qrCode
                    )}`}
                    alt="QR Code"
                    className="w-40 h-40 border rounded-lg shadow-md"
                  />
                </div>
              </ContentCard>
            );
          })()}

        <ContentCard
          title="ผลการตรวจสอบ"
          className="w-1/2 justify-center mx-auto"
        >
          {renderResultContent()}
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
