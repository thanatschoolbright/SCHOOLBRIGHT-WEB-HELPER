"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@stores/store";
import { CallAPI } from "@stores/actions/call-school-list";
import { setDraftValues } from "@/stores/reducers/call-school-list";

export default function SchoolReduxProvider({
  children,
}: Readonly<React.PropsWithChildren<{}>>) {
  const dispatch = useDispatch<AppDispatch>();
  const schoolState = useAppSelector((state) => state.callSchoolList);

  useEffect(() => {
    const callSchoolList = async () => {
      const storedSchools = localStorage.getItem("schools");
      if (storedSchools) {
        dispatch(setDraftValues(JSON.parse(storedSchools)));
      } else {
        try {
          const response = await dispatch(CallAPI()).unwrap();
          dispatch(setDraftValues(response));
          localStorage.setItem("schools", JSON.stringify(response));
        } catch (error) {
          console.error("Error calling API:", error);
        }
      }
    };
    callSchoolList();
  }, [dispatch]);

  return <>{children}</>;
}
