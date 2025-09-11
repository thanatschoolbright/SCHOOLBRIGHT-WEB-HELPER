import React, { useState } from "react";
import "./upload-file-component.css";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function UploadFileComponent(props: Props) {
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    ext: string;
    sizeKB: number;
  } | null>(null);

  const onFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileInfo(null);
      return;
    }
    const [name, ...rest] = file.name.split(".");
    const ext = rest.join("."); // handle multi-dot names
    setFileInfo({
      name,
      ext,
      sizeKB: Math.round(file.size / 1024),
    });
    // หากต้องการส่งขึ้น backend ก็เรียก props.onChange หรือฟังก์ชันอื่นที่ส่ง props มา
  };

  return (
    <div className="container">
      <div className="folder">
        <div className="front-side">
          <div className="tip"></div>
          <div className="cover"></div>
        </div>
        <div className="back-side cover"></div>
      </div>

      <label className="custom-file-upload cursor-pointer ">
        <input
          className="title"
          type="file"
          {...props}
          onChange={onFileChange}
        />
        อัปโหลดไฟล์
      </label>

      {fileInfo && (
        <div className="file-name">
          <span className="file-name-text">ชื่อไฟล์: {fileInfo.name}</span>
          <span className="file-name-text">นามสกุล: .{fileInfo.ext}</span>
          <span className="file-name-text">ขนาดไฟล์: {fileInfo.sizeKB} KB</span>
        </div>
      )}
    </div>
  );
}
