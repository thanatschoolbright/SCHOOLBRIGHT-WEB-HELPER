import React from 'react';
import {Button, Space, Tooltip} from 'antd';
import {DeleteOutlined, PlusOutlined, ReloadOutlined} from '@ant-design/icons';

interface TimesheetActionsProps {
    //** จำนวนรายการที่เลือก */
    selectedCount: number;
    //** สถานะการโหลด */
    loading?: boolean;
    //** สถานะการรีเฟรช */
    refreshLoading?: boolean;
    //** ฟังก์ชันเพิ่มรายการใหม่ */
    onAdd: () => void;
    //** ฟังก์ชันลบรายการ */
    onDelete: () => void;
    //** ฟังก์ชันรีเฟรชข้อมูล */
    onRefresh: () => void;
}

export const TimesheetActions: React.FC<TimesheetActionsProps> = ({
                                                                      selectedCount,
                                                                      loading = false,
                                                                      refreshLoading = false,
                                                                      onAdd,
                                                                      onDelete,
                                                                      onRefresh,
                                                                  }) => {
    return (
        <Space>
            {/* ปุ่มรีเฟรช */}
            <Tooltip title="รีเฟรชข้อมูล">
                <Button
                    type="text"
                    icon={<ReloadOutlined/>}
                    loading={refreshLoading}
                    onClick={onRefresh}
                    size="small"
                />
            </Tooltip>

            {/* ปุ่มเพิ่มรายการใหม่ */}
            <Button
                type="primary"
                icon={<PlusOutlined/>}
                onClick={onAdd}
                disabled={loading}
                size="large"
                hidden
            >
                เพิ่มรายการ
            </Button>

            {/* ปุ่มลบรายการที่เลือก */}
            {selectedCount > 0 && (
                <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined/>}
                    onClick={onDelete}
                    loading={loading}
                    size="small"
                >
                    ลบรายการ ({selectedCount})
                </Button>
            )}
        </Space>
    );
};
