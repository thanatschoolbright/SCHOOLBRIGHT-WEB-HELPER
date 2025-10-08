"use client";
/**
 * 📦 หน้าแสดงรายการโปรเจ็กต์จาก Backlog (API Key Mode)
 * ใช้ Ant Design ทั้งหมด พร้อมโทนมินิมอล และรองรับ Dark Mode
 */

import React, {useEffect, useState} from "react";
import {Space} from "antd";
import axios, {AxiosError} from "axios";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import ProjectsTable from "@components/backlog/projects-table";
import SpaceInputCard from "@components/backlog/space-input-card";
import type {BacklogProject} from "@components/backlog/types";
import type {TableProps} from "antd/es/table";

/**
 * 🎯 คอมโพเนนต์หลักของหน้า Backlog Report
 * - โหลดรายการโปรเจ็กต์จาก API ภายใน
 * - มีระบบกรองและจัดการโปรเจ็กต์
 * - ใช้ Toast แสดงสถานะ API และ Skeleton Loading
 */
export default function Page(): JSX.Element {
    const router = useRouter();

    //** 🌐 State สำหรับจัดการข้อมูลและสถานะ
    const [space, setSpace] = useState<string>("jabjai"); // Space ของ Backlog
    const [loading, setLoading] = useState<boolean>(false); // สถานะโหลดข้อมูล
    const [projects, setProjects] = useState<BacklogProject[]>([]); // โปรเจ็กต์ทั้งหมด
    const [filteredProjects, setFilteredProjects] = useState<BacklogProject[]>([]); // โปรเจ็กต์ที่ผ่านการกรองแล้ว
    const [filteredStatus, setFilteredStatus] = useState<string[]>(["active"]); // สถานะที่กรองไว้

    /**
     * 🚀 โหลดโปรเจ็กต์จาก API ฝั่งเซิร์ฟเวอร์ (ใช้ API Key Mode)
     * ใช้ Toast แสดงสถานะการโหลด
     */
    const fetchProjects = async (): Promise<void> => {
        if (!space.trim()) {
            toast.warning("กรุณากรอก Space (โดเมนย่อย)");
            return;
        }

        const toastId = toast.loading("กำลังโหลดรายการโปรเจ็กต์จาก Backlog...");
        setLoading(true);

        try {
            const {data} = await axios.get<{ data: BacklogProject[] }>(
                "/api/v1/backlog/projects",
                {params: {space}}
            );

            const projectList = data?.data ?? [];
            setProjects(projectList);
            setFilteredProjects(projectList); // ตั้งค่าเริ่มต้นของตาราง
            toast.success("โหลดรายการโปรเจ็กต์สำเร็จ", {id: toastId});
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            toast.error(error.response?.data?.message ?? "โหลดโปรเจ็กต์ไม่สำเร็จ", {
                id: toastId,
            });
        } finally {
            setLoading(false);
        }
    };

    //** ⚙️ โหลดอัตโนมัติเมื่อเข้าเพจ
    useEffect(() => {
        fetchProjects();
    }, []);

    /**
     * 🧩 จัดการเมื่อคลิกแถวหรือปุ่มจัดการ
     * นำทางไปหน้ารายละเอียด Issue
     */
    const handleRowClick = (record: BacklogProject) => {
        router.push(
            `/backlogs/projects/${record.id}/issues?space=${encodeURIComponent(
                space
            )}&name=${encodeURIComponent(record.name)}`
        );
    };

    /**
     * 📊 จัดการการเปลี่ยนแปลงในตาราง (กรองและจัดเรียง)
     */
    const onTableChange: TableProps<BacklogProject>["onChange"] = (_, filters) => {
        let result = [...projects];

        // ✅ กรองตามชื่อโปรเจ็กต์
        if (filters.name && (filters.name as string[]).length > 0) {
            const names = filters.name as string[];
            result = result.filter((p) =>
                names.some((n) => p.name.toLowerCase().includes(n.toLowerCase()))
            );
        }

        // ✅ กรองตามสถานะ
        if (filters.archived && (filters.archived as string[]).length > 0) {
            const status = filters.archived as string[];
            result = result.filter((p) =>
                status.includes(p.archived ? "archived" : "active")
            );
            setFilteredStatus(status);
        }

        setFilteredProjects(result);
    };

    return (
        <DashboardLayout>
            <Space direction="vertical" size={16} style={{width: "100%", marginTop: 16}}>
                {/* 🔸 การ์ดกรอก Space และโหลดข้อมูล */}
                <SpaceInputCard
                    space={space}
                    setSpace={setSpace}
                    onLoad={fetchProjects}
                    loading={loading}
                />

                {/* 🔹 ตารางแสดงรายการโปรเจ็กต์ */}
                <ProjectsTable
                    loading={loading}
                    data={projects}
                    filteredData={filteredProjects}
                    filteredStatus={filteredStatus}
                    onRowClick={handleRowClick}
                    onTableChange={onTableChange}
                />
            </Space>
        </DashboardLayout>
    );
}
