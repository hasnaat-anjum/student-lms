import { and, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { attendanceRecords, feePayments, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export type MonthlyInstitutionTrend = {
  month: string;
  fees: number;
  attendance: number | null;
};

export function mergeMonthlyInstitutionTrendRows(
  feeRows: Array<{ month: string | null; fees: string | number }>,
  attendanceRows: Array<{ month: string | null; attendance: string | number | null }>,
): MonthlyInstitutionTrend[] {
  const data = new Map<string, MonthlyInstitutionTrend>();
  for (const row of feeRows) {
    if (!row.month) continue;
    data.set(String(row.month), { month: String(row.month), fees: Number(row.fees), attendance: null });
  }
  for (const row of attendanceRows) {
    if (!row.month) continue;
    const current = data.get(String(row.month)) ?? { month: String(row.month), fees: 0, attendance: null };
    current.attendance = row.attendance === null ? null : Number(row.attendance);
    data.set(String(row.month), current);
  }
  return Array.from(data.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export async function getMonthlyInstitutionTrends(months = 6): Promise<MonthlyInstitutionTrend[]> {
  const db = await getDb();
  if (!db) return [];

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - Math.max(0, months - 1));
  const startDate = start.toISOString().slice(0, 10);
  const feeMonth = sql<string>`DATE_FORMAT(${feePayments.paidAt}, '%Y-%m')`.as("month");
  const attendanceMonth = sql<string>`DATE_FORMAT(${attendanceRecords.recordedOn}, '%Y-%m')`.as("month");

  const [feeRows, attendanceRows] = await Promise.all([
    db.select({
      month: feeMonth,
      fees: sql<string>`COALESCE(SUM(${feePayments.amountPkr}), 0)`,
    }).from(feePayments).where(and(eq(feePayments.status, "paid"), sql`${feePayments.paidAt} >= ${startDate}`)).groupBy(sql`month`).orderBy(sql`month`),
    db.select({
      month: attendanceMonth,
      attendance: sql<string>`ROUND(AVG(CASE WHEN ${attendanceRecords.status} = 'present' THEN 100 ELSE 0 END), 1)`,
    }).from(attendanceRecords).where(sql`${attendanceRecords.recordedOn} >= DATE(${startDate})`).groupBy(sql`month`).orderBy(sql`month`),
  ]);

  return mergeMonthlyInstitutionTrendRows(feeRows, attendanceRows);
}
