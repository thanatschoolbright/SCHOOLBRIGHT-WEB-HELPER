"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";
import {toast} from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import {TableActions} from "@components/button/table-actions";
import {UsageCard} from "@components/card/usage-card";
import {DeleteConfirmationModal} from "@components/modal/delete-confirmation-modal";
import {DetailModal} from "@components/timesheet/detail-modal";
import {WeeklySummary} from "@components/timesheet/weekly-summary";
import {useDailySummary, useTimesheetEntries, useTopUsage, useWeeklySummary} from "@/hooks/use-timesheet-data";
import {useAppSelector} from "@stores/store";

import type {InputRef, TableProps} from "antd";
import {Button, Card, Form, Input, Space, Table, Tag, Typography} from "antd";
import type {ColumnsType, ColumnType} from "antd/es/table";
import {CopyOutlined, EditOutlined, EyeOutlined, SearchOutlined} from "@ant-design/icons";

import {STATUS_OPTIONS} from "@constants/timesheet.constants";
import type {Project, SubProject} from "@stores/type";
import {CreateModalForm} from "./create";
import {MonthlyRankBoard, MonthlyRankBoardRef} from "./monthly-rank-board";

dayjs.extend(isBetween);

export interface TimesheetEntry {
    id: number;
    date: string;
    project_id: number;
    project_name: string;
    feature_id?: number | null;
    feature_name?: string | null;
    status: string;
    hours: number;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
}

type SearchableColumnKey =
    | "date"
    | "project_name"
    | "feature_name"
    | "status"
    | "hours"
    | "description";

type TableColumn = ColumnType<TimesheetEntry> & {
    key: keyof TimesheetEntry | string;
};

type FormMode = "create" | "edit" | "copy";
type ModalType = "form" | "detail" | "delete" | null;

const DATE_FORMAT = "DD/MM/YYYY";
const DAILY_TARGET_HOURS = 8;

const statusColorMap: Record<string, string> = {
    DONE: "green",
    IN_PROGRESS: "orange",
    REVIEW: "blue",
    CANCELLED: "red",
    DRAFT: "default",
};

export default function Page() {
    const i18n = i18next;
    const [form] = Form.useForm();
    const isMountedRef = useRef(true);
    const rankBoardRef = useRef<MonthlyRankBoardRef>(null);

    //** ดึงข้อมูล Admin ID จาก Store */
    const authState = useAppSelector((state) => state.callAdminLogin);
    const adminId = useMemo(
        () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
        [authState?.response?.data?.user_data?.admin_id]
    );

    //** State จัดการข้อมูลและ UI */
    const [projects, setProjects] = useState<Project[]>([]);
    const [subProjects, setSubProjects] = useState<SubProject[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [formMode, setFormMode] = useState<FormMode>("create");
    const [activeRecord, setActiveRecord] = useState<TimesheetEntry | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);


    //** ใช้ Custom Hooks สำหรับจัดการข้อมูล */
    const {
        entries,
        loading: tableLoading,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalItems,
        refetch: refetchEntries,
    } = useTimesheetEntries(adminId);

    const dailySummary = useDailySummary(entries);
    const weeklySummary = useWeeklySummary(dailySummary);
    const {topProjectUsage, topFeatureUsage} = useTopUsage(entries);

    const searchInputRefs = useRef<
        Partial<Record<SearchableColumnKey, InputRef | null>>
    >({});

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    //** ปิด modal และรีเซ็ตค่า */
    const closeModal = useCallback(() => {
        setModalType(null);
        setActiveRecord(null);
        setFormMode("create");
        form.resetFields();
    }, [form]);

    //** โหลดรายการโปรเจ็กต์หลัก */
    const fetchProjects = useCallback(async () => {
        const TOAST_ID = "fetch-projects";
        try {
            toast.loading("กำลังโหลดรายการโปรเจ็ค...", {id: TOAST_ID});

            const response = await axios.post("/api/v1/timesheet/project/read/", {
                limit: 100,
                page: 1,
            });

            if (!isMountedRef.current) return;
            setProjects(response.data?.data ?? []);

            toast.success("โหลดรายการโปรเจ็คสำเร็จ", {id: TOAST_ID});
        } catch (error: any) {
            console.error("fetchProjects", error);
            toast.error("โหลดรายการโปรเจ็คไม่สำเร็จ", {
                id: TOAST_ID,
                description: error?.message ?? "Unexpected error",
            });
        }
    }, []);

    //** โหลดรายการโปรเจ็กต์ย่อย */
    const fetchSubProjectOptions = useCallback(async (projectId: number) => {
        if (!projectId) {
            setSubProjects([]);
            return [];
        }

        const TOAST_ID = "fetch-sub-projects";
        try {
            toast.loading("กำลังโหลดรายการฟีเจอร์...", {id: TOAST_ID});

            const response = await axios.post(
                "/api/v1/timesheet/project/sub-project/read/",
                {
                    limit: 100,
                    page: 1,
                    project_id: Number(projectId),
                }
            );

            const items = response.data?.data?.items ?? [];
            if (isMountedRef.current) {
                setSubProjects(items);
            }

            toast.success("โหลดรายการฟีเจอร์สำเร็จ", {id: TOAST_ID});
            return items;
        } catch (error: any) {
            console.error("fetchSubProjectOptions", error);
            if (isMountedRef.current) {
                setSubProjects([]);
            }
            toast.error("โหลดรายการฟีเจอร์ไม่สำเร็จ", {
                id: TOAST_ID,
                description: error?.message ?? "Unexpected error",
            });
            return [];
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    //** เปิดฟอร์มโหมดสร้างใหม่ */
    const openCreateForm = useCallback(() => {
        setFormMode("create");
        setActiveRecord(null);
        setSubProjects([]);
        form.setFieldsValue({
            project_id: undefined,
            sub_project_id: undefined,
            description: "",
            work_hour: undefined,
            status: undefined,
            date: dayjs(),
        });
        setModalType("form");
    }, [form]);

    //** เปิดฟอร์มโหมดแก้ไข */
    const openEditForm = useCallback(
        async (record: TimesheetEntry) => {
            setFormMode("edit");
            setActiveRecord(record);
            await fetchSubProjectOptions(Number(record.project_id));
            if (!isMountedRef.current) return;

            form.setFieldsValue({
                project_id: Number(record.project_id),
                sub_project_id: record.feature_id ? Number(record.feature_id) : undefined,
                description: record.description ?? "",
                work_hour: Number(record.hours) || undefined,
                status: record.status,
                date: dayjs(record.date),
            });
            setModalType("form");
        },
        [fetchSubProjectOptions, form]
    );

    //** เปิดฟอร์มโหมดคัดลอก */
    const openCopyForm = useCallback(
        async (record: TimesheetEntry) => {
            setFormMode("copy");
            setActiveRecord(null);
            await fetchSubProjectOptions(Number(record.project_id));
            if (!isMountedRef.current) return;

            form.setFieldsValue({
                project_id: Number(record.project_id),
                sub_project_id: record.feature_id ? Number(record.feature_id) : undefined,
                description: record.description ?? "",
                work_hour: Number(record.hours) || undefined,
                status: record.status,
                date: dayjs(),
            });
            setModalType("form");
        },
        [fetchSubProjectOptions, form]
    );

    //** เปิด Modal รายละเอียด */
    const openDetailModal = useCallback((record: TimesheetEntry) => {
        setActiveRecord(record);
        setModalType("detail");
    }, []);

    //** เปิด Modal ยืนยันการลบ */
    const openDeleteModal = useCallback(() => {
        setModalType("delete");
    }, []);

    //** บันทึกข้อมูลฟอร์ม */
    const handleSubmitForm = useCallback(async () => {
        const TOAST_ID = "submit-form";
        try {
            const values = await form.validateFields();
            setActionLoading(true);

            toast.loading("กำลังบันทึกข้อมูล...", {id: TOAST_ID});

            const payload = {
                id: formMode === "edit" ? activeRecord?.id : undefined,
                project_id: values.project_id,
                sub_project_id: values.sub_project_id,
                description: values.description ?? "",
                work_hour: values.work_hour,
                status: values.status,
                date: values.date ? dayjs(values.date).toDate() : undefined,
                by: adminId,
            };

            await axios.post("/api/v1/timesheet/entry/insert/", payload, {
                headers: {"Content-Type": "application/json"},
            });

            toast.success("บันทึกข้อมูลสำเร็จ", {id: TOAST_ID});

            if (!isMountedRef.current) return;
            closeModal();
            refetchEntries();
            rankBoardRef.current?.refetch();
        } catch (error: any) {
            if (error?.errorFields) return;
            console.error("handleSubmitForm", error);
            toast.error("บันทึกข้อมูลล้มเหลว", {
                id: TOAST_ID,
                description: error?.message ?? "Unexpected error",
            });
        } finally {
            if (isMountedRef.current) {
                setActionLoading(false);
            }
        }
    }, [activeRecord?.id, adminId, closeModal, refetchEntries, form, formMode]);

    //** ลบหลายรายการ */
    const handleBulkDelete = useCallback(async () => {
        if (!selectedRowKeys.length) return;

        const TOAST_ID = "bulk-delete";
        try {
            setActionLoading(true);
            toast.loading("กำลังลบรายการ...", {id: TOAST_ID});

            await axios.post(
                "/api/v1/timesheet/entry/delete/",
                {
                    ids: selectedRowKeys.map((key) => Number(key)),
                    by: adminId,
                },
                {headers: {"Content-Type": "application/json"}}
            );

            toast.success("ลบรายการสำเร็จ", {id: TOAST_ID});

            if (isMountedRef.current) {
                setSelectedRowKeys([]);
                closeModal();
                refetchEntries();
                rankBoardRef.current?.refetch();
            }
        } catch (error: any) {
            console.error("handleBulkDelete", error);
            toast.error("ลบรายการล้มเหลว", {
                id: TOAST_ID,
                description: error?.message ?? "Unexpected error",
            });
        } finally {
            if (isMountedRef.current) {
                setActionLoading(false);
            }
        }
    }, [adminId, closeModal, refetchEntries, selectedRowKeys]);

    //** ตั้งค่าการค้นหาในคอลัมน์ */
    const getColumnSearchProps = useCallback(
        (dataIndex: SearchableColumnKey, title: string): TableColumn => ({
            key: dataIndex,
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => {
                const value = (selectedKeys[0] as string | undefined) ?? "";

                return (
                    <div style={{padding: 12}} onKeyDown={(event) => event.stopPropagation()}>
                        <Input
                            ref={(node) => {
                                searchInputRefs.current[dataIndex] = node;
                            }}
                            placeholder={`ค้นหา ${title}`}
                            value={value}
                            onChange={(event) => {
                                const {value: inputValue} = event.target;
                                setSelectedKeys(inputValue ? [inputValue] : []);
                            }}
                            onPressEnter={() => confirm()}
                            style={{marginBottom: 8, display: "block"}}
                        />
                        <Space>
                            <Button
                                type="primary"
                                icon={<SearchOutlined/>}
                                size="small"
                                onClick={() => confirm()}
                            >
                                ค้นหา
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    clearFilters?.();
                                    confirm({closeDropdown: true});
                                }}
                            >
                                รีเซ็ต
                            </Button>
                        </Space>
                    </div>
                );
            },
            filterIcon: (filtered) => (
                <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>
            ),
            onFilter: (value, record) => {
                const raw = record[dataIndex];
                if (raw === undefined || raw === null) return false;

                if (dataIndex === "date") {
                    return dayjs(raw).format(DATE_FORMAT).includes(String(value));
                }

                return String(raw).toLowerCase().includes(String(value).toLowerCase());
            },
            filterDropdownProps: {
                onOpenChange: (visible) => {
                    if (visible) {
                        setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
                    }
                },
            },
        }),
        []
    );

    //** คอลัมน์ของตาราง */
    const columns = useMemo<ColumnsType<TimesheetEntry>>(
        () => [
            {
                title: "วันที่",
                dataIndex: "date",
                width: 140,
                defaultSortOrder: "descend",
                sorter: (a, b) =>
                    dayjs(a.date).startOf("day").valueOf() -
                    dayjs(b.date).startOf("day").valueOf(),
                render: (value: string) => dayjs(value).format(DATE_FORMAT),
                ...getColumnSearchProps("date", "วันที่"),
            },
            {
                title: "ชื่อโปรเจ็ค",
                dataIndex: "project_name",
                sorter: (a, b) => a.project_name.localeCompare(b.project_name),
                render: (value: string) => value ?? "-",
                ...getColumnSearchProps("project_name", "ชื่อโปรเจ็ค"),
            },
            {
                title: "ชื่อฟีเจอร์",
                dataIndex: "feature_name",
                sorter: (a, b) => (a.feature_name ?? "").localeCompare(b.feature_name ?? ""),
                render: (value: string | null) => value || "-",
                ...getColumnSearchProps("feature_name", "ชื่อฟีเจอร์"),
            },
            {
                title: "สถานะ",
                dataIndex: "status",
                sorter: (a, b) => (a.status ?? "").localeCompare(b.status ?? ""),
                render: (value: string) => {
                    const option = STATUS_OPTIONS.find((item) => item.value === value);
                    const label = option
                        ? i18n.language === "th" ? option.label_th : option.label_en
                        : value;
                    const color = statusColorMap[value] ?? "default";
                    return <Tag color={color}>{label}</Tag>;
                },
                ...getColumnSearchProps("status", "สถานะ"),
            },
            {
                title: "ชั่วโมง",
                dataIndex: "hours",
                align: "right",
                sorter: (a, b) => Number(a.hours) - Number(b.hours),
                render: (value: number) => (
                    <Typography.Text>{Number(value) || 0}</Typography.Text>
                ),
                ...getColumnSearchProps("hours", "ชั่วโมง"),
            },
            {
                title: "คำอธิบาย",
                dataIndex: "description",
                sorter: (a, b) => (a.description ?? "").localeCompare(b.description ?? ""),
                render: (value: string | null) => value || "-",
                ...getColumnSearchProps("description", "คำอธิบาย"),
            },
            {
                title: "จัดการ",
                key: "actions",
                fixed: "right",
                width: 160,
                render: (_value, record) => (
                    <Space size="middle">
                        {/* ปุ่มดูรายละเอียด */}
                        <Button
                            type="text"
                            icon={<EyeOutlined/>}
                            onClick={() => openDetailModal(record)}
                        />
                        {/* ปุ่มแก้ไข */}
                        <Button
                            type="text"
                            icon={<EditOutlined/>}
                            onClick={() => openEditForm(record)}
                        />
                        {/* ปุ่มคัดลอก */}
                        <Button
                            type="text"
                            icon={<CopyOutlined/>}
                            onClick={() => openCopyForm(record)}
                        />
                    </Space>
                ),
            },
        ],
        [getColumnSearchProps, openCopyForm, openDetailModal, openEditForm]
    );

    const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
    };


    return (
        <PermissionLayout role={["ALL"]}>
            <DashboardLayout>
                <Space direction="vertical" size="large" style={{width: "100%"}}>
                    {/* การ์ดสรุปด้านบน */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 16,
                            flexWrap: "wrap",
                        }}
                    >
                        {/* บอร์ดอันดับรายเดือน */}
                        <MonthlyRankBoard
                            ref={rankBoardRef}
                            currentAdminId={adminId}
                            variant="wide"
                        />

                        {/* การ์ดโปรเจ็คที่ใช้เวลามากที่สุด */}
                        {topProjectUsage && (
                            <UsageCard
                                title="โปรเจ็คที่ใช้เวลามากที่สุด"
                                highlight={topProjectUsage.name}
                                hours={topProjectUsage.hours}
                                accent="#38bdf8"
                                loading={tableLoading}
                            />
                        )}

                        {/* การ์ดฟีเจอร์ที่ใช้เวลามากที่สุด */}
                        {topFeatureUsage && (
                            <UsageCard
                                title="ฟีเจอร์ที่ใช้เวลามากที่สุด"
                                highlight={topFeatureUsage.name}
                                hours={topFeatureUsage.hours}
                                accent="#fb7185"
                                loading={tableLoading}
                            />
                        )}
                    </div>

                    {/* สรุปชั่วโมงรายวัน */}
                    <WeeklySummary
                        weeklySummary={weeklySummary}
                        targetHours={DAILY_TARGET_HOURS}
                        loading={tableLoading}
                    />

                    {/* ตารางการลงเวลา */}
                    <Card
                        title="การลงเวลาทำงาน"
                        loading={tableLoading && entries.length === 0}
                        extra={
                            <TableActions
                                onRefresh={refetchEntries}
                                onAdd={openCreateForm}
                                onDelete={openDeleteModal}
                                selectedCount={selectedRowKeys.length}
                                loading={actionLoading}
                                refreshLoading={tableLoading}
                            />
                        }
                    >
                        <Table<TimesheetEntry>
                            rowKey={(record) => String(record.id)}
                            columns={columns}
                            dataSource={entries}
                            loading={tableLoading}
                            rowSelection={rowSelection}
                            pagination={{
                                current: currentPage,
                                pageSize,
                                total: totalItems,
                                onChange: (page, size) => {
                                    setCurrentPage(page);
                                    if (size && size !== pageSize) {
                                        setPageSize(size);
                                    }
                                },
                                showSizeChanger: true,
                                pageSizeOptions: [10, 20, 50, 100, 500, 1000, 5000, 10000],
                                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                            }}
                            scroll={{x: 1000}}
                        />
                    </Card>
                </Space>

                {/* Modal ฟอร์มสร้าง/แก้ไข */}
                <CreateModalForm
                    open={modalType === "form"}
                    onCancel={closeModal}
                    onSubmit={handleSubmitForm}
                    form={form}
                    projects={projects}
                    subProject={subProjects}
                    fetchSubProjects={(id) => fetchSubProjectOptions(Number(id))}
                    i18n={i18n}
                    disabled={actionLoading}
                />

                {/* Modal รายละเอียด */}
                <DetailModal
                    open={modalType === "detail" && !!activeRecord}
                    onCancel={closeModal}
                    record={activeRecord}
                />

                {/* Modal ยืนยันการลบ */}
                <DeleteConfirmationModal
                    open={modalType === "delete"}
                    onCancel={closeModal}
                    onConfirm={handleBulkDelete}
                    selectedCount={selectedRowKeys.length}
                    loading={actionLoading}
                />
            </DashboardLayout>
        </PermissionLayout>
    );
}
