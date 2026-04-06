"use client";

import { ExclamationCircleOutlined, ProjectOutlined, UserOutlined } from "@ant-design/icons";
import { getUserById } from "@helpers/local_storage/user.storage";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Dropdown,
  Skeleton,
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";

import type { Project, ProjectStatus } from "../types/project.types";

const { Text } = Typography;

interface KanbanBoardProps {
  projects: Project[];
  loading: boolean;
  allStatuses: ProjectStatus[];
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  onViewDetail: (p: Project) => void;
  onProjectStatusChange: (projectId: number, newStatusId: number | null) => void;
}

const getHealthStatus = (project: Project) => {
  if (project.status === "close") return { color: "green", text: "เสร็จสิ้น" };
  if (!project.end_date) return { color: "blue", text: "ไม่มีกำหนดวัน" };
  const daysRemaining = dayjs(project.end_date).diff(dayjs(), "day");
  if (daysRemaining < 0) return { color: "red", text: "เกินกำหนด" };
  if (daysRemaining <= 7) return { color: "gold", text: "ใกล้ถึงกำหนด" };
  return { color: "green", text: "ปกติ" };
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projects,
  loading,
  allStatuses,
  onEdit,
  onDelete,
  onViewDetail,
  onProjectStatusChange,
}) => {
  const { token } = theme.useToken();
  const [draggingProjectId, setDraggingProjectId] = useState<number | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, projectId: number) => {
    setDraggingProjectId(projectId);
    e.dataTransfer.setData("projectId", String(projectId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingProjectId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnId !== columnId) setDragOverColumnId(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const projectId = Number(e.dataTransfer.getData("projectId"));
    const statusId = columnId === "unspecified" ? null : Number(columnId);
    setDragOverColumnId(null);
    onProjectStatusChange(projectId, statusId);
  };

  const columns = useMemo(() => {
    const statusGroups = new Map<number | "null", Project[]>();
    projects.forEach((p) => {
      const key = p.projectStatusId || "null";
      if (!statusGroups.has(key)) statusGroups.set(key, []);
      statusGroups.get(key)?.push(p);
    });

    const result: { id: string; title: string; items: Project[]; color: string }[] = [];
    const sortedMasterStatuses = [...allStatuses].sort((a, b) => (a.priority || 0) - (b.priority || 0));

    result.push({
      id: "unspecified",
      title: "ยังไม่ระบุ",
      items: statusGroups.get("null") || [],
      color: token.colorTextDescription,
    });
    statusGroups.delete("null");

    sortedMasterStatuses.forEach((status) => {
      result.push({
        id: String(status.id),
        title: status.nameTh,
        items: statusGroups.get(status.id) || [],
        color: status.priority === 99 ? token.colorError : token.colorPrimary,
      });
      statusGroups.delete(status.id);
    });

    statusGroups.forEach((items, key) => {
      result.push({ id: String(key), title: `Unknown (${key})`, items, color: token.colorTextDescription });
    });

    return result;
  }, [projects, allStatuses, token]);

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-[1000px]">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex-1 min-w-[300px] flex flex-col gap-4 p-4 rounded-xl border transition-all duration-200"
            style={{
              background: dragOverColumnId === col.id ? token.colorFillSecondary : token.colorFillQuaternary,
              borderColor: dragOverColumnId === col.id ? token.colorPrimary : token.colorBorderSecondary,
              borderStyle: dragOverColumnId === col.id ? "dashed" : "solid",
            }}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverColumnId(null)}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex justify-between items-center mb-2 px-2">
              <Text strong style={{ fontSize: 16 }}>{col.title}</Text>
              <Tag color={col.id === "unspecified" ? "default" : "blue"}>{col.items.length}</Tag>
            </div>

            <div className="flex flex-col gap-3">
              {col.items.map((item) => {
                const health = getHealthStatus(item);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className="transition-transform active:scale-95"
                  >
                    <Card
                      hoverable
                      size="small"
                      className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all border-l-4 ${
                        draggingProjectId === item.id ? "opacity-30" : "opacity-100"
                      }`}
                      style={{
                        borderLeftColor:
                          health.color === "red" ? "#ff4d4f" : health.color === "gold" ? "#faad14" : token.colorSuccess,
                        background: token.colorBgContainer,
                      }}
                      onClick={() => onViewDetail(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Text strong className="line-clamp-2 leading-snug text-sm flex-1 mr-2">
                          {item.name}
                        </Text>
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: "edit",
                                label: "แก้ไข",
                                icon: <ProjectOutlined />,
                                onClick: (e) => { e.domEvent.stopPropagation(); onEdit(item); },
                              },
                              {
                                key: "delete",
                                label: "ลบ",
                                icon: <ExclamationCircleOutlined />,
                                danger: true,
                                onClick: (e) => { e.domEvent.stopPropagation(); onDelete(item); },
                              },
                            ],
                          }}
                          trigger={["click"]}
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<div className="rotate-90">...</div>}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <Tag
                          bordered={false}
                          style={{ background: token.colorFillQuaternary, color: token.colorTextSecondary }}
                        >
                          {dayjs(item.createdAt).format("DD/MM/YY")}
                        </Tag>
                        {health.text !== "ปกติ" && health.text !== "เสร็จสิ้น" && (
                          <Tag color={health.color} className="text-xs m-0 px-1 py-0">
                            {health.text}
                          </Tag>
                        )}
                      </div>

                      <Divider className="my-2" />

                      <div className="flex justify-between items-center">
                        <Space size={4}>
                          <UserOutlined className="text-xs text-gray-400" />
                          <Text type="secondary" className="text-xs">
                            {getUserById(item.createdBy)?.firstname || "ไม่ระบุ"}
                          </Text>
                        </Space>
                        <Tooltip title="Features count">
                          <Avatar
                            style={{
                              backgroundColor: token.colorPrimaryBg,
                              color: token.colorPrimary,
                              fontSize: 10,
                            }}
                            size="small"
                          >
                            {item.features?.filter((f) => !f.is_deleted).length || 0}
                          </Avatar>
                        </Tooltip>
                      </div>
                    </Card>
                  </div>
                );
              })}
              {col.items.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed rounded-lg">
                  ไม่พบรายการ
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
