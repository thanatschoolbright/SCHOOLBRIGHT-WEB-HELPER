"use client";
import { CallAPI as GET_SCHOOL_LIST } from "@stores/actions/call-school-list";
import { CallAPI as GET_SCHOOL_LIST_DETAIL } from "@stores/actions/support/call-get-school-list-detail";
import { AppDispatch, store, useAppSelector } from "@stores/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

/**
 * SchoolReduxProvider - เวอร์ชั่นรักษาความปลอดภัย (No LocalStorage)
 * ทำหน้าที่โหลดรายการโรงเรียนเข้าสู่ Redux โดยตรงจาก API
 */
export default function SchoolReduxProvider({
  children,
}: Readonly<React.PropsWithChildren<{}>>) {
  const dispatch = useDispatch<AppDispatch>();

  // ดึงสถานะปัจจุบันจาก Redux
  const schoolListState = useAppSelector((state) => state.callSchoolList);
  const schoolDetailState = useAppSelector(
    (state) => state.callGetSchoolListDetail,
  );

  useEffect(() => {
    const loadInitialData = async () => {
      // ดึงสถานะปัจจุบัน ณ เวลาที่รัน (เพื่อแก้ปัญหา Closure)
      const state = store.getState() as any;
      const listReducer = state.callSchoolList;
      const detailReducer = state.callGetSchoolListDetail;

      // 1. ตรวจสอบและโหลดรายการโรงเรียน
      const hasList =
        Array.isArray(listReducer.response?.data?.data) &&
        listReducer.response.data.data.length > 0;
      if (!hasList && !listReducer.loading) {
        console.info("[INIT] Fetching school list...");
        dispatch(GET_SCHOOL_LIST());
      }

      // 2. ตรวจสอบและโหลดรายละเอียดโรงเรียน
      const hasDetail =
        Array.isArray(detailReducer.response?.data) &&
        detailReducer.response.data.length > 0;
      if (!hasDetail && !detailReducer.loading) {
        console.info("[INIT] Fetching school details...");
        dispatch(GET_SCHOOL_LIST_DETAIL());
      }
    };

    loadInitialData();
  }, [dispatch]); // รันครั้งเดียวเมื่อ Mount เท่านั้น เพื่อป้องกัน Loop ถาวร

  return <>{children}</>;
}
