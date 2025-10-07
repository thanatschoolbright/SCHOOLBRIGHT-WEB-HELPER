"use client";
/**
 * 📦 หน้าแสดงรายการโปรเจ็กต์จาก Backlog (API Key Mode)
 * ใช้ Ant Design ทั้งหมด พร้อมโทนมินิมอล
 */

import React, {useEffect, useState} from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import {Button, Card, Input, Space, Table, type TableProps, Tag, Typography,} from "antd";
import type {ColumnsType} from "antd/es/table";
import {SettingOutlined} from "@ant-design/icons";
import axios, {AxiosError} from "axios";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

//** 🔹 กำหนด Type ของ Project ให้ Type-safe */
interface Project {
    id: number;
    projectKey: string;
    name: string;
    archived?: boolean;
}

/**
 * 🎯 คอมโพเนนต์หลักของหน้า Backlog Page
 * - โหลดรายการโปรเจ็กต์จาก API ภายใน
 * - มีระบบกรอง (Filter/Search)
 * - มี Skeleton และ Toast แจ้งสถานะ
 */
export default function Page(): JSX.Element {
    const router = useRouter();

    //** 🌐 State สำหรับจัดการข้อมูลและสถานะ */
    const [space, setSpace] = useState<string>("jabjai"); // Space ของ Backlog
    const [loading, setLoading] = useState<boolean>(false); // สถานะโหลดข้อมูล
    const [projects, setProjects] = useState<Project[]>([]); // โปรเจ็กต์ทั้งหมด
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]); // โปรเจ็กต์ที่ผ่านการกรองแล้ว
    const [filteredStatus, setFilteredStatus] = useState<string[]>(["active"]); // สถานะที่กรองไว้
    const [tableKey, setTableKey] = useState<number>(Date.now()); // สำหรับ refresh Table เมื่อข้อมูลเปลี่ยน

    //** 🚀 โหลดโปรเจ็กต์จาก API ฝั่งเซิร์ฟเวอร์ (ใช้ API Key Mode) */
    const fetchProjects = async (): Promise<void> => {
        if (!space.trim()) {
            toast.warning("กรุณากรอก Space (โดเมนย่อย)");
            return;
        }

        const toastId = toast.loading("กำลังโหลดรายการโปรเจ็กต์จาก Backlog...");
        setLoading(true);

        try {
            const {data} = await axios.get<{ data: Project[] }>(
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

    //** ⚙️ โหลดอัตโนมัติเมื่อเข้าเพจ */
    useEffect(() => {
        fetchProjects();
    }, []);

    //** 🔄 เมื่อข้อมูลเปลี่ยน ให้ refresh key เพื่อรีโหลดตาราง */
    useEffect(() => {
        if (projects.length > 0) setTableKey(Date.now());
    }, [projects]);

    //** 📋 กำหนดคอลัมน์ของตาราง */
    const columns: ColumnsType<Project> = [
        {
            title: "คีย์โปรเจ็กต์",
            dataIndex: "projectKey",
            key: "projectKey",
            width: 140,
            sorter: (a, b) => a.projectKey.localeCompare(b.projectKey),
        },
        {
            title: "ชื่อโปรเจ็กต์",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),

            // ✅ แสดง Filter ให้ค้นหาโปรเจ็กต์ตามชื่อ
            filters:
                projects.length > 0
                    ? projects.map((p) => ({text: p.name, value: p.name}))
                    : undefined,
            filterSearch: true,

            filteredValue: null,

            // ✅ ฟังก์ชันกรองชื่อโปรเจ็กต์ (ไม่สนตัวพิมพ์)
            onFilter: (value, record) =>
                record.name.toLowerCase().includes((value as string).toLowerCase()),
        },
        {
            title: "สถานะ",
            dataIndex: "archived",
            key: "archived",
            width: 120,

            // ✅ Filter สถานะใช้งาน / ปิดใช้งาน
            filters: [
                {text: "ใช้งาน", value: "active"},
                {text: "ปิดใช้งาน", value: "archived"},
            ],
            filteredValue: filteredStatus,

            // ✅ Logic การกรองสถานะ
            onFilter: (value, record) =>
                value === "active" ? !record.archived : !!record.archived,

            // ✅ แสดงสีแท็กตามสถานะ
            render: (v?: boolean) =>
                v ? (
                    <Tag color="default">ปิดใช้งาน</Tag>
                ) : (
                    <Tag color="green">ใช้งาน</Tag>
                ),
        },
        {
            title: "จัดการ",
            key: "manage",
            width: 100,
            render: (_, record) => (
                <>
                    {/* ปุ่มจัดการโปรเจ็กต์ */}
                    <Button
                        type="link"
                        icon={<SettingOutlined/>}
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                                `/backlogs/projects/${record.id}/issues?space=${encodeURIComponent(
                                    space
                                )}&name=${encodeURIComponent(record.name)}`
                            );
                        }}
                    />
                </>
            ),
        },
    ];

    //** 🧩 เมื่อมีการเปลี่ยน Filter หรือ Pagination ของ Table */
    const onTableChange: TableProps<Project>["onChange"] = (_, filters) => {
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
                {/* 🔸 ส่วนกรอก Space และปุ่มโหลดข้อมูล */}
                <Card size="small" style={{padding: 16}} loading={loading}>
                    <Space direction="vertical" style={{width: "100%"}} size={8}>
                        <Typography.Text strong>แบ็กล็อก (คีย์ API)</Typography.Text>
                        <Typography.Text type="secondary">
                            กรอก Space (subdomain) เช่น <b>schoolbright</b> (ค่าเริ่มต้น:
                            jabjai) แล้วกดปุ่มเพื่อโหลดรายการโปรเจ็กต์
                        </Typography.Text>

                        {/* 🧭 ปุ่มควบคุมการโหลด */}
                        <Space>
                            <Input
                                placeholder="เช่น jabjai"
                                value={space}
                                onChange={(e) => setSpace(e.target.value.trim())}
                                style={{width: 260}}
                            />
                            <Button
                                type="primary"
                                onClick={fetchProjects}
                                loading={loading}
                                disabled={!space.trim()}
                            >
                                โหลดโปรเจ็กต์
                            </Button>
                        </Space>
                    </Space>
                </Card>

                {/* 🔹 ตารางแสดงรายการโปรเจ็กต์ */}
                <Card size="small" title="รายการโปรเจ็กต์บน Backlog" loading={loading}>
                    <Table<Project>
                        key={tableKey}
                        columns={columns}
                        dataSource={filteredProjects}
                        rowKey={(r) => String(r.id)}
                        pagination={{pageSize: 50, showSizeChanger: true}}
                        onRow={(record) => ({
                            // เมื่อคลิกแถว จะไปหน้ารายละเอียด Issue
                            onClick: () =>
                                router.push(
                                    `/backlogs/projects/${record.id}/issues?space=${encodeURIComponent(
                                        space
                                    )}&name=${encodeURIComponent(record.name)}`
                                ),
                        })}
                        onChange={onTableChange}
                        style={{cursor: "pointer"}}
                    />
                </Card>
            </Space>
        </DashboardLayout>
    );
}
