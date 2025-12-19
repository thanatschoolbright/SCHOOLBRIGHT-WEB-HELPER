"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Popover,
  Progress,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
  theme,
} from "antd";
import {
  DownOutlined,
  FireFilled,
  LogoutOutlined,
  StarFilled,
  TranslationOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import i18n from "@/i18n";

// Services & Helpers
import { getUserRankFromStorage } from "@/helpers/user-rank.helper";
import { fetchUserRank } from "@/services/user-rank/user-rank.service";

const { Text, Title } = Typography;

// ==========================================
// 🎨 Constants & Configs (ส่วนตั้งค่าสีและข้อมูลคงที่)
// ==========================================

/** ตั้งค่าสีและข้อความสำหรับแต่ละ Rank */
const RANK_THEME: Record<string, { color: string; bg: string; label: string }> =
  {
    S: {
      color: "#FFD700",
      bg: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
      label: "ระดับเทพ (Legend)",
    },
    A: {
      color: "#52C41A",
      bg: "linear-gradient(135deg, #52C41A 0%, #389E0D 100%)",
      label: "ระดับเยี่ยม (Elite)",
    },
    B: {
      color: "#1890FF",
      bg: "linear-gradient(135deg, #1890FF 0%, #096DD9 100%)",
      label: "ระดับดี (Pro)",
    },
    C: {
      color: "#FAAD14",
      bg: "linear-gradient(135deg, #FAAD14 0%, #D48806 100%)",
      label: "ระดับปานกลาง",
    },
    D: {
      color: "#FA8C16",
      bg: "linear-gradient(135deg, #FA8C16 0%, #D46B08 100%)",
      label: "ระดับพอใช้",
    },
    E: {
      color: "#FF7875",
      bg: "linear-gradient(135deg, #FF7875 0%, #F5222D 100%)",
      label: "ต้องปรับปรุง",
    },
    F: {
      color: "#CF1322",
      bg: "linear-gradient(135deg, #CF1322 0%, #A8071A 100%)",
      label: "ต้องเร่งด่วน",
    },
  };

/** Helper: สร้าง URL รูปโปรไฟล์จาก DiceBear */
const getAvatarUrl = (user: any) => {
  const seed = `${user?.firstname ?? "User"}_${user?.lastname ?? ""}_${
    user?.admin_id ?? "0"
  }`;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;
};

// ==========================================
// 🧩 Sub-Components (แยกส่วนแสดงผลเพื่อให้อ่านง่าย)
// ==========================================

/** ส่วนแสดงรายละเอียด Rank และ Stat ใน Dropdown */
const UserRankCard = ({ rankData }: { rankData: any }) => {
  const { token } = theme.useToken();

  // ดึงค่า Config ตาม Rank Letter (ถ้าไม่มีให้ Default เป็น F)
  const rankKey = rankData?.rankLetter?.toUpperCase() || "F";
  const themeInfo = RANK_THEME[rankKey] || RANK_THEME.F;

  // คำนวณค่าต่างๆ
  const completionRate = Math.min(
    Math.round(rankData?.completion_rate || 0),
    100
  );
  const totalHours = Number(rankData?.total_hours || 0).toFixed(1);
  const expectedHours = Number(rankData?.expected_hours || 0).toFixed(1);

  // Helper แสดงคะแนนวินัย
  const disciplineScore = (() => {
    const val = rankData?.discipline_score;
    // Logic การแกะค่า (ตาม Code เดิม)
    if (val === null || val === undefined) return "-";
    if (typeof val === "number") return val.toFixed(1);
    if (typeof val === "object")
      return (val.score ?? val.value ?? val.discipline_score ?? 0).toFixed(1);
    return val;
  })();

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        borderRadius: token.borderRadiusLG,
        background: token.colorFillQuaternary, // สีพื้นหลังจางๆ ตาม Theme
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {/* Header Rank */}
      <Flex align="center" gap={12}>
        <div
          style={{
            background: themeInfo.bg,
            padding: "4px 10px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            minWidth: 40,
            textAlign: "center",
          }}
        >
          {rankKey}
        </div>

        <div style={{ flex: 1 }}>
          <Space size={4} align="center">
            <Text strong>{themeInfo.label}</Text>
            {["S", "A"].includes(rankKey) && (
              <FireFilled style={{ color: "#FF4D4F" }} />
            )}
          </Space>
          <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
            อันดับที่ {rankData?.rank ?? "-"} • ประจำเดือนนี้
          </div>
        </div>

        <Progress
          type="circle"
          percent={completionRate}
          // 🛠️ [FIX] เปลี่ยนจาก width เป็น size
          size={45}
          strokeColor={themeInfo.color}
          format={() => (
            <span style={{ fontSize: 10, color: token.colorTextSecondary }}>
              {completionRate}%
            </span>
          )}
        />
      </Flex>

      <Divider style={{ margin: "12px 0" }} />

      {/* Stats Grid */}
      <Flex justify="space-between">
        <StatItem label="ชั่วโมงรวม" value={totalHours} suffix="ชม." />
        <StatItem label="เป้าหมาย" value={expectedHours} suffix="ชม." />
        <StatItem label="คะแนนวินัย" value={disciplineScore} highlight />
      </Flex>
    </div>
  );
};

/** Helper Component สำหรับแสดงค่า Stat เล็กๆ */
const StatItem = ({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
}) => {
  const { token } = theme.useToken();
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: token.colorTextSecondary }}>
        {label}
      </div>
      <div
        style={{
          fontWeight: 600,
          color: highlight ? token.colorPrimary : token.colorText,
        }}
      >
        {value} <span style={{ fontSize: 10 }}>{suffix}</span>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 Main Component
// ==========================================

export default function UserDropdown(): JSX.Element {
  const { token } = theme.useToken();
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const userData = AUTHENTICATION?.response?.data?.user_data || {};

  // State
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language);
  const [isChangingLang, setIsChangingLang] = useState(false);
  const [userRank, setUserRank] = useState<any>(null);

  // 1. Load User Rank (Logic เดิมแต่ Clean ขึ้น)
  useEffect(() => {
    const userId = userData?.admin_id;
    if (!userId) return;

    const loadData = async () => {
      try {
        const apiData = await fetchUserRank(String(userId));
        if (apiData) {
          // Map Data ให้เหลือเฉพาะที่ใช้
          const mapped = {
            ...apiData,
            discipline_score: apiData.rawData, // Mapping field ตาม logic เดิม
          };
          setUserRank(mapped);
          // Save Cache
          localStorage.setItem("USER_RANK_DATA", JSON.stringify(mapped));
        } else {
          // Fallback
          setUserRank(getUserRankFromStorage());
        }
      } catch (err) {
        console.error("Failed to load rank:", err);
        setUserRank(getUserRankFromStorage());
      }
    };

    loadData();
  }, [userData?.admin_id]);

  // 2. Change Language Handler
  const handleChangeLanguage = async (val: string) => {
    if (val === currentLanguage) return;
    setIsChangingLang(true);
    const toastId = toast.loading("กำลังเปลี่ยนภาษา...");

    try {
      await i18n.changeLanguage(val);
      setCurrentLanguage(val);
      toast.success("เปลี่ยนภาษาสำเร็จ", { id: toastId });
    } catch {
      toast.error("เกิดข้อผิดพลาด", { id: toastId });
    } finally {
      setIsChangingLang(false);
    }
  };

  // 3. Logout Handler
  const handleLogout = async () => {
    toast.info("กำลังออกจากระบบ...", { duration: 2000 });
    // Clear Storage
    localStorage.clear();
    sessionStorage.clear();
    // Redirect
    setTimeout(() => (window.location.href = "/"), 500);
  };

  // 4. Render Overlay Content (เนื้อหาใน Dropdown)
  const menuContent = (
    <Card
      // 🛠️ [FIX] เปลี่ยนจาก bordered={false} เป็น variant="borderless"
      variant="borderless"
      style={{
        width: 300,
        boxShadow: "none",
        background: "transparent", // ให้สีพื้นหลังจัดการโดย Popover
      }}
    >
      {/* Profile Header */}
      <Flex align="center" gap={12} style={{ padding: "0 4px" }}>
        <Avatar
          size={48}
          src={getAvatarUrl(userData)}
          style={{ border: `2px solid ${token.colorBgContainer}` }}
        />
        <div style={{ overflow: "hidden" }}>
          <Text strong style={{ fontSize: 16, display: "block" }} ellipsis>
            {userData.firstname} {userData.lastname}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <StarFilled style={{ color: "#faad14", marginRight: 4 }} />
            ขยันวันนี้ สำเร็จวันหน้า
          </Text>
        </div>
      </Flex>

      {/* Rank Section */}
      {userRank && <UserRankCard rankData={userRank} />}

      <Divider style={{ margin: "16px 0" }} />

      {/* Settings Section */}
      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ภาษา / Language
          </Text>
          <Segmented
            block
            options={[
              { label: "ไทย", value: "th", icon: <TranslationOutlined /> },
              { label: "English", value: "en", icon: <TranslationOutlined /> },
            ]}
            value={currentLanguage}
            onChange={(val) => handleChangeLanguage(val as string)}
            disabled={isChangingLang}
          />
        </div>

        <Button
          type="primary"
          danger
          block
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          ออกจากระบบ
        </Button>
      </Space>
    </Card>
  );

  // คำนวณสี Badge ตาม Rank
  const rankLetter = userRank?.rankLetter?.toUpperCase() || "F";
  const rankColor = RANK_THEME[rankLetter]?.color || "#ccc";

  return (
    <Popover
      content={menuContent}
      trigger="click"
      placement="bottomRight"
      // 🛠️ [FIX] ใช้ styles.body แทน overlayInnerStyle
      styles={{
        body: {
          padding: 20,
          borderRadius: 16,
        },
      }}
    >
      {/* Trigger Button (ส่วนที่แสดงบน Navbar) */}
      <Space
        style={{
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 20,
          transition: "background 0.3s",
        }}
        className=""
      >
        <Flex vertical align="end" style={{ marginRight: 4 }}>
          <Text strong style={{ lineHeight: 1.2 }}>
            {userData.firstname}
          </Text>
          <Tag
            bordered={false}
            color={rankColor}
            style={{
              margin: 0,
              fontSize: 10,
              lineHeight: "14px",
              padding: "0 6px",
            }}
          >
            Rank {rankLetter}
          </Tag>
        </Flex>

        <Badge dot color={rankColor} offset={[-4, 4]}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            src={getAvatarUrl(userData)}
            style={{
              border: `2px solid ${token.colorBgContainer}`,
              boxShadow: token.boxShadowTertiary,
            }}
          />
        </Badge>
        <DownOutlined
          style={{ fontSize: 10, color: token.colorTextQuaternary }}
        />
      </Space>
    </Popover>
  );
}
