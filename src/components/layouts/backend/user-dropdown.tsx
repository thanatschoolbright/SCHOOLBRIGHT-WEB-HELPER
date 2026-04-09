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
import { theme } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  getUserRankFromStorage,
  saveUserRankToMemory,
} from "@/helpers/user-rank.helper";
import { HUAWEI_STORAGE } from "@/services/huawei-bucket-storage.service";
import { fetchUserRank } from "@/services/user-rank/user-rank.service";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankConfig {
  color: string;
  accent: string;
  labelKey: string;
  icon: React.ReactNode;
  gradient: string;
  gradientDark: string;
  ring: string;
}

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

interface UserRankDetails {
  rankLetter?: string;
  completion_rate?: number;
  total_hours?: number | string;
  discipline_score?: number | { score: number };
  rank?: number | string;
}

// ─── Rank Config ──────────────────────────────────────────────────────────────

const RANK_CONFIG: Record<string, RankConfig> = {
  S: {
    color: "#F59E0B",
    accent: "#FBBF24",
    labelKey: "user_dropdown.ranking.legendary",
    icon: <CrownFilled />,
    gradient: "from-amber-50 to-yellow-100",
    gradientDark: "dark:from-indigo-950 dark:to-purple-900",
    ring: "ring-amber-400",
  },
  A: {
    color: "#10B981",
    accent: "#34D399",
    labelKey: "user_dropdown.ranking.excellent",
    icon: <SafetyCertificateFilled />,
    gradient: "from-emerald-50 to-green-100",
    gradientDark: "dark:from-emerald-950 dark:to-green-900",
    ring: "ring-emerald-400",
  },
  B: {
    color: "#3B82F6",
    accent: "#60A5FA",
    labelKey: "user_dropdown.ranking.professional",
    icon: <ThunderboltFilled />,
    gradient: "from-blue-50 to-blue-100",
    gradientDark: "dark:from-blue-950 dark:to-blue-900",
    ring: "ring-blue-400",
  },
  C: {
    color: "#F97316",
    accent: "#FB923C",
    labelKey: "user_dropdown.ranking.intermediate",
    icon: <FireFilled />,
    gradient: "from-orange-50 to-orange-100",
    gradientDark: "dark:from-orange-950 dark:to-red-900",
    ring: "ring-orange-400",
  },
  F: {
    color: "#64748B",
    accent: "#94A3B8",
    labelKey: "user_dropdown.ranking.beginner",
    icon: <UserOutlined />,
    gradient: "from-slate-50 to-slate-100",
    gradientDark: "dark:from-slate-900 dark:to-slate-800",
    ring: "ring-slate-400",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRankCfg = (rankLetter: string): RankConfig =>
  (RANK_CONFIG[rankLetter] ?? RANK_CONFIG.F) as RankConfig;

const generateAvatarUrl = (userProfile: UserProfile): string => {
  const realImage = userProfile.profile_image_path ?? userProfile.image;
  if (realImage && realImage !== "null") {
    if (
      typeof realImage === "string" &&
      !realImage.startsWith("http") &&
      !realImage.startsWith("data:")
    ) {
      const cleanPath = realImage.startsWith("/") ? realImage.substring(1) : realImage;
      return `${HUAWEI_STORAGE.OBS_BUCKET_URL}/${cleanPath}`;
    }
    return realImage;
  }
  const seed = `${userProfile.firstname_en ?? userProfile.firstname ?? "User"}_${
    userProfile.lastname_en ?? userProfile.lastname ?? ""
  }_${String(userProfile.admin_id ?? "0")}`;
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e0e7ff,d1d5db,f3f4f6`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({
  userProfile,
  rankLetter,
  size = 40,
}: {
  userProfile: UserProfile;
  rankLetter: string;
  size?: number;
}) {
  const cfg = getRankCfg(rankLetter);
  return (
    <motion.img
      src={generateAvatarUrl(userProfile)}
      alt="avatar"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="rounded-full object-cover ring-2 flex-shrink-0"
      style={{
        width: size,
        height: size,
        padding: 2,
        boxShadow: `0 0 18px ${cfg.color}55`,
        border: `2.5px solid ${cfg.color}`,
        backgroundColor: "white",
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).src =
          "https://api.dicebear.com/7.x/notionists/svg?seed=fallback&backgroundColor=e0e7ff";
      }}
    />
  );
}

function RankCard({ rankData }: { rankData: UserRankDetails | null }) {
  const { t } = useTranslation("translate");
  const rankLetter = rankData?.rankLetter?.toUpperCase() ?? "F";
  const cfg = getRankCfg(rankLetter);

  const completionPercent = Math.min(Math.round(rankData?.completion_rate ?? 0), 100);
  const totalHours = String(rankData?.total_hours ?? 0);
  const rawScore =
    typeof rankData?.discipline_score === "object"
      ? rankData.discipline_score.score
      : rankData?.discipline_score;
  const disciplineScore = Number(rawScore ?? 0).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl overflow-hidden border border-black/5 dark:border-white/10"
    >
      {/* Rank Banner */}
      <div
        className={`px-5 py-6 bg-gradient-to-br ${cfg.gradient} ${cfg.gradientDark}`}
        style={{ position: "relative" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[2px] opacity-60">
              {t("user_dropdown.prestige_title")}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className="text-5xl font-black leading-none tracking-tighter"
                style={{ color: cfg.color }}
              >
                {rankLetter}
              </span>
              <span className="text-sm font-bold opacity-70">
                {t("user_dropdown.prestige_class")}
              </span>
            </div>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ color: cfg.color, background: `${cfg.color}18` }}
          >
            {cfg.icon}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">
              {t("user_dropdown.ranking_progress")}
            </span>
            <span className="text-[10px] font-black" style={{ color: cfg.color }}>
              {completionPercent}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: cfg.color }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 flex items-center gap-0 bg-white/60 dark:bg-white/5">
        {[
          { label: t("user_dropdown.work_hours"), value: `${totalHours}h` },
          { label: t("user_dropdown.discipline"), value: disciplineScore },
          { label: t("user_dropdown.leaderboard"), value: `#${rankData?.rank ?? "-"}` },
        ].map((stat, i, arr) => (
          <div key={stat.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1 gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-50">
                {stat.label}
              </span>
              <span className="text-sm font-black">{stat.value}</span>
            </div>
            {i < arr.length - 1 && (
              <div className="w-px h-7 bg-black/10 dark:bg-white/10 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  badge,
  danger = false,
  index = 0,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: string;
  danger?: boolean;
  index?: number;
}) {
  return (
    <motion.button
      type="button"
      custom={index}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05, duration: 0.2 } }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-colors duration-150 border cursor-pointer outline-none ${
        danger
          ? "border-red-400/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 bg-transparent font-bold"
          : "border-transparent hover:bg-black/5 dark:hover:bg-white/8 bg-black/[0.03] dark:bg-white/5 text-inherit"
      }`}
    >
      <span className={`text-base flex-shrink-0 ${danger ? "text-red-500" : "opacity-60"}`}>
        {icon}
      </span>
      <span className="flex-1 text-[13.5px] font-semibold leading-none">{label}</span>
      {badge && (
        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-500 text-white uppercase tracking-wide">
          {badge}
        </span>
      )}
    </motion.button>
  );
}

// ─── Drawer Panel ─────────────────────────────────────────────────────────────

function ProfileDrawer({
  open,
  onClose,
  userProfile,
  rankLetter,
  rankData,
  currentLang,
  onChangeLang,
}: {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  rankLetter: string;
  rankData: UserRankDetails | null;
  currentLang: string;
  onChangeLang: (lang: string) => void;
}) {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();
  const router = useRouter();
  const cfg = getRankCfg(rankLetter);
  const isDark = token.colorBgBase !== "#FFFFFF";
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ปิดเมื่อกด ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ล็อค scroll เมื่อเปิด
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = () => {
    toast.info(t("user_dropdown.logging_out"));
    void signOut({ callbackUrl: window.location.origin });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 h-full w-[420px] max-w-full z-[201] flex flex-col shadow-2xl"
            style={{ background: token.colorBgElevated }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: token.colorBorderSecondary }}
            >
              <span className="text-sm font-bold tracking-wide" style={{ color: token.colorTextSecondary }}>
                {t("user_dropdown.personal_info")}
              </span>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base cursor-pointer border-0 outline-none"
                style={{ background: token.colorFillTertiary, color: token.colorTextSecondary }}
              >
                ✕
              </motion.button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <div className="px-6 py-6 flex flex-col gap-6">

                {/* Avatar + Name */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="flex flex-col items-center pt-4 pb-6 rounded-3xl"
                  style={{
                    background: isDark
                      ? `linear-gradient(180deg, ${cfg.color}18 0%, transparent 100%)`
                      : `linear-gradient(180deg, ${cfg.color}10 0%, transparent 100%)`,
                  }}
                >
                  <Avatar userProfile={userProfile} rankLetter={rankLetter} size={110} />
                  <div className="flex flex-col items-center mt-5 gap-2">
                    <span
                      className="text-xl font-black leading-snug text-center"
                      style={{ color: token.colorTextHeading }}
                    >
                      {userProfile.firstname} {userProfile.lastname}
                    </span>
                    <span
                      className="text-[11px] font-bold px-4 py-1 rounded-full"
                      style={{ background: `${cfg.color}22`, color: cfg.color }}
                    >
                      {userProfile.position_name ?? t("user_dropdown.default_position")}
                    </span>
                  </div>
                </motion.div>

                {/* Rank Card */}
                {rankData && <RankCard rankData={rankData} />}

                {/* Language Switcher */}
                <div className="flex flex-col gap-3">
                  <span
                    className="text-[10px] font-black uppercase tracking-[2px] pl-1"
                    style={{ color: token.colorTextDescription }}
                  >
                    {t("user_dropdown.settings")}
                  </span>

                  <div
                    className="flex rounded-2xl p-1 gap-1"
                    style={{ background: token.colorFillQuaternary }}
                  >
                    {["th", "en"].map((lang) => (
                      <motion.button
                        key={lang}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onChangeLang(lang)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer border-0 outline-none"
                        style={{
                          background: currentLang === lang ? token.colorBgContainer : "transparent",
                          color: currentLang === lang ? token.colorPrimary : token.colorTextSecondary,
                          boxShadow: currentLang === lang ? token.boxShadowSecondary : "none",
                        }}
                      >
                        {lang === "th" ? t("user_dropdown.lang_th_label") : t("user_dropdown.lang_en_label")}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="flex flex-col gap-2">
                  <MenuButton
                    index={0}
                    icon={<IdcardOutlined />}
                    label={t("user_dropdown.personal_info")}
                    onClick={() => navigate("/profile/personal-information")}
                  />
                  <MenuButton
                    index={1}
                    icon={<LockOutlined />}
                    label={t("user_dropdown.change_password")}
                    badge="Security"
                    onClick={() => navigate("/profile/reset-password")}
                  />
                </div>

                {/* Divider */}
                <div className="h-px w-full" style={{ background: token.colorBorderSecondary }} />

                {/* Logout */}
                <MenuButton
                  index={0}
                  icon={<LogoutOutlined />}
                  label={t("user_dropdown.logout")}
                  onClick={handleLogout}
                  danger
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Trigger Button ───────────────────────────────────────────────────────────

export default function UserProfileDropdown(): React.JSX.Element {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();

  const AUTH_REDUX = useAppSelector((state) => state.callAdminLogin);
  const userProfile = (AUTH_REDUX.response.data?.user_data ?? {}) as UserProfile;

  const [currentLang, setCurrentLang] = useState<string>(i18n.language);
  const [rankData, setRankData] = useState<UserRankDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const adminId = userProfile.admin_id;
    if (!adminId) return;
    const load = async () => {
      try {
        const res = (await fetchUserRank(String(adminId))) as UserRankDetails | null;
        if (res) saveUserRankToMemory(res as unknown as import("@/helpers/user-rank.helper").UserRankData);
        setRankData(res ?? (getUserRankFromStorage() as UserRankDetails | null));
      } catch {
        setRankData(getUserRankFromStorage() as UserRankDetails | null);
      }
    };
    void load();
  }, [userProfile.admin_id]);

  const handleChangeLang = (lang: string) => {
    if (lang === currentLang) return;
    void i18n.changeLanguage(lang).then(() => {
      setCurrentLang(lang);
      toast.success(t("user_dropdown.lang_success"));
    });
  };

  const rankLetter = rankData?.rankLetter?.toUpperCase() ?? "F";
  const cfg = getRankCfg(rankLetter);

  return (
    <>
      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-4 px-4 py-2 rounded-2xl cursor-pointer border outline-none transition-all duration-200"
        style={{
          borderColor: isOpen ? token.colorBorder : token.colorBorderSecondary,
          background: isOpen ? token.colorBgContainer : token.colorBgElevated,
          boxShadow: isOpen ? token.boxShadow : token.boxShadowSecondary,
        }}
      >
        {/* Name + rank badge */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[15px] font-bold leading-none" style={{ color: token.colorText }}>
            {userProfile.firstname} {userProfile.lastname}
          </span>
          <span
            className="text-[11px] font-black px-2.5 py-1 rounded-lg leading-none uppercase tracking-wide"
            style={{ background: cfg.color, color: "#fff" }}
          >
            {t(cfg.labelKey)}
          </span>
        </div>

        <Avatar userProfile={userProfile} rankLetter={rankLetter} size={48} />

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="text-[12px] flex-shrink-0"
          style={{ color: token.colorTextQuaternary }}
        >
          <DownOutlined />
        </motion.span>
      </motion.button>

      {/* Drawer Panel */}
      <ProfileDrawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        userProfile={userProfile}
        rankLetter={rankLetter}
        rankData={rankData}
        currentLang={currentLang}
        onChangeLang={handleChangeLang}
      />
    </>
  );
}
