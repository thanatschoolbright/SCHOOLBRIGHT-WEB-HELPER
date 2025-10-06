"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Space,
  Typography,
  Tag,
  Progress,
  Avatar,
  Button,
  DatePicker,
  Skeleton,
  theme,
} from "antd";
import {
  CrownOutlined,
  TrophyOutlined,
  SmileOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import { ReloadOutlined } from "@ant-design/icons";

interface SummaryRecord {
  admin_id: number;
  full_name: string;
  nickname: string | null;
  employee_code: string | null;
  position: string | null;
  total_hours: number;
  expected_hours: number;
  completion_rate: number;
  rank: string;
  rank_description: string;
  order: number;
}

interface SummaryMetadata {
  range?: {
    start_date?: string;
    end_date?: string;
    label_th?: string;
  };
  working_days?: number;
  expected_hours_per_member?: number;
  generated_at?: string;
  notes?: string;
}

interface ApiResponse {
  status?: number;
  data?: {
    records?: SummaryRecord[];
    metadata?: SummaryMetadata;
  };
}

const API_ENDPOINT = "/api/v1/timesheet/entry/check/summary-month";

const rankAccentMap: Record<
  string,
  {
    color: string;
    bg: string;
    tagColor?: string;
    glow: string;
  }
> = {
  A: {
    color: "#166534",
    bg: "linear-gradient(135deg, rgba(134, 239, 172, 0.45), rgba(16, 185, 129, 0.12))",
    tagColor: "success",
    glow: "0 14px 28px rgba(16, 185, 129, 0.28)",
  },
  B: {
    color: "#1d4ed8",
    bg: "linear-gradient(135deg, rgba(191, 219, 254, 0.45), rgba(59, 130, 246, 0.14))",
    tagColor: "processing",
    glow: "0 14px 28px rgba(59, 130, 246, 0.24)",
  },
  C: {
    color: "#f59e0b",
    bg: "linear-gradient(135deg, rgba(253, 230, 138, 0.45), rgba(245, 158, 11, 0.12))",
    tagColor: "warning",
    glow: "0 14px 28px rgba(245, 158, 11, 0.24)",
  },
  D: {
    color: "#dc2626",
    bg: "linear-gradient(135deg, rgba(252, 165, 165, 0.45), rgba(220, 38, 38, 0.12))",
    tagColor: "error",
    glow: "0 14px 28px rgba(220, 38, 38, 0.22)",
  },
  E: {
    color: "#7f1d1d",
    bg: "linear-gradient(135deg, rgba(248, 113, 113, 0.35), rgba(127, 29, 29, 0.14))",
    tagColor: "default",
    glow: "0 12px 24px rgba(127, 29, 29, 0.2)",
  },
};

const fallbackAccent = {
  color: "#334155",
  bg: "linear-gradient(135deg, rgba(148, 163, 184, 0.25), rgba(148, 163, 184, 0.1))",
  tagColor: "default",
  glow: "0 12px 26px rgba(99, 102, 241, 0.16)",
};

const addAlpha = (hex: string, alpha: number) => {
  if (!hex?.startsWith("#")) return hex;
  let h = hex.slice(1);
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const useMonthlyRankData = () => {
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        month: selectedMonth.format("M"),
        year: selectedMonth.format("YYYY"),
      };

      const response = await axios.post<ApiResponse>(API_ENDPOINT, payload, {
        headers: { "Content-Type": "application/json" },
      });
      const apiData = response.data?.data;
      setRecords(apiData?.records ?? []);
      setMetadata(apiData?.metadata ?? null);
    } catch (err: any) {
      console.error("fetchMonthlyRank", err);
      setError(err?.message ?? "ไม่สามารถโหลดข้อมูลอันดับประจำเดือนได้");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    records,
    metadata,
    loading,
    error,
    refetch: fetchData,
    selectedMonth,
    setSelectedMonth,
  };
};

const formatName = (record: SummaryRecord) => {
  if (record.nickname) {
    return `${record.nickname}`;
  }
  return record.full_name ?? "-";
};

const formatHoursLabel = (record: SummaryRecord) => {
  return `${record.total_hours.toFixed(2)} / ${record.expected_hours.toFixed(
    2
  )} ชม.`;
};

const formatCompletionLabel = (record: SummaryRecord) =>
  `${record.completion_rate.toFixed(0)}%`;

const MAX_ROWS = 8;

type MonthlyRankVariant = "compact" | "wide";

interface MonthlyRankBoardProps {
  currentAdminId?: number;
  variant?: MonthlyRankVariant;
}

export function MonthlyRankBoard({
  currentAdminId,
  variant = "wide",
}: MonthlyRankBoardProps) {
  const { token } = theme.useToken();
  const {
    records,
    metadata,
    loading,
    error,
    refetch,
    selectedMonth,
    setSelectedMonth,
  } = useMonthlyRankData();

  const visibleRecords = useMemo(() => {
    if (currentAdminId) {
      const selfRecord = records.find(
        (record) => record.admin_id === currentAdminId
      );
      if (selfRecord) {
        return [selfRecord];
      }
    }
    return records.slice(0, MAX_ROWS);
  }, [currentAdminId, records]);

  const monthLabel =
    metadata?.range?.label_th ?? selectedMonth.format("MMMM YYYY");
  const generatedAt = metadata?.generated_at
    ? dayjs(metadata.generated_at).format("DD/MM/YYYY HH:mm")
    : null;

  const isCompact = variant === "compact";
  const cardStyle = isCompact
    ? {
        borderRadius: 12,
        boxShadow: "none",
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        minWidth: 260,
        width: 300,
      }
    : {
        borderRadius: 16,
        boxShadow: "none",
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
      };

  return (
    <Card
      variant="borderless"
      style={cardStyle}
      styles={{ body: { padding: isCompact ? 18 : 20 } }}
    >
      <Space
        style={{ width: "100%", justifyContent: "space-between" }}
        align="start"
      >
        <Space direction="vertical" size={isCompact ? 2 : 4}>
          <Typography.Text strong style={{ letterSpacing: 0.5 }}>
            อันดับการทำเวลาประจำเดือน
          </Typography.Text>
          <Typography.Text type="secondary">
            {monthLabel}
            {generatedAt ? ` · อัปเดตล่าสุด ${generatedAt}` : ""}
          </Typography.Text>
        </Space>
        <Space size={isCompact ? 4 : 8}>
          <DatePicker
            picker="month"
            allowClear={false}
            size={isCompact ? "small" : "middle"}
            value={selectedMonth}
            onChange={(value) => {
              if (value) {
                setSelectedMonth(value);
              }
            }}
          />
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={refetch}
            disabled={loading}
            size={isCompact ? "small" : "middle"}
          >
            รีเฟรช
          </Button>
        </Space>
      </Space>

      <div style={{ marginTop: isCompact ? 12 : 16 }}>
        {loading ? (
          <Space
            direction="vertical"
            size={isCompact ? 10 : 14}
            style={{ width: "100%" }}
          >
            {Array.from({ length: isCompact ? 1 : 1 }).map((_, index) => (
              <Card
                key={`skeleton-${index}`}
                size="small"
                style={{
                  background: token.colorBgContainer,
                  borderRadius: 10,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: "none",
                }}
                styles={{
                  body: { padding: isCompact ? "12px 16px" : "14px 18px" },
                }}
              >
                <Skeleton
                  active
                  avatar={{ shape: "circle" }}
                  paragraph={{ rows: isCompact ? 2 : 3, width: "100%" }}
                  title={false}
                />
              </Card>
            ))}
          </Space>
        ) : error ? (
          <Typography.Text type="danger">{error}</Typography.Text>
        ) : visibleRecords.length === 0 ? (
          <Typography.Text type="secondary">
            {currentAdminId
              ? "ยังไม่มีข้อมูลของคุณในเดือนนี้"
              : "ยังไม่มีข้อมูลอันดับประจำเดือน"}
          </Typography.Text>
        ) : (
          <Space
            direction="vertical"
            size={isCompact ? 10 : 14}
            style={{ width: "100%" }}
          >
            {visibleRecords.map((record) => {
              const accent = rankAccentMap[record.rank] ?? fallbackAccent;
              const iconByRank = {
                S: <ThunderboltOutlined style={{ color: "#166534" }} />,
                A: <CrownOutlined style={{ color: "#f59e0b" }} />,
                B: <TrophyOutlined style={{ color: "#1d4ed8" }} />,
                C: <SmileOutlined style={{ color: "#f59e0b" }} />,
                D: <WarningOutlined style={{ color: "#dc2626" }} />,
                E: <CloseCircleOutlined style={{ color: "#7f1d1d" }} />,
              } as const;

              const chipStyle: React.CSSProperties =
                record.rank === "S"
                  ? {
                      background:
                        "linear-gradient(90deg, rgba(255,223,102,0.25), rgba(120,255,214,0.25), rgba(102,204,255,0.25))",
                      border: `1px solid ${addAlpha("#22c55e", 0.4)}`,
                      boxShadow: "0 0 12px rgba(34,197,94,0.35)",
                    }
                  : record.rank === "A"
                  ? {
                      background:
                        "linear-gradient(90deg, rgba(255,215,0,0.18), rgba(255,182,72,0.18), rgba(255,239,184,0.18))",
                      border: `1px solid ${addAlpha("#f59e0b", 0.25)}`,
                    }
                  : {
                      background: addAlpha(accent.color, 0.08),
                      border: `1px solid ${addAlpha(accent.color, 0.18)}`,
                    };
              const progressPercent = record.expected_hours
                ? Math.min(
                    100,
                    (record.total_hours / record.expected_hours) * 100
                  )
                : 0;

              return (
                <Card
                  key={record.admin_id}
                  size="small"
                  style={{
                    background: token.colorBgContainer,
                    borderRadius: 10,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    borderLeft: `4px solid ${accent.color}`,
                    boxShadow: "none",
                  }}
                >
                  <Space
                    align="start"
                    style={{ width: "100%" }}
                    size={isCompact ? 12 : 16}
                  >
                    <Avatar
                      style={{
                        backgroundColor: token.colorFillTertiary,
                        color: token.colorTextSecondary,
                      }}
                    >
                      {record.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </Avatar>
                    <Space
                      direction="vertical"
                      size={isCompact ? 6 : 8}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "4px 8px",
                            borderRadius: 999,
                            ...chipStyle,
                            maxWidth: isCompact ? 220 : 260,
                          }}
                          title={`${formatName(record)} · Rank ${record.rank}`}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            {iconByRank[record.rank as keyof typeof iconByRank]}
                          </span>
                          <Typography.Text
                            ellipsis
                            style={{
                              fontWeight: 600,
                              color: token.colorText,
                              maxWidth: isCompact ? 140 : 180,
                            }}
                          >
                            {formatName(record)}
                          </Typography.Text>
                          <Tag
                            color={accent.tagColor ?? "default"}
                            style={{ marginInlineStart: 0 }}
                          >
                            Rank {record.rank}
                          </Tag>
                        </div>
                        <Typography.Text strong>
                          {formatCompletionLabel(record)}
                        </Typography.Text>
                      </Space>

                      <Typography.Text type="secondary">
                        {record.rank_description || "-"}
                      </Typography.Text>

                      <Progress
                        percent={Number(progressPercent.toFixed(1))}
                        strokeColor={accent.color}
                        trailColor={token.colorFillSecondary}
                        format={() => formatHoursLabel(record)}
                      />
                    </Space>
                  </Space>
                </Card>
              );
            })}
          </Space>
        )}
      </div>
    </Card>
  );
}
