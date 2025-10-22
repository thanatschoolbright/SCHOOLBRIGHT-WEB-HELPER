"use client";

import {Card, Skeleton, Space, Tabs, Typography} from "antd";
import {useRouter} from "next/navigation";
import React, {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {toast} from "sonner";
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
                    for (const payload of perIssuePayloads) {
                        const issue = selectedIssueMap.get(String(payload.issueKeyOrId));
                        toast.loading(`กำลังสรุปรายละเอียดด้วย Gemini...`, {
                            id: toastId,
                            description: `Task: ${issue?.summary || payload.issueKeyOrId}`
                        });

                        if (issue) {
                            const response = await axios.post("/api/v1/ai/gemini/summarize", {
                                summary: issue.summary,
                                description: issue.description,
                            });
                            payload.updates.description = response?.data?.data?.markdown || "";
                        }
                    }
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
                                        showAutoCategoryToggle={false}
                                    />
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

