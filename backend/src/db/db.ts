import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "../lib/logger.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export async function assertDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Connected to postgres via Prisma");
  } catch (err) {
    throw err;
  }
}