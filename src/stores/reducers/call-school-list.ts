// reducers/userReducer.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CallSchoolListState } from "@stores/type";
import { CallAPI } from "../actions/call-school-list";

const initialState: CallSchoolListState = {
  draftValues: {
    Array: [
      {
        SchoolID: 0,
        SchoolName: "",
        SchoolNameEN: "",
      },
    ],
  },
  loading: false,
  error: "",
  success: "",
  response: {},
};

const Slice = createSlice({
  name: "CallSchoolListSlice",
  initialState,
  reducers: {
    setDraftValues: (state, action: PayloadAction<CallSchoolListState>) => {
      state.draftValues = {
        ...state.draftValues,
        ...action.payload,
      };
    },
    setResponse: (state, action: PayloadAction<CallSchoolListState>) => {
      state.response = {
        ...action.payload,
      };
    },
    submitState: (state, action: PayloadAction<CallSchoolListState>) => {
      state.draftValues = {
        ...state.draftValues,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(CallAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(CallAPI.fulfilled, (state, action) => {
        state.loading = false;
        state.response.data = action.payload;
        state.success = "successfully";
      })
      .addCase(CallAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "An unknown error occurred";
      });
  },
});

export const { setDraftValues, submitState, setResponse } = Slice.actions;
export default Slice.reducer;
