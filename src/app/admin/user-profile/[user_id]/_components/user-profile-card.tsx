import { HuaweiBucketStorageService } from "@/services/huawei-bucket-storage.service";
import {
  CalendarOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  IdcardOutlined,
  LinkOutlined,
  LoadingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Card,
  Divider,
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
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card
        variant="borderless"
        styles={{ body: { textAlign: "center", padding: "40px 24px" } }}
        style={{ borderRadius: 16 }}
      >
        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginBottom: 24,
          }}
        >
          <div className="relative group cursor-pointer">
            <Upload
              name="avatar"
              listType="picture-circle"
              showUploadList={false}
              customRequest={customUploadRequest}
              disabled={uploading}
            >
              <div style={{ position: "relative" }}>
                <Avatar
                  size={120}
                  icon={uploading ? <LoadingOutlined /> : <UserOutlined />}
                  src={userData?.profile_image_path}
                  style={{
                    backgroundColor: token.colorPrimaryBg,
                    color: token.colorPrimary,
                    border: `4px solid white`,
                    boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
                    opacity: uploading ? 0.6 : 1,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  className="hover:scale-105"
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    borderRadius: "50%",
                    opacity: userData?.profile_image_path ? 0 : 1,
                    transition: "opacity 0.3s",
                  }}
                  className={
                    userData?.profile_image_path
                      ? "group-hover:opacity-100"
                      : ""
                  }
                >
                  <CameraOutlined
                    style={{ color: "white", fontSize: 24, marginBottom: 4 }}
                  />
                  {!userData?.profile_image_path && (
                    <Text
                      style={{ color: "white", fontSize: 10, fontWeight: 700 }}
                    >
                      อัปโหลดรูปภาพที่นี่
                    </Text>
                  )}
                </div>
              </div>
            </Upload>
          </div>
          {userData?.profile_image_path && (
            <div style={{ position: "absolute", bottom: 4, right: 12 }}>
              <div
                style={{
                  backgroundColor: token.colorSuccess,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid white",
                  boxShadow: token.boxShadow,
                  zIndex: 2,
                }}
              >
                <CheckCircleOutlined style={{ color: "white", fontSize: 14 }} />
              </div>
            </div>
          )}
        </div>

        <Title level={3} style={{ marginBottom: 4 }}>
          {userData?.firstname_th} {userData?.lastname_th}
        </Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          {userData?.email || "ไม่มีอีเมล"}
        </Text>

        <Space size={8} wrap>
          <Tag color="blue">{userData?.role?.role_name || "ไม่มีสิทธิ์"}</Tag>
          <Tag color="cyan">
            {userData?.position_ref?.name_th || "ไม่มีตำแหน่ง"}
          </Tag>
          <Tag color="purple">
            {userData?.department?.name_th || "ไม่มีแผนก"}
          </Tag>
        </Space>

        <Divider />

        <div style={{ textAlign: "left" }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space align="start" size={12}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: token.colorPrimaryBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LinkOutlined style={{ color: token.colorPrimary }} />
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block" }}
                >
                  รหัสเชื่อมต่อ (adminsystem.schoolbright.co)
                </Text>
                <Text strong style={{ color: token.colorPrimary }}>
                  {userData?.admin_id || "-"}
                </Text>
              </div>
            </Space>

            <Space align="start" size={12}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: token.colorFillAlter,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HistoryOutlined style={{ color: token.colorTextSecondary }} />
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block" }}
                >
                  ข้อมูลล่าสุดเมื่อ
                </Text>
                <Text strong>
                  {userData?.updated_at
                    ? dayjs(userData.updated_at).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </Text>
              </div>
            </Space>

            <Space align="start" size={12}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: token.colorFillAlter,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IdcardOutlined style={{ color: token.colorTextSecondary }} />
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block" }}
                >
                  วันที่เข้าสู่ระบบ
                </Text>
                <Text strong>
                  {dayjs(userData?.created_at).format("DD/MM/YYYY")}
                </Text>
              </div>
            </Space>

            <Space align="start" size={12}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: token.colorFillAlter,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarOutlined style={{ color: token.colorHighlight }} />
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block" }}
                >
                  วันที่เริ่มงาน (Joined)
                </Text>
                <Text strong>
                  {userData?.joined_date
                    ? dayjs(userData.joined_date).format("DD/MM/YYYY")
                    : "ไม่ได้ระบุ"}
                </Text>
              </div>
            </Space>

            <Space align="start" size={12}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: token.colorFillAlter,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarOutlined style={{ color: token.colorWarning }} />
              </div>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block" }}
                >
                  วันเกิด (Birthday)
                </Text>
                <Text strong>
                  {userData?.birth_date
                    ? dayjs(userData.birth_date).format("DD/MM/YYYY")
                    : "ไม่ได้ระบุ"}
                </Text>
              </div>
            </Space>
          </Space>
        </div>
      </Card>

      <Alert
        message="คำแนะนำ"
        description="การแก้ไขข้อมูลระดับสิทธิ์ของพนักงาน จะมีผลเมื่อพนักงานทำการเข้าสู่ระบบใหม่ในครั้งถัดไป"
        type="info"
        showIcon
        style={{ borderRadius: 12 }}
      />
    </Space>
  );
};
