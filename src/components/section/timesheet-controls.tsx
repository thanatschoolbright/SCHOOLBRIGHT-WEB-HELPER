import React from "react";
import {useRouter} from "next/navigation";
import type {MenuProps} from "antd";
import {Button, Card, Dropdown, Space, theme} from "antd";
import {BarChartOutlined, PieChartOutlined} from "@ant-design/icons";

import {ExportButton} from "@components/button";
import type {TimesheetMode} from "@/components/modal/graph-timesheet-modal-component";

//** Interface สำหรับ Props ของ TimesheetControls */
interface TimesheetControlsProps {
    /** สถานะการส่งออก */
    isExporting: boolean;
    /** สถานะการส่งออก Template */
    isExportingTemplate: boolean;
    /** ฟังก์ชันเปิด Modal ส่งออก Template */
    onExportTemplate: () => void;
    /** ฟังก์ชันส่งออกข้อมูลทั้งหมด */
    onExportAll: () => void;
    /** ฟังก์ชันเปิด Graph Modal */
    onOpenGraphModal: (mode: TimesheetMode) => void;
    /** ฟังก์ชันเปิด Pie Chart Modal */
    onOpenPieModal: (mode: TimesheetMode) => void;
}

//** Menu Items สำหรับ Time Mode Selection */
const TIME_MODE_ITEMS: MenuProps["items"] = [
    {key: "today", label: "วันนี้"},
    {key: "week", label: "สัปดาห์นี้"},
    {key: "month", label: "เดือนนี้"},
    {key: "year", label: "ปีนี้"},
];

//** Component Controls สำหรับหน้า Timesheet */
const TimesheetControls: React.FC<TimesheetControlsProps> = ({
                                                                 isExporting,
                                                                 isExportingTemplate,
                                                                 onExportTemplate,
                                                                 onExportAll,
                                                                 onOpenGraphModal,
                                                                 onOpenPieModal,
                                                             }) => {
    const {token} = theme.useToken();
    const router = useRouter();

    //** จัดการการเลือก Time Mode สำหรับ Graph */
    const handleGraphModeSelect: MenuProps["onClick"] = ({key}) => {
        onOpenGraphModal(key as TimesheetMode);
    };

    //** จัดการการเลือก Time Mode สำหรับ Pie Chart */
    const handlePieModeSelect: MenuProps["onClick"] = ({key}) => {
        onOpenPieModal(key as TimesheetMode);
    };

    //** Menu Items สำหรับรายงาน */
    const reportMenuItems: MenuProps["items"] = [
        {
            key: "report-who-not-entry",
            label: "รายงานการไม่กรอกไทม์ชีทวันนี้",
            onClick: () => router.push("/timesheet/all/who-not-entry"),
        },
        {
            key: "report-summary",
            label: "รายงานการกรอกไทม์ชีท ทั้งอาทิตย์",
            onClick: () => router.push("/timesheet/all/summary"),
        },
        {
            key: "report-summary-ranking",
            label: "รายงานการกรอกไทม์ชีท ทั้งเดือน (จัดแรงก์)",
            onClick: () => router.push("/timesheet/all/summary-month"),
        },
    ];

    return (
        <Card
            size="small"
            style={{
                borderRadius: token.borderRadius,
                marginBottom: token.marginMD,
            }}
        >
            <Space size="small" wrap>
                {/* ปุ่มเลือกดูรายงาน */}
                <Dropdown
                    menu={{
                        items: reportMenuItems,
                    }}
                    placement="bottomLeft"
                >
                    <Button
                        size="middle"
                        style={{
                            borderRadius: token.borderRadius,
                            fontWeight: 500,
                        }}
                    >
                        เลือกดูรายงาน Timesheet
                    </Button>
                </Dropdown>

                {/* ปุ่มกราฟแท่ง */}
                <Dropdown
                    menu={{
                        items: TIME_MODE_ITEMS,
                        onClick: handleGraphModeSelect,
                    }}
                    placement="bottomLeft"
                >
                    <Button
                        size="middle"
                        icon={<BarChartOutlined/>}
                        style={{
                            borderRadius: token.borderRadius,
                            fontWeight: 500,
                        }}
                    >
                        กราฟแท่ง
                    </Button>
                </Dropdown>

                {/* ปุ่มกราฟวงกลม */}
                <Dropdown
                    menu={{
                        items: TIME_MODE_ITEMS,
                        onClick: handlePieModeSelect,
                    }}
                    placement="bottomLeft"
                >
                    <Button
                        size="middle"
                        icon={<PieChartOutlined/>}
                        style={{
                            borderRadius: token.borderRadius,
                            fontWeight: 500,
                        }}
                    >
                        กราฟวงกลม
                    </Button>
                </Dropdown>

                {/* ปุ่มส่งออกข้อมูล */}
                <ExportButton
                    isExporting={isExporting || isExportingTemplate}
                    onExportTemplate={onExportTemplate}
                    onExportAll={onExportAll}
                    type="default"

                />
            </Space>
        </Card>
    );
};

export default TimesheetControls;
