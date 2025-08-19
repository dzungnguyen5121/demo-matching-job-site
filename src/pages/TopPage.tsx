import {
  BriefcaseBusiness,
  ClipboardList,
  MessageCircle,
  MessageSquareText,
  Search,
  UserPlus,
} from "lucide-react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from 'react-i18next';

/**
 * TOP (Home) Page – Modern UI (React + TailwindCSS)
 * ---------------------------------------------------------------------------
 * - Phong cách: tối giản, nhiều khoảng trắng, accent xanh #3B82F6
 * - Header theo “trang đăng nhập” (public view): có Đăng nhập + Đăng ký
 * - Footer chuẩn rút gọn: Hướng dẫn sử dụng • Điều khoản sử dụng • Liên hệ • © DroneWork
 * - Sections: Hero, How it works, Features, CTA
 * - Responsive tốt (mobile-first), hỗ trợ dark mode cơ bản
 */

export default function TopPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header variant="guest" />

      {/* ================================ HERO ================================ */}
      {/* Banner chính: tiêu đề lớn, mô tả ngắn, 2 CTA. Có overlay để chữ rõ hơn khi đặt ảnh nền */}
      <section className="relative overflow-hidden">
        {/* Ảnh nền (demo: dùng gradient thay cho ảnh thật; khi triển khai thay bằng background-image) */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-blue-100" />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-24">
          {/* Text block */}
          <div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              <Trans
                i18nKey="hero_title"
                components={{
                  seeker: <span className="text-blue-600" />,
                  poster: <span className="text-blue-600" />,
                }}
              />
            </h1>
            <p className="mb-8 max-w-prose text-slate-600">
              {t('hero_subtitle')}
            </p>

            {/* CTA đôi: Đăng ký (primary) + Tìm việc (secondary) */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
              >
                {t('register_now')}
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {t('find_job_now')}
              </Link>
            </div>
          </div>

          {/* Hình minh họa */}
          <div className="relative">
            <img src="/hero_section_image.png" alt={t('illustration_alt')} className="w-full rounded-3xl shadow-xl shadow-slate-900/5" />
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS =========================== */}
      {/* 3 bước: Đăng ký → Đăng bài/Ứng tuyển → Nhắn tin & hợp tác */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="mb-6 text-2xl font-bold tracking-tight">
          {t('how_it_works')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Bước 1 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-600/10 ring-1 ring-blue-600/20">
              <UserPlus className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </div>
            <h3 className="mb-1 font-semibold">{t('step1_title')}</h3>
            <p className="text-sm text-slate-600">
              {t('step1_desc')}
            </p>
          </div>
          {/* Bước 2 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-600/10 ring-1 ring-blue-600/20">
              <BriefcaseBusiness className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </div>
            <h3 className="mb-1 font-semibold">{t('step2_title')}</h3>
            <p className="text-sm text-slate-600">
              {t('step2_desc')}
            </p>
          </div>
          {/* Bước 3 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-600/10 ring-1 ring-blue-600/20">
              <MessageSquareText className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </div>
            <h3 className="mb-1 font-semibold">{t('step3_title')}</h3>
            <p className="text-sm text-slate-600">
              {t('step3_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* ============================== FEATURES ============================= */}
      {/* 3 lợi ích nổi bật, dùng icon/illus nhẹ, card bo góc + shadow mềm */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16" aria-labelledby="features">
        <h2 id="features" className="mb-6 text-2xl font-bold tracking-tight">
          {t('features')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-blue-600/10 ring-1 ring-blue-600/20">
              <Search className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold">{t('feature_search_title')}</h3>
              <p className="text-sm text-slate-600">
                {t('feature_search_desc')}
              </p>
            </div>
          </div>

          <div className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-blue-600/10 ring-1 ring-blue-600/20">
              <ClipboardList className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold">{t('feature_profile_title')}</h3>
              <p className="text-sm text-slate-600">
                {t('feature_profile_desc')}
              </p>
            </div>
          </div>

          <div className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-blue-600/10 ring-1 ring-blue-600/20">
              <MessageCircle className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold">{t('feature_messaging_title')}</h3>
              <p className="text-sm text-slate-600">
                {t('feature_messaging_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================ CTA ================================ */}
      {/* Kêu gọi hành động cuối trang, nền accent để tương phản */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-3xl bg-blue-600 px-6 py-10 text-center text-white shadow-lg">
          <h2 className="mb-3 text-2xl font-bold tracking-tight">{t('cta_title')}</h2>
          <p className="mx-auto mb-6 max-w-2xl text-blue-50">
            {t('cta_subtitle')}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:brightness-95"
            >
              {t('start_finding_job')}
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/80 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t('post_project_now')}
            </Link>
          </div>
        </div>
      </section>

      {/* =============================== FOOTER ============================== */}
      {/* Chuẩn mới: Hướng dẫn sử dụng • Điều khoản sử dụng • Liên hệ • © DroneWork */}
      <Footer />
    </div>
  );
}
