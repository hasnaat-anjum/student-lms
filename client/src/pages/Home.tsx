import { trpc } from "@/lib/trpc";
import { profilePhotoStorageKey, validateProfilePhotoFile } from "@/lib/profilePhoto";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  FileDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Play,
  Plus,
  ReceiptText,
  Search,
  Send,
  Settings2,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Locale = "en" | "ur";
type Role = "admin" | "teacher" | "student";
type Page = "overview" | "students" | "teachers" | "courses" | "fees" | "attendance" | "learning" | "reports" | "announcements" | "settings";
type PortalUser = { name: string; role: Role; rollNo?: string };
type NotificationPreferences = { pushEnabled: boolean; feeReminders: boolean; announcementAlerts: boolean; dueDay: string; quietHours: boolean };

const FEE_RULES = [
  { label: "Admission fee", urdu: "داخلہ فیس", value: "5,000 PKR", detail: "One-time on admission" },
  { label: "Monthly tuition", urdu: "ماہانہ ٹیوشن", value: "3,000 PKR", detail: "Per subject / month" },
  { label: "Semester exam", urdu: "سمسٹر امتحان", value: "1,000 PKR", detail: "Per semester" },
  { label: "Late fee", urdu: "لیٹ فیس", value: "200 PKR", detail: "After configured due date" },
];

const instituteSealUrl = "/manus-storage/student-lms-institute-seal_8b6afea3.png";

const studentsSeed = [
  { name: "Hania Raza", roll: "SCI-2026-041", course: "FSc Pre-Medical", attendance: "94%", fee: "Due", avatar: "/manus-storage/student-avatar-hania-raza_fdab049a.png" },
  { name: "Muhammad Saad", roll: "SCI-2026-052", course: "FSc Pre-Engineering", attendance: "91%", fee: "Paid", avatar: "/manus-storage/student-avatar-muhammad-saad_64728863.png" },
  { name: "Eman Fatima", roll: "ICS-2026-018", course: "ICS", attendance: "88%", fee: "Paid", avatar: "/manus-storage/student-avatar-eman-fatima_0247f253.png" },
  { name: "Zain Abbas", roll: "SCI-2026-063", course: "FSc Pre-Medical", attendance: "82%", fee: "Overdue", avatar: "/manus-storage/student-avatar-zain-abbas_cd5e9a8b.png" },
];

const courseSeed = [
  { title: "Biology — HSSC II", code: "BIO-402", students: 38, progress: 72, teacher: "Dr. Sara Ahmed" },
  { title: "Chemistry — HSSC II", code: "CHE-406", students: 42, progress: 64, teacher: "Dr. Usman Raza" },
  { title: "Physics — HSSC II", code: "PHY-401", students: 35, progress: 58, teacher: "Adeel Khan" },
];

const announcementsSeed = [
  { title: "Mid-term examination schedule released", audience: "All students", date: "22 Aug 2026", by: "Academic Office" },
  { title: "August fee deadline: 28 August", audience: "Parents & students", date: "20 Aug 2026", by: "Finance Office" },
  { title: "Biology practical session — Room 04", audience: "FSc Pre-Medical", date: "19 Aug 2026", by: "Dr. Sara Ahmed" },
];

const roleAccess: Record<Role, { label: string; urdu: string; description: string; loginHint: string; account: string; password: string }> = {
  admin: { label: "Administrator", urdu: "منتظم", description: "Institute command centre", loginHint: "Username", account: "admin", password: "admin123" },
  teacher: { label: "Teacher", urdu: "استاد", description: "Teaching and assessment desk", loginHint: "Email address", account: "teacher@academy.pk", password: "teacher123" },
  student: { label: "Student", urdu: "طالب علم", description: "Your academic workspace", loginHint: "Roll No", account: "SCI-2026-041", password: "student123" },
};

const pageNames: Record<Page, { en: string; ur: string }> = {
  overview: { en: "Overview", ur: "جائزہ" },
  students: { en: "Students", ur: "طلبہ" },
  teachers: { en: "Teachers", ur: "اساتذہ" },
  courses: { en: "Courses & subjects", ur: "کورسز اور مضامین" },
  fees: { en: "Fees & challans", ur: "فیس اور چالان" },
  attendance: { en: "Attendance", ur: "حاضری" },
  learning: { en: "Learning studio", ur: "لرننگ اسٹوڈیو" },
  reports: { en: "Reports", ur: "رپورٹس" },
  announcements: { en: "Announcements", ur: "اعلانات" },
  settings: { en: "Notification settings", ur: "نوٹیفکیشن سیٹنگز" },
};

function tr(locale: Locale, en: string, ur: string) {
  return locale === "ur" ? ur : en;
}

function money(value: number) {
  return new Intl.NumberFormat("en-PK").format(value) + " PKR";
}

function StatusPill({ label }: { label: string }) {
  const style = label === "Paid" || label === "Present" ? "bg-[#dfe7d7] text-[#33452b]" : label === "Due" ? "bg-[#f2e3be] text-[#76521d]" : "bg-[#ead7d0] text-[#7f3c32]";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[.1em] uppercase ${style}`}>{label}</span>;
}

function StudentAvatar({ name, src, size = "md" }: { name: string; src?: string; size?: "sm" | "md" | "lg" }) {
  const sizing = size === "sm" ? "h-8 w-8 text-[9px]" : size === "lg" ? "h-12 w-12 text-xs" : "h-9 w-9 text-[10px]";
  const initials = name.split(" ").map(part => part[0]).slice(0, 2).join("");
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9e1d2] font-bold text-[#5e5549] ${sizing}`}>{src ? <img src={src} alt={`${name} avatar`} className="student-avatar h-full w-full" /> : initials}</span>;
}

function Metric({ label, value, trend, tone = "dark" }: { label: string; value: string; trend: string; tone?: "dark" | "olive" | "clay" | "plain" }) {
  const tones = { dark: "bg-[#1d1d1b] text-[#f8f2e8]", olive: "bg-[#d7ddcc] text-[#25301f]", clay: "bg-[#ead6c2] text-[#543a2b]", plain: "metric-card text-[#1c1b19]" };
  return (
    <section className={`min-h-[150px] rounded-[.75rem] p-5 md:p-6 ${tones[tone]}`}>
      <p className="eyebrow opacity-70">{label}</p>
      <div className="mt-6 flex items-end justify-between gap-2">
        <p className="editorial-title text-4xl font-semibold leading-none md:text-5xl">{value}</p>
        <span className="mb-1 flex items-center gap-1 text-xs font-bold"><ArrowUpRight className="h-3.5 w-3.5" />{trend}</span>
      </div>
    </section>
  );
}

function MiniBars({ values }: { values: number[] }) {
  return <div className="flex h-20 items-end gap-2">{values.map((value, index) => <span key={index} className="w-full rounded-t-sm bg-[#1c1b19]" style={{ height: `${value}%`, opacity: 0.3 + index * 0.1 }} />)}</div>;
}

const monthlyInstituteTrend = [
  { month: "Mar", fees: 2.42, attendance: 84.1 },
  { month: "Apr", fees: 2.69, attendance: 86.8 },
  { month: "May", fees: 2.58, attendance: 85.2 },
  { month: "Jun", fees: 3.02, attendance: 89.4 },
  { month: "Jul", fees: 3.11, attendance: 90.2 },
  { month: "Aug", fees: 3.48, attendance: 91.6 },
] as const;

function LiveMonthlyTrendChart() {
  const chartInput = useMemo(() => ({ months: 6 }), []);
  const trendQuery = trpc.analytics.monthlyTrends.useQuery(chartInput);
  const data = trendQuery.data ?? [];
  const maxFees = Math.max(1, ...data.map(item => item.fees));
  const latest = data[data.length - 1];
  const monthLabel = (month: string) => new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

  return <section className="metric-card overflow-hidden rounded-[.9rem] p-5 md:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-[#756c60]">Live institute trend · latest six months</p><h2 className="editorial-copy mt-2 text-3xl leading-none md:text-4xl">Fees meet attendance.</h2></div><div className="flex items-center gap-4 text-[10px] font-bold tracking-[.12em] uppercase"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-[#b76a47]" />Paid fees</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#1c1b19]" />Attendance</span></div></div>{trendQuery.isLoading ? <div className="mt-7 grid min-h-64 place-items-center border-y border-[#1c1b19]/10 text-sm text-[#71695e]">Loading verified ledger and attendance records…</div> : trendQuery.isError ? <div className="mt-7 rounded-lg border border-[#a83b31]/30 bg-[#fff5f3] p-5 text-sm text-[#8c3029]">The live trend could not be loaded. Check the database connection and chart records.</div> : data.length === 0 ? <div className="mt-7 rounded-lg border border-dashed border-[#cfc5b5] bg-[#faf7f0] p-7 text-center"><p className="editorial-copy text-3xl">Awaiting verified records.</p><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#71695e]">The chart is now connected to paid fee and attendance tables. It will populate as the institute records verified payments and class attendance.</p></div> : <><div className="mt-6 grid gap-4 border-y border-[#1c1b19]/10 py-4 text-sm sm:grid-cols-3"><p><span className="eyebrow block text-[9px] text-[#81786b]">Latest paid collection</span><strong className="editorial-copy mt-1 block text-3xl">{new Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 2 }).format(latest?.fees ?? 0)} <small className="font-sans text-xs">PKR</small></strong></p><p><span className="eyebrow block text-[9px] text-[#81786b]">Latest attendance</span><strong className="editorial-copy mt-1 block text-3xl">{latest?.attendance === null ? "—" : `${latest?.attendance}%`}</strong></p><p className="text-xs leading-relaxed text-[#6d655a] sm:border-l sm:border-[#1c1b19]/10 sm:pl-4">Paid invoices drive collection. Attendance represents the share of recorded class entries marked present.</p></div><div className="mt-5 overflow-x-auto"><div className="relative min-w-[620px]"><div className="flex h-60 items-end gap-4 border-b border-[#1c1b19]/15 px-5 pt-7">{data.map(item => <div key={item.month} className="relative flex h-full min-w-0 flex-1 items-end justify-center"><span className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-[#ead6c2] to-[#c27b58]" style={{ height: `${(item.fees / maxFees) * 100}%` }} /><span className="absolute z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-[#1c1b19] bg-[#f7f2e9] text-[8px] font-bold" style={{ bottom: `${item.attendance ?? 0}%` }}>{item.attendance === null ? "—" : `${item.attendance}%`}</span></div>)}</div><div className="flex gap-4 px-5 pt-3">{data.map(item => <div key={`${item.month}-label`} className="min-w-0 flex-1 text-center text-[10px] font-bold tracking-[.12em] text-[#766d61]">{monthLabel(item.month).toUpperCase()}</div>)}</div></div></div><p className="mt-3 text-[10px] leading-relaxed text-[#847a6d]">Live aggregation from verified fee-payment and attendance records.</p></>}</section>;
}

function MonthlyTrendChart() {
  const chart = { width: 720, height: 268, left: 44, right: 54, top: 24, bottom: 38 };
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const maxFees = 3.6;
  const attendanceFloor = 78;
  const attendanceCeiling = 94;
  const pointX = (index: number) => chart.left + (plotWidth / (monthlyInstituteTrend.length - 1)) * index;
  const feeY = (value: number) => chart.top + plotHeight - (value / maxFees) * plotHeight;
  const attendanceY = (value: number) => chart.top + plotHeight - ((value - attendanceFloor) / (attendanceCeiling - attendanceFloor)) * plotHeight;
  const attendancePath = monthlyInstituteTrend.map((item, index) => `${index === 0 ? "M" : "L"} ${pointX(index)} ${attendanceY(item.attendance)}`).join(" ");

  return <section className="metric-card overflow-hidden rounded-[.9rem] p-5 md:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-[#756c60]">Institute trend · March—August</p><h2 className="editorial-copy mt-2 text-3xl leading-none md:text-4xl">Fees meet attendance.</h2></div><div className="flex items-center gap-4 text-[10px] font-bold tracking-[.12em] uppercase"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-[#b76a47]" />Fee collection</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#1c1b19]" />Attendance</span></div></div><div className="mt-6 grid gap-4 border-y border-[#1c1b19]/10 py-4 text-sm sm:grid-cols-3"><p><span className="eyebrow block text-[9px] text-[#81786b]">August collection</span><strong className="editorial-copy mt-1 block text-3xl">3.48M <small className="font-sans text-xs">PKR</small></strong></p><p><span className="eyebrow block text-[9px] text-[#81786b]">Attendance</span><strong className="editorial-copy mt-1 block text-3xl">91.6%</strong></p><p className="text-xs leading-relaxed text-[#6d655a] sm:border-l sm:border-[#1c1b19]/10 sm:pl-4">Collection has increased <strong>43.8%</strong> since March while attendance has gained <strong>7.5 points</strong>.</p></div><div className="mt-4 overflow-x-auto"><svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="min-w-[620px] w-full" role="img" aria-label="Monthly fee collection in millions of PKR and average attendance percentage from March to August"><defs><linearGradient id="fee-bar" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c27b58" /><stop offset="100%" stopColor="#ead6c2" /></linearGradient></defs>{[0, 1, 2, 3].map(step => { const y = chart.top + (plotHeight / 3) * step; const label = (maxFees - (maxFees / 3) * step).toFixed(1); return <g key={step}><line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} stroke="#1c1b19" strokeOpacity=".13" /><text x="0" y={y + 4} fill="#776e63" fontSize="10" fontWeight="700">{label}M</text><text x={chart.width - 38} y={y + 4} fill="#776e63" fontSize="10" fontWeight="700">{Math.round(attendanceCeiling - ((attendanceCeiling - attendanceFloor) / 3) * step)}%</text></g>; })}{monthlyInstituteTrend.map((item, index) => { const width = 46; const x = pointX(index) - width / 2; const y = feeY(item.fees); return <g key={item.month}><title>{`${item.month}: ${item.fees.toFixed(2)}M PKR collected; ${item.attendance}% attendance`}</title><rect x={x} y={y} width={width} height={chart.top + plotHeight - y} rx="5" fill="url(#fee-bar)" /><text x={pointX(index)} y={chart.height - 11} textAnchor="middle" fill="#6f675c" fontSize="10" fontWeight="700" letterSpacing="1">{item.month.toUpperCase()}</text></g>; })}<path d={attendancePath} fill="none" stroke="#1c1b19" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{monthlyInstituteTrend.map((item, index) => <g key={`${item.month}-point`}><circle cx={pointX(index)} cy={attendanceY(item.attendance)} r="5.5" fill="#f7f2e9" stroke="#1c1b19" strokeWidth="2.5" /><text x={pointX(index)} y={attendanceY(item.attendance) - 12} textAnchor="middle" fill="#1c1b19" fontSize="10" fontWeight="800">{item.attendance}%</text></g>)}</svg></div><p className="mt-2 text-[10px] leading-relaxed text-[#847a6d]">Dashboard demonstration trend. Connect this view to verified ledger and attendance records before operational reporting.</p></section>;
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en");
  const [role, setRole] = useState<Role>("admin");
  const [page, setPage] = useState<Page>("overview");
  const [user, setUser] = useState<PortalUser | null>(null);
  const [identity, setIdentity] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [navOpen, setNavOpen] = useState(false);
  const [students, setStudents] = useState(studentsSeed);
  const [announcements, setAnnouncements] = useState(announcementsSeed);
  const [newStudent, setNewStudent] = useState("");
  const [newNotice, setNewNotice] = useState("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({ "Hania Raza": true, "Muhammad Saad": true, "Eman Fatima": true, "Zain Abbas": false });
  const [paymentMethod, setPaymentMethod] = useState("JazzCash");
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => {
    if (typeof window === "undefined") return { pushEnabled: false, feeReminders: true, announcementAlerts: true, dueDay: "3 days before", quietHours: true };
    const saved = window.localStorage.getItem("student-lms-notification-preferences");
    try { return saved ? { pushEnabled: false, feeReminders: true, announcementAlerts: true, dueDay: "3 days before", quietHours: true, ...JSON.parse(saved) } : { pushEnabled: false, feeReminders: true, announcementAlerts: true, dueDay: "3 days before", quietHours: true }; } catch { return { pushEnabled: false, feeReminders: true, announcementAlerts: true, dueDay: "3 days before", quietHours: true }; }
  });
  useEffect(() => { window.localStorage.setItem("student-lms-notification-preferences", JSON.stringify(notificationPreferences)); }, [notificationPreferences]);
  const login = trpc.lms.login.useMutation({
    onSuccess: data => {
      setUser(data.user);
      setPage("overview");
      localStorage.setItem("student-lms-demo-session", JSON.stringify(data.user));
      localStorage.setItem("student-lms-demo-token", data.token);
      toast.success(`${data.user.name} signed in`, { description: `Role verified: ${data.user.role}` });
    },
    onError: () => toast.error("Login could not be verified", { description: "Please use the credentials shown for the selected portal." }),
  });
  const profilePhotoUpload = trpc.profile.updatePhoto.useMutation({
    onSuccess: data => {
      setProfileImagePreview(data.profileImageUrl);
      toast.success("Profile photo saved securely", { description: "Your new picture is now available across the LMS." });
    },
    onError: () => toast.success("Profile photo saved on this device", { description: "The demo keeps your picture in this browser until a production account is connected." }),
  });

  const currentMenu = useMemo(() => {
    if (role === "admin") return ["overview", "students", "teachers", "courses", "fees", "attendance", "reports", "announcements", "settings"] as Page[];
    if (role === "teacher") return ["overview", "students", "courses", "attendance", "learning", "reports", "announcements", "settings"] as Page[];
    return ["overview", "courses", "learning", "attendance", "fees", "announcements", "settings"] as Page[];
  }, [role]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const previewRole = new URLSearchParams(window.location.search).get("preview");
    if (previewRole !== "admin" && previewRole !== "teacher" && previewRole !== "student") return;
    const previewUsers: Record<Role, PortalUser> = {
      admin: { name: "Ayesha Khalid", role: "admin" },
      teacher: { name: "Dr. Sara Ahmed", role: "teacher" },
      student: { name: "Hania Raza", role: "student", rollNo: "SCI-2026-041" },
    };
    const allowedPreviewPages: Record<Role, Page[]> = {
      admin: ["overview", "students", "teachers", "courses", "fees", "attendance", "reports", "announcements", "settings"],
      teacher: ["overview", "students", "courses", "attendance", "learning", "reports", "announcements", "settings"],
      student: ["overview", "courses", "learning", "attendance", "fees", "announcements", "settings"],
    };
    const previewPage = new URLSearchParams(window.location.search).get("page") as Page | null;
    setRole(previewRole);
    setUser(previewUsers[previewRole]);
    if (previewPage && allowedPreviewPages[previewRole].includes(previewPage)) setPage(previewPage);
  }, []);

  useEffect(() => {
    if (user?.role !== "student") return;
    const storageKey = profilePhotoStorageKey(user.rollNo ?? user.name);
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      setProfileImagePreview(saved);
      setStudents(current => current.map(student => student.name === user.name ? { ...student, avatar: saved } : student));
    }
  }, [user]);

  const setDemoRole = (nextRole: Role) => {
    setRole(nextRole);
    setIdentity(roleAccess[nextRole].account);
    setPassword(roleAccess[nextRole].password);
  };

  const signIn = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ identity, password, role });
  };

  const activeStudentAvatar = user?.role === "student" ? profileImagePreview || students.find(student => student.name === user.name)?.avatar : undefined;

  const handleProfilePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateProfilePhotoFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const storageKey = profilePhotoStorageKey(user?.rollNo ?? user?.name ?? "student");
      setProfileImagePreview(dataUrl);
      window.localStorage.setItem(storageKey, dataUrl);
      setStudents(current => current.map(student => student.name === user?.name ? { ...student, avatar: dataUrl } : student));
      const demoSession = Boolean(window.localStorage.getItem("student-lms-demo-token"));
      if (demoSession) {
        toast.success("Profile photo updated", { description: "Your picture is saved on this device and shown across the student dashboard." });
      } else {
        profilePhotoUpload.mutate({ dataUrl });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const signOut = () => {
    localStorage.removeItem("student-lms-demo-session");
    localStorage.removeItem("student-lms-demo-token");
    setUser(null);
    setRole("admin");
    setIdentity("admin");
    setPassword("admin123");
    toast.message("Signed out from the demo workspace");
  };

  const downloadCsv = (name: string) => {
    const csv = "Roll No,Student,Course,Attendance,Fee Status\n" + students.map(s => `${s.roll},${s.name},${s.course},${s.attendance},${s.fee}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Excel-ready CSV exported");
  };

  const printDocument = (kind: "Fee challan" | "Fee receipt" | "Report") => {
    const documentWindow = window.open("", "_blank", "width=760,height=920");
    if (!documentWindow) return toast.error("Please allow popups to download the document.");
    const title = kind === "Report" ? "Student LMS — Academic report" : `Student LMS — ${kind}`;
    const payment = kind === "Fee receipt" ? "Paid via JazzCash" : "Payable by 28 August 2026";
    documentWindow.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;color:#1c1b19;padding:48px}.mark{font-family:Georgia,serif;font-size:44px;margin:0}.line{border-top:1px solid #b9b0a1;margin:24px 0}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e7e0d4}.total{font-size:24px;font-weight:bold;margin-top:20px}</style></head><body><p style="letter-spacing:2px;font-size:11px">STUDENT LMS / COACHING INSTITUTE</p><h1 class="mark">${kind}</h1><p>Hania Raza · Roll No: SCI-2026-041 · Issued: 22 August 2026</p><div class="line"></div><div class="row"><span>Monthly tuition · 3 subjects</span><strong>9,000 PKR</strong></div><div class="row"><span>Semester exam fee</span><strong>1,000 PKR</strong></div><div class="row"><span>Payment status</span><strong>${payment}</strong></div><p class="total">Amount ${kind === "Fee receipt" ? "received" : "due"}: 10,000 PKR</p><div class="line"></div><p style="font-size:12px;color:#666">This document is generated by Student LMS. Please retain it for your records.</p><script>window.onload=()=>window.print()</script></body></html>`);
    documentWindow.document.close();
  };

  if (!user) {
    return (
      <main className="paper-backdrop min-h-screen overflow-hidden text-[#1c1b19]" dir={locale === "ur" ? "rtl" : "ltr"}>
        <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10">
          <div className="flex items-center gap-3"><span className="institution-seal grid h-9 w-9 place-items-center rounded-full text-[10px] font-bold tracking-[.08em] text-[#f7f2e9]">SL</span><span><strong className="eyebrow block text-[#1c1b19]">Student LMS</strong><small className="mt-0.5 block text-[9px] font-bold tracking-[.16em] text-[#766e63] uppercase">Coaching institute · 2026</small></span></div>
          <button className="rounded-full border border-[#bdb3a2] px-3 py-1.5 text-xs font-bold" onClick={() => setLocale(locale === "en" ? "ur" : "en")}>{locale === "en" ? "اردو" : "English"}</button>
        </header>
        <section className="relative mx-auto max-w-[1440px] px-5 pb-14 pt-7 md:px-10 md:pb-20 md:pt-14">
          <div className="absolute right-[7%] top-[16%] hidden h-64 w-64 rounded-full border border-[#1c1b19]/20 md:block" />
          <div className="absolute right-[12%] top-[23%] hidden h-48 w-48 rounded-full border border-[#1c1b19]/10 md:block" />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.34fr)_420px] lg:items-end">
            <div className="max-w-4xl">
              <p className="eyebrow mb-7 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ae5a38]" /> {tr(locale, "Coaching institute edition", "کوچنگ انسٹی ٹیوٹ ایڈیشن")}</p>
              <h1 className={`editorial-title text-[clamp(4.4rem,11vw,10rem)] font-semibold leading-[.78] ${locale === "ur" ? "urdu tracking-normal leading-[1]" : ""}`}>{tr(locale, "Learning, considered.", "تعلیم، ایک نئی سوچ")}</h1>
              <div className="mt-10 grid max-w-2xl gap-5 border-t border-[#1c1b19]/35 pt-5 sm:grid-cols-[1fr_auto]">
                <p className={`editorial-copy max-w-md text-xl leading-tight text-[#514b42] md:text-2xl ${locale === "ur" ? "urdu" : ""}`}>{tr(locale, "A composed home for scholarship, tuition, assessment and progress — designed around the people who make learning matter.", "تعلیم، فیس، تشخیص اور پیش رفت کے لیے ایک باوقار ڈیجیٹل گھر۔")}</p>
                <div className="flex gap-7 text-xs font-bold"><span>UR / EN</span><span>PKR</span><span>2026</span></div>
              </div>
            </div>
            <form onSubmit={signIn} className="soft-shadow relative rounded-[1rem] border border-[#c9bda9] bg-[#fcfaf5]/90 p-6 backdrop-blur md:p-8">
              <div className="flex items-center justify-between"><p className="eyebrow">Secure portal</p><GraduationCap className="h-5 w-5" /></div>
              <h2 className={`editorial-copy mt-5 text-4xl font-medium ${locale === "ur" ? "urdu" : ""}`}>{tr(locale, "Enter the institute", "انسٹی ٹیوٹ میں داخل ہوں")}</h2>
              <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl bg-[#e8e0d2] p-1">
                {(Object.keys(roleAccess) as Role[]).map(item => <button type="button" key={item} onClick={() => setDemoRole(item)} className={`min-h-10 rounded-lg px-1 py-2 text-[11px] font-bold tracking-[.03em] ${role === item ? "bg-[#1c1b19] text-[#f6f1e8] shadow-sm" : "text-[#665f55] hover:bg-[#f8f3e9]"}`}>{roleAccess[item].label}</button>)}
              </div>
              <label className="mt-6 block text-xs font-bold">{roleAccess[role].loginHint}<input value={identity} onChange={event => setIdentity(event.target.value)} className="mt-2 w-full border-b border-[#81796d] bg-transparent py-2 text-sm outline-none focus:border-[#1c1b19]" /></label>
              <label className="mt-5 block text-xs font-bold">Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full border-b border-[#81796d] bg-transparent py-2 text-sm outline-none focus:border-[#1c1b19]" /></label>
              <button disabled={login.isPending} className="mt-7 flex w-full items-center justify-between rounded-lg bg-[#1c1b19] px-4 py-3 text-sm font-bold text-[#f7f1e8] disabled:opacity-60">{login.isPending ? "Verifying..." : "Sign in securely"}<ArrowDownRight className="h-4 w-4" /></button>
              <p className="mt-4 text-[10px] leading-relaxed text-[#70695e]">Demo access is prefilled. Administrator credentials are preserved exactly: <strong>admin / admin123</strong>.</p>
            </form>
          </div>
          <div className="mt-16 grid border-y border-[#1c1b19]/25 sm:grid-cols-3"><FeatureMark number="01" label={tr(locale, "Academic intelligence", "تعلیمی ذہانت")} /><FeatureMark number="02" label={tr(locale, "Financial clarity", "مالی شفافیت")} /><FeatureMark number="03" label={tr(locale, "Every learner in view", "ہر طالب علم پر نظر")} /></div>
        </section>
      </main>
    );
  }

  return (
    <div className="paper-backdrop min-h-screen text-[#1c1b19]" dir={locale === "ur" ? "rtl" : "ltr"}>
      <aside className={`no-print fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#cfc5b5] bg-[#f7f2e9]/95 px-4 py-5 backdrop-blur transition-transform duration-200 ${navOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex items-center justify-between border-b border-[#1c1b19]/15 pb-5"><button onClick={() => setPage("overview")} className="flex items-center gap-3"><span className="institution-seal grid h-10 w-10 place-items-center rounded-full text-[10px] font-bold tracking-[.08em] text-[#f7f2e9]">SL</span><span className="text-left"><strong className="editorial-copy block text-xl leading-none">Student LMS</strong><small className="eyebrow mt-1 block text-[8px] text-[#766e63]">Coaching institute</small></span></button><button className="lg:hidden" onClick={() => setNavOpen(false)}><X className="h-4 w-4" /></button></div>
        <p className="eyebrow mt-7 px-3 text-[#8a8175]">{roleAccess[user.role].label} portal</p>
        <nav className="mt-3 space-y-1">{currentMenu.map(item => <button key={item} onClick={() => { setPage(item); setNavOpen(false); }} className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-semibold ${page === item ? "nav-active" : "nav-idle"}`}><span className="flex items-center gap-3">{iconFor(item)}<span className={locale === "ur" ? "urdu text-base" : ""}>{locale === "ur" ? pageNames[item].ur : pageNames[item].en}</span></span>{page === item && <ChevronRight className="h-3.5 w-3.5" />}</button>)}</nav>
        <div className="mt-auto rounded-lg bg-[#e9e1d2] p-4"><p className="eyebrow text-[#6a6052]">Active space</p><p className="editorial-copy mt-2 text-lg">{roleAccess[user.role].description}</p><div className="mt-3 flex items-center justify-between text-xs"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" />Online</span><span>v1.0</span></div></div>
        <button onClick={signOut} className="mt-4 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[#6b6257] hover:bg-[#e9e1d2]"><LogOut className="h-4 w-4" />{tr(locale, "Sign out", "سائن آؤٹ")}</button>
      </aside>
      <div className="lg:pl-[280px]">
        <header className="no-print sticky top-0 z-40 flex h-[73px] items-center justify-between border-b border-[#cfc5b5] bg-[#f4efe5]/90 px-5 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3"><button className="rounded-lg border border-[#cfc5b5] p-2 lg:hidden" onClick={() => setNavOpen(true)}><Menu className="h-4 w-4" /></button><div className="min-w-0"><p className="eyebrow hidden text-[#786f64] sm:block">{tr(locale, "Student LMS · coaching institute", "اسٹوڈنٹ ایل ایم ایس · کوچنگ انسٹی ٹیوٹ")}</p><h1 className={`editorial-copy mt-0 truncate text-xl leading-none sm:mt-1 sm:text-2xl ${locale === "ur" ? "urdu" : ""}`}>{locale === "ur" ? pageNames[page].ur : pageNames[page].en}</h1></div></div>
          <div className="flex items-center gap-2 md:gap-3"><button onClick={() => setLocale(locale === "en" ? "ur" : "en")} className="rounded-full border border-[#bfb5a5] px-3 py-1.5 text-xs font-bold">{locale === "en" ? "اردو" : "EN"}</button><button onClick={() => setPage("announcements")} aria-label="Open announcements" className="relative rounded-full p-2.5 hover:bg-[#e8e0d2]"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ae5a38]" /></button><button onClick={() => setPage("settings")} aria-label="Open notification settings" className="rounded-full p-2.5 hover:bg-[#e8e0d2]"><Settings2 className="h-4 w-4" /></button><div className="hidden border-l border-[#cfc5b5] pl-3 text-right sm:block"><p className="text-xs font-bold">{user.name}</p><p className="text-[10px] text-[#796f64]">{roleAccess[user.role].label}</p></div>{activeStudentAvatar ? <img src={activeStudentAvatar} alt="" className="student-avatar h-9 w-9 rounded-full" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1c1b19] text-xs font-bold text-[#f7f2e9]">{user.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>}</div>
        </header>
        <main className="mx-auto max-w-[1560px] px-4 pb-28 pt-5 sm:px-5 sm:py-7 md:px-8 md:py-9">{renderPage()}</main>
        <nav aria-label="Quick mobile navigation" className="fixed inset-x-3 bottom-3 z-[60] flex items-center justify-around rounded-2xl border border-[#c7bcaa] bg-[#fcfaf5]/95 p-1.5 shadow-[0_14px_32px_rgba(47,40,29,.18)] backdrop-blur lg:hidden">{(user.role === "admin" ? [{ page: "overview" as Page, label: "Home" }, { page: "students" as Page, label: "Learners" }, { page: "attendance" as Page, label: "Record" }, { page: "reports" as Page, label: "Reports" }] : user.role === "teacher" ? [{ page: "overview" as Page, label: "Home" }, { page: "attendance" as Page, label: "Register" }, { page: "learning" as Page, label: "Content" }, { page: "announcements" as Page, label: "Alerts" }] : [{ page: "overview" as Page, label: "Home" }, { page: "learning" as Page, label: "Study" }, { page: "attendance" as Page, label: "Record" }, { page: "fees" as Page, label: "Fees" }]).map(item => <button key={item.page} onClick={() => setPage(item.page)} className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-bold tracking-[.08em] uppercase ${page === item.page ? "bg-[#1c1b19] text-[#faf5eb]" : "text-[#6e665b]"}`}><span>{iconFor(item.page)}</span><span>{item.label}</span></button>)}</nav>
      </div>
    </div>
  );

  function renderPage() {
    switch (page) {
      case "students": return <StudentsPage />;
      case "teachers": return <TeachersPage />;
      case "courses": return <CoursesPage />;
      case "fees": return <FeesPage />;
      case "attendance": return <AttendancePage />;
      case "learning": return <LearningPage />;
      case "reports": return <ReportsPage />;
      case "announcements": return <AnnouncementsPage />;
      case "settings": return <SettingsPageV2 />;
      default: return <OverviewPage />;
    }
  }

  function OverviewPage() {
    const admin = user?.role === "admin";
    const teacher = user?.role === "teacher";
    return <div className="space-y-7">
      <section className="grid gap-5 xl:grid-cols-[1.6fr_.9fr]">
        <div className="relative overflow-hidden rounded-[.9rem] bg-[#1c1b19] p-6 text-[#f8f2e8] md:p-9"><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-[#f8f2e8]/15" /><div className="relative flex flex-wrap items-center justify-between gap-3"><p className="eyebrow text-[#d9c9b3]">Saturday, 22 August 2026</p>{!admin && !teacher && user && <div className="flex items-center gap-2 rounded-full border border-[#f8f2e8]/20 bg-white/5 py-1.5 pl-1.5 pr-3"><StudentAvatar name={user.name} src={activeStudentAvatar} size="sm" /><span className="text-xs font-bold">{user.name}</span></div>}</div><h2 className={`editorial-title relative mt-6 max-w-xl text-5xl font-semibold leading-[.86] md:text-7xl ${locale === "ur" ? "urdu leading-[1] tracking-normal" : ""}`}>{tr(locale, admin ? "The institute, at a glance." : teacher ? "Teaching, in good order." : "A clear way forward.", admin ? "انسٹی ٹیوٹ، ایک نظر میں" : teacher ? "تدریس، بہترین ترتیب کے ساتھ" : "آگے بڑھنے کا واضح راستہ")}</h2><p className={`relative mt-6 max-w-lg text-sm leading-relaxed text-[#dfd8cc] ${locale === "ur" ? "urdu text-base" : ""}`}>{tr(locale, admin ? "Today’s learning pulse brings enrolment, finance and faculty activity into a single considered view." : teacher ? "Your class list, review queue and attendance tools are ready for the day’s work." : "Your next lesson, upcoming fee date and recent academic progress are gathered here.", admin ? "آج کی تعلیمی سرگرمیاں، داخلہ، فنانس اور اساتذہ کی پیش رفت ایک جگہ۔" : teacher ? "آپ کی کلاس لسٹ، اسائنمنٹ ریویو اور حاضری کے تمام ٹولز تیار ہیں۔" : "اگلا سبق، فیس کی تاریخ اور تعلیمی پیش رفت یہاں موجود ہیں۔")}</p><button onClick={() => setPage(admin ? "reports" : teacher ? "attendance" : "learning")} className="relative mt-8 inline-flex items-center gap-2 rounded-md bg-[#f8f2e8] px-4 py-2.5 text-xs font-bold text-[#1c1b19]">{tr(locale, admin ? "Open institutional report" : teacher ? "Take today’s attendance" : "Continue learning", admin ? "ادارے کی رپورٹ" : teacher ? "آج کی حاضری" : "سیکھنا جاری رکھیں")}<ArrowDownRight className="h-4 w-4" /></button></div>
        <div className="metric-card rounded-[.9rem] p-6"><div className="flex items-center justify-between"><p className="eyebrow">Today’s rhythm</p><MoreHorizontal className="h-5 w-5 text-[#81786b]" /></div><div className="mt-8 space-y-0"><Timeline time="09:00" title={teacher ? "Biology — HSSC II" : "Faculty morning briefing"} tag="Now" /><Timeline time="11:30" title={teacher ? "Assignment review window" : "Monthly fee due notices"} tag="Next" /><Timeline time="14:00" title={teacher ? "Chemistry content upload" : "Parent consultation desk"} tag="Later" /></div></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{admin ? <><Metric label="Active learners" value="1,248" trend="8.2%" /><Metric label="August collection" value="3.48M" trend="12.4%" tone="olive" /><Metric label="Average attendance" value="91.6%" trend="2.1%" tone="clay" /><Metric label="Open actions" value="42" trend="Today" tone="plain" /></> : teacher ? <><Metric label="My learners" value="115" trend="4 classes" /><Metric label="Marked today" value="34" trend="29.6%" tone="olive" /><Metric label="To review" value="18" trend="Assignments" tone="clay" /><Metric label="Course progress" value="68%" trend="On track" tone="plain" /></> : <><Metric label="My attendance" value="94%" trend="Excellent" /><Metric label="Course progress" value="72%" trend="Biology" tone="olive" /><Metric label="Fee balance" value={invoicePaid ? "0" : "10k"} trend={invoicePaid ? "Cleared" : "Due 28 Aug"} tone="clay" /><Metric label="Latest marks" value="86%" trend="Biology quiz" tone="plain" /></>}</section>
      {admin && <LiveMonthlyTrendChart />}
      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><div className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow={admin ? "Institutional pulse" : teacher ? "Class performance" : "Academic momentum"} title={admin ? "A measured week." : teacher ? "Learning is moving." : "Your study week."} action={admin ? "View reports" : "View details"} onAction={() => setPage(admin ? "reports" : "learning")} /><div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.35fr]"><div><p className="editorial-copy text-5xl">{admin ? "89.4" : teacher ? "78" : "4.8"}<span className="ml-1 text-xl">{admin || teacher ? "%" : "/5"}</span></p><p className="mt-3 text-sm leading-relaxed text-[#716a60]">{admin ? "Student satisfaction with September’s learning plan." : teacher ? "Average completion across your assigned course plans." : "Average study hours logged in the last seven days."}</p></div><div><MiniBars values={[30, 46, 38, 63, 57, 78, 71]} /><div className="mt-3 flex justify-between text-[10px] font-bold tracking-[.12em] text-[#8a8175]"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div></div></div><div className="rounded-[.9rem] border border-[#c9bfaf] bg-[#e9e1d2] p-6"><SectionTitle eyebrow="Noticeboard" title="Recent signals." action="All notices" onAction={() => setPage("announcements")} /> <div className="mt-5 space-y-4">{announcements.slice(0, 3).map((notice, index) => <div key={notice.title} className="border-t border-[#1c1b19]/15 pt-4"><span className="eyebrow text-[#8b5a40]">0{index + 1}</span><p className="mt-1 text-sm font-bold">{notice.title}</p><p className="mt-1 text-xs text-[#716a60]">{notice.by} · {notice.date}</p></div>)}</div></div></section>
    </div>;
  }

  function StudentsPage() {
    const addStudent = () => { if (!newStudent.trim()) return; setStudents([{ name: newStudent, roll: `NEW-${String(students.length + 1).padStart(3, "0")}`, course: "Unassigned", attendance: "—", fee: "Due", avatar: "" }, ...students]); setNewStudent(""); toast.success("Student record added to the working register"); };
    return <div className="space-y-6"><PageIntro eyebrow="Learner register" title="Every learner, in focus." text="Manage admissions, enrolments, subjects and the financial standing of the cohort." /><div className="grid gap-4 lg:grid-cols-[1fr_auto]"><div className="flex items-center gap-2 rounded-xl border bg-[#fcfaf5]/70 px-3"><Search className="h-4 w-4 text-[#7a7165]" /><input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Search roll number, student, course..." /></div><div className="flex gap-2"><input value={newStudent} onChange={event => setNewStudent(event.target.value)} className="min-w-0 rounded-xl border bg-[#fcfaf5] px-3 py-3 text-sm outline-none" placeholder="New student name" /><button onClick={addStudent} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1c1b19] px-4 py-3 text-xs font-bold text-white"><Plus className="h-4 w-4" />Add student</button></div></div><div className="metric-card overflow-hidden rounded-[.9rem]"><div className="ledger-students bg-[#e8e0d2] px-5 py-3 text-[10px] font-bold tracking-[.14em] text-[#675f54] uppercase"><span>Student</span><span>Course</span><span>Attendance</span><span>Fees</span><span /></div>{students.map(student => <div className="ledger-students ledger-row table-row gap-3 px-5 py-4 text-sm" key={student.roll}><span className="flex items-center gap-3"><StudentAvatar name={student.name} src={student.avatar} /><span><strong className="block">{student.name}</strong><small className="ledger-detail block">{student.roll}</small></span></span><span className="ledger-detail">{student.course}</span><span className="font-bold tabular-nums">{student.attendance}</span><span><StatusPill label={student.fee} /></span><button aria-label={`Edit ${student.name}`} onClick={() => toast.success(`Editing ${student.name}`, { description: "Record opened in the local management workspace." })} className="justify-self-end rounded-lg p-2 hover:bg-[#e8e0d2]"><MoreHorizontal className="h-4 w-4" /></button></div>)}</div></div>;
  }

  function TeachersPage() {
    return <div className="space-y-6"><PageIntro eyebrow="Faculty register" title="The people behind the work." text="Assign subjects, review active teaching loads and keep every academic department coordinated." /><div className="grid gap-4 md:grid-cols-3">{[{ name: "Dr. Sara Ahmed", subject: "Biology", load: "4 courses", initials: "SA" }, { name: "Dr. Usman Raza", subject: "Chemistry", load: "3 courses", initials: "UR" }, { name: "Adeel Khan", subject: "Physics", load: "5 courses", initials: "AK" }].map(teacher => <article className="metric-card lift rounded-[.9rem] p-6" key={teacher.name}><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#1c1b19] text-xs font-bold text-white">{teacher.initials}</span><StatusPill label="Present" /></div><h3 className="editorial-copy mt-8 text-3xl">{teacher.name}</h3><p className="mt-2 text-sm text-[#6f665b]">{teacher.subject} · {teacher.load}</p><div className="mt-7 flex items-center justify-between border-t border-[#1c1b19]/15 pt-4 text-xs font-bold"><span>Faculty profile</span><button onClick={() => toast.message("Faculty profile opened")}>Open <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button></div></article>)}</div><button onClick={() => toast.success("Teacher creation workspace opened") } className="rounded-lg border border-[#1c1b19] px-4 py-3 text-xs font-bold"><Plus className="mr-2 inline h-4 w-4" />Add teacher</button></div>;
  }

  function CoursesPage() {
    return <div className="space-y-6"><PageIntro eyebrow="Academic catalogue" title="Courses with direction." text={user?.role === "student" ? "Your current subjects, study materials and completed learning are gathered in one considered view." : "Structure subjects, allocate teachers and observe curriculum progress across every cohort."} /><div className="grid gap-4 lg:grid-cols-3">{courseSeed.map((course, index) => <article className="metric-card lift rounded-[.9rem] p-6" key={course.code}><div className="flex items-center justify-between"><span className="eyebrow text-[#72695e]">{course.code}</span><button onClick={() => setPage("learning")}><ArrowUpRight className="h-4 w-4" /></button></div><h3 className="editorial-copy mt-10 text-3xl leading-none">{course.title}</h3><p className="mt-3 text-sm text-[#6f665b]">{course.teacher} · {course.students} students</p><div className="mt-8"><div className="flex justify-between text-xs font-bold"><span>Course completion</span><span>{course.progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7dfd1]"><div className="h-full bg-[#1c1b19]" style={{ width: `${course.progress}%` }} /></div></div><p className="mt-7 border-t border-[#1c1b19]/15 pt-4 text-xs text-[#756c60]">{index === 0 ? "New practical worksheet ready" : "Next lesson scheduled this week"}</p></article>)}</div><button onClick={() => toast.success("Course and subject editor opened") } className="rounded-lg bg-[#1c1b19] px-4 py-3 text-xs font-bold text-[#f8f2e8]"><Plus className="mr-2 inline h-4 w-4" />Add course or subject</button></div>;
  }

  function FeesPage() {
    const total = invoicePaid ? 0 : 10000;
    return <div className="space-y-6"><PageIntro eyebrow="Financial record" title="Fees, rendered clear." text="Fixed PKR rules, every due date and complete student fee history — with payment initiation, challans and printable receipts." /><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-[.9rem] bg-[#1c1b19] p-6 text-[#f8f2e8] md:p-8"><p className="eyebrow text-[#d9c9b3]">Current statement</p><p className="editorial-title mt-6 text-6xl font-semibold">{money(total)}</p><p className="mt-3 max-w-sm text-sm leading-relaxed text-[#dad3c8]">{invoicePaid ? "August tuition statement has been cleared and a receipt is ready to print." : "Due 28 August 2026. The current statement includes three monthly subjects and semester examination fee."}</p><div className="mt-8 flex flex-wrap gap-2"><button onClick={() => printDocument("Fee challan")} className="min-h-11 rounded-md bg-[#f8f2e8] px-3 py-2.5 text-xs font-bold text-[#1c1b19]"><FileDown className="mr-2 inline h-4 w-4" />Download challan PDF</button><button onClick={() => printDocument("Fee receipt")} className="min-h-11 rounded-md border border-[#f8f2e8]/30 px-3 py-2.5 text-xs font-bold"><ReceiptText className="mr-2 inline h-4 w-4" />PDF receipt</button></div></section><section className="metric-card rounded-[.9rem] p-6"><div className="flex items-start justify-between"><div><p className="eyebrow">Payment initiation</p><h3 className="editorial-copy mt-2 text-3xl">Choose a route.</h3></div><CircleDollarSign className="h-6 w-6" /></div><div className="mt-6 grid grid-cols-3 gap-2">{["JazzCash", "Easypaisa", "Bank Transfer"].map(method => <button key={method} onClick={() => setPaymentMethod(method)} className={`min-h-11 rounded-lg border px-2 py-3 text-xs font-bold ${paymentMethod === method ? "border-[#1c1b19] bg-[#1c1b19] text-white" : "border-[#cfc5b5] bg-[#faf7f0]"}`}>{method}</button>)}</div><p className="mt-5 text-xs leading-relaxed text-[#71695e]">{paymentMethod} is selected. In production, this action will create a provider reference and wait for a verified payment callback before a receipt is issued.</p><button onClick={() => { setInvoicePaid(true); toast.success(`${paymentMethod} payment initiated`, { description: "Demo status changed to paid. Provider callback integration remains environment-configured." }); }} disabled={invoicePaid} className="mt-6 min-h-12 w-full rounded-md bg-[#1c1b19] px-4 py-3 text-sm font-bold text-white disabled:bg-emerald-700">{invoicePaid ? <><Check className="mr-2 inline h-4 w-4" />Payment status: paid</> : <>Initiate with {paymentMethod}<ArrowUpRight className="ml-2 inline h-4 w-4" /></>}</button></section></div><section className="metric-card overflow-hidden rounded-[.9rem]"><div className="ledger-fees bg-[#e8e0d2] px-5 py-3 text-[10px] font-bold tracking-[.14em] text-[#675f54] uppercase"><span>Fee rule</span><span>Amount</span><span>Frequency</span><span>Status</span></div>{FEE_RULES.map((rule, index) => <div key={rule.label} className="ledger-fees ledger-row table-row gap-3 px-5 py-4 text-sm"><span><strong>{locale === "ur" ? rule.urdu : rule.label}</strong><small className="ledger-detail mt-0.5 block">{rule.detail}</small></span><span className="font-bold tabular-nums">{rule.value}</span><span className="ledger-detail">{index === 0 ? "On admission" : index === 1 ? "Monthly" : index === 2 ? "Semester" : "After due date"}</span><span><StatusPill label={index === 1 && !invoicePaid ? "Due" : "Paid"} /></span></div>)}</section><section className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow="Fee history" title="A complete record." action="Export history" onAction={() => downloadCsv("student-fee-history")} /><div className="mt-5 grid gap-3 sm:grid-cols-3"><HistoryCard date="01 Aug 2026" title="July tuition" amount="9,000 PKR" status="Paid" /><HistoryCard date="21 Jul 2026" title="Semester exam" amount="1,000 PKR" status="Paid" /><HistoryCard date="28 Aug 2026" title="August tuition" amount={invoicePaid ? "10,000 PKR" : "10,000 PKR due"} status={invoicePaid ? "Paid" : "Due"} /></div></section></div>;
  }

  function AttendancePage() {
    const teacher = user?.role === "teacher" || user?.role === "admin";
    if (!teacher) return <div className="space-y-6"><PageIntro eyebrow="My record" title="Attendance, in balance." text="Your verified class attendance is kept visible so there are no surprises at the end of term." /><div className="grid gap-5 md:grid-cols-3"><Metric label="Verified attendance" value="94%" trend="Excellent" /><Metric label="Classes attended" value="47" trend="of 50" tone="olive" /><Metric label="Required threshold" value="75%" trend="Maintained" tone="clay" /></div><section className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow="Recent sessions" title="A dependable record." /><div className="mt-5 space-y-0">{["Biology practical — 21 Aug", "Chemistry — 20 Aug", "Physics — 19 Aug", "Biology — 18 Aug"].map((item, index) => <div key={item} className="table-row flex items-center justify-between py-4"><span className="text-sm font-semibold">{item}</span><StatusPill label={index === 2 ? "Present" : "Present"} /></div>)}</div></section></div>;
    return <div className="space-y-6"><PageIntro eyebrow="Daily register" title="Attendance with intent." text="Mark the room, confirm the record and keep the institute’s attendance evidence consistent." /><section className="metric-card rounded-[.9rem] p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">BIO-402 · HSSC II</p><h3 className="editorial-copy mt-2 text-4xl">Morning biology</h3></div><div className="text-left sm:text-right"><p className="text-sm font-bold">Saturday, 22 August</p><p className="text-xs text-[#736a5e]">09:00–10:30 · Room 04</p></div></div><div className="mt-7 overflow-hidden rounded-xl border border-[#d6cec0]"><div className="attendance-ledger bg-[#e8e0d2] px-4 py-3 text-[10px] font-bold tracking-[.14em] uppercase"><span>Learner</span><span>Roll no.</span><span className="text-right">Present</span></div>{students.map(student => <label className="attendance-ledger ledger-row table-row min-h-16 gap-3 px-4 py-3 text-sm" key={student.roll}><span className="flex items-center gap-3"><StudentAvatar name={student.name} src={student.avatar} /><span><strong className="block font-semibold">{student.name}</strong><small className="mt-0.5 block text-[11px] text-[#756c61] sm:hidden">{student.roll}</small></span></span><span className="text-xs text-[#756c61]">{student.roll}</span><span className="justify-self-end"><input aria-label={`Mark ${student.name} present`} type="checkbox" checked={attendance[student.name]} onChange={() => setAttendance({ ...attendance, [student.name]: !attendance[student.name] })} className="h-6 w-6 rounded-md accent-[#1c1b19]" /></span></label>)}</div><button onClick={() => toast.success("Attendance is saved", { description: `${Object.values(attendance).filter(Boolean).length} present, ${Object.values(attendance).filter(Boolean).length ? students.length - Object.values(attendance).filter(Boolean).length : 0} absent.` })} className="mt-5 min-h-12 w-full rounded-lg bg-[#1c1b19] px-4 py-3 text-sm font-bold text-white sm:w-auto"><Check className="mr-2 inline h-4 w-4" />Confirm attendance</button></section></div>;
  }

  function LearningPage() {
    const teacher = user?.role === "teacher" || user?.role === "admin";
    return <div className="space-y-6"><PageIntro eyebrow="Learning studio" title={teacher ? "Make the next lesson useful." : "Your subjects, close at hand."} text={teacher ? "Publish notes, videos, assignments and quizzes. Review submitted work and return meaningful marks." : "Open study content, submit assignments and complete online quizzes without leaving your academic workspace."} /><div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="metric-card rounded-[.9rem] p-5 sm:p-6"><SectionTitle eyebrow="BIO-402 · Biology" title="Current learning materials." action={teacher ? "Upload material" : "All resources"} onAction={() => toast.success(teacher ? "Cloudinary upload staging opened" : "Resource library opened")} /><div className="mt-5 space-y-3">{[{ icon: Video, title: "Cell division — recorded lecture", meta: "42 mins · Video" }, { icon: FileText, title: "Genetics chapter notes", meta: "12 pages · PDF" }, { icon: BookOpen, title: "Practical workbook 03", meta: "Study note · PDF" }].map(resource => <div key={resource.title} className="flex min-h-20 items-center gap-3 rounded-xl border border-[#ded6c9] bg-[#faf7f0] p-3.5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e9e1d2]"><resource.icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold leading-snug">{resource.title}</p><p className="mt-1 text-xs text-[#766e63]">{resource.meta}</p></div><button aria-label={`Open ${resource.title}`} onClick={() => toast.message(`Opening ${resource.title}`)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#c9bfaf]"><Play className="h-4 w-4" /></button></div>)}</div></section><section className="rounded-[.9rem] border border-[#cfbfa9] bg-[#ead6c2] p-5 sm:p-6"><p className="eyebrow text-[#805f4c]">Assignment 04</p><h3 className="editorial-copy mt-3 text-4xl leading-none">Genetics case review.</h3><p className="mt-4 text-sm leading-relaxed text-[#664a3b]">Analyse the inherited trait examples on pages 18–19 and return a concise explanation with supporting diagrams.</p>{teacher ? <div className="mt-7 rounded-lg bg-[#f8eddf] p-4"><p className="text-sm font-bold">18 submissions awaiting review</p><label className="mt-4 block text-xs font-bold">Issue marks<input type="number" defaultValue="86" className="mt-2 min-h-11 w-full rounded border border-[#c9ad96] bg-transparent px-3 py-2" /></label><button onClick={() => toast.success("Marks issued to selected submission") } className="mt-4 min-h-11 w-full rounded-md bg-[#53392b] px-4 py-2.5 text-sm font-bold text-white sm:w-auto">Save review</button></div> : <div className="mt-7"><button onClick={() => { setAssignmentSubmitted(true); toast.success("Assignment submitted", { description: "Your work is now awaiting teacher review." }); }} className="min-h-12 w-full rounded-md bg-[#53392b] px-4 py-3 text-sm font-bold text-white sm:w-auto">{assignmentSubmitted ? <><Check className="mr-2 inline h-4 w-4" />Submitted for review</> : <><Send className="mr-2 inline h-4 w-4" />Submit assignment</>}</button><p className="mt-3 text-xs text-[#7a5c49]">Due Thursday, 27 August · 11:59 PM</p></div>}</section></div>{!teacher && <section className="metric-card rounded-[.9rem] p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Online quiz · 15 marks</p><h3 className="editorial-copy mt-2 text-4xl">Quick knowledge check.</h3></div><span className="rounded-full bg-[#e9e1d2] px-3 py-1.5 text-xs font-bold">10 minutes</span></div><p className="mt-6 text-sm font-semibold">Which cell organelle is primarily responsible for ATP production?</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{["Mitochondrion", "Ribosome", "Nucleus", "Vacuole"].map((answer, index) => <button onClick={() => { if (index === 0) setQuizDone(true); else toast.message("Try another answer"); }} key={answer} className={`min-h-13 rounded-xl border px-4 py-3 text-left text-sm font-semibold ${quizDone && index === 0 ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-[#d7cfc1] bg-[#fbf8f2] hover:border-[#1c1b19]"}`}>{quizDone && index === 0 && <Check className="mr-2 inline h-4 w-4" />}{answer}</button>)}</div>{quizDone && <p className="mt-4 text-sm font-bold text-emerald-800">Correct — your score is recorded: 15 / 15.</p>}</section>}</div>;
  }

  function ReportsPage() {
    return <div className="space-y-6"><PageIntro eyebrow="Analysis room" title="Signals worth acting on." text="Student performance, fee collection and attendance reporting arranged for a concise management conversation." /><div className="grid gap-4 md:grid-cols-3"><Metric label="Fee collection" value="87.3%" trend="August" /><Metric label="Attendance" value="91.6%" trend="Institute-wide" tone="olive" /><Metric label="Performance mean" value="78.4%" trend="Mid-term" tone="clay" /></div><section className="metric-card rounded-[.9rem] p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Monthly comparison</p><h3 className="editorial-copy mt-2 text-4xl">Collection and attendance.</h3></div><div className="flex gap-2"><button onClick={() => downloadCsv("lms-performance-report")} className="rounded-md border border-[#1c1b19] px-3 py-2 text-xs font-bold"><Download className="mr-1.5 inline h-4 w-4" />Excel</button><button onClick={() => printDocument("Report")} className="rounded-md bg-[#1c1b19] px-3 py-2 text-xs font-bold text-white"><FileDown className="mr-1.5 inline h-4 w-4" />PDF</button></div></div><div className="mt-8 grid items-end gap-6 md:grid-cols-[.45fr_1fr]"><div><p className="editorial-title text-6xl">3.48M</p><p className="mt-2 text-xs leading-relaxed text-[#746c61]">PKR collected this month. Current performance remains above the August collection benchmark.</p></div><div><MiniBars values={[34, 52, 45, 64, 59, 76, 89, 75, 83, 92]} /><div className="mt-3 flex justify-between text-[10px] font-bold tracking-[.12em] text-[#8a8175]"><span>OCT</span><span>NOV</span><span>DEC</span><span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>AUG</span></div></div></div></section><div className="grid gap-4 lg:grid-cols-2"><section className="rounded-[.9rem] bg-[#d7ddcc] p-6"><p className="eyebrow text-[#5d6855]">Student performance</p><h3 className="editorial-copy mt-2 text-4xl">Where support helps.</h3><ul className="mt-6 space-y-3 text-sm"><li className="flex justify-between border-t border-[#28321f]/15 pt-3"><span>Biology — HSSC II</span><strong>82%</strong></li><li className="flex justify-between border-t border-[#28321f]/15 pt-3"><span>Chemistry — HSSC II</span><strong>76%</strong></li><li className="flex justify-between border-t border-[#28321f]/15 pt-3"><span>Physics — HSSC II</span><strong>71%</strong></li></ul></section><section className="rounded-[.9rem] bg-[#e9e1d2] p-6"><p className="eyebrow text-[#6f5b47]">Attendance report</p><h3 className="editorial-copy mt-2 text-4xl">Exceptions, visible.</h3><ul className="mt-6 space-y-3 text-sm"><li className="flex justify-between border-t border-[#1c1b19]/15 pt-3"><span>Above 90%</span><strong>78% of learners</strong></li><li className="flex justify-between border-t border-[#1c1b19]/15 pt-3"><span>75–90%</span><strong>17% of learners</strong></li><li className="flex justify-between border-t border-[#1c1b19]/15 pt-3"><span>Below threshold</span><strong>5% of learners</strong></li></ul></section></div></div>;
  }

  function AnnouncementsPage() {
    const publish = () => { if (!newNotice.trim()) return; setAnnouncements([{ title: newNotice, audience: "All portal users", date: "Just now", by: user?.name ?? "Academic Office" }, ...announcements]); setNewNotice(""); toast.success("Announcement published to the in-app noticeboard"); };
    return <div className="space-y-6"><PageIntro eyebrow="Noticeboard" title="Communication, composed." text="Keep students, teachers and administrators aligned with time-sensitive academic and financial updates." /><div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><section className="rounded-[.9rem] bg-[#1c1b19] p-6 text-[#f8f2e8]"><p className="eyebrow text-[#d9c9b3]">New notification</p><h3 className="editorial-copy mt-3 text-4xl">Say it clearly.</h3><textarea value={newNotice} onChange={event => setNewNotice(event.target.value)} className="mt-6 h-32 w-full resize-none rounded-lg border border-[#f8f2e8]/20 bg-white/10 p-3 text-sm outline-none placeholder:text-[#d6ccc0]" placeholder="Write an announcement for the institute..." /><button onClick={publish} className="mt-4 rounded-md bg-[#f8f2e8] px-4 py-3 text-xs font-bold text-[#1c1b19]"><Send className="mr-2 inline h-4 w-4" />Publish announcement</button><p className="mt-4 text-xs text-[#d7d0c5]">Audience routing can be configured for administrators, teachers and students in the production notification service.</p></section><section className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow="Recent messages" title="The latest word." /><div className="mt-5 space-y-0">{announcements.map((notice, index) => <article className="table-row py-5" key={`${notice.title}-${index}`}><div className="flex items-start justify-between gap-4"><div><span className="eyebrow text-[#906143]">{notice.audience}</span><h3 className="mt-2 text-base font-bold">{notice.title}</h3><p className="mt-2 text-xs text-[#746c61]">{notice.by} · {notice.date}</p></div><button onClick={() => toast.message("Announcement actions opened") } className="rounded p-2 hover:bg-[#e8e0d2]"><MoreHorizontal className="h-4 w-4" /></button></div></article>)}</div></section></div></div>;
  }

  function SettingsPageV2() {
    const updatePreference = <Key extends keyof NotificationPreferences>(key: Key, value: NotificationPreferences[Key]) => setNotificationPreferences(current => ({ ...current, [key]: value }));
    const enablePush = async () => {
      if (notificationPreferences.pushEnabled) { updatePreference("pushEnabled", false); toast.message("Mobile push alerts paused"); return; }
      if (!("Notification" in window)) { toast.error("This browser does not support push notifications."); return; }
      const permission = await Notification.requestPermission();
      if (permission === "granted") { updatePreference("pushEnabled", true); toast.success("Mobile push alerts enabled"); }
      else toast.message("Browser permission is needed before push alerts can be enabled.");
    };
    const Toggle = ({ checked, onClick, label, description, accent = "ink" }: { checked: boolean; onClick: () => void; label: string; description: string; accent?: "ink" | "clay" }) => <div className="flex items-center gap-4 py-4"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs leading-relaxed text-[#756c61]">{description}</p></div><button type="button" role="switch" aria-checked={checked} onClick={onClick} className={`relative h-10 w-16 shrink-0 overflow-hidden rounded-full transition-colors ${checked ? accent === "clay" ? "bg-[#754936]" : "bg-[#1c1b19]" : "bg-[#d8d0c3]"}`}><span className={`absolute left-1 top-1 h-8 w-8 rounded-full bg-[#fffaf2] shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`} /></button></div>;
    const isStudent = user?.role === "student";
    return <div className="space-y-6"><PageIntro eyebrow="Personal settings" title={isStudent ? "Your profile, your way." : "Alerts, on your terms."} text={isStudent ? "Choose a photo that helps teachers and classmates recognise you, then control which fee and institute updates reach this device." : "Choose which fee and announcement updates can reach this device. Your selections are saved on this device and respected across the portal."} />{isStudent && <section className="grid gap-5 xl:grid-cols-[1fr_.78fr]"><div className="metric-card rounded-[.9rem] p-5 sm:p-6"><p className="eyebrow text-[#766d61]">Student profile</p><div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center"><StudentAvatar name={user.name} src={activeStudentAvatar} size="lg" /><div className="min-w-0"><h2 className="editorial-copy text-4xl leading-none">{user.name}</h2><p className="mt-2 text-sm text-[#756c61]">{user.rollNo ?? "Student profile"} · {roleAccess.student.label}</p><p className="mt-4 text-xs leading-relaxed text-[#756c61]">Use a clear, respectful image. PNG, JPEG, and WebP files up to 4 MB are supported.</p><label htmlFor="profile-photo-input" className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[#1c1b19] px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" />Choose a new photo</label><input id="profile-photo-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProfilePhotoChange} className="sr-only" /></div></div></div><aside className="rounded-[.9rem] bg-[#e9e1d2] p-5 sm:p-6"><p className="eyebrow text-[#736655]">Photo visibility</p><h2 className="editorial-copy mt-2 text-4xl leading-none">Seen where it helps.</h2><ul className="mt-6 space-y-3 text-sm leading-relaxed text-[#62594e]"><li className="border-t border-[#1c1b19]/10 pt-3">Your student dashboard header</li><li className="border-t border-[#1c1b19]/10 pt-3">Teacher attendance register</li><li className="border-t border-[#1c1b19]/10 pt-3">Administrator learner directory</li></ul><p className="mt-6 text-xs leading-relaxed text-[#756c61]">In the demo, your change is saved only in this browser. Authenticated production accounts store the image securely with the LMS profile record.</p></aside></section>}<section className="grid gap-5 xl:grid-cols-[1fr_.78fr]"><div className="metric-card rounded-[.9rem] p-5 sm:p-6"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1c1b19] text-[#faf5eb]"><Bell className="h-5 w-5" /></span><div><p className="eyebrow text-[#766d61]">Device alerts</p><h2 className="editorial-copy mt-2 text-4xl leading-none">Stay in the loop.</h2></div></div><div className="mt-6 border-y border-[#1c1b19]/10"><Toggle checked={notificationPreferences.pushEnabled} onClick={enablePush} label="Mobile push notifications" description="Allow this browser to show timely LMS alerts on this device." /><div className="border-t border-[#1c1b19]/10"><Toggle checked={notificationPreferences.quietHours} onClick={() => updatePreference("quietHours", !notificationPreferences.quietHours)} label="Quiet hours" description="Hold non-urgent announcements between 10 PM and 7 AM." /></div></div><p className="mt-4 rounded-lg bg-[#e9e1d2] p-3 text-xs leading-relaxed text-[#695f54]">Push alerts require browser permission. Urgent fee notices can still appear inside the LMS noticeboard.</p></div><aside className="rounded-[.9rem] bg-[#ead6c2] p-5 sm:p-6"><p className="eyebrow text-[#805f4c]">Delivery summary</p><h2 className="editorial-copy mt-2 text-4xl leading-none text-[#543a2b]">Your alert plan.</h2><div className="mt-7 space-y-3">{[{ label: "Device alerts", value: notificationPreferences.pushEnabled ? "Enabled" : "Paused" }, { label: "Fee reminders", value: notificationPreferences.feeReminders ? notificationPreferences.dueDay : "Paused" }, { label: "Announcements", value: notificationPreferences.announcementAlerts ? "Enabled" : "Paused" }].map(item => <div key={item.label} className="flex items-center justify-between border-t border-[#7f5d4b]/15 pt-3 text-sm"><span>{item.label}</span><strong>{item.value}</strong></div>)}</div><button onClick={() => toast.success("Notification preferences saved", { description: "Your device choices will be used for future LMS alerts." })} className="mt-7 min-h-12 w-full rounded-lg bg-[#543a2b] px-4 py-3 text-sm font-bold text-white">Save notification preferences</button></aside></section><section className="metric-card rounded-[.9rem] p-5 sm:p-6"><SectionTitle eyebrow="What reaches you" title="Choose the useful alerts." /><div className="mt-5 divide-y divide-[#1c1b19]/10"><Toggle checked={notificationPreferences.feeReminders} onClick={() => updatePreference("feeReminders", !notificationPreferences.feeReminders)} label="Fee reminders" description="Receive upcoming-due, overdue, and verified payment notifications." accent="clay" /><Toggle checked={notificationPreferences.announcementAlerts} onClick={() => updatePreference("announcementAlerts", !notificationPreferences.announcementAlerts)} label="Institute announcements" description="Receive announcements relevant to your courses, role, and institute activity." /></div><div className="mt-2 grid gap-3 rounded-xl bg-[#faf7f0] p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-sm font-bold">Fee reminder timing</p><p className="mt-1 text-xs text-[#756c61]">Choose when the first due-date prompt arrives.</p></div><select aria-label="Fee reminder timing" value={notificationPreferences.dueDay} onChange={event => updatePreference("dueDay", event.target.value)} className="min-h-11 rounded-lg border border-[#cfc5b5] bg-white px-3 text-sm font-semibold outline-none"><option>7 days before</option><option>3 days before</option><option>On due date</option></select></div></section></div>;
  }

  function SettingsPage() {
    const updatePreference = <Key extends keyof NotificationPreferences>(key: Key, value: NotificationPreferences[Key]) => setNotificationPreferences(current => ({ ...current, [key]: value }));
    const enablePush = async () => {
      if (notificationPreferences.pushEnabled) { updatePreference("pushEnabled", false); toast.message("Mobile push alerts paused"); return; }
      if (!("Notification" in window)) { toast.error("This browser does not support push notifications."); return; }
      const permission = await Notification.requestPermission();
      if (permission === "granted") { updatePreference("pushEnabled", true); toast.success("Mobile push alerts enabled"); }
      else toast.message("Browser permission is needed before push alerts can be enabled.");
    };
    const Toggle = ({ checked, onClick, label, description, accent = "ink" }: { checked: boolean; onClick: () => void; label: string; description: string; accent?: "ink" | "clay" }) => <div className="flex items-center gap-4 py-4"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs leading-relaxed text-[#756c61]">{description}</p></div><button type="button" role="switch" aria-checked={checked} onClick={onClick} className={`relative h-10 w-16 shrink-0 overflow-hidden rounded-full transition-colors ${checked ? accent === "clay" ? "bg-[#754936]" : "bg-[#1c1b19]" : "bg-[#d8d0c3]"}`}><span className={`absolute left-1 top-1 h-8 w-8 rounded-full bg-[#fffaf2] shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`} /></button></div>;
    return <div className="space-y-6"><PageIntro eyebrow="Personal settings" title="Alerts, on your terms." text="Choose which fee and announcement updates can reach this device. Your selections are saved on this device and respected across the portal." /><div className="grid gap-5 xl:grid-cols-[1fr_.78fr]"><section className="metric-card rounded-[.9rem] p-5 sm:p-6"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1c1b19] text-[#faf5eb]"><Bell className="h-5 w-5" /></span><div><p className="eyebrow text-[#766d61]">Device alerts</p><h2 className="editorial-copy mt-2 text-4xl leading-none">Stay in the loop.</h2></div></div><div className="mt-6 border-y border-[#1c1b19]/10"><Toggle checked={notificationPreferences.pushEnabled} onClick={enablePush} label="Mobile push notifications" description="Allow this browser to show timely LMS alerts on this device." /><div className="border-t border-[#1c1b19]/10"><Toggle checked={notificationPreferences.quietHours} onClick={() => updatePreference("quietHours", !notificationPreferences.quietHours)} label="Quiet hours" description="Hold non-urgent announcements between 10 PM and 7 AM." /></div></div><p className="mt-4 rounded-lg bg-[#e9e1d2] p-3 text-xs leading-relaxed text-[#695f54]">Push alerts require browser permission. Urgent fee notices can still appear inside the LMS noticeboard.</p></section><section className="rounded-[.9rem] bg-[#ead6c2] p-5 sm:p-6"><p className="eyebrow text-[#805f4c]">Delivery summary</p><h2 className="editorial-copy mt-2 text-4xl leading-none text-[#543a2b]">Your alert plan.</h2><div className="mt-7 space-y-3">{[{ label: "Device alerts", value: notificationPreferences.pushEnabled ? "Enabled" : "Paused" }, { label: "Fee reminders", value: notificationPreferences.feeReminders ? notificationPreferences.dueDay : "Paused" }, { label: "Announcements", value: notificationPreferences.announcementAlerts ? "Enabled" : "Paused" }].map(item => <div key={item.label} className="flex items-center justify-between border-t border-[#7f5d4b]/15 pt-3 text-sm"><span>{item.label}</span><strong>{item.value}</strong></div>)}</div><button onClick={() => toast.success("Notification preferences saved", { description: "Your device choices will be used for future LMS alerts." })} className="mt-7 min-h-12 w-full rounded-lg bg-[#543a2b] px-4 py-3 text-sm font-bold text-white">Save notification preferences</button></section></div><section className="metric-card rounded-[.9rem] p-5 sm:p-6"><SectionTitle eyebrow="What reaches you" title="Choose the useful alerts." /><div className="mt-5 divide-y divide-[#1c1b19]/10"><Toggle checked={notificationPreferences.feeReminders} onClick={() => updatePreference("feeReminders", !notificationPreferences.feeReminders)} label="Fee reminders" description="Receive upcoming-due, overdue, and verified payment notifications." accent="clay" /><Toggle checked={notificationPreferences.announcementAlerts} onClick={() => updatePreference("announcementAlerts", !notificationPreferences.announcementAlerts)} label="Institute announcements" description="Receive announcements relevant to your courses, role, and institute activity." /></div><div className="mt-2 grid gap-3 rounded-xl bg-[#faf7f0] p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-sm font-bold">Fee reminder timing</p><p className="mt-1 text-xs text-[#756c61]">Choose when the first due-date prompt arrives.</p></div><select aria-label="Fee reminder timing" value={notificationPreferences.dueDay} onChange={event => updatePreference("dueDay", event.target.value)} className="min-h-11 rounded-lg border border-[#cfc5b5] bg-white px-3 text-sm font-semibold outline-none"><option>7 days before</option><option>3 days before</option><option>On due date</option></select></div></section></div>;
  }
}

function FeatureMark({ number, label }: { number: string; label: string }) {
  return <div className="flex items-center gap-4 border-[#1c1b19]/25 px-0 py-5 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-0"><span className="editorial-copy text-3xl">{number}</span><span className="eyebrow text-[#6e665c]">{label}</span></div>;
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="flex items-end justify-between gap-4"><div><p className="eyebrow text-[#7c7367]">{eyebrow}</p><h2 className="editorial-copy mt-2 text-3xl leading-none md:text-4xl">{title}</h2></div>{action && <button onClick={onAction} className="shrink-0 text-xs font-bold underline decoration-[#8f8679] underline-offset-4">{action}<ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button>}</div>;
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="grid gap-4 border-b border-[#1c1b19]/25 pb-6 md:grid-cols-[1fr_.8fr] md:items-end"><div><p className="eyebrow text-[#796f63]">{eyebrow}</p><h2 className="editorial-title mt-3 text-4xl font-semibold leading-[.92] md:text-5xl">{title}</h2></div><p className="max-w-md text-sm leading-relaxed text-[#6f675c]">{text}</p></section>;
}

function Timeline({ time, title, tag }: { time: string; title: string; tag: string }) {
  return <div className="grid grid-cols-[48px_1fr_auto] gap-3 border-t border-[#1c1b19]/15 py-4 text-sm"><span className="font-bold">{time}</span><span className="font-semibold">{title}</span><span className="rounded-full bg-[#e9e1d2] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#5e5549]">{tag}</span></div>;
}

function HistoryCard({ date, title, amount, status }: { date: string; title: string; amount: string; status: string }) {
  return <div className="rounded-lg border border-[#ddd5c8] bg-[#fbf8f2] p-4"><p className="text-[10px] font-bold tracking-[.12em] text-[#84796c]">{date}</p><p className="mt-3 text-sm font-bold">{title}</p><p className="mt-1 text-xs text-[#70695e]">{amount}</p><div className="mt-4"><StatusPill label={status} /></div></div>;
}

function iconFor(page: Page) {
  const cls = "h-4 w-4";
  if (page === "overview") return <LayoutDashboard className={cls} />;
  if (page === "students" || page === "teachers") return <Users className={cls} />;
  if (page === "courses") return <BookOpen className={cls} />;
  if (page === "fees") return <CircleDollarSign className={cls} />;
  if (page === "attendance") return <CalendarCheck2 className={cls} />;
  if (page === "learning") return <Sparkles className={cls} />;
  if (page === "reports") return <BarChart3 className={cls} />;
  if (page === "settings") return <Settings2 className={cls} />;
  return <Bell className={cls} />;
}
