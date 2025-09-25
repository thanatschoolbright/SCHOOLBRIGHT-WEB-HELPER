"use client";
import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import type { Key } from "react";
import { FiCheckCircle, FiTrash2, FiInfo } from "react-icons/fi";
import dayjs from "dayjs";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { convertToThaiDateDDMMYYY } from "@helpers/convert-time-zone-to-thai";
import { Project, SubProject, WorkEntryForm, UserProfile } from "@stores/type";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  TableProps,
  Descriptions,
  Skeleton,
  Select,
  DatePicker,
  Dropdown,
} from "antd";
import {
  BarChartOutlined,
  PieChartOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useTranslation } from "react-i18next";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import axios from "axios";
import { getUserData } from "@/helpers/local_storage/user.storage";
import { GraphTimesheetModal } from "@/components/modal/graph-timesheet-modal-component";
import { PieTimesheetModal } from "@/components/modal/pie-timesheet-modal-component";
import { utils, writeFile } from "xlsx";
import type { TimesheetMode } from "@/components/modal/graph-timesheet-modal-component";
import type { MenuProps } from "antd";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

const getStatusColor = (status: string) => {
  switch (status) {
    case "DONE":
      return "green";
    case "IN_PROGRESS":
      return "orange";
    case "REVIEW":
      return "blue";
    case "CANCELLED":
      return "red";
    case "DRAFT":
    default:
      return "default";
  }
};

const getHourTagColor = (hours: number) => {
  if (hours >= 8) {
    return "red";
  } else if (hours < 4) {
    return "green";
  } else {
    return "yellow";
  }
};

export default function Page() {
  const { i18n } = useTranslation("mock");

  const [antdForm] = Form.useForm();
  const [workHours, setWorkHours] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<string>("");
  const [detailProject, setDetailProject] = useState<WorkEntryForm>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [rawTimesheetData, setRawTimesheetData] = useState<any[]>([]);
  const [exporting, setExporting] = useState<boolean>(false);
  const [graphMode, setGraphMode] = useState<TimesheetMode>("week");
  const [pieMode, setPieMode] = useState<TimesheetMode>("week");

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record: any) => ({
      disabled: !!record.children,
    }),
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/v1/timesheet/project/read/",
        { limit: 50, page: currentPage },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = response.data;
      setProjects(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const groupEntriesByDate = (entries: any[]) => {
    const groupedObj: Record<string, any[]> = entries.reduce((acc, item) => {
      const dateKey = dayjs(item.date).format("YYYY-MM-DD");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(groupedObj).map(([date, children]) => ({
      key: date,
      date,
      children,
      totalHours: children.reduce(
        (sum, child) => sum + Number(child.hours || 0),
        0
      ),
    }));
  };

  const fetchTimesheetEntry = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/v1/timesheet/entry/read/", {
        limit: pageSize,
        page: currentPage,
      });

      const rawEntries = response.data?.data || [];

      const groupedData = groupEntriesByDate(rawEntries);
      setRawTimesheetData(rawEntries);
      setEntries(groupedData);
      setTotalPages(response.data?.pagination?.total_pages || 1);
      setTotalItems(response.data?.pagination?.total || 0);
      setPageSize(response.data?.pagination?.page_size || 10);
    } catch (error) {
      console.error("Error fetching timesheet entries:", error);
      setEntries([]);
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allUsers = getUserData();
    if (allUsers) {
      setUsers(allUsers);
    }
    fetchTimesheetEntry();
    fetchProjects();
  }, [currentPage, pageSize]);

  const getUserById = (id: string | number) => {
    return users.find((user) => String(user.admin_id) === String(id));
  };

  const statusLabelMap = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] =
        i18n.language === "th" ? option.label_th : option.label_en;
      return acc;
    }, {});
  }, [i18n.language]);

  const handleExportAll = async () => {
    try {
      setExporting(true);
      const response = await axios.post("/api/v1/timesheet/entry/read/", {
        limit: 10000,
        page: 1,
      });

      const allEntries = response.data?.data ?? [];

      if (!allEntries.length) {
        toast.info("ไม่มีข้อมูลสำหรับส่งออก", {
          duration: 3000,
          position: "top-right",
        });
        return;
      }

      const dataset = allEntries.map((entry: any) => {
        const user = getUserById(entry.created_by);
        return {
          วันที่: entry.date ? dayjs(entry.date).format("DD/MM/YYYY") : "-",
          ชื่อโปรเจ็ค: entry.project_name ?? "-",
          ชื่อฟีเจอร์: entry.feature_name ?? "-",
          ชื่อผู้จัดทำ: user
            ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || "-"
            : "-",
          สถานะ: statusLabelMap[entry.status] ?? entry.status ?? "-",
          ชั่วโมง: Number(entry.hours ?? 0),
          คำอธิบาย: entry.description ?? "-",
        };
      });

      const worksheet = utils.json_to_sheet(dataset);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Timesheet");

      const filename = `timesheet-report-${dayjs().format(
        "YYYYMMDD-HHmmss"
      )}.xlsx`;
      writeFile(workbook, filename);

      toast.success("ส่งออกข้อมูลสำเร็จ", {
        duration: 3000,
        position: "top-right",
      });
    } catch (error: any) {
      console.error("handleExportAll", error);
      toast.error("ส่งออกข้อมูลล้มเหลว", {
        description: error?.message ?? "Unexpected error",
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setExporting(false);
    }
  };

  const timeModeItems = useMemo(
    () => [
      { key: "today", label: "วันนี้" },
      { key: "week", label: "สัปดาห์นี้" },
      { key: "month", label: "เดือนนี้" },
      { key: "year", label: "ปีนี้" },
    ],
    []
  );

  const handleOpenGraph: MenuProps["onClick"] = ({ key }) => {
    setGraphMode(key as TimesheetMode);
    setModal("graph");
  };

  const handleOpenPie: MenuProps["onClick"] = ({ key }) => {
    setPieMode(key as TimesheetMode);
    setModal("pie");
  };

  const columns = [
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      align: "left" as const,
      editable: true,
      render: (date: string, record: any) => {
        if (record.children) {
          return (
            <Typography.Text strong>
              {dayjs(date).format("DD/MM/YYYY")}
            </Typography.Text>
          );
        }
        return date ? dayjs(date).format("DD/MM/YYYY") : "";
      },
      sorter: (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: "ชื่อโปรเจ็ค",
      dataIndex: "project_name",
      key: "project_name",
      align: "left" as const,
      editable: true,
      sorter: (a: any, b: any) => a.project_name.localeCompare(b.project_name),
      filters: projects
        .map((p) => ({ text: p.name, value: p.name }))
        .filter((v, i, arr) => arr.findIndex((x) => x.value === v.value) === i),
      onFilter: (value: boolean | Key, record: any) =>
        record.project_name === value,
    },
    {
      title: "ชื่อฟีเจอร์",
      dataIndex: "feature_name",
      key: "feature_name",
      align: "left" as const,
      editable: true,
      render: (_: any, record: any) =>
        record.feature_name || record.feature_name,
      sorter: (a: any, b: any) =>
        (a.feature_name || "").localeCompare(b.feature_name || ""),
    },
    {
      title: "ชื่อผู้จัดทำ",
      dataIndex: "created_by",
      key: "created_by",
      align: "left" as const,
      editable: false,
      render: (_: any, record: any) => {
        const user = getUserById(record.created_by);
        return (
          <>
            {user?.firstname} {user?.lastname}
          </>
        );
      },
      sorter: (a: any, b: any) =>
        String(a.created_by || 0).localeCompare(String(b.created_by || "")),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      align: "left" as const,
      editable: true,
      render: (status: string) => {
        const option = STATUS_OPTIONS.find((opt) => opt.value === status);
        const label = option
          ? i18n.language === "th"
            ? option.label_th
            : option.label_en
          : status;
        return <Tag color={getStatusColor(status)}>{label}</Tag>;
      },
      filters: STATUS_OPTIONS.map((opt) => ({
        text: i18n.language === "th" ? opt.label_th : opt.label_en,
        value: opt.value,
      })),
      onFilter: (value: boolean | Key, record: any) => record.status === value,
    },
    {
      title: "ชั่วโมง",
      dataIndex: "hours",
      key: "hours",
      align: "left" as const,
      editable: true,
      sorter: (a: any, b: any) => Number(a.hours) - Number(b.hours),
      render: (hours: string | number, record: any) => {
        if (record.children) {
          return <Space></Space>;
        }
        const value = Number(hours);
        return <Tag color={getHourTagColor(value)}>{value}</Tag>;
      },
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      align: "left" as const,
      editable: true,
      width: 350,
      sorter: (a: any, b: any) =>
        (a.description || "").localeCompare(b.description || ""),
    },
    {
      title: "จัดการ",
      key: "action",
      fixed: "right" as const,
      align: "center" as const,
      render: (_: any, record: any) => {
        if (record.children) {
          return <Space />;
        }
        return (
          <Space>
            <Tooltip title="ดูรายละเอียด">
              <Button
                size="small"
                icon={<FiInfo />}
                onClick={() => {
                  setDetailProject(record);
                  setModal("detail");
                }}
                aria-label="View Details"
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        {/* Timesheet Graph Component */}
        <GraphTimesheetModal
          open={modal === "graph"}
          onClose={() => setModal("")}
          data={rawTimesheetData}
          mode={graphMode}
        />
        {/* Timesheet Graph Component */}
        <PieTimesheetModal
          open={modal === "pie"}
          onClose={() => setModal("")}
          data={rawTimesheetData}
          mode={pieMode}
        />

        <div className="w-full space-y-4">
          <Card title="รายการลงเวลาทำงาน" className="w-full">
            {/* Action Buttons */}
            <div className="w-full flex justify-end mb-4">
              <Space size="middle">
                <Dropdown
                  menu={{ items: timeModeItems, onClick: handleOpenGraph }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <Tooltip title="เลือกช่วงเวลาของกราฟแท่ง">
                    <Button
                      type="primary"
                      shape="round"
                      icon={<BarChartOutlined />}
                      size="large"
                    >
                      กราฟแท่ง
                    </Button>
                  </Tooltip>
                </Dropdown>
                <Dropdown
                  menu={{ items: timeModeItems, onClick: handleOpenPie }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <Tooltip title="เลือกช่วงเวลาของกราฟวงกลม">
                    <Button
                      type="primary"
                      shape="round"
                      icon={<PieChartOutlined />}
                      size="large"
                    >
                      กราฟวงกลม
                    </Button>
                  </Tooltip>
                </Dropdown>
                <Tooltip title="ส่งออกทั้งหมด">
                  <Button
                    type="primary"
                    shape="round"
                    icon={<ExportOutlined />}
                    size="large"
                    onClick={handleExportAll}
                    loading={exporting}
                  >
                    Export
                  </Button>
                </Tooltip>
              </Space>
            </div>

            <div className="flex justify-end mb-3"></div>
            <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
              <Table
                columns={columns}
                dataSource={entries}
                rowSelection={rowSelection}
                rowKey={(record: any) => record.id ?? record.key}
                pagination={{
                  current: currentPage,
                  total: totalItems,
                  pageSize: pageSize,
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    if (size && size !== pageSize) {
                      setPageSize(size);
                    }
                  },
                  onShowSizeChange: (current, size) => {
                    setPageSize(size);
                    setCurrentPage(current);
                  },
                  showSizeChanger: true,
                  pageSizeOptions: [10, 20, 50, 100, 500, 1000, 5000, 10000],
                }}
                bordered
                scroll={{ x: "max-content" }}
                style={{ overflowX: "auto" }}
                expandable={{ defaultExpandAllRows: true }}
              />
            </Skeleton>
          </Card>
          <Modal
            open={modal === "detail"}
            onCancel={() => setModal("")}
            title="รายละเอียดการลงเวลาทำงาน"
            footer={[
              <Button key="close" type="default" onClick={() => setModal("")}>
                ปิด
              </Button>,
            ]}
          >
            {detailProject && (
              <div className="mt-5">
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item label="รหัส">
                    {detailProject.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="รหัสโปรเจค">
                    {detailProject.project_id ?? detailProject.id}
                  </Descriptions.Item>
                  {detailProject.feature_id && (
                    <Descriptions.Item label="รหัสฟีเจอร์">
                      {detailProject.feature_id}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="คำอธิบาย">
                    <Typography.Text style={{ fontSize: 16 }}>
                      {detailProject.description || "-"}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    <Tag color={getStatusColor(detailProject.status)}>
                      {detailProject.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="ชั่วโมง">
                    <Tag color={getHourTagColor(Number(detailProject.hours))}>
                      {detailProject.hours}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="สร้างเมื่อ">
                    {dayjs(detailProject.created_at).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label="แก้ไขล่าสุด">
                    {dayjs(detailProject.updated_at).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Modal>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
