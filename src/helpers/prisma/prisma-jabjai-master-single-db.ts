import { PrismaClient } from "generated/jabjai-master";

const prismaJabjaiMasterSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaJabjaiMasterGlobal:
    | undefined
    | ReturnType<typeof prismaJabjaiMasterSingleton>;
}

const prisma =
  globalThis.prismaJabjaiMasterGlobal ?? prismaJabjaiMasterSingleton();

export default prisma;
export const PrismaJabjaiMaster = prisma;

if (process.env.NODE_ENV !== "production")
  globalThis.prismaJabjaiMasterGlobal = prisma;
