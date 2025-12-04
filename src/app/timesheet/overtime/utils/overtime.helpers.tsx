import { Modal, Space, Collapse, Typography } from "antd";
import { WarningOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

export const getCurrentUserId = async (
  authentication: any
): Promise<string> => {
  try {
    const authId = authentication?.response?.data?.user_data?.admin_id;
    if (authId) return String(authId);

    if (typeof window !== "undefined") {
      const { getUserData } = await import(
        "@helpers/local_storage/user.storage"
      );
      const users = await getUserData();
      if (Array.isArray(users) && users.length > 0) {
        return String(users[0].admin_id ?? users[0].id ?? "system");
      }
    }
  } catch (error) {
    console.error("Error getting current user ID:", error);
  }
  return "system";
};

export const handleError = (error: any, title: string = "เกิดข้อผิดพลาด") => {
  console.error(error);
  Modal.error({
    title: (
      <Space>
        <WarningOutlined className="text-red-500" /> {title}
      </Space>
    ),
    content: (
      <div>
        <Text>ระบบไม่สามารถดำเนินการได้ในขณะนี้</Text>
        <Collapse ghost size="small" className="mt-2">
          <Collapse.Panel
            header="ดูรายละเอียดเพิ่มเติม (Technical Details)"
            key="1"
          >
            <Paragraph className="font-mono text-xs text-red-500 bg-red-50 p-2 rounded">
              {error?.message || JSON.stringify(error)}
            </Paragraph>
          </Collapse.Panel>
        </Collapse>
      </div>
    ),
    okText: "รับทราบ",
  });
};

export const calculateDuration = (startDate: Date, endDate: Date): number => {
  const diffInMs = endDate.getTime() - startDate.getTime();
  const hours = diffInMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
};
