"use client";

import {Card, Skeleton, Space, Tabs, Typography, Modal, Table, Tag, Spin, Button} from "antd";
import {useRouter} from "next/navigation";
import React, {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {toast} from "sonner";
import {CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, RobotOutlined, ReloadOutlined} from '@ant-design/icons';
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";

import AutoCategoryToggle from "@components/backlog/auto-category-toggle";
import AutoAiDescriptionToggle from "@components/backlog/auto-description-toggle";
import BulkUpdatePanel from "@components/backlog/issue-drawer/bulk-update-panel";
import {RootState} from "@stores/store";
import {Issue} from "@components/backlog/issue-drawer/types";

interface BulkUpdateSectionProps {
    elevatedCardStyle: React.CSSProperties;
    projectName: string;
    projectId: number;
    space: string;
    onUpdateComplete: () => void;
}

const BulkUpdateSection: React.FC<BulkUpdateSectionProps> = ({
                                                                 elevatedCardStyle,
                                                                 projectName,
                                                                 projectId,
                                                                 space,
        onUpdateComplete
                                                             }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const {
        optionsLoading,
        categoryOptions,
        milestoneOptions,
        priorityOptions,
        statusOptions,
        selectedRowKeys,
        issues
    } = useSelector((state: RootState) => state.issues);

    const [bulkTabKey, setBulkTabKey] = useState<"ai" | "manual">("ai");
    const [autoCategoryEnabled, setAutoCategoryEnabled] = useState(false);
    const [autoDescriptionEnabled, setAutoDescriptionEnabled] = useState(false);
    const [autoCategoryLoading, setAutoCategoryLoading] = useState(false);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [resultsModalVisible, setResultsModalVisible] = useState(false);
    const [processingResults, setProcessingResults] = useState<Array<{
        issueKeyOrId: string | number;
        title?: string;
        summary?: string;
        status: 'pending' | 'success' | 'error';
        message?: string;
        detail?: string;
        statusCode?: number;
        index: number;
    }>>([]);
    const perIssuePayloadsRef = React.useRef<any[] | null>(null);
    const [saving, setSaving] = useState(false);
    const [detailModal, setDetailModal] = useState<{
        open: boolean;
        title?: string;
        content?: string;
        statusCode?: number;
    }>({open: false});

    const formatErrorDetail = (value: any): string => {
        if (!value) return "";
        if (typeof value === "string") return value;
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    };

    const extractErrorMessage = (error: any) => {
        const data = error?.response?.data;
        const message =
            data?.message_th ||
            data?.message_en ||
            data?.message ||
            data?.error?.message ||
            error?.message ||
            "เกิดข้อผิดพลาด";
        const detailSource = data?.error ?? data ?? error?.response ?? error;
        const detail = formatErrorDetail(detailSource);
        const statusCode = error?.response?.status || data?.status;

        return {message, detail, statusCode};
    };

    const openDetailModal = (title: string, content?: string, statusCode?: number) => {
        setDetailModal({
            open: true,
            title,
            content: content || "",
            statusCode,
        });
    };

    const processSingle = async (payload: any, selectedIssueMap: Map<string, Issue>) => {
        const issue = selectedIssueMap.get(String(payload.issueKeyOrId));
        try {
            if (!issue) throw new Error("ไม่พบข้อมูลงาน");
            const response = await axios.post("/api/v1/ai/gemini/summarize", {
                summary: issue.summary,
                description: issue.description,
            });
            const markdown = response?.data?.data?.markdown || "";
            payload.updates.description = markdown;
            setProcessingResults(prev => prev.map(r => String(r.issueKeyOrId) === String(payload.issueKeyOrId) ? {
                ...r,
                status: 'success',
                summary: markdown,
                message: undefined,
                detail: undefined,
                statusCode: undefined,
            } : r));
            return { success: true, payload };
        } catch (err: any) {
            const {message, detail, statusCode} = extractErrorMessage(err);
            setProcessingResults(prev => prev.map(r => String(r.issueKeyOrId) === String(payload.issueKeyOrId) ? {
                ...r,
                status: 'error',
                message,
                detail,
                statusCode,
            } : r));
            return { success: false, error: message, detail };
        }
    };

    const [bulkStatusId, setBulkStatusId] = useState<number | undefined>();
    const [bulkPriorityId, setBulkPriorityId] = useState<number | undefined>();
    const [bulkStartDate, setBulkStartDate] = useState<any>();
    const [bulkDueDate, setBulkDueDate] = useState<any>();
    const [bulkMilestoneIds, setBulkMilestoneIds] = useState<number[] | undefined>();
    const [bulkCategoryIds, setBulkCategoryIds] = useState<number[] | undefined>();

    const handleAutoCategoryToggle = (checked: boolean) => {
        setAutoCategoryEnabled(checked);
        if (checked) setBulkCategoryIds(undefined);
    };

    const handleAutoDescriptionToggle = (checked: boolean) => {
        setAutoDescriptionEnabled(checked);
    };

    const clearBulkForm = () => {
        setBulkStatusId(undefined);
        setBulkPriorityId(undefined);
        setBulkStartDate(undefined);
        setBulkDueDate(undefined);
        setBulkMilestoneIds(undefined);
        setBulkCategoryIds(undefined);
        setAutoCategoryEnabled(false);
        setAutoDescriptionEnabled(false);
    };

    const hasBulkUpdates =
        autoCategoryEnabled ||
        autoDescriptionEnabled ||
        bulkStatusId !== undefined ||
        bulkPriorityId !== undefined ||
        bulkStartDate !== undefined ||
        bulkDueDate !== undefined ||
        bulkMilestoneIds !== undefined ||
        bulkCategoryIds !== undefined;

    const handleBulkUpdate = async () => {
        // This function will be complex, involving API calls.
        // For now, we will just log the data.
        console.log({
            autoCategoryEnabled,
            autoDescriptionEnabled,
            bulkStatusId,
            bulkPriorityId,
            bulkStartDate,
            bulkDueDate,
            bulkMilestoneIds,
            bulkCategoryIds,
            selectedRowKeys,
        });

        if (!space || !selectedRowKeys.length) return;

        const sharedUpdates: any = {};
        if (bulkStatusId !== undefined) sharedUpdates.statusId = bulkStatusId;
        if (bulkPriorityId !== undefined) sharedUpdates.priorityId = bulkPriorityId;
        if (bulkStartDate) sharedUpdates.startDate = bulkStartDate.format("YYYY-MM-DD");
        if (bulkDueDate) sharedUpdates.dueDate = bulkDueDate.format("YYYY-MM-DD");
        if (bulkMilestoneIds !== undefined) sharedUpdates.milestoneId = bulkMilestoneIds;
        if (!autoCategoryEnabled && bulkCategoryIds !== undefined) sharedUpdates.categoryId = bulkCategoryIds;

        if (!autoCategoryEnabled && !autoDescriptionEnabled && !Object.keys(sharedUpdates).length) {
            toast.error("กรุณาเลือกข้อมูลที่จะอัปเดต");
            return;
        }

        setBulkUpdating(true);
        const toastId = toast.loading("กำลังอัปเดตงานแบบกลุ่ม...");

        try {
            if (autoCategoryEnabled || autoDescriptionEnabled) {
                // AI-assisted update
                const selectedIssueMap = new Map(
                    issues.map((issueItem) => {
                        const key = issueItem.issueKey || String(issueItem.id);
                        return [key, issueItem];
                    })
                );

                const selectedIssues = selectedRowKeys
                    .map((key) => selectedIssueMap.get(String(key)))
                    .filter((item): item is Issue => Boolean(item));

                if (!selectedIssues.length) {
                    throw new Error("ไม่พบข้อมูลงานที่เลือก");
                }

                let perIssuePayloads = selectedIssues.map(issue => ({
                    issueKeyOrId: issue.issueKey || issue.id,
                    updates: {...sharedUpdates}
                }));

                if (autoCategoryEnabled) {
                    toast.message("กำลังวิเคราะห์ Category ด้วย Gemini...", {id: toastId});
                    const {data: autoCategoryResponse} = await axios.post("/api/v1/ai/gemini/auto-category", {
                        issues: selectedIssues.map((item) => ({
                            issueKey: item.issueKey || String(item.id),
                            summary: item.summary,
                            description: item.description,
                        })),
                        categories: categoryOptions.map((option) => ({
                            id: option.value,
                            name: option.label,
                        })),
                    });
                    const suggestions = autoCategoryResponse?.data?.suggestions || [];
                    const suggestionMap = new Map(suggestions.map((s: any) => [s.issueKey, s.categoryIds]));
                    perIssuePayloads.forEach(p => {
                        const categoryIds = suggestionMap.get(p.issueKeyOrId);
                        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                            p.updates.categoryId = categoryIds;
                        }
                    });
                }

                if (autoDescriptionEnabled) {
                    // Prepare processing results and open modal
                    // Save payloads for potential retry
                    perIssuePayloadsRef.current = perIssuePayloads;

                    // Initialize processing results
                    setProcessingResults(perIssuePayloads.map((p, i) => ({
                        issueKeyOrId: p.issueKeyOrId,
                        title: String(p.issueKeyOrId),
                        status: 'pending' as const,
                        index: i,
                    })));
                    setResultsModalVisible(true);

                    // Concurrency-controlled runner
                    const concurrency = 4; // adjust as needed
                    const runWithConcurrency = async (items: any[], worker: (item: any, idx: number) => Promise<void>) => {
                        let idx = 0;
                        const runners = Array.from({ length: concurrency }).map(async () => {
                            while (true) {
                                const i = idx++;
                                if (i >= items.length) break;
                                await worker(items[i], i);
                            }
                        });
                        await Promise.all(runners);
                    };

                    await runWithConcurrency(perIssuePayloads, async (payload, i) => {
                        const issue = selectedIssueMap.get(String(payload.issueKeyOrId));
                        // mark pending (already pending by default) — ensure string comparison so UI updates
                        setProcessingResults(prev => prev.map(r => String(r.issueKeyOrId) === String(payload.issueKeyOrId) ? {
                            ...r,
                            status: 'pending',
                            message: undefined,
                            detail: undefined,
                            statusCode: undefined,
                        } : r));
                        await processSingle(payload, selectedIssueMap);
                    });

                    // After all processing, show final notification
                    const successCount = perIssuePayloads.filter(p => p.updates && p.updates.description).length;
                    const failureCount = perIssuePayloads.length - successCount;
                    toast.message(`สรุปรายการเสร็จสิ้น: สำเร็จ ${successCount} รายการ, ล้มเหลว ${failureCount} รายการ`);
                }


                const entries = perIssuePayloads.filter(p => Object.keys(p.updates).length > 0);
                if (entries.length > 0) {
                    await axios.post("/api/v1/backlog/issues/bulk-update", {space, entries});
                }

            } else {
                // Manual update
                await axios.post("/api/v1/backlog/issues/bulk-update", {
                    space,
                    issues: selectedRowKeys,
                    updates: sharedUpdates,
                });
            }

            toast.success("อัปเดตงานสำเร็จ", {id: toastId});
            onUpdateComplete();
            clearBulkForm();
        } catch (error: any) {
            const {message} = extractErrorMessage(error);
            toast.error(message || "อัปเดตไม่สำเร็จ", {id: toastId});
        } finally {
            setBulkUpdating(false);
        }
    };


    return (
        <Card
            size="small"
            styles={{body: {padding: 16 }}}
            style={elevatedCardStyle}
            title={
                <Space align="center" size={10}>
                    <Typography.Title level={5} style={{margin: 0}}>
                        การอัปเดตแบบกลุ่ม
                    </Typography.Title>
                    <Tag color="blue" bordered={false} style={{borderRadius: 10}}>
                        เลือกแล้ว {selectedRowKeys.length} งาน
                    </Tag>
                    <Tag color="geekblue" bordered={false} style={{borderRadius: 10}}>
                        AI Assist
                    </Tag>
                </Space>
            }
        >
            <Skeleton
                active
                loading={optionsLoading}
                paragraph={{rows: 6}}
                title={false}
            >
                <Tabs
                    activeKey={bulkTabKey}
                    onChange={(key) => setBulkTabKey(key as "ai" | "manual")}
                    items={[
                        {
                            key: "ai",
                            label: "อัปเดตด้วย AI",
                            children: (
                                <Space direction="vertical" size={16} style={{width: "100%"}}>
                                    <Card
                                        size="small"
                                        bordered={false}
                                        style={{
                                            
                                            borderRadius: 12,
                                        }}
                                    >
                                        <Space direction="vertical" size={6} style={{width: "100%"}}>
                                            <Typography.Text strong>Smart Filters</Typography.Text>
                                            <Typography.Text type="secondary">
                                                เปิดใช้งาน Gemini เพื่อช่วยเลือก Category และสรุป Description โดยอัตโนมัติ
                                            </Typography.Text>
                                            <Space wrap>
                                                <AutoCategoryToggle
                                                    disabled={
                                                        autoCategoryLoading ||
                                                        bulkUpdating ||
                                                        !categoryOptions.length
                                                    }
                                                    enabled={autoCategoryEnabled}
                                                    onChange={handleAutoCategoryToggle}
                                                />
                                                <AutoAiDescriptionToggle
                                                    enabled={autoDescriptionEnabled}
                                                    onChange={handleAutoDescriptionToggle}
                                                    disabled={bulkUpdating}
                                                />
                                            </Space>
                                        </Space>
                                    </Card>

                                    <Card
                                        size="small"
                                        bordered={false}
                                        style={{borderRadius: 12, boxShadow: "0 4px 12px rgba(15,23,42,0.06)"}}
                                    >
                                        <BulkUpdatePanel
                                            autoCategoryEnabled={autoCategoryEnabled}
                                            autoAiDescriptionEnabled={autoDescriptionEnabled}
                                            autoCategoryLoading={autoCategoryLoading}
                                            bulkCategoryIds={bulkCategoryIds}
                                            bulkDueDate={bulkDueDate}
                                            bulkMilestoneIds={bulkMilestoneIds}
                                            bulkPriorityId={bulkPriorityId}
                                            bulkStartDate={bulkStartDate}
                                            bulkStatusId={bulkStatusId}
                                        bulkUpdating={bulkUpdating}
                                        categoryOptions={categoryOptions}
                                        milestoneOptions={milestoneOptions}
                                        onCategoryChange={(values) =>
                                            setBulkCategoryIds(values && values.length ? values : [])
                                        }
                                            onClear={clearBulkForm}
                                            onDueDateChange={(value) => setBulkDueDate(value ?? null)}
                                            onManageMilestone={() => {
                                                router.push(
                                                    `/backlogs/projects/${projectId}/milestones?space=${encodeURIComponent(
                                                        space
                                                    )}&name=${encodeURIComponent(projectName)}`
                                                );
                                            }}
                                            onMilestoneChange={(values) =>
                                                setBulkMilestoneIds(values && values.length ? values : [])
                                            }
                                            onPriorityChange={(value) => setBulkPriorityId(value)}
                                            onStartDateChange={(value) => setBulkStartDate(value ?? null)}
                                            onStatusChange={(value) => setBulkStatusId(value)}
                                            onSubmit={handleBulkUpdate}
                                            priorityOptions={priorityOptions}
                                            selectedCount={selectedRowKeys.length}
                                            statusOptions={statusOptions}
                                            submitDisabled={
                                                !selectedRowKeys.length || !hasBulkUpdates || bulkUpdating
                                            }
                                        />
                                    </Card>
                                    <Modal
                                        title={
                                            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12}}>
                                                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                    <RobotOutlined style={{color: "#1677ff"}}/>
                                                    <div>
                                                        <div style={{fontWeight: 700, fontSize: 15}}>ผลการสรุปรายละเอียด (AI)</div>
                                                        <div style={{fontSize: 12, color: "#666"}}>
                                                            {processingResults.length > 0 ? (
                                                                <span>
                                                                    {processingResults.filter(r => r.status === 'success' || r.status === 'error').length}/{processingResults.length} processed
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Space size={6}>
                                                    <Tag color="processing" bordered={false} style={{padding: "2px 8px", borderRadius: 12}}>Live</Tag>
                                                </Space>
                                            </div>
                                        }
                                        open={resultsModalVisible}
                                        onCancel={() => setResultsModalVisible(false)}
                                        footer={null}
                                        width={1000}
                                        styles={{
                                            body: {
                                                padding: 0,
                                                
                                            },
                                        }}
                                    >
                                        <div style={{padding: 16}}>
                                            <div style={{display: "flex", justifyContent: "space-between", marginBottom: 10}}>
                                                <Space size={8}>
                                                    <Tag color="blue" bordered={false}>AI SUMMARY</Tag>
                                                    <Tag color="geekblue" bordered={false}>MD</Tag>
                                                </Space>
                                                <Space>
                                                    <Button
                                                        type="text"
                                                        icon={<ReloadOutlined/>}
                                                        onClick={() => setResultsModalVisible(false)}
                                                    >
                                                        ปิด/เปิดใหม่
                                                    </Button>
                                                </Space>
                                            </div>
                                            <div style={{maxHeight: "60vh", overflow: "auto"}}>
                                                <Table
                                                    dataSource={processingResults}
                                                    rowKey={(r) => String(r.issueKeyOrId)}
                                                    pagination={false}
                                                    scroll={{ y: 420 }}
                                                    columns={[
                                                        {title: 'งาน', dataIndex: 'title', key: 'title', width: 240},
                                                        {title: 'สถานะ', dataIndex: 'status', key: 'status', width: 120, render: (status: any) => {
                                                                if (status === 'pending') return <Tag icon={<LoadingOutlined />} color="processing">กำลังทำ</Tag>;
                                                                if (status === 'success') return <Tag icon={<CheckCircleOutlined />} color="success">สำเร็จ</Tag>;
                                                                return <Tag icon={<CloseCircleOutlined />} color="error">ล้มเหลว</Tag>;
                                                            }},
                                                        {title: 'ข้อความ', dataIndex: 'message', key: 'message', render: (_: any, row: any) => {
                                                                const displayText = row.message || '-';
                                                                const detailText = typeof row.detail === "string" ? row.detail : displayText;
                                                                const shouldShowMore = detailText && detailText.length > 120;
                                                                return (
                                                                    <Space direction="vertical" size={4}>
                                                                        <Typography.Paragraph
                                                                            style={{margin: 0}}
                                                                            ellipsis={shouldShowMore ? {rows: 2, tooltip: displayText} : false}
                                                                        >
                                                                            {displayText}
                                                                        </Typography.Paragraph>
                                                                        {shouldShowMore ? (
                                                                            <Button
                                                                                size="small"
                                                                                type="link"
                                                                                style={{padding: 0}}
                                                                                onClick={() => openDetailModal(
                                                                                    String(row.title || row.issueKeyOrId),
                                                                                    detailText,
                                                                                    row.statusCode
                                                                                )}
                                                                            >
                                                                                ดูรายละเอียดเพิ่มเติม
                                                                            </Button>
                                                                        ) : null}
                                                                    </Space>
                                                                );
                                                            }},
                                                        {title: 'สรุป', dataIndex: 'summary', key: 'summary', render: (md: any) => md ? <div style={{maxHeight: 160, overflow: 'auto'}} dangerouslySetInnerHTML={{__html: md}} /> : '-'},
                                                        {title: 'การกระทำ', key: 'action', width: 140, render: (_: any, row: any) => {
                                                                const hasFailed = row.status === 'error';
                                                                return (
                                                                    <Space>
                                                                        {hasFailed && <Button size="small" type="link" onClick={async () => {
                                                                            const payloads = perIssuePayloadsRef.current || [];
                                                                            const payload = payloads.find(p => String(p.issueKeyOrId) === String(row.issueKeyOrId));
                                                                            if (!payload) return;
                                                                            setProcessingResults(prev => prev.map(r => String(r.issueKeyOrId) === String(row.issueKeyOrId) ? {
                                                                                ...r,
                                                                                status: 'pending',
                                                                                message: undefined,
                                                                                detail: undefined,
                                                                                statusCode: undefined,
                                                                            } : r));
                                                                            const selectedIssueMap = new Map(
                                                                                issues.map((issueItem) => [issueItem.issueKey || String(issueItem.id), issueItem])
                                                                            );
                                                                            await processSingle(payload, selectedIssueMap);
                                                                            const entries = [payload].filter(p => Object.keys(p.updates || {}).length > 0);
                                                                            if (entries.length) {
                                                                                await axios.post("/api/v1/backlog/issues/bulk-update", {space, entries});
                                                                            }
                                                                        }}>Retry</Button>}
                                                                    </Space>
                                                                );
                                                            }}
                                                    ]}
                                                />
                                            </div>
                                            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12}}>
                                                <div>
                                                    <Button
                                                        type="default"
                                                        onClick={async () => {
                                                            const failedRows = processingResults.filter(r => r.status === 'error');
                                                            if (!failedRows.length) return;
                                                            const payloads = perIssuePayloadsRef.current || [];
                                                            const targets = failedRows.map(fr => payloads.find(p => String(p.issueKeyOrId) === String(fr.issueKeyOrId))).filter(Boolean) as any[];
                                                            if (!targets.length) return;
                                                            const failedIds = failedRows.map(fr => String(fr.issueKeyOrId));
                                                            setProcessingResults(prev => prev.map(r => failedIds.includes(String(r.issueKeyOrId)) ? {
                                                                ...r,
                                                                status: 'pending',
                                                                message: undefined,
                                                                detail: undefined,
                                                                statusCode: undefined,
                                                            } : r));
                                                            const concurrency = 4;
                                                            let idx = 0;
                                                            const runners = Array.from({length: concurrency}).map(async () => {
                                                                while (true) {
                                                                    const i = idx++;
                                                                    if (i >= targets.length) break;
                                                                    await processSingle(targets[i], new Map(issues.map(issueItem => [issueItem.issueKey || String(issueItem.id), issueItem])));
                                                                }
                                                            });
                                                            await Promise.all(runners);
                                                            const entries = (perIssuePayloadsRef.current || []).filter(p => p.updates && p.updates.description);
                                                            if (entries.length) await axios.post("/api/v1/backlog/issues/bulk-update", {space, entries});
                                                            toast.success('Retry เสร็จสิ้น: Retry ดำเนินการเสร็จแล้ว');
                                                        }}
                                                    >Retry Failed</Button>
                                                </div>
                                                <div>
                                                    <Space>
                                                        <Button onClick={() => setResultsModalVisible(false)}>Close</Button>
                                                        <Button type="primary" loading={saving} disabled={saving} onClick={async () => {
                                                            const entries = (perIssuePayloadsRef.current || []).filter(p => p.updates && p.updates.description);
                                                            if (!entries.length) {
                                                                toast.error('ไม่มีรายการบันทึก: ไม่มีสรุปที่สำเร็จเพื่อบันทึก');
                                                                return;
                                                            }
                                                            setSaving(true);
                                                            const toastId = toast.loading(`กำลังบันทึก ${entries.length} รายการ...`);
                                                            try {
                                                                await axios.post("/api/v1/backlog/issues/bulk-update", {space, entries});
                                                                toast.success(`บันทึกสำเร็จ: บันทึก ${entries.length} รายการเรียบร้อย`, {id: toastId});
                                                                setResultsModalVisible(false);
                                                            } catch (err: any) {
                                                                toast.error(err?.message || 'เกิดข้อผิดพลาด', {id: toastId});
                                                            } finally {
                                                                setSaving(false);
                                                            }
                                                        }}>Save Successful</Button>
                                                    </Space>
                                                </div>
                                            </div>
                                        </div>
                                    </Modal>
                                    <Modal
                                        open={detailModal.open}
                                        footer={null}
                                        width={720}
                                        onCancel={() => setDetailModal({open: false})}
                                        title={
                                            <div style={{display: "flex", flexDirection: "column", gap: 2}}>
                                                <Typography.Text strong>
                                                    รายละเอียดข้อผิดพลาด
                                                    {detailModal.statusCode ? ` (Status ${detailModal.statusCode})` : ""}
                                                </Typography.Text>
                                                {detailModal.title ? (
                                                    <Typography.Text type="secondary">
                                                        {detailModal.title}
                                                    </Typography.Text>
                                                ) : null}
                                            </div>
                                        }
                                    >
                                        <pre
                                            style={{
                                                background: "#f5f5f5",
                                                padding: 12,
                                                borderRadius: 8,
                                                maxHeight: 360,
                                                overflow: "auto",
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word",
                                                margin: 0,
                                            }}
                                        >
                                            {detailModal.content || "ไม่มีรายละเอียด"}
                                        </pre>
                                    </Modal>
                                </Space>
                            ),
                        },
                    ]}
                />
            </Skeleton>
        </Card>
    );
};

export default BulkUpdateSection;
