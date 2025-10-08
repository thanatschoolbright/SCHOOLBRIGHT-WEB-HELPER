"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { 
  Button, 
  Card, 
  DatePicker, 
  Descriptions, 
  Divider, 
  Dropdown, 
  Form, 
  InputNumber, 
  Modal, 
  Select, 
  Skeleton,
  Space, 
  Table,
  Tag,
  Tooltip,
  Typography,
  theme 
} from "antd";
import type { MenuProps, TableProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { 
  ApartmentOutlined,
  BarChartOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  PieChartOutlined,
  ProjectOutlined,
  UserOutlined 
} from "@ant-design/icons";
import { toast } from "sonner";
import { utils, writeFile } from "xlsx";
import axios from "axios";
import dayjs from "dayjs";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { ExportButton } from "@components/button";
import { HoursBadge, StatusBadge } from "@components/badge";
import { TimesheetTable } from "@components/table";
import { GraphTimesheetModal } from "@/components/modal/graph-timesheet-modal-component";
import { PieTimesheetModal } from "@/components/modal/pie-timesheet-modal-component";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import { getUserData } from "@/helpers/local_storage/user.storage";
import type { Project, SubProject, UserProfile } from "@/stores/type";
import type { TimesheetMode } from "@/components/modal/graph-timesheet-modal-component";
import type { 
  TimesheetEntry, 
  TimesheetExportData, 
  PaginationData, 
  TableFilters, 
  DropdownOption 
} from "@/types/timesheet-table.types";

//** ค่าคงที่สำหรับการแบ่งหน้า */
const PAGE_SIZE = 100;

//** ฟังก์ชันจัดรูปแบบ timestamp */
const formatTimestamp = (value?: string | null) =>
    value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-";

export default function Page() {
    const { token } = theme.useToken(); //** ใช้ Ant Design theme tokens */
    const {i18n} = useTranslation("mock");
    const [form] = Form.useForm();
    const router = useRouter();
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportingTemplate, setExportingTemplate] = useState(false);
    const [exportForm] = Form.useForm();

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [subProjects, setSubProjects] = useState<SubProject[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [graphMode, setGraphMode] = useState<TimesheetMode>("week");
    const [pieMode, setPieMode] = useState<TimesheetMode>("week");
    const [modalKey, setModalKey] = useState<"" | "graph" | "pie" | "detail">("");
    const [detailRecord, setDetailRecord] = useState<TimesheetEntry | null>(null);
    const [exporting, setExporting] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [filteredInfo, setFilteredInfo] = useState<TableFilters>({});

    const selectedProjectId = Form.useWatch("project_id", exportForm);

    const projectOptions = useMemo(
        () =>
            projects.map((project) => ({
                label: `${project.name ?? "ไม่ระบุ"} (รหัส ${project.id})`,
                value: project.id,
            })),
        [projects]
    );

    const subProjectOptions = useMemo(() => {
        const targetProjectId = selectedProjectId
            ? Number(selectedProjectId)
            : undefined;
        const scopedSubProjects = targetProjectId
            ? subProjects.filter(
                (item) => Number(item.project_id) === Number(targetProjectId)
            )
            : subProjects;

        return scopedSubProjects.map((subProject) => ({
            label: `${subProject.name ?? "ไม่ระบุ"} (รหัส ${subProject.id})`,
            value: String(subProject.id),
        }));
    }, [selectedProjectId, subProjects]);

    const userOptions = useMemo(
        () =>
            users.map((user) => {
                const fullname = `${user.firstname ?? ""} ${
                    user.lastname ?? ""
                }`.trim();
                const displayName = fullname || user.name || user.email;
                const code = user.employee_code ? ` • รหัส ${user.employee_code}` : "";
                return {
                    label: `${displayName}${code}`,
                    value: String(user.admin_id ?? user.id ?? ""),
                };
            }),
        [users]
    );

    const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
        getCheckboxProps: (record) => ({disabled: !!(record as any).children}),
    };

    const handleTableChange: TableProps<TimesheetEntry>["onChange"] = (
        _pagination,
        filters
    ) => {
        setFilteredInfo(filters as TableFilters);
    };

    const statusLabelMap = useMemo(() => {
        return STATUS_OPTIONS.reduce<Record<string, string>>((acc, option) => {
            acc[option.value] =
                i18n.language === "th" ? option.label_th : option.label_en;
            return acc;
        }, {});
    }, [i18n.language]);



    const timeModeItems = useMemo<MenuProps["items"]>(
        () => [
            {key: "today", label: "วันนี้"},
            {key: "week", label: "สัปดาห์นี้"},
            {key: "month", label: "เดือนนี้"},
            {key: "year", label: "ปีนี้"},
        ],
        []
    );

    //** ฟังก์ชันโหลดข้อมูลโปรเจ็กต์จาก API */
    const fetchProjects = useCallback(async () => {
        setLoading(true);
        const toastId = toast.loading("กำลังโหลดโปรเจ็กต์...");
        try {
            const response = await axios.post(
                "/api/v1/timesheet/project/read/",
                {limit: 50, page: currentPage},
                {headers: {"Content-Type": "application/json"}}
            );
            const data = response.data;
            setProjects(data.data ?? []);
            toast.success("โหลดโปรเจ็กต์สำเร็จ", {id: toastId});
        } catch (error: any) {
            setProjects([]);
            toast.error(error?.message ?? "ไม่สามารถโหลดโปรเจ็กต์ได้", {
                id: toastId,
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    //** ฟังก์ชันโหลดข้อมูล Timesheet entries จาก API */
    const fetchEntries = useCallback(async () => {
        setLoading(true);
        const toastId = toast.loading("กำลังโหลดข้อมูลลงเวลา...");
        try {
            const response = await axios.post("/api/v1/timesheet/entry/read/", {
                limit: pageSize,
                page: currentPage,
            });
            const rawEntries = response.data?.data ?? [];
            setEntries(rawEntries);
            setTotalItems(response.data?.pagination?.total ?? 0);
            setPageSize(response.data?.pagination?.page_size ?? pageSize);
            toast.success("โหลดข้อมูลสำเร็จ", {id: toastId});
        } catch (error: any) {
            setEntries([]);
            toast.error(error?.message ?? "ไม่สามารถโหลดข้อมูลลงเวลาได้", {
                id: toastId,
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    const fetchSubProjectsByProject = useCallback(async (projectId: number) => {
        const toastId = toast.loading("กำลังโหลดโครงการย่อย...");
        try {
            const response = await axios.post(
                "/api/v1/timesheet/project/sub-project/read/",
                {
                    limit: 200,
                    page: 1,
                    project_id: Number(projectId),
                }
            );
            const items = response.data?.data?.items ?? [];
            setSubProjects(items);
            toast.success("โหลดโครงการย่อยสำเร็จ", {id: toastId});
        } catch (error: any) {
            setSubProjects([]);
            toast.error(error?.message ?? "ไม่สามารถโหลดโครงการย่อยได้", {
                id: toastId,
            });
        }
    }, []);

    useEffect(() => {
        const allUsers = getUserData();
        if (allUsers) {
            setUsers(allUsers);
        }
    }, []);

    useEffect(() => {
        fetchEntries();
        fetchProjects();
    }, [fetchEntries, fetchProjects]);

    useEffect(() => {
        if (!exportModalVisible) {
            setSubProjects([]);
            return;
        }

        if (selectedProjectId) {
            setSubProjects([]);
            fetchSubProjectsByProject(Number(selectedProjectId));
            return;
        }

        setSubProjects([]);
    }, [exportModalVisible, selectedProjectId, fetchSubProjectsByProject]);

    useEffect(() => {
        if (exportModalVisible) {
            exportForm.setFieldsValue({
                date_range: [dayjs().startOf("month"), dayjs()],
                project_id: undefined,
                sub_project_id: undefined,
                created_by: undefined,
                investment: undefined,
            });
        }
    }, [exportModalVisible, exportForm]);

    //** ฟังก์ชันส่งออกไฟล์ Template Timesheet */
    const handleExportTemplate = useCallback(async () => {
        const pollIntervalMs = 1500;
        const maxAttempts = 120; // roughly 3 minutes
        let toastId: string | number | undefined;

        try {
            const values = await exportForm.validateFields();
            setExportingTemplate(true);
            const investmentValue = Number(values.investment);
            if (!Number.isFinite(investmentValue) || investmentValue <= 0) {
                throw new Error("งบการลงทุนต้องเป็นตัวเลขมากกว่า 0");
            }

            toastId = toast.loading("กำลังจัดเตรียมคำขอส่งออก...");

            const response = await fetch("/api/v1/timesheet/excel/template_1", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    start_date: values.date_range[0].format("YYYY-MM-DD"),
                    end_date: values.date_range[1].format("YYYY-MM-DD"),
                    project_id: values.project_id || "",
                    sub_project_id: values.sub_project_id || "",
                    created_by: values.created_by || "",
                    investment: investmentValue,
                }),
            });

            if (!response.ok) {
                throw new Error("ไม่สามารถส่งออกไฟล์ได้");
            }

            if (response.status === 202) {
                const payload = await response.json();
                const statusUrl = payload.statusUrl as string;
                const downloadUrl = payload.downloadUrl as string;
                if (!statusUrl || !downloadUrl) {
                    throw new Error("ระบบไม่ได้ส่งข้อมูลสถานะการดาวน์โหลดกลับมา");
                }

                const seenSteps = new Set<string>();
                let attempts = 0;
                while (attempts < maxAttempts) {
                    attempts += 1;
                    const statusResponse = await fetch(statusUrl, {cache: "no-store"});
                    if (!statusResponse.ok) {
                        const statusError = await statusResponse
                            .json()
                            .catch(() => ({} as any));
                        throw new Error(
                            statusError?.message_th ||
                            statusError?.message_en ||
                            "ส่งออกไฟล์ไม่สำเร็จ"
                        );
                    }

                    const statusData = await statusResponse.json();

                    const steps = Array.isArray(statusData.steps) ? statusData.steps : [];
                    if (steps.length) {
                        const latestStep = steps[steps.length - 1];
                        if (latestStep?.key && !seenSteps.has(latestStep.key)) {
                            seenSteps.add(latestStep.key);
                            toast.loading(latestStep.label ?? "กำลังดำเนินการ...", {
                                id: toastId,
                            });
                        }
                    }

                    if (statusData.status === "ready") {
                        toast.loading("ไฟล์พร้อมแล้ว กำลังเตรียมดาวน์โหลด...", {
                            id: toastId,
                        });

                        const downloadResponse = await fetch(downloadUrl, {
                            cache: "no-store",
                        });

                        if (!downloadResponse.ok) {
                            const downloadError = await downloadResponse
                                .json()
                                .catch(() => ({} as any));
                            throw new Error(
                                downloadError?.message_th ||
                                downloadError?.message_en ||
                                "ไม่สามารถดาวน์โหลดไฟล์ได้"
                            );
                        }

                        const blob = await downloadResponse.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        const start = values.date_range[0].format("YYYYMMDD");
                        const end = values.date_range[1].format("YYYYMMDD");
                        link.href = url;
                        link.download = `timesheet-export_${start}_${end}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);

                        toast.success("ส่งออกไฟล์เรียบร้อย", {id: toastId});
                        setExportModalVisible(false);
                        exportForm.resetFields();
                        return;
                    }

                    if (statusData.status === "failed") {
                        throw new Error(statusData.error || "ไม่สามารถสร้างไฟล์ได้");
                    }

                    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
                }

                throw new Error(
                    "ส่งออกไฟล์ใช้เวลานานกว่าที่กำหนด กรุณาลองใหม่อีกครั้ง"
                );
            }

            // Fallback: immediate binary response (legacy behaviour)
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            const start = values.date_range[0].format("YYYYMMDD");
            const end = values.date_range[1].format("YYYYMMDD");
            link.href = url;
            link.download = `timesheet-export_${start}_${end}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("ส่งออกไฟล์เรียบร้อย", {id: toastId});
            setExportModalVisible(false);
            exportForm.resetFields();
        } catch (error: any) {
            const message = error?.message || "ส่งออกไฟล์ไม่สำเร็จ";
            if (toastId !== undefined) {
                toast.error(message, {id: toastId});
            } else {
                toast.error(message);
            }
        } finally {
            setExportingTemplate(false);
        }
    }, [exportForm, setExportModalVisible]);

    //** ฟังก์ชันส่งออกข้อมูล Timesheet ทั้งหมดเป็นไฟล์ Excel */
    const handleExportAll = useCallback(async () => {
        setExporting(true);
        const toastId = toast.loading("กำลังส่งออกข้อมูล...");
        try {
            const response = await axios.post("/api/v1/timesheet/entry/read/", {
                limit: 10000,
                page: 1,
            });

            const allEntries = response.data?.data ?? [];
            if (!allEntries.length) {
                toast.info("ไม่มีข้อมูลสำหรับส่งออก", {id: toastId});
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
            const filename = `timesheet-report-${dayjs().format(
                "YYYYMMDD-HHmmss"
            )}.xlsx`;
            writeFile(workbook, filename);

            toast.success("ส่งออกข้อมูลสำเร็จ", {id: toastId});
        } catch (error: any) {
            toast.error(error?.message ?? "ส่งออกข้อมูลล้มเหลว", {id: toastId});
        } finally {
            setExporting(false);
        }
    }, [users, statusLabelMap]);

    //** ฟังก์ชันค้นหาผู้ใช้จาก ID */
    const getUserById = useCallback(
        (id: string | number) => 
            users.find((user) => String(user.admin_id) === String(id)),
        [users]
    );

    const selectedUsersMap = useMemo(() => {
        const map = new Map();
        users.forEach((user) => {
            map.set(String(user.admin_id), user);
        });
        return map;
    }, [users]);

    const detailModalContent = useMemo(() => {
        if (!detailRecord) {
            return null;
        }

        const user = selectedUsersMap.get(String(detailRecord.created_by));
        const userName = user
            ? [user.firstname, user.lastname].filter(Boolean).join(" ") || "-"
            : "-";

        const detailItems = [
            {
                key: "description",
                label: "รายละเอียดคำอธิบาย",
                value: (
                    <Typography.Paragraph className="timesheet-detail-description">
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
                value: <HoursBadge hours={Number(detailRecord.hours)} />,
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
                    backgroundColor: token.colorBgLayout,
                    borderRadius: token.borderRadius,
                }}
            >
                <Space direction="vertical" size="middle" style={{width: "100%"}}>
                    <div>
                        <Typography.Title 
                            level={4} 
                            style={{
                                margin: 0,
                                color: token.colorText
                            }}
                        >
                            สรุปรายการลงเวลา
                        </Typography.Title>
                        <Typography.Text 
                            type="secondary"
                            style={{ color: token.colorTextSecondary }}
                        >
                            อัปเดตล่าสุด{" "}
                            {formatTimestamp(
                                detailRecord.updated_at || detailRecord.created_at
                            )}
                        </Typography.Text>
                    </div>
                    
                    <Divider style={{ margin: `${token.marginXS}px 0` }} />
                    
                    <Descriptions
                        column={1}
                        colon={false}
                        labelStyle={{
                            width: 160, 
                            fontWeight: token.fontWeightStrong, 
                            color: token.colorText
                        }}
                        contentStyle={{
                            color: token.colorTextSecondary
                        }}
                        style={{
                            backgroundColor: token.colorBgContainer,
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
    }, [detailRecord, selectedUsersMap, statusLabelMap]);

    const handleTimeModeSelect =
        (setter: (mode: TimesheetMode) => void): MenuProps["onClick"] =>
            ({key}) => {
                setter(key as TimesheetMode);
                setModalKey(setter === setGraphMode ? "graph" : "pie");
            };

    return (
        <PermissionLayout role={["ADMIN"]}>
            <DashboardLayout>
                <GraphTimesheetModal
                    open={modalKey === "graph"}
                    onClose={() => setModalKey("")}
                    data={entries}
                    mode={graphMode}
                />
                <PieTimesheetModal
                    open={modalKey === "pie"}
                    onClose={() => setModalKey("")}
                    data={entries}
                    mode={pieMode}
                />

                <Modal
                    title="รายละเอียดการลงเวลา"
                    open={modalKey === "detail"}
                    onCancel={() => setModalKey("")}
                    footer={null}
                    width={680}
                    centered
                    styles={{
                        content: {
                            borderRadius: token.borderRadiusLG,
                            backgroundColor: token.colorBgContainer,
                        },
                        header: {
                            backgroundColor: token.colorFillAlter,
                            borderBottom: `1px solid ${token.colorBorder}`,
                        },
                    }}
                >
                    {detailModalContent}
                </Modal>

                <Space direction="vertical" size="large" style={{width: "100%"}}>
                    {/* ส่วนหัวและ Controls */}
                    <Card 
                        bordered={false}
                        style={{
                            backgroundColor: token.colorBgContainer,
                            borderRadius: token.borderRadiusLG,
                            boxShadow: token.boxShadow,
                        }}
                    >
                        <Space direction="vertical" size="middle" style={{width: "100%"}}>
                            <div>
                                <Typography.Title 
                                    level={2} 
                                    style={{
                                        margin: 0,
                                        color: token.colorText,
                                        fontWeight: token.fontWeightStrong
                                    }}
                                >
                                    การจัดการลงเวลาทำงาน
                                </Typography.Title>
                                <Typography.Text 
                                    type="secondary"
                                    style={{
                                        fontSize: token.fontSizeLG,
                                        color: token.colorTextSecondary
                                    }}
                                >
                                    ระบบติดตาม และจัดการเวลาทำงานของทีม
                                </Typography.Text>
                            </div>
                            
                            <Divider style={{ margin: `${token.marginXS}px 0` }} />
                            
                            <Card
                                size="small"
                                bordered={true}
                                style={{
                                    borderColor: token.colorBorder,
                                    borderRadius: token.borderRadius,
                                    backgroundColor: token.colorFillAlter,
                                }}
                            >
                            <Space size="small" wrap>
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                key: "report-who-not-entry",
                                                label: "รายงานการไม่กรอกไทม์ชีทวันนี้",
                                                onClick: () =>
                                                    router.push("/timesheet/all/who-not-entry"),
                                            },
                                            {
                                                key: "report-summary",
                                                label: "รายงานการกรอกไทม์ชีท ทั้งอาทิตย์",
                                                onClick: () => router.push("/timesheet/all/summary"),
                                            },
                                            {
                                                key: "report-summary-ranking",
                                                label: "รายงานการกรอกไทม์ชีท ทั้งเดือน (จัดแรงก์)",
                                                onClick: () =>
                                                    router.push("/timesheet/all/summary-month"),
                                            },
                                        ],
                                    }}
                                >
                                    <Button type="default" size="middle">
                                        เลือกดูรายงาน Timesheet
                                    </Button>
                                </Dropdown>
                                <Dropdown
                                    menu={{
                                        items: timeModeItems,
                                        onClick: handleTimeModeSelect(setGraphMode),
                                    }}
                                >
                                    <Button
                                        type="default"
                                        size="middle"
                                        icon={<BarChartOutlined/>}
                                    >
                                        กราฟแท่ง
                                    </Button>
                                </Dropdown>
                                <Dropdown
                                    menu={{
                                        items: timeModeItems,
                                        onClick: handleTimeModeSelect(setPieMode),
                                    }}
                                >
                                    <Button
                                        type="default"
                                        size="middle"
                                        icon={<PieChartOutlined/>}
                                    >
                                        กราฟวงกลม
                                    </Button>
                                </Dropdown>
                                <ExportButton
                                    isExporting={exporting || exportingTemplate}
                                    onExportTemplate={() => setExportModalVisible(true)}
                                    onExportAll={handleExportAll}
                                    type="primary"
                                    style={{
                                        borderRadius: token.borderRadius,
                                    }}
                                />
                            </Space>
                            </Card>
                        </Space>
                    </Card>

                    {/* ตาราง Timesheet */}
                    <Card 
                        title="ข้อมูลการลงเวลาทำงาน"
                        bordered={false}
                        style={{
                            backgroundColor: token.colorBgContainer,
                            borderRadius: token.borderRadiusLG,
                            boxShadow: token.boxShadow,
                        }}
                        styles={{
                            header: {
                                backgroundColor: token.colorFillAlter,
                                borderBottom: `1px solid ${token.colorBorder}`,
                            },
                        }}
                    >
                        {loading ? (
                            /* Skeleton Loading สำหรับตาราง */
                            <div style={{ padding: token.paddingLG }}>
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <div 
                                        key={index} 
                                        style={{ 
                                            marginBottom: token.marginMD,
                                            padding: token.paddingSM,
                                            border: `1px solid ${token.colorBorder}`,
                                            borderRadius: token.borderRadius,
                                            backgroundColor: token.colorBgContainer
                                        }}
                                    >
                                        <Space size="middle" style={{ width: '100%' }}>
                                            <Skeleton.Button size="small" />
                                            <Skeleton.Input size="small" style={{ width: 150 }} />
                                            <Skeleton.Input size="small" style={{ width: 120 }} />
                                            <Skeleton.Input size="small" style={{ width: 100 }} />
                                            <Skeleton.Button size="small" />
                                            <Skeleton.Button size="small" />
                                            <Skeleton.Input size="small" style={{ width: 200 }} />
                                            <Skeleton.Button size="small" />
                                        </Space>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <TimesheetTable
                                dataSource={entries}
                                loading={false}
                                pagination={{
                                    current: currentPage,
                                    pageSize,
                                    total: totalItems,
                                }}
                                selectedRowKeys={selectedRowKeys}
                                onSelectionChange={setSelectedRowKeys}
                                onTableChange={(pagination, filters) => {
                                    setCurrentPage(pagination.current);
                                    setPageSize(pagination.pageSize);
                                    setFilteredInfo(filters);
                                }}
                                onViewDetail={(record) => {
                                    setDetailRecord(record);
                                    setModalKey("detail");
                                }}
                                projects={projects}
                                users={users}
                                language={i18n.language}
                                statusLabelMap={statusLabelMap}
                                filteredInfo={filteredInfo}
                            />
                        )}
                    </Card>
                    <Modal
                        open={exportModalVisible}
                        onCancel={() => setExportModalVisible(false)}
                        title="ส่งออก Timesheet (Template)"
                        footer={null}
                        styles={{
                            content: {
                                borderRadius: token.borderRadiusLG,
                                backgroundColor: token.colorBgContainer,
                            },
                            header: {
                                backgroundColor: token.colorFillAlter,
                                borderBottom: `1px solid ${token.colorBorder}`,
                            },
                        }}
                    >
                        <Form 
                            form={exportForm} 
                            layout="vertical"
                            style={{
                                padding: token.paddingMD,
                            }}
                        >
                            <Form.Item
                                label="ช่วงวันที่"
                                name="date_range"
                                rules={[{required: true, message: "กรุณาเลือกช่วงวันที่"}]}
                            >
                                <DatePicker.RangePicker
                                    style={{
                                        width: "100%",
                                        borderRadius: token.borderRadius,
                                    }}
                                    format="DD/MM/YYYY"
                                    size="large"
                                />
                            </Form.Item>
                            <Form.Item
                                label="งบการลงทุนรวม (บาท)"
                                name="investment"
                                rules={[
                                    {required: true, message: "กรุณาระบุงบการลงทุน"},
                                    {
                                        validator: (_rule, value) => {
                                            if (value === undefined || value === null) {
                                                return Promise.reject("กรุณาระบุงบการลงทุน");
                                            }
                                            if (value <= 0) {
                                                return Promise.reject("งบการลงทุนต้องมากกว่า 0");
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <InputNumber
                                    style={{
                                        width: "100%",
                                        borderRadius: token.borderRadius,
                                    }}
                                    size="large"
                                    min={0.01}
                                    step={0.01}
                                    precision={2}
                                    placeholder="ระบุจำนวนเงินรวมที่ต้องการจัดสรร"
                                />
                            </Form.Item>
                            <Form.Item label="โครงการหลัก" name="project_id">
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="เลือกโครงการหลัก (ไม่บังคับ)"
                                    options={projectOptions}
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toString()
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    onChange={() =>
                                        exportForm.setFieldsValue({sub_project_id: undefined})
                                    }
                                    suffixIcon={<ProjectOutlined/>}
                                    style={{
                                        width: "100%",
                                        borderRadius: token.borderRadius,
                                    }}
                                    size="large"
                                />
                            </Form.Item>
                            <Form.Item label="โครงการย่อย" name="sub_project_id">
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="เลือกโครงการย่อย (ไม่บังคับ)"
                                    options={subProjectOptions}
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toString()
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    suffixIcon={<ApartmentOutlined/>}
                                    style={{
                                        width: "100%",
                                        borderRadius: token.borderRadius,
                                    }}
                                    size="large"
                                />
                            </Form.Item>
                            <Form.Item label="ผู้จัดทำ" name="created_by">
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="เลือกผู้จัดทำ (ไม่บังคับ)"
                                    options={userOptions}
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toString()
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    suffixIcon={<UserOutlined/>}
                                    style={{
                                        width: "100%",
                                        borderRadius: token.borderRadius,
                                    }}
                                    size="large"
                                />
                            </Form.Item>
                            <Space 
                                style={{
                                    width: "100%", 
                                    justifyContent: "flex-end",
                                    marginTop: token.marginLG
                                }}
                            >
                                <Button 
                                    onClick={() => setExportModalVisible(false)}
                                    style={{
                                        borderRadius: token.borderRadius,
                                    }}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="primary"
                                    loading={exportingTemplate}
                                    onClick={handleExportTemplate}
                                    style={{
                                        borderRadius: token.borderRadius,
                                    }}
                                >
                                    ส่งออก
                                </Button>
                            </Space>
                        </Form>
                    </Modal>
                </Space>
            </DashboardLayout>
        </PermissionLayout>
    );
}
