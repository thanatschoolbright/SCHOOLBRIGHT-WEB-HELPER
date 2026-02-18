"use client";

import { FileSearchOutlined } from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

/**
 * 📘 API Documentation Page
 * uses @scalar/api-reference-react to render OpenAPI Spec 3.x
 * The spec is dynamically generated via /api/docs
 */
const ApiSpecPage = () => {
  return (
    <DashboardLayout>
      <HeaderBar
        title="API Specification"
        subTitle="ตรวจสอบและทดสอบ API ทั้งหมดในระบบ SchoolBright Web Helper"
        icon={<FileSearchOutlined />}
      />

      <div className="api-spec-container shadow-sm border rounded-lg overflow-hidden bg-white mt-4">
        <ApiReferenceReact
          configuration={{
            spec: {
              url: "/api/docs",
            },
            theme: "purple",
            layout: "modern",
            hideDownloadButton: false,
            showSidebar: true,
          }}
        />
      </div>

      <style jsx global>{`
        .api-spec-container {
          height: calc(100vh - 160px);
          position: relative;
        }

        /* 🎨 Scalar Style Overrides to fit Dashboard */
        .scalar-api-reference {
          --scalar-radius: 8px;
          --scalar-color-primary: #f97316; /* matching themeColor */
        }

        .scalar-sidebar {
          background-color: #f8fafc !important;
        }

        .scalar-app-rendered {
          background-color: #fff !important;
        }

        /* Prevent footer from overlapping if necessary */
        .ant-layout-footer {
          display: none !important;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default ApiSpecPage;
