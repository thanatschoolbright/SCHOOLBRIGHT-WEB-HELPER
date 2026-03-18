"use client";

import i18n from "@/i18n";
import {
  CrownFilled,
  DownOutlined,
  FireFilled,
  IdcardOutlined,
  LockOutlined,
  LogoutOutlined,
  SafetyCertificateFilled,
  ThunderboltFilled,
  UserOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Flex,
  Segmented,
  Space,
  Tag,
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
// การตั้งค่า Rank และธีม
// ==========================================

interface RankConfig {
  color: string;
  accent: string;
  labelKey: string;
  icon: React.ReactNode;
  bg: string;
  darkBg: string;
}

// Config สีและ Effect ของแต่ละ Rank
const RANK_THEME_CONFIG: Record<string, RankConfig> = {
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

interface UserProfile {
  profile_image_path?: string;
  image?: string;
  firstname?: string;
  lastname?: string;
  firstname_en?: string;
  lastname_en?: string;
  admin_id?: number | string;
  position_name?: string;
}

const generateAvatarUrl = (userProfile: UserProfile) => {
  // 1. ตรวจสอบว่ามีรูปภาพในฐานข้อมูลหรือไม่ (Real Image)
  const realImage = userProfile.profile_image_path ?? userProfile.image;

  if (realImage && realImage !== "null") {
    // * ตรวจสอบว่าเป็น Path ของ Huawei OBS (ที่อาจไม่มี Domain ติดมา)
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
  const seedString = `${userProfile.firstname_en ?? userProfile.firstname ?? "User"}_${
    userProfile.lastname_en ?? userProfile.lastname ?? ""
  }_${String(userProfile.admin_id ?? "0")}`;
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
    seedString,
  )}&backgroundColor=e0e7ff,d1d5db,f3f4f6`;
};

// ==========================================
// Components
// ==========================================

const RankAvatarDisplay = ({
  userProfile,
  currentRankLetter,
  avatarSize = 40,
}: {
  userProfile: UserProfile;
  currentRankLetter: string;
  avatarSize?: number;
}) => {
  const { token } = theme.useToken();
  const rankThemeConfig =
    RANK_THEME_CONFIG[currentRankLetter] || RANK_THEME_CONFIG.F;

  return (
    <Avatar
      size={avatarSize}
      src={generateAvatarUrl(userProfile)}
      style={{
        border: `3px solid ${rankThemeConfig.color}`,
        backgroundColor: token.colorBgContainer,
        padding: 2,
        boxShadow: `0 0 20px ${rankThemeConfig.color}44`,
        transition: "all 0.3s ease",
      }}
    />
  );
};

interface UserRankDetails {
  rankLetter?: string;
  completion_rate?: number;
  total_hours?: number | string;
  discipline_score?: number | { score: number };
  rank?: number | string;
}

const UserRankDetailsCard = ({
  userRankDetails,
}: {
  userRankDetails: UserRankDetails | null;
}) => {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#FFFFFF";
  const currentRankLetter = userRankDetails?.rankLetter?.toUpperCase() || "F";
  const rankConfig =
    RANK_THEME_CONFIG[currentRankLetter] || RANK_THEME_CONFIG.F;

  const completionPercent = Math.min(
    Math.round(userRankDetails?.completion_rate ?? 0),
    100,
  );
  const totalHours = String(userRankDetails?.total_hours ?? 0);
  const rawDisciplineScore =
    typeof userRankDetails?.discipline_score === "object"
      ? userRankDetails.discipline_score.score
      : userRankDetails?.discipline_score;
  const disciplineScore = Number(rawDisciplineScore ?? 0).toFixed(1);

  return (
    <Card
      styles={{
        body: {
          padding: 0,
          background: isDark ? "#141414" : "#ffffff",
          borderRadius: 24,
          overflow: "hidden",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(0,0,0,0.05)",
        },
      }}
    >
      {/* Top Banner: Rank Focus */}
      <div
        style={{
          padding: "24px 20px",
          background: isDark ? rankConfig.darkBg : rankConfig.bg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow Effect */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "150px",
            height: "150px",
            background: rankConfig.color,
            filter: "blur(60px)",
            opacity: 0.2,
            borderRadius: "50%",
          }}
        />

        <Flex align="center" justify="space-between">
          <Flex vertical>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: rankConfig.color,
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Current Prestige
            </Text>
            <Flex align="baseline" gap={8}>
              <Title
                level={1}
                style={{
                  margin: 0,
                  fontSize: 48,
                  fontWeight: 900,
                  color: isDark ? "#fff" : token.colorTextHeading,
                  letterSpacing: -2,
                  lineHeight: 1,
                }}
              >
                {currentRankLetter}
              </Title>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: rankConfig.color,
                  opacity: 0.8,
                }}
              >
                CLASS
              </Text>
            </Flex>
          </Flex>

          <Flex vertical align="end">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: isDark
                  ? "rgba(0,0,0,0.3)"
                  : "rgba(255,255,255,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                color: rankConfig.color,
                boxShadow: `0 8px 16px ${rankConfig.color}22`,
                border: `1px solid ${rankConfig.color}33`,
              }}
            >
              {rankConfig.icon}
            </div>
          </Flex>
        </Flex>

        {/* Progress Bar To Next Level (Visual Only for motivation) */}
        <div style={{ marginTop: 24 }}>
          <Flex justify="space-between" style={{ marginBottom: 6 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
              }}
            >
              Ranking Progress
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: rankConfig.color,
              }}
            >
              {completionPercent}%
            </Text>
          </Flex>
          <div
            style={{
              width: "100%",
              height: 6,
              background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${completionPercent}%`,
                height: "100%",
                background: rankConfig.color,
                borderRadius: 10,
                boxShadow: `0 0 10px ${rankConfig.color}66`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Stats: Clean & Technical */}
      <div style={{ padding: "16px 20px" }}>
        <Flex gap={16} justify="space-between">
          <Flex vertical flex={1}>
            <Text
              style={{
                fontSize: 10,
                color: token.colorTextTertiary,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Work Hours
            </Text>
            <Title level={5} style={{ margin: 0, fontWeight: 800 }}>
              {totalHours}{" "}
              <small style={{ fontSize: 10, fontWeight: 400 }}>Hrs</small>
            </Title>
          </Flex>

          <Divider type="vertical" style={{ height: 32, margin: "auto 0" }} />

          <Flex vertical flex={1} align="center">
            <Text
              style={{
                fontSize: 10,
                color: token.colorTextTertiary,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Discipline
            </Text>
            <Title
              level={5}
              style={{ margin: 0, fontWeight: 800, color: rankConfig.color }}
            >
              {disciplineScore}
            </Title>
          </Flex>

          <Divider type="vertical" style={{ height: 32, margin: "auto 0" }} />

          <Flex vertical flex={1} align="end">
            <Text
              style={{
                fontSize: 10,
                color: token.colorTextTertiary,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Leaderboard
            </Text>
            <Title level={5} style={{ margin: 0, fontWeight: 800 }}>
              #{userRankDetails?.rank ?? "-"}
            </Title>
          </Flex>
        </Flex>
      </div>
    </Card>
  );
};

interface StatisticBoxItemProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  rankColor: string;
  highlight?: boolean;
}

const StatisticBoxItem = ({
  label,
  value,
  icon,
  rankColor,
  highlight,
}: StatisticBoxItemProps) => {
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
        {String(value)}
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
// Main Component
// ==========================================

export default function UserProfileDropdown(): React.JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const router = useRouter();

  // * เปลี่ยนมาใช้ข้อมูลจาก Redux เพื่อความรวดเร็วและ Real-time (ซิงค์ผ่าน AuthProvider)
  const AUTH_REDUX = useAppSelector((state) => state.callAdminLogin);
  const userProfileData = (AUTH_REDUX.response.data?.user_data ??
    {}) as UserProfile;

  const [currentLanguageCode, setCurrentLanguageCode] = useState<string>(
    i18n.language,
  );
  const [userRankData, setUserRankData] = useState<UserRankDetails | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const adminId = userProfileData.admin_id;
    if (!adminId) return;

    const fetchAndSetUserRank = async () => {
      try {
        const rankApiResponse = (await fetchUserRank(
          String(adminId),
        )) as UserRankDetails | null;
        if (rankApiResponse) {
          saveUserRankToMemory(rankApiResponse);
        }
        setUserRankData(
          rankApiResponse ??
            (getUserRankFromStorage() as UserRankDetails | null),
        );
      } catch {
        setUserRankData(getUserRankFromStorage() as UserRankDetails | null);
      }
    };
    void fetchAndSetUserRank();
  }, [userProfileData.admin_id]);

  const handleChangeLanguage = (languageCode: string | number) => {
    const code = String(languageCode);
    if (code === currentLanguageCode) return;
    void i18n.changeLanguage(code).then(() => {
      setCurrentLanguageCode(code);
      toast.success(TRANSLATION("user_dropdown.lang_success"));
    });
  };

  const handleLogoutAction = () => {
    toast.info(TRANSLATION("user_dropdown.logging_out"));
    // * นำทางไปยัง URL ปัจจุบัน (Origin) แทนการใช้ Hardcoded path เพื่อป้องกันการเด้งไป localhost:3000 ใน Production
    // NextAuth signOut จะจัดการเรื่อง Session ฝั่ง Client/Server ให้โดยตรง
    void signOut({ callbackUrl: window.location.origin });
  };

  const isDark = token.colorBgBase !== "#FFFFFF";
  const currentRankLetter = userRankData?.rankLetter?.toUpperCase() || "F";
  const currentRankThemeConfig =
    RANK_THEME_CONFIG[currentRankLetter] || RANK_THEME_CONFIG.F;

  const userProfileDropdownContent = (
    <Flex vertical>
      <Flex
        vertical
        align="center"
        style={{
          padding: "32px 0",
          background: isDark
            ? `linear-gradient(180deg, ${currentRankThemeConfig.color}15 0%, transparent 100%)`
            : `linear-gradient(180deg, ${currentRankThemeConfig.color}08 0%, transparent 100%)`,
          borderRadius: 24,
          marginBottom: 24,
        }}
      >
        <RankAvatarDisplay
          userProfile={userProfileData}
          currentRankLetter={currentRankLetter}
          avatarSize={120}
        />
        <Flex vertical align="center" style={{ marginTop: 20 }}>
          <Title
            level={3}
            style={{
              margin: 0,
              lineHeight: 1.2,
              color: token.colorTextHeading,
              fontWeight: 800,
            }}
          >
            {userProfileData.firstname} {userProfileData.lastname}
          </Title>
          <Tag
            color={currentRankThemeConfig.color}
            style={{
              marginTop: 12,
              borderRadius: 50,
              paddingInline: 16,
              fontWeight: 700,
              border: "none",
            }}
          >
            {userProfileData.position_name ??
              TRANSLATION("user_dropdown.default_position")}
          </Tag>
        </Flex>
      </Flex>

      {userRankData && <UserRankDetailsCard userRankDetails={userRankData} />}

      <Flex vertical gap={12} style={{ marginTop: 32 }}>
        <Text
          strong
          style={{
            fontSize: 12,
            color: token.colorTextDescription,
            textTransform: "uppercase",
            letterSpacing: 1,
            paddingLeft: 4,
          }}
        >
          {TRANSLATION("user_dropdown.settings")}
        </Text>
        <Segmented
          block
          options={[
            {
              label: TRANSLATION("user_dropdown.lang_th_label"),
              value: "th",
            },
            {
              label: TRANSLATION("user_dropdown.lang_en_label"),
              value: "en",
            },
          ]}
          value={currentLanguageCode}
          onChange={(val) => {
            handleChangeLanguage(val);
          }}
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
            setIsDrawerOpen(false);
            router.push("/profile/personal-information");
          }}
          style={{
            height: 54,
            borderRadius: 16,
            background: token.colorFillQuaternary,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "0 20px",
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
            setIsDrawerOpen(false);
            router.push("/profile/reset-password");
          }}
          style={{
            height: 54,
            borderRadius: 16,
            background: token.colorFillQuaternary,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "0 20px",
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{ width: "100%" }}
          >
            <Space>{TRANSLATION("user_dropdown.change_password")}</Space>
            <Badge
              count="Security"
              style={{
                backgroundColor: token.colorSuccess,
                fontSize: 10,
                fontWeight: 800,
                height: 20,
                lineHeight: "20px",
                borderRadius: 6,
              }}
            />
          </Flex>
        </Button>

        <Divider style={{ margin: "12px 0" }} />

        <Button
          block
          size="large"
          type="primary"
          danger
          ghost
          icon={<LogoutOutlined />}
          onClick={() => {
            handleLogoutAction();
          }}
          style={{
            height: 54,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            borderWidth: 2,
          }}
        >
          {TRANSLATION("user_dropdown.logout")}
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <>
      <Flex
        align="center"
        gap={12}
        onClick={() => {
          setIsDrawerOpen(true);
        }}
        style={{
          padding: "6px 8px 6px 16px",
          borderRadius: 100,
          cursor: "pointer",
          transition: "all 0.3s",
          border: `1px solid ${isDrawerOpen ? token.colorBorder : "transparent"}`,
          backgroundColor: isDrawerOpen
            ? token.colorBgContainer
            : "transparent",
          boxShadow: isDrawerOpen ? token.boxShadow : "none",
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
            transform: isDrawerOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.3s",
          }}
        />
      </Flex>

      <Drawer
        title={TRANSLATION("user_dropdown.personal_info")}
        placement="right"
        onClose={() => {
          setIsDrawerOpen(false);
        }}
        open={isDrawerOpen}
        width={420}
        styles={{
          body: {
            padding: 24,
            backgroundColor: token.colorBgElevated,
          },
          header: {
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          },
        }}
      >
        {userProfileDropdownContent}
      </Drawer>
    </>
  );
}
