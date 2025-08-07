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
  const thaiDate = new Date(date);
  return thaiDate.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};