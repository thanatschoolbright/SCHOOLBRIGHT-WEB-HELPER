"use client";

import MinimalButton from "@components/button/minimal-button-component";
import ContentCard from "@components/layouts/backend/content";
import { useState } from "react";
import Swal from "sweetalert2";

interface ResponseCardProps {
  /** ข้อมูล JSON ที่จะโชว์ */
  responseData?: any;
  /** ข้อความ CURL command ที่จะคัดลอก */
  curlCommand?: string;
  /** className เพิ่มเติม ถ้าต้องการซ่อน/แสดง */
  className?: string;
  /** หัวข้อการ์ด */
  title?: string;
}

export function ResponseCardComponent({
  responseData,
  curlCommand,
  className = "",
  title = "Response",
}: Readonly<ResponseCardProps>) {
  if (!responseData) return null;

  // แปลงเป็นข้อความ พร้อมแบ่งเป็นบรรทัด
  const text = JSON.stringify(responseData, null, 2);
  const lines = text.split("\n");
  const MAX_LINES = 100;
  const needsTruncate = lines.length > MAX_LINES;

  const [expanded, setExpanded] = useState(false);

  // ส่วนที่จะโชว์จริงๆ
  const displayText =
    needsTruncate && !expanded ? lines.slice(0, MAX_LINES).join("\n") : text;

  // ฟังก์ชันช่วยคัดลอกและแจ้งเตือน
  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    Swal.fire({
      icon: "success",
      title: "Copied!",
      text: `${label} copied to clipboard.`,
      confirmButtonText: "OK",
    });
  };

  return (
    <ContentCard
      title={title}
      fullWidth
      className={`relative md:col-span-2 xl:col-span-4 w-full overflow-visible ${className}`}
    >
      {/* ปุ่ม See more / See less */}
      {needsTruncate && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="absolute top-4 right-4 text-sm text-blue-600 hover:underline"
        >
          {expanded ? "See less..." : `See more... (${lines.length} lines)`}
        </button>
      )}

      <div className="space-y-4 overflow-x-auto mt-2">
        <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded max-h-[65vh] overflow-auto">
          <code>{displayText}</code>
        </pre>

        <div className="flex flex-col md:flex-row gap-4">
          <MinimalButton
            type="button"
            textSize="base"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => handleCopy(text, "Response")}
          >
            Copy Response
          </MinimalButton>

          {curlCommand && (
            <MinimalButton
              type="button"
              textSize="base"
              className="bg-yellow-500 hover:bg-yellow-600"
              onClick={() => handleCopy(curlCommand, "CURL command")}
            >
              Copy CURL
            </MinimalButton>
          )}
        </div>
      </div>
    </ContentCard>
  );
}
