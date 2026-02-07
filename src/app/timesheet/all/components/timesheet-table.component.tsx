"use client";

import { fetchUserRanking } from "@/services/timesheet/find-ranking.service";
import {
  GET_PROJECTS,
  GET_SUB_PROJECTS_BY_PROJECT,
} from "@/services/timesheet/timesheet-all.service";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ProjectOutlined,
  RocketOutlined,
  SolutionOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Collapse,
  DatePicker,
  Empty,
  Flex,
  InputNumber,
  Modal,
  Progress,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  theme,
  Timeline,
  Typography,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import axios from "axios";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SummaryMetadata, SummaryRecord } from "../types/timesheet.types";
import {
  buildFullName,
  formatBreakdown,
  formatNickname,
  getPositionColor,
} from "../utils/timesheet.helpers";
import { StatusBadge } from "./status-badge.component";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

type TimesheetTableProps = {
  records: SummaryRecord[];
  loading: boolean;
  metadata?: SummaryMetadata | null;
  onRefetch?: () => void;
  autoFillOpen?: boolean;
  onAutoFillClose?: () => void;
};

export const TimesheetTable: React.FC<TimesheetTableProps> = ({
  records,
  loading,
  metadata,
  onRefetch,
  autoFillOpen,
  onAutoFillClose,
}) => {
  const { t } = useTranslation("translate");
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";

  // --- States ---
  const [filteredInfo, setFilteredInfo] = useState<
    Record<string, (string | number)[] | null>
  >({});
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | number>();
  const [selectedRange, setSelectedRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([dayjs().startOf("month"), dayjs()]);
  const [manualHours, setManualHours] = useState<number | null>(null);
  const [autoFillProgress, setAutoFillProgress] = useState<any[]>([]);
  const [rankingMap, setRankingMap] = useState<Record<string, any>>({});
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [selectedEngine, setSelectedEngine] = useState<"gemini" | "chatgpt">(
    "gemini",
  );
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryResults, setSummaryResults] = useState<any[]>([]);

  // --- New States for Project/Feature Selection ---
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [subProjectsList, setSubProjectsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>();
  const [selectedSubProjectId, setSelectedSubProjectId] = useState<number>();
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [subProjectsLoading, setSubProjectsLoading] = useState(false);

  // --- Memos ---
  const userOptions = useMemo(
    () =>
      records.map((rec) => ({
        label: `${buildFullName(rec)} ${formatNickname(rec.nickname)} ${
          rec.employee_code ? `(${rec.employee_code})` : ""
        }`,
        value: rec.admin_id,
      })),
    [records],
  );

  const expectedHoursPerDay = useMemo(() => {
    if (metadata?.expected_hours_per_member && metadata?.working_days) {
      return metadata.expected_hours_per_member / metadata.working_days;
    }
    return 8;
  }, [metadata]);

  // --- Load projects on open ---
  useEffect(() => {
    if (autoFillOpen && projectsList.length === 0) {
      loadProjects();
    }
  }, [autoFillOpen, projectsList.length]);

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const data = await GET_PROJECTS({ limit: 100, page: 1 });
      setProjectsList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadSubProjects = async (pid: number) => {
    setSubProjectsLoading(true);
    try {
      const data = await GET_SUB_PROJECTS_BY_PROJECT(pid);
      setSubProjectsList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSubProjectsLoading(false);
    }
  };

  const handleProjectChange = (pid: number) => {
    setSelectedProjectId(pid);
    setSelectedSubProjectId(undefined);
    setSubProjectsList([]);
    loadSubProjects(pid);
  };

  // --- Ranking Loader ---
  useEffect(() => {
    /**
     * ดึงข้อมูลการจัดอันดับของพนักงานตามช่วงเดือนและปีของรายงาน
     */
    const requestUserRankingList = async () => {
      if (!metadata || !records.length) return;
      const month = dayjs(metadata.range.start_date).format("MM");
      const year = dayjs(metadata.range.start_date).format("YYYY");
      try {
        const entries = await Promise.all(
          records.map(async (rec) => {
            try {
              const res = await fetchUserRanking({
                user_id: rec.admin_id,
                month,
                year,
                scope: "elapsed",
              });
              return {
                id: String(rec.admin_id),
                rank: res.record?.rank ?? null,
                description: res.record?.rank_description ?? null,
              };
            } catch {
              return {
                id: String(rec.admin_id),
                rank: null,
                description: null,
              };
            }
          }),
        );
        const map: any = {};
        entries.forEach((item) => {
          map[item.id] = { rank: item.rank, description: item.description };
        });
        setRankingMap(map);
      } catch (e) {
        console.error(e);
      }
    };
    requestUserRankingList();
  }, [metadata, records]);

  // --- Handlers ---
  const handleTableChange: TableProps<SummaryRecord>["onChange"] = (
    _pagination,
    filters,
  ) => {
    setFilteredInfo(filters as Record<string, (string | number)[] | null>);
  };

  /**
   * บันทึกข้อมูลไทม์ชีทอัตโนมัติตามเงื่อนไขที่ผู้ใช้งานระบุ (Auto-fill)
   */
  const requestAutoFillTimesheet = async () => {
    if (!metadata) return toast.error("ไม่พบข้อมูลช่วงวันที่");
    if (!selectedUser) return toast.error("กรุณาเลือกผู้ใช้");
    const [start, end] = selectedRange;
    if (!start || !end) return toast.error("กรุณาเลือกช่วงวันที่");

    setAutoFillLoading(true);
    try {
      const summaryResponse = await axios.post(
        "/api/v1/timesheet/entry/check/summary",
        {
          start_date: start.format("YYYY-MM-DD"),
          end_date: end.format("YYYY-MM-DD"),
        },
      );

      const userRecord = summaryResponse.data?.data?.records?.find(
        (rec: any) => String(rec.admin_id) === String(selectedUser),
      );

      if (!userRecord) throw new Error("ไม่พบข้อมูลผู้ใช้งานในระบบ");

      const tasks: { date: string; hours: number }[] = [];
      let current = start.startOf("day");
      const last = end.startOf("day");

      while (current.isBefore(last, "day") || current.isSame(last, "day")) {
        if (current.day() > 0 && current.day() < 6) {
          const dateStr = current.format("YYYY-MM-DD");
          const existingHours =
            userRecord.breakdown.find((b: any) => b.date === dateStr)?.hours ||
            0;
          const hoursToFill =
            start.isSame(end, "day") && manualHours !== null
              ? manualHours
              : Math.max(0, expectedHoursPerDay - existingHours);

          if (hoursToFill > 0)
            tasks.push({ date: dateStr, hours: hoursToFill });
        }
        current = current.add(1, "day");
      }

      if (tasks.length === 0) {
        toast.info("ไม่มีข้อมูลที่ต้องอัปเดตเพิ่มเติม");
        onAutoFillClose?.();
        return;
      }

      setAutoFillProgress(
        tasks.map((t) => ({
          label: `${t.date} (${t.hours} ชม.)`,
          status: "wait",
          details: null,
        })),
      );

      const results: any[] = [];

      for (let i = 0; i < tasks.length; i++) {
        setAutoFillProgress((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "process" } : item,
          ),
        );

        // Step 1: Reviewing history
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulating review time

        const response = await axios.post(
          "/api/v1/timesheet/entry/automate-fill",
          {
            user_id: selectedUser,
            hours: tasks[i].hours,
            date: [tasks[i].date],
            engine: selectedEngine,
            projectId: selectedProjectId,
            subProjectId: selectedSubProjectId,
          },
        );

        const createdData = response.data?.data?.items?.[0];
        if (createdData) {
          results.push(createdData);
        }

        setAutoFillProgress((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "finish",
                  details: createdData
                    ? `กรอก: ${createdData.description} (Project: ${createdData.project}, Feature: ${createdData.feature})`
                    : "บันทึกสำเร็จ",
                }
              : item,
          ),
        );
      }

      setSummaryResults(results);
      setSummaryModalOpen(true);
      onRefetch?.();
      onAutoFillClose?.();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      setAutoFillLoading(false);
    }
  };

  // --- Column Definitions ---
  const columns: ColumnsType<SummaryRecord> = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "rank",
        width: 60,
        align: "center",
        fixed: "left",
        render: (rank: number) => (
          <Text
            strong
            style={{
              color: token.colorTextDescription,
              opacity: 0.6,
              fontSize: 13,
            }}
          >
            {rank.toString().padStart(2, "0")}
          </Text>
        ),
      },
      {
        title: "พนักงาน",
        key: "name",
        width: 300,
        fixed: "left",
        render: (_value, record) => (
          <Flex align="center" gap={12}>
            <div style={{ position: "relative" }}>
              <Avatar
                src={record.image_profile}
                size={44}
                style={{
                  border: `2px solid ${token.colorBorderSecondary}`,
                  background: record.image_profile
                    ? token.colorBgContainer
                    : getAvatarColor(record.full_name || ""),
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {!record.image_profile && record.full_name?.charAt(0)}
              </Avatar>
              {record.completion_rate >= 100 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    background: token.colorSuccess,
                    borderRadius: "50%",
                    width: 14,
                    height: 14,
                    border: `2px solid ${token.colorBgContainer}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrophyOutlined style={{ color: "#fff", fontSize: 8 }} />
                </div>
              )}
            </div>
            <Flex vertical gap={0}>
              <Text
                strong
                style={{
                  fontSize: 15,
                  lineHeight: 1.3,
                  color: token.colorTextHeading,
                }}
              >
                {buildFullName(record)}
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 11, color: token.colorTextDescription }}
              >
                {formatNickname(record.nickname)} •{" "}
                {record.employee_code || "JD-XXXX"}
              </Text>
            </Flex>
          </Flex>
        ),
      },
      {
        title: "ตำแหน่ง",
        dataIndex: "position",
        key: "position",
        width: 140,
        filters: Array.from(new Set(records.map((rec) => rec.position))).map(
          (pos) => ({ text: pos, value: pos }),
        ),
        onFilter: (value, record) => record.position === value,
        render: (position: string) => (
          <Tag
            color={getPositionColor(position)}
            variant="borderless"
            style={{
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              padding: "0 8px",
            }}
          >
            {position}
          </Tag>
        ),
      },
      {
        title: "แผนก",
        dataIndex: "department",
        key: "department",
        width: 150,
        filters: Array.from(new Set(records.map((rec) => rec.department))).map(
          (dept) => ({ text: dept, value: dept }),
        ),
        onFilter: (value, record) => record.department === value,
        render: (dept: string) => (
          <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
            {dept || "-"}
          </Text>
        ),
      },
      {
        title: "เวลาทำงาน",
        key: "hours",
        width: 160,
        render: (_, record) => (
          <Flex vertical gap={2}>
            <Flex align="baseline" gap={4}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color:
                    record.total_hours >= record.required_hours
                      ? token.colorSuccess
                      : token.colorWarning,
                }}
              >
                {record.total_hours}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                / {record.required_hours} ชม.
              </Text>
            </Flex>
            <Text
              type="secondary"
              style={{ fontSize: 10, textTransform: "uppercase", opacity: 0.6 }}
            >
              ชั่วโมงที่ต้องกรอก
            </Text>
          </Flex>
        ),
      },
      {
        title: "ความคืบหน้า",
        dataIndex: "completion_rate",
        key: "completion_rate",
        width: 220,
        render: (percent) => {
          const isDone = percent >= 100;
          return (
            <Flex vertical gap={6}>
              <Flex justify="space-between" align="end">
                <Text
                  strong
                  style={{
                    fontSize: 13,
                    color: isDone ? token.colorSuccess : token.colorPrimary,
                  }}
                >
                  {percent.toFixed(1)}%
                </Text>
              </Flex>
              <Progress
                percent={Number(percent.toFixed(1))}
                size={{ height: 8 }}
                strokeColor={{
                  "0%": isDone ? token.colorSuccess : token.colorPrimary,
                  "100%": isDone
                    ? addAlpha(token.colorSuccess, 0.7)
                    : token.colorInfo,
                }}
                showInfo={false}
                trailColor={token.colorFillTertiary}
                strokeLinecap="round"
              />
            </Flex>
          );
        },
      },
      {
        title: "ระดับผลงาน",
        key: "grade",
        align: "center",
        width: 120,
        render: (_value, record) => (
          <StatusBadge
            completionRate={record.completion_rate}
            rank={rankingMap[String(record.admin_id)]?.rank}
            description={rankingMap[String(record.admin_id)]?.description}
          />
        ),
      },
      {
        title: "สถานะ",
        dataIndex: "status_label",
        key: "status_label",
        width: 150,
        render: (status: string, record) => {
          const isWarning = record.hours_gap > 0;
          return (
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background: addAlpha(
                  isWarning ? token.colorError : token.colorSuccess,
                  0.05,
                ),
                border: `1px solid ${addAlpha(
                  isWarning ? token.colorError : token.colorSuccess,
                  0.15,
                )}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                className={!isWarning ? "animate-pulse" : ""}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isWarning ? token.colorError : token.colorSuccess,
                  boxShadow: isWarning
                    ? "none"
                    : `0 0 8px ${token.colorSuccess}`,
                }}
              />
              <Text
                strong
                style={{
                  fontSize: 11,
                  color: isWarning ? token.colorError : token.colorSuccess,
                }}
              >
                {status}
              </Text>
            </div>
          );
        },
      },
      {
        title: "",
        key: "action",
        width: 80,
        fixed: "right",
        render: (_: any, record: SummaryRecord) => (
          <Button
            type="text"
            icon={<FileTextOutlined />}
            onClick={() => {
              setCurrentRecord(record);
              setDetailsModalOpen(true);
            }}
            style={{
              color: token.colorTextSecondary,
            }}
          />
        ),
      },
    ],
    [records, rankingMap, token],
  );

  const getAvatarColor = (name: string) => {
    const colors = [
      "#f5222d",
      "#fa541c",
      "#fa8c16",
      "#faad14",
      "#fadb14",
      "#a0d911",
      "#52c41a",
      "#13c2c2",
      "#1890ff",
      "#2f54eb",
      "#722ed1",
      "#eb2f96",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const addAlpha = (color: string, alpha: number) => {
    if (color.startsWith("#")) {
      let hex = color.slice(1);
      if (hex.length === 3)
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  };

  return (
    <>
      <Table<SummaryRecord>
        rowKey={(record) => String(record.admin_id)}
        columns={columns}
        dataSource={records}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        expandable={{
          expandedRowRender: (record) => (
            <div className="p-4 mx-4 mb-4 rounded-xl border border-dashed border-gray-500 border-opacity-20 bg-gray-500 bg-opacity-5">
              <Flex align="center" gap={8} className="mb-3">
                <InfoCircleOutlined className="text-blue-500" />
                <Text strong className="text-xs uppercase tracking-widest">
                  รายละเอียดเวลาการทำงาน
                </Text>
              </Flex>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
                {formatBreakdown(record.breakdown).map((text, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[12px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-sm shadow-blue-500" />
                    <Text type="secondary">{text}</Text>
                  </div>
                ))}
              </div>
            </div>
          ),
          rowExpandable: (record) => record.breakdown.length > 0,
        }}
        pagination={{
          pageSize: 100,
          showSizeChanger: true,
          className: "px-4 pb-4",
          showTotal: (total) => (
            <Text type="secondary" className="text-xs">
              พบข้อมูลพนักงานทั้งหมด {total} รายการ
            </Text>
          ),
        }}
      />

      {/* Automation Modal - Redesigned to Tracking Style */}
      <Modal
        title={
          <Flex align="center" gap={12} style={{ paddingBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 20,
              }}
            >
              <RocketOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                ส่งข้อมูลไทม์ชีทอัตโนมัติ
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ระบบจะทำการจัดส่งข้อมูลของคุณไปยังคลาวด์โดยตรง
              </Text>
            </div>
          </Flex>
        }
        open={autoFillOpen}
        onOk={requestAutoFillTimesheet}
        onCancel={() => {
          setSelectedProjectId(undefined);
          setSelectedSubProjectId(undefined);
          setSubProjectsList([]);
          onAutoFillClose?.();
        }}
        confirmLoading={autoFillLoading}
        width={540}
        centered
        footer={!autoFillLoading ? undefined : null}
        maskClosable={!autoFillLoading}
        closable={!autoFillLoading}
        styles={{
          body: { padding: "8px 4px 24px" },
        }}
      >
        <Space direction="vertical" size={24} className="w-full">
          {!autoFillLoading ? (
            <div className="space-y-6">
              <section>
                <Flex align="center" gap={8} className="mb-3">
                  <div
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      background: addAlpha(token.colorPrimary, 0.1),
                      color: token.colorPrimary,
                    }}
                  >
                    <UserOutlined />
                  </div>
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    1. เลือกผู้รับการทำรายการ
                  </Text>
                </Flex>
                <Select
                  className="w-full"
                  placeholder="ค้นหาชื่อหรือรหัสพนักงาน..."
                  options={userOptions}
                  value={selectedUser}
                  onChange={setSelectedUser}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  size="large"
                  style={{ borderRadius: 12 }}
                />
              </section>

              <section>
                <Flex align="center" gap={8} className="mb-3">
                  <div
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      background: addAlpha(token.colorPrimary, 0.1),
                      color: token.colorPrimary,
                    }}
                  >
                    <EnvironmentOutlined />
                  </div>
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    2. กำหนดปลายทาง (ช่วงวันที่)
                  </Text>
                </Flex>
                <RangePicker
                  className="w-full"
                  size="large"
                  format="DD/MM/YYYY"
                  value={selectedRange}
                  onChange={(r) => setSelectedRange(r ?? [null, null])}
                  style={{ borderRadius: 12 }}
                />
              </section>

              <section>
                <Flex align="center" gap={8} className="mb-3">
                  <div
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      background: addAlpha(token.colorPrimary, 0.1),
                      color: token.colorPrimary,
                    }}
                  >
                    <ProjectOutlined />
                  </div>
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    3. เลือกโปรเจกต์เป้าหมาย
                  </Text>
                </Flex>
                <Select
                  className="w-full"
                  placeholder="เลือกโปรเจกต์..."
                  loading={projectsLoading}
                  options={projectsList.map((p) => ({
                    label: p.name,
                    value: p.id,
                  }))}
                  value={selectedProjectId}
                  onChange={handleProjectChange}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  size="large"
                  style={{ borderRadius: 12 }}
                />
              </section>

              <section>
                <Flex align="center" gap={8} className="mb-3">
                  <div
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      background: addAlpha(token.colorPrimary, 0.1),
                      color: token.colorPrimary,
                    }}
                  >
                    <SolutionOutlined />
                  </div>
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    4. เลือกฟีเจอร์ (Feature)
                  </Text>
                </Flex>
                <Select
                  className="w-full"
                  placeholder="เลือกฟีเจอร์..."
                  loading={subProjectsLoading}
                  disabled={!selectedProjectId}
                  options={subProjectsList.map((f) => ({
                    label: f.name,
                    value: f.id,
                  }))}
                  value={selectedSubProjectId}
                  onChange={setSelectedSubProjectId}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  size="large"
                  style={{ borderRadius: 12 }}
                />
              </section>

              {selectedRange[0]?.isSame(selectedRange[1], "day") && (
                <section className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Flex align="center" gap={8} className="mb-3">
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 8,
                        background: addAlpha(token.colorPrimary, 0.1),
                        color: token.colorPrimary,
                      }}
                    >
                      <ClockCircleOutlined />
                    </div>
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      5. ระบุปริมาณงาน (ชั่วโมง)
                    </Text>
                  </Flex>
                  <InputNumber
                    className="w-full"
                    placeholder="ใส่จำนวนชั่วโมง เช่น 8"
                    min={0}
                    max={24}
                    value={manualHours}
                    onChange={(v) => setManualHours(v)}
                    size="large"
                    style={{ borderRadius: 12 }}
                  />
                </section>
              )}

              <section>
                <Flex align="center" gap={8} className="mb-3">
                  <div
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      background: addAlpha(token.colorPrimary, 0.1),
                      color: token.colorPrimary,
                    }}
                  >
                    <ThunderboltOutlined />
                  </div>
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    6. เลือกเครื่องยนต์ AI (Engine)
                  </Text>
                </Flex>
                <Select
                  className="w-full"
                  value={selectedEngine}
                  onChange={setSelectedEngine}
                  size="large"
                  style={{ borderRadius: 12 }}
                  options={[
                    {
                      label: (
                        <Space>
                          <Badge status="processing" color="#10a37f" />
                          <Text>ChatGPT (GPT-4o mini)</Text>
                        </Space>
                      ),
                      value: "chatgpt",
                    },
                    {
                      label: (
                        <Space>
                          <Badge status="processing" color="#4285f4" />
                          <span>Gemini (Google)</span>
                        </Space>
                      ),
                      value: "gemini",
                    },
                  ]}
                />
              </section>
            </div>
          ) : (
            <div className="py-2">
              <div
                className="p-6 rounded-2xl border border-solid mb-6"
                style={{
                  background: isDark
                    ? addAlpha(token.colorPrimary, 0.05)
                    : addAlpha(token.colorPrimary, 0.02),
                  borderColor: addAlpha(token.colorPrimary, 0.1),
                }}
              >
                <Flex align="center" gap={16}>
                  <div className="relative">
                    <Progress
                      type="circle"
                      percent={Math.round(
                        (autoFillProgress.filter((p) => p.status === "finish")
                          .length /
                          autoFillProgress.length) *
                          100,
                      )}
                      size={80}
                      strokeWidth={10}
                      strokeColor={{
                        "0%": token.colorPrimary,
                        "100%": token.colorInfo,
                      }}
                    />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 18, display: "block" }}>
                      กำลังจัดส่งข้อมูล...
                    </Text>
                    <Text type="secondary">
                      {
                        autoFillProgress.filter((p) => p.status === "finish")
                          .length
                      }{" "}
                      จาก {autoFillProgress.length} รายการ
                    </Text>
                  </div>
                </Flex>
              </div>

              <div
                style={{ maxHeight: 400, overflowY: "auto", paddingRight: 8 }}
              >
                <Steps
                  direction="vertical"
                  size="small"
                  className="tracking-steps"
                  items={autoFillProgress.map((item, idx) => ({
                    title: (
                      <Flex align="center" gap={8}>
                        <Text
                          strong
                          style={{
                            fontSize: 14,
                            color:
                              item.status === "process"
                                ? token.colorPrimary
                                : item.status === "finish"
                                  ? token.colorSuccess
                                  : "inherit",
                          }}
                        >
                          รายการวัน
                          {
                            [
                              "อาทิตย์",
                              "จันทร์",
                              "อังคาร",
                              "พุธ",
                              "พฤหัสบดี",
                              "ศุกร์",
                              "เสาร์",
                            ][dayjs(item.label.split(" ")[0]).day()]
                          }
                          ที่{" "}
                          {dayjs(item.label.split(" ")[0]).format("DD/MM/YYYY")}{" "}
                          จำนวน {item.label.match(/\((\d+)\sชม\.\)/)?.[1] || 8}{" "}
                          ชั่วโมง
                        </Text>
                        {item.status === "process" && (
                          <Badge
                            status="processing"
                            text="กำลังดำเนินการ"
                            style={{ fontSize: 10 }}
                          />
                        )}
                      </Flex>
                    ),
                    description: (
                      <div className="flex flex-col gap-1 py-1">
                        <Flex align="center" gap={6}>
                          <Text
                            type="secondary"
                            style={{ fontSize: 11, display: "block" }}
                          >
                            {item.status === "wait" && "⏳ รอคิวจัดทำข้อมูล..."}
                            {item.status === "process" &&
                              "🔍 ระบบกำลังดูประวัติการกรอกข้อมูลของผู้ใช้งาน..."}
                          </Text>
                        </Flex>
                        {item.details && (
                          <div
                            style={{
                              padding: "10px 14px",
                              background: isDark
                                ? "rgba(255,255,255,0.03)"
                                : "rgba(0,0,0,0.015)",
                              borderRadius: 12,
                              marginTop: 6,
                              borderLeft: `3px solid ${token.colorSuccess}`,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            }}
                          >
                            <Space direction="vertical" size={2}>
                              <Text
                                strong
                                style={{
                                  fontSize: 10,
                                  color: token.colorSuccess,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                สำเร็จ: รายละเอียดข้อมูลที่ลงบันทึก
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  lineHeight: "1.6",
                                  display: "block",
                                }}
                              >
                                {item.details}
                              </Text>
                            </Space>
                          </div>
                        )}
                        {item.status === "finish" && !item.details && (
                          <Text type="success" style={{ fontSize: 11 }}>
                            ✅ ข้อมูลเข้าสู่ระบบเรียบร้อย
                          </Text>
                        )}
                      </div>
                    ),
                    status: item.status as any,
                    icon:
                      item.status === "finish" ? (
                        <CheckCircleOutlined
                          style={{
                            color: token.colorSuccess,
                            fontSize: 18,
                          }}
                        />
                      ) : item.status === "process" ? (
                        <div className="animate-pulse">
                          <RocketOutlined
                            style={{
                              color: token.colorPrimary,
                              fontSize: 18,
                            }}
                          />
                        </div>
                      ) : (
                        <ClockCircleOutlined
                          style={{
                            color: token.colorTextQuaternary,
                            fontSize: 16,
                          }}
                        />
                      ),
                  }))}
                />
              </div>
            </div>
          )}
        </Space>
      </Modal>

      {/* Summary Success Modal */}
      <Modal
        title={
          <Flex align="center" gap={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: token.colorSuccessBg,
                color: token.colorSuccess,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              <CheckCircleOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                ส่งข้อมูลไทม์ชีทสำเร็จแล้ว
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                สรุปรายการที่คุณบันทึกผ่าน AI (
                {selectedEngine === "chatgpt" ? "ChatGPT" : "Gemini"})
              </Text>
            </div>
          </Flex>
        }
        open={summaryModalOpen}
        onOk={() => setSummaryModalOpen(false)}
        onCancel={() => setSummaryModalOpen(false)}
        width={1000}
        centered
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setSummaryModalOpen(false)}
            shape="round"
            size="large"
            style={{ minWidth: 150 }}
          >
            เสร็จสิ้น
          </Button>,
        ]}
      >
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              padding: "20px 24px",
              background: isDark
                ? "rgba(82, 196, 26, 0.1)"
                : "rgba(82, 196, 26, 0.05)",
              borderRadius: 16,
              border: `1px solid ${addAlpha(token.colorSuccess, 0.2)}`,
              marginBottom: 24,
            }}
          >
            <Flex justify="space-between" align="center">
              <Space size={16}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: token.colorSuccess,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 24,
                    boxShadow: `0 4px 12px ${addAlpha(token.colorSuccess, 0.4)}`,
                  }}
                >
                  <CheckCircleOutlined />
                </div>
                <div>
                  <Text strong style={{ fontSize: 16, display: "block" }}>
                    ดำเนินการบันทึกข้อมูลสำเร็จเรียบร้อยแล้ว
                  </Text>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    พบรายการที่บันทึกทั้งหมด {summaryResults.length} รายการ (รวม{" "}
                    {summaryResults.reduce(
                      (sum, item) => sum + (item.hour || 0),
                      0,
                    )}{" "}
                    ชั่วโมง)
                  </Text>
                </div>
              </Space>
              <Tag
                color="success"
                bordered={false}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Engine:{" "}
                {selectedEngine === "chatgpt" ? "GPT-4o mini" : "Gemini Pro"}
              </Tag>
            </Flex>
          </div>

          <div
            className="summary-table-container"
            style={{
              maxHeight: 500,
              overflowY: "auto",
              borderRadius: 12,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Table
              dataSource={summaryResults}
              rowKey="id"
              pagination={false}
              size="middle"
              columns={[
                {
                  title: "#",
                  key: "index",
                  width: 60,
                  align: "center",
                  render: (_text, _record, index) => (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {index + 1}
                    </Text>
                  ),
                },
                {
                  title: "วัน/เวลาที่บันทึก",
                  dataIndex: "date",
                  key: "date",
                  width: 280,
                  render: (date, record) => (
                    <div style={{ padding: "4px 0" }}>
                      <Text strong style={{ fontSize: 14, display: "block" }}>
                        รายการวัน
                        {
                          [
                            "อาทิตย์",
                            "จันทร์",
                            "อังคาร",
                            "พุธ",
                            "พฤหัสบดี",
                            "ศุกร์",
                            "เสาร์",
                          ][dayjs(date).day()]
                        }
                        ที่ {dayjs(date).format("DD/MM/YYYY")}
                      </Text>
                      <Tag
                        color="blue"
                        style={{
                          margin: "4px 0 0 0",
                          borderRadius: 4,
                          fontSize: 11,
                        }}
                      >
                        จำนวน {record.hour || 8} ชั่วโมง
                      </Tag>
                    </div>
                  ),
                },
                {
                  title: "โครงการ / ฟีเจอร์",
                  key: "project",
                  width: 250,
                  render: (_, record) => (
                    <Space direction="vertical" size={4}>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: token.colorPrimary,
                          }}
                        />
                        <Text strong style={{ fontSize: 12 }}>
                          {record.project}
                        </Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: token.colorInfo,
                          }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {record.feature}
                        </Text>
                      </div>
                    </Space>
                  ),
                },
                {
                  title: "รายละเอียดสิ่งที่ลงบันทึก",
                  key: "description",
                  render: (_, record) => (
                    <div
                      style={{
                        padding: "8px 12px",
                        background: isDark
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(0,0,0,0.01)",
                        borderRadius: 8,
                        border: `1px dashed ${token.colorBorder}`,
                      }}
                    >
                      <Text style={{ fontSize: 13, lineHeight: "1.6" }}>
                        {record.description}
                      </Text>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={
          <Flex align="center" gap={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: addAlpha(token.colorPrimary, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: token.colorPrimary,
                fontSize: 20,
              }}
            >
              <FileTextOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                รายละเอียดการบันทึกเวลา
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {currentRecord &&
                  `${buildFullName(currentRecord)} (${formatNickname(
                    currentRecord.nickname,
                  )})`}
              </Text>
            </div>
          </Flex>
        }
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={null}
        width={1000}
        centered
      >
        <div
          style={{ maxHeight: "70vh", overflowY: "auto", padding: "24px 40px" }}
        >
          {!currentRecord?.entries || currentRecord.entries.length === 0 ? (
            <Empty description="ไม่มีประวัติการบันทึกเวลา" />
          ) : (
            <Timeline
              items={currentRecord.entries.map((entry: any, index: number) => {
                const isBacklogObject =
                  entry.backlogDescription &&
                  typeof entry.backlogDescription === "object";
                const backlogNote = isBacklogObject
                  ? entry.backlogDescription.note
                  : null;
                const backlogsList = isBacklogObject
                  ? entry.backlogDescription.backlogs
                  : [];

                return {
                  color: entry.hours >= 8 ? "green" : "orange",
                  children: (
                    <div style={{ paddingBottom: 20 }}>
                      <Flex align="center" gap={12} style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 14 }}>
                          {dayjs(entry.date).format("DD MMM YYYY")}
                        </Text>
                        <Tag
                          color={entry.hours >= 8 ? "success" : "warning"}
                          style={{ margin: 0 }}
                        >
                          {entry.hours} ชม.
                        </Tag>
                      </Flex>

                      <div
                        style={{
                          padding: "16px",
                          background: token.colorBgContainer,
                          border: `1px solid ${token.colorBorderSecondary}`,
                          borderRadius: 12,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        }}
                      >
                        <Space
                          direction="vertical"
                          size={12}
                          style={{ width: "100%" }}
                        >
                          <Flex gap={8} wrap="wrap">
                            <Tag color="geekblue" style={{ margin: 0 }}>
                              Project: {entry.project_name}
                            </Tag>
                            <Tag color="cyan" style={{ margin: 0 }}>
                              Feature: {entry.feature_name}
                            </Tag>
                          </Flex>
                          {entry.description ? (
                            <div style={{ wordBreak: "break-word" }}>
                              <Text style={{ fontSize: 14 }}>
                                {entry.description}
                              </Text>
                            </div>
                          ) : (
                            <Text type="secondary" italic>
                              No description
                            </Text>
                          )}

                          {(backlogNote ||
                            (backlogsList && backlogsList.length > 0)) && (
                            <Collapse
                              size="small"
                              ghost
                              items={[
                                {
                                  key: "1",
                                  label: (
                                    <Space>
                                      <InfoCircleOutlined
                                        style={{ color: token.colorInfo }}
                                      />
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: 13 }}
                                      >
                                        รายละเอียดงาน (Backlog)
                                      </Text>
                                    </Space>
                                  ),
                                  children: (
                                    <div style={{ paddingLeft: 8 }}>
                                      {backlogNote && (
                                        <div style={{ marginBottom: 8 }}>
                                          <Text
                                            strong
                                            style={{
                                              fontSize: 12,
                                              display: "block",
                                            }}
                                          >
                                            Note:
                                          </Text>
                                          <Text
                                            type="secondary"
                                            style={{
                                              fontSize: 12,
                                              whiteSpace: "pre-line",
                                            }}
                                          >
                                            {backlogNote}
                                          </Text>
                                        </div>
                                      )}
                                      {backlogsList &&
                                        backlogsList.length > 0 && (
                                          <div>
                                            <Text
                                              strong
                                              style={{
                                                fontSize: 12,
                                                display: "block",
                                                marginBottom: 4,
                                              }}
                                            >
                                              Ref Links:
                                            </Text>
                                            <ul
                                              style={{
                                                paddingLeft: 20,
                                                margin: 0,
                                              }}
                                            >
                                              {backlogsList.map(
                                                (bg: any, idx: number) => (
                                                  <li
                                                    key={idx}
                                                    style={{
                                                      fontSize: 12,
                                                      marginBottom: 4,
                                                    }}
                                                  >
                                                    {bg.link ? (
                                                      <a
                                                        href={bg.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                          display: "flex",
                                                          alignItems: "center",
                                                          gap: 4,
                                                        }}
                                                      >
                                                        <LinkOutlined />{" "}
                                                        {bg.title || "Link"}
                                                      </a>
                                                    ) : (
                                                      <Text type="secondary">
                                                        {bg.title || "-"}
                                                      </Text>
                                                    )}
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          </div>
                                        )}
                                    </div>
                                  ),
                                },
                              ]}
                            />
                          )}
                        </Space>
                      </div>
                    </div>
                  ),
                };
              })}
            />
          )}
        </div>
      </Modal>
    </>
  );
};
