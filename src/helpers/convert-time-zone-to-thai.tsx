export const convertTimeZoneToThai = (date: Date) => {
    return new Date(date).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};


export const convertToThaiDateDDMMYYY = (date: string) => {
    const d = new Date(date); // date ควรเป็น ISO ที่มี timezone ชัดเจน เช่น `...Z` หรือ `+07:00`
    return d.toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};
