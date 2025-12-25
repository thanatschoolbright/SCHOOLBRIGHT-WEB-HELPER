"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  Typography,
  Space,
  Tag,
  theme,
  Divider,
  Button,
  Skeleton,
  Select,
  DatePicker,
  Row,
  Col,
  Tooltip,
  message,
} from "antd";
import {
  RocketOutlined,
  ClockCircleOutlined,
  TagOutlined,
  DownOutlined,
  UpOutlined,
  LinkOutlined,
  GithubOutlined,
  SyncOutlined,
  BugFilled,
  ThunderboltFilled,
  ToolFilled,
  FilterFilled,
  ClearOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
  UserOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween";
import DashboardLayout from "@/components/layouts/backend-layout";

dayjs.extend(buddhistEra);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.locale("th");

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/Jabjai-Corporation/meta-version/main/version-control.tag.json";
const BACKLOG_URL_PREFIX = "https://jabjai.backlog.com/view/";

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

// --- Helper: Extract Impact Scope ---
const extractImpactScope = (text: string) => {
  const schoolRegex = /(รร\.|โรงเรียน|School)\s?([^\)\n\|]+)/g;
  const matches = [...text.matchAll(schoolRegex)];

  if (matches.length > 0) {
    const schools = [...new Set(matches.map(m => m[0].trim()))];
    return schools;
  }

  if (text.includes("ทุกโรงเรียน") || text.includes("All Schools")) {
    return ["All Schools"];
  }

  return [];
};

// --- Enhanced Markdown Parser ---
const renderMarkdownContent = (text: string) => {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, index) => {
    const lineKey = `line-${index}`;

    // 1. Headers
    if (line.startsWith("#")) {
      const level = line.match(/^#+/)?.[0].length || 0;
      const content = line.replace(/^#+\s*/, "");
      const fontSize = level === 1 ? 20 : level === 2 ? 18 : 16;
      return (
        <Typography.Title
          key={lineKey}
          level={5}
          style={{
            fontSize,
            marginTop: 16,
            marginBottom: 8,
            color: level === 1 ? "#1677ff" : "inherit",
          }}
        >
          {content}
        </Typography.Title>
      );
    }

    // 2. Lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = line.trim().substring(2);
      return (
        <div
          key={lineKey}
          style={{ display: "flex", gap: 8, marginLeft: 8, marginBottom: 4 }}
        >
          <span style={{ color: "#faad14" }}>•</span>
          <Typography.Text>{parseInlineStyles(content, index)}</Typography.Text>
        </div>
      );
    }

    // 3. Table Rows
    if (line.trim().startsWith("|")) {
      if (line.includes("---")) return null;
      const cols = line.split("|").filter((c) => c.trim() !== "");
      return (
        <div
          key={lineKey}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
            gap: 8,
            background: "#fafafa",
            padding: "6px 12px",
            borderBottom: "1px solid #f0f0f0",
            fontSize: 13,
          }}
        >
          {cols.map((col, i) => (
            <div key={`${lineKey}-col-${i}`}>{parseInlineStyles(col.trim(), index * 100 + i)}</div>
          ))}
        </div>
      );
    }

    // 4. Normal Text
    if (line.trim() === "") return <br key={lineKey} />;

    return (
      <div key={lineKey} style={{ marginBottom: 4 }}>
        {parseInlineStyles(line, index)}
      </div>
    );
  });
};

const parseInlineStyles = (text: string, lineIndex: number) => {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const boldRegex = /\*\*([^\*]+)\*\*/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const ticketRegex = /((SBAPP|SB|ACC|CT)-(\d+))/g;

  let parts: (string | JSX.Element)[] = [text];

  const processPattern = (
    regex: RegExp,
    replacer: (match: RegExpMatchArray, index: number) => JSX.Element
  ) => {
    const newParts: (string | JSX.Element)[] = [];
    parts.forEach((part, partIndex) => {
      if (typeof part !== "string") {
        newParts.push(part);
        return;
      }
      let lastIndex = 0;
      const matches = [...part.matchAll(regex)];
      if (matches.length === 0) {
        newParts.push(part);
        return;
      }
      matches.forEach((match, matchIndex) => {
        const index = match.index!;
        if (index > lastIndex) newParts.push(part.substring(lastIndex, index));
        newParts.push(replacer(match, parseInt(`${lineIndex}${partIndex}${matchIndex}`)));
        lastIndex = index + match[0].length;
      });
      if (lastIndex < part.length) newParts.push(part.substring(lastIndex));
    });
    parts = newParts;
  };

  processPattern(boldRegex, (match, i) => (
    <strong key={`bold-${i}`} style={{ color: "#262626" }}>
      {match[1]}
    </strong>
  ));

  processPattern(ticketRegex, (match, i) => (
    <a
      key={`ticket-${i}`}
      href={`${BACKLOG_URL_PREFIX}${match[0]}`}
      target="_blank"
      rel="noreferrer"
      style={{
        color: "#d4380d",
        fontWeight: 600,
        background: "#fff2e8",
        padding: "0 4px",
        borderRadius: 4,
        border: "1px solid #ffbb96",
        marginRight: 4,
      }}
    >
      <TagOutlined style={{ marginRight: 2 }} />
      {match[0]}
    </a>
  ));

  processPattern(urlRegex, (match, i) => (
    <a
      key={`url-${i}`}
      href={match[0]}
      target="_blank"
      rel="noreferrer"
      style={{ color: "#1677ff" }}
    >
      {match[0]} <LinkOutlined style={{ fontSize: 10 }} />
    </a>
  ));

  return parts;
};

const ReleaseCard: React.FC<{ item: GitHubReleaseItem; isLatest: boolean }> = ({
  item,
  isLatest,
}) => {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(isLatest);
  const [messageApi, contextHolder] = message.useMessage();

  const hasBugFix = item.notes.toLowerCase().includes("bug");
  const hasFeature = item.notes.toLowerCase().includes("feature");
  const hasImprovement = item.notes.toLowerCase().includes("improvement");

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`Version: ${item.tag}\n\n${item.notes}`);
    messageApi.success("คัดลอกรายละเอียดเรียบร้อย");
  };

  return (
    <>
      {contextHolder}
      <Card
        variant="outlined"
        style={{
          borderRadius: 16,
          boxShadow: isLatest ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
          border: `1px solid ${isLatest ? token.colorPrimaryBorder : token.colorBorderSecondary
            }`,
          background: token.colorBgContainer,
          overflow: "hidden",
          transition: "all 0.3s ease",
          marginBottom: 24,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          onClick={() => !isLatest && setExpanded(!expanded)}
          style={{
            padding: "16px 24px",
            background: isLatest
              ? `linear-gradient(90deg, ${token.colorFillQuaternary} 0%, ${token.colorBgContainer} 100%)`
              : token.colorBgContainer,
            borderBottom: expanded
              ? `1px solid ${token.colorBorderSecondary}`
              : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            cursor: isLatest ? "default" : "pointer",
          }}
        >
          <Space size="middle" align="center">
            {!isLatest && (
              <div style={{ color: token.colorTextTertiary, fontSize: 12 }}>
                {expanded ? <UpOutlined /> : <DownOutlined />}
              </div>
            )}

            <Tag
              color={isLatest ? "blue" : "default"}
              style={{
                fontSize: 14,
                padding: "4px 10px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <TagOutlined /> {item.tag}
            </Tag>

            <Typography.Text strong style={{ fontSize: 16 }}>
              {item.title && item.title !== item.tag
                ? item.title
                : `เวอร์ชัน ${item.tag}`}
            </Typography.Text>

            {isLatest && <Tag color="#f50">ล่าสุด (LATEST)</Tag>}

            {!isLatest && !expanded && (
              <Space size={4}>
                {hasBugFix && (
                  <Tag color="error" bordered={false}>
                    <BugFilled /> แก้บั๊ก
                  </Tag>
                )}
                {hasFeature && (
                  <Tag color="success" bordered={false}>
                    <ThunderboltFilled /> ฟีเจอร์ใหม่
                  </Tag>
                )}
                {hasImprovement && (
                  <Tag color="warning" bordered={false}>
                    <ToolFilled /> ปรับปรุง
                  </Tag>
                )}
              </Space>
            )}
          </Space>

          <Space>
            <Tooltip title="วันที่ปล่อยอัปเดต">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: token.colorTextSecondary,
                }}
              >
                <ClockCircleOutlined />
                <Typography.Text type="secondary">
                  {/* ✅ Fixed: Display Date and Time */}
                  {dayjs(item.release_date).format("D MMM BBBB • HH:mm น.")}
                </Typography.Text>
              </div>
            </Tooltip>

            <Tooltip title="ก๊อปปี้รายละเอียดไปตอบลูกค้า">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                size="small"
              />
            </Tooltip>
          </Space>
        </div>

        {expanded && (
          <div
            style={{ padding: "24px", animation: "fadeIn 0.3s ease-in-out" }}
          >
            <div
              style={{
                marginBottom: 20,
                padding: 12,
                background: token.colorFillQuaternary,
                borderRadius: 8,
                border: `1px solid ${token.colorBorderSecondary}`,
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                alignItems: "center",
              }}
            >
              <Space>
                <GithubOutlined style={{ color: token.colorTextTertiary }} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Author:
                </Typography.Text>
                <span style={{ fontWeight: 500 }}>{item.author}</span>
              </Space>

              <Divider type="vertical" />

              <Space>
                <SafetyCertificateOutlined
                  style={{ color: token.colorTextTertiary }}
                />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Environment:
                </Typography.Text>
                <Tooltip
                  title={
                    item.type === "production"
                      ? "ใช้งานจริง (Live) - ลูกค้าเห็นการเปลี่ยนแปลง"
                      : "ทดสอบ (Test) - เฉพาะภายใน"
                  }
                >
                  <Tag
                    color={item.type === "production" ? "green" : "orange"}
                    style={{ cursor: "help", margin: 0 }}
                  >
                    {item.type.toUpperCase()}{" "}
                    <InfoCircleOutlined style={{ fontSize: 10 }} />
                  </Tag>
                </Tooltip>
              </Space>
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: token.colorText,
                background: "#fff",
                padding: 0,
              }}
            >
              {renderMarkdownContent(item.notes)}
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export const GitHubReleaseNotes: React.FC = () => {
  const { token } = theme.useToken();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GitHubReleaseItem[]>([]);

  // --- Filter States ---
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);os

  const fetchReleaseNotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get<GitHubReleaseItem[]>(GITHUB_RAW_URL);
      const sortedData = response.data.sort(
        (a, b) =>
          new Date(b.release_date).getTime() -
          new Date(a.release_date).getTime()
      );
      setData(sortedData);
    } catch (error) {
      console.error("Failed to fetch release notes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleaseNotes();
  }, []);

  const systemOptions = useMemo(
    () =>
      [...new Set(data.map((item) => item.system))].map((v) => ({
        label: v,
        value: v,
      })),
    [data]
  );
  const typeOptions = useMemo(
    () =>
      [...new Set(data.map((item) => item.type))].map((v) => ({
        label: v.toUpperCase(),
        value: v,
      })),
    [data]
  );
  const authorOptions = useMemo(
    () =>
      [...new Set(data.map((item) => item.author))].map((v) => ({
        label: v,
        value: v,
      })),
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedSystem && item.system !== selectedSystem) return false;
      if (selectedType && item.type !== selectedType) return false;
      if (selectedAuthor && item.author !== selectedAuthor) return false;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const itemDate = dayjs(item.release_date);
        const startDate = dateRange[0].startOf("day");
        const endDate = dateRange[1].endOf("day");
        if (!itemDate.isBetween(startDate, endDate, "day", "[]")) return false;
      }
      return true;
    });
  }, [data, selectedSystem, selectedType, selectedAuthor, dateRange]);

  const handleClearFilters = () => {
    setSelectedSystem(null);
    setSelectedType(null);
    setSelectedAuthor(null);
    setDateRange(null);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 0" }}>
        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Header */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div style={{ position: "absolute", left: 0, top: 0 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                type="text"
              >
                ย้อนกลับ
              </Button>
            </div>
            <div style={{ textAlign: "center" }}>
              <Typography.Title level={2} style={{ marginBottom: 8 }}>
                <RocketOutlined
                  style={{ color: token.colorPrimary, marginRight: 12 }}
                />
                บันทึกการอัปเดตระบบ
              </Typography.Title>
              <Typography.Text type="secondary">
                ติดตามรายการเปลี่ยนแปลง เวอร์ชันล่าสุด และประวัติการแก้ไขทั้งหมด
              </Typography.Text>
            </div>
          </div>

          {/* Filter Section */}
          <Card
            size="small"
            style={{
              borderRadius: 16,
              background: token.colorFillQuaternary,
              border: "none",
              marginBottom: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              animation: "slideDown 0.5s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FilterFilled style={{ color: token.colorPrimary }} />
                <Typography.Text strong style={{ fontSize: 16 }}>
                  ตัวกรองข้อมูล
                </Typography.Text>
              </div>
              <Space>
                <Button
                  icon={<ClearOutlined />}
                  size="middle"
                  onClick={handleClearFilters}
                  disabled={
                    !selectedSystem &&
                    !selectedType &&
                    !selectedAuthor &&
                    !dateRange
                  }
                >
                  ล้างค่า
                </Button>
                <Button
                  type="primary"
                  icon={<SyncOutlined spin={loading} />}
                  size="middle"
                  onClick={fetchReleaseNotes}
                >
                  รีเฟรช
                </Button>
              </Space>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Select
                  placeholder={
                    <Space>
                      <AppstoreOutlined
                        style={{ color: token.colorTextTertiary }}
                      />{" "}
                      <span>เลือกระบบ (System)</span>
                    </Space>
                  }
                  size="large"
                  style={{ width: "100%" }}
                  allowClear
                  options={systemOptions}
                  value={selectedSystem}
                  onChange={setSelectedSystem}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>
              <Col xs={24} sm={12}>
                <Select
                  placeholder={
                    <Space>
                      <TagOutlined style={{ color: token.colorTextTertiary }} />{" "}
                      <span>ประเภท (Type)</span>
                    </Space>
                  }
                  size="large"
                  style={{ width: "100%" }}
                  allowClear
                  options={typeOptions}
                  value={selectedType}
                  onChange={setSelectedType}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Select
                  placeholder={
                    <Space>
                      <UserOutlined
                        style={{ color: token.colorTextTertiary }}
                      />{" "}
                      <span>ผู้แก้ไข (Author)</span>
                    </Space>
                  }
                  size="large"
                  style={{ width: "100%" }}
                  allowClear
                  options={authorOptions}
                  value={selectedAuthor}
                  onChange={setSelectedAuthor}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>
              <Col xs={24} sm={12}>
                <DatePicker.RangePicker
                  placeholder={["วันที่เริ่ม", "วันที่สิ้นสุด"]}
                  size="large"
                  style={{ width: "100%" }}
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD/MM/BBBB"
                  separator={
                    <span style={{ color: token.colorTextTertiary }}>→</span>
                  }
                  suffixIcon={
                    <CalendarOutlined
                      style={{ color: token.colorTextTertiary }}
                    />
                  }
                />
              </Col>
            </Row>
          </Card>

          {/* Content */}
          {loading && (
            <>
              <Card style={{ borderRadius: 16, marginBottom: 16 }}>
                <Skeleton active avatar paragraph={{ rows: 4 }} />
              </Card>
              <Card style={{ borderRadius: 16 }}>
                <Skeleton active avatar paragraph={{ rows: 4 }} />
              </Card>
            </>
          )}

          {!loading &&
            filteredData.map((release, index) => (
              <ReleaseCard
                key={`${release.tag}-${index}`}
                item={release}
                isLatest={release.tag === data[0].tag}
              />
            ))}

          {!loading && filteredData.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: token.colorTextSecondary,
              }}
            >
              <FilterFilled
                style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}
              />
              <br />
              <Typography.Text style={{ fontSize: 16 }}>
                ไม่พบข้อมูลตามเงื่อนไขที่กำหนด
              </Typography.Text>
              <br />
              <Button
                type="link"
                onClick={handleClearFilters}
                style={{ marginTop: 8 }}
              >
                ล้างตัวกรองทั้งหมด
              </Button>
            </div>
          )}

          {!loading && filteredData.length > 0 && (
            <Divider style={{ marginTop: 32 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                แสดงผล {filteredData.length} จากทั้งหมด {data.length} รายการ
              </Typography.Text>
            </Divider>
          )}
        </Space>
      </div>
    </DashboardLayout>
  );
};

export default GitHubReleaseNotes;