import { createSlice } from "@reduxjs/toolkit";
import { RequestQRCodeGenerator } from "@stores/type";
import { CallAPI } from "@stores/actions/mobile/qrcode-health-check/action";

const initialState: RequestQRCodeGenerator = {
  draftValues: {
    amount: 0,
    school_id: 0,
    shop_id: 0,
  },
  loading: false,
  error: "",
  success: "",
  response: {
    message: "",
    raw: undefined,
    data: {
      data: {
        status: "",
        results: [],
      },
    },
  },
};

const Reducer = createSlice({
  name: "CallQRCodeGenerator",
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
