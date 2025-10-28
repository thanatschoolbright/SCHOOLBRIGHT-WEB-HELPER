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
import { RocketOutlined } from "@ant-design/icons";

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

dayjs.extend(isBetween);

export type RequestAttendanceReportParams = {
  school_id?: string;
  level_id?: string;
  sub_level_id?: string;
};

export default function Page() {
  const dispatch = useDispatch();
  const i18n = i18next;
  const [form] = Form.useForm();

  const [levelOptions, setLevelOptions] = useState<any[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  const [isLoadingSubLevels, setIsLoadingSubLevels] = useState(false);
  const [subLevelOptions, setSubLevelOptions] = useState<any[]>([]);
  const [table, setTable] = useState<ResponseGetStudent[]>([]);

  const [formValues, setFormValues] = useState<{
    school_id?: string;
    level_id?: string;
    sub_level_id?: string;
  }>({});

  const isFormComplete = useMemo(() => {
    return !!(
      formValues?.school_id &&
      formValues?.level_id &&
      formValues?.sub_level_id
    );
  }, [formValues]);

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

  const handleFormSubmit = async (values: RequestAttendanceReportParams) => {
    const formattedValues = {
      school_id: String(values.school_id || ""),
      level_id: String(values.level_id || ""),
      sub_level_id: String(values.sub_level_id || ""),
    };

    await GET_STUDENT_API(formattedValues);
  };

  const duplicateCounts = useMemo(() => {
    const counts: Record<string | number, number> = {};
    table.forEach((s) => {
      const id = (s as any).user_id ?? (s as any).student_id;
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [table]);

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <HeaderBar
          icon={<RocketOutlined />}
          title="ตรวจสอบการเข้าชั้นเรียน"
          subTitle="รายละเอียดการเข้าชั้นเรียน"
          color="orange"
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
              <Col span={12}>
                <Form.Item label="โรงเรียน" name="school_id">
                  <Select
                    allowClear
                    showSearch
                    placeholder="เลือกโรงเรียน"
                    optionFilterProp="label"
                    options={schoolOptions}
                    onChange={handleSchoolChange}
                  />
                </Form.Item>
              </Col>

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
                  />
                </Form.Item>
              </Col>
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
                dataSource={table}
                renderItem={(s, index) => {
                  const id = (s as any).user_id ?? (s as any).student_id;
                  const isDuplicate = (duplicateCounts[id] || 0) > 1;
                  return (
                    <AttendanceCard
                      student={s as any}
                      index={index}
                      isDuplicate={isDuplicate}
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
