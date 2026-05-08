# POST /api/v2/server/status/log

## Purpose
**ไม่ได้ถูกเรียกจาก frontend โดยตรง**
Log ถูกบันทึกอัตโนมัติใน `saveServerStatusLogs()` ใน `server-status-service.ts`
ทุกครั้งที่ `executeServerStatusChecks()` ถูกเรียก (ทั้ง GET/POST route ของ `/api/v2/server/status`)

Flow: GitHub Actions → POST /api/v2/server/status → executeServerStatusChecks() → saveServerStatusLogs() → api_log table

## Auto-cleanup
ทุกครั้งที่บันทึก log ใหม่ ระบบจะลบ log เก่ากว่า 30 วันออกโดยอัตโนมัติ

## Request Body (internal use)

```json
{
  "checked_at": "2026-05-08T10:00:00Z",
  "results": [
    {
      "server": "SERVER_PROD_SBAPI",
      "server_name_th": "1.ระบบหลังบ้าน SB App",
      "endpoint": "/api/SeverStatus",
      "status": "Online",
      "status_code": 200,
      "response_time": 0.235,
      "environment": "Production",
      "url": "https://..."
    }
  ]
}
```

## Response

```json
{
  "status": 200,
  "data": { "saved": 12 },
  "message_th": "บันทึก log สำเร็จ 12 รายการ"
}
```
