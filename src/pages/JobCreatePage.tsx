import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/* =============================================================================
   Types
============================================================================= */
type Mode = "create" | "update" | "read";
type Currency = "VND" | "USD";
type PriceUnit = "project" | "hour";

interface JobPrice {
  amount: number;
  currency: Currency;
  unit: PriceUnit;
}

interface JobData {
  title: string;
  description: string;
  dueDate: string;      // ISO yyyy-mm-dd
  tags: string[];       // SEO tags
  category: string;     // id/slug danh mục
  price: JobPrice;
}

/* =============================================================================
   Helpers
============================================================================= */
const todayISO = () => new Date().toISOString().slice(0, 10);
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const countWords = (txt?: string) => (txt?.trim() ? txt.trim().split(/\s+/).length : 0);

// Loại dấu tiếng Việt + tạo slug đơn giản (dùng cho tag chuẩn hoá)
function slugify(s = ""): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* =============================================================================
   Reusable Field
============================================================================= */
function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
      {(hint || error) && <div className={`mt-1 text-xs ${error ? "text-rose-600" : "text-slate-500"}`}>{error || hint}</div>}
    </div>
  );
}

/* =============================================================================
   TagsInput (chips). Read mode => view only
============================================================================= */
function TagsInput({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  // Thêm tag (Enter hoặc click nút)
  const add = (raw?: string) => {
    const v = (raw ?? draft).trim();
    if (!v) return;
    const slug = slugify(v).replace(/-/g, " "); // chuẩn hoá hiển thị
    if (!value.includes(slug)) onChange?.([...value, slug]);
    setDraft("");
  };

  const remove = (t: string) => onChange?.(value.filter((x) => x !== t));

  if (disabled) {
    // Chỉ hiển thị chips khi read-only
    return (
      <div className="flex flex-wrap gap-2">
        {value.length ? (
          value.map((t) => (
            <span key={t} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 ring-1 ring-blue-600/20">{t}</span>
          ))
        ) : (
          <span className="text-sm text-slate-500">Không có thẻ</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-2">
      <div className="flex flex-wrap gap-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 ring-1 ring-blue-600/20">
            {t}
            <button className="text-slate-500 hover:text-rose-600" onClick={() => remove(t)} title="Xóa">✕</button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Thêm thẻ & Enter"
          className="flex-1 min-w-[160px] border-none outline-none bg-transparent text-sm placeholder:text-slate-400"
        />
        <button onClick={() => add()} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">Thêm</button>
      </div>
    </div>
  );
}

/* =============================================================================
   PriceInput (amount + currency + unit)
============================================================================= */
function PriceInput({
  value,
  onChange,
  disabled,
}: {
  value: JobPrice;
  onChange?: (next: JobPrice) => void;
  disabled?: boolean;
}) {
  const set = (patch: Partial<JobPrice>) => onChange?.({ ...value, ...patch });

  return (
    <div className="flex gap-2">
      <input
        type="number"
        min={1}
        step="1"
        value={value.amount}
        disabled={disabled}
        onChange={(e) => set({ amount: clamp(Number(e.target.value || 0), 0, 1e12) })}
        className="w-40 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
        placeholder="Giá trị"
      />
      <select
        value={value.currency}
        disabled={disabled}
        onChange={(e) => set({ currency: e.target.value as Currency })}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
      >
        <option value="VND">VND</option>
        <option value="USD">USD</option>
      </select>
      <select
        value={value.unit}
        disabled={disabled}
        onChange={(e) => set({ unit: e.target.value as PriceUnit })}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
      >
        <option value="project">/ dự án</option>
        <option value="hour">/ giờ</option>
      </select>
    </div>
  );
}

/* =============================================================================
   JobPosterJobDetail – 3 mode: create | update | read
============================================================================= */
function JobPosterJobDetail({ mode, initial }: { mode: Mode; initial?: Partial<JobData> }) {
  const navigate = useNavigate();
  const readOnly = mode === "read";
  const isCreate = mode === "create";
  const isUpdate = mode === "update";

  // Form state
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayISO());
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState<JobPrice>(initial?.price ?? { amount: 0, currency: "VND", unit: "project" });

  // Errors
  const [errors, setErrors] = useState<{ [k: string]: string | undefined }>({});

  // Chip mode theo UI
  const modeChip = isCreate
    ? { text: "Create", cls: "bg-blue-100 text-blue-700" }
    : isUpdate
    ? { text: "Update", cls: "bg-violet-100 text-violet-700" }
    : { text: "Read", cls: "bg-slate-200 text-slate-700" };

  // Validate tất cả trường (đơn giản, có thể thay bằng lib form)
  const validate = () => {
    const e: typeof errors = {};
    if (!title || title.length < 5) e.title = "Tiêu đề tối thiểu 5 ký tự.";
    if (title && title.length > 100) e.title = "Tiêu đề tối đa 100 ký tự.";
    if (!description || countWords(description) < 50) e.description = "Mô tả tối thiểu 50 từ.";
    if (!category) e.category = "Vui lòng chọn danh mục.";
    if (!dueDate || new Date(dueDate) < new Date(todayISO())) e.dueDate = "Ngày hết hạn không hợp lệ.";
    if (!price || Number(price.amount) <= 0) e.price = "Giá trị phải lớn hơn 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Demo actions
  const saveDraft = () => { if (validate()) alert("Đã lưu nháp ✅ (demo)"); };
  const publish = () => { if (validate()) alert(isCreate ? "Đăng công việc thành công ✅ (demo)" : "Cập nhật & đăng công việc ✅ (demo)"); };
  const saveChanges = () => { if (validate()) alert("Đã lưu thay đổi ✅ (demo)"); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back button + Breadcrumb */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/poster/jobs")}
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-white text-slate-800 shadow-md ring-1 ring-slate-900/5 transition hover:shadow-lg"
          title="Quay lại danh sách"
        >
          <ArrowLeft size={24} />
        </button>
        <nav className="text-sm text-slate-500">
          <span className="cursor-pointer hover:underline">Công việc của tôi</span>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{title || "Tạo mới"}</span>
        </nav>
      </div>

      {/* Title bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isCreate ? "Tạo công việc mới" : title || "Chi tiết công việc"}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={`rounded-full px-2.5 py-1 ${modeChip.cls}`}>{modeChip.text}</span>
          </div>
        </div>
        {/* Tuỳ ý thêm nút phụ ở đây (VD: Xem trước SEO) cho Create/Update */}
        {!readOnly && (
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">
            👁️ Xem trước
          </button>
        )}
      </div>

      {/* Content grid: trái 70% / phải 30% */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <Field label="Title" required hint="Khuyến nghị 50–70 ký tự." error={errors.title}>
            <input
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề ngắn gọn, dễ hiểu…"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
            />
          </Field>

          {/* Description */}
          <Field
            label="Description"
            required
            hint={`Tối thiểu 50 từ • Hiện có ${countWords(description)} từ.`}
            error={errors.description}
          >
            <textarea
              rows={10}
              value={description}
              disabled={readOnly}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả yêu cầu, phạm vi, tiêu chí bàn giao, điều kiện an toàn bay, v.v."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
            />
          </Field>

          {/* Tags (SEO) */}
          <Field label="Tag (SEO)" hint="Khuyến nghị 3–8 thẻ (không bắt buộc).">
            <TagsInput value={tags} onChange={setTags} disabled={readOnly} />
          </Field>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Category */}
          <Field label="Category" required error={errors.category}>
            <select
              value={category}
              disabled={readOnly}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
            >
              <option value="">— Chọn danh mục —</option>
              <option value="survey">Khảo sát</option>
              <option value="inspection">Kiểm định</option>
              <option value="mapping">Lập bản đồ</option>
              <option value="photography">Chụp ảnh</option>
              <option value="videography">Quay video</option>
            </select>
          </Field>

          {/* Due Date */}
          <Field label="Due Date" required error={errors.dueDate} hint="Ngày cutoff nhận ứng tuyển.">
            <input
              type="date"
              min={todayISO()}
              value={dueDate}
              disabled={readOnly}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
            />
          </Field>

          {/* Price */}
          <Field label="Price" required error={errors.price} hint="Chọn tiền tệ & đơn vị tính.">
            <PriceInput value={price} onChange={setPrice} disabled={readOnly} />
          </Field>
        </div>
      </div>

      {/* Action bar (Create/Update) */}
      {!readOnly && (
        <div className="sticky bottom-0 mt-8 border-t border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
            <div className="text-sm text-slate-600">Đã sẵn sàng lưu thay đổi</div>
            <div className="flex flex-wrap items-center gap-2">
              {isCreate && (
                <>
                  <button onClick={saveDraft} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">Lưu nháp</button>
                  <button onClick={publish} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Đăng công việc</button>
                </>
              )}
              {isUpdate && (
                <>
                  <button onClick={saveChanges} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Lưu thay đổi</button>
                  <button onClick={publish} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">Đăng / Bỏ đăng</button>
                </>
              )}
              <button onClick={() => navigate('/poster/jobs')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Read-only: gợi ý Edit nếu có quyền */}
      {readOnly && (
        <div className="mt-8 grid place-items-center">
          <button onClick={() => alert("Chuyển sang Update (demo)")} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
            Chỉnh sửa
          </button>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   App – giữ Header/Footer như trước, lấy mode từ query (?mode=...)
   (Caller thực tế sẽ truyền prop 'mode' dựa vào màn hình gọi)
============================================================================= */
export default function JobCreatePage() {
  const { user } = useAuth();
  // Lấy mode nhanh từ URL để demo; khi tích hợp router, hãy truyền bằng props/route-state
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const qMode = (search?.get("mode") as Mode) || "create";
  const mode: Mode = (["create", "update", "read"] as const).includes(qMode) ? qMode : "create";

  // Dữ liệu mẫu khi update/read
  const sample: Partial<JobData> = {
    title: "Khảo sát mái nhà bằng drone – Quận 1",
    description:
      "Cần khảo sát mái nhà bằng drone với độ phân giải cao. Phạm vi gồm chụp ảnh AEB, che phủ tối thiểu 70%, tạo orthophoto và báo cáo hư hại chi tiết. Ưu tiên phi công có kinh nghiệm an toàn bay trong khu dân cư, nắm quy trình xin phép bay và có bảo hiểm trách nhiệm. Bàn giao bao gồm ảnh gốc, orthophoto (GeoTIFF) và báo cáo PDF. Thời gian triển khai dự kiến 2 ngày, thời tiết tốt.",
    dueDate: todayISO(),
    tags: ["roof inspection", "photogrammetry", "rtk"],
    category: "inspection",
    price: { amount: 1200000, currency: "VND", unit: "project" },
  };

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
        <JobPosterJobDetail mode={mode} initial={mode === "create" ? undefined : sample} />
      </main>
      <Footer />
    </div>
  );
}
