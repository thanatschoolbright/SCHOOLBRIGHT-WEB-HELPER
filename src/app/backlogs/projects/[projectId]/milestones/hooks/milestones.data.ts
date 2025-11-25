"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { App, Form } from "antd";
import dayjs from "dayjs";
import { toast } from "sonner";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import type { Milestone, MilestoneFormValues } from "../types/milestones.types";
import { buildErrorContent } from "../utils/milestones.helpers";
import { useTranslation } from "react-i18next";

export type UseMilestonesDataResult = {
  form: ReturnType<typeof Form.useForm<MilestoneFormValues>>[0];
  milestones: Milestone[];
  loading: boolean;
  saving: boolean;
  deletingId: number | null;
  editingMilestone: Milestone | null;
  space: string;
  projectId: number;
  isValidProject: boolean;
  onRefresh: () => Promise<void>;
  onSubmit: (values: MilestoneFormValues) => Promise<void>;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestoneId: number) => Promise<void>;
  onResetForm: () => void;
};

export const useMilestonesData = (): UseMilestonesDataResult => {
  const params = useParams();
  const searchParams = useSearchParams();
  const [form] = Form.useForm<MilestoneFormValues>();
  const { t: TRANSLATION } = useTranslation("translate");
  const { modal } = App.useApp();

  const space = searchParams?.get("space") ?? "";
  const projectIdParam = params?.projectId;
  const projectId =
    typeof projectIdParam === "string" ? Number(projectIdParam) : NaN;

  const isValidProject = useMemo(
    () => Number.isFinite(projectId) && projectId > 0,
    [projectId]
  );

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );

  const loadMilestones = useCallback(
    async (showToast = true) => {
      if (!isValidProject || !space) return;
      const toastId = showToast
        ? toast.loading(TRANSLATION("milestone_page.toast_load"))
        : undefined;
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/v1/backlog/projects/${projectId}/milestones`,
          {
            params: { space, projectId },
          }
        );
        setMilestones((response.data?.data as Milestone[]) ?? []);
        if (toastId !== undefined) {
          toast.success(TRANSLATION("milestone_page.toast_load_success"), { id: toastId });
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          TRANSLATION("milestone_page.toast_load_error");
        if (toastId !== undefined) {
          toast.error(errorMessage, { id: toastId });
        } else {
          toast.error(errorMessage);
        }
        modal.error({
          title: "Error",
          content: buildErrorContent(errorMessage, error?.stack),
        });
      } finally {
        setLoading(false);
      }
    },
    [TRANSLATION, isValidProject, modal, projectId, space]
  );

  useEffect(() => {
    if (!isValidProject || !space) return;
    loadMilestones(false);
  }, [isValidProject, loadMilestones, space]);

  useEffect(() => {
    form.setFieldsValue({ archived: false });
  }, [form]);

  const resetForm = useCallback(() => {
    setEditingMilestone(null);
    form.resetFields();
    form.setFieldsValue({ archived: false });
  }, [form]);

  const handleEditMilestone = useCallback(
    (milestone: Milestone) => {
      setEditingMilestone(milestone);
      form.setFieldsValue({
        name: milestone.name,
        description: milestone.description ?? "",
        startDate: milestone.startDate ? dayjs(milestone.startDate) : null,
        releaseDueDate: milestone.releaseDueDate
          ? dayjs(milestone.releaseDueDate)
          : null,
        archived: Boolean(milestone.archived),
      });
    },
    [form]
  );

  const persistMilestone = useCallback(
    async (values: MilestoneFormValues) => {
      if (!isValidProject || !space) return;
      setSaving(true);

      const payload: Record<string, unknown> = {
        archived: values.archived,
        description: values.description,
        name: values.name,
        releaseDueDate: values.releaseDueDate
          ? values.releaseDueDate.format("YYYY-MM-DD")
          : null,
        startDate: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
      };

      const toastId = toast.loading(
        editingMilestone
          ? TRANSLATION("milestone_page.toast_save_editing")
          : TRANSLATION("milestone_page.toast_save_creating")
      );

      try {
        if (editingMilestone) {
          await axios.patch(
            `/api/v1/backlog/projects/${projectId}/milestones/${editingMilestone.id}`,
            payload,
            { params: { space, projectId } }
          );
          toast.success(TRANSLATION("milestone_page.toast_save_edit_success"), {
            id: toastId,
          });
        } else {
          await axios.post(
            `/api/v1/backlog/projects/${projectId}/milestones`,
            payload,
            {
              params: { space, projectId },
            }
          );
          toast.success(TRANSLATION("milestone_page.toast_save_create_success"), {
            id: toastId,
          });
        }
        resetForm();
        await loadMilestones(false);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          TRANSLATION("milestone_page.toast_save_error");
        toast.error(errorMessage, { id: toastId });
        modal.error({
          title: "Error",
          content: buildErrorContent(errorMessage, error?.stack),
        });
      } finally {
        setSaving(false);
      }
    },
    [editingMilestone, isValidProject, loadMilestones, modal, projectId, resetForm, space]
  );

  const handleDeleteMilestone = useCallback(
    async (milestoneId: number) => {
      if (!isValidProject || !space) return;
      setDeletingId(milestoneId);
      const toastId = toast.loading(TRANSLATION("milestone_page.toast_delete_loading"));
      try {
        await axios.delete(
          `/api/v1/backlog/projects/${projectId}/milestones/${milestoneId}`,
          {
            params: { space, projectId },
          }
        );
        toast.success(TRANSLATION("milestone_page.toast_delete_success"), { id: toastId });
        if (editingMilestone?.id === milestoneId) {
          resetForm();
        }
        await loadMilestones(false);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          TRANSLATION("milestone_page.toast_delete_error");
        toast.error(errorMessage, { id: toastId });
        modal.error({
          title: "Error",
          content: buildErrorContent(errorMessage, error?.stack),
        });
      } finally {
        setDeletingId(null);
      }
    },
    [
      TRANSLATION,
      editingMilestone,
      isValidProject,
      loadMilestones,
      modal,
      projectId,
      resetForm,
      space,
    ]
  );

  const onRefresh = useCallback(async () => {
    await loadMilestones();
  }, [loadMilestones]);

  return {
    form,
    milestones,
    loading,
    saving,
    deletingId,
    editingMilestone,
    space,
    projectId,
    isValidProject,
    onRefresh,
    onSubmit: persistMilestone,
    onEdit: handleEditMilestone,
    onDelete: handleDeleteMilestone,
    onResetForm: resetForm,
  };
};
