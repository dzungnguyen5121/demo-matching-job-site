import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = {
    en: 'EN',
    ja: 'JA',
    vi: 'VI',
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        <span>{languages[i18n.language as keyof typeof languages] || 'VI'}</span>
        <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-24 rounded-xl border border-slate-200 bg-white shadow-lg">
          {Object.entries(languages).map(([code, name]) => (
            <button
              key={code}
              onClick={() => changeLanguage(code)}
              className={`block w-full px-4 py-2 text-left text-sm ${i18n.language === code ? 'font-semibold text-blue-600' : 'text-slate-700'} hover:bg-slate-50`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBadge({ icon, count, label }: { icon: string; count: number; label: string }) {
  return (
    <div className="relative">
      <button aria-label={label} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
        {icon}
      </button>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </div>
  );
}

type HeaderProps = {
  variant: 'guest' | 'seeker' | 'poster';
  activeRoute?: string;
  unreadChat?: number;
  unreadNoti?: number;
  favCount?: number;
  onFindJob?: () => void;
  onMatches?: () => void;
  onFavorites?: () => void;
  onJobList?: () => void;
  onArchive?: () => void;
};

export function Header({
  variant,
  activeRoute,
  unreadChat = 0,
  unreadNoti = 0,
  favCount = 0,
  onFindJob,
  onMatches,
  onFavorites,
  onJobList,
  onArchive
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNav = () => {
    if (variant === 'seeker') {
      return (
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <button
            onClick={onFindJob ?? (() => navigate("/seeker/find"))}
            className={`text-sm transition hover:text-slate-900 ${
              activeRoute === "find" ? "font-semibold text-blue-600" : "text-slate-600"
            }`}
          >
            {t('find_job')}
          </button>
          <button
            onClick={onMatches ?? (() => navigate("/seeker/matches"))}
            className={`text-sm transition hover:text-slate-900 ${
                activeRoute === "matches" ? "font-semibold text-blue-600" : "text-slate-600"
            }`}
          >
            {t('matches')}
          </button>
          <button
            onClick={onFavorites ?? (() => navigate("/seeker/find"))}
            className={`text-sm transition hover:text-slate-900 ${
              activeRoute === "favorites" ? "font-semibold text-blue-600" : "text-slate-600"
            }`}
          >
            {t('favorites')} {favCount > 0 && <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{favCount}</span>}
          </button>
        </nav>
      );
    }
    if (variant === "poster") {
      return (
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <button
            onClick={onJobList ?? (() => navigate("/poster/jobs"))}
            className={`text-sm hover:text-slate-900 ${
              activeRoute === "list" ? "font-semibold text-slate-900" : "text-slate-600"
            }`}
          >
            {t('job_list')}
          </button>
          <button
            onClick={onArchive ?? (() => navigate("/poster/jobs?tab=archive"))}
            className={`text-sm hover:text-slate-900 ${
              activeRoute === "archive" ? "font-semibold text-slate-900" : "text-slate-600"
            }`}
          >
            {t('archive')}
          </button>
        </nav>
      );
    }
    return null;
  }

  const renderUserActions = () => {
    if (!user) {
      return (
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t('login')}
          </Link>
          <Link
            to="/login"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          >
            {t('register')}
          </Link>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <Link to="/chat">
          <IconBadge icon="💬" count={unreadChat} label={t('messages')} />
        </Link>
        <Link to="/notifications">
          <IconBadge icon="🔔" count={unreadNoti} label={t('notifications')} />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/profile" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-slate-700">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">D</div>
          <span className="text-lg font-semibold tracking-tight">DroneWork</span>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {renderNav()}
        </div>
        {renderUserActions()}
      </div>
    </header>
  );
}
