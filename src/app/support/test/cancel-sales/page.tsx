"use client";
import React, { useEffect, useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import { useTranslation } from "react-i18next";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { InputFieldComponent } from "@/components/input-field/input-field-component";
import MinimalButton from "@/components/button/minimal-button-component";
import { FiCreditCard, FiHome } from "react-icons/fi";
import { CallAPI } from "@/stores/actions/call-cancel-sales";
import Swal from "sweetalert2";
import {
  CancelSalesState,
  ResponseSchoolList,
  ResponseUserList,
} from "@stores/type";
import { SearchableSelectComponent } from "@/components/input-field/searchable-select-component";
import { CallAPI as GET_USER_BY_SCHOOLID } from "@/stores/actions/school/call-get-user";
import Link from "next/link";

interface DropdownType {
  label: string;
  value: string;
}

export default function Page() {
  const { t } = useTranslation("mock");
  const dispatch = useDispatch<AppDispatch>();
  const ReduxStateCancelSales = useAppSelector(
    (state) => state.callCancelSales
  );
  const SCHOOL_LIST_STATE = useAppSelector((state) => state.callSchoolList);
  const USER_LIST_STATE = useAppSelector(
    (state) => state.callGetuserBySchoolId
  );

  const [schoolList, setSchoolList] = useState<DropdownType[]>([]);
  const [userList, setUserList] = useState<DropdownType[]>([]);

  const [formState, setFormState] = useState<CancelSalesState["draftValues"]>({
    SchoolID: "",
    sID: "",
    sID2: "",
    sSellID: "",
  });
  const isLoading = [
    SCHOOL_LIST_STATE.loading,
    USER_LIST_STATE.loading,
    ReduxStateCancelSales.loading,
  ].some(Boolean);
  const [modal, setModal] = useState<string>("");

  useEffect(() => {
    setSchoolList(
      SCHOOL_LIST_STATE?.response?.data?.data?.map(
        (item: ResponseSchoolList["draftValues"][number]) => ({
          label: item.SchoolName,
          value: item.SchoolID,
        })
      ) || []
    );
  }, [SCHOOL_LIST_STATE?.response]);

  useEffect(() => {
    getUserBySchoolId(formState.SchoolID);
  }, [formState.SchoolID]);

  const getUserBySchoolId = async (schoolId: string) => {
    try {
      const response = await dispatch(GET_USER_BY_SCHOOLID({ schoolId }));
      await setUserList(
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

  // #region : State
  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { SchoolID, sID, sID2, sSellID } = formState;
    if (
      SchoolID.length < 1 ||
      sID.length < 1 ||
      sID2.length < 1 ||
      sSellID.length < 1
    ) {
      return setModal("error");
    }
    try {
      await dispatch(
        CallAPI({
          draftValues: formState,
          loading: false,
          error: "",
          success: "",
          response: undefined,
        })
      ).unwrap(); // <== ดึงผลลัพธ์ออก หรือ throw error
      setModal("success");
    } catch (error: any) {
      console.error("API error:", error);

      // คุณสามารถแสดง error จาก response จริงได้ เช่น message
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถดำเนินการได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // #endregion

  return (
    <DashboardLayout>
      {isLoading && <BaseLoadingComponent />}

      <div className="w-full space-y-4">
        <ContentCard
          title="Cancel Sales เกิน 7 วัน"
          fullWidth
          className="md:col-span-2 xl:col-span-4 w-full"
        >
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {/* กรอก School Id */}
            <div className="flex-1">
              <SearchableSelectComponent
                label="เลือกโรงเรียน"
                options={[
                  { label: "เลือกรายการ", value: "" },
                  ...schoolList.map((s) => ({
                    label: s.label + " (" + s.value + ")",
                    value: String(s.value),
                  })),
                ]}
                value={formState.SchoolID}
                onChange={(event: any) => {
                  setFormState({ ...formState, SchoolID: event });
                }}
                placeholder="เลือกโรงเรียน"
              />
            </div>
            {/* กรอกรหัส User ID (ของผู้ซื้อสินค้า) */}
            <div className="flex-1">
              <SearchableSelectComponent
                label="กรอกรหัส User ID (ของผู้ซื้อสินค้า)"
                options={[
                  { label: "เลือกรายการ", value: "" },
                  ...(userList ?? []).map((s) => ({
                    label: s.label,
                    value: String(s.value),
                  })),
                ]}
                value={formState.sID}
                onChange={(event: any) => {
                  setFormState({ ...formState, sID: event });
                }}
                placeholder="กรอกรหัส User ID (ของผู้ซื้อสินค้า)"
              />
            </div>

            {/* กรอกรหัส User ID (ของผู้ขายสินค้า */}
            <div className="flex-1">
              <SearchableSelectComponent
                label="กรอกรหัส User ID (ของผู้ขายสินค้า)"
                options={[
                  { label: "เลือกรายการ", value: "" },
                  ...(userList ?? []).map((s) => ({
                    label: s.label,
                    value: String(s.value),
                  })),
                ]}
                value={formState.sID2}
                onChange={(event: any) => {
                  setFormState({ ...formState, sID2: event });
                }}
                placeholder="กรอกรหัส User ID (ของผู้ขายสินค้า)"
              />
            </div>
            {/* Input NFC Card */}
            <InputFieldComponent
              label="รหัส Transaction Id (sSellID)"
              type="text"
              required
              icon={<FiCreditCard />}
              value={formState.sSellID}
              onChange={(event: any) =>
                setFormState({ ...formState, sSellID: event.target.value })
              }
              error={
                formState.sSellID.length < 1
                  ? "กรุณากรอกรหัส Transaction ID"
                  : ""
              }
              placeholder="กรุณากรอกรหัส Transaction ID"
            />

            {/* ปุ่ม ยืนยัน / ยกเลิก */}
            <div className="flex items-center gap-4">
              <MinimalButton
                type="submit"
                textSize="base"
                className="bg-green-500 hover:bg-green-600"
                isLoading={isLoading}
              >
                ยืนยัน
              </MinimalButton>

              <MinimalButton
                type="button"
                textSize="base"
                className="bg-red-500 hover:bg-red-600"
                isLoading={isLoading}
              >
                ยกเลิก
              </MinimalButton>
            </div>
          </form>
        </ContentCard>

        {/* Reponse From Server */}
        <ContentCard
          title="Response"
          isLoading={isLoading}
          fullWidth
          className={`md:col-span-2 xl:col-span-4 w-full overflow-hidden ${
            ReduxStateCancelSales.response.data ? "block" : "hidden"
          }`}
        >
          <div className="space-y-4 overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              <code>
                {JSON.stringify(
                  ReduxStateCancelSales.response.data?.data,
                  null,
                  2
                )}
              </code>
            </pre>
            <div className="flex flex-col md:flex-row gap-4">
              {/* COPY RESPONSE */}
              <MinimalButton
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(
                      ReduxStateCancelSales.response.data?.data,
                      null,
                      2
                    )
                  );
                  Swal.fire({
                    icon: "success",
                    title: "Copied!",
                    text: "Response copied to clipboard.",
                    confirmButtonText: "OK",
                  });
                }}
              >
                Copy Response
              </MinimalButton>

              {/* CURL */}
              <MinimalButton
                className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                onClick={() => {
                  const curlCommand = ReduxStateCancelSales.response.data?.curl;
                  navigator.clipboard.writeText(curlCommand.toString());
                  Swal.fire({
                    icon: "success",
                    title: "Copied!",
                    text: "Copy CURL to clipboard.",
                    confirmButtonText: "OK",
                  });
                }}
              >
                Copy CURL
              </MinimalButton>
            </div>
          </div>
        </ContentCard>

        {/* หมายเหตุ */}
        <div className="grid grid-cols-2 grid-rows-2 gap-6 w-full">
          <ContentCard
            title="หมายเหตุ (1)"
            fullWidth
            className="w-full col-span-1 row-span-2"
          >
            <p className="text-sm text-red-500">
              {t("วิธีการใช้งาน Cancel Sales")}
            </p>
            <Link
              href="https://drive.google.com/file/d/11JeMTt22jWK12BjsW07fFYteuZgDGjAe/view?usp=sharing"
              className="underline text-blue-600 hover:text-blue-800"
            >
              คลิกที่นี่เพื่อดูคลิปสอนการใช้งานภายใน 2 นาที!
            </Link>
          </ContentCard>
          {/* <ContentCard
            title="หมายเหตุ (2)"
            fullWidth
            className="w-full col-span-1 row-span-2"
          >
            <p className="text-sm text-red-500">
              {t(
                "กรณีที่ไม่พบข้อมูลใน https://www.canteen.schoolbright.co แต่พบข้อมูลที่นี่ แปลว่าเป็นปัญหาที่ Memory Sharing ของระบบ Canteen Web ให้แจ้ง Vimal"
              )}
            </p>
          </ContentCard> */}
        </div>
      </div>
    </DashboardLayout>
  );
}
