"use client";

import {Tag} from "antd";
import React from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";

interface MethodBadgeProps {
    method: HttpMethod | string;
    loading?: boolean;
}

interface MethodConfig {
    color: string;
    emoji: string;
}

/**
 * แมป HTTP Methods เป็นสีและ emoji ที่เหมาะสม
 */
const METHOD_MAP: Record<string, MethodConfig> = {
    GET: {color: "success", emoji: ""},
    POST: {color: "processing", emoji: ""},
    PUT: {color: "warning", emoji: ""},
    DELETE: {color: "error", emoji: ""},
    PATCH: {color: "orange", emoji: ""},
    OPTIONS: {color: "default", emoji: ""},
    HEAD: {color: "purple", emoji: ""},
};

/**
 * Component แสดง Badge สำหรับ HTTP Methods
 * @param props - Properties ของ Badge
 */
export const MethodBadge: React.FC<MethodBadgeProps> = ({
                                                            method,
                                                            loading = false,
                                                        }) => {
    //** แสดง Loading state */
    if (loading) {
        return <Tag color="processing">Loading...</Tag>;
    }

    const upperMethod = method.toUpperCase();
    const methodConfig = METHOD_MAP[upperMethod];

    //** ใช้ค่า default หากไม่มีในแมป */
    if (!methodConfig) {
        return <Tag color="default">{upperMethod}</Tag>;
    }

    return (
        <Tag color={methodConfig.color}>
            {methodConfig.emoji} {upperMethod}
        </Tag>
    );
};
