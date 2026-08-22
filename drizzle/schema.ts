import { date, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  profileImageUrl: text("profileImageUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const feePayments = mysqlTable("feePayments", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  amountPkr: int("amountPkr").notNull(),
  status: mysqlEnum("status", ["initiated", "pending_verification", "paid", "failed", "cancelled"]).notNull().default("initiated"),
  paymentProvider: varchar("paymentProvider", { length: 32 }).notNull(),
  paidAt: timestamp("paidAt"),
  invoiceMonth: date("invoiceMonth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("fee_payments_paid_at_idx").on(table.paidAt),
  index("fee_payments_student_idx").on(table.studentUserId),
]);

export const attendanceRecords = mysqlTable("attendanceRecords", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  courseCode: varchar("courseCode", { length: 32 }).notNull(),
  recordedOn: date("recordedOn").notNull(),
  status: mysqlEnum("status", ["present", "absent", "leave"]).notNull(),
  markedByUserId: int("markedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("attendance_recorded_on_idx").on(table.recordedOn),
  index("attendance_student_idx").on(table.studentUserId),
]);

export type FeePayment = typeof feePayments.$inferSelect;
export type InsertFeePayment = typeof feePayments.$inferInsert;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;
