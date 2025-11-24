"use client";

import {Card, Skeleton, Space, Tabs, Typography, Modal, Table, Tag, Spin, Button} from "antd";
import {useRouter} from "next/navigation";
import React, {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {toast} from "sonner";
import {CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined} from '@ant-design/icons';
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
        index: number;
    }>>([]);
    const perIssuePayloadsRef = React.useRef<any[] | null>(null);
    const [saving, setSaving] = useState(false);

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
            setProcessingResults(prev => prev.map(r => String(r.issueKeyOrId) === String(payload.issueKeyOrId) ? {...r, status: 'success', summary: markdown} : r));
            return { success: true, payload };
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาด';
            setProcessingResults(prev => prev.map(r => String(r.issueKeyOrId) === String(payload.issueKeyOrId) ? {...r, status: 'error', message: msg} : r));
            return { success: false, error: msg };
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
                        setProcessingResults(prev => prev.map(r => String(r.issueKeyOrId) === String(payload.issueKeyOrId) ? {...r, status: 'pending', message: undefined} : r));
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
            toast.error(error?.response?.data?.message || error?.message || "อัปเดตไม่สำเร็จ", {id: toastId});
        } finally {
            setBulkUpdating(false);
        }
    };


    return (
        <Card
            size="small"
            styles={{body: {padding: 16}}}
            style={elevatedCardStyle}
            title="การอัปเดตแบบกลุ่ม"
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
                                <Space
                                    direction="vertical"
                                    size={12}
                                    style={{width: "100%"}}
                                >
                                    <Typography.Text type="secondary">
                                        เปิดใช้งานเพื่อให้ Gemini
                                        ช่วยเลือกหมวดหมู่และสรุปรายละเอียดก่อนส่งคำสั่งอัปเดตแบบกลุ่ม
                                    </Typography.Text>
                                    <AutoCategoryToggle
                                        disabled={
                                            autoCategoryLoading ||
                                            bulkUpdating ||
                                            !categoryOptions.length
                                        }
                                        enabled={autoCategoryEnabled}
                                        onChange={handleAutoCategoryToggle}
                                    />
                                    <AutoAiDescriptionToggle enabled={autoDescriptionEnabled}
                                                             onChange={handleAutoDescriptionToggle}
                                                             disabled={bulkUpdating}/>
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
                                        onAutoCategoryChange={handleAutoCategoryToggle}
                                        onAutoAiDescriptionChange={handleAutoDescriptionToggle}
                                        onCategoryChange={(values) =>
                                            setBulkCategoryIds(
                                                values && values.length ? values : []
                                            )
                                        }
                                        onClear={clearBulkForm}
                                        onDueDateChange={(value) =>
                                            setBulkDueDate(value ?? null)
                                        }
                                        onManageMilestone={() => {
                                            router.push(
                                                `/backlogs/projects/${projectId}/milestones?space=${encodeURIComponent(
                                                    space
                                                )}&name=${encodeURIComponent(projectName)}`
                                            );
                                        }}
                                        onMilestoneChange={(values) =>
                                            setBulkMilestoneIds(
                                                values && values.length ? values : []
                                            )
                                        }
                                        onPriorityChange={(value) =>
                                            setBulkPriorityId(value)
                                        }
                                        onStartDateChange={(value) =>
                                            setBulkStartDate(value ?? null)
                                        }
                                        onStatusChange={(value) => setBulkStatusId(value)}
                                        onSubmit={handleBulkUpdate}
                                        priorityOptions={priorityOptions}
                                        selectedCount={selectedRowKeys.length}
                                        statusOptions={statusOptions}
                                        submitDisabled={
                                            !selectedRowKeys.length ||
                                            !hasBulkUpdates ||
                                            bulkUpdating
                                        }
                                    />
                                    <Modal
                                        title={
                                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                                <div>ผลการสรุปรายละเอียด (AI)</div>
                                                <div style={{fontSize: 12, color: '#666'}}>
                                                    {processingResults.length > 0 ? (
                                                        <span>
                                                            {processingResults.filter(r => r.status === 'success' || r.status === 'error').length}/{processingResults.length} processed
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        }
                                        open={resultsModalVisible}
                                        onCancel={() => setResultsModalVisible(false)}
                                        footer={null}
                                        width={900}
                                        bodyStyle={{padding: 12}}
                                    >
                                        <div style={{maxHeight: '60vh', overflow: 'auto'}}>
                                            <Table
                                                dataSource={processingResults}
                                                rowKey={(r) => String(r.issueKeyOrId)}
                                                pagination={false}
                                                scroll={{ y: 420 }}
                                                columns={[
                                                    {title: 'งาน', dataIndex: 'title', key: 'title', width: 220},
                                                    {title: 'สถานะ', dataIndex: 'status', key: 'status', width: 120, render: (status: any) => {
                                                            if (status === 'pending') return <Tag icon={<LoadingOutlined />} color="processing">กำลังทำ</Tag>;
                                                            if (status === 'success') return <Tag icon={<CheckCircleOutlined />} color="success">สำเร็จ</Tag>;
                                                            return <Tag icon={<CloseCircleOutlined />} color="error">ล้มเหลว</Tag>;
                                                        }},
                                                    {title: 'ข้อความ', dataIndex: 'message', key: 'message', render: (text: any) => text || '-'},
                                                    {title: 'สรุป', dataIndex: 'summary', key: 'summary', render: (md: any) => md ? <div style={{maxHeight: 160, overflow: 'auto'}} dangerouslySetInnerHTML={{__html: md}} /> : '-'},
                                                    {title: 'การกระทำ', key: 'action', width: 140, render: (_: any, row: any) => {
                                                            const hasFailed = row.status === 'error';
                                                            return (
                                                                <Space>
                                                                    {hasFailed && <Button size="small" onClick={async () => {
                                                                        // find payload
                                                                        const payloads = perIssuePayloadsRef.current || [];
                                                                        const payload = payloads.find(p => String(p.issueKeyOrId) === String(row.issueKeyOrId));
                                                                        if (!payload) return;
                                                                        // mark pending (use string compare)
                                                                        setProcessingResults(prev => prev.map(r => String(r.issueKeyOrId) === String(row.issueKeyOrId) ? {...r, status: 'pending', message: undefined} : r));
                                                                        // re-run single
                                                                        const selectedIssueMap = new Map(
                                                                            issues.map((issueItem) => [issueItem.issueKey || String(issueItem.id), issueItem])
                                                                        );
                                                                        await processSingle(payload, selectedIssueMap);
                                                                        // after retry, if success, re-submit that single update
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
                                                        // Retry all failed
                                                        const failedRows = processingResults.filter(r => r.status === 'error');
                                                        if (!failedRows.length) return;
                                                        const payloads = perIssuePayloadsRef.current || [];
                                                        const targets = failedRows.map(fr => payloads.find(p => String(p.issueKeyOrId) === String(fr.issueKeyOrId))).filter(Boolean) as any[];
                                                        if (!targets.length) return;
                                                        // mark all failed as pending so UI updates immediately
                                                        const failedIds = failedRows.map(fr => String(fr.issueKeyOrId));
                                                        setProcessingResults(prev => prev.map(r => failedIds.includes(String(r.issueKeyOrId)) ? {...r, status: 'pending', message: undefined} : r));

                                                        // run with concurrency
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
                                                        // After retries, submit any newly successful entries
                                                        const entries = (perIssuePayloadsRef.current || []).filter(p => p.updates && p.updates.description);
                                                        if (entries.length) await axios.post("/api/v1/backlog/issues/bulk-update", {space, entries});
                                                        toast.success('Retry เสร็จสิ้น: Retry ดำเนินการเสร็จแล้ว');
                                                    }}
                                                >Retry Failed</Button>
                                            </div>
                                            <div>
                                                <Button style={{marginRight: 8}} onClick={() => setResultsModalVisible(false)}>Close</Button>
                                                <Button type="primary" loading={saving} disabled={saving} onClick={async () => {
                                                    // Save all successful summaries
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
                                            </div>
                                        </div>
                                    </Modal>
                                </Space>
                            ),
                        },
                        {
                            key: "manual",
                            label: "อัปเดตแบบกลุ่ม",
                            children: (
                                <BulkUpdatePanel
                                    autoCategoryEnabled={false}
                                    autoCategoryLoading={false}
                                    autoAiDescriptionEnabled={false}
                                    bulkCategoryIds={bulkCategoryIds}
                                    bulkDueDate={bulkDueDate}
                                    bulkMilestoneIds={bulkMilestoneIds}
                                    bulkPriorityId={bulkPriorityId}
                                    bulkStartDate={bulkStartDate}
                                    bulkStatusId={bulkStatusId}
                                    bulkUpdating={bulkUpdating}
                                    categoryOptions={categoryOptions}
                                    milestoneOptions={milestoneOptions}
                                    onAutoCategoryChange={handleAutoCategoryToggle}
                                    onAutoAiDescriptionChange={handleAutoDescriptionToggle}
                                    onCategoryChange={(values) =>
                                        setBulkCategoryIds(
                                            values && values.length ? values : []
                                        )
                                    }
                                    onClear={clearBulkForm}
                                    onDueDateChange={(value) =>
                                        setBulkDueDate(value ?? null)
                                    }
                                    onManageMilestone={() => {
                                        router.push(
                                            `/backlogs/projects/${projectId}/milestones?space=${encodeURIComponent(
                                                space
                                            )}&name=${encodeURIComponent(projectName)}`
                                        );
                                    }}
                                    onMilestoneChange={(values) =>
                                        setBulkMilestoneIds(
                                            values && values.length ? values : []
                                        )
                                    }
                                    onPriorityChange={(value) => setBulkPriorityId(value)}
                                    onStartDateChange={(value) =>
                                        setBulkStartDate(value ?? null)
                                    }
                                    onStatusChange={(value) => setBulkStatusId(value)}
                                    onSubmit={handleBulkUpdate}
                                    priorityOptions={priorityOptions}
                                    selectedCount={selectedRowKeys.length}
                                    statusOptions={statusOptions}
                                    submitDisabled={
                                        !selectedRowKeys.length ||
                                        !hasBulkUpdates ||
                                        bulkUpdating
                                    }
                                    showAutoCategoryToggle={false}
                                />
                            ),
                        },
                    ]}
                />
            </Skeleton>
        </Card>
    );
};

export default BulkUpdateSection;

