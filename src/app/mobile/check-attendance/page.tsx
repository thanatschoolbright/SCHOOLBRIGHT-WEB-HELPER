"use client";

import { useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Select,
  Table,
  List,
  Avatar,
  Badge,
  Empty,
  Typography,
  Tag,
  Space,
} from "antd";
import { toast } from "sonner";
import { RocketOutlined } from "@ant-design/icons";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useAppSelector } from "@stores/store";
import { useDispatch } from "react-redux";

import { HeaderBar } from "@/components/typhography/header-bar-component";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
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

  const requestStudentForm = {
    schoolId: Form.useWatch("school_id", form),
    levelId: Form.useWatch("level_id", form),
    subLevelId: Form.useWatch("sub_level_id", form),
  };

  const isFormComplete = useMemo(() => {
    return !!(
      requestStudentForm.schoolId &&
      requestStudentForm.levelId &&
      requestStudentForm.subLevelId
    );
  }, [requestStudentForm]);

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
          value: String(item.id), // ⚠️ แปลงเป็น String
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
          value: String(item.id), // ⚠️ แปลงเป็น String
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
    try {
      toast.loading("กำลังโหลดข้อมูลนักเรียน...", { id: "load-students" });
      const response = await callApiService.post(
        "/api/v1/mobile/check-in-attendance/get-student",
        request
      );
      toast.success("โหลดข้อมูลนักเรียนสำเร็จ!", { id: "load-students" });
      setTable(response?.data?.data);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลนักเรียน", {
        id: "load-students",
      });
      console.error("❌ Error fetching students:", error);
    } finally {
      toast.dismiss("load-students");
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

  // ⚠️ แก้ไขฟังก์ชันนี้
  const handleFormSubmit = async (values: RequestAttendanceReportParams) => {
    const formattedValues = {
      school_id: String(values.school_id || ""),
      level_id: String(values.level_id || ""),
      sub_level_id: String(values.sub_level_id || ""),
    };

    console.log("Form Values:", formattedValues);
    await GET_STUDENT_API(formattedValues);
  };

  // compute duplicate counts by user_id
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
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
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
                    disabled={
                      !form.getFieldValue("school_id") || isLoadingLevels
                    }
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
                    disabled={
                      !form.getFieldValue("level_id") || isLoadingSubLevels
                    }
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
            <List
              grid={{ gutter: 12, column: 1 }}
              dataSource={table}
              renderItem={(s, index) => {
                const id = (s as any).user_id ?? (s as any).student_id;
                const isDuplicate = (duplicateCounts[id] || 0) > 1;

                // การทำงาน: แสดงชื่อ-รหัสนักเรียน
                const title = `${s.student_name} (${s.student_id})`;

                // การทำงาน: ลำดับนักเรียน (แสดงด้านขวา)
                const orderNumber = s.n_student_number || index + 1;

                // การทำงาน: แปลงสถานะสแกนเป็น Tag สี

                // การทำงาน: การ์ดหลักของนักเรียน
                const card = (
                  <List.Item key={id}>
                    <Card
                      size="small"
                      variant="outlined"
                      style={{
                        background: "#fafafa",
                        borderRadius: 12,
                        position: "relative",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* มุมขวาบน - หมายเลขเรียง */}
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 10,
                          color: "#999",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        #{orderNumber}
                      </div>

                      <Card.Meta
                        avatar={
                          s.pic ? (
                            <Avatar
                              src={s.pic}
                              size={56}
                              shape="square"
                              style={{ borderRadius: 8 }}
                            />
                          ) : (
                            <Avatar
                              size={56}
                              shape="square"
                              style={{
                                borderRadius: 8,
                                backgroundColor: "#f0f0f0",
                                color: "#555",
                              }}
                            >
                              {s.student_name?.slice(0, 1) || "-"}
                            </Avatar>
                          )
                        }
                        title={
                          <Typography.Text strong style={{ fontSize: 15 }}>
                            {title}
                          </Typography.Text>
                        }
                        description={
                          <div style={{ marginTop: 6 }}>
                            <Space size="small">
                              <Typography.Text>
                                สถานะการเข้าเรียน{" "}
                              </Typography.Text>

                              <Tag
                                color="green"
                              >
                                {String(s.scan_status)}
                              </Tag>
                            </Space>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                );

                if (isDuplicate) {
                  return (
                    <List.Item key={id}>
                      <Badge.Ribbon text="นักเรียนซ้ำ" color="red">
                        {card}
                      </Badge.Ribbon>
                    </List.Item>
                  );
                }

                return card;
              }}
            />
          ) : (
            <Empty description="ไม่มีข้อมูลนักเรียน" />
          )}
        </Card>
      </DashboardLayout>
    </PermissionLayout>
  );
}
