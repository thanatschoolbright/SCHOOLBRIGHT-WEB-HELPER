"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  FileTextOutlined,
  FilterOutlined,
  RestOutlined,
  SearchOutlined,
  TableOutlined,
} from "@ant-design/icons";
import type { InputRef } from "antd";
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

// Components
import SummaryCard from "@/components/card/summary-card";
import StatusModal from "@/components/modal/status-modal";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";

// Store & Types
import type { ResponseLeaveLetter, ResponseUserList } from "@/stores/type";
import { CallAPI as FIX_LEAVE_LETTER_DETAIL } from "@stores/actions/mobile/call-get-fix-leave-letter-status";
import { CallAPI as GET_LEAVE_LETTER_LIST } from "@stores/actions/mobile/call-get-leave-letter";
import { CallAPI as GET_USER_BY_SCHOOLID } from "@stores/actions/school/call-get-user";
import { AppDispatch, useAppSelector } from "@stores/store";

// Helpers
import { convertTimeZoneToThai } from "@helpers/convert-time-zone-to-thai";

const { Text } = Typography;
const { useBreakpoint } = Grid;
const PAGE_SIZE = 10;

/**
 * กำหนดประเภทข้อมูลสำหรับคอลัมน์ที่ค้นหาได้
 */
type SearchableColumnKey =
  | "letterId"
  | "letterSubmitDate"
  | "letterType"
  | "senderName"
  | "userType"
  | "status";

/**
 * ขยายประเภท ColumnType ของ Ant Design เพื่อรองรับ key ที่ระบุ
 */
type TableColumn = ColumnType<any> & {
  key: keyof ResponseLeaveLetter | string;
};

/**
 * สถานะของชุดข้อมูลที่ดึงมาจาก API
 */
type DatasetState = {
  data: ResponseLeaveLetter[];
  loading: boolean;
  curl: string;
  page: number;
};

/**
 * แมปปิ้งป้ายกำกับประเภทผู้ใช้งาน
 */
const USER_TYPE_LABEL: Record<string, string> = {
  "0": "นักเรียน",
  "1": "คุณครู",
};

/**
 * แมปปิ้งสีสำหรับสถานะต่างๆ
 */
const STATUS_COLOR_MAP: Record<string, string> = {
  อนุมัติ: "green",
  รออนุมัติ: "orange",
  ปฏิเสธ: "red",
};

/**
 * ฟังก์ชันช่วยเหลือในการดึงสีตามสถานะ
 * @param status ข้อความสถานะ
 * @returns ชื่อสีที่สอดคล้อง
 */
const getStatusColorByText = (status?: string): string => {
  if (!status) return "default";
  return STATUS_COLOR_MAP[status] ?? "default";
};

export default function LeaveLetterManagementPage() {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm<{ schoolID: string; userID: string }>();

  // * ดึงข้อมูลจาก Redux Store
  const schoolState = useAppSelector((state) => state.callSchoolList);
  const userState = useAppSelector((state) => state.callGetuserBySchoolId);

  // * สถานะภายใน Component
  const [dataset, setDataset] = useState<DatasetState>({
    data: [],
    loading: false,
    curl: "",
    page: 1,
  });

  const [statusModalConfig, setStatusModalConfig] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  // * ข้อมูลสำหรับตัวเลือกโรงเรียน
  const schoolOptions = useMemo(() => {
    const rawData = schoolState?.response?.data;
    const arrayData = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

    return arrayData.map((item: any) => ({
      label: `${item.SchoolName} (${item.SchoolID})`,
      value: String(item.SchoolID),
    }));
  }, [schoolState?.response?.data]);

  // * ข้อมูลสำหรับตัวเลือกผู้ใช้งาน
  const userOptions = useMemo(() => {
    const rawData = userState?.response?.data;
    const arrayData = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData)
        ? rawData
        : [];

    return arrayData.map((item: ResponseUserList["draftValues"]) => ({
      label: `${item?.Name ?? ""} ${item?.LastName ?? ""} (ID: ${
        item?.UserID
      })`,
      value: String(item?.UserID),
    }));
  }, [userState?.response?.data]);

  // * การคำนวณข้อมูลสรุป (Summary Card) - ใช้จาก API Response โดยตรง
  const summaryCounters = useMemo(() => {
    const rawData = dataset.data || [];
    return rawData.reduce(
      (accumulator, currentItem) => {
        // * กรองออกหากรายการระบุว่าถูกลบ (is_deleted : true จะต้องไม่นำมาคำนวณ)
        const isDeleted =
          currentItem?.is_deleted === true ||
          currentItem?.is_deleted === 1 ||
          currentItem?.is_deleted === "1";

        if (isDeleted) {
          return accumulator;
        }

        const statusTH = currentItem.ApprovedStatus?.TextTH;
        const statusEN = currentItem.ApprovedStatus?.TextEN;

        if (statusTH === "อนุมัติ" || statusEN === "Approved") {
          accumulator.approved++;
        } else if (statusTH === "รออนุมัติ" || statusEN === "Pending") {
          accumulator.pending++;
        } else if (statusTH === "ปฏิเสธ" || statusEN === "Rejected") {
          accumulator.rejected++;
        }

        accumulator.total++;
        return accumulator;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0 },
    );
  }, [dataset.data]);

  const overallLoading = Boolean(
    schoolState.loading || userState.loading || dataset.loading,
  );

  /**
   * ฟังก์ชันสำหรับดึงรายชื่อผู้ใช้ตามรหัสโรงเรียน
   * @param schoolID รหัสโรงเรียน
   */
  const requestUsersBySchoolID = useCallback(
    async (schoolID?: string) => {
      if (!schoolID) return;

      const toastId = toast.loading(
        TRANSLATION("common.loading_users") || "กำลังโหลดรายชื่อผู้ใช้...",
      );
      try {
        await dispatch(GET_USER_BY_SCHOOLID({ schoolId: schoolID })).unwrap();
        toast.success(
          TRANSLATION("common.load_users_success") || "โหลดรายชื่อผู้ใช้สำเร็จ",
          { id: toastId },
        );
      } catch (error: any) {
        toast.error(error?.message ?? "ไม่สามารถโหลดรายชื่อผู้ใช้", {
          id: toastId,
        });
      }
    },
    [dispatch, TRANSLATION],
  );

  /**
   * ฟังก์ชันสำหรับดึงรายการจดหมายลาหยุดของผู้ใช้
   * @param userID รหัสผู้ใช้
   * @param requestedPage ลำดับหน้า
   */
  const requestLeaveLettersByUserID = useCallback(
    async (userID: string, requestedPage = 1) => {
      if (!userID) {
        toast.info(
          TRANSLATION("leave_letter_page.select_user_first") ||
            "กรุณาเลือกผู้ใช้ก่อน",
        );
        return;
      }

      setDataset((prev) => ({ ...prev, loading: true }));
      const toastId = toast.loading(
        TRANSLATION("common.loading_data") || "กำลังโหลดข้อมูล...",
      );

      try {
        const response = await dispatch(
          GET_LEAVE_LETTER_LIST({
            user_id: userID,
            page: String(requestedPage),
          }),
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

        toast.success(
          TRANSLATION("common.load_success") || "โหลดข้อมูลสำเร็จ",
          { id: toastId },
        );
      } catch (error: any) {
        setDataset((prev) => ({ ...prev, loading: false }));
        toast.error(
          (error?.message ?? TRANSLATION("common.load_error")) ||
            "ไม่สามารถโหลดข้อมูลได้",
          {
            id: toastId,
          },
        );
      }
    },
    [dispatch, TRANSLATION],
  );

  /**
   * จัดการการส่งฟอร์มเพื่อค้นหาข้อมูล
   */
  const handleFormSearchSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      await requestLeaveLettersByUserID(values.userID, 1);
    } catch (error) {
      // Validation error
    }
  }, [requestLeaveLettersByUserID, form]);

  /**
   * จัดการการเปลี่ยนหน้าในตาราง
   * @param nextPage หน้าเป้าหมาย
   */
  const handleTablePageChange = useCallback(
    async (nextPage: number) => {
      const { userID } = form.getFieldsValue();
      if (!userID) {
        toast.info(
          TRANSLATION("leave_letter_page.select_user_first") ||
            "กรุณาเลือกผู้ใช้ก่อน",
        );
        return;
      }

      if (nextPage < 1) return;

      await requestLeaveLettersByUserID(userID, nextPage);
    },
    [requestLeaveLettersByUserID, form, TRANSLATION],
  );

  /**
   * ล้างข้อมูลการค้นหาทั้งหมด
   */
  const handleResetSearchFilters = useCallback(() => {
    form.resetFields();
    setDataset({
      data: [],
      loading: false,
      curl: "",
      page: 1,
    });
    toast.info(TRANSLATION("common.filters_cleared") || "ล้างตัวกรองแล้ว");
  }, [form, TRANSLATION]);

  /**
   * แก้ไขสถานะจดหมายลาหยุด
   * @param letterID รหัสจดหมาย
   */
  const requestFixLetterStatusByID = useCallback(
    async (letterID: string) => {
      const { schoolID } = form.getFieldsValue();
      if (!schoolID) {
        toast.info(
          TRANSLATION("leave_letter_page.select_school_first") ||
            "กรุณาเลือกโรงเรียนก่อน",
        );
        return;
      }

      const toastId = toast.loading(
        TRANSLATION("common.updating_status") || "กำลังแก้ไขสถานะ...",
      );

      try {
        await dispatch(
          FIX_LEAVE_LETTER_DETAIL({
            school_id: schoolID,
            letter_id: letterID,
          }),
        ).unwrap();

        toast.success(
          TRANSLATION("leave_letter_page.status_updated") ||
            `แก้ไขสถานะจดหมาย ${letterID} สำเร็จ`,
          {
            id: toastId,
          },
        );

        setStatusModalConfig({
          open: true,
          type: "success",
          title: "ดำเนินการสำเร็จ",
          message: `ระบบได้แก้ไขสถานะของจดหมายหมายเลข ${letterID} เรียบร้อยแล้ว`,
        });

        const { userID } = form.getFieldsValue();
        if (userID) {
          await requestLeaveLettersByUserID(userID, dataset.page);
        }
      } catch (error: any) {
        toast.error(error?.message ?? "ไม่สามารถแก้ไขสถานะได้", {
          id: toastId,
        });
        setStatusModalConfig({
          open: true,
          type: "error",
          title: "เกิดข้อผิดพลาด",
          message: error?.message ?? "ไม่สามารถแก้ไขสถานะได้ในขณะนี้",
        });
      }
    },
    [dataset.page, dispatch, requestLeaveLettersByUserID, form, TRANSLATION],
  );

  const selectedSchoolId = Form.useWatch("schoolID", form);

  // * อัปเดตรายชื่อผู้ใช้เมื่อเปลี่ยนโรงเรียน
  useEffect(() => {
    form.setFieldsValue({ userID: undefined });
    if (selectedSchoolId) {
      requestUsersBySchoolID(selectedSchoolId);
    }
  }, [requestUsersBySchoolID, form, selectedSchoolId]);

  /**
   * ฟังก์ชันสร้าง Props สำหรับการค้นหาในคอลัมน์ของตาราง
   */
  const getSearchColumnProps = useCallback(
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
            <Space className="flex justify-end">
              <Button
                size="small"
                onClick={() => {
                  clearFilters?.();
                  confirm({ closeDropdown: true });
                }}
              >
                รีเซ็ต
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="small"
                onClick={() => confirm()}
              >
                ค้นหา
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined
          style={{ color: filtered ? token.colorPrimary : undefined }}
        />
      ),
      onFilter: (value, record) => {
        const raw = record[dataIndex];
        if (!raw) return false;
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
    [token.colorPrimary],
  );

  // * กำหนดคอลัมน์ของตาราง
  const leaveLetterTableColumns = useMemo<ColumnsType<any>>(
    () => [
      {
        title: "ลำดับ",
        key: "index",
        render: (_value, _record, index) =>
          index + 1 + (dataset.page - 1) * PAGE_SIZE,
        width: 70,
        align: "center",
      },
      {
        title: "รหัสจดหมาย",
        dataIndex: "letterId",
        sorter: (a, b) => Number(a.letterId) - Number(b.letterId),
        ...getSearchColumnProps("letterId", "รหัสจดหมาย"),
        width: 120,
      },
      {
        title: "วันที่ส่งคำร้อง",
        dataIndex: "letterSubmitDate",
        sorter: (a, b) =>
          dayjs(a.letterSubmitDate as unknown as string).valueOf() -
          dayjs(b.letterSubmitDate as unknown as string).valueOf(),
        render: (value: string) => convertTimeZoneToThai(new Date(value)),
        ...getSearchColumnProps("letterSubmitDate", "วันที่ส่ง"),
        width: 180,
      },
      {
        title: "ประเภทการลา",
        dataIndex: "letterType",
        sorter: (a, b) =>
          String(a.letterType).localeCompare(String(b.letterType)),
        render: (value: string) => (
          <Tag color="blue" className="rounded-md">
            {value}
          </Tag>
        ),
        ...getSearchColumnProps("letterType", "ประเภทการลา"),
        width: 150,
      },
      {
        title: "ชื่อผู้ส่งคำร้อง",
        dataIndex: "senderName",
        sorter: (a, b) =>
          String(a.senderName).localeCompare(String(b.senderName)),
        ...getSearchColumnProps("senderName", "ชื่อผู้ส่ง"),
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
        render: (value: string) => (
          <Text style={{ fontWeight: 500 }}>
            {USER_TYPE_LABEL[value] ?? value}
          </Text>
        ),
        ...getSearchColumnProps("userType", "ประเภทผู้ใช้"),
        width: 140,
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        sorter: (a, b) => {
          const statusA = a.ApprovedStatus?.TextTH || "";
          const statusB = b.ApprovedStatus?.TextTH || "";
          return statusA.localeCompare(statusB);
        },
        render: (_value: string, record) => (
          <Tag
            color={getStatusColorByText(record.ApprovedStatus?.TextTH)}
            className="rounded-md px-3"
          >
            {record.ApprovedStatus?.TextTH ?? "-"}
          </Tag>
        ),
        ...getSearchColumnProps("status", "สถานะ"),
        width: 120,
        align: "center",
      },
      {
        title: "จัดการ",
        key: "actions",
        width: 240,
        align: "center",
        fixed: "right",
        render: (_value, record) => (
          <Space>
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                if (!dataset.curl) {
                  toast.info("ไม่พบคำสั่ง CURL");
                  return;
                }
                navigator.clipboard.writeText(dataset.curl);
                toast.success("คัดลอกคำสั่ง CURL เรียบร้อย");
              }}
            >
              CURL
            </Button>
            <Button
              type="primary"
              variant="filled"
              color="primary"
              onClick={() =>
                requestFixLetterStatusByID(String(record.leaveLetterId))
              }
            >
              แก้ไขสถานะ
            </Button>
          </Space>
        ),
      },
    ],
    [
      dataset.curl,
      dataset.page,
      getSearchColumnProps,
      requestFixLetterStatusByID,
      token.colorPrimary,
    ],
  );

  return (
    <DashboardLayout>
      {/* ส่วนที่ 1: หัวข้อหน้าจอ */}
      <HeaderBar
        title="Leave Letters Management"
        subTitle="ค้นหาและจัดการความถูกต้องของสถานะคำขอลาหยุดผ่านระบบหลังบ้าน"
        icon={<FileTextOutlined style={{ fontSize: 24 }} />}
      />

      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* ส่วนที่ 2: สรุปข้อมูลภาพรวม */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="รายการทั้งหมด"
              value={summaryCounters.total}
              icon={<FileTextOutlined />}
              color={token.colorPrimary}
              isLoading={dataset.loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="อนุมัติแล้ว"
              value={summaryCounters.approved}
              icon={<CheckCircleOutlined />}
              color="#52c41a"
              isLoading={dataset.loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="รอการตรวจสอบ"
              value={summaryCounters.pending}
              icon={<ClockCircleOutlined />}
              color="#faad14"
              isLoading={dataset.loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <SummaryCard
              title="ถูกปฏิเสธ"
              value={summaryCounters.rejected}
              icon={<CloseCircleOutlined />}
              color="#ff4d4f"
              isLoading={dataset.loading}
            />
          </Col>
        </Row>

        {/* ส่วนที่ 3: ตัวกรองค้นหาข้อมูล */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
            <FilterOutlined style={{ color: token.colorPrimary }} />
            <Text strong style={{ fontSize: 16 }}>
              ตัวกรอง
            </Text>
          </Flex>

          <Form
            layout="vertical"
            form={form}
            onFinish={handleFormSearchSubmit}
            initialValues={{ schoolID: "", userID: "" }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="สถาบัน/โรงเรียน"
                  name="schoolID"
                  rules={[{ required: true, message: "กรุณาระบุโรงเรียน" }]}
                >
                  <Select
                    showSearch
                    placeholder="ค้นหาหรือเลือกโรงเรียน"
                    options={schoolOptions}
                    loading={schoolState.loading}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    size="large"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ผู้ใช้งาน"
                  name="userID"
                  rules={[{ required: true, message: "กรุณาระบุผู้ใช้งาน" }]}
                >
                  <Select
                    showSearch
                    placeholder="ค้นหาชื่อผู้ใช้งาน"
                    options={userOptions}
                    loading={userState.loading}
                    disabled={!selectedSchoolId}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    size="large"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Flex justify="end" gap={12} style={{ marginTop: 8 }}>
              <Button
                icon={<RestOutlined />}
                onClick={handleResetSearchFilters}
                size="large"
                style={{ borderRadius: 8 }}
              >
                ล้างการค้นหา
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={overallLoading}
                icon={<SearchOutlined />}
                size="large"
                style={{ borderRadius: 8, paddingLeft: 24, paddingRight: 24 }}
              >
                ค้นหาข้อมูล
              </Button>
            </Flex>
          </Form>
        </Card>

        {/* ส่วนที่ 4: ตารางแสดงเนื้อหาข้อมูล */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
          title={
            <Space align="center">
              <TableOutlined style={{ color: token.colorPrimary }} />
              <Text strong>ผลการพิจารณาเปรียบเทียบ (หน้า {dataset.page})</Text>
            </Space>
          }
          extra={
            <Space>
              <Button
                onClick={() => handleTablePageChange(dataset.page - 1)}
                disabled={dataset.page <= 1}
                style={{ borderRadius: 6 }}
              >
                หน้าก่อนหน้า
              </Button>
              <Button
                onClick={() => handleTablePageChange(dataset.page + 1)}
                style={{ borderRadius: 6 }}
                disabled={dataset.data.length < PAGE_SIZE}
              >
                หน้าถัดไป
              </Button>
            </Space>
          }
        >
          <Table
            dataSource={dataset.data}
            loading={dataset.loading}
            columns={leaveLetterTableColumns}
            rowKey={(record) => String(record.leaveLetterId)}
            pagination={false}
            locale={{
              emptyText: overallLoading
                ? "กำลังวิเคราะห์ข้อมูล..."
                : "ยังไม่มีข้อมูลการลาหยุดในขณะนี้",
            }}
            scroll={{ x: 1300 }}
            className="custom-ant-table"
          />
        </Card>
      </Space>

      {/* มอดัลแสดงสถานะผลการทำงาน */}
      <StatusModal
        open={statusModalConfig.open}
        onClose={() =>
          setStatusModalConfig({ ...statusModalConfig, open: false })
        }
        type={statusModalConfig.type}
        title={statusModalConfig.title}
        message={statusModalConfig.message}
      />
    </DashboardLayout>
  );
}
