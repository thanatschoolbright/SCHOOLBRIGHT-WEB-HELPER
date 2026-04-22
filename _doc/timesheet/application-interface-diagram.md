# APPLICATION INTERFACE DIAGRAM

## แผนผังการเชื่อมโยงของระบบงาน — Timesheet Management System

---

> **Organization:** SchoolBright Co., Ltd.
> **System Scope:** Timesheet Management System (TMS)
> **Document Version:** 2.4.45
> **Prepared Date:** 22 เมษายน พ.ศ. 2569
> **Classification:** INTERNAL — FOR AUDITOR USE ONLY

---

## สารบัญ (Table of Contents)

| หมวด | รายการ                                                     |
| ---- | ---------------------------------------------------------- |
| 1    | บริบทระบบ (System Context Diagram — Level 0)               |
| 2    | ผังระบบงานระดับสูง (High-Level Interface Map)              |
| 3    | การเชื่อมต่อ Frontend ↔ Backend (Layer Interface)          |
| 4    | ผังการไหลของ Request (Request Flow per Module)             |
| 5    | การเชื่อมต่อฐานข้อมูล (Database Interface)                 |
| 6    | การเชื่อมต่อบริการภายนอก (External Service Interface)      |
| 7    | ผังสิทธิ์และการยืนยันตัวตน (Auth & Permission Interface)   |
| 8    | ตารางสรุปจุดเชื่อมต่อทั้งหมด (Interface Endpoint Registry) |

---

## §1 · บริบทระบบ (System Context Diagram — Level 0)

**Diagram 1a — ผู้ใช้งาน → ระบบ**

```mermaid
flowchart TD
    Admin["ผู้ดูแลระบบ\nadmin_id = 117\nSuper Admin"]
    Employee["พนักงาน\nบันทึกเวลา"]
    Manager["ผู้จัดการ\nติดตามภาพรวม"]
    Approver["ผู้อนุมัติ OT\nuser_id = 49\nSole Approver"]
    TMS["SCHOOLBRIGHT TMS\nNext.js 16 App Router\nv2.4.45"]
    Admin -->|HTTPS TLS 1.3| TMS
    Employee -->|HTTPS TLS 1.3| TMS
    Manager -->|HTTPS TLS 1.3| TMS
    Approver -->|HTTPS TLS 1.3| TMS
```

**Diagram 1b — ระบบ → Databases**

```mermaid
flowchart TD
    TMS["SCHOOLBRIGHT TMS"]
    PG[("PostgreSQL\nTimesheet DB")]
    MSSQL[("SQL Server\nMain DB")]
    TMS --> PG
    TMS --> MSSQL
```

**Diagram 1c — ระบบ → External Services**

```mermaid
flowchart TD
    TMS["SCHOOLBRIGHT TMS"]
    ExtAPI["External APIs\nGemini / ChatGPT"]
    SMTP["Nodemailer\nEmail SMTP"]
    LINE["LINE Messaging API\nNotification"]
    OBS["Huawei OBS\nStorage"]
    TMS --> ExtAPI
    TMS --> SMTP
    TMS --> LINE
    TMS --> OBS
```

---

## §2 · ผังระบบงานระดับสูง (High-Level Interface Map)

**Diagram 2a — Frontend → API Routing**

```mermaid
flowchart TD
    APP01["APP-01 Entry\n/timesheet/entry"]
    APP02["APP-02 All Overview\n/timesheet/all"]
    APP03["APP-03 Overtime\n/timesheet/overtime"]
    APP04["APP-04 Project\n/timesheet/project"]

    API01["API-01 entry/*"]
    API02["API-02 overtime/*"]
    API03["API-03 project/*"]
    API04["API-04 report/*"]
    API05["API-05 excel/*"]
    API06["API-06 migration/*"]
    API07["API-07 ai-description"]

    APP01 -->|callApiService| API01
    APP01 -->|callApiService| API07
    APP02 -->|callApiService| API01
    APP02 -->|callApiService| API04
    APP02 -->|callApiService| API05
    APP03 -->|callApiService| API02
    APP03 -->|callApiService| API05
    APP03 -->|callApiService| API06
    APP04 -->|callApiService| API03
    APP04 -->|callApiService| API05
```

**Diagram 2b — API → ORM → Database**

```mermaid
flowchart TD
    API["API Routes\n/api/v1/timesheet/*\n(API-01 ถึง API-07)"]

    subgraph ORM["ORM LAYER — Prisma"]
        PrismaTS["PrismaTimesheet\nNamed Export\n@/helpers/prisma-timesheet"]
        PrismaMain["prisma\nDefault Export\n@/helpers/prisma"]
    end

    PG[("PostgreSQL\nTimesheet DB")]
    MSSQL[("SQL Server\nMain DB")]

    API --> PrismaTS
    API -->|Reference Only| PrismaMain
    PrismaTS --> PG
    PrismaMain --> MSSQL
```

---

## §3 · การเชื่อมต่อ Frontend ↔ Backend (Layer Interface Detail)

### 3.1 HTTP Client ที่ใช้งาน

| Client           | ไฟล์                                             | วัตถุประสงค์                                     | ใช้ใน                    |
| ---------------- | ------------------------------------------------ | ------------------------------------------------ | ------------------------ |
| `callApiService` | `src/services/axios-instance/sb-helper.axios.ts` | เรียก API ภายใน `/api/v*/...`                    | ทุก Frontend Component   |
| `axios` (direct) | import ตรง                                       | เรียก API ภายใน (บาง Service เก่า)               | OT Service บางส่วน       |
| `fetch`          | Native                                           | เรียก Image Proxy / Logger (หลีกเลี่ยง circular) | Image Base64, API Logger |

### 3.2 ผัง Interface ระดับ Component (APP-01 · Entry)

```mermaid
flowchart TD
    subgraph STORE["Zustand Stores"]
        ST1["use-timesheet-store.ts\nentries, projects, subProjects, stats"]
        ST2["use-ranking-store.ts\nrankings, month"]
    end
    subgraph COMPONENTS["Components"]
        C1["create-modal-form.tsx"]
        C2["my-work-modal.tsx"]
        C3["guide-modal.tsx"]
    end
    E1["POST /entry/read"]
    E2["POST /entry/insert"]
    E3["POST /entry/delete"]
    E4["POST /project/read"]
    E5["POST /project/sub-project/read"]
    E6["POST /entry/check/summary"]
    R1["GET /find-ranking"]
    MW["GET /my-work"]
    AI["POST /ai-description"]
    ST1 --> E1
    ST1 --> E2
    ST1 --> E3
    ST1 --> E4
    ST1 --> E5
    ST1 --> E6
    ST2 --> R1
    C1 --> E2
    C2 --> MW
    C3 --> AI
```

### 3.3 ผัง Interface ระดับ Component (APP-02 · All Overview)

```mermaid
flowchart TD
    subgraph APP02["APP-02 : /timesheet/all"]
        ST3["timesheet-all-store.ts Zustand\nsummary, metadata, autoRefresh, countdown"]
        SC["summary-cards.tsx"]
        TS["table-section.tsx"]
        FS["filter-section.tsx"]
        BN["bulk-notify-bar.tsx"]
        TA["table-actions.tsx"]
    end
    S1["POST /entry/check/summary"]
    S2["GET /department/list"]
    S3["POST /report/employee-notify"]
    S4["GET /excel/template_4"]
    SC -->|ข้อมูลจาก Store| ST3
    ST3 --> S1
    ST3 --> S2
    TS --> S1
    FS --> S2
    BN --> S3
    TA --> S4
```

### 3.4 ผัง Interface ระดับ Component (APP-03 · Overtime)

**Diagram 3.4a — Store + CRUD Operations**

```mermaid
flowchart TD
    OT_ST["overtime-store.ts Zustand\nlist, filters, modals, summary"]
    O1["POST /overtime/read"]
    O2["POST /overtime/create"]
    O3["PUT /overtime/update"]
    O4["DELETE /overtime/delete"]
    O5["POST /overtime/change-status"]
    OT_ST --> O1
    OT_ST --> O2
    OT_ST --> O3
    OT_ST --> O4
    OT_ST --> O5
```

**Diagram 3.4b — Modal → API Connections**

```mermaid
flowchart TD
    OT_C1["create-modal.tsx"]
    OT_C2["detail-modal.tsx"]
    OT_C3["batch-status-modal.tsx"]
    OT_C4["export-modal.tsx"]
    OT_C5["analytics-modal.tsx"]
    OT_C6["remind-modal.tsx"]
    OT_C7["pay-calculator-modal.tsx"]
    OT_C8["timeline-modal.tsx"]
    OT_C9["bulk-download-modal.tsx"]
    O2["POST /overtime/create"]
    O1["POST /overtime/read"]
    O5["POST /overtime/change-status"]
    O6["POST /overtime/export"]
    O7["POST /overtime/analytics"]
    O8["POST /overtime/send-email-bulk"]
    O9["GET /timeline"]
    O10["POST /overtime/upload-images"]
    CALC["Client-side only"]
    OT_C1 --> O2
    OT_C2 --> O1
    OT_C2 --> O10
    OT_C3 --> O5
    OT_C4 --> O6
    OT_C5 --> O7
    OT_C6 --> O8
    OT_C7 --> CALC
    OT_C8 --> O9
    OT_C9 --> O6
```

### 3.5 ผัง Interface ระดับ Component (APP-04 · Project)

```mermaid
flowchart TD
    PJ_ST["_state/ Zustand Store"]
    subgraph PROJ["Project APIs"]
        P1["POST /project/read"]
        P2["POST /project/insert"]
        P3["DELETE /project/delete"]
        P4["PUT /project/color"]
        P5["GET /project/stats"]
    end
    subgraph SUB["Sub-Project APIs"]
        P6["POST /sub-project/read"]
        P7["POST /sub-project/insert"]
        P8["DELETE /sub-project/delete"]
        P9["GET /sub-project/search"]
    end
    PJ_ST --> P1
    PJ_ST --> P2
    PJ_ST --> P3
    PJ_ST --> P4
    PJ_ST --> P5
    PJ_ST --> P6
    PJ_ST --> P7
    PJ_ST --> P8
    PJ_ST --> P9
```

---

## §4 · ผังการไหลของ Request (Request Flow per Module)

### 4.1 Timesheet Entry — Insert Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as พนักงาน Browser
    participant Form as create-modal-form.tsx
    participant API as /entry/insert/route.ts
    participant DB as PostgreSQL
    User->>Form: กรอกข้อมูล project, hours, date
    Form->>API: POST /api/v1/timesheet/entry/insert { project_id, sub_project_id, work_hour, date, status, by }
    alt Zod Validation ไม่ผ่าน
        API-->>Form: 400 Validation Failed
    else validateReferences ไม่ผ่าน
        API-->>Form: 400 Reference Invalid
    else DailyHoursLimit เกิน 8 ชม./วัน
        API-->>Form: 400 DailyHoursLimitError
    else วันที่เป็นอนาคต
        API-->>Form: 400 FutureDateError
    else ผ่านทุกเงื่อนไข
        API->>DB: PrismaTimesheet.timesheetEntry.upsert()
        DB-->>API: id record
        API-->>Form: status_code 200
        Form-->>User: toast บันทึกสำเร็จ
    end
```

### 4.2 Overtime — Create & Email Notification Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as พนักงาน
    participant Modal as create-modal.tsx
    participant API as /overtime/create/route.ts
    participant SVC as createOvertimeWithNotification
    participant DB as PostgreSQL
    participant SMTP as Nodemailer SMTP
    User->>Modal: กรอกข้อมูล OT
    Modal->>API: POST /api/v1/timesheet/overtime/create { requester_id, descriptions, approver_id, status }
    API->>API: Zod Validate CreateOvertimeSnakeSchema
    API->>SVC: createOvertimeWithNotification payload
    SVC->>DB: INSERT timesheet_overtime_requests + descriptions
    DB-->>SVC: id
    SVC->>DB: INSERT overtime_status_log to_status=pending
    SVC->>SMTP: sendOvertimeEmail แจ้งผู้อนุมัติ
    SMTP-->>SVC: sent
    SVC-->>API: id
    API-->>Modal: status_code 201 data id
    Modal-->>User: toast ยื่นขอ OT สำเร็จ
```

### 4.3 Overtime — Change Status Flow (Authorization Guard)

```mermaid
sequenceDiagram
    autonumber
    actor Approver as ผู้อนุมัติ user_id=49 หรือ admin_id=117
    participant Modal as batch-status-modal.tsx
    participant API as /overtime/change-status/route.ts
    participant Auth as NextAuth auth()
    participant DB as PostgreSQL
    participant SMTP as Nodemailer SMTP
    Approver->>Modal: กด อนุมัติ หรือ ปฏิเสธ
    Modal->>API: POST /overtime/change-status?id=XX { status, note }
    API->>Auth: await auth()
    Auth-->>API: session user.id user.admin_id
    alt ไม่มี Session
        API-->>Modal: 401 Unauthorized
    else user ไม่ใช่ Approver และไม่ใช่ Super Admin
        API-->>Modal: 403 Forbidden
    else isApprover user_id=49 หรือ isSuperAdmin admin_id=117
        API->>DB: UPDATE overtime.status
        API->>DB: INSERT overtime_status_log
        API->>SMTP: sendOvertimeEmail แจ้งผู้ขอ OT
        SMTP-->>API: sent
        API-->>Modal: status_code 200
        Modal-->>Approver: toast เปลี่ยนสถานะสำเร็จ
    end
```

> **Authorization Matrix**
>
> | ผู้ใช้งาน        | ผ่าน/ไม่ผ่าน | เงื่อนไข                 |
> | ---------------- | ------------ | ------------------------ |
> | user_id = "49"   | PASS         | Sole OT Approver         |
> | admin_id = 117   | PASS         | Super Admin (Bypass All) |
> | user อื่นทั้งหมด | FAIL (403)   | ไม่มีสิทธิ์              |
> | ไม่มี Session    | FAIL (401)   | Unauthorized             |

### 4.4 AI Auto-Fill Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as พนักงาน
    participant Modal as guide-modal.tsx
    participant API as /entry/automate-fill/route.ts
    participant DB as PostgreSQL
    participant Gemini as Google Gemini API
    participant GPT as OpenAI ChatGPT
    User->>Modal: กด Auto-Fill { user_id, hours, date, engine, projectId, subProjectId }
    Modal->>API: POST /api/v1/timesheet/entry/automate-fill
    API->>API: splitHoursToChunks hours แบ่ง hours เป็นก้อน 2-4 ชม.
    API->>DB: ดึงประวัติ Project และ Feature ของ user
    DB-->>API: Project and Feature list
    loop ทุก chunk
        alt engine = gemini
            API->>Gemini: generateDescriptionWithGemini generateContent
            Gemini-->>API: คำอธิบายงาน
        else engine = chatgpt
            API->>GPT: generateDescriptionWithChatGPT chat.completions.create
            GPT-->>API: คำอธิบายงาน
        end
        API->>DB: INSERT timesheetEntry per chunk
    end
    API-->>Modal: status_code 200 inserted N
    Modal-->>User: toast กรอกข้อมูล N รายการสำเร็จ
```

### 4.5 Excel Export Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as ผู้ใช้งาน
    participant Modal as export-modal.tsx
    participant API as /overtime/export/route.ts
    participant SVC as OvertimeService
    participant XLS as ExcelJS
    participant DB as PostgreSQL
    User->>Modal: เลือกช่วงวันที่ และกด Export
    Modal->>API: POST /api/v1/timesheet/overtime/export { from, to, status, requester_id }
    API->>API: Zod Validate ExportOvertimeSchema
    API->>SVC: OvertimeService.generateExportExcel
    SVC->>DB: PrismaTimesheet.overtime.findMany
    DB-->>SVC: Overtime records
    SVC->>XLS: Workbook.addSheet.addRows
    XLS-->>SVC: Buffer xlsx
    SVC-->>API: excelBuffer
    API-->>Modal: Response Content-Type application/vnd.xlsx attachment
    Modal-->>User: ดาวน์โหลดไฟล์ Excel
```

### 4.6 OT Image Upload Flow (Proof of Work)

```mermaid
sequenceDiagram
    autonumber
    actor User as พนักงาน
    participant Modal as detail-modal.tsx
    participant API as /overtime/upload-images/route.ts
    participant DB as PostgreSQL
    participant OBS as Huawei OBS Object Storage
    User->>Modal: แนบไฟล์รูปภาพหลักฐาน
    Modal->>API: POST FormData { action: upload, description_id, image_key, file }
    API->>DB: overtimeDescription.findUnique id=description_id
    DB-->>API: description record
    alt description ไม่พบ
        API-->>Modal: 400 Invalid description_id
    else พบ description
        API->>OBS: ObsService.upload file bucket
        OBS-->>API: Public URL
        API->>DB: UPDATE overtimeDescription.proof JSON SET image_key=URL
        DB-->>API: updated
        API-->>Modal: status_code 200 url https://...
        Modal-->>User: แสดงรูปภาพที่อัปโหลด
    end
```

---

## §5 · การเชื่อมต่อฐานข้อมูล (Database Interface)

### 5.1 ORM → Database Mapping

**Diagram 5.1a — API Routes → ORM Layer**

```mermaid
flowchart TD
    subgraph ROUTES["API Routes /api/v1/timesheet/*"]
        R1["/entry/*"]
        R2["/overtime/*"]
        R3["/project/*"]
        R4["/report/*"]
        R5["/migration/*"]
        R6["/ai-description"]
        R7["/calculate-summary-month"]
        R8["/department/list"]
        R9["/find-ranking"]
        R10["/my-work"]
        R11["/timeline"]
    end
    PrismaTS["PrismaTimesheet\nNamed Export\n@/helpers/prisma-timesheet"]
    PrismaMain["prisma\nDefault Export\n@/helpers/prisma"]
    R1 --> PrismaTS
    R2 --> PrismaTS
    R3 --> PrismaTS
    R4 --> PrismaTS
    R5 --> PrismaTS
    R6 --> PrismaTS
    R7 --> PrismaTS
    R8 --> PrismaTS
    R9 --> PrismaTS
    R10 --> PrismaTS
    R11 --> PrismaTS
    R1 -->|Reference Only| PrismaMain
```

**Diagram 5.1b — ORM → Database**

```mermaid
flowchart TD
    subgraph ORM_TS["PrismaTimesheet — Named Export"]
        T1["user"]
        T2["departments / positions"]
        T3["roles / permissions"]
        T4["project / feature / group"]
        T5["project_assignee"]
        T6["timesheet_entry"]
        T7["timesheet_overtime_requests"]
        T8["timesheet_overtime_descriptions"]
        T9["overtime_status_log"]
        T10["api_log"]
    end
    subgraph ORM_MAIN["prisma — Default Export"]
        M1["userList (400+ Models)"]
        M2["schoolData"]
    end
    PG[("PostgreSQL\nDATABASE_TIMESHEET_URL")]
    MSSQL[("SQL Server\nDATABASE_URL")]
    ORM_TS --> PG
    ORM_MAIN --> MSSQL
```

### 5.2 Prisma Singleton Pattern

```mermaid
flowchart TD
    subgraph TS_HELPER["src/helpers/prisma-timesheet.ts — Named Export"]
        EXP1["export { PrismaTimesheet }\nimport { PrismaTimesheet } from @/helpers/prisma-timesheet\nawait PrismaTimesheet.overtime.findMany()"]
    end
    subgraph MAIN_HELPER["src/helpers/prisma.ts — Default Export"]
        EXP2["export default prisma\nimport prisma from @/helpers/prisma\nawait prisma.userList.findMany()"]
    end
    PG[("PostgreSQL DATABASE_TIMESHEET_URL")]
    MSSQL[("SQL Server DATABASE_URL")]
    WARN["CRITICAL: ห้ามใช้ Model ข้ามฐานข้อมูล"]
    EXP1 --> PG
    EXP2 --> MSSQL
    EXP1 -.- WARN
    EXP2 -.- WARN
```

---

## §6 · การเชื่อมต่อบริการภายนอก (External Service Interface)

### 6.1 External Service Map

**Diagram 6.1a — Email Service Connections**

```mermaid
flowchart TD
    TMS["TIMESHEET SYSTEM SB-TMS"]
    subgraph EMAIL["EMAIL SERVICE — Nodemailer v7.0.10"]
        EM1["/overtime/send-email"]
        EM2["/overtime/send-email-bulk"]
        EM3["/report/daily-notify"]
        EM4["/report/employee-notify"]
        EM5["/report/employee-notify-one"]
        EM6["/excel/template_4/send-email"]
    end
    TMS --> EM1
    TMS --> EM2
    TMS --> EM3
    TMS --> EM4
    TMS --> EM5
    TMS --> EM6
```

**Diagram 6.1b — AI Service Connections**

```mermaid
flowchart TD
    GEM["Google Gemini API\nENV: GEMINI_API_KEY"]
    GPT["OpenAI ChatGPT\nENV: OPENAI_API_KEY"]
    AI1["/entry/automate-fill"]
    AI2["/ai-description"]
    AI3["/migration/automate-fill"]
    GEM --> AI1
    GEM --> AI2
    GEM --> AI3
    GPT --> AI1
```

**Diagram 6.1c — Storage Service Connections**

```mermaid
flowchart TD
    TMS["TIMESHEET SYSTEM SB-TMS"]
    subgraph STORAGE["FILE STORAGE — Huawei OBS esdk-obs-nodejs"]
        ST1["/overtime/upload-images"]
        ST2["/api/v1/proxy/image"]
    end
    TMS --> ST1
    TMS --> ST2
```

### 6.2 External Service Response Contract

| บริการ          | Protocol        | Format      | Trigger                                |
| --------------- | --------------- | ----------- | -------------------------------------- |
| Google Gemini   | HTTPS/REST      | JSON        | AI Auto-Fill, AI Description           |
| OpenAI ChatGPT  | HTTPS/REST      | JSON        | AI Auto-Fill (engine=chatgpt)          |
| Nodemailer SMTP | SMTP/TLS        | MIME        | OT Create, Status Change, Daily Report |
| Huawei OBS      | HTTPS/S3-compat | Binary/JSON | OT Image Upload                        |
| LINE Messaging  | HTTPS/REST      | JSON        | Notification (line-push.service)       |

---

## §7 · ผังสิทธิ์และการยืนยันตัวตน (Auth & Permission Interface)

### 7.1 Authentication Flow

```mermaid
flowchart TD
    REQ["Client Request"]
    AUTH["NextAuth v5.0.0-beta.31<br/>Credentials Provider — src/auth.ts"]
    SESSION_CHECK{{"มี Session?"}}
    LOGIN_FAIL["Redirect Login Page"]
    METHOD["วิธี Login<br/>Email case-insensitive / Employee Code / Username"]
    PW_BCRYPT["bcryptjs.compare Primary"]
    PW_PLAIN["Plain-text fallback Legacy"]
    LOCK{{"Failed >= 5 ครั้ง?"}}
    LOCKOUT["Lockout 15 นาที Auto-unlock"]
    JWT["สร้าง JWT Session Token"]
    PAYLOAD["Payload: id · admin_id · username · employee_code<br/>role_id · role_name · permissions[]<br/>firstname_th · lastname_th · department · position · email · last_login"]
    REQ --> AUTH --> SESSION_CHECK
    SESSION_CHECK -->|ไม่มี| LOGIN_FAIL
    SESSION_CHECK -->|มี| METHOD
    METHOD --> PW_BCRYPT
    METHOD --> PW_PLAIN
    PW_BCRYPT --> LOCK
    PW_PLAIN --> LOCK
    LOCK -->|ใช่| LOCKOUT
    LOCK -->|ไม่ใช่| JWT --> PAYLOAD
```

### 7.2 Permission Check Interface

```mermaid
flowchart TD
    subgraph FE["FRONTEND — useHasPermission() src/hooks/use-has-permission.ts"]
        FE_1["can PERMISSION_CODE — ตรวจสอบสิทธิ์เดี่ยว"]
        FE_2["can CODE_A CODE_B — OR Logic"]
        FE_3["isAdmin — admin_id === 117 Bypass ทุกอย่าง"]
    end
    subgraph BE["BACKEND — API Route Check"]
        BE_1["const session = await auth()"]
        BE_2["const permissions = session?.user?.permissions or []"]
        SA{{"admin_id === 117?"}}
        OTA{{"user_id === 49?"}}
        BYPASS["Super Admin: bypass ทุกการตรวจสอบ"]
        APPROVE["OT Approver: อนุมัติและปฏิเสธ OT ได้"]
        REJECT["403 Forbidden"]
        BE_1 --> BE_2 --> SA
        SA -->|ใช่| BYPASS
        SA -->|ไม่ใช่| OTA
        OTA -->|ใช่| APPROVE
        OTA -->|ไม่ใช่| REJECT
    end
```

> **Permission Pattern:** `{{module}}.{{resource}}.{{action}}` — ตัวอย่าง: `TIMESHEET.ENTRY.CREATE`, `TIMESHEET.OT.APPROVE`

### 7.3 Role-Based Access Control (RBAC)

```mermaid
flowchart TD
    USER["User\nuser table"]
    ROLE["Role\nroles table"]
    RP["RolePermission\nrole_permissions table"]
    PERM["Permission\npermissions table"]
    PCODE["p_code\nUNIQUE Index"]
    SESSION["Session Token\npermissions[] array of p_codes"]
    USER -->|role_id FK| ROLE
    ROLE --> RP
    RP --> PERM
    PERM -->|p_code| PCODE
    PCODE -->|ถูกนำไปใส่ใน| SESSION
    USER -->|JWT carries| SESSION
```

---

## §8 · ตารางสรุปจุดเชื่อมต่อทั้งหมด (Interface Endpoint Registry)

### 8.1 Frontend → Backend Interface Registry

| #   | Source (Frontend)         | Target Endpoint                                | Method | Auth         | Description          |
| --- | ------------------------- | ---------------------------------------------- | ------ | ------------ | -------------------- |
| 1   | entry/create-modal-form   | `/api/v1/timesheet/entry/insert`               | POST   | Session      | บันทึก/แก้ไข Entry   |
| 2   | entry/timesheet-api       | `/api/v1/timesheet/entry/read`                 | POST   | Session      | ดึงรายการ Entry      |
| 3   | entry/timesheet-api       | `/api/v1/timesheet/entry/delete`               | POST   | Session      | ลบ Entry             |
| 4   | entry/timesheet-api       | `/api/v1/timesheet/project/read`               | POST   | Session      | ดึงรายการ Project    |
| 5   | entry/timesheet-api       | `/api/v1/timesheet/project/sub-project/read`   | POST   | Session      | ดึง Sub-Project      |
| 6   | entry/timesheet-api       | `/api/v1/timesheet/entry/check/summary`        | POST   | Session      | สรุปรายสัปดาห์       |
| 7   | entry/my-work-modal       | `/api/v1/timesheet/my-work`                    | GET    | Session      | งานที่รับผิดชอบ      |
| 8   | entry/guide-modal         | `/api/v1/timesheet/ai-description`             | POST   | Session      | AI สร้างคำอธิบาย     |
| 9   | entry/ranking-api         | `/api/v1/timesheet/find-ranking`               | GET    | Session      | กระดานอันดับ         |
| 10  | all/timesheet-all-api     | `/api/v1/timesheet/entry/check/summary`        | POST   | Session      | สรุปภาพรวมองค์กร     |
| 11  | all/timesheet-all-api     | `/api/v1/timesheet/department/list`            | GET    | Session      | รายชื่อแผนก          |
| 12  | all/bulk-notify-bar       | `/api/v1/timesheet/report/employee-notify`     | POST   | Session      | แจ้งเตือนหมู่        |
| 13  | all/table-actions         | `/api/v1/timesheet/excel/template_4`           | GET    | Session      | Export Excel         |
| 14  | overtime/create-modal     | `/api/v1/timesheet/overtime/create`            | POST   | Session      | ยื่นขอ OT            |
| 15  | overtime/overtime-service | `/api/v1/timesheet/overtime/read`              | POST   | Session      | ดึงรายการ OT         |
| 16  | overtime/overtime-service | `/api/v1/timesheet/overtime/update`            | PUT    | Session      | แก้ไข OT             |
| 17  | overtime/overtime-service | `/api/v1/timesheet/overtime/delete`            | DELETE | Session      | ลบ OT                |
| 18  | overtime/batch-status     | `/api/v1/timesheet/overtime/change-status`     | POST   | Session+Role | อนุมัติ/ปฏิเสธ       |
| 19  | overtime/export-modal     | `/api/v1/timesheet/overtime/export`            | POST   | Session      | Export OT Excel      |
| 20  | overtime/analytics-modal  | `/api/v1/timesheet/overtime/analytics`         | POST   | Session      | Dashboard OT         |
| 21  | overtime/remind-modal     | `/api/v1/timesheet/overtime/send-email-bulk`   | POST   | Session      | แจ้งเตือน Email หมู่ |
| 22  | overtime/timeline-modal   | `/api/v1/timesheet/timeline`                   | GET    | Session      | Timeline             |
| 23  | overtime/detail-modal     | `/api/v1/timesheet/overtime/upload-images`     | POST   | Session      | อัปโหลดรูปหลักฐาน    |
| 24  | project/page              | `/api/v1/timesheet/project/insert`             | POST   | Session      | สร้าง Project        |
| 25  | project/page              | `/api/v1/timesheet/project/delete`             | DELETE | Session      | ลบ Project           |
| 26  | project/page              | `/api/v1/timesheet/project/color`              | PUT    | Session      | เปลี่ยนสี            |
| 27  | project/page              | `/api/v1/timesheet/project/stats`              | GET    | Session      | สถิติ Project        |
| 28  | project/page              | `/api/v1/timesheet/project/sub-project/search` | GET    | Session      | ค้นหา Sub-Project    |

### 8.2 Backend → External Service Interface Registry

| #   | Source (API Route)             | Target Service       | Protocol   | Trigger                |
| --- | ------------------------------ | -------------------- | ---------- | ---------------------- |
| 1   | `/overtime/create`             | Nodemailer SMTP      | SMTP/TLS   | สร้าง OT ใหม่          |
| 2   | `/overtime/change-status`      | Nodemailer SMTP      | SMTP/TLS   | เปลี่ยนสถานะ OT        |
| 3   | `/overtime/send-email`         | Nodemailer SMTP      | SMTP/TLS   | แจ้งเตือน Manual       |
| 4   | `/overtime/send-email-bulk`    | Nodemailer SMTP      | SMTP/TLS   | แจ้งเตือนหมู่          |
| 5   | `/report/daily-notify`         | Nodemailer SMTP      | SMTP/TLS   | รายงานรายวัน           |
| 6   | `/report/employee-notify`      | Nodemailer SMTP      | SMTP/TLS   | แจ้งพนักงานหมู่        |
| 7   | `/report/employee-notify-one`  | Nodemailer SMTP      | SMTP/TLS   | แจ้งพนักงานรายบุคคล    |
| 8   | `/excel/template_4/send-email` | Nodemailer SMTP      | SMTP/TLS   | ส่ง Excel ทาง Email    |
| 9   | `/entry/automate-fill`         | Google Gemini API    | HTTPS/REST | AI Fill engine=gemini  |
| 10  | `/entry/automate-fill`         | OpenAI ChatGPT       | HTTPS/REST | AI Fill engine=chatgpt |
| 11  | `/ai-description`              | Google Gemini API    | HTTPS/REST | สร้างคำอธิบาย          |
| 12  | `/migration/automate-fill`     | Google Gemini API    | HTTPS/REST | AI ช่วยนำเข้า          |
| 13  | `/overtime/upload-images`      | Huawei OBS           | HTTPS/S3   | อัปโหลดรูปหลักฐาน      |
| 14  | `/overtime/read`               | Huawei OBS via proxy | HTTPS      | แสดงรูปใน Frontend     |

### 8.3 Backend → Database Interface Registry

| #   | API Group              | ORM Instance    | Database   | Operation                            |
| --- | ---------------------- | --------------- | ---------- | ------------------------------------ |
| 1   | entry/\*               | PrismaTimesheet | PostgreSQL | CRUD timesheet_entry                 |
| 2   | overtime/\*            | PrismaTimesheet | PostgreSQL | CRUD timesheet_overtime_requests     |
| 3   | overtime/\*            | PrismaTimesheet | PostgreSQL | CRUD timesheet_overtime_descriptions |
| 4   | overtime/change-status | PrismaTimesheet | PostgreSQL | INSERT overtime_status_log           |
| 5   | overtime/upload-images | PrismaTimesheet | PostgreSQL | UPDATE proof JSON field              |
| 6   | project/\*             | PrismaTimesheet | PostgreSQL | CRUD project, feature                |
| 7   | project/sub-project    | PrismaTimesheet | PostgreSQL | CRUD feature, project_assignee       |
| 8   | department/list        | PrismaTimesheet | PostgreSQL | READ departments                     |
| 9   | find-ranking           | PrismaTimesheet | PostgreSQL | READ timesheet_entry aggregate       |
| 10  | my-work                | PrismaTimesheet | PostgreSQL | READ project_assignee + feature      |
| 11  | report/\*              | PrismaTimesheet | PostgreSQL | READ complex aggregations            |
| 12  | migration/\*           | PrismaTimesheet | PostgreSQL | BULK INSERT / READ                   |
| 13  | user lookup            | prisma default  | SQL Server | READ userList reference              |

---

## ภาคผนวก · ผังสรุปการเชื่อมโยงทั้งหมด (Master Interface Summary)

**Diagram A.1 — Client → Next.js Layer**

```mermaid
flowchart TD
    BROWSER["User Interface\nChrome / Safari / Mobile Browser"]
    subgraph PAGES["FRONTEND PAGES /timesheet/*"]
        FE["entry / all / overtime / project / report\nState: Zustand + Redux Toolkit\nHTTP: callApiService Axios"]
    end
    BROWSER -->|HTTPS / TLS 1.3| FE
```

**Diagram A.2 — API Routes → Databases**

```mermaid
flowchart TD
    FE["Frontend Pages"]
    subgraph APIROUTES["API ROUTES /api/v1/timesheet/*"]
        PIPELINE["Validate Zod\nAuth NextAuth\nService Layer\nORM Prisma\nResponse Helpers"]
    end
    PG[("PostgreSQL\nPrismaTimesheet Named Export")]
    MSSQL[("SQL Server\nprisma Default Export")]
    FE -->|Internal HTTP| PIPELINE
    PIPELINE --> PG
    PIPELINE -->|Reference Only| MSSQL
```

**Diagram A.3 — API Routes → External Services**

```mermaid
flowchart TD
    PIPELINE["API Routes /api/v1/timesheet/*"]
    GEM["Google Gemini API\nOpenAI API\nAI Features"]
    SMTP["Nodemailer SMTP\nEmail Notifications"]
    OBS["Huawei OBS\nObject Storage"]
    PIPELINE --> GEM
    PIPELINE --> SMTP
    PIPELINE --> OBS
```

### สรุปจำนวน Interface

| ประเภท Interface                       | จำนวน  |
| -------------------------------------- | ------ |
| Frontend → Backend (API Calls)         | 28     |
| Backend → External Services (Outbound) | 14     |
| Backend → Database (ORM Queries)       | 13     |
| Database → Database (Cross-reference)  | 1      |
| **รวมทั้งหมด**                         | **56** |

---

> **Document Control**
>
> | รายการ              | รายละเอียด                                                    |
> | ------------------- | ------------------------------------------------------------- |
> | ผู้จัดทำ            | Senior Full-Stack Developer, SchoolBright                     |
> | วันที่จัดทำ         | 22 เมษายน พ.ศ. 2569                                           |
> | เวอร์ชันเอกสาร      | 1.1.0 (Mermaid Diagrams)                                      |
> | อ้างอิงจาก          | Source Code v2.4.45, API Routes, Service Layer, Prisma Schema |
> | ระดับความลับ        | INTERNAL — FOR AUDITOR USE ONLY                               |
> | เอกสารที่เกี่ยวข้อง | `_doc/timesheet/application-list.md`                          |

---

_เอกสารนี้สร้างจาก Source Code จริงของระบบ SchoolBright Timesheet Management System_
_สงวนสิทธิ์ — SchoolBright Co., Ltd._
