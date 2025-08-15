// App.tsx
import React, { useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";

/* =============================================================================
   Types (Seeker-only)
============================================================================= */
type Mode = "update" | "read";
type Currency = "VND" | "USD";
type PriceUnit = "hour" | "project";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type SlotKey = "am" | "pm" | "eve";

interface LocationInfo {
  city: string;
  province?: string;
  country?: string;
  radiusKm?: number;
}

interface ProfileBasic {
  avatarUrl?: string;
  fullName: string;
  headline?: string;
  yearsExp: number;
  languages: string[];
  location: LocationInfo;
  about?: string; // mô tả ngắn
}

interface ContactInfo {
  email: string;
  emailPublic: boolean;
  phone?: string;
  phonePublic?: boolean;
  links?: { type: "website" | "linkedin" | "youtube" | "other"; url: string }[];
}

interface Skill { name: string; level?: "beginner" | "intermediate" | "advanced"; }
interface Certification { name: string; issuer?: string; expiresAt?: string; fileUrl?: string; }
interface EquipmentItem { drone: string; sensors?: string[]; hasRTK?: boolean; hasInsurance?: boolean; docUrl?: string; }
interface DomainItem { name: string; priority?: number; }
interface ExperienceItem {
  id: string; title: string; org: string; start: string; end?: string; desc?: string; highlights?: string[];
}
interface Pricing { amount?: number; currency?: Currency; unit?: PriceUnit; public?: boolean; note?: string; }
interface Availability { weeklySlots?: Partial<Record<DayKey, SlotKey[]>>; status?: "open" | "busy" | "backup"; }
interface Visibility { [fieldKey: string]: boolean; }
interface Notifications { email: boolean; push?: boolean; categories?: string[]; }

interface SeekerDoc {
  basic: ProfileBasic;
  contact: ContactInfo;
  visibility: Visibility;
  notifications: Notifications;
  skills: Skill[];
  certifications: Certification[];
  equipment: EquipmentItem[];
  domains: DomainItem[];
  experience: ExperienceItem[];
  pricing?: Pricing;
  availability?: Availability;
  status: "draft" | "published";
  updatedAt: string;
}

/* =============================================================================
   Helpers
============================================================================= */
const todayISO = () => new Date().toISOString().slice(0, 10);
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);

// chuẩn hoá text nhập thành “chip” và slug cơ bản
function slugify(s = "") {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* =============================================================================
   Reusable atoms
============================================================================= */
function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; }) {
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

function ChipsInput({ value, onChange, placeholder, disabled }: { value: string[]; onChange?: (next: string[]) => void; placeholder?: string; disabled?: boolean; }) {
  const [draft, setDraft] = useState("");
  const add = (raw?: string) => {
    const v = (raw ?? draft).trim();
    if (!v) return;
    const norm = slugify(v).replace(/-/g, " ");
    if (!value.includes(norm)) onChange?.([...value, norm]);
    setDraft("");
  };
  const remove = (t: string) => onChange?.(value.filter((x) => x !== t));

  if (disabled) {
    return (
      <div className="flex flex-wrap gap-2">
        {value.length ? value.map((t) => (
          <span key={t} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 ring-1 ring-blue-600/20">{t}</span>
        )) : <span className="text-sm text-slate-500">Không có mục</span>}
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
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder={placeholder || "Thêm & Enter"}
          className="flex-1 min-w-[160px] border-none outline-none bg-transparent text-sm placeholder:text-slate-400"
        />
        <button onClick={() => add()} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">Thêm</button>
      </div>
    </div>
  );
}

function PriceInput({ value, onChange, disabled }: { value: Pricing; onChange?: (next: Pricing) => void; disabled?: boolean; }) {
  const set = (patch: Partial<Pricing>) => onChange?.({ ...value, ...patch });
  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="number"
        min={1}
        step="1"
        value={value.amount ?? 0}
        disabled={disabled}
        onChange={(e) => set({ amount: clamp(Number(e.target.value || 0), 0, 1e12) })}
        className="w-40 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
        placeholder="Giá trị"
      />
      <select
        value={value.currency ?? "VND"}
        disabled={disabled}
        onChange={(e) => set({ currency: e.target.value as Currency })}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
      >
        <option value="VND">VND</option>
        <option value="USD">USD</option>
      </select>
      <select
        value={value.unit ?? "project"}
        disabled={disabled}
        onChange={(e) => set({ unit: e.target.value as PriceUnit })}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
      >
        <option value="project">/ dự án</option>
        <option value="hour">/ giờ</option>
      </select>
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
               checked={!!value.public} disabled={disabled}
               onChange={(e) => set({ public: e.target.checked })}/>
        Hiển thị công khai
      </label>
    </div>
  );
}

function Tabs({ tabs, activeKey, onChange }: { tabs: { key: string; label: string }[]; activeKey: string; onChange: (k: string) => void; }) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="inline-flex gap-2 rounded-xl border border-slate-200 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${activeKey === t.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =============================================================================
   Sections (Seeker)
============================================================================= */
function BasicSection({ value, onChange, readOnly, errors }: { value: ProfileBasic; onChange: (v: ProfileBasic) => void; readOnly: boolean; errors: Record<string, string | undefined>; }) {
  const set = (patch: Partial<ProfileBasic>) => onChange({ ...value, ...patch });
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Họ tên" required error={errors["basic.fullName"]}>
        <input
          value={value.fullName} disabled={readOnly}
          onChange={(e) => set({ fullName: e.target.value })}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
          placeholder="VD: Nguyễn Minh Khôi"
        />
      </Field>
      <Field label="Headline" hint="Dòng mô tả ngắn (≤ 80 ký tự)">
        <input
          value={value.headline ?? ""} disabled={readOnly}
          onChange={(e) => set({ headline: e.target.value })}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
          placeholder="VD: Phi công drone – Photogrammetry/RTK"
        />
      </Field>
      <Field label="Số năm kinh nghiệm" required error={errors["basic.yearsExp"]}>
        <input
          type="number" min={0} max={40} value={value.yearsExp} disabled={readOnly}
          onChange={(e) => set({ yearsExp: clamp(Number(e.target.value || 0), 0, 40) })}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
        />
      </Field>
      <Field label="Ngôn ngữ">
        <ChipsInput value={value.languages} onChange={(arr) => set({ languages: arr })} disabled={readOnly} placeholder="Thêm ngôn ngữ & Enter (vi, en, ...)" />
      </Field>
      <Field label="Thành phố" required error={errors["basic.location.city"]}>
        <input
          value={value.location.city} disabled={readOnly}
          onChange={(e) => set({ location: { ...value.location, city: e.target.value } })}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
          placeholder="VD: Hà Nội"
        />
      </Field>
      <Field label="Bán kính di chuyển (km)">
        <input
          type="number" min={0} max={500} value={value.location.radiusKm ?? 0} disabled={readOnly}
          onChange={(e) => set({ location: { ...value.location, radiusKm: clamp(Number(e.target.value || 0), 0, 500) } })}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
        />
      </Field>
      <Field label="Giới thiệu ngắn">
        <textarea
          rows={4} value={value.about ?? ""} disabled={readOnly}
          onChange={(e) => set({ about: e.target.value })}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 disabled:bg-slate-100"
          placeholder="Tóm tắt kinh nghiệm, thế mạnh, chứng chỉ…"
        />
      </Field>
    </div>
  );
}

function ContactSection({ value, onChange, readOnly, errors }: { value: ContactInfo; onChange: (v: ContactInfo) => void; readOnly: boolean; errors: Record<string, string | undefined>; }) {
  const set = (p: Partial<ContactInfo>) => onChange({ ...value, ...p });
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Email" required error={errors["contact.email"]}>
        <input
          value={value.email} disabled={readOnly}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-100"
        />
      </Field>
      <Field label="Công khai email?">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
                 checked={!!value.emailPublic} disabled={readOnly}
                 onChange={(e) => set({ emailPublic: e.target.checked })}/>
          Bật
        </label>
      </Field>
      <Field label="Số điện thoại">
        <input
          value={value.phone ?? ""} disabled={readOnly}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="+84 ..."
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-100"
        />
      </Field>
      <Field label="Công khai số điện thoại?">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
                 checked={!!value.phonePublic} disabled={readOnly}
                 onChange={(e) => set({ phonePublic: e.target.checked })}/>
          Bật
        </label>
      </Field>

      <div className="sm:col-span-2">
        <Field label="Liên kết (Website/LinkedIn/YouTube)">
          <ChipsInput
            value={(value.links ?? []).map((l) => l.url)} disabled={readOnly}
            onChange={(arr) =>
              set({
                links: arr.map((u) => ({
                  type: u.includes("linkedin") ? "linkedin" : u.includes("youtube") ? "youtube" : "website",
                  url: u,
                })),
              })
            }
            placeholder="Dán URL và Enter"
          />
        </Field>
      </div>
    </div>
  );
}

function SkillsCertsSection({
  skills, setSkills, certs, setCerts, readOnly,
}: {
  skills: Skill[]; setSkills: (arr: Skill[]) => void;
  certs: Certification[]; setCerts: (arr: Certification[]) => void;
  readOnly: boolean;
}) {
  // CRUD nhanh cho skill/cert — tập trung vào thao tác chỉnh sửa
  const addSkill = () => setSkills([...skills, { name: "", level: "intermediate" }]);
  const updateSkill = (i: number, patch: Partial<Skill>) => { const next = [...skills]; next[i] = { ...next[i], ...patch }; setSkills(next); };
  const removeSkill = (i: number) => setSkills(skills.filter((_, idx) => idx !== i));

  const addCert = () => setCerts([...certs, { name: "", issuer: "" }]);
  const updateCert = (i: number, patch: Partial<Certification>) => { const next = [...certs]; next[i] = { ...next[i], ...patch }; setCerts(next); };
  const removeCert = (i: number) => setCerts(certs.filter((_, idx) => idx !== i));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Kỹ năng</h4>
          {!readOnly && <button onClick={addSkill} className="text-sm text-blue-700 hover:underline">+ Thêm kỹ năng</button>}
        </div>
        {skills.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Chưa có kỹ năng nào.</div>}
        {skills.map((s, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            <input
              value={s.name} disabled={readOnly}
              onChange={(e) => updateSkill(i, { name: e.target.value })}
              placeholder="Tên kỹ năng (VD: RTK)"
              className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
            />
            <select
              value={s.level ?? "intermediate"} disabled={readOnly}
              onChange={(e) => updateSkill(i, { level: e.target.value as any })}
              className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            {!readOnly && <button onClick={() => removeSkill(i)} className="text-left text-xs text-rose-600 hover:underline">Xoá</button>}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Chứng chỉ</h4>
          {!readOnly && <button onClick={addCert} className="text-sm text-blue-700 hover:underline">+ Thêm chứng chỉ</button>}
        </div>
        {certs.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Chưa có chứng chỉ nào.</div>}
        {certs.map((c, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              value={c.name} disabled={readOnly}
              onChange={(e) => updateCert(i, { name: e.target.value })}
              placeholder="Tên chứng chỉ (VD: A2 / Part 107)"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
            />
            <input
              value={c.issuer ?? ""} disabled={readOnly}
              onChange={(e) => updateCert(i, { issuer: e.target.value })}
              placeholder="Tổ chức cấp"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
            />
            <input
              type="date" value={c.expiresAt ?? ""} disabled={readOnly}
              onChange={(e) => updateCert(i, { expiresAt: e.target.value })}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
            />
            {!readOnly && <button onClick={() => removeCert(i)} className="text-left text-xs text-rose-600 hover:underline">Xoá</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EquipDomainsSection({
  equipment, setEquipment, domains, setDomains, readOnly,
}: { equipment: EquipmentItem[]; setEquipment: (arr: EquipmentItem[]) => void; domains: DomainItem[]; setDomains: (arr: DomainItem[]) => void; readOnly: boolean; }) {
  const addEq = () => setEquipment([...equipment, { drone: "" }]);
  const updEq = (i: number, p: Partial<EquipmentItem>) => { const next = [...equipment]; next[i] = { ...next[i], ...p }; setEquipment(next); };
  const rmEq = (i: number) => setEquipment(equipment.filter((_, idx) => idx !== i));

  const addDomain = () => setDomains([...domains, { name: "" }]);
  const updDomain = (i: number, p: Partial<DomainItem>) => { const next = [...domains]; next[i] = { ...next[i], ...p }; setDomains(next); };
  const rmDomain = (i: number) => setDomains(domains.filter((_, idx) => idx !== i));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Thiết bị</h4>
          {!readOnly && <button onClick={addEq} className="text-sm text-blue-700 hover:underline">+ Thêm thiết bị</button>}
        </div>
        {equipment.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Chưa khai báo thiết bị.</div>}
        {equipment.map((e, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                value={e.drone} disabled={readOnly}
                onChange={(ev) => updEq(i, { drone: ev.target.value })}
                placeholder="Drone model (VD: Mavic 3E)"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100 sm:col-span-2"
              />
              <input
                value={(e.sensors ?? []).join(", ")} disabled={readOnly}
                onChange={(ev) => updEq(i, { sensors: ev.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Sensors (VD: RGB, Tele, LiDAR)"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
                       checked={!!e.hasRTK} disabled={readOnly}
                       onChange={(ev) => updEq(i, { hasRTK: ev.target.checked })}/>
                RTK/GCP
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
                       checked={!!e.hasInsurance} disabled={readOnly}
                       onChange={(ev) => updEq(i, { hasInsurance: ev.target.checked })}/>
                Bảo hiểm
              </label>
            </div>
            {!readOnly && <button onClick={() => rmEq(i)} className="text-left text-xs text-rose-600 hover:underline">Xoá thiết bị</button>}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Lĩnh vực hoạt động</h4>
          {!readOnly && <button onClick={addDomain} className="text-sm text-blue-700 hover:underline">+ Thêm lĩnh vực</button>}
        </div>
        {domains.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Chưa chọn lĩnh vực.</div>}
        <div className="space-y-2">
          {domains.map((d, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              <input
                value={d.name} disabled={readOnly}
                onChange={(ev) => updDomain(i, { name: ev.target.value })}
                placeholder="VD: Khảo sát / Kiểm định / Mapping / Ảnh / Video"
                className="sm:col-span-4 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
              />
              <input
                type="number" min={0} max={100} value={d.priority ?? 0} disabled={readOnly}
                onChange={(ev) => updDomain(i, { priority: clamp(Number(ev.target.value || 0), 0, 100) })}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                placeholder="% ưu tiên"
              />
              {!readOnly && <button onClick={() => rmDomain(i)} className="text-left text-xs text-rose-600 hover:underline">Xoá</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExperiencePricingAvailabilitySection({
  experience, setExperience, pricing, setPricing, availability, setAvailability, readOnly,
}: {
  experience: ExperienceItem[]; setExperience: (arr: ExperienceItem[]) => void;
  pricing?: Pricing; setPricing: (p: Pricing) => void;
  availability?: Availability; setAvailability: (a: Availability) => void;
  readOnly: boolean;
}) {
  // CRUD kinh nghiệm — đủ để người dùng thao tác nhanh
  const addExp = () => setExperience([...experience, { id: uid(), title: "", org: "", start: todayISO() }]);
  const updExp = (id: string, p: Partial<ExperienceItem>) => setExperience(experience.map((e) => (e.id === id ? { ...e, ...p } : e)));
  const rmExp = (id: string) => setExperience(experience.filter((e) => e.id !== id));

  const a = availability ?? { weeklySlots: {}, status: "open" };

  // Toggle chọn slot khả dụng theo tuần
  const toggleSlot = (d: DayKey, s: SlotKey) => {
    if (readOnly) return;
    const ws = { ...(a.weeklySlots || {}) };
    const arr = new Set(ws[d] || []);
    arr.has(s) ? arr.delete(s) : arr.add(s);
    ws[d] = Array.from(arr);
    setAvailability({ ...a, weeklySlots: ws });
  };

  return (
    <div className="space-y-6">
      {/* Experience timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Kinh nghiệm làm việc</h4>
          {!readOnly && <button onClick={addExp} className="text-sm text-blue-700 hover:underline">+ Thêm mục</button>}
        </div>
        {experience.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Chưa có kinh nghiệm nào.</div>}
        <div className="space-y-3">
          {experience.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={e.title} disabled={readOnly}
                  onChange={(ev) => updExp(e.id, { title: ev.target.value })}
                  placeholder="Vai trò (VD: Drone Survey Pilot)"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                />
                <input
                  value={e.org} disabled={readOnly}
                  onChange={(ev) => updExp(e.id, { org: ev.target.value })}
                  placeholder="Tổ chức / Dự án"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                />
                <input
                  type="date" value={e.start} disabled={readOnly}
                  onChange={(ev) => updExp(e.id, { start: ev.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                />
                <input
                  type="date" value={e.end ?? ""} disabled={readOnly}
                  onChange={(ev) => updExp(e.id, { end: ev.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                />
              </div>
              <textarea
                rows={3} value={e.desc ?? ""} disabled={readOnly}
                onChange={(ev) => updExp(e.id, { desc: ev.target.value })}
                placeholder="Mô tả ngắn (≥ 50 từ để tăng khả năng match)"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
              />
              {!readOnly && <button onClick={() => rmExp(e.id)} className="mt-2 text-left text-xs text-rose-600 hover:underline">Xoá mục này</button>}
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Giá & hình thức tính phí</h4>
        <PriceInput value={pricing ?? { amount: 0, currency: "VND", unit: "project", public: false }} onChange={setPricing} disabled={readOnly} />
        {!readOnly && (
          <textarea
            rows={2}
            value={pricing?.note ?? ""}
            onChange={(e) => setPricing({ ...(pricing ?? {}), note: e.target.value })}
            placeholder="Ghi chú: bao gồm/không gồm, điều kiện…"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
          />
        )}
      </div>

      {/* Availability weekly */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Khả dụng (theo tuần)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="px-2 py-2 text-left">Ngày</th>
                {["am", "pm", "eve"].map((s) => <th key={s} className="px-2 py-2 capitalize">{s}</th>)}
                <th className="px-2 py-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as DayKey[]).map((d) => (
                <tr key={d} className="border-t border-slate-200">
                  <td className="px-2 py-2 font-medium capitalize">{d}</td>
                  {(["am", "pm", "eve"] as SlotKey[]).map((s) => {
                    const checked = (a.weeklySlots?.[d] || []).includes(s);
                    return (
                      <td key={s} className="px-2 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
                          checked={checked} disabled={readOnly}
                          onChange={() => toggleSlot(d, s)}
                        />
                      </td>
                    );
                  })}
                  {d === "mon" && (
                    <td className="px-2 py-2" rowSpan={7}>
                      <select
                        value={a.status ?? "open"} disabled={readOnly}
                        onChange={(e) => setAvailability({ ...a, status: e.target.value as any })}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                      >
                        <option value="open">Nhận job</option>
                        <option value="busy">Bận</option>
                        <option value="backup">Dự phòng</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function VisibilityNotificationsSection({
  visibility, setVisibility, notifications, setNotifications, readOnly,
}: {
  visibility: Visibility; setVisibility: (v: Visibility) => void;
  notifications: Notifications; setNotifications: (n: Notifications) => void;
  readOnly: boolean;
}) {
  const toggleVis = (key: string) => { if (readOnly) return; setVisibility({ ...visibility, [key]: !visibility[key] }); };
  const toggleCat = (cat: string) => {
    if (readOnly) return;
    const set = new Set(notifications.categories ?? []);
    set.has(cat) ? set.delete(cat) : set.add(cat);
    setNotifications({ ...notifications, categories: Array.from(set) });
  };
  const catList = ["invites", "messages", "jobUpdates"];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Hiển thị công khai</h4>
        {["email", "phone", "pricing", "equipment"].map((k) => (
          <label key={k} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <span>{k}</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
              checked={!!visibility[k]} disabled={readOnly}
              onChange={() => toggleVis(k)}
            />
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Thông báo</h4>
        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span>Email</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
            checked={!!notifications.email} disabled={readOnly}
            onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span>Push</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
            checked={!!notifications.push} disabled={readOnly}
            onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
          />
        </label>

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <div className="mb-2 font-medium">Categories</div>
          <div className="flex flex-wrap gap-2">
            {catList.map((c) => (
              <button
                key={c} onClick={() => toggleCat(c)} disabled={readOnly}
                className={`rounded-full px-3 py-1 text-xs ring-1 ${
                  (notifications.categories ?? []).includes(c)
                    ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                    : "bg-slate-50 text-slate-700 ring-slate-300"
                } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   Seeker Profile Editor – chỉ cho người nhận việc
============================================================================= */
function SeekerProfileEditor({ mode = "update" as Mode, navigate }: { mode?: Mode, navigate: NavigateFunction }) {
  const readOnly = mode === "read";

  // State hồ sơ (mock dữ liệu khởi tạo để bạn thấy form đầy đủ)
  const [doc, setDoc] = useState<SeekerDoc>({
    basic: {
      fullName: "Nguyễn Minh Khôi",
      headline: "Phi công drone – Photogrammetry/RTK",
      yearsExp: 4,
      languages: ["vi", "en"],
      location: { city: "Hà Nội", province: "HN", radiusKm: 50 },
      about: "Có kinh nghiệm bay khảo sát, xử lý ảnh Metashape/Pix4D…",
    },
    contact: { email: "you@example.com", emailPublic: false, links: [] },
    visibility: { email: false, phone: false, pricing: false, equipment: true },
    notifications: { email: true, push: false, categories: ["invites", "messages"] },
    skills: [{ name: "RTK", level: "advanced" }, { name: "Photogrammetry", level: "advanced" }],
    certifications: [{ name: "A2", issuer: "CAA", expiresAt: "" }],
    equipment: [{ drone: "Mavic 3E", sensors: ["RGB"], hasRTK: true, hasInsurance: true }],
    domains: [{ name: "Khảo sát", priority: 60 }, { name: "Kiểm định", priority: 40 }],
    experience: [{ id: uid(), title: "Drone Survey Pilot", org: "Công ty X", start: "2023-01-01", desc: "Khảo sát công trình, dựng orthophoto..." }],
    pricing: { amount: 1200000, currency: "VND", unit: "project", public: false, note: "" },
    availability: { weeklySlots: { mon: ["am", "pm"], wed: ["pm"] }, status: "open" },
    status: "draft",
    updatedAt: new Date().toISOString(),
  });

  // Tabs cố định theo scope seeker (không Portfolio)
  const tabs = [
    { key: "basic", label: "Thông tin cơ bản" },
    { key: "contact", label: "Liên hệ" },
    { key: "skills", label: "Kỹ năng & Chứng chỉ" },
    { key: "equip", label: "Thiết bị & Lĩnh vực" },
    { key: "exp", label: "Kinh nghiệm · Giá · Khả dụng" },
    { key: "vis", label: "Hiển thị & Thông báo" },
  ];
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Validation tối thiểu cho trải nghiệm chỉnh sửa
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const validate = () => {
    const e: Record<string, string> = {};
    if (!doc.basic.fullName || doc.basic.fullName.trim().length < 2) e["basic.fullName"] = "Tên tối thiểu 2 ký tự.";
    if (doc.basic.yearsExp < 0 || doc.basic.yearsExp > 40) e["basic.yearsExp"] = "Kinh nghiệm 0–40 năm.";
    if (!doc.basic.location.city) e["basic.location.city"] = "Cần thành phố.";
    if (!doc.contact.email || !/.+@.+\..+/.test(doc.contact.email)) e["contact.email"] = "Email không hợp lệ.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Hành động: lưu nháp / lưu thay đổi (demo)
  const saveDraft = () => { if (validate()) alert("Đã lưu nháp ✅ (demo)"); };
  const saveChanges = () => { if (validate()) alert("Lưu thay đổi hồ sơ ✅ (demo)"); };

  // Render section theo tab
  const renderSection = () => {
    switch (activeTab) {
      case "basic":
        return <BasicSection value={doc.basic} readOnly={readOnly} errors={errors} onChange={(v) => setDoc((d) => ({ ...d, basic: v }))} />;
      case "contact":
        return <ContactSection value={doc.contact} readOnly={readOnly} errors={errors} onChange={(v) => setDoc((d) => ({ ...d, contact: v }))} />;
      case "skills":
        return (
          <SkillsCertsSection
            skills={doc.skills} setSkills={(arr) => setDoc((d) => ({ ...d, skills: arr }))}
            certs={doc.certifications} setCerts={(arr) => setDoc((d) => ({ ...d, certifications: arr }))}
            readOnly={readOnly}
          />
        );
      case "equip":
        return (
          <EquipDomainsSection
            equipment={doc.equipment} setEquipment={(arr) => setDoc((d) => ({ ...d, equipment: arr }))}
            domains={doc.domains} setDomains={(arr) => setDoc((d) => ({ ...d, domains: arr }))}
            readOnly={readOnly}
          />
        );
      case "exp":
        return (
          <ExperiencePricingAvailabilitySection
            experience={doc.experience} setExperience={(arr) => setDoc((d) => ({ ...d, experience: arr }))}
            pricing={doc.pricing} setPricing={(p) => setDoc((d) => ({ ...d, pricing: p }))}
            availability={doc.availability} setAvailability={(a) => setDoc((d) => ({ ...d, availability: a }))}
            readOnly={readOnly}
          />
        );
      case "vis":
        return (
          <VisibilityNotificationsSection
            visibility={doc.visibility} setVisibility={(v) => setDoc((d) => ({ ...d, visibility: v }))}
            notifications={doc.notifications} setNotifications={(n) => setDoc((d) => ({ ...d, notifications: n }))}
            readOnly={readOnly}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb + chip mode */}
      <div className="mb-4 flex items-center justify-between">
        <nav className="text-sm text-slate-500">
          <span className="hover:underline cursor-pointer">Hồ sơ</span>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Chỉnh sửa</span>
        </nav>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight">Chỉnh sửa hồ sơ cá nhân</h1>
        <p className="text-sm text-slate-600">Cập nhật thông tin để tăng khả năng match & độ tin cậy.</p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {/* Active Section */}
      <div className="space-y-6">{renderSection()}</div>

      {/* Action bar (ẩn khi readOnly) */}
      {!readOnly && (
        <div className="sticky bottom-0 mt-8 border-t border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
            <div className="text-sm text-slate-600">Cập nhật lần cuối: {new Date(doc.updatedAt).toLocaleString("vi-VN")}</div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={saveDraft} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">Lưu nháp</button>
              <button onClick={saveChanges} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Lưu thay đổi</button>
              <button onClick={() => navigate("/seeker/find")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Read-only: gợi ý chuyển sang chỉnh sửa */}
      {readOnly && (
        <div className="mt-8 grid place-items-center">
          <button onClick={() => alert("Chuyển sang Update (demo)")} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Chỉnh sửa</button>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   App root – giữ Header/Footer; mặc định mode=update cho thao tác chỉnh sửa
============================================================================= */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Guard clause in case user data is not available yet
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
  
  // Nếu muốn thử read-only: đổi <SeekerProfileEditor mode="read" />
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header variant={user.role} />
      <main>
        {user.role === 'seeker' ? (
          <SeekerProfileEditor mode="update" navigate={navigate} />
        ) : (
          <div className="mx-auto max-w-6xl px-4 py-8">
            <h1 className="text-2xl font-bold">Hồ sơ nhà tuyển dụng (Poster)</h1>
            <p className="mt-2 text-slate-600">Đây là trang hồ sơ dành cho nhà tuyển dụng. Nội dung sẽ được cập nhật sau.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
