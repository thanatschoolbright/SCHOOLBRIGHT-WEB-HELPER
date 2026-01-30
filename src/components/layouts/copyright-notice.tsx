"use client";

import React from "react";

const CopyrightNotice: React.FC = () => {
  // อ่านเวอร์ชัน Next.js จาก package.json แบบ dynamic
  const [nextVersion, setNextVersion] = React.useState<string>("16.0.0");
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // ตรวจสอบว่าเป็น mobile หรือไม่
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // ใช้ fetch เพื่อดึงข้อมูลเวอร์ชันจริง
    const getNextVersion = async () => {
      try {
        // อ่านเวอร์ชันจาก package.json runtime
        const response = await fetch("/api/version");
        if (response.ok) {
          const data = await response.json();
          setNextVersion(data.nextVersion || "16.0.0");
        }
      } catch (error) {
        // Fallback ถ้าไม่สามารถอ่านได้
        console.log("Using fallback Next.js version");
      }
    };

    checkIsMobile();
    getNextVersion();

    // Listen for window resize
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: isMobile ? "8px" : "10px",
        right: isMobile ? "8px" : "10px",
        fontSize: isMobile ? "8px" : "10px",
        color: "#999",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        padding: isMobile ? "3px 6px" : "4px 8px",
        borderRadius: "4px",
        fontFamily: "monospace",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        userSelect: "none",
        pointerEvents: "none",
        textAlign: "right",
        lineHeight: "1.2",
        maxWidth: isMobile ? "200px" : "none",
        wordWrap: "break-word",
      }}
    >
      {isMobile ? (
        <>
          <div>Head of Technology Light</div>
          <div>THE BEST DEVELOPER TEAM</div>
          <div>NEXT.JS {nextVersion}</div>
        </>
      ) : (
        <>
          <div>
            The Best SchoolBright Developer Team By Head of Technology Light
          </div>
          <div>COPYRIGHT © 2026 (NEXT.JS {nextVersion})</div>
        </>
      )}
    </div>
  );
};

export default CopyrightNotice;
