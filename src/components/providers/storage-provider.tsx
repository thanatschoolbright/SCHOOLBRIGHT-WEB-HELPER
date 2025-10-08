"use client";

/**
 * 📦 StorageProvider: จัดการข้อมูลใน LocalStorage และโหลดจาก API
 * ใช้ Axios สำหรับ fetch และ Sonner สำหรับ Toast
 */

import axios from "axios";
import {useEffect} from "react";
import {toast} from "sonner";

/**
 * 🎯 Interface สำหรับข้อมูลที่บันทึกใน LocalStorage
 */
interface StorageProps {
    data: unknown;
    storageName: string;
}

/**
 * 🏗️ StorageProvider: Component ที่จัดการการโหลดและบันทึกข้อมูล
 * - โหลดข้อมูลผู้ใช้และโปรเจ็กต์จาก API ถ้ายังไม่มีใน LocalStorage
 * - แสดง Toast สำหรับสถานะการโหลด
 */
export function StorageProvider({children}: React.PropsWithChildren): JSX.Element {
    /**
     * 💾 บันทึกข้อมูลลง LocalStorage และแสดง Toast
     */
    const saveToLocalStorage = ({data, storageName}: StorageProps): void => {
        localStorage.setItem(storageName || "error", JSON.stringify(data));
        toast.success(`บันทึกข้อมูล ${storageName || "error"} ลงบน Local Storage แล้ว`, {
            duration: 5000,
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
            saveToLocalStorage({data: fetchedUsers, storageName: "users"});
            toast.success("โหลดข้อมูลสำเร็จ", {id: toastId});
        } catch (error) {
            toast.error("โหลดข้อมูลล้มเหลว", {id: toastId});
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
                {limit: 50, page: 1},
                {headers: {"Content-Type": "application/json"}}
            );
            const data = response.data;
            console.info("data", data);
            saveToLocalStorage({data: data.data, storageName: "projects"});
            toast.success("โหลดข้อมูลสำเร็จ", {id: toastId});
        } catch (error) {
            toast.error("โหลดข้อมูลล้มเหลว", {id: toastId});
        }
    };

    /**
     * 🔍 ตรวจสอบว่ามีข้อมูลใน LocalStorage หรือไม่
     */
    const hasStorageData = (storageName: string): boolean => {
        const raw = localStorage.getItem(storageName);
        return !!raw;
    };

    /**
     * ⚙️ โหลดข้อมูลเริ่มต้นเมื่อ Component Mount
     */
    useEffect(() => {
        if (!hasStorageData("users")) {
            fetchUsers();
        }

        if (!hasStorageData("projects")) {
            fetchProjects();
        }
    }, []);

    return <>{children}</>;
}
