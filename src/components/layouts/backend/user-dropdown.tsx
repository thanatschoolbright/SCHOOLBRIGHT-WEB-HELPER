"use client";

import i18n from "@/i18n";
import {
  ClockCircleFilled,
  CrownFilled,
  DownOutlined,
  FireFilled,
  IdcardOutlined,
  LockOutlined,
  LogoutOutlined,
  SafetyCertificateFilled,
  ThunderboltFilled,
  TrophyFilled,
  UserOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Popover,
  Segmented,
  Space,
  theme,
  Typography,
} from "antd";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Services & Helpers
import {
  getUserRankFromStorage,
  saveUserRankToMemory,
} from "@/helpers/user-rank.helper";
import { HUAWEI_STORAGE } from "@/services/huawei-bucket-storage.service";
import { fetchUserRank } from "@/services/user-rank/user-rank.service";

const { Text, Title } = Typography;

// ==========================================
// 🎨 การตั้งค่า Rank และธีม
// ==========================================

// Config สีและ Effect ของแต่ละ Rank
const RANK_THEME_CONFIG: Record<string, any> = {
  S: {
    color: "#F59E0B",
    accent: "#FBBF24",
    labelKey: "user_dropdown.ranking.legendary",
    icon: <CrownFilled />,
    bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    darkBg: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
  },
  A: {
    color: "#10B981",
    accent: "#34D399",
    labelKey: "user_dropdown.ranking.excellent",
    icon: <SafetyCertificateFilled />,
    bg: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
    darkBg: "linear-gradient(135deg, #064E3B 0%, #065F46 100%)",
  },
  B: {
    color: "#3B82F6",
    accent: "#60A5FA",
    labelKey: "user_dropdown.ranking.professional",
    icon: <ThunderboltFilled />,
    bg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    darkBg: "linear-gradient(135deg, #1E3A8A 0%, #172554 100%)",
  },
  C: {
    color: "#F97316",
    accent: "#FB923C",
    labelKey: "user_dropdown.ranking.intermediate",
    icon: <FireFilled />,
    bg: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
    darkBg: "linear-gradient(135deg, #7C2D12 0%, #431407 100%)",
  },
  F: {
    color: "#64748B",
    accent: "#94A3B8",
    labelKey: "user_dropdown.ranking.beginner",
    icon: <UserOutlined />,
    bg: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
    darkBg: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
  },
};

const generateAvatarUrl = (userProfile: any) => {
  // 1. ตรวจสอบว่ามีรูปภาพในฐานข้อมูลหรือไม่ (Real Image)
  const realImage = userProfile?.profile_image_path || userProfile?.image;

  if (realImage && realImage !== "null") {
    // 🛡️ ตรวจสอบว่าเป็น Path ของ Huawei OBS (ที่อาจไม่มี Domain ติดมา)
    if (
      typeof realImage === "string" &&
      !realImage.startsWith("http") &&
      !realImage.startsWith("data:")
    ) {
      // ตัด / ข้างหน้าออกถ้ามี เพื่อป้องกัน URL ซ้อนกัน
      const cleanPath = realImage.startsWith("/")
        ? realImage.substring(1)
        : realImage;
      return `${HUAWEI_STORAGE.OBS_BUCKET_URL}/${cleanPath}`;
    }
    return realImage;
  }

  // 2. กรณีไม่มีรูปภาพ ให้ Generate ผ่าน DiceBear ตามปกติ
  const seedString = `${userProfile?.firstname_en || userProfile?.firstname || "User"}_${
    userProfile?.lastname_en || userProfile?.lastname || ""
  }_${userProfile?.admin_id ?? "0"}`;
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
    seedString,
  )}&backgroundColor=e0e7ff,d1d5db,f3f4f6`;
};

// ==========================================
// 🧩 Components
// ==========================================

const RankAvatarDisplay = ({
  userProfile,
  currentRankLetter,
  avatarSize = 40,
}: {
  userProfile: any;
  currentRankLetter: string;
  avatarSize?: number;
}) => {
  const { token } = theme.useToken();
  const rankThemeConfig =
    RANK_THEME_CONFIG[currentRankLetter] || RANK_THEME_CONFIG.F;

  return (
    <Badge
      count={
        <div
          style={{
            background: rankThemeConfig.color,
            color: "#fff",
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            border: `2px solid ${token.colorBgContainer}`,
          }}
        >
          {rankThemeConfig.icon}
        </div>
      }
      offset={[-5, avatarSize - 5]}
    >
      <Avatar
        size={avatarSize}
        src={generateAvatarUrl(userProfile)}
        style={{
          border: `2px solid ${rankThemeConfig.color}`,
          backgroundColor: token.colorBgContainer,
          padding: 2,
        }}
      />
    </Badge>
  );
};

const UserRankDetailsCard = ({ userRankDetails }: { userRankDetails: any }) => {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#FFFFFF";
  const currentRankLetter = userRankDetails?.rankLetter?.toUpperCase() || "F";
  const rankConfig =
    RANK_THEME_CONFIG[currentRankLetter] || RANK_THEME_CONFIG.F;

  const completionPercent = Math.min(
    Math.round(userRankDetails?.completion_rate || 0),
    100,
  );
  const totalHours = Number(userRankDetails?.total_hours || 0).toFixed(1);
  const disciplineScore = Number(
    userRankDetails?.discipline_score?.score ??
      userRankDetails?.discipline_score ??
      0,
  ).toFixed(1);

  return (
    <Card
      styles={{
        body: {
          padding: token.padding,
          background: isDark ? rankConfig.darkBg : rankConfig.bg,
          borderRadius: 24,
          position: "relative",
          overflow: "hidden",
        },
      }}
      bordered={false}
    >
      {/* Background Decoration Icon */}
      <div
        style={{
          position: "absolute",
          right: -16,
          bottom: -16,
          fontSize: 72,
          opacity: 0.1,
          color: rankConfig.color,
          pointerEvents: "none",
          transform: "rotate(12deg)",
        }}
      >
        {rankConfig.icon}
      </div>

      <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
        <Flex align="center" gap={12}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              background: isDark ? "rgba(0,0,0,0.3)" : "#fff",
              color: rankConfig.color,
              border: `1.5px solid ${rankConfig.accent}44`,
            }}
          >
            {rankConfig.icon}
          </div>
          <Flex vertical>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: rankConfig.color,
                letterSpacing: 1,
              }}
            >
              {TRANSLATION(rankConfig.labelKey)}
            </Text>
            <Title
              level={3}
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 900,
                fontStyle: "italic",
                color: isDark ? "#fff" : token.colorTextHeading,
              }}
            >
              RANK {currentRankLetter}
            </Title>
          </Flex>
        </Flex>

        <Flex vertical align="end">
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              opacity: 0.5,
              color: token.colorTextSecondary,
            }}
          >
            {TRANSLATION("user_dropdown.rank_title")}
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: rankConfig.color,
            }}
          >
            #{userRankDetails?.rank || "-"}
          </Text>
        </Flex>
      </Flex>

      <Flex gap={8} justify="space-between">
        <StatisticBoxItem
          label={TRANSLATION("user_dropdown.total_hours")}
          value={totalHours}
          icon={<ClockCircleFilled />}
          rankColor={rankConfig.color}
        />
        <StatisticBoxItem
          label={TRANSLATION("user_dropdown.discipline_score")}
          value={disciplineScore}
          icon={<TrophyFilled />}
          rankColor={rankConfig.color}
          highlight
        />
        <StatisticBoxItem
          label={TRANSLATION("user_dropdown.success_rate")}
          value={`${completionPercent}%`}
          icon={<ThunderboltFilled />}
          rankColor={rankConfig.color}
        />
      </Flex>
    </Card>
  );
};

const StatisticBoxItem = ({
  label,
  value,
  icon,
  rankColor,
  highlight,
}: any) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#FFFFFF";

  return (
    <Flex
      vertical
      align="center"
      flex={1}
      style={{
        padding: "8px 4px",
        borderRadius: 16,
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.4)",
        border: `1px solid ${highlight ? rankColor + "44" : "transparent"}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <Text
        style={{
          color: highlight ? rankColor : token.colorTextTertiary,
          fontSize: 14,
        }}
      >
        {icon}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: 900,
          color: isDark ? "#fff" : token.colorText,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 8,
          fontWeight: "bold",
          textTransform: "uppercase",
          opacity: 0.6,
          color: token.colorTextSecondary,
        }}
      >
        {label}
      </Text>
    </Flex>
  );
};

// ==========================================
// 🚀 Main Component
// ==========================================

export default function UserProfileDropdown(): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const router = useRouter();

  // ✅ เปลี่ยนมาใช้ข้อมูลจาก Redux เพื่อความรวดเร็วและ Real-time (ซิงค์ผ่าน AuthProvider)
  const AUTH_REDUX = useAppSelector((state) => state.callAdminLogin);
  const userProfileData = AUTH_REDUX.response.data?.user_data || {};

  const [currentLanguageCode, setCurrentLanguageCode] = useState<string>(
    i18n.language,
  );
  const [userRankData, setUserRankData] = useState<any>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    const adminId = userProfileData?.admin_id;
    if (!adminId) return;

    const fetchAndSetUserRank = async () => {
      try {
        const rankApiResponse = await fetchUserRank(String(adminId));
        if (rankApiResponse) {
          saveUserRankToMemory(rankApiResponse as any);
        }
        setUserRankData(rankApiResponse || getUserRankFromStorage());
      } catch {
        setUserRankData(getUserRankFromStorage());
      }
    };
    fetchAndSetUserRank();
  }, [userProfileData?.admin_id]);

  const handleChangeLanguage = async (languageCode: string) => {
    if (languageCode === currentLanguageCode) return;
    await i18n.changeLanguage(languageCode);
    setCurrentLanguageCode(languageCode);
    toast.success(TRANSLATION("user_dropdown.lang_success"));
  };

  const handleLogoutAction = async () => {
    toast.info(TRANSLATION("user_dropdown.logging_out"));
    // ✅ นำทางไปยัง URL ปัจจุบัน (Origin) แทนการใช้ Hardcoded path เพื่อป้องกันการเด้งไป localhost:3000 ใน Production
    // NextAuth signOut จะจัดการเรื่อง Session ฝั่ง Client/Server ให้โดยตรง
    await signOut({ callbackUrl: window.location.origin });
  };

  const currentRankLetter = userRankData?.rankLetter?.toUpperCase() || "F";
  const currentRankThemeConfig =
    RANK_THEME_CONFIG[currentRankLetter] || RANK_THEME_CONFIG.F;

  const userProfileDropdownContent = (
    <Flex vertical style={{ width: 340 }}>
      <Flex
        gap={16}
        align="center"
        style={{ padding: "0 4px", marginBottom: 16 }}
      >
        <RankAvatarDisplay
          userProfile={userProfileData}
          currentRankLetter={currentRankLetter}
          avatarSize={64}
        />
        <Flex vertical flex={1} style={{ overflow: "hidden" }}>
          <Title
            level={5}
            style={{
              margin: 0,
              lineHeight: 1.2,
              color: token.colorTextHeading,
            }}
            ellipsis
          >
            {userProfileData.firstname} {userProfileData.lastname}
          </Title>
          <Flex align="center" gap={4} style={{ marginTop: 4 }}>
            <Badge status="processing" color="green" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {userProfileData.position_name ||
                TRANSLATION("user_dropdown.default_position")}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {userRankData && <UserRankDetailsCard userRankDetails={userRankData} />}

      <Flex vertical gap={12} style={{ marginTop: 24 }}>
        <Segmented
          block
          options={[
            {
              label: TRANSLATION("user_dropdown.lang_th_label"),
              value: "th",
              icon: <span style={{ marginRight: 4 }}>🇹🇭</span>,
            },
            {
              label: TRANSLATION("user_dropdown.lang_en_label"),
              value: "en",
              icon: <span style={{ marginRight: 4 }}>🇬🇧</span>,
            },
          ]}
          value={currentLanguageCode}
          onChange={(val) => handleChangeLanguage(val as string)}
          style={{
            background: token.colorFillQuaternary,
            padding: 4,
            borderRadius: 12,
          }}
        />

        <Button
          block
          size="large"
          type="text"
          icon={<IdcardOutlined />}
          onClick={() => {
            setIsPopoverOpen(false);
            router.push("/profile/personal-information");
          }}
          style={{
            height: 48,
            borderRadius: 12,
            background: token.colorFillQuaternary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {TRANSLATION("user_dropdown.personal_info")}
        </Button>

        <Button
          block
          size="large"
          type="text"
          icon={<LockOutlined />}
          onClick={() => {
            setIsPopoverOpen(false);
            router.push("/profile/reset-password");
          }}
          style={{
            height: 48,
            borderRadius: 12,
            background: token.colorFillQuaternary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Space>
            {TRANSLATION("user_dropdown.change_password")}
            <Badge
              count="แก้ไขบัก"
              style={{
                backgroundColor: token.colorError,
                fontSize: 9,
                fontWeight: 900,
                height: 18,
                lineHeight: "18px",
              }}
            />
          </Space>
        </Button>

        <Divider style={{ margin: "4px 0" }} />

        <Button
          block
          size="large"
          type="text"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogoutAction}
          style={{
            height: 48,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {TRANSLATION("user_dropdown.logout")}
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <Popover
      content={userProfileDropdownContent}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      onOpenChange={setIsPopoverOpen}
      align={{ offset: [0, 14] }}
      styles={{
        body: {
          padding: 24,
          borderRadius: 24,
          backgroundColor: token.colorBgElevated,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: "0 10px 32px rgba(0,0,0,0.12)",
        },
      }}
    >
      <Flex
        align="center"
        gap={12}
        style={{
          padding: "6px 8px 6px 16px",
          borderRadius: 100,
          cursor: "pointer",
          transition: "all 0.3s",
          border: `1px solid ${isPopoverOpen ? token.colorBorder : "transparent"}`,
          backgroundColor: isPopoverOpen
            ? token.colorBgContainer
            : "transparent",
          boxShadow: isPopoverOpen ? token.boxShadow : "none",
        }}
      >
        <Flex vertical align="end" justify="center">
          <Text strong style={{ fontSize: 14, lineHeight: 1.2 }}>
            {userProfileData.firstname}
          </Text>
          <Badge
            count={TRANSLATION(currentRankThemeConfig.labelKey).split(" ")[0]}
            style={{
              backgroundColor: currentRankThemeConfig.color,
              fontSize: 9,
              fontWeight: 800,
              height: 16,
              lineHeight: "16px",
              borderRadius: 4,
              marginTop: 2,
            }}
          />
        </Flex>

        <RankAvatarDisplay
          userProfile={userProfileData}
          currentRankLetter={currentRankLetter}
          avatarSize={38}
        />

        <DownOutlined
          style={{
            fontSize: 10,
            color: token.colorTextQuaternary,
            transform: isPopoverOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.3s",
          }}
        />
      </Flex>
    </Popover>
  );
}
