"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { Card, Table, Select, Space, Dropdown, Button, Tag, Input } from "antd";
import {
  AlertFilled,
  CrownFilled,
  ExperimentFilled,
  FireFilled,
  RocketFilled,
  SafetyCertificateFilled,
  StarFilled,
  ThunderboltOutlined,
  ToolOutlined,
  TrophyFilled,
  DownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CallAPI as GET_SCHOOL_LIST_DETAIL } from "@stores/actions/support/call-get-school-list-detail";
import { CallAPI as GET_BYPASS_TOKEN } from "@stores/actions/support/call-get-bypass-token";
import * as type from "@stores/type";
import { toast } from "sonner";
import type { MenuProps, TableProps } from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table/interface";
import type { InputRef } from "antd";

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

type SearchableColumnKey =
  | "school_id"
  | "company_name"
  | "province"
  | "school_group"
  | "school_class"
  | "school_grade"
  | "isActive";

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

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

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

  const getColumnSearchProps = useCallback(
    (
      dataIndex: SearchableColumnKey,
      title: string
    ): ColumnType<SchoolDetail> => ({
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        const inputValue = selectedKeys[0]?.toString() ?? "";

        return (
          <div style={{ padding: 12 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              ref={(node) => {
                searchInputRefs.current[dataIndex] = node;
              }}
              placeholder={`ค้นหา ${title}`}
              value={inputValue}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="small"
                onClick={() => confirm()}
              >
                ค้นหา
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearFilters?.();
                  confirm({ closeDropdown: true });
                }}
              >
                รีเซ็ต
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) =>
        String(record[dataIndex] ?? "")
          .toLowerCase()
          .includes(String(value).toLowerCase()),
      // ✅ ใช้ filterDropdownProps แทน
      filterDropdownProps: {
        onOpenChange: (visible) => {
          if (visible) {
            setTimeout(() => {
              searchInputRefs.current[dataIndex]?.select();
            }, 100);
          }
        },
      },
    }),
    []
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
    async (
      environment: { url: string; extendPath?: string },
      schoolId: string
    ) => {
      try {
        const token = await getBypassToken(schoolId);
        const finalUrl = `${environment.url}${token}${
          environment.extendPath ?? ""
        }`;

        toast.success("Bypass สำเร็จ", {
          description: `คุณกำลังเข้าสู่ ${finalUrl}`,
          duration: 10000,
          position: "top-right",
          action: {
            label: "Copy URL",
            onClick: () => {
              navigator.clipboard.writeText(finalUrl).then(() => {
                toast.success("Copied!", {
                  description: "URL copied to clipboard.",
                  duration: 3000,
                  position: "top-right",
                });
              });
            },
          },
        });

        window.open(finalUrl, "_blank", "noopener,noreferrer");
      } catch (error: any) {
        toast.error("ไม่สามารถสร้าง Bypass ได้", {
          description: error?.message ?? "Unexpected error",
          duration: 5000,
          position: "top-right",
        });
      }
    },
    [getBypassToken]
  );

  const handleMenuItemClick = useCallback(
    async (compositeKey: string, schoolId: string) => {
      const [targetKey, environmentKey] = compositeKey.split("|");
      const environment =
        bypassTargets[targetKey]?.environments?.[environmentKey];

      if (!environment) {
        toast.error("ไม่พบการตั้งค่าเซิร์ฟเวอร์");
        return;
      }

      if (!schoolId) {
        toast.error("ไม่พบรหัสโรงเรียน");
        return;
      }

      await openBypassLink(environment, schoolId);
    },
    [openBypassLink]
  );

  const menuItems = useMemo(() => buildMenuItems(), []);

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
        ...getColumnSearchProps("school_id", "รหัสโรงเรียน"),
      },
      {
        title: "ชื่อโรงเรียน",
        dataIndex: "company_name",
        key: "company_name",
        sorter: (a, b) => compareValues(a.company_name, b.company_name),
        render: (value?: string) => value || "-",
        ...getColumnSearchProps("company_name", "ชื่อโรงเรียน"),
      },
      {
        title: "จังหวัด",
        dataIndex: "province",
        key: "province",
        sorter: (a, b) => compareValues(a.province, b.province),
        render: (value?: string) => value || "-",
        ...getColumnSearchProps("province", "จังหวัด"),
      },
      {
        title: "กลุ่มโรงเรียน",
        dataIndex: "school_group",
        key: "school_group",
        sorter: (a, b) => compareValues(a.school_group, b.school_group),
        render: (value?: string) => value || "-",
        ...getColumnSearchProps("school_group", "กลุ่มโรงเรียน"),
      },
      {
        title: "ระดับชั้นที่เปิดสอน",
        dataIndex: "school_class",
        key: "school_class",
        sorter: (a, b) => compareValues(a.school_class, b.school_class),
        render: (value?: string) => value || "-",
        ...getColumnSearchProps("school_class", "ระดับชั้นที่เปิดสอน"),
      },
      {
        title: "เกรดโรงเรียน",
        dataIndex: "school_grade",
        key: "school_grade",
        sorter: (a, b) => compareValues(a.school_grade, b.school_grade),
        render: (value?: string) => {
          const grade = (value ?? "Bronze").replace(/\s+/g, "");
          const gradeConfig: Record<
            string,
            {
              label: string;
              gradient: string;
              glow: string;
              icon: React.ReactNode;
            }
          > = {
            "S+": {
              label: "Legendary",
              gradient:
                "linear-gradient(135deg, #fffb7d 0%, #ffb347 50%, #ff512f 100%)",
              glow: "0 0 18px rgba(255, 178, 55, 0.85)",
              icon: <FireFilled style={{ color: "#ff6b00" }} />,
            },
            "A+": {
              label: "Diamond",
              gradient: "linear-gradient(135deg, #b0f3f1 0%, #ffcfdf 100%)",
              glow: "0 0 16px rgba(176, 243, 241, 0.8)",
              icon: <CrownFilled style={{ color: "#3f87ff" }} />,
            },
            "A ": {
              label: "Platinum",
              gradient: "linear-gradient(135deg, #d9fffc 0%, #45aaf2 100%)",
              glow: "0 0 14px rgba(69, 170, 242, 0.7)",
              icon: <StarFilled style={{ color: "#45aaf2" }} />,
            },
            B: {
              label: "Gold",
              gradient: "linear-gradient(135deg, #ffe259 0%, #ffa751 100%)",
              glow: "0 0 12px rgba(255, 162, 81, 0.6)",
              icon: <TrophyFilled style={{ color: "#d48806" }} />,
            },
            C: {
              label: "Silver",
              gradient: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
              glow: "0 0 10px rgba(207, 222, 243, 0.6)",
              icon: <SafetyCertificateFilled style={{ color: "#95a5a6" }} />,
            },
            "D+": {
              label: "Bronze+",
              gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
              glow: "0 0 10px rgba(253, 160, 133, 0.5)",
              icon: <RocketFilled style={{ color: "#f2994a" }} />,
            },
            D: {
              label: "Bronze",
              gradient: "linear-gradient(135deg, #fceabb 0%, #f8b500 100%)",
              glow: "0 0 8px rgba(248, 181, 0, 0.4)",
              icon: <ToolOutlined style={{ color: "#f39c12" }} />,
            },
            "E+": {
              label: "Iron+",
              gradient: "linear-gradient(135deg, #d9a7c7 0%, #fffcdc 100%)",
              glow: "0 0 8px rgba(217, 167, 199, 0.4)",
              icon: <ExperimentFilled style={{ color: "#9b59b6" }} />,
            },
            E: {
              label: "Iron",
              gradient: "linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%)",
              glow: "0 0 6px rgba(227, 238, 255, 0.3)",
              icon: <AlertFilled style={{ color: "#95a5a6" }} />,
            },
            F: {
              label: "Stone",
              gradient: "linear-gradient(135deg, #cac531 0%, #f3f9a7 100%)",
              glow: "0 0 6px rgba(202, 197, 49, 0.3)",
              icon: <ThunderboltOutlined style={{ color: "#7f8c8d" }} />,
            },
            "No Grade": {
              label: "Unranked",
              gradient: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
              glow: "0 0 6px rgba(233, 236, 239, 0.3)",
              icon: <AlertFilled style={{ color: "#95a5a6" }} />,
            },
            Bronze: {
              label: "Bronze",
              gradient: "linear-gradient(135deg, #fceabb 0%, #f8b500 100%)",
              glow: "0 0 6px rgba(248, 181, 0, 0.3)",
              icon: <ToolOutlined style={{ color: "#e67e22" }} />,
            },
          };

          const config = gradeConfig[grade] ?? gradeConfig["Bronze"];

          return (
            <div
              className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{
                background: config.gradient,
                boxShadow: config.glow,
                color: "#1f2933",
                fontWeight: 700,
                position: "relative",
                overflow: "hidden",
                minWidth: 120,
                justifyContent: "center",
                animation: "pulseGlow 3s ease-in-out infinite",
              }}
            >
              <span className="text-lg">{config.icon}</span>
              <span>
                {grade} · {config.label}
              </span>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(120deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 60%)",
                  transform: "translateX(-100%)",
                  animation: "shine 4s ease-in-out infinite",
                }}
              />
            </div>
          );
        },

        onFilter: (value, record) =>
          (record.school_grade ?? "No Rank") === value,
        ...getColumnSearchProps("school_grade", "เกรดโรงเรียน"),
      },
      {
        title: "สถานะการใช้งาน",
        dataIndex: "isActive",
        key: "isActive",
        sorter: (a, b) => compareValues(a.isActive, b.isActive),
        render: (value?: string) => {
          if (!value) {
            return <Tag>-</Tag>;
          }
          const normalized = value.toLowerCase();
          const color = statusColorMap[normalized] ?? "default";
          return <Tag color={color}>{value}</Tag>;
        },
        ...getColumnSearchProps("isActive", "สถานะการใช้งาน"),
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
                onClick: ({ key }) =>
                  handleMenuItemClick(String(key), schoolId),
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

        <Card title="ตารางแสดงรายละเอียดโรงเรียน" variant="outlined">
          <Table<SchoolDetail>
            bordered
            loading={isLoading}
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
