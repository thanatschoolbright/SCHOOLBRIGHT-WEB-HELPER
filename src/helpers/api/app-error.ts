// ใช้ throw AppError ใน Service Layer เพื่อแยก business rule violation (4xx) ออกจาก unexpected error (500)
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
