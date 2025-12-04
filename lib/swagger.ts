import { createSwaggerSpec } from "next-swagger-doc";

/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from Next.js App Router routes
 */
export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.1.0",
      info: {
        title: "SchoolBright Web Helper API",
        version: "1.0.0",
        description:
          "Comprehensive API documentation for SchoolBright Web Helper application",
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
          url: "https://api.schoolbright.com",
          description: "Production server",
        },
      ],
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
              message: {
                type: "string",
                description: "Error message",
              },
              code: {
                type: "string",
                description: "Error code",
              },
              statusCode: {
                type: "integer",
                description: "HTTP status code",
              },
            },
            required: ["message"],
          },
          SuccessResponse: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                description: "Indicates if the request was successful",
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
        { name: "Health Check", description: "System health monitoring" },
        { name: "Integrations", description: "Third-party integrations" },
        { name: "AI", description: "AI and machine learning endpoints" },
        { name: "Support", description: "Support and customer service" },
        { name: "Timesheet", description: "Time tracking and management" },
        { name: "Documentation", description: "API documentation endpoints" },
      ],
    },
  });

  return spec;
};
