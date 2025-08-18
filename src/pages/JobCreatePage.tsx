import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
          <span className="text-sm text-slate-500">{t('jobCreate_tag_noTags')}</span>
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
            <button className="text-slate-500 hover:text-rose-600" onClick={() => remove(t)} title={t('jobCreate_tag_remove')}>✕</button>
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
          placeholder={t('jobCreate_tag_placeholder')}
          className="flex-1 min-w-[160px] border-none outline-none bg-transparent text-sm placeholder:text-slate-400"
        />
        <button onClick={() => add()} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">{t('jobCreate_tag_add')}</button>
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
  const { t } = useTranslation();

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
        placeholder={t('jobCreate_price_placeholder')}
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
        <option value="project">{t('jobCreate_price_perProject')}</option>
        <option value="hour">{t('jobCreate_price_perHour')}</option>
      </select>
    </div>
  );
}

/* =============================================================================
   JobPosterJobDetail – 3 mode: create | update | read
============================================================================= */
function JobPosterJobDetail({ mode, initial }: { mode: Mode; initial?: Partial<JobData> }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    ? { text: t('jobCreate_mode_create'), cls: "bg-blue-100 text-blue-700" }
    : isUpdate
    ? { text: t('jobCreate_mode_update'), cls: "bg-violet-100 text-violet-700" }
    : { text: t('jobCreate_mode_read'), cls: "bg-slate-200 text-slate-700" };

  // Validate tất cả trường (đơn giản, có thể thay bằng lib form)
  const validate = () => {
    const e: typeof errors = {};
    if (!title || title.length < 5) e.title = t('jobCreate_validation_title_min');
    if (title && title.length > 100) e.title = t('jobCreate_validation_title_max');
    if (!description || countWords(description) < 50) e.description = t('jobCreate_validation_desc_min');
    if (!category) e.category = t('jobCreate_validation_category');
    if (!dueDate || new Date(dueDate) < new Date(todayISO())) e.dueDate = t('jobCreate_validation_dueDate');
    if (!price || Number(price.amount) <= 0) e.price = t('jobCreate_validation_price');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Demo actions
  const saveDraft = () => { if (validate()) alert(t('jobCreate_alert_draftSaved')); };
  const publish = () => { if (validate()) alert(isCreate ? t('jobCreate_alert_published') : t('jobCreate_alert_updatedAndPublished')); };
  const saveChanges = () => { if (validate()) alert(t('jobCreate_alert_changesSaved')); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back button + Breadcrumb */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/poster/jobs")}
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-white text-slate-800 shadow-md ring-1 ring-slate-900/5 transition hover:shadow-lg"
          title={t('jobList_pageTitle')}
        >
          <ArrowLeft size={24} />
        </button>
        <nav className="text-sm text-slate-500">
          <span className="cursor-pointer hover:underline">{t('jobCreate_breadcrumb_myJobs')}</span>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{title || t('jobCreate_breadcrumb_new')}</span>
        </nav>
      </div>

      {/* Title bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isCreate ? t('jobCreate_title_new') : title || t('jobCreate_title_detail')}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={`rounded-full px-2.5 py-1 ${modeChip.cls}`}>{modeChip.text}</span>
          </div>
        </div>
        {/* Tuỳ ý thêm nút phụ ở đây (VD: Xem trước SEO) cho Create/Update */}
        {!readOnly && (
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">
            {t('jobCreate_previewButton')}
          </button>
        )}
      </div>

      {/* Content grid: trái 70% / phải 30% */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <Field label={t('jobCreate_field_title')} required hint={t('jobCreate_field_title_hint')} error={errors.title}>
            <input
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('jobCreate_field_title_placeholder')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
            />
          </Field>

          {/* Description */}
          <Field
            label={t('jobCreate_field_desc')}
            required
            hint={t('jobCreate_field_desc_hint', { count: countWords(description) })}
            error={errors.description}
          >
            <textarea
              rows={10}
              value={description}
              disabled={readOnly}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('jobCreate_field_desc_placeholder')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
            />
          </Field>

          {/* Tags (SEO) */}
          <Field label={t('jobCreate_field_tags')} hint={t('jobCreate_field_tags_hint')}>
            <TagsInput value={tags} onChange={setTags} disabled={readOnly} />
          </Field>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Category */}
          <Field label={t('jobCreate_field_category')} required error={errors.category}>
            <select
              value={category}
              disabled={readOnly}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
            >
              <option value="">{t('jobCreate_category_select')}</option>
              <option value="survey">{t('jobCreate_category_survey')}</option>
              <option value="inspection">{t('jobCreate_category_inspection')}</option>
              <option value="mapping">{t('jobCreate_category_mapping')}</option>
              <option value="photography">{t('jobCreate_category_photo')}</option>
              <option value="videography">{t('jobCreate_category_video')}</option>
            </select>
          </Field>

          {/* Due Date */}
          <Field label={t('jobCreate_field_dueDate')} required error={errors.dueDate} hint={t('jobCreate_field_dueDate_hint')}>
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
          <Field label={t('jobCreate_field_price')} required error={errors.price} hint={t('jobCreate_field_price_hint')}>
            <PriceInput value={price} onChange={setPrice} disabled={readOnly} />
          </Field>
        </div>
      </div>

      {/* Action bar (Create/Update) */}
      {!readOnly && (
        <div className="sticky bottom-0 mt-8 border-t border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
            <div className="text-sm text-slate-600">{t('jobCreate_actionBar_ready')}</div>
            <div className="flex flex-wrap items-center gap-2">
              {isCreate && (
                <>
                  <button onClick={saveDraft} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">{t('jobCreate_actionBar_saveDraft')}</button>
                  <button onClick={publish} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">{t('jobCreate_actionBar_publish')}</button>
                </>
              )}
              {isUpdate && (
                <>
                  <button onClick={saveChanges} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">{t('jobCreate_actionBar_saveChanges')}</button>
                  <button onClick={publish} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">{t('jobCreate_actionBar_publishUnpublish')}</button>
                </>
              )}
              <button onClick={() => navigate('/poster/jobs')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">{t('jobCreate_actionBar_cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Read-only: gợi ý Edit nếu có quyền */}
      {readOnly && (
        <div className="mt-8 grid place-items-center">
          <button onClick={() => alert(t('alert_switch_to_update_demo'))} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
            {t('jobCreate_editButton')}
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
  const { t } = useTranslation();
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
        <JobPosterJobDetail mode={mode} initial={mode === "create" ? undefined : sample} />
      </main>
      <Footer />
    </div>
  );
}
