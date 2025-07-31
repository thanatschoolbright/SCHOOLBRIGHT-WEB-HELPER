// types.ts
export interface DefaultRedux<T = any> {
    loading: boolean;
    error: string;
    success: string;
    response: T;
}

export interface UserState extends DefaultRedux {
    draftValues: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface FormCardNfcState extends DefaultRedux {
    draftValues: {
        nfc_card: string;
        school_id: string;
    };
}

export interface CancelSalesState extends DefaultRedux {
    draftValues: {
        SchoolID: string; // school id
        sID: string; // sid userid
        sID2: string; // sid2 is employee id, คนขาย
        sSellID: string; // รหัสการซื้อขาย , transaction_id
    };
}

export interface CallSchoolListState extends DefaultRedux {
    draftValues: {
        Array: {
            SchoolID: number; // school id
            SchoolName: string; // ชื่อโรงเรียน
            SchoolNameEN: string; // ชื่อโรงเรียน ภาษาอังกฤษ
        }[];
    };
}

export interface CallGetRegisterDeviceState extends DefaultRedux {
    draftValues: {
        Array: {
            ID: number;
            SchoolID: number;
            DeviceID: string;
            UserID: number;
            NeedToUpdate: boolean;
            Tstamp: string;
            ResponseStatus: boolean;
        }[];
    };
}

export interface ResponseGetRegisterOnlineDevice extends DefaultRedux {
    draftValues: {
        Array: {}[];
    };
}

export interface CallPostOnlineDevice extends DefaultRedux {
    draftValues: {
        SchoolID: number;
        DeviceID: string;
        Status: string;
    };
}

export interface ResponseGetServerStatus extends DefaultRedux {
    draftValues: {
        Array: {
            server: string;
            url: string;
            endpoint: string;
            Status: string;
            StatusCode: number;
            Message: string;
            description: string;
            timestamp: Date | string;
        }[];
    };
}

export interface ResponseSchoolList extends DefaultRedux {
    draftValues: { SchoolName: string; SchoolID: string }[];
}

export interface ResponseUserList extends DefaultRedux {
    draftValues: {
        UserID: number;
        UserType: string;
        Name: string;
        LastName: string;
        BarCode: string;
        SchoolID: number;
        sPicture: string;
        sMasterPicture: string;
        CardNFC_1: string;
        CardNFC_2: string | null;
        CardNFC_3: string | null;
        CardNFCID_1: string;
        CardNFCID_2: string | null;
        CardNFCID_3: string | null;
        CardStatus_1: string;
        CardStatus_2: string | null;
        CardStatus_3: string | null;
        bytePicture: string | null;
        TempCardHistoryID: string;
        TempCardID: string;
        TempNFC: string;
        TempnMoney: number;
        NFCReverse: string;
        NR_1: string;
        NR_2: string | null;
        NR_3: string | null;
        NFCReverse_1: string;
        NFCReverse_2: string | null;
        NFCReverse_3: string | null;
        username: string;
    };
}

export interface Default extends DefaultRedux {
    draftValues?: {};
}

export interface RequestLogin extends DefaultRedux {
    draftValues?: {
        username: string;
        password: string;
        school_id: string;
    };
}

export interface RequestNotification extends DefaultRedux {
    draftValues: {
        user_id: string;
        page: string;
    };
}

export interface ResponseNotification {
    sMessage: string;
    sTitle: string;
    nMessageID: number;
    dSend: string;
    nStatus: number;
    nType: number;
    push_id: string | null;
    scheduled_id: string;
    homework_id: number | null;
    homework: any | null;
    sell_id: number | null;
    file: boolean;
    letter_id: number;
    school_id: number;
    logo: string;
    letter_status: string;
    LogStatus: number;
    replyButtons: any | null;
    replyResult: any | null;
    replyStatus: boolean;
    fileUploads: any | null;
    NewsCreatedBy: any | null;
    ReplyType: any | null;
}

export interface RequestRefreshToken extends DefaultRedux {
    draftValues: {
        school_id: string;
        user_id: string;
        token: string;
    };
}

export interface RequestLoginAdmin extends DefaultRedux<ResponseLoginAdmin> {
    draftValues: {
        username: string;
        password: string;
    };
}

export interface ResponseLoginAdmin {
    status: number;
    data: {
        id: string;
        admin_id: number;
        username: string;
        name: string;
        lastname: string;
        token: string;
    };
}

export interface RequestNotificationReadMessage
    extends DefaultRedux<ResponseNotificationReadMessage> {
    draftValues: {
        user_id: string;
        message_id: string;
    };
}

export interface ResponseNotificationReadMessage extends DefaultRedux {
    data: {
        sMessage: string;
        sTitle: string;
        nMessageID: number;
        dSend: string; // ISO datetime string
        nStatus: number;
        nType: number;
        push_id: number | null;
        scheduled_id: string;
        homework_id: number | null;
        homework: {
            dayend: string | null;
            daynotification: string | null;
            daystart: string | null;
            detail: string | null;
            planename: string | null;
            teachername: string | null;
            SchoolID: number;
        };
        sell_id: number | null;
        file: boolean;
        letter_id: number | null;
        school_id: number;
        logo: string | null;
        letter_status: string | null;
        LogStatus: number;
        replyButtons: any | null;
        replyResult: any | null;
        replyStatus: boolean;
        fileUploads: any | null;
        NewsCreatedBy: any | null;
        ReplyType: string;
    };
    curl: string;
}

export interface RequestLeaveLetter extends DefaultRedux<ResponseLeaveLetter> {
    draftValues: {
        user_id: string;
        page: string;
    };
}

export interface RequestFixStatusLeaveLetter
    extends DefaultRedux<ResponseLeaveLetter> {
    draftValues: {
        school_id: string;
        letter_id: string;
    };
}

export interface ResponseLeaveLetter {
    data: {
        SchoolID: number;
        letterId: number;
        status: string;
        letterSubmitDate: string;
        leaveLetterId: number;
        letterType: string;
        letterTypeEN: string;
        senderName: string;
        senderNameEN: string;
        userType: string;
        ApprovedStatus: {
            StatusCode: number;
            TextEN: string;
            TextTH: string;
            ApprovalAmount: number;
        };
    };
    curl: string;
}

export interface RequestSchoolListWithMoreDetail
    extends DefaultRedux<ResponseSchoolListWithMoreDetail> {
    draftValues: {};
}

export interface ResponseSchoolListWithMoreDetail {
    data: {
        data: {
            company_name: string;
            school_pass: string;
            school_type: string;
            school_id: number;
            isActive: string;
            province: string;
            school_code: string;
            active_date: string; // รูปแบบ: "DD/MM/YYYY"
            PROVINCE_NAME: string;
            SchoolTypes: string;
            school_group: string;
            school_class: string | null;
            sale_name: string;
            support_name: string;
            school_grade: string;
        }[];
    };
}

export interface RequestBypassToken extends DefaultRedux<ResponseLeaveLetter> {
    draftValues: {
        school_id: string;
        user_email: string;
    };
}

export interface RequestApplicationList extends DefaultRedux<ResponseApplicationList> {
    draftValues: {};
}

export interface ResponseApplicationList {
    data: {
        status: string;
        data: {
            app_id: string;
            app_name: string;
            app_type: string;
        }[];
    }
}

export interface RequestApplicationVersionList extends DefaultRedux<ResponseApplicationVersionList> {
    draftValues: {
        app_id: string;
    };
}

export interface ResponseApplicationVersionList {
    data: {
        status: string;
        data: {
            app_id?: string;
            version_id: string;
            version_name: string;
            url: string;
            env: string;
            updated_at: string | null;
            note?: string;
        }[];
    }

}

export interface ResponseCreateApplicationVersion {
    data: {
        status: string;
        message: string;
        version_id: string;
    }
}

export interface RequestCreateApplicationVersion extends DefaultRedux<ResponseCreateApplicationVersion> {
    draftValues: {
        versionID?: string | null;
        schoolID: string | string[];
        appID: string;
        versionName: string;
        env: string;
        note: string;
        file: File | null;
        isLatestVersion: string | number;
    };
}