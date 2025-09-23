"use client";
import { UserProfile } from "@stores/type";
import axios from "axios";
import { useEffect } from "react";
import { toast } from "sonner";

interface Storage {
  data: any;
  stroageName: string;
}
export function StorageProvider({ children }: React.PropsWithChildren) {
  //* การทำงาน: บันทึกข้อมูลผู้ใช้ลง LocalStorage
  const stroageToLocalStorage = ({ data, stroageName }: Storage) => {
    localStorage.setItem(stroageName || "error", JSON.stringify(data));
    toast.success(
      `บันทึกข้อมูล ${stroageName || "error"} ลงบน Local Storage แล้ว`,
      {
        duration: 5000,
      }
    );
  };

  //* การทำงาน: ดึงข้อมูลผู้ใช้จาก API พร้อมแสดง Toast Loading
  const fetchUsers = async () => {
    // แสดง Toast Loading ขณะรอ Axios
    const toastId = toast.loading("กำลังโหลดข้อมูลผู้ใช้งาน...");

    try {
      const response = await axios.get("/api/v1/admin/user/");
      const fetchedUsers = response?.data?.data?.data || [];

      stroageToLocalStorage({ data: fetchedUsers, stroageName: "users" });

      // อัปเดต Toast จาก loading → success
      toast.success("โหลดข้อมูลสำเร็จ", {
        id: toastId,
        duration: 3000,
      });
    } catch (error) {
      // อัปเดต Toast จาก loading → error
      toast.error("โหลดข้อมูลล้มเหลว", {
        id: toastId,
        duration: 5000,
      });
    }
  };

  const fetchProjects = async () => {
    // แสดง Toast Loading ขณะรอ Axios
    const toastId = toast.loading("กำลังโหลดข้อมูลโปรเจ็ค...");

    try {
      const response = await axios.post(
        "/api/v1/timesheet/project/read/",
        { limit: 50, page: 1 },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = response.data;

      console.info("data", data);

      stroageToLocalStorage({ data: data.data, stroageName: "projects" });

      // อัปเดต Toast จาก loading → success
      toast.success("โหลดข้อมูลสำเร็จ", {
        id: toastId,
        duration: 3000,
      });
    } catch (error) {
      // อัปเดต Toast จาก loading → error
      toast.error("โหลดข้อมูลล้มเหลว", {
        id: toastId,
        duration: 5000,
      });
    }
  };

  // const fetchSubProjects = async () => {
  //   // แสดง Toast Loading ขณะรอ Axios
  //   const toastId = toast.loading("กำลังโหลดข้อมูลโปรเจ็ค...");

  //   try {
  //     const response = await fetch(
  //       "/api/v1/timesheet/project/sub-project/read/",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           limit: 500,
  //           page: 1,
  //           project_id: Number(project_id),
  //         }),
  //       }
  //     );
  //     const data = response.data;

  //     console.info("data", data);

  //     stroageToLocalStorage({ data: data.data, stroageName: "projects" });

  //     // อัปเดต Toast จาก loading → success
  //     toast.success("โหลดข้อมูลสำเร็จ", {
  //       id: toastId,
  //       duration: 3000,
  //     });
  //   } catch (error) {
  //     // อัปเดต Toast จาก loading → error
  //     toast.error("โหลดข้อมูลล้มเหลว", {
  //       id: toastId,
  //       duration: 5000,
  //     });
  //   }
  // };

  //* การทำงาน: ตรวจสอบว่ามี LocalStorage "users" อยู่แล้วหรือยัง
  const RULES_VALIDATION_NOT_DUPLICATE_STORAGE = (storageName: string) => {
    const raw = localStorage.getItem(storageName);
    return !!raw;
  };

  //* useEffect: ถ้าไม่มีข้อมูลใน LocalStorage → Fetch จาก API
  useEffect(() => {
    if (!RULES_VALIDATION_NOT_DUPLICATE_STORAGE("users")) {
      fetchUsers();
    }

    if (!RULES_VALIDATION_NOT_DUPLICATE_STORAGE("projects")) {
      fetchProjects();
    }
  }, []);

  return <>{children}</>;
}
