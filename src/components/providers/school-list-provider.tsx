"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@stores/store";
import { CallAPI as GET_SCHOOL_LIST } from "@stores/actions/call-school-list";
import { CallAPI as GET_SCHOOL_LIST_DETAIL } from "@stores/actions/support/call-get-school-list-detail";
import {
  setDraftValues,
  setResponse,
} from "@/stores/reducers/call-school-list";

/**
 * 🏫 SchoolReduxProvider - เวอร์ชั่นรักษาความปลอดภัย (No LocalStorage)
 * ทำหน้าที่โหลดรายการโรงเรียนเข้าสู่ Redux โดยตรงจาก API
 */
export default function SchoolReduxProvider({
  children,
}: Readonly<React.PropsWithChildren<{}>>) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    //** โหลดรายการโรงเรียนจาก API โดยไม่ใช้ localStorage ตามนโยบายความปลอดภัย **/
    const callSchoolList = async () => {
      try {
        const response = await dispatch(GET_SCHOOL_LIST()).unwrap();
        dispatch(setDraftValues(response));
        dispatch(setResponse(response));
        console.info("[SAFE] School list loaded to Redux (No LocalStorage)");
      } catch (error) {
        console.error("Error calling school list API:", error);
      }
    };

    //** โหลดรายละเอียดโรงเรียนจาก API **/
    const callSchoolListDetail = async () => {
      try {
        await dispatch(GET_SCHOOL_LIST_DETAIL()).unwrap();
        console.info("[SAFE] School details loaded to Redux");
      } catch (error) {
        console.error("Error calling school detail API:", error);
      }
    };

    callSchoolList();
    callSchoolListDetail();
  }, [dispatch]);

  return <>{children}</>;
}
