// SeekerMatchHubPage.tsx
import React, { useMemo, useState } from "react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Layers, MessageSquare, UploadCloud } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

/**
 * SeekerMatchHubPage – Quản lý công việc của người tìm việc
 * 1) Đang matching: Các công việc đã ứng tuyển, đang chờ phản hồi.
 * 2) Đang thực hiện: Các công việc đã được chấp thuận và đang trong quá trình thực hiện.
 * 3) Đã hoàn thành: Các công việc đã hoàn thành trong quá khứ.
 */

/* =============================== Types =================================== */
type JobStatus = "open" | "closingSoon" | "closed";
type JobStage = "matching" | "in_progress" | "completed";

interface Pay {
  value: number;
  unit: "hour" | "project";
  currency: "USD" | "VND";
}

interface InProgressInfo {
  progressPct: number; // % hoàn thành
  nextMilestone?: { name: string; due: string }; // mốc kế tiếp
  paymentStatus?: "none" | "partial" | "paid";
  riskFlags?: ("overdue" | "awaiting_client" | "blocked")[];
  startedAt?: string; // ISO
}

interface SeekerJobItem {
  id: string;
  title: string;
  summary: string;
  location: string;
  pay: Pay;
  duration: string;
  status: JobStatus; // tình trạng tuyển dụng của job
  skills: string[];
  stage: JobStage;

  // Metadata theo stage
  appliedAt?: string; // cho "matching"
  completedAt?: string; // cho "completed"
  inProgress?: InProgressInfo; // cho "in_progress"
}

/* =============================== Utils =================================== */
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");
const money = (n: number, cur: "USD" | "VND") =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);

/* =============================== Mock Data =============================== */
const MOCK_ITEMS_DATA: SeekerJobItem[] = [
  // --- Đang matching (đã ứng tuyển) ---
  {
    id: "mch-001",
    title: "mock_job_1_title",
    summary: "seekerhub_mock_mch001_summary",
    location: "hanoi",
    pay: { value: 45, unit: "hour", currency: "USD" },
    duration: "seekerhub_mock_mch001_duration",
    status: "open",
    skills: ["Photogrammetry", "AEB Shooting", "Safety"],
    stage: "matching",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 ngày trước
  },
  {
    id: "mch-002",
    title: "seekerhub_mock_mch002_title",
    summary: "seekerhub_mock_mch002_summary",
    location: "hochiminh_city",
    pay: { value: 60, unit: "hour", currency: "USD" },
    duration: "seekerhub_mock_mch002_duration",
    status: "closingSoon",
    skills: ["Inspection", "Telephoto"],
    stage: "matching",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 ngày trước
  },

  // --- Đang thực hiện ---
  {
    id: "prg-201",
    title: "seekerhub_mock_prg201_title",
    summary: "seekerhub_mock_prg201_summary",
    location: "hanoi",
    pay: { value: 800, unit: "project", currency: "USD" },
    duration: "seekerhub_mock_prg201_duration",
    status: "open", // job này vẫn mở cho người khác, nhưng mình đã nhận
    skills: ["Video", "Editing", "Safety"],
    stage: "in_progress",
    inProgress: {
      progressPct: 40,
      nextMilestone: { name: "seekerhub_mock_prg201_milestone", due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString() }, // 3 ngày nữa
      paymentStatus: "partial",
      riskFlags: ["awaiting_client"],
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 ngày trước
    },
  },
  {
    id: "prg-202",
    title: "seekerhub_mock_prg202_title",
    summary: "seekerhub_mock_prg202_summary",
    location: "danang",
    pay: { value: 50, unit: "hour", currency: "USD" },
    duration: "seekerhub_mock_prg202_duration",
    status: "open",
    skills: ["Photogrammetry", "AEB Shooting", "Insurance"],
    stage: "in_progress",
    inProgress: {
      progressPct: 85,
      nextMilestone: { name: "seekerhub_mock_prg202_milestone", due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString() }, // 1 ngày nữa
      paymentStatus: "none",
      riskFlags: ["overdue"],
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 ngày trước
    },
  },

  // --- Đã hoàn thành ---
  {
    id: "cmp-301",
    title: "mock_job_2_title",
    summary: "seekerhub_mock_cmp301_summary",
    location: "danang",
    pay: { value: 1200, unit: "project", currency: "USD" },
    duration: "mock_job_2_duration",
    status: "closed",
    skills: ["RTK", "GCP", "Pix4D/Metashape"],
    stage: "completed",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 ngày trước
  },
  {
    id: "cmp-302",
    title: "mock_job_3_title",
    summary: "mock_job_3_summary",
    location: "hochiminh_city",
    pay: { value: 60, unit: "hour", currency: "USD" },
    duration: "mock_job_3_duration",
    status: "closed",
    skills: ["Inspection", "Telephoto", "Checklist"],
    stage: "completed",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), // 35 ngày trước
  },
];
/* ============================== Page Component ============================ */
export default function SeekerMatchHubPage() {
  const [tab, setTab] = useState<JobStage>("matching");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const { t } = useTranslation();

  const items: SeekerJobItem[] = useMemo(() => {
    return MOCK_ITEMS_DATA.map(it => ({
      ...it,
      title: t(it.title),
      summary: t(it.summary),
      location: t(it.location),
      duration: t(it.duration),
      inProgress: it.inProgress ? {
        ...it.inProgress,
        nextMilestone: it.inProgress.nextMilestone ? {
          ...it.inProgress.nextMilestone,
          name: t(it.inProgress.nextMilestone.name),
        } : undefined,
      } : undefined,
    }))
  }, [t]);

  const counts = useMemo(() => {
    const c: Record<JobStage, number> = { matching: 0, in_progress: 0, completed: 0 };
    for (const it of items) c[it.stage] += 1;
    return c;
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let list = items.filter((i) => i.stage === tab);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Default sort for each tab
    if (tab === "matching") list.sort((a, b) => new Date(b.appliedAt ?? 0).getTime() - new Date(a.appliedAt ?? 0).getTime());
    if (tab === "in_progress") list.sort((a, b) => new Date(a.inProgress?.nextMilestone?.due ?? Infinity).getTime() - new Date(b.inProgress?.nextMilestone?.due ?? Infinity).getTime());
    if (tab === "completed") list.sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());

    return list;
  }, [items, tab, query]);

  /* ============================== Render ================================= */

  if (!user) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Header variant="guest" />
        <main className="grid h-[calc(100vh-8rem)] place-items-center">
          <p>{t('seekerHub_loading')}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <Header variant={user.role} activeRoute="matches" unreadChat={2} unreadNoti={3} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('seekerHub_title')}</h1>
            <p className="text-sm text-slate-600">
              {t('seekerHub_total', { count: filteredAndSorted.length })}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-1">
            <button className={`rounded-lg px-3 py-1.5 text-sm ${view === "cards" ? "bg-slate-100 font-semibold" : ""}`} onClick={() => setView("cards")}>
              {t('seekerHub_view_cards')}
            </button>
            <button className={`rounded-lg px-3 py-1.5 text-sm ${view === "table" ? "bg-slate-100 font-semibold" : ""}`} onClick={() => setView("table")}>
              {t('seekerHub_view_table')}
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <TabButton active={tab === "matching"} onClick={() => setTab("matching")}>
            {t('seekerHub_tab_matching')} <Badge>{counts.matching}</Badge>
          </TabButton>
          <TabButton active={tab === "in_progress"} onClick={() => setTab("in_progress")}>
            {t('seekerHub_tab_inProgress')} <Badge>{counts.in_progress}</Badge>
          </TabButton>
          <TabButton active={tab === "completed"} onClick={() => setTab("completed")}>
            {t('seekerHub_tab_completed')} <Badge>{counts.completed}</Badge>
          </TabButton>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              placeholder={t('seekerHub_search_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" title={t('search_icon_alt')}>🔍</span>
          </div>
        </div>

        {view === "cards" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((it) => {
              if (tab === "matching") return <AppliedCard key={it.id} item={it} />;
              if (tab === "completed") return <CompletedCard key={it.id} item={it} />;
              return <InProgressCard key={it.id} item={it} onOpenMilestones={() => alert("Mở panel Milestones (demo)")} onDeliver={() => alert("Mở upload bàn giao (demo)")} onChat={() => alert("Mở chat (demo)")} />;
            })}
            {filteredAndSorted.length === 0 && (
              <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <div className="mb-3 text-5xl">🧭</div>
                <h3 className="mb-1 text-lg font-semibold">{t('seekerHub_empty_title')}</h3>
                <p className="mb-4 text-sm text-slate-500">{t('seekerHub_empty_subtitle')}</p>
                <button onClick={() => setQuery("")} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                  {t('seekerHub_empty_clearButton')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_title')}</th>
                  {tab === "matching" && <th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_appliedDate')}</th>}
                  {tab === "in_progress" && <><th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_progress')}</th><th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_nextMilestone')}</th><th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_deadline')}</th></>}
                  {tab === "completed" && <th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_completedDate')}</th>}
                  <th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_location')}</th>
                  <th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_pay')}</th>
                  <th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_jobStatus')}</th>
                  <th className="px-4 py-3 font-semibold">{t('seekerHub_table_header_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((it) => (
                  <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">{it.title}</td>
                    {tab === 'matching' && <td className="px-4 py-3">{fmtDate(it.appliedAt)}</td>}
                    {tab === 'in_progress' && <><td className="px-4 py-3">{it.inProgress?.progressPct ?? 0}%</td><td className="px-4 py-3">{it.inProgress?.nextMilestone?.name ?? t('no_date_placeholder')}</td><td className="px-4 py-3">{fmtDate(it.inProgress?.nextMilestone?.due)}</td></>}
                    {tab === 'completed' && <td className="px-4 py-3">{fmtDate(it.completedAt)}</td>}
                    <td className="px-4 py-3">{it.location}</td>
                    <td className="px-4 py-3">{money(it.pay.value, it.pay.currency)}{t('payment_unit_separator')}{it.pay.unit === "hour" ? t('seekerHub_payUnit_hour') : t('seekerHub_payUnit_project')}</td>
                    <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {tab === "matching" && <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100">{t('seekerHub_action_withdraw')}</button>}
                        {tab === "completed" && <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">{t('seekerHub_action_review')}</button>}
                        {tab === "in_progress" && (
                          <>
                            <button className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100">{t('seekerHub_action_chat')}</button>
                            <button className="whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100">{t('seekerHub_action_deliver')}</button>
                          </>
                        )}
                        {tab !== "in_progress" && <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">{t('seekerHub_action_details')}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSorted.length === 0 && (
                  <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={10}>{t('seekerHub_table_empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

/* ================================ Cards ================================== */

// Card – Đang ứng tuyển
function AppliedCard({ item }: { item: SeekerJobItem }) {
  const { t } = useTranslation();
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start gap-2">
        <h3 className="flex-1 text-base font-semibold">{item.title}</h3>
        <StatusBadge status={item.status} />
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>📍 {item.location}</span>
        <span>💰 {money(item.pay.value, item.pay.currency)}/{item.pay.unit === "hour" ? t('seekerHub_payUnit_hour') : t('seekerHub_payUnit_project')}</span>
        <span>⏱️ {item.duration}</span>
      </div>
      <div className="text-xs text-slate-500 mb-3">{t('appliedCard_appliedOn', { date: fmtDate(item.appliedAt) })}</div>
      <div className="mt-auto flex items-center gap-2 pt-4">
        <button className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">{t('seekerHub_action_details')}</button>
        <button className="flex-1 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100">{t('seekerHub_action_withdraw')}</button>
      </div>
    </div>
  );
}

// Card – Đã hoàn thành
function CompletedCard({ item }: { item: SeekerJobItem }) {
  const { t } = useTranslation();
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start gap-2">
        <h3 className="flex-1 text-base font-semibold">{item.title}</h3>
        <StatusBadge status={item.status} />
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>📍 {item.location}</span>
        <span>💰 {money(item.pay.value, item.pay.currency)}/{item.pay.unit === "hour" ? t('seekerHub_payUnit_hour') : t('seekerHub_payUnit_project')}</span>
        <span>⏱️ {item.duration}</span>
      </div>
      <div className="text-xs text-slate-500 mb-3">{t('completedCard_completedOn', { date: fmtDate(item.completedAt) })}</div>
      <div className="mt-auto flex items-center gap-2 pt-4">
        <button className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">{t('seekerHub_action_details')}</button>
        <button className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100">{t('seekerHub_action_review')}</button>
      </div>
    </div>
  );
}

// Card – Đang thực hiện (progress, milestone)
function InProgressCard({
  item,
  onOpenMilestones,
  onDeliver,
  onChat,
}: {
  item: SeekerJobItem;
  onOpenMilestones: () => void;
  onDeliver: () => void;
  onChat: () => void;
}) {
  const p = item.inProgress!;
  const risk = p.riskFlags ?? [];
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start gap-2">
        <h3 className="flex-1 text-base font-semibold">{item.title}</h3>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{t('in_progress_status')}</span>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>{t('inProgressCard_progress')}</span>
          <span>{p.progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-blue-600" style={{ width: `${p.progressPct}%` }} />
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>📍 {item.location}</span>
        <span>💰 {money(item.pay.value, item.pay.currency)}/{item.pay.unit === "hour" ? t('seekerHub_payUnit_hour') : t('seekerHub_payUnit_project')}</span>
        <span>⏱️ {item.duration}</span>
        <span>🗓️ {t('inProgressCard_nextMilestone')} <b>{p.nextMilestone?.name ?? "—"}</b> • {t('inProgressCard_due', { date: fmtDate(p.nextMilestone?.due) })}</span>
      </div>
      {risk.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {risk.map((r) => (
            <span key={r} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              {r === "overdue" ? t('risk_flag_overdue') : r === "awaiting_client" ? t('risk_flag_awaiting_client') : t('risk_flag_blocked')}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto grid grid-cols-3 items-center gap-2 pt-4">
        <button onClick={onOpenMilestones} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
          <Layers size={16} /> {t('inProgressCard_milestones')}
        </button>
        <button onClick={onDeliver} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100">
          <UploadCloud size={16} /> {t('inProgressCard_deliver')}
        </button>
        <button onClick={onChat} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100">
          <MessageSquare size={16} /> {t('inProgressCard_chat')}
        </button>
      </div>
    </div>
  );
}

/* ============================ Small components =========================== */
function StatusBadge({ status }: { status: JobStatus }) {
  const { t } = useTranslation();
  if (status === "open") return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{t('statusBadge_open')}</span>;
  if (status === "closingSoon") return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{t('statusBadge_closingSoon')}</span>;
  return <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">{t('statusBadge_closed')}</span>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-4 py-2 rounded-lg transition-colors duration-150 ${
        active
          ? "font-semibold bg-blue-600 text-white"
          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="ml-2 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[11px] font-semibold">{children}</span>;
}
