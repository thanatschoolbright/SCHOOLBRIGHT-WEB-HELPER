// reducers/userReducer.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestSchoolListWithMoreDetail } from "@stores/type";
import { CallAPI } from "@stores/actions/support/call-get-school-list-detail";

const initialState: RequestSchoolListWithMoreDetail = {
  draftValues: {},
  loading: false,
  error: "",
  success: "",
  response: {
    data: {
      data: [],
    },
  },
};

const Slice = createSlice({
  name: "CallGetSchoolListDetail",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(CallAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(CallAPI.fulfilled, (state, action) => {
        state.loading = false;
        state.response = action.payload;
        state.success = "successfully";
      })
      .addCase(CallAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "An unknown error occurred";
      });
  },
});

export default Slice.reducer;
