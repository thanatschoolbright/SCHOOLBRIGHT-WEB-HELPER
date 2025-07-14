import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {ResponseGetRegisterOnlineDevice} from "@stores/type";
import {CallAPI} from "@stores/actions/hardware/call-get-online-device";

const initialState: ResponseGetRegisterOnlineDevice = {
    draftValues: {
        Array: [],
    },
    loading: false,
    error: "",
    success: "",
    response: {},
};

const Slice = createSlice({
    name: "CallGetRegisterDeviceSlice",
    initialState,
    reducers: {
        setDraftValues: (
            state,
            action: PayloadAction<ResponseGetRegisterOnlineDevice>
        ) => {
            state.draftValues = {
                ...state.draftValues,
                ...action.payload,
            };
        },
        submitState: (
            state,
            action: PayloadAction<ResponseGetRegisterOnlineDevice>
        ) => {
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

export const {setDraftValues, submitState} = Slice.actions;
export default Slice.reducer;
