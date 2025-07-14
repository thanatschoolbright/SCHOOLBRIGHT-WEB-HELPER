"use client";

import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDispatch} from "react-redux";
import {AppDispatch, useAppSelector} from "@stores/store";

import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import {MinimalRow} from "@components/table/minimal-row-component";
import MinimalTable from "@components/table/minimal-table-component";
import DropdownButtonComponent from "@components/button/dropdown-button-component";
import {CallAPI as GET_APPLICATION_LIST} from "@stores/actions/hardware/canteen/call-get-application";
import {
    CallAPI as GET_APPLICATION_VERSION_BY_APPID
} from "@stores/actions/hardware/canteen/call-get-application-by-appId";
import {ResponseApplicationList} from "@stores/type";
import ModalComponent from "@components/modal/modal-component";
import BaseLoadingComponent from "@components/loading/loading-component-1";

const renderTableHardwareApplicationList = (
    data: ResponseApplicationList['data']['data'],
    openVersionModal: (appId: string, appName: string) => void
) =>
    data.map((row, idx) => (
        <MinimalRow key={`${row.app_id}-${idx}`}>
            {({index}) => (
                <>
                    <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{index}</td>
                    <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{row.app_id}</td>
                    <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{row.app_name}</td>
                    <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{row.app_type}</td>
                    <DropdownButtonComponent
                        id={row.app_id}
                        items={[
                            {label: "ดูเวอร์ชัน", onClick: () => openVersionModal(row.app_id, row.app_name)},
                            {label: "อัปโหลด", onClick: () => console.log("อัปโหลด", row.app_id)},
                            {label: "แก้ไข", onClick: () => console.log("แก้ไข", row.app_id)},
                        ]}
                    />
                </>
            )}
        </MinimalRow>
    ));

const renderTableHardwareVersionByAppIdList = (
    data: any[]
) =>
    data.map((v: any, idx: number) => (
        <MinimalRow key={`${v.version_id}-${idx}`}>
            {() => (
                <>
                    <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{idx + 1}</td>
                    <td className="p-4">{v.version_name}</td>
                    <td className="p-4">{v.env}</td>
                    <td className="p-4">
                        {v.updated_at ? new Date(v.updated_at).toLocaleString("th-TH") : "-"}
                    </td>
                    <td className="p-4">
                        <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                        >
                            ดาวน์โหลด
                        </a>
                    </td>
                </>
            )}
        </MinimalRow>
    ));

// 🧾 คอลัมน์ของตาราง
const columns: { key: string; label: string }[] = [
    {key: "app_id", label: "APP ID"},
    {key: "app_name", label: "ชื่อแอปพลิเคชัน"},
    {key: "app_type", label: "แพลตฟอร์ม"},
    {key: "action", label: "การกระทำ"}, // 🔘 ปุ่มเพิ่มเติมในอนาคต
];

export default function Page() {
    const {t} = useTranslation("mock");
    const dispatch = useDispatch<AppDispatch>();

    const [applicationList, setApplicationList] = useState<ResponseApplicationList['data']['data']>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppName, setSelectedAppName] = useState("");

    const STATE_HARDWARE_APPLICATION = useAppSelector(
        (state) => state.callGetHardwareApplication
    );

    const STATE_HARDWARE_APPLICATION_BY_APP_ID = useAppSelector(
        (state) => state.callGetHardwareApplicationByAppId
    );

    const isLoading = [STATE_HARDWARE_APPLICATION_BY_APP_ID.loading].some(Boolean);

    // 🚀 โหลดข้อมูลตอนเปิดหน้า (และไม่โหลดซ้ำเมื่อ Modal เปิด)
    useEffect(() => {
        if (!isModalOpen && applicationList.length === 0) {
            dispatch(GET_APPLICATION_LIST()).unwrap();
        }
    }, [isModalOpen]);

    // 🔄 แปลงข้อมูลจาก Redux เป็นรูปแบบที่ต้องการสำหรับตาราง
    useEffect(() => {
        const rawList = STATE_HARDWARE_APPLICATION?.response?.data?.data || [];

        const transformed = rawList.map((item: ResponseApplicationList['data']['data'][number]) => ({
            app_name: item.app_name,
            app_id: item.app_id,
            app_type: item.app_type,
        }));

        setApplicationList(transformed);
    }, [STATE_HARDWARE_APPLICATION?.response]);

    // 🪵 log response เมื่อเปลี่ยน
    useEffect(() => {
        console.log("✅ [Redux Response Updated]", STATE_HARDWARE_APPLICATION.response);
    }, [STATE_HARDWARE_APPLICATION.response]);

    const openVersionModal = async (appId: string, appName: string) => {
        setSelectedAppName(appName);
        await dispatch(GET_APPLICATION_VERSION_BY_APPID({app_id: appId})); // เรียก API เพื่อดึงข้อมูลเวอร์ชัน
        setIsModalOpen(true);
        console.log("🔍 [Open Version Modal]", appId, appName);
    };

    return (
        <DashboardLayout>
            {isLoading && <BaseLoadingComponent/>}

            <div className="w-full space-y-4">
                {/* 📋 รายการแอปพลิเคชัน */}
                <ContentCard
                    title="รายการแอปพลิเคชัน"
                    className="xl:col-span-4 w-full"
                    isLoading={STATE_HARDWARE_APPLICATION.loading}
                >
                    <MinimalTable
                        key="application-list"
                        isLoading={STATE_HARDWARE_APPLICATION.loading}
                        header={columns}
                        data={applicationList}
                        rowsPerPage={10}
                        onRowsPerPageChange={() => {
                        }}
                        hiddenProps={false}
                    >
                        {renderTableHardwareApplicationList(applicationList, openVersionModal)}
                    </MinimalTable>
                </ContentCard>
            </div>

            <ModalComponent
                isOpen={isModalOpen}
                title={`เวอร์ชันของ ${selectedAppName}`}
                onClose={() => setIsModalOpen(false)}
            >
                <MinimalTable
                    key={`version-table-${selectedAppName}`}
                    isLoading={STATE_HARDWARE_APPLICATION_BY_APP_ID.loading}
                    header={[
                        {key: "version_name", label: "เวอร์ชัน"},
                        {key: "env", label: "สภาพแวดล้อม"},
                        {key: "updated_at", label: "อัปเดตเมื่อ"},
                        {key: "url", label: "ลิงก์"},
                    ]}
                    data={STATE_HARDWARE_APPLICATION_BY_APP_ID.response?.data?.data || []}
                    rowsPerPage={10}
                    onRowsPerPageChange={() => {
                    }}
                    hiddenProps={false}
                >
                    {renderTableHardwareVersionByAppIdList(
                        STATE_HARDWARE_APPLICATION_BY_APP_ID.response?.data?.data || []
                    )}
                </MinimalTable>
            </ModalComponent>
        </DashboardLayout>
    );
}
