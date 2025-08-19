/**
 * แปลงวันที่จาก yyyy-mm-dd เป็น mm/dd/yyyy
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0"); // เดือนเริ่มจาก 0
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

/**
 * รับ object และคืน object ใหม่ที่มีวันที่ในรูปแบบ mm/dd/yyyy
 */
export default function formatDateToMMDDYYYY(date: string) {
    return formatDate(date)
}

