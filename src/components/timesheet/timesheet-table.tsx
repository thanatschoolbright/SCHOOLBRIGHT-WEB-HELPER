"use client";

import React, {useCallback, useMemo, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import dayjs from "dayjs";
import i18next from "i18next";

import {Button, Input, InputRef, Space, Table, Tag, Typography} from "antd";
import type {ColumnsType, ColumnType, TableProps} from "antd/es/table";
import {CopyOutlined, EditOutlined, EyeOutlined, SearchOutlined} from "@ant-design/icons";

import {TableActions} from "@components/button/table-actions";
import {STATUS_OPTIONS} from "@constants/timesheet.constants";
import {openModal, setPagination, setSelectedRowKeys} from "@stores/reducers/timesheet-slice";
import {AppDispatch, RootState} from "@stores/store";
import {TimesheetEntry} from "@/types/timesheet";

//** ค่าคงที่ */
const DATE_FORMAT = "DD/MM/YYYY";
const statusColorMap: Record<string, string> = {
    DONE: "green",
    IN_PROGRESS: "orange",
    REVIEW: "blue",
    CANCELLED: "red",
    DRAFT: "default",
};

type SearchableColumnKey = "date" | "project_name" | "feature_name" | "status" | "hours" | "description";
type TableColumn = ColumnType<TimesheetEntry> & { key: keyof TimesheetEntry | string };

interface TimesheetTableProps {
    onRefresh: () => void;
}

//** Component: ตารางแสดงข้อมูลการลงเวลา */
const TimesheetTable: React.FC<TimesheetTableProps> = ({onRefresh}) => {
    const dispatch = useDispatch<AppDispatch>();
    const {
        entries,
        loading,
        actionLoading,
        currentPage,
        pageSize,
        totalItems,
        selectedRowKeys,
    } = useSelector((state: RootState) => state.timesheet);

    const searchInputRefs = useRef<Partial<Record<SearchableColumnKey, InputRef | null>>>({});

    //** การทำงาน: เปิด Modal ต่างๆ */
    const handleOpenCreate = () => dispatch(openModal({type: 'form', mode: 'create'}));
    const handleOpenDetail = (record: TimesheetEntry) => dispatch(openModal({type: 'detail', record}));
    const handleOpenEdit = (record: TimesheetEntry) => dispatch(openModal({type: 'form', mode: 'edit', record}));
    const handleOpenCopy = (record: TimesheetEntry) => dispatch(openModal({type: 'form', mode: 'copy', record}));
    const handleOpenDelete = () => dispatch(openModal({type: 'delete'}));

    //** การทำงาน: สร้าง Props สำหรับการค้นหาในคอลัมน์ */
    const getColumnSearchProps = useCallback(
        (dataIndex: SearchableColumnKey, title: string): TableColumn => ({
            key: dataIndex,
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
                <div style={{padding: 12}} onKeyDown={(e) => e.stopPropagation()}>
                    <Input
                        ref={(node) => {
                            searchInputRefs.current[dataIndex] = node;
                        }}
                        placeholder={`ค้นหา ${title}`}
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{marginBottom: 8, display: "block"}}
                    />
                    <Space>
                        <Button type="primary" icon={<SearchOutlined/>} size="small"
                                onClick={() => confirm()}>ค้นหา</Button>
                        <Button size="small" onClick={() => {
                            clearFilters?.();
                            confirm({closeDropdown: true});
                        }}>รีเซ็ต</Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered) => <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>,
            onFilter: (value, record) => {
                const raw = record[dataIndex];
                if (raw === null || raw === undefined) return false;
                if (dataIndex === "date") return dayjs(raw).format(DATE_FORMAT).includes(String(value));
                return String(raw).toLowerCase().includes(String(value).toLowerCase());
            },
            filterDropdownProps: {
                onOpenChange: (visible) => {
                    if (visible) setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
                }
            },
        }),
        []
    );

    //** การทำงาน: กำหนดคอลัมน์ของตาราง */
    const columns = useMemo<ColumnsType<TimesheetEntry>>(
        () => [
            {
                title: "วันที่",
                dataIndex: "date",
                width: 140,
                defaultSortOrder: "descend",
                sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
                render: (v) => dayjs(v).format(DATE_FORMAT), ...getColumnSearchProps("date", "วันที่")
            },
            {
                title: "ชื่อโปรเจ็ค",
                dataIndex: "project_name",
                sorter: (a, b) => a.project_name.localeCompare(b.project_name), ...getColumnSearchProps("project_name", "ชื่อโปรเจ็ค")
            },
            {
                title: "ชื่อฟีเจอร์",
                dataIndex: "feature_name",
                render: (v) => v || "-",
                sorter: (a, b) => (a.feature_name ?? "").localeCompare(b.feature_name ?? ""), ...getColumnSearchProps("feature_name", "ชื่อฟีเจอร์")
            },
            {
                title: "สถานะ", dataIndex: "status", sorter: (a, b) => a.status.localeCompare(b.status),
                render: (value: string) => {
                    const option = STATUS_OPTIONS.find((item) => item.value === value);
                    const label = option ? (i18next.language === "th" ? option.label_th : option.label_en) : value;
                    return <Tag color={statusColorMap[value] ?? "default"}>{label}</Tag>;
                },
                ...getColumnSearchProps("status", "สถานะ"),
            },
            {
                title: "ชั่วโมง",
                dataIndex: "hours",
                align: "right",
                sorter: (a, b) => a.hours - b.hours,
                render: (v) => <Typography.Text>{v || 0}</Typography.Text>, ...getColumnSearchProps("hours", "ชั่วโมง")
            },
            {
                title: "คำอธิบาย",
                dataIndex: "description",
                render: (v) => v || "-",
                sorter: (a, b) => (a.description ?? "").localeCompare(b.description ?? ""), ...getColumnSearchProps("description", "คำอธิบาย")
            },
            {
                title: "จัดการ", key: "actions", fixed: "right", width: 160,
                render: (_, record) => (
                    <Space size="middle">
                        <Button type="text" icon={<EyeOutlined/>} onClick={() => handleOpenDetail(record)}/>
                        <Button type="text" icon={<EditOutlined/>} onClick={() => handleOpenEdit(record)}/>
                        <Button type="text" icon={<CopyOutlined/>} onClick={() => handleOpenCopy(record)}/>
                    </Space>
                ),
            },
        ],
        [getColumnSearchProps]
    );

    const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
        selectedRowKeys,
        onChange: (keys) => dispatch(setSelectedRowKeys(keys)),
    };

    return (
        <Table<TimesheetEntry>
            rowKey="id"
            columns={columns}
            dataSource={entries}
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
                current: currentPage,
                pageSize,
                total: totalItems,
                onChange: (page, size) => dispatch(setPagination({page, pageSize: size})),
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100, 500, 1000, 5000, 10000],
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            }}
            scroll={{x: 1000}}
            title={() => <Typography.Title level={5}>การลงเวลาทำงาน</Typography.Title>}
            extra={() => (
                <TableActions
                    onRefresh={onRefresh}
                    onAdd={handleOpenCreate}
                    onDelete={handleOpenDelete}
                    selectedCount={selectedRowKeys.length}
                    loading={actionLoading}
                    refreshLoading={loading}
                />
            )}
        />
    );
};

export default TimesheetTable;

