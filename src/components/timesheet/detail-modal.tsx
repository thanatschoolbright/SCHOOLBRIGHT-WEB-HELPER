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
import {Descriptions, Divider, Modal, Space, Tag, theme, Typography} from "antd";
import dayjs from "dayjs";
import React from "react";

// สมมติว่าไฟล์เหล่านี้มีอยู่จริง
// import {STATUS_OPTIONS} from "@constants/timesheet.constants";
// import {TimesheetEntry} from "@/app/timesheet/entry/page";
// import i18next from "i18next";

// จำลองการนำเข้า (เพื่อให้รันได้ในตัวอย่างนี้)
const STATUS_OPTIONS = [
    {value: 'DONE', label_th: 'สำเร็จ', label_en: 'Done'},
    {value: 'IN_PROGRESS', label_th: 'กำลังดำเนินการ', label_en: 'In Progress'},
    {value: 'REVIEW', label_th: 'รอการตรวจสอบ', label_en: 'Review'},
    {value: 'CANCELLED', label_th: 'ยกเลิก', label_en: 'Cancelled'},
    {value: 'DRAFT', label_th: 'ฉบับร่าง', label_en: 'Draft'},
];

// TimesheetEntry Interface (จำลอง)
interface TimesheetEntry {
    project_name: string;
    feature_name: string | null;
    date: string;
    hours: number;
    status: 'DONE' | 'IN_PROGRESS' | 'REVIEW' | 'CANCELLED' | 'DRAFT';
    description: string | null;
    created_at: string | null;
    updated_at: string | null;
}

interface DetailModalProps {
    open: boolean;
    onCancel: () => void;
    record: TimesheetEntry | null;
}

// i18next mock (จำลองการใช้งาน)
const i18next = {
    language: "th", // สมมติว่าเป็นภาษาไทย
};


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
    const i18n = i18next; // ใช้ i18next ที่จำลองไว้

    if (!record) {
        return null;
    }

    const getStatusLabel = (status: string) => {
        const option = STATUS_OPTIONS.find((item) => item.value === status);
        if (!option) return status;
        return i18n.language === "th" ? option.label_th : option.label_en;
    };

    // ปรับปรุงการแสดงผล Label ให้อยู่ในรูปแบบ Descriptions.Item.label
    const labelWithIcon = (label: string, icon: React.ReactNode) => (
        <Space size={6} style={{fontWeight: 'bold'}}>
            {icon}
            <Typography.Text style={{color: token.colorTextSecondary}}>
                {label}
            </Typography.Text>
        </Space>
    );

    const items: any[] = [
        {
            key: "1",
            label: labelWithIcon("โปรเจ็ค", <FolderOpenOutlined/>),
            children: <Typography.Text>{record.project_name}</Typography.Text>,
            span: 3,
        },
        {
            key: "2",
            label: labelWithIcon("ฟีเจอร์", <CodeOutlined/>),
            children: <Typography.Text>{record.feature_name || "-"}</Typography.Text>,
            span: 3,
        },
        {
            key: "3",
            label: labelWithIcon("วันที่", <CalendarOutlined/>),
            children: (
                <Typography.Text>
                    {dayjs(record.date).format("DD/MM/YYYY")}
                </Typography.Text>
            ),
            span: 3,
        },
        {
            key: "4",
            label: labelWithIcon("ชั่วโมง", <ClockCircleOutlined/>),
            children: <Typography.Text>{record.hours} ชม.</Typography.Text>,
            span: 3,
        },
        {
            key: "5",
            label: labelWithIcon("สถานะ", statusIconMap[record.status] ?? <InfoCircleOutlined/>),
            children: (
                <Tag
                    color={statusColorMap[record.status] ?? "default"}
                    icon={statusIconMap[record.status]}
                    style={{fontWeight: 600}}
                >
                    {getStatusLabel(record.status)}
                </Tag>
            ),
            span: 3,
        },
        {
            key: "6",
            label: labelWithIcon("คำอธิบาย", <FileTextOutlined/>),
            span: 3,
            children: (
                <Typography.Paragraph
                    // ใช้ style น้อยที่สุดเพื่อรักษา whiteSpace: "pre-wrap"
                    style={{margin: 0, whiteSpace: "pre-wrap"}}
                >
                    {record.description || "-"}
                </Typography.Paragraph>
            ),
        },
        {
            key: "7",
            label: labelWithIcon("สร้างเมื่อ", <EditOutlined/>),
            children: (
                <Typography.Text>
                    {record.created_at
                        ? dayjs(record.created_at).format("DD/MM/YYYY HH:mm")
                        : "-"}
                </Typography.Text>
            ),
            span: 1,
        },
        {
            key: "8",
            label: labelWithIcon("แก้ไขล่าสุด", <EditOutlined/>),
            children: (
                <Typography.Text>
                    {record.updated_at
                        ? dayjs(record.updated_at).format("DD/MM/YYYY HH:mm")
                        : "-"}
                </Typography.Text>
            ),
            span: 1,
        },
    ];

    return (
        <Modal
            // 1. ปรับปรุง Title และลบ style ที่ไม่จำเป็นออก
            title={
                <Space size={8} align="center">
                    <InfoCircleOutlined style={{color: token.colorPrimary, fontSize: 24}}/>
                    <Typography.Title
                        level={4}
                        style={{
                            margin: 0,
                            color: token.colorTextHeading, // ใช้ Heading color
                            fontWeight: 600,
                        }}
                    >
                        รายละเอียดการลงเวลาทำงาน
                    </Typography.Title>
                </Space>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={1000} // เพิ่มความกว้างให้ดูสบายตา
            centered
            styles={{
                body: {
                    padding: 24,
                }
            }}
        >
            <Divider style={{margin: '0 0 24px 0'}}/>

            <Descriptions
                bordered
                column={{xs: 1, sm: 1, md: 2}}
                size="default"
                items={items}
                styles={{
                    content: {
                        fontSize: 14,
                    }
                }}

            />
        </Modal>
    );
};
