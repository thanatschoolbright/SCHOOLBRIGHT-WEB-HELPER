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
import { Avatar, Flex, Popover, Segmented, theme, Typography } from "antd";
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
    <div
      className="relative inline-block rounded-full transition-transform duration-300 hover:scale-105"
      style={{
        boxShadow: `0 0 0 2px ${token.colorBgContainer}, 0 0 0 4px ${rankThemeConfig.color}, 0 4px 12px ${rankThemeConfig.shadowColor}`,
      }}
    >
      <Avatar
        size={avatarSize}
        src={generateAvatarUrl(userProfile)}
        style={{ backgroundColor: token.colorBgContainer, display: "block" }}
      />
      <div
        className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] shadow-sm"
        style={{
          background: rankThemeConfig.color,
          color: "#fff",
          border: `1px solid ${token.colorBgContainer}`,
        }}
      >
        {rankThemeConfig.icon}
      </div>
    </div>
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
    <div
      className="relative p-4 rounded-3xl overflow-hidden transition-all duration-500 group"
      style={{
        background: isDark ? rankConfig.darkBg : rankConfig.bg,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}`,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.4)"
          : `0 8px 24px ${rankConfig.color}22`,
      }}
    >
      {/* Background Decoration Icon */}
      <div
        className="absolute -right-4 -bottom-4 text-7xl opacity-10 pointer-events-none rotate-12 group-hover:rotate-0 transition-transform duration-700"
        style={{ color: rankConfig.color }}
      >
        {rankConfig.icon}
      </div>

      <Flex align="center" justify="space-between" className="mb-4">
        <Flex align="center" gap={12}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
            style={{
              background: isDark ? "rgba(0,0,0,0.3)" : "#fff",
              color: rankConfig.color,
              border: `1.5px solid ${rankConfig.accent}44`,
            }}
          >
            {rankConfig.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-black tracking-wider"
                style={{ color: rankConfig.color }}
              >
                {TRANSLATION(rankConfig.labelKey)}
              </span>
            </div>
            <Title
              level={3}
              className="m-0 leading-none mt-1 font-black italic tracking-tighter"
              style={{ color: isDark ? "#fff" : token.colorTextHeading }}
            >
              RANK {currentRankLetter}
            </Title>
          </div>
        </Flex>

        <div className="text-right">
          <Text
            className="text-[10px] font-bold opacity-50 block mb-0.5 whitespace-nowrap"
            style={{ color: token.colorTextSecondary }}
          >
            {TRANSLATION("user_dropdown.rank_title")}
          </Text>
          <Text
            className="text-lg font-black"
            style={{ color: rankConfig.color }}
          >
            #{userRankDetails?.rank || "-"}
          </Text>
        </div>
      </Flex>

      <div className="grid grid-cols-3 gap-2 relative z-10">
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
      </div>
    </div>
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
    <div
      className="flex flex-col items-center p-2 rounded-2xl transition-all duration-300"
      style={{
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.4)",
        border: `1px solid ${highlight ? rankColor + "44" : "transparent"}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <span
        style={{
          color: highlight ? rankColor : token.colorTextTertiary,
          fontSize: 14,
          marginBottom: 2,
        }}
      >
        {icon}
      </span>
      <span
        className="text-[13px] font-black"
        style={{ color: isDark ? "#fff" : token.colorText }}
      >
        {value}
      </span>
      <span
        className="text-[8px] uppercase font-bold tracking-tighter opacity-60"
        style={{ color: token.colorTextSecondary }}
      >
        {label}
      </span>
    </div>
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
    <div className="w-[340px] animate-fade-in-up">
      <div className="flex items-center gap-4 px-1 mb-4">
        <RankAvatarDisplay
          userProfile={userProfileData}
          currentRankLetter={currentRankLetter}
          avatarSize={64}
        />
        <div className="flex-1 overflow-hidden">
          <Title
            level={5}
            className="truncate m-0 leading-tight"
            style={{ marginBottom: 0, color: token.colorTextHeading }}
          >
            {userProfileData.firstname} {userProfileData.lastname}
          </Title>
          <span
            className="text-xs flex items-center gap-1 mt-1"
            style={{ color: token.colorTextSecondary }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {userProfileData.position_name ||
              TRANSLATION("user_dropdown.default_position")}
          </span>
        </div>
      </div>

      {userRankData && <UserRankDetailsCard userRankDetails={userRankData} />}

      <div className="mt-5 space-y-3">
        <div
          className="p-1 rounded-xl"
          style={{ backgroundColor: token.colorFillQuaternary }}
        >
          <Segmented
            block
            options={[
              {
                label: TRANSLATION("user_dropdown.lang_th_label"),
                value: "th",
                icon: <span className="mr-1 text-base">🇹🇭</span>,
              },
              {
                label: TRANSLATION("user_dropdown.lang_en_label"),
                value: "en",
                icon: <span className="mr-1 text-base">🇬🇧</span>,
              },
            ]}
            value={currentLanguageCode}
            onChange={(val) => handleChangeLanguage(val as string)}
            className="bg-transparent"
          />
        </div>

        <button
          onClick={() => {
            setIsPopoverOpen(false);
            router.push("/profile/personal-information");
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group"
          style={{
            color: token.colorText,
            backgroundColor: token.colorFillQuaternary,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = token.colorFillSecondary)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = token.colorFillQuaternary)
          }
        >
          <IdcardOutlined className="group-hover:scale-110 transition-transform" />
          {TRANSLATION("user_dropdown.personal_info")}
        </button>

        <button
          onClick={() => {
            setIsPopoverOpen(false);
            router.push("/profile/reset-password");
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group"
          style={{
            color: token.colorText,
            backgroundColor: token.colorFillQuaternary,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = token.colorFillSecondary)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = token.colorFillQuaternary)
          }
        >
          <LockOutlined className="group-hover:rotate-12 transition-transform" />
          {TRANSLATION("user_dropdown.change_password")}
          <span
            className="px-1.5 py-0.5 rounded-md text-[9px] font-black text-white shadow-sm uppercase animate-pulse"
            style={{ backgroundColor: token.colorError }}
          >
            แก้ไขบัก
          </span>
        </button>

        <button
          onClick={handleLogoutAction}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group"
          style={{
            color: token.colorError,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = token.colorErrorBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <LogoutOutlined className="group-hover:-translate-x-1 transition-transform" />
          {TRANSLATION("user_dropdown.logout")}
        </button>
      </div>
    </div>
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
          padding: "24px",
          borderRadius: "24px",
          boxShadow: "0 10px 32px rgba(0,0,0,0.12)",
          backgroundColor: token.colorBgElevated,
          border: `1px solid ${token.colorBorderSecondary}`,
        },
      }}
    >
      <div
        className={`
          flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full cursor-pointer transition-all duration-300 border
          ${isPopoverOpen ? "translate-y-0.5" : "hover:opacity-80"}
        `}
        style={{
          backgroundColor: isPopoverOpen
            ? token.colorBgContainer
            : "transparent",
          borderColor: isPopoverOpen ? token.colorBorder : "transparent",
          boxShadow: isPopoverOpen ? token.boxShadow : "none",
        }}
      >
        {/* ปรับ Layout ให้ชื่อกับ Rank ชิดกันและอยู่กึ่งกลางแนวตั้ง */}
        <div className="hidden sm:flex flex-col items-end justify-center mr-1 h-full">
          <span
            className="text-sm font-bold leading-tight"
            style={{ color: token.colorText }}
          >
            {userProfileData.firstname}
          </span>
          <span
            className="text-[9px] font-extrabold px-1.5 py-[2px] rounded mt-1 tracking-wider text-white inline-flex items-center justify-center"
            style={{
              background: currentRankThemeConfig.color,
              lineHeight: 1, // บังคับ line-height ให้พอดีกับตัวอักษร
            }}
          >
            {TRANSLATION(currentRankThemeConfig.labelKey).split(" ")[0]}
          </span>
        </div>

        <RankAvatarDisplay
          userProfile={userProfileData}
          currentRankLetter={currentRankLetter}
          avatarSize={38}
        />

        <DownOutlined
          className={`text-xs transition-transform duration-300 ${
            isPopoverOpen ? "rotate-180" : ""
          }`}
          style={{ color: token.colorTextQuaternary }}
        />
      </div>
    </Popover>
  );
}
