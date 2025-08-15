// App.tsx
import { useState, useMemo } from "react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { MoreVertical } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/* =============================================================================
   Types & mock data
============================================================================= */
type NotiType = "message" | "offer" | "system";

interface Notification {
  id: string;
  type: NotiType;
  title: string;
  body?: string;
  createdAt: string; // ISO
  read: boolean;
  jobId?: string;
  jobTitle?: string;
}

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);

const now = (minsAgo = 0) => new Date(Date.now() - minsAgo * 60000).toISOString();

const MOCK_NOTIS: Notification[] = [
  { id: uid(), type: "message", title: "Dronex đã nhắn tin cho bạn", body: "Hẹn bạn chiều mai trao đổi thêm nhé.", createdAt: now(10), read: false, jobId: "JOB-123", jobTitle: "Khảo sát mái nhà" },
  { id: uid(), type: "offer",   title: "Đề xuất giá từ BuildPro", body: "12.000.000 VND / dự án · start 18/08", createdAt: now(25), read: false, jobId: "JOB-207", jobTitle: "Lập bản đồ hiện trạng" },
  { id: uid(), type: "system",  title: "Tài khoản đã xác minh email", body: "Chúc mừng! Email của bạn đã xác minh.", createdAt: now(65), read: true },
  { id: uid(), type: "message", title: "Vision Studio đã trả lời", body: "Có thể gửi thêm ví dụ video không?", createdAt: now(60 * 5), read: false, jobId: "JOB-404", jobTitle: "Quay video tiến độ" },
  { id: uid(), type: "offer",   title: "Đề xuất đã được chấp nhận", body: "Poster đã chấp nhận đề xuất của bạn.", createdAt: now(60 * 28), read: true, jobId: "JOB-123" },
];

/* =============================================================================
   Small utils & atoms
============================================================================= */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}

function DayDivider({ iso }: { iso: string }) {
  const d = new Date(iso);
  const label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{label}</div>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function TypePill({ type }: { type: NotiType }) {
  const map: Record<NotiType, { text: string; className: string; icon: string }> = {
    message: { text: "Tin nhắn", className: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", icon: "💬" },
    offer:   { text: "Đề xuất", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", icon: "💼" },
    system:  { text: "Hệ thống", className: "bg-slate-100 text-slate-700 ring-slate-300", icon: "⚙️" },
  };
  const m = map[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${m.className}`}>
      <span>{m.icon}</span>{m.text}
    </span>
  );
}

/* =============================================================================
   Notification item
============================================================================= */
function NotiItem({
  n,
  onOpen,
}: {
  n: Notification;
  onToggleRead: (id: string) => void;
  onOpen: (n: Notification) => void;
}) {
  return (
    // Toàn bộ card là “button” ảo: bấm/Enter/Space sẽ mở thông báo
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(n)}
      onKeyDown={(e) => {
        // A11y: Enter/Space cũng mở như click
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(n);
        }
      }}
      className={`group cursor-pointer rounded-xl border p-3 transition ${
        n.read
          ? "border-slate-200 bg-[#F2F6FC] hover:bg-slate-200"
          : "border-blue-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-lg">
          {n.type === "message" ? "💬" : n.type === "offer" ? "💼" : "⚙️"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {!n.read && (
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                )}
                <div
                  className={`truncate text-sm ${
                    n.read ? "font-medium text-slate-800" : "font-semibold text-slate-900"
                  }`}
                >
                  {n.title}
                </div>
              </div>
              {n.body && (
                <div className="mt-0.5 line-clamp-2 text-sm text-slate-600">{n.body}</div>
              )}
              {(n.jobTitle || n.jobId) && (
                <div className="mt-1 text-xs text-slate-500">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-600/20">
                    {n.jobTitle || n.jobId}
                  </span>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <TypePill type={n.type} />
                <span className="text-xs text-slate-500">{timeAgo(n.createdAt)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


/* =============================================================================
   Filters (tabs + search)
============================================================================= */
type TabKey = "all" | "unread" | "message" | "offer" | "system";

function FiltersBar({
  tab, setTab, onSearch,
}: {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  onSearch: (q: string) => void;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "unread", label: "Chưa đọc" },
    { key: "message", label: "Tin nhắn" },
    { key: "offer", label: "Đề xuất" },
    { key: "system", label: "Hệ thống" },
  ];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="overflow-x-auto">
        <div className="inline-flex gap-2 rounded-xl border border-slate-200 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t.key ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        <input
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề, nội dung, job…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      </div>
    </div>
  );
}

/* =============================================================================
   Notifications Page
============================================================================= */
function NotificationsPageContent({
  items, setItems,
}: {
  items: Notification[];
  setItems: (upd: Notification[]) => void;
}) {
  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Lọc + sắp xếp theo thời gian giảm dần
  const filtered = useMemo(() => {
    let arr = [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (tab === "unread") arr = arr.filter((n) => !n.read);
    if (tab === "message" || tab === "offer" || tab === "system") arr = arr.filter((n) => n.type === tab);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter(
        (n) =>
          n.title.toLowerCase().includes(s) ||
          (n.body ?? "").toLowerCase().includes(s) ||
          (n.jobTitle ?? "").toLowerCase().includes(s) ||
          (n.jobId ?? "").toLowerCase().includes(s)
      );
    }
    return arr;
  }, [items, tab, q]);

  // Gom nhóm theo ngày để chèn divider
  const grouped = useMemo(() => {
    const out: (Notification | { divider: true; iso: string })[] = [];
    let prevDay = "";
    for (const n of filtered) {
      const d = new Date(n.createdAt);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dayKey !== prevDay) {
        out.push({ divider: true, iso: n.createdAt });
        prevDay = dayKey;
      }
      out.push(n);
    }
    return out;
  }, [filtered]);

  // Đánh dấu 1 thông báo đã đọc / hoàn tác
  const toggleRead = (id: string) => {
    setItems(items.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  // Đánh dấu tất cả là đã đọc
  const markAllRead = () => setItems(items.map((n) => ({ ...n, read: true })));

  // Xoá tất cả thông báo đã đọc
  const clearRead = () => setItems(items.filter((n) => !n.read));

  // “Mở” thông báo: ở MVP ta chỉ alert; trong thực tế sẽ deep-link tới Job/Chat
  const openNoti = (n: Notification) => {
    const target =
      n.type === "message" ? "Chat"
      : n.type === "offer" ? "Offer/Contract"
      : "System";
    alert(`Mở ${target}${n.jobTitle ? ` · ${n.jobTitle}` : ""} (demo)`);
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header row with title + bulk actions */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
          <p className="text-sm text-slate-600">Bạn có <span className="font-semibold">{unreadCount}</span> thông báo chưa đọc.</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg">
              <button 
                onClick={() => { markAllRead(); setMenuOpen(false); }} 
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Đánh dấu tất cả đã đọc
              </button>
              <button 
                onClick={() => { clearRead(); setMenuOpen(false); }} 
                className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                Xoá thông báo đã đọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <FiltersBar tab={tab} setTab={setTab} onSearch={setQ} />

      {/* List */}
      <div className="mt-4">
        {grouped.length === 0 ? (
          <div className="mt-12 grid place-items-center text-slate-500">
            <div className="text-5xl mb-2">🔔</div>
            <div className="text-sm">Không có thông báo nào.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {grouped.map((it, idx) =>
              "divider" in it ? (
                <DayDivider key={`d-${idx}`} iso={it.iso} />
              ) : (
                <NotiItem key={it.id} n={it} onToggleRead={toggleRead} onOpen={(n) => {
                  if (!n.read) toggleRead(n.id);
                  openNoti(n);
                }} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================================================================
   App root – gắn Header/Footer và truyền unread vào bell icon
============================================================================= */
export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(MOCK_NOTIS);
  const unread = items.filter((n) => !n.read).length;
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Header variant="guest" />
        <main className="grid h-[calc(100vh-8rem)] place-items-center">
          <p>Đang tải...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header variant={user.role} unreadNoti={unread} />
      <main>
        {/* Trang danh sách thông báo */}
        <NotificationsPageContent items={items} setItems={setItems} />
      </main>
      <Footer />
    </div>
  );
}
