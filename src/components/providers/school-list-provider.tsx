"use client";
import {
  setDraftValues,
  setResponse,
} from "@/stores/reducers/call-school-list";
import { CallAPI as GET_SCHOOL_LIST } from "@stores/actions/call-school-list";
import { CallAPI as GET_SCHOOL_LIST_DETAIL } from "@stores/actions/support/call-get-school-list-detail";
import { AppDispatch, useAppSelector } from "@stores/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

/**
 * 🏫 SchoolReduxProvider - เวอร์ชั่นรักษาความปลอดภัย (No LocalStorage)
 * ทำหน้าที่โหลดรายการโรงเรียนเข้าสู่ Redux โดยตรงจาก API
 */
export default function SchoolReduxProvider({
  children,
}: Readonly<React.PropsWithChildren<{}>>) {
  const dispatch = useDispatch<AppDispatch>();

  // ดึงข้อมูลจาก Redux เพื่อตรวจสอบว่าโหลดไปแล้วหรือยัง
  const schoolList = useAppSelector(
    (root) => root.callSchoolList.response.data,
  );
  const schoolDetail = useAppSelector(
    (root) => root.callGetSchoolListDetail.response.data,
  );

  useEffect(() => {
    //** โหลดรายการโรงเรียนจาก API โดยไม่ใช้ localStorage ตามนโยบายความปลอดภัย **/
    const callSchoolList = async () => {
      // โหลดเฉพาะถ้ายังไม่มีข้อมูล
      if (schoolList && Array.isArray(schoolList) && schoolList.length > 0)
        return;

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
      // โหลดเฉพาะถ้ายังไม่มีข้อมูล
      if (
        schoolDetail &&
        Array.isArray(schoolDetail.data) &&
        schoolDetail.data.length > 0
      )
        return;

      try {
        await dispatch(GET_SCHOOL_LIST_DETAIL()).unwrap();
        console.info("[SAFE] School details loaded to Redux");
      } catch (error) {
        console.error("Error calling school detail API:", error);
      }
    };

    callSchoolList();
    callSchoolListDetail();
  }, [dispatch, schoolList, schoolDetail]);

  return <>{children}</>;
}
