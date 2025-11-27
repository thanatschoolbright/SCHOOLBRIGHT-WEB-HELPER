import fs from "fs";
import path from "path";

interface RouteInfo {
  path: string;
  methods: string[];
  file: string;
}

/**
 * Recursively scan API directory for route files
 */
function scanApiRoutes(dir: string, basePath: string = ""): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Handle dynamic routes like [id], [project_id], etc.
      const isDynamicRoute =
        entry.name.startsWith("[") && entry.name.endsWith("]");
      const pathSegment = isDynamicRoute
        ? `{${entry.name.slice(1, -1)}}` // Convert [id] to {id}
        : entry.name;

      const newBasePath = basePath + "/" + pathSegment;
      routes.push(...scanApiRoutes(fullPath, newBasePath));
    } else if (entry.name === "route.ts" || entry.name === "route.js") {
      // Read the file to detect HTTP methods
      const content = fs.readFileSync(fullPath, "utf-8");
      const methods: string[] = [];

      // Detect exported async functions (GET, POST, PUT, PATCH, DELETE, etc.)
      if (/export\s+async\s+function\s+GET/m.test(content)) methods.push("get");
      if (/export\s+async\s+function\s+POST/m.test(content))
        methods.push("post");
      if (/export\s+async\s+function\s+PUT/m.test(content)) methods.push("put");
      if (/export\s+async\s+function\s+PATCH/m.test(content))
        methods.push("patch");
      if (/export\s+async\s+function\s+DELETE/m.test(content))
        methods.push("delete");

      if (methods.length > 0) {
        routes.push({
          path: "/api" + basePath,
          methods,
          file: fullPath,
        });
      }
    }
  }

  return routes;
}

/**
 * Generate OpenAPI paths from scanned routes
 */
function generatePaths(routes: RouteInfo[]) {
  const paths: any = {};

  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    for (const method of route.methods) {
      // Extract tag from path (e.g., /api/v1/admin/user -> Admin)
      const pathParts = route.path.split("/").filter(Boolean);
      let tag = "API";

      if (pathParts.length >= 3) {
        // v1/admin/user -> Admin
        tag = pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1);
      }

      // Check if route has parameters
      const hasParams = route.path.includes("{");
      const parameters = hasParams ? extractParameters(route.path) : [];

      paths[route.path][method] = {
        summary: `${method.toUpperCase()} ${route.path}`,
        description: `Auto-generated endpoint for ${route.path}`,
        tags: [tag],
        ...(parameters.length > 0 && { parameters }),
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      };

      // Add security for non-public endpoints
      if (
        !route.path.includes("/docs") &&
        !route.path.includes("/health-check")
      ) {
        paths[route.path][method].security = [{ bearerAuth: [] }];
      }
    }
  }

  return paths;
}

/**
 * Extract parameters from path
 */
function extractParameters(path: string) {
  const params: any[] = [];
  const matches = path.matchAll(/\{([^}]+)\}/g);

  for (const match of matches) {
    params.push({
      in: "path",
      name: match[1],
      required: true,
      schema: { type: "string" },
      description: `${match[1]} parameter`,
    });
  }

  return params;
}

/**
 * Get auto-generated OpenAPI specification
 */
export function getApiDocs() {
  const apiDir = path.join(process.cwd(), "src", "app", "api");
  const routes = scanApiRoutes(apiDir);
  const paths = generatePaths(routes);

  return {
    openapi: "3.1.0",
    info: {
      title: "SchoolBright Web Helper API",
      version: "1.0.0",
      description: `Comprehensive API documentation for SchoolBright Web Helper application. Auto-generated from ${routes.length} API routes.`,
      contact: {
        name: "API Support",
        email: "support@schoolbright.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "http://localhost:3001",
        description: "Development server (alternate port)",
      },
      {
        url: "https://api.schoolbright.com",
        description: "Production server",
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Authorization header using the Bearer scheme",
        },
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key for authentication",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message_en: {
              type: "string",
              description: "Error message in English",
            },
            message_th: {
              type: "string",
              description: "Error message in Thai",
            },
            error: {
              type: "object",
              description: "Error details",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              description: "Response data",
            },
            message: {
              type: "string",
              description: "Success message",
            },
          },
        },
      },
    },
    tags: [
      { name: "Admin", description: "Admin management endpoints" },
      {
        name: "Authentication",
        description: "Authentication and authorization",
      },
      { name: "Backlog", description: "Backlog and project management" },
      { name: "Hardware", description: "Hardware device management" },
      { name: "Health-check", description: "System health monitoring" },
      { name: "Integrations", description: "Third-party integrations" },
      { name: "Ai", description: "AI and machine learning endpoints" },
      { name: "Support", description: "Support and customer service" },
      { name: "Timesheet", description: "Time tracking and management" },
      { name: "Logger", description: "Logging endpoints" },
      { name: "Notification", description: "Notification management" },
      { name: "Payment", description: "Payment processing" },
      { name: "Line-chat", description: "LINE chat integration" },
      { name: "K6", description: "Load testing endpoints" },
      { name: "Newman", description: "API testing endpoints" },
      { name: "Docs", description: "API documentation endpoints" },
    ],
  };
}
