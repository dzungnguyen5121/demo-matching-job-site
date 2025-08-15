// App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, MessageSquare, ArrowLeft } from "lucide-react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/* ============================================================================
   Types
============================================================================ */
type ApplicantStatus = "pending" | "approved" | "rejected";

interface WorkEntry {
  id: string;
  time: { start: string; end?: string }; // ISO date strings
  title: string;                          // Vai trò / chức danh
  org: string;                            // Công ty / Dự án
  description?: string;                   // Mô tả ngắn
  highlights?: string[];                  // Thành tựu / gạch đầu dòng
}

interface Applicant {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
  age: number;
  yearsExp: number;
  fields: string[];                       // Lĩnh vực hoạt động
  location?: string;
  appliedAt: string;                      // ISO time
  status: ApplicantStatus;
  summary?: string;                       // Giới thiệu ngắn
  workHistory: WorkEntry[];
}

/* ============================================================================
   Mock data
============================================================================ */
const APPLICANTS_MOCK: Applicant[] = [
  {
    id: "cand-001",
    name: "Nguyễn Minh Khôi",
    initials: "MK",
    age: 29,
    yearsExp: 4,
    fields: ["Khảo sát", "Photogrammetry", "RTK"],
    location: "Hà Nội",
    appliedAt: new Date(Date.now() - 2 * 864e5).toISOString(),
    status: "pending",
    summary: "Phi công drone có kinh nghiệm lập bản đồ hiện trạng và xử lý ảnh Metashape/Pix4D.",
    workHistory: [
      {
        id: "we1",
        time: { start: "2023-01-01", end: "2024-10-01" },
        title: "Drone Survey Pilot",
        org: "Công ty Xây dựng A",
        description: "Phụ trách bay khảo sát công trình và dựng orthophoto + DEM.",
        highlights: [
          "Triển khai 25+ dự án khảo sát hạ tầng",
          "Thiết lập GCP & RTK; độ chính xác ≤ 2cm",
        ],
      },
      {
        id: "we2",
        time: { start: "2021-03-01", end: "2022-12-01" },
        title: "UAV Operator (Freelance)",
        org: "Nhiều dự án tự do",
        highlights: ["Bảo hiểm nhà ở, kiểm tra mái", "Báo cáo PDF + GeoTIFF"],
      },
    ],
  },
  {
    id: "cand-002",
    name: "Trần Bảo Anh",
    initials: "BA",
    age: 33,
    yearsExp: 7,
    fields: ["Kiểm định", "Telephoto", "An toàn bay"],
    location: "Đà Nẵng",
    appliedAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    status: "pending",
    summary: "Chuyên kiểm định cột điện, đường dây, kinh nghiệm tiêu chuẩn an toàn nội bộ.",
    workHistory: [
      {
        id: "we3",
        time: { start: "2022-05-01" },
        title: "Senior Inspection Pilot",
        org: "EVN Partners",
        highlights: ["Tuyến 15km/tuần", "Checklists & telephoto lens (7×)"],
      },
    ],
  },
  {
    id: "cand-003",
    name: "Phạm Hải Yến",
    initials: "HY",
    age: 27,
    yearsExp: 3,
    fields: ["Chụp ảnh", "Editing", "Video"],
    location: "TP.HCM",
    appliedAt: new Date(Date.now() - 5 * 864e5).toISOString(),
    status: "approved",
    summary: "Quay/chụp công trình định kỳ, dựng clip 60–90s cho báo cáo tiến độ.",
    workHistory: [
      {
        id: "we4",
        time: { start: "2021-01-01", end: "2023-08-01" },
        title: "Aerial Videographer",
        org: "Studio Drone B",
        highlights: ["10+ clip monthly", "Workflow Premiere + Resolve"],
      },
    ],
  },
  {
    id: "cand-004",
    name: "Lê Quang Huy",
    initials: "QH",
    age: 31,
    yearsExp: 6,
    fields: ["Lập bản đồ", "GCP", "DEM"],
    location: "Cần Thơ",
    appliedAt: new Date(Date.now() - 9 * 864e5).toISOString(),
    status: "rejected",
    summary: "Tập trung lập bản đồ địa hình nông nghiệp, pipeline xử lý ảnh tự động.",
    workHistory: [
      {
        id: "we5",
        time: { start: "2019-06-01" },
        title: "Geospatial Specialist",
        org: "AgriMap Co.",
        highlights: ["NDVI, DSM/DTM", "Kết nối QGIS"],
      },
    ],
  },
];

/* ============================================================================
   Small helpers & UI atoms
============================================================================ */
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

function StatusBadge({ s }: { s: ApplicantStatus }) {
  if (s === "approved")
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Đã duyệt</span>;
  if (s === "rejected")
    return <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">Từ chối</span>;
  return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Chờ duyệt</span>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 ring-1 ring-blue-600/20">{children}</span>;
}

function Avatar({ name, url, initials }: { name: string; url?: string; initials?: string }) {
  // Avatar ảnh thật nếu có; fallback hình tròn với initials
  if (url) {
    return <img src={url} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  }
  const inits = initials || name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
  return <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-slate-700 text-sm font-semibold">{inits}</div>;
}

/* ============================================================================
   CV Modal (dialog)
   - Có ESC để đóng.
   - Nút Approve/Reject ngay trong modal (đồng bộ trạng thái list).
============================================================================ */
function ApplicantModal({
  open,
  onClose,
  applicant,
  onApprove,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  applicant?: Applicant;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [newStatus, setNewStatus] = useState<ApplicantStatus | null>(null);

  // Reset trạng thái đang chờ xác nhận khi applicant thay đổi
  useEffect(() => {
    setNewStatus(null);
  }, [applicant]);

  // Đóng bằng ESC (hoặc hủy thay đổi trạng thái)
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (newStatus) {
          setNewStatus(null); // Ưu tiên hủy thay đổi
        } else {
          onClose(); // Nếu không có gì thay đổi thì đóng
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose, newStatus]);

  if (!open || !applicant) return null;

  const handleConfirm = () => {
    if (newStatus === "approved") {
      onApprove(applicant.id);
    } else if (newStatus === "rejected") {
      onReject(applicant.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* Dialog panel */}
      <div className="absolute inset-x-0 bottom-0 m-0 mx-auto rounded-t-2xl bg-white shadow-2xl sm:inset-0 sm:m-auto sm:h-fit sm:max-w-3xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={applicant.name} url={applicant.avatarUrl} initials={applicant.initials} />
            <div>
              <div className="text-base font-semibold">{applicant.name}</div>
              <div className="mt-1.5 rounded-lg bg-slate-100 p-2 text-center text-sm text-slate-800">
                {applicant.age} tuổi &bull; {applicant.yearsExp} năm kinh nghiệm &bull; Ứng tuyển ngày{" "}
                {fmtDate(applicant.appliedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge s={newStatus || applicant.status} />
            <button
              onClick={onClose}
              autoFocus
              className="grid h-8 w-8 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-rose-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-6 px-5 py-5 sm:grid-cols-3">
          {/* Left meta */}
          <div className="sm:col-span-1 space-y-4">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Lĩnh vực</div>
              <div className="flex flex-wrap gap-2">
                {applicant.fields.map((f) => <Chip key={f}>{f}</Chip>)}
              </div>
            </div>
            {applicant.location && (
              <div className="text-sm text-slate-600">📍 {applicant.location}</div>
            )}
            {applicant.summary && (
              <div className="text-sm text-slate-700">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Giới thiệu</div>
                {applicant.summary}
              </div>
            )}
          </div>

          {/* Right timeline */}
          <div className="sm:col-span-2">
            <div className="mb-3 text-sm font-semibold">Lịch sử làm việc</div>
            <ol className="relative ml-3 border-l border-slate-200">
              {applicant.workHistory.map((w) => (
                <li key={w.id} className="mb-5 ml-4">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-blue-600"></span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{w.title}</div>
                    <div className="text-xs text-slate-500">
                      {fmtDate(w.time.start)} – {w.time.end ? fmtDate(w.time.end) : "Hiện tại"}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">{w.org}</div>
                  {w.description && <div className="mt-1 text-sm text-slate-700">{w.description}</div>}
                  {!!w.highlights?.length && (
                    <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                      {w.highlights!.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer actions in modal */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <div className="text-xs text-slate-500">ID: {applicant.id}</div>

          {!newStatus ? (
          <div className="flex items-center gap-2">
            <button
                onClick={() => setNewStatus("rejected")}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              Từ chối
            </button>
            <button
                onClick={() => setNewStatus("approved")}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Phê duyệt
            </button>
          </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Bạn chắc chắn chứ?</span>
              <button
                onClick={() => setNewStatus(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  newStatus === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Xác nhận
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Applicants List (Job Poster) – with Approve/Reject + Modal view CV
============================================================================ */
function ApplicantsListPage() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<Applicant[]>(APPLICANTS_MOCK);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicantStatus>("all");

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<Applicant | undefined>(undefined);

  // Derived counts (badge ở tab/filter)
  const counts = useMemo(() => {
    return {
      all: applicants.length,
      pending: applicants.filter((a) => a.status === "pending").length,
      approved: applicants.filter((a) => a.status === "approved").length,
      rejected: applicants.filter((a) => a.status === "rejected").length,
    };
  }, [applicants]);

  // Filter + sort core
  const filtered = useMemo(() => {
    let list = [...applicants];

    // Từ khóa: tên, lĩnh vực, vị trí
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.location ?? "").toLowerCase().includes(q) ||
          a.fields.some((f) => f.toLowerCase().includes(q))
      );
    }

    // Lọc theo trạng thái
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Sắp xếp: pending lên đầu, sau đó theo ngày ứng tuyển gần nhất
    list.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });

    return list;
  }, [applicants, query, statusFilter]);

  // Approve/Reject handlers (optimistic update)
  const approve = (id: string) =>
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a)));
  const reject = (id: string) =>
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)));

  const openCV = (a: Applicant) => {
    setSelected(a);
    setOpenModal(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-start gap-4">
        <button
          onClick={() => navigate("/poster/jobs")}
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-white text-slate-800 shadow-md ring-1 ring-slate-900/5 transition hover:shadow-lg"
          title="Quay lại danh sách"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Ứng viên cho công việc
          </h1>
          <p className="mt-1 text-lg font-semibold text-blue-600">
            Khảo sát mái nhà bằng drone – Quận 1
          </p>
          <p className="mt-4 text-base text-slate-600">
            <span className="font-bold text-slate-800">{filtered.length}</span> ứng viên
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <input
            placeholder="Tìm theo tên, lĩnh vực, địa điểm…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
        >
          <option value="all">Tất cả ({counts.all})</option>
          <option value="pending">Chờ duyệt ({counts.pending})</option>
          <option value="approved">Đã duyệt ({counts.approved})</option>
          <option value="rejected">Từ chối ({counts.rejected})</option>
        </select>
      </div>

      {/* Table view */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Ứng viên</th>
              <th className="px-4 py-3 font-semibold">Lĩnh vực</th>
              <th className="px-4 py-3 font-semibold">Kinh nghiệm</th>
              <th className="px-4 py-3 font-semibold">Địa điểm</th>
              <th className="px-4 py-3 font-semibold">Ngày ứng tuyển</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-center">Chat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <button onClick={() => openCV(a)} className="flex items-center gap-3 text-left hover:underline">
                    <Avatar name={a.name} url={a.avatarUrl} initials={a.initials} />
                    <div>
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-xs text-slate-600">{a.age} tuổi</div>
                    </div>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {a.fields.slice(0, 3).map((f) => <Chip key={f}>{f}</Chip>)}
                    {a.fields.length > 3 && <span className="text-xs text-slate-500">+{a.fields.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">{a.yearsExp} năm</td>
                <td className="px-4 py-3">{a.location ?? "—"}</td>
                <td className="px-4 py-3">{fmtDate(a.appliedAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge s={a.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => navigate("/chat")}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-blue-600"
                  >
                    <MessageSquare size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Không có ứng viên phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CV */}
      <ApplicantModal
        open={openModal}
        applicant={selected}
        onClose={() => setOpenModal(false)}
        onApprove={(id) => { approve(id); setOpenModal(false); }}
        onReject={(id) => { reject(id); setOpenModal(false); }}
      />
    </div>
  );
}

/* ============================================================================
   App root – giữ Header/Footer
============================================================================ */
export default function ApplicantPage() {
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
      <Header variant={user.role} />
      <main>
        <ApplicantsListPage />
      </main>
      <Footer />
    </div>
  );
}
