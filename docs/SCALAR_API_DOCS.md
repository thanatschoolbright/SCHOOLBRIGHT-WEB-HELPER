# Scalar API Documentation Integration

This guide explains how to use the Scalar API Documentation that has been integrated into your Next.js project.

## 📁 Files Created

### 1. `/src/app/api/docs/route.ts`

API route handler that serves your OpenAPI specification.

```typescript
import { NextResponse } from "next/server";
import swaggerDocument from "../../../openapi.json";

export async function GET() {
  return NextResponse.json(swaggerDocument);
}
```

### 2. `/src/app/docs/page.tsx`

Client-side page that renders the Scalar API Reference UI.

```typescript
"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

export default function DocsPage() {
  return (
    <div className="h-screen w-full">
      <ApiReferenceReact
        configuration={{
          theme: "default",
          url: "/api/docs",
        }}
      />
    </div>
  );
}
```

### 3. `/openapi.json`

Sample OpenAPI 3.1.0 specification file (replace with your actual API documentation).

## 🚀 Installation

Install the required Scalar package:

```bash
npm install @scalar/api-reference-react
```

## 📝 Setup Instructions

### Step 1: Install Dependencies

Run the installation command above to add Scalar to your project.

### Step 2: Update Your OpenAPI Specification

Replace the content in `/openapi.json` with your actual API documentation. The sample file includes:

- Basic API information
- Server configurations
- Example endpoints
- Schema definitions
- Security schemes

### Step 3: Run Your Development Server

```bash
npm run dev
```

### Step 4: Access Your API Documentation

- **API Endpoint**: http://localhost:3000/api/docs (returns OpenAPI JSON)
- **Documentation UI**: http://localhost:3000/docs (interactive Scalar UI)

## 🎨 Customization Options

You can customize the Scalar API Reference by modifying `/src/app/docs/page.tsx`:

### Theme Options

```typescript
<ApiReferenceReact
  configuration={{
    theme: "default", // Options: 'default', 'alternate', 'moon', 'purple', 'solarized', 'bluePlanet', 'saturn', 'kepler', 'mars', 'deepSpace'
    url: "/api/docs",
  }}
/>
```

### Additional Configuration

```typescript
<ApiReferenceReact
  configuration={{
    theme: "default",
    url: "/api/docs",
    // Hide the download button
    hideDownloadButton: true,

    // Hide the test request button
    hideTestRequestButton: false,

    // Custom layout
    layout: "modern", // Options: 'modern', 'classic'

    // Dark mode
    darkMode: true,

    // Custom CSS
    customCss: `
      .scalar-api-reference {
        /* Your custom styles */
      }
    `,
  }}
/>
```

## 📚 OpenAPI Specification Guide

Your `/openapi.json` should follow the OpenAPI 3.x specification. Here's what to include:

### Required Fields

- `openapi`: Version (e.g., "3.1.0")
- `info`: API metadata (title, version, description)
- `paths`: Your API endpoints

### Recommended Fields

- `servers`: API server URLs
- `components`: Reusable schemas, parameters, responses
- `security`: Authentication methods
- `tags`: Endpoint categorization

### Example Endpoint

```json
{
  "paths": {
    "/api/users": {
      "get": {
        "summary": "Get all users",
        "tags": ["Users"],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserList"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## 🔧 Troubleshooting

### TypeScript Errors

If you see TypeScript errors about missing modules:

1. Ensure you've run `npm install @scalar/api-reference-react`
2. Restart your TypeScript server in your IDE
3. Clear `.next` folder: `rm -rf .next`

### OpenAPI JSON Not Found

If the `/api/docs` endpoint returns 404:

1. Verify `/openapi.json` exists in the project root
2. Check the import path in `/src/app/api/docs/route.ts`
3. Ensure `tsconfig.json` includes `"openapi.json"` in the `include` array

### Scalar UI Not Rendering

If the `/docs` page is blank:

1. Check browser console for errors
2. Ensure the CSS import is present: `import '@scalar/api-reference-react/style.css'`
3. Verify the API endpoint `/api/docs` returns valid JSON

## 📖 Additional Resources

- [Scalar Documentation](https://github.com/scalar/scalar)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Next.js App Router](https://nextjs.org/docs/app)

## 🎯 Next Steps

1. **Install the package**: Run `npm install @scalar/api-reference-react`
2. **Update OpenAPI spec**: Replace `/openapi.json` with your actual API documentation
3. **Test the integration**: Visit http://localhost:3000/docs
4. **Customize the theme**: Modify the configuration in `/src/app/docs/page.tsx`
5. **Add authentication**: If your API requires auth, update the OpenAPI spec with security schemes

---

**Note**: The sample `openapi.json` is a starting point. You should replace it with comprehensive documentation of your actual API endpoints, schemas, and authentication methods.
