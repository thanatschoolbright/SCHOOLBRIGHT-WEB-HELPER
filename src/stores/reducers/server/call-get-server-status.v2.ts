// reducers/userReducer.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ResponseGetServerStatus } from "@stores/type";
import { CallAPI } from "@stores/actions/server/call-get-server-status.v2";

const initialState: ResponseGetServerStatus = {
  draftValues: {
    Array: [],
  },
  loading: false,
  error: "",
  success: "",
  response: {},
};

const callGetServerStatus = createSlice({
  name: "CallGetServerStatus",
  initialState,
  reducers: {},
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

export default callGetServerStatus.reducer;
