# Template 4 Export Implementation Summary

## Overview

Successfully implemented Template 4 export functionality for Timesheet Audit Reports. This feature generates comprehensive Excel reports with an overview sheet and detailed evidence sheets for audit purposes.

## What Was Implemented

### 1. **Redux State Management**

- **File**: `src/stores/reducers/timesheet.reducer.ts`
- Added `exportModal4` to modal states
- Updated initial state and reset functions

### 2. **Modal Component**

- **File**: `src/components/modal/timesheet-export-modal-template4.tsx`
- Created new modal for Template 4 export
- Features month range selection (MM/YYYY format)
- Includes description for audit purposes

### 3. **Service Function**

- **File**: `src/services/timesheet/timesheet-all.service.ts`
- Added `POST_EXPORT_AUDIT_REPORT` function
- Handles API calls to `/api/v1/timesheet/excel/template_4`
- Includes loading states and error handling with toast notifications

### 4. **Export Button Component**

- **File**: `src/components/button/export-button.tsx`
- Added `onExportTemplate4` prop
- Added "Template Timesheet 4 (Audit)" menu item

### 5. **Timesheet Controls**

- **File**: `src/components/section/timesheet-controls.tsx`
- Added `onExportTemplate4` prop to interface
- Passed prop to ExportButton component

### 6. **Main Page Integration**

- **File**: `src/app/timesheet/all/page.tsx`
- Imported ExportModalTemplate4 and POST_EXPORT_AUDIT_REPORT
- Created `HANDLE_EXPORT_TEMPLATE4` handler
- Added modal to JSX
- Connected button to open modal

### 7. **Backend Service**

- **File**: `src/services/backend/timesheet/audit-report.service.ts`
- Created `TimesheetAuditReportService` with `generateAuditReport` method
- Generates Excel with ExcelJS library

### 8. **API Route**

- **File**: `src/app/api/v1/timesheet/excel/template_4/route.tsx`
- Implemented POST endpoint
- Validates date range
- Returns Excel file as download

## Excel Report Structure

### Sheet 1: "ภาพรวม" (Overview)

Contains summary data with the following columns:

1. **รหัสโครงการ / รหัสโครงการย่อย** (Project Code / Sub-Project Code)

   - Format: `{projectId}-{featureId}` (e.g., "12-42")
   - Concatenates primary IDs from Project and Feature tables

2. **ชื่อโครงการ (รหัสโครงการ)** (Project Name (Project Code))

   - Format: `{projectName} ({projectId})`

3. **ชื่อโครงการย่อย (รหัสโครงการย่อย)** (Sub-Project Name (Sub-Project Code))

   - Format: `{featureName} ({featureId})`

4. **ประเภทของสินทรัพย์** (Asset Type)

   - Values: "CAPTUREABLE" or "UN_CAPTUREABLE"
   - Retrieved from `Feature.assetCaptureType` column

5. **ผลรวมชั่วโมง** (Total Hours)

   - Sum of all timesheet entries for that feature
   - Counted from `TimesheetEntry` table grouped by `featureId`

6. **เปอร์เซ็นต์** (Percentage)
   - Percentage of total hours spent on this feature
   - Formula: `(feature hours / total hours) × 100`

### Evidence Sheets

- **One sheet per feature** (sub-project)
- Sheet name: `{ProjectName}-{FeatureName} ({projectId}-{featureId})`
  - Truncated to fit 31 character limit
- Contains detailed timesheet entries with:
  - วันที่ (Date)
  - โครงการ (Project name)
  - โครงการย่อย (Feature name)
  - ผู้จัดทำ (Creator) - Format: `{Firstname} {Lastname} ({admin_id})`
  - ชั่วโมง (Hours)
  - คำอธิบาย (Description)
  - สถานะ (Status)

### Data Filtering

- Filtered by date range (start_date to end_date)
- Filtered by `feature` and `project` relations
- Only includes non-deleted entries (`is_deleted = false`)

## Features

### Professional Excel Styling

- ✅ Enterprise-grade formatting
- ✅ Frozen header rows for easy navigation
- ✅ Color-coded headers (blue theme)
- ✅ Proper number formatting for hours
- ✅ Percentage formatting
- ✅ Borders and alignment
- ✅ Auto-sized columns

### Data Integrity

- ✅ Sorted by hours (descending) in overview
- ✅ Sorted by date in evidence sheets
- ✅ Total rows with summary calculations
- ✅ Proper date formatting (DD/MM/YYYY)

### User Experience

- ✅ Loading indicators during export
- ✅ Success/error toast notifications
- ✅ Month range picker (last 36 months available)
- ✅ Descriptive modal with audit context
- ✅ Automatic file download with descriptive filename

## Usage

1. Navigate to Timesheet → All page
2. Click "ส่งออกข้อมูล" (Export Data) button
3. Select "Template Timesheet 4 (Audit)"
4. Choose date range (MM/YYYY format)
5. Click "Export"
6. Wait for file generation
7. File downloads automatically

## File Naming Convention

```
timesheet-audit-report_{YYYYMMDD}_{YYYYMMDD}.xlsx
```

Example: `timesheet-audit-report_20250101_20251231.xlsx`

## Technical Notes

### Database Schema Used

- **TimesheetEntry**: Main timesheet data
  - `id`, `projectId`, `featureId`, `date`, `hours`, `description`, `status`
  - Relations: `project`, `feature`
- **Project**: Project information
  - `id`, `name`
- **Feature**: Sub-project/feature information
  - `id`, `projectId`, `name`, `assetCaptureType`
  - Enum: `ProjectAssetCaptureType` (CAPTUREABLE, UN_CAPTUREABLE)

### Dependencies

- ExcelJS: Excel file generation
- dayjs: Date manipulation
- Prisma: Database ORM
- Next.js: API routes and frontend

## Audit Compliance

This report is specifically designed for audit purposes and includes:

- ✅ Complete traceability (project code references)
- ✅ Asset type classification
- ✅ Time allocation percentages
- ✅ Detailed evidence with descriptions
- ✅ Date-stamped entries
- ✅ Status tracking

## Future Enhancements (Optional)

- Add user filter to show only specific team members
- Include project descriptions in evidence sheets
- Add charts/graphs for visual representation
- Export to PDF format
- Email delivery option
- Scheduled automated reports
