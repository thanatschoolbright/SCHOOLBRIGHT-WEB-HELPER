import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestLoginAdmin, RequestLoginV2 } from "@stores/type";
import { CallAPI } from "@stores/actions/authentication/call-get-login-admin";

const initialState: RequestLoginV2 = {
  draftValues: {
    username: "",
    password: "",
  },
  loading: false,
  error: "",
  success: "",
  response: {
    data: {
      success: false,
      token: "",
      user_data: {
        admin_id: 0,
        employee_code: "",
        firstname: "",
        lastname: "",
        nickname: "",
        email: "",
        backlog_email: "",
        tel: "",
        position: "",
      },
    },
  },
};

const Slice = createSlice({
  name: "callLogin",
  initialState,
  reducers: {
    setResponse(state, action: PayloadAction<RequestLoginV2["response"]>) {
      state.response = action.payload;
    },
  },
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

export const { setResponse } = Slice.actions;
export default Slice.reducer;
