"use client";
import React, {useEffect, useState} from "react";
import Image from "next/image";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import {useTranslation} from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import {useDispatch} from "react-redux";
import {AppDispatch, useAppSelector} from "@stores/store";
import MinimalButton from "@/components/button/minimal-button-component";
import Swal from "sweetalert2";
import {SearchableSelectComponent} from "@/components/input-field/searchable-select-component";
import {MinimalRow} from "@components/table/minimal-row-component";
import MinimalTable from "@components/table/minimal-table-component";
import {convertTimeZoneToThai} from "@helpers/convert-time-zone-to-thai";
import {InputFieldComponent} from "@components/input-field/input-field-component";
import {FiArrowLeft, FiArrowRight, FiSearch} from "react-icons/fi";
import {ResponseUserList, ResponseNotification} from "@/stores/type";
import MinimalModal from "@components/modal/minimal-modal-component";
import {
    getNotificationRead,
    getNotificationType,
} from "@helpers/get-notification-type";
import {CallAPI as GET_USER_BY_SCHOOLID} from "@stores/actions/school/call-get-user";
import {CallAPI as GET_NOTIFICATION_TODAY_LIST} from "@stores/actions/mobile/call-get-notification-today-list";
import {CallAPI as GET_NOTIFICATION_WEEK_LIST} from "@stores/actions/mobile/call-get-notification-week-list";
import {CallAPI as GET_NOTIFICATION_MESSAGE} from "@stores/actions/mobile/call-get-read-notification";

const columns: { key: string; label: string }[] = [
    {key: "nMessageID", label: "รหัสข้อความ (ID)"},
    {key: "dSend", label: "วันที่ส่งข้อความ"},
    {key: "nType", label: "ประเภทข้อความ"},
    {key: "nStatus", label: "สถานะการอ่าน"},
    {key: "sTitle", label: "หัวข้อ"},
    {key: "sMessage", label: "ข้อความ"},
    {key: "logo", label: "โลโก้"},
    {key: "action", label: "การกระทำ"},
];

export default function Page() {
    const {t} = useTranslation("mock");
    const dispatch = useDispatch<AppDispatch>();
    const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);

    const USER_LIST_STATE = useAppSelector(
        (state) => state.callGetuserBySchoolId
    );

    const NOTIFICATION_TODAY_LIST = useAppSelector(
        (state) => state.callGetNotificationTodayList
    );

    const NOTIFICATION_WEEK_LIST = useAppSelector(
        (state) => state.callGetNotificationWeekList
    );

    const NOTIFICATION_READ_MESSAGE_STATE = useAppSelector(
        (state) => state.callGetNotificationMessage
    );

    const [selectedSchool, setSelectedSchool] = useState<string | string[]>("");
    // filter by selected school
    const isLoading = [SCHOOL_LIST_STATE.loading, USER_LIST_STATE.loading].some(
        Boolean
    );
    const [table, setTable] = useState<ResponseNotification[]>([]);
    const [todayTable, setTodayTable] = useState<ResponseNotification[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [schoolList, setSchoolList] = useState<any[]>([]);
    const [userList, setUserList] = useState<any[]>([]);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [deviceIdSearch, setDeviceIdSearch] = useState<string>("");
    const [modal, setModal] = useState<string>("");
    const [selectedRow, setSelectedRow] = useState<ResponseNotification>();
    const [form, setForm] = useState<{
        schoolID: string;
        userID: string;
    }>({schoolID: "", userID: ""});
    const [page, setPage] = useState<number>(1);

    const filteredTable = (table ?? []).filter((row) => {
        if (!fromDate && !toDate) return true;
        const ts = new Date(row.dSend).getTime();
        const fromTs = fromDate ? new Date(fromDate).getTime() : -Infinity;
        // วันสุดท้าย ให้ตีเป็นเที่ยงคืนถัดไป เพื่อรวมทั้งวัน
        const toTs = toDate
            ? new Date(
                new Date(toDate).setDate(new Date(toDate).getDate() + 1)
            ).getTime()
            : Infinity;
        return ts >= fromTs && ts < toTs;
    });

    useEffect(() => {
        setSchoolList(
            SCHOOL_LIST_STATE?.response?.data?.data?.map((item: any) => ({
                label: item.SchoolName,
                value: item.SchoolID,
            })) || []
        );
    }, [SCHOOL_LIST_STATE?.response]);

    useEffect(() => {
        getUserBySchoolId(form.schoolID);
    }, [form.schoolID]);

    useEffect(() => {
        if (page != 1) {
            handleSubmitForm(page);
        }
    }, [page]);

    useEffect(() => {
        if (page != 1 && table.length < 1) {
            Swal.fire({
                title: "ไม่พบข้อมูล",
            });
        }
    }, [table]);

    const getUserBySchoolId = async (schoolId: string) => {
        try {
            const response = await dispatch(GET_USER_BY_SCHOOLID({schoolId}));
            setUserList(
                response?.payload?.data?.map(
                    (item: ResponseUserList["draftValues"]) => ({
                        label: `${item?.Name} \t ${item?.LastName}\t(ID : ${item?.UserID} Username : ${item?.username})`,
                        value: item?.UserID,
                    })
                )
            );
            console.log(response);
        } catch (error) {
            throw new Error((error as Error).message);
        }
    };

    const getMessageByUserAndMessageId = async (
        userId: string,
        messageId: string
    ) => {
        try {
            await dispatch(
                GET_NOTIFICATION_MESSAGE({
                    user_id: userId,
                    message_id: messageId,
                })
            )?.unwrap();
            setModal("response_open");
        } catch (error: any) {
            throw new Error(
                "Function [getMessageByUserAndMessageId] :",
                error.message
            );
        }
    };

    const handleSubmitForm = async (page?: number) => {
        const response = await dispatch(
            GET_NOTIFICATION_WEEK_LIST({
                user_id: form?.userID,
                page: page?.toString() ?? "1",
            })
        )?.unwrap();

        const response2 = await dispatch(
            GET_NOTIFICATION_TODAY_LIST({
                user_id: form.userID,
                page: page?.toString() ?? "1",
            })
        )?.unwrap();
        try {
            if (response?.raw?.Status === "Error" || response2?.raw?.Status === "Error") {
                Swal.fire({
                    icon: "error",
                    title: "เกิดข้อผิดพลาด แจ้งเตือน 7 วันล่าสุด Error!",
                    html: `
            <div class="text-left text-sm">
              <p class="mb-2 font-semibold text-red-600">Copy อันนี้แจ้งพี่โจ้เร็วเข้า!!</p>
              <pre class="bg-gray-100 text-gray-800 p-4 rounded-md overflow-x-auto text-xs border border-gray-300">
<code>${response.curl}</code>
              </pre>
            </div>
          `,
                    customClass: {
                        popup: "w-[90vw] max-w-4xl", // makes modal wider
                    },
                });
            }

            setTable(response?.data);
            setTodayTable(response2?.data);
        } catch (error: any) {
            throw new Error(
                `Error in function [handleSubmitForm] ${JSON.stringify(error.message)}`
            );
        }
    };

    const renderTableData = (data: ResponseNotification[]) =>
        data.map((row, idx) => (
            <MinimalRow key={idx}>
                {({index, row}: { index: number; row: ResponseNotification }) => (
                    <>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {index}
                        </td>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {row.nMessageID}
                        </td>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {convertTimeZoneToThai(new Date(row.dSend))}
                        </td>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {getNotificationType(row.nType)}
                        </td>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {getNotificationRead(row.nStatus)}
                        </td>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {row.sTitle}
                        </td>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {row.sMessage}
                        </td>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {row.logo ? (
                                <Image
                                    src={row.logo}
                                    alt="Notification Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain rounded"
                                />
                            ) : (
                                <span className="text-gray-400">No Image</span>
                            )}
                        </td>
                        <td className="p-4 font-medium text-sm text-gray-900 dark:text-gray-200">
                            {/* CURL */}
                            <div className="grid grid-cols-1 justify-between">
                                <MinimalButton
                                    className=" bg-green-500 text-white rounded hover:bg-green-600 w-24 h-10 text-sm"
                                    onClick={() => {
                                        console.log(
                                            "NOTIFICATION STATE",
                                            NOTIFICATION_WEEK_LIST?.response?.data?.curl
                                        );
                                        const curlCommand =
                                            NOTIFICATION_WEEK_LIST?.response?.data?.curl;
                                        navigator.clipboard.writeText(curlCommand.toString());
                                        Swal.fire({
                                            icon: "success",
                                            title: "Copied!",
                                            text: "Copy CURL to clipboard.",
                                            confirmButtonText: "OK",
                                        });
                                    }}
                                >
                                    CURL
                                </MinimalButton>
                                <MinimalButton
                                    className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 w-24 h-10 text-sm"
                                    onClick={() => {
                                        getMessageByUserAndMessageId(
                                            form.userID,
                                            row.nMessageID.toString()
                                        );
                                    }}
                                >
                                    ดูข้อความ
                                </MinimalButton>
                            </div>
                        </td>
                    </>
                )}
            </MinimalRow>
        ));

    const renderModal = () => (
        <MinimalModal
            title="รายละเอียดข้อความแจ้งเตือน"
            onClose={() => setModal("")}
        >
            <div className="p-4 space-y-4">
                {/* ข้อความหลัก */}
                <p className="text-base text-gray-800 dark:text-gray-200">
                    {NOTIFICATION_READ_MESSAGE_STATE.response.data.sMessage || "-"}
                </p>

                {/* รายละเอียดแบบ key / value */}
                <dl className="grid grid-cols-1 gap-y-3">
                    {/* รหัสข้อความ */}
                    <div className="flex">
                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                            Message ID:
                        </dt>
                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.nMessageID}
                        </dd>
                    </div>

                    {/* วันที่ส่ง */}
                    <div className="flex">
                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                            วันที่ส่ง:
                        </dt>
                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.dSend
                                ? convertTimeZoneToThai(
                                    new Date(
                                        NOTIFICATION_READ_MESSAGE_STATE.response.data.dSend
                                    )
                                )
                                : "-"}
                        </dd>
                    </div>

                    {/* สถานะ */}
                    <div className="flex">
                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                            สถานะ:
                        </dt>
                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.nStatus === 1 ? (
                                <span className="text-green-600 font-semibold">อ่านแล้ว</span>
                            ) : (
                                <span className="text-red-600 font-semibold">ยังไม่อ่าน</span>
                            )}
                        </dd>
                    </div>

                    {/* ประเภทข้อความ */}
                    <div className="flex">
                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                            ประเภท:
                        </dt>
                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.nType === 1 &&
                                "แจ้งเช็คชื่อ"}
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.nType === 2 &&
                                "แจ้งซื้อสินค้า"}
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.nType === 3 &&
                                "แจ้งย้อนหลังการใช้จ่าย"}
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.nType === 5 &&
                                "ระบบแจ้งเตือนทั่วไป"}
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.nType === 8 &&
                                "แจ้งเตือนกทั่วไป"}
                            {![1, 2, 3, 5, 8].includes(
                                NOTIFICATION_READ_MESSAGE_STATE.response.data.nType
                            ) && "ไม่ทราบประเภท"}
                        </dd>
                    </div>

                    {/* ข้อมูล homework (ถ้ามี) */}
                    {NOTIFICATION_READ_MESSAGE_STATE.response.data.homework && (
                        <>
                            <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                                Homework:
                            </dt>
                            <dd className="flex-1 text-gray-900 dark:text-gray-200">
                                <dl className="grid grid-cols-1 gap-y-2">
                                    <div className="flex">
                                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                                            Day Start:
                                        </dt>
                                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.homework
                                                .daystart || "-"}
                                        </dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                                            Day End:
                                        </dt>
                                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.homework
                                                .dayend || "-"}
                                        </dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                                            Detail:
                                        </dt>
                                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.homework
                                                .detail || "-"}
                                        </dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                                            Teacher:
                                        </dt>
                                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.homework
                                                .teachername || "-"}
                                        </dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                                            School ID:
                                        </dt>
                                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                                            {
                                                NOTIFICATION_READ_MESSAGE_STATE.response.data.homework
                                                    .SchoolID
                                            }
                                        </dd>
                                    </div>
                                </dl>
                            </dd>
                        </>
                    )}

                    {/* รหัสโรงเรียน */}
                    <div className="flex">
                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                            School ID:
                        </dt>
                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.school_id}
                        </dd>
                    </div>

                    {/* ไฟล์แนบ */}
                    <div className="flex">
                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200 ">
                            แนบไฟล์:
                        </dt>
                        <dd className="flex-1 text-gray-900 dark:text-gray-200">
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.file
                                ? "มีไฟล์แนบ"
                                : "ไม่มีไฟล์แนบ"}
                        </dd>
                    </div>

                    {/* Logo (กรณีมี) */}
                    <div className="flex">
                        <dt className="w-32 font-medium text-gray-600 dark:text-gray-200">
                            Logo URL:
                        </dt>
                        <dd className="flex-1 text-blue-600 break-all">
                            {NOTIFICATION_READ_MESSAGE_STATE.response.data.logo || "-"}
                        </dd>
                    </div>
                </dl>

                {/* แสดงคำสั่ง curl */}
                <div className="mt-4">
                    <h3 className="font-medium text-gray-600 mb-1 dark:text-gray-200">
                        Curl Command:
                    </h3>
                    <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs">
            {NOTIFICATION_READ_MESSAGE_STATE.response.curl}
          </pre>
                </div>
            </div>
        </MinimalModal>
    );

    return (
        <DashboardLayout>
            {isLoading && <BaseLoadingComponent/>}
            {modal === "response_open" && renderModal()}

            <div className="w-full space-y-4">
                {/* หมายเหตุ */}
                <div className="grid grid-cols-1 grid-rows-1 gap-0 w-full">
                    <div className="space-y-3 w-full grid-cols-2">
                        <ContentCard
                            title="ค้นหาการแจ้งเตือนในแอพ"
                            fullWidth
                            className="w-full"
                        >
                            {/* ห่อสองช่องด้วย grid จริง ๆ */}
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {/* กรอก School Id */}
                                <div>
                                    <SearchableSelectComponent
                                        label="เลือกโรงเรียน"
                                        options={[
                                            {label: "เลือกรายการ", value: ""},
                                            ...schoolList.map((s) => ({
                                                label: s.label + " (" + s.value + ")",
                                                value: String(s.value),
                                            })),
                                        ]}
                                        value={form.schoolID}
                                        onChange={(event: any) => {
                                            setForm({...form, schoolID: event});
                                        }}
                                        placeholder="เลือกโรงเรียน"
                                    />
                                </div>

                                {/* กรอกรหัส User ID  */}
                                <div>
                                    <SearchableSelectComponent
                                        label="กรอกรหัส User ID ที่ต้องการค้นหา"
                                        options={[
                                            {label: "เลือกรายการ", value: ""},
                                            ...(userList ?? []).map((s) => ({
                                                label: s.label,
                                                value: String(s.value),
                                            })),
                                        ]}
                                        value={form.userID}
                                        onChange={(event: any) => {
                                            setForm({...form, userID: event});
                                        }}
                                        placeholder="กรอกรหัส User ID"
                                    />
                                </div>

                                <div></div>

                                <div className="flex justify-end w-full">
                                    <MinimalButton
                                        type="button"
                                        textSize="base"
                                        className={` ${
                                            form?.userID
                                                ? "bg-green-500 hover:bg-green-600"
                                                : "bg-gray-300"
                                        }`}
                                        isLoading={isLoading}
                                        disabled={!form?.userID}
                                        onClick={async () => {
                                            setPage(1);
                                            await handleSubmitForm(1);
                                        }}
                                    >
                                        ค้นหา
                                    </MinimalButton>
                                </div>
                            </div>
                        </ContentCard>
                    </div>
                </div>

                <ContentCard
                    title="รายงานการทำงานทุกระบบ"
                    fullWidth
                    className="md:col-span-2 xl:col-span-4 w-full hidden"
                >
                    {/* -- ใน <ContentCard> ส่วนฟอร์ม -- */}
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* เลือกโรงเรียน */}
                            <div className="flex-1">
                                <SearchableSelectComponent
                                    label="เลือกโรงเรียน"
                                    options={[
                                        {label: "เลือกรายการ", value: ""},
                                        ...schoolList.map((s) => ({
                                            label: s.label + " (" + s.value + ")",
                                            value: String(s.value),
                                        })),
                                    ]}
                                    value={selectedSchool}
                                    onChange={setSelectedSchool}
                                    placeholder="เลือกโรงเรียน"
                                />
                            </div>

                            {/* ค้นหา Device ID */}
                            <div>
                                <InputFieldComponent
                                    label="ค้นหา Device ID"
                                    placeholder="พิมพ์ Device ID"
                                    icon={
                                        <FiSearch className="text-gray-400 dark:text-gray-500"/>
                                    }
                                    value={deviceIdSearch}
                                    onChange={(e) => setDeviceIdSearch(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            {/* จากวันที่ */}
                            {/* <div>
                <DatePickerComponent
                  label="จากวันที่"
                  value={fromDate}
                  onChange={setFromDate}
                  className="w-full"
                />
              </div> */}

                            {/* ถึงวันที่ */}
                            {/* <div>
                <DatePickerComponent
                  label="ถึงวันที่"
                  value={toDate}
                  onChange={setToDate}
                  className="w-full"
                />
              </div> */}
                        </div>
                    </form>
                </ContentCard>

                {/* Reponse From Server */}
                {/* <ResponseCardComponent
          responseData={SCHOOL_LIST_STATE.response.data?.data}
          curlCommand={SCHOOL_LIST_STATE.response.data?.curl}
        /> */}

                {/* ตาราง */}
                <ContentCard
                    title="ตารางแสดงข้อความแจ้งเตือน (เฉพาะวันนี้)"
                    className="xl:col-span-4 w-full"
                    isLoading={isLoading}
                >
                    <MinimalTable
                        isLoading={NOTIFICATION_TODAY_LIST.loading}
                        header={columns}
                        data={todayTable}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={setRowsPerPage}
                        hiddenProps={true}
                    >
                        {todayTable ? renderTableData(todayTable) : null}
                    </MinimalTable>
                    <div className="flex justify-between">
                        <MinimalButton
                            type="submit"
                            textSize="base"
                            className="bg-sky-500 hover:bg-sky-700 w-10 justify-center"
                            isLoading={isLoading}
                            onClick={() => {
                                setPage(page - 1);
                            }}
                        >
                            <FiArrowLeft/>
                        </MinimalButton>
                        <MinimalButton
                            type="submit"
                            textSize="base"
                            className="bg-sky-500 hover:bg-sky-700 w-10 justify-center "
                            isLoading={isLoading}
                            onClick={() => {
                                setPage(page + 1);
                            }}
                        >
                            <FiArrowRight/>
                        </MinimalButton>
                    </div>
                </ContentCard>

                {/* ตาราง */}
                <ContentCard
                    title="ตารางแสดงข้อความแจ้งเตือน (7 วันล่าสุด) ไม่นับวันนี้"
                    className="xl:col-span-4 w-full"
                    isLoading={isLoading}
                >
                    <MinimalTable
                        isLoading={NOTIFICATION_WEEK_LIST.loading}
                        header={columns}
                        data={filteredTable}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={setRowsPerPage}
                        hiddenProps={true}
                    >
                        {filteredTable ? renderTableData(filteredTable) : null}
                    </MinimalTable>
                    <div className="flex justify-between">
                        <MinimalButton
                            type="submit"
                            textSize="base"
                            className="bg-sky-500 hover:bg-sky-700 w-10 justify-center"
                            isLoading={isLoading}
                            onClick={() => {
                                setPage(page - 1);
                            }}
                        >
                            <FiArrowLeft/>
                        </MinimalButton>
                        <MinimalButton
                            type="submit"
                            textSize="base"
                            className="bg-sky-500 hover:bg-sky-700 w-10 justify-center "
                            isLoading={isLoading}
                            onClick={() => {
                                setPage(page + 1);
                            }}
                        >
                            <FiArrowRight/>
                        </MinimalButton>
                    </div>
                </ContentCard>
            </div>
        </DashboardLayout>
    );
}
