"use client";

/**
 * 📦 StorageProvider: จัดการข้อมูลในหน่วยความจำ (Memory Cache) แทน LocalStorage
 * ปรับปรุงตามนโยบายความปลอดภัย ห้ามใช้ LocalStorage
 */

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import { useEffect, createContext, useContext, useState } from "react";
import { toast } from "sonner";

const StorageContext = createContext<any>(null);

export const useMemoryStorage = () => useContext(StorageContext);

export function StorageProvider({
  children,
}: React.PropsWithChildren): JSX.Element {
  const [cache, setCache] = useState<Record<string, any>>({});

  /**
   * 💾 บันทึกข้อมูลลง Memory และแสดง Toast
   */
  const saveToMemory = (storageName: string, data: any): void => {
    setCache((prev) => ({ ...prev, [storageName]: data }));
    toast.info(`โหลดข้อมูล ${storageName} ลงในหน่วยความจำ (local storage)`, {
      duration: 3000,
    });
  };

  /**
   * 🚀 โหลดข้อมูลผู้ใช้จาก API
   */
  const fetchUsers = async (): Promise<void> => {
    const toastId = toast.loading("กำลังโหลดข้อมูลผู้ใช้งาน...");
    try {
      const response = await axios.get("/api/v1/admin/user/");
      const fetchedUsers = response?.data?.data?.data || [];
      saveToMemory("users", fetchedUsers);
      toast.success("โหลดข้อมูลสำเร็จ", { id: toastId });
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว", { id: toastId });
    }
  };

  /**
   * 🚀 โหลดข้อมูลโปรเจ็กต์จาก API
   */
  const fetchProjects = async (): Promise<void> => {
    const toastId = toast.loading("กำลังโหลดข้อมูลโปรเจ็ค...");
    try {
      const response = await axios.post(
        "/api/v1/timesheet/project/read/",
        { limit: 50, page: 1 },
        { headers: { "Content-Type": "application/json" } },
      );
      const data = response.data;
      saveToMemory("projects", data.data);
      toast.success("โหลดข้อมูลสำเร็จ", { id: toastId });
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว", { id: toastId });
    }
  };

  /**
   * ⚙️ โหลดข้อมูลเริ่มต้นเมื่อ Component Mount
   */
  useEffect(() => {
    // ยกเลิกการตรวจสอบ LocalStorage และใช้การ Fetch ใหม่เสมอเพื่อความปลอดภัย
    fetchUsers();
    fetchProjects();
  }, []);

  return (
    <StorageContext.Provider value={{ cache, fetchUsers, fetchProjects }}>
      {children}
    </StorageContext.Provider>
  );
}
