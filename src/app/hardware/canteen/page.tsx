"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";

// Components
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { MinimalRow } from "@components/table/minimal-row-component";
import MinimalTable from "@components/table/minimal-table-component";
import DropdownButtonComponent from "@components/button/dropdown-button-component";
import ModalComponent from "@components/modal/modal-component";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import RoundedButton from "@components/button/rounded-button-component";
import InputComponent from "@components/input-field/input-component";
import UploadComponent from "@components/input-field/upload-component";
import { SearchableSelectComponent } from "@components/input-field/searchable-select-component";
import RadioComponent from "@components/input-field/radio-component";

// Icons
import { FiCheck, FiPlus, FiX } from "react-icons/fi";

// Store/actions
import { CallAPI as GET_APPLICATION_LIST } from "@stores/actions/hardware/canteen/call-get-application";
import { CallAPI as GET_APPLICATION_VERSION_BY_APPID } from "@stores/actions/hardware/canteen/call-get-application-by-appId";
import { CallAPI as POST_CREATE_APPLICATION_VERSION } from "@stores/actions/hardware/canteen/call-post-create-application-version";
import { CallAPI as POST_UPDATE_APPLICATION_VERSION } from "@stores/actions/hardware/canteen/call-post-update-application-version";
import { setDraftValues as setDraftValuesCallPostCreateApplicationVersion } from "@stores/reducers/hardware/canteen/call-post-create-application-version";
import { setDraftValues as setDraftValuesCallGetApplicationByAppId } from "@stores/reducers/hardware/canteen/call-get-application-by-appId";
import {
  ResponseApplicationList,
  ResponseApplicationVersionList,
} from "@stores/type";

// Utilities
import { toast } from "sonner";
import ToggleSwitchComponent from "@components/input-field/toggle-switch-component";
import { Modal, Button, Space, Typography, Input } from "antd";
import DeleteConfirmModal from "@components/modal/modal-confirm-delete-component";

const TableHardwareApplicationList = ({
  data,
  openVersionModal,
}: {
  data: ResponseApplicationList["data"]["data"];
  openVersionModal: (
    data: ResponseApplicationList["data"]["data"][number]
  ) => void;
}) => {
  return (
    <>
      {data.map((row, idx) => (
        <MinimalRow key={`${row.app_id}-${idx}`} index={idx + 1}>
          {({ index }) => (
            <>
              <td className="px-6 py-4 text-xs font-medium ">{index}</td>

              <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                {row.app_name}
              </td>
              <td className="px-6 py-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                  {row.app_type}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-center">
                  <DropdownButtonComponent
                    id={row.app_id}
                    items={[
                      {
                        label: "ดูเวอร์ชัน",
                        onClick: () => openVersionModal(row),
                      },
                    ]}
                  />
                </div>
              </td>
            </>
          )}
        </MinimalRow>
      ))}
    </>
  );
};

const TableHardwareVersionByAppIdList: React.FC<{
  data: ResponseApplicationVersionList["data"]["data"];
  setShowEditVersionModal: (type: string) => void;
}> = ({ data, setShowEditVersionModal }) => {
  const dispatch = useDispatch<AppDispatch>();
  const STATE_HARDWARE_APPLICATION_BY_APP_ID = useAppSelector(
    (state) => state.callGetHardwareApplicationByAppId
  );
  const [versionId, setVersionId] = useState<string>("");
  const [modal, setModal] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>("");
  const deleteVersion = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/v1/hardware/canteen/delete/${versionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      setIsDeleting(false);
      setVersionId("");
      setModal("");
      setConfirmText("");
      toast.success("สำเร็จ", {
        description: result?.data?.message || "ลบเวอร์ชันสำเร็จ",
        duration: 5000,
      });
      return result;
    } catch (error) {
      setIsDeleting(false);
      console.error("Error deleting version:", error);
      setVersionId("");
      setModal("");
      setConfirmText("");
      throw error;
    }
  };

  return (
    <>
      {modal === "delete-version" && (
        <DeleteConfirmModal
          open={modal === "delete-version"}
          isDeleting={isDeleting}
          onCancel={() => {
            setVersionId("");
            setModal("");
          }}
          onConfirm={async () => {
            await deleteVersion();
          }}
        />
      )}
      {data.map((v: any, idx: number) => (
        <MinimalRow key={`${v.version_id}-${idx}`} row={v} index={idx + 1}>
          {({ row, index }) => (
            <>
              <td className="p-4 text-sm text-gray-900 dark:text-gray-200">
                {index}
              </td>
              <td className="p-4">{row.version_name}</td>
              <td className="p-4">{row.env}</td>
              <td className="p-4">
                {row.updated_at
                  ? new Date(row.updated_at).toLocaleString("th-TH")
                  : "-"}
              </td>
              <td className="p-4">
                <span className="inline-flex">
                  <DropdownButtonComponent
                    id={row.version_id}
                    items={[
                      {
                        label: "ดาวน์โหลด",
                        onClick: () => console.log("ดาวน์โหลด", row.version_id),
                      },
                      {
                        label: "แก้ไข",
                        onClick: () => {
                          setShowEditVersionModal("edit");
                          dispatch(
                            setDraftValuesCallPostCreateApplicationVersion({
                              versionID: row.version_id ?? "",
                              appID:
                                (STATE_HARDWARE_APPLICATION_BY_APP_ID as any)
                                  ?.draftValues?.app_id ?? "",
                              versionName: row.version_name ?? "",
                              env: row.env ?? "",
                              note: row.note ?? "",
                              file: null,
                              schoolID: "",
                              isLatestVersion: "",
                              forceUpdate: "",
                            })
                          );
                        },
                      },
                      {
                        label: "ลบ",
                        onClick: () => {
                          setVersionId(row.version_id);
                          setModal("delete-version");
                        },
                        textColor: "text-red-500",
                      },
                    ]}
                  />
                </span>
              </td>
            </>
          )}
        </MinimalRow>
      ))}
    </>
  );
};

const isFormValid = (form: {
  schoolID: string | string[];
  versionID: string | null;
  appID: string;
  versionName: string;
  env: string;
  note: string;
  file: File | null;
  isLastestVersion?: string | number;
}): boolean => {
  const { schoolID, appID, versionName, env, note, file } = form;
  return appID !== "" && versionName !== "" && env !== "" && file !== null;
};

const buildFormData = (form: {
  schoolID: string | string[];
  versionID: string | null;
  appID: string;
  versionName: string;
  env: string;
  note: string;
  file: File | null;
  isLastestVersion?: string | number;
}): FormData => {
  const formData = new FormData();
  formData.append("school_id", form.schoolID.toString());
  formData.append("app_id", form.appID);
  formData.append("version_name", form.versionName);
  formData.append("env", form.env);
  formData.append("note", form.note);
  formData.append("version_id", form.versionID ?? "");
  formData.append("is_lastest_version", String(form.isLastestVersion ?? 0));
  if (form.file) {
    formData.append("file", form.file);
  }
  return formData;
};

const AddOrEditVersionModal: React.FC<{
  isOpenModal: boolean;
  setIsOpenModal: (isOpen: boolean) => void;
  schoolList: any[];
  appIdList: any[];
  type: string;
}> = ({
  isOpenModal,
  setIsOpenModal,
  schoolList,
  appIdList,

  type,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION = useAppSelector(
    (state) => state.callPostCreateApplicationVersion
  );
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<{
    schoolID: string | string[];
    versionID: string | null;
    appID: string;
    versionName: string;
    env: string;
    note: string;
    file: File | null;
    isLastestVersion?: string | number;
    forceUpdate?: string | number;
  }>({
    schoolID: "",
    versionID:
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.versionID?.toString() ||
      "",
    appID:
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.appID?.toString() ||
      "",
    versionName:
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
        .versionName,
    env: STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.env,
    note:
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.note ||
      "",
    isLastestVersion:
      STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
        .isLatestVersion || 0,
    forceUpdate: 0,
    file: null,
  });

  useEffect(() => {
    // Update form when switching to edit mode
    if (type === "edit") {
      setForm((prevForm) => ({
        ...prevForm,
        appID:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.appID?.toString() ||
          "",
        versionName:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
            .versionName,
        env: STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
          .env,
        note:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
            .note || "",
        versionID:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.versionID?.toString() ||
          "",
        isLastestVersion:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
            .isLatestVersion || 0,
        forceUpdate:
          STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues
            .forceUpdate ?? 0,
      }));
    }
  }, [type, STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid(form)) {
      toast.error("เกิดข้อผิดพลาด", {
        description: `กรุณากรอกข้อมูลให้ครบถ้วน`,
        duration: 5000,
        position: "top-right",
      });
      return;
    }

    const formData = buildFormData(form);

    try {
      setIsLoading(true);
      let resultAction: any;
      if (type === "add") {
        resultAction = await dispatch(
          POST_CREATE_APPLICATION_VERSION(formData)
        );
      } else if (type === "edit") {
        resultAction = await dispatch(
          POST_UPDATE_APPLICATION_VERSION(formData)
        );
      }
      setIsLoading(false);
      if (
        (type === "add" &&
          POST_CREATE_APPLICATION_VERSION.fulfilled.match(resultAction)) ||
        (type === "edit" &&
          POST_UPDATE_APPLICATION_VERSION.fulfilled.match(resultAction) &&
          resultAction.payload?.data?.status !== "failed")
      ) {
        toast.success("สำเร็จ", {
          description: `${
            resultAction.payload?.data?.message ||
            "สร้างเวอร์ชันแอปพลิเคชันสำเร็จ"
          }\nversion id : ${resultAction.payload?.data?.version_id ?? "-"}`,
          duration: 5000,
          position: "top-right",
        });
        setIsOpenModal(false);
      } else {
        toast.error("เกิดข้อผิดพลาด", {
          description:
            resultAction.payload?.data?.message ||
            resultAction?.payload?.error?.message ||
            "เกิดข้อผิดพลาดในการสร้างเวอร์ชันแอปพลิเคชัน",
          duration: 6000,
          position: "top-right",
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error("เกิดข้อผิดพลาด", {
        description: err?.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        duration: 6000,
        position: "top-right",
      });
    }
  };

  const envOptions = [
    { label: "เลือกรายการ", value: "" },
    { label: "Production", value: "Production" },
    { label: "Beta", value: "Beta" },
  ];

  return (
    <ModalComponent
      isOpen={isOpenModal}
      title={
        type === "add"
          ? "เพิ่มเวอร์ชันแอปพลิเคชัน"
          : `แก้ไขเวอร์ชัน ${STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.versionName} 
        (ID: ${STATE_HARDWARE_CALL_POST_CREATE_APPLICATION_VERSION.draftValues.versionID})`
      }
      onClose={() => setIsOpenModal(false)}
    >
      {isLoading && <BaseLoadingComponent />}
      <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-500 ease-in-out">
        <form
          className="flex flex-col gap-5 animate-fadeIn"
          encType="multipart/form-data"
          onSubmit={handleSubmit}
        >
          {/* Dropdown section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            {/* เลือกโรงเรียน */}
            <SearchableSelectComponent
              label="เลือกโรงเรียน (ไม่บังคับ)"
              id="school_id"
              name="school_id"
              multiselect={false}
              options={[
                { label: "ทุกโรงเรียน", value: "" },
                ...schoolList.map((s: any) => ({
                  label: `${s.label} (${s.value})`,
                  value: String(s.value),
                })),
              ]}
              value={form.schoolID}
              onChange={(value: string | string[]) =>
                setForm({ ...form, schoolID: value })
              }
              placeholder="เลือกโรงเรียน"
            />
            {/* App ID */}
            {appIdList.length > 0 && (
              <SearchableSelectComponent
                label="เลือกแอปพลิเคชัน"
                id="app_id"
                name="app_id"
                options={appIdList}
                value={form.appID}
                multiselect={false}
                required
                onChange={(value: string | string[]) =>
                  setForm({
                    ...form,
                    appID: Array.isArray(value) ? value[0] : value,
                  })
                }
                placeholder="เลือก App ID"
                error={form.appID === "" ? "กรุณาเลือก App ID" : ""}
                disabled={type === "edit"}
              />
            )}
            {/* Environment */}
            <SearchableSelectComponent
              label="สภาพแวดล้อม (Environment)"
              options={envOptions}
              value={form.env}
              onChange={(value: string | string[]) =>
                setForm({
                  ...form,
                  env: Array.isArray(value) ? value[0] : value,
                })
              }
              placeholder="เลือกสภาพแวดล้อม"
              error={form.env === "" ? "กรุณาเลือกสภาพแวดล้อม" : ""}
            />
          </div>

          {/* Input section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700">
            {/* Version Name */}
            <InputComponent
              label="ชื่อเวอร์ชัน"
              id="version_name"
              name="version_name"
              value={form.versionName}
              onChange={(e: any) =>
                setForm({ ...form, versionName: e.target.value })
              }
              type="text"
              required
              placeholder="เช่น 1.0.0"
              error={
                form.versionName === ""
                  ? "กรุณาระบุชื่อเวอร์ชัน"
                  : !/^\d+\.\d+\.\d+$/.test(form.versionName)
                  ? "รูปแบบไม่ถูกต้อง (ควรเป็น x.y.z เช่น 1.0.0)"
                  : ""
              }
            />
            {/* Version ID (read-only) */}
            <InputComponent
              label="Version ID"
              id="version_id"
              name="version_id"
              value={form.versionID ?? "null"}
              type="text"
              disabled
            />
            {/* Note */}
            <InputComponent
              label="หมายเหตุ"
              id="note"
              name="note"
              type="text"
              value={form.note}
              onChange={(e: any) => setForm({ ...form, note: e.target.value })}
              placeholder="ใส่รายละเอียดเพิ่มเติม"
            />

            {/* Upload */}
            <div className="md:col-span-2">
              <UploadComponent
                label="เลือกไฟล์แอป (.apk)"
                id="file"
                name="file"
                accept=".apk,.zip"
                onChange={(e: any) =>
                  setForm({ ...form, file: e.target.files?.[0] || null })
                }
                error={
                  form.file === null
                    ? "กรุณาเลือกไฟล์แอปในรูปแบบ .APK เท่านั้น"
                    : ""
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Toggle Switch */}
            <ToggleSwitchComponent
              id="is_lastest_version"
              name="is_lastest_version"
              label="เป็นเวอร์ชันล่าสุดหรือไม่ ?"
              checked={form.isLastestVersion === 1}
              onChange={(checked) =>
                setForm({
                  ...form,
                  isLastestVersion: checked ? 1 : 0,
                })
              }
            />

            {/* Force Update */}
            <ToggleSwitchComponent
              id="force_update"
              name="force_update"
              label="บังคับอัพเดท (Force Update)"
              checked={form.forceUpdate === 1}
              onChange={(checked) =>
                setForm({
                  ...form,
                  forceUpdate: checked ? 1 : 0,
                })
              }
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-4 w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 
                   hover:from-blue-600 hover:to-indigo-700 
                   text-white font-semibold rounded-xl shadow-md 
                   transform transition-all duration-300 ease-in-out 
                   hover:scale-105 active:scale-95"
          >
            บันทึกเวอร์ชัน
          </button>
        </form>
      </div>
    </ModalComponent>
  );
};

// 🧾 คอลัมน์ของตาราง
const columns: { key: string; label: string }[] = [
  { key: "app_name", label: "ชื่อแอปพลิเคชัน" },
  { key: "app_type", label: "แพลตฟอร์ม" },
  { key: "action", label: "" },
];

export default function Page() {
  const { t } = useTranslation("mock");
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  // State hooks
  const [applicationList, setApplicationList] = useState<
    ResponseApplicationList["data"]["data"]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] =
    useState<boolean>(false);
  const [selectedAppData, setSelectedAppData] =
    useState<ResponseApplicationList["data"]["data"][number]>();
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showAddOrEditApplicationModal, setShowAddOrEditApplicationModal] =
    useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  // Redux selectors
  const STATE_HARDWARE_APPLICATION = useAppSelector(
    (state) => state.callGetHardwareApplication
  );
  const STATE_HARDWARE_APPLICATION_BY_APP_ID = useAppSelector(
    (state) => state.callGetHardwareApplicationByAppId
  );
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);

  const isLoading = [STATE_HARDWARE_APPLICATION_BY_APP_ID.loading].some(
    Boolean
  );

  useEffect(() => {
    if (showAddOrEditApplicationModal === "edit") {
      setIsModalOpen(false);
    }
  }, [showAddOrEditApplicationModal]);

  useEffect(() => {
    setIsPasswordModalOpen(true);
  }, []);

  // Load school list
  useEffect(() => {
    setSchoolList(
      SCHOOL_LIST_STATE?.response?.data?.data?.map((item: any) => ({
        label: item.SchoolName,
        value: item.SchoolID,
      })) || []
    );
  }, [SCHOOL_LIST_STATE?.response]);

  // Fetch application list when page loads (not when modal is open)
  useEffect(() => {
    if (!isModalOpen && applicationList.length === 0) {
      dispatch(GET_APPLICATION_LIST()).unwrap();
    }
  }, [isModalOpen]);

  // Transform Redux data for table
  useEffect(() => {
    const rawList = STATE_HARDWARE_APPLICATION?.response?.data?.data || [];
    const transformed = rawList.map(
      (item: ResponseApplicationList["data"]["data"][number]) => ({
        app_name: item.app_name,
        app_id: item.app_id,
        app_type: item.app_type,
      })
    );
    setApplicationList(transformed);
  }, [STATE_HARDWARE_APPLICATION?.response]);

  // Debug: log application by app id
  useEffect(() => {
    // console.log("✅ [STATE_HARDWARE_APPLICATION_BY_APP_ID]", STATE_HARDWARE_APPLICATION_BY_APP_ID.response.data.data);
  }, [STATE_HARDWARE_APPLICATION_BY_APP_ID]);

  const openVersionModal = async (
    data: ResponseApplicationList["data"]["data"][number]
  ) => {
    setSelectedAppData(data);
    await dispatch(
      setDraftValuesCallGetApplicationByAppId({ app_id: data.app_id })
    );
    await dispatch(GET_APPLICATION_VERSION_BY_APPID({ app_id: data.app_id }));
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        {/* Action button */}
        <div className="flex justify-end mb-4">
          <RoundedButton
            type="button"
            className="bg-blue-500 hover:bg-blue-600 text-white group transition-all duration-300"
            onClick={() => setShowAddOrEditApplicationModal("add")}
          >
            <span className="flex items-center overflow-hidden">
              <FiPlus className="w-4 h-4 flex-shrink-0 transition-all duration-300" />
              <span
                className="opacity-0 translate-x-[-10px] max-w-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:max-w-xs transition-all duration-300 ml-2 whitespace-nowrap"
                style={{ display: "inline-block" }}
              >
                เพิ่มเวอร์ชันใหม่
              </span>
            </span>
          </RoundedButton>
        </div>

        {/* Application list */}
        <ContentCard
          title="รายการแอปพลิเคชัน"
          className="xl:col-span-4 w-full"
          isLoading={STATE_HARDWARE_APPLICATION.loading}
        >
          <MinimalTable
            key="application-list"
            isLoading={STATE_HARDWARE_APPLICATION.loading}
            header={columns}
            data={applicationList}
            rowsPerPage={10}
            onRowsPerPageChange={() => {}}
            hiddenProps={false}
          >
            <TableHardwareApplicationList
              data={applicationList}
              openVersionModal={openVersionModal}
            />
          </MinimalTable>
        </ContentCard>
      </div>

      {/* Password Modal */}
      <ModalComponent
        isOpen={isPasswordModalOpen}
        title="💬 กรุณาใส่รหัสผ่านก่อนเปิดหน้า"
        onClose={() => setIsPasswordModalOpen(false)}
        onCancel={() => router.push("/backend")}
      >
        <div className="flex flex-col gap-4">
          <InputComponent
            id="password"
            type="password"
            label="รหัสผ่าน"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="กรอกรหัสผ่าน"
          />
          {passwordError && (
            <div className="text-red-500 text-sm">{passwordError}</div>
          )}
          <div className="flex justify-end gap-2">
            <RoundedButton
              type="button"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordInput("");
                setPasswordError("");
                router.push("/backend");
              }}
              iconLeft={<FiX className="w-4 h-4" />}
            >
              ยกเลิก
            </RoundedButton>
            <RoundedButton
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              iconLeft={<FiCheck className="w-4 h-4" />}
              onClick={async () => {
                const correctPassword = "qa";
                if (passwordInput === correctPassword) {
                  setIsPasswordModalOpen(false);
                  setPasswordInput("");
                  setPasswordError("");
                  toast.success("สำเร็จ", {
                    description: "รหัสผ่านถูกต้อง",
                    duration: 3000,
                    position: "top-right",
                  });
                } else {
                  setPasswordError("รหัสผ่านไม่ถูกต้อง");
                }
              }}
              disabled={!passwordInput}
            >
              ตกลง
            </RoundedButton>
          </div>
        </div>
      </ModalComponent>

      {/* Add/Edit Version Modal */}
      <AddOrEditVersionModal
        type={showAddOrEditApplicationModal}
        isOpenModal={showAddOrEditApplicationModal !== ""}
        setIsOpenModal={() => setShowAddOrEditApplicationModal("")}
        schoolList={schoolList}
        appIdList={
          STATE_HARDWARE_APPLICATION.response?.data?.data?.map(
            (item: ResponseApplicationList["data"]["data"][number]) => ({
              label: `${item.app_name}`,
              value: String(item.app_id),
            })
          ) || []
        }
      />

      {/* Version List Modal */}
      <ModalComponent
        isOpen={isModalOpen}
        title={`คุณกำลังเลือก ${selectedAppData?.app_name}`}
        onClose={() => setIsModalOpen(false)}
      >
        <MinimalTable
          key={`version-table-${selectedAppData?.app_name}`}
          isLoading={STATE_HARDWARE_APPLICATION_BY_APP_ID.loading}
          header={[
            { key: "version_name", label: "เวอร์ชัน" },
            { key: "env", label: "สภาพแวดล้อม" },
            { key: "updated_at", label: "อัปเดทล่าสุด" },
            { key: "action", label: "" },
          ]}
          data={STATE_HARDWARE_APPLICATION_BY_APP_ID.response?.data?.data || []}
          rowsPerPage={10}
          onRowsPerPageChange={() => {}}
          hiddenProps={false}
        >
          <TableHardwareVersionByAppIdList
            data={
              STATE_HARDWARE_APPLICATION_BY_APP_ID.response?.data?.data || []
            }
            setShowEditVersionModal={(type: string) =>
              setShowAddOrEditApplicationModal(type)
            }
          />
        </MinimalTable>
      </ModalComponent>
    </DashboardLayout>
  );
}
