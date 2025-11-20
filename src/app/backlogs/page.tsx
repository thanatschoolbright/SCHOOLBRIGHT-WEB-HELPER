"use client";

/**
 * 📦 หน้า Overview ของ Backlogs
 * ใช้ Ant Design สำหรับ UI minimal โทนขาวคล้าย Apple Web, รองรับ Dark Mode
 */

import React, {useEffect, useState} from "react";
import {Button, Card, Space, Statistic, theme} from "antd";
import axios, {AxiosError} from "axios";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { ProjectOutlined } from "@ant-design/icons";

/**
 * 🎯 Interface สำหรับสถิติ Backlogs
 */
interface BacklogStats {
    totalProjects: number;
    activeProjects: number;
    archivedProjects: number;
    totalIssues: number;
}

/**
 * 📦 BacklogsOverviewPage: Component หลักสำหรับแสดง Overview ของ Backlogs
 * - โหลดสถิติจาก API
 * - แสดงสถิติและปุ่มนำทาง
 * - ใช้ Skeleton Loading และ Toast สำหรับสถานะ API
 */
export default function BacklogsOverviewPage(): JSX.Element {
    const router = useRouter();
    const {token} = theme.useToken();

    //** 🌐 State สำหรับจัดการข้อมูลและสถานะ
    const [stats, setStats] = useState<BacklogStats | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    /**
     * 🚀 โหลดสถิติ Backlogs จาก API
     * ใช้ Toast แสดงสถานะการโหลด
     */
    const fetchStats = async (): Promise<void> => {
        const toastId = toast.loading("กำลังโหลดสถิติ Backlogs...");
        setLoading(true);

        try {
            const {data} = await axios.get<{ data: BacklogStats }>("/api/v1/backlog/stats");

            const statsData = data?.data;
            if (statsData) {
                setStats(statsData);
                toast.success("โหลดสถิติสำเร็จ", {id: toastId});
            } else {
                toast.error("ไม่พบข้อมูลสถิติ", {id: toastId});
            }
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            toast.error(error.response?.data?.message ?? "โหลดสถิติไม่สำเร็จ", {
                id: toastId,
            });
        } finally {
            setLoading(false);
        }
    };

    //** ⚙️ โหลดอัตโนมัติเมื่อเข้าเพจ
    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <DashboardLayout>
            <HeaderBar title="Backlogs" subTitle="ภาพรวม backlog และการกระทำด่วน" icon={<ProjectOutlined />} color="none" />
            <Space direction="vertical" size={16} style={{width: "100%", marginTop: 16}}>
                {/* 🔸 Header */}
                <Card size="small" style={{padding: 16}}>
                    <Space direction="vertical" size={8} style={{width: "100%"}}>
                        <div>
                            <h2 style={{margin: 0, color: token.colorPrimary}}>
                                Backlogs Overview
                            </h2>
                            <p style={{margin: 0, color: token.colorTextSecondary}}>
                                สรุปข้อมูลโปรเจ็กต์และ Issues ในระบบ Backlog
                            </p>
                        </div>
                        <Space>
                            <Button onClick={fetchStats} loading={loading}>
                                รีโหลด
                            </Button>
                            <Button onClick={() => router.push("/backlogs/report")}>
                                ดูรายงาน
                            </Button>
                            <Button onClick={() => router.push("/backlogs/projects")}>
                                จัดการโปรเจ็กต์
                            </Button>
                        </Space>
                    </Space>
                </Card>

                {/* 🔹 สถิติ */}
                <Space direction="horizontal" size={16} wrap>
                    <Card size="small" title="โปรเจ็กต์ทั้งหมด" loading={loading}>
                        <Statistic
                            value={stats?.totalProjects ?? 0}
                            valueStyle={{color: token.colorPrimary}}
                        />
                    </Card>
                    <Card size="small" title="โปรเจ็กต์ใช้งาน" loading={loading}>
                        <Statistic
                            value={stats?.activeProjects ?? 0}
                            valueStyle={{color: token.colorSuccess}}
                        />
                    </Card>
                    <Card size="small" title="โปรเจ็กต์ปิดใช้งาน" loading={loading}>
                        <Statistic
                            value={stats?.archivedProjects ?? 0}
                            valueStyle={{color: token.colorTextDisabled}}
                        />
                    </Card>
                    <Card size="small" title="Issues ทั้งหมด" loading={loading}>
                        <Statistic
                            value={stats?.totalIssues ?? 0}
                            valueStyle={{color: token.colorWarning}}
                        />
                    </Card>
                </Space>

                {/* 🔹 Quick Actions */}
                <Card size="small" title="การดำเนินการด่วน">
                    <Space direction="vertical" size={8}>
                        <Button
                            type="primary"
                            onClick={() => router.push("/backlogs/report")}
                            block
                        >
                            📊 ดูรายงานโปรเจ็กต์
                        </Button>
                        <Button
                            onClick={() => router.push("/backlogs/projects")}
                            block
                        >
                            📁 จัดการโปรเจ็กต์
                        </Button>
                        <Button
                            onClick={() => router.push("/backlogs/projects/1/issues")}
                            block
                        >
                            🐛 จัดการ Issues
                        </Button>
                    </Space>
                </Card>
            </Space>
        </DashboardLayout>
    );
}
