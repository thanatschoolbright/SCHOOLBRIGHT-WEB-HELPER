"use client";

import {DeleteOutlined, PlusOutlined, ReloadOutlined} from "@ant-design/icons";
import {Button, Space} from "antd";
import React from "react";

interface TableActionsProps {
    onRefresh: () => void;
    onAdd: () => void;
    onDelete: () => void;
    selectedCount: number;
    loading?: boolean;
    refreshLoading?: boolean;
}

/**
 * Component ปุ่มจัดการตาราง (รีเฟรช, เพิ่ม, ลบ)
 * @param props - Props ของ Component
 */
export const TableActions: React.FC<TableActionsProps> = ({
                                                              onRefresh,
                                                              onAdd,
                                                              onDelete,
                                                              selectedCount,
                                                              loading = false,
                                                              refreshLoading = false,
                                                          }) => {
    return (
        <Space direction="vertical" size="middle" style={{width: "100%"}}>
            {/* ปุ่มส่วนบน */}
            <Space size="middle">
                <Button
                    icon={<ReloadOutlined/>}
                    onClick={onRefresh}
                    loading={refreshLoading}
                    disabled={loading}
                >
                    รีเฟรช
                </Button>
                <Button
                    type="primary"
                    icon={<PlusOutlined/>}
                    onClick={onAdd}
                    disabled={loading}
                >
                    เพิ่มรายการลงเวลา
                </Button>


                {/* ปุ่มลบที่เลือก */}

                <Button
                    danger
                    icon={<DeleteOutlined/>}
                    disabled={!selectedCount || loading}
                    onClick={onDelete}
                >
                    ลบที่เลือก ({selectedCount})
                </Button>
            </Space>
        </Space>
    );
};
