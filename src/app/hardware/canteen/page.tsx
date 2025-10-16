"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState,} from "react";
import {useRouter} from "next/navigation";
import {useDispatch} from "react-redux";
import {AppDispatch, useAppSelector} from "@stores/store";
import DashboardLayout from "@components/layouts/backend-layout";
import type {InputRef} from "antd";
import {Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography, Upload,} from "antd";
import type {ColumnsType, ColumnType} from "antd/es/table";
import type {UploadChangeParam, UploadFile} from "antd/es/upload/interface";
import {
    CloudUploadOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    FileTextOutlined,
    PlusOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {toast} from "sonner";
import {CallAPI as GET_APPLICATION_LIST} from "@stores/actions/hardware/canteen/call-get-application";
import {
    CallAPI as GET_APPLICATION_VERSION_BY_APPID
} from "@stores/actions/hardware/canteen/call-get-application-by-appId";
import {
    CallAPI as POST_CREATE_APPLICATION_VERSION
} from "@stores/actions/hardware/canteen/call-post-create-application-version";
import {
    CallAPI as POST_UPDATE_APPLICATION_VERSION
} from "@stores/actions/hardware/canteen/call-post-update-application-version";
import {ResponseApplicationList, ResponseApplicationVersionList,} from "@stores/type";

const PASSWORD = "qa";
const PAGE_SIZE = 10;

type SearchableColumnKey = "app_name" | "app_type" | "version_name" | "env";

type TableColumn<T> = ColumnType<T> & { key: keyof T | string };

type VersionRecord = ResponseApplicationVersionList["data"]["data"][number];

type ApplicationRecord = ResponseApplicationList["data"]["data"][number];

interface VersionDataset {
    data: VersionRecord[];
    loading: boolean;
    curl: string;
}

type VersionFormValues = {
    schoolID?: string;
    appID: string;
    versionID?: string;
    versionName: string;
    env: string;
    note?: string;
    isLatestVersion: boolean;
    forceUpdate: boolean;
    file?: any; // Fix: Change from single file to array to match form configuration
};

const buildFormData = (values: VersionFormValues) => {
    const formData = new FormData();
    formData.append("school_id", values.schoolID ?? "");
    formData.append("app_id", values.appID);
    formData.append("version_name", values.versionName);
    formData.append("env", values.env);
    formData.append("note", values.note ?? "");
    formData.append("version_id", values.versionID ?? "");
    formData.append("is_lastest_version", values.isLatestVersion ? "1" : "0");
    formData.append("force_update", values.forceUpdate ? "1" : "0");

    // Fix: Handle fileList array properly
    if (values.file && Array.isArray(values.file) && values.file.length > 0) {
        const fileObj = values.file[0];
        if (fileObj?.originFileObj) {
            formData.append("file", fileObj.originFileObj);
        }
    }

    return formData;
};

const useColumnSearch = <T, >(
    searchInputRefs: React.MutableRefObject<
        Partial<Record<SearchableColumnKey, InputRef | null>>
    >
) =>
    useCallback(
        (dataIndex: SearchableColumnKey, title: string): TableColumn<T> => ({
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
                        style={{padding: 12}}
                        onKeyDown={(event) => event.stopPropagation()}
                    >
                        <Input
                            ref={(node) => {
                                searchInputRefs.current[dataIndex] = node as InputRef;
                            }}
                            placeholder={`ค้นหา ${title}`}
                            value={value}
                            onChange={(event) => {
                                const {value: inputValue} = event.target;
                                setSelectedKeys(inputValue ? [inputValue] : []);
                            }}
                            onPressEnter={() => confirm()}
                            style={{marginBottom: 8, display: "block"}}
                        />
                        <Space>
                            <Button
                                type="primary"
                                icon={<SearchOutlined/>}
                                size="small"
                                onClick={() => confirm()}
                            >
                                ค้นหา
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    clearFilters?.();
                                    confirm({closeDropdown: true});
                                }}
                            >
                                รีเซ็ต
                            </Button>
                        </Space>
                    </div>
                );
            },
            filterIcon: (filtered) => (
                <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>
            ),
            onFilter: (value, record) => {
                const raw = (record as any)[dataIndex];
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
        [searchInputRefs]
    );

export default function Page() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const [passwordVisible, setPasswordVisible] = useState(true);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string>("");

    const applicationState = useAppSelector(
        (state) => state.callGetHardwareApplication
    );
    const versionState = useAppSelector(
        (state) => state.callGetHardwareApplicationByAppId
    );
    const schoolState = useAppSelector((state) => state.callSchoolList);

    const [selectedApplication, setSelectedApplication] =
        useState<ApplicationRecord | null>(null);
    const [versionDataset, setVersionDataset] = useState<VersionDataset>({
        data: [],
        loading: false,
        curl: "",
    });
    const [versionModalVisible, setVersionModalVisible] = useState(false);
    const [versionFormVisible, setVersionFormVisible] = useState(false);
    const [versionFormMode, setVersionFormMode] = useState<"add" | "edit">("add");
    const [versionForm] = Form.useForm<VersionFormValues>();
    const [deleteTarget, setDeleteTarget] = useState<VersionRecord | null>(null);

    const searchInputRefs = useRef<
        Partial<Record<SearchableColumnKey, InputRef | null>>
    >({});
    const getColumnSearchProps =
        useColumnSearch<ApplicationRecord>(searchInputRefs);
    const getVersionColumnSearchProps =
        useColumnSearch<VersionRecord>(searchInputRefs);

    useEffect(() => {
        dispatch(GET_APPLICATION_LIST());
    }, [dispatch]);

    useEffect(() => {
        const responseData = applicationState?.response?.data?.data ?? [];
        if (!selectedApplication && responseData.length > 0) {
            setSelectedApplication(responseData[0]);
        }
    }, [applicationState?.response?.data?.data, selectedApplication]);

    useEffect(() => {
        if (!selectedApplication || !versionModalVisible) {
            return;
        }

        (async () => {
            setVersionDataset((prev) => ({...prev, loading: true}));
            const toastId = toast.loading("กำลังโหลดเวอร์ชันแอป...");
            try {
                const action = await dispatch(
                    GET_APPLICATION_VERSION_BY_APPID({
                        app_id: selectedApplication.app_id,
                    })
                );
                if (GET_APPLICATION_VERSION_BY_APPID.fulfilled.match(action)) {
                    const response = action.payload;
                    const versions = response?.data?.data ?? [];
                    setVersionDataset({
                        data: versions,
                        loading: false,
                        curl: response?.curl ?? "",
                    });
                    toast.success("โหลดเวอร์ชันสำเร็จ", {id: toastId});
                } else {
                    throw new Error(action.error?.message);
                }
            } catch (error: any) {
                setVersionDataset((prev) => ({...prev, loading: false}));
                toast.error(error?.message ?? "ไม่สามารถโหลดเวอร์ชันได้", {
                    id: toastId,
                });
            }
        })();
    }, [dispatch, selectedApplication, versionModalVisible]);

    const schoolOptions = useMemo(() => {
        const schools =
            schoolState?.response?.data?.map((item: any) => ({
                label: item.SchoolName,
                value: String(item.SchoolID),
            })) ?? [];

        return [{label: "ทุกโรงเรียน", value: ""}, ...schools];
    }, [schoolState]);

    const applicationColumns = useMemo<ColumnsType<ApplicationRecord>>(
        () => [
            {
                title: "ชื่อแอปพลิเคชัน",
                dataIndex: "app_name",
                sorter: (a, b) => String(a.app_name).localeCompare(String(b.app_name)),
                ...getColumnSearchProps("app_name", "ชื่อแอปพลิเคชัน"),
            },
            {
                title: "แพลตฟอร์ม",
                dataIndex: "app_type",
                sorter: (a, b) => String(a.app_type).localeCompare(String(b.app_type)),
                filters: Array.from(
                    new Set(
                        (applicationState?.response?.data?.data ?? []).map(
                            (item: ApplicationRecord) => item.app_type
                        )
                    )
                ).map((type) => ({text: type, value: type})),
                onFilter: (value, record) => record.app_type === value,
                render: (value: string) => <Tag color="blue">{value}</Tag>,
                ...getColumnSearchProps("app_type", "แพลตฟอร์ม"),
            },
            {
                title: "การจัดการ",
                key: "actions",
                render: (_, record) => (
                    <Button
                        icon={<EyeOutlined/>}
                        onClick={() => {
                            setSelectedApplication(record);
                            setVersionModalVisible(true);
                        }}
                    >
                        ดูเวอร์ชัน
                    </Button>
                ),
            },
        ],
        [applicationState?.response?.data?.data, getColumnSearchProps]
    );

    const handleUploadChange = (info: UploadChangeParam<UploadFile>) => {
        if (info.file.status === "removed") {
            versionForm.setFieldsValue({file: []});
        }
    };

    const openVersionForm = (mode: "add" | "edit", version?: VersionRecord) => {
        setVersionFormMode(mode);
        if (mode === "add") {
            versionForm.resetFields();
            versionForm.setFieldsValue({
                appID: String(selectedApplication?.app_id ?? ""),
                isLatestVersion: false,
                forceUpdate: false,
                file: null,
            });
        } else if (version) {
            versionForm.setFieldsValue({
                appID: String(selectedApplication?.app_id ?? ""),
                versionID: String(version.version_id ?? ""),
                versionName: version.version_name ?? "",
                env: version.env ?? "",
                note: version.note ?? "",
                schoolID: "",
                isLatestVersion: version.is_lastest_version === 1,
                forceUpdate: version.force_update === 1,
                file: null,
            });
        }
        setVersionFormVisible(true);
    };

    const handleVersionSubmit = async () => {
        try {
            const values = await versionForm.validateFields();
            const formData = buildFormData(values);
            const toastId = toast.loading(
                versionFormMode === "add"
                    ? "กำลังสร้างเวอร์ชัน..."
                    : "กำลังอัปเดตเวอร์ชัน..."
            );
            const action = await dispatch(
                versionFormMode === "add"
                    ? POST_CREATE_APPLICATION_VERSION(formData)
                    : POST_UPDATE_APPLICATION_VERSION(formData)
            );

            const success =
                (versionFormMode === "add" &&
                    POST_CREATE_APPLICATION_VERSION.fulfilled.match(action)) ||
                (versionFormMode === "edit" &&
                    POST_UPDATE_APPLICATION_VERSION.fulfilled.match(action));

            if (success) {
                toast.success("ดำเนินการสำเร็จ", {
                    id: toastId,
                    description: action.payload?.data?.message ?? "บันทึกข้อมูลสำเร็จ",
                });
                setVersionFormVisible(false);
                if (selectedApplication) {
                    setVersionDataset((prev) => ({...prev, loading: true}));
                    const refreshAction = await dispatch(
                        GET_APPLICATION_VERSION_BY_APPID({
                            app_id: selectedApplication.app_id,
                        })
                    );
                    if (GET_APPLICATION_VERSION_BY_APPID.fulfilled.match(refreshAction)) {
                        const refreshPayload = refreshAction.payload;
                        setVersionDataset({
                            data: refreshPayload?.data?.data ?? [],
                            loading: false,
                            curl: refreshPayload?.curl ?? "",
                        });
                    } else {
                        setVersionDataset((prev) => ({...prev, loading: false}));
                        toast.error(
                            refreshAction.error?.message ?? "ไม่สามารถโหลดเวอร์ชันล่าสุดได้"
                        );
                    }
                }
            } else {
                throw new Error();
            }
        } catch (error: any) {
            toast.error(error?.message ?? "ไม่สามารถบันทึกเวอร์ชันได้", {
                description: "กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
            });
        }
    };

    const handleDeleteVersion = async (version: VersionRecord) => {
        const toastId = toast.loading("กำลังลบเวอร์ชัน...");
        try {
            const response = await fetch(
                `/api/v1/hardware/canteen/delete/${version.version_id}`,
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                }
            );
            if (!response.ok) {
                throw new Error("ไม่สามารถลบเวอร์ชันได้");
            }
            const result = await response.json();
            toast.success(result?.data?.message ?? "ลบเวอร์ชันสำเร็จ", {
                id: toastId,
            });
            if (selectedApplication) {
                setVersionDataset((prev) => ({...prev, loading: true}));
                const refreshAction = await dispatch(
                    GET_APPLICATION_VERSION_BY_APPID({
                        app_id: selectedApplication.app_id,
                    })
                );
                if (GET_APPLICATION_VERSION_BY_APPID.fulfilled.match(refreshAction)) {
                    const refreshPayload = refreshAction.payload;
                    setVersionDataset({
                        data: refreshPayload?.data?.data ?? [],
                        loading: false,
                        curl: refreshPayload?.curl ?? "",
                    });
                } else {
                    setVersionDataset((prev) => ({...prev, loading: false}));
                    toast.error(
                        refreshAction.error?.message ?? "ไม่สามารถโหลดเวอร์ชันล่าสุดได้"
                    );
                }
            }
        } catch (error: any) {
            toast.error(error?.message ?? "เกิดข้อผิดพลาดระหว่างลบเวอร์ชัน", {
                id: toastId,
            });
        }
    };

    const versionColumns = useMemo<ColumnsType<VersionRecord>>(
        () => [
            {
                title: "เวอร์ชัน",
                dataIndex: "version_name",
                sorter: (a, b) =>
                    String(a.version_name).localeCompare(String(b.version_name)),
                ...getVersionColumnSearchProps("version_name", "เวอร์ชัน"),
            },
            {
                title: "สภาพแวดล้อม",
                dataIndex: "env",
                filters: Array.from(
                    new Set((versionDataset.data ?? []).map((item) => item.env))
                ).map((env) => ({text: env, value: env})),
                onFilter: (value, record) => record.env === value,
                sorter: (a, b) => String(a.env).localeCompare(String(b.env)),
                ...getVersionColumnSearchProps("env", "สภาพแวดล้อม"),
            },
            {
                title: "อัปเดตล่าสุด",
                dataIndex: "updated_at",
                sorter: (a, b) =>
                    dayjs(a.updated_at).valueOf() - dayjs(b.updated_at).valueOf(),
                render: (value: string) =>
                    value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
            },
            {
                title: "หมายเหตุ",
                dataIndex: "note",
                ellipsis: true,
            },
            {
                title: "สถานะ",
                dataIndex: "is_lastest_version",
                render: (_value, record) => (
                    <Space>
                        {record.is_lastest_version === 1 && <Tag color="green">ล่าสุด</Tag>}
                        {record.force_update === 1 && <Tag color="red">บังคับอัปเดต</Tag>}
                    </Space>
                ),
            },
            {
                title: "การจัดการ",
                key: "actions",
                render: (_, record) => (
                    <Space size="small" wrap>
                        <Button
                            icon={<DownloadOutlined/>}
                            onClick={() => toast.info("ฟีเจอร์ดาวน์โหลดอยู่ระหว่างพัฒนา")}
                        >
                            ดาวน์โหลด
                        </Button>
                        <Button
                            icon={<EditOutlined/>}
                            onClick={() => openVersionForm("edit", record)}
                        >
                            แก้ไข
                        </Button>
                        <Button
                            danger
                            icon={<DeleteOutlined/>}
                            onClick={() => setDeleteTarget(record)}
                        >
                            ลบ
                        </Button>
                    </Space>
                ),
            },
        ],
        [getVersionColumnSearchProps, openVersionForm, versionDataset.data]
    );

    return (
        <DashboardLayout>
            <Space direction="vertical" size="large" style={{width: "100%"}}>
                <Card
                    title="รายการแอปพลิเคชัน"
                    variant="borderless"
                    extra={
                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={() => {
                                if (!selectedApplication) {
                                    toast.info("กรุณาเลือกแอปพลิเคชันก่อน");
                                    return;
                                }
                                openVersionForm("add");
                            }}
                        >
                            เพิ่มเวอร์ชันใหม่
                        </Button>
                    }
                >
                    <Table<ApplicationRecord>
                        dataSource={applicationState?.response?.data?.data ?? []}
                        loading={applicationState.loading}
                        columns={applicationColumns}
                        rowKey={(record) => String(record.app_id)}
                        pagination={{pageSize: PAGE_SIZE}}
                        scroll={{x: 800}}
                    />
                </Card>
            </Space>

            <Modal
                title="กรุณาใส่รหัสผ่านก่อนเข้าใช้งาน"
                open={passwordVisible}
                closable={false}
                footer={null}
            >
                <Space direction="vertical" style={{width: "100%"}}>
                    <Input.Password
                        placeholder="กรอกรหัสผ่าน"
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            setPasswordError("");
                        }}
                    />
                    {passwordError && (
                        <Typography.Text type="danger">{passwordError}</Typography.Text>
                    )}
                    <Space style={{width: "100%", justifyContent: "flex-end"}}>
                        <Button onClick={() => router.push("/backend")}>ยกเลิก</Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                if (password === PASSWORD) {
                                    setPasswordVisible(false);
                                    toast.success("เข้าสู่ระบบสำเร็จ");
                                } else {
                                    setPasswordError("รหัสผ่านไม่ถูกต้อง");
                                }
                            }}
                            disabled={!password}
                        >
                            ตกลง
                        </Button>
                    </Space>
                </Space>
            </Modal>

            <Modal
                title={`เวอร์ชันของ ${selectedApplication?.app_name ?? "-"}`}
                open={versionModalVisible}
                onCancel={() => setVersionModalVisible(false)}
                width={1080}
                footer={
                    <Space>
                        <Button
                            onClick={() => {
                                if (!versionDataset.curl) {
                                    toast.info("ไม่พบคำสั่ง CURL");
                                    return;
                                }
                                navigator.clipboard.writeText(versionDataset.curl);
                                toast.success("คัดลอก CURL แล้ว");
                            }}
                        >
                            คัดลอก CURL
                        </Button>
                        <Button type="primary" onClick={() => openVersionForm("add")}>
                            เพิ่มเวอร์ชัน
                        </Button>
                    </Space>
                }
            >
                <Table<VersionRecord>
                    dataSource={versionDataset.data}
                    loading={versionDataset.loading}
                    columns={versionColumns}
                    rowKey={(record) => String(record.version_id)}
                    pagination={false}
                    locale={{
                        emptyText: versionDataset.loading
                            ? "กำลังโหลด..."
                            : "ไม่พบเวอร์ชัน",
                    }}
                />
            </Modal>

            <Modal
                title={
                    versionFormMode === "add" ? "เพิ่มเวอร์ชันแอป" : "แก้ไขเวอร์ชันแอป"
                }
                open={versionFormVisible}
                onCancel={() => {
                    setVersionFormVisible(false);
                }}
                width={760}
                footer={
                    <Space style={{width: "100%", justifyContent: "flex-end"}}>
                        <Button
                            onClick={() => {
                                setVersionFormVisible(false);
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleVersionSubmit}
                        >
                            บันทึกเวอร์ชัน
                        </Button>
                    </Space>
                }
            >
                <Form<VersionFormValues>
                    layout="vertical"
                    form={versionForm}
                    initialValues={{
                        appID: selectedApplication
                            ? String(selectedApplication.app_id)
                            : "",
                        env: "",
                        isLatestVersion: false,
                        forceUpdate: false,
                        file: null,
                    }}
                >
                    <Space direction="vertical" size="large" style={{width: "100%"}}>
                        <Form.Item label="เลือกโรงเรียน" name="schoolID">
                            <Select
                                allowClear
                                placeholder="เลือกโรงเรียน"
                                options={schoolOptions}
                                showSearch
                                filterOption={(input, option) =>
                                    String(option?.label ?? "")
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            label="เลือกแอปพลิเคชัน"
                            name="appID"
                            rules={[{required: true, message: "กรุณาเลือกแอปพลิเคชัน"}]}
                        >
                            <Select
                                placeholder="เลือกแอปพลิเคชัน"
                                disabled={versionFormMode === "edit"}
                                options={
                                    applicationState?.response?.data?.data?.map(
                                        (item: ApplicationRecord) => ({
                                            label: item.app_name,
                                            value: String(item.app_id),
                                        })
                                    ) ?? []
                                }
                            />
                        </Form.Item>

                        {versionFormMode === "edit" && (
                            <Form.Item label="Version ID" name="versionID">
                                <Input disabled/>
                            </Form.Item>
                        )}

                        <Card
                            size="small"
                            title={
                                <Space>
                                    <FileTextOutlined/>
                                    <span>รายละเอียดเวอร์ชัน</span>
                                </Space>
                            }
                        >
                            <Form.Item
                                label="ชื่อเวอร์ชัน"
                                name="versionName"
                                rules={[{required: true, message: "กรุณาระบุชื่อเวอร์ชัน"}]}
                            >
                                <Input placeholder="เช่น 1.0.0"/>
                            </Form.Item>

                            <Form.Item
                                label="สภาพแวดล้อม"
                                name="env"
                                rules={[{required: true, message: "กรุณาเลือกสภาพแวดล้อม"}]}
                            >
                                <Select
                                    placeholder="เลือกสภาพแวดล้อม"
                                    options={[
                                        {label: "Production", value: "Production"},
                                        {label: "Beta", value: "Beta"},
                                        {label: "Development", value: "Development"},
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item label="หมายเหตุ" name="note">
                                <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติม"/>
                            </Form.Item>

                            <Form.Item
                                label="อัปโหลดไฟล์"
                                name="file"
                                valuePropName="fileList"
                                getValueFromEvent={(info: UploadChangeParam<UploadFile>) =>
                                    info.fileList
                                }
                                rules={[
                                    {
                                        required: versionFormMode === "add",
                                        validator: (_, fileList) => {
                                            if (!fileList || fileList.length === 0) {
                                                return Promise.reject(
                                                    "กรุณาอัปโหลดไฟล์เวอร์ชัน (.apk หรือ .zip)"
                                                );
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <Upload
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    onChange={handleUploadChange}
                                    accept=".apk,.zip"
                                >
                                    <Button icon={<CloudUploadOutlined/>}>
                                        เลือกไฟล์เวอร์ชัน
                                    </Button>
                                </Upload>
                            </Form.Item>

                            <Space size="large">
                                <Space>
                                    <Form.Item name="isLatestVersion" valuePropName="checked">
                                        <Switch/>
                                    </Form.Item>
                                    <Typography.Text>เวอร์ชันล่าสุด</Typography.Text>
                                </Space>
                                <Space>
                                    <Form.Item name="forceUpdate" valuePropName="checked">
                                        <Switch/>
                                    </Form.Item>
                                    <Typography.Text>บังคับอัปเดต</Typography.Text>
                                </Space>
                            </Space>
                        </Card>
                    </Space>
                </Form>
            </Modal>

            <Modal
                title="ยืนยันการลบเวอร์ชัน"
                open={Boolean(deleteTarget)}
                onCancel={() => setDeleteTarget(null)}
                onOk={async () => {
                    if (deleteTarget) {
                        await handleDeleteVersion(deleteTarget);
                        setDeleteTarget(null);
                    }
                }}
                okButtonProps={{danger: true}}
                okText="ลบ"
            >
                <Typography.Paragraph>
                    ต้องการลบเวอร์ชัน {deleteTarget?.version_name ?? "-"} หรือไม่?
                </Typography.Paragraph>
            </Modal>
        </DashboardLayout>
    );
}
