"use client";
import {useEffect} from "react";
import {useDispatch} from "react-redux";
import {AppDispatch, useAppSelector} from "@stores/store";
import {CallAPI as GET_SCHOOL_LIST} from "@stores/actions/call-school-list";
import {CallAPI as GET_SCHOOL_LIST_DETAIL} from "@stores/actions/support/call-get-school-list-detail";
import {setDraftValues, setResponse,} from "@/stores/reducers/call-school-list";

export default function SchoolReduxProvider({
                                                children,
                                            }: Readonly<React.PropsWithChildren<{}>>) {
    const dispatch = useDispatch<AppDispatch>();
    const schoolState = useAppSelector((state) => state.callSchoolList);

    useEffect(() => {
        //** โหลดรายการโรงเรียนจาก localStorage หรือ API **/
        const callSchoolList = async () => {
            const storedSchools = localStorage.getItem("schools");
            if (storedSchools) {
                console.info("[STORED] SCHOOL TO CALL SCHOOL LIST REDUX : ");
                const parsed = JSON.parse(storedSchools);
                dispatch(setDraftValues(parsed));
                dispatch(setResponse(parsed));
                console.table(parsed);
            } else {
                try {
                    const response = await dispatch(GET_SCHOOL_LIST()).unwrap();
                    dispatch(setDraftValues(response));
                    dispatch(setResponse(response));
                    localStorage.setItem("schools", JSON.stringify(response));
                } catch (error) {
                    console.error("Error calling API:", error);
                }
            }
        };

        //** โหลดรายละเอียดโรงเรียนจาก localStorage หรือ API **/
        const callSchoolListDetail = async () => {
            const storedSchoolDetail = localStorage.getItem("schoolDetail");
            if (storedSchoolDetail) {
                console.info("[STORED] SCHOOL DETAIL TO CALL SCHOOL LIST REDUX ");
            } else {
                try {
                    const response = await dispatch(GET_SCHOOL_LIST_DETAIL()).unwrap();

                    localStorage.setItem("school_details", JSON.stringify(response));
                } catch (error) {
                    console.error("Error calling school detail API:", error);
                }
            }
        };

        // ✅ เรียกทั้งสองฟังก์ชัน
        callSchoolList();
        callSchoolListDetail();
    }, [dispatch]);

    return <>{children}</>;
}
