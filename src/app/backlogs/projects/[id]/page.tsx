"use client";

/**
 * 📦 หน้าแสดงรายละเอียดโปรเจ็กต์จาก Backlog
 * ใช้ Ant Design สำหรับ UI minimal โทนขาวคล้าย Apple Web, รองรับ Dark Mode
 */

import React, {useEffect, useState} from "react";
import {Button, Card, Descriptions, Space, Statistic, theme} from "antd";
import axios, {AxiosError} from "axios";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {toast} from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";

/**
 * 🎯 Interface สำหรับข้อมูลโปรเจ็กต์
 */
interface Project {
    id: number;
    projectKey: string;
    name: string;
    archived: boolean;
    description?: string;
    lead?: string;
    created: string;
    updated: string;
}

/**
 * 📦 ProjectDetailPage: Component หลักสำหรับแสดงรายละเอียดโปรเจ็กต์
 * - โหลดข้อมูลโปรเจ็กต์จาก API
 * - แสดงสถิติและรายละเอียด
 * - ใช้ Skeleton Loading และ Toast สำหรับสถานะ API
 */
export default function ProjectDetailPage(): JSX.Element {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const {token} = theme.useToken();

    const projectId = params.id as string;
    const space = searchParams.get("space") || "jabjai";
    const name = searchParams.get("name") || "";

    //** 🌐 State สำหรับจัดการข้อมูลและสถานะ
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    /**
     * 🚀 โหลดข้อมูลโปรเจ็กต์จาก API
     * ใช้ Toast แสดงสถานะการโหลด
     */
    const fetchProject = async (): Promise<void> => {
        const toastId = toast.loading("กำลังโหลดข้อมูลโปรเจ็กต์...");
        setLoading(true);

        try {
            const {data} = await axios.get<{ data: Project }>(
                `/api/v1/backlog/projects/${projectId}`,
                {params: {space}}
            );

            const projectData = data?.data;
            if (projectData) {
                setProject(projectData);
                toast.success("โหลดข้อมูลโปรเจ็กต์สำเร็จ", {id: toastId});
            } else {
                toast.error("ไม่พบข้อมูลโปรเจ็กต์", {id: toastId});
            }
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
        if (projectId) {
            fetchProject();
        }
    }, [projectId, space]);

    return (
        <DashboardLayout>
            <Space direction="vertical" size={16} style={{width: "100%", marginTop: 16}}>
                {/* 🔸 Header */}
                <Card size="small" style={{padding: 16}}>
                    <Space direction="vertical" size={8} style={{width: "100%"}}>
                        <div>
                            <h2 style={{margin: 0, color: token.colorPrimary}}>
                                รายละเอียดโปรเจ็กต์: {name}
                            </h2>
                            <p style={{margin: 0, color: token.colorTextSecondary}}>
                                Space: {space} | Project ID: {projectId}
                            </p>
                        </div>
                        <Space>
                            <Button onClick={fetchProject} loading={loading}>
                                รีโหลด
                            </Button>
                            <Button
                                onClick={() =>
                                    router.push(
                                        `/backlogs/projects/${projectId}/issues?space=${encodeURIComponent(
                                            space
                                        )}&name=${encodeURIComponent(name)}`
                                    )
                                }
                            >
                                ดู Issues
                            </Button>
                        </Space>
                    </Space>
                </Card>

                {/* 🔹 รายละเอียดโปรเจ็กต์ */}
                <Card size="small" title="ข้อมูลโปรเจ็กต์" loading={loading}>
                    {project && (
                        <Descriptions column={2} bordered>
                            <Descriptions.Item label="Project Key">
                                {project.projectKey}
                            </Descriptions.Item>
                            <Descriptions.Item label="ชื่อโปรเจ็กต์">
                                {project.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="สถานะ">
                                {project.archived ? "ปิดใช้งาน" : "ใช้งาน"}
                            </Descriptions.Item>
                            <Descriptions.Item label="ผู้นำโปรเจ็กต์">
                                {project.lead || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="คำอธิบาย" span={2}>
                                {project.description || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="วันที่สร้าง">
                                {new Date(project.created).toLocaleDateString("th-TH")}
                            </Descriptions.Item>
                            <Descriptions.Item label="วันที่อัปเดต">
                                {new Date(project.updated).toLocaleDateString("th-TH")}
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                </Card>

                {/* 🔹 สถิติ */}
                <Card size="small" title="สถิติโปรเจ็กต์">
                    <Space direction="horizontal" size={24}>
                        <Statistic
                            title="สถานะ"
                            value={project?.archived ? "ปิดใช้งาน" : "ใช้งาน"}
                            valueStyle={{
                                color: project?.archived ? token.colorError : token.colorSuccess,
                            }}
                        />
                        <Statistic
                            title="วันที่สร้าง"
                            value={project ? new Date(project.created).toLocaleDateString("th-TH") : "-"}
                        />
                        <Statistic
                            title="วันที่อัปเดต"
                            value={project ? new Date(project.updated).toLocaleDateString("th-TH") : "-"}
                        />
                    </Space>
                </Card>
            </Space>
        </DashboardLayout>
    );
}
