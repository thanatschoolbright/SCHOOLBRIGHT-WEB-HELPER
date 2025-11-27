# Auto-Generated OpenAPI Documentation Guide

## 🎉 Auto-Generation Setup Complete!

ระบบของคุณตอนนี้จะ **auto-generate OpenAPI specification** จาก API routes ทั้งหมดใน `src/app/api/` แล้วครับ!

## 📁 Files Created

### 1. `/src/lib/swagger.ts`

Configuration file สำหรับ auto-generate OpenAPI spec

### 2. `/src/app/api/docs/route.ts` (Updated)

อัปเดตให้ใช้ auto-generated spec แทน static JSON

## 🚀 How It Works

### Automatic Scanning

ระบบจะ scan ทุก route files ใน `src/app/api/` อัตโนมัติ:

- ✅ **107+ API routes** ของคุณจะถูก detect ทั้งหมด
- ✅ Auto-generate endpoints, methods, paths
- ✅ Support JSDoc comments สำหรับเพิ่มรายละเอียด

### Current Auto-Detected Routes

ระบบจะ detect routes เหล่านี้อัตโนมัติ:

- `/api/v1/admin/*` - Admin endpoints
- `/api/v1/authentication/*` - Auth endpoints
- `/api/v1/backlog/*` - Backlog management
- `/api/v1/hardware/*` - Hardware management
- `/api/v1/health-check/*` - Health monitoring
- `/api/v1/integrations/*` - Third-party integrations
- `/api/v1/ai/*` - AI/ML endpoints
- และอีกมากมาย...

## 📝 How to Add Documentation to Your Routes

### Basic Example

เพิ่ม JSDoc comments ใน route files ของคุณ:

```typescript
/**
 * @swagger
 * /api/v1/admin/user:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a list of all users in the system
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  // Your implementation
}
```

### POST Example

```typescript
/**
 * @swagger
 * /api/v1/admin/user/create:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user in the system
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               role:
 *                 type: string
 *                 enum: [admin, user, moderator]
 *                 default: user
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: Request) {
  // Your implementation
}
```

### With Path Parameters

```typescript
/**
 * @swagger
 * /api/v1/admin/user/read/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves a specific user by their ID
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Your implementation
}
```

### With Query Parameters

```typescript
/**
 * @swagger
 * /api/v1/backlog/projects:
 *   get:
 *     summary: List projects
 *     description: Get a list of projects with optional filtering
 *     tags:
 *       - Backlog
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Projects list
 */
export async function GET(request: Request) {
  // Your implementation
}
```

## 🎯 Available Tags

Tags ที่กำหนดไว้แล้ว:

- `Admin` - Admin management endpoints
- `Authentication` - Authentication and authorization
- `Backlog` - Backlog and project management
- `Hardware` - Hardware device management
- `Health Check` - System health monitoring
- `Integrations` - Third-party integrations
- `AI` - AI and machine learning endpoints
- `Support` - Support and customer service
- `Timesheet` - Time tracking and management
- `Documentation` - API documentation endpoints

## 🔐 Security Schemes

มี security schemes พร้อมใช้งาน:

### Bearer Token

```yaml
security:
  - bearerAuth: []
```

### API Key

```yaml
security:
  - apiKey: []
```

## 📦 Reusable Schemas

Schemas ที่กำหนดไว้แล้ว:

### Error Response

```yaml
$ref: "#/components/schemas/Error"
```

### Success Response

```yaml
$ref: "#/components/schemas/SuccessResponse"
```

## 🚀 Testing Your Documentation

1. **Start dev server:**

   ```bash
   npm run dev
   ```

2. **View auto-generated spec:**

   - API JSON: http://localhost:3000/api/docs
   - Interactive UI: http://localhost:3000/docs

3. **The spec will automatically include:**
   - All your 107+ API routes
   - Any JSDoc comments you add
   - Proper categorization by tags
   - Security schemes
   - Request/response schemas

## 💡 Best Practices

### 1. Always Add Descriptions

```typescript
/**
 * @swagger
 * /api/v1/example:
 *   get:
 *     summary: Short summary (required)
 *     description: Detailed description of what this endpoint does
 */
```

### 2. Use Tags for Organization

```typescript
/**
 * @swagger
 * tags:
 *   - Admin
 *   - Users
 */
```

### 3. Document All Responses

```typescript
/**
 * @swagger
 * responses:
 *   200:
 *     description: Success
 *   400:
 *     description: Bad request
 *   401:
 *     description: Unauthorized
 *   404:
 *     description: Not found
 *   500:
 *     description: Server error
 */
```

### 4. Include Examples

```typescript
/**
 * @swagger
 * schema:
 *   type: object
 *   properties:
 *     name:
 *       type: string
 *       example: "John Doe"
 */
```

### 5. Define Request Bodies

```typescript
/**
 * @swagger
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - field1
 *           - field2
 */
```

## 🔄 Dynamic Updates

- ✅ Spec regenerates on every request
- ✅ No need to restart server
- ✅ Add JSDoc → Refresh docs → See changes immediately

## 📖 Example: Complete Route Documentation

```typescript
// src/app/api/v1/admin/user/route.ts

/**
 * @swagger
 * /api/v1/admin/user:
 *   get:
 *     summary: List all users
 *     description: Retrieves a paginated list of all users in the system
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  // Implementation
}
```

## 🎉 Summary

ตอนนี้คุณมี:

- ✅ **Auto-generation** จาก 107+ API routes
- ✅ **Dynamic updates** - ไม่ต้อง restart
- ✅ **JSDoc support** - เพิ่มรายละเอียดได้ง่าย
- ✅ **Beautiful UI** - Scalar API Reference
- ✅ **Production-ready** - พร้อมใช้งานทันที

เพียงแค่เพิ่ม JSDoc comments ใน route files ของคุณ แล้ว documentation จะ update อัตโนมัติ! 🚀
