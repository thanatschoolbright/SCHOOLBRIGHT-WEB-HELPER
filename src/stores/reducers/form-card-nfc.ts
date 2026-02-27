// reducers/userReducer.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FormCardNfcState } from "@stores/type";
import { CallAPI } from "../actions/form-card-nfc-action";

const initialState: FormCardNfcState = {
  draftValues: {
    nfc_card: "",
    school_id: "",
  },
  loading: false,
  error: "",
  success: "",
  response: {},
};

const formCardNFCReducer = createSlice({
  name: "form-card-nfc",
  initialState,
  reducers: {
    setDraftValues: (state, action: PayloadAction<FormCardNfcState>) => {
      state.draftValues = {
        ...state.draftValues,
        ...action.payload,
      };
    },
    submitState: (state, action: PayloadAction<FormCardNfcState>) => {
      state.draftValues = {
        ...state.draftValues,
        ...action.payload,
      };
      CallAPI(action.payload);
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

export const { setDraftValues, submitState } = formCardNFCReducer.actions;
export default formCardNFCReducer.reducer;
