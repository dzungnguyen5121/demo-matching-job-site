// SeekerMatchHubPage.tsx
import React, { useMemo, useState } from "react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Layers, MessageSquare, UploadCloud } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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
const MOCK_ITEMS: SeekerJobItem[] = [
  // --- Đang matching (đã ứng tuyển) ---
  {
    id: "mch-001",
    title: "Khảo sát mái nhà bằng drone",
    summary: "Bay kiểm tra mái nhà, chụp ảnh chất lượng cao, bàn giao ảnh + báo cáo hư hại.",
    location: "Hà Nội",
    pay: { value: 45, unit: "hour", currency: "USD" },
    duration: "3 ngày",
    status: "open",
    skills: ["Photogrammetry", "AEB Shooting", "Safety"],
    stage: "matching",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 ngày trước
  },
  {
    id: "mch-002",
    title: "Chụp ảnh công trình ban đêm",
    summary: "Chụp timelapse ban đêm, yêu cầu camera tele, bay an toàn khu dân cư.",
    location: "TP. Hồ Chí Minh",
    pay: { value: 60, unit: "hour", currency: "USD" },
    duration: "2 đêm",
    status: "closingSoon",
    skills: ["Inspection", "Telephoto"],
    stage: "matching",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 ngày trước
  },

  // --- Đang thực hiện ---
  {
    id: "prg-201",
    title: "Quay video công trình tiến độ",
    summary: "Bay quay tiến độ hằng tuần, dựng clip 60–90 giây.",
    location: "Hà Nội",
    pay: { value: 800, unit: "project", currency: "USD" },
    duration: "2 tuần",
    status: "open", // job này vẫn mở cho người khác, nhưng mình đã nhận
    skills: ["Video", "Editing", "Safety"],
    stage: "in_progress",
    inProgress: {
      progressPct: 40,
      nextMilestone: { name: "Bàn giao draft video", due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString() }, // 3 ngày nữa
      paymentStatus: "partial",
      riskFlags: ["awaiting_client"],
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 ngày trước
    },
  },
  {
    id: "prg-202",
    title: "Chụp ảnh mái nhà cho bảo hiểm",
    summary: "Chụp AEB, phủ 70%, tạo báo cáo hư hại.",
    location: "Đà Nẵng",
    pay: { value: 50, unit: "hour", currency: "USD" },
    duration: "5 ngày",
    status: "open",
    skills: ["Photogrammetry", "AEB Shooting", "Insurance"],
    stage: "in_progress",
    inProgress: {
      progressPct: 85,
      nextMilestone: { name: "Bàn giao báo cáo", due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString() }, // 1 ngày nữa
      paymentStatus: "none",
      riskFlags: ["overdue"],
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 ngày trước
    },
  },

  // --- Đã hoàn thành ---
  {
    id: "cmp-301",
    title: "Lập bản đồ hiện trạng công trường",
    summary: "Chụp ảnh mặt bằng, dựng orthophoto + DEM; bàn giao GeoTIFF + DXF.",
    location: "Đà Nẵng",
    pay: { value: 1200, unit: "project", currency: "USD" },
    duration: "1 tuần",
    status: "closed",
    skills: ["RTK", "GCP", "Pix4D/Metashape"],
    stage: "completed",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 ngày trước
  },
  {
    id: "cmp-302",
    title: "Kiểm tra cột điện cao thế",
    summary: "Bay dọc tuyến 5km, ảnh chi tiết, checklist theo tiêu chuẩn nội bộ.",
    location: "TP. Hồ Chí Minh",
    pay: { value: 60, unit: "hour", currency: "USD" },
    duration: "4 ngày",
    status: "closed",
    skills: ["Inspection", "Telephoto", "Checklist"],
    stage: "completed",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), // 35 ngày trước
  },
];
/* ============================== Page Component ============================ */
export default function SeekerMatchHubPage() {
  const [items] = useState<SeekerJobItem[]>(MOCK_ITEMS);
  const [tab, setTab] = useState<JobStage>("matching");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [query, setQuery] = useState("");
  const { user } = useAuth();

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
          <p>Đang tải...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <Header variant={user.role} activeRoute="matches" />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý công việc</h1>
            <p className="text-sm text-slate-600">
              Tổng: {filteredAndSorted.length} mục
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-1">
            <button className={`rounded-lg px-3 py-1.5 text-sm ${view === "cards" ? "bg-slate-100 font-semibold" : ""}`} onClick={() => setView("cards")}>
              Cards
            </button>
            <button className={`rounded-lg px-3 py-1.5 text-sm ${view === "table" ? "bg-slate-100 font-semibold" : ""}`} onClick={() => setView("table")}>
              Table
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <TabButton active={tab === "matching"} onClick={() => setTab("matching")}>
            Đang ứng tuyển <Badge>{counts.matching}</Badge>
          </TabButton>
          <TabButton active={tab === "in_progress"} onClick={() => setTab("in_progress")}>
            Đang thực hiện <Badge>{counts.in_progress}</Badge>
          </TabButton>
          <TabButton active={tab === "completed"} onClick={() => setTab("completed")}>
            Đã hoàn thành <Badge>{counts.completed}</Badge>
          </TabButton>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              placeholder="Tìm theo từ khóa, kỹ năng, địa điểm…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
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
                <h3 className="mb-1 text-lg font-semibold">Không có mục phù hợp</h3>
                <p className="mb-4 text-sm text-slate-500">Thử tìm kiếm với từ khóa khác.</p>
                <button onClick={() => setQuery("")} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tiêu đề</th>
                  {tab === "matching" && <th className="px-4 py-3 font-semibold">Ngày ứng tuyển</th>}
                  {tab === "in_progress" && <><th className="px-4 py-3 font-semibold">Tiến độ</th><th className="px-4 py-3 font-semibold">Mốc kế tiếp</th><th className="px-4 py-3 font-semibold">Hạn chót</th></>}
                  {tab === "completed" && <th className="px-4 py-3 font-semibold">Ngày hoàn thành</th>}
                  <th className="px-4 py-3 font-semibold">Địa điểm</th>
                  <th className="px-4 py-3 font-semibold">Mức trả</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái Job</th>
                  <th className="px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((it) => (
                  <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">{it.title}</td>
                    {tab === 'matching' && <td className="px-4 py-3">{fmtDate(it.appliedAt)}</td>}
                    {tab === 'in_progress' && <><td className="px-4 py-3">{it.inProgress?.progressPct ?? 0}%</td><td className="px-4 py-3">{it.inProgress?.nextMilestone?.name ?? "—"}</td><td className="px-4 py-3">{fmtDate(it.inProgress?.nextMilestone?.due)}</td></>}
                    {tab === 'completed' && <td className="px-4 py-3">{fmtDate(it.completedAt)}</td>}
                    <td className="px-4 py-3">{it.location}</td>
                    <td className="px-4 py-3">{money(it.pay.value, it.pay.currency)}/{it.pay.unit === "hour" ? "giờ" : "dự án"}</td>
                    <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {tab === "matching" && <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100">Rút ứng tuyển</button>}
                        {tab === "completed" && <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">Viết đánh giá</button>}
                        {tab === "in_progress" && (
                          <>
                            <button className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100">Chat</button>
                            <button className="whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100">Bàn giao</button>
                          </>
                        )}
                        {tab !== "in_progress" && <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">Xem chi tiết</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSorted.length === 0 && (
                  <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={10}>Không có mục phù hợp.</td></tr>
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
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start gap-2">
        <h3 className="flex-1 text-base font-semibold">{item.title}</h3>
        <StatusBadge status={item.status} />
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>📍 {item.location}</span>
        <span>💰 {money(item.pay.value, item.pay.currency)}/{item.pay.unit === "hour" ? "giờ" : "dự án"}</span>
        <span>⏱️ {item.duration}</span>
      </div>
      <div className="text-xs text-slate-500 mb-3">Đã ứng tuyển ngày {fmtDate(item.appliedAt)}</div>
      <div className="mt-auto flex items-center gap-2 pt-4">
        <button className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Xem chi tiết</button>
        <button className="flex-1 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100">Rút ứng tuyển</button>
      </div>
    </div>
  );
}

// Card – Đã hoàn thành
function CompletedCard({ item }: { item: SeekerJobItem }) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start gap-2">
        <h3 className="flex-1 text-base font-semibold">{item.title}</h3>
        <StatusBadge status={item.status} />
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>📍 {item.location}</span>
        <span>💰 {money(item.pay.value, item.pay.currency)}/{item.pay.unit === "hour" ? "giờ" : "dự án"}</span>
        <span>⏱️ {item.duration}</span>
      </div>
      <div className="text-xs text-slate-500 mb-3">Hoàn thành ngày {fmtDate(item.completedAt)}</div>
      <div className="mt-auto flex items-center gap-2 pt-4">
        <button className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Xem chi tiết</button>
        <button className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100">Viết đánh giá</button>
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

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start gap-2">
        <h3 className="flex-1 text-base font-semibold">{item.title}</h3>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Đang thực hiện</span>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>Tiến độ</span>
          <span>{p.progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-blue-600" style={{ width: `${p.progressPct}%` }} />
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>📍 {item.location}</span>
        <span>💰 {money(item.pay.value, item.pay.currency)}/{item.pay.unit === "hour" ? "giờ" : "dự án"}</span>
        <span>⏱️ {item.duration}</span>
        <span>🗓️ Mốc kế tiếp: <b>{p.nextMilestone?.name ?? "—"}</b> • Due {fmtDate(p.nextMilestone?.due)}</span>
      </div>
      {risk.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {risk.map((r) => (
            <span key={r} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              {r === "overdue" ? "Quá hạn" : r === "awaiting_client" ? "Chờ phản hồi" : "Bị chặn"}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto grid grid-cols-3 items-center gap-2 pt-4">
        <button onClick={onOpenMilestones} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
          <Layers size={16} /> Mốc
        </button>
        <button onClick={onDeliver} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100">
          <UploadCloud size={16} /> Bàn giao
        </button>
        <button onClick={onChat} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100">
          <MessageSquare size={16} /> Chat
        </button>
      </div>
    </div>
  );
}

/* ============================ Small components =========================== */
function StatusBadge({ status }: { status: JobStatus }) {
  if (status === "open") return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Đang tuyển</span>;
  if (status === "closingSoon") return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Sắp đóng</span>;
  return <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">Đã đóng</span>;
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
