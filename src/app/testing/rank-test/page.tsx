"use client";

/**
 * 🏆 Rank Test Page - สำหรับทดสอบ rank system
 */

import { useState, useEffect } from "react";
import { Button, Card, Typography, Space, Alert, Badge, Progress } from "antd";
import { fetchUserRank } from "@/services/user-rank/user-rank.service";
import { getUserRankFromStorage } from "@/helpers/user-rank.helper";

const { Title, Text, Paragraph } = Typography;

export default function RankTestPage() {
    const [rankData, setRankData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [storageData, setStorageData] = useState<any>(null);

    // โหลดข้อมูลจาก localStorage
    useEffect(() => {
        const data = getUserRankFromStorage();
        setStorageData(data);
    }, []);

    const testFetchRank = async () => {
        setLoading(true);
        try {
            // อ่าน admin_id จาก localStorage
            const authData = localStorage.getItem("AUTH_USER");
            let adminId = '117'; // default
            
            if (authData) {
                const parsed = JSON.parse(authData);
                adminId = parsed.user_data?.admin_id?.toString() || '117';
            }
            
            console.log(`🧪 [RankTest] Testing with admin_id: ${adminId}`);
            const result = await fetchUserRank(adminId);
            setRankData(result);
            console.log('🏆 Rank API Result:', result);
        } catch (error: any) {
            console.error('❌ Rank API Error:', error);
            setRankData({ error: error?.message || 'Unknown error' });
        } finally {
            setLoading(false);
        }
    };

    const clearStorage = () => {
        localStorage.removeItem("USER_RANK_DATA");
        setStorageData(null);
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Title level={2}>🏆 Rank System Testing</Title>
            
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card title="🔗 API Test">
                    <Space>
                        <Button 
                            type="primary" 
                            loading={loading}
                            onClick={testFetchRank}
                        >
                            Test Fetch Rank API
                        </Button>
                    </Space>
                    
                    {rankData && (
                        <Alert
                            message="API Response"
                            description={
                                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                    {JSON.stringify(rankData, null, 2)}
                                </pre>
                            }
                            type="success"
                            style={{ marginTop: 16 }}
                        />
                    )}
                </Card>

                <Card title="💾 LocalStorage Data">
                    <Space>
                        <Button onClick={() => setStorageData(getUserRankFromStorage())}>
                            Refresh from Storage
                        </Button>
                        <Button onClick={clearStorage} danger>
                            Clear Storage
                        </Button>
                    </Space>
                    
                    {storageData ? (
                        <Alert
                            message="Storage Data"
                            description={
                                <div>
                                    <Badge 
                                        count={storageData.rankLetter || 'N/A'} 
                                        style={{ 
                                            backgroundColor: storageData.rankLetter === 'S' ? '#FFD700' : 
                                                           storageData.rankLetter === 'A' ? '#52C41A' : '#CF1322' 
                                        }} 
                                    />
                                    <Text strong> Rank: {storageData.rank} ({storageData.rankLetter})</Text>
                                    <br />
                                    <Text>Name: {storageData.fullName}</Text>
                                    <br />
                                    <Text>Completion: {storageData.completion_rate}%</Text>
                                    <br />
                                    <Progress 
                                        percent={storageData.completion_rate} 
                                        size="small" 
                                        style={{ marginTop: 8 }}
                                    />
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {storageData.rankDescription}
                                    </Text>
                                </div>
                            }
                            type="info"
                            style={{ marginTop: 16 }}
                        />
                    ) : (
                        <Alert
                            message="No Storage Data"
                            description="ไม่มีข้อมูล rank ใน localStorage"
                            type="warning"
                            style={{ marginTop: 16 }}
                        />
                    )}
                </Card>

                <Card title="📊 Raw Storage Data">
                    {storageData && (
                        <pre style={{ fontSize: '12px', overflow: 'auto', background: '#f5f5f5', padding: '12px' }}>
                            {JSON.stringify(storageData, null, 2)}
                        </pre>
                    )}
                </Card>
            </Space>
        </div>
    );
}