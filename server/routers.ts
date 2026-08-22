import { SignJWT } from "jose";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getMonthlyInstitutionTrends, updateUserProfileImage, updateUserProfilePhotoPrivacy } from "./db";
import { createCloudinaryUploadSignature, createPaymentInitiation, getIntegrationReadiness, PAYMENT_PROVIDERS } from "./integrations";
import { parseProfilePhotoDataUrl } from "./profilePhoto";
import { storagePut } from "./storage";

export type LmsRole = "admin" | "teacher" | "student";

type DemoAccount = {
  identity: string;
  password: string;
  name: string;
  role: LmsRole;
  rollNo?: string;
};

const demoAccounts: DemoAccount[] = [
  { identity: "admin", password: "admin123", name: "Ayesha Khalid", role: "admin" },
  { identity: "teacher@academy.pk", password: "teacher123", name: "Dr. Sara Ahmed", role: "teacher" },
  { identity: "SCI-2026-041", password: "student123", name: "Hania Raza", role: "student", rollNo: "SCI-2026-041" },
];

export const FEE_RULES = {
  admission: 5000,
  monthlyPerSubject: 3000,
  semesterExam: 1000,
  late: 200,
} as const;

export function calculateFeeTotal(input: {
  subjectCount: number;
  includeAdmission?: boolean;
  includeExam?: boolean;
  dueDate?: Date;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const hasLateFee = Boolean(input.dueDate && now > input.dueDate);
  const monthly = Math.max(0, input.subjectCount) * FEE_RULES.monthlyPerSubject;
  const total =
    monthly +
    (input.includeAdmission ? FEE_RULES.admission : 0) +
    (input.includeExam ? FEE_RULES.semesterExam : 0) +
    (hasLateFee ? FEE_RULES.late : 0);

  return { monthly, lateFee: hasLateFee ? FEE_RULES.late : 0, total };
}

async function createDemoToken(account: DemoAccount) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "lms-demo-signing-secret");
  return new SignJWT({ role: account.role, name: account.name, rollNo: account.rollNo })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(account.identity)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  lms: router({
    login: publicProcedure
      .input(z.object({ identity: z.string().min(1), password: z.string().min(1), role: z.enum(["admin", "teacher", "student"]) }))
      .mutation(async ({ input }) => {
        const account = demoAccounts.find(
          candidate =>
            candidate.identity.toLowerCase() === input.identity.toLowerCase() &&
            candidate.password === input.password &&
            candidate.role === input.role,
        );
        if (!account) {
          throw new Error("Invalid role, username or password");
        }
        return {
          token: await createDemoToken(account),
          user: { name: account.name, role: account.role, rollNo: account.rollNo },
        };
      }),
    feePreview: publicProcedure
      .input(z.object({ subjectCount: z.number().int().min(0), includeAdmission: z.boolean(), includeExam: z.boolean(), overdue: z.boolean() }))
      .query(({ input }) =>
        calculateFeeTotal({
          subjectCount: input.subjectCount,
          includeAdmission: input.includeAdmission,
          includeExam: input.includeExam,
          dueDate: input.overdue ? new Date("2026-01-01") : new Date("2099-01-01"),
          now: new Date("2026-08-22"),
        }),
      ),
  }),
  analytics: router({
    monthlyTrends: publicProcedure
      .input(z.object({ months: z.number().int().min(1).max(24).default(6) }))
      .query(({ input }) => getMonthlyInstitutionTrends(input.months)),
  }),
  integrations: router({
    readiness: publicProcedure.query(() => getIntegrationReadiness()),
    initiatePayment: publicProcedure
      .input(z.object({ provider: z.enum(PAYMENT_PROVIDERS), amount: z.number().positive(), returnUrl: z.string().url() }))
      .mutation(({ input }) => createPaymentInitiation(input)),
    cloudinaryUploadSignature: publicProcedure
      .input(z.object({ timestamp: z.number().int().positive(), folder: z.string().min(1), publicId: z.string().optional() }))
      .mutation(({ input }) => {
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        if (!apiSecret || !cloudName || !apiKey) throw new Error("Cloudinary is not configured");
        return {
          timestamp: input.timestamp,
          folder: input.folder,
          publicId: input.publicId,
          signature: createCloudinaryUploadSignature({ ...input, apiSecret }),
          cloudName,
          apiKey,
        };
      }),
  }),
  profile: router({
    updatePhoto: protectedProcedure
      .input(z.object({ dataUrl: z.string().min(32).max(6_000_000) }))
      .mutation(async ({ ctx, input }) => {
        const photo = parseProfilePhotoDataUrl(input.dataUrl);
        const { url } = await storagePut(`users/${ctx.user.id}/profile/profile-photo.${photo.extension}`, photo.data, photo.contentType);
        await updateUserProfileImage(ctx.user.id, url);
        return { profileImageUrl: url };
      }),
    updatePhotoPrivacy: protectedProcedure
      .input(z.object({ visibleToTeachers: z.boolean(), visibleToClassmates: z.boolean() }))
      .mutation(async ({ ctx, input }) => updateUserProfilePhotoPrivacy(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
