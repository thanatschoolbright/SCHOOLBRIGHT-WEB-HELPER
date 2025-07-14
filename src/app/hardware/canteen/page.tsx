"use client";
import {useEffect, useState} from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import MinimalTable from "@components/table/minimal-table-component";
import {MinimalRow} from "@components/table/minimal-row-component";
import {API_URL} from "@/services/api-url";

// NOTE: Replace this with your actual hardware_url config
const hardware_url = API_URL.DEV_HARDWARE_API_URL

const appColumns = [
    {key: "index", label: "#"},
    {key: "app_name", label: "ชื่อแอปพลิเคชัน"},
    {key: "app_type", label: "ประเภทแพลตฟอร์ม"},
    {key: "app_id", label: "APP ID"}
];

export default function Page() {
    const [appList, setAppList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchApps = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${hardware_url}/api/v2/applications`);
                if (!res.ok) throw new Error("Failed to fetch applications");
                const data = await res.json();
                setAppList(Array.isArray(data) ? data : data?.data || []);
            } catch (e) {
                setAppList([]);
            }
            setIsLoading(false);
        };
        fetchApps();
    }, []);

    const renderAppTableData = (data: any[]) =>
        data.map((row, idx) => (
            <MinimalRow key={row.app_id}>
                {({index}) => (
                    <>
                        <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{index + 1}</td>
                        <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{row.app_name}</td>
                        <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{row.app_type}</td>
                        <td className="p-4 text-sm text-gray-900 dark:text-gray-200">{row.app_id}</td>
                    </>
                )}
            </MinimalRow>
        ));

    return (
        <DashboardLayout>
            {isLoading && <BaseLoadingComponent/>}
            <div className="w-full space-y-4">
                <ContentCard title="รายการแอปทั้งหมด">
                    <MinimalTable
                        isLoading={false}
                        header={appColumns}
                        data={appList}
                        rowsPerPage={10}
                        onRowsPerPageChange={() => {
                        }}
                    >
                        {renderAppTableData(appList)}
                    </MinimalTable>
                </ContentCard>
            </div>
        </DashboardLayout>
    );
}
