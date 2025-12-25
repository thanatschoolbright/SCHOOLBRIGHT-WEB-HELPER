"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
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
  CheckCircleFilled,
  BugFilled,
  ThunderboltFilled,
  ToolFilled,
  FilterFilled,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween"; // Import isBetween plugin
import DashboardLayout from "@/components/layouts/backend-layout";

dayjs.extend(buddhistEra);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.locale("th");

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/Jabjai-Corporation/meta-version/main/sb-api-mobile.tag.json";

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

// --- Enhanced Markdown Parser ---
const renderMarkdownContent = (text: string) => {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, index) => {
    // 1. Headers
    if (line.startsWith("#")) {
      const level = line.match(/^#+/)?.[0].length || 0;
      const content = line.replace(/^#+\s*/, "");
      const fontSize = level === 1 ? 20 : level === 2 ? 18 : 16;
      return (
        <Typography.Title
          key={index}
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
          key={index}
          style={{ display: "flex", gap: 8, marginLeft: 8, marginBottom: 4 }}
        >
          <span style={{ color: "#faad14" }}>•</span>
          <Typography.Text>{parseInlineStyles(content)}</Typography.Text>
        </div>
      );
    }

    // 3. Table Rows
    if (line.trim().startsWith("|")) {
      if (line.includes("---")) return null;
      const cols = line.split("|").filter((c) => c.trim() !== "");
      return (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
            gap: 8,
            background: "#fafafa",
            padding: "4px 8px",
            borderBottom: "1px solid #f0f0f0",
            fontSize: 13,
          }}
        >
          {cols.map((col, i) => (
            <div key={i}>{parseInlineStyles(col.trim())}</div>
          ))}
        </div>
      );
    }

    // 4. Normal Text
    if (line.trim() === "") return <br key={index} />;

    return (
      <div key={index} style={{ marginBottom: 4 }}>
        {parseInlineStyles(line)}
      </div>
    );
  });
};

const parseInlineStyles = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const boldRegex = /\*\*([^\*]+)\*\*/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  let parts: (string | JSX.Element)[] = [text];

  const processUrls = (
    input: string | JSX.Element
  ): (string | JSX.Element)[] => {
    if (typeof input !== "string") return [input];
    const elements: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const matches = [...input.matchAll(urlRegex)];

    if (matches.length === 0) return [input];

    matches.forEach((match, i) => {
      const url = match[0];
      const index = match.index!;
      if (index > lastIndex) elements.push(input.substring(lastIndex, index));
      elements.push(
        <a
          key={`url-${i}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#1677ff" }}
        >
          {url} <LinkOutlined style={{ fontSize: 10 }} />
        </a>
      );
      lastIndex = index + url.length;
    });
    if (lastIndex < input.length) elements.push(input.substring(lastIndex));
    return elements;
  };

  const processBold = (
    input: string | JSX.Element
  ): (string | JSX.Element)[] => {
    if (typeof input !== "string") return [input];
    const elements: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const matches = [...input.matchAll(boldRegex)];

    if (matches.length === 0) return [input];

    matches.forEach((match, i) => {
      const fullMatch = match[0];
      const content = match[1];
      const index = match.index!;
      if (index > lastIndex) elements.push(input.substring(lastIndex, index));
      elements.push(
        <strong key={`bold-${i}`} style={{ color: "#262626" }}>
          {content}
        </strong>
      );
      lastIndex = index + fullMatch.length;
    });
    if (lastIndex < input.length) elements.push(input.substring(lastIndex));
    return elements;
  };

  let processed = processBold(text);
  return processed.map((p) => processUrls(p)).flat();
};

const ReleaseCard: React.FC<{ item: GitHubReleaseItem; isLatest: boolean }> = ({
  item,
  isLatest,
}) => {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(isLatest);

  const hasBugFix =
    item.notes.includes("Bug Fix") || item.notes.includes("bug");
  const hasFeature =
    item.notes.includes("New Feature") || item.notes.includes("feature");
  const hasImprovement = item.notes.includes("Improvement");

  return (
    <Card
      variant="outlined"
      style={{
        borderRadius: 16,
        boxShadow: isLatest ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
        border: `1px solid ${
          isLatest ? token.colorPrimaryBorder : token.colorBorderSecondary
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
          <ClockCircleOutlined style={{ color: token.colorTextTertiary }} />
          <Typography.Text type="secondary">
            {dayjs(item.release_date).format("D MMM BBBB")}
          </Typography.Text>
        </Space>
      </div>

      {expanded && (
        <div style={{ padding: "24px", animation: "fadeIn 0.3s ease-in-out" }}>
          <div
            style={{
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: `1px dashed ${token.colorSplit}`,
            }}
          >
            <Space wrap>
              <Tag icon={<GithubOutlined />}>Author: {item.author}</Tag>
              <Tag color={item.type === "production" ? "green" : "orange"}>
                {item.type.toUpperCase()}
              </Tag>
              <Tag>{item.system}</Tag>
            </Space>
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              color: token.colorText,
              background: token.colorFillAlter,
              padding: 16,
              borderRadius: 8,
            }}
          >
            {renderMarkdownContent(item.notes)}
          </div>
        </div>
      )}
    </Card>
  );
};

export const GitHubReleaseNotes: React.FC = () => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GitHubReleaseItem[]>([]);

  // --- Filter States ---
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

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

  // --- Generate Filter Options (Unique Values) ---
  const systemOptions = useMemo(
    () => [...new Set(data.map((item) => item.system))].map((v) => ({ label: v, value: v })),
    [data]
  );
  const typeOptions = useMemo(
    () => [...new Set(data.map((item) => item.type))].map((v) => ({ label: v.toUpperCase(), value: v })),
    [data]
  );
  const authorOptions = useMemo(
    () => [...new Set(data.map((item) => item.author))].map((v) => ({ label: v, value: v })),
    [data]
  );

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. System Filter
      if (selectedSystem && item.system !== selectedSystem) return false;
      // 2. Type Filter
      if (selectedType && item.type !== selectedType) return false;
      // 3. Author Filter
      if (selectedAuthor && item.author !== selectedAuthor) return false;
      // 4. Date Range Filter
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
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Typography.Title level={2} style={{ marginBottom: 8 }}>
              <RocketOutlined
                style={{ color: token.colorPrimary, marginRight: 12 }}
              />
              บันทึกการอัปเดตระบบ (Release Notes)
            </Typography.Title>
            <Typography.Text type="secondary">
              ติดตามรายการเปลี่ยนแปลง เวอร์ชันล่าสุด และประวัติการแก้ไขทั้งหมด
            </Typography.Text>
          </div>

          {/* --- Filter Section --- */}
          <Card
            size="small"
            style={{
              borderRadius: 16,
              background: token.colorFillQuaternary,
              border: "none",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <FilterFilled style={{ color: token.colorTextSecondary }} />
                <Typography.Text strong>ตัวกรองข้อมูล</Typography.Text>
            </div>
            
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="เลือกระบบ (System)"
                  style={{ width: "100%" }}
                  allowClear
                  options={systemOptions}
                  value={selectedSystem}
                  onChange={setSelectedSystem}
                  showSearch
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="ประเภท (Type)"
                  style={{ width: "100%" }}
                  allowClear
                  options={typeOptions}
                  value={selectedType}
                  onChange={setSelectedType}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="ผู้แก้ไข (Author)"
                  style={{ width: "100%" }}
                  allowClear
                  options={authorOptions}
                  value={selectedAuthor}
                  onChange={setSelectedAuthor}
                  showSearch
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <DatePicker.RangePicker
                  placeholder={["วันที่เริ่ม", "วันที่สิ้นสุด"]}
                  style={{ width: "100%" }}
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD/MM/BBBB"
                />
              </Col>
            </Row>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
                 <Button 
                    icon={<ClearOutlined />} 
                    size="small" 
                    onClick={handleClearFilters}
                    disabled={!selectedSystem && !selectedType && !selectedAuthor && !dateRange}
                 >
                    ล้างตัวกรอง
                 </Button>
                 <Button
                    type="primary"
                    ghost
                    icon={<SyncOutlined spin={loading} />}
                    size="small"
                    onClick={fetchReleaseNotes}
                 >
                    รีเฟรชข้อมูล
                 </Button>
            </div>
          </Card>

          {/* --- Content Section --- */}
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

          {!loading && filteredData.length > 0 && (
            filteredData.map((release, index) => (
              <ReleaseCard
                key={`${release.tag}-${index}`}
                item={release}
                // isLatest should check against the original data to be accurate, 
                // but visually in filtered list, highlighting the first one is also okay.
                // Let's stick to true logic: It's latest if it matches data[0]
                isLatest={release.tag === data[0].tag}
              />
            ))
          )}

          {!loading && filteredData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: token.colorTextSecondary }}>
                  <Typography.Text>ไม่พบข้อมูลตามเงื่อนไขที่กำหนด</Typography.Text>
                  <br />
                  <Button type="link" onClick={handleClearFilters}>ล้างตัวกรอง</Button>
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