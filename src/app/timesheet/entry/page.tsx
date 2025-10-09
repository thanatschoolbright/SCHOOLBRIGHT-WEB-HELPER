"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {InputRef, TableProps} from "antd";
import {Button, Card, Form, Space, Table, Tag, Typography} from "antd";
import {CopyOutlined, EditOutlined, EyeOutlined, SearchOutlined} from "@ant-design/icons";
import type {ColumnsType, ColumnType} from "antd/es/table";

import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";
import {toast} from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import {TimesheetActions} from "@components/button/timesheet-actions";
import {TimesheetStatCard} from "@components/card/timesheet-stat-card";
import {TableSearch} from "@components/input-field/table-search";
import {DeleteConfirmationModal} from "@components/modal/delete-confirmation-modal";
import {DetailModal} from "@components/timesheet/detail-modal";
import {WeeklySummary} from "@components/timesheet/weekly-summary";
import {useDailySummary, useTimesheetEntries, useTopUsage, useWeeklySummary} from "@/hooks/use-timesheet-data";
import {useAppSelector} from "@stores/store";
import {
    setActiveRecord,
    setFormMode,
    setLoading,
    setModalType,
    setProjects,
    setSelectedRowKeys,
    setSubProjects
} from "@stores/reducers/timesheet/timesheet-reducer";
import {useDispatch} from "react-redux";

import {STATUS_OPTIONS} from "@constants/timesheet.constants";
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
    const dispatch = useDispatch();
    const i18n = i18next;
    const [form] = Form.useForm();
    const isMountedRef = useRef(true);
    const rankBoardRef = useRef<MonthlyRankBoardRef>(null);

    //** ดึงข้อมูล Admin ID จาก Redux Store */
    const authState = useAppSelector((state) => state.callAdminLogin);
    const timesheetState = useAppSelector((state) => state.timesheet);

    const adminId = useMemo(
        () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
        [authState?.response?.data?.user_data?.admin_id]
    );

    //** State สำหรับการจัดการ UI */
    const [actionLoading, setActionLoading] = useState(false);
    const searchInputRefs = useRef<Partial<Record<SearchableColumnKey, InputRef | null>>>({});

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

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    //** ฟังก์ชันเรียก API สำหรับโหลดโปรเจ็กต์ */
    const GET_PROJECTS_FUNCTION = useCallback(async () => {
        const TOAST_ID = "fetch-projects";
        try {
            toast.loading("กำลังโหลดรายการโปรเจ็ค...", {id: TOAST_ID});
            dispatch(setLoading(true));

            const response = await axios.post("/api/v1/timesheet/project/read/", {
                limit: 100,
                page: 1,
            });

            if (!isMountedRef.current) return;
            dispatch(setProjects(response.data?.data ?? []));
            toast.success("โหลดรายการโปรเจ็คสำเร็จ", {id: TOAST_ID});
        } catch (error: any) {
            console.error("GET_PROJECTS_FUNCTION", error);
            toast.error("โหลดรายการโปรเจ็คไม่สำเร็จ", {
                id: TOAST_ID,
                description: error?.message ?? "Unexpected error",
            });
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    //** ฟังก์ชันเรียก API สำหรับโหลดโปรเจ็กต์ย่อย */
    const GET_SUB_PROJECTS_FUNCTION = useCallback(async (projectId: number) => {
        if (!projectId) {
            dispatch(setSubProjects([]));
            return [];
        }

        const TOAST_ID = "fetch-sub-projects";
        try {
            toast.loading("กำลังโหลดรายการฟีเจอร์...", {id: TOAST_ID});

            const response = await axios.post("/api/v1/timesheet/project/sub-project/read/", {
                limit: 100,
                page: 1,
                project_id: Number(projectId),
            });

            const items = response.data?.data?.items ?? [];
            if (isMountedRef.current) {
                dispatch(setSubProjects(items));
            }

            toast.success("โหลดรายการฟีเจอร์สำเร็จ", {id: TOAST_ID});
            return items;
        } catch (error: any) {
            console.error("GET_SUB_PROJECTS_FUNCTION", error);
            if (isMountedRef.current) {
                dispatch(setSubProjects([]));
            }
            toast.error("โหลดรายการฟีเจอร์ไม่สำเร็จ", {
                id: TOAST_ID,
                description: error?.message ?? "Unexpected error",
            });
            return [];
        }
    }, [dispatch]);

    useEffect(() => {
        GET_PROJECTS_FUNCTION();
    }, [GET_PROJECTS_FUNCTION]);

    //** ปิด modal และรีเซ็ตค่า */
    const closeModal = useCallback(() => {
        dispatch(setModalType(null));
        dispatch(setActiveRecord(null));
        dispatch(setFormMode("create"));
        form.resetFields();
    }, [dispatch, form]);

    //** เปิดฟอร์มโหมดสร้างใหม่ */
    const openCreateForm = useCallback(() => {
        dispatch(setFormMode("create"));
        dispatch(setActiveRecord(null));
        dispatch(setSubProjects([]));
        form.setFieldsValue({
            project_id: undefined,
            sub_project_id: undefined,
            description: "",
            work_hour: undefined,
            status: undefined,
            date: dayjs(),
        });
        dispatch(setModalType("form"));
    }, [dispatch, form]);

    //** เปิดฟอร์มโหมดแก้ไข */
    const openEditForm = useCallback(
        async (record: TimesheetEntry) => {
            dispatch(setFormMode("edit"));
            dispatch(setActiveRecord(record));
            await GET_SUB_PROJECTS_FUNCTION(Number(record.project_id));
            if (!isMountedRef.current) return;

            form.setFieldsValue({
                project_id: Number(record.project_id),
                sub_project_id: record.feature_id ? Number(record.feature_id) : undefined,
                description: record.description ?? "",
                work_hour: Number(record.hours) || undefined,
                status: record.status,
                date: dayjs(record.date),
            });
            dispatch(setModalType("form"));
        },
        [dispatch, GET_SUB_PROJECTS_FUNCTION, form]
    );

    //** เปิดฟอร์มโหมดคัดลอก */
    const openCopyForm = useCallback(
        async (record: TimesheetEntry) => {
            dispatch(setFormMode("copy"));
            dispatch(setActiveRecord(null));
            await GET_SUB_PROJECTS_FUNCTION(Number(record.project_id));
            if (!isMountedRef.current) return;

            form.setFieldsValue({
                project_id: Number(record.project_id),
                sub_project_id: record.feature_id ? Number(record.feature_id) : undefined,
                description: record.description ?? "",
                work_hour: Number(record.hours) || undefined,
                status: record.status,
                date: dayjs(),
            });
            dispatch(setModalType("form"));
        },
        [dispatch, GET_SUB_PROJECTS_FUNCTION, form]
    );

    //** เปิด Modal รายละเอียด */
    const openDetailModal = useCallback((record: TimesheetEntry) => {
        dispatch(setActiveRecord(record));
        dispatch(setModalType("detail"));
    }, [dispatch]);

    //** เปิด Modal ยืนยันการลบ */
    const openDeleteModal = useCallback(() => {
        dispatch(setModalType("delete"));
    }, [dispatch]);

    //** บันทึกข้อมูลฟอร์ม */
    const SUBMIT_TIMESHEET_FUNCTION = useCallback(async () => {
        const TOAST_ID = "submit-form";
        try {
            const values = await form.validateFields();
            setActionLoading(true);

            toast.loading("กำลังบันทึกข้อมูล...", {id: TOAST_ID});

            const payload = {
                id: timesheetState.formMode === "edit" ? timesheetState.activeRecord?.id : undefined,
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
            console.error("SUBMIT_TIMESHEET_FUNCTION", error);
            toast.error("บันทึกข้อมูลล้มเหลว", {
                id: TOAST_ID,
                description: error?.message ?? "Unexpected error",
            });
        } finally {
            if (isMountedRef.current) {
                setActionLoading(false);
            }
        }
    }, [timesheetState.activeRecord?.id, timesheetState.formMode, adminId, closeModal, refetchEntries, form]);

    //** ลบหลายรายการ */
    const DELETE_TIMESHEET_FUNCTION = useCallback(async () => {
        if (!timesheetState.selectedRowKeys.length) return;

        const TOAST_ID = "bulk-delete";
        try {
            setActionLoading(true);
            toast.loading("กำลังลบรายการ...", {id: TOAST_ID});

            await axios.post(
                "/api/v1/timesheet/entry/delete/",
                {
                    ids: timesheetState.selectedRowKeys.map((key) => Number(key)),
                    by: adminId,
                },
                {headers: {"Content-Type": "application/json"}}
            );

            toast.success("ลบรายการสำเร็จ", {id: TOAST_ID});

            if (isMountedRef.current) {
                dispatch(setSelectedRowKeys([]));
                closeModal();
                refetchEntries();
                rankBoardRef.current?.refetch();
            }
        } catch (error: any) {
            console.error("DELETE_TIMESHEET_FUNCTION", error);
            toast.error("ลบรายการล้มเหลว", {
                id: TOAST_ID,
                description: error?.message ?? "Unexpected error",
            });
        } finally {
            if (isMountedRef.current) {
                setActionLoading(false);
            }
        }
    }, [adminId, closeModal, refetchEntries, timesheetState.selectedRowKeys, dispatch]);

    //** ตั้งค่าการค้นหาในคอลัมน์ */
    const getColumnSearchProps = useCallback(
        (dataIndex: SearchableColumnKey, title: string): TableColumn => ({
            key: dataIndex,
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => {
                const value = (selectedKeys[0] as string | undefined) ?? "";

                return (
                    <TableSearch
                        value={value}
                        placeholder={`ค้นหา ${title}`}
                        inputRef={searchInputRefs.current[dataIndex] ? {current: searchInputRefs.current[dataIndex]} : undefined}
                        onChange={(inputValue) => setSelectedKeys(inputValue ? [inputValue] : [])}
                        onConfirm={() => confirm()}
                        onReset={() => {
                            clearFilters?.();
                            confirm({closeDropdown: true});
                        }}
                    />
                );
            },
            filterIcon: (filtered) => (
                <SearchOutlined/>
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
                    dayjs(a.date).startOf("day").valueOf() - dayjs(b.date).startOf("day").valueOf(),
                render: (value: string) => (
                    <Typography.Text style={{fontWeight: 500}}>
                        {dayjs(value).format(DATE_FORMAT)}
                    </Typography.Text>
                ),
                ...getColumnSearchProps("date", "วันที่"),
            },
            {
                title: "ชื่อโปรเจ็ค",
                dataIndex: "project_name",
                sorter: (a, b) => a.project_name.localeCompare(b.project_name),
                render: (value: string) => (
                    <Typography.Text strong>{value ?? "-"}</Typography.Text>
                ),
                ...getColumnSearchProps("project_name", "ชื่อโปรเจ็ค"),
            },
            {
                title: "ชื่อฟีเจอร์",
                dataIndex: "feature_name",
                sorter: (a, b) => (a.feature_name ?? "").localeCompare(b.feature_name ?? ""),
                render: (value: string | null) => (
                    <Typography.Text type={value ? undefined : "secondary"}>
                        {value || "-"}
                    </Typography.Text>
                ),
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
                    return (
                        <Tag
                            color={color}
                            style={{
                                borderRadius: 6,
                                fontWeight: 500,
                                border: 'none'
                            }}
                        >
                            {label}
                        </Tag>
                    );
                },
                ...getColumnSearchProps("status", "สถานะ"),
            },
            {
                title: "ชั่วโมง",
                dataIndex: "hours",
                align: "right",
                sorter: (a, b) => Number(a.hours) - Number(b.hours),
                render: (value: number) => (
                    <Typography.Text strong style={{color: '#1677ff'}}>
                        {Number(value) || 0} ชม.
                    </Typography.Text>
                ),
                ...getColumnSearchProps("hours", "ชั่วโมง"),
            },
            {
                title: "คำอธิบาย",
                dataIndex: "description",
                sorter: (a, b) => (a.description ?? "").localeCompare(b.description ?? ""),
                render: (value: string | null) => (
                    <Typography.Text
                        ellipsis={{tooltip: value || "ไม่มีคำอธิบาย"}}
                        type={value ? undefined : "secondary"}
                        style={{maxWidth: 200}}
                    >
                        {value || "-"}
                    </Typography.Text>
                ),
                ...getColumnSearchProps("description", "คำอธิบาย"),
            },
            {
                title: "จัดการ",
                key: "actions",
                fixed: "right",
                width: 140,
                render: (_value, record) => (
                    <Space size="small">
                        {/* ปุ่มดูรายละเอียด */}
                        <Button
                            type="text"
                            icon={<EyeOutlined/>}
                            onClick={() => openDetailModal(record)}
                            size="small"
                            style={{borderRadius: 6}}
                        />
                        {/* ปุ่มแก้ไข */}
                        <Button
                            type="text"
                            icon={<EditOutlined/>}
                            onClick={() => openEditForm(record)}
                            size="small"
                            style={{borderRadius: 6}}
                        />
                        {/* ปุ่มคัดลอก */}
                        <Button
                            type="text"
                            icon={<CopyOutlined/>}
                            onClick={() => openCopyForm(record)}
                            size="small"
                            style={{borderRadius: 6}}
                        />
                    </Space>
                ),
            },
        ],
        [getColumnSearchProps, openCopyForm, openDetailModal, openEditForm, i18n.language]
    );

    const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
        selectedRowKeys: timesheetState.selectedRowKeys,
        onChange: (keys) => dispatch(setSelectedRowKeys(keys)),
    };

    return (
        <PermissionLayout role={["ALL"]}>
            <DashboardLayout>
                <div
                    style={{
                        padding: '24px',
                        minHeight: '100vh'
                    }}
                >
                    <Space
                        direction="vertical"
                        size="large"
                        style={{width: "100%"}}
                    >
                        {/* หัวข้อหน้า */}
                        <div style={{marginBottom: 16}}>
                            <Typography.Title
                                level={2}
                                style={{
                                    margin: 0,
                                    fontWeight: 600,
                                    fontSize: 28
                                }}
                            >
                                การลงเวลาทำงาน
                            </Typography.Title>
                            <Typography.Text
                                type="secondary"
                                style={{fontSize: 16, marginTop: 4}}
                            >
                                จัดการและติดตามเวลาทำงานของคุณ
                            </Typography.Text>
                        </div>

                        {/* การ์ดสถิติด้านบน */}
                        <div
                            style={{
                                display: "flex",
                                gap: 16,
                                flexWrap: "wrap",
                                alignItems: "stretch"
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
                                <TimesheetStatCard
                                    title="โปรเจ็คยอดนิยม"
                                    value={topProjectUsage.hours}
                                    color="#52c41a"
                                    loading={tableLoading}
                                    description={topProjectUsage.name}
                                />
                            )}

                            {/* การ์ดฟีเจอร์ที่ใช้เวลามากที่สุด */}
                            {topFeatureUsage && (
                                <TimesheetStatCard
                                    title="ฟีเจอร์ยอดนิยม"
                                    value={topFeatureUsage.hours}
                                    color="#ff4d4f"
                                    loading={tableLoading}
                                    description={topFeatureUsage.name}
                                />
                            )}
                        </div>

                        {/* สรุปชั่วโมงรายสัปดาห์ */}
                        <WeeklySummary
                            weeklySummary={weeklySummary}
                            targetHours={DAILY_TARGET_HOURS}
                            loading={tableLoading}
                        />

                        {/* ตารางการลงเวลา */}
                        <Card
                            title={
                                <Typography.Title level={4} style={{margin: 0,}}>
                                    รายการลงเวลา
                                </Typography.Title>
                            }
                            loading={tableLoading && entries.length === 0}
                            extra={
                                <TimesheetActions
                                    selectedCount={timesheetState.selectedRowKeys.length}
                                    loading={actionLoading}
                                    refreshLoading={tableLoading}
                                    onRefresh={refetchEntries}
                                    onAdd={openCreateForm}
                                    onDelete={openDeleteModal}
                                />
                            }
                            style={{
                                borderRadius: 12,
                                
                            }}
                            styles={{
                                body: {
                                    padding: 0
                                }
                            }}
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
                                    pageSizeOptions: ["10", "20", "50", "100"],
                                    showTotal: (total, range) =>
                                        `แสดง ${range[0]}-${range[1]} จากทั้งหมด ${total} รายการ`,
                                    style: {margin: '16px 24px'}
                                }}
                                scroll={{x: 1000}}

                            />
                        </Card>
                    </Space>

                    {/* Modal ฟอร์มสร้าง/แก้ไข */}
                    <CreateModalForm
                        open={timesheetState.modalType === "form"}
                        onCancel={closeModal}
                        onSubmit={SUBMIT_TIMESHEET_FUNCTION}
                        form={form}
                        projects={timesheetState.projects}
                        subProject={timesheetState.subProjects}
                        fetchSubProjects={(id) => GET_SUB_PROJECTS_FUNCTION(Number(id))}
                        i18n={i18n}
                        disabled={actionLoading}
                    />

                    {/* Modal รายละเอียด */}
                    <DetailModal
                        open={timesheetState.modalType === "detail" && !!timesheetState.activeRecord}
                        onCancel={closeModal}
                        record={timesheetState.activeRecord}
                    />

                    {/* Modal ยืนยันการลบ */}
                    <DeleteConfirmationModal
                        open={timesheetState.modalType === "delete"}
                        onCancel={closeModal}
                        onConfirm={DELETE_TIMESHEET_FUNCTION}
                        selectedCount={timesheetState.selectedRowKeys.length}
                        loading={actionLoading}
                    />
                </div>
            </DashboardLayout>
        </PermissionLayout>
    );
}
