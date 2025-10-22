import {PrismaTimesheet} from "@/helpers/prisma-timesheet";
import {ApiLogResponse, CreateApiLogRequest, GetApiLogsRequest} from "@/types/api-log.types";

/**
 * Service สำหรับจัดการ API Logging
 * ใช้สำหรับบันทึกและดึงข้อมูล API Log จากฐานข้อมูล
 */
export class ApiLogService {
    /**
     * การทำงาน: สร้าง API Log ใหม่ในฐานข้อมูล
     * @param logData ข้อมูล API Log ที่ต้องการบันทึก
     * @returns Promise<ApiLogResponse> ข้อมูล API Log ที่สร้างแล้ว
     */
    static async createApiLog(logData: CreateApiLogRequest): Promise<ApiLogResponse> {
        try {
            const newApiLog = await PrismaTimesheet.apiLog.create({
                data: {
                    request_time: logData.requestTime,
                    response_time: logData.responseTime,
                    duration_ms: logData.durationMs,
                    method: logData.method,
                    status_code: logData.statusCode,
                    url: logData.url,
                    endpoint: logData.endpoint,
                    service_name: logData.serviceName,
                    request_header: logData.requestHeader || undefined,
                    request_body: logData.requestBody || undefined,
                    response_body: logData.responseBody || undefined,
                    ip_address: logData.ipAddress,
                    user_agent: logData.userAgent,
                    called_by: logData.calledBy,
                    trace_id: logData.traceId,
                    error_message: logData.errorMessage,
                    is_success: logData.isSuccess ?? true,
                    is_archived: logData.isArchived ?? false,
                },
            });

            return {
                id: newApiLog.id,
                requestTime: newApiLog.request_time,
                responseTime: newApiLog.response_time || undefined,
                durationMs: newApiLog.duration_ms || undefined,
                method: newApiLog.method || undefined,
                statusCode: newApiLog.status_code || undefined,
                url: newApiLog.url || undefined,
                endpoint: newApiLog.endpoint || undefined,
                serviceName: newApiLog.service_name || undefined,
                requestHeader: newApiLog.request_header as Record<string, any>,
                requestBody: newApiLog.request_body as Record<string, any>,
                responseBody: newApiLog.response_body as Record<string, any>,
                ipAddress: newApiLog.ip_address || undefined,
                userAgent: newApiLog.user_agent || undefined,
                calledBy: newApiLog.called_by || undefined,
                traceId: newApiLog.trace_id || undefined,
                errorMessage: newApiLog.error_message || undefined,
                isSuccess: newApiLog.is_success,
                createdAt: newApiLog.created_at,
                isArchived: newApiLog.is_archived,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to create API log: ${errorMessage}`);
        }
    }

    /**
     * การทำงาน: ดึงข้อมูล API Log ตาม ID
     * @param id รหัส API Log ที่ต้องการดึง
     * @returns Promise<ApiLogResponse | null> ข้อมูล API Log หรือ null ถ้าไม่พบ
     */
    static async getApiLogById(id: bigint): Promise<ApiLogResponse | null> {
        try {
            const apiLog = await PrismaTimesheet.apiLog.findUnique({
                where: {id},
            });

            if (!apiLog) {
                return null;
            }

            return {
                id: apiLog.id,
                requestTime: apiLog.request_time,
                responseTime: apiLog.response_time || undefined,
                durationMs: apiLog.duration_ms || undefined,
                method: apiLog.method || undefined,
                statusCode: apiLog.status_code || undefined,
                url: apiLog.url || undefined,
                endpoint: apiLog.endpoint || undefined,
                serviceName: apiLog.service_name || undefined,
                requestHeader: apiLog.request_header as Record<string, any>,
                requestBody: apiLog.request_body as Record<string, any>,
                responseBody: apiLog.response_body as Record<string, any>,
                ipAddress: apiLog.ip_address || undefined,
                userAgent: apiLog.user_agent || undefined,
                calledBy: apiLog.called_by || undefined,
                traceId: apiLog.trace_id || undefined,
                errorMessage: apiLog.error_message || undefined,
                isSuccess: apiLog.is_success,
                createdAt: apiLog.created_at,
                isArchived: apiLog.is_archived,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to get API log: ${errorMessage}`);
        }
    }

    /**
     * การทำงาน: ดึงข้อมูล API Log หลายรายการพร้อม pagination และ filters
     * @param filters ตัวกรองและการตั้งค่าต่างๆ
     * @returns Promise<{ data: ApiLogResponse[], total: number }> ข้อมูล API Log และจำนวนรวม
     */
    static async getApiLogs(
        filters: GetApiLogsRequest = {}
    ): Promise<{ data: ApiLogResponse[]; total: number }> {
        try {
            const {
                page = 1,
                limit = 10,
                serviceName,
                isSuccess,
                method,
                statusCode,
                endpoint,
                calledBy,
                traceId,
                dateFrom,
                dateTo,
                isArchived,
                sortBy = 'request_time',
                sortOrder = 'desc'
            } = filters;

            const skip = (page - 1) * limit;
            const where: any = {};

            // กรองตาม service name
            if (serviceName) {
                where.service_name = serviceName;
            }

            // กรองตามสถานะความสำเร็จ
            if (typeof isSuccess === "boolean") {
                where.is_success = isSuccess;
            }

            // กรองตาม HTTP method
            if (method) {
                where.method = method;
            }

            // กรองตาม status code
            if (statusCode) {
                where.status_code = statusCode;
            }

            // กรองตาม endpoint
            if (endpoint) {
                where.endpoint = {
                    contains: endpoint,
                    mode: 'insensitive'
                };
            }

            // กรองตาม called_by
            if (calledBy) {
                where.called_by = calledBy;
            }

            // กรองตาม trace_id
            if (traceId) {
                where.trace_id = traceId;
            }

            // กรองตามช่วงเวลา
            if (dateFrom || dateTo) {
                where.request_time = {};
                if (dateFrom) {
                    where.request_time.gte = dateFrom;
                }
                if (dateTo) {
                    where.request_time.lte = dateTo;
                }
            }

            // กรองตาม archive status
            if (typeof isArchived === "boolean") {
                where.is_archived = isArchived;
            }

            // การเรียงลำดับ
            const orderBy: any = {};
            orderBy[sortBy] = sortOrder;

            const [apiLogs, total] = await Promise.all([
                PrismaTimesheet.apiLog.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                }),
                PrismaTimesheet.apiLog.count({where}),
            ]);

            const mappedData: ApiLogResponse[] = apiLogs.map((apiLog) => ({
                id: apiLog.id,
                requestTime: apiLog.request_time,
                responseTime: apiLog.response_time || undefined,
                durationMs: apiLog.duration_ms || undefined,
                method: apiLog.method || undefined,
                statusCode: apiLog.status_code || undefined,
                url: apiLog.url || undefined,
                endpoint: apiLog.endpoint || undefined,
                serviceName: apiLog.service_name || undefined,
                requestHeader: apiLog.request_header as Record<string, any>,
                requestBody: apiLog.request_body as Record<string, any>,
                responseBody: apiLog.response_body as Record<string, any>,
                ipAddress: apiLog.ip_address || undefined,
                userAgent: apiLog.user_agent || undefined,
                calledBy: apiLog.called_by || undefined,
                traceId: apiLog.trace_id || undefined,
                errorMessage: apiLog.error_message || undefined,
                isSuccess: apiLog.is_success,
                createdAt: apiLog.created_at,
                isArchived: apiLog.is_archived,
            }));

            return {
                data: mappedData,
                total,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to get API logs: ${errorMessage}`);
        }
    }

    /**
     * การทำงาน: ลบ API Log ตาม ID
     * @param id รหัส API Log ที่ต้องการลบ
     * @returns Promise<boolean> true ถ้าลบสำเร็จ
     */
    static async deleteApiLog(id: bigint): Promise<boolean> {
        try {
            await PrismaTimesheet.apiLog.delete({
                where: {id},
            });

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to delete API log: ${errorMessage}`);
        }
    }

    /**
     * การทำงาน: อัปเดตสถานะ archive ของ API Log
     * @param id รหัส API Log ที่ต้องการอัปเดต
     * @param isArchived สถานะ archive ใหม่
     * @returns Promise<ApiLogResponse> ข้อมูล API Log ที่อัปเดตแล้ว
     */
    static async updateArchiveStatus(id: bigint, isArchived: boolean): Promise<ApiLogResponse> {
        try {
            const updatedApiLog = await PrismaTimesheet.apiLog.update({
                where: {id},
                data: {is_archived: isArchived},
            });

            return {
                id: updatedApiLog.id,
                requestTime: updatedApiLog.request_time,
                responseTime: updatedApiLog.response_time || undefined,
                durationMs: updatedApiLog.duration_ms || undefined,
                method: updatedApiLog.method || undefined,
                statusCode: updatedApiLog.status_code || undefined,
                url: updatedApiLog.url || undefined,
                endpoint: updatedApiLog.endpoint || undefined,
                serviceName: updatedApiLog.service_name || undefined,
                requestHeader: updatedApiLog.request_header as Record<string, any>,
                requestBody: updatedApiLog.request_body as Record<string, any>,
                responseBody: updatedApiLog.response_body as Record<string, any>,
                ipAddress: updatedApiLog.ip_address || undefined,
                userAgent: updatedApiLog.user_agent || undefined,
                calledBy: updatedApiLog.called_by || undefined,
                traceId: updatedApiLog.trace_id || undefined,
                errorMessage: updatedApiLog.error_message || undefined,
                isSuccess: updatedApiLog.is_success,
                createdAt: updatedApiLog.created_at,
                isArchived: updatedApiLog.is_archived,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to update archive status: ${errorMessage}`);
        }
    }

    /**
     * การทำงาน: ดึงรายชื่อ service ทั้งหมดที่ไม่ซ้ำกัน
     * @returns Promise<{ service_name: string }[]> รายชื่อ service ทั้งหมด
     */
    static async findAllServices(): Promise<{ service_name: string }[]> {
        try {
            const services = await PrismaTimesheet.apiLog.findMany({
                where: {
                    service_name: {
                        not: null
                    }
                },
                select: {
                    service_name: true
                },
                distinct: ['service_name'],
                orderBy: {
                    service_name: 'asc'
                }
            });

            // กรองเฉพาะค่าที่ไม่เป็น null และแปลงให้เป็น format ที่ต้องการ
            return services
                .filter(service => service.service_name !== null)
                .map(service => ({
                    service_name: service.service_name!
                }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to find all services: ${errorMessage}`);
        }
    }
}
