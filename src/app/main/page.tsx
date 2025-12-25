"use client";

import React, { useState, useEffect } from "react";
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
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import DashboardLayout from "@/components/layouts/backend-layout";

dayjs.extend(buddhistEra);
dayjs.extend(relativeTime);
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

// --- Enhanced Markdown Parser for Support Team ---
const renderMarkdownContent = (text: string) => {
  if (!text) return null;

  // Split lines
  const lines = text.split("\n");

  return lines.map((line, index) => {
    // 1. Headers (###, ##, #)
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

    // 2. Lists (- , *)
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = line.trim().substring(2);
      return (
        <div key={index} style={{ display: "flex", gap: 8, marginLeft: 8, marginBottom: 4 }}>
          <span style={{ color: "#faad14" }}>•</span>
          <Typography.Text>{parseInlineStyles(content)}</Typography.Text>
        </div>
      );
    }

    // 3. Table Rows (| ... | ... |) - Basic rendering
    if (line.trim().startsWith("|")) {
       if (line.includes("---")) return null; // Skip separator line
       const cols = line.split("|").filter(c => c.trim() !== "");
       return (
          <div key={index} style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 8, background: '#fafafa', padding: '4px 8px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
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

// Helper to parse Links, Bold, Italic inside a line
const parseInlineStyles = (text: string) => {
  // Regex for Markdown Link [Text](URL)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  // Regex for Bold **Text**
  const boldRegex = /\*\*([^\*]+)\*\*/g;
  // Regex for Plain URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Simple token replacement (Order matters!)
  let parts: (string | JSX.Element)[] = [text];

  // 1. Process Links [Text](URL)
  // (Simplified for demo, real implementation should be recursive)
  
  // 2. Process Plain URLs
  const processUrls = (input: string | JSX.Element): (string | JSX.Element)[] => {
      if (typeof input !== 'string') return [input];
      const elements: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      const matches = [...input.matchAll(urlRegex)];
      
      if (matches.length === 0) return [input];

      matches.forEach((match, i) => {
          const url = match[0];
          const index = match.index!;
          if (index > lastIndex) elements.push(input.substring(lastIndex, index));
          elements.push(
              <a key={`url-${i}`} href={url} target="_blank" rel="noreferrer" style={{ color: "#1677ff" }}>
                  {url} <LinkOutlined style={{ fontSize: 10 }} />
              </a>
          );
          lastIndex = index + url.length;
      });
      if (lastIndex < input.length) elements.push(input.substring(lastIndex));
      return elements;
  };

  // 3. Process Bold **Text**
  const processBold = (input: string | JSX.Element): (string | JSX.Element)[] => {
      if (typeof input !== 'string') return [input];
      const elements: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      const matches = [...input.matchAll(boldRegex)];

      if (matches.length === 0) return [input];

      matches.forEach((match, i) => {
          const fullMatch = match[0];
          const content = match[1];
          const index = match.index!;
          if (index > lastIndex) elements.push(input.substring(lastIndex, index));
          elements.push(<strong key={`bold-${i}`} style={{ color: '#262626' }}>{content}</strong>);
          lastIndex = index + fullMatch.length;
      });
      if (lastIndex < input.length) elements.push(input.substring(lastIndex));
      return elements;
  };

  // Chain processors (Basic)
  let processed = processBold(text);
  // Flatten and process URLs
  // (In real app, consider using 'react-markdown' package)
  return processed.map(p => processUrls(p)).flat();
};


const ReleaseCard: React.FC<{ item: GitHubReleaseItem; isLatest: boolean }> = ({
  item,
  isLatest,
}) => {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(isLatest);

  // Analyze content for smart badges
  const hasBugFix = item.notes.includes("Bug Fix") || item.notes.includes("bug");
  const hasFeature = item.notes.includes("New Feature") || item.notes.includes("feature");
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
          borderBottom: expanded ? `1px solid ${token.colorBorderSecondary}` : "none",
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
                display: 'flex', 
                alignItems: 'center', 
                gap: 6 
            }}
          >
            <TagOutlined /> {item.tag}
          </Tag>

          <Typography.Text strong style={{ fontSize: 16 }}>
             {item.title && item.title !== item.tag ? item.title : `เวอร์ชัน ${item.tag}`}
          </Typography.Text>

          {isLatest && <Tag color="#f50">ล่าสุด (LATEST)</Tag>}
          
          {/* Quick Badges */}
          {!isLatest && !expanded && (
             <Space size={4}>
                {hasBugFix && <Tag color="error" bordered={false}><BugFilled /> แก้บั๊ก</Tag>}
                {hasFeature && <Tag color="success" bordered={false}><ThunderboltFilled /> ฟีเจอร์ใหม่</Tag>}
                {hasImprovement && <Tag color="warning" bordered={false}><ToolFilled /> ปรับปรุง</Tag>}
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
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px dashed ${token.colorSplit}` }}>
                <Space wrap>
                    <Tag icon={<GithubOutlined />}>Author: {item.author}</Tag>
                    <Tag color={item.type === 'production' ? 'green' : 'orange'}>
                        {item.type.toUpperCase()}
                    </Tag>
                </Space>
            </div>
            
            <div 
                style={{ 
                    fontSize: 14, 
                    lineHeight: 1.8, 
                    color: token.colorText,
                    background: token.colorFillAlter, // พื้นหลังจางๆ ให้อ่านง่าย
                    padding: 16,
                    borderRadius: 8
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

  const fetchReleaseNotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get<GitHubReleaseItem[]>(GITHUB_RAW_URL);
      const sortedData = response.data.sort((a, b) => 
         new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
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
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Typography.Title level={2} style={{ marginBottom: 8 }}>
              <RocketOutlined style={{ color: token.colorPrimary, marginRight: 12 }} />
              บันทึกการอัปเดตระบบ (Release Notes)
            </Typography.Title>
            <Typography.Text type="secondary">
              ติดตามรายการเปลี่ยนแปลง เวอร์ชันล่าสุด และประวัติการแก้ไขทั้งหมด
            </Typography.Text>
            <div style={{ marginTop: 16 }}>
               <Button 
                  icon={<SyncOutlined spin={loading} />} 
                  onClick={fetchReleaseNotes}
                  type="text"
               >
                  รีเฟรชข้อมูล
               </Button>
            </div>
          </div>

          {loading && (
             <>
               <Card style={{ borderRadius: 16, marginBottom: 16 }}><Skeleton active avatar paragraph={{ rows: 4 }} /></Card>
               <Card style={{ borderRadius: 16 }}><Skeleton active avatar paragraph={{ rows: 4 }} /></Card>
             </>
          )}

          {!loading && data.map((release, index) => (
            <ReleaseCard
              key={`${release.tag}-${index}`}
              item={release}
              isLatest={index === 0}
            />
          ))}

          {!loading && (
             <Divider style={{ marginTop: 32 }}>
               <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                 สิ้นสุดรายการอัปเดตทั้งหมด {data.length} รายการ
               </Typography.Text>
             </Divider>
          )}
        </Space>
      </div>
    </DashboardLayout>
  );
};

export default GitHubReleaseNotes;