"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  Space,
} from "antd";
import { toast } from "sonner";
import { CopyOutlined, SearchOutlined } from "@ant-design/icons";
import * as type from "@/stores/type";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import { CallAPI as GET_USER_BY_SCHOOLID } from "@stores/actions/school/call-get-user";
import { CallAPI as POST_TO_GET_STATISTIC } from "@stores/actions/mobile/call-post-statistic";
import formatDateToMMDDYYYY from "@helpers/convert-to-mm-dd-yyyy";
import DashboardLayout from "@components/layouts/backend-layout";

type AttendanceRow = {
  SchoolID: number;
  dScan: string;
  StatusIN: string;
  TimeIn: string;
  StatusOut: string;
  TimeOut: string;
};

const getStatusTag = (status: string) => {
  switch (status) {
    case "0":
    case "7":
      return <Tag color="green">ตรงเวลา</Tag>;
    case "1":
      return <Tag color="red">สาย</Tag>;
    case "3":
      return <Tag color="default">ขาด</Tag>;
    case "4":
    case "10":
      return <Tag color="gold">ลากิจ</Tag>;
    case "5":
    case "11":
      return <Tag color="blue">ลาป่วย</Tag>;
    case "6":
    case "12":
      return <Tag color="purple">กิจกรรม</Tag>;
    case "21":
    case "22":
    case "23":
    case "24":
    case "25":
    case "26":
      return <Tag color="magenta">ลาอื่นๆ</Tag>;
    case "99":
      return <Tag color="orange">ไม่เช็กชื่อ</Tag>;
    case "-":
    default:
      return <Tag color="default">ไม่ทราบ</Tag>;
  }
};

const getTableColumns = (
  userList: any[],
  formUserId: string,
  statisticCurl: string
) => [
  {
    title: "รหัสโรงเรียน",
    dataIndex: "SchoolID",
    key: "SchoolID",
    sorter: (a: AttendanceRow, b: AttendanceRow) =>
      (a.SchoolID ?? 0) - (b.SchoolID ?? 0),
  },
  {
    title: "ผู้ที่แสกน",
    dataIndex: "Owner",
    key: "Owner",
    render: () =>
      userList.find((user: any) => String(user.value) === String(formUserId))
        ?.label ?? "ไม่พบข้อมูลผู้ใช้",
  },
  {
    title: "วันที่สแกน",
    dataIndex: "dScan",
    key: "dScan",
    sorter: (a: AttendanceRow, b: AttendanceRow) =>
      new Date(a.dScan).getTime() - new Date(b.dScan).getTime(),
    render: (dScan: string) => convertTimeZoneToThai(new Date(dScan)),
  },
  {
    title: "เวลาเข้า",
    dataIndex: "TimeIn",
    key: "TimeIn",
    render: (TimeIn: string) => convertTimeZoneToThai(new Date(TimeIn)),
  },
  {
    title: "เวลาออก",
    dataIndex: "TimeOut",
    key: "TimeOut",
    render: (TimeOut: string) => convertTimeZoneToThai(new Date(TimeOut)),
  },
  {
    title: "สถานะเข้า",
    dataIndex: "StatusIN",
    key: "StatusIN",
    render: (status: string) => getStatusTag(status),
    filters: [
      { text: "ตรงเวลา", value: "0" },
      { text: "สาย", value: "1" },
      { text: "ขาด", value: "3" },
      { text: "ลากิจ", value: "4" },
      { text: "ลาป่วย", value: "5" },
      { text: "กิจกรรม", value: "6" },
      { text: "ลาอื่นๆ", value: "21" },
      { text: "ไม่เช็กชื่อ", value: "99" },
      { text: "ไม่ทราบ", value: "-" },
    ],
    onFilter: (value: any, record: AttendanceRow) => record.StatusIN === value,
  },
  {
    title: "สถานะออก",
    dataIndex: "StatusOut",
    key: "StatusOut",
    render: (status: string) => getStatusTag(status),
    filters: [
      { text: "ตรงเวลา", value: "0" },
      { text: "สาย", value: "1" },
      { text: "ขาด", value: "3" },
      { text: "ลากิจ", value: "4" },
      { text: "ลาป่วย", value: "5" },
      { text: "กิจกรรม", value: "6" },
      { text: "ลาอื่นๆ", value: "21" },
      { text: "ไม่เช็กชื่อ", value: "99" },
      { text: "ไม่ทราบ", value: "-" },
    ],
    onFilter: (value: any, record: AttendanceRow) => record.StatusOut === value,
  },
  {
    title: "การกระทำ",
    key: "action",
    render: (_: any, row: AttendanceRow) => (
      <Button
        icon={<CopyOutlined />}
        size="small"
        onClick={() => {
          if (statisticCurl) {
            navigator.clipboard.writeText(String(statisticCurl));
            toast.success("คัดลอก CURL สำเร็จ");
          } else {
            toast.error("ไม่มี CURL Command");
          }
        }}
      >
        COPY CURL
      </Button>
    ),
  },
];

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const USER_LIST_STATE = useAppSelector(
    (state) => state.callGetuserBySchoolId
  );
  const STATISTIC_STATE = useAppSelector((state) => state.callPostStatistic);

  const [form] = Form.useForm();
  const [userList, setUserList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [table, setTable] = useState<AttendanceRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const schoolId = Form.useWatch("school_id", form);

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
      return [];
    } catch {
      return [];
    }
  }, [SCHOOL_LIST_STATE?.response?.data?.data]);

  const userOptions = useMemo(() => {
    return (
      USER_LIST_STATE?.response?.data?.data?.map(
        (item: type.ResponseUserList["draftValues"]) => ({
          label: `${item?.Name ?? ""} ${item?.LastName ?? ""} (ID: ${
            item?.UserID
          })`,
          value: String(item?.UserID),
        })
      ) ?? []
    );
  }, [USER_LIST_STATE?.response?.data]);

  const fetchUsersBySchool = useCallback(
    async (schoolID?: string) => {
      if (!schoolID) return;
      setLoadingUsers(true);
      const toastId = toast.loading("กำลังโหลดรายชื่อผู้ใช้...");
      try {
        await dispatch(GET_USER_BY_SCHOOLID({ schoolId: schoolID })).unwrap();
        toast.success("โหลดรายชื่อผู้ใช้สำเร็จ", { id: toastId });
      } catch (error: any) {
        toast.error("เกิดข้อผิดพลาด", {
          description: error?.message || "ไม่สามารถโหลดรายชื่อผู้ใช้",
          id: toastId,
        });
      } finally {
        setLoadingUsers(false);
      }
    },
    [dispatch]
  );

  const lastFetchedSchoolId = useRef<string | null>(null);
  useEffect(() => {
    if (!schoolId) return;
    const idStr = String(schoolId);
    if (lastFetchedSchoolId.current === idStr) return;
    lastFetchedSchoolId.current = idStr;
    fetchUsersBySchool(idStr);
    form.setFieldValue("user_id", "");
  }, [schoolId, fetchUsersBySchool, form]);

  const handleSubmitForm = async (values: any) => {
    const tId = toast.loading("กำลังค้นหาข้อมูล...");
    try {
      setLoading(true);
      const response = await dispatch(
        POST_TO_GET_STATISTIC({
          user_id: values.user_id,
          school_id: values.school_id,
          start_date: formatDateToMMDDYYYY(values.start_date),
          end_date: formatDateToMMDDYYYY(values.end_date),
        })
      ).unwrap();
      setTable(response?.data ?? []);
      if (response?.data?.length > 0) {
        toast.success(`ค้นหาสำเร็จ (รหัสนักเรียน/บุคลากร: ${values.user_id})`, {
          id: tId,
        });
      } else {
        toast.error("ไม่พบข้อมูล", { id: tId });
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด", {
        description: error?.message || "ไม่สามารถค้นหาข้อมูลได้",
        id: tId,
      });
    } finally {
      setLoading(false);
    }
  };

  const pagedData = table.slice((page - 1) * pageSize, page * pageSize);

  const selectedUserId = Form.useWatch("user_id", form);
  const columns = useMemo(
    () =>
      getTableColumns(
        userOptions,
        String(selectedUserId ?? ""),
        STATISTIC_STATE?.response?.curl
      ),
    [userOptions, selectedUserId, STATISTIC_STATE?.response?.curl]
  );

  return (
    <DashboardLayout>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <Typography.Title level={3}>สถิติการมาเรียน</Typography.Title>

        <Card title="ค้นหาข้อมูลการมาเรียน">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            initialValues={{
              school_id: "",
              user_id: "",
              start_date: null,
              end_date: null,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="เลือกโรงเรียน"
                  name="school_id"
                  rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
                >
                  <Select
                    showSearch
                    placeholder="เลือกโรงเรียน"
                    options={[
                      { label: "เลือกรายการ", value: "" },
                      ...schoolOptions,
                    ]}
                    loading={SCHOOL_LIST_STATE.loading}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="กรอกรหัสผู้ใช้"
                  name="user_id"
                  rules={[{ required: true, message: "กรุณาเลือกผู้ใช้" }]}
                >
                  <Select
                    showSearch
                    placeholder="กรอกรหัส User ID"
                    options={[
                      { label: "เลือกรายการ", value: "" },
                      ...userOptions,
                    ]}
                    loading={loadingUsers}
                    disabled={loadingUsers || !form.getFieldValue("school_id")}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="จากวันที่"
                  name="start_date"
                  rules={[
                    { required: true, message: "กรุณาเลือกวันที่เริ่มต้น" },
                  ]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="จากวันที่"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="ถึงวันที่"
                  name="end_date"
                  rules={[
                    { required: true, message: "กรุณาเลือกวันที่สิ้นสุด" },
                  ]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="ถึงวันที่"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="end">
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={loading}
                >
                  ค้นหา
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card
          title={`ผลลัพธ์ (หน้าที่ ${page})`}
          loading={loading || STATISTIC_STATE.loading}
        >
          <Spin spinning={loading || STATISTIC_STATE.loading}>
            <Table
              columns={columns}
              dataSource={table.map((row, idx) => ({ ...row, key: idx }))}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: table.length,
                showSizeChanger: true,
                pageSizeOptions: ["10", "30", "50"],
                onChange: (pageNum) => setPage(pageNum),
                onShowSizeChange: (_current, size) => {
                  setPageSize(size);
                  setPage(1);
                },
                showTotal: (total, range) =>
                  `แสดง ${range[0]}-${range[1]} จาก ${total} รายการ`,
              }}
              size="middle"
              scroll={{ x: "max-content" }}
            />
          </Spin>
        </Card>
      </Space>
    </DashboardLayout>
  );
}
