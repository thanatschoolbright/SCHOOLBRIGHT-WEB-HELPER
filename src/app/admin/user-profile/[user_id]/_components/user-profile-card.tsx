import { HuaweiBucketStorageService } from "@/services/huawei-bucket-storage.service";
import {
  CalendarOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  LinkOutlined,
  LoadingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Card,
  Space,
  Tag,
  theme,
  Typography,
  Upload,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { toast } from "sonner";
import { useUserEditStore } from "../_state/user-edit-store";

const { Title, Text } = Typography;

/**
 * ส่วนแสดงผลสรุปข้อมูลผู้ใช้งานทางด้านซ้าย (User Profile Card)
 */
export const UserProfileCard = ({
  employeeCode,
  form,
}: {
  employeeCode: string;
  form: any;
}) => {
  const { token } = theme.useToken();
  const { userData, setUserData } = useUserEditStore();
  const [uploading, setUploading] = useState(false);

  const currentImage = userData?.profile_image_path;

  const customUploadRequest = async ({ file, onSuccess, onError }: any) => {
    if (!employeeCode) {
      toast.error("กรุณาระบุรหัสพนักงานก่อนอัปโหลดรูปภาพ");
      onError(new Error("Missing employee code"));
      return;
    }

    setUploading(true);
    try {
      const result =
        await HuaweiBucketStorageService.requestUploadUserProfileImage(
          file,
          employeeCode,
          currentImage,
        );

      if (result.status === 200 || result.url) {
        const newImageUrl = result.url || result.data?.url;
        form.setFieldValue("profile_image", newImageUrl);
        setUserData({ ...userData, profile_image_path: newImageUrl });
        toast.success("อัปโหลดรูปภาพสำเร็จ");
        onSuccess("ok");
      } else {
        throw new Error(result.message_en || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <Card
        variant="borderless"
        styles={{
          body: {
            textAlign: "center",
            padding: "48px 24px 32px 24px",
            background: `linear-gradient(180deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 150px)`,
          },
        }}
        style={{
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 20px 40px -20px rgba(0,0,0,0.1)",
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          <div className="relative group cursor-pointer transition-transform hover:scale-105 duration-300">
            <Upload
              name="avatar"
              listType="picture-circle"
              showUploadList={false}
              customRequest={customUploadRequest}
              disabled={uploading}
            >
              <div style={{ position: "relative" }}>
                <Avatar
                  size={140}
                  icon={uploading ? <LoadingOutlined /> : <UserOutlined />}
                  src={userData?.profile_image_path}
                  style={{
                    backgroundColor: "white",
                    color: token.colorPrimary,
                    border: `6px solid white`,
                    boxShadow: `0 8px 24px rgba(0,0,0,0.12)`,
                    opacity: uploading ? 0.6 : 1,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    borderRadius: "50%",
                    opacity: 0,
                    transition: "all 0.3s ease",
                    backdropFilter: "blur(2px)",
                  }}
                  className="group-hover:opacity-100"
                >
                  <CameraOutlined
                    style={{ color: "white", fontSize: 28, marginBottom: 4 }}
                  />
                  <Text
                    style={{ color: "white", fontSize: 11, fontWeight: 600 }}
                  >
                    เปลี่ยนรูปโปรไฟล์
                  </Text>
                </div>
              </div>
            </Upload>
          </div>
          {userData?.profile_image_path && (
            <div style={{ position: "absolute", bottom: 8, right: 16 }}>
              <div
                style={{
                  backgroundColor: token.colorSuccess,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid white",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  zIndex: 2,
                }}
              >
                <CheckCircleOutlined style={{ color: "white", fontSize: 16 }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 4, fontWeight: 700 }}>
            {userData?.firstname_th} {userData?.lastname_th}
          </Title>
          <Text
            type="secondary"
            style={{
              display: "block",
              fontSize: 13,
              opacity: 0.8,
              marginBottom: 16,
            }}
          >
            {userData?.email || "ไม่มีข้อมูลอีเมล"}
          </Text>

          <Space size={6} wrap style={{ justifyContent: "center" }}>
            <Tag
              bordered={false}
              color="blue"
              style={{ padding: "0 12px", borderRadius: 100 }}
            >
              {userData?.role?.role_name || "Guest"}
            </Tag>
            {userData?.position_ref?.name_th && (
              <Tag
                bordered={false}
                color="cyan"
                style={{ padding: "0 12px", borderRadius: 100 }}
              >
                {userData?.position_ref?.name_th}
              </Tag>
            )}
            {userData?.department?.name_th && (
              <Tag
                bordered={false}
                color="purple"
                style={{ padding: "0 12px", borderRadius: 100 }}
              >
                {userData?.department?.name_th}
              </Tag>
            )}
          </Space>
        </div>

        <div
          style={{
            textAlign: "left",
            backgroundColor: token.colorFillAlter,
            padding: "20px",
            borderRadius: 20,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div className="flex items-start gap-3">
              <div
                style={{
                  minWidth: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <LinkOutlined style={{ color: token.colorPrimary }} />
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, display: "block", color: "#8c8c8c" }}
                >
                  ADMIN ID
                </Text>
                <Text strong style={{ fontSize: 14 }}>
                  {userData?.admin_id || "-"}
                </Text>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                style={{
                  minWidth: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <HistoryOutlined style={{ color: token.colorInfoText }} />
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, display: "block", color: "#8c8c8c" }}
                >
                  ข้อมูลล่าสุด
                </Text>
                <Text strong style={{ fontSize: 14 }}>
                  {userData?.updated_at
                    ? dayjs(userData.updated_at).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </Text>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                style={{
                  minWidth: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <CalendarOutlined style={{ color: token.colorWarning }} />
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, display: "block", color: "#8c8c8c" }}
                >
                  วันที่เริ่มงาน
                </Text>
                <Text strong style={{ fontSize: 14 }}>
                  {userData?.joined_date
                    ? dayjs(userData.joined_date).format("DD/MM/YYYY")
                    : "ไม่ได้ระบุ"}
                </Text>
              </div>
            </div>
          </Space>
        </div>
      </Card>
    </div>
  );
};
