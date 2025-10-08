"use client";

import React from "react";
import {Button, Card, Input, Space, theme} from "antd";

// Props for the search filter component
type TableSearchFilterProps = {
    placeholder?: string;
    selectedKeys: React.Key[];
    setSelectedKeys: (selectedKeys: React.Key[]) => void;
    confirm: () => void;
    clearFilters?: () => void;
    width?: number;
};

export default function TableSearchFilter({
                                              placeholder = "ค้นหา...",
                                              selectedKeys,
                                              setSelectedKeys,
                                              confirm,
                                              clearFilters,
                                              width = 90,
                                          }: TableSearchFilterProps) {
    // Use Ant Design theme for subtle color and minimal style
    const {token} = theme.useToken();

    return (
        // Minimal, borderless card for soft edges and spacing
        <Card
            variant="borderless"
            styles={{
                body: {
                    padding: 12,
                    background: token.colorBgContainer,
                    borderRadius: 10,
                    boxShadow: "none",
                }
            }}
        >
            {/* Search input and search button with improved spacing */}
            <Space direction="horizontal" style={{marginBottom: 18, width: "100%"}} size="small">
                <Input
                    placeholder={placeholder}
                    value={selectedKeys[0]}
                    allowClear
                    onChange={(e) =>
                        setSelectedKeys(e.target.value ? [e.target.value] : [])
                    }
                    onPressEnter={() => confirm()}
                    style={{
                        flex: 1,
                        borderRadius: 12,
                        borderColor: token.colorBorder,
                        minWidth: 120,
                    }}
                />
                <Button
                    type="primary"
                    onClick={() => confirm()}
                    size="middle"
                    style={{
                        borderRadius: 12,
                        fontWeight: 500,
                    }}
                >
                    ค้นหา
                </Button>
                <Button
                    onClick={() => {
                        clearFilters?.();
                        confirm();
                    }}
                    type="text"
                    size="small"
                    style={{
                        color: token.colorTextSecondary,
                        borderRadius: 8,
                        paddingInline: 14,
                        transition: "all 0.2s ease",
                    }}
                >
                    ล้างการค้นหา
                </Button>
            </Space>


        </Card>
    );
}
