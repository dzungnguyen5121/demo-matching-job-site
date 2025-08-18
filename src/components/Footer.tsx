import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-slate-200 bg-white/60 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-bold text-white">
              D
            </div>
            <span className="font-semibold">{t('footer_brand')}</span>
          </div>
          <p className="text-sm text-slate-600">
            {t('footer_description')}
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">{t('explore')}</h4>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>
              <a className="hover:underline" href="#jobs">
                {t('find_job')}
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#post">
                {t('post_job')}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">{t('support')}</h4>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>
              <a className="hover:underline" href="#help">
                {t('contact')}
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#guide">
                {t('user_guide')}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">{t('legal')}</h4>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>
              <a className="hover:underline" href="#privacy">
                {t('privacy_policy')}
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#terms">
                {t('terms_of_use')}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-4 text-xs text-slate-500">
        {t('footer_copyright', { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
