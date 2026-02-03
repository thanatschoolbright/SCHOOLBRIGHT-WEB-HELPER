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
  const userState = useAppSelector((state) => state.callAdminLogin);
  const schoolListState = useAppSelector(
    (state) => state.callGetSchoolListDetail,
  );

  /*
   * * Initialize Data from API
   */
  useEffect(() => {
    void dispatch(GET_SCHOOL_LIST());
  }, [dispatch]);

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
        const response = await dispatch(
          GET_BYPASS_TOKEN({ school_id: schoolId, user_email: userEmail }),
        ).unwrap();
        return response?.data?.bypass as string;
      } catch (error) {
        throw error;
      }
    },
    [dispatch, userState?.response?.data?.user_data?.email],
  );

  const openBypassLink = useCallback(
    async (params: BypassLinkParams): Promise<void> => {
      const {
        schoolId,
        schoolName,
        targetLabel,
        environmentLabel,
        url,
        extendPath,
      } = params;

      try {
        const token = await getBypassToken(schoolId);
        const finalUrl = `${url}${token}${extendPath ?? ""}`;
        const plainTargetName = sanitizeTargetName(targetLabel);
        const schoolDisplay = schoolName
          ? `${schoolName} (${schoolId})`
          : `${TRANSLATION("bypass_page.school_id_label")} ${schoolId}`;

        const copyToClipboard = async (text: string): Promise<void> => {
          try {
            await navigator.clipboard.writeText(text);
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
      } catch (error: any) {
        toast.error(TRANSLATION("bypass_page.bypass_failed"), {
          description:
            error?.message ?? TRANSLATION("bypass_page.error_occurred"),
        });
      }
    },
    [getBypassToken, TRANSLATION],
  );

  const handleBypassClick = useCallback(
    async (compositeKey: string, record: SchoolDetail): Promise<void> => {
      const [targetKey, environmentKey] = compositeKey.split("|");
      const target = BYPASS_TARGETS[targetKey];
      const environment = target?.environments?.[environmentKey];

      if (!target || !environment) {
        toast.error(TRANSLATION("bypass_page.server_config_not_found"));
        return;
      }

      await openBypassLink({
        schoolId: String(record?.school_id ?? ""),
        schoolName: record?.company_name,
        targetLabel: target.label,
        environmentLabel: environment.label,
        url: environment.url,
        extendPath: environment.extendPath,
      });

      setOpenDropdownFor(null);
    },
    [openBypassLink, TRANSLATION],
  );

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: any): void => {
      setFilters((prev) => ({ ...prev, [key]: value }));
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
