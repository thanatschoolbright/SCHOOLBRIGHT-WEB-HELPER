"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { Card, Table, Select, Space, Dropdown, Button, Tag } from "antd";
import {
  AlertFilled,
  CrownFilled,
  RocketFilled,
  SafetyCertificateFilled,
  StarFilled,
  ThunderboltOutlined,
  ToolOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CallAPI as GET_SCHOOL_LIST_DETAIL } from "@stores/actions/support/call-get-school-list-detail";
import { CallAPI as GET_BYPASS_TOKEN } from "@stores/actions/support/call-get-bypass-token";
import * as type from "@stores/type";
import { toast } from "sonner";
import type { MenuProps, TableProps } from "antd";
import type { ColumnsType } from "antd/es/table/interface";

const collator = new Intl.Collator("th", {
  sensitivity: "base",
  numeric: true,
});

const statusColorMap: Record<string, string> = {
  active: "green",
  inactive: "red",
};

const gradeAnimationStyles = `
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 22px rgba(255, 215, 0, 0.85); }
}

@keyframes shine {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
`;

type BypassTarget = {
  label: string;
  environments: Record<
    string,
    { label: string; url: string; extendPath?: string }
  >;
};

type BypassLinkContext = {
  schoolId: string;
  schoolName?: string;
  targetLabel: string;
  environmentLabel: string;
  url: string;
  extendPath?: string;
};

const sanitizeTargetName = (label: string) => {
  const trimmed = (label ?? "").trim();
  const cleaned = trimmed.replace(/^[^A-Za-z0-9\u0E00-\u0E7F]+/, "").trim();
  return cleaned || trimmed;
};

const bypassTargets: Record<string, BypassTarget> = {
  system: {
    label: "✨ System",
    environments: {
      production: {
        label: "Production",
        url: "https://system.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      staging: {
        label: "Beta",
        url: "https://beta.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "Development",
        url: "https://dev.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  academic: {
    label: "👩🏻‍🏫 Academic",
    environments: {
      production: {
        label: "Production",
        url: "https://academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "Development",
        url: "https://dev-academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      ui: {
        label: "Dev UI",
        url: "https://dev-ui-academic.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  accounting: {
    label: "🧾 Accounting",
    environments: {
      production: {
        label: "Production",
        url: "https://accounting.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "Development",
        url: "https://dev-accounting.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  library: {
    label: "📔 Library",
    environments: {
      production: {
        label: "Production",
        url: "https://library.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "Development",
        url: "https://library-dev.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  canteen: {
    label: "🥪 Canteen",
    environments: {
      production: {
        label: "Production",
        url: "https://canteen.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
      development: {
        label: "Development",
        url: "https://dev-canteen.schoolbright.co/BypassSuperAdmin.aspx?q=",
      },
    },
  },
  kindergarten: {
    label: "👶🏻 Kindergarten",
    environments: {
      production: {
        label: "Production",
        url: "https://kindergarten.schoolbright.co/Home/ByPass?token=",
      },
      legacy: {
        label: "Old Course",
        url: "https://kindergarten-dev.schoolbright.co/Home/ByPass?token=",
      },
      development: {
        label: "New Development",
        url: "https://kindergarten-log.schoolbright.co/Home/ByPass?token=",
      },
    },
  },
  activity: {
    label: "🎃 Mark Activity",
    environments: {
      production: {
        label: "Production",
        url: "https://markactivity.schoolbright.co/Home/ByPass?token=",
        extendPath: "&page=ActivityManagement",
      },
      development: {
        label: "Development",
        url: "https://dev-markactivity.schoolbright.co/Home/ByPass?token=",
        extendPath: "&page=ActivityManagement",
      },
    },
  },
  exam: {
    label: "🚀 SB Exam",
    environments: {
      production: {
        label: "Production",
        url: "https://exam.schoolbright.co/home/getToken?token=",
      },
      development: {
        label: "Development",
        url: "https://dev-exam.schoolbright.co/home/getToken?token=",
      },
    },
  },
};

const buildMenuItems = (): MenuProps["items"] =>
  Object.entries(bypassTargets).map(([targetKey, target]) => ({
    key: targetKey,
    label: target.label,
    children: Object.entries(target.environments).map(
      ([environmentKey, environment]) => ({
        key: `${targetKey}|${environmentKey}`,
        label: environment.label,
      })
    ),
  }));

const compareValues = (a: unknown, b: unknown) =>
  collator.compare(String(a ?? ""), String(b ?? ""));

type SchoolDetail =
  type.ResponseSchoolListWithMoreDetail["data"]["data"][number];

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const schoolListState = useAppSelector((state) => state.callSchoolList);
  const schoolListWithDetail = useAppSelector(
    (state) => state.callGetSchooListDetail
  );
  const userState = useAppSelector((state) => state.callAdminLogin);

  const [selectedSchool, setSelectedSchool] = useState<string | undefined>();
  const [pageSize, setPageSize] = useState<number>(10);
  const [openDropdownFor, setOpenDropdownFor] = useState<string | null>(null);

  useEffect(() => {
    dispatch(GET_SCHOOL_LIST_DETAIL());
  }, [dispatch]);

  const schoolOptions = useMemo(() => {
    const rawSchools = schoolListWithDetail?.response?.data?.data ?? [];
    console.info("INFO RAW SCHOOL", rawSchools);
    return rawSchools.map((item: any) => ({
      label: `${item.company_name} (${item.school_id})`,
      value: String(item.school_id),
    }));
  }, [schoolListWithDetail?.response?.data?.data]);

  const schoolDetails = useMemo<SchoolDetail[]>(() => {
    return (schoolListWithDetail?.response?.data?.data ?? []) as SchoolDetail[];
  }, [schoolListWithDetail?.response?.data?.data]);

  const filteredDetails = useMemo(() => {
    if (!selectedSchool) {
      return schoolDetails;
    }

    return schoolDetails.filter(
      (detail) => String(detail.school_id) === String(selectedSchool)
    );
  }, [schoolDetails, selectedSchool]);

  const isLoading = useMemo(
    () =>
      Boolean(schoolListState?.loading) ||
      Boolean(schoolListWithDetail?.loading),
    [schoolListState?.loading, schoolListWithDetail?.loading]
  );

  const getBypassToken = useCallback(
    async (schoolId: string) => {
      const userEmail =
        userState?.response?.data?.user_data?.email ??
        "support@schoolbright.co";
      const response = await dispatch(
        GET_BYPASS_TOKEN({ school_id: schoolId, user_email: userEmail })
      ).unwrap();
      return response?.data?.bypass as string;
    },
    [dispatch, userState?.response?.data?.user_data?.email]
  );

  const openBypassLink = useCallback(
    async ({
      schoolId,
      schoolName,
      targetLabel,
      environmentLabel,
      url,
      extendPath,
    }: BypassLinkContext) => {
      try {
        const token = await getBypassToken(schoolId);
        const finalUrl = `${url}${token}${extendPath ?? ""}`;
        const plainTargetName = sanitizeTargetName(targetLabel);
        const environmentDisplay = `${plainTargetName} · ${environmentLabel}`;
        const schoolDisplay = schoolName
          ? `${schoolName} (${schoolId})`
          : `รหัสโรงเรียน ${schoolId}`;
        const copyPayload = [
          schoolDisplay,
          "",
          `🚀 ลิงก์สำหรับเข้าสู่ระบบ (${environmentDisplay})`,
          finalUrl,
        ].join("\n");

        const handleCopy = () => {
          navigator.clipboard
            .writeText(copyPayload)
            .then(() => {
              toast.success("คัดลอกลิงก์แล้ว", {
                description: schoolDisplay,
                duration: 2500,
              });
            })
            .catch(() => {
              toast.error("คัดลอกลิงก์ไม่สำเร็จ", {
                description: "โปรดลองอีกครั้ง",
                duration: 2500,
              });
            });
        };

        toast.success("ส่งลิงก์เข้าสู่ระบบสำเร็จ", {
          description: (
            <div style={{ display: "grid", gap: 8, color: "#0f172a" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {schoolDisplay}
              </div>
              <div style={{ fontSize: 14 }}>
                <span aria-hidden style={{ marginRight: 6 }}>
                  🚀
                </span>
                <strong>{`ลิงก์สำหรับเข้าสู่ระบบ (${environmentDisplay})`}</strong>
              </div>
              <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily:
                    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  fontSize: 13,
                  color: "#0ea5e9",
                  wordBreak: "break-all",
                }}
              >
                {finalUrl}
              </a>
            </div>
          ),
          duration: 12000,

          action: {
            label: "คัดลอกลิงก์",
            onClick: handleCopy,
          },
        });

        window.open(finalUrl, "_blank", "noopener,noreferrer");
      } catch (error: any) {
        toast.error("ไม่สามารถสร้าง Bypass ได้", {
          description: error?.message ?? "Unexpected error",
          duration: 5000,
        });
      }
    },
    [getBypassToken]
  );

  const handleMenuItemClick = useCallback(
    async (compositeKey: string, record: SchoolDetail) => {
      const [targetKey, environmentKey] = compositeKey.split("|");
      const target = bypassTargets[targetKey];
      const environment = target?.environments?.[environmentKey];

      if (!target || !environment) {
        toast.error("ไม่พบการตั้งค่าเซิร์ฟเวอร์");
        return;
      }

      const schoolId = String(record?.school_id ?? "");

      if (!schoolId) {
        toast.error("ไม่พบรหัสโรงเรียน");
        return;
      }

      await openBypassLink({
        schoolId,
        schoolName: record?.company_name ?? undefined,
        targetLabel: target.label,
        environmentLabel: environment.label,
        url: environment.url,
        extendPath: environment.extendPath,
      });

      setOpenDropdownFor(null);
    },
    [openBypassLink]
  );

  const menuItems = useMemo(() => buildMenuItems(), []);

  const gradeFilters = useMemo(
    () =>
      ["A", "B", "C", "D", "E", "F"].map((grade) => ({
        text: grade,
        value: grade,
      })),
    []
  );

  const statusFilters = useMemo(
    () => [
      { text: "Active", value: "active" },
      { text: "Inactive", value: "inactive" },
    ],
    []
  );

  const columns = useMemo<ColumnsType<SchoolDetail>>(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        width: 80,
        align: "center",
        fixed: "left",
        render: (_value, _record, index) => index + 1,
      },
      {
        title: "รหัสโรงเรียน",
        dataIndex: "school_id",
        key: "school_id",
        sorter: (a, b) => compareValues(a.school_id, b.school_id),
        render: (value?: string | number) =>
          value !== undefined && value !== null && value !== ""
            ? String(value)
            : "-",
      },
      {
        title: "ชื่อโรงเรียน",
        dataIndex: "company_name",
        key: "company_name",
        sorter: (a, b) => compareValues(a.company_name, b.company_name),
        render: (value?: string) => value || "-",
      },
      {
        title: "จังหวัด",
        dataIndex: "province",
        key: "province",
        sorter: (a, b) => compareValues(a.province, b.province),
        render: (value?: string) => value || "-",
      },
      {
        title: "กลุ่มโรงเรียน",
        dataIndex: "school_group",
        key: "school_group",
        sorter: (a, b) => compareValues(a.school_group, b.school_group),
        render: (value?: string) => value || "-",
      },
      {
        title: "ระดับชั้นที่เปิดสอน",
        dataIndex: "school_class",
        key: "school_class",
        sorter: (a, b) => compareValues(a.school_class, b.school_class),
        render: (value?: string) => value || "-",
      },
      {
        title: "เกรดโรงเรียน",
        dataIndex: "school_grade",
        key: "school_grade",
        sorter: (a, b) => compareValues(a.school_grade, b.school_grade),
        filters: gradeFilters,
        render: (value?: string) => {
          const normalized = (value ?? "-").trim().toUpperCase();
          const gradeMap: Record<
            string,
            {
              gradient: string;
              glow: string;
              icon: React.ReactNode;
            }
          > = {
            A: {
              gradient: "linear-gradient(135deg, #fffb7d 0%, #ffb347 100%)",
              glow: "0 0 16px rgba(255, 180, 55, 0.75)",
              icon: <CrownFilled style={{ color: "#d97706" }} />,
            },
            B: {
              gradient: "linear-gradient(135deg, #d9f7be 0%, #73d13d 100%)",
              glow: "0 0 14px rgba(115, 209, 61, 0.6)",
              icon: <StarFilled style={{ color: "#16a34a" }} />,
            },
            C: {
              gradient: "linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%)",
              glow: "0 0 12px rgba(96, 165, 250, 0.55)",
              icon: <RocketFilled style={{ color: "#2563eb" }} />,
            },
            D: {
              gradient: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)",
              glow: "0 0 10px rgba(251, 191, 36, 0.5)",
              icon: <ToolOutlined style={{ color: "#d97706" }} />,
            },
            E: {
              gradient: "linear-gradient(135deg, #fee2e2 0%, #f87171 100%)",
              glow: "0 0 10px rgba(248, 113, 113, 0.45)",
              icon: <AlertFilled style={{ color: "#dc2626" }} />,
            },
            F: {
              gradient: "linear-gradient(135deg, #f3f4f6 0%, #cbd5f5 100%)",
              glow: "0 0 10px rgba(99, 102, 241, 0.35)",
              icon: <ThunderboltOutlined style={{ color: "#6366f1" }} />,
            },
            "-": {
              gradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              glow: "0 0 8px rgba(148, 163, 184, 0.35)",
              icon: <SafetyCertificateFilled style={{ color: "#64748b" }} />,
            },
          };

          const config = gradeMap[normalized] ?? gradeMap["-"];

          return (
            <div
              className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{
                background: config.gradient,
                boxShadow: config.glow,
                color: "#1f2937",
                fontWeight: 700,
                position: "relative",
                overflow: "hidden",
                minWidth: 110,
                justifyContent: "center",
                animation: "pulseGlow 3s ease-in-out infinite",
              }}
            >
              <span className="text-lg">{config.icon}</span>
              <span>{normalized}</span>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(120deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)",
                  transform: "translateX(-100%)",
                  animation: "shine 4s ease-in-out infinite",
                }}
              />
            </div>
          );
        },

        onFilter: (value, record) =>
          (record.school_grade ?? "-").trim().toUpperCase() === value,
      },
      {
        title: "สถานะการใช้งาน",
        dataIndex: "isActive",
        key: "isActive",
        sorter: (a, b) => compareValues(a.isActive, b.isActive),
        filters: statusFilters,
        render: (value?: string) => {
          if (!value) {
            return <Tag>-</Tag>;
          }
          const normalized = value.toLowerCase();
          const color = statusColorMap[normalized] ?? "default";
          return <Tag color={color}>{value}</Tag>;
        },
        onFilter: (value, record) =>
          (record.isActive ?? "").toLowerCase() === String(value).toLowerCase(),
      },
      {
        title: "เข้าสู่ระบบ",
        key: "actions",
        fixed: "right",
        render: (_value, record) => {
          const schoolId = String(record.school_id ?? "");
          const isOpen = openDropdownFor === schoolId;

          return (
            <Dropdown
              menu={{
                items: menuItems,
                onClick: ({ key }) => handleMenuItemClick(String(key), record),
              }}
              trigger={["click"]}
              placement="bottomRight"
              arrow
              open={isOpen}
              onOpenChange={(open) => {
                setOpenDropdownFor(open ? schoolId : null);
              }}
            >
              <Button
                type="primary"
                icon={<DownOutlined rotate={isOpen ? 180 : 0} />}
                onClick={(e) => e.preventDefault()}
              >
                เลือกเซิร์ฟเวอร์
              </Button>
            </Dropdown>
          );
        },
      },
    ],
    [menuItems, handleMenuItemClick, openDropdownFor]
  );

  const handleTableChange: TableProps<SchoolDetail>["onChange"] = (
    pagination
  ) => {
    if (pagination?.pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  return (
    <DashboardLayout>
      <style>{gradeAnimationStyles}</style>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="ค้นหาโรงเรียน" variant="outlined">
          <div className="flex items-center gap-2">
            <Select
              allowClear
              showSearch
              placeholder="เลือกโรงเรียน"
              optionFilterProp="label"
              options={schoolOptions}
              value={selectedSchool}
              onChange={(value) => setSelectedSchool(value || undefined)}
              style={{ width: "100%" }}
            />
            <Button
              danger
              size="small"
              onClick={() => setSelectedSchool(undefined)}
              type="primary"
            >
              X
            </Button>
          </div>
        </Card>

        <Card
          title="ตารางแสดงรายละเอียดโรงเรียน"
          variant="outlined"
          loading={isLoading}
        >
          <Table<SchoolDetail>
            bordered
            columns={columns}
            dataSource={filteredDetails}
            rowKey={(record) => String(record.school_id ?? record.company_name)}
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            }}
            scroll={{ x: 1200 }}
            onChange={handleTableChange}
          />
        </Card>
      </Space>
    </DashboardLayout>
  );
}
