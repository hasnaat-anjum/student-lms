import { trpc } from "@/lib/trpc";
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
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type Locale = "en" | "ur";
type Role = "admin" | "teacher" | "student";
type Page = "overview" | "students" | "teachers" | "courses" | "fees" | "attendance" | "learning" | "reports" | "announcements";
type PortalUser = { name: string; role: Role; rollNo?: string };

const FEE_RULES = [
  { label: "Admission fee", urdu: "داخلہ فیس", value: "5,000 PKR", detail: "One-time on admission" },
  { label: "Monthly tuition", urdu: "ماہانہ ٹیوشن", value: "3,000 PKR", detail: "Per subject / month" },
  { label: "Semester exam", urdu: "سمسٹر امتحان", value: "1,000 PKR", detail: "Per semester" },
  { label: "Late fee", urdu: "لیٹ فیس", value: "200 PKR", detail: "After configured due date" },
];

const studentsSeed = [
  { name: "Hania Raza", roll: "SCI-2026-041", course: "FSc Pre-Medical", attendance: "94%", fee: "Due" },
  { name: "Muhammad Saad", roll: "SCI-2026-052", course: "FSc Pre-Engineering", attendance: "91%", fee: "Paid" },
  { name: "Eman Fatima", roll: "ICS-2026-018", course: "ICS", attendance: "88%", fee: "Paid" },
  { name: "Zain Abbas", roll: "SCI-2026-063", course: "FSc Pre-Medical", attendance: "82%", fee: "Overdue" },
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
};

function tr(locale: Locale, en: string, ur: string) {
  return locale === "ur" ? ur : en;
}

function money(value: number) {
  return new Intl.NumberFormat("en-PK").format(value) + " PKR";
}

function StatusPill({ label }: { label: string }) {
  const style = label === "Paid" || label === "Present" ? "bg-emerald-100 text-emerald-800" : label === "Due" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[.12em] uppercase ${style}`}>{label}</span>;
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

  const currentMenu = useMemo(() => {
    if (role === "admin") return ["overview", "students", "teachers", "courses", "fees", "attendance", "reports", "announcements"] as Page[];
    if (role === "teacher") return ["overview", "students", "courses", "attendance", "learning", "reports", "announcements"] as Page[];
    return ["overview", "courses", "learning", "attendance", "fees", "announcements"] as Page[];
  }, [role]);

  const setDemoRole = (nextRole: Role) => {
    setRole(nextRole);
    setIdentity(roleAccess[nextRole].account);
    setPassword(roleAccess[nextRole].password);
  };

  const signIn = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ identity, password, role });
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
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#1c1b19] text-sm font-bold">S</span><span className="eyebrow">Student LMS / 2026</span></div>
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
              <div className="mt-6 grid grid-cols-3 gap-1 rounded-lg bg-[#e8e0d2] p-1">
                {(Object.keys(roleAccess) as Role[]).map(item => <button type="button" key={item} onClick={() => setDemoRole(item)} className={`rounded-md px-2 py-2 text-[10px] font-bold tracking-[.11em] uppercase ${role === item ? "bg-[#1c1b19] text-[#f6f1e8]" : "text-[#665f55]"}`}>{roleAccess[item].label}</button>)}
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
        <div className="flex items-center justify-between border-b border-[#1c1b19]/15 pb-5"><button onClick={() => setPage("overview")} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#1c1b19] text-sm font-bold text-[#f7f2e9]">S</span><span className="text-left"><strong className="editorial-copy block text-xl leading-none">Student LMS</strong><small className="eyebrow mt-1 block text-[8px] text-[#766e63]">Coaching institute</small></span></button><button className="lg:hidden" onClick={() => setNavOpen(false)}><X className="h-4 w-4" /></button></div>
        <p className="eyebrow mt-7 px-3 text-[#8a8175]">{roleAccess[user.role].label} portal</p>
        <nav className="mt-3 space-y-1">{currentMenu.map(item => <button key={item} onClick={() => { setPage(item); setNavOpen(false); }} className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-semibold ${page === item ? "nav-active" : "nav-idle"}`}><span className="flex items-center gap-3">{iconFor(item)}<span className={locale === "ur" ? "urdu text-base" : ""}>{locale === "ur" ? pageNames[item].ur : pageNames[item].en}</span></span>{page === item && <ChevronRight className="h-3.5 w-3.5" />}</button>)}</nav>
        <div className="mt-auto rounded-lg bg-[#e9e1d2] p-4"><p className="eyebrow text-[#6a6052]">Active space</p><p className="editorial-copy mt-2 text-lg">{roleAccess[user.role].description}</p><div className="mt-3 flex items-center justify-between text-xs"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" />Online</span><span>v1.0</span></div></div>
        <button onClick={signOut} className="mt-4 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[#6b6257] hover:bg-[#e9e1d2]"><LogOut className="h-4 w-4" />{tr(locale, "Sign out", "سائن آؤٹ")}</button>
      </aside>
      <div className="lg:pl-[280px]">
        <header className="no-print sticky top-0 z-40 flex h-[73px] items-center justify-between border-b border-[#cfc5b5] bg-[#f4efe5]/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3"><button className="rounded-md border border-[#cfc5b5] p-2 lg:hidden" onClick={() => setNavOpen(true)}><Menu className="h-4 w-4" /></button><div><p className="eyebrow text-[#786f64]">{tr(locale, "Student LMS / workspace", "اسٹوڈنٹ ایل ایم ایس / ورک اسپیس")}</p><h1 className={`editorial-copy mt-1 text-2xl leading-none ${locale === "ur" ? "urdu" : ""}`}>{locale === "ur" ? pageNames[page].ur : pageNames[page].en}</h1></div></div>
          <div className="flex items-center gap-2 md:gap-3"><button onClick={() => setLocale(locale === "en" ? "ur" : "en")} className="rounded-full border border-[#bfb5a5] px-3 py-1.5 text-xs font-bold">{locale === "en" ? "اردو" : "EN"}</button><button onClick={() => setPage("announcements")} className="relative rounded-full p-2.5 hover:bg-[#e8e0d2]"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ae5a38]" /></button><div className="hidden border-l border-[#cfc5b5] pl-3 text-right sm:block"><p className="text-xs font-bold">{user.name}</p><p className="text-[10px] text-[#796f64]">{roleAccess[user.role].label}</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-[#1c1b19] text-xs font-bold text-[#f7f2e9]">{user.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span></div>
        </header>
        <main className="mx-auto max-w-[1560px] px-5 py-7 md:px-8 md:py-9">{renderPage()}</main>
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
      default: return <OverviewPage />;
    }
  }

  function OverviewPage() {
    const admin = user?.role === "admin";
    const teacher = user?.role === "teacher";
    return <div className="space-y-7">
      <section className="grid gap-5 xl:grid-cols-[1.6fr_.9fr]">
        <div className="relative overflow-hidden rounded-[.9rem] bg-[#1c1b19] p-6 text-[#f8f2e8] md:p-9"><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-[#f8f2e8]/15" /><p className="eyebrow text-[#d9c9b3]">Saturday, 22 August 2026</p><h2 className={`editorial-title relative mt-6 max-w-xl text-5xl font-semibold leading-[.86] md:text-7xl ${locale === "ur" ? "urdu leading-[1] tracking-normal" : ""}`}>{tr(locale, admin ? "The institute, at a glance." : teacher ? "Teaching, in good order." : "A clear way forward.", admin ? "انسٹی ٹیوٹ، ایک نظر میں" : teacher ? "تدریس، بہترین ترتیب کے ساتھ" : "آگے بڑھنے کا واضح راستہ")}</h2><p className={`relative mt-6 max-w-lg text-sm leading-relaxed text-[#dfd8cc] ${locale === "ur" ? "urdu text-base" : ""}`}>{tr(locale, admin ? "Today’s learning pulse brings enrolment, finance and faculty activity into a single considered view." : teacher ? "Your class list, review queue and attendance tools are ready for the day’s work." : "Your next lesson, upcoming fee date and recent academic progress are gathered here.", admin ? "آج کی تعلیمی سرگرمیاں، داخلہ، فنانس اور اساتذہ کی پیش رفت ایک جگہ۔" : teacher ? "آپ کی کلاس لسٹ، اسائنمنٹ ریویو اور حاضری کے تمام ٹولز تیار ہیں۔" : "اگلا سبق، فیس کی تاریخ اور تعلیمی پیش رفت یہاں موجود ہیں۔")}</p><button onClick={() => setPage(admin ? "reports" : teacher ? "attendance" : "learning")} className="relative mt-8 inline-flex items-center gap-2 rounded-md bg-[#f8f2e8] px-4 py-2.5 text-xs font-bold text-[#1c1b19]">{tr(locale, admin ? "Open institutional report" : teacher ? "Take today’s attendance" : "Continue learning", admin ? "ادارے کی رپورٹ" : teacher ? "آج کی حاضری" : "سیکھنا جاری رکھیں")}<ArrowDownRight className="h-4 w-4" /></button></div>
        <div className="metric-card rounded-[.9rem] p-6"><div className="flex items-center justify-between"><p className="eyebrow">Today’s rhythm</p><MoreHorizontal className="h-5 w-5 text-[#81786b]" /></div><div className="mt-8 space-y-0"><Timeline time="09:00" title={teacher ? "Biology — HSSC II" : "Faculty morning briefing"} tag="Now" /><Timeline time="11:30" title={teacher ? "Assignment review window" : "Monthly fee due notices"} tag="Next" /><Timeline time="14:00" title={teacher ? "Chemistry content upload" : "Parent consultation desk"} tag="Later" /></div></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{admin ? <><Metric label="Active learners" value="1,248" trend="8.2%" /><Metric label="August collection" value="3.48M" trend="12.4%" tone="olive" /><Metric label="Average attendance" value="91.6%" trend="2.1%" tone="clay" /><Metric label="Open actions" value="42" trend="Today" tone="plain" /></> : teacher ? <><Metric label="My learners" value="115" trend="4 classes" /><Metric label="Marked today" value="34" trend="29.6%" tone="olive" /><Metric label="To review" value="18" trend="Assignments" tone="clay" /><Metric label="Course progress" value="68%" trend="On track" tone="plain" /></> : <><Metric label="My attendance" value="94%" trend="Excellent" /><Metric label="Course progress" value="72%" trend="Biology" tone="olive" /><Metric label="Fee balance" value={invoicePaid ? "0" : "10k"} trend={invoicePaid ? "Cleared" : "Due 28 Aug"} tone="clay" /><Metric label="Latest marks" value="86%" trend="Biology quiz" tone="plain" /></>}</section>
      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><div className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow={admin ? "Institutional pulse" : teacher ? "Class performance" : "Academic momentum"} title={admin ? "A measured week." : teacher ? "Learning is moving." : "Your study week."} action={admin ? "View reports" : "View details"} onAction={() => setPage(admin ? "reports" : "learning")} /><div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.35fr]"><div><p className="editorial-copy text-5xl">{admin ? "89.4" : teacher ? "78" : "4.8"}<span className="ml-1 text-xl">{admin || teacher ? "%" : "/5"}</span></p><p className="mt-3 text-sm leading-relaxed text-[#716a60]">{admin ? "Student satisfaction with September’s learning plan." : teacher ? "Average completion across your assigned course plans." : "Average study hours logged in the last seven days."}</p></div><div><MiniBars values={[30, 46, 38, 63, 57, 78, 71]} /><div className="mt-3 flex justify-between text-[10px] font-bold tracking-[.12em] text-[#8a8175]"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div></div></div><div className="rounded-[.9rem] border border-[#c9bfaf] bg-[#e9e1d2] p-6"><SectionTitle eyebrow="Noticeboard" title="Recent signals." action="All notices" onAction={() => setPage("announcements")} /> <div className="mt-5 space-y-4">{announcements.slice(0, 3).map((notice, index) => <div key={notice.title} className="border-t border-[#1c1b19]/15 pt-4"><span className="eyebrow text-[#8b5a40]">0{index + 1}</span><p className="mt-1 text-sm font-bold">{notice.title}</p><p className="mt-1 text-xs text-[#716a60]">{notice.by} · {notice.date}</p></div>)}</div></div></section>
    </div>;
  }

  function StudentsPage() {
    const addStudent = () => { if (!newStudent.trim()) return; setStudents([{ name: newStudent, roll: `NEW-${String(students.length + 1).padStart(3, "0")}`, course: "Unassigned", attendance: "—", fee: "Due" }, ...students]); setNewStudent(""); toast.success("Student record added to the working register"); };
    return <div className="space-y-6"><PageIntro eyebrow="Learner register" title="Every learner, in focus." text="Manage admissions, enrolments, subjects and the financial standing of the cohort." /><div className="grid gap-4 lg:grid-cols-[1fr_auto]"><div className="flex items-center gap-2 rounded-lg border bg-[#fcfaf5]/70 px-3"><Search className="h-4 w-4 text-[#7a7165]" /><input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Search roll number, student, course..." /></div><div className="flex gap-2"><input value={newStudent} onChange={event => setNewStudent(event.target.value)} className="min-w-0 rounded-lg border bg-[#fcfaf5] px-3 py-3 text-sm outline-none" placeholder="New student name" /><button onClick={addStudent} className="inline-flex items-center gap-2 rounded-lg bg-[#1c1b19] px-4 py-3 text-xs font-bold text-white"><Plus className="h-4 w-4" />Add student</button></div></div><div className="metric-card overflow-hidden rounded-[.9rem]"><div className="grid grid-cols-[1.2fr_.85fr_.55fr_.5fr_.3fr] gap-3 bg-[#e8e0d2] px-5 py-3 text-[10px] font-bold tracking-[.14em] text-[#675f54] uppercase"><span>Student</span><span>Course</span><span>Attendance</span><span>Fees</span><span /></div>{students.map(student => <div className="table-row grid grid-cols-[1.2fr_.85fr_.55fr_.5fr_.3fr] items-center gap-3 px-5 py-4 text-sm" key={student.roll}><span><strong className="block">{student.name}</strong><small className="text-[#776f64]">{student.roll}</small></span><span className="text-xs text-[#5c554c]">{student.course}</span><span className="font-bold">{student.attendance}</span><span><StatusPill label={student.fee} /></span><button onClick={() => toast.success(`Editing ${student.name}`, { description: "Record opened in the local management workspace." })} className="justify-self-end rounded p-2 hover:bg-[#e8e0d2]"><MoreHorizontal className="h-4 w-4" /></button></div>)}</div></div>;
  }

  function TeachersPage() {
    return <div className="space-y-6"><PageIntro eyebrow="Faculty register" title="The people behind the work." text="Assign subjects, review active teaching loads and keep every academic department coordinated." /><div className="grid gap-4 md:grid-cols-3">{[{ name: "Dr. Sara Ahmed", subject: "Biology", load: "4 courses", initials: "SA" }, { name: "Dr. Usman Raza", subject: "Chemistry", load: "3 courses", initials: "UR" }, { name: "Adeel Khan", subject: "Physics", load: "5 courses", initials: "AK" }].map(teacher => <article className="metric-card lift rounded-[.9rem] p-6" key={teacher.name}><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#1c1b19] text-xs font-bold text-white">{teacher.initials}</span><StatusPill label="Present" /></div><h3 className="editorial-copy mt-8 text-3xl">{teacher.name}</h3><p className="mt-2 text-sm text-[#6f665b]">{teacher.subject} · {teacher.load}</p><div className="mt-7 flex items-center justify-between border-t border-[#1c1b19]/15 pt-4 text-xs font-bold"><span>Faculty profile</span><button onClick={() => toast.message("Faculty profile opened")}>Open <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button></div></article>)}</div><button onClick={() => toast.success("Teacher creation workspace opened") } className="rounded-lg border border-[#1c1b19] px-4 py-3 text-xs font-bold"><Plus className="mr-2 inline h-4 w-4" />Add teacher</button></div>;
  }

  function CoursesPage() {
    return <div className="space-y-6"><PageIntro eyebrow="Academic catalogue" title="Courses with direction." text={user?.role === "student" ? "Your current subjects, study materials and completed learning are gathered in one considered view." : "Structure subjects, allocate teachers and observe curriculum progress across every cohort."} /><div className="grid gap-4 lg:grid-cols-3">{courseSeed.map((course, index) => <article className="metric-card lift rounded-[.9rem] p-6" key={course.code}><div className="flex items-center justify-between"><span className="eyebrow text-[#72695e]">{course.code}</span><button onClick={() => setPage("learning")}><ArrowUpRight className="h-4 w-4" /></button></div><h3 className="editorial-copy mt-10 text-3xl leading-none">{course.title}</h3><p className="mt-3 text-sm text-[#6f665b]">{course.teacher} · {course.students} students</p><div className="mt-8"><div className="flex justify-between text-xs font-bold"><span>Course completion</span><span>{course.progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7dfd1]"><div className="h-full bg-[#1c1b19]" style={{ width: `${course.progress}%` }} /></div></div><p className="mt-7 border-t border-[#1c1b19]/15 pt-4 text-xs text-[#756c60]">{index === 0 ? "New practical worksheet ready" : "Next lesson scheduled this week"}</p></article>)}</div><button onClick={() => toast.success("Course and subject editor opened") } className="rounded-lg bg-[#1c1b19] px-4 py-3 text-xs font-bold text-[#f8f2e8]"><Plus className="mr-2 inline h-4 w-4" />Add course or subject</button></div>;
  }

  function FeesPage() {
    const total = invoicePaid ? 0 : 10000;
    return <div className="space-y-6"><PageIntro eyebrow="Financial record" title="Fees, rendered clear." text="Fixed PKR rules, every due date and complete student fee history — with payment initiation, challans and printable receipts." /><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-[.9rem] bg-[#1c1b19] p-6 text-[#f8f2e8] md:p-8"><p className="eyebrow text-[#d9c9b3]">Current statement</p><p className="editorial-title mt-6 text-6xl font-semibold">{money(total)}</p><p className="mt-3 max-w-sm text-sm leading-relaxed text-[#dad3c8]">{invoicePaid ? "August tuition statement has been cleared and a receipt is ready to print." : "Due 28 August 2026. The current statement includes three monthly subjects and semester examination fee."}</p><div className="mt-8 flex flex-wrap gap-2"><button onClick={() => printDocument("Fee challan")} className="rounded-md bg-[#f8f2e8] px-3 py-2.5 text-xs font-bold text-[#1c1b19]"><FileDown className="mr-2 inline h-4 w-4" />Download challan PDF</button><button onClick={() => printDocument("Fee receipt")} className="rounded-md border border-[#f8f2e8]/30 px-3 py-2.5 text-xs font-bold"><ReceiptText className="mr-2 inline h-4 w-4" />PDF receipt</button></div></section><section className="metric-card rounded-[.9rem] p-6"><div className="flex items-start justify-between"><div><p className="eyebrow">Payment initiation</p><h3 className="editorial-copy mt-2 text-3xl">Choose a route.</h3></div><CircleDollarSign className="h-6 w-6" /></div><div className="mt-6 grid grid-cols-3 gap-2">{["JazzCash", "Easypaisa", "Bank Transfer"].map(method => <button key={method} onClick={() => setPaymentMethod(method)} className={`rounded-lg border px-2 py-3 text-xs font-bold ${paymentMethod === method ? "border-[#1c1b19] bg-[#1c1b19] text-white" : "border-[#cfc5b5] bg-[#faf7f0]"}`}>{method}</button>)}</div><p className="mt-5 text-xs leading-relaxed text-[#71695e]">{paymentMethod} is selected. In production, this action will create a provider reference and wait for a verified payment callback before a receipt is issued.</p><button onClick={() => { setInvoicePaid(true); toast.success(`${paymentMethod} payment initiated`, { description: "Demo status changed to paid. Provider callback integration remains environment-configured." }); }} disabled={invoicePaid} className="mt-6 w-full rounded-md bg-[#1c1b19] px-4 py-3 text-xs font-bold text-white disabled:bg-emerald-700">{invoicePaid ? <><Check className="mr-2 inline h-4 w-4" />Payment status: paid</> : <>Initiate with {paymentMethod}<ArrowUpRight className="ml-2 inline h-4 w-4" /></>}</button></section></div><section className="metric-card overflow-hidden rounded-[.9rem]"><div className="grid grid-cols-[1fr_.7fr_.6fr_.55fr] gap-3 bg-[#e8e0d2] px-5 py-3 text-[10px] font-bold tracking-[.14em] text-[#675f54] uppercase"><span>Fee rule</span><span>Amount</span><span>Frequency</span><span>Status</span></div>{FEE_RULES.map((rule, index) => <div key={rule.label} className="table-row grid grid-cols-[1fr_.7fr_.6fr_.55fr] items-center gap-3 px-5 py-4 text-sm"><span><strong>{locale === "ur" ? rule.urdu : rule.label}</strong><small className="mt-0.5 block text-[#776f64]">{rule.detail}</small></span><span className="font-bold">{rule.value}</span><span className="text-xs text-[#5d564d]">{index === 0 ? "On admission" : index === 1 ? "Monthly" : index === 2 ? "Semester" : "After due date"}</span><span><StatusPill label={index === 1 && !invoicePaid ? "Due" : "Paid"} /></span></div>)}</section><section className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow="Fee history" title="A complete record." action="Export history" onAction={() => downloadCsv("student-fee-history")} /><div className="mt-5 grid gap-3 sm:grid-cols-3"><HistoryCard date="01 Aug 2026" title="July tuition" amount="9,000 PKR" status="Paid" /><HistoryCard date="21 Jul 2026" title="Semester exam" amount="1,000 PKR" status="Paid" /><HistoryCard date="28 Aug 2026" title="August tuition" amount={invoicePaid ? "10,000 PKR" : "10,000 PKR due"} status={invoicePaid ? "Paid" : "Due"} /></div></section></div>;
  }

  function AttendancePage() {
    const teacher = user?.role === "teacher" || user?.role === "admin";
    if (!teacher) return <div className="space-y-6"><PageIntro eyebrow="My record" title="Attendance, in balance." text="Your verified class attendance is kept visible so there are no surprises at the end of term." /><div className="grid gap-5 md:grid-cols-3"><Metric label="Verified attendance" value="94%" trend="Excellent" /><Metric label="Classes attended" value="47" trend="of 50" tone="olive" /><Metric label="Required threshold" value="75%" trend="Maintained" tone="clay" /></div><section className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow="Recent sessions" title="A dependable record." /><div className="mt-5 space-y-0">{["Biology practical — 21 Aug", "Chemistry — 20 Aug", "Physics — 19 Aug", "Biology — 18 Aug"].map((item, index) => <div key={item} className="table-row flex items-center justify-between py-4"><span className="text-sm font-semibold">{item}</span><StatusPill label={index === 2 ? "Present" : "Present"} /></div>)}</div></section></div>;
    return <div className="space-y-6"><PageIntro eyebrow="Daily register" title="Attendance with intent." text="Mark the room, confirm the record and keep the institute’s attendance evidence consistent." /><section className="metric-card rounded-[.9rem] p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">BIO-402 · HSSC II</p><h3 className="editorial-copy mt-2 text-4xl">Morning biology</h3></div><div className="text-right"><p className="text-sm font-bold">Saturday, 22 August</p><p className="text-xs text-[#736a5e]">09:00–10:30 · Room 04</p></div></div><div className="mt-8 overflow-hidden rounded-lg border border-[#d6cec0]"><div className="grid grid-cols-[1fr_.5fr_.45fr] bg-[#e8e0d2] px-4 py-3 text-[10px] font-bold tracking-[.14em] uppercase"><span>Learner</span><span>Roll no.</span><span className="text-right">Present</span></div>{students.map(student => <label className="table-row grid grid-cols-[1fr_.5fr_.45fr] items-center px-4 py-4 text-sm" key={student.roll}><span className="font-semibold">{student.name}</span><span className="text-xs text-[#756c61]">{student.roll}</span><span className="justify-self-end"><input type="checkbox" checked={attendance[student.name]} onChange={() => setAttendance({ ...attendance, [student.name]: !attendance[student.name] })} className="h-4 w-4 accent-[#1c1b19]" /></span></label>)}</div><button onClick={() => toast.success("Attendance is saved", { description: `${Object.values(attendance).filter(Boolean).length} present, ${Object.values(attendance).filter(Boolean).length ? students.length - Object.values(attendance).filter(Boolean).length : 0} absent.` })} className="mt-5 rounded-md bg-[#1c1b19] px-4 py-3 text-xs font-bold text-white"><Check className="mr-2 inline h-4 w-4" />Confirm attendance</button></section></div>;
  }

  function LearningPage() {
    const teacher = user?.role === "teacher" || user?.role === "admin";
    return <div className="space-y-6"><PageIntro eyebrow="Learning studio" title={teacher ? "Make the next lesson useful." : "Your subjects, close at hand."} text={teacher ? "Publish notes, videos, assignments and quizzes. Review submitted work and return meaningful marks." : "Open study content, submit assignments and complete online quizzes without leaving your academic workspace."} /><div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow="BIO-402 · Biology" title="Current learning materials." action={teacher ? "Upload material" : "All resources"} onAction={() => toast.success(teacher ? "Cloudinary upload staging opened" : "Resource library opened")} /><div className="mt-6 space-y-3">{[{ icon: Video, title: "Cell division — recorded lecture", meta: "42 mins · Video" }, { icon: FileText, title: "Genetics chapter notes", meta: "12 pages · PDF" }, { icon: BookOpen, title: "Practical workbook 03", meta: "Study note · PDF" }].map(resource => <div key={resource.title} className="flex items-center gap-4 rounded-lg border border-[#ded6c9] bg-[#faf7f0] p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e9e1d2]"><resource.icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{resource.title}</p><p className="mt-1 text-xs text-[#766e63]">{resource.meta}</p></div><button onClick={() => toast.message(`Opening ${resource.title}`)} className="rounded-full border border-[#c9bfaf] p-2"><Play className="h-3.5 w-3.5" /></button></div>)}</div></section><section className="rounded-[.9rem] border border-[#cfbfa9] bg-[#ead6c2] p-6"><p className="eyebrow text-[#805f4c]">Assignment 04</p><h3 className="editorial-copy mt-3 text-4xl leading-none">Genetics case review.</h3><p className="mt-4 text-sm leading-relaxed text-[#664a3b]">Analyse the inherited trait examples on pages 18–19 and return a concise explanation with supporting diagrams.</p>{teacher ? <div className="mt-7 rounded-lg bg-[#f8eddf] p-4"><p className="text-sm font-bold">18 submissions awaiting review</p><label className="mt-4 block text-xs font-bold">Issue marks<input type="number" defaultValue="86" className="mt-2 w-full rounded border border-[#c9ad96] bg-transparent px-3 py-2" /></label><button onClick={() => toast.success("Marks issued to selected submission") } className="mt-4 rounded-md bg-[#53392b] px-4 py-2.5 text-xs font-bold text-white">Save review</button></div> : <div className="mt-7"><button onClick={() => { setAssignmentSubmitted(true); toast.success("Assignment submitted", { description: "Your work is now awaiting teacher review." }); }} className="rounded-md bg-[#53392b] px-4 py-3 text-xs font-bold text-white">{assignmentSubmitted ? <><Check className="mr-2 inline h-4 w-4" />Submitted for review</> : <><Send className="mr-2 inline h-4 w-4" />Submit assignment</>}</button><p className="mt-3 text-xs text-[#7a5c49]">Due Thursday, 27 August · 11:59 PM</p></div>}</section></div>{!teacher && <section className="metric-card rounded-[.9rem] p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Online quiz · 15 marks</p><h3 className="editorial-copy mt-2 text-4xl">Quick knowledge check.</h3></div><span className="text-sm font-bold">10 minutes</span></div><p className="mt-6 text-sm font-semibold">Which cell organelle is primarily responsible for ATP production?</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{["Mitochondrion", "Ribosome", "Nucleus", "Vacuole"].map((answer, index) => <button onClick={() => { if (index === 0) setQuizDone(true); else toast.message("Try another answer"); }} key={answer} className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold ${quizDone && index === 0 ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-[#d7cfc1] bg-[#fbf8f2] hover:border-[#1c1b19]"}`}>{quizDone && index === 0 && <Check className="mr-2 inline h-4 w-4" />}{answer}</button>)}</div>{quizDone && <p className="mt-4 text-sm font-bold text-emerald-800">Correct — your score is recorded: 15 / 15.</p>}</section>}</div>;
  }

  function ReportsPage() {
    return <div className="space-y-6"><PageIntro eyebrow="Analysis room" title="Signals worth acting on." text="Student performance, fee collection and attendance reporting arranged for a concise management conversation." /><div className="grid gap-4 md:grid-cols-3"><Metric label="Fee collection" value="87.3%" trend="August" /><Metric label="Attendance" value="91.6%" trend="Institute-wide" tone="olive" /><Metric label="Performance mean" value="78.4%" trend="Mid-term" tone="clay" /></div><section className="metric-card rounded-[.9rem] p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Monthly comparison</p><h3 className="editorial-copy mt-2 text-4xl">Collection and attendance.</h3></div><div className="flex gap-2"><button onClick={() => downloadCsv("lms-performance-report")} className="rounded-md border border-[#1c1b19] px-3 py-2 text-xs font-bold"><Download className="mr-1.5 inline h-4 w-4" />Excel</button><button onClick={() => printDocument("Report")} className="rounded-md bg-[#1c1b19] px-3 py-2 text-xs font-bold text-white"><FileDown className="mr-1.5 inline h-4 w-4" />PDF</button></div></div><div className="mt-8 grid items-end gap-6 md:grid-cols-[.45fr_1fr]"><div><p className="editorial-title text-6xl">3.48M</p><p className="mt-2 text-xs leading-relaxed text-[#746c61]">PKR collected this month. Current performance remains above the August collection benchmark.</p></div><div><MiniBars values={[34, 52, 45, 64, 59, 76, 89, 75, 83, 92]} /><div className="mt-3 flex justify-between text-[10px] font-bold tracking-[.12em] text-[#8a8175]"><span>OCT</span><span>NOV</span><span>DEC</span><span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>AUG</span></div></div></div></section><div className="grid gap-4 lg:grid-cols-2"><section className="rounded-[.9rem] bg-[#d7ddcc] p-6"><p className="eyebrow text-[#5d6855]">Student performance</p><h3 className="editorial-copy mt-2 text-4xl">Where support helps.</h3><ul className="mt-6 space-y-3 text-sm"><li className="flex justify-between border-t border-[#28321f]/15 pt-3"><span>Biology — HSSC II</span><strong>82%</strong></li><li className="flex justify-between border-t border-[#28321f]/15 pt-3"><span>Chemistry — HSSC II</span><strong>76%</strong></li><li className="flex justify-between border-t border-[#28321f]/15 pt-3"><span>Physics — HSSC II</span><strong>71%</strong></li></ul></section><section className="rounded-[.9rem] bg-[#e9e1d2] p-6"><p className="eyebrow text-[#6f5b47]">Attendance report</p><h3 className="editorial-copy mt-2 text-4xl">Exceptions, visible.</h3><ul className="mt-6 space-y-3 text-sm"><li className="flex justify-between border-t border-[#1c1b19]/15 pt-3"><span>Above 90%</span><strong>78% of learners</strong></li><li className="flex justify-between border-t border-[#1c1b19]/15 pt-3"><span>75–90%</span><strong>17% of learners</strong></li><li className="flex justify-between border-t border-[#1c1b19]/15 pt-3"><span>Below threshold</span><strong>5% of learners</strong></li></ul></section></div></div>;
  }

  function AnnouncementsPage() {
    const publish = () => { if (!newNotice.trim()) return; setAnnouncements([{ title: newNotice, audience: "All portal users", date: "Just now", by: user?.name ?? "Academic Office" }, ...announcements]); setNewNotice(""); toast.success("Announcement published to the in-app noticeboard"); };
    return <div className="space-y-6"><PageIntro eyebrow="Noticeboard" title="Communication, composed." text="Keep students, teachers and administrators aligned with time-sensitive academic and financial updates." /><div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><section className="rounded-[.9rem] bg-[#1c1b19] p-6 text-[#f8f2e8]"><p className="eyebrow text-[#d9c9b3]">New notification</p><h3 className="editorial-copy mt-3 text-4xl">Say it clearly.</h3><textarea value={newNotice} onChange={event => setNewNotice(event.target.value)} className="mt-6 h-32 w-full resize-none rounded-lg border border-[#f8f2e8]/20 bg-white/10 p-3 text-sm outline-none placeholder:text-[#d6ccc0]" placeholder="Write an announcement for the institute..." /><button onClick={publish} className="mt-4 rounded-md bg-[#f8f2e8] px-4 py-3 text-xs font-bold text-[#1c1b19]"><Send className="mr-2 inline h-4 w-4" />Publish announcement</button><p className="mt-4 text-xs text-[#d7d0c5]">Audience routing can be configured for administrators, teachers and students in the production notification service.</p></section><section className="metric-card rounded-[.9rem] p-6"><SectionTitle eyebrow="Recent messages" title="The latest word." /><div className="mt-5 space-y-0">{announcements.map((notice, index) => <article className="table-row py-5" key={`${notice.title}-${index}`}><div className="flex items-start justify-between gap-4"><div><span className="eyebrow text-[#906143]">{notice.audience}</span><h3 className="mt-2 text-base font-bold">{notice.title}</h3><p className="mt-2 text-xs text-[#746c61]">{notice.by} · {notice.date}</p></div><button onClick={() => toast.message("Announcement actions opened") } className="rounded p-2 hover:bg-[#e8e0d2]"><MoreHorizontal className="h-4 w-4" /></button></div></article>)}</div></section></div></div>;
  }
}

function FeatureMark({ number, label }: { number: string; label: string }) {
  return <div className="flex items-center gap-4 border-[#1c1b19]/25 px-0 py-5 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-0"><span className="editorial-copy text-3xl">{number}</span><span className="eyebrow text-[#6e665c]">{label}</span></div>;
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="flex items-end justify-between gap-4"><div><p className="eyebrow text-[#7c7367]">{eyebrow}</p><h2 className="editorial-copy mt-2 text-3xl leading-none md:text-4xl">{title}</h2></div>{action && <button onClick={onAction} className="shrink-0 text-xs font-bold underline decoration-[#8f8679] underline-offset-4">{action}<ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button>}</div>;
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="grid gap-4 border-b border-[#1c1b19]/25 pb-6 md:grid-cols-[1fr_.8fr] md:items-end"><div><p className="eyebrow text-[#796f63]">{eyebrow}</p><h2 className="editorial-title mt-3 text-5xl font-semibold leading-[.87] md:text-6xl">{title}</h2></div><p className="max-w-md text-sm leading-relaxed text-[#6f675c]">{text}</p></section>;
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
  return <Bell className={cls} />;
}
