"use client";

import { createElement, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "antd";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  setLoading,
  setIssues,
  setSelectedRowKeys,
  setOptions,
  setOptionsLoading,
  setFilters,
  resetFilters,
  setPagination,
} from "@stores/reducers/issues-slice";
import { AppDispatch, RootState } from "@stores/store";
import {
  IssuesPageParams,
  IssueOption,
  ProjectMetadataResponse,
} from "../types/issues.types";
import { buildErrorDetails } from "../utils/issues.helpers";

export const useIssuesPageData = ({
  projectId,
  space,
  projectReady,
  modalApi,
}: IssuesPageParams) => {
  const dispatch = useDispatch<AppDispatch>();
  const { t: TRANSLATION } = useTranslation("translate");

  const { page, pageSize, filters, total, loading, issues } = useSelector(
    (state: RootState) => state.issues
  );

  // ... (existing code)

  const state = useMemo(
    () => ({
      page,
      pageSize,
      filters,
      total,
      loading,
      issues,
    }),
    [filters, loading, page, pageSize, total, issues]
  );

  const showErrorModal = useCallback(
    (titleKey: string, error: unknown) => {
      const { message, details } = buildErrorDetails(error);
      const contentNode = createElement(
        "div",
        { className: "flex flex-col gap-2" },
        createElement("span", null, message),
        createElement(
          "details",
          { className: "text-xs text-gray-500" },
          createElement(
            "summary",
            { className: "cursor-pointer" },
            TRANSLATION("backlog_issues_page.view_details")
          ),
          createElement(
            "pre",
            { className: "whitespace-pre-wrap text-gray-500 mt-2" },
            details
          )
        )
      );
      (modalApi ?? Modal).error({
        title: TRANSLATION(titleKey),
        content: contentNode,
      });
    },
    [TRANSLATION]
  );

  const loadIssues = useCallback(async () => {
    if (!projectReady) return;
    const toastId = toast.loading(
      TRANSLATION("backlog_issues_page.loading_issues")
    );
    dispatch(setLoading(true));
    try {
      const {
        keyword,
        statusIds,
        priorityIds,
        issueTypeIds,
        assigneeIds,
        dateRange,
      } = filters;

      const apiParams: Record<string, unknown> = {
        space,
        projectId,
        page,
        count: pageSize,
        offset: Math.max(0, (page - 1) * pageSize),
      };

      if (keyword?.trim()) apiParams.q = keyword.trim();
      if (statusIds?.length) apiParams.statusId = statusIds;
      if (priorityIds?.length) apiParams.priorityId = priorityIds;
      if (issueTypeIds?.length) apiParams.issueTypeId = issueTypeIds;
      if (assigneeIds?.length) apiParams.assigneeId = assigneeIds;
      if (dateRange?.[0] && dateRange?.[1]) {
        apiParams.updatedSince = dateRange[0].toISOString();
        apiParams.updatedUntil = dateRange[1].toISOString();
      }

      const response = await axios.get("/api/v1/backlog/issues", {
        params: apiParams,
      });
      let items = response.data?.data?.items || [];
      const totalItems = Number(response.data?.data?.total) || 0;

      // Apply AI Summary filter (client-side)
      if (filters.aiSummaryFilter === "with_ai") {
        items = items.filter(
          (issue: any) =>
            issue.summary?.includes("AI") || issue.description?.includes("AI")
        );
      } else if (filters.aiSummaryFilter === "without_ai") {
        items = items.filter(
          (issue: any) =>
            !issue.summary?.includes("AI") && !issue.description?.includes("AI")
        );
      }

      dispatch(setIssues({ issues: items, total: totalItems }));
      dispatch(setSelectedRowKeys([]));
      toast.success(TRANSLATION("backlog_issues_page.load_issues_success"), {
        id: toastId,
      });
    } catch (error) {
      toast.error(TRANSLATION("backlog_issues_page.load_issues_fail"), {
        id: toastId,
      });
      showErrorModal("backlog_issues_page.error_title", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [
    dispatch,
    filters,
    page,
    pageSize,
    projectId,
    projectReady,
    space,
    TRANSLATION,
    showErrorModal,
  ]);

  const loadOptions = useCallback(async () => {
    if (!projectReady) return;
    dispatch(setOptionsLoading(true));
    const toastId = toast.loading(
      TRANSLATION("backlog_issues_page.loading_meta")
    );

    try {
      const [statusesRes, prioritiesRes, issueTypesRes, usersRes] =
        await Promise.all([
          axios.get("/api/v1/backlog/project-statuses", {
            params: { space, projectId },
          }),
          axios.get("/api/v1/backlog/priorities", { params: { space } }),
          axios.get("/api/v1/backlog/issue-types", {
            params: { space, projectId },
          }),
          axios.get("/api/v1/backlog/users", {
            params: { space, projectId },
          }),
        ]);

      const statusOptions: any[] = (statusesRes?.data?.data || []).map(
        (s: any) => ({
          label: s.name,
          value: s.id,
        })
      );
      const priorityOptions: any[] = (prioritiesRes?.data?.data || []).map(
        (p: any) => ({ label: p.name, value: p.id })
      );
      const issueTypeOptions: any[] = (issueTypesRes?.data?.data || []).map(
        (it: any) => ({
          label: it.name,
          value: it.id,
        })
      );
      const assigneeOptions: any[] = (usersRes?.data?.data || []).map(
        (u: any) => ({
          label: u.name,
          value: u.id,
        })
      );

      dispatch(
        setOptions({
          statusOptions,
          priorityOptions,
          issueTypeOptions,
          assigneeOptions,
        })
      );
      const openStatusIds = (statusesRes?.data?.data || [])
        .filter((s: any) => !/closed/i.test(s?.name ?? ""))
        .map((s: any) => s.id);
      dispatch(
        setFilters({
          statusIds: openStatusIds,
          priorityIds: priorityOptions
            .map((p) => Number(p.value))
            .filter((v) => !isNaN(v)),
          issueTypeIds: issueTypeOptions
            .map((it) => Number(it.value))
            .filter((v) => !isNaN(v)),
        })
      );

      if (projectId) {
        const metadataRes = await axios.get<ProjectMetadataResponse>(
          `/api/v1/backlog/projects/${projectId}/metadata`,
          { params: { space } }
        );
        const metadata = metadataRes?.data?.data;
        const categoryOptions: any[] = (metadata?.categories || []).map(
          (c) => ({
            label: c.name,
            value: c.id,
          })
        );
        const milestoneOptions: any[] = (metadata?.milestones || []).map(
          (m) => ({
            label: m.name,
            value: m.id,
          })
        );
        dispatch(setOptions({ categoryOptions, milestoneOptions }));
      }

      toast.success(TRANSLATION("backlog_issues_page.load_meta_success"), {
        id: toastId,
      });
    } catch (error) {
      toast.error(TRANSLATION("backlog_issues_page.load_meta_fail"), {
        id: toastId,
      });
      showErrorModal("backlog_issues_page.error_title", error);
    } finally {
      dispatch(setOptionsLoading(false));
    }
  }, [dispatch, projectReady, TRANSLATION, projectId, space, showErrorModal]);

  const handleSearchKeyword = useCallback(
    (value: string) => {
      dispatch(setFilters({ keyword: value }));
      dispatch(setPagination({ page: 1, pageSize }));
    },
    [dispatch, pageSize]
  );

  const resetAll = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  return {
    state,
    loadIssues,
    loadOptions,
    handleSearchKeyword,
    resetAll,
  };
};
