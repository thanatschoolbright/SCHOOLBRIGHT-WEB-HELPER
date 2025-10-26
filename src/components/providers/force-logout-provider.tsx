"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchUserRank } from "@/services/user-rank/user-rank.service";
import { useRouter } from "next/navigation";

// ! ForceLogoutProvider (ผู้ให้บริการฟีเจอร์บังคับออกจากระบบ)
// ---------------------------------------------------------------
// ? วัตถุประสงค์
// - จัดการการ "บังคับออกจากระบบ" (force logout) โดยอาศัยธงใน localStorage ชื่อ `force_logout`.
// - เปิด API เล็ก ๆ ให้ส่วนอื่นของแอป (เช่น admin tools หรือสคริปต์) เรียกเพื่อสั่งบังคับออกจากระบบได้
// - ฟังเหตุการณ์ `storage` เพื่อให้การสั่งบังคับแพร่ไปยังแท็บ/หน้าต่างอื่น ๆ ของเบราว์เซอร์
//
// ! พฤติกรรมหลักเมื่อเจอ `force_logout === "true"`
// 1) ลบค่าใน localStorage ทั้งหมด ยกเว้น key `force_logout` (สำคัญ: ห้ามลบ key นี้)
// 2) เปลี่ยนเส้นทางผู้ใช้ไปที่ `/auth/sign-in` เพื่อให้ผู้ใช้ล็อกอินใหม่
//
// TODO (ข้อควรรู้ / สำหรับ Developer)
// - ห้ามลบ `force_logout` ออกเมื่อทำการ clear: ถ้าเอาออก ผู้ใช้จะเด้ง (bounce) ไป-มา ระหว่างหน้า login และแอป
// - หากต้องการให้ธงนี้หายไปหลังจาก maintenance เสร็จ ให้ผู้ดูแลระบบลบคีย์ `force_logout` ด้วยตนเอง
//
// ? วิธีเรียกใช้ (ตัวอย่าง)
// - จาก component ใด ๆ ภายใน client: const { triggerForceLogout } = useForceLogout(); triggerForceLogout();
// - หรือจากหน้า admin: เรียก triggerForceLogout() เพื่อให้ทุกแท็บล็อกเอาท์
//
// NOTE (ขยายความ / ข้อเสนอแนะ)
// - หากต้องการให้บังคับ invalidation ของ token/session ทางฝั่ง server ให้เพิ่มการเรียก API ภายใน
//   performLogout() เพื่อให้ backend ยกเลิก session ด้วย
// - ถ้าต้องการให้ flag นี้มีอายุ ให้เก็บ timestamp แทนค่า "true" และตรวจสอบอายุใน performLogout
//
// ! สรุปการแก้ไขที่อาจต้องทำโดย Developer
// - เพิ่มการเรียก API ใน performLogout() เพื่อ invalidate session บน server
// - สร้างหน้า/ปุ่ม Admin ที่เรียก useForceLogout().triggerForceLogout() และ (ถ้าต้องการ) เอา key ออกเมื่อ maintenance เสร็จ
// - (ถ้าต้องการ) เปลี่ยนพฤติกรรมให้ `force_logout` ถูกลบอัตโนมัติหลัง redirect ด้วย logic ของ Admin
// ---------------------------------------------------------------

const FORCE_KEY = "force_logout";
// When we need to mark that we've already handled a "missing key" situation,
// write this value so the provider does not repeatedly clear localStorage.
const HANDLED_VALUE = "handled_once";

type ForceLogoutContextType = {
  // Set the `force_logout` key (value "true") and force immediate logout in this tab.
  triggerForceLogout: () => void;
  // A boolean indicating whether force logout flag currently exists.
  isForced: boolean;
};

const ForceLogoutContext = createContext<ForceLogoutContextType | undefined>(undefined);

export const useForceLogout = () => {
  const ctx = useContext(ForceLogoutContext);
  if (!ctx) throw new Error("useForceLogout must be used within ForceLogoutProvider");
  return ctx;
};

export default function ForceLogoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isForced, setIsForced] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FORCE_KEY) === "true";
    } catch (e) {
      return false;
    }
  });

  // Perform logout: clear all localStorage keys except FORCE_KEY, then redirect to sign-in.
  const performLogout = useCallback(() => {
    try {
      // Read current force flag value
      let forceValue = localStorage.getItem(FORCE_KEY);

      // If the flag is missing, set a handled marker so we ONLY clear once.
      // We set HANDLED_VALUE before clearing so the provider won't repeatedly run the clear on subsequent mounts.
      if (forceValue === null) {
        try {
          localStorage.setItem(FORCE_KEY, HANDLED_VALUE);
          forceValue = HANDLED_VALUE;
        } catch (e) {
          // ignore
        }
      }

      // Collect keys first (some environments don't allow mutation during iteration)
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keys.push(k);
      }

      // Remove every key except FORCE_KEY
      keys.forEach((k) => {
        if (k !== FORCE_KEY) {
          localStorage.removeItem(k);
        }
      });

      // Keep the FORCE_KEY with an appropriate value:
      // - If it was 'true', leave it as 'true' (admin-triggered force)
      // - If we set HANDLED_VALUE above, leave it as HANDLED_VALUE so we don't loop.
      if (forceValue === "true") {
        localStorage.setItem(FORCE_KEY, "true");
      } else if (forceValue === HANDLED_VALUE) {
        localStorage.setItem(FORCE_KEY, HANDLED_VALUE);
      }
    } catch (e) {
      // localStorage might not be available in some environments — swallow errors but continue to redirect
      // (We still want to navigate the user to the sign-in page.)
    }

    // Redirect to sign-in. Using router.push keeps app routing behavior consistent.
    // We do not remove the force flag here on purpose.
    try {
      router.push("/auth/sign-in");
    } catch (e) {
      // fallback
      window.location.href = "/auth/sign-in";
    }
  }, [router]);

  // Public method to trigger force-logout from code (sets flag + performs logout locally)
  const triggerForceLogout = useCallback(() => {
    try {
      localStorage.setItem(FORCE_KEY, "true");
      setIsForced(true);
    } catch (e) {
      // ignore
    }

    // Immediately logout this tab as well
    performLogout();
  }, [performLogout]);

  // Listen for storage events so force-logout propagates across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === FORCE_KEY && e.newValue === "true") {
        setIsForced(true);
        performLogout();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [performLogout]);

  // On mount, enforce presence or value of the force flag.
  // Behavior:
  // - If FORCE_KEY is missing (null), we CLEAR all localStorage and redirect to sign-in.
  //   This follows the requirement: when the key does not exist, force a full local clear and redirect.
  // - If FORCE_KEY === "true", behave as before: set `isForced` and run performLogout()
  // NOTE: This is a strict behavior. Use with caution — it will wipe all client localStorage if the key is not present.
  useEffect(() => {
    try {
      const value = localStorage.getItem(FORCE_KEY);
      if (value === null) {
        // Key missing -> clear everything and redirect
        // We reuse performLogout() which removes all keys except FORCE_KEY (none in this case) and redirects.
        setTimeout(() => performLogout(), 10);
        return;
      }

      if (value === "true") {
        setIsForced(true);
        // Defer to next tick to avoid interfering with initial render
        setTimeout(() => performLogout(), 10);
      }
    } catch (e) {
      // ignore
    }
  }, [performLogout]);

  const ctxValue: ForceLogoutContextType = {
    triggerForceLogout,
    isForced,
  };

  // Auto-refresh user rank while the user is active on the site.
  // - If no USER_RANK_DATA exists or it's older than 24 hours, fetch and update it.
  // - Run check on mount and then poll hourly while the page is open.
  useEffect(() => {
    const KEY = "USER_RANK_DATA";
    const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

    const refreshRankIfNeeded = async () => {
      try {
        const authRaw = localStorage.getItem("AUTH_USER");
        if (!authRaw) return;
        const auth = JSON.parse(authRaw);
        const adminId = auth?.user_data?.admin_id;
        if (!adminId) return;

        const storedRaw = localStorage.getItem(KEY);
        if (storedRaw) {
          try {
            const stored = JSON.parse(storedRaw);
            const updatedAt = Number(stored?.updatedAt || 0);
            if (Date.now() - updatedAt < STALE_MS && stored?.data) {
              // still fresh
              return;
            }
          } catch (e) {
            // parse error -> continue to fetch
          }
        }

        // fetch new rank data and persist with timestamp
        const rankData = await fetchUserRank(String(adminId));
        if (rankData) {
          try {
            localStorage.setItem(KEY, JSON.stringify({ data: rankData, updatedAt: Date.now() }));
            // optional: also keep the raw shape for backwards compatibility
            if (!localStorage.getItem("USER_RANK_DATA_RAW") && rankData.rank) {
              try { localStorage.setItem("USER_RANK_DATA_RAW", JSON.stringify(rankData)); } catch(e){}
            }
          } catch (e) {
            // ignore storage write failures
          }
        }
      } catch (e) {
        // ignore to avoid breaking provider
      }
    };

    // run once now
    refreshRankIfNeeded();

    // poll hourly to check staleness
    const handle = window.setInterval(refreshRankIfNeeded, 60 * 60 * 1000);
    return () => window.clearInterval(handle);
  }, []);

  return <ForceLogoutContext.Provider value={ctxValue}>{children}</ForceLogoutContext.Provider>;
}
