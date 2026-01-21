"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  Typography,
  Space,
  Tag,
  theme,
  Button,
  Row,
  Col,
  Table,
  Input,
  DatePicker,
  Select,
  Tooltip,
  Flex,
  Divider,
  Modal,
} from "antd";
import { toast } from "sonner";
import {
  RocketOutlined,
  ClockCircleOutlined,
  TagOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UserOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  LinkOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween";
import { useSearchParams } from "next/navigation";

// Components
import DashboardLayout from "@/components/layouts/backend-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import SummaryCard from "@/components/card/summary-card";

const { Title, Text } = Typography;

// Setup Dayjs
dayjs.extend(buddhistEra);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.locale("th");

// Constants
const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/Jabjai-Corporation/meta-version/main/version-control.tag.json";
const BACKLOG_URL_PREFIX = "https://jabjai.backlog.com/view/";

// Types
interface GitHubReleaseItem {
  system: string;
  tag: string;
  title: string;
  release_date: string;
  type: string;
  notes: string;
  author: string;
  synced_at: string;
}

/**
 * หน้าแสดงรายการบันทึกการอัปเดตระบบ (GitHub Release Notes)
 * รวมข้อมูลการอัปเดตล่าสุด ฟิลเตอร์ และสถิติภาพรวม
 */
export default function ReleaseNotesPage() {
  const { token } = theme.useToken();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- State ---
  const [loading, setLoading] = useState<boolean>(true);
  const [rawData, setRawData] = useState<GitHubReleaseItem[]>([]); // ข้อมูลดั้งเดิมจาก API
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRelease, setSelectedRelease] =
    useState<GitHubReleaseItem | null>(null);

  /**
   * ฟังก์ชันดึงข้อมูล Release Notes จาก GitHub
   */
  const requestFetchReleaseNotes = useCallback(async () => {
    const toastId = toast.loading("กำลังดึงข้อมูล Release Notes...");
    setLoading(true);
    try {
      const response = await axios.get<GitHubReleaseItem[]>(GITHUB_RAW_URL);
      const sortedData = response.data.sort(
        (a, b) =>
          new Date(b.release_date).getTime() -
          new Date(a.release_date).getTime(),
      );
      setRawData(sortedData);
      toast.success("ดึงข้อมูลสำเร็จ", { id: toastId });
    } catch (error) {
      console.error("Failed to fetch release notes:", error);
      toast.error("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestFetchReleaseNotes();
  }, [requestFetchReleaseNotes]);

  /**
   * จัดการ Deep Linking เมื่อเปิดผ่านกระเป๋าลิงก์
   */
  useEffect(() => {
    if (rawData.length > 0) {
      const tag = searchParams.get("tag");
      const system = searchParams.get("system");
      if (tag && system) {
        const match = rawData.find((r) => r.tag === tag && r.system === system);
        if (match) {
          setSelectedRelease(match);
          setIsModalVisible(true);
        }
      }
    }
  }, [rawData, searchParams]);

  /**
   * แปลงชื่อระบบเป็นภาษาไทย
   */
  const responseGetSystemNameTH = (systemName: string) => {
    const map: Record<string, string> = {
      "schoolbright-sb-web-accounting": "บัญชี/การเงิน",
      "schoolbright-sb-web-system": "ข้อมูลบุคคล",
      "schoolbright-sb-api-mobile": "API Mobile",
      "schoolbright-sb-app-mobile": "App Mobile",
      "schoolbright-sb-web-canteen": "โรงอาหาร",
      "schoolbright-sb-web-library": "ห้องสมุด",
      "schoolbright-sb-web-exam": "คลังข้อสอบ",
      "schoolbright-sb-api-hardware": "API Hardware",
      "schoolbright-sb-web-helper": "Web Helper",
    };
    return map[systemName] || systemName.replace("schoolbright-sb-", "");
  };

  /**
   * คำนวณข้อมูลสถิติจากข้อมูลดั้งเดิม (Summary Cards)
   */
  const metrics = useMemo(() => {
    const total = rawData.length;
    const productionCount = rawData.filter(
      (item) => item.type === "production",
    ).length;
    const testCount = rawData.filter((item) => item.type === "test").length;
    const uniqueSystems = new Set(rawData.map((item) => item.system)).size;

    return [
      {
        title: "รายการทั้งหมด",
        value: total,
        subtitle: "ประวัติการอัปเดตทั้งหมด",
        icon: <HistoryOutlined />,
        color: token.colorPrimary,
        iconBg: `${token.colorPrimary}15`,
        percent: 100,
      },
      {
        title: "เวอร์ชันใช้งานจริง",
        value: productionCount,
        subtitle: "Production Environment",
        icon: <RocketOutlined />,
        color: token.colorSuccess,
        iconBg: `${token.colorSuccess}15`,
        percent: total > 0 ? (productionCount / total) * 100 : 0,
      },
      {
        title: "กำลังทดสอบ",
        value: testCount,
        subtitle: "Test / Beta Environment",
        icon: <SafetyCertificateOutlined />,
        color: token.colorWarning,
        iconBg: `${token.colorWarning}15`,
        percent: total > 0 ? (testCount / total) * 100 : 0,
      },
      {
        title: "ระบบที่รองรับ",
        value: uniqueSystems,
        subtitle: "จำนวน Modules ทั้งหมด",
        icon: <AppstoreOutlined />,
        color: token.colorInfo,
        iconBg: `${token.colorInfo}15`,
        percent: 100,
      },
    ];
  }, [rawData, token]);

  /**
   * กรองข้อมูลสำหรับแสดงผลในตาราง
   */
  const filteredData = useMemo(() => {
    return rawData.filter((item) => {
      const matchSearch =
        !searchValue ||
        item.tag.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.author.toLowerCase().includes(searchValue.toLowerCase());

      const matchSystem = !selectedSystem || item.system === selectedSystem;

      const matchDate =
        !dateRange?.[0] ||
        !dateRange?.[1] ||
        dayjs(item.release_date).isBetween(
          dateRange[0].startOf("day"),
          dateRange[1].endOf("day"),
          "day",
          "[]",
        );

      return matchSearch && matchSystem && matchDate;
    });
  }, [rawData, searchValue, selectedSystem, dateRange]);

  /**
   * ล้างค่าตัวกรองทั้งหมด
   */
  const responseHandleClearFilters = () => {
    setSearchValue("");
    setSelectedSystem(null);
    setDateRange(null);
  };

  /**
   * แสดง Modal รายละเอียด
   */
  const requestOpenDetailModal = (item: GitHubReleaseItem) => {
    setSelectedRelease(item);
    setIsModalVisible(true);
  };

  /**
   * ฟังก์ชันสำหรับแปลง Markdown อย่างง่ายเป็น HTML Component
   */
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: JSX.Element[] = [];

    let currentTableData: string[][] = [];
    let isInsideTable = false;

    const flushTable = () => {
      if (currentTableData.length > 0) {
        const header = currentTableData[0];
        const rows = currentTableData
          .slice(1)
          .filter((r) => !r.join("").includes("---"));

        elements.push(
          <div
            key={`table-${elements.length}`}
            style={{ overflowX: "auto", marginBottom: 16 }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <thead>
                <tr style={{ background: token.colorFillTertiary }}>
                  {header.map((cell, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "10px 12px",
                        border: `1px solid ${token.colorBorderSecondary}`,
                        textAlign: "left",
                        fontWeight: 600,
                      }}
                    >
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        style={{
                          padding: "10px 12px",
                          border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                      >
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        currentTableData = [];
      }
      isInsideTable = false;
    };

    const parseInline = (s: string) => {
      const parts: (string | JSX.Element)[] = [s];

      // Links [text](url)
      const processLinks = (input: (string | JSX.Element)[]) => {
        const result: (string | JSX.Element)[] = [];
        input.forEach((part) => {
          if (typeof part !== "string") {
            result.push(part);
            return;
          }
          const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
          let lastIdx = 0;
          let match;
          while ((match = regex.exec(part)) !== null) {
            if (match.index > lastIdx)
              result.push(part.substring(lastIdx, match.index));
            result.push(
              <a
                key={match.index}
                href={match[2]}
                target="_blank"
                rel="noreferrer"
                style={{ fontWeight: 600 }}
              >
                {match[1]}
              </a>,
            );
            lastIdx = regex.lastIndex;
          }
          if (lastIdx < part.length) result.push(part.substring(lastIdx));
        });
        return result;
      };

      // Bold **text**
      const processBold = (input: (string | JSX.Element)[]) => {
        const result: (string | JSX.Element)[] = [];
        input.forEach((part) => {
          if (typeof part !== "string") {
            result.push(part);
            return;
          }
          const regex = /\*\*([^\*]+)\*\*/g;
          let lastIdx = 0;
          let match;
          while ((match = regex.exec(part)) !== null) {
            if (match.index > lastIdx)
              result.push(part.substring(lastIdx, match.index));
            result.push(
              <strong key={match.index} style={{ fontWeight: 700 }}>
                {match[1]}
              </strong>,
            );
            lastIdx = regex.lastIndex;
          }
          if (lastIdx < part.length) result.push(part.substring(lastIdx));
        });
        return result;
      };

      return processBold(processLinks(parts));
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Table detection
      if (trimmed.startsWith("|")) {
        isInsideTable = true;
        const cells = line
          .split("|")
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          .map((c) => c.trim());
        currentTableData.push(cells);
        return;
      } else if (isInsideTable) {
        flushTable();
      }

      // Headers
      if (trimmed.startsWith("#")) {
        const level = (trimmed.match(/^#+/) || [""])[0].length;
        const text = trimmed.replace(/^#+\s*/, "");
        elements.push(
          <Title
            key={index}
            level={level as any}
            style={{ marginTop: 20, marginBottom: 12, fontWeight: 700 }}
          >
            {parseInline(text)}
          </Title>,
        );
        return;
      }

      // List
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        elements.push(
          <div
            key={index}
            style={{ display: "flex", gap: 10, marginBottom: 4, marginLeft: 8 }}
          >
            <span style={{ color: token.colorPrimary }}>•</span>
            <Text>{parseInline(trimmed.substring(2))}</Text>
          </div>,
        );
        return;
      }

      // Normal text
      if (trimmed === "") {
        elements.push(<div key={index} style={{ height: 12 }} />);
      } else {
        elements.push(
          <div key={index} style={{ marginBottom: 8, lineHeight: 1.6 }}>
            {parseInline(line)}
          </div>,
        );
      }
    });

    if (isInsideTable) flushTable();

    return elements;
  };

  // --- Table Configuration ---
  const columns = [
    {
      title: "เวอร์ชัน",
      dataIndex: "tag",
      key: "tag",
      width: 120,
      sorter: (a: GitHubReleaseItem, b: GitHubReleaseItem) =>
        a.tag.localeCompare(b.tag),
      render: (tag: string, record: GitHubReleaseItem) => (
        <Space direction="vertical" size={2}>
          <Tag
            color="blue"
            bordered={false}
            style={{ margin: 0, fontWeight: 600 }}
          >
            {tag}
          </Tag>
          {record.tag === rawData[0]?.tag && (
            <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>
              LATEST
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "ระบบ / รายละเอียด",
      key: "system",
      sorter: (a: GitHubReleaseItem, b: GitHubReleaseItem) =>
        a.system.localeCompare(b.system),
      render: (_: any, record: GitHubReleaseItem) => (
        <Space direction="vertical" size={4}>
          <Typography.Text strong style={{ fontSize: 14, fontWeight: 600 }}>
            {responseGetSystemNameTH(record.system)}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.title || "ไม่มีคำอธิบายเพิ่มเติม"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "ประเภท",
      dataIndex: "type",
      key: "type",
      width: 110,
      sorter: (a: GitHubReleaseItem, b: GitHubReleaseItem) =>
        a.type.localeCompare(b.type),
      render: (type: string) => (
        <Tag
          color={type === "production" ? "green" : "orange"}
          bordered={false}
        >
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "ผู้ดำเนินงาน",
      dataIndex: "author",
      key: "author",
      width: 140,
      sorter: (a: GitHubReleaseItem, b: GitHubReleaseItem) =>
        a.author.localeCompare(b.author),
      render: (author: string) => (
        <Space size={8}>
          <UserOutlined style={{ color: token.colorTextSecondary }} />
          <Typography.Text style={{ fontSize: 13 }}>{author}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "วันที่ปล่อยอัปเดต",
      dataIndex: "release_date",
      key: "release_date",
      width: 180,
      sorter: (a: GitHubReleaseItem, b: GitHubReleaseItem) =>
        new Date(a.release_date).getTime() - new Date(b.release_date).getTime(),
      defaultSortOrder: "descend" as const,
      render: (date: string) => (
        <Space size={8}>
          <ClockCircleOutlined style={{ color: token.colorTextTertiary }} />
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {dayjs(date).format("D MMM BBBB • HH:mm")}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "ดำเนินการ",
      key: "action",
      width: 280,
      fixed: "right" as const,
      render: (_: any, record: GitHubReleaseItem) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => requestOpenDetailModal(record)}
            style={{ borderRadius: 6 }}
          >
            ดูรายละเอียด
          </Button>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("system", record.system);
              url.searchParams.set("tag", record.tag);
              navigator.clipboard.writeText(url.toString());
              toast.success("คัดลอกลิงก์ไปยัง Release Content เรียบร้อยแล้ว");
            }}
            style={{ borderRadius: 6 }}
          >
            คัดลอกลิงก์
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ margin: "0 auto", paddingBottom: 40 }}>
        {/* ส่วนที่ 1: ส่วนหัวหน้าจอ */}
        <HeaderBar
          icon={<RocketOutlined />}
          title="Release Notes"
          subTitle="บันทึกรายการเปลี่ยนแปลงและประวัติการพัฒนาซอฟต์แวร์"
          showBackButton={true}
        />

        <Space direction="vertical" size={32} style={{ width: "100%" }}>
          {/* ส่วนที่ 2: สรุปข้อมูลภาพรวม (Summary Cards) */}
          <Row gutter={[24, 24]}>
            {metrics.map((m, idx) => (
              <Col xs={24} sm={12} md={6} key={idx}>
                <SummaryCard
                  {...m}
                  isLoading={loading}
                  tooltip={`ดูรายละเอียด ${m.title}`}
                />
              </Col>
            ))}
          </Row>

          {/* ส่วนที่ 3: ฟิลเตอร์ข้อมูล */}
          <Card
            styles={{ body: { padding: 24 } }}
            style={{
              borderRadius: 16,
              border: `1px solid ${token.colorBorderSecondary}`,
              boxShadow: token.boxShadowTertiary,
            }}
          >
            <Flex vertical gap={20}>
              <Space size={8}>
                <FilterOutlined
                  style={{ color: token.colorPrimary, fontSize: 18 }}
                />
                <Typography.Text
                  strong
                  style={{ fontSize: 16, fontWeight: 600 }}
                >
                  ตัวกรอง
                </Typography.Text>
              </Space>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Flex vertical gap={8}>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 13, fontWeight: 500 }}
                    >
                      ค้นหาคำสำคัญ (Tag, Notes, Author)
                    </Typography.Text>
                    <Input
                      placeholder="เช่น v1.0.0, แก้ไขบั๊ก, jabjai..."
                      prefix={
                        <SearchOutlined
                          style={{ color: token.colorTextDescription }}
                        />
                      }
                      size="large"
                      allowClear
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      style={{ borderRadius: 8 }}
                    />
                  </Flex>
                </Col>
                <Col xs={24} md={12}>
                  <Flex vertical gap={8}>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 13, fontWeight: 500 }}
                    >
                      เลือกระบบ / โมดูล
                    </Typography.Text>
                    <Select
                      placeholder="ทุกระบบ"
                      size="large"
                      allowClear
                      style={{ width: "100%", borderRadius: 8 }}
                      options={[...new Set(rawData.map((d) => d.system))].map(
                        (s) => ({
                          label: responseGetSystemNameTH(s),
                          value: s,
                        }),
                      )}
                      value={selectedSystem}
                      onChange={setSelectedSystem}
                    />
                  </Flex>
                </Col>
                <Col xs={24}>
                  <Flex vertical gap={8}>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 13, fontWeight: 500 }}
                    >
                      ช่วงวันที่ปล่อยอัปเดต
                    </Typography.Text>
                    <DatePicker.RangePicker
                      size="large"
                      style={{ width: "100%", borderRadius: 8 }}
                      value={dateRange}
                      onChange={(val) => setDateRange(val as any)}
                      format="DD/MM/BBBB"
                    />
                  </Flex>
                </Col>
              </Row>

              <Flex justify="flex-end" gap={12}>
                <Button
                  icon={<ClearOutlined />}
                  size="large"
                  onClick={responseHandleClearFilters}
                  style={{ borderRadius: 8, minWidth: 140 }}
                >
                  ล้างการค้นหา
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="large"
                  onClick={requestFetchReleaseNotes}
                  loading={loading}
                  style={{ borderRadius: 8, minWidth: 140 }}
                >
                  ค้นหาข้อมูล
                </Button>
              </Flex>
            </Flex>
          </Card>

          {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
          <Card
            styles={{ body: { padding: 16 } }}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {/* Table Header with Actions */}
            <Flex
              justify="space-between"
              align="center"
              style={{
                padding: "16px 24px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Typography.Text strong style={{ fontSize: 15, fontWeight: 600 }}>
                รายการการเปลี่ยนแปลง ({filteredData.length})
              </Typography.Text>
              <Space>
                <Button
                  icon={<TagOutlined />}
                  type="link"
                  onClick={() => window.open(GITHUB_RAW_URL, "_blank")}
                >
                  JSON Source
                </Button>
              </Space>
            </Flex>

            {/* Main Table */}
            <Table
              dataSource={filteredData}
              columns={columns}
              loading={loading}
              rowKey={(r, i) => `${r.tag}-${i}`}
              scroll={{ x: 1000 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                position: ["bottomCenter"],
              }}
              locale={{ emptyText: "ไม่พบข้อมูลการอัปเดต" }}
            />
          </Card>
        </Space>
      </div>

      {/* Detail Modal */}
      <Modal
        title={null}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 40 }}
        bodyStyle={{ padding: 0 }}
      >
        {selectedRelease && (
          <div>
            {/* Modal Header Overlay */}
            <div
              style={{
                padding: "24px 32px",
                background: token.colorFillAlter,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex justify="space-between" align="start">
                <Space direction="vertical" size={4}>
                  <Tag color="blue" bordered={false} style={{ margin: 0 }}>
                    Version {selectedRelease.tag}
                  </Tag>
                  <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                    {selectedRelease.title ||
                      `Release Note ${selectedRelease.tag}`}
                  </Title>
                  <Space split={<Divider type="vertical" />}>
                    <Text type="secondary">
                      <AppstoreOutlined />{" "}
                      {responseGetSystemNameTH(selectedRelease.system)}
                    </Text>
                    <Text type="secondary">
                      <UserOutlined /> {selectedRelease.author}
                    </Text>
                    <Text type="secondary">
                      <ClockCircleOutlined />{" "}
                      {dayjs(selectedRelease.release_date).format(
                        "D MMMM BBBB",
                      )}
                    </Text>
                  </Space>
                </Space>
                <Tag
                  color={
                    selectedRelease.type === "production" ? "green" : "orange"
                  }
                >
                  {selectedRelease.type.toUpperCase()}
                </Tag>
              </Flex>
            </div>

            {/* Markdown Content Section */}
            <div
              style={{ padding: "32px", maxHeight: "70vh", overflowY: "auto" }}
            >
              <Card
                styles={{ body: { padding: "24px 32px" } }}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                }}
              >
                {renderMarkdown(selectedRelease.notes)}
              </Card>
            </div>

            {/* Footer Action */}
            <div
              style={{
                padding: "16px 32px",
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                textAlign: "right",
              }}
            >
              <Button
                onClick={() => setIsModalVisible(false)}
                size="large"
                style={{ borderRadius: 8 }}
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
