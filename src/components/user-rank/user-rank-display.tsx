"use client";

import React, { useEffect, useState } from "react";
import { Badge, Card, Tag, Tooltip } from "antd";
import { 
  TrophyOutlined, 
  StarOutlined, 
  InfoCircleOutlined,
  GiftOutlined 
} from "@ant-design/icons";
import { 
  getUserRankFromStorage, 
  getDisciplineLevel, 
  calculateBenefitFromRank,
  refreshUserRankIfNeeded,
  type UserRankData 
} from "@/helpers/user-rank.helper";

interface UserRankDisplayProps {
  userId?: string;
  compact?: boolean;
  showBenefits?: boolean;
}

export default function UserRankDisplay({ 
  userId, 
  compact = false, 
  showBenefits = true 
}: UserRankDisplayProps) {
  const [rankData, setRankData] = useState<UserRankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRankData = async () => {
      setLoading(true);
      try {
        if (userId) {
          // ลองรีเฟรชข้อมูลถ้าจำเป็น
          const refreshedData = await refreshUserRankIfNeeded(userId);
          setRankData(refreshedData);
        } else {
          // ดึงจาก localStorage
          const storedData = getUserRankFromStorage();
          setRankData(storedData);
        }
      } catch (error) {
        console.error("Error loading rank data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRankData();
  }, [userId]);

  if (loading) {
    return (
      <Card size="small" loading style={{ minHeight: compact ? 60 : 120 }} />
    );
  }

  if (!rankData) {
    return null;
  }

  const disciplineLevel = getDisciplineLevel(rankData.rank);
  const benefits = showBenefits ? calculateBenefitFromRank(rankData.rank) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge count={rankData.rank} color={disciplineLevel.color}>
          <TrophyOutlined style={{ fontSize: 20, color: disciplineLevel.color }} />
        </Badge>
        <div>
          <div className="text-sm font-medium">อันดับ {rankData.rank}</div>
          <Tag color={disciplineLevel.color} className="text-xs">
            {disciplineLevel.level}
          </Tag>
        </div>
      </div>
    );
  }

  return (
    <Card
      size="small"
      title={
        <div className="flex items-center gap-2">
          <TrophyOutlined style={{ color: disciplineLevel.color }} />
          <span>ประสิทธิภาพการทำงาน</span>
          <Tooltip title="ข้อมูลสำหรับวัดวินัยและ Benefits">
            <InfoCircleOutlined className="text-gray-400" />
          </Tooltip>
        </div>
      }
      className="w-full"
    >
      <div className="space-y-3">
        {/* Rank และ Level */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold" style={{ color: disciplineLevel.color }}>
              อันดับ {rankData.rank}
            </div>
            <div className="text-sm text-gray-500">
              เดือน {rankData.month}/{rankData.year}
            </div>
          </div>
          <Tag color={disciplineLevel.color} className="text-sm px-3 py-1">
            <StarOutlined className="mr-1" />
            {disciplineLevel.level}
          </Tag>
        </div>

        {/* คำอธิบาย */}
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          {disciplineLevel.description}
        </div>

        {/* Benefits */}
        {showBenefits && benefits && benefits.benefits.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GiftOutlined className="text-blue-500" />
              <span className="font-medium text-sm">สิทธิประโยชน์</span>
            </div>
            <div className="space-y-1">
              {benefits.benefits.map((benefit, index) => (
                <div key={index} className="text-xs bg-blue-50 p-2 rounded flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  {benefit}
                </div>
              ))}
            </div>
            {benefits.bonusPercentage > 0 && (
              <div className="mt-2 text-xs text-green-600 font-medium">
                💰 โบนัสพิเศษ: {benefits.bonusPercentage}%
              </div>
            )}
          </div>
        )}

        {/* อัปเดตล่าสุด */}
        <div className="text-xs text-gray-400 border-t pt-2">
          อัปเดต: {new Date(rankData.updated_at).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </Card>
  );
}