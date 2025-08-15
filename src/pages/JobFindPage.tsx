// App.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

/**
 * DroneWork – Seeker App (React + Tailwind)
 * ---------------------------------------------------------------------------
 * Cập nhật: thêm menu & trang "Yêu thích".
 * - Header: Trang chủ • Matches • Yêu thích (hiển thị số lượng)
 * - Route mới: favorites
 * - Trang mới: SeekerFavoritesPage (danh sách công việc đã lưu)
 */

type JobStatus = "open" | "closed" | "closingSoon";
interface Job {
  id: string;
  title: string;
  summary: string;
  description: string;
  postedAt: string;
  location: string;
  pay: { value: number; unit: "hour" | "project"; currency: "USD" | "VND" };
  duration: string;
  skills: string[];
  status: JobStatus;
  media?: string[];
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");
const money = (n: number, cur: "USD" | "VND") =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
const uid = () => Math.random().toString(36).slice(2, 9);

const MOCK_JOBS: Job[] = [
  {
    id: uid(),
    title: "Khảo sát mái nhà bằng drone",
    summary: "Bay kiểm tra mái nhà, chụp ảnh độ phân giải cao, bàn giao ảnh + báo cáo.",
    description:
      "Phạm vi: Khảo sát mái nhà khu dân cư. Yêu cầu chụp ảnh raw + jpeg, chồng lấp ≥ 70%, cao độ bay 60–80m. Bàn giao: ảnh, orthophoto (nếu có), báo cáo phát hiện hư hại. Ưu tiên có kinh nghiệm bảo hiểm/roofing.",
    postedAt: "2025-08-05",
    location: "Hà Nội",
    pay: { value: 45, unit: "hour", currency: "USD" },
    duration: "3 ngày (linh hoạt)",
    skills: ["Photogrammetry", "AEB Shooting", "Safety"],
    status: "open",
  },
  {
    id: uid(),
    title: "Lập bản đồ hiện trạng công trường",
    summary: "Chụp ảnh mặt bằng, dựng orthophoto + DEM. Bàn giao shapefile/GeoTIFF.",
    description:
      "Cần tạo bản đồ hiện trạng cho công trường ~25ha. Yêu cầu GCP tối thiểu 5 điểm, sai số ≤ 3cm. Bàn giao GeoTIFF + DXF đường biên. Có máy RTK là lợi thế.",
    postedAt: "2025-07-28",
    location: "Đà Nẵng",
    pay: { value: 1200, unit: "project", currency: "USD" },
    duration: "1 tuần",
    skills: ["RTK", "GCP", "Pix4D/Metashape"],
    status: "closingSoon",
  },
  {
    id: uid(),
    title: "Kiểm tra cột điện cao thế",
    summary: "Bay dọc tuyến 5km, chụp ảnh chi tiết, checklist theo tiêu chuẩn nội bộ.",
    description:
      "Kiểm tra 20 trụ, mỗi trụ 12 ảnh. Yêu cầu camera zoom, ảnh rõ cấu kiện. Bàn giao: ảnh + checklist khuyết điểm. Có kinh nghiệm utility inspection là lợi thế.",
    postedAt: "2025-06-12",
    location: "TP. Hồ Chí Minh",
    pay: { value: 60, unit: "hour", currency: "USD" },
    duration: "4 ngày",
    skills: ["Inspection", "Telephoto", "Checklist"],
    status: "closed",
  },
];

type Route =
  | { name: "list" }
  | { name: "detail"; id: string }
  | { name: "favorites" }
  | { name: "matches" };

export default function JobFindPage() {
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route>({ name: "list" });
  const [unreadChat] = useState(2);
  const [unreadNoti] = useState(3);

  // Trạng thái yêu thích/ứng tuyển
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const go = {
    list: () => setRoute({ name: "list" }),
    detail: (id: string) => setRoute({ name: "detail", id }),
    favorites: () => setRoute({ name: "favorites" }),
    matches: () => navigate('/seeker/matches'),
  };

  const toggleFav = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const applyJob = (id: string) => setApplied((prev) => new Set(prev).add(id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header
        variant="seeker"
        activeRoute={route.name === "list" || route.name === "detail" ? "find" : route.name}
        unreadChat={unreadChat}
        unreadNoti={unreadNoti}
        favCount={favorites.size}
        onFindJob={go.list}
        onMatches={go.matches}
        onFavorites={go.favorites}
      />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {route.name === "list" && (
          <SeekerJobListPage
            jobs={MOCK_JOBS}
            favorites={favorites}
            applied={applied}
            onToggleFav={toggleFav}
            onApply={applyJob}
            onOpenDetail={go.detail}
          />
        )}

        {route.name === "detail" && (
          <SeekerJobDetailPage
            job={MOCK_JOBS.find((j) => j.id === route.id)!}
            isFav={favorites.has(route.id)}
            isApplied={applied.has(route.id)}
            onBack={go.list}
            onToggleFav={() => toggleFav(route.id)}
            onApply={() => applyJob(route.id)}
          />
        )}

        {route.name === "favorites" && (
          <SeekerFavoritesPage
            jobs={MOCK_JOBS}
            favorites={favorites}
            applied={applied}
            onToggleFav={toggleFav}
            onApply={applyJob}
            onOpenDetail={go.detail}
            onBack={go.list}
          />
        )}

        {route.name === "matches" && <Placeholder title="Matches" onBack={go.list} />}
      </main>

      <Footer />
    </div>
  );
}

/* ===================== Trang Danh sách công việc ==================== */
function SeekerJobListPage({
  jobs,
  favorites,
  applied,
  onToggleFav,
  onApply,
  onOpenDetail,
}: {
  jobs: Job[];
  favorites: Set<string>;
  applied: Set<string>;
  onToggleFav: (id: string) => void;
  onApply: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const [view, setView] = useState<"cards" | "table">("cards");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [type, setType] = useState<"all" | "hour" | "project">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highestPay" | "nearest">("newest");

  const results = useMemo(() => {
    let list = [...jobs];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.summary.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (location !== "all") list = list.filter((j) => j.location === location);
    if (type !== "all") list = list.filter((j) => (type === "hour" ? j.pay.unit === "hour" : j.pay.unit === "project"));
    if (sortBy === "newest") list.sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
    if (sortBy === "highestPay") list.sort((a, b) => b.pay.value - a.pay.value);
    return list;
  }, [jobs, query, location, type, sortBy]);

  const locations = useMemo(() => ["all", ...Array.from(new Set(jobs.map((j) => j.location)))], [jobs]);

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Tìm công việc phù hợp</h1>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-slate-500 sm:inline">Chế độ hiển thị</span>
          <div className="rounded-xl border border-slate-200 bg-white p-1">
            <button className={`rounded-lg px-3 py-1.5 text-sm ${view === "cards" ? "bg-slate-100 font-semibold" : ""}`} onClick={() => setView("cards")}>
              Cards
            </button>
            <button className={`rounded-lg px-3 py-1.5 text-sm ${view === "table" ? "bg-slate-100 font-semibold" : ""}`} onClick={() => setView("table")}>
              Table
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <input
            placeholder="Từ khóa, kỹ năng, công cụ…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>

        <select value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/20">
          {locations.map((loc) => (
            <option key={loc} value={loc}>Địa điểm: {loc === "all" ? "Tất cả" : loc}</option>
          ))}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/20">
          <option value="all">Loại trả phí: Tất cả</option>
          <option value="hour">Theo giờ</option>
          <option value="project">Theo dự án</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/20 md:col-span-1">
          <option value="newest">Sắp xếp: Mới nhất</option>
          <option value="highestPay">Sắp xếp: Trả cao</option>
          <option value="nearest">Sắp xếp: Gần nhất</option>
        </select>
      </div>

      {view === "cards" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              isFav={favorites.has(j.id)}
              isApplied={applied.has(j.id)}
              onToggleFav={() => onToggleFav(j.id)}
              onApply={() => onApply(j.id)}
              onOpenDetail={() => onOpenDetail(j.id)}
            />
          ))}
          {results.length === 0 && <EmptyState onClear={() => { setQuery(""); setLocation("all"); setType("all"); setSortBy("newest"); }} />}
        </div>
      )}

      {view === "table" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Tiêu đề</th>
                <th className="px-4 py-3 font-semibold">Mức trả</th>
                <th className="px-4 py-3 font-semibold">Địa điểm</th>
                <th className="px-4 py-3 font-semibold">Thời lượng</th>
                <th className="px-4 py-3 font-semibold">Ngày đăng</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {results.map((j) => (
                <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{j.title}</td>
                  <td className="px-4 py-3">{money(j.pay.value, j.pay.currency)}/{j.pay.unit === "hour" ? "giờ" : "dự án"}</td>
                  <td className="px-4 py-3">{j.location}</td>
                  <td className="px-4 py-3">{j.duration}</td>
                  <td className="px-4 py-3">{fmtDate(j.postedAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50" onClick={() => onOpenDetail(j.id)}>Chi tiết</button>
                      {j.status === "closed" ? (
                        <button disabled className="cursor-not-allowed rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">Đã đóng</button>
                      ) : applied.has(j.id) ? (
                        <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Đã ứng tuyển</span>
                      ) : (
                        <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110" onClick={() => onApply(j.id)}>Ứng tuyển</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td className="px-4 py-10 text-center text-slate-500" colSpan={7}>Không tìm thấy công việc phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===================== Trang Yêu thích (mới) ====================== */
function SeekerFavoritesPage({
  jobs,
  favorites,
  applied,
  onToggleFav,
  onApply,
  onOpenDetail,
  onBack,
}: {
  jobs: Job[];
  favorites: Set<string>;
  applied: Set<string>;
  onToggleFav: (id: string) => void;
  onApply: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onBack: () => void;
}) {
  const favJobs = useMemo(() => jobs.filter((j) => favorites.has(j.id)), [jobs, favorites]);

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-slate-600 hover:underline">← Quay lại danh sách</button>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Công việc đã yêu thích</h1>
        <span className="text-sm text-slate-600">Tổng cộng: <b>{favJobs.length}</b></span>
      </div>

      {favJobs.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mb-3 text-5xl">🩷</div>
          <h3 className="mb-1 text-lg font-semibold">Chưa có công việc nào được lưu</h3>
          <p className="text-sm text-slate-500">Hãy quay lại danh sách và bấm biểu tượng trái tim để lưu công việc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favJobs.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              isFav={true}
              isApplied={applied.has(j.id)}
              onToggleFav={() => onToggleFav(j.id)}
              onApply={() => onApply(j.id)}
              onOpenDetail={() => onOpenDetail(j.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ====================== Thành phần dùng chung ====================== */
function JobCard({
  job,
  isFav,
  isApplied,
  onToggleFav,
  onApply,
  onOpenDetail,
}: {
  job: Job;
  isFav: boolean;
  isApplied: boolean;
  onToggleFav: () => void;
  onApply: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <button aria-label="Yêu thích" onClick={onToggleFav} className="absolute right-4 top-4 text-xl" title={isFav ? "Bỏ lưu" : "Lưu công việc"}>
        {isFav ? "❤️" : "🤍"}
      </button>

      <div className="mb-2 flex items-start">
        <div className="flex-1">
          <h3 className="pr-8 text-base font-semibold">{job.title}</h3>
          <div className="mt-1">
            <StatusBadge status={job.status} />
          </div>
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-slate-600">{job.summary}</p>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>📍 {job.location}</span>
        <span>💰 {money(job.pay.value, job.pay.currency)}/{job.pay.unit === "hour" ? "giờ" : "dự án"}</span>
        <span>⏱️ {job.duration}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {job.skills.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{s}</span>
        ))}
        {job.skills.length > 3 && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">+{job.skills.length - 3}</span>}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button onClick={onOpenDetail} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
          Xem chi tiết
        </button>

        {job.status === "closed" ? (
          <button disabled className="flex-1 cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">Đã đóng</button>
        ) : isApplied ? (
          <span className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Đã ứng tuyển</span>
        ) : (
          <button onClick={onApply} className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
            Ứng tuyển
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  if (status === "open")
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Đang tuyển</span>;
  if (status === "closingSoon")
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Sắp đóng</span>;
  return <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">Đã đóng</span>;
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mb-3 text-5xl">🔎</div>
      <h3 className="mb-1 text-lg font-semibold">Không tìm thấy công việc phù hợp</h3>
      <p className="mb-4 text-sm text-slate-500">Thử xoá bớt bộ lọc hoặc đổi từ khóa</p>
      <button onClick={onClear} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
        Xoá bộ lọc
      </button>
    </div>
  );
}

/* ====================== Trang Chi tiết công việc ===================== */
function SeekerJobDetailPage({
  job,
  isFav,
  isApplied,
  onBack,
  onToggleFav,
  onApply,
}: {
  job: Job;
  isFav: boolean;
  isApplied: boolean;
  onBack: () => void;
  onToggleFav: () => void;
  onApply: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <button onClick={onBack} className="mb-3 text-sm text-slate-600 hover:underline">← Quay lại danh sách</button>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{job.title}</h1>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggleFav} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">
              {isFav ? "❤️ Đã lưu" : "🤍 Lưu"}
            </button>
            {job.status === "closed" ? (
              <button disabled className="cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">Đã đóng</button>
            ) : isApplied ? (
              <span className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Đã ứng tuyển</span>
            ) : (
              <button onClick={onApply} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                Ứng tuyển
              </button>
            )}
          </div>
        </div>
      </div>

      <article className="lg:col-span-2">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Tổng quan</h2>
          <p className="text-sm text-slate-700">{job.summary}</p>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Chi tiết dự án</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Kỹ năng yêu cầu</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{s}</span>
            ))}
          </div>
        </section>
      </article>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold">Thông tin nhanh</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>💰 <b>{money(job.pay.value, job.pay.currency)}</b>/{job.pay.unit === "hour" ? "giờ" : "dự án"}</li>
            <li>📍 {job.location}</li>
            <li>⏱️ {job.duration}</li>
            <li>🗓️ Đăng: {fmtDate(job.postedAt)}</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => navigate("/chat")}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Liên hệ
            </button>
            {job.status === "closed" ? (
              <button disabled className="flex-1 cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-500">Đã đóng</button>
            ) : isApplied ? (
              <span className="flex-1 rounded-xl bg-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700">Đã ứng tuyển</span>
            ) : (
              <button onClick={onApply} className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Ứng tuyển</button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">Vị trí</h3>
          <div className="aspect-video w-full rounded-xl bg-slate-200" />
        </div>
      </aside>
    </div>
  );
}

/* ============================ Helpers ============================ */
function Placeholder({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      <p className="mb-4 text-slate-600">Trang này là placeholder cho demo routing.</p>
      <button onClick={onBack} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
        Quay lại Danh sách công việc
      </button>
    </div>
  );
}
