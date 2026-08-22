import { createHash } from "node:crypto";

export const PAYMENT_PROVIDERS = ["JazzCash", "Easypaisa", "Bank Transfer"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
export type PaymentStatus = "initiated" | "pending_verification" | "paid" | "failed" | "cancelled";

export type PaymentInitiation = {
  provider: PaymentProvider;
  status: PaymentStatus;
  reference: string;
  amount: number;
  returnUrl: string;
};

export function createPaymentReference(provider: PaymentProvider, issuedAt = new Date()) {
  const providerCode = provider === "JazzCash" ? "JAZ" : provider === "Easypaisa" ? "EAS" : "BNK";
  const date = issuedAt.toISOString().slice(0, 10).replaceAll("-", "");
  return `LMS-${providerCode}-${date}-${issuedAt.getTime().toString().slice(-6)}`;
}

export function createPaymentInitiation(input: { provider: PaymentProvider; amount: number; returnUrl: string; issuedAt?: Date }): PaymentInitiation {
  if (!PAYMENT_PROVIDERS.includes(input.provider)) throw new Error("Unsupported payment provider");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Payment amount must be positive");
  return {
    provider: input.provider,
    status: "initiated",
    reference: createPaymentReference(input.provider, input.issuedAt),
    amount: input.amount,
    returnUrl: input.returnUrl,
  };
}

export function createCloudinaryUploadSignature(input: { timestamp: number; folder: string; publicId?: string; apiSecret: string }) {
  const parameters = [
    `folder=${input.folder}`,
    input.publicId ? `public_id=${input.publicId}` : undefined,
    `timestamp=${input.timestamp}`,
  ].filter(Boolean).sort().join("&");
  return createHash("sha1").update(`${parameters}${input.apiSecret}`).digest("hex");
}

export function getIntegrationReadiness(env: Record<string, string | undefined> = process.env) {
  return {
    cloudinary: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
    jazzCash: Boolean(env.JAZZCASH_MERCHANT_ID && env.JAZZCASH_PASSWORD && env.JAZZCASH_INTEGRITY_SALT),
    easypaisa: Boolean(env.EASYPAISA_STORE_ID && env.EASYPAISA_HASH_KEY),
    bankTransfer: Boolean(env.BANK_TRANSFER_ACCOUNT_TITLE && env.BANK_TRANSFER_ACCOUNT_NUMBER && env.BANK_TRANSFER_NAME),
    emailReminders: Boolean(env.REMINDER_EMAIL_FROM && env.REMINDER_EMAIL_API_KEY),
    whatsappReminders: Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID),
  };
}

export function feeReminderCandidates<T extends { dueDate: Date; feeStatus: "paid" | "due" | "overdue" }>(records: T[], now = new Date()) {
  return records.filter(record => record.feeStatus !== "paid" && record.dueDate.getTime() <= now.getTime());
}
