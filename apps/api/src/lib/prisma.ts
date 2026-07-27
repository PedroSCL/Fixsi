import { PrismaClient } from "@fixsi/database";
import { PrismaPg } from "@prisma/adapter-pg";
import { getEnvironment } from "../config/env";

const connectionString = getEnvironment().DATABASE_URL;
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
