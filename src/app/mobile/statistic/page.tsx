"use client";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { useTranslation } from "react-i18next";
import { Card, Form, Button, Select, DatePicker, Table, Space, Tag, Typography, message, Spin } from "antd";
import { SearchOutlined, CopyOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import * as type from "@/stores/type";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import { CallAPI as GET_USER_BY_SCHOOLID } from "@stores/actions/school/call-get-user";
import { CallAPI as POST_TO_GET_STATISTIC } from "@stores/actions/mobile/call-post-statistic";
import formatDateToMMDDYYYY from "@helpers/convert-to-mm-dd-yyyy";

// ---------------------------------------------
// {* โครงสร้างข้อมูลจาก API สถิติการมาเรียน *}
type AttendanceRow = {
  SchoolID: number;
  dScan: string; // วันที่สแกน (ISO string)
  StatusIN: string; // รหัสสถานะเข้าโรงเรียน
  TimeIn: string; // เวลาเข้า (ISO string)
  StatusOut: string; // รหัสสถานะออกโรงเรียน
  TimeOut: string; // เวลาออก (ISO string)
};

//** แปลงรหัสสถานะ -> ป้ายภาษาไทย + สีแสดงผล (AntD Tag) **
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
// ---------------------------------------------

//** สร้าง columns แบบ Ant Design **
const getTableColumns = (userList: any[], formUserId: string, statisticCurl: string) => [
  {
    title: "รหัสโรงเรียน",
    dataIndex: "SchoolID",
    key: "SchoolID",
    sorter: (a: AttendanceRow, b: AttendanceRow) => (a.SchoolID ?? 0) - (b.SchoolID ?? 0),
  },
  {
    title: "ผู้ที่แสกน",
    dataIndex: "Owner",
    key: "Owner",
    render: (_: any, row: AttendanceRow) =>
      userList.find((user: any) => String(user.value) === String(formUserId))?.label ?? "ไม่พบข้อมูลผู้ใช้",
    // ไม่สามารถ sort ได้ (เพราะ label ไม่อยู่ใน row)
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
            message.success("CURL command copied to clipboard.");
          } else {
            message.error("ไม่มี CURL Command");
          }
        }}
      >
        COPY CURL
      </Button>
    ),
  },
];

export default function Page() {
  //** โหลดภาษา **
  const { t } = useTranslation("mock");
  //** เชื่อม Redux **
  const dispatch = useDispatch<AppDispatch>();
  //** โหลดรายชื่อโรงเรียนจาก Redux **
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  //** โหลดรายชื่อ user จาก Redux **
  const USER_LIST_STATE = useAppSelector((state) => state.callGetuserBySchoolId);
  //** สถิติการมาเรียน (ผลลัพธ์) **
  const STATISTIC_STATE = useAppSelector((state) => state.callPostStatistic);

  //** State สำหรับฟอร์ม **
  const [form] = Form.useForm();
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [table, setTable] = useState<AttendanceRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);

  //** โหลดโรงเรียน **
  useEffect(() => {
    setSchoolList(
      SCHOOL_LIST_STATE?.response?.data?.data?.map((item: any) => ({
        label: item.SchoolName + " (" + item.SchoolID + ")",
        value: String(item.SchoolID),
      })) || []
    );
  }, [SCHOOL_LIST_STATE?.response]);

  //** โหลด user เมื่อเลือกโรงเรียน **
  useEffect(() => {
    const schoolId = form.getFieldValue("school_id");
    if (schoolId) {
      getUserBySchoolId(schoolId);
    } else {
      setUserList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.getFieldValue("school_id")]);

  //** ฟังก์ชันโหลด user **
  const getUserBySchoolId = async (schoolId: string) => {
    try {
      setLoading(true);
      const response = await dispatch(GET_USER_BY_SCHOOLID({ schoolId }));
      setUserList(
        response?.payload?.data?.map(
          (item: type.ResponseUserList["draftValues"]) => ({
            label: `${item?.Name} ${item?.LastName} (ID: ${item?.UserID} Username: ${item?.username})`,
            value: String(item?.UserID),
          })
        ) ?? []
      );
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการโหลดผู้ใช้");
    } finally {
      setLoading(false);
    }
  };

  //** ค้นหาข้อมูลสถิติจาก API **
  const handleSubmitForm = async (values: any) => {
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
        message.success({
          content: `ค้นหาสำเร็จ (รหัสนักเรียน/บุคลากร: ${values.user_id})`,
          duration: 3,
        });
      } else {
        message.error("ไม่พบข้อมูล");
      }
    } catch (error: any) {
      message.error(error?.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  //** เปลี่ยนหน้า Pagination **
  const handleChangePage = (pageNum: number) => {
    setPage(pageNum);
  };

  //** คำนวณข้อมูลหน้าปัจจุบัน **
  const pagedData = table.slice((page - 1) * pageSize, page * pageSize);

  //** Columns ตาราง **
  const columns = getTableColumns(userList, form.getFieldValue("user_id"), STATISTIC_STATE?.response?.curl);

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={3}>สถิติการมาเรียน</Typography.Title>
      {/* ฟอร์มค้นหา */}
      <Card style={{ marginBottom: 24 }}>
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
          <Space size="middle" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item
              label="เลือกโรงเรียน"
              name="school_id"
              rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
              style={{ minWidth: 250 }}
            >
              <Select
                showSearch
                placeholder="เลือกโรงเรียน"
                options={[{ label: "เลือกรายการ", value: "" }, ...schoolList]}
                loading={SCHOOL_LIST_STATE.loading}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              label="กรอกรหัส User ID ที่ต้องการค้นหา"
              name="user_id"
              rules={[{ required: true, message: "กรุณาเลือกผู้ใช้" }]}
              style={{ minWidth: 250 }}
            >
              <Select
                showSearch
                placeholder="กรอกรหัส User ID"
                options={[{ label: "เลือกรายการ", value: "" }, ...userList]}
                loading={USER_LIST_STATE.loading}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item
              label="จากวันที่"
              name="start_date"
              rules={[{ required: true, message: "กรุณาเลือกวันที่เริ่มต้น" }]}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: 160 }}
                placeholder="จากวันที่"
              />
            </Form.Item>
            <Form.Item
              label="ถึงวันที่"
              name="end_date"
              rules={[{ required: true, message: "กรุณาเลือกวันที่สิ้นสุด" }]}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: 160 }}
                placeholder="ถึงวันที่"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={loading}
                disabled={
                  !form.getFieldValue("user_id") ||
                  !form.getFieldValue("start_date") ||
                  !form.getFieldValue("end_date")
                }
              >
                ค้นหา
              </Button>
            </Form.Item>
          </Space>
        </Form>
      </Card>

      {/* ตารางข้อมูล */}
      <Card
        title={`ตาราง (หน้าที่ ${page})`}
        style={{ width: "100%" }}
        extra={
          <Space>
            <Button
              icon={<LeftOutlined />}
              onClick={() => handleChangePage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              หน้าก่อนหน้า
            </Button>
            <Button
              icon={<RightOutlined />}
              onClick={() =>
                handleChangePage(
                  page * pageSize < table.length ? page + 1 : page
                )
              }
              disabled={page * pageSize >= table.length}
            >
              หน้าถัดไป
            </Button>
          </Space>
        }
        hidden={table?.length < 1}
      >
        <Spin spinning={loading || STATISTIC_STATE.loading}>
          <Table
            columns={columns}
            dataSource={pagedData.map((row, idx) => ({
              ...row,
              key: (page - 1) * pageSize + idx,
            }))}
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: "max-content" }}
          />
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Typography.Text>
              แสดง {pagedData.length} จาก {table.length} รายการ
            </Typography.Text>
          </div>
        </Spin>
      </Card>
    </div>
  );
}
