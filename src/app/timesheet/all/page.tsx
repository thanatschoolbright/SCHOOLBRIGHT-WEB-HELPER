"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Card, Descriptions, Divider, Modal, Space, theme, Typography} from "antd";
import {utils, writeFile} from "xlsx";
import dayjs from "dayjs";
import {useDispatch} from "react-redux";
import {toast} from "sonner";

import "@/styles/timesheet-apple.css";

import {HoursBadge, StatusBadge} from "@components/badge";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@components/layouts/permission-layout";
import {
    TimesheetControlsSkeleton,
    TimesheetHeaderSkeleton,
    TimesheetTableSkeleton
} from "@components/loading/timesheet-skeleton";
import type {TimesheetMode} from "@components/modal/graph-timesheet-modal-component";
import {GraphTimesheetModal} from "@components/modal/graph-timesheet-modal-component";
import {PieTimesheetModal} from "@components/modal/pie-timesheet-modal-component";
import ExportModal from "@components/modal/timesheet-export-modal";
import TimesheetControls from "@components/section/timesheet-controls";
import TimesheetHeader from "@components/section/timesheet-header";
import {TimesheetTable} from "@components/table";
import {STATUS_OPTIONS} from "@constants/timesheet.constants";
import {getUserData} from "@helpers/local_storage/user.storage";
import {
    GET_PROJECTS,
    GET_SUB_PROJECTS_BY_PROJECT,
    GET_TIMESHEET_ENTRIES,
    POST_EXPORT_ALL_ENTRIES,
    POST_EXPORT_TEMPLATE
} from "@services/timesheet/timesheet-all.service";
import {
    setDetailRecord,
    setEntries,
    setEntriesLoading,
    setExportLoading,
    setFilteredInfo,
    setModalState,
    setPagination,
    setProjects,
    setProjectsLoading,
    setSelectedRowKeys,
    setSubProjects,
    setSubProjectsLoading,
    setUsers,
} from "@stores/reducers/timesheet.reducer";
import {useAppSelector} from "@stores/store";
import type {TimesheetEntry, TimesheetExportData} from "@/types/timesheet-table.types";

//** ฟังก์ชันจัดรูปแบบ timestamp */
const formatTimestamp = (value?: string | null): string =>
    value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-";

//** Component หลักสำหรับหน้าจัดการ Timesheet */
export default function TimesheetAllPage(): JSX.Element {
    const {token} = theme.useToken();
    const {i18n} = useTranslation("mock");
    const dispatch = useDispatch();

    //** ดึงข้อมูลจาก Redux Store */
    const timesheetState = useAppSelector((state) => state.timesheetAll);
    const {
        entries,
        projects,
        subProjects,
        users,
        entriesLoading,
        projectsLoading,
        subProjectsLoading,
        exportLoading,
        currentPage,
        pageSize,
        totalItems,
        modalStates,
        selectedRowKeys,
        detailRecord,
        filteredInfo,
    } = timesheetState;

    //** Local state สำหรับ Modal modes */
    const [graphMode, setGraphMode] = useState<TimesheetMode>("week");
    const [pieMode, setPieMode] = useState<TimesheetMode>("week");

    //** สร้าง Options สำหรับ Status Label Map */
    const statusLabelMap = useMemo(() => {
        return STATUS_OPTIONS.reduce<Record<string, string>>((acc, option) => {
            acc[option.value] =
                i18n.language === "th" ? option.label_th : option.label_en;
            return acc;
        }, {});
    }, [i18n.language]);

    //** สร้าง Map สำหรับ Users */
    const selectedUsersMap = useMemo(() => {
        const map = new Map();
        users.forEach((user) => {
            map.set(String(user.admin_id), user);
        });
        return map;
    }, [users]);

    //** สร้างข้อมูลสถิติ */
    const statsData = useMemo(() => {
        const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
        const activeProjects = new Set(entries.map(entry => entry.project_name).filter(Boolean)).size;

        return {
            totalEntries: entries.length,
            totalHours,
            activeProjects,
        };
    }, [entries]);

    //** โหลดข้อมูล Timesheet Entries */
    const LOAD_TIMESHEET_ENTRIES = useCallback(async () => {
        dispatch(setEntriesLoading(true));
        try {
            const result = await GET_TIMESHEET_ENTRIES({
                limit: pageSize,
                page: currentPage,
            });

            dispatch(setEntries(result.entries));
            dispatch(setPagination({
                totalItems: result.total,
                pageSize: result.pageSize,
            }));
        } catch (error) {
            dispatch(setEntries([]));
        } finally {
            dispatch(setEntriesLoading(false));
        }
    }, [currentPage, pageSize, dispatch]);

    //** โหลดข้อมูลโปรเจ็กต์ */
    const LOAD_PROJECTS = useCallback(async () => {
        dispatch(setProjectsLoading(true));
        try {
            const projects = await GET_PROJECTS({
                limit: 50,
                page: 1,
            });
            dispatch(setProjects(projects));
        } catch (error) {
            dispatch(setProjects([]));
        } finally {
            dispatch(setProjectsLoading(false));
        }
    }, [dispatch]);

    //** โหลดข้อมูลโปรเจ็กต์ย่อย */
    const LOAD_SUB_PROJECTS = useCallback(async (projectId: number) => {
        dispatch(setSubProjectsLoading(true));
        try {
            const subProjects = await GET_SUB_PROJECTS_BY_PROJECT(projectId);
            dispatch(setSubProjects(subProjects));
        } catch (error) {
            dispatch(setSubProjects([]));
        } finally {
            dispatch(setSubProjectsLoading(false));
        }
    }, [dispatch]);

    //** ส่งออกไฟล์ Template */
    const HANDLE_EXPORT_TEMPLATE = useCallback(async (exportData: TimesheetExportData) => {
        dispatch(setExportLoading(true));
        try {
            await POST_EXPORT_TEMPLATE(exportData);
        } finally {
            dispatch(setExportLoading(false));
        }
    }, [dispatch]);

    //** ส่งออกข้อมูลทั้งหมด */
    const HANDLE_EXPORT_ALL = useCallback(async () => {
        dispatch(setExportLoading(true));
        try {
            const {entries: allEntries} = await POST_EXPORT_ALL_ENTRIES();

            if (!allEntries.length) {
                return;
            }

            const dataset = allEntries.map((entry: TimesheetEntry) => {
                const user = users.find((u) => String(u.admin_id) === String(entry.created_by));
                return {
                    วันที่: entry.date ? dayjs(entry.date).format("DD/MM/YYYY") : "-",
                    ชื่อโปรเจ็กต์: entry.project_name ?? "-",
                    ชื่อฟีเจอร์: entry.feature_name ?? "-",
                    ชื่อผู้จัดทำ: user
                        ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || "-"
                        : "-",
                    สถานะ: statusLabelMap[entry.status] ?? entry.status ?? "-",
                    ชั่วโมง: Number(entry.hours ?? 0),
                    คำอธิบาย: entry.description ?? "-",
                };
            });

            const worksheet = utils.json_to_sheet(dataset);
            const workbook = utils.book_new();
            utils.book_append_sheet(workbook, worksheet, "Timesheet");
            const filename = `timesheet-report-${dayjs().format("YYYYMMDD-HHmmss")}.xlsx`;
            writeFile(workbook, filename);

            toast.success("ส่งออกข้อมูลสำเร็จ");
        } finally {
            dispatch(setExportLoading(false));
        }
    }, [dispatch, users, statusLabelMap]);

    //** จัดการการเปิด Modal */
    const handleOpenModal = useCallback((modalType: keyof typeof modalStates, mode?: TimesheetMode) => {
        dispatch(setModalState({modal: modalType, isOpen: true}));
        if (mode && modalType === "graphModal") setGraphMode(mode);
        if (mode && modalType === "pieModal") setPieMode(mode);
    }, [dispatch]);

    //** จัดการการปิด Modal */
    const handleCloseModal = useCallback((modalType: keyof typeof modalStates) => {
        dispatch(setModalState({modal: modalType, isOpen: false}));
        if (modalType === "detailModal") {
            dispatch(setDetailRecord(null));
        }
    }, [dispatch]);

    //** จัดการการดูรายละเอียด */
    const handleViewDetail = useCallback((record: TimesheetEntry) => {
        dispatch(setDetailRecord(record));
        dispatch(setModalState({modal: "detailModal", isOpen: true}));
    }, [dispatch]);

    //** จัดการการเปลี่ยนหน้า */
    const handleTableChange = useCallback((pagination: any, filters: any) => {
        dispatch(setPagination({
            currentPage: pagination.current,
            pageSize: pagination.pageSize,
        }));
        dispatch(setFilteredInfo(filters));
    }, [dispatch]);

    //** จัดการการเลือกแถว */
    const handleSelectionChange = useCallback((keys: React.Key[]) => {
        dispatch(setSelectedRowKeys(keys));
    }, [dispatch]);

    //** สร้างข้อมูลรายละเอียด Modal */
    const detailModalContent = useMemo(() => {
        if (!detailRecord) return null;

        const user = selectedUsersMap.get(String(detailRecord.created_by));
        const userName = user
            ? [user.firstname, user.lastname].filter(Boolean).join(" ") || "-"
            : "-";

        const detailItems = [
            {
                key: "description",
                label: "รายละเอียดคำอธิบาย",
                value: (
                    <Typography.Paragraph>
                        {detailRecord.description ?? "-"}
                    </Typography.Paragraph>
                ),
            },
            {
                key: "project",
                label: "โปรเจ็ค",
                value: detailRecord.project_name ?? "-",
            },
            {
                key: "feature",
                label: "ฟีเจอร์",
                value: detailRecord.feature_name ?? "-",
            },
            {
                key: "owner",
                label: "ผู้จัดทำ",
                value: userName,
            },
            {
                key: "status",
                label: "สถานะ",
                value: (
                    <StatusBadge
                        status={detailRecord.status}
                        statusLabelMap={statusLabelMap}
                    />
                ),
            },
            {
                key: "hours",
                label: "จำนวนชั่วโมง",
                value: <HoursBadge hours={Number(detailRecord.hours)}/>,
            },
            {
                key: "created",
                label: "สร้างเมื่อ",
                value: formatTimestamp(detailRecord.created_at),
            },
            {
                key: "updated",
                label: "แก้ไขล่าสุด",
                value: formatTimestamp(detailRecord.updated_at),
            },
        ];

        return (
            <Card
                bordered={false}
                style={{
                    borderRadius: token.borderRadius,
                }}
            >
                <Space direction="vertical" size="middle" style={{width: "100%"}}>
                    <div>
                        <Typography.Title
                            level={4}
                            style={{
                                margin: 0,
                            }}
                        >
                            สรุปรายการลงเวลา
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            อัปเดตล่าสุด{" "}
                            {formatTimestamp(
                                detailRecord.updated_at || detailRecord.created_at
                            )}
                        </Typography.Text>
                    </div>

                    <Divider style={{margin: `${token.marginXS}px 0`}}/>

                    <Descriptions
                        column={1}
                        colon={false}
                        labelStyle={{
                            width: 160,
                            fontWeight: token.fontWeightStrong,
                        }}
                        style={{
                            padding: token.padding,
                            borderRadius: token.borderRadius,
                            border: `1px solid ${token.colorBorder}`
                        }}
                    >
                        {detailItems.map(({key, label, value}) => (
                            <Descriptions.Item key={key} label={label}>
                                {value}
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                </Space>
            </Card>
        );
    }, [detailRecord, selectedUsersMap, statusLabelMap, token]);

    //** โหลดข้อมูลเริ่มต้น */
    useEffect(() => {
        const allUsers = getUserData();
        if (allUsers) {
            dispatch(setUsers(allUsers));
        }
    }, [dispatch]);

    useEffect(() => {
        LOAD_TIMESHEET_ENTRIES();
        LOAD_PROJECTS();
    }, [LOAD_TIMESHEET_ENTRIES, LOAD_PROJECTS]);

    //** แสดง Loading Skeleton */
    if (entriesLoading && entries.length === 0) {
        return (
            <PermissionLayout role={["ADMIN"]}>
                <DashboardLayout>
                    <Space direction="vertical" size="large" style={{width: "100%"}}>
                        <TimesheetHeaderSkeleton/>
                        <TimesheetControlsSkeleton/>
                        <TimesheetTableSkeleton/>
                    </Space>
                </DashboardLayout>
            </PermissionLayout>
        );
    }

    return (
        <PermissionLayout role={["ADMIN"]}>
            <DashboardLayout>
                {/* Modals */}
                <GraphTimesheetModal
                    open={modalStates.graphModal}
                    onClose={() => handleCloseModal("graphModal")}
                    data={entries}
                    mode={graphMode}
                />

                <PieTimesheetModal
                    open={modalStates.pieModal}
                    onClose={() => handleCloseModal("pieModal")}
                    data={entries}
                    mode={pieMode}
                />

                <Modal
                    title="รายละเอียดการลงเวลา"
                    open={modalStates.detailModal}
                    onCancel={() => handleCloseModal("detailModal")}
                    footer={null}
                    width={680}
                    centered

                    styles={{
                        content: {
                            borderRadius: token.borderRadiusLG,
                        },
                        header: {
                            borderBottom: `1px solid ${token.colorBorder}`,
                        },
                    }}
                >
                    {detailModalContent}
                </Modal>

                <ExportModal
                    visible={modalStates.exportModal}
                    loading={exportLoading}
                    onClose={() => handleCloseModal("exportModal")}
                    onExport={HANDLE_EXPORT_TEMPLATE}
                    projects={projects}
                    subProjects={subProjects}
                    users={users}
                />

                {/* Main Content */}
                <Space direction="vertical" size="large" style={{width: "100%"}}>
                    {/* Header */}
                    <div>
                        <TimesheetHeader stats={statsData}/>
                    </div>

                    {/* Controls */}
                    <div>
                        <TimesheetControls
                            isExporting={exportLoading}
                            isExportingTemplate={exportLoading}
                            onExportTemplate={() => handleOpenModal("exportModal")}
                            onExportAll={HANDLE_EXPORT_ALL}
                            onOpenGraphModal={(mode) => handleOpenModal("graphModal", mode)}
                            onOpenPieModal={(mode) => handleOpenModal("pieModal", mode)}
                        />
                    </div>

                    {/* Table */}
                    <Card
                        title="ข้อมูลการลงเวลาทำงาน"
                        loading={entriesLoading}
                        style={{
                            borderRadius: token.borderRadiusLG,

                        }}
                        
                    >
                        <div>
                            <TimesheetTable
                                dataSource={entries}
                                loading={entriesLoading}
                                pagination={{
                                    current: currentPage,
                                    pageSize,
                                    total: totalItems,
                                }}
                                selectedRowKeys={selectedRowKeys}
                                onSelectionChange={handleSelectionChange}
                                onTableChange={handleTableChange}
                                onViewDetail={handleViewDetail}
                                projects={projects}
                                users={users}
                                language={i18n.language}
                                statusLabelMap={statusLabelMap}
                                filteredInfo={filteredInfo}
                            />
                        </div>
                    </Card>
                </Space>
            </DashboardLayout>
        </PermissionLayout>
    );
}
