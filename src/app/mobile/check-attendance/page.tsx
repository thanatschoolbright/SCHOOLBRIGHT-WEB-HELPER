"use client";

import { useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Select,
  List,
  Avatar,
  Badge,
  Empty,
  Typography,
  Tag,
  Space,
} from "antd";
import AttendanceCard from "@components/card/attendance-card-component";
import { toast } from "sonner";
import {
  CheckCircleFilled,
  CheckCircleOutlined,
  IdcardOutlined,
  RocketOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useAppSelector } from "@stores/store";
import { useDispatch } from "react-redux";

import { HeaderBar } from "@components/typhography/header-bar-component";
import { callApiService } from "@services/axios-instance/sb-helper.axios";
import { ResponseGetLevel } from "@/app/api/v1/mobile/check-in-attendance/get-level/route";
import { ResponseGetSubLevel } from "@/app/api/v1/mobile/check-in-attendance/get-sub-level/route";
import { ResponseGetStudent } from "@/app/api/v1/mobile/check-in-attendance/get-student/route";
import { ResponseGetSubject } from "@/app/api/v1/mobile/check-in-subject/get-subject/route";

dayjs.extend(isBetween);

export type RequestAttendanceReportParams = {
  url_type?: string;
  school_id?: string;
  sub_level_id?: string;
  level_id?: string;
  subject_id?: string;
  date?: string;
  teacher_id?: string;
};

export default function Page() {
  const dispatch = useDispatch();
  const i18n = i18next;
  const [form] = Form.useForm();

  const [levelOptions, setLevelOptions] = useState<any[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  const [isLoadingSubLevels, setIsLoadingSubLevels] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [subLevelOptions, setSubLevelOptions] = useState<any[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [table, setTable] = useState<ResponseGetStudent[]>([]);
  // allow toggling visibility of the subject selector
  const [subjectHidden, setSubjectHidden] = useState(false);

  const [formValues, setFormValues] = useState<{
    type?: string;
    school_id?: string;
    level_id?: string;
    sub_level_id?: string;
    subject_id?: string;
  }>({});

  const isFormComplete = useMemo(() => {
    return !!(
      formValues?.school_id &&
      formValues?.level_id &&
      formValues?.sub_level_id
    );
  }, [formValues]);

  // Small helper component that supports a `hidden` prop
  const ConditionalCol: React.FC<{
    hidden?: boolean;
    span?: number;
    children?: React.ReactNode;
  }> = ({ hidden, span = 12, children }) => {
    if (hidden) return null;
    return <Col span={span}>{children}</Col>;
  };

  const schoolOptions = useMemo(() => {
    try {
      const schools = localStorage?.getItem("schools");
      if (!schools) return [];

      const parse = JSON.parse(schools);
      if (Array.isArray(parse?.data)) {
        return parse?.data?.map((item: any) => ({
          label: `${item.SchoolName} (${item.SchoolID})`,
          value: String(item.SchoolID),
        }));
      }
    } catch (error: any) {
      console.error("❌ Failed to parse schools from localStorage:", error);
    }
    return [];
  }, []);

  const GET_LEVEL_API = async (schoolId: string) => {
    setIsLoadingLevels(true);
    try {
      const response = await callApiService.post(
        "/api/v1/mobile/check-in-attendance/get-level",
        {
          school_id: String(schoolId),
        }
      );

      const formattedOptions: ResponseGetLevel[] = response?.data?.data.map(
        (item: ResponseGetLevel) => ({
          label: String(item.name_th),
          value: String(item.id),
        })
      );

      setLevelOptions(formattedOptions);
    } catch (error) {
      console.error("❌ Error fetching levels:", error);
      setLevelOptions([]);
    } finally {
      setIsLoadingLevels(false);
    }
  };

  const GET_SUB_LEVEL_API = async (levelId: string) => {
    setIsLoadingSubLevels(true);
    try {
      const response = await callApiService.post(
        "/api/v1/mobile/check-in-attendance/get-sub-level",
        {
          school_id: String(form.getFieldValue("school_id")),
          level_id: String(levelId),
        }
      );

      const formattedOptions: ResponseGetSubLevel[] = response?.data?.data.map(
        (item: ResponseGetSubLevel) => ({
          label: String(item.name_th),
          value: String(item.id),
        })
      );
      setSubLevelOptions(formattedOptions);
    } catch (error) {
      console.error("❌ Error fetching sub-levels:", error);
      setSubLevelOptions([]);
    } finally {
      setIsLoadingSubLevels(false);
    }
  };

  const GET_SUBJECT_API = async (subLevelId: string) => {
    setIsLoadingSubjects(true);
    try {
      const response = await callApiService.post(
        "/api/v1/mobile/check-in-subject/get-subject",
        {
          school_id: String(form.getFieldValue("school_id")),
          sub_level_id: String(subLevelId),
        }
      );

      const formattedOptions: ResponseGetSubject[] = response?.data?.data.map(
        (item: ResponseGetSubject) => ({
          label: `${item.schedule_name} (${item.plane_id}) เวลาเรียน ${item.timestart} - ${item.timeend}`,
          value: String(item.plane_id),
        })
      );
      setSubjectOptions(formattedOptions);
    } catch (error) {
      console.error("❌ Error fetching subjects:", error);
      setSubjectOptions([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const GET_STUDENT_API = async (request: RequestAttendanceReportParams) => {
    const toastId = toast.loading("กำลังโหลดข้อมูลนักเรียน...");
    try {
      const response = await callApiService.post(
        "/api/v1/mobile/check-in-attendance/get-student",
        request
      );
      if (response?.data?.data.length === 0) {
        toast.info("ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก", {
          id: toastId,
        });
      } else {
        toast.success("โหลดข้อมูลนักเรียนสำเร็จ!", {
          id: toastId,
        });
      }
      setTable(response?.data?.data || []);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลนักเรียน", {
        id: toastId,
      });
      console.error("❌ Error fetching students:", error);
    }
  };

  // ** เช็คชื่อรายวิชา / แก้ไขเช็คชื่อรายวิชา
  const GET_SUBJECT_STUDENT_API = async (
    request: RequestAttendanceReportParams
  ) => {
    const toastId = toast.loading("กำลังโหลดข้อมูลนักเรียน...");
    try {
      const response = await callApiService.post(
        "/api/v1/mobile/check-in-subject/get-student",
        request
      );
      if (response?.data?.data.length === 0) {
        toast.info("ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก", {
          id: toastId,
        });
      } else {
        toast.success("โหลดข้อมูลนักเรียนสำเร็จ!", {
          id: toastId,
        });
      }
      setTable(response?.data?.data || []);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลนักเรียน", {
        id: toastId,
      });
      console.error("❌ Error fetching students:", error);
    }
  };

  const handleSchoolChange = (value: string) => {
    form.setFieldsValue({ level_id: undefined, sub_level_id: undefined });
    setLevelOptions([]);
    setSubLevelOptions([]);

    if (value) {
      GET_LEVEL_API(value);
    }
  };

  const handleLevelChange = (value: string) => {
    form.setFieldsValue({ sub_level_id: undefined });
    setSubLevelOptions([]);

    if (value) {
      GET_SUB_LEVEL_API(value);
    }
  };

  const handleSubLevelChange = (value: string) => {
    form.setFieldsValue({ subject_id: undefined });
    setSubjectOptions([]);

    if (value) {
      GET_SUBJECT_API(value);
    }
  };

  const handleFormSubmit = async (values: RequestAttendanceReportParams) => {
    const formattedValues = {
      url_type: String(values.url_type || "PROD"),
      school_id: String(values.school_id || ""),
      level_id: String(values.level_id || ""),
      sub_level_id: String(values.sub_level_id || ""),
      subject_id: String(values.subject_id || ""),
      date: String(values.date || dayjs().format("YYYY-MM-DD")),
      teacher_id: String(values.teacher_id || "999999999"),
    };
    if (formValues.type === "flag") {
      await GET_STUDENT_API(formattedValues);
    } else if (formValues.type === "checkin") {
      await GET_SUBJECT_STUDENT_API(formattedValues);
    }
  };

  const duplicateCounts = useMemo(() => {
    const counts: Record<string | number, number> = {};
    table.forEach((s) => {
      const id = (s as any).user_id ?? (s as any).student_id;
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [table]);

  // Build a deduplicated list where duplicates are shown once and include a duplicateCount
  const uniqueTable = useMemo(() => {
    // Map id -> { firstItem, count }
    const map = new Map<
      string,
      { item: any; count: number; firstIndex: number }
    >();
    table.forEach((s, idx) => {
      const id = String((s as any).user_id ?? (s as any).student_id ?? idx);
      if (!map.has(id)) {
        map.set(id, { item: s, count: 1, firstIndex: idx });
      } else {
        const entry = map.get(id)!;
        entry.count += 1;
      }
    });

    // Split into duplicates and non-duplicates while preserving first-seen order
    const dup: Array<{ item: any; count: number; firstIndex: number }> = [];
    const others: Array<{ item: any; count: number; firstIndex: number }> = [];
    for (const [_, v] of map.entries()) {
      if (v.count > 1) dup.push(v);
      else others.push(v);
    }

    // Sort each group by the original firstIndex to preserve relative order
    const sortByIndex = (a: any, b: any) => a.firstIndex - b.firstIndex;
    dup.sort(sortByIndex);
    others.sort(sortByIndex);

    // Combine and return an array of items augmented with duplicateCount
    return [...dup, ...others].map((v) => ({
      ...v.item,
      duplicateCount: v.count,
    }));
  }, [table]);

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        {/* หัวข้อ : ตรวจสอบการเข้าชั้นเรียน */}
        <HeaderBar
          icon={<TeamOutlined />}
          title="ตรวจสอบการเข้าชั้นเรียนและหน้าเสาธง"
          subTitle="รายละเอียดการเช็คชื่อเข้าเรียนและหน้าเสาธงของนักเรียน"
          color="none"
        />

        {/* ฟิลเตอร์การค้นหา */}
        <Card style={{ margin: 16 }} title="ฟิลเตอร์การค้นหา">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            onValuesChange={(_, all) => setFormValues(all)}
          >
            <Row gutter={16}>
              {/* Select : ประเภท URL Dev/Prod */}
              <Col span={12}>
                <Form.Item
                  label="ประเภท URL"
                  name="url_type"
                  initialValue="PROD"
                >
                  <Select
                    allowClear
                    showSearch
                    placeholder="เลือกประเภท URL"
                    optionFilterProp="label"
                    options={[
                      { label: "โปรดักชัน (Production)", value: "PROD" },
                      { label: "เซิฟทดสอบ (Development)", value: "DEV" },
                    ]}
                  />
                </Form.Item>
              </Col>
              {/* Select เลือกประเภทการเช็กชื่อ */}
              <Col span={12}>
                <Form.Item label="ประเภทการเช็กชื่อ" name="type">
                  <Select
                    allowClear
                    showSearch
                    placeholder="เลือกประเภทการเช็กชื่อ"
                    optionFilterProp="label"
                    options={[
                      { label: "เช็คชื่อเข้าเรียน", value: "checkin" },
                      { label: "เช็คชื่อหน้าเสาธง", value: "flag" },
                    ]}
                  />
                </Form.Item>
              </Col>
              {/* Select โรงเรียน */}
              <Col span={12}>
                <Form.Item label="โรงเรียน" name="school_id">
                  <Select
                    allowClear
                    showSearch
                    placeholder="เลือกโรงเรียน"
                    optionFilterProp="label"
                    options={schoolOptions}
                    onChange={handleSchoolChange}
                    disabled={!formValues?.type}
                  />
                </Form.Item>
              </Col>

              {/* Select ระดับชั้น */}
              <Col span={12}>
                <Form.Item label="ระดับชั้น" name="level_id">
                  <Select
                    allowClear
                    showSearch
                    placeholder="เลือกชั้นเรียน"
                    optionFilterProp="label"
                    options={levelOptions}
                    loading={isLoadingLevels}
                    disabled={!formValues?.school_id || isLoadingLevels}
                    onChange={handleLevelChange}
                  />
                </Form.Item>
              </Col>

              {/* Select ห้องเรียน */}
              <Col span={12}>
                <Form.Item label="ห้องเรียน" name="sub_level_id">
                  <Select
                    allowClear
                    showSearch
                    placeholder="เลือกห้องเรียน"
                    optionFilterProp="label"
                    options={subLevelOptions}
                    loading={isLoadingSubLevels}
                    disabled={!formValues?.level_id || isLoadingSubLevels}
                    onChange={handleSubLevelChange}
                  />
                </Form.Item>
              </Col>

              {/* Select วิชาเรียน */}
              <ConditionalCol span={12} hidden={formValues?.type === "flag"}>
                <Form.Item label="วิชาเรียน" name="subject_id">
                  <Select
                    allowClear
                    showSearch
                    placeholder="เลือกวิชาเรียน"
                    optionFilterProp="label"
                    options={subjectOptions}
                    loading={isLoadingSubjects}
                    disabled={!formValues?.level_id || isLoadingSubjects}
                  />
                </Form.Item>
              </ConditionalCol>

              {/* เลือกวันที่ */}
            </Row>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                disabled={!isFormComplete}
              >
                ยืนยัน
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* ผลลัพธ์การตรวจสอบ */}
        <Card style={{ margin: 16 }} title="ผลลัพธ์การตรวจสอบ">
          {table.length > 0 ? (
            <>
              <List
                grid={{ gutter: 12, column: 1 }}
                dataSource={uniqueTable}
                renderItem={(s, index) => {
                  const id =
                    (s as any).user_id ?? (s as any).student_id ?? index;
                  const duplicateCount = (s as any).duplicateCount || 1;
                  return (
                    <AttendanceCard
                      student={s as any}
                      index={index}
                      duplicateCount={duplicateCount}
                    />
                  );
                }}
              />
            </>
          ) : (
            <Empty description="ไม่มีข้อมูลนักเรียน หรือ ไม่พบข้อมูลนักเรียนที่ค้นหา" />
          )}
        </Card>
      </DashboardLayout>
    </PermissionLayout>
  );
}
