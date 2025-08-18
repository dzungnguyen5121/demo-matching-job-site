// App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, MessageSquare, ArrowLeft } from "lucide-react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

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
const APPLICANTS_MOCK_DATA: Applicant[] = [
  {
    id: "cand-001",
    name: "joblist_mock_applicant1_name",
    initials: "MK",
    age: 29,
    yearsExp: 4,
    fields: ["applicant_mock_field_survey", "applicant_mock_field_photogrammetry", "applicant_mock_field_rtk"],
    location: "hanoi",
    appliedAt: new Date(Date.now() - 2 * 864e5).toISOString(),
    status: "pending",
    summary: "applicant_mock_summary1",
    workHistory: [
      {
        id: "we1",
        time: { start: "2023-01-01", end: "2024-10-01" },
        title: "applicant_mock_work_title1",
        org: "applicant_mock_work_org1",
        description: "applicant_mock_work_desc1",
        highlights: [
          "applicant_mock_highlight1a",
          "applicant_mock_highlight1b",
        ],
      },
      {
        id: "we2",
        time: { start: "2021-03-01", end: "2022-12-01" },
        title: "applicant_mock_work_title2",
        org: "applicant_mock_work_org2",
        highlights: ["applicant_mock_highlight2a", "applicant_mock_highlight2b"],
      },
    ],
  },
  {
    id: "cand-002",
    name: "joblist_mock_applicant2_name",
    initials: "BA",
    age: 33,
    yearsExp: 7,
    fields: ["applicant_mock_field_inspection", "applicant_mock_field_telephoto", "applicant_mock_field_safety"],
    location: "danang",
    appliedAt: new Date(Date.now() - 1 * 864e5).toISOString(),
    status: "pending",
    summary: "applicant_mock_summary2",
    workHistory: [
      {
        id: "we3",
        time: { start: "2022-05-01" },
        title: "applicant_mock_work_title3",
        org: "applicant_mock_work_org3",
        highlights: ["applicant_mock_highlight3a", "applicant_mock_highlight3b"],
      },
    ],
  },
  {
    id: "cand-003",
    name: "joblist_mock_applicant3_name",
    initials: "HY",
    age: 27,
    yearsExp: 3,
    fields: ["applicant_mock_field_photography", "applicant_mock_field_editing", "applicant_mock_field_video"],
    location: "hochiminh_city",
    appliedAt: new Date(Date.now() - 5 * 864e5).toISOString(),
    status: "approved",
    summary: "applicant_mock_summary3",
    workHistory: [
      {
        id: "we4",
        time: { start: "2021-01-01", end: "2023-08-01" },
        title: "applicant_mock_work_title4",
        org: "applicant_mock_work_org4",
        highlights: ["applicant_mock_highlight4a", "applicant_mock_highlight4b"],
      },
    ],
  },
  {
    id: "cand-004",
    name: "joblist_mock_applicant4_name",
    initials: "QH",
    age: 31,
    yearsExp: 6,
    fields: ["applicant_mock_field_mapping", "applicant_mock_field_gcp", "applicant_mock_field_dem"],
    location: "cantho",
    appliedAt: new Date(Date.now() - 9 * 864e5).toISOString(),
    status: "rejected",
    summary: "applicant_mock_summary4",
    workHistory: [
      {
        id: "we5",
        time: { start: "2019-06-01" },
        title: "applicant_mock_work_title5",
        org: "applicant_mock_work_org5",
        highlights: ["applicant_mock_highlight5a", "applicant_mock_highlight5b"],
      },
    ],
  },
];

/* ============================================================================
   Small helpers & UI atoms
============================================================================ */
function StatusBadge({ s }: { s: ApplicantStatus }) {
  const { t } = useTranslation();
  if (s === "approved")
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{t('applicant_status_approved')}</span>;
  if (s === "rejected")
    return <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">{t('applicant_status_rejected')}</span>;
  return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{t('applicant_status_pending')}</span>;
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
  const { t, i18n } = useTranslation();
  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString(i18n.language, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

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
                {t('applicantModal_info', { age: applicant.age, exp: applicant.yearsExp, date: fmtDate(applicant.appliedAt) })}
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
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('applicantModal_fields')}</div>
              <div className="flex flex-wrap gap-2">
                {applicant.fields.map((f) => <Chip key={f}>{f}</Chip>)}
              </div>
            </div>
            {applicant.location && (
              <div className="text-sm text-slate-600">{t('applicantModal_location', { location: applicant.location })}</div>
            )}
            {applicant.summary && (
              <div className="text-sm text-slate-700">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('applicantModal_summary')}</div>
                {applicant.summary}
              </div>
            )}
          </div>

          {/* Right timeline */}
          <div className="sm:col-span-2">
            <div className="mb-3 text-sm font-semibold">{t('applicantModal_workHistory')}</div>
            <ol className="relative ml-3 border-l border-slate-200">
              {applicant.workHistory.map((w) => (
                <li key={w.id} className="mb-5 ml-4">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-blue-600"></span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{w.title}</div>
                    <div className="text-xs text-slate-500">
                      {fmtDate(w.time.start)} – {w.time.end ? fmtDate(w.time.end) : t('applicantModal_present')}
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
          <div className="text-xs text-slate-500">{t('applicant_id_prefix')}{applicant.id}</div>

          {!newStatus ? (
          <div className="flex items-center gap-2">
            <button
                onClick={() => setNewStatus("rejected")}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              {t('applicantModal_reject')}
            </button>
            <button
                onClick={() => setNewStatus("approved")}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t('applicantModal_approve')}
            </button>
          </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t('applicantModal_confirm_title')}</span>
              <button
                onClick={() => setNewStatus(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              >
                {t('applicantModal_confirm_cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  newStatus === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {t('applicantModal_confirm_confirm')}
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
  const { t, i18n } = useTranslation();
  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString(i18n.language, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : t('no_date_placeholder');

  const APPLICANTS_MOCK = useMemo(() => APPLICANTS_MOCK_DATA.map(a => ({
    ...a,
    name: t(a.name),
    fields: a.fields.map(f => t(f)),
    location: t(a.location || ''),
    summary: t(a.summary || ''),
    workHistory: a.workHistory.map(w => ({
      ...w,
      title: t(w.title),
      org: t(w.org),
      description: t(w.description || ''),
      highlights: w.highlights?.map(h => t(h))
    }))
  })), [t]);

  const [applicants, setApplicants] = useState<Applicant[]>(APPLICANTS_MOCK);
  
  useEffect(() => {
    setApplicants(APPLICANTS_MOCK);
  }, [APPLICANTS_MOCK]);

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
          title={t('applicantList_back')}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('applicantList_title')}
          </h1>
          <p className="mt-1 text-lg font-semibold text-blue-600">
            {t('applicantList_jobTitle_placeholder')}
          </p>
          <p className="mt-4 text-base text-slate-600">
            <span className="font-bold text-slate-800">{t('applicantList_applicantCount', { count: filtered.length })}</span>
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <input
            placeholder={t('applicantList_search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" title={t('search_icon_alt')}>🔍</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
        >
          <option value="all">{t('applicantList_filter_all', { count: counts.all })}</option>
          <option value="pending">{t('applicantList_filter_pending', { count: counts.pending })}</option>
          <option value="approved">{t('applicantList_filter_approved', { count: counts.approved })}</option>
          <option value="rejected">{t('applicantList_filter_rejected', { count: counts.rejected })}</option>
        </select>
      </div>

      {/* Table view */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">{t('applicantList_table_header_applicant')}</th>
              <th className="px-4 py-3 font-semibold">{t('applicantList_table_header_fields')}</th>
              <th className="px-4 py-3 font-semibold">{t('applicantList_table_header_experience')}</th>
              <th className="px-4 py-3 font-semibold">{t('applicantList_table_header_location')}</th>
              <th className="px-4 py-3 font-semibold">{t('applicantList_table_header_appliedDate')}</th>
              <th className="px-4 py-3 font-semibold">{t('applicantList_table_header_status')}</th>
              <th className="px-4 py-3 font-semibold text-center">{t('applicantList_table_header_chat')}</th>
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
                      <div className="text-xs text-slate-600">{t('applicantList_age', { count: a.age })}</div>
                    </div>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {a.fields.slice(0, 3).map((f) => <Chip key={f}>{f}</Chip>)}
                    {a.fields.length > 3 && <span className="text-xs text-slate-500">{t('plus_prefix')}{t('applicantList_more', { count: a.fields.length - 3 })}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">{t('applicantList_experience', { count: a.yearsExp })}</td>
                <td className="px-4 py-3">{a.location ?? t('no_date_placeholder')}</td>
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
                  {t('applicantList_empty')}
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
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Header variant="guest" />
        <main className="grid h-[calc(100vh-8rem)] place-items-center">
          <p>{t('profile_loading')}</p>
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
