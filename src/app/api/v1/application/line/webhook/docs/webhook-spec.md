# LINE Webhook — Spec

**Endpoint:** `POST /api/v1/application/line/webhook`
**Endpoint:** `GET  /api/v1/application/line/webhook`

## Purpose
รับ webhook events จาก LINE Messaging API และประมวลผล event ต่างๆ

## Environment Variables (server-only)
| Variable | Description |
|---|---|
| `LINE_CHANNEL_ID` | Channel ID จาก LINE Developers Console |
| `LINE_CHANNEL_SECRET` | Channel Secret ใช้ verify HMAC-SHA256 signature |
| `LINE_CHANNEL_ACCESS_TOKEN` | Long-lived access token สำหรับ reply message |

## Security
- ทุก POST request ต้องมี header `x-line-signature`
- ตรวจสอบด้วย HMAC-SHA256 โดยใช้ `LINE_CHANNEL_SECRET`
- Return 401 ถ้า signature ไม่ตรง

## POST Request (from LINE Platform)
```json
{
  "destination": "...",
  "events": [
    {
      "type": "message",
      "replyToken": "...",
      "source": { "userId": "...", "type": "user" },
      "message": { "type": "text", "text": "..." }
    }
  ]
}
```

## POST Response
```json
{ "status_code": 200, "message_th": "รับ webhook events สำเร็จ", "data": { "received": 1 } }
```

## GET Response
```json
{ "status_code": 200, "message_th": "LINE Webhook พร้อมใช้งาน", "data": { "channelId": "...", "status": "active" } }
```

## Built-in Commands
| Text | Response |
|---|---|
| `/luid` | ตอบกลับ LINE User ID ของผู้ส่ง |

## Notes
- `LINE_CHANNEL_ACCESS_TOKEN` ต้องเพิ่มเองใน `.env` หลังสร้าง Messaging API channel
- URL นี้ต้องลงทะเบียนใน LINE Developers Console → Messaging API → Webhook URL
