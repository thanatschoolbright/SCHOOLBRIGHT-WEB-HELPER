  "use client";

  import { useState } from "react";
  import { HeaderBar } from "@components/typhography/header-bar-component";
  import DashboardLayout from "@components/layouts/backend-layout";
  import { TeamOutlined } from "@ant-design/icons";
  import {
    Button,
    Card,
    Form,
    Input,
    type InputRef,
    DatePicker,
    TimePicker,
    Select,
    Row,
    Col,
    Modal,
    Table,
    Space,
    Descriptions,
    Divider,
    List,
    Typography,
    Tag,
    Popconfirm,
  } from "antd";
  import {
    PlusOutlined,
    MinusCircleOutlined,
    ExclamationCircleOutlined,
  } from "@ant-design/icons";
  import dayjs from "dayjs";
  import React, { useEffect } from "react";
  import { useRouter } from "next/navigation";
  import { getUserData } from "@helpers/local_storage/user.storage";
  import { SelectOption, UserProfile } from "@stores/type";
  import { callApiService } from "@/services/axios-instance/sb-helper.axios";
  import { toast } from "sonner";
  import ConfirmDelete from "@/components/popup/confirm-delete-component";
  import { useAppSelector } from "@/stores/store";
import { TimesheetEntry } from "@/types/timesheet-table.types";
  const { TextArea } = Input;

  export type OvertimeFormValues = {
    firstname: string;
    lastname: string;
    employee_code: string;
    role: string;
    department: string;
    descriptions: OvertimeDescription[];
    type: string;
  };

  export type OvertimeDescription = {
    duration: number;
    description: string;
    assignee: string | number;
  };

  export default function Page() {
    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false);
    const [formValues, setFormValues] = useState({});
    const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
    const [descriptionOptions, setDescriptionOptions] = useState<SelectOption[]>([]);
    const router = useRouter();
    const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

    // Helper to resolve current admin id for API payloads.
    // Prefer the app auth state, otherwise fall back to local storage user data, then 'system'.
    const GET_CURRENT_USER_ID = async () => {
      try {
        const idFromAuth = AUTHENTICATION?.response?.data?.user_data?.admin_id;
        console.info("Current admin ID from auth:", idFromAuth);
        if (idFromAuth) return String(idFromAuth);

        const users = await getUserData();
        if (Array.isArray(users) && users.length > 0) {
          return String((users[0] as any).admin_id ?? users[0].id ?? "system");
        }
      } catch (e) {
        // ignore and fallback to system
      }
      return "system";
    };

    const handleFormSubmit = async (values: any) => {
      console.log("Form submitted with values:", values);
      const formValues = {
        ...values,
        submittedAt: new Date().toISOString(),
      };

      try {
        // create overtime via API
        const created = await CREATE_OVERTIME(formValues);
        if (created) {
          // close modal and refresh list
          setVisible(false);
          await GET_OVERTIME_LIST({
            page: paginationState.current,
            pageSize: paginationState.pageSize,
          });
        }
      } catch (e) {
        console.error("Failed to store preview data", e);
      }
    };

    // Create overtime
    const CREATE_OVERTIME = async (payload: any) => {
      try {
        setLoading(true);
        const adminId = await GET_CURRENT_USER_ID();
        const bodyPayload = {
          ...payload,
          created_by: String(adminId),
          performed_by: String(adminId),
        };
        const resp = await callApiService.post(
          "/api/v1/timesheet/overtime/create",
          bodyPayload
        );
        const body = resp?.data;
        if (body && (body.status === 200 || body.status === 201)) {
          toast.success(body.message_th ?? "สร้างรายการสำเร็จ");
          return body.data;
        }
        toast.error(body?.message_th ?? "ไม่สามารถสร้างรายการได้");
        return null;
      } catch (error) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาดในการสร้างรายการ");
        return null;
      } finally {
        setLoading(false);
      }
    };

    const GET_DESCRIPTION_LIST = async () => {
      try {
        const payload = {
          limit: 30,
          page: 1,
          user_id:
            AUTHENTICATION?.response?.data?.user_data?.admin_id || "0",
        };
        const descriptions = await callApiService.post(
          "/api/v1/timesheet/entry/read/", payload
        );
        
        const result = descriptions?.data
        setDescriptionOptions((result?.data?.map((item:TimesheetEntry) => ({
          label : item.description,
          value : item.description
        }))))
        
      } catch (error) {
        console.error("Error fetching description list:", error);
        return [];
      } finally {
        setLoading(false);
      }
    };

    //** ดึงข้อมูลผู้มอบหมายงานจาก API มาแสดงใน Select **
    const GET_USER_LIST = async () => {
      try {
        const users = await getUserData();
        console.log("Fetched user list:", users);
        const formattedOption = users.map((user: UserProfile) => ({
          label: `${user.firstname} ${user.lastname}`,
          value: user.admin_id,
        }));
        setUserOptions(formattedOption);
      } catch (error) {
        console.error("Error fetching user list:", error);
      }
    };

    // ** ดึงข้อมูรายการ โอที **
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

    // Unified fetch function for list or single record.
    // options: { page, pageSize, filters, id }
    const GET_OVERTIME_LIST = async (options?: any) => {
      const page = options?.page ?? 1;
      const pageSize = options?.pageSize ?? paginationState.pageSize ?? 20;
      const filters = options?.filters ?? {};
      const id = options?.id;

      try {
        setLoading(true);

        const adminId = await GET_CURRENT_USER_ID();
        const payload: any = id
          ? { id: String(id), request_id: adminId }
          : {
              limit: pageSize,
              offset: (page - 1) * pageSize,
              request_id: adminId,
              ...filters,
            };

        const resp = await callApiService.post(
          "/api/v1/timesheet/overtime/read",
          payload
        );
        const body = resp?.data;

        if (!body || body.status !== 200) {
          toast.error("ไม่สามารถดึงข้อมูลโอทีได้");
          return null;
        }

        const items = Array.isArray(body.data) ? body.data : [];

        // If fetched by id, return the single item(s) without altering pagination
        if (id) {
          return items;
        }

        setDataSource(
          items.map((it: any) => ({
            key: it.id,
            ...it,
          }))
        );

        setPaginationState({
          current: body.pagination?.page ?? page,
          pageSize: body.pagination?.page_size ?? pageSize,
          total: body.pagination?.total ?? items.length,
        });

        return items;
      } catch (error) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        return null;
      } finally {
        setLoading(false);
      }
    };

    // Delete overtime by id
    const DELETE_OVERTIME_BY_ID = async (
      id?: string | number,
      deletedBy?: string
    ) => {
      if (typeof id === "undefined" || id === null) {
        toast.error("ไม่พบ id สำหรับลบรายการ");
        return null;
      }
      try {
        setLoading(true);

        // Prefer explicit deletedBy, otherwise use current admin id (auth or local) then fallback
        let deleter = deletedBy ?? (await GET_CURRENT_USER_ID());

        const resp = await callApiService.post(
          `/api/v1/timesheet/overtime/delete?id=${id}`,
          { deleted_by: String(deleter) }
        );

        const body = resp?.data;
        if (body && body.status === 200) {
          toast.success(body.message_th ?? "ลบรายการสำเร็จ");
          // refresh the list
          await GET_OVERTIME_LIST({
            page: paginationState.current,
            pageSize: paginationState.pageSize,
          });
          return body.data;
        }

        toast.error(body?.message_th ?? "ไม่สามารถลบรายการได้");
        return null;
      } catch (error) {
        console.error(error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        return null;
      } finally {
        setLoading(false);
      }
    };

    // Live-calculate duration when start/end change

    useEffect(() => {
      GET_CURRENT_USER_ID();
      GET_USER_LIST();
      GET_DESCRIPTION_LIST();
      GET_OVERTIME_LIST();
    }, []);
    // Table state
    const [dataSource, setDataSource] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [paginationState, setPaginationState] = useState({
      current: 1,
      pageSize: 20,
      total: 0,
    });

    const searchInput = React.useRef<InputRef | null>(null);

    // (fetchOvertimeList removed; use GET_OVERTIME_LIST)

    useEffect(() => {
      GET_USER_LIST();
      GET_OVERTIME_LIST({
        page: paginationState.current,
        pageSize: paginationState.pageSize,
      });
    }, []);

    const getColumnSearchProps = (dataIndex: string) => ({
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
        close,
      }: any) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            ref={(node) => {
              searchInput.current = node;
            }}
            placeholder={`ค้นหา ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => {
              confirm();
              GET_OVERTIME_LIST({
                page: 1,
                pageSize: paginationState.pageSize,
                filters: { [dataIndex]: selectedKeys[0] },
              });
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                GET_OVERTIME_LIST({
                  page: 1,
                  pageSize: paginationState.pageSize,
                  filters: { [dataIndex]: selectedKeys[0] },
                });
              }}
              size="small"
              style={{ width: 90 }}
            >
              ค้นหา
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                GET_OVERTIME_LIST({
                  page: 1,
                  pageSize: paginationState.pageSize,
                });
              }}
              size="small"
              style={{ width: 90 }}
            >
              ล้าง
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={filtered ? "#1890ff" : "currentColor"}
        >
          <path d="M3 5h18v2L13 13v6l-2 1v-7L3 7V5z" />
        </svg>
      ),
    });

    const handleTableChange = (pag: any, filters: any, sorter: any) => {
      const page = pag.current;
      const pageSize = pag.pageSize;
      // Map simple filters (status) into API payload
      const payloadFilters: any = {};
      if (filters.status && filters.status.length > 0) {
        payloadFilters.status = filters.status[0];
      }
      GET_OVERTIME_LIST({ page, pageSize, filters: payloadFilters });
    };

    const descriptionColumns = [
      { title: "รหัส", dataIndex: "id", key: "id", width: 80 },
      {
        title: "วันที่",
        dataIndex: "date",
        key: "date",
        render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
      },
      {
        title: "จำนวน (ชั่วโมง)",
        dataIndex: "duration",
        key: "duration",
      },
      {
        title: "รายละเอียด",
        dataIndex: "description",
        key: "description",
      },
      {
        title: "ผู้มอบหมาย",
        dataIndex: "assignee",
        key: "assignee",
      },
    ];

    const mainColumns = [
      {
        title: "รหัส",
        dataIndex: "id",
        key: "id",
        width: 80,
      },
      {
        title: "ผู้ร้องขอ",
        dataIndex: "requester_id",
        key: "requester_id",
        ...getColumnSearchProps("requester_id"),
      },
      {
        title: "วันที่ขอ",
        dataIndex: "request_date",
        key: "request_date",
        render: (val: string) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        filters: [
          { text: "pending", value: "pending" },
          { text: "approved", value: "approved" },
          { text: "rejected", value: "rejected" },
        ],
        render: (status: string) => {
          const color =
            status === "approved"
              ? "green"
              : status === "rejected"
              ? "red"
              : "gold";
          const label =
            status === "approved"
              ? "อนุมัติ"
              : status === "rejected"
              ? "ปฏิเสธ"
              : "รออนุมัติ";
          return <Tag color={color}>{label}</Tag>;
        },
      },
      {
        title: "สร้างโดย",
        dataIndex: "created_by",
        key: "created_by",
      },
      {
        title: "วันที่สร้าง",
        dataIndex: "created_at",
        key: "created_at",
        render: (val: string) =>
          val ? dayjs(val).format("DD/MM/YYYY HH:mm") : "-",
      },
      {
        title: "",
        key: "actions",
        width: 200,
        align: "right" as const,
        render: (_: any, record: any) => (
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Button
              type="link"
              size="small"
              onClick={async () => {
                // fetch the full record by id and show in the modal
                try {
                  const items = await GET_OVERTIME_LIST({ id: record.id });
                  if (Array.isArray(items) && items.length > 0) {
                    setSelectedDetail(items[0]);
                    setDetailVisible(true);
                  } else {
                    toast.error("ไม่พบข้อมูลรายละเอียด");
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("เกิดข้อผิดพลาดขณะโหลดรายละเอียด");
                }
              }}
            >
              ดูรายละเอียด
            </Button>

            <Button
              type="link"
              size="small"
              onClick={() => {
                // open preview route (PDF-style)
                router.push(`/timesheet/overtime/preview/${record.id}`);
              }}
            >
              ดูในรูปแบบ PDF
            </Button>

            <ConfirmDelete id={record.id} onConfirm={DELETE_OVERTIME_BY_ID}>
              <Button type="primary" danger size="small">
                ลบ
              </Button>
            </ConfirmDelete>
          </div>
        ),
      },
    ];

    return (
      <DashboardLayout>
        {/* หัวข้อ */}
        <HeaderBar
          icon={<TeamOutlined />}
          title="ระบบโอที"
          subTitle="จัดการบันทึกเวลาทำงานล่วงเวลา"
          color="none"
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 16,
          }}
        >
          <Button type="primary" onClick={() => setVisible(true)}>
            เพิ่มบันทึกโอที
          </Button>
        </div>

        {/* Form : ขอโอที */}
        <Modal
          title="ฟอร์มขออนุมัติโอที"
          open={visible}
          onCancel={() => setVisible(false)}
          footer={null}
          destroyOnHidden
          width={880}
          centered
          maskClosable={false}
          styles={{
            body: {
              maxHeight: "70vh",
              overflowY: "auto",
            },
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            initialValues={{}}
            onValuesChange={(_, all) => setFormValues(all)}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="วันที่"
                  name="date"
                  rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
                >
                  <DatePicker style={{ width: "100%" }} format={"DD/MM/YYYY"} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label="ผู้มอบหมายงาน"
                  name="assignee"
                  rules={[{ required: true, message: "กรุณาเลือกผู้มอบหมายงาน" }]}
                >
                  <Select
                    placeholder="เลือกผู้มอบหมายงาน"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={userOptions}
                  />
                </Form.Item>
              </Col>

              {/* ประเภทกขอโอที */}
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label="ประเภททำงานล่วงเวลา (โอที)"
                  name="overtimeType"
                  rules={[
                    { required: true, message: "กรุณาเลือกประเภททำงานล่วงเวลา" },
                  ]}
                >
                  <Select placeholder="เลือกประเภททำงานล่วงเวลา">
                    <Select.Option value="normal">วันทำงานปกติ </Select.Option>
                    <Select.Option value="holiday">วันหยุด</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              {/* รายการรายละเอียดเพิ่มเติม (สามารถเพิ่มได้สูงสุด 10 รายการ) */}
              <Col xs={24}>
                <Form.List name="descriptions">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, idx) => {
                        // destructure to avoid spreading `key` into JSX (React warns)
                        const { key, ...restField } = field as any;
                        return (
                          <Row
                            gutter={16}
                            key={field.key}
                            style={{ marginBottom: 8 }}
                          >
                            <Col xs={24} sm={8} md={6}>
                              <Form.Item
                                {...restField}
                                label={`จำนวน (ชั่วโมง) #${idx + 1}`}
                                name={[field.name, "duration"]}
                                fieldKey={[
                                  field.fieldKey ?? field.key,
                                  "duration",
                                ]}
                                rules={[
                                  {
                                    required: true,
                                    message: "กรุณากรอกจำนวนชั่วโมง",
                                  },
                                ]}
                              >
                                <Input placeholder="เช่น 2.5" />
                              </Form.Item>
                            </Col>

                            <Col xs={24} sm={14} md={16}>
                              <Form.Item
                                {...restField}
                                label={`รายละเอียด #${idx + 1}`}
                                name={[field.name, "description"]}
                                fieldKey={[
                                  field.fieldKey ?? field.key,
                                  "description",
                                ]}
                                rules={[
                                  {
                                    required: true,
                                    message: "กรุณากรอกรายละเอียด",
                                  },
                                ]}
                              >
                                <TextArea
                                  placeholder="ระบุรายละเอียดการทำงาน"
                                  rows={1}
                                />
                              </Form.Item>
                            </Col>

                            <Col
                              xs={24}
                              sm={2}
                              md={2}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Button
                                type="text"
                                danger
                                onClick={() => remove(field.name)}
                                icon={
                                  <MinusCircleOutlined style={{ fontSize: 20 }} />
                                }
                                aria-label={`remove-description-${idx}`}
                              />
                            </Col>
                          </Row>
                        );
                      })}

                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          icon={<PlusOutlined />}
                          disabled={fields.length >= 10}
                          style={{ width: "100%" }}
                        >
                          เพิ่มรายละเอียดเพิ่มเติม
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Col>
            </Row>

            <Form.Item>
              <Row justify="end">
                <Col>
                  <Button
                    style={{ marginRight: 8 }}
                    onClick={() => {
                      form.resetFields();
                      setVisible(false);
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={loading}
                  >
                    ส่งคำขอ
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Modal>

        {/* ตารางข้อมูล */}
        <Card title="ตารางแสดงข้อมูลโอที">
          <Table
            key={"test"}
            columns={mainColumns}
            dataSource={dataSource}
            rowKey="id"
            pagination={{
              current: paginationState.current,
              pageSize: paginationState.pageSize,
              total: paginationState.total,
              showSizeChanger: true,
            }}
            loading={loading}
            onChange={handleTableChange}
            bordered
            expandable={{
              expandedRowRender: (record: any) => (
                <div>
                  {Array.isArray(record.descriptions) &&
                  record.descriptions.length > 0 ? (
                    <Table
                      columns={descriptionColumns}
                      dataSource={record.descriptions}
                      pagination={false}
                      rowKey="id"
                      size="small"
                    />
                  ) : (
                    <span>-</span>
                  )}
                </div>
              ),
            }}
          />
        </Card>

        <Modal
          title="รายละเอียดคำขอโอที"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={800}
        >
          {selectedDetail ? (
            <>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="รหัส">
                  {selectedDetail.id}
                </Descriptions.Item>
                <Descriptions.Item label="ผู้ร้องขอ">
                  {selectedDetail.requester_id}
                </Descriptions.Item>
                <Descriptions.Item label="วันที่ขอ">
                  {dayjs(selectedDetail.request_date).format("DD/MM/YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="สถานะ">
                  {selectedDetail.status}
                </Descriptions.Item>
                <Descriptions.Item label="สร้างโดย">
                  {selectedDetail.created_by}
                </Descriptions.Item>
                <Descriptions.Item label="วันที่สร้าง">
                  {dayjs(selectedDetail.created_at).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Typography.Title level={4}>รายการโอที</Typography.Title>
              {Array.isArray(selectedDetail.descriptions) &&
              selectedDetail.descriptions.length > 0 ? (
                <List
                  itemLayout="vertical"
                  grid={{ gutter: 16, column: 1 }}
                  split={false}
                  dataSource={selectedDetail.descriptions}
                  renderItem={(item: any) => (
                    <List.Item key={item.id}>
                      <Card hoverable variant="outlined">
                        <Card.Meta
                          title={
                            <Typography.Text strong>
                              {dayjs(item.date).format("DD/MM/YYYY")}
                            </Typography.Text>
                          }
                          description={
                            <Typography.Paragraph ellipsis={{ rows: 2 }}>
                              {item.description}
                            </Typography.Paragraph>
                          }
                        />
                        <Space size={16}>
                          <Tag color="blue">{item.duration} ชม.</Tag>
                          <Typography.Text>
                            ผู้มอบหมาย: {item.assignee}
                          </Typography.Text>
                        </Space>
                      </Card>
                    </List.Item>
                  )}
                />
              ) : (
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="ไม่มีรายการ">-</Descriptions.Item>
                </Descriptions>
              )}
            </>
          ) : (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="สถานะ">Loading...</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </DashboardLayout>
    );
  }
