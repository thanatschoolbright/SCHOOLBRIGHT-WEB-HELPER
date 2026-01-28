import { PrismaClient } from "generated/prisma-timesheet";

const prismaTimesheetSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaTimesheetGlobal:
    | undefined
    | ReturnType<typeof prismaTimesheetSingleton>;
}

const prisma = globalThis.prismaTimesheetGlobal ?? prismaTimesheetSingleton();

export default prisma;
export const PrismaTimesheet = prisma;

if (process.env.NODE_ENV !== "production")
  globalThis.prismaTimesheetGlobal = prisma;
