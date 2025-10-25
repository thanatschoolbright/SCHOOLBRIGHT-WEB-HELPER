"use client";

import React from 'react';

const CopyrightNotice: React.FC = () => {
  // อ่านเวอร์ชัน Next.js จาก package.json แบบ dynamic
  const [nextVersion, setNextVersion] = React.useState<string>('16.0.0');

  React.useEffect(() => {
    // ใช้ fetch เพื่อดึงข้อมูลเวอร์ชันจริง
    const getNextVersion = async () => {
      try {
        // อ่านเวอร์ชันจาก package.json runtime
        const response = await fetch('/api/version');
        if (response.ok) {
          const data = await response.json();
          setNextVersion(data.nextVersion || '16.0.0');
        }
      } catch (error) {
        // Fallback ถ้าไม่สามารถอ่านได้
        console.log('Using fallback Next.js version');
      }
    };

    getNextVersion();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      fontSize: '10px',
      color: '#999',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '4px 8px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      zIndex: 9999,
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      userSelect: 'none',
      pointerEvents: 'none',
      textAlign: 'right',
      lineHeight: '1.2'
    }}>
      <div>THANAT PROMPIRIYA TECH LEAD @ JABJAI CORPORATION</div>
      <div>COPYRIGHT (NEXT.JS {nextVersion})</div>
    </div>
  );
};

export default CopyrightNotice;