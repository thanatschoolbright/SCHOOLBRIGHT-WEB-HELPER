"use client";

import React, { useEffect, useState } from "react";
import {
  Avatar,
  Divider,
  Flex,
  Popover,
  Progress,
  Segmented,
  theme,
  Typography,
} from "antd";
import {
  DownOutlined,
  LogoutOutlined,
  TrophyFilled,
  UserOutlined,
  CrownFilled,
  ThunderboltFilled,
  SafetyCertificateFilled,
  ClockCircleFilled,
  FireFilled,
} from "@ant-design/icons";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import i18n from "@/i18n";

// Services & Helpers
import { getUserRankFromStorage } from "@/helpers/user-rank.helper";
import { fetchUserRank } from "@/services/user-rank/user-rank.service";

const { Text, Title } = Typography;

// ==========================================
// 🎨 การตั้งค่า Rank และธีม
// ==========================================

// Config สีและ Effect ของแต่ละ Rank
const RANK_THEME_CONFIG: Record<string, any> = {
  S: {
    color: "#F59E0B",
    label: "ระดับตำนาน (Legendary)",
    icon: <CrownFilled />,
    shadowColor: "rgba(251,191,36,0.6)",
    gradientFrom: "#FFF7E6", // Light Yellow
    gradientTo: "#FFF1B8",
  },
  A: {
    color: "#10B981",
    label: "ระดับยอดเยี่ยม (Elite)",
    icon: <SafetyCertificateFilled />,
    shadowColor: "rgba(16,185,129,0.4)",
    gradientFrom: "#F6FFED", // Light Green
    gradientTo: "#D9F7BE",
  },
  B: {
    color: "#3B82F6",
    label: "ระดับมืออาชีพ (Pro)",
    icon: <ThunderboltFilled />,
    shadowColor: "rgba(59,130,246,0.4)",
    gradientFrom: "#E6F7FF", // Light Blue
    gradientTo: "#BAE7FF",
  },
  C: {
    color: "#F97316",
    label: "ระดับกลาง (Intermediate)",
    icon: <UserOutlined />,
    shadowColor: "rgba(249,115,22,0.4)",
    gradientFrom: "#FFFBE6", // Light Orange
    gradientTo: "#FFE58F",
  },
  F: {
    color: "#64748B",
    label: "ระดับเริ่มต้น (Rookie)",
    icon: <UserOutlined />,
    shadowColor: "rgba(100,116,139,0.4)",
    gradientFrom: "#F5F5F5", // Light Gray
    gradientTo: "#E0E0E0",
  },
};

const generateAvatarUrl = (userProfile: any) => {
  const seedString = `${userProfile?.firstname ?? "User"}_${
    userProfile?.lastname ?? ""
  }_${userProfile?.admin_id ?? "0"}`;
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
    seedString
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
  const { token } = theme.useToken();
  const currentRankLetter = userRankDetails?.rankLetter?.toUpperCase() || "F";
  const rankThemeConfig =
    RANK_THEME_CONFIG[currentRankLetter] || RANK_THEME_CONFIG.F;

  const taskCompletionPercentage = Math.min(
    Math.round(userRankDetails?.completion_rate || 0),
    100
  );
  const totalUsageHours = Number(userRankDetails?.total_hours || 0).toFixed(1);
  const disciplineScoreValue =
    typeof userRankDetails?.discipline_score === "object"
      ? (userRankDetails.discipline_score?.score ?? 0).toFixed(1)
      : Number(userRankDetails?.discipline_score ?? 0).toFixed(1);

  const cardBackgroundStyle = `linear-gradient(135deg, ${rankThemeConfig.gradientFrom}1A 0%, ${rankThemeConfig.gradientTo}33 100%)`;

  return (
    <div
      className="relative p-5 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
      style={{
        background: cardBackgroundStyle,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex justify="space-between" align="start" className="mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-2xl font-black italic tracking-tighter"
              style={{
                background: `linear-gradient(to right, ${rankThemeConfig.color}, ${rankThemeConfig.color}88)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              RANK {currentRankLetter}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm"
              style={{
                backgroundColor: token.colorFillQuaternary,
                color: token.colorTextSecondary,
                border: `1px solid ${token.colorBorder}`,
              }}
            >
              {rankThemeConfig.label.split(" ")[0]}
            </span>
          </div>
          <Text type="secondary" className="text-xs">
            อันดับรวม #{userRankDetails?.rank ?? "-"}
          </Text>
        </div>

        <div className="relative">
          <Progress
            type="circle"
            percent={taskCompletionPercentage}
            size={50}
            strokeColor={rankThemeConfig.color}
            strokeWidth={8}
            trailColor={token.colorFillSecondary}
            format={() => null}
          />
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span
              className="text-[10px] font-bold"
              style={{ color: rankThemeConfig.color }}
            >
              {taskCompletionPercentage}%
            </span>
          </div>
        </div>
      </Flex>

      <Divider style={{ margin: "12px 0", opacity: 0.6 }} />

      <div className="grid grid-cols-3 gap-2">
        <StatisticBoxItem
          label="ชั่วโมง"
          value={totalUsageHours}
          icon={<ClockCircleFilled />}
        />
        <StatisticBoxItem
          label="วินัย"
          value={disciplineScoreValue}
          icon={<TrophyFilled />}
          highlight
          color={rankThemeConfig.color}
        />
        <StatisticBoxItem label="ระดับ" value="12" icon={<FireFilled />} />
      </div>
    </div>
  );
};

const StatisticBoxItem = ({ label, value, icon, highlight, color }: any) => {
  const { token } = theme.useToken();
  return (
    <div
      className="flex flex-col items-center p-2 rounded-xl"
      style={{
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
      }}
    >
      <span
        style={{
          color: highlight ? color : token.colorTextTertiary,
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        {icon}
      </span>
      <span
        className="text-sm font-bold leading-tight"
        style={{ color: highlight ? color : token.colorText }}
      >
        {value}
      </span>
      <span
        className="text-[9px] uppercase font-medium tracking-wide mt-0.5"
        style={{ color: token.colorTextQuaternary }}
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
  const { token } = theme.useToken();
  const authenticationState = useAppSelector((state) => state.callAdminLogin);
  const userProfileData = authenticationState?.response?.data?.user_data || {};

  const [currentLanguageCode, setCurrentLanguageCode] = useState<string>(
    i18n.language
  );
  const [userRankData, setUserRankData] = useState<any>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    const adminId = userProfileData?.admin_id;
    if (!adminId) return;

    const fetchAndSetUserRank = async () => {
      try {
        const rankApiResponse = await fetchUserRank(String(adminId));
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
    toast.success("เปลี่ยนภาษาเรียบร้อยแล้ว");
  };

  const handleLogoutAction = () => {
    toast.info("กำลังออกจากระบบ...");
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(() => (window.location.href = "/"), 500);
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
            {userProfileData.position || "ผู้ดูแลระบบโรงเรียน"}
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
                label: "ภาษาไทย",
                value: "th",
                icon: <span className="mr-1 text-base">🇹🇭</span>,
              },
              {
                label: "English",
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
          ออกจากระบบ
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
      styles={{
        body: {
          padding: "24px",
          borderRadius: "24px",
          boxShadow: token.boxShadowSecondary,
          backgroundColor: token.colorBgElevated,
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
            {currentRankThemeConfig.label.split(" ")[0]}
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
