import type { VersionFormValues } from "../../../types/canteen.type";

//** สร้าง FormData สำหรับส่งข้อมูลเวอร์ชันไปยัง API
export const buildFormData = (values: VersionFormValues): FormData => {
  const formData = new FormData();
  formData.append("school_id", values.schoolID ?? "");
  formData.append("app_id", values.appID);
  formData.append("version_name", values.versionName);
  formData.append("env", values.env);
  formData.append("note", values.note ?? "");
  formData.append("version_id", values.versionID ?? "");
  formData.append("is_lastest_version", values.isLatestVersion ? "1" : "0");
  formData.append("force_update", values.forceUpdate ? "1" : "0");

  if (values.file && Array.isArray(values.file) && values.file.length > 0) {
    const fileObj = values.file[0];
    if (fileObj?.originFileObj) {
      formData.append("file", fileObj.originFileObj);
    }
  }

  return formData;
};

//** ตรวจสอบรหัสผ่านสำหรับเข้าถึงระบบ
export const validatePassword = (
  password: string,
  correctPassword: string,
): boolean => {
  return password === correctPassword;
};

//** แปลงข้อมูลโรงเรียนเป็น options สำหรับ Select component
export const buildSchoolOptions = (
  schools: any[],
): Array<{ label: string; value: string }> => {
  if (!Array.isArray(schools)) {
    return [{ label: "ทุกโรงเรียน", value: "" }];
  }

  const schoolOptions = schools.map((item: any) => {
    const schoolId = item.school_id || item.SchoolID;
    const thaiName = item.SchoolName || item.company_name;
    const englishName = item.SchoolNameEN || "";

    return {
      label: `[${schoolId}] ${thaiName}${englishName ? ` (${englishName})` : ""}`,
      value: String(schoolId),
    };
  });

  return [{ label: "ทุกโรงเรียน", value: "" }, ...schoolOptions];
};

//** คัดลอกข้อความไปยัง clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
};
