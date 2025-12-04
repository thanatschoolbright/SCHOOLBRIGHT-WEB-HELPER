"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

/**
 * API Documentation Page
 * Displays interactive Scalar API Reference UI
 */
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
