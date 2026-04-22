# APPLICATION LIST REPORT

## Timesheet Management System

---

> **Organization:** SchoolBright Co., Ltd.
> **System Scope:** Timesheet Management System (TMS)
> **Document Version:** 2.4.45
> **Prepared Date:** April 22, 2026
> **Classification:** INTERNAL — FOR AUDITOR USE ONLY
> **Target Path:** `_doc/timesheet/en-application-list.md`

---

## Table of Contents

| Section | Topic                        | Ref |
| ------- | ---------------------------- | --- |
| 1       | System Overview              | §1  |
| 2       | System Architecture Diagram  | §2  |
| 3       | Application Inventory        | §3  |
| 4       | Application Details          | §4  |
| 5       | Database Schema              | §5  |
| 6       | Data Flow Diagram            | §6  |
| 7       | Infrastructure Specification | §7  |
| 8       | Integration Map              | §8  |

---

## §1 · System Overview

The Timesheet Management System (TMS) is an internal back-office platform developed by SchoolBright to support daily work-hour logging, overtime request management, and project progress tracking for all internal personnel.

| Item                | Details                                    |
| ------------------- | ------------------------------------------ |
| System Name         | Timesheet Management System (TMS)          |
| System Code         | SB-TMS                                     |
| System Owner        | SchoolBright Co., Ltd.                     |
| System Type         | Internal Back-office Web Application       |
| Primary User Groups | Employees, Managers, System Administrators |
| Go-Live Date        | 2023                                       |
| Current Status      | ACTIVE — Production                        |
| Current Version     | v2.4.45                                    |

---

## §2 · System Architecture Diagram

### 2.1 High-Level Architecture

**Diagram 2.1a — System Layers**

```mermaid
flowchart TB
    subgraph ClientLayer ["CLIENT LAYER"]
        W["Web Browser"]
        M["Mobile Browser"]
        L["LINE App"]
    end

    subgraph AppLayer ["APPLICATION LAYER — Next.js 16"]
        subgraph FE ["Frontend (src/app/timesheet)"]
            RSC["Server Components RSC/SSR"]
            CC["Client Components React 19"]
        end
        subgraph BE ["Backend API (/api/v1/timesheet)"]
            API["API Routes"]
        end
        Auth["NextAuth v5"]
    end

    subgraph DataLayer ["DATA LAYER"]
        PG[("PostgreSQL — Timesheet DB")]
        SQL[("SQL Server — Main DB")]
    end

    W --> FE
    M --> FE
    L -- "Webhook" --> BE
    FE <--> BE
    BE <--> Auth
    BE -- "Prisma ORM" --> PG
    BE -- "Prisma ORM" --> SQL

    classDef layer fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef client fill:#e1f5fe,stroke:#0288d1;
    classDef app fill:#e8f5e9,stroke:#388e3c;
    classDef data fill:#fff3e0,stroke:#f57c00;
    class ClientLayer,AppLayer,DataLayer layer;
    class W,M,L client;
    class RSC,CC,API,Auth app;
    class PG,SQL data;
```

**Diagram 2.1b — External Service Integrations**

```mermaid
flowchart TB
    BE["Backend API\n/api/v1/timesheet/*"]

    BE --> Gemini["Google Gemini API\nAI Auto-fill / Description"]
    BE --> OpenAI["OpenAI ChatGPT API\nAI Auto-fill"]
    BE --> LineAPI["LINE Messaging API\nPush Notifications"]
    BE --> SMTP["Nodemailer SMTP\nEmail Notifications"]
    BE --> OBS["Huawei OBS\nFile Storage"]

    classDef ext fill:#f3e5f5,stroke:#7b1fa2;
    classDef be fill:#e8f5e9,stroke:#388e3c;
    class Gemini,OpenAI,LineAPI,SMTP,OBS ext;
    class BE be;
```

### 2.2 Directory Structure

```text
src/
├── app/
│   ├── timesheet/                     ← Frontend (Pages / UI Components)
│   │   ├── layout.tsx                 ← Shared Layout
│   │   ├── entry/                     ← [APP-01] Personal Timesheet Entry
│   │   ├── all/                       ← [APP-02] Organization-wide Overview
│   │   ├── overtime/                  ← [APP-03] Overtime Management
│   │   └── project/                   ← [APP-04] Project Management
│   │
│   └── api/v1/timesheet/              ← Backend (API Routes / Controllers)
│       ├── entry/                     ← [API-01] Entry Management
│       ├── overtime/                  ← [API-02] Overtime Management
│       ├── project/                   ← [API-03] Project Management
│       ├── report/                    ← [API-04] Reports & Analytics
│       ├── excel/                     ← [API-05] Excel Export
│       ├── migration/                 ← [API-06] Data Migration
│       └── ai-description/            ← [API-07] AI Assistant
│
└── prisma/timesheet/
    └── schema.prisma                  ← Database Schema (PostgreSQL)
```

---

## §3 · Application Inventory

### 3.1 Application Summary Table

| Code   | Application Name                | Type          | Path                                        | Status |
| ------ | ------------------------------- | ------------- | ------------------------------------------- | ------ |
| APP-01 | Personal Timesheet Entry        | Frontend Page | `/timesheet/entry`                          | ACTIVE |
| APP-02 | Organization Timesheet Overview | Frontend Page | `/timesheet/all`                            | ACTIVE |
| APP-03 | Overtime Management System      | Frontend Page | `/timesheet/overtime`                       | ACTIVE |
| APP-04 | Project Management System       | Frontend Page | `/timesheet/project`                        | ACTIVE |
| APP-05 | Timeline Report                 | Sub-Page      | `/timesheet/all/report/timeline`            | ACTIVE |
| APP-06 | Capturable Assets Report        | Sub-Page      | `/timesheet/all/report/capturable`          | ACTIVE |
| APP-07 | Personnel Data Migration        | Sub-Page      | `/timesheet/all/report/migrate-person`      | ACTIVE |
| APP-08 | Project Data Migration          | Sub-Page      | `/timesheet/all/report/migrate-project`     | ACTIVE |
| API-01 | Entry Management API            | Backend API   | `/api/v1/timesheet/entry/*`                 | ACTIVE |
| API-02 | Overtime Management API         | Backend API   | `/api/v1/timesheet/overtime/*`              | ACTIVE |
| API-03 | Project Management API          | Backend API   | `/api/v1/timesheet/project/*`               | ACTIVE |
| API-04 | Report & Analytics API          | Backend API   | `/api/v1/timesheet/report/*`                | ACTIVE |
| API-05 | Excel Export API                | Backend API   | `/api/v1/timesheet/excel/*`                 | ACTIVE |
| API-06 | Migration API                   | Backend API   | `/api/v1/timesheet/migration/*`             | ACTIVE |
| API-07 | AI Description API              | Backend API   | `/api/v1/timesheet/ai-description`          | ACTIVE |
| API-08 | Department List API             | Backend API   | `/api/v1/timesheet/department/list`         | ACTIVE |
| API-09 | Timeline API                    | Backend API   | `/api/v1/timesheet/timeline`                | ACTIVE |
| API-10 | Calculate Summary API           | Backend API   | `/api/v1/timesheet/calculate-summary-month` | ACTIVE |
| API-11 | Find Ranking API                | Backend API   | `/api/v1/timesheet/find-ranking`            | ACTIVE |
| API-12 | My Work API                     | Backend API   | `/api/v1/timesheet/my-work`                 | ACTIVE |

---

## §4 · Application Details

---

### APP-01 · Personal Timesheet Entry

> **Path:** `src/app/timesheet/entry` | **Type:** Client Component (React 19) | **Auth:** Required

**Responsibilities:**

- **Daily Work-hour Logging:** Employees record hours worked per project and feature.
- **Calendar View:** Displays a visual calendar-based overview of logged entries.
- **AI-assisted Entry:** Uses Gemini/ChatGPT to auto-generate work descriptions.

**Primary API Calls:**

- `POST /api/v1/timesheet/entry/insert` — create or update an entry
- `GET /api/v1/timesheet/entry/read` — retrieve existing entries
- `POST /api/v1/timesheet/ai-description` — AI description generator

---

### APP-02 · Organization Timesheet Overview

> **Path:** `src/app/timesheet/all` | **Type:** Client Component (React 19) | **Auth:** Required + Permission Check

**Responsibilities:**

- **Organization-wide Dashboard:** Displays work-hour statistics for all employees.
- **Summary Cards & Auto-Refresh:** Aggregated KPI cards that refresh automatically.
- **Bulk Notification:** Sends alerts to employees who have not yet logged their hours via LINE or Email.

**Sub-Systems:**

- **APP-05:** Timeline Report (`/report/timeline`)
- **APP-06:** Capturable Assets Report (`/report/capturable`)

---

### APP-03 · Overtime Management System

> **Path:** `src/app/timesheet/overtime` | **Type:** Client Component (React 19) | **Auth:** Required + Permission + Role Check

**Responsibilities:**

- **OT Request Submission:** Employees submit overtime requests with details and proof attachments.
- **Approve / Reject OT:** Authorized users can process requests individually or in batch.
- **Overtime Pay Calculator:** Calculates compensation and supports PDF/Excel export.

**Special Authorization:**

> **BYPASS_USER_ID = "49"**
> User ID 49 is the sole authorized OT approver. This constraint is enforced on both the frontend and the API route (`/api/v1/timesheet/overtime/change-status`).

---

### APP-04 · Project Management System

> **Path:** `src/app/timesheet/project` | **Type:** Client Component (React 19) | **Auth:** Required + Permission Check

**Responsibilities:**

- **Project & Sub-Project Management:** Create, edit, delete, set colors, and manage features.
- **Member Assignment:** Assign team members to projects.
- **Project Timeline:** View Gantt-style timeline and actual hours consumed per project.

---

## §5 · Database Schema

### 5.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER {
        int id PK
        string username UK
        string employee_code UK
        string status
        int position_id FK
        int department_id FK
        int role_id FK
    }
    DEPARTMENT {
        int id PK
        string name_th
        boolean is_active
    }
    POSITION {
        int id PK
        string name_th
        boolean is_active
    }
    ROLE {
        int id PK
        string role_name
    }
    TIMESHEET_ENTRY {
        int id PK
        int project_id FK
        int feature_id FK
        date date
        float hours
        string description
        string status
        int created_by FK
    }
    TIMESHEET_OVERTIME_REQUESTS {
        int id PK
        date request_date
        string status
        int requester_id FK
        int created_by FK
    }
    TIMESHEET_OVERTIME_DESCRIPTIONS {
        int id PK
        int overtime_id FK
        date date
        float duration
        string description
        json proof
    }
    PROJECT {
        int id PK
        string name
        string status
        string color_hex
    }
    FEATURE {
        int id PK
        int project_id FK
        string name
        string status
    }
    PROJECT_ASSIGNEE {
        int id PK
        int project_id FK
        int sub_project_id FK
        int user_id FK
    }

    USER }o--|| DEPARTMENT : "belongs to"
    USER }o--|| POSITION : "holds"
    USER }o--|| ROLE : "assigned"
    USER ||--o{ TIMESHEET_ENTRY : "creates"
    TIMESHEET_ENTRY }o--|| PROJECT : "logs against"
    TIMESHEET_ENTRY }o--|| FEATURE : "logs against"
    USER ||--o{ TIMESHEET_OVERTIME_REQUESTS : "requests"
    TIMESHEET_OVERTIME_REQUESTS ||--o{ TIMESHEET_OVERTIME_DESCRIPTIONS : "contains"
    PROJECT ||--o{ FEATURE : "has"
    PROJECT ||--o{ PROJECT_ASSIGNEE : "assigned to"
    PROJECT_ASSIGNEE }o--|| USER : "assigned"
```

### 5.2 Database Tables

| Table Name                        | Description                     | Index Count |
| --------------------------------- | ------------------------------- | ----------- |
| `user`                            | User and employee data          | 4           |
| `departments`, `positions`        | Department and position data    | —           |
| `roles`, `permissions`            | Role and access permission data | —           |
| `project`, `feature`              | Project and feature data        | —           |
| `project_assignee`                | Project member assignments      | —           |
| `timesheet_entry`                 | Work-hour log entries           | 4           |
| `timesheet_overtime_requests`     | Overtime requests               | 3           |
| `timesheet_overtime_descriptions` | Overtime detail descriptions    | 2           |

---

## §6 · Data Flow Diagram

### 6.1 Timesheet Entry Flow

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Employee
    participant UI as Frontend (Entry UI)
    participant API as Backend API (/entry)
    participant DB as PostgreSQL

    Employee->>UI: Open timesheet entry page
    UI->>API: GET /read (fetch current entries)
    API->>DB: SELECT from timesheet_entry
    DB-->>API: Return dataset
    API-->>UI: Response data
    UI-->>Employee: Render table / calendar

    Employee->>UI: Fill in data and click Save
    UI->>API: POST /insert (payload)
    API->>DB: INSERT into timesheet_entry
    DB-->>API: Success
    API-->>UI: 201 Created
    UI-->>Employee: Toast "Saved successfully"
```

### 6.2 Overtime Request & Approval Flow

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Employee
    actor Approver as Approver (ID=49)
    participant UI as Frontend (OT)
    participant API as Backend API (/overtime)
    participant Mail as Nodemailer / LINE
    participant DB as PostgreSQL

    Employee->>UI: Submit OT request with proof
    UI->>API: POST /create
    API->>DB: INSERT overtime_requests
    API->>Mail: POST /send-email
    Mail-->>Approver: Notification of new request
    API-->>UI: Created successfully
    UI-->>Employee: Show status PENDING

    Approver->>UI: Review details and click Approve / Reject
    UI->>API: POST /change-status
    API->>API: Verify authorization (user_id === 49 or admin_id === 117)
    API->>DB: UPDATE status & INSERT status_log
    API->>Mail: POST /send-email
    Mail-->>Employee: Notify of decision
    API-->>UI: Updated successfully
    UI-->>Approver: Toast success
```

### 6.3 Export Flow

```mermaid
sequenceDiagram
    actor User as User
    participant UI as Frontend
    participant API as Backend API (/excel)
    participant FileSys as ExcelJS / jsPDF
    participant EmailSys as Email Service

    User->>UI: Choose Export and configure filters
    UI->>API: POST /excel/template_N
    API->>API: Query data from database
    API->>FileSys: Build and format file (buffer)
    FileSys-->>API: File buffer

    alt User selects Download
        API-->>UI: Send file buffer
        UI-->>User: Browser triggers download
    else User selects Send by Email
        API->>EmailSys: Attach file and send email
        EmailSys-->>User: Email received with attachment
        API-->>UI: Response success
        UI-->>User: Toast "Email sent successfully"
    end
```

---

## §7 · Infrastructure Specification

### 7.1 Technology Stack Summary

```mermaid
mindmap
  root((Tech Stack))
    Frontend
      React 19
      Ant Design v5
      Framer Motion
      Zustand
    Backend
      Next.js 16 App Router
      Node.js 22 LTS
      Prisma ORM
      NextAuth v5
    Databases
      PostgreSQL Primary
      SQL Server Secondary
    External Services
      Google Gemini
      OpenAI ChatGPT
      LINE Messaging
      Nodemailer
      Huawei OBS
    Tooling
      TypeScript 5
      Bun
      Turbopack
      Docker / K8s
```

### 7.2 Application & Database Details

| Item                    | Details                                                |
| :---------------------- | :----------------------------------------------------- |
| **Framework / Runtime** | Next.js v16.2.4 (App Router) / Node.js 22.9.0 LTS      |
| **Primary Database**    | PostgreSQL (Timesheet Management DB) via Prisma v6.8.2 |
| **Secondary Database**  | Microsoft SQL Server (SchoolBright Main DB)            |
| **Package Manager**     | Bun                                                    |
| **Storage**             | Huawei OBS (esdk-obs-nodejs 3.26.2)                    |
| **Deployment Target**   | Kubernetes (Cloud-based / On-Premise Hybrid)           |

---

## §8 · Integration Map

### 8.1 System Integration Overview

**Diagram 8.1a — Frontend → Backend API**

```mermaid
flowchart TD
    subgraph Front ["Frontend Pages"]
        A1["APP-01: Personal Entry"]
        A2["APP-02: Organization Overview"]
        A3["APP-03: Overtime Management"]
        A4["APP-04: Project Management"]
    end
    subgraph Back ["Backend APIs"]
        API1["API-01: Entry API"]
        API2["API-02: Overtime API"]
        API3["API-03: Project API"]
        API4["API-04: Report & Analytics"]
        API5["API-05: Excel Export"]
    end
    A1 --> API1
    A2 --> API1
    A2 --> API4
    A2 --> API5
    A3 --> API2
    A4 --> API3
    A4 --> API5
```

**Diagram 8.1b — Backend API → Database**

```mermaid
flowchart TD
    Back["Backend APIs\n/api/v1/timesheet/*"]
    PG[("PostgreSQL\nTimesheet Primary")]
    Back --> PG
```

**Diagram 8.1c — Backend API → External Services**

```mermaid
flowchart TD
    API1["API-01: Entry API"]
    API2["API-02: Overtime API"]
    API4["API-04: Report & Analytics"]
    API5["API-05: Excel Export"]
    AI["AI — Gemini / OpenAI"]
    Mail["Nodemailer"]
    Line["LINE Messaging"]
    Storage["Huawei OBS"]
    API1 -.-> AI
    API2 -.-> Mail
    API2 -.-> Line
    API2 -.-> Storage
    API4 -.-> Mail
    API4 -.-> Line
    API5 -.-> Mail
```

### 8.2 Authentication & Authorization Flow

```mermaid
flowchart TD
    Start([User Request]) --> NextAuth{"NextAuth v5\nSession Check"}
    NextAuth -- "Fail" --> R1["Redirect to Login"]
    NextAuth -- "Pass" --> Perm{"Permission Check\n(p_code)"}
    Perm -- "Fail" --> F1["403 Forbidden"]
    Perm -- "Pass" --> Super{"Super Admin Check"}
    Super -- "admin_id === 117" --> Bypass["Bypass All Checks"]
    Super -- "Normal User" --> OTCheck{"OT Approver\nSpecial Check"}
    OTCheck -- "Endpoint: change-status" --> User49{"Is user_id === '49'?"}
    User49 -- "No" --> F1
    User49 -- "Yes" --> Allow([Process Request])
    OTCheck -- "Other Endpoints" --> Allow
    Bypass --> Allow
```

---

## Appendix

### A · Key Environment Variables

| Variable                              | Purpose                      | Sensitivity |
| ------------------------------------- | ---------------------------- | ----------- |
| `DATABASE_TIMESHEET_URL`              | PostgreSQL Connection String | CRITICAL    |
| `DATABASE_URL`                        | SQL Server Connection String | CRITICAL    |
| `NEXTAUTH_SECRET`                     | NextAuth Signing Key         | CRITICAL    |
| `GEMINI_API_KEY`                      | Google Gemini API Key        | SECRET      |
| `OPENAI_API_KEY`                      | OpenAI API Key               | SECRET      |
| `LINE_CHANNEL_ACCESS_TOKEN`           | LINE Messaging API Token     | SECRET      |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Email Service Configuration  | SECRET      |
| `OBS_*`                               | Huawei OBS Storage Keys      | SECRET      |

---

> **Document Control**
>
> | Item             | Details                                               |
> | ---------------- | ----------------------------------------------------- |
> | Prepared by      | Senior Full-Stack Developer, SchoolBright             |
> | Prepared Date    | April 22, 2026                                        |
> | Document Version | 1.0.0                                                 |
> | Source Reference | Source Code v2.4.45, `prisma/timesheet/schema.prisma` |
> | Classification   | INTERNAL — FOR AUDITOR USE ONLY                       |
> | Related Document | `_doc/timesheet/application-list.md` (Thai version)   |

---

_This document is generated from the actual source code of the SchoolBright Timesheet Management System._
_All rights reserved — SchoolBright Co., Ltd._
