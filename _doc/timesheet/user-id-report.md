# รายละเอียดรหัสผู้ใช้งานในระบบ (User ID Report)

## ระบบบริหารจัดการเวลาทำงาน — Timesheet Management System

> **Organization:** SchoolBright Co., Ltd.
> **System Scope:** Timesheet Management System (TMS) — เฉพาะระบบ Timesheet เท่านั้น
> **Document Version:** 2.4.45
> **Prepared Date:** 22 เมษายน พ.ศ. 2569
> **Classification:** INTERNAL — FOR AUDITOR USE ONLY

## สารบัญ (Table of Contents)

| หมวด | รายการ                                             |
| ---- | -------------------------------------------------- |
| 1    | ภาพรวมโครงสร้างผู้ใช้งาน (User Structure Overview) |
| 2    | โมเดลข้อมูลผู้ใช้งาน (User Data Model)             |
| 3    | สถานะรหัสผู้ใช้งาน (User Status Definition)        |
| 4    | กลุ่มผู้ใช้งานและสิทธิ์ (User Groups & Roles)      |
| 5    | บัญชีผู้ใช้งานพิเศษ (Special System Accounts)      |
| 6    | วงจรชีวิตรหัสผู้ใช้งาน (User Account Lifecycle)    |
| 7    | การ Login และ Session (Authentication Tracking)    |
| 8    | รายการฟิลด์ข้อมูลผู้ใช้งาน (User Field Registry)   |

## 1. ภาพรวมโครงสร้างผู้ใช้งาน (User Structure Overview)

**Diagram 1.1 — ความสัมพันธ์ระหว่าง User กับ Role และ Permission**

```mermaid
flowchart TD
    subgraph USER_TABLE["ตาราง user (PostgreSQL)"]
        U["User Record\nid (PK)\nusername (UNIQUE)\nadmin_id (UNIQUE)\nemployee_code (UNIQUE)\nstatus\nrole_id (FK)\ndepartment_id (FK)\nposition_id (FK)"]
    end

    subgraph ROLE_TABLE["ตาราง roles"]
        R["Role\nid (PK)\nrole_name (UNIQUE)\nis_active\nis_deleted"]
    end

    subgraph PERM_TABLE["ตาราง permissions"]
        P["Permission\nid (PK)\np_code (UNIQUE)\nname_th\ndescription"]
    end

    subgraph RP_TABLE["ตาราง role_permissions"]
        RP["RolePermission\nrole_id (FK)\npermission_id (FK)\nassigned_at\nassigned_by"]
    end

    subgraph DEPT["ตาราง departments"]
        D["Department\nid (PK)\nname_th\nis_active"]
    end

    subgraph POS["ตาราง positions"]
        PO["Position\nid (PK)\nname_th\nis_active"]
    end

    U -->|role_id FK| R
    U -->|department_id FK| D
    U -->|position_id FK| PO
    R -->|ผ่าน role_permissions| RP
    RP -->|permission_id FK| P
```

**Diagram 1.2 — ระบบ Identity ของ User**

```mermaid
flowchart TD
    subgraph IDENTITY["ระบบ Identity ของ User"]
        ID1["id\nPrimary Key\nAuto Increment\nใช้ภายในระบบ TMS"]
        ID2["admin_id\nUnique Integer\nรหัสเชื่อมต่อกับ Main DB (SQL Server)\nSchoolBright ERP"]
        ID3["username\nUnique String\nใช้ Login เข้าระบบ (Case-insensitive)"]
        ID4["employee_code\nUnique String\nรหัสพนักงาน (Case-insensitive)"]
        ID5["email\nอีเมลพนักงาน\nใช้ Login ได้ (Case-insensitive)"]
    end

    LOGIN["การ Login ระบบ TMS"]
    ID3 --> LOGIN
    ID4 --> LOGIN
    ID5 --> LOGIN
```

## 2. โมเดลข้อมูลผู้ใช้งาน (User Data Model)

**Diagram 2.1 — ฟิลด์ที่เกี่ยวข้องกับ User Identity และ Status**

```mermaid
flowchart TD
    subgraph IDENTITY_FIELDS["Identity Fields"]
        F1["id — INT PK Auto Increment"]
        F2["username — VARCHAR UNIQUE NOT NULL"]
        F3["admin_id — INT UNIQUE NOT NULL"]
        F4["employee_code — VARCHAR UNIQUE NULLABLE"]
        F5["email — VARCHAR NULLABLE"]
    end

    subgraph STATUS_FIELDS["Status & Lifecycle Fields"]
        F6["status — VARCHAR DEFAULT ACTIVE\nค่าที่เป็นไปได้: ACTIVE, INACTIVE, LOCKED"]
        F7["is_deleted — BOOLEAN DEFAULT false\nSoft Delete Flag"]
        F8["joined_date — DATETIME NULLABLE\nวันที่เริ่มงาน"]
        F9["resigned_date — DATETIME NULLABLE\nวันที่ลาออก"]
        F10["created_at — DATETIME DEFAULT NOW\nวันที่สร้างบัญชี"]
        F11["deleted_at — DATETIME NULLABLE\nวันที่ลบ (Disable) บัญชี"]
        F12["updated_at — DATETIME AUTO UPDATE\nวันที่แก้ไขล่าสุด"]
    end

    subgraph LOGIN_FIELDS["Authentication Tracking Fields"]
        F13["last_login — DATETIME NULLABLE\nวันที่เข้าใช้งานล่าสุด"]
        F14["failed_login_attempts — INT DEFAULT 0\nจำนวนครั้งที่ Login ผิด"]
        F15["password — VARCHAR\nรหัสผ่านเข้ารหัสด้วย bcryptjs"]
        F16["refresh_token — VARCHAR NULLABLE\nToken สำหรับ Refresh Session"]
    end

    subgraph PROFILE_FIELDS["Profile Fields"]
        F17["firstname_th, lastname_th — ชื่อ-นามสกุลภาษาไทย"]
        F18["firstname_en, lastname_en — ชื่อ-นามสกุลภาษาอังกฤษ"]
        F19["nickname — ชื่อเล่น"]
        F20["phone — เบอร์โทรศัพท์"]
        F21["employment_type — FULL_TIME / PART_TIME"]
        F22["profile_image_path — ที่อยู่รูปโปรไฟล์ (Huawei OBS)"]
    end
```

## 3. สถานะรหัสผู้ใช้งาน (User Status Definition)

| สถานะ               | ค่าในฐานข้อมูล                                       | ความหมาย                       | Login ได้หรือไม่                  |
| ------------------- | ---------------------------------------------------- | ------------------------------ | --------------------------------- |
| ใช้งานได้           | `status = "ACTIVE"` และ `is_deleted = false`         | บัญชีปกติ พร้อมใช้งาน          | ได้                               |
| ถูกล็อคชั่วคราว     | `status = "ACTIVE"` แต่ `failed_login_attempts >= 5` | ล็อคอัตโนมัติ 15 นาที          | ไม่ได้ (Auto-unlock หลัง 15 นาที) |
| ไม่ได้ใช้งาน        | `status = "INACTIVE"`                                | ถูกระงับโดย Admin              | ไม่ได้                            |
| ถูกลบ (Soft Delete) | `is_deleted = true` และ `deleted_at != null`         | Soft Delete ข้อมูลยังอยู่ใน DB | ไม่ได้                            |
| ลาออก               | `resigned_date != null`                              | มีวันที่ลาออกบันทึกไว้         | ขึ้นอยู่กับ status                |

**Diagram 3.1 — วงจรสถานะ User Account**

```mermaid
flowchart TD
    CREATE["Admin สร้างบัญชีใหม่\ncreated_at = NOW()"]
    ACTIVE["สถานะ: ACTIVE\nLogin ได้ปกติ"]
    LOCKED["สถานะ: ล็อคชั่วคราว\nfailed_login_attempts >= 5\nAuto-unlock หลัง 15 นาที"]
    INACTIVE["สถานะ: INACTIVE\nAdmin ระงับการใช้งาน"]
    DELETED["Soft Deleted\nis_deleted = true\ndeleted_at = NOW()"]

    CREATE --> ACTIVE
    ACTIVE -->|Login ผิด 5 ครั้ง| LOCKED
    LOCKED -->|ผ่าน 15 นาที (Auto-unlock)| ACTIVE
    ACTIVE -->|Admin ระงับ| INACTIVE
    INACTIVE -->|Admin เปิดใช้งาน| ACTIVE
    ACTIVE -->|Admin ลบบัญชี| DELETED
    INACTIVE -->|Admin ลบบัญชี| DELETED
```

## 4. กลุ่มผู้ใช้งานและสิทธิ์ (User Groups & Roles)

**Diagram 4.1 — โครงสร้าง Role-Based Access Control**

```mermaid
flowchart TD
    subgraph ROLES["Role Groups (ตาราง roles)"]
        R1["ADMIN\nผู้ดูแลระบบ TMS\nสิทธิ์สูงสุด (ยกเว้น Super Admin)"]
        R2["MANAGER\nผู้จัดการ\nดูภาพรวม สั่งรายงาน แจ้งเตือน"]
        R3["EMPLOYEE\nพนักงานทั่วไป\nบันทึกเวลา ยื่นขอ OT"]
        R4["VIEWER\nผู้ดูรายงาน\nดูข้อมูลได้อย่างเดียว"]
    end

    subgraph SPECIAL["Special Hardcoded Accounts"]
        S1["admin_id = 117\nSuper Admin\nBypass ทุก Permission Check"]
        S2["user_id = 49\nSole OT Approver\nอนุมัติ/ปฏิเสธ OT ได้เพียงผู้เดียว"]
    end

    subgraph PERMS["Permission Codes (ตัวอย่าง)"]
        P1["TIMESHEET.ENTRY.CREATE"]
        P2["TIMESHEET.ENTRY.READ"]
        P3["TIMESHEET.OT.APPROVE"]
        P4["TIMESHEET.OT.CREATE"]
        P5["TIMESHEET.REPORT.READ"]
        P6["TIMESHEET.PROJECT.MANAGE"]
        P7["TIMESHEET.ADMIN.MANAGE"]
    end

    R1 --> P1
    R1 --> P2
    R1 --> P3
    R1 --> P4
    R1 --> P5
    R1 --> P6
    R1 --> P7
    R2 --> P2
    R2 --> P5
    R2 --> P6
    R3 --> P1
    R3 --> P2
    R3 --> P4
    R4 --> P2
    R4 --> P5
```

**Diagram 4.2 — Permission Pattern**

```mermaid
flowchart TD
    PATTERN["รูปแบบ Permission Code\nmodule.resource.action"]
    MOD["module\nTIMESHEET"]
    RES["resource\nENTRY, OT, PROJECT\nREPORT, ADMIN"]
    ACT["action\nCREATE, READ\nUPDATE, DELETE\nAPPROVE, MANAGE"]
    EX1["TIMESHEET.ENTRY.CREATE"]
    EX2["TIMESHEET.OT.APPROVE"]
    EX3["TIMESHEET.REPORT.READ"]

    PATTERN --> MOD
    PATTERN --> RES
    PATTERN --> ACT
    MOD --> EX1
    RES --> EX2
    ACT --> EX3
```

## 5. บัญชีผู้ใช้งานพิเศษ (Special System Accounts)

| รหัส             | ประเภท           | เงื่อนไขในโค้ด                  | สิทธิ์พิเศษ                                           | หมายเหตุ                                                                                     |
| ---------------- | ---------------- | ------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `admin_id = 117` | Super Admin      | `session.user.admin_id === 117` | Bypass ทุก Permission Check ทั้ง Frontend และ Backend | ห้ามลบหรือแก้ไข hardcoded value นี้                                                          |
| `user_id = 49`   | Sole OT Approver | `session.user.id === "49"`      | อนุมัติ/ปฏิเสธ OT ได้เพียงผู้เดียว                    | ตรวจสอบทั้ง Frontend (`overtime/page.tsx`) และ API Route (`overtime/change-status/route.ts`) |

**Diagram 5.1 — Special Account Authorization Flow**

```mermaid
flowchart TD
    REQ["API Request\nto /api/v1/timesheet/overtime/change-status"]
    SESSION["await auth()\nNextAuth Session Check"]
    NO_AUTH["401 Unauthorized"]
    CHECK_SUPER{"admin_id === 117?"}
    BYPASS["Super Admin\nBypass ทุกการตรวจสอบ\nอนุมัติ OT ได้"]
    CHECK_OT{"user_id === 49?"}
    ALLOW_OT["Sole OT Approver\nอนุมัติ / ปฏิเสธ OT ได้"]
    DENY["403 Forbidden\nไม่มีสิทธิ์อนุมัติ OT"]

    REQ --> SESSION
    SESSION -->|ไม่มี Session| NO_AUTH
    SESSION -->|มี Session| CHECK_SUPER
    CHECK_SUPER -->|ใช่| BYPASS
    CHECK_SUPER -->|ไม่ใช่| CHECK_OT
    CHECK_OT -->|ใช่| ALLOW_OT
    CHECK_OT -->|ไม่ใช่| DENY
```

## 6. วงจรชีวิตรหัสผู้ใช้งาน (User Account Lifecycle)

**Diagram 6.1 — การสร้างและบริหารบัญชี**

```mermaid
flowchart TD
    ADMIN["Admin ระบบ TMS"]
    CREATE["สร้างบัญชีใหม่\nPOST /api/v2/admin/user/create\nกำหนด username, password\nrole_id, department_id, position_id"]
    DB_INSERT["INSERT INTO user\ncreated_at = NOW()\nstatus = ACTIVE\nfailed_login_attempts = 0"]
    ACTIVE_STATE["บัญชีพร้อมใช้งาน\nstatus = ACTIVE"]

    ADMIN --> CREATE
    CREATE --> DB_INSERT
    DB_INSERT --> ACTIVE_STATE
```

**Diagram 6.2 — การระงับและลบบัญชี**

```mermaid
flowchart TD
    ADMIN["Admin ระบบ TMS"]

    DEACTIVATE["ระงับบัญชี\nUPDATE user SET status = INACTIVE"]
    SOFT_DELETE["ลบบัญชี (Soft Delete)\nUPDATE user\nSET is_deleted = true\ndeleted_at = NOW()"]
    RESIGN["บันทึกการลาออก\nUPDATE user\nSET resigned_date = DATE"]

    INACTIVE_STATE["สถานะ: INACTIVE\nLogin ไม่ได้"]
    DELETED_STATE["Soft Deleted\nข้อมูลยังอยู่ใน DB\nใช้งานไม่ได้"]
    RESIGNED_STATE["บันทึกวันลาออก\nข้อมูลประวัติคงอยู่"]

    ADMIN --> DEACTIVATE
    ADMIN --> SOFT_DELETE
    ADMIN --> RESIGN
    DEACTIVATE --> INACTIVE_STATE
    SOFT_DELETE --> DELETED_STATE
    RESIGN --> RESIGNED_STATE
```

## 7. การ Login และ Session (Authentication Tracking)

**Diagram 7.1 — การติดตามการ Login**

```mermaid
flowchart TD
    LOGIN_ATTEMPT["พยายาม Login"]
    FIND_USER["ค้นหา User จาก\nusername หรือ employee_code หรือ email\n(Case-insensitive)"]
    USER_FOUND{"พบ User และ\nis_deleted = false?"}
    NOT_FOUND["ส่งคืน INVALID_CREDENTIALS"]
    CHECK_STATUS{"status = ACTIVE?"}
    LOCKED_OUT["ส่งคืน ACCOUNT_LOCKED_OR_INACTIVE"]
    CHECK_ATTEMPTS{"failed_login_attempts >= 5?"}
    CHECK_TIME{"ผ่านไปน้อยกว่า 15 นาที?"}
    STILL_LOCKED["ส่งคืน MAX_ATTEMPTS_EXCEEDED"]
    VERIFY_PW["ตรวจสอบรหัสผ่าน\nbcryptjs.compare (primary)\nplain-text fallback (legacy)"]
    PW_WRONG["INCREMENT failed_login_attempts\nส่งคืน INVALID_CREDENTIALS"]
    SUCCESS["Reset failed_login_attempts = 0\nUPDATE last_login = NOW()\nสร้าง JWT Session Token"]

    LOGIN_ATTEMPT --> FIND_USER
    FIND_USER --> USER_FOUND
    USER_FOUND -->|ไม่พบ| NOT_FOUND
    USER_FOUND -->|พบ| CHECK_STATUS
    CHECK_STATUS -->|ไม่ ACTIVE| LOCKED_OUT
    CHECK_STATUS -->|ACTIVE| CHECK_ATTEMPTS
    CHECK_ATTEMPTS -->|ไม่เกิน| VERIFY_PW
    CHECK_ATTEMPTS -->|เกิน| CHECK_TIME
    CHECK_TIME -->|ใช่ (ยังล็อคอยู่)| STILL_LOCKED
    CHECK_TIME -->|ไม่ใช่ (หมดเวลา)| VERIFY_PW
    VERIFY_PW -->|ผิด| PW_WRONG
    VERIFY_PW -->|ถูก| SUCCESS
```

**Diagram 7.2 — ข้อมูลใน JWT Session Token**

```mermaid
flowchart TD
    JWT["JWT Session Token\n(HttpOnly Cookie)"]

    subgraph IDENTITY_PAYLOAD["Identity Payload"]
        P1["id — User ID (TMS)"]
        P2["admin_id — Admin ID (ERP)"]
        P3["username — ชื่อผู้ใช้"]
        P4["employee_code — รหัสพนักงาน"]
    end

    subgraph ROLE_PAYLOAD["Role & Permission Payload"]
        P5["role_id — รหัส Role"]
        P6["role_name — ชื่อ Role"]
        P7["permissions[] — รายการ Permission Codes"]
    end

    subgraph PROFILE_PAYLOAD["Profile Payload"]
        P8["firstname_th, lastname_th"]
        P9["department, position"]
        P10["email, phone"]
        P11["employment_type"]
        P12["last_login — วันที่เข้าล่าสุด"]
        P13["joined_date, resigned_date"]
    end

    JWT --> IDENTITY_PAYLOAD
    JWT --> ROLE_PAYLOAD
    JWT --> PROFILE_PAYLOAD
```

## 8. รายการฟิลด์ข้อมูลผู้ใช้งาน (User Field Registry)

| ฟิลด์                   | ประเภทข้อมูล | Constraint          | คำอธิบาย                                   | เกี่ยวข้องกับ Audit    |
| ----------------------- | ------------ | ------------------- | ------------------------------------------ | ---------------------- |
| `id`                    | INT          | PK, Auto Increment  | รหัสผู้ใช้งานภายในระบบ TMS                 | ใช้อ้างอิงภายใน        |
| `username`              | VARCHAR      | UNIQUE, NOT NULL    | ชื่อผู้ใช้สำหรับ Login                     | รหัสผู้ใช้งาน          |
| `admin_id`              | INT          | UNIQUE, NOT NULL    | รหัสเชื่อมต่อ ERP (SQL Server)             | รหัสผู้ใช้ ERP/AD      |
| `employee_code`         | VARCHAR      | UNIQUE, NULLABLE    | รหัสพนักงาน                                | รหัสผู้ใช้งาน          |
| `email`                 | VARCHAR      | NULLABLE            | อีเมลพนักงาน                               | Username/Description   |
| `status`                | VARCHAR      | DEFAULT "ACTIVE"    | ACTIVE / INACTIVE / LOCKED                 | สถานะบัญชี             |
| `is_deleted`            | BOOLEAN      | DEFAULT false       | Soft Delete Flag                           | สถานะบัญชี (Disabled)  |
| `role_id`               | INT (FK)     | FK → roles          | บทบาทของผู้ใช้งาน                          | User Group             |
| `department_id`         | INT (FK)     | FK → departments    | แผนกที่สังกัด                              | User Group             |
| `created_at`            | DATETIME     | DEFAULT NOW()       | วันที่สร้างบัญชี                           | วันที่สร้าง            |
| `deleted_at`            | DATETIME     | NULLABLE            | วันที่ลบ/ปิดบัญชี                          | วันที่ Disable         |
| `last_login`            | DATETIME     | NULLABLE            | วันที่เข้าระบบล่าสุด                       | วันที่เข้าล่าสุด       |
| `updated_at`            | DATETIME     | AUTO UPDATE         | วันที่แก้ไขรหัสผ่านล่าสุด                  | วันที่เปลี่ยน Password |
| `joined_date`           | DATETIME     | NULLABLE            | วันที่เริ่มงาน                             | ข้อมูลเพิ่มเติม        |
| `resigned_date`         | DATETIME     | NULLABLE            | วันที่ลาออก                                | ข้อมูลเพิ่มเติม        |
| `failed_login_attempts` | INT          | DEFAULT 0           | จำนวนครั้ง Login ผิด                       | Security Tracking      |
| `employment_type`       | VARCHAR      | DEFAULT "FULL_TIME" | FULL_TIME / PART_TIME                      | ประเภทการจ้างงาน       |
| `password`              | VARCHAR      | NOT NULL            | bcryptjs hash ($2b) หรือ plain-text legacy | ความปลอดภัย            |

> **หมายเหตุสำหรับ Auditor:**
> ฟิลด์ `updated_at` ถูก Auto-update ทุกครั้งที่มีการแก้ไข record ใดๆ รวมถึงการเปลี่ยนรหัสผ่าน
> ระบบไม่มีตาราง `password_history` โดยเฉพาะ — การติดตามการเปลี่ยนรหัสผ่านใช้ `updated_at` เป็นหลัก

> **Document Control**
>
> | รายการ              | รายละเอียด                                                               |
> | ------------------- | ------------------------------------------------------------------------ |
> | ผู้จัดทำ            | Senior Full-Stack Developer, SchoolBright                                |
> | วันที่จัดทำ         | 22 เมษายน พ.ศ. 2569                                                      |
> | เวอร์ชันเอกสาร      | 1.0.0                                                                    |
> | อ้างอิงจาก          | src/auth.ts, prisma/timesheet/schema.prisma, src/app/api/v1/timesheet/\* |
> | ระดับความลับ        | INTERNAL — FOR AUDITOR USE ONLY                                          |
> | เอกสารที่เกี่ยวข้อง | password-parameter.md, application-list.md                               |

_เอกสารนี้สร้างจาก Source Code จริงของระบบ SchoolBright Timesheet Management System_
_สงวนสิทธิ์ — SchoolBright Co., Ltd._
