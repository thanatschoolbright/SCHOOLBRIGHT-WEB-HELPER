"use client";

import { HeatMapOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Collapse,
  Empty,
  Row,
  Spin,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { useEffect } from "react";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

const { Text } = Typography;

// ระดับสีตามปริมาณงาน
const LEVELS = [
  { min: 0, max: 0, label: "ไม่มีงาน" },
  { min: 1, max: 2, label: "งานน้อย" },
  { min: 3, max: 5, label: "ปานกลาง" },
  { min: 6, max: 9, label: "งานมาก" },
  { min: 10, max: Infinity, label: "งานล้นมือ" },
];

/**
 * คืนค่าสีพื้นหลัง cell ตามจำนวน issue
 */
const getCellColor = (
  count: number,
  dangerColor: string,
  warningColor: string,
  successColor: string,
  primaryColor: string,
): string => {
  if (count === 0) return "transparent";
  if (count <= 2) return successColor + "55";
  if (count <= 5) return primaryColor + "77";
  if (count <= 9) return warningColor + "99";
  return dangerColor + "CC";
};

/**
 * แสดง Workload Heatmap รายพนักงาน × รายวัน
 * แต่ละ cell แสดงจำนวน Issue ค้างอยู่ในวันนั้น พร้อม Tooltip แสดง Issue Keys
 */
export const WorkloadHeatmap = () => {
  const { token } = theme.useToken();
  const {
    heatmapLoading,
    heatmapDates,
    heatmapAssignees,
    heatmapMatrix,
    fetchHeatmap,
  } = useBacklogDashboardStore();

  useEffect(() => {
    fetchHeatmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty =
    !heatmapLoading &&
    (heatmapDates.length === 0 || heatmapAssignees.length === 0);

  // สร้าง lookup map เพื่อ O(1) access
  const cellLookup = new Map<string, { count: number; issue_keys: string[] }>();
  heatmapMatrix.forEach((cell) => {
    cellLookup.set(`${cell.assignee_id}_${cell.date}`, {
      count: cell.count,
      issue_keys: cell.issue_keys,
    });
  });

  // หา max count เพื่อคำนวณ relative intensity
  const maxCount = Math.max(1, ...heatmapMatrix.map((c) => c.count));

  const CELL_SIZE = 36;
  const NAME_COL_WIDTH = 140;

  return (
    <Collapse
      defaultActiveKey={[]}
      style={{ borderColor: token.colorBorderSecondary }}
      items={[
        {
          key: "heatmap",
          label: (
            <Row align="middle" gutter={8}>
              <Col>
                <HeatMapOutlined
                  style={{ fontSize: "1rem", color: token.colorPrimary }}
                />
              </Col>
              <Col>
                <Text style={{ fontWeight: 600, fontSize: "1rem" }}>
                  ปริมาณงานรายคน (Workload Heatmap)
                </Text>
              </Col>
            </Row>
          ),
          extra: (
            <Row
              align="middle"
              gutter={16}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Legend */}
              <Col>
                <Row gutter={8} align="middle">
                  <Col>
                    <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                      น้อย
                    </Text>
                  </Col>
                  {[0, 2, 5, 9, 12].map((val) => (
                    <Col key={val}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 3,
                          backgroundColor:
                            val === 0
                              ? token.colorBorderSecondary
                              : getCellColor(
                                  val,
                                  token.colorError,
                                  token.colorWarning,
                                  token.colorSuccess,
                                  token.colorPrimary,
                                ),
                          border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                      />
                    </Col>
                  ))}
                  <Col>
                    <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                      มาก
                    </Text>
                  </Col>
                </Row>
              </Col>
              <Col>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={fetchHeatmap}
                  loading={heatmapLoading}
                >
                  รีเฟรช
                </Button>
              </Col>
            </Row>
          ),
          children: (
            <Spin spinning={heatmapLoading}>
              {isEmpty ? (
                <Empty
                  description="ไม่พบข้อมูลในช่วงเวลาที่เลือก"
                  style={{ padding: "40px 0" }}
                />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: 3,
                      minWidth:
                        NAME_COL_WIDTH + heatmapDates.length * (CELL_SIZE + 3),
                    }}
                  >
                    {/* Date header row */}
                    <thead>
                      <tr>
                        <th
                          style={{
                            width: NAME_COL_WIDTH,
                            minWidth: NAME_COL_WIDTH,
                            textAlign: "left",
                            paddingBottom: 8,
                          }}
                        >
                          <Text
                            type="secondary"
                            style={{ fontSize: "0.75rem" }}
                          >
                            พนักงาน / วันที่
                          </Text>
                        </th>
                        {heatmapDates.map((date) => {
                          const d = new Date(date);
                          const dayStr = d.toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "2-digit",
                          });
                          const dayOfWeek = d.toLocaleDateString("th-TH", {
                            weekday: "short",
                          });
                          const isWeekend =
                            d.getDay() === 0 || d.getDay() === 6;
                          return (
                            <th
                              key={date}
                              style={{
                                width: CELL_SIZE,
                                minWidth: CELL_SIZE,
                                textAlign: "center",
                                paddingBottom: 4,
                                opacity: isWeekend ? 0.4 : 1,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.65rem",
                                  color: token.colorTextSecondary,
                                  lineHeight: 1.2,
                                }}
                              >
                                <div>{dayStr}</div>
                                <div>{dayOfWeek}</div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    {/* Assignee rows */}
                    <tbody>
                      {heatmapAssignees.map((assignee) => (
                        <tr key={assignee.id}>
                          {/* ชื่อพนักงาน */}
                          <td
                            style={{
                              paddingRight: 12,
                              paddingBottom: 3,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                maxWidth: NAME_COL_WIDTH - 12,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "block",
                              }}
                              title={assignee.name}
                            >
                              {assignee.name}
                            </Text>
                          </td>

                          {/* Heatmap cells */}
                          {heatmapDates.map((date) => {
                            const cell = cellLookup.get(
                              `${assignee.id}_${date}`,
                            );
                            const count = cell?.count ?? 0;
                            const issueKeys = cell?.issue_keys ?? [];
                            const isWeekend =
                              new Date(date).getDay() === 0 ||
                              new Date(date).getDay() === 6;
                            const level = LEVELS.find(
                              (l) => count >= l.min && count <= l.max,
                            );
                            const intensity =
                              maxCount > 0 ? count / maxCount : 0;

                            const bgColor =
                              count === 0
                                ? isWeekend
                                  ? token.colorFillTertiary
                                  : token.colorFillQuaternary
                                : getCellColor(
                                    count,
                                    token.colorError,
                                    token.colorWarning,
                                    token.colorSuccess,
                                    token.colorPrimary,
                                  );

                            const tooltipContent =
                              count === 0 ? (
                                <span>ไม่มีงานค้างในวันนี้</span>
                              ) : (
                                <div style={{ maxWidth: 220 }}>
                                  <div
                                    style={{ fontWeight: 600, marginBottom: 4 }}
                                  >
                                    {assignee.name} — {count} งาน (
                                    {level?.label})
                                  </div>
                                  {issueKeys.slice(0, 8).map((key) => (
                                    <div
                                      key={key}
                                      style={{ fontSize: "0.75rem" }}
                                    >
                                      • {key}
                                    </div>
                                  ))}
                                  {issueKeys.length > 8 && (
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        opacity: 0.7,
                                      }}
                                    >
                                      และอีก {issueKeys.length - 8} งาน...
                                    </div>
                                  )}
                                </div>
                              );

                            return (
                              <Tooltip
                                key={date}
                                title={tooltipContent}
                                placement="top"
                              >
                                <td
                                  style={{
                                    width: CELL_SIZE,
                                    height: CELL_SIZE,
                                    backgroundColor: bgColor,
                                    borderRadius: 4,
                                    textAlign: "center",
                                    verticalAlign: "middle",
                                    cursor: count > 0 ? "pointer" : "default",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    opacity: isWeekend && count === 0 ? 0.4 : 1,
                                    transition: "transform 0.1s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (count > 0)
                                      (
                                        e.currentTarget as HTMLTableCellElement
                                      ).style.transform = "scale(1.15)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (
                                      e.currentTarget as HTMLTableCellElement
                                    ).style.transform = "scale(1)";
                                  }}
                                >
                                  {count > 0 && (
                                    <Text
                                      style={{
                                        fontSize:
                                          intensity > 0.6 ? "0.8rem" : "0.7rem",
                                        fontWeight: intensity > 0.6 ? 600 : 400,
                                        color:
                                          count >= 10
                                            ? token.colorErrorText
                                            : token.colorText,
                                        lineHeight: 1,
                                        userSelect: "none",
                                      }}
                                    >
                                      {count}
                                    </Text>
                                  )}
                                </td>
                              </Tooltip>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Spin>
          ),
        },
      ]}
    />
  );
};
