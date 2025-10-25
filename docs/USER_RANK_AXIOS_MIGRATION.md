# 📊 User Rank System - การเปลี่ยนจาก Fetch เป็น Axios

## 🎯 **วัตถุประสงค์**
เปลี่ยนจากการใช้ `fetch` API เป็น `axios` เพื่อให้สอดคล้องกับ architecture ของระบบที่ใช้ `sb-helper.axios.ts` instance

## 🔧 **การปรับปรุงที่ทำ**

### **1. อัปเดต Import Statements**
```typescript
// ก่อน
// ไม่มี import axios

// หลัง
import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { fetchUserRank } from "@/services/user-rank/user-rank.service";
```

### **2. แก้ไขการเรียก API ใน Sign-in Panel**
**📁 `/src/components/auth/sign-in-panel.tsx`**

```typescript
// ก่อน - ใช้ fetch
const response = await fetch('/api/v1/timesheet/entry/check/summary-month', {
  method: 'POST',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'x-request-user': userId,
  },
  body: JSON.stringify({ month, year })
});

// หลัง - ใช้ axios service
const rankData = await fetchUserRank(userId);
```

### **3. สร้าง Dedicated Service**
**📁 `/src/services/user-rank/user-rank.service.ts`**

```typescript
export const fetchUserRank = async (
  userId: string, 
  month?: string, 
  year?: string
): Promise<UserRankResponse | null> => {
  const response = await callApiService.post('/api/v1/timesheet/entry/check/summary-month', {
    month: requestMonth,
    year: requestYear
  }, {
    headers: {
      'x-request-user': userId,
    }
  });
  
  // Process response logic...
};
```

### **4. อัปเดต Helper Functions**
**📁 `/src/helpers/user-rank.helper.ts`**

```typescript
// เปลี่ยนจาก fetch เป็น axios service
const rankResponse = await fetchUserRank(userId);
```

### **5. เพิ่ม Advanced Features**
- `fetchMultipleUserRanks()` - เรียกข้อมูล rank หลาย users พร้อมกัน
- `isUserInTopRank()` - ตรวจสอบว่า user อยู่ใน top N หรือไม่
- Better error handling และ logging

## ✅ **ประโยชน์ที่ได้รับ**

### **1. ความสอดคล้อง (Consistency)**
- ใช้ axios instance เดียวกันทั้งระบบ
- Request/Response interceptors ทำงานอัตโนมัติ
- API logging ผ่าน `sb-helper.axios.ts`

### **2. การ Monitor และ Debug**
```bash
📊 [UserRankService] Fetching rank for user: 117, Month: 10, Year: 2025
✅ [UserRankService] User rank found: { rank: 1, admin_id: 117, ... }
```

### **3. Error Handling ที่ดีขึ้น**
- Automatic retry mechanisms
- Consistent error formatting
- Better timeout handling

### **4. Performance**
- Connection pooling
- Request deduplication
- Better caching strategies

## 🔍 **ผลการทดสอบ**

### **API Call Logging**
```bash
POST /api/v1/timesheet/entry/check/summary-month 200 in 1479ms
✅ Response Data: {
  "success": true,
  "data": {
    "records": [
      {
        "admin_id": 117,
        "full_name": "ธนัท พรหมพิริยา",
        "rank": "E",
        "completion_rate": 19.44,
        ...
      }
    ]
  }
}
```

### **การเรียกใช้งาน**
```typescript
// เรียกข้อมูล rank ของ user เดี่ยว
const rankData = await fetchUserRank("117");

// เรียกข้อมูล rank หลาย users
const multipleRanks = await fetchMultipleUserRanks(["117", "155", "126"]);

// ตรวจสอบ top 10
const isTopPerformer = await isUserInTopRank("117", 10);
```

## 🚀 **การใช้งานต่อไป**

### **1. ใน Authentication Flow**
```typescript
const loginSuccess = async (userData: any) => {
  const rankData = await getUserRank(userData?.user_id?.toString());
  // แสดง toast พร้อม rank info
  // บันทึกใน localStorage
};
```

### **2. ใน Components**
```typescript
import { fetchUserRank, getUserRankFromStorage } from "@/services/user-rank";

const UserDashboard = () => {
  const [rank, setRank] = useState(getUserRankFromStorage());
  // อัปเดตและแสดงข้อมูล rank
};
```

### **3. ใน Helper Functions**
```typescript
import { refreshUserRankIfNeeded } from "@/helpers/user-rank.helper";

const checkAndRefreshRank = async (userId: string) => {
  const freshRank = await refreshUserRankIfNeeded(userId);
  return freshRank;
};
```

## 📈 **API Structure ที่รองรับ**

### **Request Format**
```json
{
  "month": "10",
  "year": "2025"
}
```

### **Response Format**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "admin_id": 117,
        "full_name": "ธนัท พรหมพิริยา",
        "rank": "E",
        "total_hours": 28,
        "completion_rate": 19.44,
        "order": 1
      }
    ]
  }
}
```

## 🎉 **สรุป**
การเปลี่ยนจาก `fetch` เป็น `axios` ทำให้ระบบ User Rank มีความสอดคล้อง เสถียร และง่ายต่อการ maintain มากขึ้น โดยใช้ infrastructure ที่มีอยู่แล้วในระบบอย่างเต็มประสิทธิภาพ