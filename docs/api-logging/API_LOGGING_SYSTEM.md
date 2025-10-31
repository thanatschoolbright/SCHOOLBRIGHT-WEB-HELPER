# API Logging System

ระบบบันทึก API Log สำหรับ SchoolBright Web Helper ที่ออกแบบมาให้เป็น Type Safety และใช้งานง่าย

## 📁 Structure

```
src/
├── app/api/v1/logger/
│   ├── create/route.ts           # สร้าง API Log ใหม่
│   ├── search/route.ts           # ดึงรายการ API Logs ด้วย POST
│   ├── search-example/route.ts   # ตัวอย่างการใช้งาน search API
│   ├── [id]/route.ts            # ดึงและลบ API Log ตาม ID
│   ├── [id]/archive/route.ts    # จัดการสถานะ archive
│   └── example/route.ts         # ตัวอย่างการใช้งาน auto logging
├── services/backend/api-log/
│   └── api-log.service.ts       # Service สำหรับจัดการ database operations
├── helpers/
│   ├── api-log.utils.ts         # Utility functions สำหรับ API logging
│   └── api-log.middleware.ts    # Middleware สำหรับ auto logging
└── types/
    └── api-log.types.ts         # TypeScript type definitions
```

## 🚀 API Endpoints

### 1. สร้าง API Log
```http
POST /api/v1/logger/create
```

**Request Body:**
```json
{
  "requestTime": "2025-10-20T10:00:00.000Z",
  "responseTime": "2025-10-20T10:00:01.000Z",
  "durationMs": 1000,
  "method": "GET",
  "statusCode": 200,
  "url": "https://example.com/api/v1/users",
  "endpoint": "/api/v1/users",
  "serviceName": "users",
  "requestHeader": {"Authorization": "Bearer token"},
  "requestBody": {"name": "John"},
  "responseBody": {"id": 1, "name": "John"},
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "calledBy": "user-123",
  "traceId": "trace_123",
  "errorMessage": null,
  "isSuccess": true,
  "isArchived": false
}
```

### 2. ดึงรายการ API Logs
```http
POST /api/v1/logger/search
```

**Request Body:**
```json
{
  "page": 1,
  "limit": 10,
  "serviceName": "users",
  "isSuccess": true,
  "method": "GET",
  "statusCode": 200,
  "endpoint": "/api/v1/users",
  "calledBy": "user-123",
  "traceId": "trace_123",
  "dateFrom": "2025-10-20T00:00:00.000Z",
  "dateTo": "2025-10-20T23:59:59.999Z",
  "isArchived": false,
  "sortBy": "request_time",
  "sortOrder": "desc"
}
```

**หมายเหตุ:** ทุก field ใน request body เป็น optional และสามารถส่งเฉพาะ field ที่ต้องการกรองได้

### 3. ดึง API Log ตาม ID
```http
GET /api/v1/logger/{id}
```

### 4. ลบ API Log
```http
DELETE /api/v1/logger/{id}
```

### 5. จัดการสถานะ Archive
```http
PATCH /api/v1/logger/{id}/archive
```

**Request Body:**
```json
{
  "isArchived": true
}
```

## 🛠️ การใช้งาน

### 1. Auto Logging Middleware (แนะนำ)

```typescript
import { withLogging } from "@/helpers/api-log.middleware";

async function handleGet(request: NextRequest): Promise<NextResponse> {
  // API logic ของคุณ
  return NextResponse.json({ message: "Hello World" });
}

// Export พร้อม auto logging
export const GET = withLogging(handleGet, {
  serviceName: "users",
  calledBy: "system",
  excludeRequestBody: false,   // บันทึก request body หรือไม่
  excludeResponseBody: false,  // บันทึก response body หรือไม่
});
```

### 2. Manual Logging

```typescript
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiLogUtils } from "@/helpers/api-log.utils";

export async function GET(request: NextRequest) {
  // สร้าง log data
  const logData = await ApiLogUtils.createLogData(request);
  
  try {
    // API logic ของคุณ
    const response = NextResponse.json({ message: "Success" });
    
    // อัปเดต log data ด้วย response
    const finalLogData = ApiLogUtils.updateLogDataWithResponse(
      logData,
      200,
      { message: "Success" }
    );
    
    // บันทึก log
    await ApiLogService.createApiLog(finalLogData);
    
    return response;
  } catch (error) {
    // บันทึก error log
    const errorLogData = ApiLogUtils.updateLogDataWithResponse(
      logData,
      500,
      undefined,
      error.message
    );
    
    await ApiLogService.createApiLog(errorLogData);
    throw error;
  }
}
```

### 3. Search API Logs (แนะนำ)

```typescript
import { apiLogClient } from "@/lib/api-log";

// ค้นหา logs ด้วย filters
const response = await apiLogClient.search({
  page: 1,
  limit: 10,
  serviceName: "timesheet",
  isSuccess: false,
  method: "POST",
  dateFrom: new Date("2025-10-20T00:00:00.000Z"),
  dateTo: new Date("2025-10-20T23:59:59.999Z"),
  sortBy: "request_time",
  sortOrder: "desc"
});

console.log(response.data.data.logs);
```

### 4. Custom Logging

```typescript
import { createCustomLog } from "@/helpers/api-log.middleware";

// บันทึก log สำหรับการเรียก external API
await createCustomLog({
  method: "POST",
  url: "https://external-api.com/endpoint",
  statusCode: 200,
  serviceName: "external-service",
  calledBy: "system",
  requestBody: { data: "test" },
  responseBody: { result: "success" },
});
```

## 📊 Features

### ✅ Type Safety
- TypeScript definitions ครบถ้วน
- Interface สำหรับ request/response
- Type checking สำหรับทุก operation

### ✅ Clean Code
- Service pattern สำหรับ database operations
- Utility functions สำหรับ common tasks
- Middleware pattern สำหรับ auto logging

### ✅ Security
- Automatic sanitization ของข้อมูลอ่อนไหว
- Safe JSON parsing
- Error handling ที่ครอบคลุม

### ✅ Performance
- Async logging (ไม่บล็อค API response)
- Pagination สำหรับ large datasets
- Optimized database queries

### ✅ Monitoring
- Request/Response tracking
- Duration measurement
- Error logging
- IP address และ User Agent tracking
- Distributed tracing support

### ✅ Advanced Search & Filtering
- POST-based search (ไม่ต้องใช้ query parameters ยาวๆ)
- Multiple filter combinations
- Date range filtering
- Pattern matching สำหรับ endpoints
- Flexible sorting options
- Pagination สำหรับ large datasets

## 🔧 Configuration

### Database Schema
ใช้ Prisma schema ที่อยู่ใน `prisma/timesheet/schema.prisma`:

```prisma
model ApiLog {
  id             BigInt   @id @default(autoincrement())
  request_time   DateTime
  response_time  DateTime?
  duration_ms    Int?
  method         String?
  status_code    Int?
  url            String?
  endpoint       String?
  service_name   String?
  request_header Json?
  request_body   Json?
  response_body  Json?
  ip_address     String?
  user_agent     String?
  called_by      String?
  trace_id       String?
  error_message  String?
  is_success     Boolean  @default(true)
  created_at     DateTime @default(now())
  is_archived    Boolean  @default(false)

  @@index([endpoint])
  @@index([service_name])
  @@index([status_code])
  @@index([request_time])
  @@index([trace_id])
  @@index([called_by])
  @@map("api_log")
}
```

### Environment Variables
ตรวจสอบให้แน่ใจว่ามี `DATABASE_TIMESHEET_URL` ใน environment variables:

```env
DATABASE_TIMESHEET_URL="postgresql://user:password@localhost:5432/timesheet_db"
```

## 📝 Examples

### ตัวอย่างการทดสอบ API

```bash
# ทดสอบ Example API (GET)
curl -X GET "http://localhost:3000/api/v1/logger/example?message=test"

# ทดสอบ Example API (POST)
curl -X POST "http://localhost:3000/api/v1/logger/example" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "description": "Test description"}'

# ทดสอบการเกิด Error
curl -X GET "http://localhost:3000/api/v1/logger/example?error=true"

# ดึงรายการ logs
curl -X POST "http://localhost:3000/api/v1/logger/search" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "limit": 5, "serviceName": "example"}'

# ดึง log ตาม ID
curl -X GET "http://localhost:3000/api/v1/logger/1"

# Archive log
curl -X PATCH "http://localhost:3000/api/v1/logger/1/archive" \
  -H "Content-Type: application/json" \
  -d '{"isArchived": true}'

# ค้นหา logs ด้วย filters ที่ซับซ้อน
curl -X POST "http://localhost:3000/api/v1/logger/search" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "limit": 20,
    "serviceName": "timesheet",
    "method": "POST",
    "statusCode": 500,
    "dateFrom": "2025-10-20T00:00:00.000Z",
    "dateTo": "2025-10-20T23:59:59.999Z",
    "isSuccess": false,
    "sortBy": "request_time",
    "sortOrder": "desc"
  }'

# ค้นหา logs ด้วย endpoint pattern
curl -X POST "http://localhost:3000/api/v1/logger/search" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/v1/users",
    "limit": 10,
    "sortBy": "duration_ms",
    "sortOrder": "desc"
  }'

# ทดสอบ Search Example API
curl -X GET "http://localhost:3000/api/v1/logger/search-example"

# ทดสอบ Search Example API (POST)
curl -X POST "http://localhost:3000/api/v1/logger/search-example" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "limit": 5,
    "serviceName": "example"
  }'
```

## 🚨 Best Practices

1. **ใช้ Auto Logging Middleware** สำหรับ API routes ใหม่
2. **กำหนด Service Name** ที่สื่อความหมาย
3. **ระวังข้อมูลอ่อนไหว** ใน request/response body
4. **จำกัดขนาดข้อมูล** ที่บันทึกใน log
5. **ใช้ Pagination** เมื่อดึงข้อมูล log เป็นจำนวนมาก
6. **Archive logs เก่า** เป็นระยะเพื่อ performance

## 🔍 Troubleshooting

### การตรวจสอบ Errors
```typescript
// ดู errors ใน console
console.error("API Log creation error:", error);

// ตรวจสอบ database connection
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
await PrismaTimesheet.$connect();
```

### การ Debug
```typescript
// เปิด debug mode
const logData = await ApiLogUtils.createLogData(request);
console.log("Log data:", JSON.stringify(logData, null, 2));
```

## 📚 Related Files

- `prisma/timesheet/schema.prisma` - Database schema
- `src/helpers/prisma-timesheet.ts` - Prisma client
- `generated/prisma-timesheet/` - Generated Prisma client

---

🎉 **Happy Logging!** ระบบนี้จะช่วยให้คุณติดตามและวิเคราะห์การใช้งาน API ได้อย่างมีประสิทธิภาพ
