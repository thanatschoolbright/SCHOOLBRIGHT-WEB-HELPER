import { CallAPI as GET_BYPASS_TOKEN } from "@stores/actions/support/call-get-bypass-token";
import { CallAPI as GET_SCHOOL_LIST } from "@stores/actions/support/call-get-school-list-detail";
import { AppDispatch, useAppSelector } from "@stores/store";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { BypassToastActions } from "../components/bypass-toast-actions.component";
import type {
  BypassLinkParams,
  BypassPageState,
  FilterState,
  SchoolDetail,
} from "../types/bypass.types";
import { BYPASS_TARGETS } from "../utils/bypass-targets";
import {
  calculateStatistics,
  extractFilterOptions,
  extractTokenFromUrl,
  filterSchools,
  sanitizeTargetName,
} from "../utils/bypass.helpers";

export const useBypassPageData = () => {
  const { t: TRANSLATION } = useTranslation("translate");
  const dispatch = useDispatch<AppDispatch>();
  const userState = useAppSelector((rootState) => rootState.callAdminLogin);
  const schoolListState = useAppSelector(
    (rootState) => rootState.callGetSchoolListDetail,
  );

  /*
   * * Initialize Data from API
   */
  useEffect(() => {
    // โหลดเฉพาะถ้ายังไม่มีข้อมูลใน Redux หรือกำลังโหลดอยู่
    const hasData =
      Array.isArray(schoolListState.response?.data) &&
      schoolListState.response.data.length > 0;

    if (!hasData && !schoolListState.loading) {
      void dispatch(GET_SCHOOL_LIST());
    }
  }, [dispatch]); // รันเฉพาะตอน Mount เท่านั้น เพื่อป้องกันปัญหา Loop API

  /*
   * * Initialize Filters
   * * Default status to "Active" (string) or similar.
   * * Reverting to undefined to fix lint error 'boolean vs string' for now.
   * ! TODO: Find correct value for 'Active' status to set default.
   */
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    province: undefined,
    schoolType: undefined,
    grade: undefined,
    status: "active",
    schoolGroup: undefined,
  });
  const [pageSize, setPageSize] = useState<number>(50);
  const [openDropdownFor, setOpenDropdownFor] = useState<string | null>(null);

  const schoolDetails = useMemo<SchoolDetail[]>(() => {
    return schoolListState.response?.data?.data ?? [];
  }, [schoolListState.response?.data?.data]);

  const filterOptions = useMemo(
    () => extractFilterOptions(schoolDetails),
    [schoolDetails],
  );

  const filteredSchools = useMemo(
    () => filterSchools(schoolDetails, filters),
    [schoolDetails, filters],
  );

  const statistics = useMemo(
    () => calculateStatistics(schoolDetails),
    [schoolDetails],
  );

  const getBypassToken = useCallback(
    async (schoolId: string): Promise<string> => {
      try {
        const userEmail =
          userState?.response?.data?.user_data?.email ??
          "support@schoolbright.co";
        const bypassResponse = await dispatch(
          GET_BYPASS_TOKEN({ school_id: schoolId, user_email: userEmail }),
        ).unwrap();
        return bypassResponse?.data?.bypass as string;
      } catch (bypassError) {
        throw bypassError;
      }
    },
    [dispatch, userState?.response?.data?.user_data?.email],
  );

  const openBypassLink = useCallback(
    async (linkParams: BypassLinkParams): Promise<void> => {
      const {
        schoolId,
        schoolName,
        targetLabel,
        environmentLabel,
        url,
        extendPath,
      } = linkParams;

      try {
        const generatedToken = await getBypassToken(schoolId);
        const finalUrl = `${url}${generatedToken}${extendPath ?? ""}`;
        const plainTargetName = sanitizeTargetName(targetLabel);
        const schoolDisplay = schoolName
          ? `${schoolName} (${schoolId})`
          : `${TRANSLATION("bypass_page.school_id_label")} ${schoolId}`;

        const copyToClipboard = async (textToCopy: string): Promise<void> => {
          try {
            await navigator.clipboard.writeText(textToCopy);
            toast.success(TRANSLATION("bypass_page.copied_success"));
          } catch (copyError) {
            toast.error(
              `${TRANSLATION("bypass_page.copy_failed")}: ${copyError}`,
            );
          }
        };

        toast.success(
          `${TRANSLATION(
            "bypass_page.open_link_success",
          )} ${plainTargetName} · ${environmentLabel}`,
          {
            description: schoolDisplay,
            duration: 30000,
            action: BypassToastActions({
              finalUrl,
              onCopyLink: () => void copyToClipboard(finalUrl),
              onCopyToken: () => {
                const tokenOnly = extractTokenFromUrl(finalUrl);
                void copyToClipboard(tokenOnly);
              },
              TRANSLATION,
            }),
          },
        );

        window.open(finalUrl, "_blank", "noopener,noreferrer");
      } catch (bypassLinkError: any) {
        toast.error(TRANSLATION("bypass_page.bypass_failed"), {
          description:
            bypassLinkError?.message ??
            TRANSLATION("bypass_page.error_occurred"),
        });
      }
    },
    [getBypassToken, TRANSLATION],
  );

  const handleBypassClick = useCallback(
    async (compositeKey: string, schoolRecord: SchoolDetail): Promise<void> => {
      const [targetKey, environmentKey] = compositeKey.split("|");
      const targetConfig = BYPASS_TARGETS[targetKey];
      const environmentConfig = targetConfig?.environments?.[environmentKey];

      if (!targetConfig || !environmentConfig) {
        toast.error(TRANSLATION("bypass_page.server_config_not_found"));
        return;
      }

      await openBypassLink({
        schoolId: String(schoolRecord?.school_id ?? ""),
        schoolName: schoolRecord?.company_name,
        targetLabel: targetConfig.label,
        environmentLabel: environmentConfig.label,
        url: environmentConfig.url,
        extendPath: environmentConfig.extendPath,
      });

      setOpenDropdownFor(null);
    },
    [openBypassLink, TRANSLATION],
  );

  const handleFilterChange = useCallback(
    (filterKey: keyof FilterState, filterValue: any): void => {
      setFilters((previousFilters) => ({
        ...previousFilters,
        [filterKey]: filterValue,
      }));
    },
    [],
  );

  const handleClearFilters = useCallback((): void => {
    setFilters({
      search: "",
      province: undefined,
      schoolType: undefined,
      grade: undefined,
      status: undefined,
      schoolGroup: undefined,
    });
  }, []);

  const handleTableChange: TableProps<SchoolDetail>["onChange"] = useCallback(
    (pagination: any) => {
      if (pagination?.pageSize) {
        setPageSize(pagination.pageSize);
      }
    },
    [],
  );

  const handleDropdownOpenChange = useCallback(
    (open: boolean, schoolId: string): void => {
      setOpenDropdownFor(open ? schoolId : null);
    },
    [],
  );

  const state: BypassPageState = {
    filters,
    filterOptions,
    schoolDetails,
    filteredSchools,
    statistics,
    pageSize,
    openDropdownFor,
    loading: schoolListState.loading,
  };

  const handlers = {
    handleFilterChange,
    handleClearFilters,
    handleTableChange,
    handleBypassClick,
    handleDropdownOpenChange,
  };

  return { state, handlers };
};
