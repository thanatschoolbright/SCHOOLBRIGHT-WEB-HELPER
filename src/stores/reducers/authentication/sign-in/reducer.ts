import { createSlice } from "@reduxjs/toolkit";
import { RequestLoginV2 } from "@stores/type";
import { CallAPI } from "@stores/actions/authentication/sign-in/action";

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

const Reducer = createSlice({
  name: "CallSignInActionV2",
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

export default Reducer.reducer;
