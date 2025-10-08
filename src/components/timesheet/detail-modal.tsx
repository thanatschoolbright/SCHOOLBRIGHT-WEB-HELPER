"use client";

import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CodeOutlined,
    EditOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import {Descriptions, Modal, Space, Tag, theme, Typography} from "antd";
import dayjs from "dayjs";
import React from "react";

import {STATUS_OPTIONS} from "@constants/timesheet.constants";
import {TimesheetEntry} from "@/app/timesheet/entry/page";
import i18next from "i18next";

interface DetailModalProps {
    open: boolean;
    onCancel: () => void;
    record: TimesheetEntry | null;
}

const statusColorMap: Record<string, string> = {
    DONE: "success",
    IN_PROGRESS: "processing",
    REVIEW: "blue",
    CANCELLED: "error",
    DRAFT: "default",
};

const statusIconMap: Record<string, React.ReactNode> = {
    DONE: <CheckCircleOutlined/>,
    IN_PROGRESS: <ClockCircleOutlined/>,
    REVIEW: <InfoCircleOutlined/>,
    CANCELLED: <FileTextOutlined/>,
    DRAFT: <EditOutlined/>,
};

/**
 * Component สำหรับแสดง Modal รายละเอียดการลงเวลา
 * @param props - Props ของ Component
 */
export const DetailModal: React.FC<DetailModalProps> = ({
                                                            open,
                                                            onCancel,
                                                            record,
                                                        }) => {
    const {token} = theme.useToken();
    const i18n = i18next;

    if (!record) {
        return null;
    }

    const getStatusLabel = (status: string) => {
        const option = STATUS_OPTIONS.find((item) => item.value === status);
        if (!option) return status;
        return i18n.language === "th" ? option.label_th : option.label_en;
    };

    const items: any[] = [
        {
            key: "1",
            label: "โปรเจ็ค",
            icon: <FolderOpenOutlined/>,
            children: <Typography.Text>{record.project_name}</Typography.Text>,
        },
        {
            key: "2",
            label: "ฟีเจอร์",
            icon: <CodeOutlined/>,
            children: <Typography.Text>{record.feature_name || "-"}</Typography.Text>,
        },
        {
            key: "3",
            label: "วันที่",
            icon: <CalendarOutlined/>,
            children: (
                <Typography.Text>
                    {dayjs(record.date).format("DD/MM/YYYY")}
                </Typography.Text>
            ),
        },
        {
            key: "4",
            label: "ชั่วโมง",
            icon: <ClockCircleOutlined/>,
            children: <Typography.Text>{record.hours}</Typography.Text>,
        },
        {
            key: "5",
            label: "สถานะ",
            icon: statusIconMap[record.status] ?? <InfoCircleOutlined/>,
            children: (
                <Tag
                    color={statusColorMap[record.status] ?? "default"}
                    icon={statusIconMap[record.status]}
                >
                    {getStatusLabel(record.status)}
                </Tag>
            ),
        },
        {
            key: "6",
            label: "คำอธิบาย",
            icon: <FileTextOutlined/>,
            span: 2,
            children: (
                <Typography.Paragraph style={{margin: 0}}>
                    {record.description || "-"}
                </Typography.Paragraph>
            ),
        },
        {
            key: "7",
            label: "สร้างเมื่อ",
            icon: <EditOutlined/>,
            children: (
                <Typography.Text>
                    {record.created_at
                        ? dayjs(record.created_at).format("DD/MM/YYYY HH:mm")
                        : "-"}
                </Typography.Text>
            ),
        },
        {
            key: "8",
            label: "แก้ไขล่าสุด",
            icon: <EditOutlined/>,
            children: (
                <Typography.Text>
                    {record.updated_at
                        ? dayjs(record.updated_at).format("DD/MM/YYYY HH:mm")
                        : "-"}
                </Typography.Text>
            ),
        },
    ];

    return (
        <Modal
            title={
                <Space>
                    <InfoCircleOutlined/>
                    <Typography.Text>รายละเอียดการลงเวลาทำงาน</Typography.Text>
                </Space>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={600}
        >
            <Descriptions
                bordered
                column={{xs: 1, sm: 2}}
                items={items.map((item) => ({
                    ...item,
                    label: (
                        <Space>
                            {item.icon}
                            {item.label}
                        </Space>
                    ),
                }))}
                style={{marginTop: 24}}
                labelStyle={{
                    background: token.colorFillAlter,
                    fontWeight: 600,
                }}
            />
        </Modal>
    );
};

