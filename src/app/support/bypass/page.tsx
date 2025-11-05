"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { Card, Table, Select, Space, Dropdown, Button, Tag, Badge } from "antd";
import {
  AlertOutlined,
  CrownOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  DownOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CallAPI as GET_BYPASS_TOKEN } from "@stores/actions/support/call-get-bypass-token";
import { toast } from "sonner";
import type { MenuProps, TableProps } from "antd";
import type { ColumnsType } from "antd/es/table/interface";
import { HeaderBar } from "@/components/typhography/header-bar-component";

// ==================== Types ====================
type SchoolDetail = {
  school_id: string | number;
  company_name?: string;
  province?: string;
  school_group?: string;
  school_class?: string;
  school_grade?: string;
  isActive?: string;
};

type Environment = {
  label: string;
  url: string;
  extendPath?: string;
};

type BypassTarget = {
  label: string;
  environments: Record<string, Environment>;
};

type BypassLinkParams = {
  schoolId: string;
  schoolName?: string;
  targetLabel: string;
  environmentLabel: string;
  url: string;
  extendPath?: string;
};

// ==================== Constants ====================
const COLLATOR = new Intl.Collator("th", {
  sensitivity: "base",
  numeric: true,
});

const STATUS_COLOR_MAP: Record<string, string> = {
  active: "success",
  inactive: "error",
};

const GRADE_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  A: { color: "gold", icon: <CrownOutlined /> },
  B: { color: "green", icon: <StarOutlined /> },
  C: { color: "blue", icon: <RocketOutlined /> },
  D: { color: "orange", icon: <ToolOutlined /> },
  E: { color: "red", icon: <AlertOutlined /> },
  F: { color: "purple", icon: <ThunderboltOutlined /> },
  "-": { color: "default", icon: <SafetyCertificateOutlined /> },
};

const BYPASS_TARGETS: Record<string, BypassTarget> = {
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

// ==================== Utility Functions ====================
const compareValues = (a: unknown, b: unknown): number => {
  const normalize = (v: unknown): string => {
    if (v == null) {
      return "";
    }

    const t = typeof v;
    if (t === "string") {
      return v as string;
    } else if (t === "number") {
      return (v as number).toString();
    } else if (t === "boolean") {
      return (v as boolean).toString();
    } else if (t === "object") {
      try {
        return JSON.stringify(v as Record<string, unknown>);
      } catch {
        return Object.prototype.toString.call(v);
      }
    }

    return Object.prototype.toString.call(v);
  };

  return COLLATOR.compare(normalize(a), normalize(b));
};

const parseLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage?.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const sanitizeTargetName = (label: string): string => {
  const trimmed = (label ?? "").trim();
  return trimmed.replace(/^[^A-Za-z0-9\u0E00-\u0E7F]+/, "").trim() || trimmed;
};

const buildBypassMenuItems = (): MenuProps["items"] =>
  Object.entries(BYPASS_TARGETS).map(([targetKey, target]) => ({
    key: targetKey,
    label: target.label,
    children: Object.entries(target.environments).map(
      ([environmentKey, environment]) => ({
        key: `${targetKey}|${environmentKey}`,
        label: environment.label,
      })
    ),
  }));

// ==================== Hooks ====================
const useSchoolData = () => {
  const schoolListWithDetail = useAppSelector(
    (state) => state.callGetSchooListDetail
  );

  const schoolOptions = useMemo(() => {
    const schools = parseLocalStorage("schools", { data: [] });
    if (!Array.isArray(schools?.data)) return [];

    return schools.data.map((item: any) => ({
      label: `${item.SchoolName} (${item.SchoolID})`,
      value: String(item.SchoolID),
    }));
  }, [schoolListWithDetail?.response?.data?.data]);

  const schoolDetails = useMemo<SchoolDetail[]>(() => {
    const schools = parseLocalStorage<any>("school_details", null);

    if (Array.isArray(schools)) return schools;
    if (
      schools &&
      typeof schools === "object" &&
      Array.isArray(schools?.data?.data)
    )
      return schools.data.data;

    return [];
  }, []);

  return { schoolOptions, schoolDetails };
};

const useBypassToken = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userState = useAppSelector((state) => state.callAdminLogin);

  return useCallback(
    async (schoolId: string): Promise<string> => {
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
};

// ==================== Main Component ====================
export default function SchoolManagementPage() {
  const { schoolOptions, schoolDetails } = useSchoolData();
  const getBypassToken = useBypassToken();

  const [selectedSchool, setSelectedSchool] = useState<string | undefined>();
  const [pageSize, setPageSize] = useState<number>(100);
  const [openDropdownFor, setOpenDropdownFor] = useState<string | null>(null);

  const filteredDetails = useMemo(() => {
    if (!selectedSchool) return schoolDetails;
    return schoolDetails.filter(
      (detail) => String(detail.school_id) === selectedSchool
    );
  }, [schoolDetails, selectedSchool]);

  const openBypassLink = useCallback(
    async (params: BypassLinkParams) => {
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
          : `รหัสโรงเรียน ${schoolId}`;

        const copyToClipboard = async (text: string) => {
          try {
            await navigator.clipboard.writeText(text);
            console.info("[COPY TO CLIPBOARD] \n", text);
            toast.success("คัดลอกแล้ว");
          } catch (copyError) {
            toast.error(`ไม่สามารถคัดลอกได้: ${copyError}`);
          }
        };

        const extractTokenFromUrl = (fullUrl: string): string => {
          try {
            // token is the last query value after '=' or 'token=' or 'q='
            const urlObj = new URL(fullUrl);
            const params = urlObj.searchParams;
            // try common param names
            for (const key of ["token", "q"]) {
              const v = params.get(key);
              if (v) return v;
            }
            // fallback: take everything after the last '=' in the href
            const href = fullUrl;
            const idx = href.lastIndexOf("=");
            return idx >= 0 ? href.slice(idx + 1) : "";
          } catch {
            // fallback string parse
            const idx = fullUrl.lastIndexOf("=");
            return idx >= 0 ? fullUrl.slice(idx + 1) : "";
          }
        };

        toast.success(`เปิดลิงก์ ${plainTargetName} · ${environmentLabel}`, {
          description: schoolDisplay,
          duration: 30000,
          action: (
            <Space direction="vertical" size={4}>
              <Button
                block
                size="small"
                type="default"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(finalUrl);
                }}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  borderRadius: 999,
                  border: "none",
                  height: 28,
                  padding: "0 10px",
                }}
              >
                คัดลอกลิงก์
              </Button>
              <Button
                block
                size="small"
                type="default"
                onClick={(e) => {
                  e.stopPropagation();
                  const tokenOnly = extractTokenFromUrl(finalUrl);
                  copyToClipboard(tokenOnly);
                }}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  borderRadius: 999,
                  border: "none",
                  height: 28,
                  padding: "0 10px",
                }}
              >
                คัดลอก Token
              </Button>
            </Space>
          ),
        });

        window.open(finalUrl, "_blank", "noopener,noreferrer");
      } catch (error: any) {
        toast.error("ไม่สามารถสร้าง Bypass ได้", {
          description: error?.message ?? "เกิดข้อผิดพลาด",
        });
      }
    },
    [getBypassToken]
  );

  const handleMenuClick = useCallback(
    async (compositeKey: string, record: SchoolDetail) => {
      const [targetKey, environmentKey] = compositeKey.split("|");
      const target = BYPASS_TARGETS[targetKey];
      const environment = target?.environments?.[environmentKey];

      if (!target || !environment) {
        toast.error("ไม่พบการตั้งค่าเซิร์ฟเวอร์");
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
    [openBypassLink]
  );

  const columns = useMemo<ColumnsType<SchoolDetail>>(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        width: 80,
        align: "center",
        fixed: "left",
        render: (_value, _record, index) => (
          <Badge count={index + 1} showZero color="blue" />
        ),
      },
      {
        title: "รหัสโรงเรียน",
        dataIndex: "school_id",
        key: "school_id",
        sorter: (a, b) => compareValues(a.school_id, b.school_id),
        render: (value) => value ?? "-",
      },
      {
        title: "ชื่อโรงเรียน",
        dataIndex: "company_name",
        key: "company_name",
        sorter: (a, b) => compareValues(a.company_name, b.company_name),
        render: (value) => value || "-",
      },
      {
        title: "จังหวัด",
        dataIndex: "province",
        key: "province",
        sorter: (a, b) => compareValues(a.province, b.province),
        render: (value) => value || "-",
      },
      {
        title: "กลุ่มโรงเรียน",
        dataIndex: "school_group",
        key: "school_group",
        sorter: (a, b) => compareValues(a.school_group, b.school_group),
        render: (value) => value || "-",
      },
      {
        title: "ระดับชั้นที่เปิดสอน",
        dataIndex: "school_class",
        key: "school_class",
        sorter: (a, b) => compareValues(a.school_class, b.school_class),
        render: (value) => value || "-",
      },
      {
        title: "เกรดโรงเรียน",
        dataIndex: "school_grade",
        key: "school_grade",
        sorter: (a, b) => compareValues(a.school_grade, b.school_grade),
        filters: ["A", "B", "C", "D", "E", "F"].map((grade) => ({
          text: grade,
          value: grade,
        })),
        onFilter: (value, record) =>
          (record.school_grade ?? "-").trim().toUpperCase() === value,
        render: (value) => {
          const normalized = (value ?? "-").trim().toUpperCase();
          const config = GRADE_CONFIG[normalized] ?? GRADE_CONFIG["-"];
          return (
            <Tag color={config.color} icon={config.icon}>
              {normalized}
            </Tag>
          );
        },
      },
      {
        title: "สถานะการใช้งาน",
        dataIndex: "isActive",
        key: "isActive",
        sorter: (a, b) => compareValues(a.isActive, b.isActive),
        filters: [
          { text: "Active", value: "active" },
          { text: "Inactive", value: "inactive" },
        ],
        onFilter: (value, record) =>
          (record.isActive ?? "").toLowerCase() === String(value).toLowerCase(),
        render: (value) => {
          if (!value) return <Tag>-</Tag>;
          const color = STATUS_COLOR_MAP[value.toLowerCase()] ?? "default";
          return <Tag color={color}>{value}</Tag>;
        },
      },
      {
        title: "เข้าสู่ระบบ",
        key: "actions",
        fixed: "right",
        width: 160,
        align: "center",
        render: (_value, record) => {
          const schoolId = String(record.school_id ?? "");
          const isOpen = openDropdownFor === schoolId;

          return (
            <Dropdown
              menu={{
                items: buildBypassMenuItems(),
                onClick: ({ key }) => void handleMenuClick(String(key), record),
              }}
              trigger={["click"]}
              placement="bottomRight"
              open={isOpen}
              onOpenChange={(open) =>
                setOpenDropdownFor(open ? schoolId : null)
              }
            >
              <Button
                type="primary"
                icon={<LoginOutlined />}
                iconPosition="end"
              >
                เลือกระบบ
              </Button>
            </Dropdown>
          );
        },
      },
    ],
    [handleMenuClick, openDropdownFor]
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
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <HeaderBar
          title="บายพาสโรงเรียน"
          subTitle="เครื่องมือสำหรับทีมซัพพอร์ตในการเข้าสู่ระบบโรงเรียนต่าง ๆ ได้อย่างรวดเร็ว"
          icon={<LoginOutlined />}
          color="none"
        />
        <Card title="ค้นหาโรงเรียน" variant="outlined">
          <Space.Compact style={{ width: "100%" }}>
            <Select
              allowClear
              showSearch
              placeholder="เลือกโรงเรียน"
              optionFilterProp="label"
              options={schoolOptions}
              value={selectedSchool}
              onChange={setSelectedSchool}
              style={{ width: "100%" }}
            />
            <Button danger onClick={() => setSelectedSchool(undefined)}>
              ล้าง
            </Button>
          </Space.Compact>
        </Card>

        <Card
          title="รายละเอียดโรงเรียน"
          variant="outlined"
          extra={<Badge count={filteredDetails.length} showZero />}
        >
          <Table<SchoolDetail>
            columns={columns}
            bordered={false}
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
            size="middle"
          />
        </Card>
      </Space>
    </DashboardLayout>
  );
}
