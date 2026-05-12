"use client";

import UserDropdown from "@components/layouts/backend/user-dropdown";
import { theme } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCamera() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconSignature() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17c3.333-5.333 5.333-8 6-8s2 2.667 3 4c.667-2 1.5-3 2.5-3s2.5 1.333 4.5 4" />
      <path d="M2 20h20" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────

interface AlertItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: "amber" | "rose";
  index: number;
  onNavigate: (href: string) => void;
}

function AlertItem({
  icon,
  label,
  href,
  color,
  index,
  onNavigate,
}: AlertItemProps) {
  const colorMap = {
    amber: {
      pill: "bg-amber-50 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-700/40",
      dot: "bg-amber-400",
      ping: "bg-amber-300",
      icon: "text-amber-500",
      text: "text-amber-700 dark:text-amber-300",
      arrow: "text-amber-400",
      glow: "shadow-amber-200/60 dark:shadow-amber-900/40",
    },
    rose: {
      pill: "bg-rose-50 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-700/40",
      dot: "bg-rose-500",
      ping: "bg-rose-400",
      icon: "text-rose-500",
      text: "text-rose-700 dark:text-rose-300",
      arrow: "text-rose-400",
      glow: "shadow-rose-200/60 dark:shadow-rose-900/40",
    },
  };
  const c = colorMap[color];

  return (
    <motion.button
      type="button"
      onClick={() => onNavigate(href)}
      initial={{ opacity: 0, x: -16, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12, scale: 0.94 }}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.07,
      }}
      whileHover={{ scale: 1.03, x: 2 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex items-center gap-2.5 pl-3 pr-3.5 py-2 rounded-full border cursor-pointer outline-none shadow-md ${c.pill} ${c.glow} transition-shadow duration-200`}
    >
      {/* Ping dot */}
      <span className="relative flex-shrink-0 w-2 h-2">
        <span className={`absolute inset-0 rounded-full ${c.dot}`} />
        <span
          className={`absolute inset-0 rounded-full ${c.ping} animate-ping opacity-70`}
        />
      </span>

      {/* Icon */}
      <span className={`flex-shrink-0 ${c.icon}`}>{icon}</span>

      {/* Label */}
      <span
        className={`text-[11.5px] font-semibold leading-none whitespace-nowrap ${c.text}`}
      >
        {label}
      </span>

      {/* Arrow hint */}
      <span className={`flex-shrink-0 ${c.arrow}`}>
        <IconChevron />
      </span>
    </motion.button>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

interface AlertBannerProps {
  missingPhoto: boolean;
  missingSignature: boolean;
}

function AlertBanner({ missingPhoto, missingSignature }: AlertBannerProps) {
  const router = useRouter();
  const hasAny = missingPhoto || missingSignature;

  const navigate = (href: string) => router.push(href);

  return (
    <AnimatePresence mode="wait">
      {hasAny && (
        <motion.div
          key="alert-banner"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          <AnimatePresence>
            {missingPhoto && (
              <AlertItem
                key="photo"
                index={0}
                color="rose"
                icon={<IconCamera />}
                label="กรุณาอัปโหลดรูปประจำตัว"
                href="/profile/personal-information"
                onNavigate={navigate}
              />
            )}
            {missingSignature && (
              <AlertItem
                key="signature"
                index={missingPhoto ? 1 : 0}
                color="amber"
                icon={<IconSignature />}
                label="กรุณาอัปโหลดลายเซ็น"
                href="/profile/personal-information"
                onNavigate={navigate}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────

/**
 * Navbar หลักของ Backend Layout
 * โปร่งใส รองรับ glass effect จาก layout
 */
export default function MainHeader(): React.JSX.Element {
  const { token } = theme.useToken();
  const { data: sessionData } = useSession();

  const hasProfileImage = !!sessionData?.user?.image;
  const sessionUserId = (sessionData?.user as any)?.id as string | undefined;

  const [hasSignature, setHasSignature] = useState<boolean | null>(null);

  // ดึงสถานะลายเซ็นของ user คนนี้จาก API — เรียกครั้งเดียวเมื่อ session พร้อม
  useEffect(() => {
    if (!sessionUserId) return;

    let cancelled = false;

    fetch(
      `/api/v2/admin/user-management/signature/read?user_id=${sessionUserId}`,
      { credentials: "include" },
    )
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setHasSignature(!!json?.data?.signature_url);
      })
      .catch(() => {
        // ถ้า error ให้ถือว่ามีแล้ว เพื่อไม่รบกวน UX โดยไม่จำเป็น
        if (!cancelled) setHasSignature(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  const missingPhoto = !hasProfileImage;
  // hasSignature === null หมายถึงกำลังโหลด — ยังไม่แสดง banner signature
  const missingSignature = hasSignature === false;

  return (
    <div className="flex items-center justify-between w-full h-full">
      {/* Left: Alert banners */}
      <div className="flex items-center">
        <AlertBanner
          missingPhoto={missingPhoto}
          missingSignature={missingSignature}
        />
      </div>

      {/* Right: User Dropdown — ครอบด้วย Rounded container รองรับ Light/Dark Mode */}
      <div
        className="flex items-center ml-auto"
        style={{
          background: token.colorBgContainer,
          borderRadius: 9999,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: token.boxShadowTertiary,
          padding: "4px 4px 4px 12px",
        }}
      >
        <UserDropdown />
      </div>
    </div>
  );
}
