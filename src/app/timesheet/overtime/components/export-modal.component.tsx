import React, { useEffect } from "react";
import {
  Modal,
  DatePicker,
  Form,
  Space,
  Typography,
  Alert,
  Steps,
  Result,
  Button,
  theme,
} from "antd";
import {
  FileExcelOutlined,
  CalendarOutlined,
  LoadingOutlined,
  SolutionOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.locale("th");

const { Text } = Typography;

interface ExportModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onExport: (date: dayjs.Dayjs) => void;
  loading: boolean;
  exportStep: number;
  isExportSuccess: boolean;
  setIsExportSuccess: (success: boolean) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  setVisible,
  onExport,
  loading,
  exportStep,
  isExportSuccess,
  setIsExportSuccess,
}) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  // รีเซ็ตสถานะเมื่อปิด Modal
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setIsExportSuccess(false);
        form.resetFields();
      }, 300);
    }
  }, [visible, setIsExportSuccess, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onExport(values.month);
    });
  };

  const renderContent = () => {
    if (isExportSuccess) {
      return (
        <Result
          status="success"
          title={
            <Text strong style={{ fontSize: "22px" }}>
              คุณดาวน์โหลดไฟล์สำเร็จ
            </Text>
          }
          subTitle="ระบบได้ทำการประมวลผลและส่งไฟล์รายงานให้คุณเรียบร้อยแล้ว"
          extra={[
            <Button
              type="primary"
              key="close"
              onClick={() => setVisible(false)}
              style={{
                background: token.colorPrimary,
                borderColor: token.colorPrimary,
                borderRadius: "8px",
                height: "40px",
                padding: "0 30px",
              }}
            >
              ตกลง
            </Button>,
          ]}
        />
      );
    }

    if (loading || exportStep > 0) {
      return (
        <div style={{ padding: "20px 0" }}>
          <Steps
            direction="vertical"
            current={exportStep - 1}
            items={[
              {
                title: "เตรียมคำขอ",
                description: "กำลังตรวจสอบสิทธิ์และพารามิเตอร์...",
                icon:
                  exportStep === 1 ? <LoadingOutlined /> : <SolutionOutlined />,
              },
              {
                title: "ประมวลผลบนเซิร์ฟเวอร์",
                description:
                  "กำลังดึงข้อมูลและสร้างไฟล์ Excel ระดับ Enterprise...",
                icon:
                  exportStep === 2 ? (
                    <LoadingOutlined />
                  ) : (
                    <FileExcelOutlined />
                  ),
              },
              {
                title: "ส่งมอบไฟล์",
                description: "กำลังส่งไฟล์ไปยังเบราว์เซอร์ของคุณ...",
                icon:
                  exportStep === 3 ? (
                    <LoadingOutlined />
                  ) : (
                    <CloudDownloadOutlined />
                  ),
              },
              {
                title: "สำเร็จ",
                description: "ดาวน์โหลดเสร็จสมบูรณ์",
                icon: <CheckCircleOutlined />,
              },
            ]}
          />
        </div>
      );
    }

    return (
      <div style={{ padding: "10px 0" }}>
        <Alert
          message="ข้อมูลที่ส่งออกจะถูกจัดรูปแบบตามมาตรฐาน Enterprise"
          type="info"
          showIcon
          style={{ marginBottom: "20px", borderRadius: "8px" }}
        />

        <Form form={form} layout="vertical" initialValues={{ month: dayjs() }}>
          <Form.Item
            name="month"
            label={<Text strong>เลือกเดือนที่ต้องการส่งออก</Text>}
            rules={[{ required: true, message: "กรุณาเลือกเดือน" }]}
          >
            <DatePicker
              picker="month"
              style={{ width: "100%", height: "45px", borderRadius: "8px" }}
              suffixIcon={<CalendarOutlined />}
              placeholder="เลือกเดือนและปี"
              format="MMMM BBBB"
            />
          </Form.Item>
        </Form>

        <div
          style={{
            marginTop: "10px",
            padding: "12px",
            background: token.colorWarningBg,
            borderRadius: "8px",
            border: `1px solid ${token.colorWarningBorder}`,
          }}
        >
          <Text type="secondary" style={{ fontSize: "12px" }}>
            * รายการ OT ทั้งหมดที่ได้รับอนุมัติในเดือนที่เลือกจะถูกสรุปลงในไฟล์
            Excel พร้อมจัดรูปแบบสวยงามสำหรับแผนก IT
          </Text>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        !isExportSuccess && (
          <Space>
            <div
              style={{
                padding: "8px",
                background: token.colorPrimary,
                borderRadius: "8px",
                display: "flex",
              }}
            >
              <FileExcelOutlined style={{ color: "white" }} />
            </div>
            <Text strong style={{ fontSize: "18px" }}>
              ส่งออกรายการ OT (Enterprise Export)
            </Text>
          </Space>
        )
      }
      open={visible}
      onOk={handleOk}
      onCancel={() => !loading && setVisible(false)}
      confirmLoading={loading}
      okText="ส่งออกไฟล์ Excel"
      cancelText="ยกเลิก"
      okButtonProps={{
        style: {
          display: loading || isExportSuccess ? "none" : "inline-block",
          background: token.colorPrimary,
          borderColor: token.colorPrimary,
          borderRadius: "8px",
        },
      }}
      cancelButtonProps={{
        style: {
          display: loading || isExportSuccess ? "none" : "inline-block",
          borderRadius: "8px",
        },
      }}
      footer={loading || isExportSuccess ? null : undefined}
      width={480}
      centered
    >
      {renderContent()}
    </Modal>
  );
};
