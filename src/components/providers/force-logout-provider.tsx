"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

/**
 * 🛡️ ForceLogoutProvider: จัดการการบังคับออกจากระบบ
 * ยกเลิกการใช้ localStorage เพื่อความปลอดภัยสูงสุดตามนโยบายใหม่
 */

type ForceLogoutContextType = {
  triggerForceLogout: () => void;
  isForced: boolean;
};

const ForceLogoutContext = createContext<ForceLogoutContextType | undefined>(
  undefined,
);

export const useForceLogout = () => {
  const ctx = useContext(ForceLogoutContext);
  if (!ctx)
    throw new Error("useForceLogout must be used within ForceLogoutProvider");
  return ctx;
};

export default function ForceLogoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isForced, setIsForced] = useState<boolean>(false);

  /**
   * 🚀 ฟังก์ชันหลักสำหรับออกจากระบบแบบปลอดภัย
   */
  const performLogout = useCallback(async () => {
    try {
      // ใช้ NextAuth signOut เพื่อทำลาย session ทั้งใน client และ server
      await signOut({ redirect: true, callbackUrl: "/auth/v2/signin" });
    } catch (e) {
      // fallback กรณี signOut มีปัญหา
      router.push("/auth/v2/signin");
    }
  }, [router]);

  /**
   * 📢 สั่งการบังคับออกจากระบบ
   */
  const triggerForceLogout = useCallback(() => {
    setIsForced(true);
    performLogout();
  }, [performLogout]);

  return (
    <ForceLogoutContext.Provider value={{ triggerForceLogout, isForced }}>
      {children}
    </ForceLogoutContext.Provider>
  );
}
