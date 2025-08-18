import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Job Poster – Job List Page (React + Tailwind)
 * ---------------------------------------------------------------------------
 * - Trang "Danh sách công việc của bạn" dành cho Người đăng việc.
 * - Header theo yêu cầu: Menu = [Trang chủ, Matches], bên phải có:
 *    • Avatar + chữ "hi user"
 *    • Icon chat (badge hiển thị số tin nhắn mới)
 *    • Icon thông báo (badge hiển thị số thông báo mới)
 *   -> Loại bỏ hoàn toàn nút Đăng ký / Đăng nhập.
 * - Footer rút gọn: Hướng dẫn sử dụng • Điều khoản sử dụng • Liên hệ • © DroneWork
 * - Chức năng nội bộ (in-memory): Tìm kiếm, Lọc, Sắp xếp, Thêm / Sửa / Xóa.
 * - Responsive: Table trên desktop, Cards trên mobile.
 * - Inline comments giải thích rõ các phần quan trọng.
 */

// ----------------------------- Kiểu dữ liệu -------------------------------
interface Applicant {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
}

interface JobItem {
  id: string;
  title: string;
  description: string; // Thêm trường mô tả
  postedAt: string; // ISO yyyy-mm-dd để dễ bind vào <input type="date" />
  expiredAt: string; // Thêm ngày hết hạn
  status: "open" | "closed" | "draft"; // Thêm trạng thái "draft"
  applicants: Applicant[]; // Chuyển từ number sang mảng Applicant
}

// ----------------------------- Tiện ích nhỏ --------------------------------
const fmtDate = (iso: string) => {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng trong JS bắt đầu từ 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
// UID tạm để demo (thực tế nên do backend sinh ra)
const uid = () => Math.random().toString(36).slice(2, 9);

const MOCK_JOBS_DATA: JobItem[] = [
  { id: uid(), title: "joblist_mock_job1_title", description: "joblist_mock_job1_desc_detail", postedAt: "2025-06-12", expiredAt: "2025-07-12", status: "open", applicants: [
    { id: "cand-001", name: "joblist_mock_applicant1_name", status: "pending" },
    { id: "cand-002", name: "joblist_mock_applicant2_name", status: "pending" },
    { id: "cand-003", name: "joblist_mock_applicant3_name", status: "approved" },
    { id: "cand-004", name: "joblist_mock_applicant4_name", status: "rejected" },
  ]},
  { id: uid(), title: "joblist_mock_job2_title", description: "joblist_mock_job2_desc_detail", postedAt: "2025-08-05", expiredAt: "2025-09-05", status: "closed", applicants: [
    { id: uid(), name: "joblist_mock_applicant5_name", status: "approved" },
  ]},
  { id: uid(), title: "joblist_mock_job3_title", description: "joblist_mock_job3_desc_detail", postedAt: "2025-07-28", expiredAt: "2025-08-28", status: "open", applicants: [] },
  // Công việc nháp
  { id: uid(), title: "joblist_mock_job4_title", description: "joblist_mock_job4_desc_detail", postedAt: "2025-09-10", expiredAt: "2025-10-10", status: "draft", applicants: [] },
  { id: uid(), title: "joblist_mock_job5_title", description: "joblist_mock_job5_desc_detail", postedAt: "2025-09-15", expiredAt: "2025-10-15", status: "draft", applicants: [] },
];

export default function JobListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Seed dữ liệu demo; khi tích hợp thật sẽ lấy từ API
  const [jobs, setJobs] = useState<JobItem[]>(() => 
    MOCK_JOBS_DATA.map(job => ({
      ...job,
      title: t(job.title),
      description: t(job.description),
      applicants: job.applicants.map(applicant => ({...applicant, name: t(applicant.name)}))
    }))
  );

  useEffect(() => {
    setJobs(
      MOCK_JOBS_DATA.map(job => ({
        ...job,
        title: t(job.title),
        description: t(job.description),
        applicants: job.applicants.map(applicant => ({...applicant, name: t(applicant.name)}))
      }))
    );
  }, [t]);


  // Thêm state để quản lý view hiện tại: 'list' (danh sách chính) hoặc 'archive' (kho lưu trữ)
  const [view, setView] = useState<"list" | "archive">("list");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'archive') {
      setView('archive');
    } else {
      setView('list');
    }
  }, [location.search]);

  // Trạng thái UI cho thanh công cụ
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");

  // Trạng thái cho dialog (thêm/sửa) và xác nhận xóa
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<null | string>(null); // lưu id cần xóa
  const [editing, setEditing] = useState<JobItem | null>(null); // bản ghi đang thao tác
  const [detailDialog, setDetailDialog] = useState<JobItem | null>(null);

  // Badge demo ở header (khi tích hợp thật sẽ đọc từ API)
  const [unreadMessages] = useState<number>(2);
  const [unreadNoti] = useState<number>(3);

  /**
   * Dùng useMemo để tối ưu: chỉ tính lại danh sách lọc/sắp xếp
   * khi jobs|query|status|sortBy thay đổi.
   * - Tìm kiếm theo tiêu đề (case-insensitive)
   * - Lọc theo trạng thái (open/closed/all)
   * - Sắp xếp theo ngày hoặc số ứng viên
   */
  const filtered = useMemo(() => {
    // Lọc ra danh sách công việc cho view hiện tại
    const sourceJobs = jobs.filter(job => 
      view === 'list' ? job.status !== 'draft' : job.status === 'draft'
    );

    let list = [...sourceJobs];

    // 1) Tìm theo tiêu đề
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((j) => j.title.toLowerCase().includes(q));
    }

    // 2) Lọc theo trạng thái
    if (status !== "all") {
      list = list.filter((j) => j.status === status);
    }

    // 3) Sắp xếp: open lên đầu (theo ngày hết hạn gần nhất), closed xuống cuối
    list.sort((a, b) => {
      if (a.status === "open" && b.status === "closed") return -1;
      if (a.status === "closed" && b.status === "open") return 1;
      if (a.status === "open" && b.status === "open") {
        return +new Date(a.expiredAt) - +new Date(b.expiredAt);
      }
      return +new Date(b.postedAt) - +new Date(a.postedAt); // Giữ nguyên cho closed
    });

    return list;
  }, [jobs, query, status, view]);

  // -------------------------- Handlers CRUD -------------------------------

  // Mở dialog ở trạng thái "thêm mới"
  function onAdd() {
    navigate('/poster/jobs/create');
  }

  // Mở dialog ở trạng thái "sửa"
  function onEdit(job: JobItem) {
    setEditing({ ...job }); // copy để tránh mutate trực tiếp state
    setDialogOpen(true);
  }

  // Mở dialog xác nhận xóa
  function onDelete(id: string) {
    setConfirmOpen(id);
  }

  // Xác nhận xóa item theo id đã lưu ở confirmOpen
  function confirmDelete() {
    if (confirmOpen) setJobs((prev) => prev.filter((j) => j.id !== confirmOpen));
    setConfirmOpen(null);
  }

  function viewDetails(job: JobItem) {
    setDetailDialog(job);
  }

  // Lưu dữ liệu từ dialog (thêm hoặc cập nhật)
  function saveJob(data: JobItem) {
    // Bảo vệ: yêu cầu tiêu đề
    if (!data.title.trim()) return;

    if (data.id) {
      // Cập nhật: thay thế theo id
      setJobs((prev) => prev.map((j) => (j.id === data.id ? { ...data } : j)));
    } else {
      // Thêm mới: tạo id và unshift
      setJobs((prev) => [{ ...data, id: uid() }, ...prev]);
    }

    // Đóng dialog và reset editing
    setDialogOpen(false);
    setEditing(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header 
        variant="poster" 
        activeRoute={view}
        unreadChat={unreadMessages}
        unreadNoti={unreadNoti}
        onJobList={() => setView('list')}
        onArchive={() => setView('archive')}
      />

      {/* -------------------- Tiêu đề trang + nút thêm -------------------- */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {view === 'list' ? t('jobList_pageTitle') : t('jobList_archiveTitle')}
          </h1>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-120"
          >
            <Plus size={18} />
            {t('jobList_addJobButton')}
          </button>
        </div>

        {/* ---------------------- Thanh tìm kiếm & lọc ---------------------- */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Ô tìm kiếm theo tiêu đề */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('jobList_searchPlaceholder')}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" title={t('search_icon_alt')}>🔍</span>
          </div>

          {/* Lọc theo trạng thái */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
          >
            <option value="all">{t('jobList_statusFilter')}{t('jobList_status_all')}</option>
            <option value="open">{t('jobList_status_open')}</option>
            <option value="closed">{t('jobList_status_closed')}</option>
          </select>
        </div>

        {/* --------------------------- Bảng (desktop) ----------------------- */}
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('jobList_table_header_title')}</th>
                <th className="px-4 py-3 font-semibold">{t('jobList_table_header_posted')}</th>
                <th className="px-4 py-3 font-semibold">{t('jobList_table_header_expires')}</th>
                {view === 'list' && <th className="px-4 py-3 font-semibold">{t('jobList_table_header_status')}</th>}
                {view === 'list' && <th className="px-4 py-3 font-semibold">{t('jobList_table_header_applicants')}</th>}
                <th className="px-4 py-3 font-semibold">{t('jobList_table_header_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => viewDetails(job)}>
                  <td className="px-4 py-3">{job.title}</td>
                  <td className="px-4 py-3">{fmtDate(job.postedAt)}</td>
                  <td className="px-4 py-3">{fmtDate(job.expiredAt)}</td>
                  {view === 'list' && (
                    <>
                      <td className="px-4 py-3">
                        {job.status === "open" ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{t('jobList_status_open')}</span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">{t('jobList_status_closed')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/poster/jobs/${job.id}/applicants`)}
                          className="text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                          disabled={job.applicants.length === 0}
                        >
                          {job.applicants.length}
                        </button>
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(job)}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        {t('jobList_action_edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(job.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                      >
                        {t('jobList_action_delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Khi không có kết quả theo filter */}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    {t('jobList_emptyFiltered')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ----------------------------- Cards (mobile) ---------------------- */}
        <div className="grid gap-3 md:hidden">
          {filtered.map((job) => (
            <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onClick={() => viewDetails(job)}>
              <div className="mb-1 text-base font-semibold">{job.title}</div>
              <div className="mb-3 text-xs text-slate-500">
                <span>{t('jobList_card_posted')} {fmtDate(job.postedAt)}</span>
                <span className="mx-2">|</span>
                <span>{t('jobList_card_expires')} {fmtDate(job.expiredAt)}</span>
              </div>

              {view === 'list' && (
                <div className="mb-3 flex items-center justify-between">
                  {job.status === "open" ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{t('jobList_status_open')}</span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">{t('jobList_status_closed')}</span>
                  )}
                  <span className="text-sm">
                    {t('jobList_card_applicants')}{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/poster/jobs/${job.id}/applicants`);
                      }}
                      className="font-bold text-blue-600 hover:underline disabled:text-slate-500 disabled:no-underline"
                      disabled={job.applicants.length === 0}
                    >
                      {job.applicants.length}
                    </button>
                  </span>
                </div>
              )}

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onEdit(job)}
                  className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
                >
                  {t('jobList_action_edit')}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(job.id)}
                  className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                >
                  {t('jobList_action_delete')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* -------------------------- Empty state toàn cục ------------------- */}
        {jobs.length === 0 && (
          <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mb-3 text-5xl">📄➕</div>
            <h3 className="mb-1 text-lg font-semibold">{t('jobList_emptyGlobal_title')}</h3>
            <p className="mb-4 text-sm text-slate-500">{t('jobList_emptyGlobal_subtitle')}</p>
            <button
              type="button"
              onClick={onAdd}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              {t('jobList_emptyGlobal_button')}
            </button>
          </div>
        )}
      </main>

      {/* ------------------------------ Footer ------------------------------ */}
      {/* Rút gọn: Hướng dẫn sử dụng • Điều khoản sử dụng • Liên hệ • © DroneWork */}
      <Footer />

      {/* ------------------------------ Dialogs ----------------------------- */}
      {/* Dialog thêm/sửa: tách component để cô lập state & tránh re-render */}
      {dialogOpen && editing && (
        <JobDialog
          initial={editing}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          onSave={saveJob}
        />
      )}

      {/* Dialog xác nhận xóa: tách riêng giúp dễ tái sử dụng */}
      {confirmOpen && (
        <ConfirmDialog
          title={t('jobList_confirmDialog_title')}
          desc={t('jobList_confirmDialog_desc')}
          onCancel={() => setConfirmOpen(null)}
          onConfirm={confirmDelete}
        />
      )}

      {detailDialog && (
        <JobDetailDialog
          job={detailDialog}
          onClose={() => setDetailDialog(null)}
        />
      )}
    </div>
  );
}

/** ----------------------------------------------------------------------- **
 * Dialog Thêm/Sửa: sử dụng state cục bộ để tránh chỉnh props trực tiếp
 * - Kỹ thuật "controlled inputs": giá trị lấy từ state form, onChange cập nhật state.
 * - onSave: callback từ cha để commit dữ liệu.
 ** ----------------------------------------------------------------------- **/
function JobDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: JobItem;
  onClose: () => void;
  onSave: (j: JobItem) => void;
}) {
  const [form, setForm] = useState<JobItem>(initial);
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">{form.id ? t('jobDialog_editTitle') : t('jobDialog_addTitle')}</h3>

        {/* Nhóm trường nhập liệu */}
        <div className="space-y-3">
          {/* Tiêu đề */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('jobDialog_field_title')}</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
              placeholder={t('jobDialog_field_title_placeholder')}
            />
          </label>

          {/* Mô tả công việc */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('jobDialog_field_desc')}</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
              rows={5}
              placeholder={t('jobDialog_field_desc_placeholder')}
            />
          </label>

          {/* Hàng 3 cột: Ngày đăng, Ngày hết hạn, Trạng thái */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('jobDialog_field_posted')}</span>
              <input
                type="date"
                value={form.postedAt}
                onChange={(e) => setForm((f) => ({ ...f, postedAt: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-4 ring-transparent focus:border-blue-600 focus:ring-blue-600/20"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('jobDialog_field_expires')}</span>
              <input
                type="date"
                value={form.expiredAt}
                onChange={(e) => setForm((f) => ({ ...f, expiredAt: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-4 ring-transparent focus:border-blue-600 focus:ring-blue-600/20"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('jobDialog_field_status')}</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-4 ring-transparent focus:border-blue-600 focus:ring-blue-600/20"
              >
                <option value="open">{t('jobDialog_status_open')}</option>
                <option value="closed">{t('jobDialog_status_closed')}</option>
                <option value="draft">{t('jobDialog_status_draft')}</option>
              </select>
            </label>
          </div>

          {/* Số lượng ứng viên (demo) - chỉ hiển thị khi sửa */}
          {form.id && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('jobDialog_field_applicants')}</span>
              <input
                type="number"
                min={0}
                value={form.applicants.length}
                readOnly
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none ring-4 ring-transparent focus:border-blue-600 focus:ring-blue-600/20"
              />
            </label>
          )}
        </div>

        {/* Nút hành động */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {t('jobDialog_cancel')}
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            {t('jobDialog_save')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ----------------------------------------------------------------------- **
 * Dialog Chi tiết Công việc (Read-only)
 ** ----------------------------------------------------------------------- **/
function JobDetailDialog({ job, onClose }: { job: JobItem; onClose: () => void; }) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 pt-10"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative mx-auto w-full max-w-4xl rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
            <span className="sr-only">Đóng</span>
          </button>
        </header>

        <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <div>
              <h4 className="mb-2 text-base font-semibold text-slate-800">{t('jobDetailDialog_desc')}</h4>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{job.description}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-base font-semibold text-slate-800">{t('jobDetailDialog_info')}</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-slate-500">{t('jobDetailDialog_status')}</p>
                <p className="mt-1 font-semibold text-slate-800">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      job.status === 'open' ? 'bg-emerald-100 text-emerald-700' :
                      job.status === 'closed' ? 'bg-slate-200 text-slate-700' :
                      'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {job.status === 'open' ? t('jobDialog_status_open') : job.status === 'closed' ? t('jobDialog_status_closed') : t('jobDetailDialog_status_draft')}
                  </span>
                </p>
              </div>
              <hr className="border-slate-200" />
              <div>
                <p className="font-medium text-slate-500">{t('jobDetailDialog_posted')}</p>
                <p className="mt-1 text-slate-800">{fmtDate(job.postedAt)}</p>
              </div>
              <hr className="border-slate-200" />
              <div>
                <p className="font-medium text-slate-500">{t('jobDetailDialog_expires')}</p>
                <p className="mt-1 text-slate-800">{fmtDate(job.expiredAt)}</p>
              </div>
              <hr className="border-slate-200" />
              <div>
                <p className="font-medium text-slate-500">{t('jobDetailDialog_applicants')}</p>
                <p className="mt-1 text-slate-800">{job.applicants.length}</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 p-4 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('jobDetailDialog_close')}
          </button>
        </footer>
      </div>
    </div>
  );
}


/** ----------------------------------------------------------------------- **
 * Dialog Xác nhận Xóa: tách riêng giúp tái sử dụng và code gọn gàng.
 * - Nhận tiêu đề/nội dung, và callback onConfirm/onCancel từ component cha.
 ** ----------------------------------------------------------------------- **/
function ConfirmDialog({
  title,
  desc,
  onCancel,
  onConfirm,
}: {
  title: string;
  desc: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{desc}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {t('jobDialog_cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            {t('jobList_action_delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
