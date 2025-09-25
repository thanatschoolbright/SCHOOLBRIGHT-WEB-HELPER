"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { InputRef } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "sonner";
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";
import { CallAPI as GET_USER_BY_SCHOOLID } from "@stores/actions/school/call-get-user";
import { CallAPI as GET_LEAVE_LETTER_LIST } from "@stores/actions/mobile/call-get-leave-letter";
import { CallAPI as FIX_LEAVE_LETTER_DETAIL } from "@stores/actions/mobile/call-get-fix-leave-letter-status";
import type { ResponseLeaveLetter, ResponseUserList } from "@/stores/type";

const PAGE_SIZE = 10;

type SearchableColumnKey =
  | "letterId"
  | "letterSubmitDate"
  | "letterType"
  | "senderName"
  | "userType"
  | "status";

type TableColumn = ColumnType<ResponseLeaveLetter> & {
  key: keyof ResponseLeaveLetter | string;
};

type DatasetState = {
  data: ResponseLeaveLetter[];
  loading: boolean;
  curl: string;
  page: number;
};

const USER_TYPE_LABEL: Record<string, string> = {
  "0": "นักเรียน",
  "1": "คุณครู",
};

const STATUS_COLOR_MAP: Record<string, string> = {
  อนุมัติ: "green",
  รออนุมัติ: "orange",
  ปฏิเสธ: "red",
};

const getStatusColor = (status?: string) => {
  if (!status) {
    return "default";
  }
  return STATUS_COLOR_MAP[status] ?? "default";
};

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm<{ schoolID: string; userID: string }>();

  const schoolState = useAppSelector((state) => state.callSchoolList);
  const userState = useAppSelector((state) => state.callGetuserBySchoolId);
  const [dataset, setDataset] = useState<DatasetState>({
    data: [],
    loading: false,
    curl: "",
    page: 1,
  });

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const schoolOptions = useMemo(() => {
    return (
      schoolState?.response?.data?.map((item: any) => ({
        label: `${item.SchoolName} (${item.SchoolID})`,
        value: String(item.SchoolID),
      })) ?? []
    );
  }, [schoolState?.response?.data]);

  const userOptions = useMemo(() => {
    return (
      userState?.response?.data?.data?.map(
        (item: ResponseUserList["draftValues"]) => ({
          label: `${item?.Name ?? ""} ${item?.LastName ?? ""} (ID: ${
            item?.UserID
          })`,
          value: String(item?.UserID),
        })
      ) ?? []
    );
  }, [userState?.response?.data?.data]);

  const overallLoading = Boolean(
    schoolState.loading || userState.loading || dataset.loading
  );

  const fetchUsersBySchool = useCallback(
    async (schoolID?: string) => {
      if (!schoolID) {
        return;
      }

      const toastId = toast.loading("กำลังโหลดรายชื่อผู้ใช้...");
      try {
        await dispatch(GET_USER_BY_SCHOOLID({ schoolId: schoolID })).unwrap();
        toast.success("โหลดรายชื่อผู้ใช้สำเร็จ", { id: toastId });
      } catch (error: any) {
        toast.error(error?.message ?? "ไม่สามารถโหลดรายชื่อผู้ใช้", {
          id: toastId,
        });
      }
    },
    [dispatch]
  );

  const fetchLeaveLetters = useCallback(
    async (userID: string, requestedPage = 1) => {
      if (!userID) {
        toast.info("กรุณาเลือกผู้ใช้ก่อน");
        return;
      }

      setDataset((prev) => ({ ...prev, loading: true }));
      const toastId = toast.loading("กำลังโหลดจดหมายลาหยุด...");

      try {
        const response = await dispatch(
          GET_LEAVE_LETTER_LIST({
            user_id: userID,
            page: String(requestedPage),
          })
        ).unwrap();

        const responseData = response?.data;
        const normalizedData = Array.isArray(responseData)
          ? responseData
          : responseData
          ? [responseData]
          : [];

        setDataset({
          data: normalizedData,
          loading: false,
          curl: response?.curl ?? "",
          page: requestedPage,
        });

        toast.success("โหลดข้อมูลสำเร็จ", { id: toastId });
      } catch (error: any) {
        setDataset((prev) => ({ ...prev, loading: false }));
        toast.error(error?.message ?? "ไม่สามารถโหลดข้อมูลจดหมาย", {
          id: toastId,
        });
      }
    },
    [dispatch]
  );

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    await fetchLeaveLetters(values.userID, 1);
  }, [fetchLeaveLetters, form]);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      const { userID } = form.getFieldsValue();
      if (!userID) {
        toast.info("กรุณาเลือกผู้ใช้ก่อน");
        return;
      }

      if (nextPage < 1) {
        return;
      }

      await fetchLeaveLetters(userID, nextPage);
    },
    [fetchLeaveLetters, form]
  );

  const handleFixStatus = useCallback(
    async (letterId: string) => {
      const { schoolID } = form.getFieldsValue();
      if (!schoolID) {
        toast.info("กรุณาเลือกโรงเรียนก่อน");
        return;
      }

      const toastId = toast.loading("กำลังแก้ไขสถานะ...");

      try {
        await dispatch(
          FIX_LEAVE_LETTER_DETAIL({
            school_id: schoolID,
            letter_id: letterId,
          })
        ).unwrap();

        toast.success(`แก้ไขสถานะจดหมาย ${letterId} สำเร็จ`, {
          id: toastId,
        });

        const { userID } = form.getFieldsValue();
        if (userID) {
          await fetchLeaveLetters(userID, dataset.page);
        }
      } catch (error: any) {
        toast.error(error?.message ?? "ไม่สามารถแก้ไขสถานะได้", {
          id: toastId,
        });
      }
    },
    [dataset.page, dispatch, fetchLeaveLetters, form]
  );

  const selectedSchoolId = Form.useWatch("schoolID", form);

  useEffect(() => {
    form.setFieldsValue({ userID: undefined });
    if (selectedSchoolId) {
      fetchUsersBySchool(selectedSchoolId);
    }
  }, [fetchUsersBySchool, form, selectedSchoolId]);

  const getColumnSearchProps = useCallback(
    (dataIndex: SearchableColumnKey, title: string): TableColumn => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        const value = (selectedKeys[0] as string | undefined) ?? "";

        return (
          <div
            style={{ padding: 12 }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Input
              ref={(node) => {
                searchInputRefs.current[dataIndex] = node;
              }}
              placeholder={`ค้นหา ${title}`}
              value={value}
              onChange={(event) => {
                const { value: inputValue } = event.target;
                setSelectedKeys(inputValue ? [inputValue] : []);
              }}
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
      onFilter: (value, record) => {
        const raw = record[dataIndex];
        if (!raw) {
          return false;
        }
        return String(raw).toLowerCase().includes(String(value).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (visible) => {
          if (visible) {
            setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
          }
        },
      },
    }),
    []
  );

  const columns = useMemo<ColumnsType<ResponseLeaveLetter>>(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        render: (_value, _record, index) =>
          index + 1 + (dataset.page - 1) * PAGE_SIZE,
        width: 80,
        align: "center",
      },
      {
        title: "รหัสจดหมาย",
        dataIndex: "letterId",
        sorter: (a, b) => Number(a.letterId) - Number(b.letterId),
        ...getColumnSearchProps("letterId", "รหัสจดหมาย"),
      },
      {
        title: "วันที่ส่งคำร้อง",
        dataIndex: "letterSubmitDate",
        sorter: (a, b) =>
          dayjs(a.letterSubmitDate as unknown as string).valueOf() -
          dayjs(b.letterSubmitDate as unknown as string).valueOf(),
        render: (value: string) => convertTimeZoneToThai(new Date(value)),
        ...getColumnSearchProps("letterSubmitDate", "วันที่ส่ง"),
      },
      {
        title: "ประเภทการลา",
        dataIndex: "letterType",
        sorter: (a, b) =>
          String(a.letterType).localeCompare(String(b.letterType)),
        render: (value: string) => <Tag color="blue">{value}</Tag>,
        ...getColumnSearchProps("letterType", "ประเภทการลา"),
      },
      {
        title: "ชื่อผู้ส่งคำร้อง",
        dataIndex: "senderName",
        sorter: (a, b) =>
          String(a.senderName).localeCompare(String(b.senderName)),
        ...getColumnSearchProps("senderName", "ชื่อผู้ส่ง"),
      },
      {
        title: "ประเภทผู้ใช้งาน",
        dataIndex: "userType",
        sorter: (a, b) => String(a.userType).localeCompare(String(b.userType)),
        filters: [
          { text: USER_TYPE_LABEL["0"], value: "0" },
          { text: USER_TYPE_LABEL["1"], value: "1" },
        ],
        onFilter: (value, record) => String(record.userType) === String(value),
        render: (value: string) => USER_TYPE_LABEL[value] ?? value,
        ...getColumnSearchProps("userType", "ประเภทผู้ใช้"),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        sorter: (a, b) => String(a.status).localeCompare(String(b.status)),
        render: (_value: string, record) => (
          <Tag color={getStatusColor(record.ApprovedStatus?.TextTH)}>
            {record.ApprovedStatus?.TextTH ?? "-"}
          </Tag>
        ),
        ...getColumnSearchProps("status", "สถานะ"),
      },
      {
        title: "การกระทำ",
        key: "actions",
        render: (_value, record) => (
          <Space>
            <Button
              onClick={() => {
                if (!dataset.curl) {
                  toast.info("ไม่พบคำสั่ง CURL");
                  return;
                }
                navigator.clipboard.writeText(dataset.curl);
                toast.success("คัดลอกคำสั่ง CURL แล้ว");
              }}
            >
              คัดลอก CURL
            </Button>
            <Button
              type="primary"
              onClick={() => handleFixStatus(String(record.leaveLetterId))}
            >
              แก้ไขสถานะ
            </Button>
          </Space>
        ),
      },
    ],
    [dataset.curl, dataset.page, getColumnSearchProps, handleFixStatus]
  );

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card title="ค้นหาจดหมายลาหยุด" variant="borderless">
          <Form
            layout="vertical"
            form={form}
            onFinish={handleSubmit}
            initialValues={{ schoolID: "", userID: "" }}
          >
            <Form.Item
              label="เลือกโรงเรียน"
              name="schoolID"
              rules={[{ required: true, message: "กรุณาเลือกโรงเรียน" }]}
            >
              <Select
                showSearch
                placeholder="เลือกโรงเรียน"
                options={schoolOptions}
                loading={schoolState.loading}
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              label="เลือกผู้ใช้"
              name="userID"
              rules={[{ required: true, message: "กรุณาเลือกผู้ใช้" }]}
            >
              <Select
                showSearch
                placeholder="เลือกผู้ใช้"
                options={userOptions}
                loading={userState.loading}
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={overallLoading}>
                ค้นหา
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card
          title={`ตารางจดหมายลาหยุด (หน้า ${dataset.page})`}
          bordered={false}
          extra={
            <Space>
              <Button
                onClick={() => handlePageChange(dataset.page - 1)}
                disabled={dataset.page <= 1}
              >
                หน้าก่อนหน้า
              </Button>
              <Button onClick={() => handlePageChange(dataset.page + 1)}>
                หน้าถัดไป
              </Button>
            </Space>
          }
        >
          <Table<ResponseLeaveLetter>
            dataSource={dataset.data}
            loading={dataset.loading}
            columns={columns}
            rowKey={(record) => String(record.leaveLetterId)}
            pagination={false}
            locale={{
              emptyText: overallLoading ? "กำลังโหลด..." : "ไม่พบข้อมูล",
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>
    </DashboardLayout>
  );
}
