import React from 'react';
import type {InputRef} from 'antd';
import {Button, Input, Space} from 'antd';
import {SearchOutlined} from '@ant-design/icons';

interface TableSearchProps {
    //** ค่าการค้นหา */
    value: string;
    //** placeholder ของ input */
    placeholder: string;
    //** ref ของ input */
    inputRef?: React.RefObject<InputRef>;
    //** ฟังก์ชันเมื่อค่าเปลี่ยน */
    onChange: (value: string) => void;
    //** ฟังก์ชันยืนยันการค้นหา */
    onConfirm: () => void;
    //** ฟังก์ชันรีเซ็ต */
    onReset: () => void;
}

export const TableSearch: React.FC<TableSearchProps> = ({
                                                            value,
                                                            placeholder,
                                                            inputRef,
                                                            onChange,
                                                            onConfirm,
                                                            onReset,
                                                        }) => {
    return (
        <div
            style={{
                padding: 12,
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onKeyDown={(e) => e.stopPropagation()}
        >
            {/* ช่องค้นหา */}
            <Input
                ref={inputRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onPressEnter={onConfirm}
                style={{
                    marginBottom: 8,
                    borderRadius: 6,
                    border: '1px solid #d9d9d9'
                }}
            />

            {/* ปุ่มดำเนินการ */}
            <Space>
                <Button
                    type="primary"
                    icon={<SearchOutlined/>}
                    size="small"
                    onClick={onConfirm}
                    style={{
                        borderRadius: 6,
                        background: '#1677ff',
                        borderColor: '#1677ff'
                    }}
                >
                    ค้นหา
                </Button>
                <Button
                    size="small"
                    onClick={onReset}
                    style={{
                        borderRadius: 6,
                        border: '1px solid #d9d9d9'
                    }}
                >
                    รีเซ็ต
                </Button>
            </Space>
        </div>
    );
};
