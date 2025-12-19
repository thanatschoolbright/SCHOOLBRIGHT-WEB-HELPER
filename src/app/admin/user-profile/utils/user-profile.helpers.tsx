import dayjs from "dayjs";
import { Collapse, Modal, Typography } from "antd";
import { TFunction } from "i18next";
import {
  UserFilters,
  UserProfile,
  UserSummaryMetric,
} from "../types/user-profile.types";

export const getPositionTagColor = (position?: string): string => {
  const colorMap: Record<string, string> = {
    ADMIN: "red",
    Manager: "blue",
    Developer: "green",
    QA: "purple",
    Support: "orange",
  };

  if (!position) return "default";
  return colorMap[position] ?? "geekblue";
};

export const persistUsersToLocal = (users: UserProfile[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("users", JSON.stringify(users));
};

export const filterUsers = (
  users: UserProfile[],
  filters: UserFilters,
  debouncedSearch: string
): UserProfile[] => {
  const query = debouncedSearch.toLowerCase();
  return users.filter((user) => {
    const matchesSearch =
      !query ||
      [
        user.email,
        user.employee_code,
        user.firstname,
        user.lastname,
        user.nickname,
      ]
        .filter(Boolean)
        .some((field) => field?.toLowerCase().includes(query));

    const matchesPosition = filters.position
      ? user.position === filters.position
      : true;

    const matchesDate = (() => {
      if (!filters.dateRange) return true;
      const [start, end] = filters.dateRange;
      if (!start || !end) return true;
      const createdAt =
        (user as Partial<UserProfile>).createdAt ??
        (user as Partial<UserProfile>).updatedAt;
      if (!createdAt) return true;
      const targetDate = dayjs(createdAt);
      if (!targetDate.isValid()) return true;
      const startOfRange = start.startOf("day");
      const endOfRange = end.endOf("day");
      return (
        targetDate.isSame(startOfRange) ||
        targetDate.isSame(endOfRange) ||
        (targetDate.isAfter(startOfRange) && targetDate.isBefore(endOfRange))
      );
    })();

    return matchesSearch && matchesPosition && matchesDate;
  });
};

export const buildSummaryMetrics = (
  users: UserProfile[],
  translation: TFunction<"translate">
): UserSummaryMetric[] => {
  const total = users.length;
  const withEmail = users.filter((user) => Boolean(user.email)).length;
  const uniquePositions = new Set(
    users.map((user) => user.position).filter(Boolean)
  ).size;

  return [
    {
      key: "total_users",
      label: translation("user_profile_page.summary_total_users"),
      value: total,
      tone: "primary",
      icon: "👥",
      description: translation("user_profile_page.summary_total_users_desc"),
    },
    {
      key: "contactable",
      label: translation("user_profile_page.summary_contactable"),
      value: withEmail,
      tone: "success",
      icon: "✉️",
      description: translation("user_profile_page.summary_contactable_desc"),
    },
    {
      key: "unique_positions",
      label: translation("user_profile_page.summary_unique_positions"),
      value: uniquePositions,
      tone: "warning",
      icon: "📌",
      description: translation(
        "user_profile_page.summary_unique_positions_desc"
      ),
    },
  ];
};

export const formatUserCopyText = (
  user: UserProfile,
  translation: TFunction<"translate">
): string =>
  [
    `╔═══════════════════════════════════════════╗`,
    `   ${translation("user_profile_page.copy_header")}`,
    `╚═══════════════════════════════════════════╝`,
    "",
    `🌐 ${translation("user_profile_page.copy_platforms")}`,
    `   • https://sb-helper.schoolbright.co`,
    `   • https://adminsystem.schoolbright.co`,
    "",
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 ${translation("user_profile_page.copy_name")}`,
    `   ${user.firstname ?? "-"} ${user.lastname ?? "-"}`,
    "",
    `🆔 ${translation("user_profile_page.copy_id")}`,
    `   ${user.admin_id ?? "-"}`,
    "",
    `📧 ${translation("user_profile_page.copy_email")}`,
    `   ${user.email ?? "-"}`,
    "",
    `📱 ${translation("user_profile_page.copy_phone")}`,
    `   ${user.tel ?? "-"}`,
    "",
    `💼 ${translation("user_profile_page.copy_position")}`,
    `   ${user.position ?? "-"}`,
    "",
    `🏷️ ${translation("user_profile_page.copy_employee_code")}`,
    `   ${user.employee_code ?? "-"}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");

const extractErrorMessage = (
  error: unknown
): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  return { message: JSON.stringify(error) };
};

export const showErrorModal = (
  translation: TFunction<"translate">,
  titleKey: string,
  error: unknown
): void => {
  const { message, stack } = extractErrorMessage(error);
  Modal.error({
    title: translation(titleKey),
    content: (
      <div className="space-y-2">
        <Typography.Text type="danger">{message}</Typography.Text>
        <Collapse
          size="small"
          items={[
            {
              key: "details",
              label: translation("user_profile_page.error_view_details"),
              children: (
                <Typography.Paragraph className="whitespace-pre-wrap text-xs">
                  {stack ?? message}
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      </div>
    ),
  });
};
